package com.pelmanager.service;

import com.pelmanager.dto.GolResponseDTO;
import com.pelmanager.dto.JogadorResumoDTO;
import com.pelmanager.dto.request.GolRequestDTO;
import com.pelmanager.entity.CheckIn;
import com.pelmanager.entity.Gol;
import com.pelmanager.entity.Participante;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.Usuario;
import com.pelmanager.entity.enums.StatusCheckIn;
import com.pelmanager.entity.enums.StatusRodada;
import com.pelmanager.exception.AcessoNegadoException;
import com.pelmanager.exception.OperacaoInvalidaException;
import com.pelmanager.exception.RecursoNaoEncontradoException;
import com.pelmanager.exception.RequisicaoInvalidaException;
import com.pelmanager.exception.RodadaNaoEncontradaException;
import com.pelmanager.repository.CheckInRepository;
import com.pelmanager.repository.GolRepository;
import com.pelmanager.repository.RodadaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;


@Service
public class GolService {

    private final GolRepository golRepository;
    private final CheckInRepository checkInRepository;
    private final RodadaRepository rodadaRepository;
    private final PermissaoService permissaoService;

    public GolService(GolRepository golRepository,
                      CheckInRepository checkInRepository,
                      RodadaRepository rodadaRepository,
                      PermissaoService permissaoService) {
        this.golRepository = golRepository;
        this.checkInRepository = checkInRepository;
        this.rodadaRepository = rodadaRepository;
        this.permissaoService = permissaoService;
    }

    @Transactional
    public GolResponseDTO registrar(Long rodadaId, GolRequestDTO dto) {
        Rodada rodada = buscarRodada(rodadaId);
        Participante registrador = permissaoService.exigirParticipante(dto.usuarioId(), rodada.getGrupo());

        validarStatusParaEventos(rodada, registrador.isAdmin());
        if (!registrador.isAdmin() && !permissaoService.temCheckInConfirmado(rodadaId, dto.usuarioId())) {
            throw new AcessoNegadoException("Apenas quem confirmou presença nesta rodada pode registrar gols.");
        }

        Usuario autor = jogadorDaRodada(rodadaId, dto.autorId(), "autor do gol");
        Usuario assistente = assistenteDaRodada(rodadaId, dto);

        Gol gol = new Gol();
        gol.setRodada(rodada);
        gol.setAutor(autor);
        gol.setAssistente(assistente);
        gol.setRegistradoPor(permissaoService.buscarUsuario(dto.usuarioId()));
        gol.setRegistradoEm(LocalDateTime.now());

        return paraDTO(golRepository.save(gol));
    }

    @Transactional(readOnly = true)
    public List<GolResponseDTO> listar(Long rodadaId) {
        buscarRodada(rodadaId);
        return golRepository.findByRodadaIdOrderByIdAsc(rodadaId).stream()
                .map(this::paraDTO)
                .toList();
    }

    @Transactional
    public GolResponseDTO corrigir(Long rodadaId, Long golId, GolRequestDTO dto) {
        Rodada rodada = buscarRodada(rodadaId);
        permissaoService.exigirAdmin(dto.usuarioId(), rodada.getGrupo());
        validarStatusParaEventos(rodada, true);

        Gol gol = buscarGol(rodadaId, golId);
        gol.setAutor(jogadorDaRodada(rodadaId, dto.autorId(), "autor do gol"));
        gol.setAssistente(assistenteDaRodada(rodadaId, dto));
        gol.setCorrigidoPor(permissaoService.buscarUsuario(dto.usuarioId()));
        gol.setCorrigidoEm(LocalDateTime.now());

        return paraDTO(golRepository.save(gol));
    }

    @Transactional
    public void remover(Long rodadaId, Long golId, Long usuarioId) {
        Rodada rodada = buscarRodada(rodadaId);
        permissaoService.exigirAdmin(usuarioId, rodada.getGrupo());
        validarStatusParaEventos(rodada, true);

        golRepository.delete(buscarGol(rodadaId, golId));
    }

