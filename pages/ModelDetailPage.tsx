import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ModelPerformanceMetrics, TableColumn, PerClassMetrics as PerClassMetricsType, FinalEvaluationMetrics } from '../src/types'; // Renamed PerClassMetrics to avoid conflict
import { getModelByIdService } from '../services/mockDataService';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Table from '../components/Table';
import { usePageContext } from '../contexts/PageContext';
import { ArrowLeftIcon, ServerStackIcon, ChartPieIcon, BeakerIcon, CodeBracketIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import SkeletonLoader from '../components/SkeletonLoader';

// Define a more specific type for items in the classification report table
type ClassificationReportItem =
  | (PerClassMetricsType & { className: string; isOverallAccuracyRow?: false })
  | {
      className: string;
      precision: null;
      recall: null;
      'f1-score': number; // Will hold the accuracy value for the "accuracy" row
      support: number | null;
      isOverallAccuracyRow: true;
    };

// Helper function to safely format metrics
const formatMetric = (value: number | null | undefined, digits: number, isPercentage: boolean = false, defaultString: string = 'N/A'): string => {
  if (value === null || value === undefined) {
    return defaultString;
  }
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return defaultString;
  }
  const displayValue = isPercentage ? numValue * 100 : numValue;
  return displayValue.toFixed(digits);
};


