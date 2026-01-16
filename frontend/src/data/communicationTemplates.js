/**
 * Communication Templates for SMS and Email
 *
 * Supports 4 tones: direct, kind, professional, empathetic
 * Bilingual: Norwegian (no) and English (en)
 * Categories: appointments, clinical, recalls, billing, engagement, urgent
 */

export const TONES = {
  direct: {
    id: 'direct',
    name: { no: 'Direkte', en: 'Direct' },
    description: { no: 'Kort og effektiv', en: 'Short and efficient' }
  },
  kind: {
    id: 'kind',
    name: { no: 'Vennlig', en: 'Kind' },
    description: { no: 'Varm men effektiv', en: 'Warm but efficient' }
  },
  professional: {
    id: 'professional',
    name: { no: 'Profesjonell', en: 'Professional' },
    description: { no: 'Formell og klinisk', en: 'Formal and clinical' }
  },
  empathetic: {
    id: 'empathetic',
    name: { no: 'Empatisk', en: 'Empathetic' },
    description: { no: 'Støttende og omsorgsfull', en: 'Supportive and caring' }
  }
};

export const CATEGORIES = {
  appointments: {
    id: 'appointments',
    name: { no: 'Avtaler', en: 'Appointments' },
    icon: 'Calendar'
  },
  clinical: {
    id: 'clinical',
    name: { no: 'Klinisk', en: 'Clinical' },
    icon: 'Stethoscope'
  },
  recalls: {
    id: 'recalls',
    name: { no: 'Innkalling', en: 'Recalls' },
    icon: 'RefreshCw'
  },
  billing: {
    id: 'billing',
    name: { no: 'Fakturering', en: 'Billing' },
    icon: 'CreditCard'
  },
  engagement: {
    id: 'engagement',
    name: { no: 'Engasjement', en: 'Engagement' },
    icon: 'Heart'
  },
  urgent: {
    id: 'urgent',
    name: { no: 'Hastesaker', en: 'Urgent' },
    icon: 'AlertTriangle'
  }
};

