import React from 'react';
import { Typography } from 'antd';
import ProjectList from '../components/ProjectList';

const { Title } = Typography;

const ProjectManagement: React.FC = () => {
  return (
    <div className="project-management">
      <Title level={2}>项目管理</Title>
      <ProjectList />
    </div>
  );
};

export default ProjectManagement; 