package com.pelmanager.service;

import com.pelmanager.dto.CheckInResponseDTO;
import com.pelmanager.dto.request.CheckInRequestDTO;
import com.pelmanager.entity.CheckIn;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.Usuario;
import com.pelmanager.entity.enums.StatusCheckIn;
import com.pelmanager.exception.CheckInDuplicadoException;
import com.pelmanager.repository.CheckInRepository;
import com.pelmanager.repository.ParticipanteRepository;
import com.pelmanager.repository.RodadaRepository;
import com.pelmanager.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class CheckInService {
    private final CheckInRepository checkInRepository;
    private final RodadaRepository rodadaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ParticipanteRepository participanteRepository;

    public CheckInService(CheckInRepository checkInRepository, RodadaRepository rodadaRepository,
                          UsuarioRepository usuarioRepository, ParticipanteRepository participanteRepository) {
        this.checkInRepository = checkInRepository;
        this.rodadaRepository = rodadaRepository;
        this.usuarioRepository = usuarioRepository;
        this.participanteRepository = participanteRepository;
    }

    @Transactional
    public CheckInResponseDTO realizarCheckIn(CheckInRequestDTO checkInRequestDTO) {
        Optional<Rodada> rodada = rodadaRepository.findById(checkInRequestDTO.rodadaId());
        if (rodada.isEmpty()) {
            throw new RuntimeException("Rodada não encontrada");
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
}

