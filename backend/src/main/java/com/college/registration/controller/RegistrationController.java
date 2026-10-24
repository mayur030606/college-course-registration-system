package com.college.registration.controller;

import com.college.registration.dto.ApiResponse;
import com.college.registration.dto.RegistrationDTO;
import com.college.registration.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@Validated
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RegistrationDTO>>> getAllRegistrations() {
        List<RegistrationDTO> registrations = registrationService.getAllRegistrations();
        return ResponseEntity.ok(ApiResponse.success(registrations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RegistrationDTO>> getRegistrationById(@PathVariable("id") Long id) {
        RegistrationDTO registration = registrationService.getRegistrationById(id);
        return ResponseEntity.ok(ApiResponse.success(registration));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RegistrationDTO>> registerStudent(
            @Valid @RequestBody RegistrationDTO registrationDTO) {
        RegistrationDTO created = registrationService.registerStudent(registrationDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Course registered successfully", created));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<RegistrationDTO>> cancelRegistration(@PathVariable("id") Long id) {
        RegistrationDTO canceled = registrationService.cancelRegistration(id);
        return ResponseEntity.ok(ApiResponse.success("Registration canceled successfully", canceled));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<RegistrationDTO>>> getRegistrationsByStudent(
            @PathVariable("studentId") Long studentId) {
        List<RegistrationDTO> registrations = registrationService.getRegistrationsByStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success(registrations));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<RegistrationDTO>>> getRegistrationsByCourse(
            @PathVariable("courseId") Long courseId) {
        List<RegistrationDTO> registrations = registrationService.getRegistrationsByCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success(registrations));
    }
}
