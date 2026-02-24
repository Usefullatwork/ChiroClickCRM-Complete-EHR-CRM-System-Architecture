/**
 * Portal Profile - Patient contact info display and edit
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronLeft, Loader2, AlertCircle, CheckCircle, Edit3, Save, X } from 'lucide-react';
import { patientPortalAPI } from '../../services/api';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function PortalProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', email: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getProfile();
      const data = res.data;
      setProfile(data);
      setEditForm({ phone: data.phone || '', email: data.email || '' });
    } catch (err) {
      logger.error('Failed to load profile:', err);
      setError('Kunne ikke laste profilen');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await fetch(`${API_URL}/patient-portal/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      setProfile((prev) => ({ ...prev, ...editForm }));
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      logger.error('Failed to update profile:', err);
      setError('Kunne ikke lagre endringer');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({ phone: profile?.phone || '', email: profile?.email || '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/portal')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-900">Min profil</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Endringer lagret!</span>
          </div>
        )}

        {/* Avatar + Name */}
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {profile?.firstName} {profile?.lastName}
          </h2>
          {profile?.dateOfBirth && (
            <p className="text-sm text-gray-500 mt-1">
              Fodt{' '}
              {new Date(profile.dateOfBirth).toLocaleDateString('nb-NO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Kontaktinformasjon</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700"
              >
                <Edit3 className="w-4 h-4" />
                Rediger
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                  placeholder="+47 123 45 678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                  placeholder="din@epost.no"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Lagre
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Telefon</p>
                <p className="text-gray-900">{profile?.phone || 'Ikke registrert'}</p>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 mb-0.5">E-post</p>
                <p className="text-gray-900">{profile?.email || 'Ikke registrert'}</p>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 mb-0.5">Fodselsdato</p>
                <p className="text-gray-900">
                  {profile?.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString('nb-NO')
                    : 'Ikke registrert'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Privacy note */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500">
            Din personlige informasjon er trygt oppbevart i henhold til norsk lov om helsepersonell
            og GDPR. Kun din behandler og autorisert helsepersonell har tilgang til dine
            journaldata.
          </p>
        </div>
      </div>

      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
        <p>Kontakt klinikken for a oppdatere navn eller fodselsdato</p>
      </footer>
    </div>
  );
}
