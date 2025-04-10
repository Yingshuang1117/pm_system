import React from 'react';
import { Typography } from 'antd';
import RequirementList from '../components/RequirementList';

const { Title } = Typography;

const RequirementPool: React.FC = () => {
  return (
    <div className="requirement-pool">
      <Title level={2}>需求池管理</Title>
      <RequirementList />
    </div>
  );
};

export default RequirementPool; 