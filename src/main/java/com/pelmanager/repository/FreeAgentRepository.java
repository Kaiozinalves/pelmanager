package com.pelmanager.repository;

import com.pelmanager.entity.FreeAgent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FreeAgentRepository extends JpaRepository<FreeAgent, Long> {

    Optional<FreeAgent> findByUsuarioId(Long usuarioId);

    // Busca por cidade sem diferenciar maiúscula/minúscula ("natal" = "Natal")
    List<FreeAgent> findByCidadeIgnoreCase(String cidade);

    void deleteByUsuarioId(Long usuarioId);
}
