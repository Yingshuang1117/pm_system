-- 创建数据库
CREATE DATABASE IF NOT EXISTS pm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pm_system;

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'DEVELOPER', 'TESTER', 'STAKEHOLDER') NOT NULL DEFAULT 'DEVELOPER',
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建需求表（如果不存在）
CREATE TABLE IF NOT EXISTS requirements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  requestor VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  request_date DATE NOT NULL,
  status ENUM('待排期', '已立项', '已完成') NOT NULL DEFAULT '待排期',
  project_id INT,
  project_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建项目表（如果不存在）
CREATE TABLE IF NOT EXISTS projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  status ENUM('需求设计', '开发中', '已完成') NOT NULL DEFAULT '需求设计',
  launch_time DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建项目-需求关联表（如果不存在）
CREATE TABLE IF NOT EXISTS project_requirements (
  project_id INT NOT NULL,
  requirement_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, requirement_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE
);

-- 创建服务单元表（如果不存在）
CREATE TABLE IF NOT EXISTS service_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '服务单元名称',
  leader_id INT NOT NULL COMMENT '负责人ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_id) REFERENCES users(id),
  UNIQUE KEY unique_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建服务单元成员关联表（如果不存在）
CREATE TABLE IF NOT EXISTS service_unit_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_unit_id INT NOT NULL COMMENT '服务单元ID',
  user_id INT NOT NULL COMMENT '用户ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_unit_id) REFERENCES service_units(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 只在用户表为空时插入默认管理员
INSERT IGNORE INTO users (username, name, email, password, role, department, created_at, updated_at)
SELECT 'admin', '系统管理员', 'admin@example.com', '$2a$10$rPiEAgQNIT1TCoKi3Eqq8eVaRYIRlR29mxZcEAnNAq9RfHWjZpTie', 'ADMIN', 'IT', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin'); 