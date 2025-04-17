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
import { User, UserRole } from '../types/index';
import { ColumnsType } from 'antd/es/table';

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

  const roleOptions = [
    { label: '超级管理员', value: UserRole.SUPER_ADMIN },
    { label: '管理员', value: UserRole.ADMIN },
    { label: '产品经理', value: UserRole.PRODUCT_MANAGER },
    { label: '开发人员', value: UserRole.DEVELOPER },
    { label: '测试人员', value: UserRole.TESTER },
    { label: '干系人', value: UserRole.STAKEHOLDER }
  ];

  const roleColors: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: '#722ed1',
    [UserRole.ADMIN]: '#1890ff',
    [UserRole.PRODUCT_MANAGER]: '#13c2c2',
    [UserRole.DEVELOPER]: '#52c41a',
    [UserRole.TESTER]: '#faad14',
    [UserRole.STAKEHOLDER]: '#eb2f96'
  };

  const roleTexts: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: '超级管理员',
    [UserRole.ADMIN]: '管理员',
    [UserRole.PRODUCT_MANAGER]: '产品经理',
    [UserRole.DEVELOPER]: '开发人员',
    [UserRole.TESTER]: '测试人员',
    [UserRole.STAKEHOLDER]: '干系人'
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(Array.isArray(response.data) ? response.data : response.data.users || []);
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
      department: user.department,
      role: user.role
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

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, values);
        message.success('用户更新成功');
      } else {
        await api.post('/users', values);
        message.success('用户创建成功');
      }
      form.resetFields();
      setEditingUser(null);
      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('操作失败');
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

  const columns: ColumnsType<User> = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => roleTexts[role]
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" onClick={() => {
            setSelectedUserId(record.id);
            setIsResetPasswordModalVisible(true);
          }}>
            重置密码
          </Button>
          <Popconfirm
            title="确定要删除此用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>用户管理</Title>
        <Button type="primary" onClick={() => {
          setEditingUser(null);
          form.resetFields();
          setIsModalVisible(true);
        }}>
          添加用户
        </Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={users}
        rowKey="id"
      />

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingUser(null);
        }}
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
            <Input />
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
            name="department"
            label="部门"
            rules={[{ required: true, message: '请输入部门' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={isResetPasswordModalVisible}
        onOk={() => resetPasswordForm.submit()}
        onCancel={() => {
          setIsResetPasswordModalVisible(false);
          resetPasswordForm.resetFields();
          setSelectedUserId(null);
        }}
      >
        <Form
          form={resetPasswordForm}
          layout="vertical"
          onFinish={handleResetPassword}
        >
          <Form.Item
            name="password"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement; 