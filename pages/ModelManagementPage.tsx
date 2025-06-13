
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Table from '../components/Table';
import MetricDisplay from '../components/MetricDisplay';
import ViewSwitcher from '../components/ViewSwitcher';
import Modal from '../components/Modal';
import ConfirmationModal from '../src/components/ConfirmationModal'; 
import { 
  ModelPerformanceMetrics, ApiResponseMessage, TrainingJobFormState, 
  Dataset, TableColumn,
  ApiTrainingJobStartConfig, TrainingJobStatusInfo, ModelUploadFormData, ModelRegistryStatus, ModelRegistryInfo
} from '../src/types'; 
import { 
  listModelsService, 
  promoteRegistryModelService, 
  deleteModelService, 
  loadModelService, 
  unloadModelService, 
  uploadNewModelService, 
  startNewTrainingJob, 
  listTrainingJobs,    
  getTrainingJobStatus, 
  cancelTrainingJob,
  listRegistryModelsService     
} from '../services/mockDataService';
import { listDatasets } from '../src/services/datasetService'; 
import { useAuth } from '../contexts/AuthContext';
import { usePageContext } from '../contexts/PageContext'; 
import { useToast } from '../contexts/ToastContext'; 
import { ChartBarIcon, StarIcon, PlayCircleIcon, TrashIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, CpuChipIcon, StopIcon, ServerStackIcon, PlusCircleIcon, EyeIcon, ArrowUpTrayIcon, ArrowPathIcon, CogIcon, CubeIcon } from '@heroicons/react/24/outline'; 
import SkeletonLoader from '../components/SkeletonLoader';

const ModelCardItem: React.FC<{ 
  model: ModelPerformanceMetrics; 
  onAction: (actionPromise: Promise<any>, modelId: string, actionName: string) => void; 
  onDeleteRequest: (model: ModelPerformanceMetrics) => void;
  loadingModelAction: Record<string, boolean>; 
  isAdmin: boolean; 
}> =
  ({ model, onAction, onDeleteRequest, loadingModelAction, isAdmin }) => {
    
  const getStatusColorCard = (status: ModelPerformanceMetrics['status']) => {
    const s = status?.toLowerCase();
    if (s === 'active') return 'border-success'; 
    if (s === 'inactive') return 'border-gray-400';
    if (s === 'training') return 'border-purple-500 animate-pulse';
    if (s === 'uploaded' || s === 'candidate') return 'border-yellow-500'; // Grouping candidate with uploaded visually
    if (s === 'staging') return 'border-accent-blue';
    if (s === 'production') return 'border-success'; // Registry production
    if (s === 'archived') return 'border-slate-600';
    if (s === 'loaded') return 'border-teal-500'; 
    return 'border-gray-500';
  };

   const getStatusPillCard = (status: ModelPerformanceMetrics['status']) => {
    const s = status?.toLowerCase();
    let colors = 'bg-gray-500/30 text-gray-300';
    if (s === 'active') colors = 'bg-success/30 text-success';
    else if (s === 'inactive') colors = 'bg-gray-200/20 text-gray-200'; 
    else if (s === 'training') colors = 'bg-purple-500/30 text-purple-400 animate-pulse';
    else if (s === 'uploaded' || s === 'candidate') colors = 'bg-yellow-500/30 text-yellow-400';
    else if (s === 'staging') colors = 'bg-accent-blue/30 text-accent-blue';
    else if (s === 'production') colors = 'bg-success/30 text-success';
    else if (s === 'archived') colors = 'bg-slate-600/30 text-slate-400';
    else if (s === 'loaded') colors = 'bg-teal-500/30 text-teal-400';
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors}`}>{status}</span>;
  };
  
  const rawAccuracy = model.accuracy ?? 0;
  const displayAccuracyValue = rawAccuracy > 1 ? rawAccuracy : rawAccuracy * 100;
  const displayF1Score = model.f1_score ?? 0;

  return (
    <Card className={`border-l-4 ${getStatusColorCard(model.status)} hover:shadow-2xl transition-shadow flex flex-col`}>
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-1">
          <Link to={`/models/${model.model_id}`} className="text-lg font-semibold text-accent-blue hover:underline truncate mr-2" title={model.model_id}>
            {model.model_id.length > 25 ? `${model.model_id.substring(0, 25)}...` : model.model_id}
          </Link>
          {getStatusPillCard(model.status)}
        </div>
        <p className="text-xs text-text-secondary mb-1">Type: {model.model_type} / Version: {model.version}</p>
        <p className="text-xs text-text-secondary mb-3 truncate" title={`Size: ${model.size_mb !== undefined ? model.size_mb.toFixed(2) + 'MB' : 'N/A'}`}>
          Size: {model.size_mb !== undefined ? model.size_mb.toFixed(2) + 'MB' : 'N/A'}
        </p>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
          <span>Acc: <span className="text-text-primary font-medium">{displayAccuracyValue.toFixed(2)}%</span></span>
          <span>F1: <span className="text-text-primary font-medium">{displayF1Score.toFixed(3)}</span></span>
          {model.loss !== undefined && model.loss !== null && <span>Loss: <span className="text-text-primary font-medium">{model.loss.toFixed(4)}</span></span>}
        </div>
        <p className="text-xs text-text-secondary">Created: <span className="text-text-primary font-medium">{new Date(model.created_at).toLocaleDateString()}</span></p>
        {model.isLoaded && <p className="text-xs text-teal-400 font-semibold mt-1">Loaded in Memory</p>}
      </div>
      {isAdmin && (
         <div className="mt-auto pt-3 border-t border-tertiary-dark flex flex-wrap gap-1 justify-end items-center">
          {/* Promote button removed from here, will be on registry table */}
          {model.isLoaded ? (
             <button onClick={() => onAction(unloadModelService(model.model_id), model.model_id, `unload-${model.model_id}`)} disabled={loadingModelAction[`unload-${model.model_id}`]} className="p-1.5 text-text-secondary hover:text-yellow-400 disabled:opacity-50" title="Unload Model">
                {loadingModelAction[`unload-${model.model_id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <ArrowDownCircleIcon className="w-4 h-4"/>}
             </button>
          ) : (
             <button onClick={() => onAction(loadModelService(model.model_id), model.model_id, `load-${model.model_id}`)} disabled={loadingModelAction[`load-${model.model_id}`] || model.status?.toLowerCase() === 'archived' || model.status?.toLowerCase() === 'training'} className="p-1.5 text-text-secondary hover:text-success disabled:opacity-50" title="Load Model">
               {loadingModelAction[`load-${model.model_id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <ArrowUpCircleIcon className="w-4 h-4"/>}
             </button>
          )}
          <button onClick={() => onDeleteRequest(model)}
            disabled={loadingModelAction[`delete-${model.model_id}`]}
            className="p-1.5 text-text-secondary hover:text-danger disabled:opacity-50" title="Delete Model">
            {loadingModelAction[`delete-${model.model_id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <TrashIcon className="w-4 h-4"/>}
          </button>
        </div>
      )}
    </Card>
  );
};