export const TEMPLATES = [
  // =====================
  // APPOINTMENTS
  // =====================

  // 24-hour reminder
  {
    id: 'reminder-24h-direct',
    category: 'appointments',
    name: { no: '24-timers påminnelse', en: '24-Hour Reminder' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, time i morgen {{date}} kl {{time}} hos {{provider}}. Avbud? Ring {{phone}}.',
      en: 'Hi {{firstName}}, appointment tomorrow {{date}} at {{time}} with {{provider}}. Cancel? Call {{phone}}.'
    },
    variables: ['firstName', 'date', 'time', 'provider', 'phone']
  },
  {
    id: 'reminder-24h-kind',
    category: 'appointments',
    name: { no: '24-timers påminnelse', en: '24-Hour Reminder' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}! Vi gleder oss til å se deg i morgen {{date}} kl {{time}}. Gi beskjed om noe endrer seg. Ha en fin dag!',
      en: 'Hi {{firstName}}! Looking forward to seeing you tomorrow {{date}} at {{time}}. Let us know if anything changes. Have a great day!'
    },
    variables: ['firstName', 'date', 'time']
  },
  {
    id: 'reminder-24h-professional',
    category: 'appointments',
    name: { no: '24-timers påminnelse', en: '24-Hour Reminder' },
    tone: 'professional',
    type: 'sms',
    content: {
      no: 'Påminnelse: Du har time hos {{provider}} i morgen {{date}} kl {{time}}. Ved avbud, kontakt oss på {{phone}}.',
      en: 'Reminder: Your appointment with {{provider}} is scheduled for tomorrow {{date}} at {{time}}. To reschedule, contact {{phone}}.'
    },
    variables: ['firstName', 'date', 'time', 'provider', 'phone']
  },

  // 7-day reminder
  {
    id: 'reminder-7days-direct',
    category: 'appointments',
    name: { no: 'Ukes-påminnelse', en: 'Week Reminder' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, time {{date}} kl {{time}}. Endre? Ring {{phone}}.',
      en: 'Hi {{firstName}}, appointment {{date}} at {{time}}. Change? Call {{phone}}.'
    },
    variables: ['firstName', 'date', 'time', 'phone']
  },
  {
    id: 'reminder-7days-kind',
    category: 'appointments',
    name: { no: 'Ukes-påminnelse', en: 'Week Reminder' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}! En påminnelse om at du har time hos oss {{date}} kl {{time}}. Vi ser frem til å se deg!',
      en: 'Hi {{firstName}}! Just a reminder that you have an appointment on {{date}} at {{time}}. We look forward to seeing you!'
    },
    variables: ['firstName', 'date', 'time']
  },

  // Confirmation
  {
    id: 'confirmation-direct',
    category: 'appointments',
    name: { no: 'Bekreftelse', en: 'Confirmation' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Time bekreftet: {{date}} kl {{time}} hos {{provider}}. Adresse: {{address}}.',
      en: 'Appointment confirmed: {{date}} at {{time}} with {{provider}}. Address: {{address}}.'
    },
    variables: ['date', 'time', 'provider', 'address']
  },
  {
    id: 'confirmation-kind',
    category: 'appointments',
    name: { no: 'Bekreftelse', en: 'Confirmation' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Takk for bestillingen, {{firstName}}! Din time er {{date}} kl {{time}}. Vi gleder oss til å se deg!',
      en: 'Thank you for booking, {{firstName}}! Your appointment is {{date}} at {{time}}. We look forward to seeing you!'
    },
    variables: ['firstName', 'date', 'time']
  },

  // No-show follow-up
  {
    id: 'noshow-direct',
    category: 'appointments',
    name: { no: 'Uteblitt time', en: 'No-Show Follow-up' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, du møtte ikke til time i dag. Ring {{phone}} for ny time.',
      en: 'Hi {{firstName}}, you missed your appointment today. Call {{phone}} to reschedule.'
    },
    variables: ['firstName', 'phone']
  },
  {
    id: 'noshow-kind',
    category: 'appointments',
    name: { no: 'Uteblitt time', en: 'No-Show Follow-up' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, vi savnet deg på timen i dag! Håper alt er bra. Ring oss på {{phone}} når du ønsker ny time.',
      en: 'Hi {{firstName}}, we missed you at your appointment today! Hope everything is okay. Call us at {{phone}} when you want to reschedule.'
    },
    variables: ['firstName', 'phone']
  },
  {
    id: 'noshow-empathetic',
    category: 'appointments',
    name: { no: 'Uteblitt time', en: 'No-Show Follow-up' },
    tone: 'empathetic',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, vi forstår at ting skjer. Vi savnet deg på timen i dag. Når du er klar, er vi her for å hjelpe. Ring {{phone}}.',
      en: 'Hi {{firstName}}, we understand things happen. We missed you at your appointment today. When you are ready, we are here to help. Call {{phone}}.'
    },
    variables: ['firstName', 'phone']
  },

  // =====================
  // CLINICAL
  // =====================

  // Post-visit check-in
  {
    id: 'postvisit-direct',
    category: 'clinical',
    name: { no: 'Oppfølging etter time', en: 'Post-Visit Check-in' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, hvordan går det etter timen? Svar eller ring {{phone}} ved spørsmål.',
      en: 'Hi {{firstName}}, how are you doing after your visit? Reply or call {{phone}} if questions.'
    },
    variables: ['firstName', 'phone']
  },
  {
    id: 'postvisit-kind',
    category: 'clinical',
    name: { no: 'Oppfølging etter time', en: 'Post-Visit Check-in' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}! Håper du har det bra etter behandlingen. Vi er her om du lurer på noe. God bedring!',
      en: 'Hi {{firstName}}! Hope you are feeling well after your treatment. We are here if you have any questions. Wishing you a speedy recovery!'
    },
    variables: ['firstName']
  },
  {
    id: 'postvisit-empathetic',
    category: 'clinical',
    name: { no: 'Oppfølging etter time', en: 'Post-Visit Check-in' },
    tone: 'empathetic',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, vi tenker på deg og håper du merker bedring. Ta kontakt hvis det er noe vi kan gjøre for deg.',
      en: 'Hi {{firstName}}, we are thinking of you and hope you are feeling better. Reach out if there is anything we can do for you.'
    },
    variables: ['firstName']
  },

  // Treatment instructions
  {
    id: 'treatment-instructions-direct',
    category: 'clinical',
    name: { no: 'Behandlingsinstruksjoner', en: 'Treatment Instructions' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Husk: {{instructions}}. Spørsmål? Ring {{phone}}.',
      en: 'Remember: {{instructions}}. Questions? Call {{phone}}.'
    },
    variables: ['instructions', 'phone']
  },
  {
    id: 'treatment-instructions-professional',
    category: 'clinical',
    name: { no: 'Behandlingsinstruksjoner', en: 'Treatment Instructions' },
    tone: 'professional',
    type: 'sms',
    content: {
      no: 'Instruksjoner etter behandling: {{instructions}}. Ved spørsmål, kontakt klinikken på {{phone}}.',
      en: 'Post-treatment instructions: {{instructions}}. For questions, contact the clinic at {{phone}}.'
    },
    variables: ['instructions', 'phone']
  },

  // Exercise reminder
  {
    id: 'exercise-reminder-direct',
    category: 'clinical',
    name: { no: 'Øvelsespåminnelse', en: 'Exercise Reminder' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Husk øvelsene dine i dag! Se instruksjonene: {{link}}',
      en: 'Remember your exercises today! See instructions: {{link}}'
    },
    variables: ['link']
  },
  {
    id: 'exercise-reminder-kind',
    category: 'clinical',
    name: { no: 'Øvelsespåminnelse', en: 'Exercise Reminder' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}! Bare en vennlig påminnelse om øvelsene dine. Du gjør det flott! 💪',
      en: 'Hi {{firstName}}! Just a friendly reminder about your exercises. You are doing great! 💪'
    },
    variables: ['firstName']
  },

  // =====================
  // RECALLS
  // =====================

  // Inactive patient recall
  {
    id: 'recall-inactive-direct',
    category: 'recalls',
    name: { no: 'Inaktiv pasient', en: 'Inactive Patient' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, vi har ikke sett deg på en stund. Bestill time: {{link}} eller ring {{phone}}.',
      en: 'Hi {{firstName}}, we have not seen you in a while. Book appointment: {{link}} or call {{phone}}.'
    },
    variables: ['firstName', 'link', 'phone']
  },
  {
    id: 'recall-inactive-kind',
    category: 'recalls',
    name: { no: 'Inaktiv pasient', en: 'Inactive Patient' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}! Vi har savnet deg! Hvordan har du det? Vi er her når du trenger oss. Bestill time: {{link}}',
      en: 'Hi {{firstName}}! We have missed you! How are you doing? We are here when you need us. Book appointment: {{link}}'
    },
    variables: ['firstName', 'link']
  },
  {
    id: 'recall-inactive-empathetic',
    category: 'recalls',
    name: { no: 'Inaktiv pasient', en: 'Inactive Patient' },
    tone: 'empathetic',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, vi håper alt er bra med deg. Vi er her for deg når du er klar. Ingen press, bare gi oss en lyd når det passer.',
      en: 'Hi {{firstName}}, we hope everything is well with you. We are here for you when you are ready. No pressure, just reach out when it suits you.'
    },
    variables: ['firstName']
  },

  // Annual checkup
  {
    id: 'recall-annual-direct',
    category: 'recalls',
    name: { no: 'Årlig kontroll', en: 'Annual Checkup' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, tid for årlig kontroll. Bestill: {{link}} eller ring {{phone}}.',
      en: 'Hi {{firstName}}, time for your annual checkup. Book: {{link}} or call {{phone}}.'
    },
    variables: ['firstName', 'link', 'phone']
  },
  {
    id: 'recall-annual-professional',
    category: 'recalls',
    name: { no: 'Årlig kontroll', en: 'Annual Checkup' },
    tone: 'professional',
    type: 'sms',
    content: {
      no: 'Ifølge våre journaler er det tid for din årlige kontroll. Vennligst bestill time via {{link}} eller ring {{phone}}.',
      en: 'According to our records, it is time for your annual checkup. Please schedule via {{link}} or call {{phone}}.'
    },
    variables: ['firstName', 'link', 'phone']
  },

  // Wellness reminder
  {
    id: 'recall-wellness-kind',
    category: 'recalls',
    name: { no: 'Velværepåminnelse', en: 'Wellness Reminder' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}! Tenkte vi skulle høre hvordan det går. Forebyggende behandling kan hjelpe deg holde deg frisk. Bestill: {{link}}',
      en: 'Hi {{firstName}}! Just checking in to see how you are doing. Preventive care can help you stay healthy. Book: {{link}}'
    },
    variables: ['firstName', 'link']
  },

  // =====================
  // BILLING
  // =====================

  // Payment due
  {
    id: 'payment-due-direct',
    category: 'billing',
    name: { no: 'Betalingspåminnelse', en: 'Payment Due' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Utestående: {{amount}} kr. Forfallsdato: {{dueDate}}. Betal: {{link}}',
      en: 'Outstanding: {{amount}}. Due: {{dueDate}}. Pay: {{link}}'
    },
    variables: ['amount', 'dueDate', 'link']
  },
  {
    id: 'payment-due-professional',
    category: 'billing',
    name: { no: 'Betalingspåminnelse', en: 'Payment Due' },
    tone: 'professional',
    type: 'sms',
    content: {
      no: 'Du har en utestående faktura på {{amount}} kr med forfallsdato {{dueDate}}. Betal sikkert via: {{link}}',
      en: 'You have an outstanding invoice of {{amount}} due {{dueDate}}. Pay securely at: {{link}}'
    },
    variables: ['amount', 'dueDate', 'link']
  },
  {
    id: 'payment-due-kind',
    category: 'billing',
    name: { no: 'Betalingspåminnelse', en: 'Payment Due' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, en vennlig påminnelse om utestående {{amount}} kr. Betal enkelt her: {{link}}. Spørsmål? Ring oss!',
      en: 'Hi {{firstName}}, a friendly reminder about your outstanding balance of {{amount}}. Pay easily here: {{link}}. Questions? Call us!'
    },
    variables: ['firstName', 'amount', 'link']
  },

  // Payment received
  {
    id: 'payment-received-direct',
    category: 'billing',
    name: { no: 'Betaling mottatt', en: 'Payment Received' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Betaling mottatt: {{amount}} kr. Takk!',
      en: 'Payment received: {{amount}}. Thank you!'
    },
    variables: ['amount']
  },
  {
    id: 'payment-received-kind',
    category: 'billing',
    name: { no: 'Betaling mottatt', en: 'Payment Received' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Tusen takk for betalingen på {{amount}} kr, {{firstName}}! Din konto er oppdatert.',
      en: 'Thank you so much for your payment of {{amount}}, {{firstName}}! Your account is up to date.'
    },
    variables: ['firstName', 'amount']
  },

  // Insurance update needed
  {
    id: 'insurance-update-direct',
    category: 'billing',
    name: { no: 'Forsikringsoppdatering', en: 'Insurance Update' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Vi trenger oppdatert forsikringsinformasjon. Ring {{phone}} eller svar på denne meldingen.',
      en: 'We need updated insurance information. Call {{phone}} or reply to this message.'
    },
    variables: ['phone']
  },

  // =====================
  // ENGAGEMENT
  // =====================

  // Welcome new patient
  {
    id: 'welcome-direct',
    category: 'engagement',
    name: { no: 'Velkommen ny pasient', en: 'Welcome New Patient' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Velkommen til {{clinic}}! Første time: {{date}} kl {{time}}. Møt opp 15 min før.',
      en: 'Welcome to {{clinic}}! First appointment: {{date}} at {{time}}. Arrive 15 min early.'
    },
    variables: ['clinic', 'date', 'time']
  },
  {
    id: 'welcome-kind',
    category: 'engagement',
    name: { no: 'Velkommen ny pasient', en: 'Welcome New Patient' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Velkommen til {{clinic}}, {{firstName}}! Vi er så glade for å ha deg. Din første time er {{date}} kl {{time}}. Vi gleder oss!',
      en: 'Welcome to {{clinic}}, {{firstName}}! We are so happy to have you. Your first appointment is {{date}} at {{time}}. We are excited to meet you!'
    },
    variables: ['firstName', 'clinic', 'date', 'time']
  },
  {
    id: 'welcome-professional',
    category: 'engagement',
    name: { no: 'Velkommen ny pasient', en: 'Welcome New Patient' },
    tone: 'professional',
    type: 'sms',
    content: {
      no: 'Velkommen som pasient hos {{clinic}}. Din første konsultasjon er planlagt til {{date}} kl {{time}}. Vennligst ankom 15 minutter før.',
      en: 'Welcome as a patient at {{clinic}}. Your initial consultation is scheduled for {{date}} at {{time}}. Please arrive 15 minutes early.'
    },
    variables: ['clinic', 'date', 'time']
  },

  // Birthday
  {
    id: 'birthday-kind',
    category: 'engagement',
    name: { no: 'Gratulerer med dagen', en: 'Happy Birthday' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Gratulerer med dagen, {{firstName}}! 🎂 Vi ønsker deg en fantastisk dag! Hilsen alle oss på {{clinic}}.',
      en: 'Happy Birthday, {{firstName}}! 🎂 We wish you a wonderful day! Best wishes from everyone at {{clinic}}.'
    },
    variables: ['firstName', 'clinic']
  },

  // Feedback request
  {
    id: 'feedback-direct',
    category: 'engagement',
    name: { no: 'Tilbakemelding', en: 'Feedback Request' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, hvordan var besøket? Gi tilbakemelding (1 min): {{link}}',
      en: 'Hi {{firstName}}, how was your visit? Give feedback (1 min): {{link}}'
    },
    variables: ['firstName', 'link']
  },
  {
    id: 'feedback-kind',
    category: 'engagement',
    name: { no: 'Tilbakemelding', en: 'Feedback Request' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}! Vi setter pris på din mening. Kan du ta 1 minutt og dele hvordan besøket var? {{link}} Tusen takk!',
      en: 'Hi {{firstName}}! We value your opinion. Could you take 1 minute to share how your visit was? {{link}} Thank you so much!'
    },
    variables: ['firstName', 'link']
  },

  // Review invitation
  {
    id: 'review-direct',
    category: 'engagement',
    name: { no: 'Anmeldelse', en: 'Review Invitation' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Fornøyd med behandlingen? Legg igjen en anmeldelse: {{link}}',
      en: 'Happy with your treatment? Leave a review: {{link}}'
    },
    variables: ['link']
  },
  {
    id: 'review-kind',
    category: 'engagement',
    name: { no: 'Anmeldelse', en: 'Review Invitation' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}! Hvis du er fornøyd, ville vi satt stor pris på en anmeldelse. Det hjelper andre å finne oss! {{link}}',
      en: 'Hi {{firstName}}! If you are happy with us, we would really appreciate a review. It helps others find us! {{link}}'
    },
    variables: ['firstName', 'link']
  },

  // =====================
  // URGENT
  // =====================

  // Office closure
  {
    id: 'closure-direct',
    category: 'urgent',
    name: { no: 'Stengt', en: 'Office Closure' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'VIKTIG: {{clinic}} er stengt {{date}} pga {{reason}}. Din time er flyttet til {{newDate}}. Ring {{phone}} ved spørsmål.',
      en: 'IMPORTANT: {{clinic}} is closed {{date}} due to {{reason}}. Your appointment moved to {{newDate}}. Call {{phone}} with questions.'
    },
    variables: ['clinic', 'date', 'reason', 'newDate', 'phone']
  },
  {
    id: 'closure-professional',
    category: 'urgent',
    name: { no: 'Stengt', en: 'Office Closure' },
    tone: 'professional',
    type: 'sms',
    content: {
      no: 'Viktig melding: {{clinic}} holder stengt {{date}} grunnet {{reason}}. Alle avtaler er automatisk omplanlagt. For mer informasjon, kontakt {{phone}}.',
      en: 'Important notice: {{clinic}} will be closed {{date}} due to {{reason}}. All appointments have been automatically rescheduled. For more information, contact {{phone}}.'
    },
    variables: ['clinic', 'date', 'reason', 'phone']
  },

  // Schedule change
  {
    id: 'schedule-change-direct',
    category: 'urgent',
    name: { no: 'Timeendring', en: 'Schedule Change' },
    tone: 'direct',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, din time er endret til {{newDate}} kl {{newTime}}. OK? Svar JA eller ring {{phone}}.',
      en: 'Hi {{firstName}}, your appointment changed to {{newDate}} at {{newTime}}. OK? Reply YES or call {{phone}}.'
    },
    variables: ['firstName', 'newDate', 'newTime', 'phone']
  },
  {
    id: 'schedule-change-kind',
    category: 'urgent',
    name: { no: 'Timeendring', en: 'Schedule Change' },
    tone: 'kind',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, vi beklager, men vi måtte flytte timen din til {{newDate}} kl {{newTime}}. Passer dette for deg? Gi oss beskjed!',
      en: 'Hi {{firstName}}, we apologize, but we had to move your appointment to {{newDate}} at {{newTime}}. Does this work for you? Let us know!'
    },
    variables: ['firstName', 'newDate', 'newTime']
  },
  {
    id: 'schedule-change-empathetic',
    category: 'urgent',
    name: { no: 'Timeendring', en: 'Schedule Change' },
    tone: 'empathetic',
    type: 'sms',
    content: {
      no: 'Hei {{firstName}}, vi beklager så mye at vi må flytte timen din. Den nye tiden er {{newDate}} kl {{newTime}}. Vi forstår om dette er upraktisk - ring oss på {{phone}} så finner vi en bedre tid sammen.',
      en: 'Hi {{firstName}}, we are so sorry we have to move your appointment. The new time is {{newDate}} at {{newTime}}. We understand if this is inconvenient - call us at {{phone}} and we will find a better time together.'
    },
    variables: ['firstName', 'newDate', 'newTime', 'phone']
  }
];

