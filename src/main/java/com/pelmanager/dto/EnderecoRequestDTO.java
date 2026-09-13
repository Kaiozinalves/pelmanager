package com.pelmanager.dto;

public record EnderecoRequestDTO(
        String logradouro,
        String numero,
        String bairro,
        String cidade,
        String estado,
        String cep
) {}