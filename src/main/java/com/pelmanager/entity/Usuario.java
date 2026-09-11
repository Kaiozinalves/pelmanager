package com.pelmanager.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.lang.reflect.Type;

@Entity
@Table(name = "usuarios")
@Data
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    private String apelido;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Column(name = "pe_dominante", length = 4)
    private String peDominante; // DIR, ESQ ou AMBI

    @Column(name = "posicao_primaria", length = 3)
    private String posicaoPrimaria; // ZAG, MEI, ATA ou GOL

    @Column(name = "posicao_secundaria", length = 3)
    private String posicaoSecundaria;
}
