import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  User,
  Bell,
  Key,
  Save,
  Loader2,
  Check,
  Mail,
  Phone,
  MapPin,
  Globe,
  Settings as SettingsIcon,
  Users,
  CreditCard,
  Database,
  AlertCircle
} from 'lucide-react'
import { organizationAPI, usersAPI } from '../services/api'
import { formatDate } from '../lib/utils'

export default function Settings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('organization')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({})

  // Fetch organization data
  const { data: orgResponse, isLoading: orgLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: () => organizationAPI.getCurrent(),
  })

  const organization = orgResponse?.data?.organization || {}

  // Fetch current user data
  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => usersAPI.getCurrent(),
  })

  const currentUser = userResponse?.data?.user || {}

  // Fetch organization users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['organization-users'],
    queryFn: () => organizationAPI.getUsers(),
    enabled: activeTab === 'users',
  })

  const organizationUsers = usersResponse?.data?.users || []

  // Update organization mutation
  const updateOrgMutation = useMutation({
    mutationFn: (data) => organizationAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization'])
      setEditMode(false)
      alert('Organization settings updated successfully')
    },
    onError: (error) => {
      alert(`Failed to update organization: ${error.response?.data?.message || error.message}`)
    },
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data) => usersAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user'])
      setEditMode(false)
      alert('Profile updated successfully')
    },
    onError: (error) => {
      alert(`Failed to update profile: ${error.response?.data?.message || error.message}`)
    },
  })

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: (data) => organizationAPI.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization-users'])
      alert('User invited successfully')
    },
    onError: (error) => {
      alert(`Failed to invite user: ${error.response?.data?.message || error.message}`)
    },
  })

  const handleSave = () => {
    if (activeTab === 'organization') {
      updateOrgMutation.mutate(formData)
    } else if (activeTab === 'profile') {
      updateUserMutation.mutate(formData)
    }
  }

  const handleEdit = (data) => {
    setFormData(data)
    setEditMode(true)
  }

  const handleCancel = () => {
    setFormData({})
    setEditMode(false)
  }

  const handleInviteUser = () => {
    const email = prompt('Enter email address to invite:')
    if (email) {
      const role = prompt('Enter role (ADMIN, PRACTITIONER, STAFF):', 'PRACTITIONER')
      if (role) {
        inviteUserMutation.mutate({ email, role })
      }
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your organization and profile settings
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => {
              setActiveTab('organization')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'organization'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Organization
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('profile')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('users')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('notifications')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('integrations')
              setEditMode(false)
            }}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'integrations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Integrations
            </div>
          </button>
        </nav>
      </div>

      {/* Organization Tab */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          {orgLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Organization Info Card */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Organization Information
                  </h2>
                  {!editMode ? (
                    <button
                      onClick={() => handleEdit(organization)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateOrgMutation.isLoading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {updateOrgMutation.isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Organization Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization Name
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{organization.name || '-'}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      {editMode ? (
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {organization.email || '-'}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      {editMode ? (
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {organization.phone || '-'}
                        </p>
                      )}
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      {editMode ? (
                        <input
                          type="url"
                          value={formData.website || ''}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          {organization.website || '-'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    {editMode ? (
                      <textarea
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        {organization.address || '-'}
                      </p>
                    )}
                  </div>

                  {!editMode && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Created: {formatDate(organization.created_at, 'time')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {userLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  User Profile
                </h2>
                {!editMode ? (
                  <button
                    onClick={() => handleEdit(currentUser)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateUserMutation.isLoading}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {updateUserMutation.isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{currentUser.first_name || '-'}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{currentUser.last_name || '-'}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">{currentUser.email || '-'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed here
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <p className="text-sm text-gray-900">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {currentUser.role || '-'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Organization Users
            </h2>
            <button
              onClick={handleInviteUser}
              disabled={inviteUserMutation.isLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Invite User
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {usersLoading ? (
              <div className="px-6 py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-500 mt-3">Loading users...</p>
              </div>
            ) : organizationUsers.length > 0 ? (
              organizationUsers.map((user) => (
                <div key={user.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {user.role}
                      </span>
                      {user.status && (
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          user.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No users found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Notification Preferences
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage how you receive notifications
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Appointment Reminders */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Appointment Reminders</p>
                <p className="text-xs text-gray-500">Get reminders for upcoming appointments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Follow-up Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Follow-up Notifications</p>
                <p className="text-xs text-gray-500">Get notified about pending follow-ups</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* System Updates */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">System Updates</p>
                <p className="text-xs text-gray-500">Receive notifications about system updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="pt-4">
              <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Notification preferences are coming soon
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    We're working on implementing full notification preferences. For now, these are display-only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* SolvIt Integration */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">SolvIt Integration</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Patient management system integration
                </p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded flex items-center gap-2">
                <Check className="w-4 h-4" />
                Active
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 font-medium">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="text-gray-900 font-medium">
                    {formatDate(new Date(), 'time')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sync Mode:</span>
                  <span className="text-gray-900 font-medium">Automatic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Google Drive Integration */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Google Drive Integration</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Cloud storage for training data and documents
                </p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded flex items-center gap-2">
                <Check className="w-4 h-4" />
                Active
              </span>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 font-medium">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Training Data Folder:</span>
                  <span className="text-gray-900 font-medium">Configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto Import:</span>
                  <span className="text-gray-900 font-medium">Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Integration */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Stripe Integration</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Payment processing (Coming soon)
                </p>
              </div>
              <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded">
                Not Connected
              </span>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Connect Stripe to process payments directly in ChiroClickCRM.
              </p>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Connect Stripe (Coming Soon)
              </button>
            </div>
          </div>

          {/* API Access */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">API Access</h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage API keys for external integrations
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    API access coming soon
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    We're working on implementing API key management for external integrations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
