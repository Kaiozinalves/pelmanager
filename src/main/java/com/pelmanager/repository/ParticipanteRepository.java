package com.pelmanager.repository;

import com.pelmanager.entity.Participante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ParticipanteRepository extends JpaRepository<Participante, Long> {

    Boolean existsByUsuarioIdAndGrupoId(Long usuarioId, Long grupoId);

    Optional<Participante> findByUsuarioIdAndGrupoId(Long usuarioId, Long grupoId);
}
