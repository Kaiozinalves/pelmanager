package com.pelmanager.service;

import com.pelmanager.dto.EnderecoResponseDTO;
import com.pelmanager.dto.UsuarioResponseDTO;
import com.pelmanager.dto.request.EnderecoRequestDTO;
import com.pelmanager.dto.request.LoginRequestDTO;
import com.pelmanager.dto.request.UsuarioRequestDTO;
import com.pelmanager.dto.request.UsuarioUpdateRequestDTO;
import com.pelmanager.entity.Endereco;
import com.pelmanager.entity.Usuario;
import com.pelmanager.exception.EmailJaCadastradoException;
import com.pelmanager.exception.RequisicaoInvalidaException;
import com.pelmanager.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final FreeAgentService freeAgentService;

    public UsuarioService(UsuarioRepository usuarioRepository, FreeAgentService freeAgentService) {
        this.usuarioRepository = usuarioRepository;
        this.freeAgentService = freeAgentService;
    }

    @Transactional
    public UsuarioResponseDTO cadastrarUsuario(UsuarioRequestDTO dto) {
        if (usuarioRepository.existsByEmail(dto.email())) {
            throw new EmailJaCadastradoException();
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dto.nome());
        usuario.setApelido(dto.apelido());
        usuario.setEmail(dto.email());
        usuario.setSenha(dto.senha());
        usuario.setPernaDominante(dto.peDominante());
        usuario.setPosicaoPrimaria(dto.posicaoPrimaria());
        usuario.setPosicaoSecundaria(dto.posicaoSecundaria());
        usuario.setEndereco(atualizarEndereco(null, dto.endereco()));

        return paraDTO(usuarioRepository.save(usuario), true);
    }

    public UsuarioResponseDTO autenticar(LoginRequestDTO dto) {
        Usuario usuario = usuarioRepository.findByEmail(dto.email())
                .orElseThrow(() -> new RuntimeException("E-mail não cadastrado."));

        if (!usuario.getSenha().equals(dto.senha())) {
            throw new RuntimeException("Senha incorreta.");
        }

        return paraDTO(usuario, true);
    }

    public UsuarioResponseDTO buscarPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
        return paraDTO(usuario, false);
    }

    @Transactional
    public UsuarioResponseDTO atualizarUsuario(Long id, UsuarioUpdateRequestDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        usuario.setNome(dto.nome());
        usuario.setApelido(dto.apelido());
        usuario.setPernaDominante(dto.peDominante());
        usuario.setPosicaoPrimaria(dto.posicaoPrimaria());
        usuario.setPosicaoSecundaria(dto.posicaoSecundaria());
        usuario.setEndereco(atualizarEndereco(usuario.getEndereco(), dto.endereco()));

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);
        freeAgentService.sincronizarEndereco(usuarioAtualizado);
        return paraDTO(usuarioAtualizado, false);
    }

    private Endereco atualizarEndereco(Endereco endereco, EnderecoRequestDTO dto) {
        if (dto == null) {
            throw new RequisicaoInvalidaException("Informe seu endereço para concluir o cadastro.");
        }
        if (dto.logradouro() == null || dto.logradouro().isBlank()) {
            throw new RequisicaoInvalidaException("Informe a rua ou avenida do endereço.");
        }
        if (dto.cidade() == null || dto.cidade().isBlank()) {
            throw new RequisicaoInvalidaException("Informe a cidade do endereço.");
        }

        String estado = vazioParaNulo(dto.estado());
        if (estado != null && estado.length() != 2) {
            throw new RequisicaoInvalidaException("A UF deve ter 2 letras (ex.: RN).");
        }
        String cep = vazioParaNulo(dto.cep());
        if (cep != null && cep.length() > 9) {
            throw new RequisicaoInvalidaException("O CEP deve ter no máximo 9 caracteres.");
        }

        Endereco atualizado = endereco == null ? new Endereco() : endereco;
        atualizado.setLogradouro(dto.logradouro().trim());
        atualizado.setNumero(vazioParaNulo(dto.numero()));
        atualizado.setBairro(vazioParaNulo(dto.bairro()));
        atualizado.setCidade(dto.cidade().trim());
        atualizado.setEstado(estado == null ? null : estado.toUpperCase());
        atualizado.setCep(cep);
        return atualizado;
    }

    private UsuarioResponseDTO paraDTO(Usuario usuario, boolean incluirEndereco) {
        Endereco endereco = usuario.getEndereco();
        EnderecoResponseDTO enderecoDTO = !incluirEndereco || endereco == null ? null : new EnderecoResponseDTO(
                endereco.getId(),
                endereco.getLogradouro(),
                endereco.getNumero(),
                endereco.getBairro(),
                endereco.getCidade(),
                endereco.getEstado(),
                endereco.getCep()
        );

        return new UsuarioResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getApelido(),
                usuario.getEmail(),
                usuario.getPernaDominante(),
                usuario.getPosicaoPrimaria(),
                usuario.getPosicaoSecundaria(),
                enderecoDTO
        );
    }

    private String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
