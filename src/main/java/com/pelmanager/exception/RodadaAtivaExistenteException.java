package com.pelmanager.exception;

public class RodadaAtivaExistenteException extends RuntimeException {
    public RodadaAtivaExistenteException(String message) {
        super(message);
    }

    public RodadaAtivaExistenteException() {
        super("Não é possível agendar. Já existe uma rodada em andamento ou agendada para este grupo.");
    }
}
