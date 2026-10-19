package com.pelmanager.service;

import com.pelmanager.dto.EnderecoResponseDTO;
import com.pelmanager.dto.RodadaResponseDTO;
import com.pelmanager.dto.RodadaStatusResponseDTO;
import com.pelmanager.dto.request.EnderecoRequestDTO;
import com.pelmanager.dto.request.RodadaRequestDTO;
import com.pelmanager.entity.Endereco;
import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.enums.StatusRodada;
import com.pelmanager.exception.OperacaoInvalidaException;
import com.pelmanager.exception.RecursoNaoEncontradoException;
import com.pelmanager.exception.RequisicaoInvalidaException;
import com.pelmanager.exception.RodadaAtivaExistenteException;
import com.pelmanager.exception.RodadaNaoEncontradaException;
import com.pelmanager.repository.EnderecoRepository;
import com.pelmanager.repository.GrupoPeladaRepository;
import com.pelmanager.repository.RodadaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Objects;

@Service
public class RodadaService {
    private final RodadaRepository rodadaRepository;
    private final GrupoPeladaRepository grupoPeladaRepository;
    private final EnderecoRepository enderecoRepository;
    private final EnderecoService enderecoService;
    private final PermissaoService permissaoService;
    private final PagamentoService pagamentoService;

    public RodadaService(RodadaRepository rodadaRepository,
                         GrupoPeladaRepository grupoPeladaRepository,
                         EnderecoRepository enderecoRepository,
                         EnderecoService enderecoService,
                         PermissaoService permissaoService,
                         PagamentoService pagamentoService) {
        this.rodadaRepository = rodadaRepository;
        this.grupoPeladaRepository = grupoPeladaRepository;
        this.enderecoRepository = enderecoRepository;
        this.enderecoService = enderecoService;
        this.permissaoService = permissaoService;
        this.pagamentoService = pagamentoService;
    }

