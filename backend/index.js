const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { parse } = require('csv-parse');
const XLSX = require('xlsx');
const db = require('./utils/db');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key';

// 添加 CORS 配置
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept',
    'X-Requested-With',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Disposition']
}));

app.use(express.json());

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 检查文件类型
    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      return cb(new Error('只允许上传 Excel 文件!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为 5MB
  }
});

// 验证 token 的中间件
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await db.findOne(
      'SELECT * FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: '无效的认证令牌' });
  }
};

// 登录接口
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    
    const user = await db.findOne(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    console.log('User found:', user);

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    console.log('Comparing passwords:', {
      provided: password,
      stored: user.password
    });

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password');
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Token generated:', {
      token,
      userId: user.id,
      username: user.username,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

// 注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, department } = req.body;

    // 验证必填字段
    if (!email || !password || !name) {
      return res.status(400).json({ message: '邮箱、密码和姓名为必填项' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '邮箱格式不正确' });
    }

    // 检查邮箱是否已存在
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await db.query(
      'INSERT INTO users (username, name, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)',
      [email, name, email, hashedPassword, 'DEVELOPER', department || null]
    );

    res.status(201).json({
      message: '注册成功',
      user: {
        id: result.insertId,
        email,
        name,
        department,
        role: 'DEVELOPER'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '注册失败，请稍后重试' });
  }
});

// 获取当前用户信息
app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const { id, username, role, department } = req.user;
    res.json({
      id,
      username,
      role,
      department
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

// 获取需求列表
app.get('/api/requirements', verifyToken, async (req, res) => {
  try {
    const requirements = await db.query(
      'SELECT * FROM requirements ORDER BY id DESC',
      []
    );
    res.json(requirements);
  } catch (error) {
    console.error('Get requirements error:', error);
    res.status(500).json({ message: '获取需求列表失败' });
  }
});

// 创建需求
app.post('/api/requirements', verifyToken, async (req, res) => {
  try {
    const requirement = req.body;
    const result = await db.insert('requirements', requirement);
    
    if (result.affectedRows === 1) {
      res.json({ success: true, message: '需求创建成功' });
    } else {
      res.status(500).json({ message: '需求创建失败' });
    }
  } catch (error) {
    console.error('Create requirement error:', error);
    res.status(500).json({ message: '需求创建失败' });
  }
});

// 更新需求
app.put('/api/requirements/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requirement = req.body;
    
    const result = await db.update('requirements', requirement, { id });
    
    if (result.affectedRows === 1) {
      res.json({ success: true, message: '需求更新成功' });
    } else {
      res.status(404).json({ message: '需求不存在' });
    }
  } catch (error) {
    console.error('Update requirement error:', error);
    res.status(500).json({ message: '需求更新失败' });
  }
});

// 删除需求
app.delete('/api/requirements/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查需求是否存在
    const requirement = await db.findOne(
      'SELECT * FROM requirements WHERE id = ?',
      [id]
    );
    
    if (!requirement) {
      return res.status(404).json({ message: '需求不存在' });
    }

    // 如果需求已经关联到项目，需要先解除关联
    if (requirement.project_id) {
      await db.remove('project_requirements', {
        requirement_id: id
      });
    }

    // 删除需求
    const result = await db.remove('requirements', { id });
    
    if (result.affectedRows === 1) {
      res.json({ success: true, message: '需求删除成功' });
    } else {
      res.status(500).json({ message: '需求删除失败' });
    }
  } catch (error) {
    console.error('Delete requirement error:', error);
    res.status(500).json({ message: '需求删除失败' });
  }
});

// 项目管理 API
// 获取所有项目
app.get('/api/projects', verifyToken, async (req, res) => {
  try {
    const projects = await db.query(
      'SELECT * FROM projects ORDER BY id DESC',
      []
    );
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: '获取项目列表失败' });
  }
});

// 获取单个项目
app.get('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await db.findOne(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );
    
    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: '获取项目信息失败' });
  }
});

