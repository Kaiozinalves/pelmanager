package com.pelmanager.exception;

public class UsuarioJaParticipaException extends RuntimeException {
    public UsuarioJaParticipaException(String message) {
        super(message)
        ;
    }

    public UsuarioJaParticipaException() {
        super("Você já participa dessa pelada.");
    }
}
