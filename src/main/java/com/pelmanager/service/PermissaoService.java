package com.pelmanager.service;

import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.entity.Participante;
import com.pelmanager.entity.Usuario;
import com.pelmanager.entity.enums.StatusCheckIn;
import com.pelmanager.exception.AcessoNegadoException;
import com.pelmanager.exception.RecursoNaoEncontradoException;
import com.pelmanager.exception.RequisicaoInvalidaException;
import com.pelmanager.repository.CheckInRepository;
import com.pelmanager.repository.ParticipanteRepository;
import com.pelmanager.repository.UsuarioRepository;
import org.springframework.stereotype.Component;

/**
 * Regras de permissão aplicadas no servidor.
 * Observação: o backend ainda não tem autenticação (JWT), então o "usuarioId" que chega
 * na requisição é confiado como identidade. Quando houver login real, basta trocar a
 * origem desse id (token) sem mexer nas regras abaixo.
 */
@Component
public class PermissaoService {

    private final ParticipanteRepository participanteRepository;
    private final CheckInRepository checkInRepository;
    private final UsuarioRepository usuarioRepository;

    public PermissaoService(ParticipanteRepository participanteRepository,
                            CheckInRepository checkInRepository,
                            UsuarioRepository usuarioRepository) {
        this.participanteRepository = participanteRepository;
        this.checkInRepository = checkInRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public Usuario buscarUsuario(Long usuarioId) {
        if (usuarioId == null) {
            throw new RequisicaoInvalidaException("Informe o usuário que está realizando a ação.");
        }
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
    }

    public Participante exigirParticipante(Long usuarioId, GrupoPelada grupo) {
        if (usuarioId == null) {
            throw new RequisicaoInvalidaException("Informe o usuário que está realizando a ação.");
        }
        return participanteRepository.findByUsuarioIdAndGrupoId(usuarioId, grupo.getId())
                .orElseThrow(() -> new AcessoNegadoException("Você não faz parte desta pelada."));
    }

    public Participante exigirAdmin(Long usuarioId, GrupoPelada grupo) {
        Participante participante = exigirParticipante(usuarioId, grupo);
        if (!participante.isAdmin()) {
            throw new AcessoNegadoException("Apenas administradores da pelada podem realizar esta ação.");
        }
        return participante;
    }

    public boolean temCheckInConfirmado(Long rodadaId, Long usuarioId) {
        return usuarioId != null
                && checkInRepository.existsByRodadaIdAndUsuarioIdAndStatus(rodadaId, usuarioId, StatusCheckIn.CONFIRMADO);
    }
}
