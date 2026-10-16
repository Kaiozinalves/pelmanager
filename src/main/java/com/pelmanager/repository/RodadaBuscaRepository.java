package com.pelmanager.repository;

import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.enums.StatusCheckIn;
import com.pelmanager.entity.enums.StatusRodada;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface RodadaBuscaRepository extends Repository<Rodada, Long> {

    @Query("""
            SELECT r FROM Rodada r
            JOIN FETCH r.grupo g
            LEFT JOIN FETCH g.endereco ge
            LEFT JOIN FETCH r.enderecoAlternativo ea
            WHERE r.statusRodada = :status
              AND r.dataRodada >= :hoje
              AND (g.publica IS NULL OR g.publica = true)
              AND LOWER(COALESCE(ea.cidade, ge.cidade)) = LOWER(:cidade)
            ORDER BY r.dataRodada ASC, r.horaRodada ASC
            """)
    List<Rodada> buscarNaCidade(@Param("status") StatusRodada status,
                                @Param("hoje") LocalDate hoje,
                                @Param("cidade") String cidade);

    // Linhas [rodadaId, quantidade de check-ins com esse status]
    @Query("""
            SELECT c.rodada.id, COUNT(c) FROM CheckIn c
            WHERE c.rodada.id IN :rodadaIds AND c.status = :status
            GROUP BY c.rodada.id
            """)
    List<Object[]> contarCheckinsPorRodada(@Param("rodadaIds") Collection<Long> rodadaIds,
                                           @Param("status") StatusCheckIn status);

    // Linhas [grupoId, quantidade de participantes]
    @Query("""
            SELECT p.grupo.id, COUNT(p) FROM Participante p
            WHERE p.grupo.id IN :grupoIds
            GROUP BY p.grupo.id
            """)
    List<Object[]> contarParticipantesPorGrupo(@Param("grupoIds") Collection<Long> grupoIds);
}
