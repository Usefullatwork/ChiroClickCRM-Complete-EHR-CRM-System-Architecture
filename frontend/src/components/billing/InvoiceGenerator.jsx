/**
 * InvoiceGenerator Component
 * Create new invoices with takst code selection
 *
 * Allows practitioners to generate invoices for patients
 * with Norwegian takst codes and automatic HELFO calculations
 */

import _React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  User,
  _Calendar,
  Save,
  Send,
  X,
  AlertCircle,
  Check,
  Loader2,
  Search,
} from 'lucide-react';
import { billingAPI, patientsAPI } from '../../services/api';
import TakstCodes from './TakstCodes';

/**
 * InvoiceGenerator Component
 * @param {Object} props
 * @param {string} props.patientId - Pre-selected patient ID (optional)
 * @param {string} props.encounterId - Related encounter ID (optional)
 * @param {Function} props.onClose - Callback when closing the generator
 * @param {Function} props.onInvoiceCreated - Callback when invoice is created
 */
export default function InvoiceGenerator({
  patientId: initialPatientId = null,
  encounterId = null,
  onClose,
  onInvoiceCreated,
}) {
  const _navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [notes, setNotes] = useState('');
  const [dueDays, setDueDays] = useState(14);
  const [isChild, setIsChild] = useState(false);
  const [hasExemption, setHasExemption] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(!initialPatientId);
  const [errors, setErrors] = useState({});

  // Fetch selected patient
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) {
        return null;
      }
      const response = await patientsAPI.getById(selectedPatientId);
      return response.data;
    },
    enabled: !!selectedPatientId,
  });

  // Search patients
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['patient-search', patientSearch],
    queryFn: async () => {
      if (!patientSearch || patientSearch.length < 2) {
        return [];
      }
      const response = await patientsAPI.search(patientSearch);
      return response.data?.patients || response.data || [];
    },
    enabled: patientSearch.length >= 2,
  });

  // Calculate totals
  const { data: totals } = useQuery({
    queryKey: ['invoice-totals', selectedCodes, isChild, hasExemption],
    queryFn: async () => {
      if (selectedCodes.length === 0) {
        return null;
      }
      const response = await billingAPI.calculateTotals({
        items: selectedCodes,
        isChild,
        hasExemption,
      });
      return response.data;
    },
    enabled: selectedCodes.length > 0,
  });

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: (data) => billingAPI.createInvoice(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['invoices']);
      if (onInvoiceCreated) {
        onInvoiceCreated(response.data);
      }
    },
  });

  // Check if patient is a child (under 16)
  useEffect(() => {
    if (patient?.date_of_birth) {
      const birthDate = new Date(patient.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      setIsChild(actualAge < 16);
    }
  }, [patient]);

  /**
   * Handle patient selection from search
   */
  const handleSelectPatient = (selectedPatient) => {
    setSelectedPatientId(selectedPatient.id);
    setPatientSearch('');
    setShowPatientSearch(false);
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    const newErrors = {};

    if (!selectedPatientId) {
      newErrors.patient = 'Velg en pasient';
    }

    if (selectedCodes.length === 0) {
      newErrors.codes = 'Velg minst en takstkode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (sendImmediately = false) => {
    if (!validateForm()) {
      return;
    }

    try {
      const invoiceData = {
        patient_id: selectedPatientId,
        encounter_id: encounterId,
        items: selectedCodes,
        notes,
        due_days: dueDays,
        is_child: isChild,
        has_exemption: hasExemption,
      };

      const response = await createMutation.mutateAsync(invoiceData);

      // If send immediately, finalize the invoice
      if (sendImmediately && response.data?.id) {
        await billingAPI.finalizeInvoice(response.data.id);
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  /**
   * Format currency in NOK
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  /**
   * Format date in Norwegian format
   */
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Ny faktura</h2>
              <p className="text-sm text-gray-500">Opprett faktura med takstkoder</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pasient *</label>

            {showPatientSearch ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Sok etter pasient (navn, telefon, eller fodselsnummer)..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Search Results */}
                {searchLoading ? (
                  <div className="flex items-center gap-2 text-gray-500 p-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Soker...
                  </div>
                ) : searchResults?.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg divide-y max-h-60 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {p.first_name} {p.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {p.date_of_birth && formatDate(p.date_of_birth)}
                            {p.phone && ` - ${p.phone}`}
                          </p>
                        </div>
                        <Check className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                ) : patientSearch.length >= 2 ? (
                  <p className="text-gray-500 text-sm p-4">Ingen pasienter funnet</p>
                ) : null}
              </div>
            ) : patient ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {patient.date_of_birth && formatDate(patient.date_of_birth)}
                      {patient.phone && ` - ${patient.phone}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPatientId(null);
                    setShowPatientSearch(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Endre
                </button>
              </div>
            ) : patientLoading ? (
              <div className="flex items-center gap-2 text-gray-500 p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Laster pasient...
              </div>
            ) : null}

            {errors.patient && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.patient}
              </p>
            )}
          </div>

          {/* Exemption options */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isChild}
                onChange={(e) => setIsChild(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Barn under 16 ar (fritak for egenandel)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasExemption}
                onChange={(e) => setHasExemption(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Frikort (redusert egenandel)</span>
            </label>
          </div>

          {/* Takst Codes Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Takstkoder *</label>
            <TakstCodes
              selectedCodes={selectedCodes}
              onCodesChange={setSelectedCodes}
              isChild={isChild}
              hasExemption={hasExemption}
            />
            {errors.codes && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.codes}
              </p>
            )}
          </div>

          {/* Invoice Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forfallsdager</label>
              <select
                value={dueDays}
                onChange={(e) => setDueDays(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>7 dager</option>
                <option value={14}>14 dager</option>
                <option value={21}>21 dager</option>
                <option value={30}>30 dager</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Forfallsdato: {formatDate(new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000))}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merknad (valgfri)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Intern merknad..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Summary */}
          {totals && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Fakturasammendrag</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Brutto:</span>
                  <span className="font-medium">{formatCurrency(totals.totalGross)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>HELFO-refusjon:</span>
                  <span className="font-medium">- {formatCurrency(totals.totalHelfoRefund)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-blue-200 pt-2 mt-2">
                  <span>Pasient betaler:</span>
                  <span className="text-blue-700">{formatCurrency(totals.totalPatientShare)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mutation Error */}
          {createMutation.isError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Kunne ikke opprette faktura</p>
                <p className="text-sm">{createMutation.error?.message || 'En feil oppstod'}</p>
              </div>
            </div>
          )}

          {/* Success message */}
          {createMutation.isSuccess && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Faktura opprettet</p>
                <p className="text-sm">
                  Fakturanummer: {createMutation.data?.data?.invoice_number}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Avbryt
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={createMutation.isPending || createMutation.isSuccess}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lagre som utkast
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={createMutation.isPending || createMutation.isSuccess}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Opprett og send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
