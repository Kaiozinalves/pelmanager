package com.pelmanager.dto.request;

/**
 * usuarioId = quem está registrando/corrigindo (validado no servidor).
 * assistenteId é opcional.
 */
public record GolRequestDTO(Long usuarioId, Long autorId, Long assistenteId) {
}
