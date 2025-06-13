
import {
  SystemStatus, AdaptationEvent, QuantumFeatureEvolutionPoint, FederatedClientStatus, ClientStatusType,
  AttackTrendPoint, SecurityEvent, ModelPerformanceMetrics, Dataset, 
  ApiResponseMessage, BenchmarkConfig, 
  Alert, MonitoringEvent, AttackDataResponse, TrafficDataResponse, SystemMonitoringStatusAPI,
  ApiTrainingJobStartConfig, TrainingJobStatusInfo, ModelStatus, ModelRegistryStatus, ModelRegistryInfo
} from '../src/types'; 
import { API_ENDPOINT } from '../src/config';
import { getAuthToken } from '../src/services/authService';

const UNAUTHORIZED_EVENT = 'global-unauthorized'; // Event name

// Helper function for making API requests
const makeApiRequest = async <T>(
  path: string, 
  method: string = 'GET', 
  body: any = null,
  isFormData: boolean = false 
): Promise<T> => {
  if (!API_ENDPOINT) throw new Error("API endpoint not configured.");
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    if (isFormData) {
      // For FormData, Content-Type is set automatically by the browser
      config.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }
  }
  
  const response = await fetch(`${API_ENDPOINT}${path}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    let errorMsg = `API request to ${path} failed with status ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || (Array.isArray(errorData.detail) ? errorData.detail.map((d:any)=>d.msg).join(', ') : errorData.message) || errorMsg;
    } catch (e) {
      // Ignore if error response is not JSON
    }
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  if (response.status === 204 || response.headers.get("content-length") === "0") { // No Content
    return { success: true, message: "Operation successful, no content returned." } as unknown as T;
  }
  return response.json() as Promise<T>;
};


// --- System Status ---
export const fetchSystemMonitoringStatusApi = (): Promise<SystemMonitoringStatusAPI> => {
  return makeApiRequest<SystemMonitoringStatusAPI>('/api/v1/monitoring/status');
};

// --- Alerts ---
export const fetchAlertsApi = (limit: number = 5): Promise<Alert[]> => {
  return makeApiRequest<Alert[]>(`/api/v1/monitoring/alerts?limit=${limit}`);
};

// --- Monitoring Events ---
export const fetchMonitoringEventsApi = (limit: number = 10): Promise<MonitoringEvent[]> => {
  return makeApiRequest<MonitoringEvent[]>(`/api/v1/monitoring/events?limit=${limit}`);
};

// --- Attack Data ---
export const fetchAttackDataApi = (): Promise<AttackDataResponse> => {
  return makeApiRequest<AttackDataResponse>('/api/v1/monitoring/attacks');
};

// --- Traffic Data ---
export const fetchTrafficDataApi = (): Promise<TrafficDataResponse> => {
  return makeApiRequest<TrafficDataResponse>('/api/v1/monitoring/traffic');
};

// --- Training Job Endpoints ---
export const startNewTrainingJob = (config: ApiTrainingJobStartConfig): Promise<TrainingJobStatusInfo> => {
  return makeApiRequest<TrainingJobStatusInfo>('/api/v1/training/start', 'POST', config);
};

export const listTrainingJobs = (): Promise<TrainingJobStatusInfo[]> => {
  return makeApiRequest<TrainingJobStatusInfo[]>('/api/v1/training/jobs', 'GET');
};

export const getTrainingJobStatus = (trainingId: string): Promise<TrainingJobStatusInfo> => {
  return makeApiRequest<TrainingJobStatusInfo>(`/api/v1/training/${trainingId}/status`, 'GET');
};

export const cancelTrainingJob = (trainingId: string): Promise<ApiResponseMessage> => {
  return makeApiRequest<ApiResponseMessage>(`/api/v1/training/${trainingId}/cancel`, 'POST', null);
};

// --- Model Storage Endpoints ---
const transformApiModel = (apiModel: any): ModelPerformanceMetrics => {
  const fem = apiModel.final_evaluation_metrics;
  
  const accuracy = fem?.overall_accuracy ?? fem?.val_accuracy ?? apiModel.accuracy;
  const f1_score = fem?.overall_f1_weighted ?? fem?.val_f1 ?? apiModel.f1_score;
  const precision = fem?.overall_precision_weighted ?? fem?.val_precision ?? apiModel.precision;
  const recall = fem?.overall_recall_weighted ?? fem?.val_recall ?? apiModel.recall;

  return {
    ...apiModel,
    accuracy: accuracy,
    f1_score: f1_score,
    precision: precision,
    recall: recall,
    created_at: new Date(apiModel.created_at),
    isLoaded: apiModel.status?.toLowerCase() === 'active',
    final_evaluation_metrics: fem ? { ...fem } : undefined,
  };
};

