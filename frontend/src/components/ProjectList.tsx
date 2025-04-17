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
  Typography,
  Space,
  Transfer,
  Descriptions,
  Popconfirm,
  Progress,
  Tabs,
  List,
  Avatar
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Project,
  ProjectStatus,
  Requirement,
  RequirementStatus,
  ProjectMember,
  ProjectDocument
} from '../types';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UserAddOutlined, FileAddOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface ProjectFormValues {
  name: string;
  status: ProjectStatus;
  createTime: moment.Moment;
  onlineTime?: moment.Moment;
  requirements: number[];
}

const ProjectList: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
  const [memberForm] = Form.useForm();
  const [documentForm] = Form.useForm();

  useEffect(() => {
    fetchProjects();
    fetchRequirements();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      message.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const response = await api.get('/api/requirements');
      setRequirements(response.data.filter((req: Requirement) => req.status === RequirementStatus.PENDING_SCHEDULE));
    } catch (error) {
      console.error('Error fetching requirements:', error);
      message.error('获取需求列表失败');
    }
  };

  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    setSelectedRequirements([]);
    setIsModalVisible(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      status: project.status,
      createTime: moment(project.createTime),
      onlineTime: project.onlineTime ? moment(project.onlineTime) : undefined,
      requirements: project.requirements
    });
    setSelectedRequirements(project.requirements.map(String));
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/projects/${id}`);
      message.success('项目删除成功');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      message.error('项目删除失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        createTime: values.createTime.format('YYYY-MM-DD'),
        onlineTime: values.onlineTime?.format('YYYY-MM-DD'),
        requirements: selectedRequirements.map(Number)
      };

      if (editingProject) {
        await api.put(`/api/projects/${editingProject.id}`, formattedValues);
        message.success('项目更新成功');
      } else {
        await api.post('/api/projects', formattedValues);
        message.success('项目创建成功');
      }

      setIsModalVisible(false);
      fetchProjects();
      fetchRequirements();
    } catch (error) {
      console.error('Error saving project:', error);
      message.error('保存项目失败');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedRequirements([]);
  };

  const getStatusColor = (status: ProjectStatus) => {
    const colors: Record<ProjectStatus, string> = {
      [ProjectStatus.NEW]: 'default',
      [ProjectStatus.REQUIREMENT_DESIGN]: 'processing',
      [ProjectStatus.REQUIREMENT_HANDOVER]: 'warning',
      [ProjectStatus.IMPLEMENTATION]: 'success',
      [ProjectStatus.COMPLETED]: 'success'
    };
    return colors[status] || 'default';
  };

  const handleViewDetail = (project: Project) => {
    setSelectedProject(project);
    setDetailModalVisible(true);
  };

  const handleStatusChange = async (project: Project, newStatus: ProjectStatus) => {
    try {
      await api.put(`/api/projects/${project.id}`, {
        ...project,
        status: newStatus
      });
      message.success('项目状态更新成功');
      fetchProjects();
    } catch (error) {
      console.error('Error updating project status:', error);
      message.error('项目状态更新失败');
    }
  };

  const handleAddMember = () => {
    setSelectedMember(null);
    memberForm.resetFields();
    setMemberModalVisible(true);
  };

  const handleEditMember = (member: ProjectMember) => {
    setSelectedMember(member);
    memberForm.setFieldsValue({
      userId: member.userId,
      role: member.role
    });
    setMemberModalVisible(true);
  };

  const handleDeleteMember = async (memberId: number) => {
    try {
      await api.delete(`/api/projects/${selectedProject?.id}/members/${memberId}`);
      message.success('成员删除成功');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting member:', error);
      message.error('成员删除失败');
    }
  };

  const handleMemberModalOk = async () => {
    try {
      const values = await memberForm.validateFields();
      if (selectedMember) {
        await api.put(`/api/projects/${selectedProject?.id}/members/${selectedMember.id}`, values);
        message.success('成员更新成功');
      } else {
        await api.post(`/api/projects/${selectedProject?.id}/members`, values);
        message.success('成员添加成功');
      }
      setMemberModalVisible(false);
      fetchProjects();
    } catch (error) {
      console.error('Error saving member:', error);
      message.error('保存成员失败');
    }
  };

  const handleAddDocument = () => {
    setSelectedDocument(null);
    documentForm.resetFields();
    setDocumentModalVisible(true);
  };

  const handleEditDocument = (document: ProjectDocument) => {
    setSelectedDocument(document);
    documentForm.setFieldsValue({
      title: document.title,
      content: document.content
    });
    setDocumentModalVisible(true);
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await api.delete(`/api/projects/${selectedProject?.id}/documents/${documentId}`);
      message.success('文档删除成功');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting document:', error);
      message.error('文档删除失败');
    }
  };

  const handleDocumentModalOk = async () => {
    try {
      const values = await documentForm.validateFields();
      if (selectedDocument) {
        await api.put(`/api/projects/${selectedProject?.id}/documents/${selectedDocument.id}`, values);
        message.success('文档更新成功');
      } else {
        await api.post(`/api/projects/${selectedProject?.id}/documents`, values);
        message.success('文档添加成功');
      }
      setDocumentModalVisible(false);
    fetchProjects();
    } catch (error) {
      console.error('Error saving document:', error);
      message.error('保存文档失败');
    }
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '项目状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProjectStatus) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: '上线时间',
      dataIndex: 'onlineTime',
      key: 'onlineTime',
      render: (onlineTime: string | null) => onlineTime || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Project) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个项目吗？"
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

  const requirementColumns = [
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
  ];

  return (
    <div className="project-list">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新建项目
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="createTime"
            label="创建时间"
            rules={[{ required: true, message: '请选择创建时间' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="项目状态"
            rules={[{ required: true, message: '请选择项目状态' }]}
          >
            <Select placeholder="请选择项目状态">
              <Option value={ProjectStatus.NEW}>新建未处理</Option>
              <Option value={ProjectStatus.REQUIREMENT_DESIGN}>需求设计</Option>
              <Option value={ProjectStatus.REQUIREMENT_HANDOVER}>需求交接</Option>
              <Option value={ProjectStatus.IMPLEMENTATION}>需求实现</Option>
              <Option value={ProjectStatus.COMPLETED}>上线关闭</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="onlineTime"
            label="上线时间"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="关联需求"
            required
          >
            <Transfer
              dataSource={requirements.map(req => ({
                key: req.id.toString(),
                title: req.code,
                description: req.description,
              }))}
              titles={['待选需求', '已选需求']}
              targetKeys={selectedRequirements}
              onChange={setSelectedRequirements}
              render={item => item.title}
              listStyle={{
                width: 300,
                height: 300,
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 项目详情模态框 */}
      <Modal
        title="项目详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedProject && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="项目名称">{selectedProject.name}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedProject.createTime}</Descriptions.Item>
              <Descriptions.Item label="项目状态">
                <Tag color={getStatusColor(selectedProject.status)}>
                  {selectedProject.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="上线时间">
                {selectedProject.onlineTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="项目进度" span={2}>
                <Progress percent={selectedProject.progress} />
              </Descriptions.Item>
              <Descriptions.Item label="项目描述" span={2}>
                {selectedProject.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Tabs defaultActiveKey="requirements">
              <TabPane tab="关联需求" key="requirements">
                <Table
                  columns={[
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
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: RequirementStatus) => (
                        <Tag color={status === RequirementStatus.COMPLETED ? 'success' : 'processing'}>
                          {status}
                        </Tag>
                      ),
                    },
                  ]}
                  dataSource={requirements.filter(req => 
                    selectedProject.requirements.includes(req.id)
                  )}
                  rowKey="id"
                  pagination={false}
                />
              </TabPane>

              <TabPane tab="项目成员" key="members">
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={handleAddMember}
                  >
                    添加成员
                  </Button>
                </div>
                <List
                  dataSource={selectedProject.members}
                  renderItem={member => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          onClick={() => handleEditMember(member)}
                        >
                          编辑
                        </Button>,
                        <Popconfirm
                          title="确定要删除这个成员吗？"
                          onConfirm={() => handleDeleteMember(member.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button type="link" danger>
                            删除
                          </Button>
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar>{member.userId}</Avatar>}
                        title={`用户 ${member.userId}`}
                        description={`角色: ${member.role} | 加入时间: ${member.joinDate}`}
                      />
                    </List.Item>
                  )}
                />
              </TabPane>

              <TabPane tab="项目文档" key="documents">
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<FileAddOutlined />}
                    onClick={handleAddDocument}
                  >
                    添加文档
                  </Button>
                </div>
                <List
                  dataSource={selectedProject.documents}
                  renderItem={document => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          onClick={() => handleEditDocument(document)}
                        >
                          编辑
                        </Button>,
                        <Popconfirm
                          title="确定要删除这个文档吗？"
                          onConfirm={() => handleDeleteDocument(document.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button type="link" danger>
                            删除
                          </Button>
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        title={document.title}
                        description={`创建时间: ${document.createdAt} | 最后更新: ${document.updatedAt}`}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">{document.content}</Text>
                      </div>
                    </List.Item>
                  )}
                />
              </TabPane>
            </Tabs>

            <div style={{ marginTop: 24 }}>
              <Title level={4}>状态变更</Title>
              <Space>
                {Object.values(ProjectStatus).map((status) => (
                  <Button
                    key={status}
                    type={selectedProject?.status === status ? 'primary' : 'default'}
                    onClick={() => selectedProject && handleStatusChange(selectedProject, status)}
                    disabled={selectedProject?.status === status}
                  >
                    {status}
                  </Button>
                ))}
              </Space>
            </div>
          </>
        )}
      </Modal>

      {/* 成员管理模态框 */}
      <Modal
        title={selectedMember ? '编辑成员' : '添加成员'}
        open={memberModalVisible}
        onOk={handleMemberModalOk}
        onCancel={() => setMemberModalVisible(false)}
      >
        <Form
          form={memberForm}
          layout="vertical"
        >
          <Form.Item
            name="userId"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input type="number" placeholder="请输入用户ID" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="owner">所有者</Option>
              <Option value="manager">管理者</Option>
              <Option value="member">成员</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 文档管理模态框 */}
      <Modal
        title={selectedDocument ? '编辑文档' : '添加文档'}
        open={documentModalVisible}
        onOk={handleDocumentModalOk}
        onCancel={() => setDocumentModalVisible(false)}
      >
        <Form
          form={documentForm}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectList; 