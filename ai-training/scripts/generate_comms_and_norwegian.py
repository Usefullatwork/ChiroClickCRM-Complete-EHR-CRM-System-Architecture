#!/usr/bin/env python3
"""
Generate communication (SMS/recall) and Norwegian formal medical terminology
training data for chiro-norwegian and chiro-no models.

Creates 200 training examples:
  - 50 SMS templates (appointment, cancel, waitlist, treatment plan, new patient)
  - 50 Recall messages (3-month, 6-month, annual, seasonal, post-treatment)
  - 50 Formal medical terminology (clinical notes with formal vs colloquial)
  - 50 Professional letters/reports (referrals, insurance, sick leave, summaries)

Problems addressed:
  - Communication: Model writes too-verbose SMS (needs max 160 chars)
  - Norwegian: Model uses colloquial ("vondt i ryggen") instead of formal ("lumbalgi")

Output: ChatML format compatible with train_unsloth.py
"""

import json
import random
import sys
from pathlib import Path

# ============================================================
# System Prompts
# ============================================================

SMS_SYSTEM = (
    'Du skriver korte SMS-meldinger for kiropraktisk klinikk KFA Majorstuen. '
    'Maks 160 tegn. Vær vennlig og profesjonell.'
)

RECALL_SYSTEM = (
    'Du skriver gjeninnkallingsmeldinger for kiropraktisk klinikk. '
    'Vær vennlig, profesjonell og ikke påtrengende. Maks 200 tegn.'
)

FORMAL_SYSTEM = (
    'Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge. '
    'Bruk formelt medisinsk språk. Skriv ALDRI dagligtale eller uformelle uttrykk.'
)

LETTER_SYSTEM = (
    'Du skriver formelle medisinske rapporter og brev for kiropraktisk klinikk i Norge. '
    'Bruk profesjonelt medisinsk språk som ville brukes i offisiell korrespondanse.'
)

# ============================================================
# Part A1: SMS Templates — Appointment Reminders (10)
# ============================================================

SMS_APPOINTMENT_REMINDERS = [
    {
        'input': 'SMS påminnelse: Time i morgen kl 14:30 hos Kiropraktor Olsen',
        'output': 'Hei! Påminnelse: Time hos Kiropraktor Olsen, KFA Majorstuen, i morgen kl 14:30. Velkommen! Avbestill senest 24t før.'
    },
    {
        'input': 'SMS påminnelse: Time i dag kl 09:00 hos Kiropraktor Hansen',
        'output': 'Hei! Du har time hos Kiropraktor Hansen, KFA Majorstuen, i dag kl 09:00. Vi gleder oss til å se deg! Mvh KFA.'
    },
    {
        'input': 'SMS påminnelse: Time i morgen kl 16:00 hos Kiropraktor Berg',
        'output': 'Påminnelse: Time hos Kiropraktor Berg, KFA Majorstuen, i morgen kl 16:00. Avbestill senest 24t før. Velkommen!'
    },
    {
        'input': 'SMS påminnelse: Time i morgen kl 11:30 hos Kiropraktor Lund',
        'output': 'Hei! Time hos Kiropraktor Lund ved KFA Majorstuen i morgen kl 11:30. Husk å gi beskjed ved forfall. Vel møtt!'
    },
    {
        'input': 'SMS påminnelse: Time i dag kl 13:00 hos Kiropraktor Dahl',
        'output': 'Hei! Vennlig påminnelse: Time kl 13:00 i dag hos Kiropraktor Dahl, KFA Majorstuen. Vi ser frem til å ta imot deg!'
    },
    {
        'input': 'SMS påminnelse: Time i morgen kl 08:30 hos Kiropraktor Eriksen',
        'output': 'Påminnelse: Du har time i morgen kl 08:30 hos Kiropraktor Eriksen, KFA Majorstuen. Avbestill min. 24t før. Velkommen!'
    },
    {
        'input': 'SMS påminnelse: Time fredag kl 15:00 hos Kiropraktor Nilsen',
        'output': 'Hei! Time hos Kiropraktor Nilsen, KFA Majorstuen, fredag kl 15:00. Gi beskjed senest 24t før ved avbestilling. Mvh KFA.'
    },
    {
        'input': 'SMS påminnelse: Time i morgen kl 10:00 hos Kiropraktor Johansen',
        'output': 'Hei! Påminnelse om din time i morgen kl 10:00 hos Kiropraktor Johansen, KFA Majorstuen. Velkommen! Mvh KFA.'
    },
    {
        'input': 'SMS påminnelse: Time mandag kl 12:00 hos Kiropraktor Haugen',
        'output': 'Påminnelse: Time mandag kl 12:00 hos Kiropraktor Haugen, KFA Majorstuen. Avbestill 24t før. Vi ser deg da!'
    },
    {
        'input': 'SMS påminnelse: Time i dag kl 17:00 hos Kiropraktor Moen',
        'output': 'Hei! Du har time kl 17:00 i dag hos Kiropraktor Moen, KFA Majorstuen. Gi beskjed om du ikke kan komme. Velkommen!'
    },
]

# ============================================================
# Part A1: SMS Templates — Cancellation Confirmations (10)
# ============================================================

SMS_CANCELLATIONS = [
    {
        'input': 'SMS bekreftelse avbestilling: Time 15. mars kl 14:00',
        'output': 'Hei! Din time 15. mars kl 14:00 ved KFA Majorstuen er avbestilt. Ring 22 12 34 56 for ny time. Mvh KFA.'
    },
    {
        'input': 'SMS bekreftelse avbestilling: Time i morgen kl 09:30',
        'output': 'Avbestilling bekreftet: Din time i morgen kl 09:30 er kansellert. Book ny time på nett eller ring oss. Mvh KFA Majorstuen.'
    },
    {
        'input': 'SMS bekreftelse avbestilling: Time fredag kl 11:00',
        'output': 'Hei! Time fredag kl 11:00 er avbestilt. Ønsker du ny time? Book online eller ring KFA Majorstuen. Vi hjelper deg gjerne!'
    },
    {
        'input': 'SMS bekreftelse avbestilling: Time hos Kiropraktor Berg',
        'output': 'Bekreftet: Time hos Kiropraktor Berg er avbestilt. Vi anbefaler å booke ny time snart. Ring oss på 22 12 34 56. Mvh KFA.'
    },
    {
        'input': 'SMS bekreftelse avbestilling: Time 20. mars kl 16:30',
        'output': 'Hei! Din time 20. mars kl 16:30 ved KFA Majorstuen er kansellert. Book gjerne ny time online. God dag! Mvh KFA.'
    },
    {
        'input': 'SMS bekreftelse avbestilling: Time onsdag kl 13:00',
        'output': 'Time onsdag kl 13:00 er avbestilt. Husk at du kan booke ny time døgnet rundt via vår nettside. Mvh KFA Majorstuen.'
    },
    {
        'input': 'SMS bekreftelse avbestilling og anbefale rebooking',
        'output': 'Hei! Avbestilling bekreftet. Vi anbefaler oppfølging innen 2 uker. Book ny time: onlinebooking KFA Majorstuen. God bedring!'
    },
    {
        'input': 'SMS bekreftelse avbestilling: Neste time om 1 uke',
        'output': 'Avbestilling mottatt. Neste ledige tid er om 1 uke. Skal vi sette deg opp? Ring KFA Majorstuen 22 12 34 56. Mvh KFA.'
    },
    {
        'input': 'SMS bekreftelse avbestilling: Sent varsel',
        'output': 'Hei! Time er avbestilt. Merk: Avbestilling under 24t kan medføre gebyr. Book gjerne ny tid. Mvh KFA Majorstuen.'
    },
    {
        'input': 'SMS bekreftelse avbestilling: Behandlingsserie',
        'output': 'Time avbestilt. Du har 3 gjenværende behandlinger. Book ny tid snart for å holde fremdriften. Mvh KFA Majorstuen.'
    },
]

# ============================================================
# Part A1: SMS Templates — Waitlist Notifications (10)
# ============================================================

SMS_WAITLIST = [
    {
        'input': 'SMS venteliste: Ledig time i morgen kl 10:00',
        'output': 'Hei! Ledig time i morgen kl 10:00 ved KFA Majorstuen. Ønsker du den? Svar JA innen kl 18:00 i dag. Mvh KFA.'
    },
    {
        'input': 'SMS venteliste: Ledig time i dag kl 15:30',
        'output': 'Hei! Avbestilling gir ledig time i dag kl 15:30 på Majorstuen. Passer det? Svar JA så snart som mulig. Mvh KFA.'
    },
    {
        'input': 'SMS venteliste: Ledig time onsdag kl 09:00',
        'output': 'Ledig time onsdag kl 09:00 ved KFA Majorstuen! Du står på ventelisten. Interessert? Svar JA innen i morgen. Mvh KFA.'
    },
    {
        'input': 'SMS venteliste: Ledig time fredag kl 14:00 hos Kiropraktor Olsen',
        'output': 'Hei! Ledig time hos Kiropraktor Olsen, fredag kl 14:00 på Majorstuen. Ønsker du den? Svar JA i dag. Mvh KFA.'
    },
    {
        'input': 'SMS venteliste: Ledig time mandag kl 08:00',
        'output': 'Tidlig time ledig! Mandag kl 08:00 ved KFA Majorstuen. Du er først på ventelisten. Svar JA for å bekrefte. Mvh KFA.'
    },
    {
        'input': 'SMS venteliste: Ledig time torsdag kl 17:00',
        'output': 'Hei! Kveldstid ledig torsdag kl 17:00 ved KFA Majorstuen. Passer det for deg? Svar JA eller ring oss. Mvh KFA.'
    },
    {
        'input': 'SMS venteliste: Ledig time i morgen kl 12:30 hos Kiropraktor Hansen',
        'output': 'Ledig time i morgen kl 12:30 hos Kiropraktor Hansen, KFA Majorstuen. Skal vi booke den for deg? Svar JA. Mvh KFA.'
    },
    {
        'input': 'SMS venteliste: To ledige tider denne uken',
        'output': 'Hei! To ledige tider denne uken ved KFA Majorstuen. Ring 22 12 34 56 for å velge tid. Først til mølla! Mvh KFA.'
    },
    {
        'input': 'SMS venteliste: Ledig time i dag kl 11:00 (akutt)',
        'output': 'Hei! Akutt ledig time i dag kl 11:00 ved KFA Majorstuen. Vil du ha den? Svar JA nå. Timen frigis kl 10:00. Mvh KFA.'
    },
    {
        'input': 'SMS venteliste: Ledig time neste uke tirsdag kl 13:00',
        'output': 'Ledig time tirsdag neste uke kl 13:00 ved KFA Majorstuen. Passer det? Svar JA innen fredag. Mvh KFA.'
    },
]

# ============================================================
# Part A1: SMS Templates — Treatment Plan Summaries (10)
# ============================================================

