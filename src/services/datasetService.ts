
import { API_ENDPOINT } from '../config';
import { Dataset, DatasetStatus, ApiResponseMessage, DatasetStatistics, PipelineFeatureSelectionConfig, FeatureSelectionRun } from '../types';
import { getAuthToken } from './authService';

const UNAUTHORIZED_EVENT = 'global-unauthorized'; // Event name

// Helper to parse API errors
const handleDatasetApiError = async (response: Response): Promise<string> => {
  try {
    const errorData: ApiResponseMessage = await response.json();
    if (errorData.detail) {
      if (typeof errorData.detail === 'string') {
        return errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0 && typeof errorData.detail[0] === 'object' && errorData.detail[0].msg) {
        return errorData.detail.map((d: any) => `${d.loc.join('.')} - ${d.msg}`).join('; ');
      } else if (typeof errorData.detail === 'object' && (errorData.detail as any).msg) { 
        return (errorData.detail as any).msg;
      }
    }
    if (errorData.message) return errorData.message;
    return response.statusText || 'An unknown API error occurred.';
  } catch (e) {
    return response.statusText || 'Failed to parse error response.';
  }
};

const mapApiStatusToDatasetStatus = (apiStatus: string): DatasetStatus => {
  const statusMap: Record<string, DatasetStatus> = {
    'uploaded': 'Uploaded',
    'preprocessing': 'Pipeline_Preprocessing_Running', 
    'preprocessing_scheduled': 'Pipeline_Preprocessing_Scheduled',
    'preprocessing_running': 'Pipeline_Preprocessing_Running',
    'preprocessing_completed': 'Pipeline_Preprocessing_Completed',
    'preprocessed': 'Pipeline_Preprocessing_Completed', 
    'feature_selection_scheduled': 'Pipeline_Feature_Selection_Scheduled',
    'feature_selection_running': 'Pipeline_Feature_Selection_Running',
    'qifs_running': 'Pipeline_Feature_Selection_Running', 
    'feature_selection_completed': 'Pipeline_Feature_Selection_Completed',
    'ready': 'Ready',
    'error': 'Error',
    'pipeline_error': 'Pipeline_Error'
  };
  return statusMap[apiStatus?.toLowerCase()] || 'Error'; 
};

const transformApiDataset = (apiDataset: any): Dataset => {
  const fileSizeBytes = apiDataset.file_size;
  return {
    id: apiDataset.dataset_id,
    name: apiDataset.name,
    description: apiDataset.description,
    status: mapApiStatusToDatasetStatus(apiDataset.status),
    rowCount: apiDataset.sample_count,
    columnCount: apiDataset.feature_count,
    fileSizeBytes: fileSizeBytes,
    sizeMB: parseFloat((fileSizeBytes / (1024 * 1024)).toFixed(2)),
    createdAt: new Date(apiDataset.created_at),
    updatedAt: apiDataset.updated_at ? new Date(apiDataset.updated_at) : undefined,
    filePath: apiDataset.file_path,
    statistics: apiDataset.statistics as DatasetStatistics,
    processingHistory: apiDataset.processing_steps,
    numericId: apiDataset.id,
    current_task_id: apiDataset.current_task_id,
    sampleData: apiDataset.sample_data // Assuming sample_data comes directly from API
  };
};

export const listDatasets = async (): Promise<Dataset[]> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(`${API_ENDPOINT}/api/v1/datasets/`, {
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
    const errorMsg = await handleDatasetApiError(response);
    throw new Error(`Failed to list datasets: ${errorMsg}`);
  }
  const apiDatasets: any[] = await response.json();
  return apiDatasets.map(transformApiDataset);
};

export const getDatasetById = async (datasetId: string): Promise<Dataset | null> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(`${API_ENDPOINT}/api/v1/datasets/${datasetId}`, {
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
    if (response.status === 404) return null;
    const errorMsg = await handleDatasetApiError(response);
    throw new Error(`Failed to fetch dataset ${datasetId}: ${errorMsg}`);
  }
  const apiDataset: any = await response.json();
  return transformApiDataset(apiDataset);
};

export const uploadDatasetFile = async (file: File, name: string, description?: string): Promise<Dataset> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch(`${API_ENDPOINT}/api/v1/datasets/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const errorMsg = await handleDatasetApiError(response);
    throw new Error(`Failed to upload dataset: ${errorMsg}`);
  }
  const apiDataset: any = await response.json();
  return transformApiDataset(apiDataset);
};

export const deleteDatasetById = async (datasetId: string): Promise<ApiResponseMessage> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(`${API_ENDPOINT}/api/v1/datasets/${datasetId}`, {
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
    if (response.status === 204) { // No content but successful
      return { success: true, message: `Dataset ${datasetId} deleted successfully.` };
    }
    const errorMsg = await handleDatasetApiError(response);
    throw new Error(`Failed to delete dataset ${datasetId}: ${errorMsg}`);
  }
  try {
     // Check for 204 No Content before trying to parse JSON
    if (response.status === 204) {
      return { success: true, message: `Dataset ${datasetId} deleted successfully.` };
    }
    return await response.json();
  } catch (e) {
     return { success: true, message: `Dataset ${datasetId} deletion status: ${response.status}.` };
  }
};

export const preprocessDatasetPipeline = async (datasetId: string): Promise<ApiResponseMessage> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(`${API_ENDPOINT}/api/v1/data-pipeline/${datasetId}/preprocess`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const errorMsg = await handleDatasetApiError(response);
    throw new Error(`Failed to start preprocessing for dataset ${datasetId}: ${errorMsg}`);
  }
  return response.json(); 
};

export const selectFeaturesPipeline = async (datasetId: string, config: PipelineFeatureSelectionConfig): Promise<ApiResponseMessage> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(`${API_ENDPOINT}/api/v1/data-pipeline/${datasetId}/select-features`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const errorMsg = await handleDatasetApiError(response);
    throw new Error(`Failed to start feature selection for dataset ${datasetId}: ${errorMsg}`);
  }
  return response.json(); 
};

export const listFeatureSelectionRuns = async (datasetId?: string): Promise<FeatureSelectionRun[]> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  let url = `${API_ENDPOINT}/api/v1/data-pipeline/feature-selection-runs/`;
  if (datasetId) {
    url += `?dataset_id=${encodeURIComponent(datasetId)}`;
  }

  const response = await fetch(url, {
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
    const errorMsg = await handleDatasetApiError(response);
    throw new Error(`Failed to list feature selection runs: ${errorMsg}`);
  }
  return response.json();
};

export const getFeatureSelectionRunById = async (fsrunId: string): Promise<FeatureSelectionRun | null> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(`${API_ENDPOINT}/api/v1/data-pipeline/feature-selection-runs/${fsrunId}`, {
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
    if (response.status === 404) return null;
    const errorMsg = await handleDatasetApiError(response);
    throw new Error(`Failed to fetch feature selection run ${fsrunId}: ${errorMsg}`);
  }
  return response.json();
};
