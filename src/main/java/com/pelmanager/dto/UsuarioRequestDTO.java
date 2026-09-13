package com.pelmanager.dto;

import com.pelmanager.entity.enums.PernaDominante;
import com.pelmanager.entity.enums.Posicao;
import lombok.Data;


public record UsuarioRequestDTO(
        String nome,
        String apelido,
        String email,
        String senha,
        PernaDominante peDominante,
        Posicao posicaoPrimaria,
        Posicao posicaoSecundaria
) {}
