package com.pelmanager.service;

import com.pelmanager.dto.EnderecoResponseDTO;
import com.pelmanager.dto.EntrarGrupoPeladaRequestDTO;
import com.pelmanager.dto.request.GrupoPeladaRequestDTO;
import com.pelmanager.dto.GrupoPeladaResponseDTO;
import com.pelmanager.entity.Endereco;
import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.entity.Participante;
import com.pelmanager.entity.Usuario;
// TODO: Lembre de importar o seu Enum aqui. Ex: import com.pelmanager.entity.enums.Papel;
import com.pelmanager.entity.enums.Papel;
import com.pelmanager.repository.GrupoPeladaRepository;
import com.pelmanager.repository.ParticipanteRepository;
import com.pelmanager.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class GrupoPeladaService {

    private final GrupoPeladaRepository grupoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ParticipanteRepository participanteRepository;

    public GrupoPeladaService(GrupoPeladaRepository grupoRepository,
                              UsuarioRepository usuarioRepository,
                              ParticipanteRepository participanteRepository) {
        this.grupoRepository = grupoRepository;
        this.usuarioRepository = usuarioRepository;
        this.participanteRepository = participanteRepository;
    }

    @Transactional
    public GrupoPeladaResponseDTO criar(GrupoPeladaRequestDTO dto) {

        // Impede que a pelada seja criada sem um dono válido
        Usuario dono = usuarioRepository.findById(dto.fundadorId())
                .orElseThrow(() -> new RuntimeException("Usuário criador não encontrado."));

        Endereco endereco = new Endereco();
        endereco.setLogradouro(dto.endereco().logradouro());
        endereco.setNumero(dto.endereco().numero());
        endereco.setBairro(dto.endereco().bairro());
        endereco.setCidade(dto.endereco().cidade());
        endereco.setEstado(dto.endereco().estado());
        endereco.setCep(dto.endereco().cep());

        GrupoPelada grupo = new GrupoPelada();
        grupo.setNome(dto.nome());
        grupo.setCodigoConvite(UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        grupo.setDataCriacao(LocalDateTime.now());
        grupo.setEndereco(endereco);

        GrupoPelada grupoSalvo = grupoRepository.save(grupo);

        // Gera o vinculo automaticamente
        Participante admin = new Participante();
        admin.setUsuario(dono);
        admin.setGrupo(grupoSalvo);
        admin.setPapel(Papel.ADMIN);
        admin.setDataEntrada(LocalDateTime.now());

        participanteRepository.save(admin);

        return new GrupoPeladaResponseDTO(
                grupoSalvo.getId(),
                grupoSalvo.getNome(),
                grupoSalvo.getCodigoConvite(),
                grupoSalvo.getDataCriacao(),
                new EnderecoResponseDTO(
                        grupoSalvo.getEndereco().getId(),
                        grupoSalvo.getEndereco().getLogradouro(),
                        grupoSalvo.getEndereco().getNumero(),
                        grupoSalvo.getEndereco().getBairro(),
                        grupoSalvo.getEndereco().getCidade(),
                        grupoSalvo.getEndereco().getEstado(),
                        grupoSalvo.getEndereco().getCep()
                )
        );
    }

    @Transactional
    public void entrarNoGrupo(EntrarGrupoPeladaRequestDTO dto) {

        Usuario jogador = usuarioRepository.findById(dto.IdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        GrupoPelada grupo = grupoRepository.findByCodigoConvite(dto.codigoConvite())
                .orElseThrow(() -> new RuntimeException("Código de convite inválido ou grupo não existe."));


        if (participanteRepository.existsByUsuarioIdAndGrupoId(jogador.getId(), grupo.getId())) {
            throw new RuntimeException("Você já participa deste grupo!");
        }

        Participante novoParticipante = new Participante();
        novoParticipante.setUsuario(jogador);
        novoParticipante.setGrupo(grupo);
        novoParticipante.setPapel(Papel.MEMBRO);
        novoParticipante.setDataEntrada(LocalDateTime.now());

        participanteRepository.save(novoParticipante);
    }

    public List<GrupoPeladaResponseDTO> listarPeladasDoUsuario(Long usuarioId) {
        List<GrupoPelada> grupos = grupoRepository.findByUsuarioId(usuarioId);

        return grupos.stream()
                .map(grupo -> {
                    // 1. Prepara o DTO de endereço (com verificação para evitar erro se o grupo não tiver quadra)
                    EnderecoResponseDTO enderecoDTO = null;
                    if (grupo.getEndereco() != null) {
                        enderecoDTO = new EnderecoResponseDTO(
                                grupo.getEndereco().getId(),
                                grupo.getEndereco().getLogradouro(),
                                grupo.getEndereco().getNumero(),
                                grupo.getEndereco().getBairro(),
                                grupo.getEndereco().getCidade(),
                                grupo.getEndereco().getEstado(),
                                grupo.getEndereco().getCep()
                        );
                    }

                    // 2. Retorna o DTO do Grupo
                    return new GrupoPeladaResponseDTO(
                            grupo.getId(),
                            grupo.getNome(),
                            grupo.getCodigoConvite(),
                            grupo.getDataCriacao(),
                            enderecoDTO
                    );
                })
                .toList();
    }

}