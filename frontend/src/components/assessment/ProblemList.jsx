import { useState } from 'react';
import { Plus, X, AlertCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * ProblemList - Patient problem/condition list panel
 * Inspired by ChiroTouch's problem list showing chronic conditions
 *
 * Features:
 * - List of active problems/conditions
 * - ICD-10 diagnosis codes
 * - Acute vs Chronic status
 * - Onset dates
 * - Quick add from common conditions
 */

const COMMON_CHIRO_CONDITIONS = [
  { code: 'M54.5', name: 'Low back pain', category: 'Spine' },
  { code: 'M54.50', name: 'Low back pain, unspecified', category: 'Spine' },
  { code: 'M54.51', name: 'Vertebrogenic low back pain', category: 'Spine' },
  { code: 'M54.2', name: 'Cervicalgia (neck pain)', category: 'Spine' },
  { code: 'M54.6', name: 'Pain in thoracic spine', category: 'Spine' },
  { code: 'M54.16', name: 'Radiculopathy, lumbar region', category: 'Spine' },
  { code: 'M54.12', name: 'Radiculopathy, cervical region', category: 'Spine' },
  { code: 'M62.830', name: 'Muscle spasm of back', category: 'Muscle' },
  { code: 'M62.838', name: 'Other muscle spasm', category: 'Muscle' },
  { code: 'M79.3', name: 'Panniculitis, unspecified', category: 'Soft Tissue' },
  { code: 'M25.511', name: 'Pain in right shoulder', category: 'Extremity' },
  { code: 'M25.512', name: 'Pain in left shoulder', category: 'Extremity' },
  { code: 'G89.29', name: 'Other chronic pain', category: 'Pain' },
  { code: 'M53.2X7', name: 'Spinal instabilities, lumbosacral', category: 'Spine' },
  { code: 'M99.03', name: 'Segmental dysfunction, lumbar', category: 'Subluxation' },
  { code: 'M99.01', name: 'Segmental dysfunction, cervical', category: 'Subluxation' },
  { code: 'M99.02', name: 'Segmental dysfunction, thoracic', category: 'Subluxation' },
  { code: 'M99.05', name: 'Segmental dysfunction, pelvic', category: 'Subluxation' },
  { code: 'G44.209', name: 'Tension-type headache', category: 'Headache' },
  { code: 'M53.0', name: 'Cervicocranial syndrome', category: 'Headache' },
];

const CONDITION_STATUS = {
  acute: { label: 'Acute', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  subacute: {
    label: 'Subacute',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
  },
  chronic: { label: 'Chronic', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  resolved: {
    label: 'Resolved',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
};

export default function ProblemList({
  problems = [],
  onChange,
  _patientName = '',
  _compact = false,
  className = '',
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [_editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [newProblem, setNewProblem] = useState({
    code: '',
    name: '',
    status: 'acute',
    onsetDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const activeProblems = problems.filter((p) => p.status !== 'resolved');
  const resolvedProblems = problems.filter((p) => p.status === 'resolved');

  const addProblem = (condition) => {
    const problem = {
      id: Date.now().toString(),
      code: condition.code,
      name: condition.name,
      status: 'acute',
      onsetDate: new Date().toISOString().split('T')[0],
      notes: '',
      addedAt: new Date().toISOString(),
    };
    onChange([...problems, problem]);
    setShowAddForm(false);
    setSearchTerm('');
  };

  const addCustomProblem = () => {
    if (!newProblem.name) {
      return;
    }
    const problem = {
      id: Date.now().toString(),
      ...newProblem,
      addedAt: new Date().toISOString(),
    };
    onChange([...problems, problem]);
    setNewProblem({
      code: '',
      name: '',
      status: 'acute',
      onsetDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddForm(false);
  };

  const updateProblem = (id, updates) => {
    onChange(problems.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    setEditingId(null);
  };

  const removeProblem = (id) => {
    onChange(problems.filter((p) => p.id !== id));
  };

  const filteredConditions = COMMON_CHIRO_CONDITIONS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedConditions = filteredConditions.reduce((acc, c) => {
    if (!acc[c.category]) {
      acc[c.category] = [];
    }
    acc[c.category].push(c);
    return acc;
  }, {});

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-white" />
          <h3 className="font-semibold text-white">Problem List</h3>
          {activeProblems.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">
              {activeProblems.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      {/* Add Problem Form */}
      {showAddForm && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="space-y-3">
            {/* Search */}
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conditions or ICD-10 codes..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Common Conditions */}
            {searchTerm ? (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {Object.entries(groupedConditions).map(([category, conditions]) => (
                  <div key={category}>
                    <div className="text-xs font-medium text-gray-500 mb-1">{category}</div>
                    <div className="space-y-1">
                      {conditions.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => addProblem(c)}
                          className="w-full text-left px-3 py-2 text-sm bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <span className="font-medium text-blue-600">{c.code}</span>
                          <span className="mx-2">-</span>
                          <span className="text-gray-700">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredConditions.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No matching conditions found
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {COMMON_CHIRO_CONDITIONS.slice(0, 10).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => addProblem(c)}
                    className="text-left px-2 py-1.5 text-xs bg-white rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-blue-600">{c.code}</div>
                    <div className="text-gray-600 truncate">{c.name}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Custom Entry */}
            <div className="pt-3 border-t border-blue-200">
              <div className="text-xs font-medium text-gray-500 mb-2">Or add custom:</div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newProblem.code}
                  onChange={(e) => setNewProblem({ ...newProblem, code: e.target.value })}
                  placeholder="ICD-10"
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={newProblem.name}
                  onChange={(e) => setNewProblem({ ...newProblem, name: e.target.value })}
                  placeholder="Condition name"
                  className="col-span-2 px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <select
                  value={newProblem.status}
                  onChange={(e) => setNewProblem({ ...newProblem, status: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded"
                >
                  {Object.entries(CONDITION_STATUS).map(([key, status]) => (
                    <option key={key} value={key}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newProblem.onsetDate}
                  onChange={(e) => setNewProblem({ ...newProblem, onsetDate: e.target.value })}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
                <button
                  onClick={addCustomProblem}
                  disabled={!newProblem.name}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Problems List */}
      <div className="divide-y divide-gray-100">
        {activeProblems.length === 0 && !showAddForm ? (
          <div className="p-6 text-center text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No active problems documented</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Add a problem
            </button>
          </div>
        ) : (
          activeProblems.map((problem) => (
            <div key={problem.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${CONDITION_STATUS[problem.status].bgColor} ${CONDITION_STATUS[problem.status].textColor}`}
                    >
                      {CONDITION_STATUS[problem.status].label}
                    </span>
                    {problem.code && (
                      <span className="text-xs font-medium text-blue-600">{problem.code}</span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 mt-1">{problem.name}</h4>
                  {problem.onsetDate && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      Onset: {new Date(problem.onsetDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Status Toggle */}
                  <select
                    value={problem.status}
                    onChange={(e) => updateProblem(problem.id, { status: e.target.value })}
                    className="text-xs px-1 py-0.5 border border-gray-200 rounded"
                  >
                    {Object.entries(CONDITION_STATUS).map(([key, status]) => (
                      <option key={key} value={key}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => removeProblem(problem.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              {problem.notes && (
                <p className="text-sm text-gray-600 mt-2 pl-2 border-l-2 border-gray-200">
                  {problem.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolved Problems (collapsed) */}
      {resolvedProblems.length > 0 && (
        <div className="border-t border-gray-200">
          <button
            onClick={() => setExpandedId(expandedId === 'resolved' ? null : 'resolved')}
            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            <span>Resolved Problems ({resolvedProblems.length})</span>
            {expandedId === 'resolved' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandedId === 'resolved' && (
            <div className="px-4 pb-3 space-y-2">
              {resolvedProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center justify-between text-sm text-gray-500"
                >
                  <span className="line-through">{problem.name}</span>
                  <button
                    onClick={() => updateProblem(problem.id, { status: 'chronic' })}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Reactivate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar display
export function ProblemListCompact({ problems = [], className = '' }) {
  const activeProblems = problems.filter((p) => p.status !== 'resolved');

  if (activeProblems.length === 0) {
    return <div className={`text-sm text-gray-500 ${className}`}>No active problems</div>;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {activeProblems.map((problem) => (
        <div key={problem.id} className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              problem.status === 'acute'
                ? 'bg-red-500'
                : problem.status === 'subacute'
                  ? 'bg-orange-500'
                  : 'bg-blue-500'
            }`}
          ></span>
          <span className="text-gray-700 truncate">{problem.name}</span>
          <span className="text-xs text-gray-400">- {CONDITION_STATUS[problem.status].label}</span>
        </div>
      ))}
    </div>
  );
}
