package com.pelmanager.dto;

import java.time.LocalDateTime;

public record GolResponseDTO(
        Long id,
        Long rodadaId,
        JogadorResumoDTO autor,
        JogadorResumoDTO assistente,
        Long registradoPorId,
        String registradoPorNome,
        LocalDateTime registradoEm,
        boolean corrigido,
        String corrigidoPorNome,
        LocalDateTime corrigidoEm
) {
}
