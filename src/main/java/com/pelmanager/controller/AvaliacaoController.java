package com.pelmanager.controller;

import com.pelmanager.dto.AvaliacaoResponseDTO;
import com.pelmanager.dto.request.AvaliacaoRequestDTO;
import com.pelmanager.service.AvaliacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/avaliacoes")
public class AvaliacaoController {

    private final AvaliacaoService avaliacaoService;

    public AvaliacaoController(AvaliacaoService avaliacaoService) {
        this.avaliacaoService = avaliacaoService;
    }

    @PostMapping
    public ResponseEntity<AvaliacaoResponseDTO> avaliar(@RequestBody AvaliacaoRequestDTO dto){
        AvaliacaoResponseDTO response = avaliacaoService.avaliarJogador(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/rodada/{rodadaId}")
    public ResponseEntity<List<AvaliacaoResponseDTO>> listarAvaliacoesDaRodada(@PathVariable Long rodadaId) {
        List<AvaliacaoResponseDTO> avaliacoes = avaliacaoService.listarPorRodada(rodadaId);
        return ResponseEntity.ok(avaliacoes);
    }
}
