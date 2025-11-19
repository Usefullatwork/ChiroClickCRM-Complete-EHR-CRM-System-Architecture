# Klinisk Treningsdatasett - Kiropraktikk/Fysioterapi

## Oversikt
Dette datasettet inneholder anonymiserte, vasket og strukturert kliniske journalnotater fra kiropraktisk/fysioterapeutisk praksis. Dataene er organisert etter AUT-modellen (Anamnese, Undersøkelse, Tiltak/Behandling) for å trene AI-modeller i journalføring og klinisk vurdering.

## Datasett-statistikk
- **Antall caser**: 32
- **Format**: JSONL (JSON Lines)
- **Språk**: Norsk
- **Anonymisering**: GDPR-compliant (fjernet navn, datoer, administrative repetisjoner)
- **Struktur**: Prompt-response par

## Kategorier

### Korsrygg, Hofte & Bekken (Lumbal/Pelvis)
- Langvarige hoftesmerter med vaskulær problematikk
- Kompleks kne/rygg/stress
- Hofte, lyske og isjias-lignende smerter
- Kronisk hofte/sete med krampetendenser
- Ryggstivhet ("Gammelmanns-følelse")
- Bekken/sete (graviditet/etter fødsel)
- Korsrygg etter snømåking/hagearbeid

### Nakke, Skulder & Hodepine (Cervikal/Thorakal)
- Migrene og spenningshodepine
- Nakke og kjeve (stress)
- Akutt nakke (trening/kink)
- Skulder/arm (Frozen shoulder problematikk)
- Baby/amming-relatert nakke/skulder
- Nerverotspåvirkning (cervikal)
- Brystsmerter (thorakal/costal)

### Albue & Underarm
- Epikondylitt (Tennisalbue/Musearm)
- Traume/kompensasjon (fall på sykkel)
- Underarm/håndledd (oppussing/belastning)

### Spesifikke Tilstander & Diagnoser
- BPPV (Krystallsyke/svimmelhet)
- Kne (Menisk/Jumpers Knee)
- Legg/Akilles (operert)
- Polynevropati og svimmelhet
- Kyssesyken med muskelsmerter
- Utbrenthet og kroppslige smerter
- Kompleks (kreft, operasjoner, sykling)

## Format

Hver linje i JSONL-filen inneholder ett treningseksempel:

```json
{
  "prompt": "Pasientinformasjon og anamnese...",
  "response": "Funn, behandling og plan..."
}
```

### Eksempel

```json
{
  "prompt": "Pasient: Kvinne med langvarige smerter. Åreknute venstre side, kaldt område høyre ankel...",
  "response": "Observasjon: Mer aktivitet i Erector Spinae (ES) fra T7-L5. Behandling: Dypvevsmassasje..."
}
```

## Bruk i Ollama-trening

Dette datasettet kan brukes direkte med Ollama-treningspipelinen:

```bash
# Via API
POST /api/training/create-dataset
{
  "clinicalEncounters": []
}

# Via CLI
ollama create chiropractor-assistant -f training_data/Modelfile
```

## Medisinsk Terminologi

Datasettet bruker standardisert norsk medisinsk terminologi:

### Behandlingsmetoder
- **IMS**: Intramuskulær stimulering (dry needling)
- **Dbm**: Dypvevsmassasje
- **Bvm**: Bløtvevsmassasje
- **Trp**: Triggerpunktbehandling
- **ART**: Active Release Technique
- **HVLA**: High Velocity Low Amplitude (manipulasjon)
- **IASTM**: Instrument-Assisted Soft Tissue Mobilization
- **ESWT**: Extracorporeal Shockwave Therapy (trykkbølge)

### Anatomiske Begreper
- **ES**: Erector Spinae
- **QL**: Quadratus Lumborum
- **SCM**: Sternocleidomastoideus
- **TFL**: Tensor Fascia Latae
- **SI**: Sacroiliac (bekkenleddet)
- **AROM/PROM**: Active/Passive Range of Motion

### Tester
- **Spurling**: Cervikal nerverottest
- **SLR**: Straight Leg Raise
- **Dix-Hallpike**: BPPV-test
- **McMurray**: Menisktest
- **Thessaly**: Knetest

## Personvern (GDPR)

Dette datasettet er anonymisert iht. GDPR:
- ✅ Fjernet: Navn, datoer, personnummer, adresser, telefonnummer
- ✅ Beholdt: Klinisk kontekst, symptomer, funn, behandling
- ✅ Generalisert: Alder (intervaller), geografisk informasjon

## Lisens og Bruk

Dette datasettet er kun for intern bruk i ChiroClickCRM systemet. Ikke distribuer eksternt uten tillatelse.

## Vedlikehold

Sist oppdatert: 2025-11-19
Versjon: 1.0
Format: JSONL (JSON Lines)