SMS_TREATMENT_PLAN = [
    {
        'input': 'SMS behandlingsoversikt: 3 av 6 behandlinger gjennomført',
        'output': 'Hei! Du har fullført 3 av 6 behandlinger ved KFA Majorstuen. Neste time: onsdag kl 14:00. God fremgang! Mvh KFA.'
    },
    {
        'input': 'SMS behandlingsoversikt: 5 av 6 behandlinger gjennomført',
        'output': 'Hei! 5 av 6 behandlinger fullført på KFA Majorstuen. Siste time: fredag kl 10:00. Vi gjør en evaluering da. Mvh KFA.'
    },
    {
        'input': 'SMS behandlingsoversikt: Alle 8 behandlinger fullført',
        'output': 'Gratulerer! Alle 8 behandlinger ved KFA Majorstuen er fullført. Vi anbefaler kontroll om 6 uker. Book online. Mvh KFA.'
    },
    {
        'input': 'SMS behandlingsoversikt: 2 av 4 behandlinger, neste mandag',
        'output': 'Hei! 2 av 4 behandlinger gjennomført. Neste time: mandag kl 09:30 på KFA Majorstuen. Fortsett med øvelsene! Mvh KFA.'
    },
    {
        'input': 'SMS behandlingsoversikt: 1 av 6 behandlinger gjennomført',
        'output': 'Første behandling fullført! 5 gjenstår ved KFA Majorstuen. Neste time: torsdag kl 16:00. Husk hjemmeøvelsene. Mvh KFA.'
    },
    {
        'input': 'SMS behandlingsoversikt: Evaluering etter 4 behandlinger',
        'output': 'Hei! 4 behandlinger fullført. Vi evaluerer fremgangen ved neste time kl 11:00 på KFA Majorstuen. Vel møtt! Mvh KFA.'
    },
    {
        'input': 'SMS behandlingsoversikt: Overgang til vedlikehold',
        'output': 'Hei! Intensivfasen er over. Vi anbefaler vedlikehold 1x/mnd ved KFA Majorstuen. Book neste time online. Mvh KFA.'
    },
    {
        'input': 'SMS behandlingsoversikt: 6 av 10 behandlinger',
        'output': '6 av 10 behandlinger gjennomført ved KFA Majorstuen. Neste: tirsdag kl 13:30. Fin fremgang! Mvh KFA.'
    },
    {
        'input': 'SMS behandlingsoversikt: Forlengelse av behandlingsserie',
        'output': 'Hei! Vi anbefaler 4 ekstra behandlinger basert på din fremgang. Book videre på KFA Majorstuen. Ring oss ved spørsmål.'
    },
    {
        'input': 'SMS behandlingsoversikt: Halvveis i behandlingsserien',
        'output': 'Halvveis! 3 av 6 behandlinger fullført ved KFA Majorstuen. Neste time: mandag kl 15:00. Godt jobbet! Mvh KFA.'
    },
]

# ============================================================
# Part A1: SMS Templates — New Patient Info (10)
# ============================================================

SMS_NEW_PATIENT = [
    {
        'input': 'SMS ny pasient: Førstegangskonsultasjon i morgen kl 10:00',
        'output': 'Velkommen til KFA Majorstuen! Time i morgen kl 10:00. Møt opp 10 min før. Ta med evt. henvisning og ID. Mvh KFA.'
    },
    {
        'input': 'SMS ny pasient: Førstegangskonsultasjon onsdag kl 14:00',
        'output': 'Hei! Velkommen til din første time onsdag kl 14:00, KFA Majorstuen. Kom 10 min tidlig for registrering. Mvh KFA.'
    },
    {
        'input': 'SMS ny pasient: Praktisk informasjon før første time',
        'output': 'Velkommen til KFA Majorstuen! Ha med deg legitimasjon og evt. henvisning. Ta på klær du kan bevege deg i. Vel møtt!'
    },
    {
        'input': 'SMS ny pasient: Påminnelse med adresse',
        'output': 'Hei! Din første time er i morgen kl 09:00. KFA Majorstuen, Bogstadveien 15. Kom 10 min tidlig. Ta med ID. Velkommen!'
    },
    {
        'input': 'SMS ny pasient: Helseskjema på forhånd',
        'output': 'Hei! Du har time ved KFA Majorstuen. Fyll gjerne ut helseskjemaet på forhånd via lenken i e-posten. Vel møtt! Mvh KFA.'
    },
    {
        'input': 'SMS ny pasient: Førstegangskonsultasjon fredag kl 11:30',
        'output': 'Velkommen til KFA Majorstuen fredag kl 11:30! Første time varer ca. 45 min. Møt 10 min tidlig. Ta med henvisning. Mvh KFA.'
    },
    {
        'input': 'SMS ny pasient: Bekreftelse av booking',
        'output': 'Booking bekreftet! Ny pasient-time ved KFA Majorstuen, mandag kl 13:00. Husk ID og evt. henvisning. Velkommen! Mvh KFA.'
    },
    {
        'input': 'SMS ny pasient: Varsle om varighet og forberedelse',
        'output': 'Hei! Første konsultasjon varer 45-60 min. Bruk behagelige klær. Møt 10 min før. KFA Majorstuen. Velkommen! Mvh KFA.'
    },
    {
        'input': 'SMS ny pasient: Parkering og tilkomst',
        'output': 'Hei! KFA Majorstuen: T-bane Majorstuen (2 min). Gateparkering tilgjengelig. Kom 10 min tidlig til din første time. Mvh KFA.'
    },
    {
        'input': 'SMS ny pasient: Etter online booking',
        'output': 'Takk for bookingen! Din time: torsdag kl 15:00 ved KFA Majorstuen. Ny pasient: møt 10 min før. Ha med ID. Velkommen!'
    },
]

# ============================================================
# Part A2: Recall Messages — 3-Month Lapsed (10)
# ============================================================

RECALL_3_MONTH = [
    {
        'input': 'Gjeninnkalling 3 mnd: Pasient med nakkesmerter',
        'output': 'Hei! Det er 3 måneder siden siste behandling for nakkeplagene dine ved KFA Majorstuen. Hvordan går det? Vi har ledige timer om du ønsker oppfølging. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 3 mnd: Pasient med korsryggsmerte',
        'output': 'Hei! Sist du var hos oss for korsryggen er 3 mnd siden. Har du fortsatt med øvelsene? Vi anbefaler en kontroll. Book hos KFA Majorstuen. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 3 mnd: Pasient med hodepine',
        'output': 'Hei! Det er en stund siden sist for hodepinen din. Ønsker du en oppfølgingstime ved KFA Majorstuen? Book enkelt online eller ring oss. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 3 mnd: Pasient med skuldersmerter',
        'output': 'Hei! 3 mnd siden siste behandling for skulderen. Hvordan er det nå? Vi har gode tider ledig ved KFA Majorstuen om du trenger oppfølging. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 3 mnd: Pasient med knesmerter',
        'output': 'Hei! Vi tenker på deg! 3 mnd siden siste time for kneproblemet. Er du fornøyd med fremgangen? Book oppfølging ved KFA Majorstuen ved behov. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 3 mnd: Pasient med hoftesmerte',
        'output': 'Hei! 3 mnd siden sist hos oss for hoften. Gjør du fortsatt øvelsene? En kontrolltime kan sikre god fremgang. Book KFA Majorstuen. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 3 mnd: Pasient med isjias',
        'output': 'Hei! Tre måneder siden siste behandling for isjiasplagene. Vi håper det er bedre! Ønsker du en kontroll? KFA Majorstuen hjelper deg gjerne. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 3 mnd: Pasient med svimmelhet',
        'output': 'Hei! Det er 3 mnd siden behandling for svimmelheten. Har symptomene holdt seg borte? Vi tilbyr oppfølging ved KFA Majorstuen. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 3 mnd: Pasient med kjeveleddssmerter',
        'output': 'Hei! 3 mnd siden siste kjevebehandling ved KFA Majorstuen. Hvordan er det nå? Vi anbefaler en kontroll for å sjekke fremgangen. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 3 mnd: Pasient med tennisalbue',
        'output': 'Hei! Tre måneder siden sist for albuen. Gjør du øvelsene? En oppfølgingstime kan hjelpe. Book KFA Majorstuen online eller ring oss. Mvh KFA.'
    },
]

# ============================================================
# Part A2: Recall Messages — 6-Month Lapsed (10)
# ============================================================

RECALL_6_MONTH = [
    {
        'input': 'Gjeninnkalling 6 mnd: Pasient med kroniske ryggsmerter',
        'output': 'Hei! Et halvt år siden sist hos KFA Majorstuen. Vi håper ryggen er bedre! Regelmessig oppfølging forebygger tilbakefall. Book time når det passer deg. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 6 mnd: Pasient med nakkeplager',
        'output': 'Hei! Det er 6 mnd siden siste nakkekonsultasjon. Vi anbefaler en kontroll for å bevare god funksjon. Ledige timer hos KFA Majorstuen. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 6 mnd: Pasient med skulderproblem',
        'output': 'Hei! Vi har ikke sett deg på 6 mnd! Håper skulderen fungerer bra. Ønsker du en sjekk? KFA Majorstuen har gode tider ledig. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 6 mnd: Tidligere akutt pasient',
        'output': 'Hei! 6 mnd siden akuttbehandlingen din. En forebyggende kontroll kan hindre nye episoder. Book gjerne hos KFA Majorstuen. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 6 mnd: Pasient med bekkenplager',
        'output': 'Hei! Det er en stund siden siste behandling for bekkenplagene. Hvordan har det gått? Vi tilbyr oppfølgingstime ved KFA Majorstuen. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 6 mnd: Pasient etter whiplash',
        'output': 'Hei! 6 mnd siden siste whiplash-oppfølging ved KFA Majorstuen. Hvordan er formen nå? Vi anbefaler en kontroll. Book online eller ring oss. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 6 mnd: Pasient med fotsmerte',
        'output': 'Hei fra KFA Majorstuen! 6 mnd siden siste fotbehandling. Er du fortsatt smertefri? En kort kontroll sikrer at alt er på rett vei. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 6 mnd: Pasient med brystryggsmerte',
        'output': 'Hei! Et halvt år siden siste time for brystryggen. Vi anbefaler en kontroll for å forebygge tilbakefall. KFA Majorstuen hjelper gjerne. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 6 mnd: Generell',
        'output': 'Hei! Vi savner deg hos KFA Majorstuen! Det er 6 mnd siden sist. En kort kontroll kan gjøre stor forskjell. Book time når det passer. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling 6 mnd: Pasient med migrene',
        'output': 'Hei! 6 mnd siden siste migrenebehandling. Har frekvensen holdt seg lav? En oppfølgingstime hos KFA Majorstuen kan være nyttig. Mvh KFA.'
    },
]

# ============================================================
# Part A2: Recall Messages — Annual Check-up (10)
# ============================================================

RECALL_ANNUAL = [
    {
        'input': 'Gjeninnkalling årlig: Generell muskel- og skjelettsjekk',
        'output': 'Hei! Tid for din årlige muskel- og skjelettsjekk ved KFA Majorstuen. Forebygging er det beste! Book time når det passer deg. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling årlig: Kontorarbeider',
        'output': 'Hei! Et år siden siste besøk. Som kontorarbeider er en årlig sjekk av nakke og rygg viktig. Book hos KFA Majorstuen. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling årlig: Aktiv mosjonist',
        'output': 'Hei! Tid for årlig sjekk! Som aktiv mosjonist forebygger en kontroll skader og sikrer god funksjon. Book KFA Majorstuen. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling årlig: Senior pasient',
        'output': 'Hei! Året har gått! En årlig kontroll ved KFA Majorstuen hjelper deg å holde deg bevegelig og aktiv. Book en time som passer. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling årlig: Pasient med tidligere diskusprolaps',
        'output': 'Hei! Årlig kontroll anbefalt etter diskusprolaps. Forebyggende behandling reduserer risiko for nye episoder. Book KFA Majorstuen. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling årlig: Pasient med kjent skoliose',
        'output': 'Hei! Tid for årlig skoliosekontroll ved KFA Majorstuen. Regelmessig oppfølging er viktig. Book time online eller ring oss. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling årlig: Idrettsutøver',
        'output': 'Hei! Ny sesong nærmer seg. En årlig screening ved KFA Majorstuen forebygger skader og optimaliserer prestasjon. Book i dag! Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling årlig: Gravid eller postpartum',
        'output': 'Hei! Tid for oppfølging. En årlig bekken- og ryggkontroll er anbefalt etter fødsel. Book hos KFA Majorstuen når det passer. Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling årlig: Vedlikeholdsanbefaling',
        'output': 'Hei! Vi anbefaler årlig sjekk for god muskel- og skjeletthelse. Forebygg plager med en time ved KFA Majorstuen! Mvh KFA.'
    },
    {
        'input': 'Gjeninnkalling årlig: Nyttårssjekk',
        'output': 'Godt nytt år! Start året riktig med en sjekk ved KFA Majorstuen. Vi har god kapasitet i januar. Book time online. Mvh KFA.'
    },
]

