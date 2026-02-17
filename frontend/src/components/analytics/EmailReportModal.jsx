import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { useSendKPIReport } from '../../hooks/useAnalytics';

/**
 * Email Report Modal Component
 *
 * Sends KPI reports to clinic leads via email
 * Generates formatted HTML email with KPI metrics
 */
export const EmailReportModal = ({ isOpen, onClose, kpiData, dateRange, timeRange }) => {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState(`ChiroClick KPI Report - ${dateRange}`);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  const sendReport = useSendKPIReport();

  const validate = () => {
    const newErrors = {};

    if (!recipients.trim()) {
      newErrors.recipients = 'At least one recipient email is required';
    } else {
      // Validate email format
      const emails = recipients.split(',').map((e) => e.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter((e) => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        newErrors.recipients = `Invalid email format: ${invalidEmails.join(', ')}`;
      }
    }

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) {
      return;
    }

    try {
      const emailList = recipients.split(',').map((e) => e.trim());

      await sendReport.mutateAsync({
        recipients: emailList,
        subject,
        message,
        kpiData,
        dateRange,
        timeRange,
      });

      // Success - close modal
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to send email report' });
    }
  };

  // Generate email preview
  const generatePreview = () => {
    return `
📊 KPI Report - ${dateRange}

Key Metrics:
• Total Visits: ${kpiData.totalVisits || 0}
• Reactivations: ${kpiData.reactivations || 0}
• Messages Sent: ${kpiData.messagesSent || 0}
• Active Patients: ${kpiData.activePatients || 0}
• PVA (Patient Visit Average): ${kpiData.pva ? kpiData.pva.toFixed(1) : '0.0'}

Appointments:
• Scheduled: ${kpiData.appointmentsScheduled || 0}
• Completed: ${kpiData.appointmentsCompleted || 0}
• Show Rate: ${kpiData.showRate ? kpiData.showRate.toFixed(1) : '0'}%

Patient Demographics:
• New Patients: ${kpiData.newPatients || 0}
• Returning Patients: ${kpiData.returningPatients || 0}
• Retention Rate: ${kpiData.retentionRate ? kpiData.retentionRate.toFixed(1) : '0'}%

${message ? `\nAdditional Notes:\n${message}` : ''}
    `.trim();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email KPI Report" size="lg">
      <div className="space-y-6">
        {/* Info alert */}
        <Alert variant="info">
          <AlertCircle size={18} />
          <div>
            <p className="font-medium">Send KPI report to clinic leads</p>
            <p className="text-sm mt-1">
              The report will include key metrics for {dateRange} with formatted charts and trends.
            </p>
          </div>
        </Alert>

        {/* Form */}
        <div className="space-y-4">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Recipients
              <span className="text-red-500 ml-1">*</span>
            </label>
            <Input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              error={errors.recipients}
            />
            <p className="text-xs text-slate-500 mt-1">Separate multiple emails with commas</p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Subject
              <span className="text-red-500 ml-1">*</span>
            </label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              error={errors.subject}
            />
          </div>

          {/* Additional message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Additional Message (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any additional notes or context for the recipients..."
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Preview</label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                {generatePreview()}
              </pre>
            </div>
          </div>
        </div>

        {/* Error message */}
        {errors.submit && (
          <Alert variant="danger">
            <AlertCircle size={18} />
            {errors.submit}
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={sendReport.isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSend} loading={sendReport.isLoading} icon={Send}>
            Send Report
          </Button>
        </div>
      </div>
    </Modal>
  );
};
