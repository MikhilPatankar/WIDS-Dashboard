import React, { useEffect, useState, useCallback, FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Dataset, TableColumn, DatasetStatistics, FeatureSelectionRun, ApiResponseMessage, PipelineFeatureSelectionConfig, DatasetStatus } from '../src/types'; 
import type { FeatureSelectionRunStatus } from '../src/types'; // Explicitly import type
import * as datasetService from '../src/services/datasetService'; 
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal'; 
import ConfirmationModal from '../src/components/ConfirmationModal';
import { usePageContext } from '../contexts/PageContext';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeftIcon, CubeIcon, TableCellsIcon, DocumentTextIcon, CogIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
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


const DatasetDetailPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>();
  const { setPageContext } = usePageContext();
  const { addToast } = useToast();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [featureSelectionRuns, setFeatureSelectionRuns] = useState<FeatureSelectionRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFsRuns, setIsLoadingFsRuns] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<Record<string, boolean>>({});
  
  const [isQIFSConfigModalOpen, setIsQIFSConfigModalOpen] = useState(false);
  // States for confirmation modals
  const [isConfirmPreprocessModalOpen, setIsConfirmPreprocessModalOpen] = useState(false);
  const [isConfirmQIFSStartModalOpen, setIsConfirmQIFSStartModalOpen] = useState(false);


  const loadDatasetDetails = useCallback(async () => {
    if (datasetId) {
      setIsLoading(true);
      setError(null);
      try {
        const data = await datasetService.getDatasetById(datasetId);
        if (data) {
          setDataset(data);
          setPageContext(
            `/datasets/${datasetId}`,
            `Dataset Details: ${data.name}`,
            {
              id: data.id,
              name: data.name,
              status: data.status,
              rowCount: data.rowCount,
              columnCount: data.columnCount,
              description: data.description,
              current_task_id: data.current_task_id,
            }
          );
        } else {
          setError('Dataset not found.');
          setPageContext(`/datasets/${datasetId}`, `Dataset Not Found: ${datasetId}`);
        }
      } catch (err: any) {
        console.error("Error fetching dataset details:", err);
        setError('Failed to load dataset details.');
        addToast('error', 'Load Error', err.message || 'Failed to load dataset details.');
        setPageContext(`/datasets/${datasetId}`, `Error Loading Dataset: ${datasetId}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [datasetId, setPageContext, addToast]);

  const loadFeatureSelectionRuns = useCallback(async () => {
    if (datasetId) {
      setIsLoadingFsRuns(true);
      try {
        const runs = await datasetService.listFeatureSelectionRuns(datasetId);
        setFeatureSelectionRuns(runs);
      } catch (err: any) {
        console.error("Error fetching feature selection runs:", err);
        addToast('error', 'Load Error', err.message || 'Failed to load feature selection runs.');
      } finally {
        setIsLoadingFsRuns(false);
      }
    }
  }, [datasetId, addToast]);

  useEffect(() => {
    loadDatasetDetails();
    loadFeatureSelectionRuns();
  }, [loadDatasetDetails, loadFeatureSelectionRuns]);


  const handlePipelineAction = async (actionPromise: Promise<ApiResponseMessage>, actionName: string) => {
    if (!dataset) return;
    setLoadingAction(prev => ({ ...prev, [actionName]: true }));
    try {
      const response = await actionPromise;
      addToast('success', `${actionName.replace(/_/g, ' ')} Initiated`, response.message || `${actionName} task scheduled.`);
      loadDatasetDetails(); 
      if (actionName.includes('Select_Features')) {
        loadFeatureSelectionRuns(); 
      }
    } catch (err: any) {
      console.error(`Error during ${actionName} for ${dataset.id}:`, err);
      addToast('error', `${actionName.replace(/_/g, ' ')} Failed`, err.message || `Could not start ${actionName}.`);
    } finally {
      setLoadingAction(prev => ({ ...prev, [actionName]: false }));
    }
  };

  const handlePreprocessRequest = () => {
    if (dataset) {
      setIsConfirmPreprocessModalOpen(true);
    }
  };

  const confirmPreprocessPipeline = () => {
    if (dataset) {
      handlePipelineAction(datasetService.preprocessDatasetPipeline(dataset.id), 'Preprocess_Pipeline');
    }
    setIsConfirmPreprocessModalOpen(false);
  };
  
  const handleConfigureQIFSRequest = () => {
    if (dataset) {
      setIsConfirmQIFSStartModalOpen(true);
    }
  };

  const confirmStartQIFS = () => {
    if (dataset) {
      setIsQIFSConfigModalOpen(true); // Open the config modal after confirmation
    }
    setIsConfirmQIFSStartModalOpen(false);
  };


  const handleSubmitQIFSConfig = (config: PipelineFeatureSelectionConfig) => {
    if (dataset) {
      setIsQIFSConfigModalOpen(false);
      handlePipelineAction(datasetService.selectFeaturesPipeline(dataset.id, config), 'Select_Features_Pipeline');
    }
  };
  
  const getStatusPillText = (status: DatasetStatus, current_task_id?: string | null): string => {
    if (status === 'Pipeline_Preprocessing_Completed') {
      return 'Preprocessed';
    }
    let text = status.replace(/Pipeline_/g, '').replace(/_/g, ' ');
    if (current_task_id && (status.includes('Running') || status.includes('Scheduled'))) {
      text += ` (Task ID: ${current_task_id.substring(0,8)}...)`;
    }
    return text;
  };
  
  const getFsRunStatusPill = (status: FeatureSelectionRunStatus) => {
    let colors = 'bg-gray-500/20 text-text-secondary';
    switch (status) {
      case 'SCHEDULED':
        colors = 'bg-yellow-500/20 text-yellow-400';
        break;
      case 'RUNNING':
        colors = 'bg-yellow-500/20 text-yellow-400 animate-pulse';
        break;
      case 'COMPLETED':
        colors = 'bg-success/20 text-success';
        break;
      case 'FAILED':
        colors = 'bg-danger/20 text-danger';
        break;
      case 'CANCELLED':
        colors = 'bg-slate-600/20 text-slate-400';
        break;
    }
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors}`}>{status}</span>;
  };


  if (isLoading && !dataset) { 
    return (
      <div className="space-y-6 sm:space-y-8 p-4">
        <PageHeader title={<SkeletonLoader type="title" className="h-8 w-1/2"/>} subtitle={<SkeletonLoader type="text" className="h-4 w-1/3 mt-1"/>}/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Overview" className="md:col-span-1"><SkeletonLoader type="block" className="h-48"/></Card>
            <Card title="Processing History" className="md:col-span-2"><SkeletonLoader type="block" className="h-32"/></Card>
        </div>
        <Card title="Statistics Preview"><SkeletonLoader type="block" className="h-60"/></Card>
        <Card title="Feature Selection Runs"><SkeletonLoader type="block" className="h-40"/></Card>
      </div>
    );
  }

  if (error) {
    return <div role="alert" className="p-6 text-center text-danger">{error}</div>;
  }

  if (!dataset) {
    return <div className="p-6 text-center text-text-secondary">No dataset data available.</div>;
  }
  
  const statisticsTableData = dataset.statistics ? 
    dataset.statistics.columns.map(colName => ({
        columnName: colName,
        dataType: dataset.statistics?.datatypes[colName] || 'N/A',
        nullCount: dataset.statistics?.null_counts[colName]?.toLocaleString() || '0',
    })) : [];

  const statisticsDisplayColumns: TableColumn<typeof statisticsTableData[0]>[] = [
      { header: 'Column Name', accessor: 'columnName', sortable: true },
      { header: 'Data Type', accessor: 'dataType', sortable: true },
      { header: 'Null Count', accessor: 'nullCount', sortable: true },
  ];

  const sampleDataColumns: TableColumn<Record<string, any>>[] = dataset.sampleData && dataset.sampleData.length > 0
    ? Object.keys(dataset.sampleData[0]).map(key => ({
        header: key,
        accessor: (item: Record<string, any>) => String(item[key]),
        sortable: true
      }))
    : [];

  const fsRunsColumns: TableColumn<FeatureSelectionRun>[] = [
    { header: 'Run ID', accessor: item => <Link to={`#`} className="text-accent-blue hover:underline text-xs">{item.fsrun_id ? item.fsrun_id.substring(0,12) + '...' : 'N/A'}</Link> },
    { header: 'Status', accessor: item => getFsRunStatusPill(item.status as FeatureSelectionRunStatus) }, // Cast status
    { header: 'Method', accessor: item => item.config.method },
    { header: 'Iterations', accessor: item => item.config.iterations ?? 'N/A' },
    { header: 'Selected', accessor: item => item.selected_features_count ?? 'N/A' },
    { header: 'Created', accessor: item => new Date(item.created_at).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={isLoading ? <SkeletonLoader type="title" className="h-8 w-2/3" /> : dataset.name}
        subtitle={isLoading ? <SkeletonLoader type="text" className="h-4 w-1/3 mt-1" /> : `Details and actions for dataset ID: ${dataset.id}`}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreprocessRequest}
              disabled={dataset.status !== 'Uploaded' || loadingAction['Preprocess_Pipeline']}
              className="btn-secondary text-sm flex items-center" // Added flex
              aria-label="Preprocess Dataset (Pipeline)"
            >
              <CogIcon className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">
                {loadingAction['Preprocess_Pipeline'] ? 'Processing...' : 'Preprocess'}
              </span>
            </button>
            <button
              onClick={handleConfigureQIFSRequest}
              disabled={dataset.status !== 'Pipeline_Preprocessing_Completed' || loadingAction['Select_Features_Pipeline']}
              className="btn-primary text-sm flex items-center" // Added flex
              aria-label="Run Feature Selection (Pipeline)"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">
                {loadingAction['Select_Features_Pipeline'] ? 'Running...' : 'Select Features'}
              </span>
            </button>
            <Link
              to="/datasets"
              className="btn-secondary text-sm flex items-center" // Added flex
              aria-label="Back to Dataset Management"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">Back</span>
            </Link>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Overview" icon={<CubeIcon className="w-5 h-5 text-text-secondary"/>} className="md:col-span-1">
          {isLoading ? <SkeletonLoader type="block" className="h-48"/> : (
            <div className="space-y-2 text-sm">
                <p><strong className="text-text-secondary">ID:</strong> {dataset.id}</p>
                <p><strong className="text-text-secondary">Status:</strong> 
                  <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                      dataset.status === 'Uploaded' ? 'bg-sky-500/20 text-sky-400' :
                      (dataset.status.includes('Preprocessing') && (dataset.status.includes('Running') || dataset.status.includes('Scheduled'))) || (dataset.status.includes('Feature_Selection') && (dataset.status.includes('Running') || dataset.status.includes('Scheduled')))? 'bg-yellow-500/20 text-yellow-400' :
                      dataset.status === 'Pipeline_Preprocessing_Completed' ? 'bg-indigo-500/20 text-indigo-400' :
                      dataset.status === 'Ready' || dataset.status === 'Pipeline_Feature_Selection_Completed' ? 'bg-success/20 text-success' :
                      dataset.status === 'Error' || dataset.status === 'Pipeline_Error' ? 'bg-danger/20 text-danger' :
                      'bg-gray-500/20 text-text-secondary'
                  }`}>
                    {getStatusPillText(dataset.status, dataset.current_task_id)}
                  </span>
                </p>
                <p><strong className="text-text-secondary">Description:</strong> {dataset.description || 'N/A'}</p>
                <p><strong className="text-text-secondary">Rows:</strong> {dataset.rowCount.toLocaleString()}</p>
                <p><strong className="text-text-secondary">Columns:</strong> {dataset.columnCount.toLocaleString()}</p>
                <p><strong className="text-text-secondary">Size:</strong> {(dataset.fileSizeBytes / (1024*1024)).toFixed(2)} MB</p>
                <p><strong className="text-text-secondary">Created:</strong> {dataset.createdAt.toLocaleString()}</p>
                <p><strong className="text-text-secondary">Last Updated:</strong> {dataset.updatedAt?.toLocaleString() || 'N/A'}</p>
                <p><strong className="text-text-secondary">File Path:</strong> <span className="truncate" title={dataset.filePath}>{dataset.filePath ? `...${dataset.filePath.slice(-40)}` : 'N/A'}</span></p>
            </div>
          )}
        </Card>

        <Card title="Processing History (Mock)" icon={<DocumentTextIcon className="w-5 h-5 text-text-secondary"/>} className="md:col-span-2">
            {isLoading ? <SkeletonLoader type="block" className="h-32"/> : 
             dataset.processingHistory && dataset.processingHistory.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-sm text-text-secondary">
                    {dataset.processingHistory.map((step, index) => <li key={index}>{step}</li>)}
                </ul>
            ) : <p className="text-sm text-text-secondary">No processing history available for this dataset.</p>}
        </Card>
      </div>
      
      <Card title="Statistics Preview" icon={<TableCellsIcon className="w-5 h-5 text-text-secondary"/>} bodyClassName="p-0">
          {isLoading ? <SkeletonLoader type="block" className="h-60"/> : 
           dataset.statistics && statisticsTableData.length > 0 ? (
              <Table columns={statisticsDisplayColumns} data={statisticsTableData} itemsPerPage={5} />
          ) : <p className="text-sm text-text-secondary p-4">No column statistics available for this dataset.</p>}
      </Card>
      
       <Card title="Sample Data" icon={<TableCellsIcon className="w-5 h-5 text-text-secondary"/>} bodyClassName="p-0">
          {isLoading ? <SkeletonLoader type="block" className="h-60"/> : 
           dataset.sampleData && dataset.sampleData.length > 0 ? (
              <Table columns={sampleDataColumns} data={dataset.sampleData} itemsPerPage={5} />
          ) : <p className="text-sm text-text-secondary p-4">No sample data available for preview.</p>}
      </Card>
      
      <Card title="Feature Selection Runs" icon={<SparklesIcon className="w-5 h-5 text-text-secondary"/>} bodyClassName="p-0">
        <Table columns={fsRunsColumns} data={featureSelectionRuns} isLoading={isLoadingFsRuns} emptyStateMessage="No feature selection runs found for this dataset." itemsPerPage={5} />
      </Card>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isConfirmPreprocessModalOpen}
        onClose={() => setIsConfirmPreprocessModalOpen(false)}
        onConfirm={confirmPreprocessPipeline}
        title="Confirm Preprocessing"
        message={`Are you sure you want to start preprocessing for dataset "${dataset?.name}"?`}
        confirmButtonText="Start Preprocessing"
        confirmButtonClassName="btn-primary"
        isLoading={loadingAction['Preprocess_Pipeline']}
      />

      <ConfirmationModal
        isOpen={isConfirmQIFSStartModalOpen}
        onClose={() => setIsConfirmQIFSStartModalOpen(false)}
        onConfirm={confirmStartQIFS}
        title="Confirm Feature Selection"
        message={`Are you sure you want to start feature selection for dataset "${dataset?.name}"?`}
        confirmButtonText="Yes, Configure"
        confirmButtonClassName="btn-primary"
        isLoading={false} // This modal leads to another, no direct async here
      />
      
      {dataset && (
        <FeatureSelectionConfigModal
          isOpen={isQIFSConfigModalOpen}
          onClose={() => setIsQIFSConfigModalOpen(false)}
          onSubmit={handleSubmitQIFSConfig}
          isLoading={loadingAction['Select_Features_Pipeline']}
        />
      )}
    </div>
  );
};

export default DatasetDetailPage;