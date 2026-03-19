# ChiroClickEHR — Ofte stilte sporsmal (FAQ)

Denne siden svarer paa de vanligste sporsmaalene om ChiroClickEHR.
Appen er en desktop EHR/CRM-losning laget for norske kiropraktorer.

---

## Installasjon (Installation)

### Hva er systemkravene?

Du trenger Windows 10 eller 11, 64-bit, med minst 4 GB RAM og 500 MB ledig diskplass.
Hvis du vil bruke AI-funksjonene trenger du i tillegg en GPU med minst 8 GB VRAM, men dette er helt valgfritt.

### Trengs det en installer?

Nei, ChiroClickEHR er en portabel applikasjon. Du laster ned en enkelt `.exe`-fil og kjorer den direkte — ingen installasjon nodvendig. Windows Defender kan vise en SmartScreen-advarsel forste gang; klikk "Mer info" og deretter "Kjor likevel".

### Hvor lagres dataene mine?

All data lagres lokalt paa din maskin under:

```
%APPDATA%\chiroclickehr-desktop\data\
```

Databasen (PGlite) og loggfiler ligger i denne mappen. Ingen data sendes til skyen.

### Kan jeg flytte appen til en annen PC?

Ja. Kopier `.exe`-filen og hele data-mappen (`%APPDATA%\chiroclickehr-desktop\data\`) til den nye maskinen. Start appen, og alt skal vaere som for — pasienter, journaler og innstillinger folger med.

### Maa jeg aapne porter i brannmuren?

Nei, appen bruker kun lokale porter (backend paa port 3000, frontend paa port 5173). Disse er kun tilgjengelige fra din egen maskin og krever ingen brannmurendringer.

---

## Daglig bruk (Daily use)

### Hvordan soker jeg etter en pasient?

Trykk `Ctrl+K` for aa aapne kommandopaletten (Command Palette). Skriv inn navn, fodselsdato eller telefonnummer, og velg pasienten fra resultatlisten. Du kan ogsaa bruke sokefeltet overst i pasientlisten.

### Hvordan lager jeg en ny pasient?

Trykk `Ctrl+N` eller klikk "Ny pasient"-knappen i pasientlisten. Fyll ut obligatoriske felt (navn og fodselsdato) og lagre. Du kan legge til kontaktinfo og anamnese etterpaa.

### Hva betyr SOAP-formatet?

SOAP er et standardisert journalformat brukt i helsevesenet:

- **S (Subjektiv)** — Pasientens egne symptomer og plager
- **O (Objektiv)** — Dine kliniske funn fra undersokelesen
- **A (Analyse)** — Din vurdering og diagnose
- **P (Plan)** — Behandlingsplan og oppfolging

ChiroClickEHR bruker dette formatet som standard i alle kliniske journaler.

### Kan jeg bruke appen uten internett?

Ja, alt kjorer lokalt paa din maskin. Verken database, AI eller andre funksjoner krever internettilkobling. Appen fungerer like godt offline som online.

### Hvordan tar jeg backup av dataene?

Gaa til Fil > Eksporter data, eller bruk hurtigtasten `Ctrl+Shift+E`. Dette lager en komplett eksport av alle pasienter, journaler og innstillinger som du kan lagre paa en ekstern disk eller USB-minnepinne. Vi anbefaler aa ta backup minst ukentlig.

### Kan flere behandlere bruke samme installasjon?

ChiroClickEHR er designet for enkeltbruker-praksis. Appen har ingen flerbruker-paaloggging, men du kan skifte mellom behandlerprofiler i innstillingene hvis dere deler maskin.

---

## AI-funksjoner (AI features)

### Trengs AI for aa bruke appen?

Nei, AI er helt valgfritt. Alle kjernefunksjoner — pasientregister, journalforing, timebestilling og fakturering — fungerer uten AI. AI-funksjonene er et tillegg for de som onsker beslutningsstotte.

### Hva er Ollama?

Ollama er en gratis, lokal AI-motor som kjorer maskinlaeringsmodeller direkte paa din PC. Den maa installeres separat fra [ollama.com](https://ollama.com). Naar Ollama kjorer (port 11434), oppdager ChiroClickEHR den automatisk.

### Hvilken AI-modell brukes?

Standardmodellen er `chiro-no-sft-dpo-v6`, som er spesialtrenet for norsk kiropraktikk. Den gir forslag paa norsk og forstaar klinisk terminologi som ICD-10/ICPC-koder, differensialdiagnoser og rodde flagg.

### Er AI-forslagene medisinske raad?

Nei, AI-forslagene er beslutningsstotte — ikke medisinske raad. Behandler har alltid siste ord. Alle AI-genererte forslag er tydelig merket i grensesnittet, og du maa aktivt godkjenne dem for de legges inn i journalen.

### Hva slags forslag gir AI-en?

AI-en kan foreslaa differensialdiagnoser basert paa funn, generere SOAP-notater, foreslaa ICD-10/ICPC-koder, flagge rodde flagg (alvorlige symptomer), og hjelpe med aa skrive henvisningsbrev og epikriser.

---

## Feilsoking (Troubleshooting)

### Appen starter ikke

Sjekk om port 3000 allerede er i bruk av en annen prosess. Aapne Oppgavebehandling (Task Manager) og se etter `node.exe`-prosesser som kjorer fra en tidligere sesjon. Drep disse og prov igjen. Hvis problemet vedvarer, start maskinen paa nytt.

### Hvit skjerm ved oppstart

Dette er normalt de forste 10-15 sekundene mens backend-serveren starter opp. Vent til skjermen laster ferdig. Hvis den hvite skjermen vedvarer i mer enn 30 sekunder, sjekk loggfilene for feilmeldinger.

### Ollama vises som "frakoblet"

Sjekk at Ollama faktisk kjorer ved aa aapne en nettleser og gaa til `http://localhost:11434`. Hvis du faar svar, kjorer Ollama. Hvis ikke, start Ollama manuelt fra Start-menyen eller terminalen med kommandoen `ollama serve`.

### Hvor finner jeg loggfiler?

Loggfiler ligger under:

```
%APPDATA%\chiroclickehr-desktop\data\logs\
```

Her finner du baade backend-logger og feillogger. Disse er nyttige ved feilsoking og kan deles med utvikler ved behov.

### Databasen virker treg

PGlite-databasen kan bli treg hvis den vokser seg stor over tid. Prov aa restarte appen. Hvis problemet vedvarer, ta en backup (Ctrl+Shift+E) og kontakt utvikler for eventuell databaseoptimalisering.

### Hvordan tilbakestiller jeg innstillingene?

Gaa til Innstillinger > Generelt og klikk "Tilbakestill til standard". Dette pavirker kun appens innstillinger — pasientdata og journaler forblir urort. Hvis du trenger aa tilbakestille alt, kan du slette data-mappen manuelt og starte appen paa nytt.

---

_Sist oppdatert: Mars 2026_
