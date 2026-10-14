package com.pelmanager.dto;

import java.util.List;

/**
 * Resultado público de uma categoria.
 * Critério de empate: vence quem tiver mais votos; se houver empate no topo, todos os
 * empatados são vencedores (empate = true). Sem votos, não há vencedor.
 */
public record ResultadoCategoriaDTO(
        int totalVotos,
        boolean empate,
        List<ApuracaoDTO> vencedores,
        List<ApuracaoDTO> ranking
) {
}
