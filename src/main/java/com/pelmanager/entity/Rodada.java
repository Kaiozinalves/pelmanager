package com.pelmanager.entity;

import com.pelmanager.entity.enums.CategoriaVoto;
import com.pelmanager.entity.enums.StatusRodada;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "rodadas")
@Data
public class Rodada {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //Um grupo possui várias rodadas, mas uma rodada pertence a apenas um grupo
    @ManyToOne
    @JoinColumn(name = "grupo_id", nullable = false)
    private GrupoPelada grupo;

    private BigDecimal valorPorParticipante;

    private LocalDateTime dataCheckInFechado;

    LocalDate dataRodada;
    LocalTime horaRodada;
    @Enumerated(EnumType.STRING)
    StatusRodada statusRodada;

    // Início/fim reais (manuais) da partida e prazo final da votação.
    private LocalDateTime iniciadaEm;
    private LocalDateTime finalizadaEm;
    private LocalDateTime votacaoAte;

    // Categorias de votação habilitadas, copiadas da configuração do grupo no
    // momento em que a rodada é finalizada.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "rodada_categorias_votacao", joinColumns = @JoinColumn(name = "rodada_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", length = 30)
    private Set<CategoriaVoto> categoriasVotacao = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "enderecoAlternativo_id")
    private Endereco enderecoAlternativo;
    //Se o endereçoAlternativo for nulo, a rodada será realizada no endereço do grupo
    public Endereco getEnderecoResolvido() {
        if (this.enderecoAlternativo != null) {
            return this.enderecoAlternativo;
        }
        return this.grupo.getEndereco();
    }

    @OneToMany(mappedBy = "rodada", cascade = CascadeType.ALL)
    private List<Avaliacao> avaliacoes;

    //A rodada inicia quando o checkin é encerrado
    public boolean estaAberta() {
        return this.statusRodada != null && this.statusRodada.permiteCheckin();
    }



}
