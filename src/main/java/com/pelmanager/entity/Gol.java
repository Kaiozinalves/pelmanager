package com.pelmanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Evento de gol de uma rodada. A assistência é um atributo opcional do gol
 * (não existe assistência sem gol), então artilharia = gols por autor e
 * assistências = gols por assistente.
 */
@Entity
@Table(name = "gols_rodada")
@Getter
@Setter
public class Gol {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "rodada_id", nullable = false)
    private Rodada rodada;

    @ManyToOne(optional = false)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    @ManyToOne
    @JoinColumn(name = "assistente_id")
    private Usuario assistente;

    @ManyToOne(optional = false)
    @JoinColumn(name = "registrado_por_id", nullable = false)
    private Usuario registradoPor;

    @Column(name = "registrado_em", nullable = false)
    private LocalDateTime registradoEm;

    @ManyToOne
    @JoinColumn(name = "corrigido_por_id")
    private Usuario corrigidoPor;

    @Column(name = "corrigido_em")
    private LocalDateTime corrigidoEm;
}
