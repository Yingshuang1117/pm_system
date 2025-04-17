-- 创建数据库
CREATE DATABASE IF NOT EXISTS pm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pm_system;

-- 创建用户表
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('USER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER',
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建需求表
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

-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  status ENUM('需求设计', '开发中', '已完成') NOT NULL DEFAULT '需求设计',
  launch_time DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建项目-需求关联表
CREATE TABLE IF NOT EXISTS project_requirements (
  project_id INT NOT NULL,
  requirement_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, requirement_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO users (username, password, role, department, created_at, updated_at)
VALUES ('admin', '$2a$10$rPiEAgQNIT1TCoKi3Eqq8eVaRYIRlR29mxZcEAnNAq9RfHWjZpTie', 'admin', 'IT', NOW(), NOW()); 