# ============================================================
# Part A2: Recall Messages — Seasonal Recall (10)
# ============================================================

RECALL_SEASONAL = [
    {
        'input': 'Sesongbasert gjeninnkalling: Vinter snømåking',
        'output': 'Hei! Vinteren er her og snømåking belaster ryggen. En forebyggende time ved KFA Majorstuen hjelper deg gjennom sesongen. Book i dag! Mvh KFA.'
    },
    {
        'input': 'Sesongbasert gjeninnkalling: Vår hagearbeid',
        'output': 'Hei! Hageseongen er i gang. Tung løfting og bøying belaster kroppen. Forebygg plager med en sjekk hos KFA Majorstuen. Mvh KFA.'
    },
    {
        'input': 'Sesongbasert gjeninnkalling: Sommer aktiviteter',
        'output': 'Hei! Sommeren betyr mer aktivitet. Sørg for at kroppen er klar! En sjekk hos KFA Majorstuen forebygger aktivitetsskader. Mvh KFA.'
    },
    {
        'input': 'Sesongbasert gjeninnkalling: Høst treningssesong',
        'output': 'Hei! Treningssesongen starter. En sjekk hos KFA Majorstuen sikrer at du trener trygt. Forebygg skader med en time! Mvh KFA.'
    },
    {
        'input': 'Sesongbasert gjeninnkalling: Vinter glatte veier',
        'output': 'Hei! Is og glatte veier øker fallrisikoen. Har du falt? En sjekk ved KFA Majorstuen avdekker evt. skader tidlig. Book time! Mvh KFA.'
    },
    {
        'input': 'Sesongbasert gjeninnkalling: Skiprepp',
        'output': 'Hei! Skisesongen nærmer seg. En forebyggende sjekk ved KFA Majorstuen gjør kroppen klar for fjellet. Book time i dag! Mvh KFA.'
    },
    {
        'input': 'Sesongbasert gjeninnkalling: Vår løpesesong',
        'output': 'Hei! Løpesesongen er her! En sjekk av knær, ankler og hofter ved KFA Majorstuen forebygger belastningsskader. Book nå! Mvh KFA.'
    },
    {
        'input': 'Sesongbasert gjeninnkalling: Mørketid og stivhet',
        'output': 'Hei! Mørketiden gjør oss stivere. En behandling ved KFA Majorstuen løser spenninger og øker velværet. Book time! Mvh KFA.'
    },
    {
        'input': 'Sesongbasert gjeninnkalling: Sommer bilferie',
        'output': 'Hei! Lang bilkjøring belaster nakke og rygg. Planlegger du bilferie? En sjekk ved KFA Majorstuen forbereder kroppen. Mvh KFA.'
    },
    {
        'input': 'Sesongbasert gjeninnkalling: Høstrengjøring hjemme',
        'output': 'Hei! Storrengjøring kan gi stive muskler. En forebyggende time ved KFA Majorstuen holder kroppen i form. Book i dag! Mvh KFA.'
    },
]

# ============================================================
# Part A2: Recall Messages — Post-Treatment Follow-up (10)
# ============================================================

RECALL_POST_TREATMENT = [
    {
        'input': 'Oppfølging etter behandlingsslutt: Nakkesmerter',
        'output': 'Hei! 2 uker siden siste behandling for nakken. Hvordan går det? Fortsetter du med øvelsene? Gi beskjed om du trenger oppfølging. Mvh KFA Majorstuen.'
    },
    {
        'input': 'Oppfølging etter behandlingsslutt: Korsrygg',
        'output': 'Hei! Behandlingsserien for korsryggen er avsluttet. Hvordan føler du deg? Husk øvelsene daglig. Ta kontakt om noe dukker opp. Mvh KFA Majorstuen.'
    },
    {
        'input': 'Oppfølging etter behandlingsslutt: Isjias',
        'output': 'Hei fra KFA Majorstuen! Håper isjiasplagene holder seg i sjakk. Fortsett med nervemobilisering hjemme. Ring oss om du trenger mer hjelp. Mvh KFA.'
    },
    {
        'input': 'Oppfølging etter behandlingsslutt: Skulder',
        'output': 'Hei! Skulderbehandlingen er avsluttet. Fortsett med rotatorcuff-øvelsene daglig. Kontakt KFA Majorstuen om du merker tilbakegang. Mvh KFA.'
    },
    {
        'input': 'Oppfølging etter behandlingsslutt: Hodepine',
        'output': 'Hei! Vi håper hodepinen er bedre etter behandlingsserien. Husk ergonomiske tips vi gikk gjennom. KFA Majorstuen er her om du trenger oss. Mvh KFA.'
    },
    {
        'input': 'Oppfølging etter behandlingsslutt: BPPV',
        'output': 'Hei! Svimmelhetsbehandlingen er avsluttet. Er du svimmelfri? Gjør Brandt-Daroff ved nye symptomer. Kontakt KFA Majorstuen ved tilbakefall. Mvh KFA.'
    },
    {
        'input': 'Oppfølging etter behandlingsslutt: Akutt lumbago',
        'output': 'Hei! 1 uke etter akuttbehandling for ryggen. Hvordan er smertene nå? Beveg deg som normalt. Ring KFA Majorstuen om det forverres. Mvh KFA.'
    },
    {
        'input': 'Oppfølging etter behandlingsslutt: Bekkenplager graviditet',
        'output': 'Hei! Håper bekkenplagene er bedre. Husk bekkenbeltet og øvelsene vi viste deg. KFA Majorstuen er her ved behov. Mvh KFA.'
    },
    {
        'input': 'Oppfølging etter behandlingsslutt: TMD/kjeveledd',
        'output': 'Hei! Kjevebehandlingen er ferdig. Fortsett med gapeøvelsene og unngå hardt tyggegods. Kontakt KFA Majorstuen ved nye symptomer. Mvh KFA.'
    },
    {
        'input': 'Oppfølging etter behandlingsslutt: Plantar fasciitt',
        'output': 'Hei! Fotbehandlingen er avsluttet. Fortsett med tøying av akillessene morgen og kveld. KFA Majorstuen er her om du trenger oss. Mvh KFA.'
    },
]

# ============================================================
# Part B1: Formal Medical Terminology — Clinical Notes (50)
# ============================================================

