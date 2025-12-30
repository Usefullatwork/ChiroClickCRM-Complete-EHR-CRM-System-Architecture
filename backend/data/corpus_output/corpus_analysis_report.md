# Clinical Corpus Analysis Report

Generated: 2025-11-19T02:44:27.299Z

## Overview

- **Total Clinical Notes**: 16
- **Total Sections Extracted**: 49
- **Templates Extracted**: 18
- **Training Examples Created**: 23

## Note Type Distribution

| Note Type | Count | Percentage |
|-----------|-------|------------|
| mixed | 2 | 12.5% |
| behandling | 4 | 25.0% |
| undersøkelse | 4 | 25.0% |
| anamnese | 6 | 37.5% |

## Anatomical Region Coverage

| Region | Occurrences |
|--------|-------------|
| cervical | 12 |
| thoracal | 9 |
| lumbal | 6 |
| skulder | 6 |
| kne | 4 |
| hofte | 2 |
| fot | 2 |
| sacrum | 1 |

## Treatment Techniques Used

| Technique | Occurrences | Description |
|-----------|-------------|-------------|
| bvm | 12 | Bløtvevsbehandling/Myofascial Release |
| hvla | 11 | Leddmobilisering (HVLA) |
| ims | 5 | Nålebehandling (IMS/Dry Needling) |
| inhib | 5 | Inhibering |
| tgp | 4 | Triggerpunktbehandling |
| traksjon | 2 | Traksjon |
| gapping | 1 | Gapping |
| mobilisering | 1 | Leddmobilisering |

## Template Categories

| Category | Templates |
|----------|----------|
| Palpasjon | 7 |
| Cervical | 7 |
| Generelt | 2 |
| Korsrygg | 1 |
| Thoracal | 1 |

## Training Example Types

| Type | Count | Description |
|------|-------|-------------|
| technique_documentation | 22 | Treatment technique documentation |
| full_note | 1 | Complete SOAP note generation |

## Sample Templates

### 1. Palpasjon - Funn

**SOAP Section**: objective

```
palpasjon av v trapz, interscapulær mm trigger kjent smerte i v ux. Også anspent i rotatorcuff infraspinatus og noe i nakke.
```

### 2. Cervical - Behandling

**SOAP Section**: plan

```
V interscapulær mm bvm, slipper bra. Bilat trapz ims, Pasienten samtykker til nålebehandling. Området som skal penetreres med nål desinfeseres nøye før teknikken utføres. V lats bvm, slipper bra. V lats ims, Pasienten samtykker til nålebehandling. Området som skal penetreres med nål desinfeseres nøy...
```

### 3. Korsrygg - Undersøkelse

**SOAP Section**: objective

```
Kemp: ua. Slump: ua. Reflekser ux: ua. Sensibilitet ux: ua. Palpasjon: palpasjonsøm høyre ekstensor antebrachi, biceps brachi, h ant delt, h trapz, h interscapulær mm, h ql og h sete.
```

### 4. Palpasjon - Funn

**SOAP Section**: objective

```
palpasjonsøm høyre ekstensor antebrachi, biceps brachi, h ant delt, h trapz, h interscapulær mm, h ql og h sete.
```

### 5. Thoracal - Behandling

**SOAP Section**: plan

```
V paraspinal lumbal mm bvm, slipper bra. V paraspinal thoracal mm bvm, slipper bra. V nedre trapz bvm, slipper bra. T10 lett hvla, slipper bra. L2 v hvla, lett trykk, slipper bra. Viser jeffersons curl og sidebøy med samme prinsipp. Ser om en uke.
```

## Sample Training Examples

### Example 1: technique_documentation

**Prompt**:
```
Hvordan dokumenterer du bvm behandling?
```

**Response**:
```
V interscapulær mm bvm, slipper bra
```

### Example 2: technique_documentation

**Prompt**:
```
Hvordan dokumenterer du ims behandling?
```

**Response**:
```
Bilat trapz ims, Pasienten samtykker til nålebehandling
```

### Example 3: technique_documentation

**Prompt**:
```
Hvordan dokumenterer du hvla behandling?
```

**Response**:
```
T6 hvla, slipper bra
```

## Recommendations

### For Template System
- Import 18 extracted templates into database
- Templates cover 5 anatomical categories
- Consider organizing by SOAP section for easy access

### For AI Training
- 23 examples ready for model fine-tuning
- Examples cover multiple clinical reasoning pathways
- Recommended: Anonymize before training (GDPR compliance)
- Use with existing Ollama training pipeline

### Clinical Insights
- Most documented region: **cervical** (12 occurrences)
- Most common technique: **bvm** (12 occurrences)
- Average sections per note: 3.1
