-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 27, 2026 at 11:46 AM
-- Server version: 10.11.16-MariaDB
-- PHP Version: 8.3.36

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `iportal_campus_dev`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_sessions`
--

CREATE TABLE `academic_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('draft','active','closed') NOT NULL DEFAULT 'draft',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `academic_sessions`
--

INSERT INTO `academic_sessions` (`id`, `school_id`, `name`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, '2026/2027', '2026-09-01', '2027-07-31', 'closed', '2026-10-26 16:38:36', '2026-11-16 08:36:52'),
(95, 175, '2026/2027', '2026-09-01', '2027-07-31', 'active', '2026-11-22 19:08:59', '2026-11-22 19:08:59');

-- --------------------------------------------------------

--
-- Table structure for table `admission_applications`
--

CREATE TABLE `admission_applications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `applicant_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `status` enum('draft','submitted','under_review','approved','accepted','admitted','enrolled','rejected','paid') NOT NULL DEFAULT 'draft',
  `application_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`application_data`)),
  `submitted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `public_reference` char(36) DEFAULT NULL,
  `access_token_hash` varchar(64) DEFAULT NULL,
  `reviewed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `decision_at` datetime DEFAULT NULL,
  `decision_notes` text DEFAULT NULL,
  `provisioned_student_id` bigint(20) UNSIGNED DEFAULT NULL,
  `provisioned_guardian_id` bigint(20) UNSIGNED DEFAULT NULL,
  `provisioned_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admission_applications`
--

INSERT INTO `admission_applications` (`id`, `school_id`, `applicant_name`, `email`, `phone`, `status`, `application_data`, `submitted_at`, `created_at`, `updated_at`, `public_reference`, `access_token_hash`, `reviewed_by`, `decision_at`, `decision_notes`, `provisioned_student_id`, `provisioned_guardian_id`, `provisioned_at`) VALUES
(13, 1, 'Chinedu Okafor', 'chinedu.applicant@example.test', '08031234567', 'enrolled', '{\"application_number\":\"APP-DEV-CAMPUS-K8XYSY\",\"first_name\":\"Chinedu\",\"surname\":\"Okafor\",\"other_names\":\"\",\"programme\":\"Development Year 1\",\"class_id\":1,\"date_of_birth\":null,\"gender\":\"male\",\"address\":null,\"previous_school\":null,\"previous_qualification\":null,\"guardian_name\":\"Chief Okafor\",\"guardian_phone\":\"08039998888\",\"guardian_email\":null,\"notes\":null,\"passport\":null,\"birth_certificate\":null,\"other_documents\":[],\"fee_amount\":5000,\"fee_paid\":true,\"payment_reference\":\"APF-20261116-PWXMAPB8\",\"review_notes\":\"Admitted on merit\"}', '2026-11-16 08:35:52', '2026-11-16 08:35:52', '2026-11-16 08:35:53', 'APP-DEV-CAMPUS-K8XYSY', NULL, 3, '2026-11-16 08:35:52', 'Admitted on merit', 76, 17, '2026-11-16 08:35:53'),
(14, 1, 'Primeson Aselemi', 'p2time1@gmail.com', '08060805948', 'submitted', '{\"application_number\":\"APP-DEV-CAMPUS-HNWJCN\",\"first_name\":\"Primeson\",\"surname\":\"Aselemi\",\"other_names\":\"\",\"programme\":\"SSS 1 Science 52\",\"class_id\":73,\"date_of_birth\":\"1999-06-11\",\"gender\":\"male\",\"address\":\"Aluu, aluu\",\"previous_school\":\"nil\",\"previous_qualification\":\"nil\",\"guardian_name\":\"prime\",\"guardian_phone\":\"08060805948\",\"guardian_email\":\"p2time1@gmail.com\",\"notes\":null,\"passport\":null,\"birth_certificate\":null,\"other_documents\":[],\"fee_amount\":5000,\"fee_paid\":true,\"payment_reference\":\"APF-20261116-C9OSUKQU\"}', '2026-11-16 08:47:55', '2026-11-16 08:47:49', '2026-11-16 08:47:55', 'APP-DEV-CAMPUS-HNWJCN', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 1, 'joe jarry', 'mail@mymail.com', '08080808080', 'submitted', '{\"application_number\":\"APP-DEV-CAMPUS-OJGE38\",\"first_name\":\"joe\",\"surname\":\"jarry\",\"other_names\":\"\",\"programme\":\"Basic 1\",\"class_id\":1,\"date_of_birth\":\"1999-09-09\",\"gender\":\"male\",\"address\":\"aluu\",\"previous_school\":\"day school\",\"previous_qualification\":null,\"guardian_name\":\"mr joe\",\"guardian_phone\":\"09090909090\",\"guardian_email\":\"mymail@mail.com\",\"notes\":null,\"passport\":null,\"birth_certificate\":null,\"other_documents\":[],\"fee_amount\":5000,\"fee_paid\":true,\"payment_reference\":\"APF-20261117-TRGKPYK4\"}', '2026-11-17 08:10:51', '2026-11-17 08:10:45', '2026-11-17 08:10:51', 'APP-DEV-CAMPUS-OJGE38', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 1, 'Lovell Neves', 'aselemiprimeskmon@gmail.com', '5083857885', 'accepted', '{\"application_number\":\"APP-DEV-CAMPUS-O2YG8R\",\"first_name\":\"Lovell\",\"surname\":\"Neves\",\"other_names\":\"\",\"programme\":\"Basic 1\",\"class_id\":1,\"date_of_birth\":\"2005-06-06\",\"gender\":\"male\",\"address\":\"7321 MIRAMONTE BLVD APT 101 LOS ANGELES, CA\",\"previous_school\":\"test prev academics\",\"previous_qualification\":null,\"guardian_name\":\"mr joely\",\"guardian_phone\":\"98994849983\",\"guardian_email\":\"mail@mail.com\",\"notes\":null,\"passport\":null,\"birth_certificate\":null,\"other_documents\":[],\"fee_amount\":5000,\"fee_paid\":true,\"payment_reference\":\"APF-20261118-ACZBQNZT\",\"review_notes\":null}', '2026-11-18 21:06:25', '2026-11-18 21:06:20', '2026-11-22 19:23:02', 'APP-DEV-CAMPUS-O2YG8R', NULL, 3, '2026-11-22 19:23:02', NULL, NULL, NULL, NULL),
(17, 1, 'Zainab Ibrahim', 'zainab.43e19f@example.com', '08091112233', 'enrolled', '{\"first_name\":\"Zainab\",\"surname\":\"Ibrahim\",\"programme\":\"Basic 1\",\"gender\":\"female\",\"guardian_name\":\"Alhaji Musa Ibrahim\",\"guardian_email\":\"musa.ibrahim.43e19f@example.com\",\"guardian_phone\":\"08094445566\",\"guardian_relationship\":\"father\",\"class_id\":1,\"enrolled_class_name\":\"Basic 1\",\"admission_number\":\"DEVCAMPUS\\/2026\\/4805\",\"student_login_pin\":\"DEVCAMPUS-STU-7Z6TTL\",\"parent_login_pin\":\"DEVCAMPUS-PAR-7TKHVO\",\"review_notes\":\"Enrolled via one-click provisioning test.\"}', NULL, '2026-11-20 21:55:53', '2026-11-20 21:55:56', 'APP-PROV-43E19F', NULL, NULL, '2026-11-20 21:55:56', 'Enrolled via one-click provisioning test.', 87, 18, '2026-11-20 21:55:56'),
(20, 1, 'friday aki', 'mail@mail.com', '', 'enrolled', '{\"application_number\":\"APP\\/GA\\/2026\\/XQFTUB\",\"first_name\":\"friday\",\"surname\":\"aki\",\"other_names\":\"\",\"programme\":\"Basic 1\",\"class_id\":1,\"date_of_birth\":\"2012-05-05\",\"gender\":\"male\",\"address\":null,\"previous_school\":null,\"previous_qualification\":null,\"guardian_name\":null,\"guardian_phone\":null,\"guardian_email\":null,\"notes\":null,\"passport\":{\"file_name\":\"WhatsApp Image 2026-11-05 at 11.29.07 PM.jpeg\",\"url\":\"http:\\/\\/127.0.0.1:8000\\/storage\\/uploads\\/1795376579_WhatsApp_Image_2026-11-05_at_11.29.07_PM.jpg\"},\"birth_certificate\":null,\"other_documents\":[],\"fee_amount\":5000,\"fee_paid\":true,\"payment_reference\":\"APF-20261122-XODBB3V9\",\"receipt_number\":\"RCP-GA-20261122-O4PIHC\",\"paid_at\":\"2026-11-22T19:43:16+00:00\",\"review_notes\":null,\"enrolled_class_name\":\"Basic 1\",\"admission_number\":\"GA\\/2026\\/9508\",\"student_login_pin\":\"GA-STU-FAASSG\",\"parent_login_pin\":\"GA-PAR-PAPZW5\"}', '2026-11-22 19:43:16', '2026-11-22 19:43:13', '2026-11-22 20:21:33', 'APP/GA/2026/XQFTUB', NULL, 3, '2026-11-22 20:04:05', NULL, 89, 20, '2026-11-22 20:21:33');

-- --------------------------------------------------------

--
-- Table structure for table `admission_documents`
--

CREATE TABLE `admission_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `admission_application_id` bigint(20) UNSIGNED NOT NULL,
  `document_id` bigint(20) UNSIGNED NOT NULL,
  `verification_status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `author_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `audience` enum('all','students','teachers','parents','school_admin') NOT NULL DEFAULT 'all',
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `school_id`, `author_id`, `title`, `body`, `metadata`, `audience`, `status`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, 'Midterm Examinations Schedule', 'All students must check their portals for the complete midterm timetable.', '{\"description\":\"The midterm timetable has been published.\",\"category\":\"academic\",\"audience_type\":\"school\",\"target_role\":null,\"target_class_id\":null,\"target_class_name\":null,\"is_pinned\":true,\"is_public\":false,\"expires_at\":null,\"attachment_url\":null,\"attachment_name\":null,\"author_name\":\"Administrator\"}', 'all', 'published', '2026-11-11 20:01:37', '2026-11-11 20:01:37', '2026-11-23 20:02:05', NULL),
(2, 1, 3, 'classes resume on monday', 'classes resume on monday', '{\"description\":\"resumption\",\"category\":\"general\",\"audience_type\":\"school\",\"target_role\":null,\"target_class_id\":null,\"target_class_name\":null,\"is_pinned\":false,\"is_public\":true,\"expires_at\":null,\"attachment_url\":null,\"attachment_name\":null,\"author_name\":\"Administrator\"}', 'all', 'published', '2026-11-16 11:44:34', '2026-11-16 11:44:33', '2026-11-22 18:50:49', NULL),
(3, 1, 3, 'testing', 'kghsdvkksa ihskbkab', '{\"description\":\"testing\",\"category\":\"general\",\"audience_type\":\"school\",\"target_role\":null,\"target_class_id\":null,\"target_class_name\":null,\"is_pinned\":false,\"is_public\":true,\"expires_at\":null,\"attachment_url\":null,\"attachment_name\":null,\"author_name\":\"Administrator\"}', 'all', 'published', '2026-11-16 15:14:26', '2026-11-16 15:14:25', '2026-11-22 18:56:14', '2026-11-22 18:56:14'),
(5, 1, 3, 'dfhksjhkhs', 'sfgdfgds', '{\"description\":\"sdfgse\",\"category\":\"resumption\",\"audience_type\":\"school\",\"target_role\":null,\"target_class_id\":null,\"target_class_name\":null,\"is_pinned\":true,\"is_public\":true,\"expires_at\":null,\"attachment_url\":null,\"attachment_name\":null,\"author_name\":\"Development School Admin\"}', 'all', 'published', '2026-11-22 18:50:08', '2026-11-22 18:50:07', '2026-11-22 18:56:08', '2026-11-22 18:56:08'),
(6, 1, 3, 'Resumption Notice for All Students', 'Resumption Notice for All Students\n\nTitle: Welcome Back to School\n\nDear Parents, Guardians, and Students,\n\nWe are pleased to welcome everyone back for a new academic term. Students are expected to resume on Monday, 30 November 2026. Please ensure all students arrive on time, dressed in the approved school uniform, and with the necessary learning materials.\n\nWe look forward to a productive, successful, and exciting term ahead.\n\nManagement', '{\"description\":\"Title: Welcome Back to School  Dear Parents, Guardians, and Students,  We are pleased to welcome everyone back for a new academic term. Students are expected to resume on Monday, 30 November 2026. Please ensure all\",\"category\":\"resumption\",\"audience_type\":\"school\",\"target_role\":null,\"target_class_id\":null,\"target_class_name\":null,\"is_pinned\":true,\"is_public\":true,\"expires_at\":null,\"attachment_url\":null,\"attachment_name\":null,\"author_name\":\"Grace Academy Admin\"}', 'all', 'published', '2026-11-23 20:02:58', '2026-11-23 20:00:33', '2026-11-23 20:02:58', NULL),
(7, 1, 3, 'Upcoming Mid-Term Assessments', 'Mid-Term Assessment Schedule\n\nThis is to inform all students that the mid-term assessment will commence on Monday, 7 December 2026. Students are advised to revise their notes, complete outstanding assignments, and prepare adequately for all subjects.\n\nThe detailed timetable will be made available by the respective class teachers. Parents are encouraged to support their children in maintaining a consistent study routine.\n\nAcademic Department', '{\"description\":\"Mid-Term Assessment Schedule  This is to inform all students that the mid-term assessment will commence on Monday, 7 December 2026. Students are advised to revise their notes,\",\"category\":\"examination\",\"audience_type\":\"school\",\"target_role\":null,\"target_class_id\":null,\"target_class_name\":null,\"is_pinned\":false,\"is_public\":true,\"expires_at\":null,\"attachment_url\":null,\"attachment_name\":null,\"author_name\":\"Grace Academy Admin\"}', 'all', 'published', '2026-11-23 20:06:08', '2026-11-23 20:06:05', '2026-11-23 20:06:08', NULL),
(8, 1, 3, 'Celebration of Culture and Creativity', 'Annual Cultural and Creative Arts Day\n\nOur school will be hosting its Annual Cultural and Creative Arts Day on Friday, 11 December 2026. The event will feature cultural displays, drama, music, art exhibitions, traditional attire, and exciting performances by our students.\n\nParents and guardians are warmly invited to join us as we celebrate the creativity, talents, and cultural diversity of our students. More details regarding participation and arrangements will be communicated soon.\n\nEvent Coordination Committee', '{\"description\":\"Annual Cultural and Creative Arts Day  Our school will be hosting its Annual Cultural and Creative Arts Day on Friday, 11 December 2026. The\",\"category\":\"events\",\"audience_type\":\"school\",\"target_role\":null,\"target_class_id\":null,\"target_class_name\":null,\"is_pinned\":false,\"is_public\":true,\"expires_at\":null,\"attachment_url\":null,\"attachment_name\":null,\"author_name\":\"Grace Academy Admin\"}', 'all', 'published', '2026-11-23 20:08:46', '2026-11-23 20:08:44', '2026-11-23 20:08:46', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `assessment_components`
--

CREATE TABLE `assessment_components` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `assessment_period_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_assignment_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `component_type` enum('ca','exam','other') NOT NULL,
  `maximum_score` decimal(6,2) NOT NULL,
  `weight` decimal(6,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assessment_periods`
--

CREATE TABLE `assessment_periods` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `academic_session_id` bigint(20) UNSIGNED NOT NULL,
  `term_id` bigint(20) UNSIGNED NOT NULL,
  `grading_scheme_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `starts_on` date DEFAULT NULL,
  `ends_on` date DEFAULT NULL,
  `status` enum('draft','open','closed','published') NOT NULL DEFAULT 'draft',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assessment_scores`
--

CREATE TABLE `assessment_scores` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `assessment_component_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `score` decimal(6,2) NOT NULL,
  `recorded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED NOT NULL,
  `subject_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `status` enum('draft','published','closed') NOT NULL DEFAULT 'draft',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assignment_submissions`
--

CREATE TABLE `assignment_submissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `assignment_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `content` text DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `status` enum('draft','submitted','graded','late') NOT NULL DEFAULT 'draft',
  `score` decimal(6,2) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED DEFAULT NULL,
  `teacher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present','absent','late','excused') NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `attendance_session_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `school_id`, `student_id`, `class_id`, `teacher_id`, `attendance_date`, `status`, `remarks`, `created_at`, `updated_at`, `attendance_session_id`) VALUES
(8, 1, 75, 73, NULL, '2026-11-02', 'present', 'Present in class', '2026-11-02 08:25:42', '2026-11-02 08:25:42', NULL),
(9, 1, 1, 1, NULL, '2026-11-16', 'present', NULL, '2026-11-16 06:49:03', '2026-11-16 06:49:03', NULL),
(10, 1, 75, 73, NULL, '2026-10-08', 'absent', NULL, '2026-11-16 07:05:23', '2026-11-16 07:06:05', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `attendance_sessions`
--

CREATE TABLE `attendance_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `academic_session_id` bigint(20) UNSIGNED NOT NULL,
  `term_id` bigint(20) UNSIGNED DEFAULT NULL,
  `class_id` bigint(20) UNSIGNED NOT NULL,
  `subject_id` bigint(20) UNSIGNED DEFAULT NULL,
  `teacher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `attendance_type` enum('daily','subject') NOT NULL DEFAULT 'daily',
  `status` enum('open','submitted','locked') NOT NULL DEFAULT 'open',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `actor_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `event_type` varchar(100) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `school_id`, `user_id`, `actor_user_id`, `event_type`, `entity_type`, `entity_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, NULL, 1, 'school_code_updated', 'School', 1, '{\"school_code\":\"ZQ\"}', '{\"old_code\":\"ZQ\",\"new_code\":\"ZX\",\"memberships_updated\":8,\"users_updated\":8,\"teachers_updated\":4,\"students_updated\":0,\"receipts_updated\":0,\"applications_updated\":0,\"description\":\"School code changed from ZQ to ZX (propagated to 8 users, 4 teachers, 0 students, 0 applications).\"}', NULL, NULL, '2026-11-22 18:00:50'),
(2, 1, NULL, 1, 'school_code_updated', 'School', 1, '{\"school_code\":\"ZX\"}', '{\"old_code\":\"ZX\",\"new_code\":\"ZQ\",\"memberships_updated\":8,\"users_updated\":8,\"teachers_updated\":3,\"students_updated\":0,\"receipts_updated\":0,\"applications_updated\":0,\"description\":\"School code changed from ZX to ZQ (propagated to 8 users, 3 teachers, 0 students, 0 applications).\"}', NULL, NULL, '2026-11-22 18:00:50'),
(3, 1, NULL, NULL, 'school_code_updated', 'School', 1, '{\"school_code\":\"ZQ\"}', '{\"old_code\":\"ZQ\",\"new_code\":\"DC\",\"memberships_updated\":7,\"users_updated\":7,\"teachers_updated\":2,\"students_updated\":0,\"receipts_updated\":0,\"applications_updated\":0,\"description\":\"School code changed from ZQ to DC (propagated to 7 users, 2 teachers, 0 students, 0 applications).\"}', NULL, NULL, '2026-11-22 18:01:35'),
(4, 1, NULL, 3, 'school_code_updated', 'School', 1, '{\"school_code\":\"DC\"}', '{\"old_code\":\"DC\",\"new_code\":\"GA\",\"memberships_updated\":7,\"users_updated\":7,\"teachers_updated\":2,\"students_updated\":0,\"receipts_updated\":0,\"applications_updated\":0,\"description\":\"School code changed from DC to GA (propagated to 7 users, 2 teachers, 0 students, 0 applications).\"}', NULL, NULL, '2026-11-22 18:08:30'),
(5, NULL, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 0, '{\"feature_key\":\"online_payments\",\"is_enabled\":true}', '{\"feature_key\":\"online_payments\",\"is_enabled\":false,\"scope\":\"Platform-Wide\",\"description\":\"Online Payments (online_payments) disabled (Platform-Wide).\"}', NULL, NULL, '2026-11-22 21:02:03'),
(6, 1, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 1, '{\"feature_key\":\"online_payments\",\"is_enabled\":false}', '{\"feature_key\":\"online_payments\",\"is_enabled\":true,\"scope\":\"School #1\",\"description\":\"Online Payments (online_payments) enabled (School #1).\"}', NULL, NULL, '2026-11-22 21:02:03'),
(7, 1, NULL, 1, 'feature_flag_reset', 'FeatureFlag', 1, NULL, '{\"feature_key\":\"online_payments\",\"description\":\"Online Payments override reset to platform default for School #1.\"}', NULL, NULL, '2026-11-22 21:02:03'),
(8, NULL, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 0, '{\"feature_key\":\"bulk_messaging\",\"is_enabled\":true}', '{\"feature_key\":\"bulk_messaging\",\"is_enabled\":false,\"scope\":\"Platform-Wide\",\"description\":\"Bulk SMS & WhatsApp Alerts (bulk_messaging) disabled (Platform-Wide).\"}', NULL, NULL, '2026-11-22 21:06:00'),
(9, NULL, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 0, '{\"feature_key\":\"online_payments\",\"is_enabled\":true}', '{\"feature_key\":\"online_payments\",\"is_enabled\":false,\"scope\":\"Platform-Wide\",\"description\":\"Online Payments (online_payments) disabled (Platform-Wide).\"}', NULL, NULL, '2026-11-22 21:15:42'),
(10, NULL, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 0, '{\"feature_key\":\"online_payments\",\"is_enabled\":false}', '{\"feature_key\":\"online_payments\",\"is_enabled\":true,\"scope\":\"Platform-Wide\",\"description\":\"Online Payments (online_payments) enabled (Platform-Wide).\"}', NULL, NULL, '2026-11-22 21:15:47'),
(11, NULL, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 0, '{\"feature_key\":\"online_payments\",\"is_enabled\":true}', '{\"feature_key\":\"online_payments\",\"is_enabled\":false,\"scope\":\"Platform-Wide\",\"description\":\"Online Payments (online_payments) disabled (Platform-Wide).\"}', NULL, NULL, '2026-11-22 21:15:54'),
(12, NULL, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 0, '{\"feature_key\":\"online_payments\",\"is_enabled\":false}', '{\"feature_key\":\"online_payments\",\"is_enabled\":true,\"scope\":\"Platform-Wide\",\"description\":\"Online Payments (online_payments) enabled (Platform-Wide).\"}', NULL, NULL, '2026-11-22 21:18:02'),
(13, 1, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 1, '{\"feature_key\":\"bulk_messaging\",\"is_enabled\":false}', '{\"feature_key\":\"bulk_messaging\",\"is_enabled\":true,\"scope\":\"School #1\",\"description\":\"Bulk SMS & WhatsApp Alerts (bulk_messaging) enabled (School #1).\"}', NULL, NULL, '2026-11-22 21:19:59'),
(14, 1, NULL, 1, 'feature_flag_reset', 'FeatureFlag', 1, NULL, '{\"feature_key\":\"bulk_messaging\",\"description\":\"Bulk SMS & WhatsApp Alerts override reset to platform default for School #1.\"}', NULL, NULL, '2026-11-22 21:20:05'),
(15, 1, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 1, '{\"feature_key\":\"bulk_messaging\",\"is_enabled\":false}', '{\"feature_key\":\"bulk_messaging\",\"is_enabled\":true,\"scope\":\"School #1\",\"description\":\"Bulk SMS & WhatsApp Alerts (bulk_messaging) enabled (School #1).\"}', NULL, NULL, '2026-11-22 21:20:08'),
(16, 1, NULL, 1, 'admin_assigned', 'SchoolMembership', 190, NULL, '{\"user_id\":219,\"user_name\":\"Amina Bello\",\"user_email\":\"amina.bello.admin.test@example.com\",\"login_pin\":\"GA-ADM-ABMFFU\",\"description\":\"Assigned Amina Bello (GA-ADM-ABMFFU) as administrator of Grace Academy.\"}', NULL, NULL, '2026-11-23 15:46:29'),
(17, 1, NULL, 1, 'admin_updated', 'SchoolMembership', 190, NULL, '{\"user_id\":219,\"user_name\":\"Dr. Amina Bello-Sadiq\",\"user_email\":\"dr.amina.bello.test@example.com\",\"login_pin\":\"GA-ADM-ABMFFU\",\"description\":\"Updated administrator Dr. Amina Bello-Sadiq (GA-ADM-ABMFFU) for Grace Academy.\"}', NULL, NULL, '2026-11-23 15:46:30'),
(18, 1, NULL, 1, 'admin_removed', 'SchoolMembership', 190, NULL, '{\"description\":\"Removed Dr. Amina Bello-Sadiq (dr.amina.bello.test@example.com) as administrator of Grace Academy\"}', NULL, NULL, '2026-11-23 15:46:30'),
(19, 1, NULL, 1, 'admin_updated', 'SchoolMembership', 1, NULL, '{\"user_id\":3,\"user_name\":\"Grace Academy Admin\",\"user_email\":\"admin@example.test\",\"login_pin\":\"GA-ADM-AA0001\",\"description\":\"Updated administrator Grace Academy Admin (GA-ADM-AA0001) for Grace Academy.\"}', NULL, NULL, '2026-11-23 15:48:33'),
(20, 175, NULL, 1, 'admin_assigned', 'SchoolMembership', 191, NULL, '{\"user_id\":220,\"user_name\":\"another school\",\"user_email\":\"anothersc@mail.com\",\"login_pin\":\"AS-ADM-AS26KV\",\"description\":\"Assigned another school (AS-ADM-AS26KV) as administrator of another school academy.\"}', NULL, NULL, '2026-11-23 16:23:15'),
(21, 175, NULL, 220, 'school_code_updated', 'School', 175, '{\"school_code\":\"AS\"}', '{\"old_code\":\"AS\",\"new_code\":\"ANOTHERSCHOOL\",\"memberships_updated\":1,\"users_updated\":1,\"teachers_updated\":0,\"students_updated\":0,\"receipts_updated\":0,\"applications_updated\":0,\"description\":\"School code changed from AS to ANOTHERSCHOOL (propagated to 1 users, 0 teachers, 0 students, 0 applications).\"}', NULL, NULL, '2026-11-23 16:25:37'),
(22, 175, NULL, 220, 'school_code_updated', 'School', 175, '{\"school_code\":\"ANOTHERSCHOOL\"}', '{\"old_code\":\"ANOTHERSCHOOL\",\"new_code\":\"AS\",\"memberships_updated\":1,\"users_updated\":1,\"teachers_updated\":0,\"students_updated\":0,\"receipts_updated\":0,\"applications_updated\":0,\"description\":\"School code changed from ANOTHERSCHOOL to AS (propagated to 1 users, 0 teachers, 0 students, 0 applications).\"}', NULL, NULL, '2026-11-23 16:26:01'),
(23, NULL, NULL, 1, 'platform_settings_updated', 'PlatformSetting', 0, '{\"platform_name\":\"iPortal Campus\",\"tagline\":\"Platform Administration\",\"logo_url\":\"\",\"support_email\":\"\",\"support_phone\":\"\",\"website\":\"\",\"primary_color\":\"#0f172a\",\"accent_color\":\"#4f46e5\",\"secondary_color\":\"#f97316\",\"sidebar_color\":\"#0f172a\",\"violet_color\":\"#7c3aed\",\"success_color\":\"#22c55e\"}', '{\"platform_name\":\"iPortal Enterprise HQ\",\"tagline\":\"Global Control Plane\",\"logo_url\":\"\",\"support_email\":\"\",\"support_phone\":\"\",\"website\":\"\",\"primary_color\":\"#1e293b\",\"accent_color\":\"#6366f1\",\"secondary_color\":\"#f97316\",\"sidebar_color\":\"#111827\",\"violet_color\":\"#7c3aed\",\"success_color\":\"#22c55e\",\"description\":\"Super Admin (Super Admin Updated) updated Platform Settings & theme colors.\"}', NULL, NULL, '2026-11-23 16:45:23'),
(28, NULL, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 0, '{\"feature_key\":\"parents\",\"is_enabled\":true}', '{\"feature_key\":\"parents\",\"is_enabled\":false,\"scope\":\"Platform-Wide\",\"description\":\"Parent Portal & Management (parents) disabled (Platform-Wide).\"}', NULL, NULL, '2026-11-24 17:32:08'),
(29, NULL, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 0, '{\"feature_key\":\"parents\",\"is_enabled\":false}', '{\"feature_key\":\"parents\",\"is_enabled\":true,\"scope\":\"Platform-Wide\",\"description\":\"Parent Portal & Management (parents) enabled (Platform-Wide).\"}', NULL, NULL, '2026-11-24 17:32:52'),
(30, NULL, NULL, 1, 'feature_flag_updated', 'FeatureFlag', 0, '{\"feature_key\":\"parents\",\"is_enabled\":true}', '{\"feature_key\":\"parents\",\"is_enabled\":false,\"scope\":\"Platform-Wide\",\"description\":\"Parent Portal & Management (parents) disabled (Platform-Wide).\"}', NULL, NULL, '2026-11-24 17:33:27'),
(31, 1, NULL, 3, 'password_reset_to_default', 'User', 217, NULL, '{\"user_id\":217,\"user_name\":\"friday aki\",\"login_pin\":\"GA-STU-FAASSG\",\"role\":\"STU\",\"reset_by\":\"Grace Academy Admin\",\"reset_by_role\":\"school_admin\",\"must_change_password\":true}', NULL, NULL, '2026-11-24 17:52:41');

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED DEFAULT NULL,
  `owner_model` varchar(100) DEFAULT NULL,
  `owner_id` bigint(20) UNSIGNED DEFAULT NULL,
  `document_type` varchar(100) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `storage_disk` varchar(50) NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size_bytes` bigint(20) UNSIGNED DEFAULT NULL,
  `uploaded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('active','archived','deleted') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feature_flags`
--

CREATE TABLE `feature_flags` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED DEFAULT NULL,
  `feature_key` varchar(80) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `updated_by_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `feature_flags`
