import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { User, UserRole } from '../types';
import { userService } from '../services/userService';
import UserForm from './UserForm';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await userService.deleteUser(id);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleResetPassword = async (id: number, newPassword: string) => {
    try {
      await userService.resetPassword(id, newPassword);
      message.success('Password reset successfully');
      setResetPasswordModalVisible(false);
    } catch (error) {
      message.error('Failed to reset password');
    }
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={role === UserRole.ADMIN ? 'red' : 'blue'}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            icon={<KeyOutlined />}
            onClick={() => {
              setSelectedUser(record);
              setResetPasswordModalVisible(true);
            }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Are you sure you want to delete this user?',
                content: 'This action cannot be undone.',
                onOk: () => handleDelete(record.id),
              });
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => {
          setSelectedUser(null);
          setModalVisible(true);
        }}>
          Add User
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
      />

      <UserForm
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setModalVisible(false);
          setSelectedUser(null);
          fetchUsers();
        }}
        initialValues={selectedUser}
      />

      <Modal
        title="Reset Password"
        open={resetPasswordModalVisible}
        onCancel={() => setResetPasswordModalVisible(false)}
        onOk={() => {
          if (selectedUser) {
            const newPassword = Math.random().toString(36).slice(-8);
            handleResetPassword(selectedUser.id, newPassword);
          }
        }}
      >
        <p>Are you sure you want to reset the password for {selectedUser?.username}?</p>
        <p>A new random password will be generated and can be changed by the user upon next login.</p>
      </Modal>
    </div>
  );
};

export default UserList; 