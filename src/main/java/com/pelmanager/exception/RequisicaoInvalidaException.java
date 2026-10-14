package com.pelmanager.exception;

/** Dados da requisição inválidos (ex.: votar em si mesmo). Mapeada para HTTP 400. */
public class RequisicaoInvalidaException extends RuntimeException {

    public RequisicaoInvalidaException(String mensagem) {
        super(mensagem);
    }
}
