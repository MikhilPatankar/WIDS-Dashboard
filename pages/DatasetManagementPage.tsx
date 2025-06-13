
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Table from '../components/Table';
import { Dataset, DatasetStatus, ApiResponseMessage, TableColumn, PipelineFeatureSelectionConfig } from '../src/types';
import ViewSwitcher from '../components/ViewSwitcher'; 
import Modal from '../components/Modal';
import ConfirmationModal from '../src/components/ConfirmationModal';
import * as datasetService from '../src/services/datasetService';
import { useAuth } from '../contexts/AuthContext';
import { usePageContext } from '../contexts/PageContext';
import { useToast } from '../contexts/ToastContext'; 
import { ArrowUpTrayIcon, DocumentMagnifyingGlassIcon, SparklesIcon, TrashIcon, CubeIcon, EyeIcon, ArrowPathIcon, CogIcon } from '@heroicons/react/24/outline'; 
import SkeletonLoader from '../components/SkeletonLoader';

interface FeatureSelectionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: PipelineFeatureSelectionConfig) => void;
  isLoading: boolean;
  initialConfig?: PipelineFeatureSelectionConfig;
}

const FeatureSelectionConfigModal: React.FC<FeatureSelectionConfigModalProps> = ({ isOpen, onClose, onSubmit, isLoading, initialConfig }) => {
  const [config, setConfig] = useState<PipelineFeatureSelectionConfig>(initialConfig || {
    method: 'quantum',
    iterations: 500,
    early_stopping: 25,
  });

  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : parseInt(value, 10)) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Feature Selection">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="method" className="block text-sm font-medium text-text-secondary">Method</label>
          <select name="method" id="method" value={config.method} onChange={handleChange} className="input-field">
            <option value="quantum">Quantum</option>
            {/* <option value="classical">Classical (Not Implemented)</option> */}
          </select>
        </div>
        <div>
          <label htmlFor="iterations" className="block text-sm font-medium text-text-secondary">Iterations</label>
          <input type="number" name="iterations" id="iterations" value={config.iterations ?? ''} onChange={handleChange} className="input-field" placeholder="e.g., 500" />
        </div>
        <div>
          <label htmlFor="early_stopping" className="block text-sm font-medium text-text-secondary">Early Stopping Patience</label>
          <input type="number" name="early_stopping" id="early_stopping" value={config.early_stopping ?? ''} onChange={handleChange} className="input-field" placeholder="e.g., 25" />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> Starting...</> : 'Start Feature Selection'}
          </button>
        </div>
      </form>
    </Modal>
  );
};


