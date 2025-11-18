import { useState } from 'react';
import { Copy, Check, Send, Smartphone } from 'lucide-react';

/**
 * SMS Composer Component
 * Supports manual copy-to-clipboard workflow and Windows Phone Link integration
 */
export default function SMSComposer({ recipientPhone, recipientName, onSend, onCancel }) {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [manualSendConfirmation, setManualSendConfirmation] = useState(false);

  const MAX_SMS_LENGTH = 160;
  const MAX_SMS_EXTENDED = 1600;

  const handleMessageChange = (e) => {
    const text = e.target.value;
    setMessage(text);
    setCharCount(text.length);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Show instructions for manual sending
      setManualSendConfirmation(true);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy message. Please select and copy manually.');
    }
  };

  const handleConfirmSent = async () => {
    setSending(true);
    try {
      // Call the API to log the manual SMS
      await onSend({
        recipient_phone: recipientPhone,
        content: message,
        method: 'manual',
        status: 'PENDING' // Will be marked as sent after user confirmation
      });

      // Reset form
      setMessage('');
      setCharCount(0);
      setManualSendConfirmation(false);
    } catch (error) {
      console.error('Error logging SMS:', error);
      alert('Failed to log SMS. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSendViaPhoneLink = async () => {
    setSending(true);
    try {
      // Call the API to send via Phone Link
      await onSend({
        recipient_phone: recipientPhone,
        content: message,
        method: 'phonelink'
      });

      // Reset form
      setMessage('');
      setCharCount(0);
    } catch (error) {
      console.error('Error sending via Phone Link:', error);
      alert('Failed to send via Phone Link. Try copying manually instead.');
    } finally {
      setSending(false);
    }
  };

  const messageSegments = Math.ceil(charCount / MAX_SMS_LENGTH);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Send SMS</h3>
            <p className="text-sm text-gray-600">
              To: {recipientName} ({recipientPhone})
            </p>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="mb-4">
        <textarea
          value={message}
          onChange={handleMessageChange}
          placeholder="Type your message here..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={6}
          maxLength={MAX_SMS_EXTENDED}
        />

        {/* Character count */}
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className={`${charCount > MAX_SMS_EXTENDED - 50 ? 'text-red-600' : 'text-gray-500'}`}>
            {charCount} / {MAX_SMS_EXTENDED} characters
            {messageSegments > 1 && ` (${messageSegments} SMS segments)`}
          </span>
          {charCount > MAX_SMS_LENGTH && (
            <span className="text-amber-600">
              Long message - will be split into {messageSegments} parts
            </span>
          )}
        </div>
      </div>

      {/* Manual Send Instructions */}
      {manualSendConfirmation && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 mb-3">
            ✓ Message copied to clipboard! Now:
          </p>
          <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
            <li>Open your phone's messaging app</li>
            <li>Create a new message to {recipientPhone}</li>
            <li>Paste the message (long-press in message field)</li>
            <li>Send the message</li>
            <li>Click "Confirm Sent" below when done</li>
          </ol>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!manualSendConfirmation ? (
          <>
            {/* Copy to Clipboard (Manual Method) */}
            <button
              onClick={handleCopyToClipboard}
              disabled={!message.trim() || sending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Message
                </>
              )}
            </button>

            {/* Send via Phone Link (Automatic Method) */}
            <button
              onClick={handleSendViaPhoneLink}
              disabled={!message.trim() || sending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Sending...' : 'Send via Phone Link'}
            </button>
          </>
        ) : (
          <>
            {/* Confirm Sent */}
            <button
              onClick={handleConfirmSent}
              disabled={sending}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {sending ? 'Logging...' : 'Confirm Sent ✓'}
            </button>

            {/* Copy Again */}
            <button
              onClick={handleCopyToClipboard}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Copy className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Tip:</strong> Use "Copy Message" to send manually from your phone, or "Send via Phone Link"
          if you have Windows Phone Link app installed and connected.
        </p>
      </div>
    </div>
  );
}
