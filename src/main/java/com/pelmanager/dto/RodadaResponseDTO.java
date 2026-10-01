package com.pelmanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalTime;

public record RodadaResponseDTO(
        Long id,
        Long grupoId,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate data,
        @JsonFormat(pattern = "HH:mm")
        LocalTime horario,
        String status
) {
}
