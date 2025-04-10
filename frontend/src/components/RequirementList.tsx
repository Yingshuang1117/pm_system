import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  message,
  Space,
  Popconfirm
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Requirement,
  RequirementStatus
} from '../types';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

interface RequirementFormValues {
  code: string;
  description: string;
  requester: string;
  department: string;
  requestDate: moment.Moment;
  status: RequirementStatus;
}

const RequirementList: React.FC = () => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/requirements');
      setRequirements(response.data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      message.error('获取需求列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRequirement(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    form.setFieldsValue({
      code: requirement.code,
      description: requirement.description,
      requester: requirement.requester,
      department: requirement.department,
      requestDate: moment(requirement.requestDate),
      status: requirement.status
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/requirements/${id}`);
      message.success('需求删除成功');
      fetchRequirements();
    } catch (error) {
      console.error('Error deleting requirement:', error);
      message.error('需求删除失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        requestDate: values.requestDate.format('YYYY-MM-DD')
      };

      if (editingRequirement) {
        await api.put(`/api/requirements/${editingRequirement.id}`, formattedValues);
        message.success('需求更新成功');
      } else {
        await api.post('/api/requirements', formattedValues);
        message.success('需求创建成功');
      }

      setIsModalVisible(false);
      fetchRequirements();
    } catch (error) {
      console.error('Error saving requirement:', error);
      message.error('保存需求失败');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const getStatusColor = (status: RequirementStatus) => {
    const colors: Record<RequirementStatus, string> = {
      [RequirementStatus.PENDING_SCHEDULE]: 'default',
      [RequirementStatus.IN_PROJECT]: 'processing',
      [RequirementStatus.COMPLETED]: 'success'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: '需求编号',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '需求描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '提出人',
      dataIndex: 'requester',
      key: 'requester',
    },
    {
      title: '提出部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '提出时间',
      dataIndex: 'requestDate',
      key: 'requestDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: RequirementStatus) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Requirement) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个需求吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="requirement-list">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新建需求
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={requirements}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title={editingRequirement ? '编辑需求' : '新建需求'}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="code"
            label="需求编号"
            rules={[{ required: true, message: '请输入需求编号' }]}
          >
            <Input placeholder="请输入需求编号" />
          </Form.Item>
          <Form.Item
            name="description"
            label="需求描述"
            rules={[{ required: true, message: '请输入需求描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入需求描述" />
          </Form.Item>
          <Form.Item
            name="requester"
            label="提出人"
            rules={[{ required: true, message: '请输入提出人' }]}
          >
            <Input placeholder="请输入提出人" />
          </Form.Item>
          <Form.Item
            name="department"
            label="提出部门"
            rules={[{ required: true, message: '请输入提出部门' }]}
          >
            <Input placeholder="请输入提出部门" />
          </Form.Item>
          <Form.Item
            name="requestDate"
            label="提出时间"
            rules={[{ required: true, message: '请选择提出时间' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value={RequirementStatus.PENDING_SCHEDULE}>待排期</Option>
              <Option value={RequirementStatus.IN_PROJECT}>已排期</Option>
              <Option value={RequirementStatus.COMPLETED}>已完成</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RequirementList; 