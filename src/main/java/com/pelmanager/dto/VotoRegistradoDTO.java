package com.pelmanager.dto;

import java.time.LocalDateTime;

public record VotoRegistradoDTO(Long rodadaId, String categoria, LocalDateTime registradoEm) {
}