--

INSERT INTO `feature_flags` (`id`, `school_id`, `feature_key`, `is_enabled`, `updated_by_user_id`, `created_at`, `updated_at`) VALUES
(3, NULL, 'bulk_messaging', 0, 1, '2026-11-22 20:06:00', '2026-11-22 20:06:00'),
(4, NULL, 'online_payments', 1, 1, '2026-11-22 20:15:42', '2026-11-22 20:18:01'),
(6, 1, 'bulk_messaging', 1, 1, '2026-11-22 20:20:08', '2026-11-22 20:20:08'),
(8, NULL, 'parents', 0, 1, '2026-11-24 16:32:08', '2026-11-24 16:33:27');

-- --------------------------------------------------------

--
-- Table structure for table `fee_categories`
--

CREATE TABLE `fee_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fee_categories`
--

INSERT INTO `fee_categories` (`id`, `school_id`, `name`, `code`, `description`, `status`, `created_at`, `updated_at`) VALUES
(15, 1, 'Tuition & Development Fee', 'TUIT', 'Mandatory academic tuition and campus development levy', 'active', '2026-11-11 19:37:09', '2026-11-16 07:07:18'),
(16, 1, 'ICT & Laboratory Levy', 'ICTLAB', 'Computer and science lab fee', 'active', '2026-11-15 22:10:41', '2026-11-15 22:10:41'),
(17, 1, 'Bursar Authorized Levy', 'BAL', NULL, 'active', '2026-11-19 20:24:51', '2026-11-19 20:24:51');

-- --------------------------------------------------------

--
-- Table structure for table `fee_structures`
--

CREATE TABLE `fee_structures` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `fee_category_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `auto_apply` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `academic_session_id` bigint(20) UNSIGNED DEFAULT NULL,
  `term_id` bigint(20) UNSIGNED DEFAULT NULL,
  `class_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 0,
  `due_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_acceptance_fee` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fee_structures`
--

INSERT INTO `fee_structures` (`id`, `school_id`, `fee_category_id`, `name`, `amount`, `currency`, `auto_apply`, `status`, `created_at`, `updated_at`, `academic_session_id`, `term_id`, `class_id`, `is_mandatory`, `due_date`, `description`, `is_acceptance_fee`) VALUES
(22, 1, 15, 'First Term Tuition Fee', 75000.00, 'NGN', 1, 'active', '2026-11-11 19:37:10', '2026-11-11 19:37:10', 1, 1, NULL, 1, NULL, NULL, 0),
(23, 1, 15, 'First Term Tuition Fee', 75000.00, 'NGN', 1, 'active', '2026-11-11 19:39:26', '2026-11-11 19:39:26', 1, 1, NULL, 1, NULL, NULL, 0),
(24, 1, 16, 'ICT & Laboratory Levy', 45000.00, 'NGN', 1, 'active', '2026-11-15 22:10:45', '2026-11-22 20:28:40', 1, 1, 1, 1, '2026-12-15', 'Termly ICT levy', 0);

-- --------------------------------------------------------

--
-- Table structure for table `grading_schemes`
--

CREATE TABLE `grading_schemes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grading_schemes`
--

INSERT INTO `grading_schemes` (`id`, `school_id`, `name`, `description`, `metadata`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'Standard Secondary Grading', NULL, '\"{\\\"is_active\\\":true,\\\"components\\\":[{\\\"key\\\":\\\"c1\\\",\\\"label\\\":\\\"CA 1\\\",\\\"max_score\\\":20},{\\\"key\\\":\\\"c2\\\",\\\"label\\\":\\\"CA 2\\\",\\\"max_score\\\":20},{\\\"key\\\":\\\"exam\\\",\\\"label\\\":\\\"Exam\\\",\\\"max_score\\\":60}]}\"', '2026-11-02 08:36:49', '2026-11-02 08:36:49', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `grading_scheme_components`
--

CREATE TABLE `grading_scheme_components` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `grading_scheme_id` bigint(20) UNSIGNED NOT NULL,
  `grade_label` varchar(20) NOT NULL,
  `minimum_score` decimal(5,2) NOT NULL,
  `maximum_score` decimal(5,2) NOT NULL,
  `remark` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grading_scheme_components`
--

INSERT INTO `grading_scheme_components` (`id`, `grading_scheme_id`, `grade_label`, `minimum_score`, `maximum_score`, `remark`, `created_at`, `updated_at`) VALUES
(23, 1, 'A', 75.00, 100.00, 'Excellent', '2026-11-16 12:04:44', '2026-11-16 12:04:44'),
(24, 1, 'B', 65.00, 74.99, 'Very Good', '2026-11-16 12:04:44', '2026-11-16 12:04:44'),
(25, 1, 'C', 50.00, 64.99, 'Credit', '2026-11-16 12:04:44', '2026-11-16 12:04:44'),
(26, 1, 'D', 45.00, 49.99, 'Pass', '2026-11-16 12:04:44', '2026-11-16 12:04:44'),
(27, 1, 'E', 40.00, 39.99, 'Fail', '2026-11-16 12:04:44', '2026-11-16 12:04:44'),
(28, 1, 'F', 0.00, 100.00, NULL, '2026-11-16 12:04:44', '2026-11-16 12:04:44');

-- --------------------------------------------------------

--
-- Table structure for table `guardian_relationships`
--

CREATE TABLE `guardian_relationships` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `guardian_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `relationship_type` varchar(50) NOT NULL DEFAULT 'guardian',
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `guardian_relationships`
--

INSERT INTO `guardian_relationships` (`id`, `school_id`, `guardian_id`, `student_id`, `relationship_type`, `is_primary`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'parent', 1, '2026-10-26 16:38:38', '2026-10-26 16:38:38'),
(17, 1, 17, 76, 'guardian', 1, '2026-11-16 08:35:53', '2026-11-16 08:35:53'),
(18, 1, 18, 87, 'father', 1, '2026-11-20 21:55:56', '2026-11-20 21:55:56'),
(20, 1, 20, 89, 'guardian', 1, '2026-11-22 20:21:33', '2026-11-22 20:21:33');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_applications`
--

CREATE TABLE `job_applications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `job_vacancy_id` bigint(20) UNSIGNED NOT NULL,
  `applicant_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `resume_path` varchar(500) DEFAULT NULL,
  `status` enum('submitted','reviewed','accepted','rejected') NOT NULL DEFAULT 'submitted',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_vacancies`
--

CREATE TABLE `job_vacancies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('draft','open','closed') NOT NULL DEFAULT 'draft',
  `closing_date` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(2, '2026_10_09_000001_create_iportal_core_tables', 1),
