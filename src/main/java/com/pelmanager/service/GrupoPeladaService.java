package com.pelmanager.service;

import com.pelmanager.dto.*;
import com.pelmanager.dto.request.ConfiguracaoAvaliacaoRequestDTO;
import com.pelmanager.dto.request.EntrarGrupoPeladaRequestDTO;
import com.pelmanager.dto.request.GrupoPeladaRequestDTO;
import com.pelmanager.entity.Endereco;
import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.entity.Participante;
import com.pelmanager.entity.Usuario;
import com.pelmanager.entity.enums.Papel;
import com.pelmanager.exception.CodigoConviteInvalidoException;
import com.pelmanager.exception.RecursoNaoEncontradoException;
import com.pelmanager.exception.RequisicaoInvalidaException;
import com.pelmanager.exception.UsuarioJaParticipaException;
import com.pelmanager.repository.GrupoPeladaRepository;
import com.pelmanager.repository.ParticipanteRepository;
import com.pelmanager.repository.RodadaRepository;
import com.pelmanager.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class GrupoPeladaService {

    private static final int PRAZO_MAXIMO_HORAS = 168; // 7 dias

    private final GrupoPeladaRepository grupoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ParticipanteRepository participanteRepository;
    private final RodadaRepository rodadaRepository;
    private final PermissaoService permissaoService;

    public GrupoPeladaService(GrupoPeladaRepository grupoRepository,
                              UsuarioRepository usuarioRepository,
                              ParticipanteRepository participanteRepository,
                              RodadaRepository rodadaRepository,
                              PermissaoService permissaoService) {
        this.grupoRepository = grupoRepository;
        this.usuarioRepository = usuarioRepository;
        this.participanteRepository = participanteRepository;
        this.rodadaRepository = rodadaRepository;
        this.permissaoService = permissaoService;
    }

    @Transactional
    public GrupoPeladaResponseDTO criar(GrupoPeladaRequestDTO dto) {

        // Impede que a pelada seja criada sem um dono válido
        Usuario dono = usuarioRepository.findById(dto.fundadorId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário criador não encontrado."));

        Endereco endereco = new Endereco();
        endereco.setLogradouro(dto.endereco().logradouro());
        endereco.setNumero(dto.endereco().numero());
        endereco.setBairro(dto.endereco().bairro());
        endereco.setCidade(dto.endereco().cidade());
        endereco.setEstado(dto.endereco().estado());
        endereco.setCep(dto.endereco().cep());

        GrupoPelada grupo = new GrupoPelada();
        grupo.setNome(dto.nome());
        grupo.setCodigoConvite(UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        grupo.setDataCriacao(LocalDateTime.now());
        grupo.setEndereco(endereco);
        grupo.setPublica(dto.publica() == null || dto.publica());

        GrupoPelada grupoSalvo = grupoRepository.save(grupo);

        // Gera o vinculo automaticamente
        Participante admin = new Participante();
        admin.setUsuario(dono);
        admin.setGrupo(grupoSalvo);
        admin.setPapel(Papel.ADMIN);
        admin.setDataEntrada(LocalDateTime.now());

        participanteRepository.save(admin);

        return new GrupoPeladaResponseDTO(
                grupoSalvo.getId(),
                grupoSalvo.getNome(),
                grupoSalvo.getCodigoConvite(),
                grupoSalvo.getDataCriacao(),
                paraEnderecoDTO(grupoSalvo.getEndereco()),
                grupoSalvo.ehPublica()
        );
    }

    @Transactional
    public void entrarNoGrupo(EntrarGrupoPeladaRequestDTO dto) {

        Usuario jogador = usuarioRepository.findById(dto.IdUsuario())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        GrupoPelada grupo = grupoRepository.findByCodigoConvite(dto.codigoConvite())
                .orElseThrow(CodigoConviteInvalidoException::new);


        if (participanteRepository.existsByUsuarioIdAndGrupoId(jogador.getId(), grupo.getId())) {
            throw new UsuarioJaParticipaException();
        }

        Participante novoParticipante = new Participante();
        novoParticipante.setUsuario(jogador);
        novoParticipante.setGrupo(grupo);
        novoParticipante.setPapel(Papel.MEMBRO);
        novoParticipante.setDataEntrada(LocalDateTime.now());

        participanteRepository.save(novoParticipante);
    }

    public List<GrupoPeladaResponseDTO> listarPeladasDoUsuario(Long usuarioId) {
        List<GrupoPelada> grupos = grupoRepository.findByUsuarioId(usuarioId);

        return grupos.stream()
                .map(grupo -> new GrupoPeladaResponseDTO(
                        grupo.getId(),
                        grupo.getNome(),
                        grupo.getCodigoConvite(),
                        grupo.getDataCriacao(),
                        paraEnderecoDTO(grupo.getEndereco()),
                        grupo.ehPublica()
                ))
                .toList();
    }

    public GrupoPeladaDetalhesResponseDTO buscarDetalhes(Long id) {
        GrupoPelada grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pelada não encontrada."));

        List<ParticipanteResponseDTO> participantes = grupo.getParticipantes().stream()
                .map(participante -> new ParticipanteResponseDTO(
                        participante.getId(),
                        participante.getUsuario().getId(),
                        participante.getUsuario().getNome(),
                        participante.getUsuario().getApelido(),
                        participante.getPapel(),
                        participante.getDataEntrada()
                ))
                .toList();

        List<RodadaResponseDTO> rodadas = rodadaRepository.findByGrupoIdOrderByIdDesc(id).stream()
                .map(RodadaService::paraRodadaDTO)
                .toList();

        ConfiguracaoPagamentoDTO configPagamento = ConfiguracaoPagamentoDTO.builder()
                .ativo(grupo.isSistemaPagementoAtivo())
                .valorTotal(grupo.getValorTotalPelada())
                .chavePixGerente(grupo.getChavePixGerente())
                .build();

        return new GrupoPeladaDetalhesResponseDTO(
                grupo.getId(),
                grupo.getNome(),
                grupo.getCodigoConvite(),
                grupo.getDataCriacao(),
                participantes,
                rodadas,
                paraConfiguracaoDTO(grupo),
                paraEnderecoDTO(grupo.getEndereco()),
                configPagamento
        );
    }

    @Transactional
    public ConfiguracaoAvaliacaoDTO atualizarConfiguracaoAvaliacao(Long grupoId, ConfiguracaoAvaliacaoRequestDTO dto) {
        GrupoPelada grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pelada não encontrada."));

        permissaoService.exigirAdmin(dto.usuarioId(), grupo);

        if (dto.melhorJogadorAtiva() == null || dto.melhorAssistenteAtiva() == null
                || dto.bagreAtiva() == null || dto.prazoHoras() == null) {
            throw new RequisicaoInvalidaException("Informe todas as categorias e o prazo da votação.");
        }
        if (dto.prazoHoras() < 1 || dto.prazoHoras() > PRAZO_MAXIMO_HORAS) {
            throw new RequisicaoInvalidaException(
                    "O prazo da votação deve ficar entre 1 e " + PRAZO_MAXIMO_HORAS + " horas.");
        }

        grupo.setCategoriaMelhorAtiva(dto.melhorJogadorAtiva());
        grupo.setCategoriaAssistenteAtiva(dto.melhorAssistenteAtiva());
        grupo.setCategoriaBagreAtiva(dto.bagreAtiva());
        if (dto.revelacaoAtiva() != null) {
            grupo.setCategoriaRevelacaoAtiva(dto.revelacaoAtiva());
        }
        grupo.setPrazoAvaliacaoHoras(dto.prazoHoras());

        return paraConfiguracaoDTO(grupoRepository.save(grupo));
    }

    private EnderecoResponseDTO paraEnderecoDTO(Endereco endereco) {
        if (endereco == null) return null;
        return new EnderecoResponseDTO(
                endereco.getId(),
                endereco.getLogradouro(),
                endereco.getNumero(),
                endereco.getBairro(),
                endereco.getCidade(),
                endereco.getEstado(),
                endereco.getCep()
        );
    }

    private ConfiguracaoAvaliacaoDTO paraConfiguracaoDTO(GrupoPelada grupo) {
        return new ConfiguracaoAvaliacaoDTO(
                grupo.isCategoriaMelhorAtiva(),
                grupo.isCategoriaAssistenteAtiva(),
                grupo.isCategoriaBagreAtiva(),
                grupo.isCategoriaRevelacaoAtiva(),
                grupo.getPrazoAvaliacaoHoras()
        );
    }

}
