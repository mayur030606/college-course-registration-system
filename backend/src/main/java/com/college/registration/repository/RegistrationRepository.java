package com.college.registration.repository;

import com.college.registration.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByStudentStudentId(Long studentId);

    List<Registration> findByCourseCourseId(Long courseId);

    Optional<Registration> findByStudentStudentIdAndCourseCourseId(Long studentId, Long courseId);

    boolean existsByStudentStudentIdAndCourseCourseId(Long studentId, Long courseId);

    long countByCourseCourseId(Long courseId);

    long countByCourseCourseIdAndStatus(Long courseId, Registration.Status status);

    long countByStatus(Registration.Status status);
}
