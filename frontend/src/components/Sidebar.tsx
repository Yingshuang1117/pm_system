import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ProjectOutlined,
  AppstoreOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const menuItems = [
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/requirements',
      icon: <AppstoreOutlined />,
      label: '需求池',
    },
    ...(isAdmin() ? [
      {
        key: '/users',
        icon: <TeamOutlined />,
        label: '用户管理',
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: '系统设置',
      },
    ] : []),
  ];

  return (
    <Sider width={200} theme="light">
      <div style={{ height: 32, margin: 16, background: 'rgba(0, 0, 0, 0.2)' }} />
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};

export default Sidebar; 