// 创建项目
app.post('/api/projects', verifyToken, async (req, res) => {
  try {
    const { name, code, status, launch_time } = req.body;
    
    // 创建项目
    const result = await db.insert('projects', {
      name,
      code,
      status: status || '需求设计',
      launch_time
    });
    
    if (result.affectedRows === 1) {
      res.json({ success: true, message: '项目创建成功' });
    } else {
      res.status(500).json({ message: '项目创建失败' });
    }
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: '项目创建失败' });
  }
});

// 更新项目
app.put('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, launch_time } = req.body;
    
    // 更新项目
    const result = await db.update('projects', 
      { name, status, launch_time },
      { id }
    );
    
    if (result.affectedRows === 1) {
      // 如果项目状态改变，同时更新关联需求的状态
      if (status) {
        await db.query(
          'UPDATE requirements SET project_status = ? WHERE project_id = ?',
          [status, id]
        );
      }
      
      res.json({ success: true, message: '项目更新成功' });
    } else {
      res.status(404).json({ message: '项目不存在' });
    }
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: '项目更新失败' });
  }
});

// 删除项目
app.delete('/api/projects/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查项目是否存在
    const project = await db.findOne(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );
    
    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }
    
    // 更新关联需求的状态
    await db.query(
      'UPDATE requirements SET status = ?, project_id = NULL, project_status = NULL WHERE project_id = ?',
      ['待排期', id]
    );
    
    // 删除项目-需求关联
    await db.remove('project_requirements', { project_id: id });
    
    // 删除项目
    const result = await db.remove('projects', { id });
    
    if (result.affectedRows === 1) {
      res.json({ success: true, message: '项目删除成功' });
    } else {
      res.status(500).json({ message: '项目删除失败' });
    }
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: '项目删除失败' });
  }
});

// 获取仪表盘数据
app.get('/api/dashboard', verifyToken, async (req, res) => {
  try {
    // 获取需求总数
    const [{ total_requirements }] = await db.query(
      'SELECT COUNT(*) as total_requirements FROM requirements',
      []
    );
    
    // 获取项目总数
    const [{ total_projects }] = await db.query(
      'SELECT COUNT(*) as total_projects FROM projects',
      []
    );
    
    // 按状态统计需求
    const requirementsByStatus = await db.query(
      'SELECT status, COUNT(*) as count FROM requirements GROUP BY status',
      []
    );
    
    // 按状态统计项目
    const projectsByStatus = await db.query(
      'SELECT status, COUNT(*) as count FROM projects GROUP BY status',
      []
    );
    
    res.json({
      totalRequirements: total_requirements,
      totalProjects: total_projects,
      requirementsByStatus: requirementsByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {}),
      projectsByStatus: projectsByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ message: '获取仪表盘数据失败' });
  }
});

