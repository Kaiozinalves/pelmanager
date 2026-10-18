package com.pelmanager.dto;

import com.pelmanager.entity.enums.PernaDominante;
import com.pelmanager.entity.enums.Posicao;
import com.pelmanager.dto.EnderecoResponseDTO;


public record UsuarioResponseDTO(
        Long id,
        String nome,
        String apelido,
        String email,
        PernaDominante peDominante,
        Posicao posicaoPrimaria,
        Posicao posicaoSecundaria,
        EnderecoResponseDTO endereco
) {}
