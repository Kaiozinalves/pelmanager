package com.pelmanager.dto;

public record CheckInResponseDTO(
        Long id,
        Long rodadaId,
        Long usuarioId,
        String usuarioNome,
        String status
) {
}