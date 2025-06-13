import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WidsLogo from './WidsLogo';
import { MenuIcon, SearchIcon, BellIcon, UserCircleIcon, CogIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, ShieldCheckIcon, InformationCircleIcon, XMarkIcon } from '../constants'; 
import GlobalSearchModal from './GlobalSearchModal'; // New import

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  // Mock notifications
  const mockNotifications = [
    { id: 1, text: "Model 'Alpha_V3' training completed.", time: "15m ago", unread: true, link: "/models/model_Alpha_V3" },
    { id: 2, text: "Critical alert: High CPU usage.", time: "1h ago", unread: true, link: "/attack-monitoring" },
    { id: 3, text: "Dataset 'AWID_Aug24' processed.", time: "3h ago", unread: false, link: "/datasets/ds_AWID_Aug24" },
  ];
  const unreadNotificationCount = mockNotifications.filter(n => n.unread).length;


  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    navigate('/login');
  };
  
  const handleHelp = () => {
    alert("WIDS Dashboard - Help & Documentation\n\nThis feature is coming soon!\n\nFor now, explore the various sections to get familiar with the dashboard's capabilities for monitoring datasets, models, and security events.");
    setIsProfileDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const userInitials = currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : '..';

  return (
    <>
      <header className="bg-secondary-dark text-text-primary p-3 sm:p-4 flex items-center justify-between border-b border-tertiary-dark sticky top-0 z-40 h-[65px]">
        {/* Left Section */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-text-secondary hover:bg-tertiary-dark hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue mr-2"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="hidden md:flex items-center">
            <WidsLogo className="text-accent-purple" compact={false} />
          </div>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-xl mx-4 hidden md:flex">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-text-secondary" />
            </div>
            <input
              type="search"
              name="global-search"
              id="global-search"
              className="block w-full pl-10 pr-3 py-2 border border-tertiary-dark rounded-md leading-5 bg-primary-dark text-text-primary placeholder-text-secondary focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm cursor-pointer"
              placeholder="Search (Ctrl+K)..."
              onClick={() => setIsSearchModalOpen(true)}
              readOnly // Make it readOnly to trigger modal on click
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="inline-flex items-center px-2 py-0.5 rounded border border-tertiary-dark text-xs font-sans font-medium text-text-secondary">
                Ctrl+K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
            <span className="text-xs text-success font-medium hidden sm:block">Live</span>
          </div>

          <div className="relative" ref={notificationPanelRef}>
            <button 
              onClick={() => setIsNotificationPanelOpen(prev => !prev)}
              className="p-1.5 rounded-full text-text-secondary hover:bg-tertiary-dark hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-dark focus:ring-accent-blue relative"
              title="Notifications"
              aria-expanded={isNotificationPanelOpen}
              aria-haspopup="true"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-secondary-dark bg-danger" />
              )}
            </button>
            {isNotificationPanelOpen && (
              <div className="notification-panel">
                <div className="p-3 border-b border-tertiary-dark flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-text-primary">Notifications</h4>
                  <button onClick={() => setIsNotificationPanelOpen(false)} className="text-text-secondary hover:text-text-primary">
                    <XMarkIcon className="w-4 h-4"/>
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.length === 0 ? (
                    <p className="text-sm text-text-secondary text-center py-4">No new notifications.</p>
                  ) : (
                    mockNotifications.map(notif => (
                      <Link 
                        key={notif.id} 
                        to={notif.link || '#'} 
                        onClick={() => setIsNotificationPanelOpen(false)}
                        className={`block px-3 py-2.5 hover:bg-tertiary-dark ${notif.unread ? 'bg-tertiary-dark/50' : ''}`}
                      >
                        <p className={`text-sm font-medium ${notif.unread ? 'text-text-primary' : 'text-text-secondary'}`}>{notif.text}</p>
                        <p className="text-xs text-text-secondary/70">{notif.time}</p>
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-tertiary-dark text-center">
                  <Link to="/notifications" onClick={() => setIsNotificationPanelOpen(false)} className="text-xs text-accent-blue hover:underline">
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>


          {currentUser && (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-1.5 p-1 rounded-md hover:bg-tertiary-dark focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-secondary-dark focus:ring-accent-blue"
                aria-expanded={isProfileDropdownOpen}
                aria-haspopup="true"
                id="user-menu-button"
              >
                <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-accent-purple text-white rounded-full text-xs sm:text-sm font-semibold">
                  {userInitials}
                </span>
                <span className="text-sm font-medium hidden lg:block">{currentUser.username}</span>
                <ChevronDownIcon className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isProfileDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>

              {isProfileDropdownOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-2xl bg-secondary-dark ring-1 ring-tertiary-dark focus:outline-none py-1 z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="px-4 py-3 border-b border-tertiary-dark">
                    <p className="text-sm font-medium text-text-primary truncate" aria-label={`Username: ${currentUser.username}`}>{currentUser.username}</p>
                    <p className="text-xs text-text-secondary truncate" aria-label={`Email: ${currentUser.email}`}>{currentUser.email}</p>
                    {currentUser.is_admin && <span className="text-xs font-semibold text-accent-purple">Administrator</span>}
                  </div>
                  <Link
                    to="/profile" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-tertiary-dark hover:text-text-primary w-full text-left"
                    role="menuitem"
                  >
                    <UserCircleIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                    Profile
                  </Link>
                  <Link
                    to="/settings" 
                    onClick={(e) => { e.preventDefault(); alert("Settings page coming soon!"); setIsProfileDropdownOpen(false);}}
                    className="flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-tertiary-dark hover:text-text-primary w-full text-left"
                    role="menuitem"
                  >
                    <CogIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                    Settings
                  </Link>
                  {currentUser.is_admin && (
                    <Link
                      to="/admin-panel" 
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-tertiary-dark hover:text-text-primary w-full text-left"
                      role="menuitem"
                    >
                      <ShieldCheckIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleHelp}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-tertiary-dark hover:text-text-primary"
                    role="menuitem"
                  >
                    <InformationCircleIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                    Help & Documentation
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-danger/80 hover:text-white"
                    role="menuitem"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      <GlobalSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </>
  );
};

export default Header;