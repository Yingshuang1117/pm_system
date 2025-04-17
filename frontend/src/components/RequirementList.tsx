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
  Popconfirm,
  Upload
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Requirement,
  RequirementStatus,
  UserRole
} from '../types';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import * as XLSX from 'xlsx';

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
    if (!id) {
      message.error('无效的需求ID');
      return;
    }
    
    try {
      const response = await api.delete(`/api/requirements/${id}`);
      if (response.data.success) {
        message.success('删除成功');
        fetchRequirements();
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const response = await api.post('/api/requirements', values);
      if (response.data.success) {
        message.success('需求创建成功');
        setIsModalVisible(false);
        form.resetFields();
        fetchRequirements();
      } else {
        message.error(response.data.message || '需求创建失败');
      }
    } catch (error: any) {
      console.error('Create error:', error);
      message.error(error.response?.data?.message || '需求创建失败');
    }
  };

  const handleImport = async (info: any) => {
    const { file } = info;
    const formData = new FormData();
    formData.append('file', file.originFileObj);

    try {
      const response = await api.post('/api/requirements/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        message.success('导入成功');
        await fetchRequirements();
      } else {
        message.error(response.data.message || '导入失败');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      message.error(error.response?.data?.message || '导入失败');
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

  const handleDownloadTemplate = () => {
    try {
      const template = [
        {
          '需求编号': 'REQ-001',
          '需求描述': '示例需求描述',
          '需求提出人': '张三',
          '需求提出部门': '市场部',
          '需求提出时间': '2024-04-10',
          '需求排期': '待排期'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '需求导入模板');
      XLSX.writeFile(wb, '需求导入模板.xlsx');
    } catch (error) {
      console.error('Error downloading template:', error);
      message.error('下载模板失败');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.csv,.xlsx,.xls',
    beforeUpload: (file) => {
      const isValidFormat = file.type === 'text/csv' || 
                          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                          file.type === 'application/vnd.ms-excel' ||
                          file.name.endsWith('.csv') ||
                          file.name.endsWith('.xlsx') ||
                          file.name.endsWith('.xls');
      
      if (!isValidFormat) {
        message.error('只能上传 CSV 或 Excel 文件！');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await api.post('/api/requirements/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          message.success(response.data.message || '导入成功');
          await fetchRequirements();
          onSuccess?.(response.data);
        } else {
          message.error(response.data.message || '导入失败');
          onError?.(new Error(response.data.message));
        }
      } catch (error: any) {
        console.error('Import error:', error);
        message.error(error.response?.data?.message || '导入失败');
        onError?.(error);
      }
    },
    showUploadList: false,
  };

  const hasImportPermission = () => {
    return user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;
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
      dataIndex: 'requestor',
      key: 'requestor',
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
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条需求吗？"
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>需求列表</div>
        <Space>
          {hasImportPermission() && (
            <>
              <Button 
                type="default" 
                icon={<DownloadOutlined />} 
                onClick={handleDownloadTemplate}
              >
                下载导入模板
              </Button>
              <Upload {...uploadProps}>
                <Button 
                  type="default" 
                  icon={<UploadOutlined />}
                >
                  导入需求
                </Button>
              </Upload>
            </>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新建需求
          </Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={requirements}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title={editingRequirement ? '编辑需求' : '新建需求'}
        open={isModalVisible}
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