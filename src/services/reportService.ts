
import { API_ENDPOINT } from '../config';
import { ReportData, ApiResponseMessage } from '../types';
import { getAuthToken } from './authService';

const UNAUTHORIZED_EVENT = 'global-unauthorized'; // Event name

const handleReportApiError = async (response: Response): Promise<string> => {
  try {
    const errorData: ApiResponseMessage = await response.json();
    if (errorData.detail) {
      if (typeof errorData.detail === 'string') {
        return errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0 && typeof errorData.detail[0] === 'object' && errorData.detail[0].msg) {
        return errorData.detail.map((d: any) => `${d.loc.join('.')} - ${d.msg}`).join('; ');
      }
    }
    if (errorData.message) return errorData.message;
    return response.statusText || 'An unknown API error occurred while fetching report data.';
  } catch (e) {
    return response.statusText || 'Failed to parse error response for report data.';
  }
};

export const generateReportData = async (startDate: string, endDate: string): Promise<ReportData> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const url = `${API_ENDPOINT}/api/v1/reports/generate`;
  
  const body = {
    start_date: startDate,
    end_date: endDate,
  };

  const response = await fetch(url, {
    method: 'POST', 
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json', 
      'Accept': 'application/json',
    },
    body: JSON.stringify(body), 
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const errorMsg = await handleReportApiError(response);
    throw new Error(`Failed to generate report data: ${errorMsg}`);
  }
  return response.json();
};
