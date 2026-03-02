---
name: norwegian-medical
description: Norwegian Bokmål medical content standards. Auto-activates when writing or editing Norwegian UI text, patient communications, consent forms, error messages, medical terminology, SOAP notes, or any patient-facing strings.
---

# Norwegian Medical Content Standards for ChiroClickCRM

## Language Rules

- ALL patient-facing text in Norwegian Bokmål (nb-NO)
- Use "du/deg" (informal), not "De/Dem" (formal)
- Date format: DD.MM.YYYY (Norwegian standard)
- Time format: HH:MM (24-hour clock)
- Currency: NOK with Norwegian formatting (1 234,50 kr)
- Decimal separator: comma (,) not period (.)

## Chiropractic Terminology

| Norwegian      | English                | Context            |
| -------------- | ---------------------- | ------------------ |
| Kiropraktor    | Chiropractor           | Professional title |
| Behandling     | Treatment              | Clinical           |
| Undersøkelse   | Examination            | Clinical           |
| Pasientjournal | Patient record         | Legal term         |
| Timebestilling | Appointment booking    | UI                 |
| Henvisning     | Referral               | To/from GP         |
| Epikrise       | Discharge summary      | To GP              |
| Sykemelding    | Sick leave certificate | NAV integration    |
| Røntgen        | X-ray                  | Imaging            |
| Diagnose       | Diagnosis              | ICPC-2             |
| Konsultasjon   | Consultation           | Billing            |
| Egenandel      | Co-payment             | Billing            |
| Frikort        | Exemption card         | HELFO              |

## SOAP Note Labels (Norwegian)

- **S** — Subjektiv (pasientens beskrivelse)
- **O** — Objektiv (kliniske funn)
- **A** — Analyse/Vurdering (diagnose, ICPC-2 kode)
- **P** — Plan (behandlingsplan, oppfølging)

## Error Messages Pattern

Always explain the problem AND the fix:

- "Passord må inneholde: minst 8 tegn, minst én stor bokstav (A-Z), minst ett tall (0-9)"
- NOT: "Ugyldig passord"

## Consent Text (Datatilsynet requirements)

Must include in plain Norwegian (klarspråk):

1. Hva slags opplysninger som samles inn
2. Formålet med behandlingen
3. Hvor lenge opplysningene lagres
4. Hvem som har tilgang
5. Pasientens rettigheter (innsyn, retting, sletting)
6. Kontaktinformasjon for personvernombud
