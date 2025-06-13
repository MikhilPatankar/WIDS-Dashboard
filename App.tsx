
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PageProvider } from './contexts/PageContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer'; // Import ToastContainer
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage'; // Import RegistrationPage
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import OverviewPage from './pages/OverviewPage';
import DatasetManagementPage from './pages/DatasetManagementPage';
import DatasetDetailPage from './pages/DatasetDetailPage';
import MetaLearningPage from './pages/MetaLearningPage';
import QuantumFeaturesPage from './pages/QuantumFeaturesPage';
import FederatedLearningPage from './pages/FederatedLearningPage';
import AttackMonitoringPage from './pages/AttackMonitoringPage';
import ModelManagementPage from './pages/ModelManagementPage';
import ModelDetailPage from './pages/ModelDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminPanelPage from './pages/AdminPanelPage';
import NotificationsPage from './pages/NotificationsPage';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider> {/* ToastProvider now wraps AuthProvider */}
        <AuthProvider>
          <HashRouter>
            <PageProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegistrationPage />} /> {/* Added registration route */}
                <Route 
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="overview" element={<OverviewPage />} />
                          <Route path="meta-learning" element={<MetaLearningPage />} />
                          <Route path="quantum-features" element={<QuantumFeaturesPage />} />
                          <Route path="attack-monitoring" element={<AttackMonitoringPage />} />
                          <Route path="profile" element={<ProfilePage />} />
                          <Route path="notifications" element={<NotificationsPage />} />
                          
                          <Route path="datasets" element={
                            <AdminRoute>
                              <DatasetManagementPage />
                            </AdminRoute>
                          } />
                          <Route path="datasets/:datasetId" element={ 
                            <AdminRoute>
                              <DatasetDetailPage />
                            </AdminRoute>
                          } />
                          <Route path="federated-learning" element={
                            <AdminRoute>
                              <FederatedLearningPage />
                            </AdminRoute>
                          } />
                          <Route path="model-management" element={
                            <AdminRoute>
                              <ModelManagementPage />
                            </AdminRoute>
                          } />
                           <Route path="models/:modelId" element={ 
                            <AdminRoute>
                              <ModelDetailPage />
                            </AdminRoute>
                          } />
                          <Route path="admin-panel" element={
                            <AdminRoute>
                              <AdminPanelPage />
                            </AdminRoute>
                          } />
                          <Route index element={<Navigate to="overview" replace />} />
                          <Route path="*" element={<Navigate to="overview" replace />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                {/* Fallback for any unmatched routes when not logged in could go to login */}
                <Route path="*" element={<Navigate to="/login" replace />} /> 
              </Routes>
            </PageProvider>
          </HashRouter>
        </AuthProvider>
        <ToastContainer /> {/* Render ToastContainer here */}
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
