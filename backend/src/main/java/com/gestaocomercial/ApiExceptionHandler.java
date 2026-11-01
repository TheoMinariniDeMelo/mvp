package com.gestaocomercial;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    ResponseEntity<Map<String, String>> invalidRequest(Exception exception) {
        return ResponseEntity.badRequest().body(Map.of("error", "Dados da requisição inválidos."));
    }

    @ExceptionHandler(CommercialService.NotFoundException.class)
    ResponseEntity<Map<String, String>> notFound(CommercialService.NotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", exception.getMessage()));
    }

    @ExceptionHandler(CommercialService.ConflictException.class)
    ResponseEntity<Map<String, String>> conflict(CommercialService.ConflictException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", exception.getMessage()));
    }
}
