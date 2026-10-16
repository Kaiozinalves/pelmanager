package com.pelmanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalTime;


public record PeladaProximaResponseDTO(
        Long grupoId,
        String grupoNome,
        String codigoConvite,
        Long rodadaId,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate data,
        @JsonFormat(pattern = "HH:mm")
        LocalTime horario,
        String endereco,
        String bairro,
        String cidade,
        String estado,
        boolean mesmoBairro,
        long totalParticipantes,
        long totalConfirmados
) {
}