// 导入需求
app.post('/api/requirements/import', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要导入的文件' });
    }

    let records = [];
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();

    if (fileExt === 'csv') {
      // 处理 CSV 文件
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      let hasError = false;
      let errorMessage = '';

      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          try {
            if (!record['需求编号'] || !record['需求描述'] || !record['需求提出人'] || !record['需求提出部门']) {
              hasError = true;
              errorMessage = 'CSV文件格式不正确，请确保包含所有必需字段';
              parser.end();
              return;
            }

            records.push({
              code: record['需求编号'],
              description: record['需求描述'],
              requestor: record['需求提出人'],
              department: record['需求提出部门'],
              request_date: record['需求提出时间'] || new Date().toISOString().split('T')[0],
              status: record['需求排期'] || '待排期',
              created_at: new Date(),
              updated_at: new Date()
            });
          } catch (err) {
            hasError = true;
            errorMessage = '处理CSV数据时出错：' + err.message;
            parser.end();
            return;
          }
        }
      });

      parser.on('error', function(err) {
        hasError = true;
        errorMessage = '解析CSV文件时出错：' + err.message;
      });

      await new Promise((resolve, reject) => {
        parser.on('end', resolve);
        parser.write(req.file.buffer);
        parser.end();
      });

      if (hasError) {
        return res.status(400).json({ message: errorMessage });
      }
    } else {
      // 处理 Excel 文件
      try {
        const workbook = XLSX.read(req.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        for (const record of data) {
          if (!record['需求编号'] || !record['需求描述'] || !record['需求提出人'] || !record['需求提出部门']) {
            return res.status(400).json({ message: 'Excel文件格式不正确，请确保包含所有必需字段' });
          }

          records.push({
            code: record['需求编号'],
            description: record['需求描述'],
            requestor: record['需求提出人'],
            department: record['需求提出部门'],
            request_date: record['需求提出时间'] || new Date().toISOString().split('T')[0],
            status: record['需求排期'] || '待排期',
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      } catch (err) {
        return res.status(400).json({ message: '处理Excel文件时出错：' + err.message });
      }
    }

    if (records.length === 0) {
      return res.status(400).json({ message: '文件中没有有效的需求数据' });
    }

    // 批量插入需求
    for (const requirement of records) {
      await db.insert('requirements', requirement);
    }

    res.json({ 
      success: true, 
      message: `成功导入 ${records.length} 条需求数据`,
      count: records.length
    });

  } catch (error) {
    console.error('Import requirements error:', error);
    res.status(500).json({ message: '需求导入失败：' + error.message });
  }
});

// 获取用户列表
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, username, name, phone, email, role, department, created_at, updated_at FROM users',
      []
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// 创建用户
app.post('/api/users', verifyToken, async (req, res) => {
  try {
    const { username, name, phone, email, password, role, department } = req.body;

    // 检查用户名是否已存在
    const existingUser = await db.findOne(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await db.insert('users', {
      username,
      name,
      phone,
      email,
      password: hashedPassword,
      role,
      department,
      created_at: new Date(),
      updated_at: new Date()
    });

    if (result.affectedRows === 1) {
      res.json({ success: true, message: '用户创建成功' });
    } else {
      res.status(500).json({ message: '用户创建失败' });
    }
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: '用户创建失败' });
  }
});

// 更新用户
app.put('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, name, phone, email, role, department } = req.body;
    
    console.log('Updating user with data:', { id, username, name, phone, email, role, department });

    // 检查用户是否存在
    const user = await db.findOne(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查用户名和邮箱是否已被其他用户使用
    const existingUser = await db.findOne(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, id]
    );

    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 更新用户信息
    const result = await db.update('users', 
      { 
        username, 
        name, 
        phone, 
        email, 
        role, 
        department, 
        updated_at: new Date() 
      },
      { id }
    );

    console.log('Update result:', result);

    if (result.affectedRows === 1) {
      res.json({ success: true, message: '用户更新成功' });
    } else {
      res.status(500).json({ message: '用户更新失败' });
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: '用户更新失败' });
  }
});

// 删除用户
app.delete('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户是否存在
    const user = await db.findOne(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 不允许删除超级管理员
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: '不能删除超级管理员账号' });
    }

    // 删除用户
    const result = await db.remove('users', { id });

    if (result.affectedRows === 1) {
      res.json({ success: true, message: '用户删除成功' });
    } else {
      res.status(500).json({ message: '用户删除失败' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: '用户删除失败' });
  }
});

// 重置用户密码
app.post('/api/users/:id/reset-password', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // 检查用户是否存在
    const user = await db.findOne(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 更新密码
    const result = await db.update('users',
      { password: hashedPassword, updated_at: new Date() },
      { id }
    );

    if (result.affectedRows === 1) {
      res.json({ success: true, message: '密码重置成功' });
    } else {
      res.status(500).json({ message: '密码重置失败' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: '密码重置失败' });
  }
});

