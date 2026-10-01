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

    // UC09: sorteio balanceado por posição + nota média das avaliações
    @PostMapping
    public ResponseEntity<SorteioResponseDTO> sortearTimes(@RequestBody SorteioRequestDTO request) {
        SorteioResponseDTO response = sorteioService.sortearTimes(request.rodadaId());
        return ResponseEntity.ok(response);
    }

    // UC05: sorteio aleatório, garantindo 1 goleiro por time
    @PostMapping("/aleatorio")
    public ResponseEntity<SorteioResponseDTO> sortearTimesAleatorio(@RequestBody SorteioRequestDTO request) {
        SorteioResponseDTO response = sorteioService.sortearTimesAleatorio(request.rodadaId());
        return ResponseEntity.ok(response);
    }

    // Busca os times já sorteados da rodada, sem sortear de novo
    @GetMapping("/rodada/{rodadaId}")
    public ResponseEntity<SorteioResponseDTO> buscarTimesDaRodada(@PathVariable Long rodadaId) {
        return ResponseEntity.ok(sorteioService.buscarTimesDaRodada(rodadaId));
    }
}
