package com.pelmanager.dto;

import com.pelmanager.entity.enums.PernaDominante;
import com.pelmanager.entity.enums.Posicao;
import lombok.Data;


public record UsuarioResponseDTO(
        Long id,
        String nome,
        String apelido,
        String email,
        PernaDominante peDominante,
        Posicao posicaoPrimaria,
        Posicao posicaoSecundaria
) {}
