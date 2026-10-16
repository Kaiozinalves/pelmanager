package com.pelmanager.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;


@Entity
@Table(name = "free_agents")
@Data
public class FreeAgent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(nullable = false)
    private String cidade;

    @Column(length = 2)
    private String estado;

    private String bairro;

    @Column(name = "data_ativacao")
    private LocalDateTime dataAtivacao;
}
