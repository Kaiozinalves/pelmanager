package com.pelmanager.dto;

public record EnderecoResponseDTO(
        Long id,
        String logradouro,
        String numero,
        String bairro,
        String cidade,
        String estado,
        String cep
) {}
