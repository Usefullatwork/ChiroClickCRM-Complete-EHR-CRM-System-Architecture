import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  User,
  Bell,
  Users,
  Database,
  Brain,
  Stethoscope,
  Dumbbell,
  Loader2,
  ToggleLeft,
  Package,
  Timer,
} from 'lucide-react';
import { organizationAPI, usersAPI, clinicalSettingsAPI } from '../services/api';
import { useTranslation } from '../i18n';
import toast from '../utils/toast';
import Breadcrumbs from '../components/common/Breadcrumbs';
import InviteUserModal from '../components/settings/InviteUserModal';

// Lazy-loaded tab components
const OrganizationSettings = lazy(() => import('../components/settings/OrganizationSettings'));
const ProfileSettings = lazy(() => import('../components/settings/ProfileSettings'));
const UserManagement = lazy(() => import('../components/settings/UserManagement'));
const NotificationSettings = lazy(() => import('../components/settings/NotificationSettings'));
const IntegrationSettings = lazy(() => import('../components/settings/IntegrationSettings'));
const AISettings = lazy(() => import('../components/assessment/AISettings'));
const TrainingDataExport = lazy(() => import('../components/settings/TrainingDataExport'));
const ClinicalSettings = lazy(() => import('../components/settings/ClinicalSettings'));
const ExerciseSettings = lazy(() => import('../components/settings/ExerciseSettings'));
const AutoAcceptSettings = lazy(() => import('../components/settings/AutoAcceptSettings'));
const ModuleManager = lazy(() => import('../components/settings/ModuleManager'));
const AutomatedRemindersSettings = lazy(
  () => import('../components/settings/AutomatedRemindersSettings')
);

// Default clinical preferences
const DEFAULT_CLINICAL_PREFS = {
  adjustmentNotation: 'segment_listing',
  language: 'no',
  showDermatomes: true,
  showTriggerPoints: true,
  autoGenerateNarrative: true,
  defaultView: 'front',
};

