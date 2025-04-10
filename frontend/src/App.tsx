import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import Login from './pages/Login';
import ProjectList from './components/ProjectList';
import RequirementPool from './components/RequirementPool';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import MainLayout from './components/Layout';
import { useAuth } from './context/AuthContext';

// 添加 future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

const App: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <ConfigProvider locale={zhCN}>
      <Router {...router}>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/projects"
            element={
              isAuthenticated ? (
                <MainLayout>
                  <ProjectList />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/requirements"
            element={
              isAuthenticated ? (
                <MainLayout>
                  <RequirementPool />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          {isAdmin() && (
            <Route
              path="/users"
              element={
                isAuthenticated ? (
                  <MainLayout>
                    <UserManagement />
                  </MainLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          )}
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App; 