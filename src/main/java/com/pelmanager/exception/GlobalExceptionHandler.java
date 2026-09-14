package com.pelmanager.exception;

import com.pelmanager.dto.ErroResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler extends RuntimeException {

  @ExceptionHandler(CodigoConviteInvalidoException.class)
  public ResponseEntity<ErroResponseDTO> tratarCodigoConviteInvalido(CodigoConviteInvalidoException e) {
    ErroResponseDTO erroResponseDTO = new ErroResponseDTO(
            LocalDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            e.getMessage()
    );

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erroResponseDTO);
  }

  @ExceptionHandler(UsuarioJaParticipaException.class)
  public ResponseEntity<ErroResponseDTO> tratarUsuarioJaParticipa(UsuarioJaParticipaException ex) {
    ErroResponseDTO erro = new ErroResponseDTO(
            LocalDateTime.now(),
            HttpStatus.CONFLICT.value(),
            ex.getMessage()
    );
    return ResponseEntity.status(HttpStatus.CONFLICT).body(erro);
  }

  @ExceptionHandler(RodadaAtivaExistenteException.class)
  public ResponseEntity<ErroResponseDTO> tratarRodadaAtivaExistente(RodadaAtivaExistenteException ex) {
    ErroResponseDTO erro = new ErroResponseDTO(
            LocalDateTime.now(),
            HttpStatus.CONFLICT.value(),
            ex.getMessage()
    );
    return ResponseEntity.status(HttpStatus.CONFLICT).body(erro);
  }

  @ExceptionHandler(EmailJaCadastradoException.class)
  public ResponseEntity<ErroResponseDTO> tratarEmailJaCadastrado(EmailJaCadastradoException ex) {

    ErroResponseDTO erro = new ErroResponseDTO(
            LocalDateTime.now(),
            HttpStatus.CONFLICT.value(),
            ex.getMessage()
    );

    return ResponseEntity.status(HttpStatus.CONFLICT).body(erro);
  }

}
