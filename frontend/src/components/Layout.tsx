import React from 'react';
import { Layout as AntLayout } from 'antd';
import Header from './Header';

const { Content } = AntLayout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ 
        padding: '24px',
        background: '#f0f2f5',
        margin: '24px',
        borderRadius: 4
      }}>
        {children}
      </Content>
    </AntLayout>
  );
};

export default MainLayout; 