package com.pelmanager.service;

import com.pelmanager.dto.request.LoginRequestDTO;
import com.pelmanager.dto.request.UsuarioRequestDTO;
import com.pelmanager.dto.UsuarioResponseDTO;
import com.pelmanager.dto.request.UsuarioUpdateRequestDTO;
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
        usuario.setPernaDominante(usuarioRequestDTO.peDominante());
        usuario.setPosicaoPrimaria(usuarioRequestDTO.posicaoPrimaria());
        usuario.setPosicaoSecundaria(usuarioRequestDTO.posicaoSecundaria());

        var usuarioSalvo = usuarioRepository.save(usuario);
        return new UsuarioResponseDTO(
                usuarioSalvo.getId(),
                usuarioSalvo.getNome(),
                usuarioSalvo.getApelido(),
                usuarioSalvo.getEmail(),
                usuarioSalvo.getPernaDominante(),
                usuarioSalvo.getPosicaoPrimaria(),
                usuarioSalvo.getPosicaoSecundaria()
        );
    }

    public UsuarioResponseDTO autenticar(LoginRequestDTO dto) {
        Usuario usuario = usuarioRepository.findByEmail(dto.email())
                .orElseThrow(() -> new RuntimeException("E-mail não cadastrado."));

        if (!usuario.getSenha().equals(dto.senha())) {
            throw new RuntimeException("Senha incorreta.");
        }

        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getApelido(),
                usuario.getEmail(),
                usuario.getPernaDominante(),
                usuario.getPosicaoPrimaria(),
                usuario.getPosicaoSecundaria()
        );
    }
    public UsuarioResponseDTO buscarPorId(Long id) {
        var usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getApelido(),
                usuario.getEmail(),
                usuario.getPernaDominante(),
                usuario.getPosicaoPrimaria(),
                usuario.getPosicaoSecundaria()
        );
    }

    @Transactional
    public UsuarioResponseDTO atualizarUsuario(Long id, UsuarioUpdateRequestDTO dto) {
        var usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        usuario.setNome(dto.nome());
        usuario.setApelido(dto.apelido());
        usuario.setPernaDominante(dto.peDominante());
        usuario.setPosicaoPrimaria(dto.posicaoPrimaria());
        usuario.setPosicaoSecundaria(dto.posicaoSecundaria());

        var usuarioAtualizado = usuarioRepository.save(usuario);

        return new UsuarioResponseDTO(
                usuarioAtualizado.getId(),
                usuarioAtualizado.getNome(),
                usuarioAtualizado.getApelido(),
                usuarioAtualizado.getEmail(),
                usuarioAtualizado.getPernaDominante(),
                usuarioAtualizado.getPosicaoPrimaria(),
                usuarioAtualizado.getPosicaoSecundaria()
        );
    }
}
