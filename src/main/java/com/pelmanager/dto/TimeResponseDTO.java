package com.pelmanager.dto;

import java.util.List;

public record TimeResponseDTO(
        Long id,
        String nome,
        List<JogadorTimeResponseDTO> jogadores
) {
}
