package com.pelmanager.service;

import com.pelmanager.dto.FreeAgentResponseDTO;
import com.pelmanager.dto.request.FreeAgentRequestDTO;
import com.pelmanager.entity.Endereco;
import com.pelmanager.entity.FreeAgent;
import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.entity.Usuario;
import com.pelmanager.entity.enums.Posicao;
import com.pelmanager.exception.RecursoNaoEncontradoException;
import com.pelmanager.exception.RequisicaoInvalidaException;
import com.pelmanager.repository.AvaliacaoRepository;
import com.pelmanager.repository.FreeAgentRepository;
import com.pelmanager.repository.GrupoPeladaRepository;
import com.pelmanager.repository.ParticipanteRepository;
import com.pelmanager.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class FreeAgentService {

    private static final int LIMITE_PADRAO = 20;
    private static final int LIMITE_MAXIMO = 50;

    private final FreeAgentRepository freeAgentRepository;
    private final UsuarioRepository usuarioRepository;
    private final GrupoPeladaRepository grupoRepository;
    private final ParticipanteRepository participanteRepository;
    private final AvaliacaoRepository avaliacaoRepository;

    public FreeAgentService(FreeAgentRepository freeAgentRepository,
                            UsuarioRepository usuarioRepository,
                            GrupoPeladaRepository grupoRepository,
                            ParticipanteRepository participanteRepository,
                            AvaliacaoRepository avaliacaoRepository) {
        this.freeAgentRepository = freeAgentRepository;
        this.usuarioRepository = usuarioRepository;
        this.grupoRepository = grupoRepository;
        this.participanteRepository = participanteRepository;
        this.avaliacaoRepository = avaliacaoRepository;
    }


    @Transactional
    public FreeAgentResponseDTO ativar(FreeAgentRequestDTO dto) {
        if (dto.cidade() == null || dto.cidade().isBlank()) {
            throw new RequisicaoInvalidaException("Informe a cidade onde você quer jogar.");
        }
        if (dto.estado() != null && !dto.estado().isBlank() && dto.estado().trim().length() != 2) {
            throw new RequisicaoInvalidaException("O estado deve ter 2 letras (ex.: RN).");
        }

        Usuario usuario = usuarioRepository.findById(dto.usuarioId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        FreeAgent freeAgent = freeAgentRepository.findByUsuarioId(usuario.getId())
                .orElseGet(FreeAgent::new);

        freeAgent.setUsuario(usuario);
        freeAgent.setCidade(dto.cidade().trim());
        freeAgent.setEstado(vazioParaNulo(dto.estado()) == null ? null : dto.estado().trim().toUpperCase());
        freeAgent.setBairro(vazioParaNulo(dto.bairro()));
        freeAgent.setDataAtivacao(LocalDateTime.now());

        return paraDTO(freeAgentRepository.save(freeAgent));
    }

    @Transactional
    public void desativar(Long usuarioId) {
        freeAgentRepository.deleteByUsuarioId(usuarioId);
    }

    public Optional<FreeAgentResponseDTO> buscarPorUsuario(Long usuarioId) {
        return freeAgentRepository.findByUsuarioId(usuarioId).map(this::paraDTO);
    }


    public List<FreeAgentResponseDTO> buscar(Long grupoId, String cidade, String estado,
                                             String bairro, Posicao posicao, Integer limite) {
        String cidadeBusca = vazioParaNulo(cidade);
        String estadoBusca = vazioParaNulo(estado);

        if (grupoId != null) {
            GrupoPelada grupo = grupoRepository.findById(grupoId)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Pelada não encontrada."));
            Endereco enderecoGrupo = grupo.getEndereco();
            if (cidadeBusca == null && enderecoGrupo != null) {
                cidadeBusca = enderecoGrupo.getCidade();
                if (estadoBusca == null) {
                    estadoBusca = enderecoGrupo.getEstado();
                }
            }
        }

        if (cidadeBusca == null) {
            throw new RequisicaoInvalidaException("Informe a cidade (ou o grupoId) pra buscar free agents.");
        }

        int limiteFinal = (limite == null || limite < 1) ? LIMITE_PADRAO : Math.min(limite, LIMITE_MAXIMO);
        String bairroBusca = vazioParaNulo(bairro);
        String estadoFinal = estadoBusca;

        List<FreeAgentResponseDTO> resultado = freeAgentRepository.findByCidadeIgnoreCase(cidadeBusca.trim())
                .stream()
                .filter(fa -> estadoFinal == null || fa.getEstado() == null
                        || fa.getEstado().equalsIgnoreCase(estadoFinal.trim()))
                .filter(fa -> posicao == null
                        || fa.getUsuario().getPosicaoPrimaria() == posicao
                        || fa.getUsuario().getPosicaoSecundaria() == posicao)
                .filter(fa -> grupoId == null
                        || !Boolean.TRUE.equals(
                        participanteRepository.existsByUsuarioIdAndGrupoId(fa.getUsuario().getId(), grupoId)))
                .map(this::paraDTO)
                .sorted(Comparator
                        .comparingInt((FreeAgentResponseDTO dto) ->
                                bairroBusca != null && bairroBusca.equalsIgnoreCase(dto.bairro()) ? 0 : 1)
                        .thenComparing(FreeAgentResponseDTO::notaMedia,
                                Comparator.nullsLast(Comparator.<Double>reverseOrder()))
                        .thenComparing(FreeAgentResponseDTO::nome, String.CASE_INSENSITIVE_ORDER))
                .limit(limiteFinal)
                .toList();

        return resultado;
    }

    private FreeAgentResponseDTO paraDTO(FreeAgent fa) {
        Usuario u = fa.getUsuario();
        Double media = avaliacaoRepository.calcularMediaDoJogador(u.getId());
        Double mediaArredondada = media == null ? null : Math.round(media * 10) / 10.0;

        return new FreeAgentResponseDTO(
                u.getId(),
                u.getNome(),
                u.getApelido(),
                u.getPosicaoPrimaria(),
                u.getPosicaoSecundaria(),
                u.getPernaDominante(),
                fa.getCidade(),
                fa.getEstado(),
                fa.getBairro(),
                mediaArredondada
        );
    }

    private String vazioParaNulo(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }
}
