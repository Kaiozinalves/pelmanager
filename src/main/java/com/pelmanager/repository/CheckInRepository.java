package com.pelmanager.repository;

import com.pelmanager.entity.CheckIn;
import com.pelmanager.entity.enums.StatusCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CheckInRepository extends JpaRepository<CheckIn, Long> {

    Boolean existsByRodadaIdAndUsuarioId(Long rodadaId, Long usuarioId);

    Optional<CheckIn> findByRodadaIdAndUsuarioId(Long rodadaId, Long usuarioId);

    boolean existsByRodadaIdAndUsuarioIdAndStatus(Long rodadaId, Long usuarioId, StatusCheckIn status);

    List<CheckIn> findByRodadaIdAndStatus(Long rodadaId, StatusCheckIn status);

    @Query("SELECT COUNT(c) FROM CheckIn c WHERE c.rodada.id = :rodadaId AND c.status = :statusCheckIn")
    long contarPorRodadaEStatus(Long rodadaId, StatusCheckIn statusCheckIn);
}