FORMAL_TERMINOLOGY = [
    {
        'input': 'Skriv klinisk notat: Pasient har vondt i nakken og stiv nakke',
        'output': 'S: Pasienten presenterer med cervikalgi og cervikal bevegelsesrestriksjon. Symptomene har gradvis debut. Smertene forverres ved prolongert cervikal fleksjon og rotasjon.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient har vondt i ryggen med utstråling til benet',
        'output': 'S: Pasienten presenterer med lumbalgi og radierende smerter til underekstremiteten. Klinisk bilde forenlig med lumbal radikulopati. Smertene irradierer langs L5-dermatomet.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient har vondt i skulderen og klarer ikke løfte armen',
        'output': 'S: Pasienten presenterer med omalgi og funksjonsnedsettelse i glenohumeral abduksjon. Aktiv elevasjon begrenset til 80° grunnet smerter. Mistanke om rotatorcuff-patologi.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient har hodepine fra nakken',
        'output': 'S: Pasienten presenterer med cervikogen cefalgi. Smertene utgår fra øvre cervikalcolumna og irradierer til oksipitalregionen og frontalt unilateralt. Assosiert cervikal bevegelsesrestriksjon.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient har nummenhet og prikking i hånden',
        'output': 'S: Pasienten presenterer med parestesier og hypoestesi i hånden. Symptomene affiserer dig. III-V. Klinisk bilde forenlig med nevrogen kompresjon, mulig karpaltunnelsyndrom eller cervikal radikulopati C8.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient har slitasjegikt i hoften',
        'output': 'S: Pasienten har kjent coxartrose med progressive degenerative forandringer. Rapporterer funksjonsnedsettelse ved gange og trappegang. Morgenstivhet < 30 min. Redusert endorotasjon i hofteleddet.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient er svak i foten etter ryggprolaps',
        'output': 'S: Pasienten presenterer med pareser i fotens dorsifleksjon etter verifisert lumbal diskusherniering. Kraftgrad 3/5 i m. tibialis anterior. Forenlig med L4/L5-radikulopati med motorisk affeksjon.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient har skjev rygg',
        'output': 'S: Ved inspeksjon observeres lateral deviasjon av columna, forenlig med strukturell skoliose. Thorakolumbal konveksitet mot høyre. Adams test positiv med paraspinal prominens. Videre utredning med rtg anbefales.'
    },
    {
        'input': 'Skriv vurdering: Pasient med betennelse i senefestet i albuen',
        'output': 'V: Lateral epikondylalgi med lokal inflammasjon ved ekstensor-origo. Palpasjonsømhet over laterale epikondyl. Positiv Cozen test og Millstest. Forenlig med tendinopati av m. extensor carpi radialis brevis.'
    },
    {
        'input': 'Skriv vurdering: Pasient med hevelse i kneet etter vridning',
        'output': 'V: Genu med ødem og hemartros etter rotasjonstraume. Positiv Lachman-test graderer ACL-laksitet. Negativ McMurray. Lateral kollateralligament intakt. MR anbefales for å avklare ligamentær skade.'
    },
    {
        'input': 'Skriv objektiv: Nakkeundersøkelse med redusert bevegelse sideveis',
        'output': 'O: Cervikal ROM: Fleksjon 45°, ekstensjon 35°, rotasjon dx 60° sin 70°, lateralfleksjon dx 25° (redusert) sin 40°. Segmentell hypomobilitet C3-C4 dx. Myofascielle triggerpunkter m. trapezius superior dx.'
    },
    {
        'input': 'Skriv objektiv: Korsryggundersøkelse med nerve i klem',
        'output': 'O: Lumbal ROM: Fleksjon FGA 25 cm, ekstensjon 15°, lateralfleksjon dx 20° sin 25°. SLR positiv dx 45° med radikulært mønster. Lasègue positiv. Nedsatt sensibilitet S1-dermatomet dx. Akillesrefleks svekket dx.'
    },
    {
        'input': 'Skriv objektiv: Skulderundersøkelse med smerter ved løft over hodet',
        'output': 'O: Aktiv glenohumeral fleksjon 140° (smertebue 70-120°). Abduksjon 130°. Positiv Hawkins-Kennedy og Neer impingement-test. Negativ apprehension. Full kraft i ekstern og intern rotasjon. Subacromial impingement sannsynlig.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient har blåmerke og hevelse etter fall',
        'output': 'S: Pasienten presenterer etter traumatisk fall med kontusjon og hematom over regio lumbalis. Lokalisert ødem og rubor. Palpasjonsømhet over proc. spinosus L2-L3. Ingen nevrologiske utfall.'
    },
    {
        'input': 'Skriv plan: Behandlingsplan for pasient som bøyer seg forover og bakover med smerte',
        'output': 'P: Smerter ved fleksjon og ekstensjon i lumbalcolumna. Retningspreferanse undersøkes med repeterte bevegelser. Manuell terapi med segmentell mobilisering. Motorisk kontrolltrening med fokus på nøytral lumbal posisjon.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient med vondt i brystet fra ryggen',
        'output': 'S: Pasienten presenterer med dorsalgi og interkostal smerteradiering. Smertene irradierer anterolateralt langs kostalbuen. Forverres ved dyp inspirasjon og torakal rotasjon. Kardiell årsak utelukket av fastlege.'
    },
    {
        'input': 'Skriv vurdering: Pasient med stråling nedover armen fra nakken',
        'output': 'V: Cervikal radikulopati med radierende smerter til overekstremiteten. Smertene irradierer langs C6-dermatomet. Positiv Spurlings test dx. Nedsatt bicepsrefleks dx. Forenlig med foraminalstenose eller diskusherniering C5-C6.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient har vondt når han går langt',
        'output': 'S: Pasienten rapporterer funksjonsnedsettelse ved gange med smerteindusert claudicatio. Symptomene debuterer etter 200 m og lindres ved hvile i fleksjon. Klinisk bilde forenlig med nevrogen claudicatio sekundært til lumbal spinalstenose.'
    },
    {
        'input': 'Skriv objektiv: Hofteundersøkelse med redusert innoverrotasjon',
        'output': 'O: Hofteledd dx: Fleksjon 110°, ekstensjon 10°, abduksjon 35°, adduksjon 25°, endorotasjon 15° (redusert, normalt >25°), eksorotasjon 40°. FADIR positiv dx. FABER positiv dx. Trendelenburg negativ bilateralt.'
    },
    {
        'input': 'Skriv klinisk notat: Eldre pasient med slitasje og morgenstivhet',
        'output': 'S: Pasienten presenterer med polyartralgier og generalisert morgenstivhet < 30 min. Degenerative forandringer klinisk forenlig med artrose i flere ledd. Affiserte ledd: Hender (DIP, CMC-1 bilat), knær bilateralt. Funksjonsnedsettelse ved finmotorikk.'
    },
    {
        'input': 'Skriv SOAP-notat: Oppfølging nakkesmerter, bedring etter behandling',
        'output': 'S: Pasienten rapporterer signifikant bedring av cervikalgien. NRS redusert fra 7 til 3/10. Cervikal bevegelsesrestriksjon avtagende. Bedret nattesøvn.\nO: Cervikal ROM normalisert. Residual ømhet paravertebral C4-C5 sin. Triggerpunkter i m. levator scapulae resolvert.\nV: God behandlingsrespons. Mekanisk cervikalgi under resolusjon.\nP: Redusere behandlingsfrekvens til 1x/2 uker. Fortsette hjemmeøvelser. Evaluering etter 2 behandlinger.'
    },
    {
        'input': 'Skriv SOAP-notat: Ny pasient med akutt lumbago',
        'output': 'S: 38 år gammel mann med akutt debut lumbalgi etter løft i dag. NRS 8/10. Ingen radierende smerter. Ingen parestesier. Ingen sfinkterproblematikk. Ingen røde flagg.\nO: Antalgisk holdning med lumbal fleksjonsprefeanse. Markert paravertebral muskelspasme L3-L5 bilat. SLR negativ bilat. Nevrologisk ua. Motorikk, sensibilitet og reflekser intakt L2-S2.\nV: Akutt mekanisk lumbago uten nevrologiske utfall. Gunstig prognose.\nP: Manuell terapi med forsiktig mobilisering. Isapplikasjon. Opprettholde aktivitet etter toleranse. Unngå tung belastning 1 uke. Kontroll om 3 dager.'
    },
    {
        'input': 'Skriv SOAP-notat: Skulder impingement tredje behandling',
        'output': 'S: Pasienten rapporterer 40% bedring av omalgien. Overhead-aktiviteter fortsatt smertefulle, men bedre. NRS 5/10 (ned fra 7/10). Søvn bedret.\nO: Aktiv fleksjon 160° (opp fra 140°). Smertebue redusert til 80-100°. Hawkins fortsatt positiv. Neer svakt positiv. Full kraft rotatorcuff.\nV: Subacromial impingement med god behandlingsrespons. Progredierer som forventet.\nP: Fortsette manuell terapi glenohumeral og torakal columna. Progredierer eksentriske rotatorcuff-øvelser. Scapula-stabiliseringsøvelser intensiveres.'
    },
    {
        'input': 'Skriv vurdering: Pasient med smerter som stråler til begge bein',
        'output': 'V: Bilateral radikulopati med irradierende smerter til begge underekstremiteter. Differensialdiagnostisk vurderes sentral diskusherniering, spinal stenose eller cauda equina-syndrom. Sistnevnte må utelukkes umiddelbart ved tilstedeværelse av sfinkteraffeksjon, ridebukseanestesi eller progredierende pareser.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient med vondt i hælen om morgenen',
        'output': 'S: Pasienten presenterer med inferiør kalkanealgi med klassisk oppstartsmerte. Smertene er mest uttalt ved de første skritt om morgenen og etter prolongert hvile. Gradvis debut over 3 måneder. Pasienten er stående i arbeid.'
    },
    {
        'input': 'Skriv objektiv: Kjeveundersøkelse',
        'output': 'O: TMJ-ledd sin: Krepitasjon ved gaping. Redusert gapeevne 30 mm (normalt >40 mm). Defleksjon mot sin ved aktiv gaping. Palpasjonsømhet m. masseter og m. pterygoideus lateralis sin. Okklusjon ua ved inspeksjon.'
    },
    {
        'input': 'Skriv vurdering: Pasient med svakhet etter langvarig sengeleje',
        'output': 'V: Generalisert dekondisjonering og muskulær atrofi etter prolongert immobilisering. Kraftnedsettelse grad 4/5 i underekstremitetene bilateralt. Redusert propriosepsjon. Rehabiliteringsplan med gradert aktivitetsøkning indisert.'
    },
    {
        'input': 'Skriv klinisk notat: Barn med vondt i kneet ved vekst',
        'output': 'S: 13 år gammel gutt presenterer med anterior gonalgi bilateralt, forenlig med Osgood-Schlatters sykdom. Smerter over tuberositas tibiae, forverret ved løping og kneling. Klinisk bilde typisk for apofysitt i vekstperioden.'
    },
    {
        'input': 'Skriv objektiv: Nevrologisk undersøkelse overekstremitet',
        'output': 'O: Nevrologisk us. OE: Kraft C5 (deltoid) 5/5 bilat, C6 (biceps) 5/5 bilat, C7 (triceps) 5/5 bilat, C8 (fingerfleksjon) 5/5 bilat, T1 (interossei) 5/5 bilat. Sensibilitet: Lett berøring og nålestikk intakt C5-T1 bilat. Reflekser: Biceps ++ bilat, triceps ++ bilat, brachioradialis ++ bilat.'
    },
    {
        'input': 'Skriv klinisk notat: Eldre dame med nerverotaffeksjon i nakken',
        'output': 'S: 67 år gammel kvinne med cervikal radikulopati C6. Smertene irradierer til laterale underarm og tommel dx. Parestesier i tommel. Gradvis debut over 4 uker. Rtg viser cervikal spondylose med foraminal innsnevring C5-C6 dx.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient med kramper og stivhet i leggen',
        'output': 'S: Pasienten presenterer med muskelspasmer og rigiditet i m. gastrocnemius bilateralt. Nocturne kramper. Palpasjonsømhet og palpable taut bands. Ingen vaskulære tegn. Differensialdiagnostisk vurderes myofascielt smertesyndrom og perifer vaskulær insuffisiens.'
    },
    {
        'input': 'Skriv SOAP-notat: Svimmelhet, andre behandling etter Epley',
        'output': 'S: Pasienten rapporterer 80% bedring av vertigo etter initial Epley-manøver. Residuale symptomer med lett ustøhet ved hurtige hodebevegelser. Ingen kvalme eller emesis.\nO: Dix-Hallpike negativ bilateralt. Ingen nystagmus observert. Romberg negativ. Tandemgange ua.\nV: BPPV bakre buegang dx under resolusjon etter repositjoneringsmanøver.\nP: Observasjon. Brandt-Daroff øvelser hjemme. Kontroll ved residiverende symptomer.'
    },
    {
        'input': 'Skriv vurdering: Pasient med smertefullt begrensede bevegelser i alle retninger i skulderen',
        'output': 'V: Adhesiv kapsulitt (frozen shoulder) dx. Karakteristisk kapsuært mønster med nedsatt eksorotasjon > abduksjon > endorotasjon. Pasienten er i den smertefulle initiale fasen. Ingen radiologiske tegn til artrose. Forenlig med idiopatisk adhesiv kapsulitt.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient med spenninger og knuter i musklene',
        'output': 'S: Pasienten presenterer med myofascielt smertesyndrom i cervikal og torakal region. Multiple palpable triggerpunkter med referert smerte. Taut bands i m. trapezius superior, m. levator scapulae og m. rhomboideus bilateralt.'
    },
    {
        'input': 'Skriv plan: Behandling av pasient med senebetennelse i akillessenen',
        'output': 'P: Akillestendinopati dx. Eksentrisk treningsprogram (Alfredson-protokoll): 3x15 reps 2x/dag i 12 uker. Manuell terapi med bløtvevsbehandling og leddmobilisering av subtalarledd og tibiofibuarledd. Korreksjon av biomekanisk dysfunksjon ved behov. Isapplikasjon etter aktivitet.'
    },
    {
        'input': 'Skriv objektiv: Lumbalcolumna med paravertebral stramhet bilateralt',
        'output': 'O: Inspeksjon: Normal lumbal lordose. Ingen lateral deviasjon. Palpasjon: Bilateral paravertebral hypertoni L3-S1. Segmentell hypomobilitet L4-L5 og L5-S1. Iliosakralledd: FABER positiv sin, distraksjonstest negativ bilat. Nevrologisk: Kraft, sensibilitet og reflekser L2-S2 ua bilat.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient med korsrygg som bøyer seg til siden for å unngå smerte',
        'output': 'S: Pasienten presenterer med akutt lumbalgi og antalgisk lateral shift til venstre. Markert bevegelsesrestriksjon i ekstensjon og høyre lateralfleksjon. Smertene irradierer ikke til underekstremitetene. Debut etter løftebelastning.'
    },
    {
        'input': 'Skriv vurdering: Pasient med diffuse smerter og trøtthet over hele kroppen',
        'output': 'V: Klinisk bilde forenlig med sentralisert smertesensitisering og fibromyalgi. Utbredt allodyni og hyperalgesi. 14 av 18 tenderpoints positive. Ledsagende fatigue, non-restorativ søvn og kognitiv dysfunksjon. ACR 2016-kriteriene oppfylt.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient som har fått blåmerke etter behandling',
        'output': 'S: Pasienten rapporterer hematom over torakal region etter forrige behandlingsseanse. Lokalisert ekkymoose paravertebral Th6-Th8 dx. Ingen smerte. Hematom forenlig med bløtvevsbehandling. Forventet residualtid 7-10 dager.'
    },
    {
        'input': 'Skriv objektiv: Torakal undersøkelse med begrenset rotasjon',
        'output': 'O: Torakal ROM: Fleksjon ua, ekstensjon lett begrenset. Rotasjon dx 30° (redusert), sin 45° (normal). Lateralfleksjon dx 20°, sin 25°. Segmentell hypomobilitet Th5-Th8 med prediksjon for rotasjonsdysfunksjon dx. Kostovertebrale ledd Th6-Th7 dx fikserte.'
    },
    {
        'input': 'Skriv klinisk notat: Idrettsutøver med overbelastningsskade i kneet',
        'output': 'S: 25 år gammel løper presenterer med anterior gonalgi dx, forenlig med patellofemoralt smertesyndrom. Smertene provoseres ved prolongert sittende stilling, trappegang og løping. Debut etter gradvis økning av treningsvolum.'
    },
    {
        'input': 'Skriv SOAP-notat: Oppfølging lumbal radikulopati, gradvis bedring',
        'output': 'S: Pasienten rapporterer gradvis bedring av radikulære smerter. Irradiasjonen når nå kun til glutealregionen (initialt til foten). NRS 4/10 (ned fra 8/10). Parestesiene i foten avtagende.\nO: SLR forbedret til 65° dx (var 40°). Lasègue negativ. Kraft dorsifleksjon 4+/5 dx (var 4/5). Sensibilitet normalisert L5-dermatom.\nV: Lumbal radikulopati L4-L5 dx under resolusjon. God behandlingsrespons.\nP: Fortsette manuell terapi og McKenzie-øvelser. Gradert tilbakegang til normal aktivitet. Kontroll om 1 uke.'
    },
    {
        'input': 'Skriv vurdering: Pasient med lyskesmerter ved gange og sittende-til-stående',
        'output': 'V: Coxalgi med smerter i inguinalregionen. Funksjonell begrensning ved gange og sit-to-stand. Positiv FADIR indikerer mulig labral eller anterior kapsuær patologi. Differensialdiagnostisk vurderes coxartrose, labrumskade og iliopsoas-tendinopati.'
    },
    {
        'input': 'Skriv klinisk notat: Gravid pasient med bekkenleddsmerter',
        'output': 'S: Gravid uke 30, presenterer med bekkenleddsmerter bilateralt, mest uttalt over symfysen og SI-leddene. Funksjonsnedsettelse ved gange, vending i seng og trappegang. Smertene provoseres ved enbensstående og adduksjonsbevegelser.'
    },
    {
        'input': 'Skriv objektiv: Håndleddsundersøkelse med nummenhet i fingrene',
        'output': 'O: Tinel positiv over karpaltunnelen dx. Phalen positiv ved 20 sek. Monofilament-testing viser hypoestesi i dig. I-III og radiale halvdel dig. IV dx. Kraft m. abductor pollicis brevis 4/5 dx. Tenarmuskulatur: Lett atrofi dx vs sin. Forenlig med n. medianus kompresjon i karpaltunnelen.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient med knekking og låsning i kneet',
        'output': 'S: Pasienten rapporterer mekaniske symptomer i genu dx med episodisk låsningsfenomen og krepitasjon. Debut etter vridningstraume under fotball for 4 uker siden. Intermitterende ødem. Positiv McMurray og Apley grinding test dx medialt.'
    },
    {
        'input': 'Skriv plan: Multimodal behandling av kronisk cervikalgi',
        'output': 'P: Multimodal tilnærming for kronisk cervikalgi: 1) Manuell terapi: Segmentell mobilisering/manipulasjon C2-C5 og øvre torakal. 2) Bløtvev: Triggerpunktbehandling og myofasciell frigjøring cervikal muskulatur. 3) Øvelser: DNF-trening, cervikal isometrisk styrketrening, scapula-stabilisering. 4) Ergonomisk rådgivning: Skjermplassering, pauserutiner. 5) Smerteedukasjon.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient med murrende vondt mellom skulderbladene',
        'output': 'S: Pasienten presenterer med interscapulær dorsalgi av murende karakter. Symptomene forverres ved prolongert sittende arbeid og cervikal fleksjon. Assosierte triggerpunkter i mm. rhomboidei og m. trapezius medius bilateralt.'
    },
    {
        'input': 'Skriv klinisk notat: Pasient med prikking og nummenhet i begge føtter',
        'output': 'S: Pasienten presenterer med bilateral distal parestesi og hypoestesi i underekstremitetene. Strømpeutbredelse. Gradvis debut over 6 måneder. Differensialdiagnostisk vurderes perifer polynevropati. Metabolsk utredning (HbA1c, B12, folat) anbefales. Henvisning til nevrolog for nevrofysiologisk undersøkelse.'
    },
    {
        'input': 'Skriv vurdering: Pasient med akutt vridning i ankelen med hevelse',
        'output': 'V: Akutt lateral ankelligamentskade dx etter inversjonstraume. Grad II basert på klinisk vurdering: Moderat ødem og ekkymoser lateralt, positiv anterior skuffetest med myk endefølelse, intakt deltoidligament. Ottawa Ankle Rules: Ingen indikasjon for radiologisk utredning. Konservativ behandling med tidlig mobilisering og rehabilitering indisert.'
    },
]

