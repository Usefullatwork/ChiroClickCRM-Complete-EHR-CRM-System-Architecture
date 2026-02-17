/**
 * RecallDashboard - Dashboard showing patients due for recall
 * Shows stats cards, table of patients due/overdue, action buttons
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  AlertTriangle,
  Clock,
  Send,
  Bell,
  BellOff,
  Calendar,
  Search,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { followUpsAPI } from '../../services/api';
import toast from '../../utils/toast';

export default function RecallDashboard() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('days_overdue');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedRules, setExpandedRules] = useState(false);

  // Fetch patients needing follow-up
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['recall-patients'],
    queryFn: async () => {
      const res = await followUpsAPI.getPatientsNeedingFollowUp();
      return res.data.patients || res.data.data || [];
    },
    refetchInterval: 60000,
  });

  // Fetch recall rules
  const { data: rulesData } = useQuery({
    queryKey: ['recall-rules'],
    queryFn: async () => {
      const res = await followUpsAPI.getRecallRules();
      return res.data.data || res.data.rules || [];
    },
  });

  // Contact patient mutation
  const contactMutation = useMutation({
    mutationFn: ({ patientId, method }) => followUpsAPI.markPatientAsContacted(patientId, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recall-patients'] });
      toast.success('Pasient markert som kontaktet');
    },
    onError: (err) => toast.error(`Feil: ${err.response?.data?.error || err.message}`),
  });

  const patients = patientsData || [];

  // Filter and sort
  const filteredPatients = useMemo(() => {
    let result = [...patients];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.first_name?.toLowerCase().includes(q) ||
          p.last_name?.toLowerCase().includes(q) ||
          p.condition?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
      }
      if (typeof bVal === 'string') {
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) {
        return sortDir === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortDir === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return result;
  }, [patients, searchQuery, sortField, sortDir]);

  // Stats
  const stats = useMemo(() => {
    const _now = new Date();
    let overdue = 0;
    let dueToday = 0;
    let dueSoon = 0;
    for (const p of patients) {
      const daysOverdue = p.days_overdue || 0;
      if (daysOverdue > 0) {
        overdue++;
      } else if (daysOverdue === 0) {
        dueToday++;
      } else {
        dueSoon++;
      }
    }
    return { total: patients.length, overdue, dueToday, dueSoon };
  }, [patients]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return null;
    }
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Recall Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Pasienter som bor kalles inn til ny time basert pa tilstand og siste besok.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Totalt due"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Forfalt"
          value={stats.overdue}
          color="red"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Due i dag"
          value={stats.dueToday}
          color="yellow"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Kommende"
          value={stats.dueSoon}
          color="green"
        />
      </div>

      {/* Recall Rules (collapsible) */}
      {rulesData && rulesData.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <button
            onClick={() => setExpandedRules(!expandedRules)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <span className="font-medium text-gray-700">
              Recall-regler ({rulesData.length} kategorier)
            </span>
            {expandedRules ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedRules && (
            <div className="border-t px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {rulesData.map((rule, i) => (
                  <div key={i} className="border rounded-lg p-3 text-sm">
                    <div className="font-medium text-gray-900">
                      {rule.category || rule.condition}
                    </div>
                    <div className="text-gray-500 mt-1">
                      Intervall: {rule.interval_days || rule.intervalDays} dager
                    </div>
                    {rule.priority && (
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                          rule.priority === 'high'
                            ? 'bg-red-50 text-red-700'
                            : rule.priority === 'medium'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {rule.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sok pasient eller tilstand..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['recall-patients'] })}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Oppdater"
          >
            <RefreshCw className={`w-5 h-5 ${patientsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {patientsLoading ? (
          <div className="p-8 text-center text-gray-500">Laster pasienter...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchQuery
                ? 'Ingen pasienter matcher soket.'
                : 'Ingen pasienter trenger recall akkurat na.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => toggleSort('last_name')}
                  >
                    Pasient <SortIcon field="last_name" />
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => toggleSort('last_visit')}
                  >
                    Siste besok <SortIcon field="last_visit" />
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => toggleSort('condition')}
                  >
                    Tilstand <SortIcon field="condition" />
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => toggleSort('days_overdue')}
                  >
                    Dager forfalt <SortIcon field="days_overdue" />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Handlinger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPatients.map((patient) => (
                  <PatientRow
                    key={patient.id || patient.patient_id}
                    patient={patient}
                    onContact={(method) =>
                      contactMutation.mutate({
                        patientId: patient.id || patient.patient_id,
                        method,
                      })
                    }
                    isContacting={contactMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PatientRow({ patient, onContact, isContacting }) {
  const [_showActions, _setShowActions] = useState(false);
  const daysOverdue = patient.days_overdue || 0;

  const urgencyColor =
    daysOverdue > 14
      ? 'text-red-700 bg-red-50'
      : daysOverdue > 0
        ? 'text-yellow-700 bg-yellow-50'
        : 'text-green-700 bg-green-50';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4">
        <div className="font-medium text-gray-900">
          {patient.first_name} {patient.last_name}
        </div>
        {patient.phone && <div className="text-xs text-gray-400">{patient.phone}</div>}
      </td>
      <td className="py-3 px-4 text-gray-600">
        {patient.last_visit
          ? new Date(patient.last_visit).toLocaleDateString('nb-NO')
          : patient.last_visit_date
            ? new Date(patient.last_visit_date).toLocaleDateString('nb-NO')
            : '-'}
      </td>
      <td className="py-3 px-4">
        {patient.condition || patient.recall_category ? (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
            {patient.condition || patient.recall_category}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${urgencyColor}`}>
          {daysOverdue > 0
            ? `${daysOverdue} dager`
            : daysOverdue === 0
              ? 'I dag'
              : `Om ${Math.abs(daysOverdue)} d.`}
        </span>
      </td>
      <td className="py-3 px-4 text-gray-600 text-xs">
        {patient.recall_type || patient.followup_type || 'Standard'}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onContact('sms')}
            disabled={isContacting}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
            title="Send SMS"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            onClick={() => onContact('phone')}
            disabled={isContacting}
            className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
            title="Ring pasient"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onContact('dismissed')}
            disabled={isContacting}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors"
            title="Avvis recall"
          >
            <BellOff className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}
