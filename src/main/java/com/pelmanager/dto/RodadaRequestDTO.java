package com.pelmanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalTime;

public record RodadaRequestDTO(Long grupoId,
                               @JsonFormat(pattern = "HH:mm")
                               LocalTime horario,
                               @JsonFormat(pattern = "yyyy-MM-dd")
                               LocalDate data,
                               Long enderecoAlternativoId) {
}
