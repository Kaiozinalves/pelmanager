package com.pelmanager.repository;

import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.enums.StatusRodada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RodadaRepository extends JpaRepository<Rodada, Long> {

    boolean existsByGrupoIdAndStatusRodada(Long grupoId, StatusRodada status);

    List<Rodada> findByGrupoIdOrderByIdDesc(Long grupoId);

}
