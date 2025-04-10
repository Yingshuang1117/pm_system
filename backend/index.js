const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key';

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 模拟用户数据
const users = [
  {
    id: 1,
    email: 'admin@example.com',
    password: '$2a$10$rJ7.Qp1yX3Yw1yX3Yw1yXOYw1yX3Yw1yX3Yw1yX3Yw1yX3Yw1yX3Y',
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: 2,
    email: 'user@example.com',
    password: '$2a$10$rJ7.Qp1yX3Yw1yX3Yw1yXOYw1yX3Yw1yX3Yw1yX3Yw1yX3Yw1yX3Y',
    role: 'user',
    name: 'Regular User'
  }
];

// 模拟需求数据
let requirements = [
  {
    id: 1,
    code: 'REQ-001',
    description: '用户登录功能',
    requestor: '张三',
    department: '市场部',
    requestDate: '2023-01-15',
    status: '待排期',
    projectId: null,
    projectStatus: null
  },
  {
    id: 2,
    code: 'REQ-002',
    description: '用户注册功能',
    requestor: '李四',
    department: '销售部',
    requestDate: '2023-02-20',
    status: '已立项',
    projectId: 'PRJ-001',
    projectStatus: '需求设计'
  },
  {
    id: 3,
    code: 'REQ-003',
    description: '产品列表展示',
    requestor: '王五',
    department: '产品部',
    requestDate: '2023-03-10',
    status: '待排期',
    projectId: null,
    projectStatus: null
  }
];

// 模拟项目数据
let projects = [
  {
    id: 'PRJ-001',
    name: '用户系统升级',
    createTime: '2023-02-25',
    status: '需求设计',
    launchTime: null,
    requirementIds: [2]
  }
];

// 模拟产品数据
const products = [
  {
    id: 1,
    name: 'Product 1',
    description: 'This is product 1',
    price: 99.99,
    category: 'Electronics'
  },
  {
    id: 2,
    name: 'Product 2',
    description: 'This is product 2',
    price: 149.99,
    category: 'Clothing'
  },
  {
    id: 3,
    name: 'Product 3',
    description: 'This is product 3',
    price: 199.99,
    category: 'Home & Garden'
  }
];

// 登录路由
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 简化密码验证逻辑，直接比较密码
    // 在实际应用中，应该使用 bcrypt.compare()
    if (password !== (email === 'admin@example.com' ? 'admin123' : 'user123')) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 获取当前用户信息
app.get('/api/me', (req, res) => {
  // 在实际应用中，应该从请求头中获取 token 并验证
  // 这里简化处理，直接返回第一个用户
  const user = users[0];
  res.json({ 
    id: user.id, 
    email: user.email, 
    name: user.name,
    role: user.role 
  });
});

// 需求池管理 API
// 获取所有需求
app.get('/api/requirements', (req, res) => {
  res.json(requirements);
});

// 获取单个需求
app.get('/api/requirements/:id', (req, res) => {
  const requirement = requirements.find(r => r.id === parseInt(req.params.id));
  if (!requirement) {
    return res.status(404).json({ message: 'Requirement not found' });
  }
  res.json(requirement);
});

// 创建需求
app.post('/api/requirements', (req, res) => {
  const { code, description, requestor, department, requestDate, status } = req.body;
  
  // 生成新的需求 ID
  const newId = Math.max(...requirements.map(r => r.id)) + 1;
  
  const newRequirement = {
    id: newId,
    code,
    description,
    requestor,
    department,
    requestDate,
    status: status || '待排期',
    projectId: null,
    projectStatus: null
  };
  
  requirements.push(newRequirement);
  res.status(201).json(newRequirement);
});

