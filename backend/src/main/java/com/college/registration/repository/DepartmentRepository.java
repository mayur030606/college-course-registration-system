package com.college.registration.repository;

import com.college.registration.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    List<Department> findByNameContainingIgnoreCase(String name);

    List<Department> findByCodeContainingIgnoreCase(String code);

    List<Department> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(String name, String code);

    Optional<Department> findByName(String name);

    Optional<Department> findByCode(String code);

    boolean existsByName(String name);

    boolean existsByCode(String code);

    boolean existsByNameAndDepartmentIdNot(String name, Long departmentId);

    boolean existsByCodeAndDepartmentIdNot(String code, Long departmentId);
}
