package com.pelmanager.dto;

import java.util.List;


public record ResultadoCategoriaDTO(
        int totalVotos,
        boolean empate,
        List<ApuracaoDTO> vencedores,
        List<ApuracaoDTO> ranking
) {
}
