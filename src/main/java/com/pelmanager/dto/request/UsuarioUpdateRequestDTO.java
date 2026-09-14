package com.pelmanager.dto.request;

import com.pelmanager.entity.enums.PernaDominante;
import com.pelmanager.entity.enums.Posicao;

public record UsuarioUpdateRequestDTO(
        String nome,
        String apelido,
        PernaDominante peDominante,
        Posicao posicaoPrimaria,
        Posicao posicaoSecundaria
) {}
