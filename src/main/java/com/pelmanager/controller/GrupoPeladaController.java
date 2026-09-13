package com.pelmanager.controller;

import com.pelmanager.dto.GrupoPeladaRequestDTO;
import com.pelmanager.dto.GrupoPeladaResponseDTO;
import com.pelmanager.service.GrupoPeladaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
