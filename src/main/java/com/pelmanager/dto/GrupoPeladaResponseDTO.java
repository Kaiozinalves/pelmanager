package com.pelmanager.dto;

import java.time.LocalDateTime;


public record GrupoPeladaResponseDTO(Long id,
                                     String nome,
                                     String codigoConvite,
                                     LocalDateTime dataCriacao,
                                     EnderecoResponseDTO endereco
                                        ) {
}
