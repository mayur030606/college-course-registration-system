package com.college.registration.service;

import com.college.registration.dto.DepartmentDTO;
import com.college.registration.entity.Department;
import com.college.registration.exception.DuplicateResourceException;
import com.college.registration.exception.ResourceNotFoundException;
import com.college.registration.repository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
        return mapToDTO(department);
    }

    public DepartmentDTO createDepartment(DepartmentDTO dto) {
        if (departmentRepository.existsByName(dto.getName())) {
            throw new DuplicateResourceException("Department", "name", dto.getName());
        }
        if (departmentRepository.existsByCode(dto.getCode())) {
            throw new DuplicateResourceException("Department", "code", dto.getCode());
        }

        Department department = new Department();
        department.setName(dto.getName());
        department.setCode(dto.getCode().toUpperCase().trim());
        department.setHeadOfDept(dto.getHeadOfDept());
        department.setDescription(dto.getDescription());

        Department saved = departmentRepository.save(department);
        return mapToDTO(saved);
    }

    public DepartmentDTO updateDepartment(Long id, DepartmentDTO dto) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));

        if (departmentRepository.existsByNameAndDepartmentIdNot(dto.getName(), id)) {
            throw new DuplicateResourceException("Department", "name", dto.getName());
        }
        if (departmentRepository.existsByCodeAndDepartmentIdNot(dto.getCode(), id)) {
            throw new DuplicateResourceException("Department", "code", dto.getCode());
        }

        department.setName(dto.getName());
        department.setCode(dto.getCode().toUpperCase().trim());
        department.setHeadOfDept(dto.getHeadOfDept());
        department.setDescription(dto.getDescription());

        Department updated = departmentRepository.save(department);
        return mapToDTO(updated);
    }

    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department", "id", id);
        }
        departmentRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<DepartmentDTO> searchDepartments(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllDepartments();
        }
        return departmentRepository.findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(query.trim(), query.trim())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public DepartmentDTO mapToDTO(Department department) {
        if (department == null) {
            return null;
        }
        return new DepartmentDTO(
                department.getDepartmentId(),
                department.getName(),
                department.getCode(),
                department.getHeadOfDept(),
                department.getDescription()
        );
    }
}
