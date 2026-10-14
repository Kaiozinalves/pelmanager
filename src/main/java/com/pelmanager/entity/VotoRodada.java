package com.pelmanager.entity;

import com.pelmanager.entity.enums.CategoriaVoto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Um voto de um participante, numa categoria, em uma rodada.
 * A constraint única garante no banco "um voto por pessoa e categoria" mesmo com
 * requisições concorrentes. A identidade do votante nunca é exposta nos DTOs de resultado.
 */
@Entity
@Table(
        name = "votos_rodada",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_voto_rodada_categoria_votante",
                columnNames = {"rodada_id", "categoria", "votante_id"}
        )
)
@Getter
@Setter
public class VotoRodada {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "rodada_id", nullable = false)
    private Rodada rodada;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CategoriaVoto categoria;

    @ManyToOne(optional = false)
    @JoinColumn(name = "votante_id", nullable = false)
    private Usuario votante;

    @ManyToOne(optional = false)
    @JoinColumn(name = "votado_id", nullable = false)
    private Usuario votado;

    @Column(name = "data_voto", nullable = false)
    private LocalDateTime dataVoto;
}
