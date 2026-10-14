package com.pelmanager.dto;

public record LinhaRankingTemporadaDTO(
        Long usuarioId,
        String nome,
        String apelido,
        int quantidade,
        int posicao,
        Integer posicaoAnterior,
        String movimento
) {
}
