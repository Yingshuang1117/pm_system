import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Input,
  Select,
  DatePicker,
  Tag,
  message,
  Form
} from 'antd';
import Space from 'antd/es/space';
import Typography from 'antd/es/typography';
import type { ColumnsType } from 'antd/es/table';
import TextArea from 'antd/es/input/TextArea';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Requirement,
  RequirementStatus,
  Project,
  ProjectStatus
} from '../types';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

interface RequirementFormValues {
  code: string;
  description: string;
  requestor: string;
  department: string;
  requestDate: moment.Moment;
  status: RequirementStatus;
}

const RequirementPool: React.FC = () => {
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
      ...requirement,
      requestDate: requirement.requestDate ? moment(requirement.requestDate) : undefined
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
        requestDate: values.requestDate ? values.requestDate.format('YYYY-MM-DD') : undefined
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '待排期': 'default',
      '已立项': 'processing',
      '已实现': 'success',
      '暂搁置': 'warning',
      '取消': 'error'
    };
    return colors[status] || 'default';
  };

  const columns: ColumnsType<Requirement> = [
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
      title: '需求提出人',
      dataIndex: 'requestor',
      key: 'requestor',
    },
    {
      title: '需求提出部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '需求提出时间',
      dataIndex: 'requestDate',
      key: 'requestDate',
    },
    {
      title: '需求排期',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: '项目编号',
      dataIndex: 'projectId',
      key: 'projectId',
      render: (projectId: string | null) => projectId || '-',
    },
    {
      title: '项目状态',
      dataIndex: 'projectStatus',
      key: 'projectStatus',
      render: (projectStatus: string | null) => projectStatus || '-',
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
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="requirement-pool">
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
        width={800}
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
            name="requestor"
            label="需求提出人"
            rules={[{ required: true, message: '请输入需求提出人' }]}
          >
            <Input placeholder="请输入需求提出人" />
          </Form.Item>
          <Form.Item
            name="department"
            label="需求提出部门"
            rules={[{ required: true, message: '请输入需求提出部门' }]}
          >
            <Input placeholder="请输入需求提出部门" />
          </Form.Item>
          <Form.Item
            name="requestDate"
            label="需求提出时间"
            rules={[{ required: true, message: '请选择需求提出时间' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="需求排期"
            rules={[{ required: true, message: '请选择需求排期' }]}
          >
            <Select placeholder="请选择需求排期">
              <Option value="待排期">待排期</Option>
              <Option value="已立项">已立项</Option>
              <Option value="已实现">已实现</Option>
              <Option value="暂搁置">暂搁置</Option>
              <Option value="取消">取消</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RequirementPool; 