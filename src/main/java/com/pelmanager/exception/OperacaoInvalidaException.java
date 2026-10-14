package com.pelmanager.exception;

/** A operação conflita com o estado atual (ex.: voto duplicado, rodada no status errado). Mapeada para HTTP 409. */
public class OperacaoInvalidaException extends RuntimeException {

    public OperacaoInvalidaException(String mensagem) {
        super(mensagem);
    }
}
