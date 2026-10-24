package com.college.registration.dto;

import jakarta.validation.constraints.*;

public class CourseDTO {

    private Long courseId;

    @NotBlank(message = "Course code is required")
    @Size(max = 20, message = "Course code cannot exceed 20 characters")
    private String courseCode;

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;

    private String description;

    @NotNull(message = "Credits are required")
    @Min(value = 1, message = "Credits must be between 1 and 6")
    @Max(value = 6, message = "Credits must be between 1 and 6")
    private Integer credits;

    @Min(value = 1, message = "Max capacity must be at least 1")
    private Integer maxCapacity;

    private Long departmentId;

    private String departmentName;

    @Min(value = 1, message = "Semester must be between 1 and 8")
    @Max(value = 8, message = "Semester must be between 1 and 8")
    private Integer semester;

    @Size(max = 100, message = "Instructor name cannot exceed 100 characters")
    private String instructor;

    private Integer enrolledCount;

    public CourseDTO() {
    }

    public CourseDTO(Long courseId, String courseCode, String title, String description,
                     Integer credits, Integer maxCapacity, Long departmentId, String departmentName,
                     Integer semester, String instructor, Integer enrolledCount) {
        this.courseId = courseId;
        this.courseCode = courseCode;
        this.title = title;
        this.description = description;
        this.credits = credits;
        this.maxCapacity = maxCapacity;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.semester = semester;
        this.instructor = instructor;
        this.enrolledCount = enrolledCount;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public String getInstructor() {
        return instructor;
    }

    public void setInstructor(String instructor) {
        this.instructor = instructor;
    }

    public Integer getEnrolledCount() {
        return enrolledCount;
    }

    public void setEnrolledCount(Integer enrolledCount) {
        this.enrolledCount = enrolledCount;
    }
}
