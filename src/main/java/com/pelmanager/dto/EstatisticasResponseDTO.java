package com.pelmanager.dto;

import java.util.List;

public record EstatisticasResponseDTO(
        Long referenciaId,
        int totalGols,
        List<LinhaEstatisticaDTO> artilharia,
        List<LinhaEstatisticaDTO> assistencias
) {
}
