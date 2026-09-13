package com.pelmanager.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "enderecos")
@Data
public class Endereco {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String logradouro;
    private String numero;
    private String bairro;
    private String cidade;
    private String estado;
    private String cep;


}
