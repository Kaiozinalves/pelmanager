package com.pelmanager.dto;

import lombok.Data;

import java.time.LocalDateTime;


public record GrupoPeladaResponseDTO(Long id,
                                     String nome,
                                     String codigoConvite,
                                     LocalDateTime dataCriacao,
                                     EnderecoResponseDTO endereco
                                        ) {
}
