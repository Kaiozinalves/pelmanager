package com.pelmanager.repository;

import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.enums.StatusRodada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RodadaRepository extends JpaRepository<Rodada, Long> {

    // Busca se existe alguma rodada para este grupo com um status específico
    boolean existsByGrupoIdAndStatusRodada(Long grupoId, StatusRodada status);

    // Usado na tela do grupo, pra listar as rodadas (mais recente primeiro)
    List<Rodada> findByGrupoIdOrderByIdDesc(Long grupoId);

}
