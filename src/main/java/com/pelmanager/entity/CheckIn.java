package com.pelmanager.entity;

import com.pelmanager.entity.enums.StatusCheckIn;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "checkins")
@Data
public class CheckIn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "rodada_id", nullable = false)
    private Rodada rodada;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "time_id")
    private Time time;

    private LocalDateTime dataHoraCheckin;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_checkin", nullable = false)
    private StatusCheckIn status;
}

