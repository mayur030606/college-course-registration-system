package com.college.registration.service;

import com.college.registration.dto.RegistrationDTO;
import com.college.registration.entity.Course;
import com.college.registration.entity.Registration;
import com.college.registration.entity.Student;
import com.college.registration.exception.BadRequestException;
import com.college.registration.exception.DuplicateResourceException;
import com.college.registration.exception.ResourceNotFoundException;
import com.college.registration.repository.CourseRepository;
import com.college.registration.repository.RegistrationRepository;
import com.college.registration.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    public RegistrationService(RegistrationRepository registrationRepository,
                               StudentRepository studentRepository,
                               CourseRepository courseRepository) {
        this.registrationRepository = registrationRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
    }

    @Transactional(readOnly = true)
    public List<RegistrationDTO> getAllRegistrations() {
        return registrationRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RegistrationDTO getRegistrationById(Long id) {
        Registration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", id));
        return mapToDTO(registration);
    }

    public RegistrationDTO registerStudent(RegistrationDTO dto) {
        Student student = studentRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", dto.getStudentId()));

        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", dto.getCourseId()));

        Optional<Registration> existingOpt = registrationRepository
                .findByStudentStudentIdAndCourseCourseId(dto.getStudentId(), dto.getCourseId());

        if (existingOpt.isPresent()) {
            Registration existing = existingOpt.get();
            if (existing.getStatus() == Registration.Status.ACTIVE) {
                throw new DuplicateResourceException("Registration already exists for this student and course");
            } else {
                // Reactivate registration if previously dropped
                long activeCount = registrationRepository.countByCourseCourseIdAndStatus(course.getCourseId(), Registration.Status.ACTIVE);
                if (course.getMaxCapacity() != null && activeCount >= course.getMaxCapacity()) {
                    throw new BadRequestException("Course is at full capacity (" + course.getMaxCapacity() + ")");
                }
                existing.setStatus(Registration.Status.ACTIVE);
                existing.setRegistrationDate(LocalDateTime.now());
                if (dto.getGrade() != null) {
                    existing.setGrade(dto.getGrade());
                }
                Registration reactivated = registrationRepository.save(existing);
                return mapToDTO(reactivated);
            }
        }

        // Check course capacity
        long activeCount = registrationRepository.countByCourseCourseIdAndStatus(course.getCourseId(), Registration.Status.ACTIVE);
        if (course.getMaxCapacity() != null && activeCount >= course.getMaxCapacity()) {
            throw new BadRequestException("Course is at full capacity (" + course.getMaxCapacity() + ")");
        }

        Registration registration = new Registration();
        registration.setStudent(student);
        registration.setCourse(course);
        registration.setRegistrationDate(LocalDateTime.now());
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            registration.setStatus(Registration.Status.valueOf(dto.getStatus().toUpperCase().trim()));
        } else {
            registration.setStatus(Registration.Status.ACTIVE);
        }
        registration.setGrade(dto.getGrade());

        Registration saved = registrationRepository.save(registration);
        return mapToDTO(saved);
    }

    public RegistrationDTO cancelRegistration(Long id) {
        Registration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", id));

        registration.setStatus(Registration.Status.DROPPED);
        Registration updated = registrationRepository.save(registration);
        return mapToDTO(updated);
    }

    @Transactional(readOnly = true)
    public List<RegistrationDTO> getRegistrationsByStudent(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student", "id", studentId);
        }
        return registrationRepository.findByStudentStudentId(studentId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RegistrationDTO> getRegistrationsByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", "id", courseId);
        }
        return registrationRepository.findByCourseCourseId(courseId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public RegistrationDTO mapToDTO(Registration registration) {
        if (registration == null) {
            return null;
        }

        Long studentId = registration.getStudent() != null ? registration.getStudent().getStudentId() : null;
        String studentName = registration.getStudent() != null
                ? registration.getStudent().getFirstName() + " " + registration.getStudent().getLastName()
                : null;
        String studentEmail = registration.getStudent() != null ? registration.getStudent().getEmail() : null;

        Long courseId = registration.getCourse() != null ? registration.getCourse().getCourseId() : null;
        String courseCode = registration.getCourse() != null ? registration.getCourse().getCourseCode() : null;
        String courseTitle = registration.getCourse() != null ? registration.getCourse().getTitle() : null;
        String status = registration.getStatus() != null ? registration.getStatus().name() : null;

        return new RegistrationDTO(
                registration.getRegistrationId(),
                studentId,
                studentName,
                studentEmail,
                courseId,
                courseCode,
                courseTitle,
                status,
                registration.getGrade(),
                registration.getRegistrationDate()
        );
    }
}
