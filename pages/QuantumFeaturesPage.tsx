import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import MetricDisplay from '../components/MetricDisplay';
import { QuantumFeatureEvolutionPoint, ChartDataPoint } from '../types';
import { fetchQuantumFeatureEvolution } from '../services/mockDataService';
import { usePageContext } from '../contexts/PageContext'; // Import usePageContext
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_GRID_COLOR, CHART_TEXT_COLOR } from '../constants';
import { BeakerIcon, LightBulbIcon, CogIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'; // Added icons

const QuantumFeaturesPage: React.FC = () => {
  const { setPageContext } = usePageContext();
  const [featureEvolutionData, setFeatureEvolutionData] = useState<QuantumFeatureEvolutionPoint[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const featureColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#A4DE6C", "#D0ED57"];
  const totalFeaturesBefore = 254; 
  const optimalFeaturesAfter = 47; 
  const reductionPercentage = ((totalFeaturesBefore - optimalFeaturesAfter) / totalFeaturesBefore * 100).toFixed(1);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const evolution = await fetchQuantumFeatureEvolution(5, 30); 
        setFeatureEvolutionData(evolution);
        setPageContext(
          '/quantum-features',
          'Quantum Feature Selection',
          { 
            optimalFeatures: optimalFeaturesAfter,
            totalFeaturesBefore: totalFeaturesBefore,
            reductionPercentage: parseFloat(reductionPercentage),
            iterationsRun: evolution[0]?.length || 0,
            selectedFeatureNamesPreview: evolution.map(f => f[0]?.featureName).filter(Boolean).slice(0,3) // Preview of first few feature names
          }
        );
      } catch (error) {
        console.error("Error fetching quantum feature evolution data:", error);
        setPageContext('/quantum-features', 'Quantum Feature Selection', { error: 'Failed to load data.'});
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [setPageContext, reductionPercentage]);

  const chartData: ChartDataPoint[] = [];
  if (featureEvolutionData.length > 0 && featureEvolutionData[0].length > 0) {
    const numIterations = featureEvolutionData[0].length;
    for (let i = 0; i < numIterations; i++) {
      const iterationPoint: ChartDataPoint = { name: (i + 1).toString(), value: i + 1 }; 
      featureEvolutionData.forEach((featureSeries) => {
        if(featureSeries[i]) { // Ensure data point exists
          iterationPoint[featureSeries[0].featureName] = featureSeries[i].selectionProbability;
        }
      });
      chartData.push(iterationPoint);
    }
  }

  const handleConfigureQIFS = () => {
    alert("Mock QIFS Configuration:\n\nThis would open a modal to adjust parameters like:\n- Target feature count\n- Number of iterations\n- Specific QIFS algorithm variants\n\n(Not implemented in this demo)");
  };

  const handleExportFeatures = () => {
    alert("Mock Export Selected Features:\n\nThis would typically trigger a download of the selected feature list, e.g., as a CSV or JSON file.\n\nSelected Features (example based on current data peak):\n" + 
      featureEvolutionData.map(series => series[0]?.featureName).filter(Boolean).join(", ") +
      "\n\n(Not implemented in this demo)");
  };


  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader 
        title="Quantum Feature Selection" 
        subtitle="Evolution of feature selection probabilities and efficiency."
        actions={
          <div className="flex space-x-2">
            <button
              onClick={handleConfigureQIFS}
              className="flex items-center space-x-2 bg-secondary-dark hover:bg-tertiary-dark text-text-primary font-semibold py-2 px-3 rounded-lg shadow-md transition-colors duration-150 text-sm"
            >
              <CogIcon className="w-5 h-5" />
              <span>Configure Run</span>
            </button>
            <button
              onClick={handleExportFeatures}
              className="flex items-center space-x-2 bg-accent-blue hover:bg-accent-blue/80 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition-colors duration-150 text-sm"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>Export Features</span>
            </button>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <MetricDisplay 
          title="Optimal Features"
          value={`${optimalFeaturesAfter} / ${totalFeaturesBefore}`}
          isLoading={isLoading}
          icon={<LightBulbIcon className="w-6 h-6"/>}
          helpText="Number of optimal features selected by QIFS."
        />
        <MetricDisplay 
          title="Feature Reduction"
          value={reductionPercentage}
          unit="%"
          isLoading={isLoading}
          icon={<BeakerIcon className="w-6 h-6"/>}
          deltaType="positive"
          helpText="Percentage reduction in feature dimensionality."
        />
         <MetricDisplay 
          title="QIFS Iterations"
          value={isLoading ? "N/A" : (featureEvolutionData[0]?.length || 0)}
          isLoading={isLoading}
          helpText="Total optimization iterations run."
        />
      </div>

      <Card title="Quantum Feature Selection Probabilities Over Time">
        {isLoading ? <div className="h-96 animate-pulse bg-tertiary-dark rounded-md"></div> : 
        chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
              <XAxis dataKey="name" label={{ value: 'Optimization Iterations', position: 'insideBottom', offset: -5, fill: CHART_TEXT_COLOR, fontSize: 12 }} stroke={CHART_TEXT_COLOR} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Selection Probability', angle: -90, position: 'insideLeft', fill: CHART_TEXT_COLOR, fontSize: 12 }} stroke={CHART_TEXT_COLOR} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '0.5rem' }}
                labelStyle={{ color: CHART_TEXT_COLOR, fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{fontSize: "12px", paddingTop: '10px'}}/>
              {featureEvolutionData.map((featureSeries, index) => (
                featureSeries[0]?.featureName && // Ensure featureName exists
                <Line 
                  key={featureSeries[0].featureName} 
                  type="monotone" 
                  dataKey={featureSeries[0].featureName} 
                  stroke={featureColors[index % featureColors.length]} 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-text-secondary p-4">No feature evolution data available.</p>}
      </Card>
      
      {!isLoading && chartData.length > 0 && (
        <Card title="Selected Feature Set Preview (Top Converged)">
          <ul className="list-disc pl-5 space-y-1 text-sm text-text-secondary">
            {featureEvolutionData
              .map(series => ({
                  name: series[0]?.featureName,
                  finalProb: series[series.length - 1]?.selectionProbability,
              }))
              .filter(f => f.name && f.finalProb && f.finalProb > 0.6) // Example: features with >60% probability
              .sort((a,b) => (b.finalProb || 0) - (a.finalProb || 0))
              .slice(0, 10) // Show top 10 converged
              .map(feature => (
                <li key={feature.name}><span className="text-text-primary">{feature.name}</span> (Final Prob: {(feature.finalProb! * 100).toFixed(1)}%)</li>
              ))
            }
            {featureEvolutionData.filter(series => series[0]?.featureName && series[series.length -1]?.selectionProbability > 0.6).length === 0 && (
                <li>No features strongly converged above 60% probability in this run.</li>
            )}
          </ul>
        </Card>
      )}

    </div>
  );
};

export default QuantumFeaturesPage;