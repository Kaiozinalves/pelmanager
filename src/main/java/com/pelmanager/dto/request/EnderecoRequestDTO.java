package com.pelmanager.dto.request;

public record EnderecoRequestDTO(
        String logradouro,
        String numero,
        String bairro,
        String cidade,
        String estado,
        String cep
) {}