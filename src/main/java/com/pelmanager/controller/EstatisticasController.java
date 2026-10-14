package com.pelmanager.controller;

import com.pelmanager.dto.EstatisticasResponseDTO;
import com.pelmanager.dto.RankingTemporadaResponseDTO;
import com.pelmanager.service.EstatisticasService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class EstatisticasController {

    private final EstatisticasService estatisticasService;

    public EstatisticasController(EstatisticasService estatisticasService) {
        this.estatisticasService = estatisticasService;
    }

    @GetMapping("/rodadas/{rodadaId}/estatisticas")
    public ResponseEntity<EstatisticasResponseDTO> daRodada(@PathVariable Long rodadaId) {
        return ResponseEntity.ok(estatisticasService.daRodada(rodadaId));
    }

    @GetMapping("/grupos/{grupoId}/estatisticas")
    public ResponseEntity<EstatisticasResponseDTO> doGrupo(@PathVariable Long grupoId) {
        return ResponseEntity.ok(estatisticasService.doGrupo(grupoId));
    }

    @GetMapping("/grupos/{grupoId}/temporadas/rodada/{rodadaId}")
    public ResponseEntity<RankingTemporadaResponseDTO> daTemporada(
            @PathVariable Long grupoId,
            @PathVariable Long rodadaId) {
        return ResponseEntity.ok(estatisticasService.temporada(grupoId, rodadaId));
    }
}
