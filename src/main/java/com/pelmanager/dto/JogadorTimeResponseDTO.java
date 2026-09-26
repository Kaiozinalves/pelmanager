package com.pelmanager.dto;

import com.pelmanager.entity.enums.Posicao;

public record JogadorTimeResponseDTO(
        Long usuarioId,
        String nome,
        String apelido,
        Posicao posicaoPrimaria
) {
}