package com.pelmanager.dto.request;

import com.pelmanager.entity.enums.CategoriaVoto;

public record VotoRequestDTO(Long votanteId, CategoriaVoto categoria, Long votadoId) {
}
