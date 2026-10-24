package com.college.registration.dto;

public class DashboardStatsDTO {

    private long totalStudents;
    private long totalCourses;
    private long totalDepartments;
    private long totalRegistrations;
    private long activeRegistrations;

    public DashboardStatsDTO() {
    }

    public DashboardStatsDTO(long totalStudents, long totalCourses, long totalDepartments,
                             long totalRegistrations, long activeRegistrations) {
        this.totalStudents = totalStudents;
        this.totalCourses = totalCourses;
        this.totalDepartments = totalDepartments;
        this.totalRegistrations = totalRegistrations;
        this.activeRegistrations = activeRegistrations;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalCourses() {
        return totalCourses;
    }

    public void setTotalCourses(long totalCourses) {
        this.totalCourses = totalCourses;
    }

    public long getTotalDepartments() {
        return totalDepartments;
    }

    public void setTotalDepartments(long totalDepartments) {
        this.totalDepartments = totalDepartments;
    }

    public long getTotalRegistrations() {
        return totalRegistrations;
    }

    public void setTotalRegistrations(long totalRegistrations) {
        this.totalRegistrations = totalRegistrations;
    }

    public long getActiveRegistrations() {
        return activeRegistrations;
    }

    public void setActiveRegistrations(long activeRegistrations) {
        this.activeRegistrations = activeRegistrations;
    }
}
