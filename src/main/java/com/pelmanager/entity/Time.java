package com.pelmanager.entity;

import jakarta.persistence.Entity;
import lombok.Data;

import java.util.List;
import jakarta.persistence.*;

@Entity
@Table(name = "times")
@Data
public class Time {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "rodada_id", nullable = false)
    private Rodada rodada;

    private String nome;

    @OneToMany(mappedBy = "time")
    private List<CheckIn> jogadores;

    public boolean estaCompleto() {
        return this.jogadores != null && this.jogadores.size() >= 5;
    }
}