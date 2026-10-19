package com.pelmanager.dto;

import java.time.LocalDateTime;
import java.util.List;

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
