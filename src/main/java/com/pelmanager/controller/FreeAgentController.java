package com.pelmanager.controller;

import com.pelmanager.dto.FreeAgentResponseDTO;
import com.pelmanager.dto.request.FreeAgentRequestDTO;
import com.pelmanager.entity.enums.Posicao;
import com.pelmanager.service.FreeAgentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/free-agents")
public class FreeAgentController {

    private final FreeAgentService service;

    public FreeAgentController(FreeAgentService service) {
        this.service = service;
    }

    @PutMapping
    public ResponseEntity<FreeAgentResponseDTO> ativar(@RequestBody FreeAgentRequestDTO dto) {
        return ResponseEntity.ok(service.ativar(dto));
    }

    @DeleteMapping("/usuario/{usuarioId}")
    public ResponseEntity<Void> desativar(@PathVariable Long usuarioId) {
        service.desativar(usuarioId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<FreeAgentResponseDTO> buscarPorUsuario(@PathVariable Long usuarioId) {
        return service.buscarPorUsuario(usuarioId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping
    public ResponseEntity<List<FreeAgentResponseDTO>> buscar(
            @RequestParam(required = false) Long grupoId,
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String bairro,
            @RequestParam(required = false) Posicao posicao,
            @RequestParam(required = false) Integer limite) {
        return ResponseEntity.ok(service.buscar(grupoId, cidade, estado, bairro, posicao, limite));
    }
}
