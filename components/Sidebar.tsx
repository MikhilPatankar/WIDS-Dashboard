
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { SIDEBAR_LINKS, LogoutIcon as DefaultLogoutIcon } from '../constants'; 
import { useAuth } from '../contexts/AuthContext';
import WidsLogo from './WidsLogo'; 

interface SidebarProps {
  isSidebarOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const availableLinks = SIDEBAR_LINKS.filter(link => 
    !link.isAdminOnly || (currentUser && currentUser.is_admin)
  );

  return (
    <aside 
      className={`bg-secondary-dark flex flex-col shadow-lg transition-all duration-300 ease-in-out
                  ${isSidebarOpen ? 'w-64 p-4 space-y-6' : 'w-20 p-3 items-center space-y-4'}`}
    >
      <div 
        className={`text-accent-purple flex items-center justify-center border-b border-tertiary-dark
                    ${isSidebarOpen ? 'py-6' : 'py-3 h-[61px]'}`} // Increased padding for open, removed fixed height
      >
        {isSidebarOpen ? (
          <WidsLogo className="h-10 text-accent-purple" /> // Increased logo icon size
        ) : (
          <WidsLogo compact className="w-8 h-8 text-accent-purple" />
        )}
      </div>
      <nav className="flex-grow">
        <ul className={`${isSidebarOpen ? 'space-y-2' : 'space-y-3 flex flex-col items-center'}`}>
          {availableLinks.map((link) => (
            <li key={link.name} title={!isSidebarOpen ? link.name : undefined}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-colors duration-150 ease-in-out group
                   ${isSidebarOpen ? 'space-x-3 p-3' : 'p-3 justify-center'}
                   ${isActive
                     ? 'bg-accent-blue text-white shadow-md'
                     : 'hover:bg-tertiary-dark hover:text-text-primary text-text-secondary'
                   }`
                }
              >
                {React.cloneElement(link.icon, { className: `w-5 h-5 sm:w-6 sm:h-6 ${isSidebarOpen ? '' : 'group-hover:scale-110 transition-transform'}` })}
                {isSidebarOpen && <span>{link.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {/* Removed the entire mt-auto div block that contained user info, logout, and copyright */}
    </aside>
  );
};

export default Sidebar;
