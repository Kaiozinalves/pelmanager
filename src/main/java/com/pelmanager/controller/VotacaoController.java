package com.pelmanager.controller;

import com.pelmanager.dto.VotacaoResponseDTO;
import com.pelmanager.dto.VotoRegistradoDTO;
import com.pelmanager.dto.request.VotoRequestDTO;
import com.pelmanager.service.VotacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rodadas/{rodadaId}")
public class VotacaoController {

    private final VotacaoService votacaoService;

    public VotacaoController(VotacaoService votacaoService) {
        this.votacaoService = votacaoService;
    }

    @GetMapping("/votacao")
    public ResponseEntity<VotacaoResponseDTO> consultar(@PathVariable Long rodadaId,
                                                        @RequestParam Long usuarioId) {
        return ResponseEntity.ok(votacaoService.consultar(rodadaId, usuarioId));
    }

    @PostMapping("/votos")
    public ResponseEntity<VotoRegistradoDTO> votar(@PathVariable Long rodadaId,
                                                   @RequestBody VotoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(votacaoService.votar(rodadaId, dto));
    }
}
