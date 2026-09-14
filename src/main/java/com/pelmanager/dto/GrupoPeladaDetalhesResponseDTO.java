package com.pelmanager.dto;

import java.time.LocalDateTime;
import java.util.List;

public record GrupoPeladaDetalhesResponseDTO(
        Long id,
        String nome,
        String codigoConvite,
        LocalDateTime dataCriacao,
        List<ParticipanteResponseDTO> participantes
) {}