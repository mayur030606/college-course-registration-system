package com.college.registration.service;

import com.college.registration.dto.CourseDTO;
import com.college.registration.entity.Course;
import com.college.registration.entity.Department;
import com.college.registration.entity.Registration;
import com.college.registration.exception.DuplicateResourceException;
import com.college.registration.exception.ResourceNotFoundException;
import com.college.registration.repository.CourseRepository;
import com.college.registration.repository.DepartmentRepository;
import com.college.registration.repository.RegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final RegistrationRepository registrationRepository;

    public CourseService(CourseRepository courseRepository,
                         DepartmentRepository departmentRepository,
                         RegistrationRepository registrationRepository) {
        this.courseRepository = courseRepository;
        this.departmentRepository = departmentRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CourseDTO getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
        return mapToDTO(course);
    }

    public CourseDTO createCourse(CourseDTO dto) {
        String code = dto.getCourseCode().toUpperCase().trim();
        if (courseRepository.existsByCourseCode(code)) {
            throw new DuplicateResourceException("Course", "courseCode", code);
        }

        Course course = new Course();
        mapDTOToEntity(dto, course);
        course.setCourseCode(code);

        Course saved = courseRepository.save(course);
        return mapToDTO(saved);
    }

    public CourseDTO updateCourse(Long id, CourseDTO dto) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        String code = dto.getCourseCode().toUpperCase().trim();
        if (courseRepository.existsByCourseCodeAndCourseIdNot(code, id)) {
            throw new DuplicateResourceException("Course", "courseCode", code);
        }

        mapDTOToEntity(dto, course);
        course.setCourseCode(code);

        Course updated = courseRepository.save(course);
        return mapToDTO(updated);
    }

    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course", "id", id);
        }
        courseRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<CourseDTO> searchCourses(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllCourses();
        }
        return courseRepository.searchCourses(query.trim()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseDTO> getCoursesByDepartment(Long deptId) {
        return courseRepository.findByDepartmentDepartmentId(deptId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseDTO> getCoursesByDepartmentAndSearch(Long deptId, String query) {
        if (query == null || query.trim().isEmpty()) {
            return getCoursesByDepartment(deptId);
        }
        return courseRepository.searchCoursesByDepartment(deptId, query.trim()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private void mapDTOToEntity(CourseDTO dto, Course course) {
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setCredits(dto.getCredits());
        course.setMaxCapacity(dto.getMaxCapacity() != null ? dto.getMaxCapacity() : 60);
        course.setSemester(dto.getSemester());
        course.setInstructor(dto.getInstructor());

        if (dto.getDepartmentId() != null) {
            Department department = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", dto.getDepartmentId()));
            course.setDepartment(department);
        } else {
            course.setDepartment(null);
        }
    }

    public CourseDTO mapToDTO(Course course) {
        if (course == null) {
            return null;
        }
        Long deptId = course.getDepartment() != null ? course.getDepartment().getDepartmentId() : null;
        String deptName = course.getDepartment() != null ? course.getDepartment().getName() : null;
        int enrolled = (int) registrationRepository.countByCourseCourseIdAndStatus(course.getCourseId(), Registration.Status.ACTIVE);

        return new CourseDTO(
                course.getCourseId(),
                course.getCourseCode(),
                course.getTitle(),
                course.getDescription(),
                course.getCredits(),
                course.getMaxCapacity(),
                deptId,
                deptName,
                course.getSemester(),
                course.getInstructor(),
                enrolled
        );
    }
}
