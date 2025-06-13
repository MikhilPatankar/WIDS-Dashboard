import React, { useEffect } from 'react'; // Added useEffect
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { usePageContext } from '../contexts/PageContext'; // Import usePageContext
import { UserCircleIcon, KeyIcon, CogIcon, BellIcon, PaintBrushIcon } from '@heroicons/react/24/outline'; // Added more icons

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { setPageContext } = usePageContext();

  useEffect(() => {
    if (currentUser) {
      setPageContext(
        '/profile',
        'My Profile',
        { username: currentUser.username, email: currentUser.email, role: currentUser.is_admin ? 'Admin' : 'User' }
      );
    }
  }, [currentUser, setPageContext]);


  if (!currentUser) {
    return (
      <div className="p-6 text-center text-text-secondary">
        Loading user profile or not logged in.
      </div>
    );
  }

  const handlePasswordChange = () => {
    alert("Password change functionality is not implemented in this demo. \nIn a real application, this would open a secure form to update your password.");
  };
  
  const handleUpdateProfile = () => {
    alert("Profile update functionality (e.g., changing email) is not implemented in this demo.");
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="My Profile"
        subtitle="View and manage your account details and preferences."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Account Information" icon={<UserCircleIcon className="w-6 h-6 text-accent-blue" />} className="md:col-span-1">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-text-secondary font-medium">Username</p>
              <p className="text-text-primary text-base">{currentUser.username}</p>
            </div>
            <div>
              <p className="text-text-secondary font-medium">Email Address</p>
              <p className="text-text-primary text-base">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-text-secondary font-medium">Role</p>
              <p className={`text-base font-semibold ${currentUser.is_admin ? 'text-accent-purple' : 'text-text-primary'}`}>
                {currentUser.is_admin ? 'Administrator' : 'User'}
              </p>
            </div>
             <div>
              <p className="text-text-secondary font-medium">Account Status</p>
              <p className={`text-base font-semibold ${currentUser.is_active ? 'text-success' : 'text-danger'}`}>
                {currentUser.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <p className="text-text-secondary font-medium">Member Since</p>
              <p className="text-text-primary text-base">{new Date(currentUser.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-text-secondary font-medium">Last Login</p>
              <p className="text-text-primary text-base">{currentUser.last_login ? new Date(currentUser.last_login).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </Card>

        <Card title="Settings & Preferences" icon={<CogIcon className="w-6 h-6 text-accent-blue" />} className="md:col-span-2">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Account Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleUpdateProfile}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-secondary-dark hover:bg-tertiary-dark text-text-primary font-semibold py-2 px-4 rounded-lg border border-tertiary-dark transition-colors duration-150"
                  aria-label="Edit Profile Details (Demo)"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span>Edit Profile Details</span>
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-secondary-dark hover:bg-tertiary-dark text-text-primary font-semibold py-2 px-4 rounded-lg border border-tertiary-dark transition-colors duration-150"
                  aria-label="Change Password (Demo)"
                >
                  <KeyIcon className="w-5 h-5" />
                  <span>Change Password</span>
                </button>
              </div>
            </div>
            
            <div className="pt-4 border-t border-tertiary-dark">
                <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center">
                  <BellIcon className="w-5 h-5 mr-2 text-text-secondary" /> Notification Preferences
                </h3>
                <p className="text-sm text-text-secondary">
                    Manage how you receive alerts and updates from the WIDS. (e.g., Email, In-app).
                    <span className="block italic mt-1">(Not implemented in this demo)</span>
                </p>
            </div>

            <div className="pt-4 border-t border-tertiary-dark">
                <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center">
                  <PaintBrushIcon className="w-5 h-5 mr-2 text-text-secondary" /> Theme & Display
                </h3>
                <p className="text-sm text-text-secondary">
                    Customize the look and feel of your dashboard.
                     <span className="block italic mt-1">(Currently dark theme only; Not implemented in this demo)</span>
                </p>
            </div>
             <div className="pt-4 border-t border-tertiary-dark">
                <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center">
                    <KeyIcon className="w-5 h-5 mr-2 text-text-secondary" /> API Key Management
                </h3>
                <p className="text-sm text-text-secondary">
                    Manage API keys for third-party integrations or personal access tokens.
                    <span className="block italic mt-1">(Not implemented in this demo)</span>
                </p>
            </div>
             <div className="pt-4 border-t border-tertiary-dark">
                <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center">
                   My Activity Log
                </h3>
                <p className="text-sm text-text-secondary">
                    View a log of your recent significant actions within the dashboard.
                    <span className="block italic mt-1">(Not implemented in this demo)</span>
                </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;