package com.pelmanager.entity.enums;


public enum CategoriaVoto {
    MELHOR_JOGADOR("Melhor jogador da rodada"),
    MELHOR_ASSISTENTE("Melhor assistente da rodada"),
    BAGRE("Bagre da rodada"),
    REVELACAO("Revelação da rodada");

    private final String rotulo;

    CategoriaVoto(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