# ============================================================
# Part B2: Professional Letters/Reports — Referral Letters (10)
# ============================================================

REFERRAL_LETTERS = [
    {
        'input': 'Skriv henvisning til ortoped for skulderplager',
        'output': 'Henvisning vedrørende: Omalgi dx, mistenkt rotatorcuff-ruptur.\n\nDet vises til ovennevnte pasient, mann 55 år, med 4 måneders progredierende omalgi og kraftnedsettelse i abduksjon. Klinisk funn: Positiv drop-arm test, Hawkins og Neer positiv. Kraft utadrotasjon 3/5. Konservativ behandling med manuell terapi og rehabilitering i 8 uker uten tilfredsstillende effekt. MR anbefales for å avklare rotatorcuff-integritet. Vennligst vurder pasienten for videre utredning og evt. kirurgisk intervensjon.'
    },
    {
        'input': 'Skriv henvisning til nevrolog for cervikal radikulopati',
        'output': 'Henvisning vedrørende: Cervikal radikulopati C6 dx.\n\nKvinne 48 år med 6 ukers progredierende radikulære smerter irradierende til dx overekstremitet langs C6-dermatomet. Klinisk funn: Positiv Spurlings test dx. Nedsatt bicepsrefleks dx. Hypoestesi laterale underarm. Konservativ behandling i 6 uker med begrenset effekt. Rtg cervikal viser degenerative forandringer C5-C6. Ber om nevrofysiologisk utredning og vurdering av MR cervikal.'
    },
    {
        'input': 'Skriv henvisning til revmatolog for inflammatorisk ryggsmerte',
        'output': 'Henvisning vedrørende: Inflammatorisk ryggsmerte, mistenkt aksial spondyloartritt.\n\nMann 28 år med 8 måneders lumbalgi med inflammatorisk preg: Morgenstivhet > 45 min, bedring ved aktivitet, nattlige smerter. Positiv FABER bilat. HLA-B27-status ukjent. CRP lett forhøyet. Klinisk bilde forenlig med aksial spondyloartritt. Ber om revmatologisk vurdering inkl. MR sakroiliakaledd og serologiske prøver.'
    },
    {
        'input': 'Skriv henvisning til fysioterapeut for knerehabiltering',
        'output': 'Henvisning vedrørende: Rehabilitering etter partiell meniskektomi genu dx.\n\nMann 35 år, 4 uker postoperativt etter artroskopisk partiell medial meniskektomi dx. Operasjon komplikasjonsfri. Aktuelt med styrke- og stabilitetsrehabiltering. ROM: Fleksjon 120°, ekstensjon 0°. Quadricepsatrofi 2 cm vs kontralateral side. Ber om 12 behandlinger med fokus på quadricepsstyrke, propriosepsjon og gradert return-to-sport.'
    },
    {
        'input': 'Skriv henvisning til fastlege for bildediagnostikk',
        'output': 'Henvisning vedrørende: Rekvirering av MR lumbal.\n\nDet vises til ovennevnte pasient, kvinne 42 år, med 3 måneders lumbalgi og venstresidig L5-radikulopati. Konservativ kiropraktisk behandling i 8 uker med utilfredsstillende respons. Klinisk funn: Positiv SLR 35° sin, nedsatt EHL-kraft 4/5 sin, hypoestesi laterale legg og fotrygg sin. Ber om rekvirering av MR lumbalcolumna for å avklare diskogen versus stenosepatologi.'
    },
    {
        'input': 'Skriv henvisning til ortoped for hofteplager',
        'output': 'Henvisning vedrørende: Coxartrose sin, vurdering for total hofteprotese.\n\nKvinne 68 år med 2 års progredierende coxalgi sin. Rtg bekken viser Kellgren-Lawrence grad III sin hofte. Konservativ behandling inkl. kiropraktikk, fysioterapi og NSAID med avtagende effekt. Aktuelt: Markert redusert ROM, særlig endorotasjon 5° og fleksjon 80°. Gangdistanse begrenset til 500 m. Funksjonsnivå forenlig med indikasjon for artroplastikk. Vennligst vurder for totalprotese.'
    },
    {
        'input': 'Skriv henvisning til nevrolog for atypisk hodepine',
        'output': 'Henvisning vedrørende: Cefalgi med atypiske trekk, ber om nevrologisk vurdering.\n\nMann 52 år med nyoppstått daglig hodepine siste 6 uker med tiltagende intensitet. Hodepinen er ikke posisjonsbetinget. Ingen cervikogen komponent ved klinisk undersøkelse. Negativ cervikal fleksjons-rotasjonstest. Ingen nevrologiske utfall, men nyoppstått unilateral cefalgi med alder > 50 år krever supplerende utredning. Ber om bildediagnostikk og nevrologisk vurdering for å utelukke sekundær cefalgi.'
    },
    {
        'input': 'Skriv henvisning til fysioterapeut for nakkerehabiltering',
        'output': 'Henvisning vedrørende: Rehabilitering av kronisk cervikalgi med dekondisjonering.\n\nKvinne 38 år med 12 mnd kronisk cervikalgi og nedsatt cervikal muskelutholdhet. Kiropraktisk behandling har gitt symptomreduksjon, men restsymptomer vedvarer grunnet cervikal muskulær insuffisiens. DNF-test 22 mmHg (normalt > 28). Ber om 12 behandlinger med fokus på cervikal stabiliseringstrening, DNF-trening og graduert styrketrening.'
    },
    {
        'input': 'Skriv henvisning til revmatolog for perifer artritt',
        'output': 'Henvisning vedrørende: Polyartritt, mistenkt revmatoid artritt.\n\nKvinne 45 år med 3 mnd symmetrisk polyartralgi i MCP- og PIP-ledd bilateralt. Morgenstivhet > 60 min. Klinisk: Synovial fortykning MCP 2-3 bilat, PIP 2-3 bilat. Nedsatt grepsstyrke. CRP og SR ikke testet. Klinisk bilde gir sterk mistanke om inflammatorisk artritt. Ber om serologisk utredning (RF, anti-CCP, CRP, SR) og revmatologisk vurdering.'
    },
    {
        'input': 'Skriv henvisning til ortoped for lumbal spinalstenose',
        'output': 'Henvisning vedrørende: Lumbal spinalstenose, vurdering for kirurgisk dekompresjon.\n\nMann 72 år med 12 mnd progredierende nevrogen claudicatio. Gangdistanse redusert fra 1 km til 100 m. Symptomer lindres ved lumbal fleksjon. MR viser signifikant sentral stenose L3-L4 og L4-L5. Konservativ behandling i 6 mnd inkl. manuell terapi og øvelser med begrenset effekt. Ber om vurdering for dekompresjon.'
    },
]

# ============================================================
# Part B2: Professional Letters/Reports — Insurance Reports (10)
# ============================================================

