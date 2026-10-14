package com.pelmanager.dto;

import java.time.LocalDateTime;

/** Confirmação de voto. Propositalmente não devolve em quem o usuário votou. */
public record VotoRegistradoDTO(Long rodadaId, String categoria, LocalDateTime registradoEm) {
}
