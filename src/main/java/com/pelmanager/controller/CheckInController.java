package com.pelmanager.controller;

import com.pelmanager.dto.CheckInResponseDTO;
import com.pelmanager.dto.request.CheckInRequestDTO;
import com.pelmanager.service.CheckInService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkins")
public class CheckInController {
    private final CheckInService checkInService;

    public CheckInController(CheckInService checkInService) {
        this.checkInService = checkInService;
    }

    @PostMapping
    public ResponseEntity<CheckInResponseDTO> confirmarPresenca(@RequestBody CheckInRequestDTO dto) {
        CheckInResponseDTO response = checkInService.realizarCheckIn(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
