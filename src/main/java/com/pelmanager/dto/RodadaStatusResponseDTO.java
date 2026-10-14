package com.pelmanager.dto;

import java.time.LocalDateTime;

public record RodadaStatusResponseDTO(
        Long id,
        String status,
        LocalDateTime iniciadaEm,
        LocalDateTime finalizadaEm,
        LocalDateTime votacaoAte
) {
}
