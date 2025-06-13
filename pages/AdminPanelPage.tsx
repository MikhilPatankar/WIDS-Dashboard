
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import ConfirmationModal from '../src/components/ConfirmationModal.tsx'; // Corrected import path
import MetricDisplay from '../components/MetricDisplay';
import { User, ApiResponseMessage, AdminStatusOverview, TableColumn, UserRegistrationData } from '../src/types'; // UserRegistrationData for Add User modal
import { fetchAdminStatusOverview, fetchAllUsers, updateUserAdmin, deleteUserAdmin } from '../src/services/adminService'; // Use src/services
import { registerUser as registerUserService } from '../src/services/authService'; // For Add User
import { useAuth } from '../contexts/AuthContext';
import { usePageContext } from '../contexts/PageContext';
import { useToast } from '../contexts/ToastContext';
import { UsersIcon, PlusCircleIcon, PencilIcon, TrashIcon, ShieldCheckIcon, CogIcon, ChartBarIcon, ServerStackIcon, StopIcon, EyeIcon, ArrowPathIcon, KeyIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '../constants';
import SkeletonLoader from '../components/SkeletonLoader';

interface UserFormDataForAdmin {
  username: string; 
  email: string;
  password?: string; 
  is_admin: boolean;
  is_active: boolean;
}

const maintenanceModeStyle = `
  input:checked ~ .dot {
    transform: translateX(100%);
    background-color: #3B82F6; /* accent-blue */
  }
`;

const AdminPanelPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { setPageContext } = usePageContext();
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [adminStatusOverview, setAdminStatusOverview] = useState<AdminStatusOverview | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [loadingUserAction, setLoadingUserAction] = useState<Record<string, boolean>>({});
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormDataForAdmin>({
    username: '', email: '', password: '', is_admin: false, is_active: true,
  });
  const [modalActionFeedback, setModalActionFeedback] = useState<ApiResponseMessage | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);


  const loadAdminData = useCallback(async () => {
    setIsLoadingUsers(true);
    setIsLoadingStatus(true);
    try {
      const [usersData, statusData] = await Promise.all([
        fetchAllUsers(),
        fetchAdminStatusOverview()
      ]);
      setUsers(usersData);
      setAdminStatusOverview(statusData);
      setPageContext('/admin-panel', 'Admin Panel', {
        userCount: usersData.length,
        systemHealthContext: statusData.total_registered_users > 0 ? 'Optimal' : 'Checking', 
        activeModelsContext: statusData.active_models,
      });
    } catch (error: any) {
      console.error("Error fetching admin panel data:", error);
      addToast('error', 'Data Load Failed', error.message || "Failed to load admin panel data.");
    } finally {
      setIsLoadingUsers(false);
      setIsLoadingStatus(false);
    }
  }, [addToast, setPageContext]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleUserAction = async (actionPromise: Promise<any>, userId?: string, actionName?: string) => {
    const loadingKey = actionName ? `${actionName}-${userId || 'global'}` : 'globalUserAction';
    setLoadingUserAction(prev => ({ ...prev, [loadingKey]: true }));
    setModalActionFeedback(null);
    try {
      const response = await actionPromise; 
      let message = "Action successful.";
      let success = true;

      if (response && typeof response.message === 'string') { 
        message = response.message;
        success = response.success;
      } else if (response && response.username) { 
        message = `User ${actionName || 'action'} successful.`;
      }
      
      addToast(success ? 'success' : 'error',
               success ? `User ${actionName || 'action'} successful` : `User ${actionName || 'action'} failed`,
               message);
      
      if (success) {
        loadAdminData(); 
        setIsUserModalOpen(false);
        setIsConfirmDeleteModalOpen(false); 
        setUserToDelete(null);
      } else {
        if (isUserModalOpen || isConfirmDeleteModalOpen) setModalActionFeedback({success: false, message});
      }
    } catch (error: any) {
      console.error(`Error performing user action ${actionName}:`, error);
      const defaultMessage = `Failed to ${actionName || 'perform action'}.`;
      addToast('error', 'User Action Failed', error.message || defaultMessage);
      if(isUserModalOpen || isConfirmDeleteModalOpen) setModalActionFeedback({success: false, message: error.message || defaultMessage});
    } finally {
      setLoadingUserAction(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const openAddUserModal = () => {
    setEditingUser(null);
    setUserFormData({ username: '', email: '', password: '', is_admin: false, is_active: true });
    setModalActionFeedback(null);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserFormData({ 
      username: user.username, 
      email: user.email, 
      is_admin: user.is_admin,
      is_active: user.is_active,
    });
    setModalActionFeedback(null);
    setIsUserModalOpen(true);
  };
  
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setUserFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
        setUserFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) { 
      const updates: Partial<Pick<User, 'email' | 'is_admin' | 'is_active'>> = {
        email: userFormData.email,
        is_admin: userFormData.is_admin,
        is_active: userFormData.is_active,
      };
      handleUserAction(updateUserAdmin(editingUser.id, updates), editingUser.id, 'edit');
    } else { 
      if (!userFormData.password) {
        setModalActionFeedback({success: false, message: "Password is required for new users."});
        return;
      }
      const newUserPayload: UserRegistrationData = {
        username: userFormData.username,
        email: userFormData.email,
        password: userFormData.password,
        is_admin: userFormData.is_admin,
        is_active: userFormData.is_active,
      };
      handleUserAction(registerUserService(newUserPayload), undefined, 'add');
    }
  };

  const handleDeleteUserRequest = (user: User) => {
    setUserToDelete(user);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      handleUserAction(deleteUserAdmin(userToDelete.id), userToDelete.id, 'delete');
    }
  };
  
  const userColumns: TableColumn<User>[] = [
    { header: 'ID', accessor: 'id', sortable: true, className: "w-1/12" },
    { header: 'Username', accessor: 'username', sortable: true },
    { header: 'Email', accessor: 'email', sortable: true },
    { 
      header: 'Role', 
      accessor: item => <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${item.is_admin ? 'bg-accent-purple/30 text-accent-purple' : 'bg-gray-500/20 text-text-secondary'}`}>{item.is_admin ? 'Admin' : 'User'}</span>,
      sortable: true
    },
    { 
      header: 'Status', 
      accessor: item => <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${item.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>{item.is_active ? 'Active' : 'Inactive'}</span>,
      sortable: true
    },
    { header: 'Created', accessor: item => new Date(item.created_at).toLocaleDateString(), sortable: true },
    { header: 'Last Login', accessor: item => item.last_login ? new Date(item.last_login).toLocaleString() : 'N/A', sortable: true },
    {
      header: 'Actions',
      accessor: (item: User) => (
        <div className="flex space-x-1">
          <button
            onClick={() => openEditUserModal(item)}
            disabled={loadingUserAction[`edit-${item.id}`]}
            className="p-1.5 text-text-secondary hover:text-accent-blue disabled:opacity-50"
            title="Edit User"
            aria-label={`Edit user ${item.username}`}
          >
            {loadingUserAction[`edit-${item.id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <PencilIcon className="w-4 h-4"/>}
          </button>
          <button
            onClick={() => handleDeleteUserRequest(item)}
            disabled={loadingUserAction[`delete-${item.id}`] || item.id === currentUser?.id} 
            className="p-1.5 text-text-secondary hover:text-danger disabled:opacity-50"
            title="Delete User"
            aria-label={`Delete user ${item.username}`}
          >
            {loadingUserAction[`delete-${item.id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <TrashIcon className="w-4 h-4"/>}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Administrator Panel"
        subtitle="Manage users, system settings, and monitor overall system health."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          title="User Management" 
          icon={<UsersIcon className="w-5 h-5 text-accent-blue" />} 
          className="lg:col-span-2"
          bodyClassName="p-0"
          isLoading={isLoadingUsers && users.length === 0}
        >
          <div className="p-4 border-b border-tertiary-dark">
            <button
              onClick={openAddUserModal}
              disabled={loadingUserAction['add-undefined']} 
              className="btn-primary text-sm"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              <span>Add New User</span>
            </button>
          </div>
          <Table columns={userColumns} data={users} isLoading={isLoadingUsers} emptyStateMessage="No users found." itemsPerPage={10}/>
        </Card>

        <div className="space-y-6 lg:col-span-1">
            <Card title="System Overview" icon={<ChartBarIcon className="w-5 h-5 text-accent-blue" />}>
            {isLoadingStatus && !adminStatusOverview && <SkeletonLoader type="block" className="h-48"/>}
            {adminStatusOverview && (
                <div className="space-y-3">
                  <MetricDisplay title="Total Users" value={adminStatusOverview.total_registered_users} isLoading={isLoadingStatus} icon={<UsersIcon className="w-5 h-5"/>}/>
                  <MetricDisplay title="Active Models" value={adminStatusOverview.active_models} isLoading={isLoadingStatus} icon={<ServerStackIcon className="w-5 h-5"/>}/>
                  <MetricDisplay title="Training Jobs" value={adminStatusOverview.active_training_jobs} isLoading={isLoadingStatus} icon={<CogIcon className="w-5 h-5"/>}/>
                  <MetricDisplay title="Federated Clients" value={adminStatusOverview.federated_clients_online} isLoading={isLoadingStatus} icon={<UsersIcon className="w-5 h-5"/>}/>
                </div>
            )}
            {!isLoadingStatus && !adminStatusOverview && <p className="text-text-secondary">Could not load system overview.</p>}
            </Card>

            <Card title="System Settings (Mock)" icon={<CogIcon className="w-5 h-5 text-accent-blue" />}>
             <div className="space-y-3">
                <div>
                    <label htmlFor="apiKey" className="text-xs text-text-secondary block mb-1">Global API Key</label>
                    <input type="text" id="apiKey" placeholder="************* (Hidden)" disabled className="input-field text-xs !mt-0 disabled:opacity-70" />
                </div>
                 <div>
                    <label htmlFor="cpuThreshold" className="text-xs text-text-secondary block mb-1">Maintenance Mode</label>
                    <label htmlFor="maintenanceMode" className="flex items-center cursor-pointer mt-1">
                        <div className="relative">
                            <input type="checkbox" id="maintenanceMode" className="sr-only" />
                            <div className="block bg-tertiary-dark w-10 h-6 rounded-full"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
                        </div>
                        <div className="ml-3 text-text-secondary text-xs">Enable Maintenance Mode</div>
                    </label>
                </div>
                <button className="btn-secondary text-xs w-full mt-2">Save Settings (Mock)</button>
            </div>
             <style>{maintenanceModeStyle}</style>
            </Card>
        </div>
      </div>
      
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.username}` : "Add New User"}
      >
        <form onSubmit={handleUserFormSubmit} className="space-y-4">
         {modalActionFeedback && (
            <div role="alert" className={`p-3 rounded-md text-sm ${modalActionFeedback.success ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
              {modalActionFeedback.message}
            </div>
           )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-secondary">Username</label>
            <input 
              type="text" name="username" id="username" 
              value={userFormData.username} 
              onChange={handleUserFormChange} 
              required 
              disabled={!!editingUser} 
              className="input-field disabled:opacity-70"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary">Email</label>
            <input 
              type="email" name="email" id="email" 
              value={userFormData.email} 
              onChange={handleUserFormChange} 
              required 
              className="input-field"
            />
          </div>
          {!editingUser && ( 
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary">Password</label>
              <input 
                type="password" name="password" id="password" 
                value={userFormData.password || ''} 
                onChange={handleUserFormChange} 
                required={!editingUser}
                className="input-field"
                placeholder="Min 8 characters"
              />
            </div>
          )}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input 
                id="is_admin" name="is_admin" type="checkbox" 
                checked={userFormData.is_admin} 
                onChange={handleUserFormChange}
                className="h-4 w-4 text-accent-blue border-tertiary-dark rounded focus:ring-accent-blue" 
              />
              <label htmlFor="is_admin" className="ml-2 block text-sm text-text-secondary">Administrator</label>
            </div>
            <div className="flex items-center">
              <input 
                id="is_active" name="is_active" type="checkbox" 
                checked={userFormData.is_active} 
                onChange={handleUserFormChange}
                className="h-4 w-4 text-accent-blue border-tertiary-dark rounded focus:ring-accent-blue" 
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-text-secondary">Active</label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsUserModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loadingUserAction[`add-undefined`] || (editingUser && loadingUserAction[`edit-${editingUser.id}`])}
              className="btn-primary"
            >
              {(loadingUserAction[`add-undefined`] || (editingUser && loadingUserAction[`edit-${editingUser.id}`])) ? 
                <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> Saving...</> : 
                (editingUser ? 'Save Changes' : 'Add User')
              }
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => { setIsConfirmDeleteModalOpen(false); setUserToDelete(null); }}
        onConfirm={confirmDeleteUser}
        title="Confirm User Deletion"
        message={`Are you sure you want to delete user "${userToDelete?.username}" (ID: ${userToDelete?.id})? This action cannot be undone.`}
        confirmButtonText="Delete User"
        confirmButtonClassName="btn-danger"
        isLoading={loadingUserAction[`delete-${userToDelete?.id}`]}
      />
    </div>
  );
};

export default AdminPanelPage;
