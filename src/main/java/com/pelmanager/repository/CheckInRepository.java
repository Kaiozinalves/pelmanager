package com.pelmanager.repository;

import com.pelmanager.entity.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CheckInRepository extends JpaRepository<CheckIn, Long> {

    Boolean existsByRodadaIdAndUsuarioId(Long rodadaId, Long usuarioId);

    Optional<CheckIn> findByRodadaIdAndUsuarioId(Long rodadaId, Long usuarioId);
}
