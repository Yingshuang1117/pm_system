import React from 'react';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import message from 'antd/lib/message';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string; confirmPassword: string; name: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    try {
      await register(values.email, values.password, values.name);
      message.success('Registration successful');
      navigate('/login');
    } catch (error) {
      message.error('Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto' }}>
      <Card title="Register">
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input placeholder="Name" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Register
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Register; 