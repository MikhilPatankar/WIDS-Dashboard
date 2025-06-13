import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import MetricDisplay from '../components/MetricDisplay';
import Card from '../components/Card';
import SimpleLineChart from '../components/charts/SimpleLineChart';
import { AdaptationEvent, ChartDataPoint } from '../types';
import { fetchAdaptationEvents } from '../services/mockDataService';
import { usePageContext } from '../contexts/PageContext'; // Import usePageContext
import { BoltIcon, AdjustmentsHorizontalIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const MetaLearningPage: React.FC = () => {
  const { setPageContext } = usePageContext();
  const [adaptationEvents, setAdaptationEvents] = useState<AdaptationEvent[]>([]);
  const [adaptationTimelineData, setAdaptationTimelineData] = useState<ChartDataPoint[]>([]);
  const [avgAdaptationTime, setAvgAdaptationTime] = useState<number | null>(null);
  const [avgAccuracy, setAvgAccuracy] = useState<number | null>(null);
  const [activeFeatures, setActiveFeatures] = useState<number>(47); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const events = await fetchAdaptationEvents(50);
        setAdaptationEvents(events);

        if (events.length > 0) {
          const timeline: ChartDataPoint[] = events.map(event => ({
            name: event.timestamp.toLocaleTimeString(),
            value: event.adaptationTimeSeconds, 
            adaptationTime: event.adaptationTimeSeconds,
            accuracy: event.accuracyAfterAdaptation * 100,
          }));
          setAdaptationTimelineData(timeline);

          const totalAdaptTime = events.reduce((sum, e) => sum + e.adaptationTimeSeconds, 0);
          const calculatedAvgAdaptTime = parseFloat((totalAdaptTime / events.length).toFixed(2));
          setAvgAdaptationTime(calculatedAvgAdaptTime);

          const totalAccuracy = events.reduce((sum, e) => sum + e.accuracyAfterAdaptation, 0);
          const calculatedAvgAccuracy = parseFloat(((totalAccuracy / events.length) * 100).toFixed(1));
          setAvgAccuracy(calculatedAvgAccuracy);

          setPageContext(
            '/meta-learning',
            'Meta-Learning Monitoring',
            { 
              averageAdaptationTimeSeconds: calculatedAvgAdaptTime, 
              averageFewShotAccuracyPercent: calculatedAvgAccuracy,
              currentActiveFeatures: activeFeatures 
            }
          );
        } else {
          setPageContext('/meta-learning', 'Meta-Learning Monitoring', { message: "No adaptation data available." });
        }
      } catch (error) {
        console.error("Error fetching meta-learning data:", error);
        setPageContext('/meta-learning', 'Meta-Learning Monitoring', { error: "Failed to load data." });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [setPageContext, activeFeatures]); // Added activeFeatures to dependency if it can change

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Meta-Learning Monitoring" subtitle="Insights into model adaptation and few-shot learning performance." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <MetricDisplay
          title="Avg. Adaptation Speed"
          value={avgAdaptationTime ?? 'N/A'}
          unit="sec"
          isLoading={isLoading}
          icon={<BoltIcon className="w-6 h-6" />}
          delta="-0.5" 
          deltaType="positive" 
          helpText="Average time to adapt to new attack types."
          trend={{data: [3.0, 2.8, 2.5, 2.3, 2.4, (avgAdaptationTime || 2.3)], positiveIsGood: false}}
        />
        <MetricDisplay
          title="Avg. Few-Shot Accuracy"
          value={avgAccuracy ?? 'N/A'}
          unit="%"
          isLoading={isLoading}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          delta="+2.1" 
          deltaType="positive"
          helpText="Average accuracy achieved with few examples after adaptation."
          trend={{data: [90, 91, 92.5, 93, 94.2, (avgAccuracy || 94.2)], positiveIsGood: true}}
        />
        <MetricDisplay
          title="Active Features"
          value={activeFeatures} 
          unit="/254" 
          isLoading={false} // Assuming this is static or loaded differently
          icon={<AdjustmentsHorizontalIcon className="w-6 h-6" />}
          delta="-12" 
          deltaType="positive" 
          helpText="Number of quantum-optimized features currently active."
        />
      </div>

      <Card title="Attack Type Adaptation Timeline">
        {isLoading ? <div className="h-80 animate-pulse bg-tertiary-dark rounded-md"></div> :
        adaptationTimelineData.length > 0 ? (
          <SimpleLineChart data={adaptationTimelineData} xAxisKey="name" dataKey="adaptationTime" lineColor="#F59E0B" height={350}/>
        ) : <p className="text-text-secondary">No adaptation event data available.</p>}
      </Card>
       <Card title="Accuracy After Adaptation Timeline">
        {isLoading ? <div className="h-80 animate-pulse bg-tertiary-dark rounded-md"></div> :
        adaptationTimelineData.length > 0 ? (
          <SimpleLineChart data={adaptationTimelineData} xAxisKey="name" dataKey="accuracy" lineColor="#10B981" height={350}/>
        ) : <p className="text-text-secondary">No accuracy data available.</p>}
      </Card>
    </div>
  );
};

export default MetaLearningPage;