package com.pelmanager.dto;

import com.pelmanager.entity.enums.Papel;

import java.time.LocalDateTime;

public record ParticipanteResponseDTO(
        Long id,
        Long usuarioId,
        String nome,
        String apelido,
        Papel papel,
        LocalDateTime dataEntrada
) {}
