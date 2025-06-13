
export interface NavigationLink {
  path: string;
  name: string;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  isAdminOnly?: boolean; 
}

export interface MetricDisplayProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: string | number;
  deltaType?: 'positive' | 'negative' | 'neutral';
  helpText?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  trend?: { data: number[], positiveIsGood: boolean };
}

// Internal SystemStatus used by components
export interface SystemStatus {
  systemHealth: 'Excellent' | 'Optimal' | 'Warning' | 'Critical' | 'Unknown';
  activeModels: number;
  totalPredictions: number;
  avgResponseTimeMs: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  gpuUsagePercent?: number;
  activeFederatedClients: number; 
  lastTrainingTimestamp?: string; 
  dataIngestionRate?: string; 
  anomalyDetectionRate?: string; 
}

// Type for /api/v1/monitoring/status API response
export interface SystemMonitoringStatusAPI {
  system_health: string; 
  active_models: number;
  total_predictions: number;
  average_response_time: number;
  cpu_usage: number;
  memory_usage: number;
  gpu_usage?: number;
  federated_clients: number;
  last_training: string; 
}

// Type for /api/v1/monitoring/alerts
export interface Alert {
  id: string;
  timestamp: string; 
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low'; 
  details_link: string;
}

// Type for /api/v1/monitoring/events
export interface MonitoringEvent {
  id: string;
  timestamp: string; 
  event: string;
  source_ip: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  confidence: number;
  action: string;
}

// Type for /api/v1/monitoring/attacks
export interface AttackDataResponse {
  timestamps: string[]; 
  types: string[]; 
  counts: number[][]; 
}

// Type for /api/v1/monitoring/traffic
export interface TrafficDataResponse {
  timestamps: string[]; 
  values: number[];
}


export interface AdminStatusOverview {
  total_registered_users: number;
  active_models: number;
  active_training_jobs: number;
  federated_clients_online: number;
}

export interface AdaptationEvent {
  timestamp: Date;
  newAttackDetected: boolean;
  adaptationTimeSeconds: number;
  accuracyAfterAdaptation: number;
}

export interface QuantumFeatureEvolutionPoint {
  iteration: number;
  featureName: string;
  selectionProbability: number;
}

export type ClientStatusType = 'Active' | 'Training' | 'Offline' | 'Stale';

export interface FederatedClientStatus {
  clientId: string;
  status: ClientStatusType;
  lastUpdate: Date;
  localAccuracy: number;
  dataSamples: number;
  contributionScore?: number;
}

export interface AttackTrendPoint { 
  timestamp: Date;
  attackType: string;
  count: number;
}

export interface SecurityEvent { 
  id: string;
  timestamp: Date;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  sourceIp?: string;
  destinationIp?: string;
  attackType?: string;
}

export type ModelStatus = "Uploaded" | "Loaded" | "Training" | "Archived" | "Staging" | "Production" | "Candidate" | "Active" | "Inactive" | string;

export interface PerClassMetrics {
  precision: number;
  recall: number;
  "f1-score": number;
  support: number;
}

export interface FinalEvaluationMetrics {
  overall_accuracy?: number; 
  overall_precision_weighted?: number; 
  overall_recall_weighted?: number; 
  overall_f1_weighted?: number; 
  
  val_loss?: number; 
  val_accuracy?: number; 
  val_precision?: number; 
  val_recall?: number; 
  val_f1?: number; 

  per_class_metrics?: { 
    [className: string]: PerClassMetrics | number; 
  };
}

export interface ModelPerformanceMetrics {
  model_id: string;
  model_type: string;
  status: ModelStatus;
  version: string;
  loss?: number | null | undefined; 
  accuracy: number | null | undefined; 
  precision: number | null | undefined; 
  recall: number | null | undefined;    
  f1_score: number | null | undefined;   
  created_at: Date;
  size_mb?: number;
  feature_names?: string[];
  class_names?: string[];
  scaler_path?: string | null;
  label_encoder_path?: string | null;
  final_evaluation_metrics?: FinalEvaluationMetrics;

  adaptationSpeedMinutes?: number;
  uncertaintyScore?: number;
  lastTrained?: Date;
  datasetUsed?: string;
  trainingLogs?: string[];
  architecture?: string;
  hyperparameters?: Record<string, any>;
  featureImportance?: Record<string, number>;
  isLoaded?: boolean;
  registry_id?: number;
  source_training_id?: string;
  base_model_id?: string;
  benchmark_results?: Record<string, any>;
  promoted_at?: Date;
}

export interface ChartDataPoint {
  name: string; 
  value: number; 
  [key: string]: any; 
}

export interface TimeSeriesData {
  timestamp: number; 
  value: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  z?: number;
  name?: string;
  category?: string;
}

export type DatasetStatus =
  | 'Uploaded'
  | 'Preprocessing' 
  | 'Preprocessed'  
  | 'QIFS_Running'  
  | 'Ready'
  | 'Error'
  | 'Pipeline_Preprocessing_Scheduled'
  | 'Pipeline_Preprocessing_Running'
  | 'Pipeline_Preprocessing_Completed' 
  | 'Pipeline_Feature_Selection_Scheduled'
  | 'Pipeline_Feature_Selection_Running'
  | 'Pipeline_Feature_Selection_Completed' 
  | 'Pipeline_Error';