export const listModelsService = async (): Promise<ModelPerformanceMetrics[]> => {
  const apiModels = await makeApiRequest<any[]>('/api/v1/models/');
  return apiModels.map(transformApiModel);
};

export const getModelByIdService = async (modelId: string): Promise<ModelPerformanceMetrics | null> => {
  try {
    const apiModel = await makeApiRequest<any>(`/api/v1/models/${modelId}`);
    return transformApiModel(apiModel);
  } catch (error: any) {
    if (error.message.includes('404')) return null;
    throw error;
  }
};

export const uploadNewModelService = (formData: FormData): Promise<ModelPerformanceMetrics> => {
  return makeApiRequest<ModelPerformanceMetrics>('/api/v1/models/upload', 'POST', formData, true);
};

export const deleteModelService = (modelId: string): Promise<ApiResponseMessage> => {
  return makeApiRequest<ApiResponseMessage>(`/api/v1/models/${modelId}`, 'DELETE');
};

export const loadModelService = (modelId: string): Promise<ApiResponseMessage> => {
  return makeApiRequest<ApiResponseMessage>(`/api/v1/models/${modelId}/load`, 'POST');
};

export const unloadModelService = (modelId: string): Promise<ApiResponseMessage> => {
  return makeApiRequest<ApiResponseMessage>(`/api/v1/models/${modelId}/unload`, 'POST');
};

// --- Model Registry Endpoints ---
const transformApiRegistryModel = (apiModel: any): ModelRegistryInfo => {
    return {
        ...apiModel, // Spread first to include all fields like id, model_id, version etc.
        status: apiModel.status as ModelRegistryStatus, // Ensure status is correctly typed
        created_at: new Date(apiModel.created_at),
        promoted_at: apiModel.promoted_at ? new Date(apiModel.promoted_at) : null, // API returns null not undefined
        // Ensure benchmark_results, source_training_id, base_model_id are handled (null if API returns null)
        benchmark_results: apiModel.benchmark_results || null,
        source_training_id: apiModel.source_training_id || null,
        base_model_id: apiModel.base_model_id || null,
    };
};


export const listRegistryModelsService = async (statusFilter?: ModelRegistryStatus): Promise<ModelRegistryInfo[]> => {
  let path = '/api/v1/registry/models';
  if (statusFilter) {
    path += `?status_filter=${statusFilter}`;
  }
  const apiModels = await makeApiRequest<any[]>(path);
  return apiModels.map(transformApiRegistryModel);
};

export const getRegistryModelByIdService = async (modelId: string): Promise<ModelRegistryInfo | null> => {
   try {
    const apiModel = await makeApiRequest<any>(`/api/v1/registry/models/${modelId}`);
    return transformApiRegistryModel(apiModel);
  } catch (error: any) {
    if (error.message.includes('404')) return null;
    throw error;
  }
};

export const promoteRegistryModelService = (modelId: string, newStatus: ModelRegistryStatus): Promise<ModelRegistryInfo> => {
  return makeApiRequest<ModelRegistryInfo>(`/api/v1/registry/models/${modelId}/promote?new_status=${newStatus}`, 'POST');
};


// --- MOCK FUNCTIONS FOR OTHER PAGES (UNCHANGED FOR NOW IF NOT RELEVANT TO MODEL MGMT) ---
// ... (keep existing mock functions for other pages if they are still used and not replaced by real API calls)

export const fetchModelPerformanceMetrics = async (count?: number): Promise<ModelPerformanceMetrics[]> => {
  const models = await listModelsService();
  return count ? models.slice(0, count) : models;
};

export const fetchModelById = getModelByIdService;

// This function might be slightly confusing now that promoteRegistryModelService exists.
// Ensure components call the correct service. This one is kept for backward compatibility on ModelPerformancePage for now.
export const promoteModel = async (modelId: string, newStatus: ModelRegistryStatus): Promise<ApiResponseMessage> => {
  await promoteRegistryModelService(modelId, newStatus); // Call the actual service
  return { success: true, message: `Model ${modelId} status promotion to ${newStatus} initiated.` };
};

export const deleteModel = deleteModelService;
export const loadModel = loadModelService;
export const unloadModel = unloadModelService;

export const uploadNewModel = async (formData: FormData): Promise<ModelPerformanceMetrics> => {
  return uploadNewModelService(formData);
};

