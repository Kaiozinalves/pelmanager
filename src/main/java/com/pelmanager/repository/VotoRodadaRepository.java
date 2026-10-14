package com.pelmanager.repository;

import com.pelmanager.entity.VotoRodada;
import com.pelmanager.entity.enums.CategoriaVoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VotoRodadaRepository extends JpaRepository<VotoRodada, Long> {

    boolean existsByRodadaIdAndCategoriaAndVotanteId(Long rodadaId, CategoriaVoto categoria, Long votanteId);

    List<VotoRodada> findByRodadaIdAndVotanteId(Long rodadaId, Long votanteId);

    List<VotoRodada> findByRodadaIdInAndCategoria(List<Long> rodadaIds, CategoriaVoto categoria);

    /**
     * Apuração: [categoria, votadoId, quantidade de votos]. Só conta votos de quem tem
     * check-in CONFIRMADO na rodada. Não devolve (nem consulta) a identidade do votante.
     */
    @Query("""
            select v.categoria, v.votado.id, count(v)
            from VotoRodada v
            where v.rodada.id = :rodadaId
              and exists (
                    select c.id from CheckIn c
                    where c.rodada.id = :rodadaId
                      and c.usuario.id = v.votante.id
                      and c.status = com.pelmanager.entity.enums.StatusCheckIn.CONFIRMADO)
            group by v.categoria, v.votado.id
            """)
    List<Object[]> apurarVotos(@Param("rodadaId") Long rodadaId);
}
