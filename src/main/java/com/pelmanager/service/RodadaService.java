package com.pelmanager.service;

import com.pelmanager.dto.RodadaResponseDTO;
import com.pelmanager.dto.RodadaStatusResponseDTO;
import com.pelmanager.dto.request.RodadaRequestDTO;
import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.enums.StatusRodada;
import com.pelmanager.exception.OperacaoInvalidaException;
import com.pelmanager.exception.RodadaAtivaExistenteException;
import com.pelmanager.exception.RodadaNaoEncontradaException;
import com.pelmanager.repository.EnderecoRepository;
import com.pelmanager.repository.GrupoPeladaRepository;
import com.pelmanager.repository.RodadaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;

@Service
public class RodadaService {
    private final RodadaRepository rodadaRepository;
    private final GrupoPeladaRepository grupoPeladaRepository;
    private final EnderecoRepository enderecoRepository;
    private final PermissaoService permissaoService;

    public RodadaService(RodadaRepository rodadaRepository, GrupoPeladaRepository grupoPeladaRepository,
                         EnderecoRepository enderecoRepository, PermissaoService permissaoService) {
        this.rodadaRepository = rodadaRepository;
        this.grupoPeladaRepository = grupoPeladaRepository;
        this.enderecoRepository = enderecoRepository;
        this.permissaoService = permissaoService;
    }

    @Transactional
    public RodadaResponseDTO agendarRodada(RodadaRequestDTO dto) {
        GrupoPelada grupo = grupoPeladaRepository.findById(dto.grupoId())
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado."));

        if (rodadaRepository.existsByGrupoIdAndStatusRodada(grupo.getId(), StatusRodada.AGENDADA)) {
            throw new RodadaAtivaExistenteException();
        }

        Rodada novaRodada = new Rodada();
        novaRodada.setGrupo(grupo);
        novaRodada.setDataRodada(dto.data());
        novaRodada.setHoraRodada(dto.horario());
        novaRodada.setStatusRodada(StatusRodada.AGENDADA);

        // Verifica se foi passado um endereço diferente
        if (dto.enderecoAlternativoId() != null) {
            novaRodada.setEnderecoAlternativo(enderecoRepository.findById(dto.enderecoAlternativoId())
                    .orElseThrow(() -> new RuntimeException("Endereço alternativo não encontrado.")));
        } else {
            // Se não foi passado, grava fisicamente o endereço oficial do grupo na rodada
            novaRodada.setEnderecoAlternativo(grupo.getEndereco());
        }

        Rodada rodadaSalva = rodadaRepository.save(novaRodada);

        return new RodadaResponseDTO(
                rodadaSalva.getId(),
                grupo.getId(),
                rodadaSalva.getDataRodada(),
                rodadaSalva.getHoraRodada(),
                rodadaSalva.getStatusRodada().name()
        );
    }

    // Início manual da partida (admin). Encerra o período de check-in, que só vale enquanto AGENDADA.
    @Transactional
    public RodadaStatusResponseDTO iniciarRodada(Long rodadaId, Long usuarioId) {
        Rodada rodada = buscarRodada(rodadaId);
        permissaoService.exigirAdmin(usuarioId, rodada.getGrupo());

        if (rodada.getStatusRodada() != StatusRodada.AGENDADA) {
            throw new OperacaoInvalidaException("Só é possível iniciar uma rodada que está agendada.");
        }

        rodada.setStatusRodada(StatusRodada.EM_ANDAMENTO);
        rodada.setIniciadaEm(LocalDateTime.now());
        return paraStatusDTO(rodadaRepository.save(rodada));
    }

    // Fim manual da partida (admin). Abre a votação com o prazo e as categorias configuradas no grupo.
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
        // Snapshot: mudar a configuração do grupo depois não altera esta votação.
        rodada.setCategoriasVotacao(new HashSet<>(grupo.categoriasAtivas()));
        return paraStatusDTO(rodadaRepository.save(rodada));
    }

    // Encerramento antecipado da votação (admin) — útil para testes e para fechar o resultado antes do prazo.
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
