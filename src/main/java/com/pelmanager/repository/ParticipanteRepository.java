package com.pelmanager.repository;

import com.pelmanager.entity.Participante;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticipanteRepository extends JpaRepository<Participante, Long> {

    Boolean existsByUsuarioIdAndGrupoId(Long usuarioId, Long grupoId);
}
