package com.pelmanager.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Visão da votação de uma rodada para um usuário.
 * situacao: AGUARDANDO_RODADA (rodada ainda não finalizada) | ABERTA | ENCERRADA.
 */
public record VotacaoResponseDTO(
        Long rodadaId,
        String situacao,
        LocalDateTime prazo,
        boolean elegivel,
        int totalEleitores,
        List<CategoriaVotacaoDTO> categorias,
        List<JogadorResumoDTO> candidatos
) {
}
