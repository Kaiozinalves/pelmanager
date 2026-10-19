package com.pelmanager.controller;

import com.pelmanager.dto.SorteioResponseDTO;
import com.pelmanager.dto.request.SorteioRequestDTO;
import com.pelmanager.service.SorteioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sorteios")
public class SorteioController {

    private final SorteioService sorteioService;

    public SorteioController(SorteioService sorteioService) {
        this.sorteioService = sorteioService;
    }

    @PostMapping
    public ResponseEntity<SorteioResponseDTO> sortearTimes(@RequestBody SorteioRequestDTO request) {
        SorteioResponseDTO response = sorteioService.sortearTimes(request.rodadaId(), request.usuarioId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/aleatorio")
    public ResponseEntity<SorteioResponseDTO> sortearTimesAleatorio(@RequestBody SorteioRequestDTO request) {
        SorteioResponseDTO response = sorteioService.sortearTimesAleatorio(request.rodadaId(), request.usuarioId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rodada/{rodadaId}")
    public ResponseEntity<SorteioResponseDTO> buscarTimesDaRodada(@PathVariable Long rodadaId) {
        return ResponseEntity.ok(sorteioService.buscarTimesDaRodada(rodadaId));
    }
}
