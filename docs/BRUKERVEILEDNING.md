# ChiroClickEHR 2.0 — Brukerveiledning

## Innhold

1. [Velkommen](#1-velkommen)
2. [Installasjon og forste oppstart](#2-installasjon-og-forste-oppstart)
3. [Daglig arbeidsflyt](#3-daglig-arbeidsflyt)
4. [Pasienter](#4-pasienter)
5. [Konsultasjon og journalfoering](#5-konsultasjon-og-journalfoering)
6. [Timer og kalender](#6-timer-og-kalender)
7. [Ovelser](#7-ovelser)
8. [AI-funksjoner](#8-ai-funksjoner-valgfritt)
9. [Sikkerhetskopiering](#9-sikkerhetskopiering)
10. [Tastatursnarveier](#10-tastatursnarveier)
11. [Feilsoking](#11-feilsoking)
12. [Oppdateringer](#12-oppdateringer)

---

## 1. Velkommen

ChiroClickEHR er et komplett elektronisk pasientjournalsystem (EPJ) og CRM-system bygget for norske kiropraktorer. Programmet kjorer lokalt pa din maskin — ingen skylagring, ingen abonnement, ingen tredjepartsavhengigheter.

**Hovedfunksjoner:**

- Pasientjournal med SOAP-format og ICPC-2-koding
- Kalender med timebestilling og pasientflyt
- Ovelsesforskrivning med utskrift og pasientportal
- CRM med oppfolginger, kommunikasjon og okonomi
- Valgfri AI-stotte for kliniske forslag (krever Ollama)
- Full GDPR-stotte med revisjonslogg og dataeksport

---

## 2. Installasjon og forste oppstart

### Systemkrav

| Krav           | Minimum                        | Anbefalt                 |
| -------------- | ------------------------------ | ------------------------ |
| Operativsystem | Windows 10 (64-bit)            | Windows 11               |
| RAM            | 4 GB                           | 8 GB                     |
| Diskplass      | 500 MB + plass til pasientdata | 2 GB                     |
| Valgfritt      | —                              | Ollama for AI-funksjoner |

### Last ned og start

1. Last ned `ChiroClickEHR 2.0.0.exe` — filen er portabel og trenger ingen installasjon.
2. Plasser filen i en mappe du velger, f.eks. `C:\ChiroClickEHR\`.
3. Dobbeltklikk for a starte programmet.

Forste oppstart tar ca. 10 sekunder ekstra mens databasen initialiseres.

### Forste gangs oppsett

Nar du starter ChiroClickEHR for forste gang, vises en veiviser som guider deg gjennom:

1. **Klinikkinformasjon** — Klinikknavn, adresse og kontaktdetaljer.
2. **Opprett konto** — Din brukerkonto med e-post og passord.
3. **Innstillinger** — Grunnleggende preferanser for journalfoering og timebestilling.

Etter veiviseren lander du pa **Dashbord**, som er startpunktet for daglig bruk.

---

## 3. Daglig arbeidsflyt

### Dashbord

Dashbord gir deg oversikt over dagens situasjon med KPI-kort:

- **Timer** — Antall timer i dag
- **Rode flagg** — Pasienter med kliniske varsler
- **Oppfolginger** — Pasienter som trenger oppfolging
- **Pasienter** — Totalt antall aktive pasienter
- **Okonomi** — Daglig omsetning
- **Usignerte notater** — Journalnotater som venter pa signering

### Pasientflyt

Pasientflyt viser dagens pasienter i tre kolonner:

1. **Venter** — Pasienten er sjekket inn og venter pa behandling.
2. **Under behandling** — Du har apnet journalen og startet konsultasjonen.
3. **Ferdig** — Konsultasjonen er fullfort og pasienten er sjekket ut.

Dra og slipp pasienter mellom kolonnene, eller bruk knappene for a flytte dem videre i flyten.

---

## 4. Pasienter

### Opprett ny pasient

1. Trykk **Ny pasient** i sidemenyen, eller bruk **Ctrl+N**.
2. Fyll inn obligatoriske felter: navn, fodselsnummer, telefon.
3. Legg til valgfrie felter: e-post, adresse, fastlege, forsikring.
4. Klikk **Lagre**.

### Sok etter pasient

Bruk **Ctrl+K** for a apne kommandopaletten. Skriv inn navn, fodselsnummer eller telefonnummer. Resultatene vises mens du skriver — klikk pa pasienten for a apne journalen.

Du kan ogsa bla gjennom pasientlisten under **Pasienter** i sidemenyen.

### Pasientjournal og historikk

Pasientjournalen viser:

- **Personopplysninger** — Kontaktinfo, fodselsnummer, fastlege.
- **Journalhistorikk** — Alle tidligere konsultasjoner i kronologisk rekkefolge.
- **Dokumenter** — Brev, Henvisningsbrev, Sykmeldinger og andre vedlegg.
- **Ovelser** — Foreskrevne treningsprogrammer.
- **Kommunikasjon** — SMS- og e-posthistorikk.

---

## 5. Konsultasjon og journalfoering

### SOAP-format

Alle konsultasjoner dokumenteres i SOAP-format:

- **S — Subjektiv**: Pasientens beskrivelse av plager, symptomer og historikk.
- **O — Objektiv**: Dine kliniske funn fra undersokelsen (palpasjon, bevegelighet, nevrologisk testing).
- **A — Analyse**: Din vurdering og diagnose (med ICPC-2-kode).
- **P — Plan**: Behandlingsplan, oppfolging og eventuelle henvisninger.

Slik starter du en konsultasjon:

1. Apne pasienten fra **Pasientflyt** eller **Pasienter**.
2. Klikk **Konsultasjon** for a opprette et nytt journalnotat.
3. Fyll inn SOAP-feltene.
4. Legg til ICPC-2-kode (sok etter diagnose eller kode).
5. Klikk **Lagre** og signer notatet.

### Hurtigvurdering

**Hurtigvurdering** (EasyAssessment) er et forenklet skjema for enklere konsultasjoner og oppfolgingstimer. Her kan du:

- Markere smerteomrade pa kroppskart.
- Velge funn fra forhndsdefinerte lister.
- Bruke makroer for standardtekst.

Resultatet genererer automatisk et SOAP-notat som du kan redigere for du lagrer.

### Makroer

Under **Makroer** kan du opprette og organisere standardtekster for gjenbruk:

- Vanlige funn (f.eks. "Normal cervikalbevegelighet")
- Behandlingsbeskrivelser (f.eks. "Manipulasjon Th4-6, myk vevsbehandling paravertebral muskulatur")
- Standardplaner (f.eks. "Ny time om 1 uke, ovelser foreskrevet")

Klikk pa en makro i konsultasjonen for a sette inn teksten i det aktive feltet.

---

## 6. Timer og kalender

### Kalender

**Kalender** viser timene dine i dag-, uke- eller manedsvisning. Hver time er fargekodet etter type (forstegangs, oppfolging, akutt).

### Opprett time

1. Klikk pa et ledig tidspunkt i kalenderen, eller bruk **Ny time** i sidemenyen.
2. Velg pasient (sok etter navn eller fodselsnummer).
3. Velg timetype og varighet.
4. Legg til eventuell merknad.
5. Klikk **Lagre**.

### Tidsblokker

Du kan blokkere tid for lunsj, administrativt arbeid eller annet ved a opprette en tidsblokk i kalenderen. Tidsblokker hindrer at timer bookes i det tidsrommet.

---

## 7. Ovelser

Under **Ovelser** finner du et bibliotek med treningsovelser du kan foreskrive til pasienter.

### Forskriv ovelser

1. Apne pasientjournalen.
2. Ga til **Ovelser**-fanen.
3. Velg ovelser fra biblioteket — du kan soke eller filtrere etter kroppsregion.
4. Juster antall repetisjoner, serier og frekvens.
5. Klikk **Lagre**.

### Del med pasienten

- **Skriv ut** — Generer et PDF-ark med bilder og instruksjoner.
- **Pasientportal** — Pasienten kan se ovelsene sine via nettleseren (krever at portalen er aktivert under Innstillinger).

---

## 8. AI-funksjoner (valgfritt)

ChiroClickEHR kan bruke lokale AI-modeller for klinisk stotte. AI-en kjorer helt lokalt — ingen pasientdata sendes ut av maskinen.

### Sett opp Ollama

1. Last ned og installer [Ollama](https://ollama.com/download) for Windows.
2. Apne en terminal (Ledetekst eller PowerShell) og kjor:
   ```
   ollama pull chiro-no-sft-dpo-v6
   ```
3. Ollama starter automatisk pa port 11434. ChiroClickEHR oppdager den automatisk.

### AI-status

I statuslinjen nederst i programmet vises en prikk som indikerer AI-tilgjengelighet:

- **Gronn prikk** — Ollama er tilkoblet og AI-modellen er klar.
- **Graa prikk** — Ollama er ikke tilgjengelig. Alle funksjoner virker normalt, men uten AI-forslag.

### Hva AI-en kan hjelpe med

- **SOAP-forslag** — Basert pa det du skriver i Subjektiv-feltet, foreslar AI-en tekst for Objektiv, Analyse og Plan.
- **Rode flagg** — AI-en varsler om symptomer som kan tyde pa alvorlige tilstander (f.eks. cauda equina, fraktur, infeksjon).
- **Behandlingsforslag** — Forslag til behandlingsteknikker basert pa diagnose og funn.

Alle AI-forslag er bare forslag. Du har alltid fullt klinisk ansvar for journalinnholdet.

### AI-trening og AI-ytelse

Under **AI-trening** i sidemenyen kan du se treningsdata og evaluering av modellen. Under **AI-ytelse** finner du statistikk over modellens bruk, responstid og noyaktighet.

---

## 9. Sikkerhetskopiering

Alle data lagres lokalt i:

```
%APPDATA%\chiroclickehr-desktop\data\
```

Denne mappen inneholder databasen, sikkerhetskopier, opplastede filer og logger.

### Eksporter data

1. Bruk **Fil > Eksporter data** eller trykk **Ctrl+Shift+E**.
2. Velg lagringssted (USB-minnepinne, ekstern disk eller synkronisert skymappe).
3. Filen lagres som `.sql`.

### Importer data

1. Bruk **Fil > Importer data** eller trykk **Ctrl+Shift+I**.
2. Velg `.sql`-filen du vil gjenopprette fra.
3. Bekreft gjenopprettingen.

### Anbefalt rutine

| Hyppighet | Handling                                                                    |
| --------- | --------------------------------------------------------------------------- |
| Daglig    | Eksporter til USB eller skysynkronisert mappe                               |
| Ukentlig  | Kopier hele `%APPDATA%\chiroclickehr-desktop\data\`-mappen til ekstern disk |

---

## 10. Tastatursnarveier

| Snarvei          | Handling                                                            |
| ---------------- | ------------------------------------------------------------------- |
| **Ctrl+K**       | Apne kommandopaletten (sok etter pasienter, kommandoer, navigasjon) |
| **Ctrl+N**       | Ny pasient                                                          |
| **Ctrl+/**       | Vis alle tastatursnarveier                                          |
| **Ctrl+Shift+E** | Eksporter data                                                      |
| **Ctrl+Shift+I** | Importer data                                                       |
| **Esc**          | Lukk aktiv dialog eller panel                                       |

Du kan se en fullstendig oversikt over snarveier ved a trykke **Ctrl+/** nar som helst i programmet.

---

## 11. Feilsoking

### Programmet starter ikke

- Sjekk om en annen applikasjon bruker port 3000.
- Apne Oppgavebehandling, lukk eventuelle Node.js-prosesser, og prov igjen.

### Databasefeil ved oppstart

- Programmet forsker a gjenopprette automatisk.
- Hvis feilen vedvarer: gi nytt navn til mappen `%APPDATA%\chiroclickehr-desktop\data\pglite\` og start pa nytt. Gjenopprett deretter data fra en sikkerhetskopi.

### Treg ytelse

- Lukk andre tunge applikasjoner (nettleserfaner, utviklingsverktoy).
- Databasen kjorer i minnet — mer RAM gir bedre ytelse.

### GPU-advarsler i konsollen

Meldinger som "Unable to create cache" er ufarlige Chromium-advarsler og pavirker ikke funksjonaliteten.

For mer detaljert feilsoking, se [DESKTOP-SETUP.md](DESKTOP-SETUP.md).

---

## 12. Oppdateringer

1. Last ned den nye versjonen av `ChiroClickEHR 2.0.x.exe`.
2. Erstatt den gamle `.exe`-filen med den nye.
3. Start programmet — dataene dine er bevart (lagret i AppData, ikke ved siden av exe-filen).

Programmet varsler deg nar en ny versjon er tilgjengelig.

---

_ChiroClickEHR 2.0 — Utviklet for norske kiropraktorer. Data lagres lokalt. Ingen skyavhengighet._