// Loading fallback for lazy-loaded tabs
function TabLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('organization');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Clinical preferences — load from backend, fall back to localStorage, then defaults
  const { data: clinicalSettingsResponse } = useQuery({
    queryKey: ['clinical-settings'],
    queryFn: () => clinicalSettingsAPI.getAll(),
    staleTime: 60_000,
  });

  const [clinicalPrefs, setClinicalPrefs] = useState(() => {
    const saved = localStorage.getItem('chiroclickehr_clinical_prefs');
    return saved ? JSON.parse(saved) : DEFAULT_CLINICAL_PREFS;
  });

  // Merge backend response into state once loaded
  const backendInitialized = useRef(false);
  useEffect(() => {
    if (clinicalSettingsResponse?.data?.settings?.display && !backendInitialized.current) {
      backendInitialized.current = true;
      setClinicalPrefs((prev) => ({ ...prev, ...clinicalSettingsResponse.data.settings.display }));
    }
  }, [clinicalSettingsResponse]);

  // Save clinical preferences to localStorage (immediate) + debounced backend sync
  const syncTimerRef = useRef(null);
  const saveClinicalToBackend = useMutation({
    mutationFn: (prefs) => clinicalSettingsAPI.update({ display: prefs }),
  });

  useEffect(() => {
    localStorage.setItem('chiroclickehr_clinical_prefs', JSON.stringify(clinicalPrefs));
    if (backendInitialized.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        saveClinicalToBackend.mutate(clinicalPrefs);
      }, 1000);
    }
    return () => clearTimeout(syncTimerRef.current);
  }, [clinicalPrefs]);

  const handleClinicalPrefChange = useCallback((key, value) => {
    setClinicalPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const lang = clinicalPrefs.language || 'no';

  // Fetch organization data
  const { data: orgResponse, isLoading: orgLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: () => organizationAPI.getCurrent(),
  });

  const organization = orgResponse?.data?.organization || {};

  // Fetch current user data
  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => usersAPI.getCurrent(),
  });

  const currentUser = userResponse?.data?.user || {};

  // Fetch organization users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['organization-users'],
    queryFn: () => organizationAPI.getUsers(),
    enabled: activeTab === 'users',
  });

  const organizationUsers = usersResponse?.data?.users || [];

  // Update organization mutation
  const updateOrgMutation = useMutation({
    mutationFn: (data) => organizationAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization']);
      setEditMode(false);
      toast.success(t('orgUpdatedSuccess'));
    },
    onError: (error) => {
      toast.error(`${t('orgUpdateFailed')}: ${error.response?.data?.message || error.message}`);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data) => usersAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      setEditMode(false);
      toast.success(t('profileUpdatedSuccess'));
    },
    onError: (error) => {
      toast.error(`${t('profileUpdateFailed')}: ${error.response?.data?.message || error.message}`);
    },
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: (data) => organizationAPI.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization-users']);
      toast.success(t('userInvitedSuccess'));
    },
    onError: (error) => {
      toast.error(`${t('userInviteFailed')}: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSave = () => {
    if (activeTab === 'organization') {
      updateOrgMutation.mutate(formData);
    } else if (activeTab === 'profile') {
      updateUserMutation.mutate(formData);
    }
  };

  const handleEdit = (data) => {
    setFormData(data);
    setEditMode(true);
  };

  const handleCancel = () => {
    setFormData({});
    setEditMode(false);
  };

  const handleInviteUser = () => {
    setInviteModalOpen(true);
  };

  const handleInviteSubmit = ({ email, role }) => {
    inviteUserMutation.mutate(
      { email, role },
      {
        onSuccess: () => setInviteModalOpen(false),
      }
    );
  };

  // Tab configuration — activeClass uses full Tailwind class names (not dynamic)
  const tabs = [
    {
      id: 'organization',
      icon: Building2,
      label: t('organization'),
      activeClass: 'border-blue-600 text-blue-600',
    },
    {
      id: 'profile',
      icon: User,
      label: t('profile'),
      activeClass: 'border-blue-600 text-blue-600',
    },
    { id: 'users', icon: Users, label: t('users'), activeClass: 'border-blue-600 text-blue-600' },
    {
      id: 'notifications',
      icon: Bell,
      label: t('notifications'),
      activeClass: 'border-blue-600 text-blue-600',
    },
    {
      id: 'integrations',
      icon: Database,
      label: t('integrations'),
      activeClass: 'border-blue-600 text-blue-600',
    },
    {
      id: 'ai',
      icon: Brain,
      label: t('aiAssistant'),
      activeClass: 'border-purple-600 text-purple-600',
    },
    {
      id: 'clinical',
      icon: Stethoscope,
      label: t('clinical'),
      activeClass: 'border-teal-600 text-teal-600',
    },
    {
      id: 'exercises',
      icon: Dumbbell,
      label: t('exercises', 'Øvelser'),
      activeClass: 'border-green-600 text-green-600',
    },
    {
      id: 'autoaccept',
      icon: ToggleLeft,
      label: t('autoAccept'),
      activeClass: 'border-teal-600 text-teal-600',
    },
    {
      id: 'reminders',
      icon: Timer,
      label: t('automatedReminders', 'Automatiske påminnelser'),
      activeClass: 'border-orange-600 text-orange-600',
    },
    {
      id: 'modules',
      icon: Package,
      label: t('moduleManagement', 'Modules'),
      activeClass: 'border-teal-600 text-teal-600',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumbs />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('manageSettings')}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setEditMode(false);
                }}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? tab.activeClass
                    : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:text-white hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <Suspense fallback={<TabLoading />}>
        {activeTab === 'organization' && (
          <OrganizationSettings
            t={t}
            organization={organization}
            orgLoading={orgLoading}
            editMode={editMode}
            formData={formData}
            setFormData={setFormData}
            handleEdit={handleEdit}
            handleCancel={handleCancel}
            handleSave={handleSave}
            updateOrgMutation={updateOrgMutation}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSettings
            t={t}
            currentUser={currentUser}
            userLoading={userLoading}
            editMode={editMode}
            formData={formData}
            setFormData={setFormData}
            handleEdit={handleEdit}
            handleCancel={handleCancel}
            handleSave={handleSave}
            updateUserMutation={updateUserMutation}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement
            t={t}
            organizationUsers={organizationUsers}
            usersLoading={usersLoading}
            handleInviteUser={handleInviteUser}
            inviteUserMutation={inviteUserMutation}
          />
        )}

        {activeTab === 'notifications' && <NotificationSettings t={t} />}

        {activeTab === 'integrations' && <IntegrationSettings t={t} />}

        {activeTab === 'ai' && (
          <>
            <AISettings />
            <div className="mt-6">
              <TrainingDataExport />
            </div>
          </>
        )}

        {activeTab === 'clinical' && (
          <ClinicalSettings
            t={t}
            clinicalPrefs={clinicalPrefs}
            onClinicalPrefChange={handleClinicalPrefChange}
          />
        )}

        {activeTab === 'exercises' && <ExerciseSettings lang={lang} />}

        {activeTab === 'autoaccept' && <AutoAcceptSettings />}

        {activeTab === 'reminders' && <AutomatedRemindersSettings />}

        {activeTab === 'modules' && <ModuleManager />}
      </Suspense>

      {/* Invite User Modal */}
      {inviteModalOpen && (
        <InviteUserModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          onSubmit={handleInviteSubmit}
          isLoading={inviteUserMutation.isPending}
          t={t}
        />
      )}
    </div>
  );
}
