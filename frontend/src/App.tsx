import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import RequirementList from './components/RequirementList';
import ProjectList from './components/ProjectList';
import UserManagement from './components/UserManagement';
import ServiceUnitManagement from './components/ServiceUnitManagement';
import Header from './components/Header';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Register from './components/Register';

const { Content } = Layout;

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout style={{ minHeight: '100vh' }}>
                <Header />
                <Content style={{ padding: '24px' }}>
                  <Routes>
                    {/* 前台路由 */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/dashboard/projects" element={<ProjectList />} />
                    <Route path="/dashboard/requirements" element={<RequirementList />} />
                    
                    {/* 后台路由 */}
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/service-units" element={<ServiceUnitManagement />} />
                  </Routes>
                </Content>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App; 