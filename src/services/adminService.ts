
import { API_ENDPOINT } from '../config';
import { User, ApiResponseMessage, AdminStatusOverview } from '../types';
import { getAuthToken } from './authService'; 

const UNAUTHORIZED_EVENT = 'global-unauthorized'; // Event name

interface ApiErrorDetail {
  detail: string | { msg: string, type: string }[];
}

const handleAdminApiError = async (response: Response): Promise<string> => {
  try {
    const errorData: ApiErrorDetail = await response.json();
    if (typeof errorData.detail === 'string') {
      return errorData.detail;
    } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
      return errorData.detail.map(d => typeof d.msg === 'string' ? d.msg : JSON.stringify(d)).join(', ');
    }
    return response.statusText || 'An unknown admin API error occurred.';
  } catch (e) {
    return response.statusText || 'Failed to parse admin API error response.';
  }
};

export const fetchAdminStatusOverview = async (): Promise<AdminStatusOverview> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(`${API_ENDPOINT}/api/v1/admin/status/overview`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const errorMsg = await handleAdminApiError(response);
    throw new Error(`Failed to fetch admin status overview: ${errorMsg}`);
  }
  return response.json();
};

interface RawUserFromAdminApi {
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  id: number; 
  created_at: string;
  last_login: string | null;
}

export const fetchAllUsers = async (): Promise<User[]> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(`${API_ENDPOINT}/api/v1/admin/users`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const errorMsg = await handleAdminApiError(response);
    throw new Error(`Failed to fetch users: ${errorMsg}`);
  }
  const rawUsers: RawUserFromAdminApi[] = await response.json();
  return rawUsers.map(rawUser => ({
    ...rawUser,
    id: rawUser.id.toString(), 
  }));
};

export const updateUserAdmin = async (userId: string, userData: Partial<Pick<User, 'email' | 'is_active' | 'is_admin'>>): Promise<User> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");
  
  const numericUserId = Number(userId);
  if (isNaN(numericUserId)) throw new Error("Invalid user ID format for API call.");

  const response = await fetch(`${API_ENDPOINT}/api/v1/admin/users/${numericUserId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const errorMsg = await handleAdminApiError(response);
    throw new Error(`Failed to update user ${userId}: ${errorMsg}`);
  }
  const updatedRawUser: RawUserFromAdminApi = await response.json();
  return {
    ...updatedRawUser,
    id: updatedRawUser.id.toString(),
  };
};

export const deleteUserAdmin = async (userId: string): Promise<ApiResponseMessage> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const numericUserId = Number(userId);
  if (isNaN(numericUserId)) throw new Error("Invalid user ID format for API call.");

  const response = await fetch(`${API_ENDPOINT}/api/v1/admin/users/${numericUserId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    if (response.status === 204) { 
        return { success: true, message: `User ${userId} deleted successfully.` };
    }
    const errorMsg = await handleAdminApiError(response);
    throw new Error(`Failed to delete user ${userId}: ${errorMsg}`);
  }
   try {
    if (response.status === 204) {
      return { success: true, message: `User ${userId} deleted successfully.` };
    }
    return await response.json();
  } catch (e) {
    return { success: true, message: `User ${userId} deletion status: ${response.status}` };
  }
};
