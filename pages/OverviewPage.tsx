
import React, { useEffect, useState, useCallback, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import MetricDisplay from '../components/MetricDisplay';
import Card from '../components/Card';
import SimpleLineChart from '../components/charts/SimpleLineChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Table from '../components/Table';
import ReportGeneratorModal from '../src/components/ReportGeneratorModal';
import { SystemStatus, ChartDataPoint, TableColumn, Alert, MonitoringEvent, AttackDataResponse, TrafficDataResponse, SystemMonitoringStatusAPI } from '../src/types';
import { 
  fetchSystemMonitoringStatusApi,
  fetchAlertsApi,        
  fetchMonitoringEventsApi, 
  fetchAttackDataApi,     
  fetchTrafficDataApi    
} from '../services/mockDataService'; 
import { useAuth } from '../contexts/AuthContext';
import { usePageContext } from '../contexts/PageContext';
import { CpuChipIcon, ClockIcon, UsersIcon, ShieldCheckIcon, ServerStackIcon, CircleStackIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, BellAlertIcon, FireIcon, WifiIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { CHART_LINE_COLOR, CHART_TEXT_COLOR, CHART_GRID_COLOR, AdjustmentsHorizontalIcon } from '../constants'; 
import SkeletonLoader from '../components/SkeletonLoader';
import { API_ENDPOINT } from '../src/config';

const MAX_TRAFFIC_POINTS = 60;
const MAX_MONITORING_EVENTS_IN_STATE = 10;

const OverviewPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { setPageContext } = usePageContext();
  
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [monitoringEvents, setMonitoringEvents] = useState<MonitoringEvent[]>([]);
  const [attackActivityData, setAttackActivityData] = useState<ChartDataPoint[]>([]);
  const [attackTypesForChart, setAttackTypesForChart] = useState<string[]>([]);
  const [trafficChartData, setTrafficChartData] = useState<ChartDataPoint[]>([]);

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [isLoadingMonitoringEvents, setIsLoadingMonitoringEvents] = useState(true);
  const [isLoadingAttackActivity, setIsLoadingAttackActivity] = useState(true);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(true);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const attackTypeColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F", "#FFBB28"];
  
  const wsStatusRef = useRef<WebSocket | null>(null);
  const wsTrafficRef = useRef<WebSocket | null>(null);
  const wsAttacksRef = useRef<WebSocket | null>(null);
  const wsEventsRef = useRef<WebSocket | null>(null);


  const mapApiStatusToSystemStatus = (apiStatus: SystemMonitoringStatusAPI): SystemStatus => {
    let mappedHealth: SystemStatus['systemHealth'];
    switch (apiStatus.system_health?.toLowerCase()) {
        case 'excellent':
            mappedHealth = 'Optimal';
            break;
        case 'warning':
            mappedHealth = 'Warning';
            break;
        case 'critical':
            mappedHealth = 'Critical';
            break;
        default:
            mappedHealth = 'Unknown';
    }
    const dailyPredictions = apiStatus.total_predictions > 0 ? (Number(apiStatus.total_predictions) / (3600 * 24)) : 0;
    return {
        systemHealth: mappedHealth,
        activeModels: apiStatus.active_models,
        totalPredictions: apiStatus.total_predictions,
        avgResponseTimeMs: parseFloat(apiStatus.average_response_time.toFixed(2)),
        cpuUsagePercent: parseFloat(apiStatus.cpu_usage.toFixed(1)),
        memoryUsagePercent: parseFloat(apiStatus.memory_usage.toFixed(1)),
        gpuUsagePercent: apiStatus.gpu_usage ? parseFloat(apiStatus.gpu_usage.toFixed(1)) : undefined,
        activeFederatedClients: apiStatus.federated_clients,
        lastTrainingTimestamp: apiStatus.last_training,
        dataIngestionRate: `~${dailyPredictions.toFixed(0)} p/day`,
        anomalyDetectionRate: `~${(apiStatus.active_models * 2)}/hr`, 
    };
  };


  const loadData = useCallback(async () => {
    setIsLoadingStatus(true);
    setIsLoadingAlerts(true);
    setIsLoadingMonitoringEvents(true);
    setIsLoadingAttackActivity(true);
    setIsLoadingTraffic(true);

    try {
      const [
        statusApiData, 
        alertsData,
        monitoringEventsData,
        attackActivityRaw,
        trafficRaw
      ] = await Promise.all([
        fetchSystemMonitoringStatusApi(),
        fetchAlertsApi(5),
        fetchMonitoringEventsApi(7),
        fetchAttackDataApi(),
        fetchTrafficDataApi()
      ]);

      const statusData = mapApiStatusToSystemStatus(statusApiData);
      setSystemStatus(statusData);
      setIsLoadingStatus(false);

      setAlerts(alertsData.map(a => ({...a, timestamp: new Date(a.timestamp).toISOString() })));
      setIsLoadingAlerts(false);

      setMonitoringEvents(monitoringEventsData.map(e => ({...e, timestamp: new Date(e.timestamp).toISOString() })));
      setIsLoadingMonitoringEvents(false);
      
      const transformedAttackActivity = attackActivityRaw.timestamps.map((ts, index) => {
        const point: ChartDataPoint = { name: new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), value: 0 };
        attackActivityRaw.types.forEach((type, typeIndex) => {
          point[type.replace(/\s+/g, '_')] = attackActivityRaw.counts[typeIndex][index];
        });
        return point;
      });
      setAttackActivityData(transformedAttackActivity);
      setAttackTypesForChart(attackActivityRaw.types.map(type => type.replace(/\s+/g, '_')));
      setIsLoadingAttackActivity(false);
      
      setTrafficChartData(trafficRaw.timestamps.map((ts, index) => ({
        name: new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        value: trafficRaw.values[index]
      })).slice(-MAX_TRAFFIC_POINTS));
      setIsLoadingTraffic(false);
      
      setPageContext(
          '/overview', 
          'System Overview', 
          { 
            systemHealth: statusData.systemHealth, 
            activeModels: statusData.activeModels,
            totalPredictions: statusData.totalPredictions,
            avgResponseTimeMs: statusData.avgResponseTimeMs,
            alertsCount: alertsData.length,
            criticalAlertsCount: alertsData.filter(a => a.severity === 'Critical').length,
            monitoringEventsCount: monitoringEventsData.length,
          }
        );

    } catch (error) {
      console.error("Error fetching overview data:", error);
      setIsLoadingStatus(false);
      setIsLoadingAlerts(false);
      setIsLoadingMonitoringEvents(false);
      setIsLoadingAttackActivity(false);
      setIsLoadingTraffic(false);
    }
  }, [setPageContext]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!API_ENDPOINT) return;
    const baseWsUrl = API_ENDPOINT.replace(/^http/, 'ws');

    // System Status WebSocket
    wsStatusRef.current = new WebSocket(`${baseWsUrl}/api/v1/monitoring/ws/status`);
    wsStatusRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.system_status) {
        setSystemStatus(mapApiStatusToSystemStatus(data.system_status));
      }
    };
    wsStatusRef.current.onerror = (error) => console.error("Status WebSocket error:", error);
    wsStatusRef.current.onclose = () => console.log("Status WebSocket closed.");

    // Traffic WebSocket
    wsTrafficRef.current = new WebSocket(`${baseWsUrl}/api/v1/monitoring/ws/traffic`);
    wsTrafficRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.timestamp && data.value !== undefined) {
        setTrafficChartData(prevData => {
          const newDataPoint = {
            name: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: data.value
          };
          const updatedData = [...prevData, newDataPoint];
          return updatedData.slice(-MAX_TRAFFIC_POINTS);
        });
      }
    };
    wsTrafficRef.current.onerror = (error) => console.error("Traffic WebSocket error:", error);
    wsTrafficRef.current.onclose = () => console.log("Traffic WebSocket closed.");
    
    // Attacks WebSocket
    wsAttacksRef.current = new WebSocket(`${baseWsUrl}/api/v1/monitoring/ws/attacks`);
    wsAttacksRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.attack_trends && data.attack_trends.timestamps) {
            const attackActivityRaw: AttackDataResponse = data.attack_trends;
            const transformedAttackActivity = attackActivityRaw.timestamps.map((ts, index) => {
                const point: ChartDataPoint = { name: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: 0 };
                attackActivityRaw.types.forEach((type, typeIndex) => {
                    point[type.replace(/\s+/g, '_')] = attackActivityRaw.counts[typeIndex]?.[index] || 0;
                });
                return point;
            });
            setAttackActivityData(transformedAttackActivity);
            setAttackTypesForChart(attackActivityRaw.types.map(type => type.replace(/\s+/g, '_')));
        }
    };
    wsAttacksRef.current.onerror = (error) => console.error("Attacks WebSocket error:", error);
    wsAttacksRef.current.onclose = () => console.log("Attacks WebSocket closed.");

    // Events WebSocket
    wsEventsRef.current = new WebSocket(`${baseWsUrl}/api/v1/monitoring/ws/events`);
    wsEventsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.events && Array.isArray(data.events)) {
            const newEvents = data.events.map((e: any) => ({...e, timestamp: new Date(e.timestamp).toISOString() }) as MonitoringEvent);
            if (newEvents.length > 0) {
                setMonitoringEvents(prevEvents => {
                    const combined = [...newEvents, ...prevEvents];
                    return combined.slice(0, MAX_MONITORING_EVENTS_IN_STATE);
                });
            }
        }
    };
    wsEventsRef.current.onerror = (error) => console.error("Events WebSocket error:", error);
    wsEventsRef.current.onclose = () => console.log("Events WebSocket closed.");

    return () => {
      wsStatusRef.current?.close();
      wsTrafficRef.current?.close();
      wsAttacksRef.current?.close();
      wsEventsRef.current?.close();
    };
  }, []);


  const getSystemHealthVisual = (healthStatus?: SystemStatus['systemHealth']) => {
    switch (healthStatus) {
      case 'Excellent':
      case 'Optimal':
        return <CheckCircleIcon className="w-6 h-6 text-success" />;
      case 'Warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-warning" />;
      case 'Critical':
        return <XCircleIcon className="w-6 h-6 text-danger" />;
      default:
        return <ShieldCheckIcon className="w-6 h-6 text-text-secondary" />; 
    }
  };
  
  const alertColumns: TableColumn<Alert>[] = [
    { header: 'Time', accessor: (item) => new Date(item.timestamp).toLocaleTimeString(), sortable: true, className: "w-1/4" },
    { 
      header: 'Severity', 
      accessor: (item) => {
        let colorClass = '';
        if (item.severity === 'Critical') colorClass = 'text-danger';
        else if (item.severity === 'High') colorClass = 'text-orange-400';
        else if (item.severity === 'Medium') colorClass = 'text-yellow-400';
        else colorClass = 'text-sky-400'; // Low
        return <span className={`font-semibold ${colorClass}`}>{item.severity}</span>;
      },
      sortable: true,
      className: "w-1/4"
    },
    { header: 'Description', accessor: 'description', className: "w-1/2 whitespace-normal" },
  ];
  
  const monitoringEventColumns: TableColumn<MonitoringEvent>[] = [
    { header: 'Time', accessor: (item) => new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'}), sortable: true },
    { header: 'Event', accessor: 'event', sortable: true },
    { header: 'Source IP', accessor: 'source_ip', sortable: true },
    { header: 'Severity', accessor: 'severity', sortable: true },
    { header: 'Confidence', accessor: (item) => `${(item.confidence * 100).toFixed(1)}%`, sortable: true },
    { header: 'Action', accessor: 'action', sortable: true },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader 
        title="System Overview" 
        subtitle="Real-time WIDS operational status and key metrics."
        actions={
          currentUser?.is_admin && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="btn-primary text-sm"
              aria-label="Generate System Report"
            >
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              <span>Generate Report</span>
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <MetricDisplay 
          title="System Health" 
          value={systemStatus?.systemHealth || 'N/A'} 
          isLoading={isLoadingStatus && !systemStatus}
          icon={getSystemHealthVisual(systemStatus?.systemHealth)}
          deltaType={systemStatus?.systemHealth === 'Optimal' || systemStatus?.systemHealth === 'Excellent' ? 'positive' : systemStatus?.systemHealth === 'Warning' ? 'neutral' : 'negative'}
          helpText="Overall operational status of the WIDS."
        />
        <MetricDisplay 
          title="Active Models" 
          value={systemStatus?.activeModels ?? 'N/A'} 
          isLoading={isLoadingStatus && !systemStatus}
          icon={<ServerStackIcon className="w-6 h-6"/>}
          helpText="Number of currently active detection models."
        />
        <MetricDisplay 
          title="Total Predictions" 
          value={systemStatus ? (systemStatus.totalPredictions) : 'N/A'} 
          unit=""
          isLoading={isLoadingStatus && !systemStatus}
          icon={<CircleStackIcon className="w-6 h-6"/>}
          helpText="Total predictions made by the system."
        />
        <MetricDisplay 
          title="Avg. Response Time" 
          value={systemStatus?.avgResponseTimeMs ?? 'N/A'} 
          unit="ms" 
          isLoading={isLoadingStatus && !systemStatus}
          icon={<ClockIcon className="w-6 h-6"/>}
          helpText="Average time taken for a prediction."
        />
        <MetricDisplay 
          title="CPU Usage" 
          value={systemStatus?.cpuUsagePercent ?? 'N/A'} 
          unit="%" 
          isLoading={isLoadingStatus && !systemStatus}
          icon={<CpuChipIcon className="w-6 h-6"/>}
          deltaType={ (systemStatus?.cpuUsagePercent || 0) > 75 ? 'negative' : (systemStatus?.cpuUsagePercent || 0) > 50 ? 'neutral' : 'positive'}
          helpText="Current CPU utilization."
        />
         <MetricDisplay 
          title="Memory Usage" 
          value={systemStatus?.memoryUsagePercent ?? 'N/A'} 
          unit="%" 
          isLoading={isLoadingStatus && !systemStatus}
          icon={<CpuChipIcon className="w-6 h-6 transform rotate-90"/>}
          deltaType={ (systemStatus?.memoryUsagePercent || 0) > 75 ? 'negative' : (systemStatus?.memoryUsagePercent || 0) > 50 ? 'neutral' : 'positive'}
          helpText="Current memory utilization."
        />
        {systemStatus?.gpuUsagePercent !== undefined && (
          <MetricDisplay 
            title="GPU Usage" 
            value={systemStatus.gpuUsagePercent} 
            unit="%" 
            isLoading={isLoadingStatus && !systemStatus}
            icon={<AdjustmentsHorizontalIcon className="w-6 h-6"/>} 
            deltaType={ (systemStatus?.gpuUsagePercent || 0) > 75 ? 'negative' : (systemStatus?.gpuUsagePercent || 0) > 50 ? 'neutral' : 'positive'}
            helpText="Current GPU utilization (if applicable)."
          />
        )}
        <MetricDisplay 
          title="Federated Clients" 
          value={systemStatus?.activeFederatedClients ?? 'N/A'} 
          isLoading={isLoadingStatus && !systemStatus}
          icon={<UsersIcon className="w-6 h-6"/>}
          helpText="Number of active clients in the federated learning network."
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 sm:gap-6">
        <Card title="Network Traffic Volume (Live)" icon={<WifiIcon className="w-5 h-5 text-text-secondary"/>}>
           {(isLoadingTraffic && trafficChartData.length === 0) ? <SkeletonLoader className="h-80" /> : 
            trafficChartData.length > 0 ? <SimpleLineChart data={trafficChartData} xAxisKey="name" dataKey="value" lineColor={CHART_LINE_COLOR} height={320} /> : <p className="text-text-secondary p-4 text-center">No traffic data available. Waiting for live updates...</p>}
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Attack Activity Over Time (Live)" className="lg:col-span-2" icon={<FireIcon className="w-5 h-5 text-text-secondary"/>}>
          {(isLoadingAttackActivity && attackActivityData.length === 0) ? <SkeletonLoader className="h-80" /> : 
           attackActivityData.length > 0 && attackTypesForChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={attackActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
                    <XAxis dataKey="name" stroke={CHART_TEXT_COLOR} tick={{ fontSize: 10 }} />
                    <YAxis stroke={CHART_TEXT_COLOR} tick={{ fontSize: 10 }}/>
                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '0.5rem' }} />
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                    {attackTypesForChart.map((typeKey, index) => (
                        <Line key={typeKey} type="monotone" dataKey={typeKey} name={typeKey.replace(/_/g, ' ')} stroke={attackTypeColors[index % attackTypeColors.length]} strokeWidth={2} dot={false} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
           ) : <p className="text-text-secondary p-4 text-center">No attack activity data available. Waiting for live updates...</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Recent System Alerts" icon={<BellAlertIcon className="w-5 h-5 text-text-secondary"/>} bodyClassName="p-0">
           <Table columns={alertColumns} data={alerts} isLoading={isLoadingAlerts} emptyStateMessage="No recent alerts." itemsPerPage={5}/>
        </Card>
        <Card title="Key Monitoring Events (Live)" icon={<EyeSlashIcon className="w-5 h-5 text-text-secondary"/>} bodyClassName="p-0">
            <Table columns={monitoringEventColumns} data={monitoringEvents} isLoading={isLoadingMonitoringEvents && monitoringEvents.length === 0} emptyStateMessage="No key monitoring events. Waiting for live updates..." itemsPerPage={7}/>
        </Card>
      </div>
        
        {isReportModalOpen && (
            <ReportGeneratorModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        )}
    </div>
  );
};

export default OverviewPage;

