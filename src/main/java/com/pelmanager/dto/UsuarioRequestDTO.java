package com.pelmanager.dto;

public record UsuarioRequestDTO(
        String nome,
        String apelido,
        String email,
        String senha,
        String peDominante,
        String posicaoPrimaria,
        String posicaoSecundaria
) {}
