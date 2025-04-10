import React from 'react';
import { Layout, Menu, Button, Dropdown, Space } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  DashboardOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <AntHeader style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '0 24px',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ margin: 0, marginRight: 48, fontSize: 20 }}>项目管理系统</h1>
        <Menu 
          mode="horizontal" 
          selectedKeys={[location.pathname]}
          style={{ border: 'none' }}
        >
          <Menu.Item key="/" icon={<DashboardOutlined />}>
            <Link to="/">仪表盘</Link>
          </Menu.Item>
          <Menu.Item key="/projects" icon={<ProjectOutlined />}>
            <Link to="/projects">项目列表</Link>
          </Menu.Item>
          <Menu.Item key="/requirements" icon={<AppstoreOutlined />}>
            <Link to="/requirements">需求池</Link>
          </Menu.Item>
          {isAdmin() && (
            <Menu.Item key="/users" icon={<TeamOutlined />}>
              <Link to="/users">用户管理</Link>
            </Menu.Item>
          )}
        </Menu>
      </div>
      <div>
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <UserOutlined />
            <span>{user?.name || user?.email}</span>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header; 