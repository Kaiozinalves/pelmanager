package com.pelmanager.repository;

import com.pelmanager.entity.Gol;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GolRepository extends JpaRepository<Gol, Long> {

    List<Gol> findByRodadaIdOrderByIdAsc(Long rodadaId);

    List<Gol> findByRodadaGrupoId(Long grupoId);
}