const ModelDetailPage: React.FC = () => {
  const { modelId } = useParams<{ modelId: string }>();
  const { setPageContext } = usePageContext();
  const [model, setModel] = useState<ModelPerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modelId) {
      setIsLoading(true);
      setError(null);
      getModelByIdService(modelId)
        .then(data => {
          if (data) {
            setModel(data as ModelPerformanceMetrics);
            setPageContext(
              `/models/${modelId}`,
              `Model Details: ${data.model_id}`,
              {
                id: data.model_id,
                version: data.version,
                status: data.status,
                accuracy: data.final_evaluation_metrics?.overall_accuracy ?? data.accuracy,
                f1Score: data.final_evaluation_metrics?.overall_f1_weighted ?? data.f1_score,
                model_type: data.model_type,
                isLoaded: data.isLoaded
              }
            );
          } else {
            setError('Model not found.');
            setPageContext(`/models/${modelId}`, `Model Not Found: ${modelId}`);
          }
        })
        .catch(err => {
          console.error("Error fetching model details:", err);
          setError('Failed to load model details.');
          setPageContext(`/models/${modelId}`, `Error Loading Model: ${modelId}`);
        })
        .finally(() => setIsLoading(false));
    }
  }, [modelId, setPageContext]);

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 p-4">
        <PageHeader title={<SkeletonLoader type="title" className="h-8 w-1/2"/>} subtitle={<SkeletonLoader type="text" className="h-4 w-1/3 mt-1"/>}/>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Overview & Status" className="lg:col-span-1"><SkeletonLoader type="block" className="h-64"/></Card>
          <Card title="Performance Metrics" className="lg:col-span-2"><SkeletonLoader type="block" className="h-40"/></Card>
        </div>
        <Card title="Classification Report"><SkeletonLoader type="block" className="h-60"/></Card>
        <Card title="Hyperparameters"><SkeletonLoader type="block" className="h-32"/></Card>
      </div>
    );
  }

  if (error) {
    return <div role="alert" className="p-6 text-center text-danger">{error}</div>;
  }

  if (!model) {
    return <div className="p-6 text-center text-text-secondary">No model data available.</div>;
  }

  const getStatusColor = (status: ModelPerformanceMetrics['status']) => {
    if (status === 'Production' || status === 'production') return 'bg-success/20 text-success';
    if (status === 'Staging' || status === 'staging') return 'bg-accent-blue/20 text-accent-blue';
    if (status === 'Candidate' || status === 'candidate' || status === 'Uploaded' || status === 'inactive') return 'bg-yellow-500/20 text-yellow-400';
    if (status === 'Training') return 'bg-purple-500/20 text-purple-400';
    if (status === 'Loaded' || status === 'active') return 'bg-teal-500/20 text-teal-400';
    if (status === 'Archived' || status === 'archived') return 'bg-slate-600/20 text-slate-400';
    return 'bg-gray-500/20 text-text-secondary';
  };

  const fem = model.final_evaluation_metrics;

  const perClassMetricsData: ClassificationReportItem[] = fem?.per_class_metrics ?
  Object.entries(fem.per_class_metrics).map(([className, metricsValue]) => {
    if (className.toLowerCase() === 'accuracy' && typeof metricsValue === 'number') {
      const supportValue = (fem.per_class_metrics['macro avg'] as PerClassMetricsType)?.support ??
                           (fem.per_class_metrics['weighted avg'] as PerClassMetricsType)?.support ??
                           null;
      return {
        className: className,
        precision: null,
        recall: null,
        'f1-score': metricsValue,
        support: supportValue,
        isOverallAccuracyRow: true,
      };
    } else if (typeof metricsValue === 'object' && metricsValue !== null) {
      return {
        className,
        ...(metricsValue as PerClassMetricsType),
        isOverallAccuracyRow: false,
      };
    }
    return null;
  }).filter(item => item !== null) as ClassificationReportItem[]
  : [];


  const classificationReportColumns: TableColumn<ClassificationReportItem>[] = [
    { header: 'Class', accessor: 'className', sortable: true },
    {
      header: 'Precision',
      accessor: item => (item.isOverallAccuracyRow || item.precision === null || typeof item.precision !== 'number') ? 'N/A' : item.precision.toFixed(3),
      sortable: true
    },
    {
      header: 'Recall',
      accessor: item => (item.isOverallAccuracyRow || item.recall === null || typeof item.recall !== 'number') ? 'N/A' : item.recall.toFixed(3),
      sortable: true
    },
    {
      header: 'F1-Score / Value',
      accessor: item => (typeof item['f1-score'] === 'number') ? item['f1-score'].toFixed(item.isOverallAccuracyRow ? 5 : 3) : 'N/A',
      sortable: true
    },
    {
      header: 'Support',
      accessor: item => (item.support === null || typeof item.support !== 'number') ? 'N/A' : item.support.toLocaleString(),
      sortable: true
    },
  ];


  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={model.model_id}
        subtitle={`Details for model version: ${model.version}`}
        actions={
          <Link
            to="/model-management"
            className="flex items-center space-x-2 bg-secondary-dark hover:bg-tertiary-dark text-text-primary font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Models</span>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Overview & Status" icon={<ServerStackIcon className="w-5 h-5 text-text-secondary"/>} className="lg:col-span-1">
          <div className="space-y-2 text-sm">
            <p><strong className="text-text-secondary">Model Type:</strong> {model.model_type}</p>
            <p><strong className="text-text-secondary">Version:</strong> {model.version}</p>
            <p><strong className="text-text-secondary">Status:</strong> <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(model.status)}`}>{model.status}</span></p>
            {model.isLoaded && <p className="text-teal-400 font-semibold">Loaded in Memory</p>}
            <p><strong className="text-text-secondary">Size:</strong> {model.size_mb !== undefined ? `${model.size_mb.toFixed(2)} MB` : 'N/A'}</p>
            <p><strong className="text-text-secondary">Created At:</strong> {new Date(model.created_at).toLocaleString()}</p>
            <p><strong className="text-text-secondary">Scaler Path:</strong> <span className="truncate" title={model.scaler_path || undefined}>{model.scaler_path || 'N/A'}</span></p>
            <p><strong className="text-text-secondary">Encoder Path:</strong> <span className="truncate" title={model.label_encoder_path || undefined}>{model.label_encoder_path || 'N/A'}</span></p>
          </div>
        </Card>

        <Card title="Overall Performance Metrics" className="lg:col-span-2" icon={<ChartPieIcon className="w-5 h-5 text-text-secondary"/>}>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                <div><strong className="text-text-secondary block">Overall Accuracy:</strong> <span className="text-xl font-semibold">{formatMetric(fem ? fem.overall_accuracy : model.accuracy, 2, true)}%</span></div>
                <div><strong className="text-text-secondary block">Weighted F1-Score:</strong> <span className="text-xl font-semibold">{formatMetric(fem ? fem.overall_f1_weighted : model.f1_score, 4)}</span></div>
                <div><strong className="text-text-secondary block">Weighted Precision:</strong> <span className="text-xl font-semibold">{formatMetric(fem ? fem.overall_precision_weighted : model.precision, 2, true)}%</span></div>
                <div><strong className="text-text-secondary block">Weighted Recall:</strong> <span className="text-xl font-semibold">{formatMetric(fem ? fem.overall_recall_weighted : model.recall, 2, true)}%</span></div>
                {model.loss !== undefined && model.loss !== null && <div><strong className="text-text-secondary block">Training Loss:</strong> <span className="text-xl font-semibold">{formatMetric(model.loss, 4)}</span></div>}
            </div>
        </Card>
      </div>

      {fem && perClassMetricsData.length > 0 && (
        <Card title="Classification Report" icon={<TableCellsIcon className="w-5 h-5 text-text-secondary"/>} bodyClassName="p-0">
          <Table columns={classificationReportColumns} data={perClassMetricsData} isLoading={isLoading} itemsPerPage={perClassMetricsData.length + 3} />
        </Card>
      )}

      {model.feature_names && model.feature_names.length > 0 && (
        <Card title="Feature Names" icon={<CodeBracketIcon className="w-5 h-5 text-text-secondary"/>}>
          <div className="max-h-40 overflow-y-auto bg-tertiary-dark p-3 rounded">
            <ul className="list-disc list-inside text-xs text-text-secondary space-y-1">
                {model.feature_names.map((name, idx) => <li key={idx}>{name}</li>)}
            </ul>
          </div>
        </Card>
      )}

      {model.class_names && model.class_names.length > 0 && (
        <Card title="Target Class Names" icon={<BeakerIcon className="w-5 h-5 text-text-secondary"/>}>
          <div className="max-h-40 overflow-y-auto bg-tertiary-dark p-3 rounded">
            <ul className="list-disc list-inside text-xs text-text-secondary space-y-1">
                {model.class_names.map((name, idx) => <li key={idx}>{name}</li>)}
            </ul>
          </div>
        </Card>
      )}

       {(!model.feature_names || model.feature_names.length === 0) && (!model.class_names || model.class_names.length === 0) && !fem && (
        <Card>
            <div className="text-center py-10 text-text-secondary">
                <ServerStackIcon className="w-12 h-12 mx-auto mb-2"/>
                Additional model details like features, classes, or full evaluation metrics are not available for this model.
            </div>
        </Card>
      )}
    </div>
  );
};

export default ModelDetailPage;