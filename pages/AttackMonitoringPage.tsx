import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Table from '../components/Table';
import SimpleBarChart from '../components/charts/SimpleBarChart';
import { SecurityEvent, AttackTrendPoint, ChartDataPoint, TableColumn } from '../types';
import { fetchSecurityEvents, fetchAttackTrends } from '../services/mockDataService';
import MetricDisplay from '../components/MetricDisplay';
import { usePageContext } from '../contexts/PageContext'; // Import usePageContext
import { ShieldExclamationIcon, FireIcon, BellAlertIcon } from '@heroicons/react/24/outline';

const AttackMonitoringPage: React.FC = () => {
  const { setPageContext } = usePageContext();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [attackTrends, setAttackTrends] = useState<ChartDataPoint[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const eventsData = await fetchSecurityEvents(100); 
        setSecurityEvents(eventsData);
         // Set context after events are loaded
        const criticalAlertsCount = eventsData.filter(e => e.severity === 'Critical').length;
        const highAlertsCount = eventsData.filter(e => e.severity === 'High').length;
        setPageContext(
            '/attack-monitoring',
            'Attack Monitoring',
            {
                totalEventsListed: eventsData.length,
                criticalAlertsCount,
                highAlertsCount,
                // Maybe a summary of top attack types shown if trends are also loaded
            }
        );
      } catch (error) {
        console.error("Error fetching security events:", error);
        setPageContext('/attack-monitoring', 'Attack Monitoring', { error: 'Failed to load security events.' });
      } finally {
        setIsLoadingEvents(false);
      }
    };

    const loadTrends = async () => {
      setIsLoadingTrends(true);
      try {
        const trendsDataRaw = await fetchAttackTrends(7, 4); 
        
        const aggregated: { [type: string]: number } = {};
        trendsDataRaw.forEach(trend => {
          aggregated[trend.attackType] = (aggregated[trend.attackType] || 0) + trend.count;
        });
        const chartData: ChartDataPoint[] = Object.entries(aggregated)
          .map(([name, countVal]) => ({ name, value: countVal })) 
          .sort((a,b) => b.value - a.value) 
          .slice(0, 5); 

        setAttackTrends(chartData);

      } catch (error) {
        console.error("Error fetching attack trends:", error);
      } finally {
        setIsLoadingTrends(false);
      }
    };

    loadEvents();
    loadTrends();
  }, [setPageContext]);

  const eventColumns: TableColumn<SecurityEvent>[] = [
    { header: 'Timestamp', accessor: (item: SecurityEvent) => item.timestamp.toLocaleString() },
    { header: 'Severity', accessor: (item: SecurityEvent) => (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
            item.severity === 'Critical' ? 'bg-red-500/30 text-red-400' :
            item.severity === 'High' ? 'bg-orange-500/30 text-orange-400' :
            item.severity === 'Medium' ? 'bg-yellow-500/30 text-yellow-400' :
            'bg-sky-500/30 text-sky-400' // Low
        }`}>
          {item.severity}
        </span>
      ) 
    },
    { header: 'Attack Type', accessor: 'attackType' },
    { header: 'Description', accessor: 'description' },
    { header: 'Source IP', accessor: 'sourceIp' },
  ];
  
  const criticalAlerts = securityEvents.filter(e => e.severity === 'Critical').length;
  const highAlerts = securityEvents.filter(e => e.severity === 'High').length;
  const totalAlertsLast24h = securityEvents.filter(e => e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;


  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Attack Monitoring" subtitle="Live security event feed and attack trend analysis." />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <MetricDisplay
            title="Critical Alerts (Listed)"
            value={criticalAlerts}
            isLoading={isLoadingEvents}
            icon={<FireIcon className="w-6 h-6 text-danger" />}
            deltaType={criticalAlerts > 10 ? "negative" : "neutral"}
        />
        <MetricDisplay
            title="High Severity Alerts (Listed)"
            value={highAlerts}
            isLoading={isLoadingEvents}
            icon={<ShieldExclamationIcon className="w-6 h-6 text-orange-400" />}
        />
        <MetricDisplay
            title="Total Alerts (Last 24h)"
            value={totalAlertsLast24h}
            isLoading={isLoadingEvents}
            icon={<BellAlertIcon className="w-6 h-6" />}
            trend={{data: [10,15,12,18,25,totalAlertsLast24h], positiveIsGood: false}}
        />
      </div>


      <Card title="Top Attack Types (Last 7 Days)">
        {isLoadingTrends ? <div className="h-80 animate-pulse bg-tertiary-dark rounded-md"></div> :
        attackTrends.length > 0 ? (
          <SimpleBarChart data={attackTrends} xAxisKey="name" dataKey="value" barColor="#8B5CF6" height={300} />
        ) : <p className="text-text-secondary p-4">No attack trend data available.</p>}
      </Card>

      <Card title="Recent Security Events" bodyClassName="p-0">
        <Table columns={eventColumns} data={securityEvents.slice(0, 20)} isLoading={isLoadingEvents} emptyStateMessage="No security events found." />
      </Card>
    </div>
  );
};

export default AttackMonitoringPage;
