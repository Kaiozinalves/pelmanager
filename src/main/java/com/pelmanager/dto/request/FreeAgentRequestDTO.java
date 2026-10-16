package com.pelmanager.dto.request;

public record FreeAgentRequestDTO(
        Long usuarioId,
        String cidade,
        String estado,
        String bairro
) {
}
