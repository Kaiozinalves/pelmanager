package com.pelmanager.repository;

import com.pelmanager.entity.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {
    boolean existsByRodadaIdAndAvaliadorIdAndAvaliadoId(Long idRodada, Long idAvaliador, Long idAvaliado);

    List<Avaliacao> findByRodadaId(Long rodadaId);

    @Query("SELECT AVG(a.nota) FROM Avaliacao a WHERE a.avaliado.id = :usuarioId")
    Double calcularMediaDoJogador(@Param("usuarioId") Long usuarioId);
}
