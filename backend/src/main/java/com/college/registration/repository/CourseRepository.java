package com.college.registration.repository;

import com.college.registration.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByCourseCodeContainingIgnoreCase(String courseCode);

    List<Course> findByTitleContainingIgnoreCase(String title);

    List<Course> findByDepartmentDepartmentId(Long departmentId);

    Optional<Course> findByCourseCode(String courseCode);

    boolean existsByCourseCode(String courseCode);

    boolean existsByCourseCodeAndCourseIdNot(String courseCode, Long courseId);

    @Query("SELECT c FROM Course c WHERE " +
           "LOWER(c.courseCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.instructor) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Course> searchCourses(@Param("query") String query);

    @Query("SELECT c FROM Course c WHERE c.department.departmentId = :deptId AND (" +
           "LOWER(c.courseCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.instructor) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Course> searchCoursesByDepartment(@Param("deptId") Long deptId, @Param("query") String query);
}
