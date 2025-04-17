import React from 'react';
import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const { Content } = AntLayout;

const MainLayout: React.FC = () => {
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ 
        padding: '24px 24px',
        background: '#f0f2f5',
        margin: '0 24px 24px 24px',
        borderRadius: 8,
        minHeight: 'calc(100vh - 64px)'
      }}>
        <Outlet />
      </Content>
    </AntLayout>
  );
};

export default MainLayout; 