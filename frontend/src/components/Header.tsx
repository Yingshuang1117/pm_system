import React, { useEffect, useState } from 'react';
import { Layout, Menu, Dropdown, Space } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  DashboardOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  TeamOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminPanel, setIsAdminPanel] = useState(false);

  useEffect(() => {
    // 检查当前路径是否在后台
    setIsAdminPanel(location.pathname.startsWith('/admin'));
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchPanel = () => {
    if (isAdminPanel) {
      navigate('/dashboard');
    } else {
      navigate('/admin/users');
    }
  };

  const isAdminUser = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  const userMenuItems = [
    ...(isAdminUser ? [{
      key: 'switchPanel',
      icon: <SettingOutlined />,
      label: isAdminPanel ? '切换到前台' : '切换到后台',
      onClick: handleSwitchPanel
    }] : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  const baseMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => navigate('/dashboard')
    },
    {
      key: '/dashboard/projects',
      icon: <ProjectOutlined />,
      label: '项目列表',
      onClick: () => navigate('/dashboard/projects')
    },
    {
      key: '/dashboard/requirements',
      icon: <AppstoreOutlined />,
      label: '需求池',
      onClick: () => navigate('/dashboard/requirements')
    }
  ];

  const adminMenuItems = [
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: '用户管理',
      onClick: () => navigate('/admin/users')
    },
    {
      key: '/admin/service-units',
      icon: <AppstoreOutlined />,
      label: '服务单元管理',
      onClick: () => navigate('/admin/service-units')
    }
  ];

  const menuItems = isAdminPanel ? adminMenuItems : baseMenuItems;

  return (
    <AntHeader style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '0 24px',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 1
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          {isAdminPanel ? '后台管理系统' : '项目管理系统'}
        </h1>
        <Menu 
          mode="horizontal" 
          selectedKeys={[location.pathname]}
          style={{ 
            border: 'none',
            flex: 1,
            minWidth: 400
          }}
          items={menuItems}
        />
      </div>
      <div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ 
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 4,
            transition: 'background-color 0.3s'
          }} className="user-dropdown">
            <UserOutlined />
            <span>{user?.username}</span>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header; 