    @Transactional
    public RodadaResponseDTO agendarRodada(RodadaRequestDTO dto) {
        GrupoPelada grupo = grupoPeladaRepository.findById(dto.grupoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Grupo não encontrado."));

        permissaoService.exigirAdmin(dto.usuarioId(), grupo);

        if (rodadaRepository.existsByGrupoIdAndStatusRodada(grupo.getId(), StatusRodada.AGENDADA)) {
            throw new RodadaAtivaExistenteException();
        }

        Rodada novaRodada = new Rodada();
        novaRodada.setGrupo(grupo);
        novaRodada.setDataRodada(dto.data());
        novaRodada.setHoraRodada(dto.horario());
        novaRodada.setStatusRodada(StatusRodada.AGENDADA);

        if (temEnderecoPreenchido(dto.enderecoAlternativo())) {
            Endereco novoEndereco = enderecoService.cadastrarEndereco(dto.enderecoAlternativo());
            novaRodada.setEnderecoAlternativo(novoEndereco);
        } else if (dto.enderecoAlternativoId() != null) {
            novaRodada.setEnderecoAlternativo(enderecoRepository.findById(dto.enderecoAlternativoId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Endereço alternativo não encontrado.")));
        } else {
            // Se não foi passado, grava fisicamente o endereço oficial do grupo na rodada
            novaRodada.setEnderecoAlternativo(grupo.getEndereco());
        }

        Rodada rodadaSalva = rodadaRepository.save(novaRodada);
        return paraRodadaDTO(rodadaSalva);
    }

    @Transactional
    public RodadaResponseDTO atualizarEnderecoAlternativo(Long rodadaId, Long usuarioId, EnderecoRequestDTO dto) {
        Rodada rodada = buscarRodada(rodadaId);
        permissaoService.exigirAdmin(usuarioId, rodada.getGrupo());
        if (!temEnderecoPreenchido(dto)) {
            throw new RequisicaoInvalidaException("Informe pelo menos a rua/avenida e a cidade do endereço alternativo.");
        }

        Endereco novoEndereco = enderecoService.cadastrarEndereco(dto);
        rodada.setEnderecoAlternativo(novoEndereco);
        return paraRodadaDTO(rodadaRepository.save(rodada));
    }

    @Transactional
    public RodadaResponseDTO removerEnderecoAlternativo(Long rodadaId, Long usuarioId) {
        Rodada rodada = buscarRodada(rodadaId);
        permissaoService.exigirAdmin(usuarioId, rodada.getGrupo());
        rodada.setEnderecoAlternativo(rodada.getGrupo().getEndereco());
        return paraRodadaDTO(rodadaRepository.save(rodada));
    }

    @Transactional
    public RodadaStatusResponseDTO iniciarRodada(Long rodadaId, Long usuarioId) {
        Rodada rodada = buscarRodada(rodadaId);
        permissaoService.exigirAdmin(usuarioId, rodada.getGrupo());

        if (rodada.getStatusRodada() != StatusRodada.AGENDADA) {
            throw new OperacaoInvalidaException("Só é possível iniciar uma rodada que está agendada.");
        }

        LocalDateTime agora = LocalDateTime.now();
        rodada.setStatusRodada(StatusRodada.EM_ANDAMENTO);
        rodada.setIniciadaEm(agora);
        rodada.setDataCheckInFechado(agora);
        Rodada salva = rodadaRepository.save(rodada);

        pagamentoService.criarPagamentoAoFinalizarCheckIn(rodadaId);

        return paraStatusDTO(salva);
    }

    @Transactional
    public RodadaStatusResponseDTO finalizarRodada(Long rodadaId, Long usuarioId) {
        Rodada rodada = buscarRodada(rodadaId);
        permissaoService.exigirAdmin(usuarioId, rodada.getGrupo());

        if (rodada.getStatusRodada() == StatusRodada.FINALIZADA) {
            throw new OperacaoInvalidaException("Esta rodada já está finalizada.");
        }
        if (rodada.getStatusRodada() != StatusRodada.EM_ANDAMENTO) {
            throw new OperacaoInvalidaException("Inicie a rodada antes de finalizá-la.");
        }

        LocalDateTime agora = LocalDateTime.now();
        GrupoPelada grupo = rodada.getGrupo();

        rodada.setStatusRodada(StatusRodada.FINALIZADA);
        rodada.setFinalizadaEm(agora);
        rodada.setVotacaoAte(agora.plusHours(grupo.getPrazoAvaliacaoHoras()));
        rodada.setCategoriasVotacao(new HashSet<>(grupo.categoriasAtivas()));
        return paraStatusDTO(rodadaRepository.save(rodada));
    }

    @Transactional
    public RodadaStatusResponseDTO encerrarVotacao(Long rodadaId, Long usuarioId) {
        Rodada rodada = buscarRodada(rodadaId);
        permissaoService.exigirAdmin(usuarioId, rodada.getGrupo());

        if (rodada.getStatusRodada() != StatusRodada.FINALIZADA) {
            throw new OperacaoInvalidaException("A votação só existe depois que a rodada é finalizada.");
        }
        if (!VotacaoService.ABERTA.equals(VotacaoService.situacao(rodada))) {
            throw new OperacaoInvalidaException("A votação desta rodada já está encerrada.");
        }

        rodada.setVotacaoAte(LocalDateTime.now());
        return paraStatusDTO(rodadaRepository.save(rodada));
    }

    public static RodadaResponseDTO paraRodadaDTO(Rodada rodada) {
        Endereco resolvido = rodada.getEnderecoResolvido();
        EnderecoResponseDTO enderecoDTO = null;
        if (resolvido != null) {
            enderecoDTO = new EnderecoResponseDTO(
                    resolvido.getId(),
                    resolvido.getLogradouro(),
                    resolvido.getNumero(),
                    resolvido.getBairro(),
                    resolvido.getCidade(),
                    resolvido.getEstado(),
                    resolvido.getCep()
            );
        }

        Endereco enderecoGrupo = rodada.getGrupo() != null ? rodada.getGrupo().getEndereco() : null;
        boolean alternativo = rodada.getEnderecoAlternativo() != null
                && (enderecoGrupo == null || !Objects.equals(rodada.getEnderecoAlternativo().getId(), enderecoGrupo.getId()));

        return new RodadaResponseDTO(
                rodada.getId(),
                rodada.getGrupo().getId(),
                rodada.getDataRodada(),
                rodada.getHoraRodada(),
                rodada.getStatusRodada().name(),
                enderecoDTO,
                alternativo,
                rodada.getValorPorParticipante()
        );
    }

    private boolean temEnderecoPreenchido(EnderecoRequestDTO dto) {
        if (dto == null) return false;
        boolean temLogradouro = dto.logradouro() != null && !dto.logradouro().isBlank();
        boolean temCidade = dto.cidade() != null && !dto.cidade().isBlank();
        return temLogradouro && temCidade;
    }

    private Rodada buscarRodada(Long rodadaId) {
        return rodadaRepository.findById(rodadaId)
                .orElseThrow(() -> new RodadaNaoEncontradaException(rodadaId));
    }

    private RodadaStatusResponseDTO paraStatusDTO(Rodada rodada) {
        return new RodadaStatusResponseDTO(
                rodada.getId(),
                rodada.getStatusRodada().name(),
                rodada.getIniciadaEm(),
                rodada.getFinalizadaEm(),
                rodada.getVotacaoAte()
        );
    }
}