export const runBenchmarkTest = (modelId: string, config: BenchmarkConfig): Promise<ApiResponseMessage> => {
  return new Promise(resolve => {
    setTimeout(async () => {
      const model = await getModelByIdService(modelId);
      if (model) {
        if (model.status === 'Training' || model.status === 'Uploaded') {
             resolve({ success: false, message: `Cannot benchmark model ${modelId} in ${model.status} state.` });
             return;
        }
        resolve({ success: true, message: `${config.testType} test started for model ${modelId}. Results will be available soon.` });
      } else {
        resolve({ success: false, message: "Model not found for benchmarking." });
      }
    }, 300 * 2);
  });
};
// Other mock functions (fetchSystemStatus, fetchAdaptationEvents, etc.) remain as is for now
// ... (rest of the existing mock functions from the original file)
const random = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(random(min, max));
const randomChoice = <T,>(arr: T[]): T => arr[randomInt(0, arr.length)];
const randomId = () => `id_${Date.now()}_${randomInt(1000,9999)}`;
const generatePastDate = (daysAgo: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};
const MOCK_API_DELAY = 300; 

export const fetchSystemStatus = (): Promise<SystemStatus> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const healthStatusApi: SystemMonitoringStatusAPI['system_health'] = randomChoice(['Excellent', 'Good', 'Fair', 'Critical']); 
      let mappedHealth: SystemStatus['systemHealth'];
      switch (healthStatusApi.toLowerCase()) {
          case 'excellent':
          case 'good':
              mappedHealth = 'Optimal';
              break;
          case 'fair':
              mappedHealth = 'Warning';
              break;
          case 'critical':
              mappedHealth = 'Critical';
              break;
          default:
              mappedHealth = 'Unknown';
      }
      
      const status: SystemStatus = {
        systemHealth: mappedHealth,
        activeModels: randomInt(0, 5),
        totalPredictions: randomInt(100, 10000),
        avgResponseTimeMs: parseFloat(random(10, 300).toFixed(2)),
        cpuUsagePercent: parseFloat(random(5, 95).toFixed(1)),
        memoryUsagePercent: parseFloat(random(10, 90).toFixed(1)),
        gpuUsagePercent: Math.random() > 0.3 ? parseFloat(random(0, 80).toFixed(1)) : undefined,
        activeFederatedClients: randomInt(0, 20),
        lastTrainingTimestamp: generatePastDate(randomInt(1, 30)).toISOString(),
        dataIngestionRate: `${randomInt(50, 600)} events/sec`,
        anomalyDetectionRate: `${randomInt(0, 15)}/hr`,
      };
      resolve(status);
    }, MOCK_API_DELAY);
  });
};


export const fetchAdaptationEvents = (count: number = 20): Promise<AdaptationEvent[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const events: AdaptationEvent[] = [];
      let currentTime = new Date();
      for (let i = 0; i < count; i++) {
        currentTime.setHours(currentTime.getHours() - randomInt(1, 5));
        events.push({
          timestamp: new Date(currentTime.getTime()),
          newAttackDetected: Math.random() > 0.7,
          adaptationTimeSeconds: parseFloat(random(1, 15).toFixed(2)),
          accuracyAfterAdaptation: parseFloat(random(0.85, 0.99).toFixed(3)),
        });
      }
      resolve(events.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()));
    }, MOCK_API_DELAY);
  });
};

export const fetchQuantumFeatureEvolution = (featuresCount: number = 5, iterations: number = 20): Promise<QuantumFeatureEvolutionPoint[][]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const evolutionData: QuantumFeatureEvolutionPoint[][] = [];
      const featureNames = Array.from({ length: featuresCount }, (_, i) => `Feature_${String.fromCharCode(65 + i)}`);
      
      for (let i = 0; i < featuresCount; i++) {
        const featureEvolution: QuantumFeatureEvolutionPoint[] = [];
        let currentProb = random(0.05, 0.2);
        for (let j = 0; j < iterations; j++) {
          featureEvolution.push({
            iteration: j + 1,
            featureName: featureNames[i],
            selectionProbability: parseFloat(Math.min(1, Math.max(0, currentProb)).toFixed(3)),
          });
          currentProb += random(-0.05, 0.08); 
        }
        evolutionData.push(featureEvolution);
      }
      resolve(evolutionData);
    }, MOCK_API_DELAY);
  });
};


