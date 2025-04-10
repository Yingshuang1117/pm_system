# 产品经理项目管理系统

这是一个基于 Flask 和 React 的产品经理项目管理系统，用于管理项目、任务和团队协作。

## 功能特点

- 项目管理：创建、查看和更新项目信息
- 任务跟踪：创建、分配和跟踪任务进度
- 团队协作：分配任务给团队成员
- 进度报告：查看项目和任务的完成情况

## 技术栈

### 后端
- Python 3.8+
- Flask
- SQLAlchemy
- SQLite

### 前端
- React
- TypeScript
- Ant Design
- React Router

## 安装说明

### 后端设置

1. 进入后端目录：
```bash
cd backend
```

2. 创建虚拟环境：
```bash
python -m venv venv
```

3. 激活虚拟环境：
- Windows:
```bash
.\venv\Scripts\activate
```
- Linux/Mac:
```bash
source venv/bin/activate
```

4. 安装依赖：
```bash
pip install -r requirements.txt
```

5. 运行后端服务：
```bash
python app.py
```

### 前端设置

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 运行开发服务器：
```bash
npm start
```

## 使用说明

1. 访问 http://localhost:3000 打开前端应用
2. 后端 API 服务运行在 http://localhost:5000

## API 端点

### 项目
- GET /api/projects - 获取所有项目
- POST /api/projects - 创建新项目

### 任务
- GET /api/tasks - 获取所有任务
- POST /api/tasks - 创建新任务

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT 