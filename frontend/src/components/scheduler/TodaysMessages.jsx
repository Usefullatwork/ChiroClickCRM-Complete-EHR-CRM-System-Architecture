import { useState, useEffect } from 'react'
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'

/**
 * Today's Messages Component
 * Shows scheduled automated messages for today (appointment reminders, etc.)
 */
const TodaysMessages = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  // Placeholder data - would normally fetch from API
  useEffect(() => {
    setMessages([
      {
        id: 1,
        patient: 'Ola Nordmann',
        type: 'reminder',
        channel: 'sms',
        scheduledFor: '08:00',
        status: 'sent',
        content: 'Påminnelse om time i morgen kl. 10:00'
      },
      {
        id: 2,
        patient: 'Kari Hansen',
        type: 'reminder',
        channel: 'email',
        scheduledFor: '09:00',
        status: 'pending',
        content: 'Påminnelse om kontrolltime'
      },
      {
        id: 3,
        patient: 'Per Pedersen',
        type: 'followup',
        channel: 'sms',
        scheduledFor: '10:00',
        status: 'failed',
        content: 'Oppfølging etter behandling'
      }
    ])
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'sent':
        return 'Sendt'
      case 'pending':
        return 'Venter'
      case 'failed':
        return 'Feilet'
      default:
        return status
    }
  }

  const getChannelBadge = (channel) => {
    return channel === 'sms' ? (
      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
        SMS
      </span>
    ) : (
      <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded">
        E-post
      </span>
    )
  }

  const retryMessage = (id) => {
    setMessages(prev =>
      prev.map(m => m.id === id ? { ...m, status: 'pending' } : m)
    )
    // Would trigger retry via API
  }

  const stats = {
    sent: messages.filter(m => m.status === 'sent').length,
    pending: messages.filter(m => m.status === 'pending').length,
    failed: messages.filter(m => m.status === 'failed').length
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Dagens meldinger</h3>
        </div>
        <button
          onClick={() => setLoading(true)}
          className="text-gray-400 hover:text-gray-600"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">{stats.sent}</div>
          <div className="text-xs text-gray-500">Sendt</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-gray-500">Venter</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">{stats.failed}</div>
          <div className="text-xs text-gray-500">Feilet</div>
        </div>
      </div>

      {/* Message list */}
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`border rounded-lg p-3 ${
              message.status === 'failed'
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{message.patient}</span>
                {getChannelBadge(message.channel)}
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                {getStatusIcon(message.status)}
                <span className={`${
                  message.status === 'sent' ? 'text-green-600' :
                  message.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {getStatusText(message.status)}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">{message.content}</div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Planlagt: {message.scheduledFor}</span>
              </div>
              {message.status === 'failed' && (
                <button
                  onClick={() => retryMessage(message.id)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  Prøv igjen
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Send className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Ingen planlagte meldinger i dag</p>
        </div>
      )}
    </div>
  )
}

export default TodaysMessages
