package com.pelmanager.service;

import com.pelmanager.dto.CheckInResponseDTO;
import com.pelmanager.dto.ParticipanteCheckInResponseDTO;
import com.pelmanager.dto.request.CheckInRequestDTO;
import com.pelmanager.entity.CheckIn;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.Usuario;
import com.pelmanager.entity.enums.StatusCheckIn;
import com.pelmanager.entity.enums.StatusRodada;
import com.pelmanager.exception.CheckInDuplicadoException;
import com.pelmanager.exception.RodadaNaoEncontradaException;
import com.pelmanager.repository.CheckInRepository;
import com.pelmanager.repository.ParticipanteRepository;
import com.pelmanager.repository.RodadaRepository;
import com.pelmanager.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CheckInService {
    private final CheckInRepository checkInRepository;
    private final RodadaRepository rodadaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ParticipanteRepository participanteRepository;
    private final PermissaoService permissaoService;

    public CheckInService(CheckInRepository checkInRepository, RodadaRepository rodadaRepository,
                          UsuarioRepository usuarioRepository, ParticipanteRepository participanteRepository,
                          PermissaoService permissaoService) {
        this.checkInRepository = checkInRepository;
        this.rodadaRepository = rodadaRepository;
        this.usuarioRepository = usuarioRepository;
        this.participanteRepository = participanteRepository;
        this.permissaoService = permissaoService;
    }

    @Transactional
    public CheckInResponseDTO realizarCheckIn(CheckInRequestDTO checkInRequestDTO) {
        Optional<Rodada> rodada = rodadaRepository.findById(checkInRequestDTO.rodadaId());
        if (rodada.isEmpty()) {
            throw new RodadaNaoEncontradaException(checkInRequestDTO.rodadaId());
        }

        Rodada rodada1 = rodada.get();
        if (!rodada1.estaAberta()) {
            throw new RuntimeException("Rodada não está aberta para check-in");
        }

        Usuario usuario = usuarioRepository.findById(checkInRequestDTO.usuarioId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        if (!participanteRepository.existsByUsuarioIdAndGrupoId(usuario.getId(), rodada1.getGrupo().getId())) {
            throw new RuntimeException("Apenas membros do grupo podem fazer check-in nesta rodada.");
        }

        if (checkInRepository.existsByRodadaIdAndUsuarioId(rodada1.getId(), usuario.getId())) {
            throw new CheckInDuplicadoException();
        }

        CheckIn checkIn = new CheckIn();
        checkIn.setRodada(rodada1);
        checkIn.setUsuario(usuario);
        checkIn.setDataHoraCheckin(LocalDateTime.now());
        checkIn.setStatus(StatusCheckIn.CONFIRMADO);

        CheckIn checkInSalvo = checkInRepository.save(checkIn);

        return new CheckInResponseDTO(
                checkInSalvo.getId(),
                rodada1.getId(),
                usuario.getId(),
                usuario.getNome(),
                checkInSalvo.getDataHoraCheckin(),
                checkInSalvo.getStatus()
        );
    }

    public List<ParticipanteCheckInResponseDTO> listarStatusDaRodada(Long rodadaId) {
        Rodada rodada = rodadaRepository.findById(rodadaId)
                .orElseThrow(() -> new RodadaNaoEncontradaException(rodadaId));

        return rodada.getGrupo().getParticipantes().stream()
                .map(participante -> {
                    Usuario usuario = participante.getUsuario();
                    Optional<CheckIn> checkIn = checkInRepository.findByRodadaIdAndUsuarioId(rodadaId, usuario.getId());

                    String status = checkIn.isPresent() ? checkIn.get().getStatus().name() : "PENDENTE";

                    return new ParticipanteCheckInResponseDTO(
                            usuario.getId(),
                            usuario.getNome(),
                            usuario.getApelido(),
                            usuario.getPosicaoPrimaria(),
                            status
                    );
                })
                .toList();
    }

    @Transactional
    public List<ParticipanteCheckInResponseDTO> confirmarTodos(Long rodadaId, Long usuarioAdminId) {
        Rodada rodada = rodadaRepository.findById(rodadaId)
                .orElseThrow(() -> new RodadaNaoEncontradaException(rodadaId));
        permissaoService.exigirAdmin(usuarioAdminId, rodada.getGrupo());

        if (rodada.getStatusRodada() != StatusRodada.AGENDADA) {
            throw new RuntimeException("Só é possível confirmar todos enquanto a rodada está agendada.");
        }

        LocalDateTime agora = LocalDateTime.now();
        for (var participante : rodada.getGrupo().getParticipantes()) {
            Usuario usuario = participante.getUsuario();
            Optional<CheckIn> checkInExistente = checkInRepository.findByRodadaIdAndUsuarioId(
                    rodadaId, usuario.getId());

            if (checkInExistente.isPresent()) {
                CheckIn checkIn = checkInExistente.get();
                if (checkIn.getStatus() != StatusCheckIn.CONFIRMADO) {
                    checkIn.setStatus(StatusCheckIn.CONFIRMADO);
                    checkIn.setDataHoraCheckin(agora);
                    checkInRepository.save(checkIn);
                }
                continue;
            }

            CheckIn checkIn = new CheckIn();
            checkIn.setRodada(rodada);
            checkIn.setUsuario(usuario);
            checkIn.setDataHoraCheckin(agora);
            checkIn.setStatus(StatusCheckIn.CONFIRMADO);
            checkInRepository.save(checkIn);
        }

        return listarStatusDaRodada(rodadaId);
    }
}

