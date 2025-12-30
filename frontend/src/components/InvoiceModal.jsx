/**
 * Invoice Modal Component
 * Generate and preview PDF invoices
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { pdfAPI } from '../services/api'
import { X, FileText, Download, Loader2 } from 'lucide-react'

export default function InvoiceModal({ transaction, onClose }) {
  const [invoiceData, setInvoiceData] = useState(null)

  // Generate invoice mutation
  const generateMutation = useMutation({
    mutationFn: (financialMetricId) => pdfAPI.generateInvoice(financialMetricId),
    onSuccess: (response) => {
      setInvoiceData(response.data)
    },
    onError: (error) => {
      console.error('Failed to generate invoice:', error)
      alert(error.response?.data?.error || 'Failed to generate invoice')
    }
  })

  const handleGenerate = () => {
    generateMutation.mutate(transaction.id)
  }

  const handleDownload = () => {
    if (!invoiceData?.html) return

    // Convert HTML to downloadable PDF
    // In a real app, you'd use a library like html2pdf.js or jsPDF
    // For now, we'll open a new window with the HTML and let the user print to PDF
    const printWindow = window.open('', '_blank')
    printWindow.document.write(invoiceData.html)
    printWindow.document.close()

    // Trigger print dialog
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
              <p className="text-sm text-gray-600">
                {transaction.patient_name} - {transaction.invoice_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!invoiceData ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Generate Invoice
              </h3>
              <p className="text-gray-600 mb-6">
                Generate a PDF invoice for this transaction
              </p>

              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto text-left mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-medium">{transaction.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient:</span>
                    <span className="font-medium">{transaction.patient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(transaction.created_at).toLocaleDateString('no-NO')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">{transaction.gross_amount} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient Amount:</span>
                    <span className="font-semibold text-lg">{transaction.patient_amount} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      transaction.payment_status === 'PAID' ? 'text-green-600' :
                      transaction.payment_status === 'PENDING' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {transaction.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Generate Invoice PDF
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              {/* Invoice Preview */}
              <div className="border rounded-lg overflow-hidden mb-4">
                <div
                  className="p-8 bg-white"
                  dangerouslySetInnerHTML={{ __html: invoiceData.html }}
                />
              </div>

              {/* Download Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-5 h-5" />
                  Download / Print PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
