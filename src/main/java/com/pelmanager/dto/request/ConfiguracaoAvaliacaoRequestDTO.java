package com.pelmanager.dto.request;

public record ConfiguracaoAvaliacaoRequestDTO(
        Long usuarioId,
        Boolean melhorJogadorAtiva,
        Boolean melhorAssistenteAtiva,
        Boolean bagreAtiva,
        Boolean revelacaoAtiva,
        Integer prazoHoras
) {
}