(3, '2026_10_09_000002_create_iportal_academic_tables', 1),
(4, '2026_10_09_000003_create_iportal_finance_tables', 1),
(5, '2026_10_09_000004_create_iportal_communication_tables', 1),
(6, '2026_10_09_000005_create_iportal_audit_tables', 1),
(7, '2026_10_27_000006_add_iportal_workflow_structures', 2),
(8, '2026_11_02_000001_enhance_finance_tables', 3),
(9, '2026_11_11_000001_enhance_announcements_table', 4),
(10, '2026_11_15_000001_complete_phase2_finance_schema', 5),
(11, '2026_11_16_000001_enhance_schools_admissions_and_sessions', 6),
(12, '2026_11_16_000002_create_phase5_queue_and_messaging_tables', 7),
(13, '2026_11_20_000001_add_ranking_columns_to_results_and_term_remarks', 8),
(14, '2026_11_22_210000_create_feature_flags_table', 9),
(15, '2026_11_23_170000_create_platform_settings_table', 10);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `read_at` datetime DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `school_id`, `user_id`, `type`, `title`, `message`, `read_at`, `metadata`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'announcement', 'Exam Timetable Released', 'Please review your exam dates.', '2026-11-11 20:01:38', NULL, '2026-11-11 20:01:38', '2026-11-11 20:01:38'),
(2, 1, 5, 'fee_payment_reminder', 'Fee Payment Reminder', '[Grace Academy] FEE REMINDER: Dear Parent, an outstanding fee balance of NGN 45,000.00 is due for Development Student (Basic 1). Kindly pay online via the Campus Portal.', '2026-11-19 19:55:05', '{\"batch_id\":\"BATCH-SAEACKKWXC\",\"channel\":\"sms\",\"provider\":\"africastalking\"}', '2026-11-16 20:05:52', '2026-11-19 19:55:11'),
(3, 1, 5, 'exam_result_release', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Development Student (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', '2026-11-19 19:55:05', '{\"batch_id\":\"BATCH-BL6GGJT0CM\",\"channel\":\"whatsapp\",\"provider\":\"twilio\"}', '2026-11-16 20:05:52', '2026-11-19 19:55:14'),
(4, 1, 203, 'exam_result_release', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Chinedu Okafor (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', NULL, '{\"batch_id\":\"BATCH-BL6GGJT0CM\",\"channel\":\"whatsapp\",\"provider\":\"twilio\"}', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(5, 1, 5, 'emergency_school_closure', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', '2026-11-19 19:55:05', '{\"batch_id\":\"BATCH-KLYUX1LVA9\",\"channel\":\"whatsapp\",\"provider\":\"termii\"}', '2026-11-16 20:05:52', '2026-11-19 19:55:16'),
(6, 1, 203, 'emergency_school_closure', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', NULL, '{\"batch_id\":\"BATCH-KLYUX1LVA9\",\"channel\":\"whatsapp\",\"provider\":\"termii\"}', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(7, 1, 5, 'fee_payment_reminder', 'Fee Payment Reminder', '[Grace Academy] FEE REMINDER: Dear Parent, an outstanding fee balance of NGN 45,000.00 is due for Development Student (Basic 1). Kindly pay online via the Campus Portal.', '2026-11-19 19:54:50', '{\"batch_id\":\"BATCH-KG2XYZR87I\",\"channel\":\"sms\",\"provider\":\"africastalking\"}', '2026-11-16 20:08:00', '2026-11-19 19:54:51'),
(8, 1, 5, 'exam_result_release', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Development Student (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', '2026-11-19 19:54:45', '{\"batch_id\":\"BATCH-D1RCL9OPCH\",\"channel\":\"whatsapp\",\"provider\":\"twilio\"}', '2026-11-16 20:08:00', '2026-11-19 19:54:46'),
(9, 1, 203, 'exam_result_release', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Chinedu Okafor (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', NULL, '{\"batch_id\":\"BATCH-D1RCL9OPCH\",\"channel\":\"whatsapp\",\"provider\":\"twilio\"}', '2026-11-16 20:08:01', '2026-11-16 20:08:01'),
(10, 1, 5, 'emergency_school_closure', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', '2026-11-19 19:55:01', '{\"batch_id\":\"BATCH-5OBAHNUCON\",\"channel\":\"whatsapp\",\"provider\":\"termii\"}', '2026-11-16 20:08:02', '2026-11-19 19:55:02'),
(11, 1, 203, 'emergency_school_closure', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', NULL, '{\"batch_id\":\"BATCH-5OBAHNUCON\",\"channel\":\"whatsapp\",\"provider\":\"termii\"}', '2026-11-16 20:08:02', '2026-11-16 20:08:02'),
(12, 1, 5, 'exam_result_release', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Development Student (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', '2026-11-22 19:57:42', '{\"batch_id\":\"BATCH-BVZ7Q8TUEE\",\"channel\":\"whatsapp\",\"provider\":\"termii\"}', '2026-11-22 18:48:58', '2026-11-22 19:57:44'),
(13, 1, 203, 'exam_result_release', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Chinedu Okafor (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', NULL, '{\"batch_id\":\"BATCH-BVZ7Q8TUEE\",\"channel\":\"whatsapp\",\"provider\":\"termii\"}', '2026-11-22 18:48:59', '2026-11-22 18:48:59'),
(14, 1, 208, 'exam_result_release', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Zainab Ibrahim (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', NULL, '{\"batch_id\":\"BATCH-BVZ7Q8TUEE\",\"channel\":\"whatsapp\",\"provider\":\"termii\"}', '2026-11-22 18:48:59', '2026-11-22 18:48:59');

-- --------------------------------------------------------

--
-- Table structure for table `notification_dispatches`
--

CREATE TABLE `notification_dispatches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED DEFAULT NULL,
  `batch_id` varchar(64) DEFAULT NULL,
  `queue_name` varchar(50) NOT NULL DEFAULT 'default',
  `channel` varchar(30) NOT NULL,
  `provider` varchar(40) NOT NULL DEFAULT 'log',
  `template_key` varchar(60) NOT NULL,
  `recipient` varchar(255) DEFAULT NULL,
  `recipient_name` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message_body` text DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'queued',
  `provider_message_id` varchar(120) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `dispatched_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_dispatches`
--

INSERT INTO `notification_dispatches` (`id`, `school_id`, `batch_id`, `queue_name`, `channel`, `provider`, `template_key`, `recipient`, `recipient_name`, `subject`, `message_body`, `status`, `provider_message_id`, `error_message`, `metadata`, `dispatched_at`, `completed_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'EMAIL-BATCH-GXVHATJO', 'emails', 'email', 'postmark', 'welcome_onboarding', 'parent.test@example.com', 'Test Parent', 'Welcome to Your Campus Portal Account — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Welcome to Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Portal Account Onboarding</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Test Parent</strong>,</p>\n      <p>Welcome to the <strong>Grace Academy</strong> digital campus portal! Your account has been provisioned and is ready for immediate access.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Your Portal Credentials</p>\n        <p style=\"margin:4px 0;\"><strong>Role:</strong> Student</p>\n        <p style=\"margin:4px 0;\"><strong>Login Email:</strong> parent.test@example.com</p>\n                  <p style=\"margin:4px 0;\"><strong>Admission / Staff ID:</strong> ADM/2026/001</p>\n                          <p style=\"margin:4px 0;\"><strong>Temporary Password:</strong> <code style=\"background:#e2e8f0;padding:2px 6px;border-radius:4px;\">Welcome@2026</code></p>\n              </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/login\" style=\"display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Sign In to Campus Portal\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">For security, please change your temporary password immediately after your first login.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via POSTMARK &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'POSTMARK-YYN3VIUM6NFX', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Test Parent\",\"recipientEmail\":\"parent.test@example.com\",\"provider\":\"postmark\",\"role\":\"student\",\"loginEmail\":\"parent.test@example.com\",\"admissionNumber\":\"ADM\\/2026\\/001\",\"temporaryPassword\":\"Welcome@2026\"}', '2026-11-16 20:03:42', '2026-11-16 20:03:42', '2026-11-16 20:03:39', '2026-11-16 20:03:42'),
(2, 1, 'EMAIL-BATCH-QELJLHOD', 'emails', 'email', 'postmark', 'welcome_onboarding', 'parent.test@example.com', 'Test Parent', 'Welcome to Your Campus Portal Account — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Welcome to Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Portal Account Onboarding</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Test Parent</strong>,</p>\n      <p>Welcome to the <strong>Grace Academy</strong> digital campus portal! Your account has been provisioned and is ready for immediate access.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Your Portal Credentials</p>\n        <p style=\"margin:4px 0;\"><strong>Role:</strong> Student</p>\n        <p style=\"margin:4px 0;\"><strong>Login Email:</strong> parent.test@example.com</p>\n                  <p style=\"margin:4px 0;\"><strong>Admission / Staff ID:</strong> ADM/2026/001</p>\n                          <p style=\"margin:4px 0;\"><strong>Temporary Password:</strong> <code style=\"background:#e2e8f0;padding:2px 6px;border-radius:4px;\">Welcome@2026</code></p>\n              </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/login\" style=\"display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Sign In to Campus Portal\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">For security, please change your temporary password immediately after your first login.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via POSTMARK &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'POSTMARK-7D4ZD5L0IAWD', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Test Parent\",\"recipientEmail\":\"parent.test@example.com\",\"provider\":\"postmark\",\"role\":\"student\",\"loginEmail\":\"parent.test@example.com\",\"admissionNumber\":\"ADM\\/2026\\/001\",\"temporaryPassword\":\"Welcome@2026\"}', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51'),
(3, 1, 'EMAIL-BATCH-WKWYLQHW', 'emails', 'email', 'sendgrid', 'password_reset', 'parent.test@example.com', 'Test Parent', 'Password Reset Instructions — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Password Reset Request — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Account Security &amp; Password Reset</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Hello <strong>Test Parent</strong>,</p>\n      <p>We received a request to reset the password for your <strong>Grace Academy</strong> account (parent.test@example.com).</p>\n\n      <div style=\"background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:18px 0;text-align:center;\">\n        <p style=\"margin:0 0 6px 0;font-size:11px;text-transform:uppercase;color:#9a3412;font-weight:bold;\">Reset Token / Code</p>\n        <p style=\"margin:0;font-size:18px;font-family:Courier,monospace;font-weight:bold;color:#c2410c;\">RST-JV4FITK1</p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/reset-password?token=RST-JV4FITK1\" style=\"display:inline-block;background-color:#f97316;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Reset Your Password\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">This password reset link will expire in 60 minutes. If you did not request a password reset, no further action is required.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via SENDGRID &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'SENDGRID-BMEG3X5FPIT6', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Test Parent\",\"recipientEmail\":\"parent.test@example.com\",\"provider\":\"sendgrid\",\"resetToken\":\"RST-JV4FITK1\",\"resetUrl\":\"http:\\/\\/localhost\\/reset-password?token=RST-JV4FITK1\"}', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51'),
(4, 1, 'EMAIL-BATCH-2HPGB16J', 'emails', 'email', 'ses', 'termly_invoice', 'student@example.test', 'Development Student', 'Official Termly Fee Invoice & Statement — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Termly Fee Invoice — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Termly Fee Invoice &amp; Statement</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Development Student</strong>,</p>\n      <p>The termly fee invoice for <strong>Development Student</strong> (DEV-STU-001 &bull; Basic 1) for <strong>2026/2027 </strong> is now available.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Invoice Summary (INV-1-20261116)</p>\n        <p style=\"margin:4px 0;\"><strong>Total Billed:</strong> NGN 0.00</p>\n        <p style=\"margin:4px 0;color:#15803d;\"><strong>Total Paid:</strong> NGN 0.00</p>\n        <p style=\"margin:8px 0 0 0;font-size:16px;color:#c2410c;\"><strong>Outstanding Balance Due: NGN 0.00</strong></p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/app/pay-fees\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;margin-right:8px;\">\n          Pay Fees Online (Paystack / Flutterwave / Monnify)\n        </a>\n      </p>\n\n              <p style=\"font-size:12px;text-align:center;\">\n          <a href=\"http://localhost/api/v1/documents/invoice/1/pdf\" style=\"color:#4f46e5;font-weight:bold;\">Download Official PDF Invoice with QR Verification</a>\n        </p>\n          </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via SES &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'SES-BYEEJABYD286', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Development Student\",\"recipientEmail\":\"student@example.test\",\"provider\":\"ses\",\"studentName\":\"Development Student\",\"admissionNumber\":\"DEV-STU-001\",\"className\":\"Basic 1\",\"invoiceNumber\":\"INV-1-20261116\",\"totalBilled\":0,\"totalPaid\":0,\"balanceDue\":0,\"invoicePdfUrl\":\"http:\\/\\/localhost\\/api\\/v1\\/documents\\/invoice\\/1\\/pdf\"}', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51'),
(5, 1, 'EMAIL-BATCH-2HPGB16J', 'emails', 'email', 'ses', 'termly_invoice', 'parent.stu-2026-001@example.com', 'David Adeleke', 'Official Termly Fee Invoice & Statement — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Termly Fee Invoice — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Termly Fee Invoice &amp; Statement</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>David Adeleke</strong>,</p>\n      <p>The termly fee invoice for <strong>David Adeleke</strong> (STU-2026-001 &bull; Assigned Class) for <strong>2026/2027 </strong> is now available.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Invoice Summary (INV-5-20261116)</p>\n        <p style=\"margin:4px 0;\"><strong>Total Billed:</strong> NGN 195,000.00</p>\n        <p style=\"margin:4px 0;color:#15803d;\"><strong>Total Paid:</strong> NGN 75,000.00</p>\n        <p style=\"margin:8px 0 0 0;font-size:16px;color:#c2410c;\"><strong>Outstanding Balance Due: NGN 120,000.00</strong></p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/app/pay-fees\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;margin-right:8px;\">\n          Pay Fees Online (Paystack / Flutterwave / Monnify)\n        </a>\n      </p>\n\n              <p style=\"font-size:12px;text-align:center;\">\n          <a href=\"http://localhost/api/v1/documents/invoice/5/pdf\" style=\"color:#4f46e5;font-weight:bold;\">Download Official PDF Invoice with QR Verification</a>\n        </p>\n          </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via SES &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'SES-SVM9MOI39G94', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"David Adeleke\",\"recipientEmail\":\"parent.stu-2026-001@example.com\",\"provider\":\"ses\",\"studentName\":\"David Adeleke\",\"admissionNumber\":\"STU-2026-001\",\"className\":\"Assigned Class\",\"invoiceNumber\":\"INV-5-20261116\",\"totalBilled\":195000,\"totalPaid\":75000,\"balanceDue\":120000,\"invoicePdfUrl\":\"http:\\/\\/localhost\\/api\\/v1\\/documents\\/invoice\\/5\\/pdf\"}', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51'),
(6, 1, 'EMAIL-BATCH-2HPGB16J', 'emails', 'email', 'ses', 'termly_invoice', 'parent.stu-4664@example.com', 'Chukwuemeka Obi', 'Official Termly Fee Invoice & Statement — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Termly Fee Invoice — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Termly Fee Invoice &amp; Statement</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Chukwuemeka Obi</strong>,</p>\n      <p>The termly fee invoice for <strong>Chukwuemeka Obi</strong> (STU-4664 &bull; SSS 1 Science 52) for <strong>2026/2027 </strong> is now available.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Invoice Summary (INV-75-20261116)</p>\n        <p style=\"margin:4px 0;\"><strong>Total Billed:</strong> NGN 195,000.00</p>\n        <p style=\"margin:4px 0;color:#15803d;\"><strong>Total Paid:</strong> NGN 195,000.00</p>\n        <p style=\"margin:8px 0 0 0;font-size:16px;color:#c2410c;\"><strong>Outstanding Balance Due: NGN 0.00</strong></p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/app/pay-fees\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;margin-right:8px;\">\n          Pay Fees Online (Paystack / Flutterwave / Monnify)\n        </a>\n      </p>\n\n              <p style=\"font-size:12px;text-align:center;\">\n          <a href=\"http://localhost/api/v1/documents/invoice/75/pdf\" style=\"color:#4f46e5;font-weight:bold;\">Download Official PDF Invoice with QR Verification</a>\n        </p>\n          </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via SES &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'SES-EWBERMRY3EDJ', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Chukwuemeka Obi\",\"recipientEmail\":\"parent.stu-4664@example.com\",\"provider\":\"ses\",\"studentName\":\"Chukwuemeka Obi\",\"admissionNumber\":\"STU-4664\",\"className\":\"SSS 1 Science 52\",\"invoiceNumber\":\"INV-75-20261116\",\"totalBilled\":195000,\"totalPaid\":195000,\"balanceDue\":0,\"invoicePdfUrl\":\"http:\\/\\/localhost\\/api\\/v1\\/documents\\/invoice\\/75\\/pdf\"}', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51'),
(7, 1, 'EMAIL-BATCH-2HPGB16J', 'emails', 'email', 'ses', 'termly_invoice', 'chinedu.applicant@example.test', 'Chinedu Okafor', 'Official Termly Fee Invoice & Statement — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Termly Fee Invoice — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Termly Fee Invoice &amp; Statement</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Chinedu Okafor</strong>,</p>\n      <p>The termly fee invoice for <strong>Chinedu Okafor</strong> (DEV-CAMPUS/2026/0644 &bull; Basic 1) for <strong>2026/2027 </strong> is now available.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Invoice Summary (INV-76-20261116)</p>\n        <p style=\"margin:4px 0;\"><strong>Total Billed:</strong> NGN 0.00</p>\n        <p style=\"margin:4px 0;color:#15803d;\"><strong>Total Paid:</strong> NGN 0.00</p>\n        <p style=\"margin:8px 0 0 0;font-size:16px;color:#c2410c;\"><strong>Outstanding Balance Due: NGN 0.00</strong></p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/app/pay-fees\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;margin-right:8px;\">\n          Pay Fees Online (Paystack / Flutterwave / Monnify)\n        </a>\n      </p>\n\n              <p style=\"font-size:12px;text-align:center;\">\n          <a href=\"http://localhost/api/v1/documents/invoice/76/pdf\" style=\"color:#4f46e5;font-weight:bold;\">Download Official PDF Invoice with QR Verification</a>\n        </p>\n          </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via SES &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'SES-OOLQILDDHHRQ', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Chinedu Okafor\",\"recipientEmail\":\"chinedu.applicant@example.test\",\"provider\":\"ses\",\"studentName\":\"Chinedu Okafor\",\"admissionNumber\":\"DEV-CAMPUS\\/2026\\/0644\",\"className\":\"Basic 1\",\"invoiceNumber\":\"INV-76-20261116\",\"totalBilled\":0,\"totalPaid\":0,\"balanceDue\":0,\"invoicePdfUrl\":\"http:\\/\\/localhost\\/api\\/v1\\/documents\\/invoice\\/76\\/pdf\"}', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51', '2026-11-16 20:05:51'),
(8, 1, 'EMAIL-BATCH-TUWHGGFE', 'emails', 'email', 'mailgun', 'admission_acceptance', 'p2time1@gmail.com', 'Primeson Aselemi', 'Congratulations! Offer of Provisional Admission — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Offer of Provisional Admission — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Offer of Provisional Admission</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Primeson Aselemi</strong>,</p>\n      <p>Congratulations! We are pleased to inform you that your application for admission to <strong>Grace Academy</strong> has been <strong>APPROVED</strong> for the <strong>2026/2027</strong> academic session.</p>\n\n      <div style=\"background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#065f46;font-weight:bold;\">Admission Offer Details</p>\n        <p style=\"margin:4px 0;\"><strong>Application Reference:</strong> <code style=\"font-weight:bold;\">APP-DEV-CAMPUS-HNWJCN</code></p>\n        <p style=\"margin:4px 0;\"><strong>Class / Programme Admitted:</strong> SSS 1 Science 52</p>\n        <p style=\"margin:4px 0;\"><strong>Academic Session:</strong> 2026/2027</p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/admission/signup\" style=\"display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;margin-right:8px;\">\n          Complete Student Portal Signup\n        </a>\n                  <a href=\"http://localhost/api/v1/documents/admission-letter/APP-DEV-CAMPUS-HNWJCN/pdf\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;\">\n            Download Admission Letter PDF\n          </a>\n              </p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via MAILGUN &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'MAILGUN-KZAJZQH38JXO', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Primeson Aselemi\",\"recipientEmail\":\"p2time1@gmail.com\",\"provider\":\"mailgun\",\"applicantName\":\"Primeson Aselemi\",\"applicationNumber\":\"APP-DEV-CAMPUS-HNWJCN\",\"programme\":\"SSS 1 Science 52\",\"admissionLetterPdfUrl\":\"http:\\/\\/localhost\\/api\\/v1\\/documents\\/admission-letter\\/APP-DEV-CAMPUS-HNWJCN\\/pdf\"}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(9, 1, 'BATCH-XTHOID1F5Q', 'sms', 'sms', 'termii', 'attendance_absence', '+2348030000001', 'Parent of Chukwuemeka Obi', 'Attendance Absence Alert', '[Grace Academy] ATTENDANCE ALERT: Chukwuemeka Obi (SSS 1 Science 52) was marked ABSENT today (2026-10-08 00:00:00). Please contact the school administration if this absence was unscheduled.', 'delivered', 'TER-SMS-TOYVAV6HT4', NULL, '{\"student_name\":\"Chukwuemeka Obi\",\"class_name\":\"SSS 1 Science 52\",\"date\":\"2026-10-08T00:00:00.000000Z\",\"user_id\":null}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(10, 1, 'BATCH-SAEACKKWXC', 'sms', 'sms', 'africastalking', 'fee_payment_reminder', '+2348030000002', 'Parent of Development Student', 'Fee Payment Reminder', '[Grace Academy] FEE REMINDER: Dear Parent, an outstanding fee balance of NGN 45,000.00 is due for Development Student (Basic 1). Kindly pay online via the Campus Portal.', 'delivered', 'AFR-SMS-DRZ9UVW3QT', NULL, '{\"student_name\":\"Development Student\",\"class_name\":\"Basic 1\",\"balance\":45000,\"user_id\":5}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(11, 1, 'BATCH-SAEACKKWXC', 'sms', 'sms', 'africastalking', 'fee_payment_reminder', '+2348030000002', 'Parent of David Adeleke', 'Fee Payment Reminder', '[Grace Academy] FEE REMINDER: Dear Parent, an outstanding fee balance of NGN 45,000.00 is due for David Adeleke. Kindly pay online via the Campus Portal.', 'delivered', 'AFR-SMS-5SOLC6IK4M', NULL, '{\"student_name\":\"David Adeleke\",\"class_name\":\"\",\"balance\":45000,\"user_id\":null}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(12, 1, 'BATCH-BL6GGJT0CM', 'whatsapp', 'whatsapp', 'twilio', 'exam_result_release', '+2348030000003', 'Parent of Development Student', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Development Student (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TWI-WHATSAPP-1B2TUORFK3', NULL, '{\"student_name\":\"Development Student\",\"class_name\":\"Basic 1\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":5}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(13, 1, 'BATCH-BL6GGJT0CM', 'whatsapp', 'whatsapp', 'twilio', 'exam_result_release', '+2348030000003', 'Parent of David Adeleke', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for David Adeleke (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TWI-WHATSAPP-ERQC4CVEZ1', NULL, '{\"student_name\":\"David Adeleke\",\"class_name\":\"\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":null}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(14, 1, 'BATCH-BL6GGJT0CM', 'whatsapp', 'whatsapp', 'twilio', 'exam_result_release', '+2348030000003', 'Parent of Chukwuemeka Obi', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Chukwuemeka Obi (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TWI-WHATSAPP-JODJGLXMW6', NULL, '{\"student_name\":\"Chukwuemeka Obi\",\"class_name\":\"SSS 1 Science 52\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":null}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(15, 1, 'BATCH-BL6GGJT0CM', 'whatsapp', 'whatsapp', 'twilio', 'exam_result_release', '08031234567', 'Parent of Chinedu Okafor', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Chinedu Okafor (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TWI-WHATSAPP-F0YMOZ1JXI', NULL, '{\"student_name\":\"Chinedu Okafor\",\"class_name\":\"Basic 1\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":203}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(16, 1, 'BATCH-KLYUX1LVA9', 'emergency', 'whatsapp', 'termii', 'emergency_school_closure', '+2348030000009', 'Parent of Development Student', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', 'delivered', 'TER-WHATSAPP-UQ4JHFUYMK', NULL, '{\"student_name\":\"Development Student\",\"custom_message\":\"Heavy rainfall advisory \\u2014 school closes at 1:00 PM today.\",\"date\":\"16 Nov 2026\",\"user_id\":5}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(17, 1, 'BATCH-KLYUX1LVA9', 'emergency', 'whatsapp', 'termii', 'emergency_school_closure', '+2348030000009', 'Parent of David Adeleke', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', 'delivered', 'TER-WHATSAPP-CUB9AWTWFZ', NULL, '{\"student_name\":\"David Adeleke\",\"custom_message\":\"Heavy rainfall advisory \\u2014 school closes at 1:00 PM today.\",\"date\":\"16 Nov 2026\",\"user_id\":null}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(18, 1, 'BATCH-KLYUX1LVA9', 'emergency', 'whatsapp', 'termii', 'emergency_school_closure', '+2348030000009', 'Parent of Chukwuemeka Obi', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', 'delivered', 'TER-WHATSAPP-KEUVS0A39N', NULL, '{\"student_name\":\"Chukwuemeka Obi\",\"custom_message\":\"Heavy rainfall advisory \\u2014 school closes at 1:00 PM today.\",\"date\":\"16 Nov 2026\",\"user_id\":null}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(19, 1, 'BATCH-KLYUX1LVA9', 'emergency', 'whatsapp', 'termii', 'emergency_school_closure', '08031234567', 'Parent of Chinedu Okafor', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', 'delivered', 'TER-WHATSAPP-FIZXERNZLM', NULL, '{\"student_name\":\"Chinedu Okafor\",\"custom_message\":\"Heavy rainfall advisory \\u2014 school closes at 1:00 PM today.\",\"date\":\"16 Nov 2026\",\"user_id\":203}', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52', '2026-11-16 20:05:52'),
(20, 1, 'PDF-BATCH-MJGSZBEM', 'pdf-compilation', 'pdf_batch', 'dompdf', 'bulk_report_cards', 'Class/School Batch (4 Students)', 'Bulk Report Card Compilation', 'Compiling 4 Official Report Cards (classic)', 'Asynchronous background job compiling 4 report cards on queue \'pdf-compilation\'.', 'failed', NULL, 'Call to undefined relationship [items] on model [App\\Models\\Result].', '{\"student_count\":4,\"session_id\":null,\"term_id\":null,\"class_id\":null,\"template\":\"classic\"}', '2026-11-16 20:05:52', '2026-11-16 20:05:55', '2026-11-16 20:05:52', '2026-11-16 20:05:55'),
(21, 1, 'EMAIL-BATCH-DAR6PHMT', 'emails', 'email', 'postmark', 'welcome_onboarding', 'parent.test@example.com', 'Test Parent', 'Welcome to Your Campus Portal Account — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Welcome to Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Portal Account Onboarding</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Test Parent</strong>,</p>\n      <p>Welcome to the <strong>Grace Academy</strong> digital campus portal! Your account has been provisioned and is ready for immediate access.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Your Portal Credentials</p>\n        <p style=\"margin:4px 0;\"><strong>Role:</strong> Student</p>\n        <p style=\"margin:4px 0;\"><strong>Login Email:</strong> parent.test@example.com</p>\n                  <p style=\"margin:4px 0;\"><strong>Admission / Staff ID:</strong> ADM/2026/001</p>\n                          <p style=\"margin:4px 0;\"><strong>Temporary Password:</strong> <code style=\"background:#e2e8f0;padding:2px 6px;border-radius:4px;\">Welcome@2026</code></p>\n              </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/login\" style=\"display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Sign In to Campus Portal\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">For security, please change your temporary password immediately after your first login.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via POSTMARK &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'POSTMARK-WZZKD1JSQEHO', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Test Parent\",\"recipientEmail\":\"parent.test@example.com\",\"provider\":\"postmark\",\"role\":\"student\",\"loginEmail\":\"parent.test@example.com\",\"admissionNumber\":\"ADM\\/2026\\/001\",\"temporaryPassword\":\"Welcome@2026\"}', '2026-11-16 20:07:56', '2026-11-16 20:07:56', '2026-11-16 20:07:56', '2026-11-16 20:07:56'),
(22, 1, 'EMAIL-BATCH-S3TJXF29', 'emails', 'email', 'sendgrid', 'password_reset', 'parent.test@example.com', 'Test Parent', 'Password Reset Instructions — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Password Reset Request — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Account Security &amp; Password Reset</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Hello <strong>Test Parent</strong>,</p>\n      <p>We received a request to reset the password for your <strong>Grace Academy</strong> account (parent.test@example.com).</p>\n\n      <div style=\"background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:18px 0;text-align:center;\">\n        <p style=\"margin:0 0 6px 0;font-size:11px;text-transform:uppercase;color:#9a3412;font-weight:bold;\">Reset Token / Code</p>\n        <p style=\"margin:0;font-size:18px;font-family:Courier,monospace;font-weight:bold;color:#c2410c;\">RST-DYATZFQD</p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/reset-password?token=RST-DYATZFQD\" style=\"display:inline-block;background-color:#f97316;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Reset Your Password\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">This password reset link will expire in 60 minutes. If you did not request a password reset, no further action is required.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via SENDGRID &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'SENDGRID-WKQCLMMXXOGP', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Test Parent\",\"recipientEmail\":\"parent.test@example.com\",\"provider\":\"sendgrid\",\"resetToken\":\"RST-DYATZFQD\",\"resetUrl\":\"http:\\/\\/localhost\\/reset-password?token=RST-DYATZFQD\"}', '2026-11-16 20:07:56', '2026-11-16 20:07:56', '2026-11-16 20:07:56', '2026-11-16 20:07:56'),
(23, 1, 'EMAIL-BATCH-IXA3BYJI', 'emails', 'email', 'ses', 'termly_invoice', 'student@example.test', 'Development Student', 'Official Termly Fee Invoice & Statement — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Termly Fee Invoice — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Termly Fee Invoice &amp; Statement</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Development Student</strong>,</p>\n      <p>The termly fee invoice for <strong>Development Student</strong> (DEV-STU-001 &bull; Basic 1) for <strong>2026/2027 </strong> is now available.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Invoice Summary (INV-1-20261116)</p>\n        <p style=\"margin:4px 0;\"><strong>Total Billed:</strong> NGN 0.00</p>\n        <p style=\"margin:4px 0;color:#15803d;\"><strong>Total Paid:</strong> NGN 0.00</p>\n        <p style=\"margin:8px 0 0 0;font-size:16px;color:#c2410c;\"><strong>Outstanding Balance Due: NGN 0.00</strong></p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/app/pay-fees\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;margin-right:8px;\">\n          Pay Fees Online (Paystack / Flutterwave / Monnify)\n        </a>\n      </p>\n\n              <p style=\"font-size:12px;text-align:center;\">\n          <a href=\"http://localhost/api/v1/documents/invoice/1/pdf\" style=\"color:#4f46e5;font-weight:bold;\">Download Official PDF Invoice with QR Verification</a>\n        </p>\n          </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via SES &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'SES-UBNQKSQ2HKD1', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Development Student\",\"recipientEmail\":\"student@example.test\",\"provider\":\"ses\",\"studentName\":\"Development Student\",\"admissionNumber\":\"DEV-STU-001\",\"className\":\"Basic 1\",\"invoiceNumber\":\"INV-1-20261116\",\"totalBilled\":0,\"totalPaid\":0,\"balanceDue\":0,\"invoicePdfUrl\":\"http:\\/\\/localhost\\/api\\/v1\\/documents\\/invoice\\/1\\/pdf\"}', '2026-11-16 20:07:57', '2026-11-16 20:07:57', '2026-11-16 20:07:57', '2026-11-16 20:07:57'),
(24, 1, 'EMAIL-BATCH-IXA3BYJI', 'emails', 'email', 'ses', 'termly_invoice', 'parent.stu-2026-001@example.com', 'David Adeleke', 'Official Termly Fee Invoice & Statement — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Termly Fee Invoice — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Termly Fee Invoice &amp; Statement</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>David Adeleke</strong>,</p>\n      <p>The termly fee invoice for <strong>David Adeleke</strong> (STU-2026-001 &bull; Assigned Class) for <strong>2026/2027 </strong> is now available.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Invoice Summary (INV-5-20261116)</p>\n        <p style=\"margin:4px 0;\"><strong>Total Billed:</strong> NGN 195,000.00</p>\n        <p style=\"margin:4px 0;color:#15803d;\"><strong>Total Paid:</strong> NGN 75,000.00</p>\n        <p style=\"margin:8px 0 0 0;font-size:16px;color:#c2410c;\"><strong>Outstanding Balance Due: NGN 120,000.00</strong></p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/app/pay-fees\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;margin-right:8px;\">\n          Pay Fees Online (Paystack / Flutterwave / Monnify)\n        </a>\n      </p>\n\n              <p style=\"font-size:12px;text-align:center;\">\n          <a href=\"http://localhost/api/v1/documents/invoice/5/pdf\" style=\"color:#4f46e5;font-weight:bold;\">Download Official PDF Invoice with QR Verification</a>\n        </p>\n          </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via SES &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'SES-JMRG8SCRPEH4', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"David Adeleke\",\"recipientEmail\":\"parent.stu-2026-001@example.com\",\"provider\":\"ses\",\"studentName\":\"David Adeleke\",\"admissionNumber\":\"STU-2026-001\",\"className\":\"Assigned Class\",\"invoiceNumber\":\"INV-5-20261116\",\"totalBilled\":195000,\"totalPaid\":75000,\"balanceDue\":120000,\"invoicePdfUrl\":\"http:\\/\\/localhost\\/api\\/v1\\/documents\\/invoice\\/5\\/pdf\"}', '2026-11-16 20:07:57', '2026-11-16 20:07:57', '2026-11-16 20:07:57', '2026-11-16 20:07:57'),
(25, 1, 'EMAIL-BATCH-IXA3BYJI', 'emails', 'email', 'ses', 'termly_invoice', 'parent.stu-4664@example.com', 'Chukwuemeka Obi', 'Official Termly Fee Invoice & Statement — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Termly Fee Invoice — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Termly Fee Invoice &amp; Statement</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Chukwuemeka Obi</strong>,</p>\n      <p>The termly fee invoice for <strong>Chukwuemeka Obi</strong> (STU-4664 &bull; SSS 1 Science 52) for <strong>2026/2027 </strong> is now available.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Invoice Summary (INV-75-20261116)</p>\n        <p style=\"margin:4px 0;\"><strong>Total Billed:</strong> NGN 195,000.00</p>\n        <p style=\"margin:4px 0;color:#15803d;\"><strong>Total Paid:</strong> NGN 195,000.00</p>\n        <p style=\"margin:8px 0 0 0;font-size:16px;color:#c2410c;\"><strong>Outstanding Balance Due: NGN 0.00</strong></p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/app/pay-fees\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;margin-right:8px;\">\n          Pay Fees Online (Paystack / Flutterwave / Monnify)\n        </a>\n      </p>\n\n              <p style=\"font-size:12px;text-align:center;\">\n          <a href=\"http://localhost/api/v1/documents/invoice/75/pdf\" style=\"color:#4f46e5;font-weight:bold;\">Download Official PDF Invoice with QR Verification</a>\n        </p>\n          </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via SES &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'SES-0ATIBLZOC3LN', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Chukwuemeka Obi\",\"recipientEmail\":\"parent.stu-4664@example.com\",\"provider\":\"ses\",\"studentName\":\"Chukwuemeka Obi\",\"admissionNumber\":\"STU-4664\",\"className\":\"SSS 1 Science 52\",\"invoiceNumber\":\"INV-75-20261116\",\"totalBilled\":195000,\"totalPaid\":195000,\"balanceDue\":0,\"invoicePdfUrl\":\"http:\\/\\/localhost\\/api\\/v1\\/documents\\/invoice\\/75\\/pdf\"}', '2026-11-16 20:07:57', '2026-11-16 20:07:57', '2026-11-16 20:07:57', '2026-11-16 20:07:57');
INSERT INTO `notification_dispatches` (`id`, `school_id`, `batch_id`, `queue_name`, `channel`, `provider`, `template_key`, `recipient`, `recipient_name`, `subject`, `message_body`, `status`, `provider_message_id`, `error_message`, `metadata`, `dispatched_at`, `completed_at`, `created_at`, `updated_at`) VALUES
(26, 1, 'EMAIL-BATCH-IXA3BYJI', 'emails', 'email', 'ses', 'termly_invoice', 'chinedu.applicant@example.test', 'Chinedu Okafor', 'Official Termly Fee Invoice & Statement — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Termly Fee Invoice — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Termly Fee Invoice &amp; Statement</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Chinedu Okafor</strong>,</p>\n      <p>The termly fee invoice for <strong>Chinedu Okafor</strong> (DEV-CAMPUS/2026/0644 &bull; Basic 1) for <strong>2026/2027 </strong> is now available.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Invoice Summary (INV-76-20261116)</p>\n        <p style=\"margin:4px 0;\"><strong>Total Billed:</strong> NGN 0.00</p>\n        <p style=\"margin:4px 0;color:#15803d;\"><strong>Total Paid:</strong> NGN 0.00</p>\n        <p style=\"margin:8px 0 0 0;font-size:16px;color:#c2410c;\"><strong>Outstanding Balance Due: NGN 0.00</strong></p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/app/pay-fees\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;margin-right:8px;\">\n          Pay Fees Online (Paystack / Flutterwave / Monnify)\n        </a>\n      </p>\n\n              <p style=\"font-size:12px;text-align:center;\">\n          <a href=\"http://localhost/api/v1/documents/invoice/76/pdf\" style=\"color:#4f46e5;font-weight:bold;\">Download Official PDF Invoice with QR Verification</a>\n        </p>\n          </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via SES &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'SES-0ZRLSIEMW0DK', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Chinedu Okafor\",\"recipientEmail\":\"chinedu.applicant@example.test\",\"provider\":\"ses\",\"studentName\":\"Chinedu Okafor\",\"admissionNumber\":\"DEV-CAMPUS\\/2026\\/0644\",\"className\":\"Basic 1\",\"invoiceNumber\":\"INV-76-20261116\",\"totalBilled\":0,\"totalPaid\":0,\"balanceDue\":0,\"invoicePdfUrl\":\"http:\\/\\/localhost\\/api\\/v1\\/documents\\/invoice\\/76\\/pdf\"}', '2026-11-16 20:07:58', '2026-11-16 20:07:58', '2026-11-16 20:07:58', '2026-11-16 20:07:58'),
(27, 1, 'EMAIL-BATCH-QFCYUE2B', 'emails', 'email', 'mailgun', 'admission_acceptance', 'p2time1@gmail.com', 'Primeson Aselemi', 'Congratulations! Offer of Provisional Admission — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Offer of Provisional Admission — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Offer of Provisional Admission</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Primeson Aselemi</strong>,</p>\n      <p>Congratulations! We are pleased to inform you that your application for admission to <strong>Grace Academy</strong> has been <strong>APPROVED</strong> for the <strong>2026/2027</strong> academic session.</p>\n\n      <div style=\"background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#065f46;font-weight:bold;\">Admission Offer Details</p>\n        <p style=\"margin:4px 0;\"><strong>Application Reference:</strong> <code style=\"font-weight:bold;\">APP-DEV-CAMPUS-HNWJCN</code></p>\n        <p style=\"margin:4px 0;\"><strong>Class / Programme Admitted:</strong> SSS 1 Science 52</p>\n        <p style=\"margin:4px 0;\"><strong>Academic Session:</strong> 2026/2027</p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/admission/signup\" style=\"display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;margin-right:8px;\">\n          Complete Student Portal Signup\n        </a>\n                  <a href=\"http://localhost/api/v1/documents/admission-letter/APP-DEV-CAMPUS-HNWJCN/pdf\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;\">\n            Download Admission Letter PDF\n          </a>\n              </p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via MAILGUN &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'MAILGUN-RS1HINODAWAQ', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Primeson Aselemi\",\"recipientEmail\":\"p2time1@gmail.com\",\"provider\":\"mailgun\",\"applicantName\":\"Primeson Aselemi\",\"applicationNumber\":\"APP-DEV-CAMPUS-HNWJCN\",\"programme\":\"SSS 1 Science 52\",\"admissionLetterPdfUrl\":\"http:\\/\\/localhost\\/api\\/v1\\/documents\\/admission-letter\\/APP-DEV-CAMPUS-HNWJCN\\/pdf\"}', '2026-11-16 20:07:58', '2026-11-16 20:07:58', '2026-11-16 20:07:58', '2026-11-16 20:07:58'),
(28, 1, 'BATCH-BB6EPAR28T', 'sms', 'sms', 'termii', 'attendance_absence', '+2348030000001', 'Parent of Chukwuemeka Obi', 'Attendance Absence Alert', '[Grace Academy] ATTENDANCE ALERT: Chukwuemeka Obi (SSS 1 Science 52) was marked ABSENT today (2026-10-08 00:00:00). Please contact the school administration if this absence was unscheduled.', 'delivered', 'TER-SMS-VXBW0W01Q7', NULL, '{\"student_name\":\"Chukwuemeka Obi\",\"class_name\":\"SSS 1 Science 52\",\"date\":\"2026-10-08T00:00:00.000000Z\",\"user_id\":null}', '2026-11-16 20:07:58', '2026-11-16 20:07:58', '2026-11-16 20:07:58', '2026-11-16 20:07:58'),
(29, 1, 'BATCH-KG2XYZR87I', 'sms', 'sms', 'africastalking', 'fee_payment_reminder', '+2348030000002', 'Parent of Development Student', 'Fee Payment Reminder', '[Grace Academy] FEE REMINDER: Dear Parent, an outstanding fee balance of NGN 45,000.00 is due for Development Student (Basic 1). Kindly pay online via the Campus Portal.', 'delivered', 'AFR-SMS-DNH5GVJ7CN', NULL, '{\"student_name\":\"Development Student\",\"class_name\":\"Basic 1\",\"balance\":45000,\"user_id\":5}', '2026-11-16 20:08:00', '2026-11-16 20:08:00', '2026-11-16 20:08:00', '2026-11-16 20:08:00'),
(30, 1, 'BATCH-KG2XYZR87I', 'sms', 'sms', 'africastalking', 'fee_payment_reminder', '+2348030000002', 'Parent of David Adeleke', 'Fee Payment Reminder', '[Grace Academy] FEE REMINDER: Dear Parent, an outstanding fee balance of NGN 45,000.00 is due for David Adeleke. Kindly pay online via the Campus Portal.', 'delivered', 'AFR-SMS-ME4BARF5RI', NULL, '{\"student_name\":\"David Adeleke\",\"class_name\":\"\",\"balance\":45000,\"user_id\":null}', '2026-11-16 20:08:00', '2026-11-16 20:08:00', '2026-11-16 20:08:00', '2026-11-16 20:08:00'),
(31, 1, 'BATCH-D1RCL9OPCH', 'whatsapp', 'whatsapp', 'twilio', 'exam_result_release', '+2348030000003', 'Parent of Development Student', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Development Student (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TWI-WHATSAPP-FG0BGONOAP', NULL, '{\"student_name\":\"Development Student\",\"class_name\":\"Basic 1\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":5}', '2026-11-16 20:08:01', '2026-11-16 20:08:01', '2026-11-16 20:08:00', '2026-11-16 20:08:01'),
(32, 1, 'BATCH-D1RCL9OPCH', 'whatsapp', 'whatsapp', 'twilio', 'exam_result_release', '+2348030000003', 'Parent of David Adeleke', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for David Adeleke (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TWI-WHATSAPP-HNGDFEQ5JV', NULL, '{\"student_name\":\"David Adeleke\",\"class_name\":\"\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":null}', '2026-11-16 20:08:01', '2026-11-16 20:08:01', '2026-11-16 20:08:01', '2026-11-16 20:08:01'),
(33, 1, 'BATCH-D1RCL9OPCH', 'whatsapp', 'whatsapp', 'twilio', 'exam_result_release', '+2348030000003', 'Parent of Chukwuemeka Obi', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Chukwuemeka Obi (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TWI-WHATSAPP-P0QVQ8REKN', NULL, '{\"student_name\":\"Chukwuemeka Obi\",\"class_name\":\"SSS 1 Science 52\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":null}', '2026-11-16 20:08:01', '2026-11-16 20:08:01', '2026-11-16 20:08:01', '2026-11-16 20:08:01'),
(34, 1, 'BATCH-D1RCL9OPCH', 'whatsapp', 'whatsapp', 'twilio', 'exam_result_release', '08031234567', 'Parent of Chinedu Okafor', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Chinedu Okafor (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TWI-WHATSAPP-GU8IC7OKIK', NULL, '{\"student_name\":\"Chinedu Okafor\",\"class_name\":\"Basic 1\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":203}', '2026-11-16 20:08:01', '2026-11-16 20:08:01', '2026-11-16 20:08:01', '2026-11-16 20:08:01'),
(35, 1, 'BATCH-5OBAHNUCON', 'emergency', 'whatsapp', 'termii', 'emergency_school_closure', '+2348030000009', 'Parent of Development Student', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', 'delivered', 'TER-WHATSAPP-EATGVEJSN8', NULL, '{\"student_name\":\"Development Student\",\"custom_message\":\"Heavy rainfall advisory \\u2014 school closes at 1:00 PM today.\",\"date\":\"16 Nov 2026\",\"user_id\":5}', '2026-11-16 20:08:02', '2026-11-16 20:08:02', '2026-11-16 20:08:01', '2026-11-16 20:08:02'),
(36, 1, 'BATCH-5OBAHNUCON', 'emergency', 'whatsapp', 'termii', 'emergency_school_closure', '+2348030000009', 'Parent of David Adeleke', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', 'delivered', 'TER-WHATSAPP-AFLBCBWGZN', NULL, '{\"student_name\":\"David Adeleke\",\"custom_message\":\"Heavy rainfall advisory \\u2014 school closes at 1:00 PM today.\",\"date\":\"16 Nov 2026\",\"user_id\":null}', '2026-11-16 20:08:02', '2026-11-16 20:08:02', '2026-11-16 20:08:02', '2026-11-16 20:08:02'),
(37, 1, 'BATCH-5OBAHNUCON', 'emergency', 'whatsapp', 'termii', 'emergency_school_closure', '+2348030000009', 'Parent of Chukwuemeka Obi', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', 'delivered', 'TER-WHATSAPP-CHULWQHPDY', NULL, '{\"student_name\":\"Chukwuemeka Obi\",\"custom_message\":\"Heavy rainfall advisory \\u2014 school closes at 1:00 PM today.\",\"date\":\"16 Nov 2026\",\"user_id\":null}', '2026-11-16 20:08:02', '2026-11-16 20:08:02', '2026-11-16 20:08:02', '2026-11-16 20:08:02'),
(38, 1, 'BATCH-5OBAHNUCON', 'emergency', 'whatsapp', 'termii', 'emergency_school_closure', '08031234567', 'Parent of Chinedu Okafor', 'Emergency School Closure Broadcast', '[Grace Academy] URGENT NOTICE: Heavy rainfall advisory — school closes at 1:00 PM today.', 'delivered', 'TER-WHATSAPP-TJM086LFBU', NULL, '{\"student_name\":\"Chinedu Okafor\",\"custom_message\":\"Heavy rainfall advisory \\u2014 school closes at 1:00 PM today.\",\"date\":\"16 Nov 2026\",\"user_id\":203}', '2026-11-16 20:08:02', '2026-11-16 20:08:02', '2026-11-16 20:08:02', '2026-11-16 20:08:02'),
(39, 1, 'PDF-BATCH-OOJNTI5N', 'pdf-compilation', 'pdf_batch', 'dompdf', 'bulk_report_cards', 'Class/School Batch (4 Students)', 'Bulk Report Card Compilation', 'Compiling 4 Official Report Cards (classic)', 'Asynchronous background job compiling 4 report cards on queue \'pdf-compilation\'.', 'completed', 'PDF-BATCH-4', NULL, '{\"student_count\":4,\"session_id\":null,\"term_id\":null,\"class_id\":null,\"template\":\"classic\",\"compiled_count\":4,\"total_bytes\":90990,\"storage_folder\":\"public\\/report_batches\\/PDF-BATCH-OOJNTI5N\"}', '2026-11-16 20:08:02', '2026-11-16 20:08:09', '2026-11-16 20:08:02', '2026-11-16 20:08:09'),
(40, 1, NULL, 'emails', 'email', 'mailgun', 'welcome_onboarding', 'zainab.43e19f@example.com', 'Zainab Ibrahim', 'Welcome to Your Campus Portal Account — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Welcome to Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Portal Account Onboarding</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Zainab Ibrahim</strong>,</p>\n      <p>Welcome to the <strong>Grace Academy</strong> digital campus portal! Your account has been provisioned and is ready for immediate access.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Your Portal Credentials</p>\n        <p style=\"margin:4px 0;\"><strong>Role:</strong> Student</p>\n        <p style=\"margin:4px 0;\"><strong>Login Email:</strong> DEVCAMPUS-STU-7Z6TTL / zainab.43e19f@example.com</p>\n                  <p style=\"margin:4px 0;\"><strong>Admission / Staff ID:</strong> DEVCAMPUS/2026/4805</p>\n                          <p style=\"margin:4px 0;\"><strong>Temporary Password:</strong> <code style=\"background:#e2e8f0;padding:2px 6px;border-radius:4px;\">12345678</code></p>\n              </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/login\" style=\"display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Sign In to Campus Portal\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">For security, please change your temporary password immediately after your first login.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via MAILGUN &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'MAILGUN-2MSZETF5YXA2', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Zainab Ibrahim\",\"recipientEmail\":\"zainab.43e19f@example.com\",\"provider\":\"mailgun\",\"role\":\"student\",\"loginEmail\":\"DEVCAMPUS-STU-7Z6TTL \\/ zainab.43e19f@example.com\",\"admissionNumber\":\"DEVCAMPUS\\/2026\\/4805\",\"temporaryPassword\":\"12345678\"}', '2026-11-20 21:56:07', '2026-11-20 21:56:08', '2026-11-20 21:55:57', '2026-11-20 21:56:08'),
(41, 1, NULL, 'emails', 'email', 'mailgun', 'welcome_onboarding', 'musa.ibrahim.43e19f@example.com', 'Alhaji Musa Ibrahim', 'Welcome to Your Campus Portal Account — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Welcome to Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Portal Account Onboarding</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Alhaji Musa Ibrahim</strong>,</p>\n      <p>Welcome to the <strong>Grace Academy</strong> digital campus portal! Your account has been provisioned and is ready for immediate access.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Your Portal Credentials</p>\n        <p style=\"margin:4px 0;\"><strong>Role:</strong> Parent</p>\n        <p style=\"margin:4px 0;\"><strong>Login Email:</strong> DEVCAMPUS-PAR-7TKHVO / musa.ibrahim.43e19f@example.com</p>\n                  <p style=\"margin:4px 0;\"><strong>Admission / Staff ID:</strong> Linked Student: Zainab Ibrahim (DEVCAMPUS/2026/4805)</p>\n                          <p style=\"margin:4px 0;\"><strong>Temporary Password:</strong> <code style=\"background:#e2e8f0;padding:2px 6px;border-radius:4px;\">12345678</code></p>\n              </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/login\" style=\"display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Sign In to Campus Portal\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">For security, please change your temporary password immediately after your first login.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via MAILGUN &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'MAILGUN-JBJSLZKBLSNE', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Alhaji Musa Ibrahim\",\"recipientEmail\":\"musa.ibrahim.43e19f@example.com\",\"provider\":\"mailgun\",\"role\":\"parent\",\"loginEmail\":\"DEVCAMPUS-PAR-7TKHVO \\/ musa.ibrahim.43e19f@example.com\",\"admissionNumber\":\"Linked Student: Zainab Ibrahim (DEVCAMPUS\\/2026\\/4805)\",\"temporaryPassword\":\"12345678\"}', '2026-11-20 21:56:08', '2026-11-20 21:56:08', '2026-11-20 21:56:08', '2026-11-20 21:56:08'),
(42, 1, NULL, 'emails', 'email', 'mailgun', 'welcome_onboarding', 'zainab.d19091@example.com', 'Zainab Ibrahim', 'Welcome to Your Campus Portal Account — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Welcome to Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Portal Account Onboarding</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Zainab Ibrahim</strong>,</p>\n      <p>Welcome to the <strong>Grace Academy</strong> digital campus portal! Your account has been provisioned and is ready for immediate access.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Your Portal Credentials</p>\n        <p style=\"margin:4px 0;\"><strong>Role:</strong> Student</p>\n        <p style=\"margin:4px 0;\"><strong>Login Email:</strong> DEVCAMPUS-STU-CV4VP0 / zainab.d19091@example.com</p>\n                  <p style=\"margin:4px 0;\"><strong>Admission / Staff ID:</strong> DEVCAMPUS/2026/4339</p>\n                          <p style=\"margin:4px 0;\"><strong>Temporary Password:</strong> <code style=\"background:#e2e8f0;padding:2px 6px;border-radius:4px;\">12345678</code></p>\n              </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/login\" style=\"display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Sign In to Campus Portal\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">For security, please change your temporary password immediately after your first login.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via MAILGUN &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'MAILGUN-LFP7SCIHGLLI', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Zainab Ibrahim\",\"recipientEmail\":\"zainab.d19091@example.com\",\"provider\":\"mailgun\",\"role\":\"student\",\"loginEmail\":\"DEVCAMPUS-STU-CV4VP0 \\/ zainab.d19091@example.com\",\"admissionNumber\":\"DEVCAMPUS\\/2026\\/4339\",\"temporaryPassword\":\"12345678\"}', '2026-11-20 21:57:42', '2026-11-20 21:57:43', '2026-11-20 21:57:42', '2026-11-20 21:57:43'),
(43, 1, NULL, 'emails', 'email', 'mailgun', 'welcome_onboarding', 'musa.ibrahim.d19091@example.com', 'Alhaji Musa Ibrahim', 'Welcome to Your Campus Portal Account — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Welcome to Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Portal Account Onboarding</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Alhaji Musa Ibrahim</strong>,</p>\n      <p>Welcome to the <strong>Grace Academy</strong> digital campus portal! Your account has been provisioned and is ready for immediate access.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Your Portal Credentials</p>\n        <p style=\"margin:4px 0;\"><strong>Role:</strong> Parent</p>\n        <p style=\"margin:4px 0;\"><strong>Login Email:</strong> DEVCAMPUS-PAR-FMGH3Q / musa.ibrahim.d19091@example.com</p>\n                  <p style=\"margin:4px 0;\"><strong>Admission / Staff ID:</strong> Linked Student: Zainab Ibrahim (DEVCAMPUS/2026/4339)</p>\n                          <p style=\"margin:4px 0;\"><strong>Temporary Password:</strong> <code style=\"background:#e2e8f0;padding:2px 6px;border-radius:4px;\">12345678</code></p>\n              </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/login\" style=\"display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Sign In to Campus Portal\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">For security, please change your temporary password immediately after your first login.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via MAILGUN &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'MAILGUN-B9SUGWZ4XYIB', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Alhaji Musa Ibrahim\",\"recipientEmail\":\"musa.ibrahim.d19091@example.com\",\"provider\":\"mailgun\",\"role\":\"parent\",\"loginEmail\":\"DEVCAMPUS-PAR-FMGH3Q \\/ musa.ibrahim.d19091@example.com\",\"admissionNumber\":\"Linked Student: Zainab Ibrahim (DEVCAMPUS\\/2026\\/4339)\",\"temporaryPassword\":\"12345678\"}', '2026-11-20 21:57:44', '2026-11-20 21:57:44', '2026-11-20 21:57:43', '2026-11-20 21:57:44'),
(44, 1, 'BATCH-BVZ7Q8TUEE', 'whatsapp', 'whatsapp', 'termii', 'exam_result_release', '+2348030000003', 'Parent of Development Student', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Development Student (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TER-WHATSAPP-GPMN5PKUJR', NULL, '{\"student_name\":\"Development Student\",\"class_name\":\"Basic 1\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":5}', '2026-11-22 18:48:59', '2026-11-22 18:48:59', '2026-11-22 18:48:58', '2026-11-22 18:48:59'),
(45, 1, 'BATCH-BVZ7Q8TUEE', 'whatsapp', 'whatsapp', 'termii', 'exam_result_release', '+2348030000003', 'Parent of David Adeleke', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for David Adeleke (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TER-WHATSAPP-YRDEX6TTGV', NULL, '{\"student_name\":\"David Adeleke\",\"class_name\":\"\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":null}', '2026-11-22 18:48:59', '2026-11-22 18:48:59', '2026-11-22 18:48:59', '2026-11-22 18:48:59'),
(46, 1, 'BATCH-BVZ7Q8TUEE', 'whatsapp', 'whatsapp', 'termii', 'exam_result_release', '+2348030000003', 'Parent of Chukwuemeka Obi', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Chukwuemeka Obi (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TER-WHATSAPP-UKE1T8UH3G', NULL, '{\"student_name\":\"Chukwuemeka Obi\",\"class_name\":\"SSS 1 Science 52\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":null}', '2026-11-22 18:48:59', '2026-11-22 18:48:59', '2026-11-22 18:48:59', '2026-11-22 18:48:59'),
(47, 1, 'BATCH-BVZ7Q8TUEE', 'whatsapp', 'whatsapp', 'termii', 'exam_result_release', '08031234567', 'Parent of Chinedu Okafor', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Chinedu Okafor (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TER-WHATSAPP-XQJYFEXLG7', NULL, '{\"student_name\":\"Chinedu Okafor\",\"class_name\":\"Basic 1\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":203}', '2026-11-22 18:48:59', '2026-11-22 18:48:59', '2026-11-22 18:48:59', '2026-11-22 18:48:59'),
(48, 1, 'BATCH-BVZ7Q8TUEE', 'whatsapp', 'whatsapp', 'termii', 'exam_result_release', '08091112233', 'Parent of Zainab Ibrahim', 'Exam Result Release Alert', '[Grace Academy] RESULT PUBLISHED: Official term examination results for Zainab Ibrahim (2026/2027 First Term) have been released. Log in to the portal to view and download the Report Card PDF.', 'delivered', 'TER-WHATSAPP-QROBZRKZIX', NULL, '{\"student_name\":\"Zainab Ibrahim\",\"class_name\":\"Basic 1\",\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"user_id\":208}', '2026-11-22 18:48:59', '2026-11-22 18:48:59', '2026-11-22 18:48:59', '2026-11-22 18:48:59'),
(49, 1, NULL, 'emails', 'email', 'mailgun', 'admission_acceptance', 'aselemiprimeskmon@gmail.com', 'Lovell Neves', 'Congratulations! Offer of Provisional Admission — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Offer of Provisional Admission — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Offer of Provisional Admission</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Lovell Neves</strong>,</p>\n      <p>Congratulations! We are pleased to inform you that your application for admission to <strong>Grace Academy</strong> has been <strong>APPROVED</strong> for the <strong>2026/2027</strong> academic session.</p>\n\n      <div style=\"background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#065f46;font-weight:bold;\">Admission Offer Details</p>\n        <p style=\"margin:4px 0;\"><strong>Application Reference:</strong> <code style=\"font-weight:bold;\">APP-DEV-CAMPUS-O2YG8R</code></p>\n        <p style=\"margin:4px 0;\"><strong>Class / Programme Admitted:</strong> Basic 1</p>\n        <p style=\"margin:4px 0;\"><strong>Academic Session:</strong> 2026/2027</p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/admission/signup\" style=\"display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;margin-right:8px;\">\n          Complete Student Portal Signup\n        </a>\n                  <a href=\"http://127.0.0.1:8000/api/v1/documents/admission-letter/APP-DEV-CAMPUS-O2YG8R/pdf\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;\">\n            Download Admission Letter PDF\n          </a>\n              </p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via MAILGUN &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'MAILGUN-JZALT8ISHSI4', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Lovell Neves\",\"recipientEmail\":\"aselemiprimeskmon@gmail.com\",\"provider\":\"mailgun\",\"applicantName\":\"Lovell Neves\",\"applicationNumber\":\"APP-DEV-CAMPUS-O2YG8R\",\"programme\":\"Basic 1\",\"admissionLetterPdfUrl\":\"http:\\/\\/127.0.0.1:8000\\/api\\/v1\\/documents\\/admission-letter\\/APP-DEV-CAMPUS-O2YG8R\\/pdf\"}', '2026-11-22 19:23:03', '2026-11-22 19:23:03', '2026-11-22 19:23:03', '2026-11-22 19:23:03'),
(50, 1, NULL, 'emails', 'email', 'mailgun', 'admission_acceptance', 'mail@mail.com', 'friday aki', 'Congratulations! Offer of Provisional Admission — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Offer of Provisional Admission — Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Offer of Provisional Admission</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>friday aki</strong>,</p>\n      <p>Congratulations! We are pleased to inform you that your application for admission to <strong>Grace Academy</strong> has been <strong>APPROVED</strong> for the <strong>2026/2027</strong> academic session.</p>\n\n      <div style=\"background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#065f46;font-weight:bold;\">Admission Offer Details</p>\n        <p style=\"margin:4px 0;\"><strong>Application Reference:</strong> <code style=\"font-weight:bold;\">APP/GA/2026/XQFTUB</code></p>\n        <p style=\"margin:4px 0;\"><strong>Class / Programme Admitted:</strong> Basic 1</p>\n        <p style=\"margin:4px 0;\"><strong>Academic Session:</strong> 2026/2027</p>\n      </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/admission/signup\" style=\"display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;margin-right:8px;\">\n          Complete Student Portal Signup\n        </a>\n                  <a href=\"http://127.0.0.1:8000/api/v1/documents/admission-letter/APP/GA/2026/XQFTUB/pdf\" style=\"display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;\">\n            Download Admission Letter PDF\n          </a>\n              </p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via MAILGUN &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'MAILGUN-9GFXTW1IFPNU', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"friday aki\",\"recipientEmail\":\"mail@mail.com\",\"provider\":\"mailgun\",\"applicantName\":\"friday aki\",\"applicationNumber\":\"APP\\/GA\\/2026\\/XQFTUB\",\"programme\":\"Basic 1\",\"admissionLetterPdfUrl\":\"http:\\/\\/127.0.0.1:8000\\/api\\/v1\\/documents\\/admission-letter\\/APP\\/GA\\/2026\\/XQFTUB\\/pdf\"}', '2026-11-22 20:04:05', '2026-11-22 20:04:05', '2026-11-22 20:04:05', '2026-11-22 20:04:05'),
(51, 1, NULL, 'emails', 'email', 'mailgun', 'welcome_onboarding', 'mail@mail.com', 'friday aki', 'Welcome to Your Campus Portal Account — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Welcome to Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Portal Account Onboarding</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>friday aki</strong>,</p>\n      <p>Welcome to the <strong>Grace Academy</strong> digital campus portal! Your account has been provisioned and is ready for immediate access.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Your Portal Credentials</p>\n        <p style=\"margin:4px 0;\"><strong>Role:</strong> Student</p>\n        <p style=\"margin:4px 0;\"><strong>Login Email:</strong> GA-STU-FAASSG / mail@mail.com</p>\n                  <p style=\"margin:4px 0;\"><strong>Admission / Staff ID:</strong> GA/2026/9508</p>\n                          <p style=\"margin:4px 0;\"><strong>Temporary Password:</strong> <code style=\"background:#e2e8f0;padding:2px 6px;border-radius:4px;\">12345678</code></p>\n              </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/login\" style=\"display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Sign In to Campus Portal\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">For security, please change your temporary password immediately after your first login.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via MAILGUN &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'MAILGUN-5HU4NXCDMQUC', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"friday aki\",\"recipientEmail\":\"mail@mail.com\",\"provider\":\"mailgun\",\"role\":\"student\",\"loginEmail\":\"GA-STU-FAASSG \\/ mail@mail.com\",\"admissionNumber\":\"GA\\/2026\\/9508\",\"temporaryPassword\":\"12345678\"}', '2026-11-22 20:21:33', '2026-11-22 20:21:33', '2026-11-22 20:21:33', '2026-11-22 20:21:33'),
(52, 1, NULL, 'emails', 'email', 'mailgun', 'welcome_onboarding', 'parent.ga20269508@campus.local', 'Parent of friday aki', 'Welcome to Your Campus Portal Account — Grace Academy', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Welcome to Grace Academy</title>\n</head>\n<body style=\"margin:0;padding:24px;background-color:#f1f5f9;font-family:Helvetica,Arial,sans-serif;color:#0f172a;\">\n  <div style=\"max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;\">\n    <div style=\"background-color:#0f172a;color:#ffffff;padding:24px;\">\n      <h1 style=\"margin:0;font-size:20px;text-transform:uppercase;\">Grace Academy</h1>\n      <p style=\"margin:4px 0 0 0;font-size:12px;color:#cbd5e1;\">Official Portal Account Onboarding</p>\n    </div>\n    <div style=\"padding:24px;font-size:14px;line-height:1.6;\">\n      <p>Dear <strong>Parent of friday aki</strong>,</p>\n      <p>Welcome to the <strong>Grace Academy</strong> digital campus portal! Your account has been provisioned and is ready for immediate access.</p>\n\n      <div style=\"background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin:18px 0;\">\n        <p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#64748b;font-weight:bold;\">Your Portal Credentials</p>\n        <p style=\"margin:4px 0;\"><strong>Role:</strong> Parent</p>\n        <p style=\"margin:4px 0;\"><strong>Login Email:</strong> GA-PAR-PAPZW5 / parent.ga20269508@campus.local</p>\n                  <p style=\"margin:4px 0;\"><strong>Admission / Staff ID:</strong> Linked Student: friday aki (GA/2026/9508)</p>\n                          <p style=\"margin:4px 0;\"><strong>Temporary Password:</strong> <code style=\"background:#e2e8f0;padding:2px 6px;border-radius:4px;\">12345678</code></p>\n              </div>\n\n      <p style=\"text-align:center;margin:24px 0;\">\n        <a href=\"http://localhost/login\" style=\"display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;\">\n          Sign In to Campus Portal\n        </a>\n      </p>\n\n      <p style=\"font-size:12px;color:#64748b;\">For security, please change your temporary password immediately after your first login.</p>\n    </div>\n    <div style=\"background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;\">\n      Sent via MAILGUN &bull; Grace Academy\n    </div>\n  </div>\n</body>\n</html>\n', 'sent', 'MAILGUN-XFVTWP6TKD5S', NULL, '{\"schoolName\":\"Grace Academy\",\"primaryColor\":\"#0f172a\",\"recipientName\":\"Parent of friday aki\",\"recipientEmail\":\"parent.ga20269508@campus.local\",\"provider\":\"mailgun\",\"role\":\"parent\",\"loginEmail\":\"GA-PAR-PAPZW5 \\/ parent.ga20269508@campus.local\",\"admissionNumber\":\"Linked Student: friday aki (GA\\/2026\\/9508)\",\"temporaryPassword\":\"12345678\"}', '2026-11-22 20:21:34', '2026-11-22 20:21:34', '2026-11-22 20:21:34', '2026-11-22 20:21:34');

-- --------------------------------------------------------

--
-- Table structure for table `notification_recipients`
--

CREATE TABLE `notification_recipients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `notification_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `read_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `online_payment_transactions`
--

CREATE TABLE `online_payment_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `payment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `gateway` varchar(50) NOT NULL,
  `gateway_reference` varchar(255) DEFAULT NULL,
  `status` enum('initiated','pending','success','failed','cancelled') NOT NULL DEFAULT 'initiated',
  `request_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`request_payload`)),
  `response_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response_payload`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `online_payment_transactions`
--

INSERT INTO `online_payment_transactions` (`id`, `school_id`, `payment_id`, `gateway`, `gateway_reference`, `status`, `request_payload`, `response_payload`, `created_at`, `updated_at`) VALUES
(1, 1, 25, 'paystack', 'OPT-20261115-AFLRDTDB', 'success', '{\"student_id\":5,\"student_name\":\"David Adeleke\",\"payer_name\":\"Development School Admin\",\"amount\":75000,\"charge_ids\":[16],\"allocation_plan\":[{\"charge_id\":16,\"category_name\":\"Tuition & Development Fee\",\"amount\":75000}],\"academic_session_id\":1,\"term_id\":1,\"session_name\":\"2026\\/2027 Development Session\",\"term_name\":\"Development Term 1\",\"environment\":\"test\",\"initiated_at\":\"2026-11-15T22:14:16+00:00\"}', '{\"authorization_url\":\"\\/app\\/payment-status?ref=OPT-20261115-AFLRDTDB&reference=OPT-20261115-AFLRDTDB&status=success\",\"gateway_reference\":\"PSK-ZGUF0JRHSB\",\"verified_at\":\"2026-11-15T22:14:17+00:00\",\"receipt_id\":3,\"receipt_number\":\"REC-20261115-ZNOMN5\"}', '2026-11-15 22:14:17', '2026-11-15 22:14:17'),
(2, 1, 26, 'paystack', 'OPT-20261116-REQAWR4Q', 'success', '{\"student_id\":75,\"student_name\":\"Chukwuemeka Obi\",\"payer_name\":\"Development Student\",\"amount\":195000,\"charge_ids\":[19,20,21],\"allocation_plan\":[{\"charge_id\":19,\"category_name\":\"Tuition & Development Fee\",\"amount\":75000},{\"charge_id\":20,\"category_name\":\"Tuition & Development Fee\",\"amount\":75000},{\"charge_id\":21,\"category_name\":\"ICT & Laboratory Levy\",\"amount\":45000}],\"academic_session_id\":1,\"term_id\":1,\"session_name\":\"2026\\/2027 Development Session\",\"term_name\":\"First Term\",\"environment\":\"test\",\"initiated_at\":\"2026-11-16T07:31:15+00:00\"}', '{\"authorization_url\":\"\\/app\\/payment-status?ref=OPT-20261116-REQAWR4Q&reference=OPT-20261116-REQAWR4Q&status=success\",\"gateway_reference\":\"PSK-F04DW62KFQ\",\"verified_at\":\"2026-11-16T07:31:22+00:00\",\"receipt_id\":4,\"receipt_number\":\"REC-20261116-GAC7YY\"}', '2026-11-16 07:31:15', '2026-11-16 07:31:22'),
(3, 1, 27, 'paystack', 'APF-20261116-PWXMAPB8', 'success', '{\"type\":\"admission_application_fee\",\"application_id\":13,\"application_number\":\"APP-DEV-CAMPUS-K8XYSY\",\"student_name\":\"Chinedu Okafor\",\"payer_name\":\"Chinedu Okafor\",\"amount\":5000,\"initiated_at\":\"2026-11-16T08:35:52+00:00\"}', '{\"verified_at\":\"2026-11-16T08:35:52+00:00\"}', '2026-11-16 08:35:52', '2026-11-16 08:35:52'),
(4, 1, 28, 'paystack', 'APF-20261116-C9OSUKQU', 'success', '{\"type\":\"admission_application_fee\",\"application_id\":14,\"application_number\":\"APP-DEV-CAMPUS-HNWJCN\",\"student_name\":\"Primeson Aselemi\",\"payer_name\":\"Primeson Aselemi\",\"amount\":5000,\"initiated_at\":\"2026-11-16T08:47:51+00:00\"}', '{\"verified_at\":\"2026-11-16T08:47:55+00:00\"}', '2026-11-16 08:47:51', '2026-11-16 08:47:55'),
(8, 1, 32, 'paystack', 'APF-20261117-TRGKPYK4', 'success', '{\"type\":\"admission_application_fee\",\"application_id\":15,\"application_number\":\"APP-DEV-CAMPUS-OJGE38\",\"student_name\":\"joe jarry\",\"payer_name\":\"joe jarry\",\"amount\":5000,\"initiated_at\":\"2026-11-17T08:10:46+00:00\"}', '{\"verified_at\":\"2026-11-17T08:10:51+00:00\"}', '2026-11-17 08:10:46', '2026-11-17 08:10:51'),
(9, 1, 33, 'paystack', 'APF-20261118-ACZBQNZT', 'success', '{\"type\":\"admission_application_fee\",\"application_id\":16,\"application_number\":\"APP-DEV-CAMPUS-O2YG8R\",\"student_name\":\"Lovell Neves\",\"payer_name\":\"Lovell Neves\",\"amount\":5000,\"initiated_at\":\"2026-11-18T21:06:21+00:00\"}', '{\"verified_at\":\"2026-11-18T21:06:25+00:00\"}', '2026-11-18 21:06:21', '2026-11-18 21:06:25'),
(11, 1, 35, 'paystack', 'APF-20261122-XODBB3V9', 'success', '{\"type\":\"admission_application_fee\",\"application_id\":20,\"application_number\":\"APP\\/GA\\/2026\\/XQFTUB\",\"student_name\":\"friday aki\",\"payer_name\":\"friday aki\",\"amount\":5000,\"initiated_at\":\"2026-11-22T19:43:14+00:00\"}', '{\"verified_at\":\"2026-11-22T19:43:16+00:00\",\"receipt_number\":\"RCP-GA-20261122-O4PIHC\"}', '2026-11-22 19:43:14', '2026-11-22 19:43:16'),
(13, 1, 37, 'remita', 'OPT-20261122-CIPJAVS3', 'success', '{\"student_id\":89,\"student_name\":\"friday aki\",\"payer_name\":\"friday aki\",\"amount\":75000,\"base_amount\":75000,\"gateway_fee\":1125,\"platform_fee\":100,\"convenience_fee\":1225,\"total_payable\":76225,\"fee_split\":{\"base_amount\":75000,\"gateway_fee\":1125,\"platform_fee\":100,\"convenience_fee\":1225,\"total_payable\":76225,\"school_share\":75000,\"platform_share\":100},\"charge_ids\":[22],\"allocation_plan\":[{\"charge_id\":22,\"category_name\":\"Tuition & Development Fee\",\"amount\":75000}],\"academic_session_id\":1,\"term_id\":1,\"session_name\":\"2026\\/2027\",\"term_name\":\"First Term\",\"environment\":\"test\",\"rrr\":\"756745127383\",\"initiated_at\":\"2026-11-22T21:03:29+00:00\"}', '{\"authorization_url\":\"\\/app\\/payment-status?ref=OPT-20261122-CIPJAVS3&reference=OPT-20261122-CIPJAVS3&status=success\",\"gateway_reference\":\"REM-VPAU2YTFQH\",\"rrr\":\"756745127383\",\"verified_at\":\"2026-11-22T21:03:41+00:00\",\"receipt_id\":15,\"receipt_number\":\"REC-20261122-38PEYR\",\"fee_split\":{\"base_amount\":75000,\"gateway_fee\":1125,\"platform_fee\":100,\"convenience_fee\":1225,\"total_payable\":76225,\"school_share\":75000,\"platform_share\":100}}', '2026-11-22 21:03:29', '2026-11-22 21:03:42');

-- --------------------------------------------------------

--
-- Table structure for table `parent_guardians`
--

CREATE TABLE `parent_guardians` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parent_guardians`
--

INSERT INTO `parent_guardians` (`id`, `school_id`, `user_id`, `full_name`, `email`, `phone`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 6, 'Development Parent', 'parent@example.test', NULL, 'active', '2026-10-26 16:38:35', '2026-10-26 16:38:35', NULL),
(17, 1, NULL, 'Chief Okafor', NULL, '08039998888', 'active', '2026-11-16 08:35:53', '2026-11-16 08:35:53', NULL),
(18, 1, 209, 'Alhaji Musa Ibrahim', 'musa.ibrahim.43e19f@example.com', '08094445566', 'active', '2026-11-20 21:55:56', '2026-11-20 21:55:56', NULL),
(20, 1, 218, 'Parent of friday aki', 'parent.ga20269508@campus.local', NULL, 'active', '2026-11-22 20:21:33', '2026-11-22 20:21:33', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `academic_session_id` bigint(20) UNSIGNED DEFAULT NULL,
  `term_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `payment_method` varchar(50) NOT NULL,
  `gateway` varchar(50) DEFAULT NULL,
  `status` enum('pending','success','failed','refunded','reversed') NOT NULL DEFAULT 'pending',
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `admission_application_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `school_id`, `student_id`, `user_id`, `academic_session_id`, `term_id`, `amount`, `currency`, `payment_method`, `gateway`, `status`, `reference_number`, `notes`, `paid_at`, `metadata`, `created_at`, `updated_at`, `admission_application_id`) VALUES
(23, 1, 5, NULL, 1, 1, 50000.00, 'NGN', 'bank_transfer', NULL, 'reversed', 'PAY-TEST-1794425832', 'Part payment for First Term Tuition | Reversed: Verification test reversal', '2026-11-11 00:00:00', '{\"notes\":\"Part payment for First Term Tuition\",\"academic_session_id\":1,\"term_id\":1}', '2026-11-11 19:37:13', '2026-11-11 19:37:14', NULL),
(24, 1, 5, NULL, 1, 1, 50000.00, 'NGN', 'bank_transfer', NULL, 'reversed', 'PAY-TEST-1794425966', 'Part payment for First Term Tuition | Reversed: Verification test reversal', '2026-11-11 00:00:00', '{\"notes\":\"Part payment for First Term Tuition\",\"academic_session_id\":1,\"term_id\":1}', '2026-11-11 19:39:26', '2026-11-11 19:39:26', NULL),
(25, 1, 5, 3, 1, 1, 75000.00, 'NGN', 'online', 'paystack', 'success', 'OPT-20261115-AFLRDTDB', 'Online payment via Paystack', '2026-11-15 22:14:17', '{\"online_transaction_id\":1,\"gateway_reference\":\"PSK-ZGUF0JRHSB\",\"academic_session_id\":1,\"term_id\":1}', '2026-11-15 22:14:17', '2026-11-15 22:14:17', NULL),
(26, 1, 75, 5, 1, 1, 195000.00, 'NGN', 'online', 'paystack', 'success', 'OPT-20261116-REQAWR4Q', 'Online payment via Paystack', '2026-11-16 07:31:21', '{\"online_transaction_id\":2,\"gateway_reference\":\"PSK-F04DW62KFQ\",\"academic_session_id\":1,\"term_id\":1}', '2026-11-16 07:31:21', '2026-11-16 07:31:21', NULL),
(27, 1, NULL, NULL, NULL, NULL, 5000.00, 'NGN', 'online', 'paystack', 'success', 'APF-20261116-PWXMAPB8', 'Admission Application Fee (APP-DEV-CAMPUS-K8XYSY)', '2026-11-16 08:35:52', '{\"student_name\":\"Chinedu Okafor\",\"application_number\":\"APP-DEV-CAMPUS-K8XYSY\"}', '2026-11-16 08:35:52', '2026-11-16 08:35:52', 13),
(28, 1, NULL, NULL, NULL, NULL, 5000.00, 'NGN', 'online', 'paystack', 'success', 'APF-20261116-C9OSUKQU', 'Admission Application Fee (APP-DEV-CAMPUS-HNWJCN)', '2026-11-16 08:47:55', '{\"student_name\":\"Primeson Aselemi\",\"application_number\":\"APP-DEV-CAMPUS-HNWJCN\"}', '2026-11-16 08:47:55', '2026-11-16 08:47:55', 14),
(32, 1, NULL, NULL, NULL, NULL, 5000.00, 'NGN', 'online', 'paystack', 'success', 'APF-20261117-TRGKPYK4', 'Admission Application Fee (APP-DEV-CAMPUS-OJGE38)', '2026-11-17 08:10:51', '{\"student_name\":\"joe jarry\",\"application_number\":\"APP-DEV-CAMPUS-OJGE38\"}', '2026-11-17 08:10:51', '2026-11-17 08:10:51', 15),
(33, 1, NULL, NULL, NULL, NULL, 5000.00, 'NGN', 'online', 'paystack', 'success', 'APF-20261118-ACZBQNZT', 'Admission Application Fee (APP-DEV-CAMPUS-O2YG8R)', '2026-11-18 21:06:25', '{\"student_name\":\"Lovell Neves\",\"application_number\":\"APP-DEV-CAMPUS-O2YG8R\"}', '2026-11-18 21:06:25', '2026-11-18 21:06:25', 16),
(35, 1, NULL, NULL, NULL, NULL, 5000.00, 'NGN', 'online', 'paystack', 'success', 'APF-20261122-XODBB3V9', 'Admission Application Fee (APP/GA/2026/XQFTUB)', '2026-11-22 19:43:16', '{\"student_name\":\"friday aki\",\"application_number\":\"APP\\/GA\\/2026\\/XQFTUB\"}', '2026-11-22 19:43:16', '2026-11-22 19:43:16', 20),
(37, 1, 89, 217, 1, 1, 75000.00, 'NGN', 'online', 'remita', 'success', 'OPT-20261122-CIPJAVS3', 'Online payment via Remita', '2026-11-22 21:03:41', '{\"online_transaction_id\":13,\"gateway_reference\":\"REM-VPAU2YTFQH\",\"academic_session_id\":1,\"term_id\":1,\"base_amount\":75000,\"gateway_fee\":1125,\"platform_fee\":100,\"convenience_fee\":1225,\"total_payable\":76225}', '2026-11-22 21:03:41', '2026-11-22 21:03:41', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payment_allocations`
--

CREATE TABLE `payment_allocations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `payment_id` bigint(20) UNSIGNED NOT NULL,
  `student_charge_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_allocations`
--

INSERT INTO `payment_allocations` (`id`, `school_id`, `payment_id`, `student_charge_id`, `amount`, `created_at`) VALUES
(17, 1, 23, 16, 50000.00, '2026-11-11 19:37:13'),
(18, 1, 24, 16, 25000.00, '2026-11-11 19:39:26'),
(19, 1, 24, 17, 25000.00, '2026-11-11 19:39:26'),
(20, 1, 25, 16, 75000.00, '2026-11-15 22:14:17'),
(21, 1, 26, 19, 75000.00, '2026-11-16 07:31:22'),
(22, 1, 26, 20, 75000.00, '2026-11-16 07:31:22'),
(23, 1, 26, 21, 45000.00, '2026-11-16 07:31:22'),
(28, 1, 37, 22, 75000.00, '2026-11-22 21:03:41');

-- --------------------------------------------------------

--
-- Table structure for table `payment_gateway_configs`
--

CREATE TABLE `payment_gateway_configs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED DEFAULT NULL,
  `gateway_name` varchar(100) NOT NULL,
  `public_key` varchar(255) DEFAULT NULL,
  `secret_key_ciphertext` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_gateway_configs`
--

INSERT INTO `payment_gateway_configs` (`id`, `school_id`, `gateway_name`, `public_key`, `secret_key_ciphertext`, `is_active`, `metadata`, `created_at`, `updated_at`) VALUES
(1, 1, 'paystack', 'pk_test_paystack', 'whsec_test_paystack_secret_2026', 1, '{\"environment\":\"test\",\"webhook_secret\":\"whsec_test_paystack_secret_2026\"}', '2026-11-15 22:14:16', '2026-11-22 20:52:46'),
(2, 1, 'flutterwave', 'pk_test_flutterwave', 'whsec_test_flutterwave_secret_2026', 0, '{\"environment\":\"test\",\"webhook_secret\":\"whsec_test_flutterwave_secret_2026\"}', '2026-11-16 12:25:50', '2026-11-22 20:52:45'),
(3, 1, 'monnify', 'pk_test_monnify', 'whsec_test_monnify_secret_2026', 0, '{\"environment\":\"test\",\"webhook_secret\":\"whsec_test_monnify_secret_2026\"}', '2026-11-16 12:25:50', '2026-11-22 20:52:45'),
(4, 175, 'paystack', 'pk_test_iportal_sandbox_key', 'sk_test_iportal_sandbox_secret', 1, '{\"environment\":\"test\",\"currency\":\"NGN\",\"platform_fee\":100,\"last_test_status\":\"success\",\"last_test_message\":\"Paystack Sandbox (Test Mode) active and ready.\",\"last_tested_at\":\"2026-11-16T20:26:03+00:00\"}', '2026-11-16 20:26:03', '2026-11-16 20:26:03'),
(6, 1, 'remita', 'pk_test_iportal_sandbox_key', 'sk_test_iportal_sandbox_secret', 1, '{\"environment\":\"test\",\"currency\":\"NGN\",\"platform_fee\":100,\"last_test_status\":\"success\",\"last_test_message\":\"Remita Sandbox (Test Mode) active and ready.\",\"last_tested_at\":\"2026-11-22T21:19:41+00:00\"}', '2026-11-22 21:19:41', '2026-11-22 21:19:41');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `group_name` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `slug`, `group_name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Manage schools', 'platform.schools.manage', 'Platform', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(2, 'Manage platform users', 'platform.users.manage', 'Platform', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(3, 'Manage subscriptions', 'platform.subscriptions.manage', 'Platform', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(4, 'View platform transactions', 'platform.transactions.view', 'Platform', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(5, 'Manage payment gateways', 'platform.gateways.manage', 'Platform', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(6, 'View platform audit logs', 'platform.audit.view', 'Platform', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(7, 'View school dashboard', 'school.dashboard.view', 'School', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(8, 'Manage school memberships', 'school.memberships.manage', 'School', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(9, 'View students', 'students.view', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(10, 'Manage students', 'students.manage', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(11, 'View teachers', 'teachers.view', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(12, 'Manage teachers', 'teachers.manage', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(13, 'View parents and guardians', 'guardians.view', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(14, 'Manage parents and guardians', 'guardians.manage', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(15, 'Manage academic sessions and terms', 'academics.sessions.manage', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(16, 'Manage classes', 'academics.classes.manage', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(17, 'Manage subjects', 'academics.subjects.manage', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(18, 'Manage assigned-class assignments', 'academics.assignments.manage', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(19, 'Manage assigned-class attendance', 'academics.attendance.manage', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(20, 'View own or linked attendance', 'academics.attendance.view', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(21, 'Manage assigned-class results', 'academics.results.manage', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(22, 'View own or linked results', 'academics.results.view', 'Academic', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(23, 'Manage fee structures and charges', 'fees.manage', 'Finance', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(24, 'View own or linked fees', 'fees.view', 'Finance', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(25, 'View authorized payments', 'payments.view', 'Finance', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(26, 'Record school payments', 'payments.record', 'Finance', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(27, 'Manage school announcements', 'announcements.manage', 'Communication', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(28, 'View own notifications', 'notifications.view', 'Communication', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(29, 'View own student records', 'student.records.view', 'Student', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(30, 'View own assignments', 'student.assignments.view', 'Student', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(31, 'View linked child records', 'parent.children.view', 'Parent', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(32, 'View linked child fees and payments', 'parent.children.finance.view', 'Parent', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(33, 'View school reports', 'reports.school.view', 'Reporting', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(34, 'View school audit logs', 'audit.school.view', 'Audit', NULL, '2026-10-26 16:38:18', '2026-10-26 16:38:18');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `platform_settings`
--

CREATE TABLE `platform_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`value`)),
  `updated_by_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `platform_transactions`
--

CREATE TABLE `platform_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED DEFAULT NULL,
  `tx_type` varchar(50) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `platform_transactions`
--

INSERT INTO `platform_transactions` (`id`, `school_id`, `tx_type`, `reference`, `amount`, `currency`, `status`, `metadata`, `created_at`, `updated_at`) VALUES
(5, 1, 'convenience_fee_split', 'SPLIT-OPT-20261122-CIPJAVS3', 100.00, 'NGN', 'success', '{\"payment_method\":\"remita\",\"gateway\":\"remita\",\"payment_id\":37,\"student_name\":\"friday aki\",\"base_amount\":75000,\"gateway_fee\":1125,\"platform_fee\":100,\"total_convenience_fee\":1225,\"total_charged_to_payer\":76225}', '2026-11-22 21:03:41', '2026-11-22 21:03:41');

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
--

CREATE TABLE `receipts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `payment_id` bigint(20) UNSIGNED NOT NULL,
  `receipt_number` varchar(100) NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `issued_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `receipts`
--

INSERT INTO `receipts` (`id`, `school_id`, `payment_id`, `receipt_number`, `file_path`, `issued_at`, `created_at`, `updated_at`) VALUES
(1, 1, 23, 'REC-20261111-GMRO8V', NULL, '2026-11-11 19:37:13', '2026-11-11 19:37:13', '2026-11-11 19:37:13'),
(2, 1, 24, 'REC-20261111-85A5X9', NULL, '2026-11-11 19:39:26', '2026-11-11 19:39:26', '2026-11-11 19:39:26'),
(3, 1, 25, 'REC-20261115-ZNOMN5', NULL, '2026-11-15 22:14:17', '2026-11-15 22:14:17', '2026-11-15 22:14:17'),
(4, 1, 26, 'REC-20261116-GAC7YY', NULL, '2026-11-16 07:31:22', '2026-11-16 07:31:22', '2026-11-16 07:31:22'),
(5, 1, 27, 'REC-20261116-VUFHD7', NULL, '2026-11-16 08:35:52', '2026-11-16 08:35:52', '2026-11-16 08:35:52'),
(6, 1, 28, 'REC-20261116-LM2IDS', NULL, '2026-11-16 08:47:55', '2026-11-16 08:47:55', '2026-11-16 08:47:55'),
(10, 1, 32, 'REC-20261117-N6NLZU', NULL, '2026-11-17 08:10:51', '2026-11-17 08:10:51', '2026-11-17 08:10:51'),
(11, 1, 33, 'REC-20261118-WP2S27', NULL, '2026-11-18 21:06:25', '2026-11-18 21:06:25', '2026-11-18 21:06:25'),
(13, 1, 35, 'RCP-GA-20261122-O4PIHC', NULL, '2026-11-22 19:43:16', '2026-11-22 19:43:16', '2026-11-22 19:43:16'),
(15, 1, 37, 'REC-20261122-38PEYR', NULL, '2026-11-22 21:03:41', '2026-11-22 21:03:41', '2026-11-22 21:03:41');

-- --------------------------------------------------------

--
-- Table structure for table `results`
--

CREATE TABLE `results` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `subject_id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED DEFAULT NULL,
  `term_id` bigint(20) UNSIGNED DEFAULT NULL,
  `score` decimal(6,2) NOT NULL,
  `grade` varchar(20) DEFAULT NULL,
  `subject_position` int(10) UNSIGNED DEFAULT NULL,
  `subject_class_size` int(10) UNSIGNED DEFAULT NULL,
  `subject_average` decimal(6,2) DEFAULT NULL,
  `subject_highest` decimal(6,2) DEFAULT NULL,
  `subject_lowest` decimal(6,2) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `recorded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `publication_status` enum('draft','calculated','approved','published') NOT NULL DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `published_by` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `results`
--

INSERT INTO `results` (`id`, `school_id`, `student_id`, `teacher_id`, `subject_id`, `class_id`, `term_id`, `score`, `grade`, `subject_position`, `subject_class_size`, `subject_average`, `subject_highest`, `subject_lowest`, `remarks`, `recorded_by`, `created_at`, `updated_at`, `publication_status`, `published_at`, `approved_by`, `published_by`) VALUES
(1, 1, 75, NULL, 38, 73, 1, 88.50, 'A', NULL, NULL, NULL, NULL, NULL, 'Distinction', 3, '2026-11-02 08:25:43', '2026-11-02 08:25:43', 'published', '2026-11-02 08:25:43', NULL, NULL),
(2, 1, 5, NULL, 1, 1, 1, 80.00, 'A', 2, 4, 77.50, 95.00, 60.00, NULL, NULL, '2026-11-19 20:24:51', '2026-11-20 21:41:01', 'published', '2026-11-20 21:41:00', NULL, NULL),
(3, 1, 1, NULL, 1, 1, 1, 95.00, 'A', 1, 4, 77.50, 95.00, 60.00, NULL, NULL, '2026-11-20 21:41:00', '2026-11-20 21:41:01', 'published', '2026-11-20 21:41:00', NULL, NULL),
(4, 1, 1, NULL, 38, 1, 1, 85.00, 'A', 1, 4, 80.00, 85.00, 70.00, NULL, NULL, '2026-11-20 21:41:00', '2026-11-20 21:41:01', 'published', '2026-11-20 21:41:00', NULL, NULL),
(5, 1, 5, NULL, 38, 1, 1, 80.00, 'A', 3, 4, 80.00, 85.00, 70.00, NULL, NULL, '2026-11-20 21:41:00', '2026-11-20 21:41:01', 'published', '2026-11-20 21:41:00', NULL, NULL),
(6, 1, 75, NULL, 1, 1, 1, 75.00, 'A', 3, 4, 77.50, 95.00, 60.00, NULL, NULL, '2026-11-20 21:41:00', '2026-11-20 21:41:01', 'published', '2026-11-20 21:41:00', NULL, NULL),
(7, 1, 75, NULL, 38, 1, 1, 85.00, 'A', 1, 4, 80.00, 85.00, 70.00, NULL, NULL, '2026-11-20 21:41:00', '2026-11-20 21:41:01', 'published', '2026-11-20 21:41:00', NULL, NULL),
(8, 1, 76, NULL, 1, 1, 1, 60.00, 'B', 4, 4, 77.50, 95.00, 60.00, NULL, NULL, '2026-11-20 21:41:01', '2026-11-20 21:41:01', 'published', '2026-11-20 21:41:01', NULL, NULL),
(9, 1, 76, NULL, 38, 1, 1, 70.00, 'A', 4, 4, 80.00, 85.00, 70.00, NULL, NULL, '2026-11-20 21:41:01', '2026-11-20 21:41:01', 'published', '2026-11-20 21:41:01', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_platform_role` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `slug`, `description`, `is_platform_role`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'SAD', NULL, 1, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(2, 'School Admin', 'ADM', NULL, 0, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(3, 'Teacher', 'TEA', NULL, 0, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(4, 'Student', 'STU', NULL, 0, '2026-10-26 16:38:18', '2026-10-26 16:38:18'),
(5, 'Parent/Guardian', 'PAR', NULL, 0, '2026-10-26 16:38:18', '2026-10-26 16:38:18');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES
(1, 1, 1, '2026-10-26 17:38:19'),
(2, 1, 2, '2026-10-26 17:38:19'),
(3, 1, 3, '2026-10-26 17:38:19'),
(4, 1, 4, '2026-10-26 17:38:19'),
(5, 1, 5, '2026-10-26 17:38:19'),
(6, 1, 6, '2026-10-26 17:38:19'),
(7, 1, 7, '2026-10-26 17:38:19'),
(8, 1, 8, '2026-10-26 17:38:19'),
(9, 1, 9, '2026-10-26 17:38:19'),
(10, 1, 10, '2026-10-26 17:38:19'),
(11, 1, 11, '2026-10-26 17:38:19'),
(12, 1, 12, '2026-10-26 17:38:19'),
(13, 1, 13, '2026-10-26 17:38:19'),
(14, 1, 14, '2026-10-26 17:38:19'),
(15, 1, 15, '2026-10-26 17:38:19'),
(16, 1, 16, '2026-10-26 17:38:19'),
(17, 1, 17, '2026-10-26 17:38:19'),
(18, 1, 18, '2026-10-26 17:38:19'),
(19, 1, 19, '2026-10-26 17:38:19'),
(20, 1, 20, '2026-10-26 17:38:19'),
(21, 1, 21, '2026-10-26 17:38:19'),
(22, 1, 22, '2026-10-26 17:38:19'),
(23, 1, 23, '2026-10-26 17:38:19'),
(24, 1, 24, '2026-10-26 17:38:19'),
(25, 1, 25, '2026-10-26 17:38:19'),
(26, 1, 26, '2026-10-26 17:38:19'),
(27, 1, 27, '2026-10-26 17:38:19'),
(28, 1, 28, '2026-10-26 17:38:19'),
(29, 1, 29, '2026-10-26 17:38:19'),
(30, 1, 30, '2026-10-26 17:38:19'),
(31, 1, 31, '2026-10-26 17:38:19'),
(32, 1, 32, '2026-10-26 17:38:19'),
(33, 1, 33, '2026-10-26 17:38:19'),
(34, 1, 34, '2026-10-26 17:38:19'),
(35, 2, 7, '2026-10-26 17:38:21'),
(36, 2, 8, '2026-10-26 17:38:21'),
(37, 2, 9, '2026-10-26 17:38:21'),
(38, 2, 10, '2026-10-26 17:38:21'),
(39, 2, 11, '2026-10-26 17:38:21'),
(40, 2, 12, '2026-10-26 17:38:21'),
(41, 2, 13, '2026-10-26 17:38:21'),
(42, 2, 14, '2026-10-26 17:38:21'),
(43, 2, 15, '2026-10-26 17:38:21'),
(44, 2, 16, '2026-10-26 17:38:21'),
(45, 2, 17, '2026-10-26 17:38:21'),
(46, 2, 18, '2026-10-26 17:38:21'),
(47, 2, 19, '2026-10-26 17:38:21'),
(48, 2, 21, '2026-10-26 17:38:21'),
(49, 2, 23, '2026-10-26 17:38:21'),
(50, 2, 25, '2026-10-26 17:38:21'),
(51, 2, 26, '2026-10-26 17:38:21'),
(52, 2, 27, '2026-10-26 17:38:21'),
(53, 2, 28, '2026-10-26 17:38:21'),
(54, 2, 33, '2026-10-26 17:38:21'),
(55, 2, 34, '2026-10-26 17:38:21'),
(56, 3, 7, '2026-10-26 17:38:21'),
(57, 3, 9, '2026-10-26 17:38:21'),
(58, 3, 18, '2026-10-26 17:38:21'),
(59, 3, 19, '2026-10-26 17:38:21'),
(60, 3, 21, '2026-10-26 17:38:21'),
(61, 3, 22, '2026-10-26 17:38:21'),
(62, 3, 28, '2026-10-26 17:38:21'),
(63, 4, 7, '2026-10-26 17:38:21'),
(64, 4, 20, '2026-10-26 17:38:21'),
(65, 4, 22, '2026-10-26 17:38:21'),
(66, 4, 24, '2026-10-26 17:38:21'),
(67, 4, 25, '2026-10-26 17:38:21'),
(68, 4, 28, '2026-10-26 17:38:21'),
(69, 4, 29, '2026-10-26 17:38:21'),
(70, 4, 30, '2026-10-26 17:38:21'),
(71, 5, 7, '2026-10-26 17:38:21'),
(72, 5, 20, '2026-10-26 17:38:21'),
(73, 5, 22, '2026-10-26 17:38:21'),
(74, 5, 24, '2026-10-26 17:38:21'),
(75, 5, 25, '2026-10-26 17:38:21'),
(76, 5, 28, '2026-10-26 17:38:21'),
(77, 5, 31, '2026-10-26 17:38:21'),
(78, 5, 32, '2026-10-26 17:38:21');

-- --------------------------------------------------------

--
-- Table structure for table `schools`
--

CREATE TABLE `schools` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `short_name` varchar(100) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','pending','suspended') NOT NULL DEFAULT 'active',
  `subscription_status` enum('trial','active','expired','cancelled') NOT NULL DEFAULT 'trial',
  `application_fee_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `application_fee_amount` decimal(12,2) NOT NULL DEFAULT 5000.00,
  `timezone` varchar(64) NOT NULL DEFAULT 'UTC',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schools`
--

INSERT INTO `schools` (`id`, `name`, `short_name`, `code`, `address`, `email`, `phone`, `website`, `status`, `subscription_status`, `application_fee_enabled`, `application_fee_amount`, `timezone`, `metadata`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Grace Academy', 'GA', 'GA', NULL, NULL, NULL, NULL, 'active', 'active', 1, 5000.00, 'UTC', '{\"motto\":\"excellence and light\",\"logo_url\":null,\"crest_url\":null,\"primary_color\":\"#000e7a\",\"accent_color\":\"#002699\",\"slug\":\"verifydemo\",\"custom_domain\":\"portal.verifydemo.edu.ng\",\"sms_notifications\":false,\"custom_domain_enabled\":false,\"email_provider\":\"mailgun\",\"sms_provider\":\"termii\",\"plan\":\"standard\",\"city\":null,\"country\":\"Nigeria\",\"billing_cycle\":\"termly\",\"billing_format\":\"format_1\",\"secondary_color\":\"#f97316\",\"sidebar_color\":\"#05002e\",\"success_color\":\"#22c55e\",\"violet_color\":\"#7c3aed\",\"subdomain\":\"verifydemo\",\"domain_status\":\"pending_dns\"}', '2026-10-26 16:38:21', '2026-11-26 21:16:59', NULL),
(175, 'another school academy', 'AS', 'AS', 'choba port harcourt', 'another@mail.com', '09088937748', NULL, 'active', 'trial', 1, 5000.00, 'UTC', '{\"plan\":\"free\",\"motto\":\"another school again\",\"city\":\"Port Harcourt\",\"country\":\"nigeria\",\"logo_url\":null,\"crest_url\":null,\"primary_color\":\"#0f172a\",\"accent_color\":\"#4f46e5\",\"slug\":\"as\",\"custom_domain\":\"\",\"sms_notifications\":false,\"custom_domain_enabled\":false,\"secondary_color\":\"#f97316\",\"sidebar_color\":\"#0f172a\",\"success_color\":\"#22c55e\",\"violet_color\":\"#7c3aed\",\"subdomain\":\"as\",\"domain_status\":\"active\"}', '2026-11-16 20:25:23', '2026-11-26 21:21:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `school_classes`
--

CREATE TABLE `school_classes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `academic_session_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `arm` varchar(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `class_teacher_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `school_classes`
--

INSERT INTO `school_classes` (`id`, `school_id`, `academic_session_id`, `name`, `code`, `level`, `arm`, `created_at`, `updated_at`, `deleted_at`, `status`, `class_teacher_id`) VALUES
(1, 1, 1, 'Basic 1', 'DEV-Y1', 'Year 1', 'A', '2026-10-26 16:38:36', '2026-11-16 14:45:51', NULL, 'active', NULL),
(73, 1, 1, 'SSS 1 Science 52', NULL, 'Senior Secondary', 'Science', '2026-11-02 08:25:39', '2026-11-24 17:34:18', '2026-11-24 17:34:18', 'active', NULL),
(75, 1, 1, 'Basic 2', 'BASIC2', NULL, NULL, '2026-11-22 18:46:18', '2026-11-22 18:46:18', NULL, 'active', NULL),
(76, 1, 1, 'Basic 3', 'BASIC3', NULL, NULL, '2026-11-22 18:46:44', '2026-11-22 18:46:44', NULL, 'active', NULL),
(77, 1, 1, 'Basic 4', 'BASIC4', NULL, NULL, '2026-11-24 17:34:51', '2026-11-24 17:34:51', NULL, 'active', NULL),
(78, 1, 1, 'Basic 5', 'BASIC5', NULL, NULL, '2026-11-24 17:35:06', '2026-11-24 17:35:06', NULL, 'active', NULL),
(79, 1, 1, 'Basic 6', 'BASIC6', NULL, NULL, '2026-11-24 17:35:29', '2026-11-24 17:35:29', NULL, 'active', NULL),
(80, 1, 1, 'JSS 1', 'JSS1', NULL, NULL, '2026-11-24 17:35:52', '2026-11-24 17:35:52', NULL, 'active', NULL),
(81, 1, 1, 'JSS 2', 'JSS2', NULL, NULL, '2026-11-24 17:36:04', '2026-11-24 17:36:04', NULL, 'active', NULL),
(82, 1, 1, 'JSS 3', 'JSS3', NULL, NULL, '2026-11-24 17:36:16', '2026-11-24 17:36:16', NULL, 'active', NULL),
(83, 1, 1, 'SS 1', 'SS1', NULL, NULL, '2026-11-24 17:36:28', '2026-11-24 17:36:28', NULL, 'active', NULL),
(84, 1, 1, 'SS 2', 'SS2', NULL, NULL, '2026-11-24 17:36:41', '2026-11-24 17:36:41', NULL, 'active', NULL),
(85, 1, 1, 'SS 3', 'SS3', NULL, NULL, '2026-11-24 17:36:54', '2026-11-24 17:36:54', NULL, 'active', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `school_memberships`
--

CREATE TABLE `school_memberships` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `role` varchar(50) NOT NULL,
  `status` enum('active','inactive','invited','suspended') NOT NULL DEFAULT 'active',
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `login_pin` varchar(50) DEFAULT NULL,
  `user_pin` varchar(50) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `school_memberships`
--

INSERT INTO `school_memberships` (`id`, `user_id`, `school_id`, `role`, `status`, `is_primary`, `login_pin`, `user_pin`, `user_email`, `user_name`, `permissions`, `metadata`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 3, 1, 'ADM', 'active', 1, 'GA-ADM-AA0001', 'GA-ADM-AA0001', 'admin@example.test', 'Grace Academy Admin', '[\"*\"]', NULL, '2026-10-26 16:38:34', '2026-11-23 15:48:33', NULL),
(2, 4, 1, 'TEA', 'active', 1, 'GA-TEA-TT0002', 'GA-TEA-TT0002', 'teacher@example.test', 'Development Teacher', NULL, NULL, '2026-10-26 16:38:34', '2026-11-22 18:08:30', NULL),
(3, 5, 1, 'STU', 'active', 1, 'GA-STU-SS0003', 'GA-STU-SS0003', 'student@example.test', 'Development Student', NULL, NULL, '2026-10-26 16:38:34', '2026-11-22 18:08:30', NULL),
(4, 6, 1, 'PAR', 'active', 1, 'GA-PAR-PP0004', 'GA-PAR-PP0004', 'parent@example.test', 'Development Parent', NULL, NULL, '2026-10-26 16:38:34', '2026-11-22 18:08:30', NULL),
(174, 203, 1, 'STU', 'active', 1, 'DEV-CAMPUS-STU-3LUTKI', 'DEV-CAMPUS-STU-3LUTKI', 'chinedu.applicant@example.test', 'Chinedu Okafor', NULL, NULL, '2026-11-16 08:35:53', '2026-11-16 08:35:53', NULL),
(175, 204, 1, 'TEA', 'inactive', 1, 'GA-TEA-MAJ5P3', 'GA-TEA-MAJ5P3', 'new.teacher@example.test', 'Mrs. Funke Akindele', NULL, NULL, '2026-11-16 08:39:27', '2026-11-22 18:30:59', '2026-11-22 18:30:59'),
(178, 207, 1, 'EXM', 'active', 1, 'DEV-CAMPUS-BUR-BREZJM', 'DEV-CAMPUS-BUR-BREZJM', 'aselemiprimeson@gmail.com', 'james', '[\"finance.view\",\"finance.manage_fees\",\"finance.assign_charges\",\"finance.record_payment\",\"finance.reverse_payment\",\"finance.issue_receipts\",\"finance.manage_gateways\",\"students.view\",\"announcements.view\"]', NULL, '2026-11-19 20:39:12', '2026-11-22 18:32:23', NULL),
(179, 208, 1, 'STU', 'active', 1, 'GA-STU-7Z6TTL', 'GA-STU-7Z6TTL', 'zainab.43e19f@example.com', 'Zainab Ibrahim', '[\"results.view_own\",\"report_cards.view_own\",\"finance.view_own\",\"finance.pay_online\",\"assignments.submit\",\"timetable.view\",\"announcements.view\"]', NULL, '2026-11-20 21:55:55', '2026-11-22 18:08:30', NULL),
(180, 209, 1, 'PAR', 'active', 1, 'GA-PAR-7TKHVO', 'GA-PAR-7TKHVO', 'musa.ibrahim.43e19f@example.com', 'Alhaji Musa Ibrahim', '[\"results.view_children\",\"report_cards.view_children\",\"finance.view_children\",\"finance.pay_online\",\"timetable.view\",\"announcements.view\"]', NULL, '2026-11-20 21:55:56', '2026-11-22 18:08:30', NULL),
(185, 214, 1, 'TEA', 'active', 1, 'GA-TEA-AMR4TZ', 'GA-TEA-AMR4TZ', 'anita@mail.com', 'Anita Marcus', '[\"academics.view\",\"results.view\",\"results.enter\",\"results.edit\",\"attendance.manage\",\"assignments.manage\",\"remarks.teacher\",\"announcements.view\"]', NULL, '2026-11-22 18:07:38', '2026-11-22 18:29:37', NULL),
(186, 215, 1, 'BUR', 'active', 1, 'GA-BUR-JJE87H', 'GA-BUR-JJE87H', 'joe@mail.com', 'Joe john', '[\"finance.view\",\"finance.manage_fees\",\"finance.assign_charges\",\"finance.record_payment\",\"finance.reverse_payment\",\"finance.issue_receipts\",\"finance.manage_gateways\",\"students.view\",\"announcements.view\"]', NULL, '2026-11-22 18:33:17', '2026-11-22 18:33:17', NULL),
(188, 217, 1, 'STU', 'active', 1, 'GA-STU-FAASSG', 'GA-STU-FAASSG', 'mail@mail.com', 'friday aki', '[\"results.view_own\",\"report_cards.view_own\",\"finance.view_own\",\"finance.pay_online\",\"assignments.submit\",\"timetable.view\",\"announcements.view\"]', NULL, '2026-11-22 20:21:31', '2026-11-22 20:21:31', NULL),
(189, 218, 1, 'PAR', 'active', 1, 'GA-PAR-PAPZW5', 'GA-PAR-PAPZW5', 'parent.ga20269508@campus.local', 'Parent of friday aki', '[\"results.view_children\",\"report_cards.view_children\",\"finance.view_children\",\"finance.pay_online\",\"timetable.view\",\"announcements.view\"]', NULL, '2026-11-22 20:21:32', '2026-11-22 20:21:32', NULL),
(191, 220, 175, 'ADM', 'active', 1, 'AS-ADM-AS26KV', 'AS-ADM-AS26KV', 'anothersc@mail.com', 'another school', '[\"*\"]', NULL, '2026-11-23 16:23:15', '2026-11-23 16:26:01', NULL),
(192, 221, 1, 'STU', 'active', 1, 'GA-STU-BSPN7P', 'GA-STU-BSPN7P', 'ga-stu-bspn7p@student.iportal.local', 'Bulk Verify Student', NULL, NULL, '2026-11-24 19:12:03', '2026-11-24 19:12:06', '2026-11-24 19:12:06'),
(193, 222, 1, 'TEA', 'active', 1, 'GA-TEA-BTU592', 'GA-TEA-BTU592', 'bulk.teacher.11262@test.local', 'Bulk Verify Teacher', NULL, NULL, '2026-11-24 19:12:05', '2026-11-24 19:12:06', '2026-11-24 19:12:06');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `admission_number` varchar(50) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `status` enum('active','inactive','graduated','transferred','suspended') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `school_id`, `user_id`, `admission_number`, `full_name`, `email`, `phone`, `gender`, `date_of_birth`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 5, 'DEV-STU-001', 'Development Student', 'student@example.test', NULL, NULL, NULL, 'active', '2026-10-26 16:38:35', '2026-10-26 16:38:35', NULL),
(5, 1, NULL, 'STU-2026-001', 'David Adeleke', NULL, NULL, 'male', NULL, 'active', '2026-10-26 19:41:39', '2026-10-26 19:41:39', NULL),
(75, 1, NULL, 'STU-4664', 'Chukwuemeka Obi', NULL, NULL, 'male', NULL, 'active', '2026-11-02 08:25:40', '2026-11-02 08:25:40', NULL),
(76, 1, 203, 'DEV-CAMPUS/2026/0644', 'Chinedu Okafor', 'chinedu.applicant@example.test', '08031234567', 'male', NULL, 'active', '2026-11-16 08:35:53', '2026-11-16 08:35:53', NULL),
(87, 1, 208, 'DEVCAMPUS/2026/4805', 'Zainab Ibrahim', 'zainab.43e19f@example.com', '08091112233', 'female', NULL, 'active', '2026-11-20 21:55:55', '2026-11-20 21:55:55', NULL),
(89, 1, 217, 'GA/2026/9508', 'friday aki', 'mail@mail.com', '', 'male', '2012-05-05', 'active', '2026-11-22 20:21:31', '2026-11-22 20:21:31', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_charges`
--

CREATE TABLE `student_charges` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `fee_structure_id` bigint(20) UNSIGNED DEFAULT NULL,
  `academic_session_id` bigint(20) UNSIGNED DEFAULT NULL,
  `term_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `status` enum('pending','partial','paid','overdue','waived','cancelled') NOT NULL DEFAULT 'pending',
  `due_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `invoice_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_charges`
--

INSERT INTO `student_charges` (`id`, `school_id`, `student_id`, `fee_structure_id`, `academic_session_id`, `term_id`, `amount`, `discount_amount`, `net_amount`, `currency`, `status`, `due_date`, `notes`, `paid_at`, `created_at`, `updated_at`, `invoice_id`) VALUES
(16, 1, 5, 22, 1, 1, 75000.00, 0.00, 75000.00, 'NGN', 'paid', NULL, NULL, '2026-11-15 22:14:17', '2026-11-11 19:37:11', '2026-11-15 22:14:17', NULL),
(17, 1, 5, 23, 1, 1, 75000.00, 0.00, 75000.00, 'NGN', 'paid', NULL, NULL, '2026-11-16 12:25:51', '2026-11-11 19:39:26', '2026-11-16 12:25:51', NULL),
(18, 1, 5, 24, 1, 1, 45000.00, 0.00, 45000.00, 'NGN', 'partial', '2026-12-15', NULL, NULL, '2026-11-15 22:10:45', '2026-11-22 20:52:45', NULL),
(19, 1, 75, 22, 1, 1, 75000.00, 0.00, 75000.00, 'NGN', 'paid', NULL, NULL, '2026-11-16 07:31:22', '2026-11-16 07:30:24', '2026-11-16 07:31:22', NULL),
(20, 1, 75, 23, 1, 1, 75000.00, 0.00, 75000.00, 'NGN', 'paid', NULL, NULL, '2026-11-16 07:31:22', '2026-11-16 07:30:24', '2026-11-16 07:31:22', NULL),
(21, 1, 75, 24, 1, 1, 45000.00, 0.00, 45000.00, 'NGN', 'paid', '2026-12-15', NULL, '2026-11-16 07:31:22', '2026-11-16 07:30:24', '2026-11-16 07:31:22', NULL),
(22, 1, 89, 22, 1, 1, 75000.00, 0.00, 75000.00, 'NGN', 'paid', NULL, NULL, '2026-11-22 21:03:41', '2026-11-22 20:32:08', '2026-11-22 21:03:41', NULL),
(23, 1, 89, 23, 1, 1, 75000.00, 0.00, 75000.00, 'NGN', 'pending', NULL, NULL, NULL, '2026-11-22 20:32:08', '2026-11-22 20:32:08', NULL),
(24, 1, 89, 24, 1, 1, 45000.00, 0.00, 45000.00, 'NGN', 'pending', '2026-12-15', NULL, NULL, '2026-11-22 20:32:08', '2026-11-22 20:32:08', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_class_memberships`
--

CREATE TABLE `student_class_memberships` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED NOT NULL,
  `academic_session_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_class_memberships`
--

INSERT INTO `student_class_memberships` (`id`, `school_id`, `student_id`, `class_id`, `academic_session_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 1, '2026-10-26 16:38:37', '2026-10-26 16:38:37'),
(52, 1, 75, 73, 1, '2026-11-02 08:25:40', '2026-11-02 08:25:40'),
(53, 1, 76, 1, 1, '2026-11-16 08:35:53', '2026-11-16 08:35:53'),
(57, 1, 87, 1, 1, '2026-11-20 21:55:55', '2026-11-20 21:55:55'),
(59, 1, 89, 1, 1, '2026-11-22 20:21:31', '2026-11-22 20:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `student_invoices`
--

CREATE TABLE `student_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `academic_session_id` bigint(20) UNSIGNED NOT NULL,
  `term_id` bigint(20) UNSIGNED NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `status` enum('draft','issued','cancelled') NOT NULL DEFAULT 'draft',
  `issued_on` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_session_rollovers`
--

CREATE TABLE `student_session_rollovers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `source_session_id` bigint(20) UNSIGNED NOT NULL,
  `destination_session_id` bigint(20) UNSIGNED NOT NULL,
  `previous_class_id` bigint(20) UNSIGNED DEFAULT NULL,
  `new_class_id` bigint(20) UNSIGNED DEFAULT NULL,
  `decision` enum('promoted','repeated','withdrawn','inactive') NOT NULL,
  `reason` text DEFAULT NULL,
  `performed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `performed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `school_id`, `name`, `code`, `description`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'Development Mathematics', 'DEV-MATH', 'Local development fixture', '2026-10-26 16:38:37', '2026-11-21 16:52:52', '2026-11-21 16:52:52'),
(3, 1, 'Mathematics', 'MTH', NULL, '2026-10-26 19:41:38', '2026-11-21 16:53:23', NULL),
(38, 1, 'Further Mathematics', 'FMTH', NULL, '2026-11-02 08:25:39', '2026-11-21 16:53:09', NULL),
(39, 1, 'English Language', 'ENG', NULL, '2026-11-21 16:53:42', '2026-11-21 16:53:42', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED DEFAULT NULL,
  `plan_name` varchar(100) NOT NULL,
  `status` enum('trial','active','expired','cancelled') NOT NULL DEFAULT 'trial',
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `school_id`, `plan_name`, `status`, `start_date`, `end_date`, `amount`, `created_at`, `updated_at`) VALUES
(2, 1, 'standard', 'active', '2026-11-16 00:00:00', '2026-11-27 00:00:00', 150000.00, '2026-11-16 11:54:14', '2026-11-22 21:00:38'),
(3, 175, 'free_trial', 'trial', '2026-11-16 20:25:23', '2026-11-30 20:25:23', 0.00, '2026-11-16 20:25:23', '2026-11-16 20:25:23');

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `level` varchar(20) NOT NULL,
  `source` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`context`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `staff_number` varchar(50) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`id`, `school_id`, `user_id`, `staff_number`, `full_name`, `email`, `phone`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 4, 'GA-TEA-TT0002', 'Development Teacher', 'teacher@example.test', NULL, 'active', '2026-10-26 16:38:35', '2026-11-22 18:08:30', NULL),
(29, 1, NULL, 'TEA-8066', 'Mr. Kenneth Alabi', NULL, '08012345678', 'active', '2026-11-02 08:25:41', '2026-11-22 18:26:01', '2026-11-22 18:26:01'),
(30, 1, 204, 'STF-2026-99', 'Mrs. Funke Akindele', 'new.teacher@example.test', '08055554444', 'active', '2026-11-16 08:39:27', '2026-11-22 18:26:09', '2026-11-22 18:26:09'),
(31, 1, 207, 'BUR/9909', 'james', 'aselemiprimeson@gmail.com', '5083857885', 'active', '2026-11-19 20:39:12', '2026-11-22 18:26:27', '2026-11-22 18:26:27'),
(34, 1, 214, 'GA-TEA-AMR4TZ', 'Anita Marcus', 'anita@mail.com', '080774846657', 'active', '2026-11-22 18:07:39', '2026-11-22 18:08:30', NULL),
(35, 1, 215, 'GA-BUR-JJE87H', 'Joe john', 'joe@mail.com', NULL, 'active', '2026-11-22 18:33:17', '2026-11-22 18:33:17', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `teacher_assignments`
--

CREATE TABLE `teacher_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `subject_id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED NOT NULL,
  `academic_session_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teacher_assignments`
--

INSERT INTO `teacher_assignments` (`id`, `school_id`, `teacher_id`, `subject_id`, `class_id`, `academic_session_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 1, 1, '2026-10-26 16:38:37', '2026-10-26 16:38:37'),
(36, 1, 29, 38, 73, 1, '2026-11-02 08:25:42', '2026-11-02 08:25:42'),
(37, 1, 29, 1, 1, 1, '2026-11-16 08:38:30', '2026-11-16 08:38:30');

-- --------------------------------------------------------

--
-- Table structure for table `terms`
--

CREATE TABLE `terms` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `academic_session_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('draft','active','closed') NOT NULL DEFAULT 'draft',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `terms`
--

INSERT INTO `terms` (`id`, `school_id`, `academic_session_id`, `name`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'First Term', '2026-09-01', '2026-12-31', 'active', '2026-10-26 16:38:36', '2026-11-16 08:36:52'),
(15, 1, 1, 'Second Term', '2027-01-01', '2027-03-31', 'draft', '2026-11-16 06:54:49', '2026-11-16 08:36:52'),
(16, 1, 1, 'Third Term', '2027-04-01', '2027-07-31', 'draft', '2026-11-16 06:57:58', '2026-11-16 08:36:52'),
(20, 175, 95, 'First Term', NULL, NULL, 'active', '2026-11-22 19:08:59', '2026-11-22 19:08:59'),
(21, 175, 95, 'Second Term', NULL, NULL, 'draft', '2026-11-22 19:09:00', '2026-11-22 19:09:00'),
(22, 175, 95, 'Third Term', NULL, NULL, 'draft', '2026-11-22 19:09:00', '2026-11-22 19:09:00');

-- --------------------------------------------------------

--
-- Table structure for table `term_remarks`
--

CREATE TABLE `term_remarks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `term_id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED DEFAULT NULL,
  `teacher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `overall_total` decimal(8,2) DEFAULT NULL,
  `overall_average` decimal(6,2) DEFAULT NULL,
  `subjects_count` int(10) UNSIGNED DEFAULT NULL,
  `class_position` int(10) UNSIGNED DEFAULT NULL,
  `class_size` int(10) UNSIGNED DEFAULT NULL,
  `comment` text NOT NULL,
  `class_teacher_remark` text DEFAULT NULL,
  `principal_remark` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `term_remarks`
--

INSERT INTO `term_remarks` (`id`, `school_id`, `student_id`, `term_id`, `class_id`, `teacher_id`, `overall_total`, `overall_average`, `subjects_count`, `class_position`, `class_size`, `comment`, `class_teacher_remark`, `principal_remark`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 1, NULL, 180.00, 90.00, 2, 1, 4, '', NULL, NULL, '2026-11-20 21:41:00', '2026-11-20 21:41:01'),
(2, 1, 5, 1, 1, NULL, 160.00, 80.00, 2, 2, 4, '', NULL, NULL, '2026-11-20 21:41:00', '2026-11-20 21:41:01'),
(3, 1, 75, 1, 1, NULL, 160.00, 80.00, 2, 2, 4, '', NULL, NULL, '2026-11-20 21:41:00', '2026-11-20 21:41:01'),
(4, 1, 76, 1, 1, NULL, 130.00, 65.00, 2, 4, 4, '', NULL, NULL, '2026-11-20 21:41:01', '2026-11-20 21:41:01');

-- --------------------------------------------------------

--
-- Table structure for table `timetables`
--

CREATE TABLE `timetables` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `school_id` bigint(20) UNSIGNED NOT NULL,
  `academic_session_id` bigint(20) UNSIGNED NOT NULL,
  `term_id` bigint(20) UNSIGNED DEFAULT NULL,
  `class_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` enum('draft','active','inactive') NOT NULL DEFAULT 'draft',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `timetables`
--

INSERT INTO `timetables` (`id`, `school_id`, `academic_session_id`, `term_id`, `class_id`, `name`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(15, 1, 1, 1, 1, 'Class Timetable', 'active', 3, '2026-11-16 08:38:29', '2026-11-16 08:38:29');

-- --------------------------------------------------------

--
-- Table structure for table `timetable_entries`
--

CREATE TABLE `timetable_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `timetable_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_assignment_id` bigint(20) UNSIGNED NOT NULL,
  `day_of_week` tinyint(3) UNSIGNED NOT NULL,
  `starts_at` time NOT NULL,
  `ends_at` time NOT NULL,
  `room` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `timetable_entries`
--

INSERT INTO `timetable_entries` (`id`, `timetable_id`, `teacher_assignment_id`, `day_of_week`, `starts_at`, `ends_at`, `room`, `created_at`, `updated_at`) VALUES
(8, 15, 37, 1, '08:00:00', '09:00:00', 'Room 101', '2026-11-16 08:39:27', '2026-11-16 08:39:27');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `status` enum('active','invited','disabled','suspended') NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0,
  `login_pin` varchar(50) DEFAULT NULL,
  `platform_pin` varchar(50) DEFAULT NULL,
  `active_school_id` bigint(20) UNSIGNED DEFAULT NULL,
  `active_role` varchar(50) DEFAULT NULL,
  `is_school_admin` tinyint(1) NOT NULL DEFAULT 0,
  `is_super_admin` tinyint(1) NOT NULL DEFAULT 0,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `phone`, `status`, `email_verified_at`, `password_changed_at`, `must_change_password`, `login_pin`, `platform_pin`, `active_school_id`, `active_role`, `is_school_admin`, `is_super_admin`, `last_login_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'sad@example.test', '$2y$12$ylfGhn.l5nRzdqXFqWRYw.rOKFjmE8215zGNPg67CFLu7JqpYSAxO', 'Platform Development Admin', NULL, 'active', NULL, NULL, 0, NULL, 'PL-SAD-AA0001', NULL, 'SAD', 0, 1, '2026-11-26 21:16:27', '2026-10-26 16:38:22', '2026-11-26 21:16:27', NULL),
(2, 'test@mail.com', '$2y$12$9gIxpc2c0oTv9JuymOjNJu5dahIEj1zKDaEsvKxFOd96t3VNyJKLW', 'Super Admin', NULL, 'active', NULL, NULL, 0, 'PL-SAD-TG27BI', 'PL-SAD-TG27BI', NULL, 'SAD', 0, 1, '2026-11-22 18:13:44', '2026-10-26 16:38:26', '2026-11-22 18:13:44', NULL),
(3, 'admin@example.test', '$2y$12$tuNt7lk6lWQIliyZNFqLHuBeh3cRJ0pndJMMcsR/wwoPVKzHprDOe', 'Grace Academy Admin', NULL, 'active', NULL, NULL, 0, 'GA-ADM-AA0001', 'GA-ADM-AA0001', 1, 'ADM', 1, 0, '2026-11-26 21:22:48', '2026-10-26 16:38:27', '2026-11-26 21:22:48', NULL),
(4, 'teacher@example.test', '$2y$12$cyS.92YqosVD5MbVwVQBv.e7ivOmK.cdqTN/uQz8DRWIpHH5uC1tC', 'Development Teacher', NULL, 'active', NULL, NULL, 0, 'GA-TEA-TT0002', 'GA-TEA-TT0002', 1, 'TEA', 0, 0, '2026-11-15 22:44:40', '2026-10-26 16:38:29', '2026-11-22 18:08:30', NULL),
(5, 'student@example.test', '$2y$12$uihB08lG3ATxwFQCngB3kemk..kK6O/xaNd7C/S9hUxSr1brhTb9a', 'Development Student', NULL, 'active', NULL, NULL, 0, 'GA-STU-SS0003', 'GA-STU-SS0003', 1, 'STU', 0, 0, '2026-11-22 19:55:51', '2026-10-26 16:38:30', '2026-11-22 19:55:51', NULL),
(6, 'parent@example.test', '$2y$12$wLx5Zl8Bn65UVel/xpH5X.oq1ijnkaAUv8xfdS3g6dHPjMxpEpmLa', 'Development Parent', NULL, 'active', NULL, NULL, 0, 'GA-PAR-PP0004', 'GA-PAR-PP0004', 1, 'PAR', 0, 0, NULL, '2026-10-26 16:38:32', '2026-11-22 18:08:30', NULL),
(203, 'chinedu.applicant@example.test', '$2y$12$b6IhdRChN2MP156twoyhdO6tf42BHHXnXlf/REYJZ0wbqg1RMhPF6', 'Chinedu Okafor', '08031234567', 'active', NULL, NULL, 1, 'DEV-CAMPUS-STU-3LUTKI', 'DEV-CAMPUS-STU-3LUTKI', 1, 'STU', 0, 0, NULL, '2026-11-16 08:35:53', '2026-11-16 08:35:53', NULL),
(204, 'new.teacher@example.test', '$2y$12$GQZqNm33yuRFZiq.jyQ27.cvvpO5b/UkQs/uGpo6LhY8siRWDjhbK', 'Mrs. Funke Akindele', '08055554444', 'disabled', NULL, NULL, 1, 'GA-TEA-MAJ5P3', 'GA-TEA-MAJ5P3', 1, 'TEA', 0, 0, NULL, '2026-11-16 08:39:27', '2026-11-22 18:30:46', NULL),
(207, 'aselemiprimeson@gmail.com', '$2y$12$xegVNaNvnzD3ykF4SA7JV.zEt1vXsdKfh3JhXB5DduOlSZe/XDYBe', 'james', '5083857885', 'active', NULL, NULL, 1, 'DEV-CAMPUS-BUR-BREZJM', 'DEV-CAMPUS-BUR-BREZJM', 1, 'EXM', 0, 0, NULL, '2026-11-19 20:39:12', '2026-11-22 18:32:23', NULL),
(208, 'zainab.43e19f@example.com', '$2y$12$qhnpBxUNwbNwBq/5d5ghw.rH5ahOEC5m2LhMPB7hC6d8BUmJ5Soua', 'Zainab Ibrahim', '08091112233', 'active', NULL, NULL, 1, 'GA-STU-7Z6TTL', 'GA-STU-7Z6TTL', 1, 'STU', 0, 0, NULL, '2026-11-20 21:55:55', '2026-11-22 18:08:30', NULL),
(209, 'musa.ibrahim.43e19f@example.com', '$2y$12$ZlEiVt0ZsM1oOlvicqHYouU73shdFREi0vNnBkdIYBUhbDEVFCu4S', 'Alhaji Musa Ibrahim', '08094445566', 'active', NULL, NULL, 1, 'GA-PAR-7TKHVO', 'GA-PAR-7TKHVO', 1, 'PAR', 0, 0, NULL, '2026-11-20 21:55:56', '2026-11-22 18:08:30', NULL),
(214, 'anita@mail.com', '$2y$12$Ct298/G6WSNYwyEKQPSW9OnPmFtcUcabZm.irhcV6iIU7Hl7Mx2vS', 'Anita Marcus', '080774846657', 'active', NULL, NULL, 1, 'GA-TEA-AMR4TZ', 'GA-TEA-AMR4TZ', 1, 'TEA', 0, 0, '2026-11-22 18:11:24', '2026-11-22 18:07:38', '2026-11-22 18:29:37', NULL),
(215, 'joe@mail.com', '$2y$12$qtFVDZKwrejveMD0sd1BMO27SYPya1XsG1UZzuvetUchB2yJJI1Ke', 'Joe john', NULL, 'active', NULL, NULL, 1, 'GA-BUR-JJE87H', 'GA-BUR-JJE87H', 1, 'BUR', 0, 0, '2026-11-22 18:34:37', '2026-11-22 18:33:17', '2026-11-23 19:56:31', NULL),
(217, 'mail@mail.com', '$2y$12$Kn.Jb1VWyykVtF.LtRuH2.NY026mPbp55ccqFj3Q6twmJoIbWP62q', 'friday aki', '', 'active', NULL, '2026-11-24 17:53:15', 0, 'GA-STU-FAASSG', 'GA-STU-FAASSG', 1, 'STU', 0, 0, '2026-11-24 17:52:56', '2026-11-22 20:21:31', '2026-11-24 17:53:15', NULL),
(218, 'parent.ga20269508@campus.local', '$2y$12$xDkEZO3CIwYQyvBcX0SKIuqxHrq99pf2h8w5ouhFsU/MIRzag0Hli', 'Parent of friday aki', NULL, 'active', NULL, NULL, 1, 'GA-PAR-PAPZW5', 'GA-PAR-PAPZW5', 1, 'PAR', 0, 0, NULL, '2026-11-22 20:21:32', '2026-11-22 20:21:32', NULL),
(220, 'anothersc@mail.com', '$2y$12$CWzCpKQPVdq31xEqVl2.6uqJY2HxPhOcIqxwbDIbvcEgS5EMXVdla', 'another school', NULL, 'active', NULL, '2026-11-23 16:24:21', 0, 'AS-ADM-AS26KV', 'AS-ADM-AS26KV', 175, 'ADM', 1, 0, '2026-11-23 16:23:52', '2026-11-23 16:23:15', '2026-11-23 16:26:01', NULL),
(221, 'ga-stu-bspn7p@student.iportal.local', '$2y$12$MTeHcBi0rXRIu7DalL7tCuWSxaHA.hrLfNh9mcl4J6bxvPvEyWo/u', 'Bulk Verify Student', NULL, 'active', NULL, NULL, 1, 'GA-STU-BSPN7P', 'GA-STU-BSPN7P', 1, 'STU', 0, 0, NULL, '2026-11-24 19:12:03', '2026-11-24 19:12:06', '2026-11-24 19:12:06'),
(222, 'bulk.teacher.11262@test.local', '$2y$12$69KRhN2UKsMMIpsn0YrZMuwm9KVKEwj6OHuHsbX2mtjaHJmR3TYWa', 'Bulk Verify Teacher', '08099998888', 'active', NULL, NULL, 1, 'GA-TEA-BTU592', 'GA-TEA-BTU592', 1, 'TEA', 0, 0, NULL, '2026-11-24 19:12:05', '2026-11-24 19:12:07', '2026-11-24 19:12:07');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token_hash` varchar(255) DEFAULT NULL,
  `login_ip` varchar(64) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `token_hash`, `login_ip`, `user_agent`, `expires_at`, `revoked_at`, `created_at`, `updated_at`) VALUES
(4, 2, '128d47e5b42e52e4ef2b66c799ccd23f2a56243ab828d12e69ad944bca68486a', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-02 17:10:17', NULL, '2026-10-26 17:10:17', '2026-10-26 17:10:17'),
(5, 2, '5be96a877e904e7ebfbba7761181602f5e61d41518ceb27eaee4ce0b6b225dd4', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-02 17:12:34', NULL, '2026-10-26 17:12:34', '2026-10-26 17:12:34'),
(6, 3, '141b561be1c1da100761defff97014efe17b5374ed8253253f6a9cd69f17ef0f', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-02 17:14:05', '2026-11-23 19:56:32', '2026-10-26 17:14:05', '2026-11-23 19:56:32'),
(7, 4, 'a067a72e389089d07c255d33cb6b5b62108526955fa10479824eb35eb8ae3501', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-02 17:15:11', NULL, '2026-10-26 17:15:11', '2026-10-26 17:15:11'),
(8, 5, 'e8d99abc30320fc73eac905cc35e47d20081e8ef8c0ce8bd9f8e9a93b1b7e5b7', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-02 17:15:36', NULL, '2026-10-26 17:15:36', '2026-10-26 17:15:36'),
(9, 2, 'f2f9736473df250693f10055938c206e30b92981c0e40d787b239581bdb2219f', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-02 17:37:01', '2026-10-26 17:38:13', '2026-10-26 17:37:01', '2026-10-26 17:38:13'),
(10, 1, 'a2539299b3221613ce7c60d53b546bf5162085bb9a991dd7116e30c2ddbc4804', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-02 17:38:26', '2026-10-26 17:38:36', '2026-10-26 17:38:26', '2026-10-26 17:38:36'),
(11, 3, 'ed337db06dbfb3ff65840f92b089ec2e9d4c671b687cbba2f8ae827b14c035a5', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-02 17:39:01', '2026-11-23 19:56:32', '2026-10-26 17:39:01', '2026-11-23 19:56:32'),
(12, 2, '8971cb85d514b93d4c2e5e66c7f1b4866772cbfaf0b30f6adfbdae1502d9ff9c', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-02 19:19:39', NULL, '2026-10-26 19:19:39', '2026-10-26 19:19:39'),
(13, 3, 'f9d50356dcfa7c4e407f62393b7141740359c23a6435047f119158e9658a248e', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-02 19:41:36', '2026-11-23 19:56:32', '2026-10-26 19:41:36', '2026-11-23 19:56:32'),
(14, 3, '10cb91cb2d31ae7440bc044cf400278664dc239ffb624299d8f688eee792f5de', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-02 19:43:53', '2026-11-23 19:56:32', '2026-10-26 19:43:53', '2026-11-23 19:56:32'),
(47, 4, 'e5ae3609c5fd74e3320ea8f484ab8ae6cc47e24c4e7398193f749f80069ae5b6', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-03 07:11:34', '2026-10-27 07:12:02', '2026-10-27 07:11:34', '2026-10-27 07:12:02'),
(48, 2, '65473b4f0fa012120f1d7036e2c62521e13118637d8be987e187fdcbd51635c4', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-03 07:12:27', NULL, '2026-10-27 07:12:27', '2026-10-27 07:12:27'),
(73, 2, 'c65d99f3fd929434833cbe733cabf26caa03cf44b2586f39099a02f2fd50d957', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-08 13:57:40', NULL, '2026-11-01 13:57:40', '2026-11-01 13:57:40'),
(136, 2, '930e63ea156ae675115846bed58b217560239e4043e56370512c09f9c0857deb', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-09 08:18:15', '2026-11-02 08:20:10', '2026-11-02 08:18:15', '2026-11-02 08:20:10'),
(137, 3, '411b40661588947fdf778e6cfc98eb0672f9d3723e3b5af4b2921d81f5af75ec', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-09 08:20:20', '2026-11-23 19:56:32', '2026-11-02 08:20:20', '2026-11-23 19:56:32'),
(138, 5, 'd71710d9502d33eaad347bbd19cd7d54677949b1a159cb644cc39ede0d9f4108', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-09 08:20:27', '2026-11-02 08:25:28', '2026-11-02 08:20:27', '2026-11-02 08:25:28'),
(139, 3, '5420a26f99b018ad6bc83d5c0f040f8693477d3ba69f2fd4910bbffde3a4df6a', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-09 08:25:37', '2026-11-23 19:56:32', '2026-11-02 08:25:37', '2026-11-23 19:56:32'),
(140, 5, '24cd2c2852aee07a6276aeda0c666fc927acfb253aa3e8667b27ee2fd40ded0a', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-09 08:25:57', NULL, '2026-11-02 08:25:57', '2026-11-02 08:25:57'),
(141, 3, '36aa535f5517edd4b5c6d326aa40f32f5352f9252d36acf247e9965f17a635e1', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-09 08:26:05', '2026-11-23 19:56:32', '2026-11-02 08:26:05', '2026-11-23 19:56:32'),
(142, 3, '795ae401287a9fcf8fb051168f7f842d70c766b270bcd73b621484ce00a86703', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-09 08:31:16', '2026-11-23 19:56:32', '2026-11-02 08:31:16', '2026-11-23 19:56:32'),
(143, 3, 'b43799c0ac9f628bcea32391ff0492eb6dfec183c27f001f1f6a8283d18d68e2', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-09 08:31:42', '2026-11-23 19:56:32', '2026-11-02 08:31:42', '2026-11-23 19:56:32'),
(144, 3, '8b1fe049922f199bb1ed3588a3f4669f59573fa42b9fbbd0eb8ebaf69f19d8e5', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-09 08:34:47', '2026-11-02 08:38:29', '2026-11-02 08:34:47', '2026-11-02 08:38:29'),
(145, 3, 'e5e9c6ce32a7413fe3fb67bc48ad1a28e8292224aac34e7481c3e307e27d7b81', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-09 08:36:14', '2026-11-23 19:56:32', '2026-11-02 08:36:14', '2026-11-23 19:56:32'),
(146, 3, '91b6b2123ac2f794d0c6cd02795a5ccf1952376cf97d2f35f0f63d690af19f30', '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133', '2026-11-09 08:36:48', '2026-11-23 19:56:32', '2026-11-02 08:36:48', '2026-11-23 19:56:32'),
(147, 5, 'dce05591274419d3b39199b7c1c47bff6659035cbd75caf59a873770935d4d4f', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36', '2026-11-19 08:55:27', NULL, '2026-11-12 08:55:27', '2026-11-12 08:55:27'),
(148, 5, '61607998d958483da26b8c413a961ad8d21ea6e03b0ad5341772bb3b2932b81f', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36', '2026-11-22 22:31:21', NULL, '2026-11-15 22:31:22', '2026-11-15 22:31:22'),
(149, 3, '15ba1df9123867df5d563fc826c1fff1befa822e64aad584e666bb1993a1fdff', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36', '2026-11-22 22:35:42', '2026-11-23 19:56:32', '2026-11-15 22:35:42', '2026-11-23 19:56:32'),
(150, 5, 'b50be151b3a12c61c3d30e254b38a947cdc9cc06a8336f47e3522ab134e5d2ed', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36', '2026-11-22 22:44:02', NULL, '2026-11-15 22:44:02', '2026-11-15 22:44:02'),
(151, 4, '7f8e81321239aeb99ca728243a100cf697604a7246a3cc961ffaac40c3f7db69', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36', '2026-11-22 22:44:40', '2026-11-16 06:51:02', '2026-11-15 22:44:40', '2026-11-16 06:51:02'),
(152, 5, '1780388781b1c5932c2b627b77fddd3b0142fcb2dfe2a8ab9ca9e0f08e14a362', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36', '2026-11-23 06:51:34', '2026-11-17 07:56:13', '2026-11-16 06:51:34', '2026-11-17 07:56:13'),
(153, 3, 'be2c22809744ceb79732dc6e64633ecc0651a1d39ac6b9608edd7b21dbf6e8ec', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36', '2026-11-23 06:53:08', '2026-11-23 19:56:32', '2026-11-16 06:53:08', '2026-11-23 19:56:32'),
(154, 1, 'c8746359dbe4c3cae99efda20f4e5de571255ac9321500b8492aaf7c86c58baa', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-11-23 07:47:29', '2026-11-16 07:48:13', '2026-11-16 07:47:29', '2026-11-16 07:48:13'),
(155, 2, '0c8ac60fffca6bf5ba1acb151b7620eec593da0c0e22a21f582d43df87c849e4', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-11-23 07:48:32', '2026-11-16 07:54:57', '2026-11-16 07:48:32', '2026-11-16 07:54:57'),
(156, 1, 'f98b466d1f1ac1f4823e5abcfe5e1e8cda105b69a0ec2a15d4c7608da8d01074', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-11-23 11:53:45', NULL, '2026-11-16 11:53:45', '2026-11-16 11:53:45'),
(157, 3, 'e69488cda1754cf222fb0d07e7d64abbffc60299cedfe0031495f90bc53542da', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-25 21:07:27', '2026-11-18 21:11:33', '2026-11-18 21:07:27', '2026-11-18 21:11:33'),
(158, 5, '5e748b72acfad65c292251108601a0df63fd9b632124603ba796035219f42901', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-26 19:54:24', '2026-11-19 20:29:04', '2026-11-19 19:54:25', '2026-11-19 20:29:04'),
(159, 3, 'a6cf34eaf03d87c2aa5b3139548763750c89c07c44a1283448582e63d3b09d89', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-26 20:29:21', '2026-11-23 19:56:32', '2026-11-19 20:29:21', '2026-11-23 19:56:32'),
(160, 3, '4787bf0703fe109d5be89dde7e24df243560867fdd728056c43d62298293c340', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-29 16:06:58', '2026-11-23 19:56:32', '2026-11-22 16:06:58', '2026-11-23 19:56:32'),
(161, 214, 'bd6dcabc062d4397528bdd73058ac1c27882f518e067974c6ea5485418e75620', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-29 18:11:24', NULL, '2026-11-22 18:11:24', '2026-11-22 18:11:24'),
(162, 2, '8a162801ab9b6bcf6d67b2051a26a04dc0eae63b5c9c07775e47d4df2e2716bd', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-29 18:13:44', '2026-11-22 18:16:52', '2026-11-22 18:13:44', '2026-11-22 18:16:52'),
(163, 1, '948195d62556689c16016c26f5619c2a1f53d189e9406bbb0c6959f5c4b18994', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-29 18:17:20', NULL, '2026-11-22 18:17:20', '2026-11-22 18:17:20'),
(164, 215, '26418e9572e353e5157a093d6c91793db44a2776c5ee90a3331802ccabac2d0b', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-11-29 18:34:37', '2026-11-22 19:55:06', '2026-11-22 18:34:37', '2026-11-22 19:55:06'),
(165, 5, '80c010186af1a0c83ffa32dce1b51ef102116f934cd3631b4a57096ec2b2a213', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-11-29 19:55:51', '2026-11-22 20:41:17', '2026-11-22 19:55:51', '2026-11-22 20:41:17'),
(166, 217, '266e697132796f7c4ea11b77b3bf7d463e0477b7a464a8e3c2c413143b54438e', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-29 20:22:27', '2026-11-23 15:27:08', '2026-11-22 20:22:28', '2026-11-23 15:27:08'),
(167, 1, '478249f25ae8e2990e90cdf0e8d47355f654aa8922413f6d52df08f0866e8986', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-11-29 20:41:31', NULL, '2026-11-22 20:41:31', '2026-11-22 20:41:31'),
(168, 220, '81d1d6335f4253f1f651cc8d2cfc2abc531707a7163502f7756ad005b29de3e9', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-30 16:23:52', '2026-11-23 19:02:25', '2026-11-23 16:23:52', '2026-11-23 19:02:25'),
(169, 3, '83135d742b880fce68ca4bea0b5d28d3805f0e398e62f302001b735b9852d86a', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-30 19:04:29', '2026-11-23 19:56:32', '2026-11-23 19:04:29', '2026-11-23 19:56:32'),
(170, 3, 'f80a12c042154162b401ca3478b38c6512a9d4271fbe5cfbbc3da93a5253e166', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-11-30 19:58:54', '2026-11-26 20:52:50', '2026-11-23 19:58:54', '2026-11-26 20:52:50'),
(171, 217, 'b8b61d1df12c828c92f6c80de0a8de655a25c4445d171fcc8a49bb0bd25fc091', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-12-01 17:52:56', '2026-11-26 21:05:34', '2026-11-24 17:52:56', '2026-11-26 21:05:34'),
(172, 3, '6ab033c07c9958670b02ccff69287ef5dfe00b7b6a9b36b617203e834dfaa5f1', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-12-03 20:53:07', '2026-11-26 21:15:13', '2026-11-26 20:53:07', '2026-11-26 21:15:13'),
(173, 1, '2be113172cff0b99818ae0739718330e34ae786db60d0b6b7b72a7dc42490890', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-12-03 21:16:26', '2026-11-26 21:22:30', '2026-11-26 21:16:27', '2026-11-26 21:22:30'),
(174, 3, '61f7a346c48fabf56f285fdf2b97ac270317d29b6bbd2ca85d862c6d920b567f', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36', '2026-12-03 21:22:48', NULL, '2026-11-26 21:22:48', '2026-11-26 21:22:48');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_sessions`
--
ALTER TABLE `academic_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `academic_sessions_school_id_index` (`school_id`);

--
-- Indexes for table `admission_applications`
--
ALTER TABLE `admission_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_admission_public_reference` (`public_reference`),
  ADD UNIQUE KEY `uq_admission_access_token_hash` (`access_token_hash`),
  ADD KEY `admission_applications_school_id_status_index` (`school_id`,`status`),
  ADD KEY `fk_admission_reviewer` (`reviewed_by`),
  ADD KEY `fk_admission_student` (`provisioned_student_id`),
  ADD KEY `fk_admission_guardian` (`provisioned_guardian_id`);

--
-- Indexes for table `admission_documents`
--
ALTER TABLE `admission_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `admission_documents_admission_application_id_document_id_unique` (`admission_application_id`,`document_id`),
  ADD KEY `admission_documents_document_id_foreign` (`document_id`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `announcements_school_id_status_index` (`school_id`,`status`),
  ADD KEY `announcements_author_id_foreign` (`author_id`);

--
-- Indexes for table `assessment_components`
--
ALTER TABLE `assessment_components`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_assessment_component_name` (`assessment_period_id`,`teacher_assignment_id`,`name`),
  ADD KEY `fk_assessment_component_assignment` (`teacher_assignment_id`);

--
-- Indexes for table `assessment_periods`
--
ALTER TABLE `assessment_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_assessment_period_scope` (`school_id`,`academic_session_id`,`term_id`),
  ADD KEY `fk_assessment_period_session` (`academic_session_id`),
  ADD KEY `fk_assessment_period_term` (`term_id`),
  ADD KEY `fk_assessment_period_scheme` (`grading_scheme_id`);

--
-- Indexes for table `assessment_scores`
--
ALTER TABLE `assessment_scores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_assessment_score_student` (`assessment_component_id`,`student_id`),
  ADD KEY `fk_assessment_score_student` (`student_id`),
  ADD KEY `fk_assessment_score_recorder` (`recorded_by`);

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assignments_school_id_teacher_id_index` (`school_id`,`teacher_id`),
  ADD KEY `assignments_teacher_id_foreign` (`teacher_id`),
  ADD KEY `assignments_class_id_foreign` (`class_id`),
  ADD KEY `assignments_subject_id_foreign` (`subject_id`);

--
-- Indexes for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `assignment_submissions_assignment_id_student_id_unique` (`assignment_id`,`student_id`),
  ADD KEY `assignment_submissions_school_id_foreign` (`school_id`),
  ADD KEY `assignment_submissions_student_id_foreign` (`student_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_attendance_student_day_session` (`student_id`,`attendance_date`,`attendance_session_id`),
  ADD KEY `attendance_school_id_attendance_date_index` (`school_id`,`attendance_date`),
  ADD KEY `attendance_class_id_foreign` (`class_id`),
  ADD KEY `attendance_teacher_id_foreign` (`teacher_id`),
  ADD KEY `fk_attendance_session` (`attendance_session_id`),
  ADD KEY `idx_attendance_student` (`student_id`);

--
-- Indexes for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attendance_sessions_class_date` (`school_id`,`class_id`,`attendance_date`),
  ADD KEY `fk_attendance_session_academic_session` (`academic_session_id`),
  ADD KEY `fk_attendance_session_term` (`term_id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_school_id_event_type_index` (`school_id`,`event_type`),
  ADD KEY `audit_logs_entity_type_entity_id_index` (`entity_type`,`entity_id`),
  ADD KEY `audit_logs_user_id_foreign` (`user_id`),
  ADD KEY `audit_logs_actor_user_id_foreign` (`actor_user_id`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `documents_owner_model_owner_id_index` (`owner_model`,`owner_id`),
  ADD KEY `documents_school_id_foreign` (`school_id`),
  ADD KEY `documents_uploaded_by_foreign` (`uploaded_by`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `feature_flags`
--
ALTER TABLE `feature_flags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `feature_flags_school_feature_unique` (`school_id`,`feature_key`),
  ADD KEY `feature_flags_school_id_index` (`school_id`),
  ADD KEY `feature_flags_feature_key_index` (`feature_key`);

--
-- Indexes for table `fee_categories`
--
ALTER TABLE `fee_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `fee_categories_school_id_name_unique` (`school_id`,`name`);

--
-- Indexes for table `fee_structures`
--
ALTER TABLE `fee_structures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fee_structures_school_id_fee_category_id_index` (`school_id`,`fee_category_id`),
  ADD KEY `fee_structures_fee_category_id_foreign` (`fee_category_id`),
  ADD KEY `fk_fee_structure_session` (`academic_session_id`),
  ADD KEY `fk_fee_structure_term` (`term_id`),
  ADD KEY `fk_fee_structure_class` (`class_id`);

--
-- Indexes for table `grading_schemes`
--
ALTER TABLE `grading_schemes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `grading_schemes_school_id_name_unique` (`school_id`,`name`);

--
-- Indexes for table `grading_scheme_components`
--
ALTER TABLE `grading_scheme_components`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grading_scheme_components_grading_scheme_id_foreign` (`grading_scheme_id`);

--
-- Indexes for table `guardian_relationships`
--
ALTER TABLE `guardian_relationships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `guardian_relationships_school_id_guardian_id_student_id_unique` (`school_id`,`guardian_id`,`student_id`),
  ADD KEY `guardian_relationships_student_id_index` (`student_id`),
  ADD KEY `guardian_relationships_guardian_id_foreign` (`guardian_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `job_applications_job_vacancy_id_foreign` (`job_vacancy_id`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_vacancies`
--
ALTER TABLE `job_vacancies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `job_vacancies_school_id_foreign` (`school_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_read_at_index` (`user_id`,`read_at`),
  ADD KEY `notifications_school_id_foreign` (`school_id`);

--
-- Indexes for table `notification_dispatches`
--
ALTER TABLE `notification_dispatches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notification_dispatches_school_id_index` (`school_id`),
  ADD KEY `notification_dispatches_batch_id_index` (`batch_id`),
  ADD KEY `notification_dispatches_channel_index` (`channel`),
  ADD KEY `notification_dispatches_template_key_index` (`template_key`),
  ADD KEY `notification_dispatches_status_index` (`status`);

--
-- Indexes for table `notification_recipients`
--
ALTER TABLE `notification_recipients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `notification_recipients_notification_id_user_id_unique` (`notification_id`,`user_id`),
  ADD KEY `notification_recipients_user_id_foreign` (`user_id`);

--
-- Indexes for table `online_payment_transactions`
--
ALTER TABLE `online_payment_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `online_payment_transactions_gateway_reference_index` (`gateway_reference`),
  ADD KEY `online_payment_transactions_school_id_foreign` (`school_id`),
  ADD KEY `online_payment_transactions_payment_id_foreign` (`payment_id`);

--
-- Indexes for table `parent_guardians`
--
ALTER TABLE `parent_guardians`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_guardians_school_id_user_id_index` (`school_id`,`user_id`),
  ADD KEY `parent_guardians_user_id_foreign` (`user_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_reference_number_unique` (`reference_number`),
  ADD KEY `payments_school_id_status_index` (`school_id`,`status`),
  ADD KEY `payments_student_id_foreign` (`student_id`),
  ADD KEY `payments_user_id_foreign` (`user_id`),
  ADD KEY `fk_payment_admission_application` (`admission_application_id`),
  ADD KEY `payments_academic_session_id_foreign` (`academic_session_id`),
  ADD KEY `payments_term_id_foreign` (`term_id`);

--
-- Indexes for table `payment_allocations`
--
ALTER TABLE `payment_allocations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_allocations_payment_id_student_charge_id_unique` (`payment_id`,`student_charge_id`),
  ADD KEY `payment_allocations_school_id_foreign` (`school_id`),
  ADD KEY `payment_allocations_student_charge_id_foreign` (`student_charge_id`);

--
-- Indexes for table `payment_gateway_configs`
--
ALTER TABLE `payment_gateway_configs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_gateway_configs_school_id_gateway_name_unique` (`school_id`,`gateway_name`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_slug_unique` (`slug`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `platform_settings`
--
ALTER TABLE `platform_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `platform_settings_key_unique` (`key`);

--
-- Indexes for table `platform_transactions`
--
ALTER TABLE `platform_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `platform_transactions_school_id_foreign` (`school_id`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipts_receipt_number_unique` (`receipt_number`),
  ADD KEY `receipts_school_id_foreign` (`school_id`),
  ADD KEY `receipts_payment_id_foreign` (`payment_id`);

--
-- Indexes for table `results`
--
ALTER TABLE `results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `results_student_id_subject_id_index` (`student_id`,`subject_id`),
  ADD KEY `results_school_id_foreign` (`school_id`),
  ADD KEY `results_teacher_id_foreign` (`teacher_id`),
  ADD KEY `results_subject_id_foreign` (`subject_id`),
  ADD KEY `results_class_id_foreign` (`class_id`),
  ADD KEY `results_term_id_foreign` (`term_id`),
  ADD KEY `fk_results_approved_by` (`approved_by`),
  ADD KEY `fk_results_published_by` (`published_by`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_slug_unique` (`slug`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_role_id_permission_id_unique` (`role_id`,`permission_id`),
  ADD KEY `role_permissions_permission_id_foreign` (`permission_id`);

--
-- Indexes for table `schools`
--
ALTER TABLE `schools`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `schools_code_unique` (`code`);

--
-- Indexes for table `school_classes`
--
ALTER TABLE `school_classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `school_classes_school_id_academic_session_id_name_unique` (`school_id`,`academic_session_id`,`name`),
  ADD KEY `school_classes_school_id_index` (`school_id`),
  ADD KEY `school_classes_academic_session_id_foreign` (`academic_session_id`),
  ADD KEY `fk_school_class_teacher` (`class_teacher_id`);

--
-- Indexes for table `school_memberships`
--
ALTER TABLE `school_memberships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `school_memberships_user_id_school_id_role_unique` (`user_id`,`school_id`,`role`),
  ADD KEY `school_memberships_school_id_role_status_index` (`school_id`,`role`,`status`),
  ADD KEY `school_memberships_user_email_index` (`user_email`),
  ADD KEY `school_memberships_login_pin_index` (`login_pin`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `students_school_id_admission_number_unique` (`school_id`,`admission_number`),
  ADD KEY `students_school_id_user_id_index` (`school_id`,`user_id`),
  ADD KEY `students_user_id_foreign` (`user_id`);

--
-- Indexes for table `student_charges`
--
ALTER TABLE `student_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_charges_student_id_status_index` (`student_id`,`status`),
  ADD KEY `student_charges_school_id_foreign` (`school_id`),
  ADD KEY `student_charges_fee_structure_id_foreign` (`fee_structure_id`),
  ADD KEY `fk_student_charge_invoice` (`invoice_id`),
  ADD KEY `student_charges_academic_session_id_foreign` (`academic_session_id`),
  ADD KEY `student_charges_term_id_foreign` (`term_id`);

--
-- Indexes for table `student_class_memberships`
--
ALTER TABLE `student_class_memberships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_class_memberships_natural_key_unique` (`student_id`,`class_id`,`academic_session_id`),
  ADD KEY `student_class_memberships_school_id_index` (`school_id`),
  ADD KEY `student_class_memberships_class_id_foreign` (`class_id`),
  ADD KEY `student_class_memberships_academic_session_id_foreign` (`academic_session_id`);

--
-- Indexes for table `student_invoices`
--
ALTER TABLE `student_invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_student_invoice_number` (`school_id`,`invoice_number`),
  ADD UNIQUE KEY `uq_student_term_invoice` (`school_id`,`student_id`,`academic_session_id`,`term_id`),
  ADD KEY `fk_student_invoice_student` (`student_id`),
  ADD KEY `fk_student_invoice_session` (`academic_session_id`),
  ADD KEY `fk_student_invoice_term` (`term_id`),
  ADD KEY `fk_student_invoice_creator` (`created_by`);

--
-- Indexes for table `student_session_rollovers`
--
ALTER TABLE `student_session_rollovers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_student_session_rollover` (`student_id`,`destination_session_id`),
  ADD KEY `fk_rollover_school` (`school_id`),
  ADD KEY `fk_rollover_source_session` (`source_session_id`),
  ADD KEY `fk_rollover_destination_session` (`destination_session_id`),
  ADD KEY `fk_rollover_previous_class` (`previous_class_id`),
  ADD KEY `fk_rollover_new_class` (`new_class_id`),
  ADD KEY `fk_rollover_processor` (`performed_by`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subjects_school_id_name_unique` (`school_id`,`name`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subscriptions_school_id_status_index` (`school_id`,`status`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teachers_school_id_staff_number_unique` (`school_id`,`staff_number`),
  ADD KEY `teachers_school_id_user_id_index` (`school_id`,`user_id`),
  ADD KEY `teachers_user_id_foreign` (`user_id`);

--
-- Indexes for table `teacher_assignments`
--
ALTER TABLE `teacher_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teacher_assignments_natural_key_unique` (`teacher_id`,`subject_id`,`class_id`,`academic_session_id`),
  ADD KEY `teacher_assignments_school_id_index` (`school_id`),
  ADD KEY `teacher_assignments_subject_id_foreign` (`subject_id`),
  ADD KEY `teacher_assignments_class_id_foreign` (`class_id`),
  ADD KEY `teacher_assignments_academic_session_id_foreign` (`academic_session_id`);

--
-- Indexes for table `terms`
--
ALTER TABLE `terms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `terms_academic_session_id_index` (`academic_session_id`),
  ADD KEY `terms_school_id_foreign` (`school_id`);

--
-- Indexes for table `term_remarks`
--
ALTER TABLE `term_remarks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `term_remarks_student_id_term_id_unique` (`student_id`,`term_id`),
  ADD KEY `term_remarks_school_id_foreign` (`school_id`),
  ADD KEY `term_remarks_term_id_foreign` (`term_id`),
  ADD KEY `term_remarks_teacher_id_foreign` (`teacher_id`),
  ADD KEY `term_remarks_class_id_index` (`class_id`);

--
-- Indexes for table `timetables`
--
ALTER TABLE `timetables`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_timetables_school_session_class` (`school_id`,`academic_session_id`,`class_id`),
  ADD KEY `fk_timetable_session` (`academic_session_id`),
  ADD KEY `fk_timetable_term` (`term_id`),
  ADD KEY `fk_timetable_class` (`class_id`),
  ADD KEY `fk_timetable_creator` (`created_by`);

--
-- Indexes for table `timetable_entries`
--
ALTER TABLE `timetable_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_timetable_entry_start` (`timetable_id`,`day_of_week`,`starts_at`),
  ADD KEY `idx_timetable_teacher_time` (`teacher_assignment_id`,`day_of_week`,`starts_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_login_pin_unique` (`login_pin`),
  ADD UNIQUE KEY `users_platform_pin_unique` (`platform_pin`),
  ADD KEY `users_active_school_id_foreign` (`active_school_id`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_sessions_user_id_foreign` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_sessions`
--
ALTER TABLE `academic_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `admission_applications`
--
ALTER TABLE `admission_applications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `admission_documents`
--
ALTER TABLE `admission_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `assessment_components`
--
ALTER TABLE `assessment_components`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `assessment_periods`
--
ALTER TABLE `assessment_periods`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `assessment_scores`
--
ALTER TABLE `assessment_scores`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feature_flags`
--
ALTER TABLE `feature_flags`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `fee_categories`
--
ALTER TABLE `fee_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `fee_structures`
--
ALTER TABLE `fee_structures`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `grading_schemes`
--
ALTER TABLE `grading_schemes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `grading_scheme_components`
--
ALTER TABLE `grading_scheme_components`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `guardian_relationships`
--
ALTER TABLE `guardian_relationships`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_applications`
--
ALTER TABLE `job_applications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_vacancies`
--
ALTER TABLE `job_vacancies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `notification_dispatches`
--
ALTER TABLE `notification_dispatches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `notification_recipients`
--
ALTER TABLE `notification_recipients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `online_payment_transactions`
--
ALTER TABLE `online_payment_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `parent_guardians`
--
ALTER TABLE `parent_guardians`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `payment_allocations`
--
ALTER TABLE `payment_allocations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `payment_gateway_configs`
--
ALTER TABLE `payment_gateway_configs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `platform_settings`
--
ALTER TABLE `platform_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `platform_transactions`
--
ALTER TABLE `platform_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `receipts`
--
ALTER TABLE `receipts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `results`
--
ALTER TABLE `results`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT for table `schools`
--
ALTER TABLE `schools`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=176;

--
-- AUTO_INCREMENT for table `school_classes`
--
ALTER TABLE `school_classes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `school_memberships`
--
ALTER TABLE `school_memberships`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=194;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `student_charges`
--
ALTER TABLE `student_charges`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `student_class_memberships`
--
ALTER TABLE `student_class_memberships`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `student_invoices`
--
ALTER TABLE `student_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `student_session_rollovers`
--
ALTER TABLE `student_session_rollovers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `teacher_assignments`
--
ALTER TABLE `teacher_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `terms`
--
ALTER TABLE `terms`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `term_remarks`
--
ALTER TABLE `term_remarks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `timetables`
--
ALTER TABLE `timetables`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `timetable_entries`
--
ALTER TABLE `timetable_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=223;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=175;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `academic_sessions`
--
ALTER TABLE `academic_sessions`
  ADD CONSTRAINT `academic_sessions_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `admission_applications`
--
ALTER TABLE `admission_applications`
  ADD CONSTRAINT `admission_applications_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_admission_guardian` FOREIGN KEY (`provisioned_guardian_id`) REFERENCES `parent_guardians` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_admission_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_admission_student` FOREIGN KEY (`provisioned_student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `admission_documents`
--
ALTER TABLE `admission_documents`
  ADD CONSTRAINT `admission_documents_admission_application_id_foreign` FOREIGN KEY (`admission_application_id`) REFERENCES `admission_applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admission_documents_document_id_foreign` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_author_id_foreign` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `announcements_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assessment_components`
--
ALTER TABLE `assessment_components`
  ADD CONSTRAINT `fk_assessment_component_assignment` FOREIGN KEY (`teacher_assignment_id`) REFERENCES `teacher_assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_assessment_component_period` FOREIGN KEY (`assessment_period_id`) REFERENCES `assessment_periods` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assessment_periods`
--
ALTER TABLE `assessment_periods`
  ADD CONSTRAINT `fk_assessment_period_scheme` FOREIGN KEY (`grading_scheme_id`) REFERENCES `grading_schemes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_assessment_period_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_assessment_period_session` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_assessment_period_term` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assessment_scores`
--
ALTER TABLE `assessment_scores`
  ADD CONSTRAINT `fk_assessment_score_component` FOREIGN KEY (`assessment_component_id`) REFERENCES `assessment_components` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_assessment_score_recorder` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_assessment_score_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `assignments_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignments_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignments_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignments_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  ADD CONSTRAINT `assignment_submissions_assignment_id_foreign` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignment_submissions_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignment_submissions_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendance_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_attendance_session` FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD CONSTRAINT `fk_attendance_session_academic_session` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_attendance_session_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_attendance_session_term` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_actor_user_id_foreign` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `audit_logs_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `documents_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `fee_categories`
--
ALTER TABLE `fee_categories`
  ADD CONSTRAINT `fee_categories_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `fee_structures`
--
ALTER TABLE `fee_structures`
  ADD CONSTRAINT `fee_structures_fee_category_id_foreign` FOREIGN KEY (`fee_category_id`) REFERENCES `fee_categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fee_structures_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_fee_structure_class` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_fee_structure_session` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_fee_structure_term` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `grading_schemes`
--
ALTER TABLE `grading_schemes`
  ADD CONSTRAINT `grading_schemes_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `grading_scheme_components`
--
ALTER TABLE `grading_scheme_components`
  ADD CONSTRAINT `grading_scheme_components_grading_scheme_id_foreign` FOREIGN KEY (`grading_scheme_id`) REFERENCES `grading_schemes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `guardian_relationships`
--
ALTER TABLE `guardian_relationships`
  ADD CONSTRAINT `guardian_relationships_guardian_id_foreign` FOREIGN KEY (`guardian_id`) REFERENCES `parent_guardians` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `guardian_relationships_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `guardian_relationships_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD CONSTRAINT `job_applications_job_vacancy_id_foreign` FOREIGN KEY (`job_vacancy_id`) REFERENCES `job_vacancies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `job_vacancies`
--
ALTER TABLE `job_vacancies`
  ADD CONSTRAINT `job_vacancies_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_recipients`
--
ALTER TABLE `notification_recipients`
  ADD CONSTRAINT `notification_recipients_notification_id_foreign` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_recipients_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `online_payment_transactions`
--
ALTER TABLE `online_payment_transactions`
  ADD CONSTRAINT `online_payment_transactions_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `online_payment_transactions_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `parent_guardians`
--
ALTER TABLE `parent_guardians`
  ADD CONSTRAINT `parent_guardians_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `parent_guardians_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payment_admission_application` FOREIGN KEY (`admission_application_id`) REFERENCES `admission_applications` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_academic_session_id_foreign` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_term_id_foreign` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payment_allocations`
--
ALTER TABLE `payment_allocations`
  ADD CONSTRAINT `payment_allocations_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_allocations_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_allocations_student_charge_id_foreign` FOREIGN KEY (`student_charge_id`) REFERENCES `student_charges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_gateway_configs`
--
ALTER TABLE `payment_gateway_configs`
  ADD CONSTRAINT `payment_gateway_configs_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `platform_transactions`
--
ALTER TABLE `platform_transactions`
  ADD CONSTRAINT `platform_transactions_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `receipts`
--
ALTER TABLE `receipts`
  ADD CONSTRAINT `receipts_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `receipts_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `results`
--
ALTER TABLE `results`
  ADD CONSTRAINT `fk_results_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_results_published_by` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `results_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `results_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `results_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `results_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `results_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `results_term_id_foreign` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `school_classes`
--
ALTER TABLE `school_classes`
  ADD CONSTRAINT `fk_school_class_teacher` FOREIGN KEY (`class_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `school_classes_academic_session_id_foreign` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `school_classes_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `school_memberships`
--
ALTER TABLE `school_memberships`
  ADD CONSTRAINT `school_memberships_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `school_memberships_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `students_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `student_charges`
--
ALTER TABLE `student_charges`
  ADD CONSTRAINT `fk_student_charge_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `student_invoices` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_charges_academic_session_id_foreign` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_charges_fee_structure_id_foreign` FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_charges_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_charges_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_charges_term_id_foreign` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `student_class_memberships`
--
ALTER TABLE `student_class_memberships`
  ADD CONSTRAINT `student_class_memberships_academic_session_id_foreign` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_class_memberships_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_class_memberships_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_class_memberships_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_invoices`
--
ALTER TABLE `student_invoices`
  ADD CONSTRAINT `fk_student_invoice_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_student_invoice_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_student_invoice_session` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_student_invoice_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_student_invoice_term` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_session_rollovers`
--
ALTER TABLE `student_session_rollovers`
  ADD CONSTRAINT `fk_rollover_destination_session` FOREIGN KEY (`destination_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rollover_new_class` FOREIGN KEY (`new_class_id`) REFERENCES `school_classes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rollover_previous_class` FOREIGN KEY (`previous_class_id`) REFERENCES `school_classes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rollover_processor` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rollover_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rollover_source_session` FOREIGN KEY (`source_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rollover_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `teachers`
--
ALTER TABLE `teachers`
  ADD CONSTRAINT `teachers_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teachers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `teacher_assignments`
--
ALTER TABLE `teacher_assignments`
  ADD CONSTRAINT `teacher_assignments_academic_session_id_foreign` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teacher_assignments_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teacher_assignments_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teacher_assignments_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teacher_assignments_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `terms`
--
ALTER TABLE `terms`
  ADD CONSTRAINT `terms_academic_session_id_foreign` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `terms_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `term_remarks`
--
ALTER TABLE `term_remarks`
  ADD CONSTRAINT `term_remarks_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `term_remarks_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `term_remarks_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `term_remarks_term_id_foreign` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `timetables`
--
ALTER TABLE `timetables`
  ADD CONSTRAINT `fk_timetable_class` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_timetable_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_timetable_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_timetable_session` FOREIGN KEY (`academic_session_id`) REFERENCES `academic_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_timetable_term` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `timetable_entries`
--
ALTER TABLE `timetable_entries`
  ADD CONSTRAINT `fk_timetable_entry_assignment` FOREIGN KEY (`teacher_assignment_id`) REFERENCES `teacher_assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_timetable_entry_timetable` FOREIGN KEY (`timetable_id`) REFERENCES `timetables` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_active_school_id_foreign` FOREIGN KEY (`active_school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
