package com.pelmanager.dto;

/**
 * Estado de uma categoria para o usuário que consulta.
 * {@code resultado} só vem preenchido quando a votação encerrou (prazo ou encerramento
 * manual) ou quando todos os eleitores já votaram naquela categoria.
 */
public record CategoriaVotacaoDTO(
        String categoria,
        String rotulo,
        boolean jaVotei,
        int votosRecebidos,
        int totalEleitores,
        ResultadoCategoriaDTO resultado
) {
}
