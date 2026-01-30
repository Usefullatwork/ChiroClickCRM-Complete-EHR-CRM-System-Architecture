/**
 * PaymentTracker Component
 * Record and track payments on invoices
 *
 * Allows recording payments with various payment methods
 * and tracks payment history for Norwegian healthcare invoices
 */

import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  X,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Receipt,
  FileText
} from 'lucide-react'
import { billingAPI } from '../../services/api'

/**
 * Payment method configurations
 */
const PAYMENT_METHODS = [
  {
    id: 'card',
    name: 'Kort',
    icon: CreditCard,
    description: 'Debet- eller kreditkort'
  },
  {
    id: 'cash',
    name: 'Kontant',
    icon: Banknote,
    description: 'Kontant betaling'
  },
  {
    id: 'vipps',
    name: 'Vipps',
    icon: Smartphone,
    description: 'Vipps mobilbetaling'
  },
  {
    id: 'bank_transfer',
    name: 'Bankoverføring',
    icon: Building2,
    description: 'Overføring til bankkonto'
  }
]

/**
 * PaymentTracker Component
 * @param {Object} props
 * @param {Object} props.invoice - Invoice to record payment for
 * @param {Function} props.onClose - Callback when closing
 * @param {Function} props.onPaymentRecorded - Callback when payment is recorded
 */
export default function PaymentTracker({
  invoice,
  onClose,
  onPaymentRecorded
}) {
  const queryClient = useQueryClient()

  // Form state
  const [amount, setAmount] = useState(invoice?.amount_due?.toString() || '')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})

  // Record payment mutation
  const recordMutation = useMutation({
    mutationFn: (data) => billingAPI.recordPayment(invoice.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['invoice', invoice.id])
      queryClient.invalidateQueries(['invoice-payments', invoice.id])
      queryClient.invalidateQueries(['invoices'])
      queryClient.invalidateQueries(['invoice-statistics'])
      if (onPaymentRecorded) {
        onPaymentRecorded(response.data)
      }
    }
  })

  /**
   * Format currency in NOK
   */
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(value || 0)
  }

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {}

    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Angi et gyldig belop'
    } else if (numAmount > parseFloat(invoice.amount_due)) {
      newErrors.amount = 'Belopet kan ikke overstige utstaende belop'
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Velg betalingsmetode'
    }

    if (!paymentDate) {
      newErrors.paymentDate = 'Velg betalingsdato'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await recordMutation.mutateAsync({
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payment_reference: paymentReference || null,
        payment_date: paymentDate,
        notes: notes || null
      })
    } catch (error) {
      console.error('Failed to record payment:', error)
    }
  }

  /**
   * Set amount to full due amount
   */
  const handleFullPayment = () => {
    setAmount(invoice.amount_due.toString())
  }

  if (!invoice) {
    return null
  }

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Registrer betaling</h2>
              <p className="text-sm text-gray-500">Faktura {invoice.invoice_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Pasient</p>
              <p className="font-medium">{invoice.patient_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Utstaende</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(invoice.amount_due)}
              </p>
            </div>
          </div>
          {invoice.amount_paid > 0 && (
            <div className="mt-2 text-sm text-green-600">
              Allerede betalt: {formatCurrency(invoice.amount_paid)}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Belop (NOK) *
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  max={invoice.amount_due}
                  className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  kr
                </span>
              </div>
              <button
                type="button"
                onClick={handleFullPayment}
                className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap"
              >
                Fullt belop
              </button>
            </div>
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Betalingsmetode *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                const isSelected = paymentMethod === method.id

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                        {method.name}
                      </p>
                      <p className="text-xs text-gray-500">{method.description}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-green-600 ml-auto" />
                    )}
                  </button>
                )
              })}
            </div>
            {errors.paymentMethod && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.paymentMethod}
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Betalingsdato *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.paymentDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.paymentDate && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.paymentDate}
              </p>
            )}
          </div>

          {/* Payment Reference (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referanse (valgfri)
            </label>
            <div className="relative">
              <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="F.eks. transaksjonsnummer, kvitteringsnummer..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merknad (valgfri)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Intern merknad om betalingen..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Error message */}
          {recordMutation.isError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Kunne ikke registrere betaling</p>
                <p className="text-sm">{recordMutation.error?.message || 'En feil oppstod'}</p>
              </div>
            </div>
          )}

          {/* Success message */}
          {recordMutation.isSuccess && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-start gap-2">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Betaling registrert</p>
                <p className="text-sm">
                  {formatCurrency(amount)} er registrert som betalt
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {recordMutation.isSuccess ? 'Lukk' : 'Avbryt'}
          </button>

          {!recordMutation.isSuccess && (
            <button
              onClick={handleSubmit}
              disabled={recordMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
            >
              {recordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrerer...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Registrer betaling
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
