package com.pelmanager.service;

import com.pelmanager.dto.GrupoPeladaRequestDTO;
import com.pelmanager.dto.GrupoPeladaResponseDTO;
import com.pelmanager.entity.GrupoPelada;
import com.pelmanager.repository.GrupoPeladaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class GrupoPeladaService {
    private final GrupoPeladaRepository repository;

    public GrupoPeladaService(GrupoPeladaRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public GrupoPeladaResponseDTO criar(GrupoPeladaRequestDTO dto) {
        GrupoPelada grupo = new GrupoPelada();
        grupo.setNome(dto.nome());

        // Gera um código de convite de 6 caracteres aleatórios
        String codigoGerado = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        grupo.setCodigoConvite(codigoGerado);

        grupo.setDataCriacao(LocalDateTime.now());

        GrupoPelada grupoSalvo = repository.save(grupo);

        return new GrupoPeladaResponseDTO(
                grupoSalvo.getId(),
                grupoSalvo.getNome(),
                grupoSalvo.getCodigoConvite(),
                grupoSalvo.getDataCriacao()
        );
    }
}
