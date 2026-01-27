/**
 * Training Management Page
 * Manage AI model training pipeline
 */

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Brain,
  FolderOpen,
  FileText,
  ShieldCheck,
  Database,
  Cpu,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download
} from 'lucide-react'
import apiClient from '../services/api'
import { useTranslation } from '../i18n'

export default function Training() {
  const { t } = useTranslation('common')
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState('')
  const [modelName, setModelName] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [systemPrompt, setSystemPrompt] = useState('Du er en erfaren norsk kiropraktor som hjelper med journalføring og klinisk vurdering. Dine svar er profesjonelle, presise og basert på klinisk erfaring.')
  const [pipelineResults, setPipelineResults] = useState(null)

  // Run full training pipeline
  const runPipelineMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/training/pipeline', data)
      return response.data
    },
    onSuccess: (data) => {
      setPipelineResults(data.data)
    }
  })

  // Individual step mutations
  const fetchDocsMutation = useMutation({
    mutationFn: async (folderId) => {
      const response = await apiClient.post('/training/fetch', { folderId })
      return response.data
    }
  })

  const parseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/training/parse')
      return response.data
    }
  })

  const anonymizeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/training/anonymize')
      return response.data
    }
  })

  const datasetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/training/dataset')
      return response.data
    }
  })

  const trainMutation = useMutation({
    mutationFn: async (modelName) => {
      const response = await apiClient.post('/training/train', { modelName })
      return response.data
    }
  })

  const handleRunFullPipeline = () => {
    if (!googleDriveFolderId || !modelName) {
      alert(t('provideFolderAndModel'))
      return
    }

    runPipelineMutation.mutate({
      googleDriveFolderId,
      modelName,
      options: {
        temperature,
        systemPrompt
      }
    })
  }

  const handleRunStep = (step) => {
    switch (step) {
      case 'fetch':
        if (!googleDriveFolderId) {
          alert(t('provideFolderId'))
          return
        }
        fetchDocsMutation.mutate(googleDriveFolderId)
        break
      case 'parse':
        parseMutation.mutate()
        break
      case 'anonymize':
        anonymizeMutation.mutate()
        break
      case 'dataset':
        datasetMutation.mutate()
        break
      case 'train':
        if (!modelName) {
          alert(t('provideModelName'))
          return
        }
        trainMutation.mutate(modelName)
        break
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">{t('aiTrainingPipeline')}</h1>
        </div>
        <p className="text-gray-600">
          {t('trainCustomModel')}
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">{t('configuration')}</h2>

        <div className="space-y-4">
          {/* Google Drive Folder ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('googleDriveFolderId')}
            </label>
            <input
              type="text"
              value={googleDriveFolderId}
              onChange={(e) => setGoogleDriveFolderId(e.target.value)}
              placeholder={t('folderIdPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('folderIdHint')}
            </p>
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('modelName')}
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="chiroclickcrm-custom"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('modelNameHint')}
            </p>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('temperature')}: {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('temperatureHint')}
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('systemPrompt')}
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Run Pipeline Button */}
        <div className="mt-6">
          <button
            onClick={handleRunFullPipeline}
            disabled={runPipelineMutation.isPending}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {runPipelineMutation.isPending ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                {t('trainingInProgress')}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {t('runFullPipeline')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">{t('pipelineSteps')}</h2>

        <div className="space-y-3">
          {/* Step 1: Fetch */}
          <PipelineStep
            icon={<FolderOpen className="w-5 h-5" />}
            title={t('fetchDocuments')}
            description={t('fetchDocumentsDesc')}
            status={fetchDocsMutation.isPending ? 'running' : fetchDocsMutation.isSuccess ? 'success' : 'pending'}
            result={fetchDocsMutation.data?.data}
            onRun={() => handleRunStep('fetch')}
            disabled={!googleDriveFolderId}
          />

          {/* Step 2: Parse */}
          <PipelineStep
            icon={<FileText className="w-5 h-5" />}
            title={t('parseDocuments')}
            description={t('parseDocumentsDesc')}
            status={parseMutation.isPending ? 'running' : parseMutation.isSuccess ? 'success' : 'pending'}
            result={parseMutation.data?.data}
            onRun={() => handleRunStep('parse')}
          />

          {/* Step 3: Anonymize */}
          <PipelineStep
            icon={<ShieldCheck className="w-5 h-5" />}
            title={t('anonymizeData')}
            description={t('anonymizeDataDesc')}
            status={anonymizeMutation.isPending ? 'running' : anonymizeMutation.isSuccess ? 'success' : 'pending'}
            result={anonymizeMutation.data?.data}
            onRun={() => handleRunStep('anonymize')}
          />

          {/* Step 4: Dataset */}
          <PipelineStep
            icon={<Database className="w-5 h-5" />}
            title={t('createDataset')}
            description={t('createDatasetDesc')}
            status={datasetMutation.isPending ? 'running' : datasetMutation.isSuccess ? 'success' : 'pending'}
            result={datasetMutation.data?.data}
            onRun={() => handleRunStep('dataset')}
          />

          {/* Step 5: Train */}
          <PipelineStep
            icon={<Cpu className="w-5 h-5" />}
            title={t('trainModel')}
            description={t('trainModelDesc')}
            status={trainMutation.isPending ? 'running' : trainMutation.isSuccess ? 'success' : 'pending'}
            result={trainMutation.data?.data}
            onRun={() => handleRunStep('train')}
            disabled={!modelName}
          />
        </div>
      </div>

      {/* Full Pipeline Results */}
      {pipelineResults && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            {pipelineResults.success ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <h2 className="text-xl font-bold">
              {pipelineResults.success ? t('trainingComplete') : t('trainingFailed')}
            </h2>
          </div>

          {pipelineResults.success && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  Model <strong>{pipelineResults.modelName}</strong> has been trained successfully!
                </p>
                <p className="text-sm text-green-700 mt-2">
                  {t('duration')}: {pipelineResults.duration?.toFixed(2)}s
                </p>
              </div>

              {/* Step Results */}
              <div className="space-y-2">
                {pipelineResults.steps?.map((step, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">{step.step}</h4>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    {step.totalDocuments && (
                      <p className="text-sm text-gray-600 mt-1">
                        {t('documents')}: {step.totalDocuments}
                      </p>
                    )}
                    {step.total && (
                      <p className="text-sm text-gray-600 mt-1">
                        {t('processed')}: {step.total}
                      </p>
                    )}
                    {step.examples && (
                      <p className="text-sm text-gray-600 mt-1">
                        {t('trainingExamples')}: {step.examples}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">{t('howToUseModel')}</h4>
                <code className="block bg-white p-3 rounded border border-blue-200 text-sm">
                  ollama run {pipelineResults.modelName}
                </code>
              </div>
            </div>
          )}

          {pipelineResults.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Error: {pipelineResults.error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Pipeline Step Component
function PipelineStep({ icon, title, description, status, result, onRun, disabled }) {
  return (
    <div className={`border rounded-lg p-4 ${
      status === 'success' ? 'border-green-200 bg-green-50' :
      status === 'running' ? 'border-blue-200 bg-blue-50' :
      'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${
            status === 'success' ? 'bg-green-100 text-green-600' :
            status === 'running' ? 'bg-blue-100 text-blue-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {icon}
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>

            {result && (
              <div className="mt-2 text-sm text-gray-700">
                {result.totalDocuments && <p>Documents: {result.totalDocuments}</p>}
                {result.total && <p>Processed: {result.total}</p>}
                {result.success && <p>Success: {result.success}</p>}
                {result.examples && <p>Examples: {result.examples}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {status === 'running' && <Clock className="w-5 h-5 text-blue-600 animate-spin" />}

          <button
            onClick={onRun}
            disabled={disabled || status === 'running'}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run
          </button>
        </div>
      </div>
    </div>
  )
}
