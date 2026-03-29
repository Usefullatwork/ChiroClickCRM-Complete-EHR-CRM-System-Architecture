/**
 * WorkflowBuilder Component (Orchestrator)
 *
 * Visual builder for creating and editing automation workflows.
 * Sub-components: WorkflowCanvas, WorkflowToolbar, WorkflowNodeEditor, WorkflowConnections
 */

import { useState, useCallback } from 'react';
import logger from '../../utils/logger';

import { LABELS } from './WorkflowBuilder/constants';
import WorkflowCanvas from './WorkflowBuilder/WorkflowCanvas';
import {
  WorkflowHeader,
  WorkflowFooter,
  WorkflowTestModal,
} from './WorkflowBuilder/WorkflowToolbar';
import WorkflowNodeEditor from './WorkflowBuilder/WorkflowNodeEditor';
import { ConditionsSection, SettingsSection } from './WorkflowBuilder/WorkflowConnections';

export default function WorkflowBuilder({
  workflow = null,
  onSave,
  onTest,
  onCancel,
  testPatients = [],
  _templates = [],
  staff = [],
  language = 'en',
  className = '',
}) {
  // Workflow state
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggerType, setTriggerType] = useState(workflow?.trigger_type || '');
  const [triggerConfig, setTriggerConfig] = useState(workflow?.trigger_config || {});
  const [conditions, setConditions] = useState(workflow?.conditions || []);
  const [actions, setActions] = useState(workflow?.actions || []);
  const [isActive, setIsActive] = useState(workflow?.is_active !== false);
  const [maxRunsPerPatient, setMaxRunsPerPatient] = useState(workflow?.max_runs_per_patient || 1);

  // UI state
  const [activeSection, setActiveSection] = useState('trigger');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPatientId, setTestPatientId] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errors, setErrors] = useState({});

  const labelsForLang = LABELS[language] || LABELS.en;
  const t = {
    ...labelsForLang,
    title: workflow ? labelsForLang.titleEdit || labelsForLang.title : labelsForLang.title,
  };

  // Validation
  const validate = useCallback(() => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = t.errorName;
    }
    if (!triggerType) {
      newErrors.trigger = t.errorTrigger;
    }
    if (actions.length === 0) {
      newErrors.actions = t.errorActions;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, triggerType, actions, t]);

  // Handle save
  const handleSave = async () => {
    if (!validate()) {
      return;
    }
    setIsSaving(true);
    try {
      const workflowData = {
        name,
        description,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        conditions,
        actions,
        is_active: isActive,
        max_runs_per_patient: maxRunsPerPatient,
      };
      if (workflow?.id) {
        workflowData.id = workflow.id;
      }
      await onSave?.(workflowData);
    } catch (error) {
      logger.error('Error saving workflow:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle test
  const handleTest = async () => {
    if (!testPatientId) {
      return;
    }
    setIsTesting(true);
    try {
      const result = await onTest?.({
        workflow: {
          name,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          conditions,
          actions,
        },
        patient_id: testPatientId,
      });
      setTestResult(result);
    } catch (error) {
      logger.error('Error testing workflow:', error);
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Condition handlers
  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: 'equals', value: '' }]);
  };
  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };
  const updateCondition = (index, updates) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  // Action handlers
  const addAction = (type) => {
    const newAction = { type, delay_hours: 0 };
    switch (type) {
      case 'SEND_SMS':
        newAction.message = '';
        break;
      case 'SEND_EMAIL':
        newAction.subject = '';
        newAction.body = '';
        break;
      case 'CREATE_FOLLOW_UP':
        newAction.follow_up_type = 'CUSTOM';
        newAction.reason = '';
        newAction.priority = 'MEDIUM';
        newAction.due_in_days = 7;
        break;
      case 'UPDATE_STATUS':
      case 'UPDATE_LIFECYCLE':
        newAction.value = '';
        break;
      case 'NOTIFY_STAFF':
        newAction.message = '';
        newAction.roles = ['ADMIN', 'PRACTITIONER'];
        newAction.priority = 'MEDIUM';
        break;
      case 'ADD_TAG':
        newAction.tag = '';
        break;
    }
    setActions([...actions, newAction]);
  };
  const removeAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };
  const updateAction = (index, updates) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    setActions(newActions);
  };
  const moveAction = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= actions.length) {
      return;
    }
    const newActions = [...actions];
    [newActions[index], newActions[newIndex]] = [newActions[newIndex], newActions[index]];
    setActions(newActions);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      <WorkflowHeader t={t} isActive={isActive} setIsActive={setIsActive} isEdit={!!workflow} />

      <div className="p-6 space-y-6">
        {/* Name & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.name} *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={t.namePlaceholder}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={t.descriptionPlaceholder}
            />
          </div>
        </div>

        <WorkflowCanvas
          triggerType={triggerType}
          setTriggerType={setTriggerType}
          triggerConfig={triggerConfig}
          setTriggerConfig={setTriggerConfig}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          errors={errors}
          language={language}
          t={t}
        />

        <ConditionsSection
          conditions={conditions}
          addCondition={addCondition}
          removeCondition={removeCondition}
          updateCondition={updateCondition}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          language={language}
          t={t}
        />

        <WorkflowNodeEditor
          actions={actions}
          addAction={addAction}
          removeAction={removeAction}
          updateAction={updateAction}
          moveAction={moveAction}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          errors={errors}
          language={language}
          t={t}
          staff={staff}
        />

        <SettingsSection
          maxRunsPerPatient={maxRunsPerPatient}
          setMaxRunsPerPatient={setMaxRunsPerPatient}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          t={t}
        />
      </div>

      <WorkflowFooter
        t={t}
        language={language}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={onCancel}
        onShowTest={() => setShowTestModal(true)}
      />

      {showTestModal && (
        <WorkflowTestModal
          t={t}
          language={language}
          testPatients={testPatients}
          testPatientId={testPatientId}
          setTestPatientId={setTestPatientId}
          testResult={testResult}
          isTesting={isTesting}
          onTest={handleTest}
          onClose={() => {
            setShowTestModal(false);
            setTestResult(null);
          }}
        />
      )}
    </div>
  );
}
