package com.pelmanager.repository;

import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.enums.StatusRodada;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RodadaRepository extends JpaRepository<Rodada, Long> {

    // Busca se existe alguma rodada para este grupo com um status específico
    boolean existsByGrupoIdAndStatusRodada(Long grupoId, StatusRodada status);

}
