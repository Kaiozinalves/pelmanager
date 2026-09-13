package com.pelmanager.dto.request;


public record GrupoPeladaRequestDTO(String nome,
                                    Long fundadorId,
                                    EnderecoRequestDTO endereco) {
}
