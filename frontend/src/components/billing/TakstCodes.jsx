/**
 * TakstCodes Component
 * Norwegian chiropractic takst code picker
 *
 * Allows selection of takst codes for invoicing with real-time
 * calculation of gross amount, HELFO refund, and patient share
 */

import _React, { useState, _useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Minus,
  _Info,
  Check,
  _X,
  Clock,
  MapPin,
  FileText,
  Users,
  _Phone,
  _Video,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { billingAPI } from '../../services/api';

/**
 * Get icon for takst category
 */
const getCategoryIcon = (category) => {
  const icons = {
    consultation: FileText,
    supplement: Plus,
    administrative: FileText,
    documentation: FileText,
    group: Users,
    time_supplement: Clock,
    location_supplement: MapPin,
  };
  return icons[category] || FileText;
};

/**
 * TakstCodes Component
 * @param {Object} props
 * @param {Array} props.selectedCodes - Currently selected codes with quantities
 * @param {Function} props.onCodesChange - Callback when codes change
 * @param {boolean} props.isChild - Whether patient is under 16 (no patient share)
 * @param {boolean} props.hasExemption - Whether patient has exemption card
 * @param {boolean} props.readOnly - Whether the picker is read-only
 */
export default function TakstCodes({
  selectedCodes = [],
  onCodesChange,
  isChild = false,
  hasExemption = false,
  readOnly = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedCode, setExpandedCode] = useState(null);

  // Fetch takst codes from API
  const {
    data: takstData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['takst-codes'],
    queryFn: async () => {
      const response = await billingAPI.getTakstCodes();
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Combine main and additional codes
  const allCodes = useMemo(() => {
    if (!takstData) {
      return [];
    }
    return [
      ...Object.values(takstData.codes || {}),
      ...Object.values(takstData.additionalCodes || {}),
    ];
  }, [takstData]);

  // Filter codes based on search and category
  const filteredCodes = useMemo(() => {
    return allCodes.filter((code) => {
      const matchesSearch =
        searchTerm === '' ||
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = activeCategory === 'all' || code.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allCodes, searchTerm, activeCategory]);

  // Get categories from takst data
  const categories = useMemo(() => {
    if (!takstData?.categories) {
      return [];
    }
    return Object.entries(takstData.categories).map(([key, value]) => ({
      id: key,
      name: value.name,
      nameEn: value.nameEn,
    }));
  }, [takstData]);

  // Calculate totals
  const totals = useMemo(() => {
    let grossAmount = 0;
    let helfoRefund = 0;
    let patientShare = 0;

    selectedCodes.forEach((item) => {
      const code = allCodes.find((c) => c.code === item.code);
      if (code) {
        const qty = item.quantity || 1;
        grossAmount += code.price * qty;
        helfoRefund += code.helfoRefund * qty;

        let share = code.patientShare * qty;
        if (isChild) {
          share = 0;
        } else if (hasExemption) {
          share = Math.round(share * 0.5);
        }
        patientShare += share;
      }
    });

    return { grossAmount, helfoRefund, patientShare };
  }, [selectedCodes, allCodes, isChild, hasExemption]);

  /**
   * Add or update a code in the selection
   */
  const handleAddCode = (code) => {
    const existing = selectedCodes.find((c) => c.code === code.code);
    if (existing) {
      onCodesChange(
        selectedCodes.map((c) => (c.code === code.code ? { ...c, quantity: c.quantity + 1 } : c))
      );
    } else {
      onCodesChange([...selectedCodes, { code: code.code, quantity: 1 }]);
    }
  };

  /**
   * Remove one quantity from a code
   */
  const handleRemoveCode = (codeId) => {
    const existing = selectedCodes.find((c) => c.code === codeId);
    if (existing) {
      if (existing.quantity <= 1) {
        onCodesChange(selectedCodes.filter((c) => c.code !== codeId));
      } else {
        onCodesChange(
          selectedCodes.map((c) => (c.code === codeId ? { ...c, quantity: c.quantity - 1 } : c))
        );
      }
    }
  };

  /**
   * Get quantity for a code
   */
  const getCodeQuantity = (codeId) => {
    const item = selectedCodes.find((c) => c.code === codeId);
    return item?.quantity || 0;
  };

  /**
   * Format currency in NOK
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Laster takstkoder...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        <p>Kunne ikke laste takstkoder: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Sok etter takst eller beskrivelse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">Alle kategorier</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Exemption indicators */}
      {(isChild || hasExemption) && (
        <div className="flex gap-3">
          {isChild && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              <Check className="w-4 h-4" />
              Barn under 16 ar - ingen egenandel
            </span>
          )}
          {hasExemption && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              <Check className="w-4 h-4" />
              Frikort - redusert egenandel
            </span>
          )}
        </div>
      )}

      {/* Takst Codes List */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {filteredCodes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Ingen takstkoder funnet</div>
        ) : (
          filteredCodes.map((code) => {
            const IconComponent = getCategoryIcon(code.category);
            const quantity = getCodeQuantity(code.code);
            const isExpanded = expandedCode === code.code;

            return (
              <div
                key={code.code}
                className={`p-4 hover:bg-gray-50 transition-colors ${quantity > 0 ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2 rounded-lg ${quantity > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${quantity > 0 ? 'text-blue-600' : 'text-gray-600'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{code.code}</span>
                        <span className="font-medium text-gray-900">{code.name}</span>
                        {code.duration && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {code.duration} min
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{code.description}</p>

                      {/* Price breakdown */}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span className="text-gray-700">
                          <strong>Pris:</strong> {formatCurrency(code.price)}
                        </span>
                        <span className="text-green-600">
                          <strong>HELFO:</strong> {formatCurrency(code.helfoRefund)}
                        </span>
                        <span className="text-orange-600">
                          <strong>Egenandel:</strong>{' '}
                          {formatCurrency(
                            isChild
                              ? 0
                              : hasExemption
                                ? Math.round(code.patientShare * 0.5)
                                : code.patientShare
                          )}
                        </span>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                          {code.canCombineWith?.length > 0 && (
                            <p>
                              <strong>Kan kombineres med:</strong> {code.canCombineWith.join(', ')}
                            </p>
                          )}
                          {code.notes && <p className="text-gray-600 italic">{code.notes}</p>}
                          {code.helfoCode && (
                            <p>
                              <strong>HELFO-kode:</strong> {code.helfoCode}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Info toggle */}
                    <button
                      onClick={() => setExpandedCode(isExpanded ? null : code.code)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Vis detaljer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>

                    {/* Quantity controls */}
                    {!readOnly && (
                      <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleRemoveCode(code.code)}
                          disabled={quantity === 0}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => handleAddCode(code)}
                          className="p-2 hover:bg-gray-100 rounded-r-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Codes Summary */}
      {selectedCodes.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Valgte takstkoder</h4>

          <div className="space-y-2 mb-4">
            {selectedCodes.map((item) => {
              const code = allCodes.find((c) => c.code === item.code);
              if (!code) {
                return null;
              }

              return (
                <div key={item.code} className="flex items-center justify-between text-sm">
                  <span>
                    <strong>{code.code}</strong> - {code.name} x {item.quantity}
                  </span>
                  <span className="font-medium">{formatCurrency(code.price * item.quantity)}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Brutto:</span>
              <span className="font-medium">{formatCurrency(totals.grossAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>HELFO-refusjon:</span>
              <span className="font-medium">- {formatCurrency(totals.helfoRefund)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
              <span>Pasient betaler:</span>
              <span className="text-blue-600">{formatCurrency(totals.patientShare)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
