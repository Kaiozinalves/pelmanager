package com.pelmanager.service;

import com.pelmanager.dto.UsuarioRequestDTO;
import com.pelmanager.dto.UsuarioResponseDTO;
import com.pelmanager.entity.Usuario;
import com.pelmanager.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    //injecao de dependencia
    private final UsuarioRepository usuarioRepository;
    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public UsuarioResponseDTO cadastrarUsuario(UsuarioRequestDTO usuarioRequestDTO){
        var usuario = new Usuario();
        usuario.setNome(usuarioRequestDTO.nome());
        usuario.setApelido(usuarioRequestDTO.apelido());
        usuario.setEmail(usuarioRequestDTO.email());
        usuario.setSenha(usuarioRequestDTO.senha());
        usuario.setPeDominante(usuarioRequestDTO.peDominante());
        usuario.setPosicaoPrimaria(usuarioRequestDTO.posicaoPrimaria());
        usuario.setPosicaoSecundaria(usuarioRequestDTO.posicaoSecundaria());

        var usuarioSalvo = usuarioRepository.save(usuario);
        return new UsuarioResponseDTO(
                usuarioSalvo.getId(),
                usuarioSalvo.getNome(),
                usuarioSalvo.getApelido(),
                usuarioSalvo.getEmail(),
                usuarioSalvo.getPeDominante(),
                usuarioSalvo.getPosicaoPrimaria(),
                usuarioSalvo.getPosicaoSecundaria()
        );
    }
}
