package com.pelmanager.dto.request;

/** Campos Boolean/Integer (não primitivos) para detectar omissão e rejeitar a requisição. */
public record ConfiguracaoAvaliacaoRequestDTO(
        Long usuarioId,
        Boolean melhorJogadorAtiva,
        Boolean melhorAssistenteAtiva,
        Boolean bagreAtiva,
        Boolean revelacaoAtiva,
        Integer prazoHoras
) {
}
