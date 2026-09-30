package com.pelmanager.controller;

import com.pelmanager.dto.SorteioResponseDTO;
import com.pelmanager.dto.request.SorteioRequestDTO;
import com.pelmanager.service.SorteioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sorteios")
public class SorteioController {

    private final SorteioService sorteioService;

    public SorteioController(SorteioService sorteioService) {
        this.sorteioService = sorteioService;
    }

    @PostMapping
    public ResponseEntity<SorteioResponseDTO> sortearTimes(@RequestBody SorteioRequestDTO request) {
        SorteioResponseDTO response = sorteioService.sortearTimes(request.rodadaId());
        return ResponseEntity.ok(response);
    }
}
