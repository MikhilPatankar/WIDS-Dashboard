
import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import MetricDisplay from '../components/MetricDisplay';
import Card from '../components/Card';
import Table from '../components/Table';
import { FederatedClientStatus, ClientStatusType, ApiResponseMessage, TableColumn } from '../types';
import { fetchFederatedClientStatus, startFederatedRound, updateFederatedClientStatus, deregisterFederatedClient } from '../services/mockDataService';
import { useAuth } from '../contexts/AuthContext';
import { usePageContext } from '../contexts/PageContext'; // Import usePageContext
import { UsersIcon, CheckBadgeIcon, ClockIcon, CheckCircleIcon, PlayCircleIcon, PencilSquareIcon, TrashIcon, StopIcon } from '@heroicons/react/24/outline';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_GRID_COLOR, CHART_TEXT_COLOR } from '../constants';
import SkeletonLoader from '../components/SkeletonLoader';

const FederatedLearningPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { setPageContext } = usePageContext();
  const [clients, setClients] = useState<FederatedClientStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<ApiResponseMessage | null>(null);
  const [loadingGlobalAction, setLoadingGlobalAction] = useState(false);
  const [loadingClientAction, setLoadingClientAction] = useState<Record<string, boolean>>({});
  const [currentRound, setCurrentRound] = useState(137); // Mocked


  const loadClientData = useCallback(async () => {
    setIsLoading(true);
    try {
      const clientData = await fetchFederatedClientStatus(15);
      setClients(clientData);
      
      const activeClientsCount = clientData.filter(c => c.status === 'Active' || c.status === 'Training').length;
      const avgAcc = clientData.length > 0 
        ? parseFloat((clientData.reduce((sum, c) => sum + c.localAccuracy, 0) / clientData.length * 100).toFixed(1))
        : 0;
      
      setPageContext(
        '/federated-learning',
        'Federated Learning Network',
        {
          totalClients: clientData.length,
          activeClients: activeClientsCount,
          averageClientAccuracy: avgAcc,
          currentRound: currentRound // Assuming currentRound is available or mocked
        }
      );

    } catch (error) {
      console.error("Error fetching federated learning data:", error);
      setActionFeedback({ success: false, message: "Failed to load client data." });
      setPageContext('/federated-learning', 'Federated Learning Network', { error: 'Failed to load client data.' });
    } finally {
      setIsLoading(false);
    }
  }, [setPageContext, currentRound]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  const handleGlobalAction = async (action: Promise<ApiResponseMessage>) => {
    setLoadingGlobalAction(true);
    setActionFeedback(null);
    try {
      const response = await action;
      setActionFeedback(response);
      if(response.success) {
        setCurrentRound(prev => prev + 1); // Mock increment round
        loadClientData(); 
      }
    } catch (error) {
       console.error("Error performing global action:", error);
       setActionFeedback({ success: false, message: "An unexpected error occurred." });
    } finally {
      setLoadingGlobalAction(false);
    }
  };
  
  const handleClientAction = async (action: Promise<ApiResponseMessage>, clientId: string, actionName: string) => {
    setLoadingClientAction(prev => ({...prev, [`${actionName}-${clientId}`]: true}));
    setActionFeedback(null);
    try {
      const response = await action;
      setActionFeedback(response);
      if(response.success) loadClientData(); 
    } catch (error: any) {
      console.error(`Error performing ${actionName} for client ${clientId}:`, error);
      setActionFeedback({ success: false, message: error.message || `Failed to ${actionName} client ${clientId}.`});
    } finally {
      setLoadingClientAction(prev => ({...prev, [`${actionName}-${clientId}`]: false}));
    }
  };


  const getStatusColor = (status: ClientStatusType) => {
    switch (status) {
      case 'Active': return 'bg-success/20 text-success';
      case 'Training': return 'bg-accent-blue/20 text-accent-blue';
      case 'Offline': return 'bg-danger/20 text-danger';
      case 'Stale': return 'bg-yellow-400/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-text-secondary';
    }
  };

  const clientColumns: TableColumn<FederatedClientStatus>[] = [
    { header: 'Client ID', accessor: 'clientId', sortable: true },
    { header: 'Status', accessor: (item: FederatedClientStatus) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      ),
      sortable: true
    },
    { header: 'Local Accuracy', accessor: (item: FederatedClientStatus) => `${(item.localAccuracy * 100).toFixed(1)}%`, sortable: true },
    { header: 'Data Samples', accessor: 'dataSamples', sortable: true },
    { header: 'Contribution', accessor: (item: FederatedClientStatus) => `${((item.contributionScore || 0) * 100).toFixed(0)}%`, sortable: true },
    { header: 'Last Update', accessor: (item: FederatedClientStatus) => item.lastUpdate.toLocaleDateString(), sortable: true },
    { header: 'Actions', accessor: (item: FederatedClientStatus) => (
      currentUser?.is_admin ? (
        <div className="flex space-x-1">
          <button 
            onClick={() => {
              const newStatus = window.prompt(`New status for ${item.clientId} (Active, Training, Offline, Stale):`, item.status) as ClientStatusType | null;
              if(newStatus && ['Active', 'Training', 'Offline', 'Stale'].includes(newStatus)) {
                handleClientAction(updateFederatedClientStatus(item.clientId, newStatus), item.clientId, 'updateStatus');
              }
            }}
            disabled={loadingClientAction[`updateStatus-${item.clientId}`]}
            className="p-1.5 text-text-secondary hover:text-accent-blue disabled:opacity-50" title="Update Status"
            aria-label={`Update status for client ${item.clientId}`}
          >
            {loadingClientAction[`updateStatus-${item.clientId}`] ? <StopIcon className="w-4 h-4 animate-spin"/> : <PencilSquareIcon className="w-4 h-4"/>}
          </button>
          <button 
            onClick={() => {
              if(window.confirm(`Deregister client ${item.clientId}?`)) {
                handleClientAction(deregisterFederatedClient(item.clientId), item.clientId, 'deregister');
              }
            }}
            disabled={loadingClientAction[`deregister-${item.clientId}`]}
            className="p-1.5 text-text-secondary hover:text-danger disabled:opacity-50" title="Deregister Client"
            aria-label={`Deregister client ${item.clientId}`}
          >
            {loadingClientAction[`deregister-${item.clientId}`] ? <StopIcon className="w-4 h-4 animate-spin"/> : <TrashIcon className="w-4 h-4"/>}
          </button>
        </div>
      ): <span className="text-xs text-text-secondary">N/A</span>
    )},
  ];

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'Active' || c.status === 'Training').length;
  const avgClientAccuracy = clients.length > 0 
    ? (clients.reduce((sum, c) => sum + c.localAccuracy, 0) / clients.length * 100).toFixed(1)
    : 'N/A';

  const scatterData = clients.map(client => ({
    x: client.dataSamples,
    y: client.localAccuracy * 100,
    z: (client.contributionScore || 0.5) * 500, 
    name: client.clientId,
    category: client.status,
  }));
  
  const statusColorMap: Record<ClientStatusType, string> = {
    'Active': '#10B981', 
    'Training': '#3B82F6', 
    'Offline': '#EF4444', 
    'Stale': '#F59E0B', 
  };


  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader 
        title="Federated Learning Network" 
        subtitle="Status and performance of distributed learning clients."
        actions={
          currentUser?.is_admin && (
            <button
              onClick={() => handleGlobalAction(startFederatedRound())}
              disabled={loadingGlobalAction}
              className="flex items-center space-x-2 bg-accent-blue hover:bg-accent-blue/80 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150 disabled:opacity-50"
            >
              <PlayCircleIcon className="w-5 h-5" />
              <span>{loadingGlobalAction ? 'Starting...' : 'Start New Round'}</span>
            </button>
          )
        }
      />

      {actionFeedback && (
        <div role="alert" className={`mb-4 p-3 rounded-md text-sm ${actionFeedback.success ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricDisplay
          title="Total Clients"
          value={totalClients}
          isLoading={isLoading}
          icon={<UsersIcon className="w-6 h-6" />}
        />
        <MetricDisplay
          title="Active Clients"
          value={`${activeClients} / ${totalClients}`}
          isLoading={isLoading}
          icon={<CheckBadgeIcon className="w-6 h-6 text-success" />}
          deltaType={activeClients >= totalClients * 0.8 ? 'positive' : activeClients >= totalClients * 0.5 ? 'neutral' : 'negative'}
        />
        <MetricDisplay
          title="Avg. Client Accuracy"
          value={avgClientAccuracy}
          unit="%"
          isLoading={isLoading}
          icon={<CheckCircleIcon className="w-6 h-6" />}
        />
        <MetricDisplay
          title="Current Round" 
          value={isLoading ? "N/A" : currentRound} 
          isLoading={isLoading}
          icon={<ClockIcon className="w-6 h-6" />}
        />
      </div>

      <Card title="Client Performance Overview">
        {isLoading ? <SkeletonLoader className="h-96" /> :
        scatterData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 30 }}> 
              <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3"/>
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Data Samples" 
                stroke={CHART_TEXT_COLOR} 
                tick={{ fontSize: 12 }}
                label={{ value: 'Data Samples', position: 'insideBottom', dy: 20, fill: CHART_TEXT_COLOR, fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Local Accuracy" 
                unit="%" 
                stroke={CHART_TEXT_COLOR} 
                tick={{ fontSize: 12 }}
                label={{ value: 'Local Accuracy (%)', angle: -90, position: 'insideLeft', dx: -20, fill: CHART_TEXT_COLOR, fontSize: 12 }}
              />
              <ZAxis type="number" dataKey="z" range={[60, 1000]} name="Contribution" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '0.5rem' }}
                labelStyle={{ color: CHART_TEXT_COLOR, fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{fontSize: "12px", bottom: 0}}/>
              {Object.entries(statusColorMap).map(([status, color]) => (
                <Scatter 
                    key={status}
                    name={status} 
                    data={scatterData.filter(d => d.category === status)} 
                    fill={color} 
                    shape="circle"
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        ) : <p className="text-text-secondary text-center py-10">No client data for chart.</p>}
      </Card>

      <Card title="Client Details" bodyClassName="p-0">
        <Table columns={clientColumns} data={clients} isLoading={isLoading} itemsPerPage={10} />
      </Card>
    </div>
  );
};

export default FederatedLearningPage;
