import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Typography,
  Space,
  Popconfirm
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, UserRole, UserFormValues } from '../types';

const { Title } = Typography;
const { Option } = Select;

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('用户删除失败');
    }
  };

  const handleSubmit = async (values: UserFormValues) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, values);
        message.success('用户更新成功');
      } else {
        // Set default password for new users
        const data = {
          ...values,
          password: '123456', // Default password
        };
        await api.post('/users', data);
        message.success('用户创建成功');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('用户保存失败');
    }
  };

  const handleResetPassword = async (values: { password: string }) => {
    if (!selectedUserId) return;
    
    try {
      await api.post(`/users/${selectedUserId}/reset-password`, {
        password: values.password
      });
      message.success('密码重置成功');
      setIsResetPasswordModalVisible(false);
      resetPasswordForm.resetFields();
      setSelectedUserId(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      message.error('密码重置失败');
    }
  };

  const getRoleColor = (role: UserRole): string => {
    const colors: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'red',
      [UserRole.PRODUCT_MANAGER]: 'blue',
      [UserRole.DEVELOPER]: 'green',
      [UserRole.TESTER]: 'orange',
      [UserRole.STAKEHOLDER]: 'purple',
    };
    return colors[role];
  };

  const getRoleText = (role: UserRole): string => {
    const texts: Record<UserRole, string> = {
      [UserRole.ADMIN]: '管理员',
      [UserRole.PRODUCT_MANAGER]: '产品经理',
      [UserRole.DEVELOPER]: '开发人员',
      [UserRole.TESTER]: '测试人员',
      [UserRole.STAKEHOLDER]: '利益相关者',
    };
    return texts[role];
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '姓名',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date?: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button 
            type="link" 
            onClick={() => {
              setSelectedUserId(record.id);
              setIsResetPasswordModalVisible(true);
            }}
          >
            重置密码
          </Button>
          <Popconfirm
            title="确定要删除此用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>用户管理</Title>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          创建用户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingUser ? '编辑用户' : '创建用户'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingUser(null);
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              {Object.entries(UserRole).map(([key, value]) => (
                <Option key={value} value={value}>
                  {getRoleText(value)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="department"
            label="部门"
            rules={[{ required: true, message: '请输入部门' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={isResetPasswordModalVisible}
        onCancel={() => {
          setIsResetPasswordModalVisible(false);
          resetPasswordForm.resetFields();
          setSelectedUserId(null);
        }}
        onOk={() => resetPasswordForm.submit()}
        width={400}
      >
        <Form
          form={resetPasswordForm}
          layout="vertical"
          onFinish={handleResetPassword}
        >
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6位' }
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement; 