INSURANCE_REPORTS = [
    {
        'input': 'Skriv forsikringsrapport: Whiplash etter bilulykke',
        'output': 'Spesialistrapport vedrørende nakkeslengskade.\n\nSkadedato: 15.01.2026. Mekanisme: Påkjørsel bakfra i lav hastighet. Pasienten utviklet cervikalgi, cefalgi og vertigo innen 24 timer. Kliniske funn: Cervikal bevegelsesrestriksjon, myofascielle triggerpunkter i cervikal muskulatur, positiv cervikal fleksjons-rotasjonstest. Behandling: 12 kiropraktiske konsultasjoner over 8 uker. Resultat: 60% symptomreduksjon. Prognose: Forventet videre bedring over 3-6 mnd med vedvarende residualsymptomer.'
    },
    {
        'input': 'Skriv forsikringsrapport: Arbeidsulykke med ryggskade',
        'output': 'Rapport vedrørende arbeidsrelatert lumbalskade.\n\nSkadedato: 03.02.2026. Skademekanisme: Løft av tung gjenstand (ca. 40 kg) i arbeidssituasjon, med akutt debut av lumbalgi. Objektive funn: Antalgisk holdning, markert paravertebral hypertoni L3-S1, SLR positiv dx 40°. MR viser diskusprotrusjon L4-L5. Behandlingsforløp: Konservativ kiropraktisk behandling 2x/uke i 6 uker. Aktuell status: NRS 4/10 (ned fra 9/10). Funksjonsnedsettelse ved tung belastning vedvarer.'
    },
    {
        'input': 'Skriv forsikringsrapport: Idrettsskade i skulder',
        'output': 'Spesialistrapport vedrørende skulderidrettsskade.\n\nSkadedato: 20.12.2025. Mekanisme: Fall på utstrakt arm under håndballkamp. Kliniske funn: Positiv apprehension og relocation test. MR arthrografi viser antero-inferior labral avulsjon (Bankart-lesjon). Behandlingsforløp: Konservativ rehabilitering i 12 uker med kiropraktisk behandling og stabiliseringsøvelser. Aktuell status: Pasienten er ikke sportsfit. Residual apprehension ved abduksjon/utadrotasjon > 90°. Anbefaling: Vurderes for artroskopisk Bankart-reparasjon for return-to-sport.'
    },
    {
        'input': 'Skriv forsikringsrapport: Kronisk nakkeskade etter ulykke',
        'output': 'Rapport vedrørende kronisk cervikalgi etter personskade.\n\nIndeksulykke: 10.06.2025. 9 måneders behandlingsforløp. Pasienten har gjennomgått 24 kiropraktiske konsultasjoner. Aktuell status: Persisterende cervikalgi og cervikal bevegelsesrestriksjon. NRS 5/10 ved hverdagsaktiviteter. Funksjonsnedsettelse: Nedsatt arbeidskapasitet ved skjermarbeid > 2 timer. Prognose: Varig medisinsk invaliditet vurderes til 5-8%. Tilstanden anses stabilisert med behov for vedlikeholdsbehandling.'
    },
    {
        'input': 'Skriv forsikringsrapport: Fallskade med bekkenbrudd',
        'output': 'Rapport vedrørende rehabilitering etter bekkenringskade.\n\nSkadedato: 01.11.2025. Mekanisme: Fall fra stige, 2 meter. Diagnostisert med fraktur os pubis sin (rtg/CT). Konservativt behandlet. Kiropraktisk rehabilitering startet 8 uker posttraumatisk. Behandling: Bekkenleddsmoilisering, bløtvevsbehandling og progressiv rehabilitering over 16 uker. Aktuell status: Gangfunksjon normalisert. Restsmerter ved prolongert belastning NRS 2-3/10.'
    },
    {
        'input': 'Skriv forsikringsrapport: Pasient med vedvarende plager etter bilulykke',
        'output': 'Supplerende rapport vedrørende posttraumatisk cervikobrakialgi.\n\nIndeksulykke: 05.03.2025. Oppdatert status 12 mnd posttraumatisk. Pasienten har persisterende cervikalgi med radikulære smerter til dx overekstremitet. MR cervikal viser diskusprotrusjon C5-C6 med foraminalstenose. Elektromyografi viser kronisk denervasjon C6-myotom. Aktuell funksjonsgrad: Nedsatt arbeidskapasitet 50%. Dagliglivets aktiviteter moderat begrenset. Behandlingsbehov: Vedvarende, 1-2 behandlinger per måned.'
    },
    {
        'input': 'Skriv forsikringsrapport: Kneskade under jogging',
        'output': 'Rapport vedrørende traumatisk meniskskade genu dx.\n\nSkadedato: 14.01.2026. Mekanisme: Vridningstraume under løping i terreng. Akutt smerte medialt genu dx med påfølgende hevelse. Kliniske funn: Positiv McMurray medialt, joint line tenderness medialt, intermittent låsningsfenomen. MR viser vertikal ruptur av medialt menisk bakre horn. Behandling: Konservativ kiropraktisk behandling 3 uker uten tilstrekkelig effekt. Pasienten er henvist for artroskopisk vurdering.'
    },
    {
        'input': 'Skriv forsikringsrapport: Muskel-skjelettplager etter repetitivt arbeid',
        'output': 'Rapport vedrørende arbeidsrelatert muskel-skjelettlidelse.\n\nPasienten, 45 år, har utviklet kronisk cervikal og torakal dorsalgi relatert til ergonomisk ugunstig arbeidsstasjon gjennom 5 år. Diagnose: Myofascielt smertesyndrom cervikotorakalt. Behandlingsforløp: Kiropraktisk behandling 1x/uke i 8 uker med 50% symptomreduksjon. Vedlikeholdsbehandling 1x/mnd anbefales. Ergonomisk tilrettelegging av arbeidsplass er avgjørende for videre prognose.'
    },
    {
        'input': 'Skriv forsikringsrapport: Ankelskade',
        'output': 'Rapport vedrørende lateral ankelligamentskade.\n\nSkadedato: 28.12.2025. Mekanisme: Inversjonstraume under tur i ulendt terreng. Klinisk grad II lateral ligamentskade (ATFL og CFL). Initialt behandlet med PRICE og kompresjonsbandage. Kiropraktisk rehabilitering startet uke 2: Leddmobilisering, bløtvevsbehandling og proprioseptiv trening. Status etter 8 uker: Full ROM gjenopprettet, lett residual instabilitetsfølelse. Anbefalt sportsspesifikk rehabilitering ytterligere 4 uker.'
    },
    {
        'input': 'Skriv forsikringsrapport: Thorax-skade etter fall',
        'output': 'Rapport vedrørende torakal kostofraktur.\n\nSkadedato: 10.01.2026. Mekanisme: Fall på glatt underlag med direkte traume mot thorax dx. Rtg viser fraktur costa 7 og 8 dx uten dislokasjon. Pneumothorax utelukket. Konservativ behandling. Kiropraktisk oppfølging startet 4 uker posttraumatisk: Forsiktig kostovertebral mobilisering, respirasjonsøvelser og bløtvevsbehandling. Status 8 uker: Frakturer tilhelet. Restsmerter ved dyp inspirasjon NRS 2/10.'
    },
]

# ============================================================
# Part B2: Professional Letters/Reports — Sick Leave Justifications (10)
# ============================================================

SICK_LEAVE = [
    {
        'input': 'Skriv sykmeldingsbegrunnelse: Akutt lumbago, full sykmelding 1 uke',
        'output': 'Sykmelding vedrørende akutt lumbago.\n\nPasienten presenterer med akutt mekanisk lumbalgi med betydelig funksjonsnedsettelse. Kan ikke sitte, stå eller gå mer enn 10 minutter sammenhengende. Antalgisk holdning. Ikke i stand til å utføre sitt arbeid som kontormedarbeider. Full sykmelding anbefales i 7 dager med gradvis tilbakeføring. Ny vurdering ved kontroll om 1 uke.'
    },
    {
        'input': 'Skriv sykmeldingsbegrunnelse: Cervikal radikulopati, gradert sykmelding',
        'output': 'Sykmelding vedrørende cervikal radikulopati C6 dx.\n\nPasienten har cervikal radikulopati med smerter og parestesier i dx overekstremitet. Funksjonsnedsettelse ved prolongert skjermarbeid og statiske stillinger. 50% gradert sykmelding anbefales i 4 uker. Pasienten kan arbeide inntil 4 timer daglig med hyppige pauser. Ergonomisk tilrettelegging av arbeidsplass anbefales.'
    },
    {
        'input': 'Skriv sykmeldingsbegrunnelse: Skulderimpingement, delvis sykmelding',
        'output': 'Sykmelding vedrørende subacromial impingement dx skulder.\n\nPasienten kan ikke utføre arbeidsoppgaver som krever elevasjon av dx arm over 90°. Arbeid som elektriker innebærer overhead-arbeid. Gradert sykmelding 50% anbefales i 3 uker med tilrettelegging: Unngå overhead-arbeid, begrense bruk av dx arm ved tunge løft. Rehabilitering pågår med god fremgang.'
    },
    {
        'input': 'Skriv sykmeldingsbegrunnelse: Isjias, full sykmelding 2 uker',
        'output': 'Sykmelding vedrørende lumbal radikulopati L5 sin.\n\nPasienten har lumbal diskusherniering med radikulopati og signifikant funksjonsnedsettelse. Kan ikke sitte mer enn 15 minutter eller stå mer enn 20 minutter. Arbeid som sjåfør er ikke mulig. Full sykmelding anbefales i 14 dager. Konservativ behandling igangsatt. Forventet gradvis bedring. Gradert tilbakeføring vurderes ved kontroll.'
    },
    {
        'input': 'Skriv sykmeldingsbegrunnelse: Akutt torticollis',
        'output': 'Sykmelding vedrørende akutt torticollis.\n\nPasienten presenterer med akutt cervikal muskelspasme med tvangsstilling av hodet (lateralfleksjon sin). Betydelig smerter ved alle cervikale bevegelser. Kan ikke kjøre bil eller utføre kontorarbeid grunnet bevegelsesrestriksjon. Full sykmelding 5 dager. Rask bedring forventes med manuell behandling og medikamentell spasmolytisk behandling.'
    },
    {
        'input': 'Skriv sykmeldingsbegrunnelse: Bekkenleddsmerter i graviditet',
        'output': 'Sykmelding vedrørende bekkenrelaterte smerter i graviditet, uke 32.\n\nPasienten har signifikant bekkenleddsinstabilitet med smerter over symfysen og SI-ledd bilateralt. Funksjonsnedsettelse ved gange > 100 m, trappegang og sittende arbeid > 30 min. Som barnehageansatt er arbeidskravene uforenlige med symptombildet. Gradert sykmelding 60% anbefales med tilrettelegging: Sittende arbeidsoppgaver, mulighet for hyppige stillingsskifter.'
    },
    {
        'input': 'Skriv sykmeldingsbegrunnelse: Whiplash etter ulykke',
        'output': 'Sykmelding vedrørende WAD grad II etter trafikkuhell.\n\nPasienten har nakkeslengskade med cervikalgi, cefalgi og konsentrasjonsvansker. Funksjonsnedsettelse ved skjermarbeid og kognitivt krevende oppgaver. Som regnskapsmedarbeider er arbeidskapasiteten betydelig redusert. Gradert sykmelding 50% anbefales i 4 uker. Kiropraktisk behandling 2x/uke. Gradvis opptrapping av arbeidsbelastning ved bedring.'
    },
    {
        'input': 'Skriv sykmeldingsbegrunnelse: Kronisk ryggsmerte, tilrettelegging',
        'output': 'Sykmelding vedrørende kronisk lumbalgi med funksjonsnedsettelse.\n\nPasienten har langvarig lumbalgi med perioder med akutt forverring. Aktuell episode: NRS 7/10. Arbeid som lagermedarbeider innebærer løft og fysisk belastning som forverrer tilstanden. Gradert sykmelding 50% i 2 uker anbefales. Tilrettelegging: Lettere arbeidsoppgaver, unngå løft > 10 kg. Rehabilitering med multimodal tilnærming pågår.'
    },
    {
        'input': 'Skriv sykmeldingsbegrunnelse: Karpaltunnelsyndrom',
        'output': 'Sykmelding vedrørende karpaltunnelsyndrom dx.\n\nPasienten har n. medianus-kompresjon i karpaltunnelen med parestesier og kraftnedsettelse i hånden. Funksjonsnedsettelse ved finmotorikk og PC-arbeid. Arbeid som programvareutvikler med kontinuerlig tastaturbruk forverrer symptomene. Gradert sykmelding 50% i 3 uker anbefales. Tilrettelegging med ergonomisk tastatur, håndleddsstøtte og regelmessige pauser.'
    },
    {
        'input': 'Skriv sykmeldingsbegrunnelse: Vertigo/BPPV',
        'output': 'Sykmelding vedrørende benign paroksysmal posisjonsvertigo.\n\nPasienten har akutt vertigo ved hodebevegelser med kvalme og balanseforstyrrelser. Kan ikke kjøre bil, betjene maskiner eller arbeide i høyden. Arbeid som byggarbeider er kontraindisert grunnet fallrisiko. Full sykmelding 5 dager anbefales. Repositjoneringsmanøver utført. Rask bedring forventes. Ny vurdering ved kontroll om 5 dager.'
    },
]

