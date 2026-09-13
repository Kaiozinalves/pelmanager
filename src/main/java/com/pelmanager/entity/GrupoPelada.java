package com.pelmanager.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "grupo_peladas")
@Data
public class GrupoPelada {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    private String codigoConvite;

    private LocalDateTime dataCriacao;


}
