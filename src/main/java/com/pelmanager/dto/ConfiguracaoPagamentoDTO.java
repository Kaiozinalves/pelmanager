package com.pelmanager.dto;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record ConfiguracaoPagamentoDTO(Long usuarioId, Boolean ativo, BigDecimal valorTotal, String chavePixGerente, String mensagem) {
}
