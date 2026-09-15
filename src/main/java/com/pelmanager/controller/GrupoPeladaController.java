package com.pelmanager.controller;

import com.pelmanager.dto.request.EntrarGrupoPeladaRequestDTO;
import com.pelmanager.dto.GrupoPeladaDetalhesResponseDTO;
import com.pelmanager.dto.request.GrupoPeladaRequestDTO;
import com.pelmanager.dto.GrupoPeladaResponseDTO;
import com.pelmanager.service.GrupoPeladaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grupos")
public class GrupoPeladaController {
    private final GrupoPeladaService service;

    public GrupoPeladaController(GrupoPeladaService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<GrupoPeladaResponseDTO> criar(@RequestBody GrupoPeladaRequestDTO dto) {
        GrupoPeladaResponseDTO response = service.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/entrar")
    public ResponseEntity<Void> entrarNoGrupo(@RequestBody EntrarGrupoPeladaRequestDTO dto) {
        service.entrarNoGrupo(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/meus")
    public ResponseEntity<List<GrupoPeladaResponseDTO>> listarMeusGrupos(@RequestParam Long usuarioId) {
        var grupos = service.listarPeladasDoUsuario(usuarioId);

        return ResponseEntity.ok(grupos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GrupoPeladaDetalhesResponseDTO> buscarDetalhes(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarDetalhes(id));
    }
}


