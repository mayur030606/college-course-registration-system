package com.college.registration.service;

import com.college.registration.dto.DashboardStatsDTO;
import com.college.registration.entity.Registration;
import com.college.registration.repository.CourseRepository;
import com.college.registration.repository.DepartmentRepository;
import com.college.registration.repository.RegistrationRepository;
import com.college.registration.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final RegistrationRepository registrationRepository;

    public DashboardService(StudentRepository studentRepository,
                            CourseRepository courseRepository,
                            DepartmentRepository departmentRepository,
                            RegistrationRepository registrationRepository) {
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.departmentRepository = departmentRepository;
        this.registrationRepository = registrationRepository;
    }

    public DashboardStatsDTO getStats() {
        long totalStudents = studentRepository.count();
        long totalCourses = courseRepository.count();
        long totalDepartments = departmentRepository.count();
        long totalRegistrations = registrationRepository.count();
        long activeRegistrations = registrationRepository.countByStatus(Registration.Status.ACTIVE);

        return new DashboardStatsDTO(
                totalStudents,
                totalCourses,
                totalDepartments,
                totalRegistrations,
                activeRegistrations
        );
    }
}
