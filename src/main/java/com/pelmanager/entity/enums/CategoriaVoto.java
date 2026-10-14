package com.pelmanager.entity.enums;

/**
 * Categorias de votação disponíveis ao fim de uma rodada.
 * Cada grupo escolhe quais ficam ativas (ver GrupoPelada#categoriasAtivas).
 */
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
