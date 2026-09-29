package com.pelmanager.repository;

import com.pelmanager.entity.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {
    boolean existsByRodadaIdAndAvaliadorIdAndAvaliadoId(Long idRodada, Long idAvaliador, Long idAvaliado);

    List<Avaliacao> findByRodadaId(Long rodadaId);
}
