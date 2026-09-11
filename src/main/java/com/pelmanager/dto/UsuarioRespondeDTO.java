package com.pelmanager.dto;

public record UsuarioRespondeDTO(
        Long id,
        String nome,
        String apelido,
        String email,
        String peDominante,
        String posicaoPrimaria,
        String posicaoSecundaria
) {}
