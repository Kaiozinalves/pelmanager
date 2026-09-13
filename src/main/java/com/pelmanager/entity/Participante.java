package com.pelmanager.entity;

import com.pelmanager.entity.enums.Papel;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "participantes")
@Data
public class Participante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "grupo_id", nullable = false)
    private GrupoPelada grupo;

    @Enumerated(EnumType.STRING)
    @Column(name = "papel", nullable = false)
    private Papel papel;

    LocalDateTime dataEntrada;

    public boolean isAdmin() {
        return this.papel == Papel.ADMIN;
    }

}
