package com.pelmanager.dto;

import java.util.List;

public record SorteioResponseDTO(
        Long rodadaId,
        List<TimeResponseDTO> times
) {
}