export interface DatasetStatistics {
  columns: string[];
  datatypes: Record<string, string>;
  null_counts: Record<string, number>;
}

export interface Dataset {
  id: string; 
  name: string;
  description?: string | null;
  status: DatasetStatus; 
  rowCount: number; 
  columnCount: number; 
  fileSizeBytes: number;
  sizeMB: number; 
  createdAt: Date; 
  updatedAt?: Date; 
  filePath?: string; 
  statistics?: DatasetStatistics; 
  processingHistory?: string[]; 
  numericId?: number; 
  sampleData?: Record<string, any>[]; 
  current_task_id?: string | null; 
}

export interface ApiTrainingJobStartConfig {
  dataset_id: string;
  model_type: string;
  perform_feature_selection: boolean;
  feature_selection_config?: Record<string, any>; 
  sequence_length: number;
  epochs: number;
  batch_size: number;
  learning_rate: number;
  hidden_dims: number[];
  dropout: number;
  training_id?: string; 
}

export interface TrainingJobStatusInfo {
  training_id: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PENDING' | 'QUEUED' | string; 
  current_stage: string;
  progress: number;
  current_epoch: number;
  total_epochs: number;
  current_accuracy: number;
  current_loss: number | null;
  estimated_completion: string | null;
  feature_selection_details: any | null;
  final_metrics_summary: any | null;
  error_message: string | null;
  model_type?: string; 
  dataset_id?: string;
  model_name?: string; 
}

export interface TrainingJobFormState {
  modelName: string; 
  datasetId: string;
  modelType: string;
  performFeatureSelection: boolean;
  sequenceLength: string;
  epochs: string;
  batchSize: string;
  learningRate: string;
  hiddenDims: string; 
  dropout: string;
}


export interface FeatureSelectionConfig { 
  method: 'Quantum' | 'Classical';
  targetFeatureCount?: number;
  iterations?: number;
}

export interface PipelineFeatureSelectionConfig {
  method: 'quantum' | 'classical'; 
  iterations?: number;
  early_stopping?: number;
}

export type FeatureSelectionRunStatus = 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface FeatureSelectionRun {
  id: number; 
  fsrun_id: string; 
  dataset_id: string; 
  source_dataset_id: string; 
  config: PipelineFeatureSelectionConfig; 
  status: FeatureSelectionRunStatus;
  notes?: string | null; 
  selected_features_count?: number | null; 
  selected_indices: number[]; 
  evolution_history?: any; 
  score?: number | null; 
  created_at: string; 
  task_id?: string | null; 
}

export type ModelRegistryStatus = "candidate" | "staging" | "production" | "archived";

export interface ModelRegistryInfo {
  id: number;
  model_id: string;
  version: string;
  status: ModelRegistryStatus; // Ensured this uses the ModelRegistryStatus type
  source_training_id?: string | null;
  base_model_id?: string | null;
  benchmark_results?: Record<string, any> | null;
  created_at: Date;
  promoted_at?: Date | null;
}


export interface ApiResponseMessage {
  success: boolean;
  message: string;
  data?: any;
  detail?: string | { loc: string[], msg: string, type: string }[]; 
}

export interface BenchmarkConfig {
  testType: 'Stress' | 'ConceptDrift';
  durationSeconds?: number;
  driftDatasetId?: string;
}

export interface User {
  id: string; 
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string; 
  last_login: string | null; 
}

export interface UserRegistrationData {
  username: string;
  email: string;
  password?: string; 
  is_active?: boolean; 
  is_admin?: boolean;  
}


export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>; 
  register: (userData: UserRegistrationData) => Promise<User>;
}

export interface ModelUploadFormData {
  model_file: File | null;
  metadata_file: File | null;
  scaler_file: File | null;
  encoder_file: File | null;
}


export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  error?: boolean;
}

export interface PageContextState {
  pagePath: string;
  pageTitle?: string;
  contextData?: any; 
}

export interface PageContextType extends PageContextState {
  setPageContext: (path: string, title?: string, data?: any) => void;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  render?: (item: T) => React.ReactNode;
  sortable?: boolean; 
  className?: string; 
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyStateMessage?: string;
  emptyStateIcon?: React.ReactNode;
  itemsPerPage?: number; 
}

export interface BackendStatus {
  status: 'online' | 'offline' | 'error' | 'checking';
  message?: string;
  lastChecked?: Date;
  data?: any;
}

export interface ReportSectionDetailItem {
  prediction_id?: number;
  attack_name?: string;
  event_count?: number;
  percentage_of_total?: number;
  dataset_id?: string;
  name?: string;
  file_path?: string;
  sample_count?: number;
  status?: string; 
  statistics?: any; 
  [key: string]: any; 
}

export interface ReportSectionSummary {
  time_period?: string;
  total_events_analyzed?: number;
  total_attacks_detected?: number;
  most_frequent_attack?: string;
  total_models?: number;
  active_models?: number;
  total_datasets?: number;
  total_jobs?: number;
  [key: string]: any;
}

export interface ReportSection {
  title: string;
  summary: ReportSectionSummary;
  details: ReportSectionDetailItem[];
}

export interface ReportData {
  report_id: string;
  generated_at: string; 
  report_title: string;
  sections: ReportSection[];
}
