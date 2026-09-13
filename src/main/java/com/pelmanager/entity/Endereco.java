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

    @Column(nullable = false)
    private String logradouro;

    private String numero;

    private String bairro;

    @Column(nullable = false)
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(length = 9)
    private String cep;

    public String enderecoCompleto() {
        return String.format("%s, %s - %s, %s - %s, CEP: %s",
                this.logradouro, this.numero, this.bairro, this.cidade, this.estado, this.cep);
    }
}