# ============================================================
# Part B2: Professional Letters/Reports — Clinical Summaries (10)
# ============================================================

CLINICAL_SUMMARIES = [
    {
        'input': 'Skriv klinisk sammendrag: Behandlingsforløp for kronisk nakkesmerte',
        'output': 'Klinisk sammendrag: Kronisk cervikalgi.\n\nBehandlingsperiode: 01.10.2025 – 15.01.2026. Antall konsultasjoner: 16. Diagnose: Kronisk mekanisk cervikalgi med myofascielle komponenter. Behandling: Spinal manipulasjon/mobilisering cervikal og øvre torakal, triggerpunktbehandling, motorisk kontrolltrening. Resultat: NRS redusert fra 7 til 2/10. Cervikal ROM normalisert. Pasientrapportert funksjonsgrad (NDI) forbedret fra 38% til 12%. Anbefaling: Vedlikeholdsbehandling 1x/mnd. Fortsette hjemmeøvelser.'
    },
    {
        'input': 'Skriv klinisk sammendrag: Behandling av akutt korsryggsmerte',
        'output': 'Klinisk sammendrag: Akutt lumbalgi med radikulopati.\n\nBehandlingsperiode: 05.01.2026 – 05.02.2026. Antall konsultasjoner: 8. Diagnose: Akutt lumbal diskusherniering L5-S1 dx med radikulopati. Behandling: McKenzie-tilnærming, forsiktig manuell terapi, nervemobilisering, smerteedukasjon. Forløp: Initial bedring fra uke 2. NRS fra 9/10 til 3/10. SLR normalisert. Motorisk funksjon restituert (kraft 5/5). Pasienten er tilbakeført til full aktivitet og arbeid.'
    },
    {
        'input': 'Skriv klinisk sammendrag: Rehabilitering etter skulderoperasjon',
        'output': 'Klinisk sammendrag: Postoperativ skulderrehabilitering.\n\nBehandlingsperiode: 15.11.2025 – 15.02.2026. Antall konsultasjoner: 20. Inngrep: Artroskopisk subacromial dekompresjon og rotatorcuff-sutur dx (utført 01.11.2025). Rehabilitering: Faseinndelt protokoll fra passiv ROM via aktiv assistert til full aktiv trening. Aktuell status: Full aktiv ROM. Kraft 5/5 alle retninger. Funksjonsgrad: DASH-score 8/100 (preoperativt 52/100). Sportsaktivitet tillatt fra uke 16. Oppfølging avsluttet.'
    },
    {
        'input': 'Skriv klinisk sammendrag: BPPV-behandling',
        'output': 'Klinisk sammendrag: Benign paroksysmal posisjonsvertigo.\n\nBehandlingsperiode: 12.01.2026 – 26.01.2026. Antall konsultasjoner: 3. Diagnose: BPPV bakre buegang dx. Diagnostikk: Positiv Dix-Hallpike dx med torsjonell geotrop nystagmus. Behandling: Epley repositjoneringsmanøver utført ved alle 3 konsultasjoner. Resultat: Symptomfri etter 2. behandling. Dix-Hallpike negativ bilat ved kontroll. DHI-score fra 48 til 4. Pasient instruert i Brandt-Daroff øvelser ved eventuelt residiv.'
    },
    {
        'input': 'Skriv klinisk sammendrag: Langvarig behandling av fibromyalgi',
        'output': 'Klinisk sammendrag: Fibromyalgi med multimodal behandling.\n\nBehandlingsperiode: 01.06.2025 – 01.02.2026. Antall konsultasjoner: 24 (initialt 1x/uke, deretter 1x/2 uker, nå 1x/mnd). Diagnose: Fibromyalgi (ACR 2016). Behandling: Bløtvevsbehandling, forsiktig mobilisering, graduert aktivitet, smerteedukasjon og søvnhygiene. Resultat: FIQ redusert fra 72 til 45. Antall smertefulle regioner redusert. Bedret søvnkvalitet og daglig funksjon. Anbefaling: Fortsette vedlikehold 1x/mnd og egentrening 3x/uke.'
    },
    {
        'input': 'Skriv klinisk sammendrag: Behandling av TMD',
        'output': 'Klinisk sammendrag: Temporomandibulær dysfunksjon.\n\nBehandlingsperiode: 10.12.2025 – 10.02.2026. Antall konsultasjoner: 8. Diagnose: TMD sin med myogen og artrogen komponent. Behandling: Intraoral triggerøunktbehandling, kjeveleddsmobilisering, cervikal manuell terapi, øvelser for kontrollert gaping. Resultat: Gapeevne økt fra 28 mm til 42 mm. Krepitasjon vedvarer, men smerte redusert fra NRS 6 til 1/10. Klikking eliminert. Anbefaling: Oppfølging ved behov, bruksbitten anbefalt.'
    },
    {
        'input': 'Skriv klinisk sammendrag: Avsluttet behandling uten bedring',
        'output': 'Klinisk sammendrag: Kronisk lumbalgi med utilfredsstillende behandlingsrespons.\n\nBehandlingsperiode: 15.09.2025 – 15.12.2025. Antall konsultasjoner: 12. Diagnose: Kronisk lumbalgi med sentralisert smertesensitisering. Behandling: Manuell terapi, motorisk kontroll, smerteedukasjon, graduert aktivitet. Resultat: Minimalt endret smerte- og funksjonsnivå (NRS 7 til 6/10, ODI 42% til 38%). Vurdering: Tilstanden responderer ikke tilstrekkelig på kiropraktisk behandling alene. Anbefaling: Tverrfaglig smerterehabilitering. Henvist fastlege for videre koordinering.'
    },
    {
        'input': 'Skriv klinisk sammendrag: Vedlikeholdsbehandling eldre pasient',
        'output': 'Klinisk sammendrag: Vedlikeholdsbehandling degenerativ columnalidelse.\n\nBehandlingsperiode: Løpende siden 2024. Frekvens: 1x/mnd. Diagnose: Multilevel degenerativ spondylose cervikal og lumbal columna. Tillegg: Mild kyfose torakalt. Behandling: Månedlig mobilisering, bløtvevsbehandling og øvelsesveiledning. Resultat: Stabil funksjon og smertenivå (NRS 2-3/10). Pasienten opprettholder selvstendig ADL og gangfunksjon. Anbefaling: Fortsette vedlikehold for å opprettholde funksjonsnivå og forebygge funksjonstap.'
    },
    {
        'input': 'Skriv klinisk sammendrag: Behandling av idrettsutøver med lyskesmerte',
        'output': 'Klinisk sammendrag: Idrettsrelatert inguinalsmerte.\n\nBehandlingsperiode: 01.12.2025 – 01.02.2026. Antall konsultasjoner: 10. Diagnose: Adduktor-relatert lyskesmerte dx. Behandling: Bløtvevsbehandling adduktormuskulatur, leddmobilisering hofte og bekken, progressiv styrketrening (Hölmich-protokoll). Resultat: Smerte ved adduksjon eliminert. Full kraft. HAGOS sport-score fra 45 til 88/100. Return-to-sport protokoll fullført uten residiv. Anbefaling: Forebyggende styrketrening. Sesongstart-screening anbefalt.'
    },
    {
        'input': 'Skriv klinisk sammendrag: Graviditetsrelaterte plager',
        'output': 'Klinisk sammendrag: Bekkenrelaterte smerter i graviditet.\n\nBehandlingsperiode: Uke 22 – uke 38. Antall konsultasjoner: 10. Diagnose: Bekkenleddsmerter med symfyseløsning og bilateral SI-leddsdysfunksjon. Behandling: Bekkenleddsmoilisering, bløtvevsbehandling, stabiliseringsøvelser, bekkenbeltetilpasning. Resultat: Funksjonsevnen bedret fra PGQ 68% til 35%. Pasienten kunne fortsette daglige aktiviteter og arbeid (gradert sykmelding 40%). Anbefaling: Postpartum oppfølging anbefalt 6-8 uker etter fødsel.'
    },
]

# ============================================================
# Part B2: Professional Letters/Reports — Interdisciplinary (10)
# ============================================================

