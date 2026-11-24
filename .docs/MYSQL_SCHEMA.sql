-- iPortal Campus target MySQL schema (design-only)
-- This file is intentionally documentation-level and is not executed against production.

CREATE TABLE schools (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100) NULL,
    code VARCHAR(50) NULL,
    address TEXT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    website VARCHAR(255) NULL,
    status ENUM('active','inactive','pending','suspended') NOT NULL DEFAULT 'active',
    subscription_status ENUM('trial','active','expired','cancelled') NOT NULL DEFAULT 'trial',
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    UNIQUE KEY uq_schools_code (code)
);

CREATE TABLE roles (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    is_platform_role TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_roles_slug (slug)
);

CREATE TABLE permissions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    group_name VARCHAR(100) NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_permissions_slug (slug)
);

CREATE TABLE role_permissions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY uq_role_permission (role_id, permission_id)
);

CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NULL,
    password_hash VARCHAR(255) NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    status ENUM('active','invited','disabled','suspended') NOT NULL DEFAULT 'active',
    email_verified_at DATETIME NULL,
    password_changed_at DATETIME NULL,
    must_change_password TINYINT(1) NOT NULL DEFAULT 0,
    login_pin VARCHAR(50) NULL,
    platform_pin VARCHAR(50) NULL,
    active_school_id BIGINT UNSIGNED NULL,
    active_role VARCHAR(50) NULL,
    is_school_admin TINYINT(1) NOT NULL DEFAULT 0,
    is_super_admin TINYINT(1) NOT NULL DEFAULT 0,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_login_pin (login_pin),
    UNIQUE KEY uq_users_platform_pin (platform_pin),
    CONSTRAINT fk_users_active_school FOREIGN KEY (active_school_id) REFERENCES schools(id) ON DELETE SET NULL
);

