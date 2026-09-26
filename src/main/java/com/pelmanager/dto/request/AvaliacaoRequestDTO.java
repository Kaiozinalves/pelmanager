package com.pelmanager.dto.request;

public record AvaliacaoRequestDTO(
        Long rodadaId,
        Long avaliadorId,
        Long avaliadoId,
        Integer nota,
        String comentario
) {
}