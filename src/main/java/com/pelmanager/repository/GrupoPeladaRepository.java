package com.pelmanager.repository;


import com.pelmanager.entity.GrupoPelada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GrupoPeladaRepository extends JpaRepository<GrupoPelada, Long> {

    Optional<GrupoPelada> findByCodigoConvite(String codigoConvite);

    @Query("SELECT g FROM GrupoPelada g JOIN g.participantes p WHERE p.usuario.id = :usuarioId")
    List<GrupoPelada> findByUsuarioId(@Param("usuarioId") Long usuarioId);

}
