-- ============================================================
-- College Course Registration System - Database Schema
-- ============================================================
-- Run this script in MySQL Workbench or mysql CLI to set up
-- the database. This script is idempotent (uses IF NOT EXISTS).
-- ============================================================

CREATE DATABASE IF NOT EXISTS CollegeRegistration
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE CollegeRegistration;

-- ============================================================
-- 1. Department Table
-- ============================================================
CREATE TABLE IF NOT EXISTS department (
    department_id   BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    code            VARCHAR(10)  NOT NULL UNIQUE,
    head_of_dept    VARCHAR(100),
    description     TEXT,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. Student Table
-- ============================================================
CREATE TABLE IF NOT EXISTS student (
    student_id      BIGINT       AUTO_INCREMENT PRIMARY KEY,
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    phone           VARCHAR(15),
    date_of_birth   DATE,
    gender          ENUM('MALE', 'FEMALE', 'OTHER'),
    address         TEXT,
    department_id   BIGINT,
    enrollment_year INT,
    semester        INT          CHECK (semester BETWEEN 1 AND 8),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_department
        FOREIGN KEY (department_id) REFERENCES department(department_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_student_email (email),
    INDEX idx_student_department (department_id),
    INDEX idx_student_name (first_name, last_name)
) ENGINE=InnoDB;

-- ============================================================
-- 3. Course Table
-- ============================================================
CREATE TABLE IF NOT EXISTS course (
    course_id       BIGINT       AUTO_INCREMENT PRIMARY KEY,
    course_code     VARCHAR(20)  NOT NULL UNIQUE,
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    credits         INT          NOT NULL CHECK (credits BETWEEN 1 AND 6),
    max_capacity    INT          DEFAULT 60,
    department_id   BIGINT,
    semester        INT          CHECK (semester BETWEEN 1 AND 8),
    instructor      VARCHAR(100),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_department
        FOREIGN KEY (department_id) REFERENCES department(department_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_course_code (course_code),
    INDEX idx_course_department (department_id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. Registration Table (Student ↔ Course many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS registration (
    registration_id BIGINT       AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT       NOT NULL,
    course_id       BIGINT       NOT NULL,
    registration_date TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('ACTIVE', 'DROPPED', 'COMPLETED') DEFAULT 'ACTIVE',
    grade           VARCHAR(5),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reg_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reg_course
        FOREIGN KEY (course_id) REFERENCES course(course_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_student_course
        UNIQUE (student_id, course_id),
    INDEX idx_reg_student (student_id),
    INDEX idx_reg_course (course_id)
) ENGINE=InnoDB;

-- ============================================================
-- 5. Admin Table (for Owner / admin login)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin (
    admin_id        BIGINT       AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    role            ENUM('OWNER', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_username (username)
) ENGINE=InnoDB;

-- ============================================================
-- Sample Data (optional - safe to re-run)
-- ============================================================

-- Departments
INSERT IGNORE INTO department (name, code, head_of_dept, description) VALUES
('Computer Science', 'CS', 'Dr. Rajesh Kumar', 'Department of Computer Science and Engineering'),
('Electronics', 'EC', 'Dr. Priya Sharma', 'Department of Electronics and Communication'),
('Mechanical', 'ME', 'Dr. Anil Verma', 'Department of Mechanical Engineering'),
('Civil', 'CE', 'Dr. Sunita Patel', 'Department of Civil Engineering'),
('Mathematics', 'MA', 'Dr. Vikram Singh', 'Department of Mathematics');

-- Courses
INSERT IGNORE INTO course (course_code, title, credits, max_capacity, department_id, semester, instructor) VALUES
('CS101', 'Introduction to Programming', 4, 60, 1, 1, 'Prof. Amit Shah'),
('CS201', 'Data Structures', 4, 50, 1, 3, 'Prof. Neha Gupta'),
('CS301', 'Database Management Systems', 3, 45, 1, 5, 'Prof. Rajesh Kumar'),
('CS401', 'Operating Systems', 4, 40, 1, 5, 'Prof. Kavita Iyer'),
('EC101', 'Basic Electronics', 3, 55, 2, 1, 'Prof. Suresh Reddy'),
('EC201', 'Digital Circuits', 4, 45, 2, 3, 'Prof. Meena Joshi'),
('ME101', 'Engineering Mechanics', 3, 60, 3, 1, 'Prof. Ramesh Patil'),
('ME201', 'Thermodynamics', 4, 50, 3, 3, 'Prof. Deepak Nair'),
('CE101', 'Surveying', 3, 55, 4, 1, 'Prof. Anita Das'),
('MA101', 'Calculus', 4, 70, 5, 1, 'Prof. Vikram Singh');

-- Students
INSERT IGNORE INTO student (first_name, last_name, email, phone, date_of_birth, gender, department_id, enrollment_year, semester) VALUES
('Aarav', 'Patel', 'aarav.patel@college.edu', '9876543210', '2004-03-15', 'MALE', 1, 2023, 3),
('Diya', 'Sharma', 'diya.sharma@college.edu', '9876543211', '2004-07-22', 'FEMALE', 1, 2023, 3),
('Vihaan', 'Kumar', 'vihaan.kumar@college.edu', '9876543212', '2003-11-08', 'MALE', 2, 2022, 5),
('Ananya', 'Singh', 'ananya.singh@college.edu', '9876543213', '2004-01-30', 'FEMALE', 3, 2023, 3),
('Arjun', 'Reddy', 'arjun.reddy@college.edu', '9876543214', '2003-05-14', 'MALE', 1, 2022, 5);

-- Registrations
INSERT IGNORE INTO registration (student_id, course_id, status) VALUES
(1, 1, 'COMPLETED'),
(1, 2, 'ACTIVE'),
(2, 1, 'COMPLETED'),
(2, 2, 'ACTIVE'),
(3, 5, 'ACTIVE'),
(3, 6, 'ACTIVE'),
(4, 7, 'ACTIVE'),
(5, 3, 'ACTIVE'),
(5, 4, 'ACTIVE');
