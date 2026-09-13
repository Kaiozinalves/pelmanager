package com.pelmanager.controller;

import com.pelmanager.dto.request.RodadaRequestDTO;
import com.pelmanager.service.RodadaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/rodadas")
public class RodadaController {
    private final RodadaService service;

    public RodadaController(RodadaService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Void> agendarRodada(@RequestBody RodadaRequestDTO dto) {
        service.agendarRodada(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
