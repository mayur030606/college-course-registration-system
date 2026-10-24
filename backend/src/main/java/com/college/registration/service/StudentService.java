package com.college.registration.service;

import com.college.registration.dto.StudentDTO;
import com.college.registration.entity.Department;
import com.college.registration.entity.Student;
import com.college.registration.exception.DuplicateResourceException;
import com.college.registration.exception.ResourceNotFoundException;
import com.college.registration.repository.DepartmentRepository;
import com.college.registration.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;

    public StudentService(StudentRepository studentRepository, DepartmentRepository departmentRepository) {
        this.studentRepository = studentRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudentDTO getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));
        return mapToDTO(student);
    }

    public StudentDTO createStudent(StudentDTO dto) {
        if (studentRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Student", "email", dto.getEmail());
        }

        Student student = new Student();
        mapDTOToEntity(dto, student);

        Student saved = studentRepository.save(student);
        return mapToDTO(saved);
    }

    public StudentDTO updateStudent(Long id, StudentDTO dto) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        if (studentRepository.existsByEmailAndStudentIdNot(dto.getEmail(), id)) {
            throw new DuplicateResourceException("Student", "email", dto.getEmail());
        }

        mapDTOToEntity(dto, student);

        Student updated = studentRepository.save(student);
        return mapToDTO(updated);
    }

    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Student", "id", id);
        }
        studentRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> searchStudents(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllStudents();
        }
        return studentRepository.searchStudents(query.trim()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> getStudentsByDepartment(Long deptId) {
        return studentRepository.findByDepartmentDepartmentId(deptId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> getStudentsByDepartmentAndSearch(Long deptId, String query) {
        if (query == null || query.trim().isEmpty()) {
            return getStudentsByDepartment(deptId);
        }
        return studentRepository.searchStudentsByDepartment(deptId, query.trim()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private void mapDTOToEntity(StudentDTO dto, Student student) {
        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setEmail(dto.getEmail());
        student.setPhone(dto.getPhone());
        student.setDateOfBirth(dto.getDateOfBirth());

        if (dto.getGender() != null && !dto.getGender().trim().isEmpty()) {
            student.setGender(Student.Gender.valueOf(dto.getGender().toUpperCase().trim()));
        } else {
            student.setGender(null);
        }

        student.setAddress(dto.getAddress());
        student.setEnrollmentYear(dto.getEnrollmentYear());
        student.setSemester(dto.getSemester());

        if (dto.getDepartmentId() != null) {
            Department department = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", dto.getDepartmentId()));
            student.setDepartment(department);
        } else {
            student.setDepartment(null);
        }
    }

    public StudentDTO mapToDTO(Student student) {
        if (student == null) {
            return null;
        }
        Long deptId = student.getDepartment() != null ? student.getDepartment().getDepartmentId() : null;
        String deptName = student.getDepartment() != null ? student.getDepartment().getName() : null;
        String genderStr = student.getGender() != null ? student.getGender().name() : null;

        return new StudentDTO(
                student.getStudentId(),
                student.getFirstName(),
                student.getLastName(),
                student.getEmail(),
                student.getPhone(),
                student.getDateOfBirth(),
                genderStr,
                student.getAddress(),
                deptId,
                deptName,
                student.getEnrollmentYear(),
                student.getSemester()
        );
    }
}
