-- MySQL migration path for the prototype.
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  role ENUM('ADMIN', 'FACULTY', 'STUDENT') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE departments (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(120) UNIQUE NOT NULL);
CREATE TABLE sections (id INT PRIMARY KEY AUTO_INCREMENT, department_id INT NOT NULL, name VARCHAR(40) NOT NULL, year_label VARCHAR(40) NOT NULL, FOREIGN KEY (department_id) REFERENCES departments(id));
CREATE TABLE faculty (id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL UNIQUE, department_id INT NOT NULL, employee_number VARCHAR(40) UNIQUE NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (department_id) REFERENCES departments(id));
CREATE TABLE subjects (id INT PRIMARY KEY AUTO_INCREMENT, code VARCHAR(30) UNIQUE NOT NULL, name VARCHAR(120) NOT NULL, section_id INT NOT NULL, faculty_user_id INT NOT NULL, FOREIGN KEY (section_id) REFERENCES sections(id), FOREIGN KEY (faculty_user_id) REFERENCES users(id));
CREATE TABLE students (id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL UNIQUE, section_id INT NOT NULL, roll_number VARCHAR(40) NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (section_id) REFERENCES sections(id));
CREATE TABLE attendance (id BIGINT PRIMARY KEY AUTO_INCREMENT, student_id INT NOT NULL, subject_id INT NOT NULL, attendance_date DATE NOT NULL, status ENUM('present', 'absent') NOT NULL, marked_by INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY one_register_entry (student_id, subject_id, attendance_date), FOREIGN KEY (student_id) REFERENCES students(id), FOREIGN KEY (subject_id) REFERENCES subjects(id), FOREIGN KEY (marked_by) REFERENCES users(id));
CREATE TABLE attendance_corrections (id BIGINT PRIMARY KEY AUTO_INCREMENT, attendance_id BIGINT NOT NULL, current_status ENUM('present', 'absent') NOT NULL, requested_status ENUM('present', 'absent') NOT NULL, requested_by INT NOT NULL, reason VARCHAR(500) NOT NULL, status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending', reviewed_by INT NULL, review_comment VARCHAR(500) NULL, requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, reviewed_at TIMESTAMP NULL, FOREIGN KEY (attendance_id) REFERENCES attendance(id), FOREIGN KEY (requested_by) REFERENCES users(id), FOREIGN KEY (reviewed_by) REFERENCES users(id));
CREATE TABLE audit_logs (id BIGINT PRIMARY KEY AUTO_INCREMENT, actor_user_id INT NOT NULL, action VARCHAR(120) NOT NULL, entity_type VARCHAR(80) NOT NULL, entity_id BIGINT NOT NULL, old_value JSON NULL, new_value JSON NULL, reason VARCHAR(500) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (actor_user_id) REFERENCES users(id));
CREATE INDEX attendance_subject_date ON attendance(subject_id, attendance_date);
CREATE INDEX attendance_student_subject ON attendance(student_id, subject_id);
