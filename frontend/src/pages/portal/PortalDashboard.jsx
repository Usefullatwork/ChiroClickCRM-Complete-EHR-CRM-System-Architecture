/**
 * Portal Dashboard - Patient overview page
 * Shows next appointment, exercises due, pending outcomes, quick links
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Dumbbell,
  ClipboardList,
  User,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  LogOut,
} from 'lucide-react';
import { patientPortalAPI } from '../../services/api';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function PortalDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, apptRes, exRes] = await Promise.allSettled([
        patientPortalAPI.getProfile(),
        patientPortalAPI.getAppointments(),
        patientPortalAPI.getExercises(),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
      }
      if (apptRes.status === 'fulfilled') {
        setAppointments(apptRes.value.data?.appointments || []);
      }
      if (exRes.status === 'fulfilled') {
        setExercises(exRes.value.data?.exercises || []);
      }
    } catch (err) {
      logger.error('Portal dashboard load error:', err);
      setError('Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/patient-portal/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    }
    navigate('/portal/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laster pasientportalen...</p>
        </div>
      </div>
    );
  }

  const nextAppointment = appointments[0] || null;
  const activeExercises = exercises.filter((e) => e.status === 'active');

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Hei, {profile?.firstName || 'Pasient'}!
            </h1>
            <p className="text-sm text-gray-500">Pasientportalen</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Logg ut"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Next Appointment Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Neste time
          </h2>
          {nextAppointment ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(nextAppointment.appointment_date).toLocaleDateString('nb-NO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <div className="flex items-center gap-2 mt-1 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>
                    {nextAppointment.appointment_time?.slice(0, 5)} &bull;{' '}
                    {nextAppointment.visit_type || 'Konsultasjon'}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Ingen kommende timer</p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Dumbbell className="w-3.5 h-3.5" />
              Aktive ovelser
            </div>
            <div className="text-2xl font-bold text-gray-900">{activeExercises.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Timer
            </div>
            <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-500 px-1">Hurtiglenker</h2>
          {[
            {
              icon: Calendar,
              label: 'Mine timer',
              desc: 'Se og administrer timer',
              path: '/portal/appointments',
              color: 'text-blue-600',
              bg: 'bg-blue-100',
            },
            {
              icon: Dumbbell,
              label: 'Mine ovelser',
              desc: 'Se treningsprogram',
              path: '/portal/exercises',
              color: 'text-green-600',
              bg: 'bg-green-100',
            },
            {
              icon: ClipboardList,
              label: 'Skjemaer',
              desc: 'Fyll ut sporreskjemaer',
              path: '/portal/outcomes',
              color: 'text-purple-600',
              bg: 'bg-purple-100',
            },
            {
              icon: User,
              label: 'Min profil',
              desc: 'Oppdater kontaktinfo',
              path: '/portal/profile',
              color: 'text-orange-600',
              bg: 'bg-orange-100',
            },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className={`w-10 h-10 ${item.bg} rounded-full flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
        <p>Ved sporsmal, kontakt din behandler</p>
        <p className="mt-1">ChiroClick CRM</p>
      </footer>
    </div>
  );
}
