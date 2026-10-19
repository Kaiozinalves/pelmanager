package com.pelmanager.exception;

public class OperacaoInvalidaException extends RuntimeException {

    public OperacaoInvalidaException(String mensagem) {
        super(mensagem);
    }
}