// 下载用户导入模板
app.get('/api/users/template', (req, res) => {
  try {
    // 创建工作簿和工作表
    const wb = XLSX.utils.book_new();
    
    // 示例数据
    const exampleData = [
      {
        '用户名': 'user1',
        '密码': 'password123',
        '角色': 'DEVELOPER',
        '姓名': '张三',
        '电话': '13800138000',
        '邮箱': 'zhangsan@example.com',
        '部门': '研发部'
      },
      {
        '用户名': 'user2',
        '密码': 'password123',
        '角色': 'TESTER',
        '姓名': '李四',
        '电话': '13800138001',
        '邮箱': 'lisi@example.com',
        '部门': '测试部'
      }
    ];

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exampleData);

    // 设置列宽
    ws['!cols'] = [
      { width: 15 }, // 用户名
      { width: 15 }, // 密码
      { width: 12 }, // 角色
      { width: 10 }, // 姓名
      { width: 15 }, // 电话
      { width: 25 }, // 邮箱
      { width: 15 }  // 部门
    ];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '用户导入模板');

    // 生成 buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="user_import_template.xlsx"');
    
    // 发送文件
    res.send(buf);
  } catch (error) {
    console.error('Generate template error:', error);
    res.status(500).json({ message: '生成模板失败' });
  }
});

// 导入用户
app.post('/api/users/import', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要导入的文件' });
    }

    let records = [];
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      try {
        const workbook = XLSX.read(req.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        for (const record of data) {
          if (!record['用户名'] || !record['密码'] || !record['角色']) {
            return res.status(400).json({ message: 'Excel文件格式不正确，必需字段：用户名、密码、角色' });
          }

          // 检查用户名是否已存在
          const existingUser = await db.findOne(
            'SELECT * FROM users WHERE username = ?',
            [record['用户名']]
          );

          if (existingUser) {
            continue; // 跳过已存在的用户
          }

          // 加密密码
          const hashedPassword = await bcrypt.hash(record['密码'], 10);

          records.push({
            username: record['用户名'],
            name: record['姓名'] || record['用户名'],
            phone: record['电话'] || '',
            email: record['邮箱'] || '',
            password: hashedPassword,
            role: record['角色'],
            department: record['部门'] || '',
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      } catch (err) {
        console.error('Excel processing error:', err);
        return res.status(400).json({ message: '处理Excel文件时出错：' + err.message });
      }
    } else {
      return res.status(400).json({ message: '只支持导入 Excel 文件 (.xlsx, .xls)' });
    }

    if (records.length === 0) {
      return res.status(400).json({ message: '文件中没有有效的用户数据或用户已存在' });
    }

    // 批量插入用户
    for (const user of records) {
      await db.insert('users', user);
    }

    res.json({ 
      success: true, 
      message: `成功导入 ${records.length} 个用户`,
      count: records.length
    });

  } catch (error) {
    console.error('Import users error:', error);
    res.status(500).json({ message: '用户导入失败：' + error.message });
  }
});

// 获取服务单元列表
app.get('/api/service-units', verifyToken, async (req, res) => {
  try {
    const serviceUnits = await db.query(`
      SELECT 
        su.id,
        su.name,
        su.leader_id,
        su.created_at,
        su.updated_at,
        u.name as leader_name,
        GROUP_CONCAT(DISTINCT m.user_id) as member_ids,
        GROUP_CONCAT(DISTINCT mu.name) as member_names
      FROM service_units su
      LEFT JOIN users u ON su.leader_id = u.id
      LEFT JOIN service_unit_members m ON su.id = m.service_unit_id
      LEFT JOIN users mu ON m.user_id = mu.id
      GROUP BY su.id
      ORDER BY su.id DESC
    `);

    // 格式化成员数据
    const formattedServiceUnits = serviceUnits.map(unit => ({
      ...unit,
      member_ids: unit.member_ids ? unit.member_ids.split(',').map(Number) : [],
      member_names: unit.member_names ? unit.member_names.split(',') : []
    }));

    res.json(formattedServiceUnits);
  } catch (error) {
    console.error('Get service units error:', error);
    res.status(500).json({ message: '获取服务单元列表失败' });
  }
});

// 获取未分配服务单元的用户
app.get('/api/unassigned-users', verifyToken, async (req, res) => {
  try {
    const users = await db.query(`
      SELECT id, name, username, department
      FROM users
      WHERE id NOT IN (SELECT user_id FROM service_unit_members)
      ORDER BY name
    `);
    res.json(users);
  } catch (error) {
    console.error('Get unassigned users error:', error);
    res.status(500).json({ message: '获取未分配用户列表失败' });
  }
});

