import React, { useState } from 'react';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import message from 'antd/lib/message';
import { useAuth } from '../context/AuthContext';

const UserProfile: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleProfileUpdate = async (values: any) => {
    try {
      await updateProfile(values);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      await changePassword(values.oldPassword, values.newPassword);
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      message.error('Failed to change password');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card title="Profile Information" style={{ marginBottom: 24 }}>
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={user || {}}
          onFinish={handleProfileUpdate}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Change Password">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="oldPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please input your current password!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            label="Confirm New Password"
            rules={[
              { required: true, message: 'Please confirm your new password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UserProfile; 