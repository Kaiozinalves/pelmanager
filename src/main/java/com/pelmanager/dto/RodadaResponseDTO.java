package com.pelmanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record RodadaResponseDTO(
        Long id,
        Long grupoId,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate data,
        @JsonFormat(pattern = "HH:mm")
        LocalTime horario,
        String status,
        EnderecoResponseDTO endereco,
        Boolean usaEnderecoAlternativo,
        BigDecimal valorPorParticipante
) {
    public RodadaResponseDTO(Long id, Long grupoId, LocalDate data, LocalTime horario, String status) {
        this(id, grupoId, data, horario, status, null, false, null);
    }
}