// 创建服务单元
app.post('/api/service-units', verifyToken, async (req, res) => {
  let connection;
  try {
    const { name, leader_id, member_ids } = req.body;

    // 检查名称是否已存在
    const existingUnit = await db.findOne(
      'SELECT * FROM service_units WHERE name = ?',
      [name]
    );

    if (existingUnit) {
      return res.status(400).json({ message: '服务单元名称已存在' });
    }

    // 检查成员是否已在其他服务单元中
    if (member_ids && member_ids.length > 0) {
      const assignedMembers = await db.query(
        'SELECT user_id FROM service_unit_members WHERE user_id IN (?)',
        [member_ids]
      );

      if (assignedMembers.length > 0) {
        return res.status(400).json({ message: '部分成员已在其他服务单元中' });
      }
    }

    // 获取数据库连接并开始事务
    connection = await db.getConnection();
    await db.beginTransaction(connection);

    try {
      // 创建服务单元
      const [result] = await connection.execute(
        'INSERT INTO service_units (name, leader_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [name, leader_id]
      );

      // 添加成员关联
      if (member_ids && member_ids.length > 0) {
        for (const userId of member_ids) {
          await connection.execute(
            'INSERT INTO service_unit_members (service_unit_id, user_id, created_at) VALUES (?, ?, NOW())',
            [result.insertId, userId]
          );
        }
      }

      await db.commit(connection);
      res.json({ success: true, message: '服务单元创建成功' });
    } catch (error) {
      await db.rollback(connection);
      throw error;
    }
  } catch (error) {
    console.error('Create service unit error:', error);
    res.status(500).json({ message: '服务单元创建失败' });
  } finally {
    if (connection) {
      db.releaseConnection(connection);
    }
  }
});

// 更新服务单元
app.put('/api/service-units/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, leader_id, member_ids } = req.body;

    // 检查服务单元是否存在
    const existingUnit = await db.findOne(
      'SELECT * FROM service_units WHERE id = ?',
      [id]
    );

    if (!existingUnit) {
      return res.status(404).json({ message: '服务单元不存在' });
    }

    // 检查名称是否已被其他服务单元使用
    const duplicateName = await db.findOne(
      'SELECT * FROM service_units WHERE name = ? AND id != ?',
      [name, id]
    );

    if (duplicateName) {
      return res.status(400).json({ message: '服务单元名称已存在' });
    }

    // 开始事务
    await db.beginTransaction();

    try {
      // 更新服务单元基本信息
      await db.update('service_units',
        {
          name,
          leader_id,
          updated_at: new Date()
        },
        { id }
      );

      // 删除原有成员关联
      await db.remove('service_unit_members', { service_unit_id: id });

      // 添加新的成员关联
      for (const userId of member_ids) {
        await db.insert('service_unit_members', {
          service_unit_id: id,
          user_id: userId,
          created_at: new Date()
        });
      }

      await db.commit();
      res.json({ success: true, message: '服务单元更新成功' });
    } catch (error) {
      await db.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Update service unit error:', error);
    res.status(500).json({ message: '服务单元更新失败' });
  }
});

// 删除服务单元
app.delete('/api/service-units/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查服务单元是否存在
    const existingUnit = await db.findOne(
      'SELECT * FROM service_units WHERE id = ?',
      [id]
    );

    if (!existingUnit) {
      return res.status(404).json({ message: '服务单元不存在' });
    }

    // 开始事务
    await db.beginTransaction();

    try {
      // 删除成员关联
      await db.remove('service_unit_members', { service_unit_id: id });

      // 删除服务单元
      await db.remove('service_units', { id });

      await db.commit();
      res.json({ success: true, message: '服务单元删除成功' });
    } catch (error) {
      await db.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Delete service unit error:', error);
    res.status(500).json({ message: '服务单元删除失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 