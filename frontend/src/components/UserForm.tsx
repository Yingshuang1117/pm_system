import React from 'react';
import { Form, Input, Select, Switch, Modal, message } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { ModalProps } from 'antd/es/modal';
import type { FormProps } from 'antd/es/form';
import type { InputProps } from 'antd/es/input';
import type { SelectProps } from 'antd/es/select';
import { User, UserFormData, UserRole } from '../types';
import { userService } from '../services/userService';

interface UserFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues?: User;
}

const UserForm: React.FC<UserFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  initialValues
}) => {
  const [form] = Form.useForm();
  const isEdit = !!initialValues;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit) {
        await userService.updateUser(initialValues.id, values);
        message.success('User updated successfully');
      } else {
        await userService.createUser(values);
        message.success('User created successfully');
      }
      form.resetFields();
      onSuccess();
    } catch (error) {
      message.error('An error occurred while saving the user');
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit User' : 'Create User'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please input username!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[{ required: true, message: 'Please input full name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please input email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="department"
          label="Department"
          rules={[{ required: true, message: 'Please input department!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: 'Please select role!' }]}
        >
          <Select>
            <Select.Option value={UserRole.ADMIN}>Admin</Select.Option>
            <Select.Option value={UserRole.USER}>User</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Status"
          valuePropName="checked"
        >
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input password!' }]}
          >
            <Input.Password />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default UserForm; 