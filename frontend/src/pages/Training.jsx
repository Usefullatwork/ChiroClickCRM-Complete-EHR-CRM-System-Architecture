/**
 * Training Management Page
 * Manage AI model training pipeline, model lifecycle, and analytics
 */

import { useState, lazy, Suspense } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, Database, RefreshCw, TestTube, Server } from 'lucide-react';
import { trainingAPI } from '../services/api';
import { ModelsTab } from '../components/training';

// Lazy load tab components
const AnalyticsTab = lazy(() => import('../components/training/AnalyticsTab'));
const DataCurationTab = lazy(() => import('../components/training/DataCurationTab'));
const PipelineTab = lazy(() => import('../components/training/PipelineTab'));
const PlaygroundTab = lazy(() => import('../components/training/PlaygroundTab'));

const TAB_ICONS = { models: Server, curation: Database, pipeline: RefreshCw, playground: TestTube };

const TABS = [
  { id: 'models', label: 'Modeller' },
  { id: 'curation', label: 'Datakurering' },
  { id: 'pipeline', label: 'Trening' },
  { id: 'playground', label: 'Lekeplass' },
];

export default function Training() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('models');
  const [newExamples, setNewExamples] = useState('');
  const [testPrompt, setTestPrompt] = useState('');
  const [selectedTestModel, setSelectedTestModel] = useState('chiro-no');
  const [testResult, setTestResult] = useState(null);

  // Queries
  const statusQuery = useQuery({
    queryKey: ['training-status'],
    queryFn: async () => {
      const res = await trainingAPI.getStatus();
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const dataQuery = useQuery({
    queryKey: ['training-data'],
    queryFn: async () => {
      const res = await trainingAPI.getData();
      return res.data.data;
    },
  });

  // Mutations
  const rebuildMutation = useMutation({
    mutationFn: () => trainingAPI.rebuild(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-status'] });
    },
  });

  const backupMutation = useMutation({
    mutationFn: () => trainingAPI.backup(),
  });

  const restoreMutation = useMutation({
    mutationFn: () => trainingAPI.restore(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-status'] });
    },
  });

  const addExamplesMutation = useMutation({
    mutationFn: (jsonlContent) => trainingAPI.addExamples(jsonlContent),
    onSuccess: () => {
      setNewExamples('');
      queryClient.invalidateQueries({ queryKey: ['training-data'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: ({ model, prompt }) => trainingAPI.testModel(model, prompt),
    onSuccess: (res) => {
      setTestResult(res.data.data);
    },
  });

  const status = statusQuery.data;
  const trainingData = dataQuery.data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">AI Model Management</h1>
        </div>
        <p className="text-gray-600">
          Administrer AI-modeller, treningsdata og modellbygging for ChiroClick.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'models' && (
        <>
          <ModelsTab
            statusQuery={statusQuery}
            dataQuery={dataQuery}
            status={status}
            trainingData={trainingData}
            rebuildMutation={rebuildMutation}
            backupMutation={backupMutation}
            restoreMutation={restoreMutation}
            addExamplesMutation={addExamplesMutation}
            testMutation={testMutation}
            newExamples={newExamples}
            setNewExamples={setNewExamples}
            testPrompt={testPrompt}
            setTestPrompt={setTestPrompt}
            selectedTestModel={selectedTestModel}
            setSelectedTestModel={setSelectedTestModel}
            testResult={testResult}
          />
          <div className="mt-8">
            <Suspense fallback={<div className="text-gray-500 p-4">Laster analyse...</div>}>
              <AnalyticsTab />
            </Suspense>
          </div>
        </>
      )}

      {activeTab === 'curation' && (
        <Suspense fallback={<div className="text-gray-500 p-4">Laster datakurering...</div>}>
          <DataCurationTab />
        </Suspense>
      )}

      {activeTab === 'pipeline' && (
        <Suspense fallback={<div className="text-gray-500 p-4">Laster treningspipeline...</div>}>
          <PipelineTab />
        </Suspense>
      )}

      {activeTab === 'playground' && (
        <Suspense fallback={<div className="text-gray-500 p-4">Laster lekeplass...</div>}>
          <PlaygroundTab />
        </Suspense>
      )}
    </div>
  );
}
