/**
 * ContactUpdate - Kiosk Step: Quick contact info update
 * Large touch targets, pre-filled fields, skip option
 */

import { useState } from 'react';
import { Phone, Mail, ArrowRight, SkipForward } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: 'Is your contact information correct?',
    subtitle: 'Please verify your phone number and email',
    phone: 'Phone',
    email: 'Email',
    noChanges: 'No changes',
    save: 'Save & Continue',
  },
  no: {
    title: 'Er kontaktinformasjonen din riktig?',
    subtitle: 'Bekreft telefonnummer og e-post',
    phone: 'Telefon',
    email: 'E-post',
    noChanges: 'Ingen endringer',
    save: 'Lagre og fortsett',
  },
};

export default function ContactUpdate({ appointment, lang = 'no', onNext, onBack }) {
  const t = TRANSLATIONS[lang];
  const [phone, setPhone] = useState(appointment?.phone || '');
  const [email, setEmail] = useState(appointment?.email || '');

  const handleSave = () => {
    onNext({ phone, email, updated: true });
  };

  const handleSkip = () => {
    onNext({ phone: appointment?.phone, email: appointment?.email, updated: false });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{t.title}</h1>
        <p className="text-lg text-slate-500">{t.subtitle}</p>
      </div>

      <div className="flex-1 space-y-6 max-w-md mx-auto w-full">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
            <Phone className="w-4 h-4" />
            {t.phone}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-4 text-xl border-2 border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
            placeholder="+47 123 45 678"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
            <Mail className="w-4 h-4" />
            {t.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 text-xl border-2 border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
            placeholder="din@epost.no"
          />
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button
          onClick={handleSave}
          className="w-full py-4 bg-teal-600 text-white text-xl font-bold rounded-2xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-3"
        >
          {t.save}
          <ArrowRight className="w-6 h-6" />
        </button>
        <button
          onClick={handleSkip}
          className="w-full py-3 bg-slate-100 text-slate-600 text-lg font-medium rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <SkipForward className="w-5 h-5" />
          {t.noChanges}
        </button>
      </div>
    </div>
  );
}