const DatasetCardItem: React.FC<{ 
  dataset: Dataset; 
  onPreprocessRequest: (dataset: Dataset) => void;
  onConfigureQIFSRequest: (dataset: Dataset) => void;
  onDeleteRequest: (dataset: Dataset) => void; 
  loadingAction: Record<string, boolean>; 
  isAdmin: boolean; 
  getStatusPillTextFn: (status: DatasetStatus, current_task_id?: string | null) => string;
}> = ({ dataset, onPreprocessRequest, onConfigureQIFSRequest, onDeleteRequest, loadingAction, isAdmin, getStatusPillTextFn }) => {
  
  const getStatusColor = (status: DatasetStatus) => {
    if (status === 'Uploaded') return 'border-sky-500';
    if (status === 'Pipeline_Preprocessing_Scheduled' || status === 'Pipeline_Preprocessing_Running' || status === 'Pipeline_Feature_Selection_Scheduled' || status === 'Pipeline_Feature_Selection_Running') return 'border-yellow-500 animate-pulse';
    if (status === 'Pipeline_Preprocessing_Completed') return 'border-indigo-500';
    if (status === 'Ready' || status === 'Pipeline_Feature_Selection_Completed') return 'border-success';
    if (status === 'Error' || status === 'Pipeline_Error') return 'border-danger';
    return 'border-gray-500';
  };
  
  const getStatusPillClass = (status: DatasetStatus) => {
    if (status === 'Uploaded') return 'bg-sky-500/20 text-sky-400';
    if ((status.includes('Preprocessing') && (status.includes('Running') || status.includes('Scheduled'))) || (status.includes('Feature_Selection') && (status.includes('Running') || status.includes('Scheduled')))) return 'bg-yellow-500/20 text-yellow-400';
    if (status === 'Pipeline_Preprocessing_Completed') return 'bg-indigo-500/20 text-indigo-400';
    if (status === 'Ready' || status === 'Pipeline_Feature_Selection_Completed') return 'bg-success/20 text-success';
    if (status === 'Error' || status === 'Pipeline_Error') return 'bg-danger/20 text-danger';
    return 'bg-gray-500/20 text-text-secondary';
  };
  
  return (
    <Card className={`border-l-4 ${getStatusColor(dataset.status)} hover:shadow-2xl transition-shadow flex flex-col h-full`}>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <Link to={`/datasets/${dataset.id}`} className="text-lg font-semibold text-accent-blue hover:underline truncate" title={dataset.name}>
            {dataset.name.length > 25 ? `${dataset.name.substring(0,22)}...` : dataset.name}
          </Link>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusPillClass(dataset.status)}`}>
            {getStatusPillTextFn(dataset.status, dataset.current_task_id)}
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-1 mb-2 truncate h-10" title={dataset.description ?? undefined}>
          {dataset.description || "No description available."}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
          <span>Rows: <span className="text-text-primary font-medium">{dataset.rowCount.toLocaleString()}</span></span>
          <span>Cols: <span className="text-text-primary font-medium">{dataset.columnCount.toLocaleString()}</span></span>
          <span>Size: <span className="text-text-primary font-medium">{(dataset.fileSizeBytes / (1024*1024)).toFixed(2)} MB</span></span>
          <span>Created: <span className="text-text-primary font-medium">{dataset.createdAt.toLocaleDateString()}</span></span>
        </div>
      </div>
      {isAdmin && (
        <div className="mt-auto pt-3 border-t border-tertiary-dark flex space-x-2 justify-end">
          <Link to={`/datasets/${dataset.id}`} className="p-1.5 text-text-secondary hover:text-accent-blue" title="View Details" aria-label={`View details for ${dataset.name}`}>
            <EyeIcon className="w-5 h-5"/>
          </Link>
          <button
            onClick={() => onPreprocessRequest(dataset)}
            disabled={dataset.status !== 'Uploaded' || loadingAction[`preprocess-${dataset.id}`]}
            className="p-1.5 text-text-secondary hover:text-accent-blue disabled:opacity-50 disabled:cursor-not-allowed"
            title="Preprocess Dataset (Pipeline)"
            aria-label={`Preprocess dataset ${dataset.name} using pipeline`}
          >
            {loadingAction[`preprocess-${dataset.id}`] ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <CogIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onConfigureQIFSRequest(dataset)}
            disabled={dataset.status !== 'Pipeline_Preprocessing_Completed' || loadingAction[`qifs-${dataset.id}`]}
            className="p-1.5 text-text-secondary hover:text-accent-purple disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run Feature Selection (Pipeline)"
            aria-label={`Run QIFS for dataset ${dataset.name} using pipeline`}
          >
            {loadingAction[`qifs-${dataset.id}`] ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onDeleteRequest(dataset)}
            disabled={loadingAction[`delete-${dataset.id}`]}
            className="p-1.5 text-text-secondary hover:text-danger disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete Dataset"
            aria-label={`Delete dataset ${dataset.name}`}
          >
            {loadingAction[`delete-${dataset.id}`] ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <TrashIcon className="w-5 h-5" />}
          </button>
        </div>
      )}
    </Card>
  );
};


const DatasetManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { setPageContext } = usePageContext();
  const { addToast } = useToast(); 
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card'); 
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({ name: '', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modalActionFeedback, setModalActionFeedback] = useState<ApiResponseMessage | null>(null);
  
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null);

  const [isQIFSConfigModalOpen, setIsQIFSConfigModalOpen] = useState(false);
  const [datasetForQIFS, setDatasetForQIFS] = useState<Dataset | null>(null);
  
  const [isConfirmPreprocessModalOpen, setIsConfirmPreprocessModalOpen] = useState(false);
  const [datasetToPreprocess, setDatasetToPreprocess] = useState<Dataset | null>(null);
  
  const [isConfirmQIFSStartModalOpen, setIsConfirmQIFSStartModalOpen] = useState(false);
  const [datasetForQIFSStartConfirm, setDatasetForQIFSStartConfirm] = useState<Dataset | null>(null);


  const loadDatasets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await datasetService.listDatasets();
      setDatasets(data);
      setPageContext(
        '/datasets',
        'Dataset Management',
        { 
          totalDatasets: data.length,
          datasetStatusSummary: data.reduce((acc, ds) => {
            acc[ds.status] = (acc[ds.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      );
    } catch (error: any) {
      console.error("Error fetching datasets:", error);
      addToast('error', 'Load Failed', error.message || "Failed to load datasets.");
      setPageContext('/datasets', 'Dataset Management', { error: 'Failed to load datasets.' });
    } finally {
      setIsLoading(false);
    }
  }, [setPageContext, addToast]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);
  
  const getStatusPillText = (status: DatasetStatus, current_task_id?: string | null): string => {
    if (status === 'Pipeline_Preprocessing_Completed') {
      return 'Preprocessed';
    }
    let text = status.replace(/Pipeline_/g, '').replace(/_/g, ' ');
    if (current_task_id && (status.includes('Running') || status.includes('Scheduled'))) {
      text += ` (Task: ${current_task_id.substring(0,8)}...)`;
    }
    return text;
  };

  const getStatusPillClassTable = (status: DatasetStatus) => {
    if (status === 'Uploaded') return 'bg-sky-500/20 text-sky-400';
    if ((status.includes('Preprocessing') && (status.includes('Running') || status.includes('Scheduled'))) || (status.includes('Feature_Selection') && (status.includes('Running') || status.includes('Scheduled')))) return 'bg-yellow-500/20 text-yellow-400';
    if (status === 'Pipeline_Preprocessing_Completed') return 'bg-indigo-500/20 text-indigo-400';
    if (status === 'Ready' || status === 'Pipeline_Feature_Selection_Completed') return 'bg-success/20 text-success';
    if (status === 'Error' || status === 'Pipeline_Error') return 'bg-danger/20 text-danger';
    return 'bg-gray-500/20 text-text-secondary';
  };


  const handlePipelineAction = async (actionPromise: Promise<any>, datasetId: string, actionName: string) => {
    setLoadingAction(prev => ({ ...prev, [`${actionName}-${datasetId}`]: true }));
    try {
      const response = await actionPromise;
      addToast('success', `${actionName.replace(/_/g, ' ')} Initiated`, response.message || `${actionName} task scheduled.`);
      loadDatasets(); 
    } catch (error: any) {
      console.error(`Error during ${actionName} for ${datasetId}:`, error);
      addToast('error', `${actionName.replace(/_/g, ' ')} Failed`, error.message || `Could not start ${actionName}.`);
    } finally {
      setLoadingAction(prev => ({ ...prev, [`${actionName}-${datasetId}`]: false }));
    }
  };
  
  const handlePreprocessRequest = (dataset: Dataset) => {
    setDatasetToPreprocess(dataset);
    setIsConfirmPreprocessModalOpen(true);
  };

  const confirmPreprocessPipeline = () => {
    if (datasetToPreprocess) {
      handlePipelineAction(datasetService.preprocessDatasetPipeline(datasetToPreprocess.id), datasetToPreprocess.id, 'Preprocess_Pipeline');
    }
    setIsConfirmPreprocessModalOpen(false);
    setDatasetToPreprocess(null);
  };

  const handleConfigureQIFSRequest = (dataset: Dataset) => {
    setDatasetForQIFSStartConfirm(dataset);
    setIsConfirmQIFSStartModalOpen(true);
  };

  const confirmStartQIFS = () => {
    if (datasetForQIFSStartConfirm) {
      setDatasetForQIFS(datasetForQIFSStartConfirm);
      setIsQIFSConfigModalOpen(true);
    }
    setIsConfirmQIFSStartModalOpen(false);
    setDatasetForQIFSStartConfirm(null);
  };

  const handleSubmitQIFSConfig = (config: PipelineFeatureSelectionConfig) => {
    if (datasetForQIFS) {
      setIsQIFSConfigModalOpen(false);
      handlePipelineAction(datasetService.selectFeaturesPipeline(datasetForQIFS.id, config), datasetForQIFS.id, 'Select_Features_Pipeline');
      setDatasetForQIFS(null);
    }
  };


  const handleGeneralAction = async (actionPromise: Promise<any>, actionType: 'upload' | 'delete', entityId?: string) => {
    const loadingKey = entityId ? `${actionType}-${entityId}` : `global-${actionType}`;
    setLoadingAction(prev => ({ ...prev, [loadingKey]: true }));
    setModalActionFeedback(null); 
    try {
      const response = await actionPromise;
      
      let message = "Action successful.";
      let success = true;
      if (response && typeof response.message === 'string') {
         message = response.message;
         if(typeof response.success === 'boolean') success = response.success;
      } else if (response && response.id && response.name) { 
         message = `Dataset "${response.name}" processed successfully.`;
      }

      addToast(success ? 'success' : 'error', 
               success ? `${actionType} Successful` : `${actionType} Failed`, 
               message);
      if (success) {
        loadDatasets(); 
        if (actionType === 'upload') {
          setIsUploadModalOpen(false);
          setUploadFormData({name: '', description: ''});
          setSelectedFile(null);
        }
        if (actionType === 'delete') {
          setIsConfirmDeleteModalOpen(false); 
          setDatasetToDelete(null);
        }
      } else {
        if (isUploadModalOpen || isConfirmDeleteModalOpen) setModalActionFeedback({success: false, message}); 
      }
    } catch (error: any) {
      console.error(`Error performing ${actionType}:`, error);
      const defaultMessage = "An unexpected error occurred.";
      addToast('error', `${actionType} Failed`, error.message || defaultMessage);
      if (isUploadModalOpen || isConfirmDeleteModalOpen) setModalActionFeedback({success: false, message: error.message || defaultMessage});
    } finally {
      setLoadingAction(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleOpenUploadModal = () => {
    setUploadFormData({ name: '', description: '' });
    setSelectedFile(null);
    setModalActionFeedback(null); 
    setIsUploadModalOpen(true);
  };
  
  const handleUploadFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUploadFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadDatasetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setModalActionFeedback({success: false, message: "Please select a file to upload."});
      return;
    }
    if (!uploadFormData.name.trim()) {
      setModalActionFeedback({success: false, message: "Dataset name is required."});
      return;
    }
    handleGeneralAction(datasetService.uploadDatasetFile(selectedFile, uploadFormData.name, uploadFormData.description || undefined), 'upload');
  };

  const handleDeleteRequest = (dataset: Dataset) => {
    setDatasetToDelete(dataset);
    setModalActionFeedback(null);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteDataset = () => {
    if (datasetToDelete) {
      handleGeneralAction(datasetService.deleteDatasetById(datasetToDelete.id), 'delete', datasetToDelete.id);
    }
  };

  const datasetColumns: TableColumn<Dataset>[] = [
    { header: 'Name', accessor: item => <Link to={`/datasets/${item.id}`} className="text-accent-blue hover:underline font-medium">{item.name}</Link>, sortable: true },
    { 
      header: 'Status', 
      accessor: item => (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusPillClassTable(item.status)}`}>
          {getStatusPillText(item.status, item.current_task_id)}
        </span>
      ), 
      sortable: true 
    },
    { header: 'Rows', accessor: item => item.rowCount.toLocaleString(), sortable: true },
    { header: 'Cols', accessor: item => item.columnCount.toLocaleString(), sortable: true },
    { header: 'Size', accessor: item => `${(item.fileSizeBytes / (1024*1024)).toFixed(2)} MB`, sortable: true },
    { header: 'Created At', accessor: item => item.createdAt.toLocaleDateString(), sortable: true },
    {
      header: 'Actions',
      accessor: (item: Dataset) => (
        currentUser?.is_admin ? (
          <div className="flex space-x-1">
             <Link to={`/datasets/${item.id}`} className="p-1 text-text-secondary hover:text-accent-blue" title="View Details" aria-label={`View details for ${item.name}`}>
                <EyeIcon className="w-4 h-4"/>
            </Link>
            <button
              onClick={() => handlePreprocessRequest(item)}
              disabled={item.status !== 'Uploaded' || loadingAction[`Preprocess_Pipeline-${item.id}`]}
              className="p-1 text-text-secondary hover:text-accent-blue disabled:opacity-50 disabled:cursor-not-allowed"
              title="Preprocess Dataset (Pipeline)"
            >
              {loadingAction[`Preprocess_Pipeline-${item.id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CogIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleConfigureQIFSRequest(item)}
              disabled={item.status !== 'Pipeline_Preprocessing_Completed' || loadingAction[`Select_Features_Pipeline-${item.id}`]}
              className="p-1 text-text-secondary hover:text-accent-purple disabled:opacity-50 disabled:cursor-not-allowed"
              title="Run Feature Selection (Pipeline)"
            >
              {loadingAction[`Select_Features_Pipeline-${item.id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleDeleteRequest(item)}
              disabled={loadingAction[`delete-${item.id}`]}
              className="p-1 text-text-secondary hover:text-danger disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Dataset"
            >
              {loadingAction[`delete-${item.id}`] ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
            </button>
          </div>
        ) : <Link to={`/datasets/${item.id}`} className="text-xs text-accent-blue hover:underline">View</Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Dataset Management"
        subtitle="Manage and process datasets for WIDS training and evaluation."
        actions={
          <div className="flex items-center space-x-4">
            <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
            {currentUser?.is_admin && (
              <button
                onClick={handleOpenUploadModal}
                disabled={loadingAction['global-upload']}
                className="btn-primary text-sm" 
              >
                <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                <span>Upload</span>
              </button>
            )}
          </div>
        }
      />

      {isLoading && (
        <Card><div className="text-center py-10"><SkeletonLoader type="block" className="h-20" /></div></Card>
      )}
      {!isLoading && datasets.length === 0 && (
        <Card>
          <div className="text-center py-10 text-text-secondary">
            <CubeIcon className="w-12 h-12 mx-auto mb-2"/>
            No datasets found. Admins can upload new datasets.
          </div>
        </Card>
      )}

      {!isLoading && datasets.length > 0 && (
        viewMode === 'list' ? (
          <Card bodyClassName="p-0">
            <Table columns={datasetColumns} data={datasets} isLoading={isLoading} itemsPerPage={10}/>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map(ds => (
              <DatasetCardItem 
                key={ds.id} 
                dataset={ds} 
                onPreprocessRequest={handlePreprocessRequest}
                onConfigureQIFSRequest={handleConfigureQIFSRequest}
                onDeleteRequest={handleDeleteRequest}
                loadingAction={loadingAction}
                isAdmin={!!currentUser?.is_admin}
                getStatusPillTextFn={getStatusPillText}
              />
            ))}
          </div>
        )
      )}

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload New Dataset">
        <form onSubmit={handleUploadDatasetSubmit} className="space-y-4">
          {modalActionFeedback && (
            <div role="alert" className={`p-3 rounded-md text-sm ${modalActionFeedback.success ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
              {modalActionFeedback.message}
            </div>
           )}
          <div>
            <label htmlFor="uploadDatasetName" className="block text-sm font-medium text-text-secondary">Dataset Name</label>
            <input type="text" name="name" id="uploadDatasetName" value={uploadFormData.name} onChange={handleUploadFormChange} required className="input-field" placeholder="e.g., AWID_Aug2024_Raw" />
          </div>
          <div>
            <label htmlFor="uploadDatasetDescription" className="block text-sm font-medium text-text-secondary">Description (Optional)</label>
            <textarea name="description" id="uploadDatasetDescription" value={uploadFormData.description} onChange={handleUploadFormChange} rows={3} className="input-field" placeholder="Briefly describe the dataset content or source"></textarea>
          </div>
          <div>
            <label htmlFor="datasetFile" className="block text-sm font-medium text-text-secondary">Dataset File (.csv, .parquet)</label>
            <input 
              type="file" 
              name="datasetFile" 
              id="datasetFile" 
              onChange={handleFileChange} 
              required 
              className="mt-1 block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent-blue file:text-white hover:file:bg-accent-blue/80"
              accept=".csv,.parquet" 
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setIsUploadModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loadingAction['global-upload']} className="btn-primary">
               {loadingAction['global-upload'] ? <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/> Uploading...</> : 'Upload Dataset'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => { setIsConfirmDeleteModalOpen(false); setDatasetToDelete(null);}}
        onConfirm={confirmDeleteDataset}
        title="Confirm Dataset Deletion"
        message={`Are you sure you want to delete dataset "${datasetToDelete?.name}" (ID: ${datasetToDelete?.id})? This action cannot be undone.`}
        confirmButtonText="Delete Dataset"
        confirmButtonClassName="btn-danger"
        isLoading={loadingAction[`delete-${datasetToDelete?.id}`]}
      />
      
      {datasetForQIFS && (
        <FeatureSelectionConfigModal
          isOpen={isQIFSConfigModalOpen}
          onClose={() => { setIsQIFSConfigModalOpen(false); setDatasetForQIFS(null);}}
          onSubmit={handleSubmitQIFSConfig}
          isLoading={loadingAction[`Select_Features_Pipeline-${datasetForQIFS.id}`]}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmPreprocessModalOpen}
        onClose={() => { setIsConfirmPreprocessModalOpen(false); setDatasetToPreprocess(null); }}
        onConfirm={confirmPreprocessPipeline}
        title="Confirm Preprocessing"
        message={`Are you sure you want to start preprocessing for dataset "${datasetToPreprocess?.name}"?`}
        confirmButtonText="Start Preprocessing"
        confirmButtonClassName="btn-primary"
        isLoading={loadingAction[`Preprocess_Pipeline-${datasetToPreprocess?.id}`]}
      />

      <ConfirmationModal
        isOpen={isConfirmQIFSStartModalOpen}
        onClose={() => { setIsConfirmQIFSStartModalOpen(false); setDatasetForQIFSStartConfirm(null); }}
        onConfirm={confirmStartQIFS}
        title="Confirm Feature Selection"
        message={`Are you sure you want to start feature selection for dataset "${datasetForQIFSStartConfirm?.name}"?`}
        confirmButtonText="Yes, Configure"
        confirmButtonClassName="btn-primary"
        isLoading={false} // This modal itself doesn't do async, just opens next one
      />
    </div>
  );
};

export default DatasetManagementPage;
