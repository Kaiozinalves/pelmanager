package com.pelmanager.dto;

import java.time.LocalDateTime;

public record ErroResponseDTO(
        LocalDateTime timestamp,
        Integer status,
        String mensagem
) {
}