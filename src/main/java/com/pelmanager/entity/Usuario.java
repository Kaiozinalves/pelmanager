package com.pelmanager.entity;

import com.pelmanager.entity.enums.PernaDominante;
import com.pelmanager.entity.enums.Posicao;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

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

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<Participante> gruposQueParticipa;

    @Enumerated(EnumType.STRING)
    @Column(name = "perna_dominante", length = 10)
    private PernaDominante pernaDominante;

    @Enumerated(EnumType.STRING)
    @Column(name = "posicao_primaria", length = 20)
    private Posicao posicaoPrimaria; // ZAG, MEI, ATA ou GOL

    @Enumerated(EnumType.STRING)
    @Column(name = "posicao_secundaria", length = 20)
    private Posicao posicaoSecundaria;
}
