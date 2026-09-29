package com.pelmanager.controller;

import com.pelmanager.dto.CheckInResponseDTO;
import com.pelmanager.dto.ParticipanteCheckInResponseDTO;
import com.pelmanager.dto.request.CheckInRequestDTO;
import com.pelmanager.service.CheckInService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkins")
public class CheckInController {
    private final CheckInService checkInService;

    public CheckInController(CheckInService checkInService) {
        this.checkInService = checkInService;
    }

    @PostMapping
    public ResponseEntity<CheckInResponseDTO> confirmarPresenca(@RequestBody CheckInRequestDTO dto) {
        CheckInResponseDTO response = checkInService.realizarCheckIn(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/rodada/{rodadaId}")
    public ResponseEntity<List<ParticipanteCheckInResponseDTO>> listarCheckInsDaRodada(@PathVariable Long rodadaId) {
        List<ParticipanteCheckInResponseDTO> lista = checkInService.listarStatusDaRodada(rodadaId);
        return ResponseEntity.ok(lista);
    }
}
