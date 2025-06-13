
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import GeminiChatWidget from './GeminiChatWidget'; // New import
import { usePageContext } from '../contexts/PageContext'; // Import usePageContext

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { pagePath, pageTitle, contextData } = usePageContext(); // Consume page context

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Prepare chat context based on PageContext
  const chatContext = {
    path: pagePath || location.pathname, // Fallback to location.pathname if pagePath from context is not yet set
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
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="p-3 text-center text-xs text-text-secondary border-t border-tertiary-dark bg-secondary-dark">
          © {new Date().getFullYear()} WIDS Project. All rights reserved.
        </footer>
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
