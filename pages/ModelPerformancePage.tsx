
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Table from '../components/Table';
import { ModelPerformanceMetrics, ApiResponseMessage, BenchmarkConfig, TableColumn, ModelRegistryStatus } from '../types';
import MetricDisplay from '../components/MetricDisplay';
import ViewSwitcher from '../components/ViewSwitcher';
import { fetchModelPerformanceMetrics, promoteModel, deleteModel, loadModel, unloadModel, runBenchmarkTest } from '../services/mockDataService';
import { useAuth } from '../contexts/AuthContext';
import { ChartBarIcon, StarIcon, CpuChipIcon, PlayCircleIcon, TrashIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, BeakerIcon, StopIcon, ServerStackIcon, EyeIcon } from '@heroicons/react/24/outline'; // Removed LightBulbIcon, PlusCircleIcon

const ModelCardItem: React.FC<{ model: ModelPerformanceMetrics; onAction: (actionPromise: Promise<ApiResponseMessage>, modelId: string, actionName: string) => void; loadingModelAction: Record<string, boolean>; isAdmin: boolean; }> =
  ({ model, onAction, loadingModelAction, isAdmin }) => {
    
  const getStatusColorCard = (status: ModelPerformanceMetrics['status']) => {
    if (status === 'Production' || status === 'production') return 'border-success';
    if (status === 'Staging' || status === 'staging') return 'border-accent-blue';
    if (status === 'Candidate' || status === 'candidate' || status === 'Uploaded') return 'border-yellow-500';
    if (status === 'Training') return 'border-purple-500 animate-pulse';
    if (status === 'Loaded') return 'border-teal-500';
    if (status === 'Archived' || status === 'archived') return 'border-slate-600';
    return 'border-gray-500';
  };
   const getStatusPillCard = (status: ModelPerformanceMetrics['status']) => {
    let colors = 'bg-gray-500/30 text-gray-300';
    if (status === 'Production' || status === 'production') colors = 'bg-success/30 text-success';
    else if (status === 'Staging' || status === 'staging') colors = 'bg-accent-blue/30 text-accent-blue';
    else if (status === 'Candidate' || status === 'candidate' || status === 'Uploaded') colors = 'bg-yellow-500/30 text-yellow-400';
    else if (status === 'Training') colors = 'bg-purple-500/30 text-purple-400 animate-pulse';
    else if (status === 'Loaded') colors = 'bg-teal-500/30 text-teal-400';
    else if (status === 'Archived' || status === 'archived') colors = 'bg-slate-600/30 text-slate-400';
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors}`}>{status}</span>;
  };

  return (
    <Card className={`border-l-4 ${getStatusColorCard(model.status)} hover:shadow-2xl transition-shadow flex flex-col`}>
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-1">
          <Link to={`/models/${model.model_id}`} className="text-lg font-semibold text-accent-blue hover:underline truncate mr-2" title={model.model_id}>
            {model.model_id.length > 25 ? `${model.model_id.substring(0, 25)}...` : model.model_id}
          </Link>
          {getStatusPillCard(model.status)}
        </div>
        <p className="text-xs text-text-secondary mb-1">Version: {model.version}</p>
        <p className="text-xs text-text-secondary mb-3 truncate" title={`Dataset: ${model.datasetUsed}`}>Dataset: {model.datasetUsed || 'N/A'}</p>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
          <span>Acc: <span className="text-text-primary font-medium">{(model.accuracy * 100).toFixed(2)}%</span></span>
          <span>F1: <span className="text-text-primary font-medium">{model.f1_score.toFixed(3)}</span></span>
          <span>Prec: <span className="text-text-primary font-medium">{(model.precision * 100).toFixed(2)}%</span></span>
          <span>Recall: <span className="text-text-primary font-medium">{(model.recall * 100).toFixed(2)}%</span></span>
        </div>
        <p className="text-xs text-text-secondary">Created: <span className="text-text-primary font-medium">{new Date(model.created_at).toLocaleDateString()}</span></p>
        {model.adaptationSpeedMinutes && <p className="text-xs text-text-secondary">Adapt Speed: <span className="text-text-primary font-medium">{model.adaptationSpeedMinutes} min</span></p>}
        {model.isLoaded && <p className="text-xs text-teal-400 font-semibold mt-1">Loaded in Memory</p>}
      </div>
      {isAdmin && (
         <div className="mt-auto pt-3 border-t border-tertiary-dark flex flex-wrap gap-1 justify-end items-center">
           <select 
            value={model.status === 'Loaded' || model.status === 'Training' || model.status === 'Uploaded' ? model.status : 'Promote'} 
            onChange={(e) => {
                const selectedValue = e.target.value as ModelRegistryStatus | 'Promote';
                if (selectedValue !== 'Promote') {
                     onAction(promoteModel(model.model_id, selectedValue), model.model_id, `promote-${selectedValue}-${model.model_id}`);
                }
            }}
            disabled={loadingModelAction[`promote-staging-${model.model_id}`] || loadingModelAction[`promote-production-${model.model_id}`] ||  loadingModelAction[`promote-archived-${model.model_id}`] || loadingModelAction[`promote-candidate-${model.model_id}`] || model.status === 'Training' || model.status === 'Loaded' || model.status === 'Uploaded'}
            className="bg-tertiary-dark text-xs p-1 rounded disabled:opacity-50 text-text-primary focus:ring-accent-blue focus:border-accent-blue"
            title="Promote Model"
          >
            <option value="Promote" disabled hidden>Promote</option>
            {model.status !== 'staging' && <option value="staging">To Staging</option>}
            {model.status !== 'production' && <option value="production">To Production</option>}
            {model.status !== 'archived' && <option value="archived">To Archive</option>}
            {model.status !== 'candidate' && <option value="candidate">To Candidate</option>}
          </select>
          
          {model.isLoaded ? (
             <button onClick={() => onAction(unloadModel(model.model_id), model.model_id, `unload-${model.model_id}`)} disabled={loadingModelAction[`unload-${model.model_id}`]} className="p-1.5 text-text-secondary hover:text-yellow-400 disabled:opacity-50" title="Unload Model">
                {loadingModelAction[`unload-${model.model_id}`] ? <StopIcon className="w-4 h-4 animate-spin"/> : <ArrowDownCircleIcon className="w-4 h-4"/>}
             </button>
          ) : (
             <button onClick={() => onAction(loadModel(model.model_id), model.model_id, `load-${model.model_id}`)} disabled={loadingModelAction[`load-${model.model_id}`] || model.status === 'Archived' || model.status === 'Training' || model.status === 'Uploaded'} className="p-1.5 text-text-secondary hover:text-success disabled:opacity-50" title="Load Model">
               {loadingModelAction[`load-${model.model_id}`] ? <StopIcon className="w-4 h-4 animate-spin"/> : <ArrowUpCircleIcon className="w-4 h-4"/>}
             </button>
          )}

          <button onClick={() => {
              const testType = window.prompt("Benchmark type: 'Stress' or 'ConceptDrift'?", "Stress") as BenchmarkConfig['testType'] | null;
              if(testType && (testType === 'Stress' || testType === 'ConceptDrift')){
                onAction(runBenchmarkTest(model.model_id, { testType }), model.model_id, `benchmark-${model.model_id}`);
              }
            }} 
            disabled={loadingModelAction[`benchmark-${model.model_id}`] || model.status === 'Training' || model.status === 'Uploaded'} 
            className="p-1.5 text-text-secondary hover:text-accent-purple disabled:opacity-50" title="Run Benchmark">
             {loadingModelAction[`benchmark-${model.model_id}`] ? <StopIcon className="w-4 h-4 animate-spin"/> : <BeakerIcon className="w-4 h-4"/>}
          </button>

          <button onClick={() => {
              if(window.confirm(`Delete model ${model.model_id}? This cannot be undone.`)) {
                onAction(deleteModel(model.model_id), model.model_id, `delete-${model.model_id}`);
              }
            }} 
            disabled={loadingModelAction[`delete-${model.model_id}`]}
            className="p-1.5 text-text-secondary hover:text-danger disabled:opacity-50" title="Delete Model">
            {loadingModelAction[`delete-${model.model_id}`] ? <StopIcon className="w-4 h-4 animate-spin"/> : <TrashIcon className="w-4 h-4"/>}
          </button>
        </div>
      )}
    </Card>
  );
};

const ModelPerformancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [models, setModels] = useState<ModelPerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<ApiResponseMessage | null>(null);
  const [loadingModelAction, setLoadingModelAction] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const modelData = await fetchModelPerformanceMetrics(); 
      setModels(modelData as ModelPerformanceMetrics[]); // Cast to ensure correct type
    } catch (error) {
      console.error("Error fetching model performance data:", error);
      setActionFeedback({ success: false, message: "Failed to load model performance data." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleModelAction = async (actionPromise: Promise<ApiResponseMessage>, modelId: string, actionName: string) => {
    setLoadingModelAction(prev => ({ ...prev, [actionName]: true }));
    setActionFeedback(null);
    try {
      const response = await actionPromise;
      setActionFeedback(response);
      if (response.success) {
        loadModels(); 
      }
    } catch (error: any) {
      console.error(`Error performing action ${actionName} for model ${modelId}:`, error);
      setActionFeedback({ success: false, message: error.message || `Failed to ${actionName.split('-')[0]} model.` });
    } finally {
      setLoadingModelAction(prev => ({ ...prev, [actionName]: false }));
    }
  };
  
  const getStatusPillTable = (status: ModelPerformanceMetrics['status']) => {
    let colors = 'bg-gray-500/20 text-gray-300';
    if (status === 'Production' || status === 'production') colors = 'bg-success/20 text-success';
    else if (status === 'Staging' || status === 'staging') colors = 'bg-accent-blue/20 text-accent-blue';
    else if (status === 'Candidate' || status === 'candidate' || status === 'Uploaded') colors = 'bg-yellow-500/20 text-yellow-400';
    else if (status === 'Training') colors = 'bg-purple-500/20 text-purple-400 animate-pulse';
    else if (status === 'Loaded') colors = 'bg-teal-500/20 text-teal-400';
    else if (status === 'Archived' || status === 'archived') colors = 'bg-slate-600/20 text-slate-400';
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors}`}>{status}</span>;
  };

  const modelColumns: TableColumn<ModelPerformanceMetrics>[] = [
    { 
      header: 'Model ID', 
      accessor: item => (
        <Link to={`/models/${item.model_id}`} className="text-accent-blue hover:underline font-medium" title={item.model_id}>
          {item.model_id.length > 20 ? `${item.model_id.substring(0, 20)}...` : item.model_id}
        </Link>
      ) 
    },
    { header: 'Version', accessor: 'version' },
    { header: 'Status', accessor: item => getStatusPillTable(item.status) },
    { header: 'Accuracy', accessor: item => `${(item.accuracy * 100).toFixed(2)}%` },
    { header: 'F1 Score', accessor: item => item.f1_score.toFixed(3) },
    { header: 'Dataset', accessor: item => <span title={item.datasetUsed}>{item.datasetUsed ? (item.datasetUsed.length > 15 ? `${item.datasetUsed.substring(0,15)}...` : item.datasetUsed) : 'N/A'}</span> },
    { header: 'Loaded', accessor: item => item.isLoaded ? <CpuChipIcon className="w-5 h-5 text-success" title="Loaded"/> : <CpuChipIcon className="w-5 h-5 text-text-secondary opacity-50" title="Not Loaded"/> },
    { header: 'Created At', accessor: item => new Date(item.created_at).toLocaleDateString() },
    {
      header: 'Actions',
      accessor: (item: ModelPerformanceMetrics) => (
        currentUser?.is_admin ? (
          <div className="flex space-x-1 items-center">
            <Link to={`/models/${item.model_id}`} className="p-1.5 text-text-secondary hover:text-accent-blue" title="View Details">
              <EyeIcon className="w-4 h-4"/>
            </Link>
            {item.isLoaded ? (
               <button onClick={() => handleModelAction(unloadModel(item.model_id), item.model_id, `unload-${item.model_id}`)} disabled={loadingModelAction[`unload-${item.model_id}`]} className="p-1.5 text-text-secondary hover:text-yellow-400 disabled:opacity-50" title="Unload Model">
                  {loadingModelAction[`unload-${item.model_id}`] ? <StopIcon className="w-4 h-4 animate-spin"/> : <ArrowDownCircleIcon className="w-4 h-4"/>}
               </button>
            ) : (
               <button onClick={() => handleModelAction(loadModel(item.model_id), item.model_id, `load-${item.model_id}`)} disabled={loadingModelAction[`load-${item.model_id}`] || item.status === 'Archived' || item.status === 'Training' || item.status === 'Uploaded'} className="p-1.5 text-text-secondary hover:text-success disabled:opacity-50" title="Load Model">
                 {loadingModelAction[`load-${item.model_id}`] ? <StopIcon className="w-4 h-4 animate-spin"/> : <ArrowUpCircleIcon className="w-4 h-4"/>}
               </button>
            )}
            <button onClick={() => {
                if(window.confirm(`Delete model ${item.model_id}? This cannot be undone.`)) {
                  handleModelAction(deleteModel(item.model_id), item.model_id, `delete-${item.model_id}`);
                }
              }} 
              disabled={loadingModelAction[`delete-${item.model_id}`]}
              className="p-1.5 text-text-secondary hover:text-danger disabled:opacity-50" title="Delete Model">
              {loadingModelAction[`delete-${item.model_id}`] ? <StopIcon className="w-4 h-4 animate-spin"/> : <TrashIcon className="w-4 h-4"/>}
            </button>
          </div>
        ) : <Link to={`/models/${item.model_id}`} className="text-xs text-accent-blue hover:underline">View</Link>
      ),
    },
  ];
  
  const totalModels = models.length;
  const productionModels = models.filter(m => m.status === 'Production' || m.status === 'production').length;
  const loadedModels = models.filter(m => m.isLoaded).length;
  const avgAccuracy = totalModels > 0 
    ? (models.reduce((sum, m) => sum + m.accuracy, 0) / totalModels * 100).toFixed(1) 
    : 'N/A';

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Model Performance"
        subtitle="Monitor, manage, and benchmark WIDS models."
        actions={
          <div className="flex items-center space-x-4">
            <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
          </div>
        }
      />

      {actionFeedback && (
        <div className={`mb-4 p-3 rounded-md text-sm ${actionFeedback.success ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricDisplay title="Total Models" value={totalModels} isLoading={isLoading} icon={<ServerStackIcon className="w-6 h-6"/>} />
        <MetricDisplay title="Production Models" value={`${productionModels} / ${totalModels}`} isLoading={isLoading} icon={<StarIcon className="w-6 h-6 text-yellow-400"/>} />
        <MetricDisplay title="Avg. Accuracy" value={avgAccuracy} unit="%" isLoading={isLoading} icon={<ChartBarIcon className="w-6 h-6"/>} />
        <MetricDisplay title="Models Loaded" value={`${loadedModels} / ${totalModels}`} isLoading={isLoading} icon={<CpuChipIcon className="w-6 h-6 text-success"/>} />
      </div>

      {isLoading && <div className="text-center py-10 text-text-secondary">Loading models...</div>}
      {!isLoading && models.length === 0 && (
        <Card>
          <div className="text-center py-10 text-text-secondary">
            <ServerStackIcon className="w-12 h-12 mx-auto mb-2"/>
            No models found. Admins can start new training jobs from the Model Management page.
          </div>
        </Card>
      )}

      {!isLoading && models.length > 0 && (
        viewMode === 'list' ? (
          <Card bodyClassName="p-0">
            <Table columns={modelColumns} data={models} isLoading={isLoading} />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {models.map(model => (
              <ModelCardItem 
                key={model.model_id} 
                model={model} 
                onAction={handleModelAction} 
                loadingModelAction={loadingModelAction}
                isAdmin={!!currentUser?.is_admin}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default ModelPerformancePage;
