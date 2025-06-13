
import { API_ENDPOINT } from '../config';
import { User, TokenResponse, ApiResponseMessage, UserRegistrationData } from '../types';

const AUTH_TOKEN_KEY = 'authToken';

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

const handleApiError = async (response: Response): Promise<string> => {
  try {
    const errorData: ApiErrorDetail = await response.json();
    if (typeof errorData.detail === 'string') {
      return errorData.detail;
    } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
      // Handle cases where detail is an array of error objects (e.g., Pydantic validation errors)
      return errorData.detail.map(d => typeof d.msg === 'string' ? d.msg : JSON.stringify(d)).join(', ');
    }
    // Fallback if errorData.detail is not in the expected format but response.json() succeeded
    return response.statusText || 'Unknown error structure received from API.';
  } catch (e) {
    // If parsing errorData fails, fallback to statusText
    return response.statusText || 'Failed to parse error response.';
  }
};


export const loginUser = async (username: string, password: string): Promise<TokenResponse> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured. Please set the API_ENDPOINT environment variable.");

  // For FastAPI's OAuth2PasswordRequestForm, data needs to be x-www-form-urlencoded
  const details = {
    username: username,
    password: password,
    grant_type: 'password', 
    scope: '', // Optional: adjust as needed by your backend
    client_id: '', // Optional
    client_secret: '' // Optional
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
       'Accept': 'application/json', // Expect JSON response
    },
    body: formBody.join("&")
  });

  if (!response.ok) {
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
    if (response.status === 401) removeAuthToken(); // Token likely invalid or expired
    const errorMsg = await handleApiError(response);
    throw new Error(errorMsg);
  }
  return response.json();
};

// Logout on the backend (optional, depends on backend implementation)
export const logoutUser = async (token: string): Promise<ApiResponseMessage> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured. Please set the API_ENDPOINT environment variable.");
  // This is a placeholder; actual logout might just be frontend token removal
  // or a backend call to invalidate a session/token if supported.
  const response = await fetch(`${API_ENDPOINT}/api/v1/auth/logout`, { // Assuming an endpoint exists
    method: 'POST', // or GET, depending on your API
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  // If the backend doesn't have a specific logout endpoint that invalidates tokens,
  // this might always "succeed" from a network perspective or return an error if endpoint doesn't exist.
  // The primary action of logout is removing the token locally.
  if (!response.ok) {
    // Don't throw critical error for logout failure, just warn or proceed
    const errorMsg = await handleApiError(response);
    console.warn(`Logout API call failed: ${errorMsg}`);
    // Return a success-like message as local logout will proceed
    return { success: true, message: "Local logout successful, server logout attempt had issues." };
  }
  return response.json(); // Assuming backend returns a success message
};

export const registerUser = async (userData: UserRegistrationData): Promise<User> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  
  // Ensure defaults for is_active and is_admin if not provided
  const payload = {
    username: userData.username,
    email: userData.email,
    password: userData.password, // Password should be handled by the backend
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
  // Assuming the backend returns the created user object upon successful registration
  return response.json(); 
};
