const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { parse } = require('csv-parse');
const xlsx = require('xlsx');
const db = require('./utils/db');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key';

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 检查文件类型
    if (!file.originalname.match(/\.(csv|xlsx|xls)$/)) {
      return cb(new Error('只允许上传 CSV 或 Excel 文件!'), false);
    }
    cb(null, true);
  }
});

// 添加 CORS 配置
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());

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
        const workbook = xlsx.read(req.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

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

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 