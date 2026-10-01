package com.pelmanager.repository;

import com.pelmanager.entity.Time;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeRepository extends JpaRepository<Time, Long> {

    List<Time> findByRodadaId(Long rodadaId);
}
