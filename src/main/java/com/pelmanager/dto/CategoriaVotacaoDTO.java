package com.pelmanager.dto;


public record CategoriaVotacaoDTO(
        String categoria,
        String rotulo,
        boolean jaVotei,
        int votosRecebidos,
        int totalEleitores,
        ResultadoCategoriaDTO resultado
) {
}