// Email templates (longer format)
export const EMAIL_TEMPLATES = [
  {
    id: 'email-welcome-professional',
    category: 'engagement',
    name: { no: 'Velkomst-epost', en: 'Welcome Email' },
    tone: 'professional',
    type: 'email',
    subject: {
      no: 'Velkommen til {{clinic}}',
      en: 'Welcome to {{clinic}}'
    },
    content: {
      no: `Kjære {{firstName}},

Velkommen som pasient hos {{clinic}}. Vi gleder oss til å hjelpe deg med din helse.

Din første time er planlagt til:
Dato: {{date}}
Tid: {{time}}
Behandler: {{provider}}

Vennligst møt opp 15 minutter før for å fylle ut nødvendige skjemaer.

Ta med:
- Gyldig ID
- Eventuell henvisning
- Liste over medisiner du bruker

Ved spørsmål, kontakt oss på {{phone}} eller svar på denne e-posten.

Med vennlig hilsen,
{{clinic}}`,
      en: `Dear {{firstName}},

Welcome as a patient at {{clinic}}. We look forward to helping you with your health.

Your first appointment is scheduled for:
Date: {{date}}
Time: {{time}}
Provider: {{provider}}

Please arrive 15 minutes early to complete necessary forms.

Bring with you:
- Valid ID
- Any referral documents
- List of current medications

For questions, contact us at {{phone}} or reply to this email.

Best regards,
{{clinic}}`
    },
    variables: ['firstName', 'clinic', 'date', 'time', 'provider', 'phone']
  },
  {
    id: 'email-treatment-summary-professional',
    category: 'clinical',
    name: { no: 'Behandlingssammendrag', en: 'Treatment Summary' },
    tone: 'professional',
    type: 'email',
    subject: {
      no: 'Sammendrag av din behandling {{date}}',
      en: 'Summary of your treatment {{date}}'
    },
    content: {
      no: `Kjære {{firstName}},

Her er et sammendrag av din behandling den {{date}}:

Diagnose: {{diagnosis}}
Behandling utført: {{treatment}}

Anbefalinger:
{{recommendations}}

Neste time: {{nextAppointment}}

Ved spørsmål, ikke nøl med å kontakte oss.

Med vennlig hilsen,
{{provider}}
{{clinic}}`,
      en: `Dear {{firstName}},

Here is a summary of your treatment on {{date}}:

Diagnosis: {{diagnosis}}
Treatment performed: {{treatment}}

Recommendations:
{{recommendations}}

Next appointment: {{nextAppointment}}

If you have any questions, please do not hesitate to contact us.

Best regards,
{{provider}}
{{clinic}}`
    },
    variables: ['firstName', 'date', 'diagnosis', 'treatment', 'recommendations', 'nextAppointment', 'provider', 'clinic']
  }
];

// Helper functions
export function getTemplatesByCategory(category) {
  return TEMPLATES.filter(t => t.category === category);
}

export function getTemplatesByTone(tone) {
  return TEMPLATES.filter(t => t.tone === tone);
}

export function getTemplatesByCategoryAndTone(category, tone) {
  return TEMPLATES.filter(t => t.category === category && t.tone === tone);
}

export function substituteVariables(template, variables) {
  let content = template;
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return content;
}

export default TEMPLATES;
