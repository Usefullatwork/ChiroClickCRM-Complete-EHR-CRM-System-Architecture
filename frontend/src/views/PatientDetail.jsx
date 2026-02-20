import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConfirm } from '../components/ui/ConfirmDialog';
import {
  ArrowLeft,
  Edit,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Plus,
  Download,
  Trash2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SoapNoteBuilder } from '../components/clinical/SoapNoteBuilder';
import { usePatient, usePatientEncounters } from '../hooks/usePatients';
import {
  maskFodselsnummer,
  extractBirthDate,
  extractGender,
  calculateAge,
} from '../utils/norwegianIdValidation';
import { useAuth } from '../hooks/useAuth';
import { gdprAPI } from '../services/api';

/**
 * Patient Detail View
 *
 * Displays comprehensive patient information:
 * - Demographics
 * - Contact information
 * - Encounter history
 * - SOAP notes
 * - Quick actions (edit, new note, etc.)
 */
export const PatientDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const [showSoapBuilder, setShowSoapBuilder] = useState(false);

  // Fetch patient data
  const { data: patient, isLoading, error } = usePatient(patientId);
  const { data: encounters, isLoading: encountersLoading } = usePatientEncounters(patientId);

  const canEdit = hasPermission('patients:write');
  const canDelete = hasPermission('patients:delete');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Alert variant="danger">
          <p className="font-medium">Error loading patient</p>
          <p className="text-sm mt-1">{error?.message || 'Patient not found'}</p>
        </Alert>
        <Button
          variant="outline"
          onClick={() => navigate('/patients')}
          icon={ArrowLeft}
          className="mt-4"
        >
          Back to Patients
        </Button>
      </div>
    );
  }

  const age = patient.fodselsnummer ? calculateAge(patient.fodselsnummer) : null;
  const birthDate = patient.fodselsnummer ? extractBirthDate(patient.fodselsnummer) : null;
  const gender = patient.fodselsnummer ? extractGender(patient.fodselsnummer) : null;

  const encounterList = encounters?.encounters || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/patients')}
                icon={ArrowLeft}
                size="sm"
              >
                Back
              </Button>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-sm text-slate-600 mt-1">Patient ID: {patient.id}</p>
              </div>

              <Badge
                variant={
                  patient.status === 'ACTIVE'
                    ? 'success'
                    : patient.status === 'INACTIVE'
                      ? 'warning'
                      : 'danger'
                }
              >
                {patient.status}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={() => setShowSoapBuilder(true)} icon={Plus}>
                New Note
              </Button>

              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/patients/${patientId}/edit`)}
                  icon={Edit}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Info */}
          <div className="space-y-6">
            {/* Demographics */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-slate-900">Patient Information</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="text-3xl font-semibold text-teal-700">
                        {patient.firstName?.[0]}
                        {patient.lastName?.[0]}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    {patient.fodselsnummer && (
                      <div>
                        <label className="text-xs text-slate-500 uppercase">Fødselsnummer</label>
                        <p className="font-mono text-sm text-slate-900 mt-1">
                          {maskFodselsnummer(patient.fodselsnummer, 6, 0)}
                        </p>
                      </div>
                    )}

                    {birthDate && (
                      <div>
                        <label className="text-xs text-slate-500 uppercase">Date of Birth</label>
                        <p className="text-sm text-slate-900 mt-1">
                          {birthDate.toLocaleDateString('nb-NO')}
                          {age !== null && (
                            <span className="text-slate-500 ml-2">({age} years)</span>
                          )}
                        </p>
                      </div>
                    )}

                    {gender && (
                      <div>
                        <label className="text-xs text-slate-500 uppercase">Gender</label>
                        <p className="text-sm text-slate-900 mt-1 capitalize">{gender}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Contact Information */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  {patient.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-slate-400" />
                      <div>
                        <label className="text-xs text-slate-500">Phone</label>
                        <p className="text-sm text-slate-900">{patient.phone}</p>
                      </div>
                    </div>
                  )}

                  {patient.email && (
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-slate-400" />
                      <div>
                        <label className="text-xs text-slate-500">Email</label>
                        <p className="text-sm text-slate-900">{patient.email}</p>
                      </div>
                    </div>
                  )}

                  {patient.address && (
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-slate-400 mt-1" />
                      <div>
                        <label className="text-xs text-slate-500">Address</label>
                        <p className="text-sm text-slate-900">
                          {patient.address.street}
                          <br />
                          {patient.address.postalCode} {patient.address.city}
                          <br />
                          {patient.address.country || 'Norway'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Quick Stats */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-slate-900">Statistics</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Visits</span>
                    <span className="font-semibold text-slate-900">{patient.totalVisits || 0}</span>
                  </div>

                  {patient.lastVisit && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Last Visit</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(patient.lastVisit).toLocaleDateString('nb-NO')}
                      </span>
                    </div>
                  )}

                  {patient.nextAppointment && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Next Appointment</span>
                      <span className="font-semibold text-teal-600">
                        {new Date(patient.nextAppointment).toLocaleDateString('nb-NO')}
                      </span>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* GDPR Actions */}
            {canDelete && (
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold text-slate-900">Data Management</h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      icon={Download}
                      onClick={async () => {
                        // Export patient data (GDPR right to data portability)
                        const blob = await gdprAPI.exportPatientData(patientId);
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `patient-${patientId}-data.json`;
                        a.click();
                      }}
                    >
                      Export Patient Data
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full justify-start"
                      icon={Trash2}
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Slett pasientdata',
                          description:
                            'Are you sure you want to delete this patient? This action cannot be undone.',
                          variant: 'destructive',
                        });
                        if (ok) {
                          // Delete patient data (GDPR right to be forgotten)
                          // Implementation needed
                        }
                      }}
                    >
                      Delete Patient Data
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Right Column - Encounters */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Clinical Notes & Encounters
                  </h3>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowSoapBuilder(true)}
                    icon={Plus}
                  >
                    New Note
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {encountersLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : encounterList.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No clinical notes yet</p>
                    <p className="text-sm mt-1">Start documenting this patient's care</p>
                    <Button
                      variant="primary"
                      onClick={() => setShowSoapBuilder(true)}
                      icon={Plus}
                      className="mt-4"
                    >
                      Create First Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {encounterList.map((encounter) => (
                      <div
                        key={encounter.id}
                        className="border border-slate-200 rounded-lg p-4 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/encounters/${encounter.id}`)}
                      >
                        {/* Encounter Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {encounter.type || 'Chiropractic Visit'}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(encounter.date).toLocaleDateString('nb-NO')}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {encounter.practitionerName || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <Badge variant="info">SOAP</Badge>
                        </div>

                        {/* SOAP Summary */}
                        <div className="grid grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="font-semibold text-slate-700">S</label>
                            <p className="text-slate-600 mt-1 line-clamp-2">
                              {encounter.subjective || '-'}
                            </p>
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700">O</label>
                            <p className="text-slate-600 mt-1 line-clamp-2">
                              {encounter.objective || '-'}
                            </p>
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700">A</label>
                            <p className="text-slate-600 mt-1 line-clamp-2">
                              {encounter.assessment || '-'}
                            </p>
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700">P</label>
                            <p className="text-slate-600 mt-1 line-clamp-2">
                              {encounter.plan || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Diagnosis Codes */}
                        {encounter.diagnosisCodes && encounter.diagnosisCodes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="flex flex-wrap gap-2">
                              {encounter.diagnosisCodes.map((code) => (
                                <Badge key={code} variant="secondary" size="sm">
                                  {code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* SOAP Note Builder Modal */}
      {showSoapBuilder && (
        <SoapNoteBuilder
          patient={patient}
          onCancel={() => setShowSoapBuilder(false)}
          onSave={() => {
            setShowSoapBuilder(false);
            // Refresh encounters list
            window.location.reload(); // Simple refresh - could use queryClient.invalidateQueries
          }}
        />
      )}
    </div>
  );
};