    private void validarStatusParaEventos(Rodada rodada, boolean admin) {
        StatusRodada status = rodada.getStatusRodada();
        if (status == StatusRodada.EM_ANDAMENTO) {
            return;
        }
        if (status == StatusRodada.FINALIZADA) {
            if (admin) {
                return;
            }
            throw new OperacaoInvalidaException("A rodada já foi finalizada. Peça a um administrador para ajustar os gols.");
        }
        throw new OperacaoInvalidaException("Os gols só podem ser registrados com a rodada em andamento.");
    }

    private Usuario assistenteDaRodada(Long rodadaId, GolRequestDTO dto) {
        if (dto.assistenteId() == null) {
            return null;
        }
        if (dto.assistenteId().equals(dto.autorId())) {
            throw new RequisicaoInvalidaException("O autor do gol não pode ser o próprio assistente.");
        }
        CheckIn checkInAutor = checkInConfirmado(rodadaId, dto.autorId(), "autor do gol");
        CheckIn checkInAssistente = checkInConfirmado(rodadaId, dto.assistenteId(), "assistente");
        if (checkInAutor.getTime() == null || checkInAssistente.getTime() == null
                || !checkInAutor.getTime().getId().equals(checkInAssistente.getTime().getId())) {
            throw new RequisicaoInvalidaException(
                    "A assistência deve ser atribuída a um jogador do mesmo time de quem fez o gol. Sorteie os times antes de registrar a assistência.");
        }
        return checkInAssistente.getUsuario();
    }

    private CheckIn checkInConfirmado(Long rodadaId, Long usuarioId, String papel) {
        if (usuarioId == null) {
            throw new RequisicaoInvalidaException("Informe o " + papel + ".");
        }
        return checkInRepository.findByRodadaIdAndUsuarioId(rodadaId, usuarioId)
                .filter(checkIn -> checkIn.getStatus() == StatusCheckIn.CONFIRMADO)
                .orElseThrow(() -> new RequisicaoInvalidaException(
                        "O " + papel + " precisa ter confirmado presença nesta rodada."));
    }

    private Usuario jogadorDaRodada(Long rodadaId, Long usuarioId, String papel) {
        if (usuarioId == null) {
            throw new RequisicaoInvalidaException("Informe o " + papel + ".");
        }
        if (!permissaoService.temCheckInConfirmado(rodadaId, usuarioId)) {
            throw new RequisicaoInvalidaException("O " + papel + " precisa ter confirmado presença nesta rodada.");
        }
        return permissaoService.buscarUsuario(usuarioId);
    }

    private Gol buscarGol(Long rodadaId, Long golId) {
        return golRepository.findById(golId)
                .filter(g -> g.getRodada().getId().equals(rodadaId))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Gol não encontrado nesta rodada."));
    }

    private Rodada buscarRodada(Long rodadaId) {
        return rodadaRepository.findById(rodadaId)
                .orElseThrow(() -> new RodadaNaoEncontradaException(rodadaId));
    }

    private GolResponseDTO paraDTO(Gol gol) {
        return new GolResponseDTO(
                gol.getId(),
                gol.getRodada().getId(),
                resumo(gol.getAutor()),
                gol.getAssistente() != null ? resumo(gol.getAssistente()) : null,
                gol.getRegistradoPor().getId(),
                gol.getRegistradoPor().getNome(),
                gol.getRegistradoEm(),
                gol.getCorrigidoEm() != null,
                gol.getCorrigidoPor() != null ? gol.getCorrigidoPor().getNome() : null,
                gol.getCorrigidoEm()
        );
    }

    private JogadorResumoDTO resumo(Usuario usuario) {
        return new JogadorResumoDTO(usuario.getId(), usuario.getNome(), usuario.getApelido());
    }
}