INTERDISCIPLINARY_LETTERS = [
    {
        'input': 'Skriv brev til fastlege: Oppsummering kiropraktisk behandling av nakkesmerter',
        'output': 'Til fastlege.\n\nDet vises til ovennevnte pasient som har vært til kiropraktisk behandling ved KFA Majorstuen. Diagnose: Kronisk cervikalgi med cervikogen cefalgi. Funn: Segmentell dysfunksjon C1-C3, myofascielle triggerpunkter i cervikal muskulatur. Behandling: 8 konsultasjoner med spinal manipulasjon og bløtvevsbehandling. Resultat: Signifikant bedring av cefalgi (fra 4 til 1 episode/mnd). Cervikalgi redusert (NRS 6 til 2/10). Videre plan: Vedlikeholdsbehandling 1x/mnd. Ingen medikamentbehov vurdert fra vår side.'
    },
    {
        'input': 'Skriv brev til fastlege: Funn som krever videre utredning',
        'output': 'Til fastlege — Funn som krever supplerende utredning.\n\nDet vises til ovennevnte pasient som ble henvist til oss for lumbalgi. Ved klinisk undersøkelse fant vi: Progredierende motorisk utfall (kraftgrad 3/5 dorsifleksjon sin fot) og hypoestesi L5-dermatomet sin. Pasienten rapporterer tiltagende symptomer tross 4 ukers konservativ behandling. Vi ber om rekvirering av MR lumbalcolumna med tanke på romoppfyllende prosess eller signifikant diskusherniering med nevrokompresjon.'
    },
    {
        'input': 'Skriv brev til fastlege: Anbefaling om blodprøver ved mistenkt inflammasjon',
        'output': 'Til fastlege — Anbefaling om laboratorieundersøkelse.\n\nOvennevnte pasient presenterer med inflammatorisk ryggsmerte: Morgenstivhet > 45 min, bedring ved aktivitet, nattlige smerter, debut < 40 år. Klinisk undersøkelse viser bilateral SI-leddsaffeksjon og redusert lumbal fleksibilitet. Vi mistenker aksial spondyloartritt. Ber om rekvirering av: CRP, SR, HLA-B27, ferritin, ALP. Evt. MR sakroiliakaledd. Vennligst informer oss om resultater for videre behandlingsplanlegging.'
    },
    {
        'input': 'Skriv brev til fastlege: Pasient med røde flagg hodepine',
        'output': 'Til fastlege — Hastevurdering, røde flagg cefalgi.\n\nOvennevnte pasient, mann 55 år, oppsøkte oss for nakkesmerter. Ved anamneseopptak avdekket vi nyoppstått cefalgi med alarmerende trekk: Thunderclap-debut, oksipital lokalisasjon, verst ved Valsalva, og synsforstyrrelser. Pasienten er informert om at dette krever umiddelbar medisinsk vurdering. Vi har frarådet kiropraktisk behandling inntil sekundær cefalgi er utelukket. Ber om akutt nevrologisk vurdering og bildediagnostikk.'
    },
    {
        'input': 'Skriv brev til fastlege: Oppsummering etter whiplash-behandling',
        'output': 'Til fastlege.\n\nOppsummering av kiropraktisk behandlingsforløp etter WAD.\n\nPasienten har gjennomgått 16 konsultasjoner over 12 uker etter nakkeslengskade. Initialfunn: WAD grad II med cervikalgi, cefalgi og konsentrasjonsvansker. Behandling: Manuell terapi, øvelser og smerteedukasjon. Aktuell status: NRS 3/10 (fra 8/10). Cervikal ROM tilnærmet normalisert. Restsymptomer: Lett konsentrasjonsvansker ved langvarig kognitiv belastning. Anbefaling: Pasienten kan gjenoppta fullt arbeid med tilrettelegging. Vedlikeholdsbehandling planlagt.'
    },
    {
        'input': 'Skriv brev til fastlege: Bekymring for osteoporose',
        'output': 'Til fastlege — Bekymring vedrørende benhelse.\n\nOvennevnte pasient, kvinne 65 år, presenterer med torakal dorsalgi og klinisk økt torakal kyfose. Pasienten har risikofaktorer for osteoporose: Postmenopausal, lav BMI, røyker, familiehistorie. Palpasjon over Th7-Th9 utløser lokal smerte uten forutgående traume. Vi behandler forsiktig med bløtvevsbehandling (ikke manipulasjon torakalt) inntil benhelse er avklart. Ber om DEXA-scan og eventuelt rtg torakal for å utelukke kompresjonsfraktur.'
    },
    {
        'input': 'Skriv brev til fastlege: Felles oppfølging av kompleks pasient',
        'output': 'Til fastlege — Felles behandlingsplan.\n\nOvennevnte pasient har kronisk lumbalgi med komorbid depresjon og søvnforstyrrelser. Kiropraktisk behandling gir kortvarig symptomlindring, men funksjonsgevinsten begrenses av psykososiale faktorer. Vi foreslår felles behandlingsplan: 1) Kiropraktisk vedlikehold 2x/mnd for smertemodulering. 2) Vurdering av medikamentell søvnoptimalisering fra fastlege. 3) Henvisning til psykolog for kognitiv atferdsterapi relatert til smestemestring. 4) Felles evaluering om 3 mnd.'
    },
    {
        'input': 'Skriv brev til fastlege: Medisinsk attest for treningsresept',
        'output': 'Til fastlege — Anbefaling treningsresept.\n\nOvennevnte pasient har kronisk cervikalgi og torakal dorsalgi relatert til sedentær livsstil og dekondisjonering. Kiropraktisk behandling har gitt symptomreduksjon, men pasienten trenger strukturert fysisk aktivitet for varig effekt. Vi anbefaler treningsresept med følgende spesifikasjoner: Styrketrening 2x/uke (fokus cervikal og scapulær stabilisering), aerob trening 3x/uke (svømming eller gange). Pasienten er motivert og egnet for frisklivssentral.'
    },
    {
        'input': 'Skriv brev til fastlege: Pasient med mistenkt cauda equina',
        'output': 'Til fastlege — AKUTT: Mistenkt cauda equina-syndrom.\n\nOvennevnte pasient oppsøkte oss med akutt forverring av kjent lumbal diskusherniering. Ved undersøkelse fant vi: Bilateral radikulopati, nedsatt perianal sensibilitet (ridebukseanestesi), nyoppstått urinretensjon og nedsatt anal sfinktertonus. Klinisk bilde er forenlig med cauda equina-syndrom. Pasienten er informert om alvorlighetsgraden og er bedt om å oppsøke akuttmottak umiddelbart. Vi har IKKE utført manipulasjon. Ber om akutt MR og kirurgisk vurdering.'
    },
    {
        'input': 'Skriv brev til fastlege: Overføring av pasient ved flytting',
        'output': 'Til fastlege.\n\nEpikrise ved avslutning av behandlingsforhold.\n\nOvennevnte pasient flytter fra Oslo og avslutter behandlingen hos oss. Sammendrag: Pasienten har vært til kiropraktisk behandling for kronisk cervikalgi og cervikal radikulopati C6 dx. Behandlingsforløp: 24 konsultasjoner over 8 mnd. Aktuell status: Cervikalgi NRS 2/10, radikulære symptomer i remisjon. Vedlikeholdsfrekvens: 1x/mnd. MR cervikal (dato 15.08.2025) viser diskusprotrusjon C5-C6 uten kompresjon. Anbefaling: Fortsette kiropraktisk vedlikehold hos ny behandler. Journalutskrift vedlegges.'
    },
]


# ============================================================
# Assembly + Output
# ============================================================

def build_examples(items, system_prompt):
    """Build ChatML training examples from input/output pairs."""
    return [
        {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": item['input']},
                {"role": "assistant", "content": item['output']}
            ]
        }
        for item in items
    ]


def main():
    count_only = '--count' in sys.argv

    # Part A: Communication examples (100)
    sms_reminders = build_examples(SMS_APPOINTMENT_REMINDERS, SMS_SYSTEM)
    sms_cancellations = build_examples(SMS_CANCELLATIONS, SMS_SYSTEM)
    sms_waitlist = build_examples(SMS_WAITLIST, SMS_SYSTEM)
    sms_treatment = build_examples(SMS_TREATMENT_PLAN, SMS_SYSTEM)
    sms_new_patient = build_examples(SMS_NEW_PATIENT, SMS_SYSTEM)

    recall_3m = build_examples(RECALL_3_MONTH, RECALL_SYSTEM)
    recall_6m = build_examples(RECALL_6_MONTH, RECALL_SYSTEM)
    recall_annual = build_examples(RECALL_ANNUAL, RECALL_SYSTEM)
    recall_seasonal = build_examples(RECALL_SEASONAL, RECALL_SYSTEM)
    recall_post = build_examples(RECALL_POST_TREATMENT, RECALL_SYSTEM)

    # Part B: Norwegian formal medical terminology (100)
    formal_notes = build_examples(FORMAL_TERMINOLOGY, FORMAL_SYSTEM)

    referral_letters = build_examples(REFERRAL_LETTERS, LETTER_SYSTEM)
    insurance_reports = build_examples(INSURANCE_REPORTS, LETTER_SYSTEM)
    sick_leave = build_examples(SICK_LEAVE, LETTER_SYSTEM)
    clinical_summaries = build_examples(CLINICAL_SUMMARIES, LETTER_SYSTEM)
    interdisciplinary = build_examples(INTERDISCIPLINARY_LETTERS, LETTER_SYSTEM)

    # Combine all
    all_examples = (
        sms_reminders + sms_cancellations + sms_waitlist + sms_treatment + sms_new_patient
        + recall_3m + recall_6m + recall_annual + recall_seasonal + recall_post
        + formal_notes
        + referral_letters + insurance_reports + sick_leave + clinical_summaries + interdisciplinary
    )

    # Category counts for summary
    categories = {
        'SMS — Appointment Reminders': len(sms_reminders),
        'SMS — Cancellation Confirmations': len(sms_cancellations),
        'SMS — Waitlist Notifications': len(sms_waitlist),
        'SMS — Treatment Plan Summaries': len(sms_treatment),
        'SMS — New Patient Info': len(sms_new_patient),
        'Recall — 3-Month Lapsed': len(recall_3m),
        'Recall — 6-Month Lapsed': len(recall_6m),
        'Recall — Annual Check-up': len(recall_annual),
        'Recall — Seasonal': len(recall_seasonal),
        'Recall — Post-Treatment Follow-up': len(recall_post),
        'Formal Terminology — Clinical Notes': len(formal_notes),
        'Letters — Referrals': len(referral_letters),
        'Letters — Insurance Reports': len(insurance_reports),
        'Letters — Sick Leave Justifications': len(sick_leave),
        'Letters — Clinical Summaries': len(clinical_summaries),
        'Letters — Interdisciplinary': len(interdisciplinary),
    }

    total_sms = sum([
        len(sms_reminders), len(sms_cancellations), len(sms_waitlist),
        len(sms_treatment), len(sms_new_patient)
    ])
    total_recall = sum([
        len(recall_3m), len(recall_6m), len(recall_annual),
        len(recall_seasonal), len(recall_post)
    ])
    total_comms = total_sms + total_recall
    total_formal = len(formal_notes)
    total_letters = sum([
        len(referral_letters), len(insurance_reports), len(sick_leave),
        len(clinical_summaries), len(interdisciplinary)
    ])
    total_norwegian = total_formal + total_letters

    if count_only:
        print(f"Total examples: {len(all_examples)}")
        print(f"  Communication (SMS + Recall): {total_comms}")
        print(f"  Norwegian (Formal + Letters): {total_norwegian}")
        return

    # Shuffle for training
    random.seed(42)
    random.shuffle(all_examples)

    # Output directory
    script_dir = Path(__file__).parent.parent
    output_dir = script_dir / 'data' / 'mined'
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / 'comms-norwegian-v2-synthetic.jsonl'
    with open(output_file, 'w', encoding='utf-8') as f:
        for ex in all_examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    # Print summary
    print(f"{'=' * 60}")
    print(f"Generated {len(all_examples)} training examples")
    print(f"{'=' * 60}")
    print()
    print(f"Part A: Communication Examples ({total_comms})")
    print(f"  SMS Templates ({total_sms}):")
    print(f"    Appointment Reminders:       {len(sms_reminders)}")
    print(f"    Cancellation Confirmations:  {len(sms_cancellations)}")
    print(f"    Waitlist Notifications:      {len(sms_waitlist)}")
    print(f"    Treatment Plan Summaries:    {len(sms_treatment)}")
    print(f"    New Patient Info:            {len(sms_new_patient)}")
    print(f"  Recall Messages ({total_recall}):")
    print(f"    3-Month Lapsed:              {len(recall_3m)}")
    print(f"    6-Month Lapsed:              {len(recall_6m)}")
    print(f"    Annual Check-up:             {len(recall_annual)}")
    print(f"    Seasonal:                    {len(recall_seasonal)}")
    print(f"    Post-Treatment Follow-up:    {len(recall_post)}")
    print()
    print(f"Part B: Norwegian Formal Medical ({total_norwegian})")
    print(f"  Formal Terminology Notes:      {len(formal_notes)}")
    print(f"  Professional Letters ({total_letters}):")
    print(f"    Referral Letters:            {len(referral_letters)}")
    print(f"    Insurance Reports:           {len(insurance_reports)}")
    print(f"    Sick Leave Justifications:   {len(sick_leave)}")
    print(f"    Clinical Summaries:          {len(clinical_summaries)}")
    print(f"    Interdisciplinary Letters:   {len(interdisciplinary)}")
    print()
    print(f"Output: {output_file}")


if __name__ == '__main__':
    main()
