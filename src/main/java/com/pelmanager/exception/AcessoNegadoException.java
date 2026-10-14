package com.pelmanager.exception;

/** O usuário não tem permissão para a ação (ex.: não é admin do grupo). Mapeada para HTTP 403. */
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
