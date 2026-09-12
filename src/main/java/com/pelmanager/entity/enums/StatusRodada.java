package com.pelmanager.entity.enums;

public enum StatusRodada {
    AGENDADA,
    EM_ANDAMENTO,
    FINALIZADA,
    CANCELADA;

    public boolean permiteCheckin() {
        return this == AGENDADA;
    }
}