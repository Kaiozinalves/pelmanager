package com.pelmanager.exception;

/** Recurso inexistente (usuário, grupo, gol...). Mapeada para HTTP 404. */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
