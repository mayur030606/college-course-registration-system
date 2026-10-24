package com.college.registration.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class RegistrationDTO {

    private Long registrationId;

    @NotNull(message = "Student ID is required")
    private Long studentId;

    private String studentName;

    private String studentEmail;

    @NotNull(message = "Course ID is required")
    private Long courseId;

    private String courseCode;

    private String courseTitle;

    private String status;

    private String grade;

    private LocalDateTime registrationDate;

    public RegistrationDTO() {
    }

    public RegistrationDTO(Long registrationId, Long studentId, String studentName, String studentEmail,
                           Long courseId, String courseCode, String courseTitle, String status,
                           String grade, LocalDateTime registrationDate) {
        this.registrationId = registrationId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.courseId = courseId;
        this.courseCode = courseCode;
        this.courseTitle = courseTitle;
        this.status = status;
        this.grade = grade;
        this.registrationDate = registrationDate;
    }

    public Long getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(Long registrationId) {
        this.registrationId = registrationId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public LocalDateTime getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(LocalDateTime registrationDate) {
        this.registrationDate = registrationDate;
    }
}
