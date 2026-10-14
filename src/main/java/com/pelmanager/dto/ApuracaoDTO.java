package com.pelmanager.dto;

/** Uma linha da apuração: quantos votos um jogador recebeu (sem identificar quem votou). */
public record ApuracaoDTO(Long usuarioId, String nome, String apelido, int votos) {
}