// 更新需求
app.put('/api/requirements/:id', (req, res) => {
  const { code, description, requestor, department, requestDate, status, projectId, projectStatus } = req.body;
  const requirement = requirements.find(r => r.id === parseInt(req.params.id));
  
  if (!requirement) {
    return res.status(404).json({ message: 'Requirement not found' });
  }
  
  requirement.code = code || requirement.code;
  requirement.description = description || requirement.description;
  requirement.requestor = requestor || requirement.requestor;
  requirement.department = department || requirement.department;
  requirement.requestDate = requestDate || requirement.requestDate;
  requirement.status = status || requirement.status;
  requirement.projectId = projectId !== undefined ? projectId : requirement.projectId;
  requirement.projectStatus = projectStatus !== undefined ? projectStatus : requirement.projectStatus;
  
  res.json(requirement);
});

// 删除需求
app.delete('/api/requirements/:id', (req, res) => {
  const index = requirements.findIndex(r => r.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: 'Requirement not found' });
  }
  
  requirements.splice(index, 1);
  res.status(204).send();
});

// 项目管理 API
// 获取所有项目
app.get('/api/projects', (req, res) => {
  res.json(projects);
});

// 获取单个项目
app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  res.json(project);
});

// 创建项目
app.post('/api/projects', (req, res) => {
  const { name, requirementIds, status } = req.body;
  
  // 生成新的项目 ID
  const newId = 'PRJ-' + String(projects.length + 1).padStart(3, '0');
  
  // 更新关联需求的状态
  const updatedRequirements = requirements.map(req => {
    if (requirementIds.includes(req.id)) {
      return {
        ...req,
        status: '已立项',
        projectId: newId,
        projectStatus: status || '新建未处理'
      };
    }
    return req;
  });
  
  requirements = updatedRequirements;
  
  const newProject = {
    id: newId,
    name,
    createTime: new Date().toISOString().split('T')[0],
    status: status || '新建未处理',
    launchTime: null,
    requirementIds
  };
  
  projects.push(newProject);
  res.status(201).json(newProject);
});

// 更新项目
app.put('/api/projects/:id', (req, res) => {
  const { name, status, launchTime } = req.body;
  const project = projects.find(p => p.id === req.params.id);
  
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  project.name = name || project.name;
  project.status = status || project.status;
  project.launchTime = launchTime || project.launchTime;
  
  // 更新关联需求的项目状态
  requirements = requirements.map(req => {
    if (project.requirementIds.includes(req.id)) {
      return {
        ...req,
        projectStatus: project.status
      };
    }
    return req;
  });
  
  res.json(project);
});

// 删除项目
app.delete('/api/projects/:id', (req, res) => {
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // 更新关联需求的状态
  const project = projects[index];
  requirements = requirements.map(req => {
    if (project.requirementIds.includes(req.id)) {
      return {
        ...req,
        status: '待排期',
        projectId: null,
        projectStatus: null
      };
    }
    return req;
  });
  
  projects.splice(index, 1);
  res.status(204).send();
});

// 获取产品列表
app.get('/api/products', (req, res) => {
  res.json(products);
});

// 获取单个产品
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

// 创建产品
app.post('/api/products', (req, res) => {
  const { name, description, price, category } = req.body;
  const newProduct = {
    id: products.length + 1,
    name,
    description,
    price,
    category
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// 更新产品
app.put('/api/products/:id', (req, res) => {
  const { name, description, price, category } = req.body;
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.category = category || product.category;
  
  res.json(product);
});

// 删除产品
app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  products.splice(index, 1);
  res.status(204).send();
});

// 获取仪表盘数据
app.get('/api/dashboard', (req, res) => {
  // 计算统计数据
  const totalRequirements = requirements.length;
  const totalProjects = projects.length;
  
  // 按状态统计需求
  const requirementsByStatus = {
    '待排期': requirements.filter(r => r.status === '待排期').length,
    '已立项': requirements.filter(r => r.status === '已立项').length,
    '已完成': requirements.filter(r => r.status === '已完成').length
  };
  
  // 按状态统计项目
  const projectsByStatus = {
    '需求设计': projects.filter(p => p.status === '需求设计').length,
    '开发中': projects.filter(p => p.status === '开发中').length,
    '已完成': projects.filter(p => p.status === '已完成').length
  };
  
  res.json({
    totalRequirements,
    totalProjects,
    requirementsByStatus,
    projectsByStatus
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 