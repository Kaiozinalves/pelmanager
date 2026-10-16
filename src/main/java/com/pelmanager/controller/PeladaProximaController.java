package com.pelmanager.controller;

import com.pelmanager.dto.PeladaProximaResponseDTO;
import com.pelmanager.service.PeladaProximaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/peladas")
public class PeladaProximaController {

    private final PeladaProximaService service;

    public PeladaProximaController(PeladaProximaService service) {
        this.service = service;
    }

    @GetMapping("/proximas")
    public ResponseEntity<List<PeladaProximaResponseDTO>> buscarProximas(
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String bairro,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) Integer limite) {
        return ResponseEntity.ok(service.buscar(cidade, estado, bairro, usuarioId, limite));
    }
}
