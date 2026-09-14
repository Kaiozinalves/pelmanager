package com.pelmanager.exception;

public class CodigoConviteInvalidoException extends RuntimeException {

    public CodigoConviteInvalidoException() {
        super("O código de convite informado é inválido, não existe ou já expirou.");
    }
}