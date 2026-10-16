package com.pelmanager.dto;

import com.pelmanager.entity.enums.PernaDominante;
import com.pelmanager.entity.enums.Posicao;

public record FreeAgentResponseDTO(
        Long usuarioId,
        String nome,
        String apelido,
        Posicao posicaoPrimaria,
        Posicao posicaoSecundaria,
        PernaDominante pernaDominante,
        String cidade,
        String estado,
        String bairro,
        Double notaMedia
) {
}
