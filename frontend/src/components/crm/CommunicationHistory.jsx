import { useState, useEffect } from 'react';
import {
  Mail,
  MessageSquare,
  Phone,
  Video,
  Calendar,
  FileText,
  Search,
  ChevronRight,
  Clock,
  User,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Download,
  Loader2,
} from 'lucide-react';
import { crmAPI } from '../../services/api';
import toast from '../../utils/toast';
import logger from '../../utils/logger';

const CommunicationHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Communication types
  const commTypes = [
    { id: 'ALL', label: 'Alle', icon: FileText, color: 'bg-gray-500' },
    { id: 'EMAIL', label: 'E-post', icon: Mail, color: 'bg-blue-500' },
    { id: 'SMS', label: 'SMS', icon: MessageSquare, color: 'bg-green-500' },
    { id: 'PHONE', label: 'Telefon', icon: Phone, color: 'bg-purple-500' },
    { id: 'VIDEO', label: 'Video', icon: Video, color: 'bg-orange-500' },
    { id: 'APPOINTMENT', label: 'Timebestilling', icon: Calendar, color: 'bg-teal-500' },
  ];

  // Status configurations
  const statusConfig = {
    SENT: { label: 'Sendt', color: 'bg-blue-100 text-blue-700', icon: Send },
    DELIVERED: { label: 'Levert', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    OPENED: { label: 'Åpnet', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
    CLICKED: { label: 'Klikket', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
    FAILED: { label: 'Feilet', color: 'bg-red-100 text-red-700', icon: XCircle },
    BOUNCED: { label: 'Returnert', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
    COMPLETED: { label: 'Fullført', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    MISSED: { label: 'Ikke Besvart', color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  // Fetch communications from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const type = selectedType === 'ALL' ? undefined : selectedType;
        const response = await crmAPI.getCommunications({ type });

        // Map communication data
        const commData = (response.data?.communications || response.data || []).map((c) => ({
          id: c.id,
          patientId: c.patient_id,
          patientName:
            c.patient_name || `${c.patient_first_name || ''} ${c.patient_last_name || ''}`.trim(),
          type: c.type,
          direction: c.direction || 'OUTBOUND',
          subject: c.subject,
          content: c.content,
          status: c.status || 'SENT',
          sentAt: c.sent_at || c.created_at,
          sentBy: c.sent_by || 'System',
          campaign: c.campaign_name,
          attachments: c.attachments,
          duration: c.duration,
        }));

        setCommunications(commData);
      } catch (err) {
        logger.error('Error fetching communications:', err);
        setError(err.message || 'Failed to load communications');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedType]);

  // Log new communication
  const _handleLogCommunication = async (commData) => {
    try {
      const response = await crmAPI.logCommunication(commData);
      setCommunications((prev) => [response.data, ...prev]);
      setShowNewMessage(false);
    } catch (err) {
      logger.error('Error logging communication:', err);
      toast.error(`Failed to log communication: ${err.message}`);
    }
  };

  // Calculate stats
  const stats = {
    total: communications.length,
    emails: communications.filter((c) => c.type === 'EMAIL').length,
    sms: communications.filter((c) => c.type === 'SMS').length,
    calls: communications.filter((c) => c.type === 'PHONE').length,
    thisWeek: communications.filter((c) => {
      const date = new Date(c.sentAt);
      const now = new Date();
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      return date >= weekAgo;
    }).length,
  };

  // Filter communications
  const filteredComms = communications.filter((c) => {
    const matchesType = selectedType === 'ALL' || c.type === selectedType;
    const matchesSearch =
      c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subject && c.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Format datetime
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get type info
  const getTypeInfo = (typeId) => commTypes.find((t) => t.id === typeId);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Laster kommunikasjonslogg...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Prøv igjen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kommunikasjonslogg</h2>
          <p className="text-gray-600">All kommunikasjon med pasienter på ett sted</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {}}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Eksporter
          </button>
          <button
            onClick={() => setShowNewMessage(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ny Melding
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">Totalt</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.emails}</p>
          <p className="text-sm text-gray-600">E-poster</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.sms}</p>
          <p className="text-sm text-gray-600">SMS</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.calls}</p>
          <p className="text-sm text-gray-600">Samtaler</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
          <p className="text-sm text-gray-600">Denne Uken</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter pasient eller emne..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {commTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    selectedType === type.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Communications List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredComms.map((comm) => {
            const typeInfo = getTypeInfo(comm.type);
            const TypeIcon = typeInfo?.icon;
            const status = statusConfig[comm.status];
            const StatusIcon = status?.icon;

            return (
              <div
                key={comm.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedPatient(comm)}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg ${typeInfo?.color} flex items-center justify-center flex-shrink-0`}
                  >
                    {TypeIcon && <TypeIcon className="w-5 h-5 text-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{comm.patientName}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status?.color}`}
                      >
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {status?.label}
                      </span>
                      {comm.campaign && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {comm.campaign}
                        </span>
                      )}
                    </div>
                    {comm.subject && (
                      <p className="font-medium text-gray-800 mb-1">{comm.subject}</p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-1">{comm.content}</p>
                    {comm.attachments && (
                      <div className="flex gap-2 mt-2">
                        {comm.attachments.map((file) => (
                          <span
                            key={file}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            <FileText className="w-3 h-3" />
                            {file}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="text-right text-sm flex-shrink-0">
                    <p className="text-gray-500">{formatDateTime(comm.sentAt)}</p>
                    <p className="text-gray-400 flex items-center gap-1 justify-end">
                      <User className="w-3 h-3" />
                      {comm.sentBy}
                    </p>
                    {comm.duration && (
                      <p className="text-gray-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {comm.duration}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ny Melding</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meldingstype</label>
                <div className="flex gap-2">
                  {[
                    { id: 'EMAIL', label: 'E-post', icon: Mail },
                    { id: 'SMS', label: 'SMS', icon: MessageSquare },
                    { id: 'PHONE', label: 'Telefonnotat', icon: Phone },
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pasient</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Velg pasient...</option>
                  <option>Erik Hansen</option>
                  <option>Maria Olsen</option>
                  <option>Anders Berg</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emne</label>
                <input
                  type="text"
                  placeholder="Emne for meldingen..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Melding</label>
                <textarea
                  rows={4}
                  placeholder="Skriv din melding her..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vedlegg</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Dra og slipp filer her, eller klikk for å velge
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewMessage(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Avbryt
              </button>
              <button
                onClick={() => setShowNewMessage(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communication Detail Sidebar */}
      {selectedPatient && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Meldingsdetaljer</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Type and Status */}
              <div className="flex items-center gap-3">
                {(() => {
                  const typeInfo = getTypeInfo(selectedPatient.type);
                  const TypeIcon = typeInfo?.icon;
                  return (
                    <div
                      className={`w-10 h-10 rounded-lg ${typeInfo?.color} flex items-center justify-center`}
                    >
                      {TypeIcon && <TypeIcon className="w-5 h-5 text-white" />}
                    </div>
                  );
                })()}
                <div>
                  <p className="font-medium text-gray-900">
                    {getTypeInfo(selectedPatient.type)?.label}
                  </p>
                  <p className="text-sm text-gray-500">{formatDateTime(selectedPatient.sentAt)}</p>
                </div>
              </div>

              {/* Patient */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Pasient</p>
                <p className="font-medium text-gray-900">{selectedPatient.patientName}</p>
              </div>

              {/* Subject */}
              {selectedPatient.subject && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Emne</p>
                  <p className="font-medium text-gray-900">{selectedPatient.subject}</p>
                </div>
              )}

              {/* Content */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Innhold</p>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedPatient.content}</p>
              </div>

              {/* Status */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                {(() => {
                  const status = statusConfig[selectedPatient.status];
                  const StatusIcon = status?.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${status?.color}`}
                    >
                      {StatusIcon && <StatusIcon className="w-4 h-4" />}
                      {status?.label}
                    </span>
                  );
                })()}
              </div>

              {/* Attachments */}
              {selectedPatient.attachments && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Vedlegg</p>
                  <div className="space-y-2">
                    {selectedPatient.attachments.map((file) => (
                      <button
                        key={file}
                        className="w-full flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{file}</span>
                        <Download className="w-4 h-4 text-gray-400 ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Svar
                </button>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Se Pasientprofil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationHistory;
