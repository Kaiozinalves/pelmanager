package com.pelmanager.exception;

public class CheckInDuplicadoException extends RuntimeException {
    public CheckInDuplicadoException(String message) {
        super(message);
    }

    public CheckInDuplicadoException(){
        super("Você já realizou o check-in para esta rodada.");
    }
}
