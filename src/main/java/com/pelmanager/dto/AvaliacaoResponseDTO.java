package com.pelmanager.dto;

import java.time.LocalDateTime;

public record AvaliacaoResponseDTO(
        Long id,
        Long rodadaId,
        Long avaliadorId,
        Long avaliadoId,
        String avaliadoNome,
        Integer nota,
        String comentario,
        LocalDateTime dataAvaliacao
) {
}

