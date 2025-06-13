// src/services/systemService.ts
import { API_ENDPOINT } from '../config';

export interface BackendStatus {
  status: 'online' | 'offline' | 'error' | 'checking';
  message?: string;
  lastChecked?: Date;
  data?: any;
}

export const checkBackendHealth = async (): Promise<BackendStatus> => {
  if (!API_ENDPOINT) {
    return { status: 'error', message: 'API_ENDPOINT environment variable is not configured.', lastChecked: new Date() };
  }

  try {
    const response = await fetch(`${API_ENDPOINT}`); // Fetches root path '/'
    const currentTime = new Date();

    if (response.ok) {
      const data = await response.json();
      // Check for expected fields from the image response
      if (data && data.message && data.version) {
        return { status: 'online', data, lastChecked: currentTime };
      }
      return { status: 'offline', message: 'Unexpected response format from backend.', lastChecked: currentTime };
    }
    return { status: 'offline', message: `Backend check failed: Server responded with ${response.status}.`, lastChecked: currentTime };
  } catch (error: any) {
    console.error('Backend health check failed:', error);
    return { status: 'offline', message: error.message || 'Network error or backend unreachable.', lastChecked: new Date() };
  }
};
