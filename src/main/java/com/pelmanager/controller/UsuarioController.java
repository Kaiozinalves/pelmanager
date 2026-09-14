package com.pelmanager.controller;

import com.pelmanager.dto.request.LoginRequestDTO;
import com.pelmanager.dto.request.UsuarioRequestDTO;
import com.pelmanager.dto.UsuarioResponseDTO;
import com.pelmanager.dto.request.UsuarioUpdateRequestDTO;
import com.pelmanager.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> cadastrar(@RequestBody UsuarioRequestDTO dto) {
        var response = usuarioService.cadastrarUsuario(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioResponseDTO> autenticar(@RequestBody LoginRequestDTO dto) {
        var usuario = usuarioService.autenticar(dto);
        return ResponseEntity.ok(usuario);
    }
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> atualizar(@PathVariable Long id,
                                                        @RequestBody UsuarioUpdateRequestDTO dto) {
        return ResponseEntity.ok(usuarioService.atualizarUsuario(id, dto));
    }
}