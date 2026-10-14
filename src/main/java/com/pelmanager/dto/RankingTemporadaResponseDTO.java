package com.pelmanager.dto;

import java.util.List;

public record RankingTemporadaResponseDTO(
        Long grupoId,
        Long rodadaId,
        int ano,
        List<LinhaRankingTemporadaDTO> melhorJogador,
        List<LinhaRankingTemporadaDTO> artilharia,
        List<LinhaRankingTemporadaDTO> assistencias
) {
}
