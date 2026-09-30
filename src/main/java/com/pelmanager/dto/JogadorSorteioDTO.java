package com.pelmanager.dto;

import com.pelmanager.entity.CheckIn;
import com.pelmanager.entity.enums.Posicao;

public record JogadorSorteioDTO(
        CheckIn checkIn, // Mudou de Usuario para CheckIn
        Posicao posicaoPrimaria,
        Posicao posicaoSecundaria,
        Double overall
) {}