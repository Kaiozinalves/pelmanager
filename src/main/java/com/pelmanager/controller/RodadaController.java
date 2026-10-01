package com.pelmanager.controller;

import com.pelmanager.dto.RodadaResponseDTO;
import com.pelmanager.dto.request.RodadaRequestDTO;
import com.pelmanager.service.RodadaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/rodadas")
public class RodadaController {
    private final RodadaService service;

    public RodadaController(RodadaService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<RodadaResponseDTO> agendarRodada(@RequestBody RodadaRequestDTO dto) {
        RodadaResponseDTO response = service.agendarRodada(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/finalizar")
    public ResponseEntity<String> finalizarRodada(@PathVariable("id") Long id) {
        service.finalizarRodada(id);
        return ResponseEntity.ok("Rodada finalizada com sucesso. As avaliações estão liberadas!");
    }
}