CREATE TABLE user_sessions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NULL,
    login_ip VARCHAR(64) NULL,
    user_agent TEXT NULL,
    expires_at DATETIME NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE school_memberships (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    school_id BIGINT UNSIGNED NOT NULL,
    role VARCHAR(50) NOT NULL,
    status ENUM('active','inactive','invited','suspended') NOT NULL DEFAULT 'active',
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    login_pin VARCHAR(50) NULL,
    user_pin VARCHAR(50) NULL,
    user_email VARCHAR(255) NULL,
    user_name VARCHAR(255) NULL,
    permissions JSON NULL,
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    UNIQUE KEY uq_membership_user_school_role (user_id, school_id, role),
    KEY idx_memberships_school_role_status (school_id, role, status),
    KEY idx_memberships_user_email (user_email),
    KEY idx_memberships_login_pin (login_pin),
    CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_membership_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE students (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    admission_number VARCHAR(50) NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    gender ENUM('male','female','other','prefer_not_to_say') NULL,
    date_of_birth DATE NULL,
    status ENUM('active','inactive','graduated','transferred','suspended') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    UNIQUE KEY uq_students_school_admission (school_id, admission_number),
    KEY idx_students_school_user (school_id, user_id),
    CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE teachers (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    staff_number VARCHAR(50) NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    UNIQUE KEY uq_teachers_school_staff (school_id, staff_number),
    KEY idx_teachers_school_user (school_id, user_id),
    CONSTRAINT fk_teachers_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE parent_guardians (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    KEY idx_parents_school_user (school_id, user_id),
    CONSTRAINT fk_parents_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_parents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE guardian_relationships (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    guardian_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'guardian',
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_guardian_student (school_id, guardian_id, student_id),
    KEY idx_guardian_student (student_id),
    CONSTRAINT fk_guardian_relationship_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_guardian_relationship_guardian FOREIGN KEY (guardian_id) REFERENCES parent_guardians(id) ON DELETE CASCADE,
    CONSTRAINT fk_guardian_relationship_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE academic_sessions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status ENUM('draft','active','closed') NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_sessions_school (school_id),
    CONSTRAINT fk_sessions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE terms (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    academic_session_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status ENUM('draft','active','closed') NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_terms_session (academic_session_id),
    CONSTRAINT fk_terms_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_terms_session FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE
);

CREATE TABLE school_classes (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    academic_session_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NULL,
    level VARCHAR(50) NULL,
    arm VARCHAR(20) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    UNIQUE KEY uq_classes_session_name (school_id, academic_session_id, name),
    KEY idx_classes_school (school_id),
    CONSTRAINT fk_classes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_classes_session FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE
);

CREATE TABLE subjects (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NULL,
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    UNIQUE KEY uq_subjects_school_name (school_id, name),
    CONSTRAINT fk_subjects_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE teacher_assignments (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    teacher_id BIGINT UNSIGNED NOT NULL,
    subject_id BIGINT UNSIGNED NOT NULL,
    class_id BIGINT UNSIGNED NOT NULL,
    academic_session_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_teacher_assignment (teacher_id, subject_id, class_id, academic_session_id),
    KEY idx_teacher_assignments_school (school_id),
    CONSTRAINT fk_teacher_assignment_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_assignment_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_assignment_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_assignment_class FOREIGN KEY (class_id) REFERENCES school_classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher_assignment_session FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE
);

CREATE TABLE student_class_memberships (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    class_id BIGINT UNSIGNED NOT NULL,
    academic_session_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_class (student_id, class_id, academic_session_id),
    KEY idx_student_class_school (school_id),
    CONSTRAINT fk_student_class_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_class_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_class_class FOREIGN KEY (class_id) REFERENCES school_classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_class_session FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE
);

CREATE TABLE grading_schemes (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    UNIQUE KEY uq_grading_scheme_name (school_id, name),
    CONSTRAINT fk_grading_scheme_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE grading_scheme_components (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    grading_scheme_id BIGINT UNSIGNED NOT NULL,
    grade_label VARCHAR(20) NOT NULL,
    minimum_score DECIMAL(5,2) NOT NULL,
    maximum_score DECIMAL(5,2) NOT NULL,
    remark VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_grade_component_scheme FOREIGN KEY (grading_scheme_id) REFERENCES grading_schemes(id) ON DELETE CASCADE
);

CREATE TABLE results (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    teacher_id BIGINT UNSIGNED NULL,
    subject_id BIGINT UNSIGNED NOT NULL,
    class_id BIGINT UNSIGNED NULL,
    term_id BIGINT UNSIGNED NULL,
    score DECIMAL(6,2) NOT NULL,
    grade VARCHAR(20) NULL,
    remarks TEXT NULL,
    recorded_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_results_student_subject (student_id, subject_id),
    CONSTRAINT fk_results_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_results_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_results_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    CONSTRAINT fk_results_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_results_class FOREIGN KEY (class_id) REFERENCES school_classes(id) ON DELETE SET NULL,
    CONSTRAINT fk_results_term FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL
);

CREATE TABLE attendance (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    class_id BIGINT UNSIGNED NULL,
    teacher_id BIGINT UNSIGNED NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present','absent','late','excused') NOT NULL,
    remarks TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance_student_date (student_id, attendance_date),
    KEY idx_attendance_school_date (school_id, attendance_date),
    CONSTRAINT fk_attendance_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_class FOREIGN KEY (class_id) REFERENCES school_classes(id) ON DELETE SET NULL,
    CONSTRAINT fk_attendance_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

CREATE TABLE assignments (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    teacher_id BIGINT UNSIGNED NOT NULL,
    class_id BIGINT UNSIGNED NOT NULL,
    subject_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    due_date DATETIME NULL,
    status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    KEY idx_assignments_school_teacher (school_id, teacher_id),
    CONSTRAINT fk_assignments_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_class FOREIGN KEY (class_id) REFERENCES school_classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE assignment_submissions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    assignment_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    content TEXT NULL,
    file_path VARCHAR(500) NULL,
    status ENUM('draft','submitted','graded','late') NOT NULL DEFAULT 'draft',
    score DECIMAL(6,2) NULL,
    submitted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_submission_student_assignment (assignment_id, student_id),
    CONSTRAINT fk_submission_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE term_remarks (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    term_id BIGINT UNSIGNED NOT NULL,
    teacher_id BIGINT UNSIGNED NULL,
    comment TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_term_remark_student_term (student_id, term_id),
    CONSTRAINT fk_term_remark_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_term_remark_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_term_remark_term FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    CONSTRAINT fk_term_remark_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

CREATE TABLE fee_categories (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fee_category_school_name (school_id, name),
    CONSTRAINT fk_fee_category_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE fee_structures (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    fee_category_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    auto_apply TINYINT(1) NOT NULL DEFAULT 0,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_fee_structure_school_category (school_id, fee_category_id),
    CONSTRAINT fk_fee_structure_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_fee_structure_category FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE CASCADE
);

CREATE TABLE student_charges (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    fee_structure_id BIGINT UNSIGNED NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    status ENUM('pending','partial','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
    due_date DATE NULL,
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_student_charge_student_status (student_id, status),
    CONSTRAINT fk_student_charge_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_charge_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_charge_structure FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE SET NULL
);

CREATE TABLE payments (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NULL,
    user_id BIGINT UNSIGNED NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    payment_method VARCHAR(50) NOT NULL,
    gateway VARCHAR(50) NULL,
    status ENUM('pending','success','failed','refunded','reversed') NOT NULL DEFAULT 'pending',
    reference_number VARCHAR(100) NULL,
    paid_at DATETIME NULL,
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    unique key uq_payments_reference (reference_number),
    KEY idx_payments_school_status (school_id, status),
    CONSTRAINT fk_payment_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE payment_allocations (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    payment_id BIGINT UNSIGNED NOT NULL,
    student_charge_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_payment_allocation (payment_id, student_charge_id),
    CONSTRAINT fk_payment_alloc_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_alloc_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_alloc_charge FOREIGN KEY (student_charge_id) REFERENCES student_charges(id) ON DELETE CASCADE
);

CREATE TABLE online_payment_transactions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    payment_id BIGINT UNSIGNED NULL,
    gateway VARCHAR(50) NOT NULL,
    gateway_reference VARCHAR(255) NULL,
    status ENUM('initiated','pending','success','failed','cancelled') NOT NULL DEFAULT 'initiated',
    request_payload JSON NULL,
    response_payload JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_online_tx_gateway_ref (gateway_reference),
    CONSTRAINT fk_online_tx_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_online_tx_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

CREATE TABLE receipts (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    payment_id BIGINT UNSIGNED NOT NULL,
    receipt_number VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NULL,
    issued_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_receipt_number (receipt_number),
    CONSTRAINT fk_receipt_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_receipt_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE TABLE subscriptions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NULL,
    plan_name VARCHAR(100) NOT NULL,
    status ENUM('trial','active','expired','cancelled') NOT NULL DEFAULT 'trial',
    start_date DATETIME NOT NULL,
    end_date DATETIME NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_subscription_school_status (school_id, status),
    CONSTRAINT fk_subscription_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

CREATE TABLE platform_transactions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NULL,
    tx_type VARCHAR(50) NOT NULL,
    reference VARCHAR(100) NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    status ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_platform_tx_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

CREATE TABLE payment_gateway_configs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NULL,
    gateway_name VARCHAR(100) NOT NULL,
    public_key VARCHAR(255) NULL,
    secret_key_ciphertext TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 0,
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_gateway_config_school_name (school_id, gateway_name),
    CONSTRAINT fk_gateway_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE announcements (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    audience ENUM('all','students','teachers','parents','school_admin') NOT NULL DEFAULT 'all',
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL DEFAULT NULL,
    KEY idx_announcements_school_status (school_id, status),
    CONSTRAINT fk_announcement_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_at DATETIME NULL,
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_notifications_user_unread (user_id, read_at),
    CONSTRAINT fk_notification_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notification_recipients (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    notification_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    read_at DATETIME NULL,
    delivered_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notification_recipient (notification_id, user_id),
    CONSTRAINT fk_noti_recipient_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    CONSTRAINT fk_noti_recipient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE job_vacancies (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('draft','open','closed') NOT NULL DEFAULT 'draft',
    closing_date DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_vacancy_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

CREATE TABLE job_applications (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    job_vacancy_id BIGINT UNSIGNED NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    resume_path VARCHAR(500) NULL,
    status ENUM('submitted','reviewed','accepted','rejected') NOT NULL DEFAULT 'submitted',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_application_vacancy FOREIGN KEY (job_vacancy_id) REFERENCES job_vacancies(id) ON DELETE CASCADE
);

CREATE TABLE admission_applications (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    status ENUM('draft','submitted','under_review','approved','rejected','paid') NOT NULL DEFAULT 'draft',
    application_data JSON NULL,
    submitted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_admission_school_status (school_id, status),
    CONSTRAINT fk_admission_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE documents (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NULL,
    owner_model VARCHAR(100) NULL,
    owner_id BIGINT UNSIGNED NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_disk VARCHAR(50) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NULL,
    size_bytes BIGINT UNSIGNED NULL,
    uploaded_by BIGINT UNSIGNED NULL,
    status ENUM('active','archived','deleted') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_documents_owner (owner_model, owner_id),
    CONSTRAINT fk_document_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL,
    CONSTRAINT fk_document_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE admission_documents (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    admission_application_id BIGINT UNSIGNED NOT NULL,
    document_id BIGINT UNSIGNED NOT NULL,
    verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_admission_document (admission_application_id, document_id),
    CONSTRAINT fk_admission_doc_app FOREIGN KEY (admission_application_id) REFERENCES admission_applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_admission_doc_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    school_id BIGINT UNSIGNED NULL,
    user_id BIGINT UNSIGNED NULL,
    actor_user_id BIGINT UNSIGNED NULL,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id BIGINT UNSIGNED NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(64) NULL,
    user_agent TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_audit_school_type (school_id, event_type),
    KEY idx_audit_entity (entity_type, entity_id),
    CONSTRAINT fk_audit_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE system_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    level VARCHAR(20) NOT NULL,
    source VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    context JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_active_school ON users(active_school_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_is_school_admin ON users(is_school_admin);
CREATE INDEX idx_users_is_super_admin ON users(is_super_admin);
CREATE INDEX idx_school_memberships_user ON school_memberships(user_id, school_id, status);
CREATE INDEX idx_student_charges_status ON student_charges(status);
CREATE INDEX idx_payments_student ON payments(student_id, status);
CREATE INDEX idx_results_student_term ON results(student_id, term_id);
CREATE INDEX idx_announcements_published ON announcements(status, published_at);
CREATE INDEX idx_documents_school_owner ON documents(school_id, owner_model, owner_id);
CREATE INDEX idx_notification_recipients_user ON notification_recipients(user_id, read_at);
