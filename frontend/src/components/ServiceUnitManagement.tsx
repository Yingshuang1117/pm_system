import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Space,
  Popconfirm,
  Tag
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { FormInstance } from 'antd/es/form';
import { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

interface ServiceUnit {
  id: number;
  name: string;
  leader_id: number;
  leader_name: string;
  member_ids: number[];
  member_names: string[];
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  department: string;
}

const ServiceUnitManagement: React.FC = () => {
  const { user } = useAuth();
  const [serviceUnits, setServiceUnits] = useState<ServiceUnit[]>([]);
  const [unassignedUsers, setUnassignedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ServiceUnit | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchServiceUnits();
    fetchUnassignedUsers();
  }, []);

  const fetchServiceUnits = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/service-units');
      setServiceUnits(response.data);
    } catch (error) {
      console.error('Error fetching service units:', error);
      message.error('获取服务单元列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedUsers = async () => {
    try {
      const response = await api.get('/api/unassigned-users');
      setUnassignedUsers(response.data);
    } catch (error) {
      console.error('Error fetching unassigned users:', error);
      message.error('获取未分配用户列表失败');
    }
  };

  const handleEdit = (unit: ServiceUnit) => {
    setEditingUnit(unit);
    form.setFieldsValue({
      name: unit.name,
      leader_id: unit.leader_id,
      member_ids: unit.member_ids
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/service-units/${id}`);
      message.success('服务单元删除成功');
      fetchServiceUnits();
      fetchUnassignedUsers();
    } catch (error) {
      console.error('Error deleting service unit:', error);
      message.error('服务单元删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUnit) {
        await api.put(`/api/service-units/${editingUnit.id}`, values);
        message.success('服务单元更新成功');
      } else {
        await api.post('/api/service-units', values);
        message.success('服务单元创建成功');
      }
      form.resetFields();
      setEditingUnit(null);
      setIsModalVisible(false);
      fetchServiceUnits();
      fetchUnassignedUsers();
    } catch (error: any) {
      console.error('Operation error:', error);
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns: ColumnsType<ServiceUnit> = [
    {
      title: '服务单元名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '负责人',
      dataIndex: 'leader_name',
      key: 'leader_name',
    },
    {
      title: '成员',
      dataIndex: 'member_names',
      key: 'member_names',
      render: (members: string[]) => (
        <Space size={[0, 8]} wrap>
          {members.map((member, index) => (
            <Tag key={index} color="blue">{member}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除此服务单元吗？"
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
        <Title level={2}>服务单元管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingUnit(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          添加服务单元
        </Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={serviceUnits}
        rowKey="id"
      />

      <Modal
        title={editingUnit ? '编辑服务单元' : '添加服务单元'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingUnit(null);
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="服务单元名称"
            rules={[{ required: true, message: '请输入服务单元名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="leader_id"
            label="负责人"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select
              placeholder="请选择负责人"
              showSearch
              optionFilterProp="children"
            >
              {unassignedUsers.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.department})
                </Option>
              ))}
              {editingUnit && (
                <Option key={editingUnit.leader_id} value={editingUnit.leader_id}>
                  {editingUnit.leader_name}
                </Option>
              )}
            </Select>
          </Form.Item>
          <Form.Item
            name="member_ids"
            label="成员"
            rules={[{ required: true, message: '请选择成员' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择成员"
              showSearch
              optionFilterProp="children"
            >
              {unassignedUsers.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.department})
                </Option>
              ))}
              {editingUnit && editingUnit.member_ids.map((id, index) => (
                <Option key={id} value={id}>
                  {editingUnit.member_names[index]}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceUnitManagement; 