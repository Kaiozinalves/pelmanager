package com.pelmanager.dto;

public record CheckInResponseDTO(
        Long id,
        Long rodadaId,
        Long usuarioId,
        String usuarioNome,
        java.time.LocalDateTime dataHoraCheckin,
        com.pelmanager.entity.enums.StatusCheckIn status
) {
}