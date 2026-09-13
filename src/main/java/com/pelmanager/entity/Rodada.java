package com.pelmanager.entity;

import com.pelmanager.entity.enums.StatusRodada;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

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

    LocalDate dataRodada;
    LocalTime horaRodada;
    @Enumerated(EnumType.STRING)
    StatusRodada statusRodada;

    //A rodada inicia quando o checkin é encerrado
    public boolean estaAberta() {
        return this.statusRodada != null && this.statusRodada.permiteCheckin();
    }



}
