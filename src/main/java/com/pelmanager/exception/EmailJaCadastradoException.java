package com.pelmanager.exception;

public class EmailJaCadastradoException extends RuntimeException {
    public EmailJaCadastradoException(String message) {
        super(message);
    }

    public EmailJaCadastradoException() {
        super("Este e-mail já está cadastrado.");
    }
}
