package com.pelmanager.exception;

public class RodadaNaoEncontradaException extends RuntimeException {

    public RodadaNaoEncontradaException (String message){super(message);}

    public RodadaNaoEncontradaException(Long rodadaId) {
        super(String.format("Nenhuma rodada foi encontrada com o ID %d.", rodadaId));
    }
}
