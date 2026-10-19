package com.pelmanager.controller;

import com.pelmanager.dto.GolResponseDTO;
import com.pelmanager.dto.request.GolRequestDTO;
import com.pelmanager.service.GolService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rodadas/{rodadaId}/gols")
public class GolController {

    private final GolService golService;

    public GolController(GolService golService) {
        this.golService = golService;
    }

    @PostMapping
    public ResponseEntity<GolResponseDTO> registrar(@PathVariable Long rodadaId,
                                                    @RequestBody GolRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(golService.registrar(rodadaId, dto));
    }

    @GetMapping
    public ResponseEntity<List<GolResponseDTO>> listar(@PathVariable Long rodadaId) {
        return ResponseEntity.ok(golService.listar(rodadaId));
    }

    @PutMapping("/{golId}")
    public ResponseEntity<GolResponseDTO> corrigir(@PathVariable Long rodadaId,
                                                   @PathVariable Long golId,
                                                   @RequestBody GolRequestDTO dto) {
        return ResponseEntity.ok(golService.corrigir(rodadaId, golId, dto));
    }

    @DeleteMapping("/{golId}")
    public ResponseEntity<Void> remover(@PathVariable Long rodadaId,
                                        @PathVariable Long golId,
                                        @RequestParam Long usuarioId) {
        golService.remover(rodadaId, golId, usuarioId);
        return ResponseEntity.noContent().build();
    }
}
