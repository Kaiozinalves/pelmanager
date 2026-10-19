package com.pelmanager.controller;

import com.pelmanager.dto.RodadaResponseDTO;
import com.pelmanager.dto.RodadaStatusResponseDTO;
import com.pelmanager.dto.request.EnderecoRequestDTO;
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

    @PutMapping("/{id}/endereco")
    public ResponseEntity<RodadaResponseDTO> atualizarEnderecoAlternativo(@PathVariable("id") Long id,
                                                                          @RequestParam("usuarioId") Long usuarioId,
                                                                          @RequestBody EnderecoRequestDTO dto) {
        return ResponseEntity.ok(service.atualizarEnderecoAlternativo(id, usuarioId, dto));
    }

    @DeleteMapping("/{id}/endereco")
    public ResponseEntity<RodadaResponseDTO> removerEnderecoAlternativo(@PathVariable("id") Long id,
                                                                        @RequestParam("usuarioId") Long usuarioId) {
        return ResponseEntity.ok(service.removerEnderecoAlternativo(id, usuarioId));
    }

    @PatchMapping("/{id}/iniciar")
    public ResponseEntity<RodadaStatusResponseDTO> iniciarRodada(@PathVariable("id") Long id,
                                                                 @RequestParam("usuarioId") Long usuarioId) {
        return ResponseEntity.ok(service.iniciarRodada(id, usuarioId));
    }

    @PatchMapping("/{id}/finalizar")
    public ResponseEntity<RodadaStatusResponseDTO> finalizarRodada(@PathVariable("id") Long id,
                                                                   @RequestParam("usuarioId") Long usuarioId) {
        return ResponseEntity.ok(service.finalizarRodada(id, usuarioId));
    }

    @PatchMapping("/{id}/votacao/encerrar")
    public ResponseEntity<RodadaStatusResponseDTO> encerrarVotacao(@PathVariable("id") Long id,
                                                                   @RequestParam("usuarioId") Long usuarioId) {
        return ResponseEntity.ok(service.encerrarVotacao(id, usuarioId));
    }
}