export const fetchFederatedClientStatus = (count: number = 10): Promise<FederatedClientStatus[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const statuses: ClientStatusType[] = ['Active', 'Training', 'Offline', 'Stale'];
      const clients: FederatedClientStatus[] = Array.from({ length: count }, (_, i) => ({
        clientId: `client_${String(i + 1).padStart(3, '0')}`,
        status: randomChoice(statuses),
        lastUpdate: generatePastDate(randomInt(0, 7)),
        localAccuracy: parseFloat(random(0.75, 0.98).toFixed(3)),
        dataSamples: randomInt(1000, 50000),
        contributionScore: parseFloat(random(0.5, 1.0).toFixed(2)),
      }));
      resolve(clients);
    }, MOCK_API_DELAY);
  });
};


let securityEventsCache: SecurityEvent[] = [];
export const fetchSecurityEvents = (count: number = 50): Promise<SecurityEvent[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (securityEventsCache.length === 0) {
        const severities: Array<'Low' | 'Medium' | 'High' | 'Critical'> = ['Low', 'Medium', 'High', 'Critical', 'Medium', 'Low', 'Low'];
        const attackTypes = ['Port Scan', 'SQL Injection Attempt', 'Anomalous Login', 'Data Exfiltration', 'Policy Violation', 'Unknown Traffic', 'Malware Signature'];
        securityEventsCache = Array.from({ length: count }, (_, i) => ({
          id: `event_${Date.now() - i * 100000}_${randomInt(1000,9999)}`,
          timestamp: generatePastDate(randomInt(0, 3)),
          severity: randomChoice(severities),
          description: `${randomChoice(attackTypes)} detected from ${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}`,
          sourceIp: `${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}.${randomInt(1,255)}`,
          destinationIp: `192.168.1.${randomInt(10,100)}`,
          attackType: randomChoice(attackTypes),
        })).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
      }
      resolve(securityEventsCache.slice(0, count));
    }, MOCK_API_DELAY);
  });
};
fetchSecurityEvents(100); 

export const startFederatedRound = (): Promise<ApiResponseMessage> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, message: `New federated learning round (ID: ${randomInt(100,999)}) started.` });
    }, MOCK_API_DELAY);
  });
};

export const updateFederatedClientStatus = (clientId: string, newStatus: ClientStatusType): Promise<ApiResponseMessage> => {
   return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, message: `Client ${clientId} status update to ${newStatus} requested.` });
    }, MOCK_API_DELAY);
  });
};

export const deregisterFederatedClient = (clientId: string): Promise<ApiResponseMessage> => {
   return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, message: `Client ${clientId} deregistration requested.` });
    }, MOCK_API_DELAY);
  });
};

export const generateSystemReport = (startDate?: Date, endDate?: Date): Promise<ApiResponseMessage> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, message: `System report generation started for period ${startDate?.toLocaleDateString() || 'all time'} to ${endDate?.toLocaleDateString() || 'now'}. Report will be available shortly.` });
    }, MOCK_API_DELAY * 2);
  });
};

export const makePrediction = (features: any): Promise<ApiResponseMessage> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, message: "Prediction successful.", data: { prediction: randomChoice(["Benign", "Malicious"]), confidence: random(0.7, 0.99).toFixed(2) } });
    }, MOCK_API_DELAY);
  });
};

export const explainPrediction = (predictionId: string): Promise<ApiResponseMessage> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, message: "Explanation retrieved.", data: { top_features: ["Feature_A", "Feature_C", "Feature_X"], importance: [0.6, 0.25, 0.1] } });
    }, MOCK_API_DELAY);
  });
};

export const fetchAttackTrends = (days: number = 7, types: number = 5): Promise<AttackTrendPoint[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const trends: AttackTrendPoint[] = [];
      const attackTypesPool = ['DDoS', 'Malware', 'Phishing', 'Port Scan', 'SQL Injection', 'Brute Force', 'Zero-day Exploit', 'Ransomware'];
      
      for (let i = 0; i < days; i++) {
        const dateForDay = generatePastDate(days - 1 - i);
        const numTypesForDay = randomInt(1, Math.min(types, attackTypesPool.length));
        const selectedAttackTypesToday = new Set<string>();

        while(selectedAttackTypesToday.size < numTypesForDay) {
            selectedAttackTypesToday.add(randomChoice(attackTypesPool));
        }

        selectedAttackTypesToday.forEach(attackType => {
            trends.push({
                timestamp: new Date(dateForDay.getTime()), 
                attackType: attackType,
                count: randomInt(5, 150),
            });
        });
      }
      resolve(trends.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime()));
    }, MOCK_API_DELAY);
  });
};
