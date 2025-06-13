
import { API_ENDPOINT } from '../config';
import { User, TokenResponse, ApiResponseMessage, UserRegistrationData } from '../types';

const AUTH_TOKEN_KEY = 'authToken';
const UNAUTHORIZED_EVENT = 'global-unauthorized'; // Event name

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

interface ApiErrorDetail {
  detail: string | { msg: string, type: string }[];
}

// General error handler, does not dispatch event itself.
const handleApiError = async (response: Response): Promise<string> => {
  try {
    const errorData: ApiErrorDetail = await response.json();
    if (typeof errorData.detail === 'string') {
      return errorData.detail;
    } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
      return errorData.detail.map(d => typeof d.msg === 'string' ? d.msg : JSON.stringify(d)).join(', ');
    }
    return response.statusText || `API Error: ${response.status}`;
  } catch (e) {
    return response.statusText || `API Error: ${response.status}. Failed to parse error response.`;
  }
};


export const loginUser = async (username: string, password: string): Promise<TokenResponse> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured. Please set the API_ENDPOINT environment variable.");

  const details = {
    username: username,
    password: password,
    grant_type: 'password', 
    scope: '', 
    client_id: '', 
    client_secret: '' 
  };

  const formBody = [];
  for (const property in details) {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(details[property as keyof typeof details]);
    formBody.push(encodedKey + "=" + encodedValue);
  }

  const response = await fetch(`${API_ENDPOINT}/api/v1/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
       'Accept': 'application/json', 
    },
    body: formBody.join("&")
  });

  if (!response.ok) {
    // Login specific 401s usually mean bad credentials, not session expiry.
    // So, we don't dispatch the global unauthorized event here.
    const errorMsg = await handleApiError(response);
    throw new Error(errorMsg);
  }
  return response.json();
};

export const fetchCurrentUserData = async (token: string): Promise<User> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const response = await fetch(`${API_ENDPOINT}/api/v1/auth/me`, {
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
    const errorMsg = await handleApiError(response);
    throw new Error(errorMsg);
  }
  return response.json();
};

export const logoutUser = async (token: string): Promise<ApiResponseMessage> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured. Please set the API_ENDPOINT environment variable.");
  const response = await fetch(`${API_ENDPOINT}/api/v1/auth/logout`, { 
    method: 'POST', 
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // If logout itself fails with 401, the token is already bad.
      // The global handler in AuthContext will eventually catch this if another API call is made,
      // or if fetchCurrentUserData failed before this. Dispatching here might be redundant
      // but harmless if AuthContext's logout is idempotent.
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const errorMsg = await handleApiError(response);
    // For logout, don't throw an error that breaks the flow, just log it.
    console.warn(`Logout API call failed: ${errorMsg}`);
    return { success: false, message: `Server logout failed: ${errorMsg}` };
  }
  return response.json(); 
};

export const registerUser = async (userData: UserRegistrationData): Promise<User> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  
  const payload = {
    username: userData.username,
    email: userData.email,
    password: userData.password, 
    is_active: userData.is_active !== undefined ? userData.is_active : true, 
    is_admin: userData.is_admin !== undefined ? userData.is_admin : false,   
  };

  const response = await fetch(`${API_ENDPOINT}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
     const errorMsg = await handleApiError(response);
    throw new Error(errorMsg);
  }
  return response.json(); 
};
