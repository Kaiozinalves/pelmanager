package com.pelmanager.repository;


import com.pelmanager.entity.GrupoPelada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GrupoPeladaRepository extends JpaRepository<GrupoPelada, Long> {

    Optional<GrupoPelada> findByCodigoConvite(String codigoConvite);

}
