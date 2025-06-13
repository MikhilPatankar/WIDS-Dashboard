
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import GeminiChatWidget from './GeminiChatWidget';
import { usePageContext } from '../contexts/PageContext';
import { BackendStatus } from '../types'; // Ensure BackendStatus is imported from src/types
import { checkBackendHealth } from '../services/systemService';
import { API_ENDPOINT } from '../config';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { pagePath, pageTitle, contextData } = usePageContext();
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({ status: 'checking' });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  useEffect(() => {
    const performCheck = async () => {
      if (!API_ENDPOINT) { 
        setBackendStatus({ 
          status: 'error', 
          message: 'API_ENDPOINT environment variable is not configured.',
          lastChecked: new Date()
        });
        return; 
      }
      setBackendStatus(prev => ({ ...prev, status: 'checking' }));
      const health = await checkBackendHealth();
      setBackendStatus(health);
    };

    performCheck(); 
    const intervalId = setInterval(performCheck, 30000); 

    return () => clearInterval(intervalId); 
  }, []);

  const chatContext = {
    path: pagePath || location.pathname,
    title: pageTitle,
    data: contextData
  };

  return (
    <div className="flex h-screen bg-primary-dark text-text-primary overflow-hidden">
      <Sidebar isSidebarOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
          backendStatus={backendStatus} // Pass backendStatus to Header
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        {/* Footer removed from here */}
      </div>
      <GeminiChatWidget 
        currentPagePath={chatContext.path} 
        pageContextData={chatContext.data}
        currentPageTitle={chatContext.title}
      />
    </div>
  );
};

export default Layout;