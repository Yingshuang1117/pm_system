import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, List, Tag, Typography, Progress, Tabs } from 'antd';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  DashboardStats, 
  Requirement, 
  Project, 
  RequirementStatus, 
  ProjectStatus,
  RequirementPriority
} from '../types';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchProjects();
    fetchRequirements();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchRequirements = async () => {
    try {
      const response = await api.get('/api/requirements');
      setRequirements(response.data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    }
  };

  const getStatusColor = (status: RequirementStatus | ProjectStatus) => {
    const colors: Record<string, string> = {
      [RequirementStatus.PENDING_SCHEDULE]: 'default',
      [RequirementStatus.IN_PROJECT]: 'processing',
      [RequirementStatus.COMPLETED]: 'success',
      [ProjectStatus.NEW]: 'default',
      [ProjectStatus.REQUIREMENT_DESIGN]: 'processing',
      [ProjectStatus.REQUIREMENT_HANDOVER]: 'warning',
      [ProjectStatus.IMPLEMENTATION]: 'success',
      [ProjectStatus.COMPLETED]: 'success'
    };
    return colors[status] || 'default';
  };

  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <Link to={`/projects/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProjectStatus) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
    {
      title: '上线时间',
      dataIndex: 'onlineTime',
      key: 'onlineTime',
      render: (date: string | null) => date || '-',
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
  ];

  if (loading || !stats) {
    return <div>Loading...</div>;
  }

  const tabItems = [
    {
      key: 'projects',
      label: '项目列表',
      children: (
        <Table
          columns={projectColumns}
          dataSource={projects}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      ),
    },
    {
      key: 'requirements',
      label: '需求池',
      children: (
        <Table
          columns={requirementColumns}
          dataSource={requirements}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      ),
    },
  ];

  return (
    <div className="dashboard">
      <Title level={2}>仪表盘</Title>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="总需求数" 
              value={stats.totalRequirements} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="总项目数" 
              value={stats.totalProjects} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="进行中需求" 
              value={stats.requirementsByStatus[RequirementStatus.IN_PROJECT]} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="进行中项目" 
              value={stats.projectsByStatus[ProjectStatus.IMPLEMENTATION]} 
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <Tabs defaultActiveKey="projects" items={tabItems} />
      </div>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="即将到期需求">
            <List
              dataSource={stats.upcomingDeadlines}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.code}
                    description={item.description}
                  />
                  <Tag color="warning">{item.requestDate}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近活动">
            <List
              dataSource={stats.recentActivities}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.description}
                    description={item.createdAt}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 