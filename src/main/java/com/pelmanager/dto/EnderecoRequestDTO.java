package com.pelmanager.dto;

public record EnderecoRequestDTO(
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String estado,
        String cep
) {
}
