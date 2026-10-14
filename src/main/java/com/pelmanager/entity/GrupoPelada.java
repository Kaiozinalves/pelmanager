package com.pelmanager.entity;

import com.pelmanager.entity.enums.CategoriaVoto;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "grupo_peladas")
@Data
public class GrupoPelada {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @OneToMany(mappedBy = "grupo", cascade = CascadeType.ALL)
    private List<Participante> participantes;

    private String codigoConvite;

    private LocalDateTime dataCriacao;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "endereco_id")
    private Endereco endereco;

    // Configuração da votação de fim de rodada. O "bagre" nasce desligado: o rótulo
    // pode ser engraçado entre amigos, mas constrangedor em outros contextos.
    @Column(name = "categoria_melhor_ativa", nullable = false, columnDefinition = "boolean default true")
    private boolean categoriaMelhorAtiva = true;

    @Column(name = "categoria_assistente_ativa", nullable = false, columnDefinition = "boolean default true")
    private boolean categoriaAssistenteAtiva = true;

    @Column(name = "categoria_bagre_ativa", nullable = false, columnDefinition = "boolean default false")
    private boolean categoriaBagreAtiva = false;

    @Column(name = "categoria_revelacao_ativa", nullable = false, columnDefinition = "boolean default true")
    private boolean categoriaRevelacaoAtiva = true;

    // Quantas horas a votação fica aberta depois que a rodada é finalizada.
    @Column(name = "prazo_avaliacao_horas", nullable = false, columnDefinition = "integer default 24")
    private int prazoAvaliacaoHoras = 24;

    public Set<CategoriaVoto> categoriasAtivas() {
        Set<CategoriaVoto> ativas = EnumSet.noneOf(CategoriaVoto.class);
        if (categoriaMelhorAtiva) ativas.add(CategoriaVoto.MELHOR_JOGADOR);
        if (categoriaAssistenteAtiva) ativas.add(CategoriaVoto.MELHOR_ASSISTENTE);
        if (categoriaBagreAtiva) ativas.add(CategoriaVoto.BAGRE);
        return ativas;
    }
}
