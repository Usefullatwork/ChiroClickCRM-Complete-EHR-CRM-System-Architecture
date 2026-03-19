# ChiroClickEHR — Hurtigreferanse

## Tastatursnarveier

| Snarvei      | Handling                 |
| ------------ | ------------------------ |
| Ctrl+K       | Kommandopalett (sok alt) |
| Ctrl+N       | Ny pasient               |
| Ctrl+/       | Vis tastatursnarveier    |
| Ctrl+Shift+E | Eksporter data           |
| Ctrl+Shift+I | Importer data            |
| Esc          | Lukk dialoger            |
| F11          | Fullskjerm               |

## Daglig arbeidsflyt

1. Aapne appen — sjekk Dashbord
2. Se Kalender for dagens timer
3. Klikk pasient → Start konsultasjon
4. Fyll ut SOAP (S/O/A/P)
5. Legg til ovelser og plan
6. Signer notat → Bestill neste time

## SOAP-format

- **S** (Subjektiv): Hva forteller pasienten?
- **O** (Objektiv): Hva finner du ved undersokelse?
- **A** (Analyse): Diagnose og vurdering
- **P** (Plan): Behandling, ovelser, oppfolging

## Sidenavigasjon

| Meny          | Beskrivelse                      |
| ------------- | -------------------------------- |
| Dashbord      | Dagsoversikt og KPI              |
| Pasienter     | Pasientliste og journal          |
| Kalender      | Timeplan                         |
| Pasientflyt   | Sjekk inn/ut                     |
| Kommunikasjon | SMS og meldinger                 |
| Oppfolginger  | Pasienter som trenger oppfolging |
| Ovelser       | Ovelsesbibliotek                 |
| Innstillinger | Klinikkoppsett                   |

## AI-status

- Gronn prikk = Ollama kjorer, AI tilgjengelig
- Graa prikk = Ollama ikke tilkoblet (appen fungerer normalt uten)

## Nodbackup

Fil > Eksporter data → Lagre SQL-fil til USB/skymappe

## Data

Alle data: `%APPDATA%\chiroclickehr-desktop\data\`
