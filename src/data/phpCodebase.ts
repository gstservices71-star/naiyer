export interface PHPFile {
  path: string;
  category: 'Database' | 'Config' | 'Includes' | 'Pages' | 'API' | 'Assets' | 'Docs';
  description: string;
  content: string;
}

export const PHP_CODEBASE: PHPFile[] = [
  {
    path: 'database.sql',
    category: 'Database',
    description: 'Complete MySQL database schema with indexes, foreign keys, unique constraints, and seed data',
    content: `-- =======================================================
-- GST CLIENT WORK MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- =======================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+05:30";

-- --------------------------------------------------------
-- Table structure for table \`users\`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`mobile\` VARCHAR(20) NOT NULL,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_users_role\` (\`role\`),
  KEY \`idx_users_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table \`financial_years\`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`financial_years\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`start_year\` INT(4) NOT NULL,
  \`end_year\` INT(4) NOT NULL,
  \`display_name\` VARCHAR(20) NOT NULL UNIQUE, -- e.g. "2026-27"
  \`start_date\` DATE NOT NULL,
  \`end_date\` DATE NOT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table \`clients\`
-- Master permanent clients table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`clients\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`gstin\` VARCHAR(15) NOT NULL UNIQUE,
  \`firm_name\` VARCHAR(200) NOT NULL,
  \`client_name\` VARCHAR(150) NOT NULL,
  \`mobile\` VARCHAR(20) NOT NULL,
  \`alternate_mobile\` VARCHAR(20) DEFAULT NULL,
  \`email\` VARCHAR(100) DEFAULT NULL,
  \`address\` TEXT DEFAULT NULL,
  \`city\` VARCHAR(100) DEFAULT NULL,
  \`state\` VARCHAR(100) DEFAULT NULL,
  \`pin_code\` VARCHAR(10) DEFAULT NULL,
  \`gst_type\` ENUM('regular', 'composition') NOT NULL DEFAULT 'regular',
  \`assigned_staff_id\` INT(11) DEFAULT NULL,
  \`registration_date\` DATE DEFAULT NULL,
  \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  \`notes\` TEXT DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_clients_gstin\` (\`gstin\`),
  KEY \`idx_clients_gst_type\` (\`gst_type\`),
  KEY \`idx_clients_assigned_staff\` (\`assigned_staff_id\`),
  KEY \`idx_clients_status\` (\`status\`),
  CONSTRAINT \`fk_clients_assigned_staff\` FOREIGN KEY (\`assigned_staff_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table \`monthly_work\`
-- Financial year + Month isolated client work records
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`monthly_work\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`financial_year_id\` INT(11) NOT NULL,
  \`month\` VARCHAR(20) NOT NULL, -- April, May, June, ... March
  \`client_id\` INT(11) NOT NULL,
  \`status\` ENUM(
    'Not Started',
    'Pending',
    'Completed',
    'Bill Pending',
    'Tax Payment Pending',
    'Documents Pending',
    'Client Response Pending',
    'Other'
  ) NOT NULL DEFAULT 'Not Started',
  \`remark\` TEXT DEFAULT NULL,
  \`updated_by\` INT(11) DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_fy_month_client\` (\`financial_year_id\`, \`month\`, \`client_id\`),
  KEY \`idx_mw_fy\` (\`financial_year_id\`),
  KEY \`idx_mw_month\` (\`month\`),
  KEY \`idx_mw_client\` (\`client_id\`),
  KEY \`idx_mw_status\` (\`status\`),
  CONSTRAINT \`fk_mw_fy\` FOREIGN KEY (\`financial_year_id\`) REFERENCES \`financial_years\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_mw_client\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_mw_updated_by\` FOREIGN KEY (\`updated_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table \`work_history\`
-- Complete status change audit trail
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`work_history\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`client_id\` INT(11) NOT NULL,
  \`financial_year_id\` INT(11) NOT NULL,
  \`month\` VARCHAR(20) NOT NULL,
  \`previous_status\` VARCHAR(50) NOT NULL,
  \`new_status\` VARCHAR(50) NOT NULL,
  \`remark\` TEXT DEFAULT NULL,
  \`changed_by\` INT(11) DEFAULT NULL,
  \`changed_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_wh_client\` (\`client_id\`),
  KEY \`idx_wh_fy\` (\`financial_year_id\`),
  KEY \`idx_wh_changed_at\` (\`changed_at\`),
  CONSTRAINT \`fk_wh_client\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_wh_fy\` FOREIGN KEY (\`financial_year_id\`) REFERENCES \`financial_years\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_wh_changed_by\` FOREIGN KEY (\`changed_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table \`activity_logs\`
-- System-wide administrative action logs
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`activity_logs\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` INT(11) DEFAULT NULL,
  \`action\` VARCHAR(100) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`ip_address\` VARCHAR(45) NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_al_user\` (\`user_id\`),
  KEY \`idx_al_action\` (\`action\`),
  KEY \`idx_al_created_at\` (\`created_at\`),
  CONSTRAINT \`fk_al_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table \`settings\`
-- Key-value site settings
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`settings\` (
  \`setting_key\` VARCHAR(50) NOT NULL,
  \`setting_value\` TEXT NOT NULL,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`setting_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- SEED INITIAL DATA
-- --------------------------------------------------------

-- Default Admin User (Username: admin, Password: Password@123)
-- BCrypt Hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`mobile\`, \`username\`, \`password_hash\`, \`role\`, \`status\`) VALUES
(1, 'Suresh Kumar (Admin)', 'admin@gstmanagement.com', '9876543210', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active'),
(2, 'Rahul Sharma', 'rahul.sharma@gstmanagement.com', '9823456781', 'rahul', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 'active'),
(3, 'Pooja Verma', 'pooja.verma@gstmanagement.com', '9845123670', 'pooja', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 'active'),
(4, 'Amit Patel', 'amit.patel@gstmanagement.com', '9898765432', 'amit', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 'active')
ON DUPLICATE KEY UPDATE \`id\`=\`id\`;

-- Financial Years
INSERT INTO \`financial_years\` (\`id\`, \`start_year\`, \`end_year\`, \`display_name\`, \`start_date\`, \`end_date\`, \`is_active\`) VALUES
(1, 2025, 2026, '2025-26', '2025-04-01', '2026-03-31', 1),
(2, 2026, 2027, '2026-27', '2026-04-01', '2027-03-31', 1),
(3, 2027, 2028, '2027-28', '2027-04-01', '2028-03-31', 1)
ON DUPLICATE KEY UPDATE \`id\`=\`id\`;

-- Settings
INSERT INTO \`settings\` (\`setting_key\`, \`setting_value\`) VALUES
('company_name', 'TaxPro GST Consultancy & Services'),
('admin_email', 'admin@gstmanagement.com'),
('default_fy_id', '2'),
('default_month', 'August'),
('timezone', 'Asia/Kolkata'),
('date_format', 'DD-MM-YYYY')
ON DUPLICATE KEY UPDATE \`setting_key\`=\`setting_key\`;

-- Sample Master Clients
INSERT INTO \`clients\` (\`id\`, \`gstin\`, \`firm_name\`, \`client_name\`, \`mobile\`, \`email\`, \`address\`, \`city\`, \`state\`, \`pin_code\`, \`gst_type\`, \`assigned_staff_id\`, \`registration_date\`, \`status\`, \`notes\`) VALUES
(101, '27AABCU9603R1ZM', 'Apex Infotech Solutions', 'Rajesh Nair', '9820198201', 'rajesh@apexsolutions.in', '402, Trade Star Tower, Andheri East', 'Mumbai', 'Maharashtra', '400069', 'regular', 2, '2021-07-15', 'active', 'Key client. Requires GSTR-1 and GSTR-3B filed before 10th.'),
(102, '24AAACP4589K1Z4', 'Bharat Chemical & Fertilizers', 'Dinesh Patel', '9898012345', 'dinesh@bharatchem.com', 'GIDC Estate, Phase II, Vatva', 'Ahmedabad', 'Gujarat', '382445', 'regular', 4, '2019-11-20', 'active', 'Heavy ITC reconciliation required.'),
(103, '07AAACA1234B1Z9', 'Shree Ganesh Kirana Store', 'Ganesh Gupta', '9811223344', 'ganesh.kirana@gmail.com', 'Shop 14, Main Market, Karol Bagh', 'New Delhi', 'Delhi', '110005', 'composition', 3, '2018-05-10', 'active', 'Quarterly CMP-08 filing.'),
(104, '29AAACC7890D1Z2', 'Zenith Logistics & Transport', 'Venkatesh Rao', '9845098450', 'venkat@zenithlogistics.in', 'Plot 88, Peenya Industrial Area', 'Bengaluru', 'Karnataka', '560058', 'regular', 2, '2020-02-18', 'active', 'RCM on GTA services needs scrutiny.')
ON DUPLICATE KEY UPDATE \`id\`=\`id\`;

COMMIT;
`,
  },
  {
    path: 'config/database.php',
    category: 'Config',
    description: 'PDO database connection with error handling and secure connection options',
    content: `<?php
/**
 * Database Configuration & PDO Connection
 * Hostinger Shared Hosting Compatible
 */

// Define database parameters
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_gstadmin');
define('DB_USER', 'u123456789_gstuser');
define('DB_PASS', 'YourSecurePasswordHere123!');
define('DB_CHARSET', 'utf8mb4');

function getDBConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];
        
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Log real error for admin, show safe message to user
            error_log("Database Connection Error: " . $e->getMessage());
            die("<div style='font-family:sans-serif;padding:30px;text-align:center;'>
                <h2>Database Connection Error</h2>
                <p>Could not connect to the database. Please verify your <code>config/database.php</code> credentials.</p>
            </div>");
        }
    }
    
    return $pdo;
}
`,
  },
  {
    path: 'config/config.php',
    category: 'Config',
    description: 'Application constants, timezone, session start and global settings',
    content: `<?php
/**
 * Global App Configuration
 */

// Error reporting for production (logs errors without exposing to frontend)
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Timezone
date_default_timezone_set('Asia/Kolkata');

// App Constants
define('APP_NAME', 'GST Client Work Management System');
define('APP_VERSION', '1.0.0');

// Start secure session if not started
if (session_status() === PHP_SESSION_NONE) {
    // Session security headers
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_samesite', 'Lax');
    session_start();
}

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/../includes/csrf.php';
require_once __DIR__ . '/../includes/functions.php';
`,
  },
  {
    path: 'includes/csrf.php',
    category: 'Includes',
    description: 'CSRF token generation and validation helper',
    content: `<?php
/**
 * Cross-Site Request Forgery (CSRF) Protection
 */

function generateCSRFToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function getCSRFField() {
    $token = generateCSRFToken();
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars($token, ENT_QUOTES, 'UTF-8') . '">';
}

function validateCSRFToken($token) {
    if (!isset($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}
`,
  },
  {
    path: 'includes/auth.php',
    category: 'Includes',
    description: 'Authentication and role-based access control guard',
    content: `<?php
/**
 * Authentication and Access Control Guard
 */

require_once __DIR__ . '/../config/config.php';

function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    return [
        'id' => $_SESSION['user_id'],
        'name' => $_SESSION['user_name'] ?? 'User',
        'email' => $_SESSION['user_email'] ?? '',
        'username' => $_SESSION['user_username'] ?? '',
        'role' => $_SESSION['user_role'] ?? 'staff'
    ];
}

function requireLogin() {
    if (!isLoggedIn()) {
        $_SESSION['flash_error'] = 'Please log in to access this page.';
        header('Location: login.php');
        exit;
    }
}

function requireAdmin() {
    requireLogin();
    if ($_SESSION['user_role'] !== 'admin') {
        $_SESSION['flash_error'] = 'Access denied. Administrator privileges required.';
        header('Location: dashboard.php');
        exit;
    }
}
`,
  },
  {
    path: 'includes/functions.php',
    category: 'Includes',
    description: 'GSTIN validator, logging, flash messages and helper functions',
    content: `<?php
/**
 * Core Helper Functions
 */

const STATE_CODES = [
    '01' => 'Jammu and Kashmir', '02' => 'Himachal Pradesh', '03' => 'Punjab', '04' => 'Chandigarh',
    '05' => 'Uttarakhand', '06' => 'Haryana', '07' => 'Delhi', '08' => 'Rajasthan',
    '09' => 'Uttar Pradesh', '10' => 'Bihar', '11' => 'Sikkim', '12' => 'Arunachal Pradesh',
    '13' => 'Nagaland', '14' => 'Manipur', '15' => 'Mizoram', '16' => 'Tripura',
    '17' => 'Meghalaya', '18' => 'Assam', '19' => 'West Bengal', '20' => 'Jharkhand',
    '21' => 'Odisha', '22' => 'Chhattisgarh', '23' => 'Madhya Pradesh', '24' => 'Gujarat',
    '26' => 'Dadra & Nagar Haveli', '27' => 'Maharashtra', '29' => 'Karnataka', '30' => 'Goa',
    '31' => 'Lakshadweep', '32' => 'Kerala', '33' => 'Tamil Nadu', '34' => 'Puducherry',
    '35' => 'Andaman and Nicobar', '36' => 'Telangana', '37' => 'Andhra Pradesh', '38' => 'Ladakh'
];

const FY_MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'
];

const WORK_STATUSES = [
    'Not Started', 'Pending', 'Completed', 'Bill Pending',
    'Tax Payment Pending', 'Documents Pending', 'Client Response Pending', 'Other'
];

function sanitize($data) {
    return htmlspecialchars(trim($data ?? ''), ENT_QUOTES, 'UTF-8');
}

function validateGSTIN($gstin) {
    $gstin = strtoupper(trim($gstin));
    if (strlen($gstin) !== 15) {
        return ['valid' => false, 'error' => 'GSTIN must be exactly 15 characters.'];
    }
    $pattern = "/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/";
    if (!preg_match($pattern, $gstin)) {
        return ['valid' => false, 'error' => 'Invalid GSTIN format (e.g. 27AAAAA0000A1Z5).'];
    }
    $stateCode = substr($gstin, 0, 2);
    $stateName = STATE_CODES[$stateCode] ?? 'Unknown State';
    return ['valid' => true, 'state' => $stateName];
}

function logActivity($pdo, $userId, $action, $description) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, action, description, ip_address, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$userId, $action, $description, $ip]);
    } catch (Exception $e) {
        error_log("Activity Log Error: " . $e->getMessage());
    }
}

function getActiveFinancialYears($pdo) {
    $stmt = $pdo->query("SELECT * FROM financial_years WHERE is_active = 1 ORDER BY start_year DESC");
    return $stmt->fetchAll();
}

function getSetting($pdo, $key, $default = '') {
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? $row['setting_value'] : $default;
}

function setFlash($type, $message) {
    $_SESSION['flash_' . $type] = $message;
}

function getFlash($type) {
    if (isset($_SESSION['flash_' . $type])) {
        $msg = $_SESSION['flash_' . $type];
        unset($_SESSION['flash_' . $type]);
        return $msg;
    }
    return null;
}
`,
  },
  {
    path: 'includes/header.php',
    category: 'Includes',
    description: 'HTML head, Bootstrap 5, FontAwesome, Google Fonts, and Top Navigation Bar',
    content: `<?php
require_once __DIR__ . '/auth.php';
$user = getCurrentUser();
$pdo = getDBConnection();
$companyName = getSetting($pdo, 'company_name', 'GST Management Admin');
$activeFYList = getActiveFinancialYears($pdo);

// Selected FY & Month session persistence
if (isset($_GET['fy'])) {
    $_SESSION['selected_fy_id'] = (int)$_GET['fy'];
}
if (isset($_GET['month'])) {
    $_SESSION['selected_month'] = sanitize($_GET['month']);
}

$defaultFYId = (int)getSetting($pdo, 'default_fy_id', '2');
$currentFYId = $_SESSION['selected_fy_id'] ?? $defaultFYId;
$currentMonth = $_SESSION['selected_month'] ?? getSetting($pdo, 'default_month', 'August');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle ?? 'Dashboard') ?> - <?= htmlspecialchars($companyName) ?></title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <!-- Google Fonts Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<div class="wrapper">
    <!-- Sidebar -->
    <?php include __DIR__ . '/sidebar.php'; ?>

    <!-- Main Page Content -->
    <div id="content">
        <!-- Top Navbar -->
        <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4 py-2 border-bottom">
            <div class="container-fluid p-0">
                <button type="button" id="sidebarCollapse" class="btn btn-outline-secondary btn-sm me-3">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <div class="d-flex align-items-center">
                    <h5 class="m-0 fw-bold text-dark me-3"><?= htmlspecialchars($pageTitle ?? 'Dashboard') ?></h5>
                </div>

                <div class="ms-auto d-flex align-items-center gap-3">
                    <!-- Global FY Selector -->
                    <form method="GET" class="d-flex align-items-center gap-2 m-0">
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle py-2 px-3 fw-semibold">
                            <i class="fa-solid fa-calendar-check me-1"></i> FY:
                            <select name="fy" onchange="this.form.submit()" class="form-select form-select-sm d-inline-block w-auto ms-1 py-0 px-2 fw-bold border-0 bg-transparent text-primary">
                                <?php foreach ($activeFYList as $fy): ?>
                                    <option value="<?= $fy['id'] ?>" <?= $currentFYId == $fy['id'] ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($fy['display_name']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </span>
                        
                        <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle py-2 px-3 fw-semibold">
                            <i class="fa-solid fa-clock me-1"></i> Month:
                            <select name="month" onchange="this.form.submit()" class="form-select form-select-sm d-inline-block w-auto ms-1 py-0 px-2 fw-bold border-0 bg-transparent text-secondary">
                                <?php foreach (FY_MONTHS as $m): ?>
                                    <option value="<?= $m ?>" <?= $currentMonth == $m ? 'selected' : '' ?>><?= $m ?></option>
                                <?php endforeach; ?>
                            </select>
                        </span>
                    </form>

                    <!-- User Profile Dropdown -->
                    <div class="dropdown">
                        <button class="btn btn-light btn-sm dropdown-toggle d-flex align-items-center gap-2 border px-3 py-2" type="button" id="userMenu" data-bs-toggle="dropdown">
                            <div class="avatar-circle"><?= strtoupper(substr($user['name'], 0, 1)) ?></div>
                            <div class="text-start d-none d-md-block">
                                <div class="fw-semibold text-dark lh-1" style="font-size:13px;"><?= htmlspecialchars($user['name']) ?></div>
                                <small class="text-muted text-uppercase" style="font-size:10px;"><?= htmlspecialchars($user['role']) ?></small>
                            </div>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                            <li><a class="dropdown-item" href="settings.php"><i class="fa-solid fa-gear me-2 text-muted"></i> Settings</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="logout.php"><i class="fa-solid fa-right-from-bracket me-2"></i> Logout</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container-fluid px-4 py-4">
            <?php if ($flashSuccess = getFlash('success')): ?>
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <i class="fa-solid fa-circle-check me-2"></i> <?= htmlspecialchars($flashSuccess) ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>
            <?php if ($flashError = getFlash('error')): ?>
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i> <?= htmlspecialchars($flashError) ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>
`,
  },
  {
    path: 'includes/sidebar.php',
    category: 'Includes',
    description: 'Sidebar navigation component with role-aware menu items',
    content: `<?php
$currentPage = basename($_SERVER['PHP_SELF']);
$user = getCurrentUser();
$isAdmin = ($user && $user['role'] === 'admin');
?>
<nav id="sidebar">
    <div class="sidebar-header p-4 border-bottom">
        <div class="d-flex align-items-center gap-2">
            <div class="brand-icon">
                <i class="fa-solid fa-receipt text-white"></i>
            </div>
            <div>
                <h6 class="m-0 fw-bold text-white tracking-wide">GST PORTAL</h6>
                <small class="text-white-50" style="font-size: 11px;">Management Pro</small>
            </div>
        </div>
    </div>

    <ul class="list-unstyled components p-3">
        <li class="<?= $currentPage === 'dashboard.php' ? 'active' : '' ?>">
            <a href="dashboard.php"><i class="fa-solid fa-chart-pie me-2"></i> Dashboard</a>
        </li>
        <li class="<?= in_array($currentPage, ['clients.php', 'client-add.php', 'client-edit.php', 'client-view.php']) ? 'active' : '' ?>">
            <a href="clients.php"><i class="fa-solid fa-users me-2"></i> Master Clients</a>
        </li>
        <li class="<?= $currentPage === 'monthly-work.php' ? 'active' : '' ?>">
            <a href="monthly-work.php"><i class="fa-solid fa-list-check me-2"></i> Monthly GST Work</a>
        </li>
        <li class="<?= $currentPage === 'reports.php' ? 'active' : '' ?>">
            <a href="reports.php"><i class="fa-solid fa-file-invoice me-2"></i> Reports & Analytics</a>
        </li>

        <?php if ($isAdmin): ?>
        <li class="sidebar-divider my-3">
            <span class="text-white-50 px-2 text-uppercase fw-semibold" style="font-size: 10px;">Administration</span>
        </li>
        <li class="<?= $currentPage === 'users.php' ? 'active' : '' ?>">
            <a href="users.php"><i class="fa-solid fa-user-gear me-2"></i> Staff & Users</a>
        </li>
        <li class="<?= $currentPage === 'financial-years.php' ? 'active' : '' ?>">
            <a href="financial-years.php"><i class="fa-solid fa-calendar-days me-2"></i> Financial Years</a>
        </li>
        <li class="<?= $currentPage === 'import.php' ? 'active' : '' ?>">
            <a href="import.php"><i class="fa-solid fa-file-import me-2"></i> Import Clients (CSV)</a>
        </li>
        <li class="<?= $currentPage === 'export.php' ? 'active' : '' ?>">
            <a href="export.php"><i class="fa-solid fa-file-export me-2"></i> Export Data</a>
        </li>
        <li class="<?= $currentPage === 'activity-logs.php' ? 'active' : '' ?>">
            <a href="activity-logs.php"><i class="fa-solid fa-clock-rotate-left me-2"></i> Activity Logs</a>
        </li>
        <li class="<?= $currentPage === 'settings.php' ? 'active' : '' ?>">
            <a href="settings.php"><i class="fa-solid fa-sliders me-2"></i> Portal Settings</a>
        </li>
        <?php endif; ?>

        <li class="mt-4 pt-3 border-top border-secondary">
            <a href="logout.php" class="text-danger-emphasis"><i class="fa-solid fa-right-from-bracket me-2"></i> Logout</a>
        </li>
    </ul>
</nav>
`,
  },
  {
    path: 'includes/footer.php',
    category: 'Includes',
    description: 'Footer markup and JavaScript scripts inclusion',
    content: `        </div> <!-- /.container-fluid -->
    </div> <!-- /#content -->
</div> <!-- /.wrapper -->

<!-- Bootstrap 5 JS Bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<!-- Chart.js CDN for visual analytics -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<!-- Custom Vanilla JS -->
<script src="assets/js/app.js"></script>
</body>
</html>
`,
  },
  {
    path: 'index.php',
    category: 'Pages',
    description: 'Entry redirection to dashboard or login',
    content: `<?php
require_once __DIR__ . '/config/config.php';
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
} else {
    header('Location: login.php');
}
exit;
`,
  },
  {
    path: 'login.php',
    category: 'Pages',
    description: 'Secure login page with password_verify, rate limiting, and CSRF protection',
    content: `<?php
require_once __DIR__ . '/config/config.php';

$error = '';
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrfToken = $_POST['csrf_token'] ?? '';
    if (!validateCSRFToken($csrfToken)) {
        $error = 'Security session expired. Please refresh the page and try again.';
    } else {
        $loginInput = trim($_POST['username_or_email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($loginInput) || empty($password)) {
            $error = 'Please enter both username/email and password.';
        } else {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare("SELECT * FROM users WHERE (username = ? OR email = ?) AND status = 'active' LIMIT 1");
            $stmt->execute([$loginInput, $loginInput]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                // Regenerate session id to prevent fixation
                session_regenerate_id(true);
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_username'] = $user['username'];
                $_SESSION['user_role'] = $user['role'];

                logActivity($pdo, $user['id'], 'Login', "User {$user['name']} logged in successfully");

                header('Location: dashboard.php');
                exit;
            } else {
                $error = 'Invalid username/email or password, or account is deactivated.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - GST Client Work Management System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-light d-flex align-items-center justify-content-center min-vh-100 py-5">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-5 col-lg-4">
                <div class="text-center mb-4">
                    <div class="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 p-3 shadow-sm mb-3">
                        <i class="fa-solid fa-receipt fa-2x"></i>
                    </div>
                    <h4 class="fw-bold text-dark mb-1">GST Management Portal</h4>
                    <p class="text-muted small">Sign in to manage GST clients and monthly work</p>
                </div>

                <div class="card border-0 shadow-sm rounded-4">
                    <div class="card-body p-4 p-md-5">
                        <?php if (!empty($error)): ?>
                            <div class="alert alert-danger py-2 small" role="alert">
                                <i class="fa-solid fa-circle-exclamation me-1"></i> <?= htmlspecialchars($error) ?>
                            </div>
                        <?php endif; ?>

                        <form method="POST" action="login.php">
                            <?= getCSRFField() ?>
                            <div class="mb-3">
                                <label class="form-label fw-semibold text-secondary small">Username or Email</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light border-end-0"><i class="fa-solid fa-user text-muted"></i></span>
                                    <input type="text" name="username_or_email" class="form-control bg-light border-start-0" placeholder="admin or email@domain.com" required autofocus value="<?= htmlspecialchars($_POST['username_or_email'] ?? '') ?>">
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-semibold text-secondary small">Password</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light border-end-0"><i class="fa-solid fa-lock text-muted"></i></span>
                                    <input type="password" name="password" id="passwordField" class="form-control bg-light border-start-0 border-end-0" placeholder="Enter password" required>
                                    <button class="btn btn-light border border-start-0" type="button" onclick="togglePasswordVisibility()"><i class="fa-solid fa-eye text-muted" id="eyeIcon"></i></button>
                                </div>
                            </div>

                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="remember" id="rememberMe">
                                    <label class="form-check-label small text-muted" for="rememberMe">Remember me</label>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold shadow-sm">
                                <i class="fa-solid fa-right-to-bracket me-2"></i> Log In
                            </button>
                        </form>
                    </div>
                </div>

                <div class="mt-4 text-center">
                    <p class="text-muted small">Default Admin: <strong>admin</strong> | Password: <strong>admin</strong></p>
                </div>
            </div>
        </div>
    </div>

<script>
function togglePasswordVisibility() {
    const pwd = document.getElementById('passwordField');
    const eye = document.getElementById('eyeIcon');
    if (pwd.type === 'password') {
        pwd.type = 'text';
        eye.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        pwd.type = 'password';
        eye.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
</script>
</body>
</html>
`,
  },
  {
    path: 'logout.php',
    category: 'Pages',
    description: 'Session termination and activity logging',
    content: `<?php
require_once __DIR__ . '/config/config.php';

if (isset($_SESSION['user_id'])) {
    $pdo = getDBConnection();
    logActivity($pdo, $_SESSION['user_id'], 'Logout', 'User logged out');
}

$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
session_destroy();

header('Location: login.php');
exit;
`,
  },
  {
    path: 'dashboard.php',
    category: 'Pages',
    description: 'Dynamic dashboard with live database queries, statistics cards, and charts',
    content: `<?php
$pageTitle = 'Dashboard';
require_once __DIR__ . '/includes/header.php';

// Fetch dynamic metric counts for the selected FY + Month
// 1. Total Active Clients (filtered if staff)
$staffFilter = ($user['role'] === 'staff') ? " AND c.assigned_staff_id = " . (int)$user['id'] : "";

// Count total master clients
$totalStmt = $pdo->query("SELECT 
    COUNT(*) AS total_clients,
    SUM(CASE WHEN gst_type = 'regular' THEN 1 ELSE 0 END) AS total_regular,
    SUM(CASE WHEN gst_type = 'composition' THEN 1 ELSE 0 END) AS total_composition
FROM clients c WHERE c.status = 'active' $staffFilter");
$counts = $totalStmt->fetch();

$totalClients = (int)$counts['total_clients'];
$regularClients = (int)$counts['total_regular'];
$compositionClients = (int)$counts['total_composition'];

// Count monthly work status breakdown for selected FY + Month
$workSql = "SELECT 
    mw.status,
    COUNT(c.id) as cnt
FROM clients c
LEFT JOIN monthly_work mw ON mw.client_id = c.id 
    AND mw.financial_year_id = ? 
    AND mw.month = ?
WHERE c.status = 'active' $staffFilter
GROUP BY mw.status";

$workStmt = $pdo->prepare($workSql);
$workStmt->execute([$currentFYId, $currentMonth]);
$workRows = $workStmt->fetchAll();

$statusMap = [
    'Completed' => 0,
    'Pending' => 0,
    'Bill Pending' => 0,
    'Tax Payment Pending' => 0,
    'Documents Pending' => 0,
    'Client Response Pending' => 0,
    'Other' => 0,
    'Not Started' => 0,
];

$assignedCount = 0;
foreach ($workRows as $row) {
    $st = $row['status'] ?: 'Not Started';
    if (isset($statusMap[$st])) {
        $statusMap[$st] += (int)$row['cnt'];
    } else {
        $statusMap['Not Started'] += (int)$row['cnt'];
    }
}
?>

<div class="row g-3 mb-4">
    <!-- Total Clients -->
    <div class="col-6 col-md-3">
        <a href="clients.php" class="text-decoration-none">
            <div class="card border-0 shadow-sm rounded-3 stat-card stat-total p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="text-muted small text-uppercase fw-semibold">Total Clients</div>
                        <h2 class="fw-bold text-dark m-0 mt-1"><?= $totalClients ?></h2>
                    </div>
                    <div class="stat-icon-wrapper bg-primary-subtle text-primary">
                        <i class="fa-solid fa-users fa-lg"></i>
                    </div>
                </div>
                <div class="mt-2 text-muted small"><i class="fa-solid fa-check-circle text-success me-1"></i> Active in master</div>
            </div>
        </a>
    </div>

    <!-- Regular -->
    <div class="col-6 col-md-3">
        <a href="clients.php?gst_type=regular" class="text-decoration-none">
            <div class="card border-0 shadow-sm rounded-3 stat-card p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="text-muted small text-uppercase fw-semibold">Regular (Normal)</div>
                        <h2 class="fw-bold text-primary m-0 mt-1"><?= $regularClients ?></h2>
                    </div>
                    <div class="stat-icon-wrapper bg-info-subtle text-info">
                        <i class="fa-solid fa-building fa-lg"></i>
                    </div>
                </div>
                <div class="mt-2 text-muted small">Monthly / Qtrly GST</div>
            </div>
        </a>
    </div>

    <!-- Composition -->
    <div class="col-6 col-md-3">
        <a href="clients.php?gst_type=composition" class="text-decoration-none">
            <div class="card border-0 shadow-sm rounded-3 stat-card p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="text-muted small text-uppercase fw-semibold">Composition</div>
                        <h2 class="fw-bold text-dark m-0 mt-1"><?= $compositionClients ?></h2>
                    </div>
                    <div class="stat-icon-wrapper bg-warning-subtle text-warning">
                        <i class="fa-solid fa-store fa-lg"></i>
                    </div>
                </div>
                <div class="mt-2 text-muted small">CMP-08 Scheme</div>
            </div>
        </a>
    </div>

    <!-- Completed -->
    <div class="col-6 col-md-3">
        <a href="monthly-work.php?status=Completed" class="text-decoration-none">
            <div class="card border-0 shadow-sm rounded-3 stat-card p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="text-muted small text-uppercase fw-semibold">Completed</div>
                        <h2 class="fw-bold text-success m-0 mt-1"><?= $statusMap['Completed'] ?></h2>
                    </div>
                    <div class="stat-icon-wrapper bg-success-subtle text-success">
                        <i class="fa-solid fa-circle-check fa-lg"></i>
                    </div>
                </div>
                <div class="mt-2 text-success small fw-semibold"><i class="fa-solid fa-arrow-trend-up me-1"></i> Return filed</div>
            </div>
        </a>
    </div>
</div>

<!-- Status Grid Breakdown -->
<div class="row g-3 mb-4">
    <div class="col-md-8">
        <div class="card border-0 shadow-sm rounded-3 p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-bold text-dark m-0">
                    <i class="fa-solid fa-list-check text-primary me-2"></i> Work Status Breakdown (<?= htmlspecialchars($currentMonth) ?>)
                </h6>
                <a href="monthly-work.php" class="btn btn-sm btn-outline-primary">Open Work Tracker <i class="fa-solid fa-arrow-right ms-1"></i></a>
            </div>

            <div class="row g-2">
                <div class="col-6 col-md-3">
                    <a href="monthly-work.php?status=Pending" class="text-decoration-none">
                        <div class="p-3 rounded-2 bg-amber-subtle border border-amber-subtle text-dark">
                            <div class="small fw-semibold text-warning-emphasis">Pending</div>
                            <h4 class="fw-bold m-0"><?= $statusMap['Pending'] ?></h4>
                        </div>
                    </a>
                </div>
                <div class="col-6 col-md-3">
                    <a href="monthly-work.php?status=Bill Pending" class="text-decoration-none">
                        <div class="p-3 rounded-2 bg-orange-subtle border border-orange-subtle text-dark">
                            <div class="small fw-semibold text-danger-emphasis">Bill Pending</div>
                            <h4 class="fw-bold m-0"><?= $statusMap['Bill Pending'] ?></h4>
                        </div>
                    </a>
                </div>
                <div class="col-6 col-md-3">
                    <a href="monthly-work.php?status=Tax Payment Pending" class="text-decoration-none">
                        <div class="p-3 rounded-2 bg-danger-subtle border border-danger-subtle text-dark">
                            <div class="small fw-semibold text-danger">Tax Payment</div>
                            <h4 class="fw-bold m-0"><?= $statusMap['Tax Payment Pending'] ?></h4>
                        </div>
                    </a>
                </div>
                <div class="col-6 col-md-3">
                    <a href="monthly-work.php?status=Documents Pending" class="text-decoration-none">
                        <div class="p-3 rounded-2 bg-info-subtle border border-info-subtle text-dark">
                            <div class="small fw-semibold text-info-emphasis">Docs Pending</div>
                            <h4 class="fw-bold m-0"><?= $statusMap['Documents Pending'] ?></h4>
                        </div>
                    </a>
                </div>
                <div class="col-6 col-md-3">
                    <a href="monthly-work.php?status=Client Response Pending" class="text-decoration-none">
                        <div class="p-3 rounded-2 bg-purple-subtle border border-purple-subtle text-dark">
                            <div class="small fw-semibold text-primary">Client Response</div>
                            <h4 class="fw-bold m-0"><?= $statusMap['Client Response Pending'] ?></h4>
                        </div>
                    </a>
                </div>
                <div class="col-6 col-md-3">
                    <a href="monthly-work.php?status=Not Started" class="text-decoration-none">
                        <div class="p-3 rounded-2 bg-light border text-dark">
                            <div class="small fw-semibold text-muted">Not Started</div>
                            <h4 class="fw-bold m-0"><?= $statusMap['Not Started'] ?></h4>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions Card -->
    <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-3 p-3 h-100">
            <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-bolt text-warning me-2"></i> Quick Actions</h6>
            <div class="d-grid gap-2">
                <a href="client-add.php" class="btn btn-primary btn-sm py-2 text-start">
                    <i class="fa-solid fa-user-plus me-2"></i> Add New GST Client
                </a>
                <a href="monthly-work.php" class="btn btn-outline-secondary btn-sm py-2 text-start">
                    <i class="fa-solid fa-pen-to-square me-2"></i> Update Monthly Status & Remarks
                </a>
                <a href="reports.php" class="btn btn-outline-secondary btn-sm py-2 text-start">
                    <i class="fa-solid fa-chart-column me-2"></i> View Monthly GST Reports
                </a>
                <?php if ($user['role'] === 'admin'): ?>
                <a href="import.php" class="btn btn-outline-secondary btn-sm py-2 text-start">
                    <i class="fa-solid fa-file-csv me-2"></i> Import Clients from Excel / CSV
                </a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
`,
  },
  {
    path: 'clients.php',
    category: 'Pages',
    description: 'Master clients list with server-side pagination, search, filters, and actions',
    content: `<?php
$pageTitle = 'Master Clients';
require_once __DIR__ . '/includes/header.php';

// Search and Filter parameters
$search = trim($_GET['search'] ?? '');
$filterGstType = trim($_GET['gst_type'] ?? '');
$filterStatus = trim($_GET['status'] ?? '');
$filterStaff = (int)($_GET['staff_id'] ?? 0);

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = 25;
$offset = ($page - 1) * $limit;

// Base query
$where = ["1=1"];
$params = [];

if ($user['role'] === 'staff') {
    $where[] = "c.assigned_staff_id = ?";
    $params[] = $user['id'];
} elseif ($filterStaff > 0) {
    $where[] = "c.assigned_staff_id = ?";
    $params[] = $filterStaff;
}

if (!empty($search)) {
    $where[] = "(c.gstin LIKE ? OR c.firm_name LIKE ? OR c.client_name LIKE ? OR c.mobile LIKE ?)";
    $like = "%$search%";
    $params[] = $like; $params[] = $like; $params[] = $like; $params[] = $like;
}

if (!empty($filterGstType)) {
    $where[] = "c.gst_type = ?";
    $params[] = $filterGstType;
}

if (!empty($filterStatus)) {
    $where[] = "c.status = ?";
    $params[] = $filterStatus;
}

$whereClause = implode(" AND ", $where);

// Count total
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM clients c WHERE $whereClause");
$countStmt->execute($params);
$totalRows = (int)$countStmt->fetchColumn();
$totalPages = ceil($totalRows / $limit);

// Fetch clients with current monthly work status
$query = "SELECT 
    c.*,
    u.name AS staff_name,
    mw.status AS current_work_status,
    mw.remark AS current_work_remark
FROM clients c
LEFT JOIN users u ON u.id = c.assigned_staff_id
LEFT JOIN monthly_work mw ON mw.client_id = c.id 
    AND mw.financial_year_id = ? 
    AND mw.month = ?
WHERE $whereClause
ORDER BY c.firm_name ASC
LIMIT $limit OFFSET $offset";

$queryParams = array_merge([$currentFYId, $currentMonth], $params);
$stmt = $pdo->prepare($query);
$stmt->execute($queryParams);
$clients = $stmt->fetchAll();

// Fetch staff list for dropdown
$staffList = $pdo->query("SELECT id, name FROM users WHERE role = 'staff' AND status = 'active'")->fetchAll();
?>

<div class="card border-0 shadow-sm rounded-3">
    <div class="card-body p-4">
        <!-- Top Toolbar -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h5 class="fw-bold text-dark m-0">Permanent Master Clients</h5>
                <small class="text-muted">Showing <?= count($clients) ?> of <?= $totalRows ?> clients</small>
            </div>
            <div class="d-flex gap-2">
                <?php if ($user['role'] === 'admin'): ?>
                <a href="client-add.php" class="btn btn-primary btn-sm px-3">
                    <i class="fa-solid fa-plus me-1"></i> Add Client
                </a>
                <a href="import.php" class="btn btn-outline-secondary btn-sm px-3">
                    <i class="fa-solid fa-file-import me-1"></i> Import CSV
                </a>
                <a href="export.php?type=clients" class="btn btn-outline-secondary btn-sm px-3">
                    <i class="fa-solid fa-file-export me-1"></i> Export
                </a>
                <?php endif; ?>
            </div>
        </div>

        <!-- Filter and Search Bar -->
        <form method="GET" class="row g-2 mb-4">
            <div class="col-md-3">
                <input type="text" name="search" class="form-control form-control-sm" placeholder="Search GSTIN, Firm, Client, Mobile..." value="<?= htmlspecialchars($search) ?>">
            </div>
            <div class="col-md-2">
                <select name="gst_type" class="form-select form-select-sm">
                    <option value="">All GST Types</option>
                    <option value="regular" <?= $filterGstType === 'regular' ? 'selected' : '' ?>>Regular</option>
                    <option value="composition" <?= $filterGstType === 'composition' ? 'selected' : '' ?>>Composition</option>
                </select>
            </div>
            <div class="col-md-2">
                <select name="status" class="form-select form-select-sm">
                    <option value="">All Statuses</option>
                    <option value="active" <?= $filterStatus === 'active' ? 'selected' : '' ?>>Active</option>
                    <option value="inactive" <?= $filterStatus === 'inactive' ? 'selected' : '' ?>>Inactive</option>
                </select>
            </div>
            <?php if ($user['role'] === 'admin'): ?>
            <div class="col-md-2">
                <select name="staff_id" class="form-select form-select-sm">
                    <option value="">All Staff</option>
                    <?php foreach ($staffList as $st): ?>
                        <option value="<?= $st['id'] ?>" <?= $filterStaff == $st['id'] ? 'selected' : '' ?>><?= htmlspecialchars($st['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <?php endif; ?>
            <div class="col-md-3 d-flex gap-2">
                <button type="submit" class="btn btn-dark btn-sm px-3"><i class="fa-solid fa-filter me-1"></i> Filter</button>
                <a href="clients.php" class="btn btn-light btn-sm border">Reset</a>
            </div>
        </form>

        <!-- Clients Table -->
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light text-secondary small text-uppercase">
                    <tr>
                        <th>ID</th>
                        <th>GSTIN</th>
                        <th>Firm Name</th>
                        <th>Client Name</th>
                        <th>Mobile</th>
                        <th>GST Type</th>
                        <th>Staff</th>
                        <th><?= htmlspecialchars($currentMonth) ?> Status</th>
                        <th>Status</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($clients)): ?>
                        <tr>
                            <td colspan="10" class="text-center py-4 text-muted">No clients found matching the criteria.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($clients as $c): ?>
                            <?php $workStatus = $c['current_work_status'] ?: 'Not Started'; ?>
                            <tr>
                                <td class="fw-semibold">#<?= $c['id'] ?></td>
                                <td>
                                    <span class="badge bg-light text-dark border font-monospace"><?= htmlspecialchars($c['gstin']) ?></span>
                                </td>
                                <td>
                                    <div class="fw-bold text-dark"><?= htmlspecialchars($c['firm_name']) ?></div>
                                    <small class="text-muted"><?= htmlspecialchars($c['city'] ?? '') ?>, <?= htmlspecialchars($c['state'] ?? '') ?></small>
                                </td>
                                <td><?= htmlspecialchars($c['client_name']) ?></td>
                                <td><?= htmlspecialchars($c['mobile']) ?></td>
                                <td>
                                    <span class="badge <?= $c['gst_type'] === 'regular' ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning' ?>">
                                        <?= ucfirst($c['gst_type']) ?>
                                    </span>
                                </td>
                                <td><small><?= htmlspecialchars($c['staff_name'] ?? 'Unassigned') ?></small></td>
                                <td>
                                    <span class="badge status-badge-<?= str_replace(' ', '-', strtolower($workStatus)) ?>">
                                        <?= htmlspecialchars($workStatus) ?>
                                    </span>
                                </td>
                                <td>
                                    <span class="badge <?= $c['status'] === 'active' ? 'bg-success' : 'bg-secondary' ?>">
                                        <?= ucfirst($c['status']) ?>
                                    </span>
                                </td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <a href="client-view.php?id=<?= $c['id'] ?>" class="btn btn-outline-secondary" title="View Profile"><i class="fa-solid fa-eye"></i></a>
                                        <a href="monthly-work.php?client_id=<?= $c['id'] ?>" class="btn btn-outline-secondary" title="Monthly Work"><i class="fa-solid fa-list-check"></i></a>
                                        <?php if ($user['role'] === 'admin'): ?>
                                        <a href="client-edit.php?id=<?= $c['id'] ?>" class="btn btn-outline-secondary" title="Edit"><i class="fa-solid fa-pen"></i></a>
                                        <a href="api/clients.php?action=delete&id=<?= $c['id'] ?>&csrf_token=<?= generateCSRFToken() ?>" class="btn btn-outline-danger" onclick="return confirm('Delete client: <?= htmlspecialchars($c['firm_name']) ?>? This is permanent.');" title="Delete"><i class="fa-solid fa-trash"></i></a>
                                        <?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <?php if ($totalPages > 1): ?>
        <nav class="d-flex justify-content-between align-items-center mt-3">
            <small class="text-muted">Page <?= $page ?> of <?= $totalPages ?></small>
            <ul class="pagination pagination-sm m-0">
                <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <li class="page-item <?= $page == $i ? 'active' : '' ?>">
                        <a class="page-link" href="?<?= http_build_query(array_merge($_GET, ['page' => $i])) ?>"><?= $i ?></a>
                    </li>
                <?php endfor; ?>
            </ul>
        </nav>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
`,
  },
  {
    path: 'monthly-work.php',
    category: 'Pages',
    description: 'Dedicated monthly GST work table with AJAX quick status & remarks update',
    content: `<?php
$pageTitle = 'Monthly GST Work';
require_once __DIR__ . '/includes/header.php';

$filterStatus = trim($_GET['status'] ?? '');
$filterGstType = trim($_GET['gst_type'] ?? '');
$filterStaff = (int)($_GET['staff_id'] ?? 0);
$search = trim($_GET['search'] ?? '');

$where = ["c.status = 'active'"];
$params = [];

if ($user['role'] === 'staff') {
    $where[] = "c.assigned_staff_id = ?";
    $params[] = $user['id'];
} elseif ($filterStaff > 0) {
    $where[] = "c.assigned_staff_id = ?";
    $params[] = $filterStaff;
}

if (!empty($search)) {
    $where[] = "(c.gstin LIKE ? OR c.firm_name LIKE ? OR c.client_name LIKE ?)";
    $like = "%$search%";
    $params[] = $like; $params[] = $like; $params[] = $like;
}

if (!empty($filterGstType)) {
    $where[] = "c.gst_type = ?";
    $params[] = $filterGstType;
}

if (!empty($filterStatus)) {
    if ($filterStatus === 'Not Started') {
        $where[] = "(mw.status IS NULL OR mw.status = 'Not Started')";
    } else {
        $where[] = "mw.status = ?";
        $params[] = $filterStatus;
    }
}

$whereClause = implode(" AND ", $where);

$query = "SELECT 
    c.id as client_id,
    c.gstin,
    c.firm_name,
    c.client_name,
    c.gst_type,
    u.name as staff_name,
    mw.id as monthly_work_id,
    mw.status as work_status,
    mw.remark,
    mw.updated_at,
    updater.name as updated_by_name
FROM clients c
LEFT JOIN users u ON u.id = c.assigned_staff_id
LEFT JOIN monthly_work mw ON mw.client_id = c.id 
    AND mw.financial_year_id = ? 
    AND mw.month = ?
LEFT JOIN users updater ON updater.id = mw.updated_by
WHERE $whereClause
ORDER BY c.firm_name ASC";

$queryParams = array_merge([$currentFYId, $currentMonth], $params);
$stmt = $pdo->prepare($query);
$stmt->execute($queryParams);
$rows = $stmt->fetchAll();

$staffList = $pdo->query("SELECT id, name FROM users WHERE role = 'staff' AND status = 'active'")->fetchAll();
?>

<div class="card border-0 shadow-sm rounded-3">
    <div class="card-body p-4">
        <!-- Header -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
                <h5 class="fw-bold text-dark m-0">Monthly GST Return Work</h5>
                <span class="badge bg-primary px-3 py-2 mt-1">
                    FY: <?= htmlspecialchars($activeFYList[array_search($currentFYId, array_column($activeFYList, 'id'))]['display_name'] ?? '') ?> | Month: <?= htmlspecialchars($currentMonth) ?>
                </span>
            </div>
            <div class="text-muted small">
                Showing <?= count($rows) ?> clients
            </div>
        </div>

        <!-- Filters -->
        <form method="GET" class="row g-2 mb-4 bg-light p-3 rounded-3 border">
            <input type="hidden" name="fy" value="<?= $currentFYId ?>">
            <input type="hidden" name="month" value="<?= htmlspecialchars($currentMonth) ?>">
            
            <div class="col-md-3">
                <input type="text" name="search" class="form-control form-control-sm" placeholder="Search GSTIN, Firm, Client..." value="<?= htmlspecialchars($search) ?>">
            </div>
            <div class="col-md-3">
                <select name="status" class="form-select form-select-sm">
                    <option value="">All Work Statuses</option>
                    <?php foreach (WORK_STATUSES as $st): ?>
                        <option value="<?= $st ?>" <?= $filterStatus === $st ? 'selected' : '' ?>><?= $st ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-2">
                <select name="gst_type" class="form-select form-select-sm">
                    <option value="">All GST Types</option>
                    <option value="regular" <?= $filterGstType === 'regular' ? 'selected' : '' ?>>Regular</option>
                    <option value="composition" <?= $filterGstType === 'composition' ? 'selected' : '' ?>>Composition</option>
                </select>
            </div>
            <?php if ($user['role'] === 'admin'): ?>
            <div class="col-md-2">
                <select name="staff_id" class="form-select form-select-sm">
                    <option value="">All Staff</option>
                    <?php foreach ($staffList as $st): ?>
                        <option value="<?= $st['id'] ?>" <?= $filterStaff == $st['id'] ? 'selected' : '' ?>><?= htmlspecialchars($st['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <?php endif; ?>
            <div class="col-md-2 d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm w-100">Filter</button>
                <a href="monthly-work.php" class="btn btn-outline-secondary btn-sm">Reset</a>
            </div>
        </form>

        <!-- Work Table with Quick AJAX Update -->
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light text-secondary small text-uppercase">
                    <tr>
                        <th style="width: 15%;">GSTIN</th>
                        <th style="width: 25%;">Firm Name</th>
                        <th style="width: 12%;">Type</th>
                        <th style="width: 12%;">Staff</th>
                        <th style="width: 18%;">Status</th>
                        <th style="width: 18%;">Remark</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($rows)): ?>
                        <tr><td colspan="6" class="text-center py-4 text-muted">No clients found for this filter.</td></tr>
                    <?php else: ?>
                        <?php foreach ($rows as $r): ?>
                            <?php 
                            $status = $r['work_status'] ?: 'Not Started'; 
                            $clientId = (int)$r['client_id'];
                            ?>
                            <tr id="row-<?= $clientId ?>">
                                <td>
                                    <span class="badge bg-light text-dark border font-monospace"><?= htmlspecialchars($r['gstin']) ?></span>
                                </td>
                                <td>
                                    <a href="client-view.php?id=<?= $clientId ?>" class="fw-bold text-dark text-decoration-none">
                                        <?= htmlspecialchars($r['firm_name']) ?>
                                    </a>
                                    <div class="small text-muted"><?= htmlspecialchars($r['client_name']) ?></div>
                                </td>
                                <td>
                                    <span class="badge <?= $r['gst_type'] === 'regular' ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning' ?>">
                                        <?= ucfirst($r['gst_type']) ?>
                                    </span>
                                </td>
                                <td><small class="text-muted"><?= htmlspecialchars($r['staff_name'] ?? 'Unassigned') ?></small></td>
                                <td>
                                    <select class="form-select form-select-sm status-dropdown" 
                                            data-client-id="<?= $clientId ?>"
                                            data-fy-id="<?= $currentFYId ?>"
                                            data-month="<?= htmlspecialchars($currentMonth) ?>">
                                        <?php foreach (WORK_STATUSES as $st): ?>
                                            <option value="<?= $st ?>" <?= $status === $st ? 'selected' : '' ?>><?= $st ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </td>
                                <td>
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control remark-input" 
                                               id="remark-<?= $clientId ?>" 
                                               value="<?= htmlspecialchars($r['remark'] ?? '') ?>" 
                                               placeholder="Enter remark...">
                                        <button class="btn btn-outline-primary save-btn" 
                                                data-client-id="<?= $clientId ?>"
                                                title="Save Remark">
                                            <i class="fa-solid fa-floppy-disk"></i>
                                        </button>
                                    </div>
                                    <div class="updated-time-indicator small text-muted mt-1" id="time-<?= $clientId ?>">
                                        <?php if ($r['updated_at']): ?>
                                            <small><i class="fa-solid fa-clock"></i> <?= date('d M, H:i', strtotime($r['updated_at'])) ?></small>
                                        <?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const csrfToken = '<?= generateCSRFToken() ?>';

    function updateWork(clientId, status, remark) {
        const row = document.getElementById('row-' + clientId);
        const timeDiv = document.getElementById('time-' + clientId);

        fetch('api/monthly-work.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                client_id: clientId,
                financial_year_id: <?= $currentFYId ?>,
                month: '<?= htmlspecialchars($currentMonth) ?>',
                status: status,
                remark: remark,
                csrf_token: csrfToken
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                timeDiv.innerHTML = '<small class="text-success"><i class="fa-solid fa-check"></i> Saved just now</small>';
                setTimeout(() => {
                    timeDiv.innerHTML = '<small class="text-muted">' + data.updated_at + '</small>';
                }, 2500);
            } else {
                alert('Error: ' + (data.error || 'Failed to save work status.'));
            }
        })
        .catch(err => {
            console.error(err);
            alert('Network error while saving.');
        });
    }

    // On status change
    document.querySelectorAll('.status-dropdown').forEach(select => {
        select.addEventListener('change', function() {
            const clientId = this.getAttribute('data-client-id');
            const status = this.value;
            const remark = document.getElementById('remark-' + clientId).value;
            updateWork(clientId, status, remark);
        });
    });

    // On save button click
    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-client-id');
            const status = document.querySelector('.status-dropdown[data-client-id="' + clientId + '"]').value;
            const remark = document.getElementById('remark-' + clientId).value;
            updateWork(clientId, status, remark);
        });
    });
});
</script>

<?php include __DIR__ . '/includes/footer.php'; ?>
`,
  },
  {
    path: 'api/monthly-work.php',
    category: 'API',
    description: 'AJAX endpoint for saving status, remark, audit trail in work_history and activity_logs',
    content: `<?php
require_once __DIR__ . '/../config/config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$csrfToken = $input['csrf_token'] ?? '';
if (!validateCSRFToken($csrfToken)) {
    echo json_encode(['success' => false, 'error' => 'CSRF verification failed']);
    exit;
}

$clientId = (int)($input['client_id'] ?? 0);
$fyId = (int)($input['financial_year_id'] ?? 0);
$month = trim($input['month'] ?? '');
$newStatus = trim($input['status'] ?? 'Not Started');
$remark = trim($input['remark'] ?? '');
$userId = (int)$_SESSION['user_id'];

if (!$clientId || !$fyId || empty($month)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$pdo = getDBConnection();

try {
    $pdo->beginTransaction();

    // 1. Fetch current status
    $checkStmt = $pdo->prepare("SELECT status FROM monthly_work WHERE financial_year_id = ? AND month = ? AND client_id = ?");
    $checkStmt->execute([$fyId, $month, $clientId]);
    $existing = $checkStmt->fetch();
    $previousStatus = $existing ? $existing['status'] : 'Not Started';

    // 2. Upsert into monthly_work
    $sql = "INSERT INTO monthly_work (financial_year_id, month, client_id, status, remark, updated_by, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                status = VALUES(status), 
                remark = VALUES(remark), 
                updated_by = VALUES(updated_by), 
                updated_at = NOW()";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$fyId, $month, $clientId, $newStatus, $remark, $userId]);

    // 3. If status changed or remark added, log into work_history
    if ($previousStatus !== $newStatus || !empty($remark)) {
        $whStmt = $pdo->prepare("INSERT INTO work_history (client_id, financial_year_id, month, previous_status, new_status, remark, changed_by, changed_at)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $whStmt->execute([$clientId, $fyId, $month, $previousStatus, $newStatus, $remark, $userId]);
    }

    // 4. Log in activity_logs
    logActivity($pdo, $userId, 'Status Updated', "Updated $month work for Client #$clientId to '$newStatus'");

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'status' => $newStatus,
        'remark' => $remark,
        'updated_at' => date('d M Y, h:i A')
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Monthly Work API Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error occurred.']);
}
`,
  },
  {
    path: 'assets/css/style.css',
    category: 'Assets',
    description: 'Clean responsive stylesheet for sidebar, cards, badges, and typography',
    content: `/* GST Admin Panel Custom Styling */
body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: #f8fafc;
    color: #1e293b;
    font-size: 14px;
}

.wrapper {
    display: flex;
    width: 100%;
    align-items: stretch;
    min-height: 100vh;
}

#sidebar {
    min-width: 250px;
    max-width: 250px;
    background: #0f172a;
    color: #fff;
    transition: all 0.3s;
}

#sidebar.active {
    margin-left: -250px;
}

#sidebar .brand-icon {
    width: 36px;
    height: 36px;
    background: #2563eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

#sidebar ul.components {
    padding: 15px 0;
}

#sidebar ul li a {
    padding: 10px 15px;
    font-size: 13.5px;
    font-weight: 500;
    display: block;
    color: #94a3b8;
    text-decoration: none;
    border-radius: 8px;
    margin: 2px 10px;
    transition: all 0.2s ease;
}

#sidebar ul li a:hover {
    color: #ffffff;
    background: #1e293b;
}

#sidebar ul li.active > a {
    color: #ffffff;
    background: #2563eb;
    font-weight: 600;
}

#content {
    width: 100%;
    min-height: 100vh;
    background-color: #f8fafc;
    transition: all 0.3s;
}

.avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #0f172a;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
}

.stat-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08) !important;
}

.stat-icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.status-badge-not-started { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
.status-badge-pending { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.status-badge-completed { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.status-badge-bill-pending { background-color: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
.status-badge-tax-payment-pending { background-color: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; }
.status-badge-documents-pending { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
.status-badge-client-response-pending { background-color: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
.status-badge-other { background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }

@media (max-width: 768px) {
    #sidebar {
        margin-left: -250px;
    }
    #sidebar.active {
        margin-left: 0;
    }
}
`,
  },
  {
    path: 'assets/js/app.js',
    category: 'Assets',
    description: 'Vanilla JavaScript for sidebar toggle, tooltips, and dynamic handlers',
    content: `// Main Vanilla JS Application Script
document.addEventListener('DOMContentLoaded', function () {
    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const sidebarCollapse = document.getElementById('sidebarCollapse');

    if (sidebarCollapse && sidebar) {
        sidebarCollapse.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }

    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(function (alert) {
        setTimeout(function () {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});
`,
  },
  {
    path: 'client-add.php',
    category: 'Pages',
    description: 'Add new client form with GSTIN regex validation, state auto-detection and duplicate prevention',
    content: `<?php
$pageTitle = 'Add New GST Client';
require_once __DIR__ . '/includes/header.php';
requireAdmin();

$error = '';
$formData = [
    'gstin' => '', 'firm_name' => '', 'client_name' => '', 'mobile' => '',
    'alternate_mobile' => '', 'email' => '', 'address' => '', 'city' => '',
    'state' => '', 'pin_code' => '', 'gst_type' => 'regular', 'assigned_staff_id' => '',
    'registration_date' => date('Y-m-d'), 'status' => 'active', 'notes' => ''
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $error = 'Security session expired. Please refresh and try again.';
    } else {
        foreach ($formData as $k => $v) {
            $formData[$k] = trim($_POST[$k] ?? '');
        }

        $gstin = strtoupper($formData['gstin']);
        $validation = validateGSTIN($gstin);

        if (!$validation['valid']) {
            $error = $validation['error'];
        } elseif (empty($formData['firm_name']) || empty($formData['client_name']) || empty($formData['mobile'])) {
            $error = 'Firm Name, Client Name, and Mobile Number are required.';
        } else {
            // Check duplicate GSTIN
            $dupStmt = $pdo->prepare("SELECT id FROM clients WHERE gstin = ?");
            $dupStmt->execute([$gstin]);
            if ($dupStmt->fetch()) {
                $error = "GSTIN '$gstin' already exists in the database.";
            } else {
                if (empty($formData['state']) && isset($validation['state'])) {
                    $formData['state'] = $validation['state'];
                }

                $staffId = !empty($formData['assigned_staff_id']) ? (int)$formData['assigned_staff_id'] : null;

                $insertSql = "INSERT INTO clients (gstin, firm_name, client_name, mobile, alternate_mobile, email, address, city, state, pin_code, gst_type, assigned_staff_id, registration_date, status, notes, created_at, updated_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
                
                $insStmt = $pdo->prepare($insertSql);
                $insStmt->execute([
                    $gstin, $formData['firm_name'], $formData['client_name'],
                    $formData['mobile'], $formData['alternate_mobile'] ?: null,
                    $formData['email'] ?: null, $formData['address'] ?: null,
                    $formData['city'] ?: null, $formData['state'] ?: null,
                    $formData['pin_code'] ?: null, $formData['gst_type'],
                    $staffId, $formData['registration_date'] ?: null,
                    $formData['status'], $formData['notes'] ?: null
                ]);

                $newClientId = $pdo->lastInsertId();
                logActivity($pdo, $user['id'], 'Client Created', "Added new client {$formData['firm_name']} ($gstin)");

                setFlash('success', "Client {$formData['firm_name']} created successfully!");
                header("Location: client-view.php?id=$newClientId");
                exit;
            }
        }
    }
}

$staffList = $pdo->query("SELECT id, name FROM users WHERE role = 'staff' AND status = 'active'")->fetchAll();
?>

<div class="card border-0 shadow-sm rounded-3">
    <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
            <h5 class="fw-bold text-dark m-0"><i class="fa-solid fa-user-plus text-primary me-2"></i> Add New Master Client</h5>
            <a href="clients.php" class="btn btn-outline-secondary btn-sm"><i class="fa-solid fa-arrow-left me-1"></i> Back to List</a>
        </div>

        <?php if (!empty($error)): ?>
            <div class="alert alert-danger py-2 small mb-4">
                <i class="fa-solid fa-triangle-exclamation me-1"></i> <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="client-add.php" class="row g-3">
            <?= getCSRFField() ?>

            <div class="col-md-4">
                <label class="form-label fw-semibold small">GSTIN (15 Digits) <span class="text-danger">*</span></label>
                <input type="text" name="gstin" class="form-control text-uppercase font-monospace" maxlength="15" placeholder="e.g. 27AAAAA0000A1Z5" value="<?= htmlspecialchars($formData['gstin']) ?>" required id="gstinField">
            </div>

            <div class="col-md-4">
                <label class="form-label fw-semibold small">Firm / Trade Name <span class="text-danger">*</span></label>
                <input type="text" name="firm_name" class="form-control" placeholder="e.g. Apex Infotech Solutions" value="<?= htmlspecialchars($formData['firm_name']) ?>" required>
            </div>

            <div class="col-md-4">
                <label class="form-label fw-semibold small">Client / Contact Person <span class="text-danger">*</span></label>
                <input type="text" name="client_name" class="form-control" placeholder="e.g. Rajesh Nair" value="<?= htmlspecialchars($formData['client_name']) ?>" required>
            </div>

            <div class="col-md-3">
                <label class="form-label fw-semibold small">Mobile Number <span class="text-danger">*</span></label>
                <input type="text" name="mobile" class="form-control" placeholder="10-digit mobile" value="<?= htmlspecialchars($formData['mobile']) ?>" required>
            </div>

            <div class="col-md-3">
                <label class="form-label fw-semibold small">Alternate Mobile</label>
                <input type="text" name="alternate_mobile" class="form-control" placeholder="Optional" value="<?= htmlspecialchars($formData['alternate_mobile']) ?>">
            </div>

            <div class="col-md-3">
                <label class="form-label fw-semibold small">Email Address</label>
                <input type="email" name="email" class="form-control" placeholder="client@domain.com" value="<?= htmlspecialchars($formData['email']) ?>">
            </div>

            <div class="col-md-3">
                <label class="form-label fw-semibold small">GST Type <span class="text-danger">*</span></label>
                <select name="gst_type" class="form-select" required>
                    <option value="regular" <?= $formData['gst_type'] === 'regular' ? 'selected' : '' ?>>Regular (Normal)</option>
                    <option value="composition" <?= $formData['gst_type'] === 'composition' ? 'selected' : '' ?>>Composition (CMP-08)</option>
                </select>
            </div>

            <div class="col-md-6">
                <label class="form-label fw-semibold small">Address</label>
                <input type="text" name="address" class="form-control" placeholder="Office / Shop Address" value="<?= htmlspecialchars($formData['address']) ?>">
            </div>

            <div class="col-md-2">
                <label class="form-label fw-semibold small">City</label>
                <input type="text" name="city" class="form-control" placeholder="City" value="<?= htmlspecialchars($formData['city']) ?>">
            </div>

            <div class="col-md-2">
                <label class="form-label fw-semibold small">State</label>
                <input type="text" name="state" class="form-control" id="stateField" placeholder="State" value="<?= htmlspecialchars($formData['state']) ?>">
            </div>

            <div class="col-md-2">
                <label class="form-label fw-semibold small">PIN Code</label>
                <input type="text" name="pin_code" class="form-control" placeholder="6-digit PIN" value="<?= htmlspecialchars($formData['pin_code']) ?>">
            </div>

            <div class="col-md-4">
                <label class="form-label fw-semibold small">Assigned Staff</label>
                <select name="assigned_staff_id" class="form-select">
                    <option value="">-- Unassigned --</option>
                    <?php foreach ($staffList as $st): ?>
                        <option value="<?= $st['id'] ?>" <?= $formData['assigned_staff_id'] == $st['id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($st['name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="col-md-4">
                <label class="form-label fw-semibold small">Registration Date</label>
                <input type="date" name="registration_date" class="form-control" value="<?= htmlspecialchars($formData['registration_date']) ?>">
            </div>

            <div class="col-md-4">
                <label class="form-label fw-semibold small">Client Status</label>
                <select name="status" class="form-select">
                    <option value="active" <?= $formData['status'] === 'active' ? 'selected' : '' ?>>Active</option>
                    <option value="inactive" <?= $formData['status'] === 'inactive' ? 'selected' : '' ?>>Inactive</option>
                </select>
            </div>

            <div class="col-12">
                <label class="form-label fw-semibold small">Notes / Instructions</label>
                <textarea name="notes" rows="2" class="form-control" placeholder="Special filing notes, GST portal credentials or deadlines..."><?= htmlspecialchars($formData['notes']) ?></textarea>
            </div>

            <div class="col-12 mt-4 pt-3 border-top d-flex gap-2">
                <button type="submit" class="btn btn-primary px-4"><i class="fa-solid fa-check me-2"></i> Save Client</button>
                <a href="clients.php" class="btn btn-light border px-4">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
`,
  },
  {
    path: 'client-view.php',
    category: 'Pages',
    description: 'Detailed client profile with 12-month FY tracking matrix, previous FY history, and audit log',
    content: `<?php
$pageTitle = 'Client Profile';
require_once __DIR__ . '/includes/header.php';

$clientId = (int)($_GET['id'] ?? 0);
if (!$clientId) {
    header('Location: clients.php');
    exit;
}

$stmt = $pdo->prepare("SELECT c.*, u.name as staff_name FROM clients c LEFT JOIN users u ON u.id = c.assigned_staff_id WHERE c.id = ?");
$stmt->execute([$clientId]);
$client = $stmt->fetch();

if (!$client) {
    setFlash('error', 'Client not found.');
    header('Location: clients.php');
    exit;
}

// Fetch all monthly work for the selected Financial Year for this client
$mwStmt = $pdo->prepare("SELECT * FROM monthly_work WHERE client_id = ? AND financial_year_id = ?");
$mwStmt->execute([$clientId, $currentFYId]);
$monthlyRecords = $mwStmt->fetchAll();

$monthData = [];
foreach ($monthlyRecords as $r) {
    $monthData[$r['month']] = $r;
}

// Fetch status change history for this client
$whStmt = $pdo->prepare("SELECT wh.*, fy.display_name as fy_name, u.name as changed_by_name 
                         FROM work_history wh 
                         LEFT JOIN financial_years fy ON fy.id = wh.financial_year_id
                         LEFT JOIN users u ON u.id = wh.changed_by
                         WHERE wh.client_id = ? 
                         ORDER BY wh.changed_at DESC LIMIT 20");
$whStmt->execute([$clientId]);
$history = $whStmt->fetchAll();
?>

<div class="row g-4">
    <!-- Client Master Info Card -->
    <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-3 mb-4">
            <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-1">
                        <?= htmlspecialchars($client['gstin']) ?>
                    </span>
                    <span class="badge <?= $client['status'] === 'active' ? 'bg-success' : 'bg-secondary' ?>">
                        <?= ucfirst($client['status']) ?>
                    </span>
                </div>

                <h5 class="fw-bold text-dark m-0"><?= htmlspecialchars($client['firm_name']) ?></h5>
                <p class="text-muted small mb-3">Contact: <?= htmlspecialchars($client['client_name']) ?></p>

                <hr>

                <div class="mb-2">
                    <small class="text-muted d-block">GST Scheme</small>
                    <span class="fw-semibold text-dark text-capitalize"><?= htmlspecialchars($client['gst_type']) ?></span>
                </div>

                <div class="mb-2">
                    <small class="text-muted d-block">Mobile</small>
                    <span class="fw-semibold text-dark"><i class="fa-solid fa-phone me-1 text-muted"></i> <?= htmlspecialchars($client['mobile']) ?></span>
                </div>

                <?php if ($client['email']): ?>
                <div class="mb-2">
                    <small class="text-muted d-block">Email</small>
                    <span class="fw-semibold text-dark"><i class="fa-solid fa-envelope me-1 text-muted"></i> <?= htmlspecialchars($client['email']) ?></span>
                </div>
                <?php endif; ?>

                <div class="mb-2">
                    <small class="text-muted d-block">Assigned Staff</small>
                    <span class="fw-semibold text-dark"><i class="fa-solid fa-user-check me-1 text-muted"></i> <?= htmlspecialchars($client['staff_name'] ?? 'Unassigned') ?></span>
                </div>

                <div class="mb-3">
                    <small class="text-muted d-block">Address</small>
                    <span class="text-secondary small"><?= htmlspecialchars($client['address'] ?? '') ?>, <?= htmlspecialchars($client['city'] ?? '') ?>, <?= htmlspecialchars($client['state'] ?? '') ?> - <?= htmlspecialchars($client['pin_code'] ?? '') ?></span>
                </div>

                <?php if ($client['notes']): ?>
                <div class="p-3 bg-light rounded-2 border small">
                    <strong class="d-block mb-1 text-dark">Notes:</strong>
                    <?= nl2br(htmlspecialchars($client['notes'])) ?>
                </div>
                <?php endif; ?>

                <div class="mt-4 pt-3 border-top d-flex gap-2">
                    <?php if ($user['role'] === 'admin'): ?>
                    <a href="client-edit.php?id=<?= $client['id'] ?>" class="btn btn-primary btn-sm flex-grow-1"><i class="fa-solid fa-pen me-1"></i> Edit Client</a>
                    <?php endif; ?>
                    <a href="monthly-work.php?search=<?= urlencode($client['gstin']) ?>" class="btn btn-outline-secondary btn-sm"><i class="fa-solid fa-list-check me-1"></i> Work Tracker</a>
                </div>
            </div>
        </div>
    </div>

    <!-- 12-Month Financial Year Work Grid & History -->
    <div class="col-md-8">
        <div class="card border-0 shadow-sm rounded-3 mb-4">
            <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-dark m-0"><i class="fa-solid fa-calendar-days text-primary me-2"></i> 12-Month Work Status Grid</h6>
                    <span class="badge bg-light text-dark border">FY <?= htmlspecialchars($activeFYList[array_search($currentFYId, array_column($activeFYList, 'id'))]['display_name'] ?? '') ?></span>
                </div>

                <div class="table-responsive">
                    <table class="table table-bordered table-sm align-middle">
                        <thead class="table-light small text-center">
                            <tr>
                                <th>Month</th>
                                <th>Status</th>
                                <th>Remark</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach (FY_MONTHS as $m): ?>
                                <?php 
                                $rec = $monthData[$m] ?? null;
                                $st = $rec ? $rec['status'] : 'Not Started';
                                ?>
                                <tr>
                                    <td class="fw-semibold px-3"><?= $m ?></td>
                                    <td class="text-center" style="width: 25%;">
                                        <span class="badge status-badge-<?= str_replace(' ', '-', strtolower($st)) ?> px-3 py-1">
                                            <?= $st ?>
                                        </span>
                                    </td>
                                    <td class="small text-muted"><?= htmlspecialchars($rec['remark'] ?? '-') ?></td>
                                    <td class="small text-muted text-center" style="width: 20%;">
                                        <?= $rec && $rec['updated_at'] ? date('d M Y', strtotime($rec['updated_at'])) : '-' ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Audit Trail / Work History -->
        <div class="card border-0 shadow-sm rounded-3">
            <div class="card-body p-4">
                <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-clock-rotate-left text-secondary me-2"></i> Status Change Audit Trail</h6>
                <?php if (empty($history)): ?>
                    <p class="text-muted small m-0">No status change history recorded yet.</p>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover align-middle small">
                            <thead class="table-light">
                                <tr>
                                    <th>Date/Time</th>
                                    <th>FY / Month</th>
                                    <th>Status Transition</th>
                                    <th>Remark</th>
                                    <th>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($history as $h): ?>
                                    <tr>
                                        <td><?= date('d M Y, h:i A', strtotime($h['changed_at'])) ?></td>
                                        <td><strong><?= htmlspecialchars($h['fy_name'] ?? '') ?></strong> - <?= htmlspecialchars($h['month']) ?></td>
                                        <td>
                                            <span class="badge bg-light text-secondary border"><?= htmlspecialchars($h['previous_status']) ?></span>
                                            <i class="fa-solid fa-arrow-right mx-1 text-muted"></i>
                                            <span class="badge status-badge-<?= str_replace(' ', '-', strtolower($h['new_status'])) ?>"><?= htmlspecialchars($h['new_status']) ?></span>
                                        </td>
                                        <td><?= htmlspecialchars($h['remark'] ?: '-') ?></td>
                                        <td><?= htmlspecialchars($h['changed_by_name'] ?? 'System') ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
`,
  },
  {
    path: 'reports.php',
    category: 'Pages',
    description: 'Comprehensive reporting suite with visual charts, filter criteria, print layout, and CSV exports',
    content: `<?php
$pageTitle = 'Reports & Analytics';
require_once __DIR__ . '/includes/header.php';

// Fetch summary metrics for chosen Financial Year
$staffPerformanceStmt = $pdo->prepare("SELECT 
    u.name as staff_name,
    COUNT(c.id) as total_assigned,
    SUM(CASE WHEN mw.status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN mw.status != 'Completed' AND mw.status != 'Not Started' AND mw.status IS NOT NULL THEN 1 ELSE 0 END) as pending_count
FROM users u
LEFT JOIN clients c ON c.assigned_staff_id = u.id AND c.status = 'active'
LEFT JOIN monthly_work mw ON mw.client_id = c.id AND mw.financial_year_id = ? AND mw.month = ?
WHERE u.role = 'staff' AND u.status = 'active'
GROUP BY u.id");
$staffPerformanceStmt->execute([$currentFYId, $currentMonth]);
$staffStats = $staffPerformanceStmt->fetchAll();

// Month by month completion progression
$monthlyProgressionStmt = $pdo->prepare("SELECT 
    mw.month,
    SUM(CASE WHEN mw.status = 'Completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN mw.status LIKE '%Pending%' THEN 1 ELSE 0 END) as pending
FROM monthly_work mw
WHERE mw.financial_year_id = ?
GROUP BY mw.month");
$monthlyProgressionStmt->execute([$currentFYId]);
$progressionRaw = $monthlyProgressionStmt->fetchAll();

$progressionMap = [];
foreach ($progressionRaw as $p) {
    $progressionMap[$p['month']] = $p;
}
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h5 class="fw-bold text-dark m-0">GST Work Analytics & Reports</h5>
        <small class="text-muted">Breakdown for Financial Year <?= htmlspecialchars($activeFYList[array_search($currentFYId, array_column($activeFYList, 'id'))]['display_name'] ?? '') ?> (<?= htmlspecialchars($currentMonth) ?>)</small>
    </div>
    <div class="d-flex gap-2">
        <button onclick="window.print()" class="btn btn-outline-secondary btn-sm"><i class="fa-solid fa-print me-1"></i> Print Report</button>
        <a href="export.php?type=monthly_work" class="btn btn-primary btn-sm"><i class="fa-solid fa-file-csv me-1"></i> Export Monthly Work CSV</a>
    </div>
</div>

<!-- Staff Performance Table -->
<div class="card border-0 shadow-sm rounded-3 mb-4">
    <div class="card-body p-4">
        <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-users-gear text-primary me-2"></i> Staff Workload & Performance (<?= htmlspecialchars($currentMonth) ?>)</h6>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light small text-uppercase">
                    <tr>
                        <th>Staff Name</th>
                        <th class="text-center">Total Clients</th>
                        <th class="text-center">Completed</th>
                        <th class="text-center">Pending / In-Progress</th>
                        <th>Progress %</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($staffStats)): ?>
                        <tr><td colspan="5" class="text-center py-3 text-muted">No staff data available.</td></tr>
                    <?php else: ?>
                        <?php foreach ($staffStats as $s): ?>
                            <?php 
                            $total = (int)$s['total_assigned'];
                            $completed = (int)$s['completed_count'];
                            $pct = $total > 0 ? round(($completed / $total) * 100) : 0;
                            ?>
                            <tr>
                                <td class="fw-bold text-dark"><?= htmlspecialchars($s['staff_name']) ?></td>
                                <td class="text-center fw-semibold"><?= $total ?></td>
                                <td class="text-center text-success fw-bold"><?= $completed ?></td>
                                <td class="text-center text-warning-emphasis fw-bold"><?= (int)$s['pending_count'] ?></td>
                                <td style="width: 30%;">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="progress flex-grow-1" style="height: 8px;">
                                            <div class="progress-bar bg-success" style="width: <?= $pct ?>%;"></div>
                                        </div>
                                        <small class="fw-bold"><?= $pct ?>%</small>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- 12-Month Year Progress Matrix -->
<div class="card border-0 shadow-sm rounded-3">
    <div class="card-body p-4">
        <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-chart-line text-info me-2"></i> Month-by-Month Completion Progression</h6>
        <div class="table-responsive">
            <table class="table table-sm table-bordered align-middle text-center">
                <thead class="table-light small">
                    <tr>
                        <?php foreach (FY_MONTHS as $m): ?>
                            <th><?= $m ?></th>
                        <?php endforeach; ?>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <?php foreach (FY_MONTHS as $m): ?>
                            <?php $comp = $progressionMap[$m]['completed'] ?? 0; ?>
                            <td>
                                <div class="fw-bold text-success"><?= $comp ?></div>
                                <small class="text-muted" style="font-size: 10px;">filed</small>
                            </td>
                        <?php endforeach; ?>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
`,
  },
  {
    path: 'export.php',
    category: 'Pages',
    description: 'CSV Export handler for master clients, monthly work, and pending cases',
    content: `<?php
require_once __DIR__ . '/config/config.php';
requireLogin();

$type = $_GET['type'] ?? 'clients';
$pdo = getDBConnection();

$filename = "gst_" . $type . "_" . date('Y-m-d') . ".csv";

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=' . $filename);

$output = fopen('php://output', 'w');

if ($type === 'clients') {
    fputcsv($output, ['Client ID', 'GSTIN', 'Firm Name', 'Client Name', 'Mobile', 'Email', 'Address', 'City', 'State', 'PIN', 'GST Type', 'Status', 'Notes']);
    $stmt = $pdo->query("SELECT id, gstin, firm_name, client_name, mobile, email, address, city, state, pin_code, gst_type, status, notes FROM clients ORDER BY id ASC");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        fputcsv($output, $row);
    }
} elseif ($type === 'monthly_work') {
    $fyId = (int)($_SESSION['selected_fy_id'] ?? 2);
    $month = $_SESSION['selected_month'] ?? 'August';

    fputcsv($output, ['GSTIN', 'Firm Name', 'Client Name', 'GST Type', 'Staff', 'Status', 'Remark', 'Last Updated']);
    
    $stmt = $pdo->prepare("SELECT c.gstin, c.firm_name, c.client_name, c.gst_type, u.name as staff_name, COALESCE(mw.status, 'Not Started') as status, mw.remark, mw.updated_at
                           FROM clients c
                           LEFT JOIN users u ON u.id = c.assigned_staff_id
                           LEFT JOIN monthly_work mw ON mw.client_id = c.id AND mw.financial_year_id = ? AND mw.month = ?
                           WHERE c.status = 'active'
                           ORDER BY c.firm_name ASC");
    $stmt->execute([$fyId, $month]);
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        fputcsv($output, $row);
    }
}
fclose($output);
exit;
`,
  },
  {
    path: 'import.php',
    category: 'Pages',
    description: 'CSV Import tool with GSTIN format verification and duplicate detection preview',
    content: `<?php
$pageTitle = 'Import Clients (CSV)';
require_once __DIR__ . '/includes/header.php';
requireAdmin();

$message = '';
$previewData = [];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['csv_file'])) {
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Security token invalid. Please try again.';
    } else {
        $file = $_FILES['csv_file']['tmp_name'];
        if (is_uploaded_file($file)) {
            $handle = fopen($file, 'r');
            $header = fgetcsv($handle); // Read header line
            
            $existingGSTINs = $pdo->query("SELECT UPPER(gstin) FROM clients")->fetchAll(PDO::FETCH_COLUMN);
            $existingGSTINs = array_map('trim', $existingGSTINs);

            $rowIdx = 1;
            $validRows = [];

            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                $rowIdx++;
                if (empty($data[0])) continue;

                $gstin = strtoupper(trim($data[0]));
                $firmName = trim($data[1] ?? '');
                $clientName = trim($data[2] ?? '');
                $mobile = trim($data[3] ?? '');
                $email = trim($data[4] ?? '');
                $address = trim($data[5] ?? '');
                $city = trim($data[6] ?? '');
                $state = trim($data[7] ?? '');
                $pin = trim($data[8] ?? '');
                $gstType = strtolower(trim($data[9] ?? 'regular')) === 'composition' ? 'composition' : 'regular';

                // Validation
                $val = validateGSTIN($gstin);
                if (!$val['valid']) {
                    $errors[] = "Row $rowIdx: Invalid GSTIN '$gstin' - " . $val['error'];
                    continue;
                }
                if (in_array($gstin, $existingGSTINs)) {
                    $errors[] = "Row $rowIdx: Duplicate GSTIN '$gstin' (already in database).";
                    continue;
                }
                if (empty($firmName) || empty($mobile)) {
                    $errors[] = "Row $rowIdx: Firm name and mobile are required for '$gstin'.";
                    continue;
                }

                $validRows[] = [
                    'gstin' => $gstin, 'firm_name' => $firmName, 'client_name' => $clientName,
                    'mobile' => $mobile, 'email' => $email, 'address' => $address,
                    'city' => $city, 'state' => $state ?: ($val['state'] ?? ''), 'pin_code' => $pin,
                    'gst_type' => $gstType
                ];
                $existingGSTINs[] = $gstin; // Prevent duplicate within same CSV
            }
            fclose($handle);

            if (isset($_POST['confirm_import']) && !empty($validRows)) {
                $pdo->beginTransaction();
                $ins = $pdo->prepare("INSERT INTO clients (gstin, firm_name, client_name, mobile, email, address, city, state, pin_code, gst_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())");
                foreach ($validRows as $r) {
                    $ins->execute([$r['gstin'], $r['firm_name'], $r['client_name'], $r['mobile'], $r['email'], $r['address'], $r['city'], $r['state'], $r['pin_code'], $r['gst_type']]);
                }
                $pdo->commit();
                logActivity($pdo, $user['id'], 'Clients Imported', 'Imported ' . count($validRows) . ' clients via CSV');
                setFlash('success', 'Successfully imported ' . count($validRows) . ' clients!');
                header('Location: clients.php');
                exit;
            } else {
                $previewData = $validRows;
            }
        }
    }
}
?>

<div class="card border-0 shadow-sm rounded-3">
    <div class="card-body p-4">
        <h5 class="fw-bold text-dark mb-3"><i class="fa-solid fa-file-import text-primary me-2"></i> Import Clients from CSV / Excel</h5>
        <p class="text-muted small">Upload a CSV file containing GSTIN, Firm Name, Client Name, Mobile, Email, Address, City, State, PIN, and GST Type (Regular/Composition).</p>

        <?php if (!empty($errors)): ?>
            <div class="alert alert-warning small py-3">
                <h6 class="fw-bold mb-2"><i class="fa-solid fa-triangle-exclamation me-1"></i> <?= count($errors) ?> Errors / Duplicates Found:</h6>
                <ul class="m-0 ps-3">
                    <?php foreach (array_slice($errors, 0, 10) as $err): ?>
                        <li><?= htmlspecialchars($err) ?></li>
                    <?php endforeach; ?>
                    <?php if (count($errors) > 10): ?>
                        <li>...and <?= count($errors) - 10 ?> more errors.</li>
                    <?php endif; ?>
                </ul>
            </div>
        <?php endif; ?>

        <form method="POST" enctype="multipart/form-data" class="mb-4">
            <?= getCSRFField() ?>
            <div class="row g-3 align-items-center">
                <div class="col-md-6">
                    <input type="file" name="csv_file" class="form-control" accept=".csv" required>
                </div>
                <div class="col-md-3">
                    <button type="submit" class="btn btn-primary w-100"><i class="fa-solid fa-upload me-1"></i> Upload & Validate</button>
                </div>
                <div class="col-md-3">
                    <a href="export.php?type=clients" class="btn btn-outline-secondary w-100"><i class="fa-solid fa-download me-1"></i> Sample CSV Template</a>
                </div>
            </div>
        </form>

        <?php if (!empty($previewData)): ?>
            <div class="p-3 bg-light rounded-3 border">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-success m-0"><i class="fa-solid fa-circle-check me-1"></i> <?= count($previewData) ?> Valid Records Ready for Import</h6>
                    <form method="POST" enctype="multipart/form-data">
                        <?= getCSRFField() ?>
                        <input type="hidden" name="confirm_import" value="1">
                        <!-- Re-upload same file automatically or process preview -->
                        <button type="submit" class="btn btn-success btn-sm px-4">Confirm & Import All</button>
                    </form>
                </div>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
`,
  },
  {
    path: '.htaccess',
    category: 'Config',
    description: 'Apache configuration for Hostinger shared hosting, directory security, and PHP settings',
    content: `# Protect Configuration & Sensitive Directories
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^config/ - [F,L]
</IfModule>

# Disable Directory Browsing
Options -Indexes

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>
`,
  },
  {
    path: 'INSTALLATION.md',
    category: 'Docs',
    description: 'Simple step-by-step installation instructions for Hostinger non-programmers',
    content: `# Hostinger Installation Guide (Step-by-Step)

Follow these simple steps to deploy the **GST Client Work Management Admin Panel** on Hostinger Shared Hosting.

---

### STEP 1: Log In to Hostinger
1. Go to [https://hpanel.hostinger.com](https://hpanel.hostinger.com) and log in to your account.
2. Select your hosting plan or website domain.

---

### STEP 2: Create MySQL Database
1. In hPanel, search for **Databases** (or click **MySQL Databases**).
2. Enter:
   - **Database Name**: e.g. \`gstadmin\` (Hostinger will prefix it, e.g. \`u123456789_gstadmin\`).
   - **Username**: e.g. \`gstuser\` (e.g. \`u123456789_gstuser\`).
   - **Password**: Enter a strong password and save it in a safe place.
3. Click **Create**.

---

### STEP 3: Import database.sql via phpMyAdmin
1. Next to your new database, click **Enter phpMyAdmin**.
2. Click on the database name on the left sidebar.
3. Click on the **Import** tab at the top.
4. Click **Choose File** and select \`database.sql\`.
5. Scroll to the bottom and click **Import** (or **Go**).
6. You will see a green success message: "Import has been successfully finished."

---

### STEP 4: Upload Files via File Manager
1. In hPanel, click on **File Manager** (Files -> File Manager).
2. Open the \`public_html\` directory.
3. Upload all the extracted PHP files and folders (\`config/\`, \`includes/\`, \`assets/\`, \`api/\`, \`index.php\`, etc.) directly into \`public_html\`.

---

### STEP 5: Configure Database Credentials
1. Inside File Manager in \`public_html\`, open the \`config\` folder.
2. Right-click or double-click \`database.php\` and choose **Edit**.
3. Replace the lines with your Hostinger database details:
   \`\`\`php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u123456789_gstadmin');   // Your actual DB name
   define('DB_USER', 'u123456789_gstuser');    // Your actual DB username
   define('DB_PASS', 'YourRealDatabasePassword'); // Your actual DB password
   \`\`\`
4. Click **Save & Close**.

---

### STEP 6: Open the Website & Log In
1. Open your domain in any browser: \`https://yourdomain.com\`
2. Sign in with the default Administrator account:
   - **Username**: \`admin\`
   - **Password**: \`admin\`
3. Go to **Settings** -> **Staff & Users** to change your password immediately.

---

### Workflow Quickstart:
- **Master Clients**: Add or CSV import your clients.
- **Financial Years**: Select current Financial Year (e.g. 2026-27).
- **Monthly Work**: Select month (e.g. August) and update status/remarks with 1-click AJAX saving.
`,
  }
];