const initialTrainingFormState: TrainingJobFormState = {
  modelName: '', 
  datasetId: '',
  modelType: 'attention_tcn',
  performFeatureSelection: true,
  sequenceLength: '10',
  epochs: '50',
  batchSize: '64',
  learningRate: '0.001',
  hiddenDims: '64,128',
  dropout: '0.2',
};

const initialModelUploadFormState: ModelUploadFormData = {
  model_file: null,
  metadata_file: null,
  scaler_file: null,
  encoder_file: null,
};

const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className = "" }) => {
  const progress = Math.max(0, Math.min(100, value)); 
  return (
    <div className={`w-full bg-tertiary-dark rounded-full h-2.5 ${className}`}>
      <div
        className="bg-accent-blue h-2.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};


const ModelManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { setPageContext } = usePageContext();
  const { addToast } = useToast(); 
  const [models, setModels] = useState<ModelPerformanceMetrics[]>([]);
  const [registryModels, setRegistryModels] = useState<ModelRegistryInfo[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRegistryModels, setIsLoadingRegistryModels] = useState(true);
  const [loadingGlobalAction, setLoadingGlobalAction] = useState<Record<string, boolean>>({});
  const [loadingModelAction, setLoadingModelAction] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [trainingFormData, setTrainingFormData] = useState<TrainingJobFormState>(initialTrainingFormState);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModelFormData, setUploadModelFormData] = useState<ModelUploadFormData>(initialModelUploadFormState);
  const [modalActionFeedback, setModalActionFeedback] = useState<ApiResponseMessage | null>(null);
  
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<ModelPerformanceMetrics | null>(null);
  
  const [runningTrainingJobs, setRunningTrainingJobs] = useState<TrainingJobStatusInfo[]>([]);
  const [isLoadingTrainingJobs, setIsLoadingTrainingJobs] = useState(true);
  const [jobToCancel, setJobToCancel] = useState<TrainingJobStatusInfo | null>(null);
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingTrainingJobs(true);
    setIsLoadingRegistryModels(true);
    try {
      const [modelData, datasetData, trainingJobsData, registryData] = await Promise.all([
        listModelsService(),
        listDatasets(),
        listTrainingJobs(),
        listRegistryModelsService()
      ]);
      setModels(modelData);
      setRegistryModels(registryData);
      setAvailableDatasets(datasetData.filter(ds => ds.status === 'Ready' || ds.status === 'Pipeline_Feature_Selection_Completed' || ds.status === 'Pipeline_Preprocessing_Completed'));
      setRunningTrainingJobs(trainingJobsData);

      const totalStorageModels = modelData.length;
      const productionModelsCount = registryData.filter(m => m.status === 'production').length;
      const loadedModelsCount = modelData.filter(m => m.isLoaded).length;
      
      const avgAcc = totalStorageModels > 0 
        ? parseFloat(
            (modelData.reduce((sum, m) => {
                const rawAcc = m.accuracy ?? 0;
                return sum + (rawAcc > 1 ? rawAcc / 100 : rawAcc); 
            }, 0) / totalStorageModels * 100).toFixed(1)
          ) 
        : 0;

      setPageContext(
        '/model-management',
        'Model Management',
        { 
          totalModelsInStorage: totalStorageModels,
          productionModelsInRegistry: productionModelsCount,
          loadedModels: loadedModelsCount,
          averageAccuracy: avgAcc,
          activeTrainingJobs: trainingJobsData.filter(job => job.status === 'RUNNING' || job.status === 'PENDING' || job.status === 'QUEUED').length,
          modelStorageStatusesSummary: modelData.reduce((acc, model) => {
            acc[model.status] = (acc[model.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          modelRegistryStatusesSummary: registryData.reduce((acc, model) => {
            acc[model.status] = (acc[model.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      );

    } catch (error: any) {
      console.error("Error fetching data:", error);
      addToast('error', 'Load Failed', error.message || "Failed to load initial data.");
      setPageContext('/model-management', 'Model Management', { error: 'Failed to load data.' });
    } finally {
      setIsLoading(false);
      setIsLoadingTrainingJobs(false);
      setIsLoadingRegistryModels(false);
    }
  }, [setPageContext, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const activeJobs = runningTrainingJobs.filter(job => job.status === 'RUNNING' || job.status === 'PENDING' || job.status === 'QUEUED');
    const terminalStates = ['COMPLETED', 'FAILED', 'ERROR', 'CANCELLED'];
    
    if (activeJobs.length === 0 && runningTrainingJobs.every(job => terminalStates.includes(job.status.toUpperCase()))) {
        return;
    }

    const intervalId = setInterval(async () => {
      let jobsUpdated = false;
      const updatedJobs = await Promise.all(runningTrainingJobs.map(async (job) => {
        if (!terminalStates.includes(job.status.toUpperCase())) {
          try {
            const newStatus = await getTrainingJobStatus(job.training_id);
            if (JSON.stringify(newStatus) !== JSON.stringify({
                training_id: job.training_id, status: job.status, current_stage: job.current_stage, progress: job.progress, 
                current_epoch: job.current_epoch, total_epochs: job.total_epochs, current_accuracy: job.current_accuracy,
                current_loss: job.current_loss, estimated_completion: job.estimated_completion, 
                feature_selection_details: job.feature_selection_details, final_metrics_summary: job.final_metrics_summary,
                error_message: job.error_message
            })) {
                jobsUpdated = true;
                return { ...job, ...newStatus };
            }
            return job;

          } catch (err) {
            console.error(`Failed to update status for job ${job.training_id}:`, err);
            return job; 
          }
        }
        return job; 
      }));
      if(jobsUpdated) {
          setRunningTrainingJobs(updatedJobs);
      }
    }, 5000); 

    return () => clearInterval(intervalId);
  }, [runningTrainingJobs]);


  const handleModelAction = async (actionPromise: Promise<any>, id: string, actionName: string) => {
    setLoadingModelAction(prev => ({ ...prev, [actionName]: true }));
    setModalActionFeedback(null);
    try {
      const response = await actionPromise;
      const success = response.success !== undefined ? response.success : (response.model_id || response.id ? true : false);
      const message = response.message || (success ? `${actionName.split('-')[0].replace(/([A-Z])/g, ' $1').trim()} Successful` : `${actionName.split('-')[0].replace(/([A-Z])/g, ' $1').trim()} Failed`);

      addToast(success ? 'success' : 'error', 
               success ? `${actionName.split('-')[0].replace(/([A-Z])/g, ' $1').trim()} Successful` : `${actionName.split('-')[0].replace(/([A-Z])/g, ' $1').trim()} Failed`, 
               message);
      if (success) {
        loadData(); 
        if(actionName.startsWith('delete')) {
          setIsConfirmDeleteModalOpen(false);
          setModelToDelete(null);
        }
      } else {
        if (isTrainingModalOpen || isUploadModalOpen || isConfirmDeleteModalOpen) setModalActionFeedback({success, message});
      }
    } catch (error: any) {
      console.error(`Error performing action ${actionName} for ID ${id}:`, error);
      const defaultMessage = `Failed to ${actionName.split('-')[0].replace(/([A-Z])/g, ' $1').trim()}.`;
      addToast('error', 'Action Failed', error.message || defaultMessage);
      if (isTrainingModalOpen || isUploadModalOpen || isConfirmDeleteModalOpen) setModalActionFeedback({success: false, message: error.message || defaultMessage});
    } finally {
      setLoadingModelAction(prev => ({ ...prev, [actionName]: false }));
    }
  };
  
  const handleTrainingFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setTrainingFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };
  
  const handleOpenTrainingModal = () => {
    setTrainingFormData(initialTrainingFormState);
    if (availableDatasets.length > 0) {
      setTrainingFormData(prev => ({ ...prev, datasetId: availableDatasets[0].id }));
    }
    setModalActionFeedback(null);
    setIsTrainingModalOpen(true);
  };

  const handleStartTrainingJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingFormData.modelType.trim() || !trainingFormData.datasetId) {
      setModalActionFeedback({success: false, message: "Model Type and Dataset ID are required."});
      return;
    }
    
    const config: ApiTrainingJobStartConfig = {
      dataset_id: trainingFormData.datasetId,
      model_type: trainingFormData.modelType,
      perform_feature_selection: trainingFormData.performFeatureSelection,
      sequence_length: parseInt(trainingFormData.sequenceLength, 10),
      epochs: parseInt(trainingFormData.epochs, 10),
      batch_size: parseInt(trainingFormData.batchSize, 10),
      learning_rate: parseFloat(trainingFormData.learningRate),
      hidden_dims: trainingFormData.hiddenDims.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)),
      dropout: parseFloat(trainingFormData.dropout),
    };
    
    if (config.hidden_dims.length === 0 && trainingFormData.hiddenDims.trim() !== '') {
        setModalActionFeedback({success: false, message: "Invalid Hidden Dimensions format. Use comma-separated numbers."});
        return;
    }
    if (isNaN(config.sequence_length) || isNaN(config.epochs) || isNaN(config.batch_size) || isNaN(config.learning_rate) || isNaN(config.dropout)) {
        setModalActionFeedback({success: false, message: "All numeric fields must be valid numbers."});
        return;
    }

    setLoadingGlobalAction(prev => ({ ...prev, training: true }));
    setModalActionFeedback(null);
    try {
      const response = await startNewTrainingJob(config); 
      const newJobInfo: TrainingJobStatusInfo = { 
        ...response,
        model_name: trainingFormData.modelName, 
        model_type: config.model_type,
        dataset_id: config.dataset_id,
      };
      addToast('success', 'Training Job Started', `Job ${newJobInfo.training_id} for ${newJobInfo.model_name || newJobInfo.model_type} started.`);
      setRunningTrainingJobs(prev => [newJobInfo, ...prev]);
      setIsTrainingModalOpen(false);
    } catch (error: any) {
      console.error("Error starting training job:", error);
      addToast('error', 'Training Failed', error.message || "Failed to start training job.");
      setModalActionFeedback({success: false, message: error.message || "Failed to start training job."});
    } finally {
      setLoadingGlobalAction(prev => ({ ...prev, training: false }));
    }
  };
  
  const handleUploadModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setUploadModelFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setUploadModelFormData(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleOpenUploadModelModal = () => {
    setUploadModelFormData(initialModelUploadFormState);
    setModalActionFeedback(null);
    setIsUploadModalOpen(true);
  };
  
  const handleUploadModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModelFormData.model_file || !uploadModelFormData.metadata_file || !uploadModelFormData.scaler_file || !uploadModelFormData.encoder_file) {
      setModalActionFeedback({success: false, message: "All four files (model, metadata, scaler, encoder) are required."});
      return;
    }

    const formData = new FormData();
    formData.append('model_file', uploadModelFormData.model_file);
    formData.append('metadata_file', uploadModelFormData.metadata_file);
    formData.append('scaler_file', uploadModelFormData.scaler_file);
    formData.append('encoder_file', uploadModelFormData.encoder_file);

    setLoadingGlobalAction(prev => ({ ...prev, upload: true }));
    setModalActionFeedback(null);
    try {
      const response = await uploadNewModelService(formData);
      addToast('success', 'Model Upload Successful', `Model ${response.model_id} (v${response.version}) uploaded.`);
      loadData();
      setIsUploadModalOpen(false);
    } catch (error: any) {
      console.error("Error uploading model:", error);
      addToast('error', 'Upload Failed', error.message || "Failed to upload model.");
      setModalActionFeedback({success: false, message: error.message || "Failed to upload model."});
    } finally {
      setLoadingGlobalAction(prev => ({ ...prev, upload: false }));
    }
  };
  
  const handleDeleteRequest = (model: ModelPerformanceMetrics) => {
    setModelToDelete(model);
    setModalActionFeedback(null);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteModel = () => {
    if (modelToDelete) {
      handleModelAction(deleteModelService(modelToDelete.model_id), modelToDelete.model_id, `delete-${modelToDelete.model_id}`);
    }
  };

  const handleCancelTrainingJobRequest = (job: TrainingJobStatusInfo) => {
    setJobToCancel(job);
    setIsConfirmCancelModalOpen(true);
  };

  const confirmCancelTrainingJob = async () => {
    if (!jobToCancel) return;
    setLoadingModelAction(prev => ({ ...prev, [`cancel-${jobToCancel.training_id}`]: true }));
    try {
      const response = await cancelTrainingJob(jobToCancel.training_id);
      addToast('success', 'Cancellation Initiated', response.message);
      setRunningTrainingJobs(prevJobs => 
        prevJobs.map(j => j.training_id === jobToCancel.training_id ? { ...j, status: 'CANCELLED', current_stage: 'cancelled' } : j)
      );
    } catch (error: any) {
      addToast('error', 'Cancellation Failed', error.message || 'Could not cancel job.');
    } finally {
      setLoadingModelAction(prev => ({ ...prev, [`cancel-${jobToCancel.training_id}`]: false }));
      setIsConfirmCancelModalOpen(false);
      setJobToCancel(null);
    }
  };

  const getStatusPillTable = (status: ModelPerformanceMetrics['status']) => {
    const s = status?.toLowerCase();
    let colors = 'bg-gray-500/20 text-gray-300'; 
    if (s === 'active') colors = 'bg-success/20 text-success';
    else if (s === 'inactive') colors = 'bg-gray-200/20 text-gray-200';
    // Other statuses (like registry ones) might not appear here if this table only lists /models/ response
    else if (s === 'production') colors = 'bg-success/20 text-success';
    else if (s === 'staging') colors = 'bg-accent-blue/20 text-accent-blue';
    else if (s === 'candidate' || s === 'uploaded') colors = 'bg-yellow-500/20 text-yellow-400';
    else if (s === 'training') colors = 'bg-purple-500/20 text-purple-400 animate-pulse';
    else if (s === 'archived') colors = 'bg-slate-600/20 text-slate-400';
    else if (s === 'loaded') colors = 'bg-teal-500/20 text-teal-400';
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors}`}>{status}</span>;
  };

  const getTrainingJobStatusPill = (status: TrainingJobStatusInfo['status']) => {
    let colors = 'bg-gray-500/20 text-text-secondary';
    switch (status?.toUpperCase()) {
      case 'RUNNING': colors = 'bg-accent-blue/20 text-accent-blue animate-pulse'; break;
      case 'PENDING': case 'QUEUED': colors = 'bg-yellow-500/20 text-yellow-400'; break;
      case 'COMPLETED': colors = 'bg-success/20 text-success'; break;
      case 'FAILED': case 'ERROR': colors = 'bg-danger/20 text-danger'; break;
      case 'CANCELLED': colors = 'bg-slate-600/20 text-slate-400'; break;
    }
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap w-fit ${colors}`}>{status}</span>;
  };

  const getRegistryStatusPill = (status: ModelRegistryStatus) => {
    let colors = 'bg-gray-500/20 text-text-secondary';
    switch (status) {
      case 'candidate': colors = 'bg-yellow-500/20 text-yellow-400'; break;
      case 'staging': colors = 'bg-accent-blue/20 text-accent-blue'; break;
      case 'production': colors = 'bg-success/20 text-success'; break;
      case 'archived': colors = 'bg-slate-600/20 text-slate-400'; break;
    }
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${colors}`}>{status}</span>;
  };


  const modelColumns: TableColumn<ModelPerformanceMetrics>[] = [
    { 
      header: 'Model ID', 
      accessor: item => (
        <Link to={`/models/${item.model_id}`} className="text-accent-blue hover:underline font-medium" title={item.model_id}>
          {item.model_id.length > 20 ? `${item.model_id.substring(0, 20)}...` : item.model_id}
        </Link>
      ),
      sortable: true
    },
    { header: 'Type', accessor: 'model_type', sortable: true},
    { header: 'Version', accessor: 'version', sortable: true },
    { header: 'Op. Status', accessor: item => getStatusPillTable(item.status), sortable: true },
    { 
      header: 'Accuracy', 
      accessor: item => {
        const rawAcc = item.accuracy ?? 0;
        const displayAcc = rawAcc > 1 ? rawAcc : rawAcc * 100;
        return `${displayAcc.toFixed(2)}%`;
      }, 
      sortable: true 
    },
    { 
      header: 'F1 Score', 
      accessor: item => (item.f1_score ?? 0).toFixed(3), 
      sortable: true 
    },
    { header: 'Loaded', accessor: item => item.isLoaded ? <CpuChipIcon className="w-5 h-5 text-success" title="Loaded"/> : <CpuChipIcon className="w-5 h-5 text-text-secondary opacity-50" title="Not Loaded"/> },
    { header: 'Created At', accessor: item => new Date(item.created_at).toLocaleDateString(), sortable: true },
    {
      header: 'Actions',
      accessor: (item: ModelPerformanceMetrics) => (
        currentUser?.is_admin ? (
          <div className="flex space-x-1 items-center">
            <Link to={`/models/${item.model_id}`} className="p-1.5 text-text-secondary hover:text-accent-blue" title="View Details" aria-label={`View details for model ${item.model_id}`}>
              <EyeIcon className="w-4 h-4"/>
            </Link>
            {item.isLoaded ? (
               <button onClick={() => handleModelAction(unloadModelService(item.model_id), item.model_id, `unload-${item.model_id}`)} disabled={loadingModelAction[`unload-${item.model_id}`]} className="p-1.5 text-text-secondary hover:text-yellow-400 disabled:opacity-50" title="Unload Model" aria-label={`Unload model ${item.model_id}`}>
                  {loadingModelAction[`unload-${item.model_id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <ArrowDownCircleIcon className="w-4 h-4"/>}
               </button>
            ) : (
               <button onClick={() => handleModelAction(loadModelService(item.model_id), item.model_id, `load-${item.model_id}`)} disabled={loadingModelAction[`load-${item.model_id}`] || item.status?.toLowerCase() === 'archived' || item.status?.toLowerCase() === 'training'} className="p-1.5 text-text-secondary hover:text-success disabled:opacity-50" title="Load Model" aria-label={`Load model ${item.model_id}`}>
                 {loadingModelAction[`load-${item.model_id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <ArrowUpCircleIcon className="w-4 h-4"/>}
               </button>
            )}
            <button onClick={() => handleDeleteRequest(item)}
              disabled={loadingModelAction[`delete-${item.model_id}`]}
              className="p-1.5 text-text-secondary hover:text-danger disabled:opacity-50" title="Delete Model" aria-label={`Delete model ${item.model_id}`}>
              {loadingModelAction[`delete-${item.model_id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <TrashIcon className="w-4 h-4"/>}
            </button>
          </div>
        ) : <Link to={`/models/${item.model_id}`} className="text-xs text-accent-blue hover:underline">View</Link>
      ),
    },
  ];

  const trainingJobColumns: TableColumn<TrainingJobStatusInfo>[] = [
    { header: 'Job ID', accessor: item => <span title={item.training_id}>{item.training_id.substring(0, 15)}...</span>, sortable: true },
    { header: 'Name/Type', accessor: item => <span title={item.model_name || item.model_type}>{item.model_name || item.model_type}</span>, sortable: true },
    { header: 'Dataset', accessor: item => <span title={item.dataset_id}>{item.dataset_id}</span>, sortable: true },
    { 
      header: 'Status', 
      accessor: (item: TrainingJobStatusInfo) => (
        <div className="flex flex-col items-start"> 
          {getTrainingJobStatusPill(item.status)}
          {(item.status.toUpperCase() === 'FAILED' || item.status.toUpperCase() === 'ERROR') && item.error_message && (
            <span className="text-xs text-danger mt-1 block w-full break-words" title={item.error_message}>
              Error: {item.error_message}
            </span>
          )}
        </div>
      ), 
      sortable: true,
      className: "min-w-[150px]"
    },
    { 
      header: 'Stage', 
      accessor: (item: TrainingJobStatusInfo) => (
        <span className={item.current_stage?.toLowerCase() === 'error' ? 'text-danger' : ''}>
          {item.current_stage}
        </span>
      ), 
      sortable: true 
    },
    { 
      header: 'Progress', 
      accessor: item => (
        <div className="flex items-center">
          <ProgressBar value={item.progress} className="w-20 sm:w-24" />
          <span className="text-xs text-text-secondary ml-2">{item.progress}%</span>
        </div>
      ), 
      sortable: true 
    },
    { header: 'Epochs', accessor: item => `${item.current_epoch}/${item.total_epochs}`, sortable: true },
    { 
      header: 'Accuracy', 
      accessor: item => typeof item.current_accuracy === 'number' ? `${item.current_accuracy.toFixed(2)}%` : 'N/A', 
      sortable: true 
    },
    { header: 'Loss', accessor: item => item.current_loss?.toFixed(4) || 'N/A', sortable: true },
    { 
      header: 'Actions', 
      accessor: item => (
        (item.status.toUpperCase() === 'RUNNING' || item.status.toUpperCase() === 'PENDING' || item.status.toUpperCase() === 'QUEUED') && (
          <button 
            onClick={() => handleCancelTrainingJobRequest(item)} 
            disabled={loadingModelAction[`cancel-${item.training_id}`]}
            className="btn-danger btn-sm p-1 text-xs" 
            aria-label={`Cancel training job ${item.training_id}`}
            title="Cancel Job"
          >
            {loadingModelAction[`cancel-${item.training_id}`] ? <ArrowPathIcon className="w-3 h-3 animate-spin"/> : <StopIcon className="w-3 h-3" />}
          </button>
        )
      )
    }
  ];

  const registryModelColumns: TableColumn<ModelRegistryInfo>[] = [
    { header: 'Model ID', accessor: 'model_id', sortable: true },
    { header: 'Version', accessor: 'version', sortable: true },
    { header: 'Status', accessor: item => getRegistryStatusPill(item.status), sortable: true },
    { header: 'Source Training', accessor: item => item.source_training_id || 'N/A', sortable: true },
    { header: 'Created At', accessor: item => item.created_at.toLocaleDateString(), sortable: true },
    { header: 'Promoted At', accessor: item => item.promoted_at ? item.promoted_at.toLocaleDateString() : 'N/A', sortable: true },
    {
      header: 'Actions',
      accessor: (item: ModelRegistryInfo) => (
        <select
          value={item.status}
          onChange={(e) => {
            const newStatus = e.target.value as ModelRegistryStatus;
            handleModelAction(promoteRegistryModelService(item.model_id, newStatus), item.model_id, `promote-${newStatus}-${item.model_id}`);
          }}
          disabled={Object.keys(loadingModelAction).some(key => key.startsWith(`promote-`) && key.endsWith(item.model_id))}
          className="input-field text-xs p-1 !mt-0 w-full"
          title="Promote Model"
        >
          {(["candidate", "staging", "production", "archived"] as ModelRegistryStatus[]).map(statusOption => (
            <option key={statusOption} value={statusOption} disabled={item.status === statusOption}>
              {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
            </option>
          ))}
        </select>
      ),
    }
  ];
  
  const totalStorageModels = models.length;
  const productionModelsInRegistry = registryModels.filter(m => m.status === 'production').length;
  const loadedModelsCount = models.filter(m => m.isLoaded).length;
  
  const avgAccuracyMetric = totalStorageModels > 0 
    ? parseFloat(
        (models.reduce((sum, m) => {
            const rawAcc = m.accuracy ?? 0; 
            return sum + (rawAcc > 1 ? rawAcc / 100 : rawAcc); 
        }, 0) / totalStorageModels * 100).toFixed(1)
      )
    : 'N/A';

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Model Management & Registry"
        subtitle="Manage operational models, training jobs, and govern model lifecycle through the registry."
        actions={
          <div className="flex items-center space-x-2 sm:space-x-4">
            <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
            {currentUser?.is_admin && (
              <>
                <button
                  onClick={handleOpenUploadModelModal}
                  disabled={loadingGlobalAction.upload}
                  className="btn-primary text-sm"
                  aria-label="Upload New Model"
                >
                  <ArrowUpTrayIcon className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Upload Model</span>
                   <span className="sm:hidden">Upload</span>
                </button>
                <button
                  onClick={handleOpenTrainingModal}
                  disabled={loadingGlobalAction.training}
                  className="btn-primary text-sm"
                  aria-label="Start New Training Job"
                >
                  <PlusCircleIcon className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Training</span>
                  <span className="sm:hidden">Train</span>
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricDisplay title="Models in Storage" value={totalStorageModels} isLoading={isLoading} icon={<ServerStackIcon className="w-6 h-6"/>} />
        <MetricDisplay title="Production (Registry)" value={`${productionModelsInRegistry}`} isLoading={isLoadingRegistryModels} icon={<StarIcon className="w-6 h-6 text-yellow-400"/>} />
        <MetricDisplay title="Avg. Storage Accuracy" value={avgAccuracyMetric} unit="%" isLoading={isLoading} icon={<ChartBarIcon className="w-6 h-6"/>} />
        <MetricDisplay title="Loaded in Memory" value={`${loadedModelsCount} / ${totalStorageModels}`} isLoading={isLoading} icon={<CpuChipIcon className="w-6 h-6 text-success"/>} />
      </div>

      {isLoading && <Card><div className="text-center py-10"><SkeletonLoader type="block" className="h-40"/></div></Card>}
      {!isLoading && models.length === 0 && viewMode === 'list' && (
        <Card>
          <div className="text-center py-10 text-text-secondary">
            <ServerStackIcon className="w-12 h-12 mx-auto mb-2"/>
            No models found in storage. Admins can start new training jobs or upload models.
          </div>
        </Card>
      )}
      {!isLoading && models.length > 0 && viewMode === 'list' && (
          <Card title="Operational Models (Storage)" icon={<ServerStackIcon className="w-5 h-5 text-text-secondary"/>} bodyClassName="p-0">
            <Table columns={modelColumns} data={models} isLoading={isLoading} itemsPerPage={10}/>
          </Card>
      )}
      {!isLoading && viewMode === 'card' && (
        models.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {models.map(model => (
              <ModelCardItem 
                key={model.model_id} 
                model={model} 
                onAction={handleModelAction} 
                onDeleteRequest={handleDeleteRequest}
                loadingModelAction={loadingModelAction}
                isAdmin={!!currentUser?.is_admin}
              />
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-10 text-text-secondary">
              <ServerStackIcon className="w-12 h-12 mx-auto mb-2"/>
              No models found in storage. Admins can start new training jobs or upload models.
            </div>
          </Card>
        )
      )}

      <Card title="Model Registry" icon={<CubeIcon className="w-5 h-5 text-accent-purple"/>} bodyClassName="p-0">
        <Table
            columns={registryModelColumns}
            data={registryModels}
            isLoading={isLoadingRegistryModels}
            emptyStateMessage="No models found in the registry."
            itemsPerPage={5}
        />
      </Card>

      <Card title="Running Training Sessions" icon={<CogIcon className="w-5 h-5 text-accent-blue"/>} bodyClassName="p-0">
        <Table 
            columns={trainingJobColumns} 
            data={runningTrainingJobs} 
            isLoading={isLoadingTrainingJobs} 
            emptyStateMessage="No active or recent training jobs found."
            itemsPerPage={5}
        />
      </Card>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload New Model" size="lg">
        <form onSubmit={handleUploadModelSubmit} className="space-y-4">
           {modalActionFeedback && (
            <div role="alert" className={`p-3 rounded-md text-sm ${modalActionFeedback.success ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
              {modalActionFeedback.message}
            </div>
           )}
          <div>
            <label htmlFor="model_file" className="block text-sm font-medium text-text-secondary">Model File (.pth state dictionary)</label>
            <input type="file" name="model_file" id="model_file" onChange={handleUploadModelFileChange} required className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent-blue file:text-white hover:file:bg-accent-blue/80" accept=".pth,.pt" />
          </div>
          <div>
            <label htmlFor="metadata_file" className="block text-sm font-medium text-text-secondary">Metadata File (.json)</label>
            <input type="file" name="metadata_file" id="metadata_file" onChange={handleUploadModelFileChange} required className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent-blue file:text-white hover:file:bg-accent-blue/80" accept=".json" />
          </div>
          <div>
            <label htmlFor="scaler_file" className="block text-sm font-medium text-text-secondary">Scaler File (.pkl or .joblib)</label>
            <input type="file" name="scaler_file" id="scaler_file" onChange={handleUploadModelFileChange} required className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent-blue file:text-white hover:file:bg-accent-blue/80" accept=".pkl,.joblib" />
          </div>
          <div>
            <label htmlFor="encoder_file" className="block text-sm font-medium text-text-secondary">Label Encoder File (.pkl or .joblib)</label>
            <input type="file" name="encoder_file" id="encoder_file" onChange={handleUploadModelFileChange} required className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent-blue file:text-white hover:file:bg-accent-blue/80" accept=".pkl,.joblib" />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setIsUploadModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loadingGlobalAction.upload} className="btn-primary">
              {loadingGlobalAction.upload ? <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> Uploading...</> : 'Upload Model Files'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTrainingModalOpen} onClose={() => setIsTrainingModalOpen(false)} title="Start New Training Job" size="lg">
        <form onSubmit={handleStartTrainingJobSubmit} className="space-y-4">
           {modalActionFeedback && (
            <div role="alert" className={`p-3 rounded-md text-sm ${modalActionFeedback.success ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
              {modalActionFeedback.message}
            </div>
           )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modelName" className="block text-sm font-medium text-text-secondary">Training Job Name (Optional)</label>
              <input type="text" name="modelName" id="modelName" value={trainingFormData.modelName} onChange={handleTrainingFormChange} className="input-field" placeholder="e.g., WIDS_Attention_Aug24_Run1" />
            </div>
            <div>
              <label htmlFor="datasetId" className="block text-sm font-medium text-text-secondary">Dataset ID</label>
              <select name="datasetId" id="datasetId" value={trainingFormData.datasetId} onChange={handleTrainingFormChange} required className="input-field">
                <option value="" disabled>Select a dataset</option>
                {availableDatasets.map(ds => <option key={ds.id} value={ds.id}>{ds.name} ({ds.id}) - {ds.status}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="modelType" className="block text-sm font-medium text-text-secondary">Model Type</label>
              <input type="text" name="modelType" id="modelType" value={trainingFormData.modelType} onChange={handleTrainingFormChange} required className="input-field" placeholder="e.g., attention_tcn" />
            </div>
            <div>
              <label htmlFor="sequenceLength" className="block text-sm font-medium text-text-secondary">Sequence Length</label>
              <input type="number" name="sequenceLength" id="sequenceLength" value={trainingFormData.sequenceLength} onChange={handleTrainingFormChange} required className="input-field" placeholder="e.g., 10" />
            </div>
            <div>
              <label htmlFor="epochs" className="block text-sm font-medium text-text-secondary">Epochs</label>
              <input type="number" name="epochs" id="epochs" value={trainingFormData.epochs} onChange={handleTrainingFormChange} required className="input-field" placeholder="e.g., 50" />
            </div>
            <div>
              <label htmlFor="batchSize" className="block text-sm font-medium text-text-secondary">Batch Size</label>
              <input type="number" name="batchSize" id="batchSize" value={trainingFormData.batchSize} onChange={handleTrainingFormChange} required className="input-field" placeholder="e.g., 64" />
            </div>
            <div>
              <label htmlFor="learningRate" className="block text-sm font-medium text-text-secondary">Learning Rate</label>
              <input type="text" name="learningRate" id="learningRate" value={trainingFormData.learningRate} onChange={handleTrainingFormChange} required className="input-field" placeholder="e.g., 0.001" />
            </div>
             <div>
              <label htmlFor="dropout" className="block text-sm font-medium text-text-secondary">Dropout</label>
              <input type="text" name="dropout" id="dropout" value={trainingFormData.dropout} onChange={handleTrainingFormChange} required className="input-field" placeholder="e.g., 0.2" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="hiddenDims" className="block text-sm font-medium text-text-secondary">Hidden Dimensions (comma-separated)</label>
              <input type="text" name="hiddenDims" id="hiddenDims" value={trainingFormData.hiddenDims} onChange={handleTrainingFormChange} required className="input-field" placeholder="e.g., 64,128,256" />
            </div>
          </div>
          <div className="flex items-center">
            <input type="checkbox" name="performFeatureSelection" id="performFeatureSelection" checked={trainingFormData.performFeatureSelection} onChange={handleTrainingFormChange} className="h-4 w-4 text-accent-blue border-tertiary-dark rounded focus:ring-accent-blue" />
            <label htmlFor="performFeatureSelection" className="ml-2 block text-sm text-text-secondary">Perform Feature Selection (if applicable for model type)</label>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setIsTrainingModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loadingGlobalAction.training} className="btn-primary">
              {loadingGlobalAction.training ? <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> Starting Job...</> : 'Start Training Job'}
            </button>
          </div>
        </form>
      </Modal>
      
      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => { setIsConfirmDeleteModalOpen(false); setModelToDelete(null); }}
        onConfirm={confirmDeleteModel}
        title="Confirm Model Deletion"
        message={`Are you sure you want to delete model "${modelToDelete?.model_id}" (Version: ${modelToDelete?.version})? This action cannot be undone.`}
        confirmButtonText="Delete Model"
        confirmButtonClassName="btn-danger"
        isLoading={loadingModelAction[`delete-${modelToDelete?.model_id}`]}
      />
      <ConfirmationModal
        isOpen={isConfirmCancelModalOpen}
        onClose={() => { setIsConfirmCancelModalOpen(false); setJobToCancel(null); }}
        onConfirm={confirmCancelTrainingJob}
        title="Confirm Job Cancellation"
        message={`Are you sure you want to cancel training job "${jobToCancel?.training_id}"?`}
        confirmButtonText="Yes, Cancel Job"
        confirmButtonClassName="btn-danger"
        isLoading={loadingModelAction[`cancel-${jobToCancel?.training_id}`]}
      />
    </div>
  );
};

export default ModelManagementPage;
