package com.pelmanager.dto;

public record ConfiguracaoAvaliacaoDTO(
        boolean melhorJogadorAtiva,
        boolean melhorAssistenteAtiva,
        boolean bagreAtiva,
        boolean revelacaoAtiva,
        int prazoHoras
) {
}
