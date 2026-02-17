/**
 * Outcome Measures - Validated Clinical Questionnaires
 *
 * Evidence-based outcome measures for chiropractic:
 * - NDI (Neck Disability Index)
 * - ODI (Oswestry Disability Index)
 * - VAS (Visual Analog Scale)
 * - FABQ (Fear Avoidance Beliefs Questionnaire)
 * - NRS (Numeric Rating Scale)
 * - PSFS (Patient-Specific Functional Scale)
 * - RMDQ (Roland-Morris Disability Questionnaire)
 * - STarT Back (STarT Back Screening Tool)
 * - BQ (Bournemouth Questionnaire)
 * - DASH (Disabilities of Arm, Shoulder and Hand)
 * - HIT6 (Headache Impact Test - 6)
 * - QBPDS (Quebec Back Pain Disability Scale)
 *
 * Features:
 * - Validated scoring algorithms
 * - Progress tracking over time
 * - Visual charts/graphs
 * - PDF export for documentation
 *
 * Bilingual: English/Norwegian
 */

// =============================================================================
// QUESTIONNAIRE DEFINITIONS
// =============================================================================

export const QUESTIONNAIRES = {
  // ---------------------------------------------------------------------------
  // NDI - Neck Disability Index (Vernon & Mior, 1991)
  // ---------------------------------------------------------------------------
  NDI: {
    id: 'NDI',
    name: { en: 'Neck Disability Index', no: 'Nakke Funksjonsindeks' },
    shortName: 'NDI',
    description: {
      en: 'Measures neck pain and disability in daily activities',
      no: 'Måler nakkesmerter og funksjonshemming i daglige aktiviteter',
    },
    instructions: {
      en: 'Please read each section carefully and select the ONE answer that most closely describes your condition right now.',
      no: 'Les hver del nøye og velg det ENE svaret som best beskriver din tilstand akkurat nå.',
    },
    sections: [
      {
        id: 'pain_intensity',
        title: { en: 'Pain Intensity', no: 'Smerteintensitet' },
        options: [
          {
            score: 0,
            text: {
              en: 'I have no pain at the moment',
              no: 'Jeg har ingen smerter for øyeblikket',
            },
          },
          {
            score: 1,
            text: {
              en: 'The pain is very mild at the moment',
              no: 'Smertene er veldig milde for øyeblikket',
            },
          },
          {
            score: 2,
            text: {
              en: 'The pain is moderate at the moment',
              no: 'Smertene er moderate for øyeblikket',
            },
          },
          {
            score: 3,
            text: {
              en: 'The pain is fairly severe at the moment',
              no: 'Smertene er ganske sterke for øyeblikket',
            },
          },
          {
            score: 4,
            text: {
              en: 'The pain is very severe at the moment',
              no: 'Smertene er veldig sterke for øyeblikket',
            },
          },
          {
            score: 5,
            text: {
              en: 'The pain is the worst imaginable at the moment',
              no: 'Smertene er verst tenkelig for øyeblikket',
            },
          },
        ],
      },
      {
        id: 'personal_care',
        title: {
          en: 'Personal Care (Washing, Dressing)',
          no: 'Personlig stell (vask, påkledning)',
        },
        options: [
          {
            score: 0,
            text: {
              en: 'I can look after myself normally without causing extra pain',
              no: 'Jeg kan stelle meg selv normalt uten ekstra smerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can look after myself normally but it causes extra pain',
              no: 'Jeg kan stelle meg selv normalt, men det gir ekstra smerter',
            },
          },
          {
            score: 2,
            text: {
              en: 'It is painful to look after myself and I am slow and careful',
              no: 'Det er smertefullt å stelle meg selv og jeg er treg og forsiktig',
            },
          },
          {
            score: 3,
            text: {
              en: 'I need some help but manage most of my personal care',
              no: 'Jeg trenger litt hjelp, men klarer det meste av personlig stell',
            },
          },
          {
            score: 4,
            text: {
              en: 'I need help every day in most aspects of self-care',
              no: 'Jeg trenger hjelp hver dag til det meste av personlig stell',
            },
          },
          {
            score: 5,
            text: {
              en: 'I do not get dressed, I wash with difficulty and stay in bed',
              no: 'Jeg kler meg ikke, vasker meg med vanskelighet og ligger i sengen',
            },
          },
        ],
      },
      {
        id: 'lifting',
        title: { en: 'Lifting', no: 'Løfting' },
        options: [
          {
            score: 0,
            text: {
              en: 'I can lift heavy weights without extra pain',
              no: 'Jeg kan løfte tunge ting uten ekstra smerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can lift heavy weights but it gives extra pain',
              no: 'Jeg kan løfte tunge ting, men det gir ekstra smerter',
            },
          },
          {
            score: 2,
            text: {
              en: 'Pain prevents me from lifting heavy weights off the floor, but I can manage if they are conveniently placed',
              no: 'Smerter hindrer meg fra å løfte tunge ting fra gulvet, men jeg klarer det hvis de er praktisk plassert',
            },
          },
          {
            score: 3,
            text: {
              en: 'Pain prevents me from lifting heavy weights but I can manage light to medium weights if they are conveniently positioned',
              no: 'Smerter hindrer meg fra å løfte tunge ting, men jeg klarer lette til middels tunge ting hvis de er praktisk plassert',
            },
          },
          {
            score: 4,
            text: {
              en: 'I can lift very light weights',
              no: 'Jeg kan bare løfte veldig lette ting',
            },
          },
          {
            score: 5,
            text: {
              en: 'I cannot lift or carry anything at all',
              no: 'Jeg kan ikke løfte eller bære noe som helst',
            },
          },
        ],
      },
      {
        id: 'reading',
        title: { en: 'Reading', no: 'Lesing' },
        options: [
          {
            score: 0,
            text: {
              en: 'I can read as much as I want with no pain in my neck',
              no: 'Jeg kan lese så mye jeg vil uten smerter i nakken',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can read as much as I want with slight pain in my neck',
              no: 'Jeg kan lese så mye jeg vil med lette smerter i nakken',
            },
          },
          {
            score: 2,
            text: {
              en: 'I can read as much as I want with moderate pain in my neck',
              no: 'Jeg kan lese så mye jeg vil med moderate smerter i nakken',
            },
          },
          {
            score: 3,
            text: {
              en: 'I cannot read as much as I want because of moderate pain in my neck',
              no: 'Jeg kan ikke lese så mye jeg vil på grunn av moderate smerter i nakken',
            },
          },
          {
            score: 4,
            text: {
              en: 'I can hardly read at all because of severe pain in my neck',
              no: 'Jeg kan knapt lese i det hele tatt på grunn av sterke smerter i nakken',
            },
          },
          {
            score: 5,
            text: { en: 'I cannot read at all', no: 'Jeg kan ikke lese i det hele tatt' },
          },
        ],
      },
      {
        id: 'headaches',
        title: { en: 'Headaches', no: 'Hodepine' },
        options: [
          {
            score: 0,
            text: {
              en: 'I have no headaches at all',
              no: 'Jeg har ingen hodepine i det hele tatt',
            },
          },
          {
            score: 1,
            text: {
              en: 'I have slight headaches which come infrequently',
              no: 'Jeg har lett hodepine som kommer sjelden',
            },
          },
          {
            score: 2,
            text: {
              en: 'I have moderate headaches which come infrequently',
              no: 'Jeg har moderat hodepine som kommer sjelden',
            },
          },
          {
            score: 3,
            text: {
              en: 'I have moderate headaches which come frequently',
              no: 'Jeg har moderat hodepine som kommer ofte',
            },
          },
          {
            score: 4,
            text: {
              en: 'I have severe headaches which come frequently',
              no: 'Jeg har sterk hodepine som kommer ofte',
            },
          },
          {
            score: 5,
            text: {
              en: 'I have headaches almost all the time',
              no: 'Jeg har hodepine nesten hele tiden',
            },
          },
        ],
      },
      {
        id: 'concentration',
        title: { en: 'Concentration', no: 'Konsentrasjon' },
        options: [
          {
            score: 0,
            text: {
              en: 'I can concentrate fully when I want with no difficulty',
              no: 'Jeg kan konsentrere meg fullt ut når jeg vil uten vanskeligheter',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can concentrate fully when I want with slight difficulty',
              no: 'Jeg kan konsentrere meg fullt ut når jeg vil med litt vanskeligheter',
            },
          },
          {
            score: 2,
            text: {
              en: 'I have a fair degree of difficulty in concentrating when I want',
              no: 'Jeg har en del vanskeligheter med å konsentrere meg når jeg vil',
            },
          },
          {
            score: 3,
            text: {
              en: 'I have a lot of difficulty in concentrating when I want',
              no: 'Jeg har mye vanskeligheter med å konsentrere meg når jeg vil',
            },
          },
          {
            score: 4,
            text: {
              en: 'I have a great deal of difficulty in concentrating when I want',
              no: 'Jeg har veldig store vanskeligheter med å konsentrere meg når jeg vil',
            },
          },
          {
            score: 5,
            text: {
              en: 'I cannot concentrate at all',
              no: 'Jeg kan ikke konsentrere meg i det hele tatt',
            },
          },
        ],
      },
      {
        id: 'work',
        title: { en: 'Work', no: 'Arbeid' },
        options: [
          {
            score: 0,
            text: {
              en: 'I can do as much work as I want',
              no: 'Jeg kan gjøre så mye arbeid som jeg vil',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can only do my usual work, but no more',
              no: 'Jeg kan bare gjøre mitt vanlige arbeid, men ikke mer',
            },
          },
          {
            score: 2,
            text: {
              en: 'I can do most of my usual work, but no more',
              no: 'Jeg kan gjøre det meste av mitt vanlige arbeid, men ikke mer',
            },
          },
          {
            score: 3,
            text: { en: 'I cannot do my usual work', no: 'Jeg kan ikke gjøre mitt vanlige arbeid' },
          },
          {
            score: 4,
            text: {
              en: 'I can hardly do any work at all',
              no: 'Jeg kan knapt gjøre noe arbeid i det hele tatt',
            },
          },
          {
            score: 5,
            text: {
              en: 'I cannot do any work at all',
              no: 'Jeg kan ikke gjøre noe arbeid i det hele tatt',
            },
          },
        ],
      },
      {
        id: 'driving',
        title: { en: 'Driving', no: 'Bilkjøring' },
        options: [
          {
            score: 0,
            text: {
              en: 'I can drive my car without any neck pain',
              no: 'Jeg kan kjøre bil uten nakkesmerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can drive my car as long as I want with slight pain in my neck',
              no: 'Jeg kan kjøre bil så lenge jeg vil med lette smerter i nakken',
            },
          },
          {
            score: 2,
            text: {
              en: 'I can drive my car as long as I want with moderate pain in my neck',
              no: 'Jeg kan kjøre bil så lenge jeg vil med moderate smerter i nakken',
            },
          },
          {
            score: 3,
            text: {
              en: 'I cannot drive my car as long as I want because of moderate pain in my neck',
              no: 'Jeg kan ikke kjøre bil så lenge jeg vil på grunn av moderate smerter i nakken',
            },
          },
          {
            score: 4,
            text: {
              en: 'I can hardly drive at all because of severe pain in my neck',
              no: 'Jeg kan knapt kjøre i det hele tatt på grunn av sterke smerter i nakken',
            },
          },
          {
            score: 5,
            text: {
              en: 'I cannot drive my car at all',
              no: 'Jeg kan ikke kjøre bil i det hele tatt',
            },
          },
        ],
      },
      {
        id: 'sleeping',
        title: { en: 'Sleeping', no: 'Søvn' },
        options: [
          {
            score: 0,
            text: { en: 'I have no trouble sleeping', no: 'Jeg har ingen problemer med å sove' },
          },
          {
            score: 1,
            text: {
              en: 'My sleep is slightly disturbed (less than 1 hour sleepless)',
              no: 'Søvnen min er litt forstyrret (mindre enn 1 time søvnløs)',
            },
          },
          {
            score: 2,
            text: {
              en: 'My sleep is mildly disturbed (1-2 hours sleepless)',
              no: 'Søvnen min er mildt forstyrret (1-2 timer søvnløs)',
            },
          },
          {
            score: 3,
            text: {
              en: 'My sleep is moderately disturbed (2-3 hours sleepless)',
              no: 'Søvnen min er moderat forstyrret (2-3 timer søvnløs)',
            },
          },
          {
            score: 4,
            text: {
              en: 'My sleep is greatly disturbed (3-5 hours sleepless)',
              no: 'Søvnen min er sterkt forstyrret (3-5 timer søvnløs)',
            },
          },
          {
            score: 5,
            text: {
              en: 'My sleep is completely disturbed (5-7 hours sleepless)',
              no: 'Søvnen min er helt forstyrret (5-7 timer søvnløs)',
            },
          },
        ],
      },
      {
        id: 'recreation',
        title: { en: 'Recreation', no: 'Fritidsaktiviteter' },
        options: [
          {
            score: 0,
            text: {
              en: 'I am able to engage in all my recreation activities with no neck pain at all',
              no: 'Jeg kan delta i alle fritidsaktiviteter uten nakkesmerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'I am able to engage in all my recreation activities with some pain in my neck',
              no: 'Jeg kan delta i alle fritidsaktiviteter med noe smerter i nakken',
            },
          },
          {
            score: 2,
            text: {
              en: 'I am able to engage in most, but not all of my usual recreation activities because of pain in my neck',
              no: 'Jeg kan delta i de fleste, men ikke alle fritidsaktiviteter på grunn av smerter i nakken',
            },
          },
          {
            score: 3,
            text: {
              en: 'I am able to engage in only a few of my usual recreation activities because of pain in my neck',
              no: 'Jeg kan bare delta i noen få fritidsaktiviteter på grunn av smerter i nakken',
            },
          },
          {
            score: 4,
            text: {
              en: 'I can hardly do any recreation activities because of pain in my neck',
              no: 'Jeg kan knapt delta i fritidsaktiviteter på grunn av smerter i nakken',
            },
          },
          {
            score: 5,
            text: {
              en: 'I cannot do any recreation activities at all',
              no: 'Jeg kan ikke delta i noen fritidsaktiviteter i det hele tatt',
            },
          },
        ],
      },
    ],
    scoring: {
      maxScore: 50,
      interpretation: [
        {
          min: 0,
          max: 4,
          level: 'none',
          label: { en: 'No Disability', no: 'Ingen funksjonsnedsettelse' },
          color: 'green',
        },
        {
          min: 5,
          max: 14,
          level: 'mild',
          label: { en: 'Mild Disability', no: 'Mild funksjonsnedsettelse' },
          color: 'yellow',
        },
        {
          min: 15,
          max: 24,
          level: 'moderate',
          label: { en: 'Moderate Disability', no: 'Moderat funksjonsnedsettelse' },
          color: 'orange',
        },
        {
          min: 25,
          max: 34,
          level: 'severe',
          label: { en: 'Severe Disability', no: 'Alvorlig funksjonsnedsettelse' },
          color: 'red',
        },
        {
          min: 35,
          max: 50,
          level: 'complete',
          label: { en: 'Complete Disability', no: 'Fullstendig funksjonsnedsettelse' },
          color: 'darkred',
        },
      ],
      mcid: 5, // Minimal Clinically Important Difference
    },
  },

  // ---------------------------------------------------------------------------
  // ODI - Oswestry Disability Index (Fairbank, 1980)
  // ---------------------------------------------------------------------------
  ODI: {
    id: 'ODI',
    name: { en: 'Oswestry Disability Index', no: 'Oswestry Funksjonsindeks' },
    shortName: 'ODI',
    description: {
      en: 'Measures low back pain and disability',
      no: 'Måler korsryggsmerter og funksjonshemming',
    },
    instructions: {
      en: 'Please read each section carefully and select the ONE statement that best describes your condition today.',
      no: 'Les hver del nøye og velg den ENE påstanden som best beskriver din tilstand i dag.',
    },
    sections: [
      {
        id: 'pain_intensity',
        title: { en: 'Pain Intensity', no: 'Smerteintensitet' },
        options: [
          {
            score: 0,
            text: {
              en: 'I have no pain at the moment',
              no: 'Jeg har ingen smerter for øyeblikket',
            },
          },
          {
            score: 1,
            text: {
              en: 'The pain is very mild at the moment',
              no: 'Smertene er veldig milde for øyeblikket',
            },
          },
          {
            score: 2,
            text: {
              en: 'The pain is moderate at the moment',
              no: 'Smertene er moderate for øyeblikket',
            },
          },
          {
            score: 3,
            text: {
              en: 'The pain is fairly severe at the moment',
              no: 'Smertene er ganske sterke for øyeblikket',
            },
          },
          {
            score: 4,
            text: {
              en: 'The pain is very severe at the moment',
              no: 'Smertene er veldig sterke for øyeblikket',
            },
          },
          {
            score: 5,
            text: {
              en: 'The pain is the worst imaginable at the moment',
              no: 'Smertene er verst tenkelig for øyeblikket',
            },
          },
        ],
      },
      {
        id: 'personal_care',
        title: { en: 'Personal Care', no: 'Personlig stell' },
        options: [
          {
            score: 0,
            text: {
              en: 'I can look after myself normally without causing extra pain',
              no: 'Jeg kan stelle meg selv normalt uten ekstra smerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can look after myself normally but it is very painful',
              no: 'Jeg kan stelle meg selv normalt, men det er veldig smertefullt',
            },
          },
          {
            score: 2,
            text: {
              en: 'It is painful to look after myself and I am slow and careful',
              no: 'Det er smertefullt å stelle meg selv og jeg er treg og forsiktig',
            },
          },
          {
            score: 3,
            text: {
              en: 'I need some help but manage most of my personal care',
              no: 'Jeg trenger litt hjelp, men klarer det meste',
            },
          },
          {
            score: 4,
            text: {
              en: 'I need help every day in most aspects of self care',
              no: 'Jeg trenger hjelp hver dag til det meste',
            },
          },
          {
            score: 5,
            text: {
              en: 'I do not get dressed, wash with difficulty and stay in bed',
              no: 'Jeg kler meg ikke, vasker meg med vanskelighet og ligger i sengen',
            },
          },
        ],
      },
      {
        id: 'lifting',
        title: { en: 'Lifting', no: 'Løfting' },
        options: [
          {
            score: 0,
            text: {
              en: 'I can lift heavy weights without extra pain',
              no: 'Jeg kan løfte tunge ting uten ekstra smerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can lift heavy weights but it gives extra pain',
              no: 'Jeg kan løfte tunge ting, men det gir ekstra smerter',
            },
          },
          {
            score: 2,
            text: {
              en: 'Pain prevents me from lifting heavy weights off the floor',
              no: 'Smerter hindrer meg fra å løfte tunge ting fra gulvet',
            },
          },
          {
            score: 3,
            text: {
              en: 'Pain prevents me from lifting heavy weights but I can manage light to medium weights',
              no: 'Smerter hindrer meg fra å løfte tunge ting, men jeg klarer lette til middels tunge',
            },
          },
          {
            score: 4,
            text: {
              en: 'I can only lift very light weights',
              no: 'Jeg kan bare løfte veldig lette ting',
            },
          },
          {
            score: 5,
            text: {
              en: 'I cannot lift or carry anything at all',
              no: 'Jeg kan ikke løfte eller bære noe som helst',
            },
          },
        ],
      },
      {
        id: 'walking',
        title: { en: 'Walking', no: 'Gåing' },
        options: [
          {
            score: 0,
            text: {
              en: 'Pain does not prevent me walking any distance',
              no: 'Smerter hindrer meg ikke fra å gå noen avstand',
            },
          },
          {
            score: 1,
            text: {
              en: 'Pain prevents me walking more than 1 mile',
              no: 'Smerter hindrer meg fra å gå mer enn 1,5 km',
            },
          },
          {
            score: 2,
            text: {
              en: 'Pain prevents me walking more than 1/2 mile',
              no: 'Smerter hindrer meg fra å gå mer enn 800 meter',
            },
          },
          {
            score: 3,
            text: {
              en: 'Pain prevents me walking more than 100 yards',
              no: 'Smerter hindrer meg fra å gå mer enn 100 meter',
            },
          },
          {
            score: 4,
            text: {
              en: 'I can only walk using a stick or crutches',
              no: 'Jeg kan bare gå med stokk eller krykker',
            },
          },
          {
            score: 5,
            text: {
              en: 'I am in bed most of the time and have to crawl to the toilet',
              no: 'Jeg er i sengen det meste av tiden og må krype til toalettet',
            },
          },
        ],
      },
      {
        id: 'sitting',
        title: { en: 'Sitting', no: 'Sitting' },
        options: [
          {
            score: 0,
            text: {
              en: 'I can sit in any chair as long as I like',
              no: 'Jeg kan sitte i hvilken som helst stol så lenge jeg vil',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can sit in my favourite chair as long as I like',
              no: 'Jeg kan sitte i favorittestolen min så lenge jeg vil',
            },
          },
          {
            score: 2,
            text: {
              en: 'Pain prevents me from sitting more than 1 hour',
              no: 'Smerter hindrer meg fra å sitte mer enn 1 time',
            },
          },
          {
            score: 3,
            text: {
              en: 'Pain prevents me from sitting more than 1/2 hour',
              no: 'Smerter hindrer meg fra å sitte mer enn 30 minutter',
            },
          },
          {
            score: 4,
            text: {
              en: 'Pain prevents me from sitting more than 10 minutes',
              no: 'Smerter hindrer meg fra å sitte mer enn 10 minutter',
            },
          },
          {
            score: 5,
            text: {
              en: 'Pain prevents me from sitting at all',
              no: 'Smerter hindrer meg fra å sitte i det hele tatt',
            },
          },
        ],
      },
      {
        id: 'standing',
        title: { en: 'Standing', no: 'Ståing' },
        options: [
          {
            score: 0,
            text: {
              en: 'I can stand as long as I want without extra pain',
              no: 'Jeg kan stå så lenge jeg vil uten ekstra smerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can stand as long as I want but it gives me extra pain',
              no: 'Jeg kan stå så lenge jeg vil, men det gir ekstra smerter',
            },
          },
          {
            score: 2,
            text: {
              en: 'Pain prevents me from standing for more than 1 hour',
              no: 'Smerter hindrer meg fra å stå mer enn 1 time',
            },
          },
          {
            score: 3,
            text: {
              en: 'Pain prevents me from standing for more than 30 minutes',
              no: 'Smerter hindrer meg fra å stå mer enn 30 minutter',
            },
          },
          {
            score: 4,
            text: {
              en: 'Pain prevents me from standing for more than 10 minutes',
              no: 'Smerter hindrer meg fra å stå mer enn 10 minutter',
            },
          },
          {
            score: 5,
            text: {
              en: 'Pain prevents me from standing at all',
              no: 'Smerter hindrer meg fra å stå i det hele tatt',
            },
          },
        ],
      },
      {
        id: 'sleeping',
        title: { en: 'Sleeping', no: 'Søvn' },
        options: [
          {
            score: 0,
            text: {
              en: 'My sleep is never disturbed by pain',
              no: 'Søvnen min er aldri forstyrret av smerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'My sleep is occasionally disturbed by pain',
              no: 'Søvnen min er av og til forstyrret av smerter',
            },
          },
          {
            score: 2,
            text: {
              en: 'Because of pain I have less than 6 hours sleep',
              no: 'På grunn av smerter sover jeg mindre enn 6 timer',
            },
          },
          {
            score: 3,
            text: {
              en: 'Because of pain I have less than 4 hours sleep',
              no: 'På grunn av smerter sover jeg mindre enn 4 timer',
            },
          },
          {
            score: 4,
            text: {
              en: 'Because of pain I have less than 2 hours sleep',
              no: 'På grunn av smerter sover jeg mindre enn 2 timer',
            },
          },
          {
            score: 5,
            text: {
              en: 'Pain prevents me from sleeping at all',
              no: 'Smerter hindrer meg fra å sove i det hele tatt',
            },
          },
        ],
      },
      {
        id: 'sex_life',
        title: { en: 'Sex Life (if applicable)', no: 'Seksualliv (hvis aktuelt)' },
        options: [
          {
            score: 0,
            text: {
              en: 'My sex life is normal and causes no extra pain',
              no: 'Seksuallivet mitt er normalt og gir ingen ekstra smerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'My sex life is normal but causes some extra pain',
              no: 'Seksuallivet mitt er normalt, men gir noe ekstra smerter',
            },
          },
          {
            score: 2,
            text: {
              en: 'My sex life is nearly normal but is very painful',
              no: 'Seksuallivet mitt er nesten normalt, men er veldig smertefullt',
            },
          },
          {
            score: 3,
            text: {
              en: 'My sex life is severely restricted by pain',
              no: 'Seksuallivet mitt er sterkt begrenset av smerter',
            },
          },
          {
            score: 4,
            text: {
              en: 'My sex life is nearly absent because of pain',
              no: 'Seksuallivet mitt er nesten fraværende på grunn av smerter',
            },
          },
          {
            score: 5,
            text: { en: 'Pain prevents any sex life at all', no: 'Smerter hindrer alt seksualliv' },
          },
        ],
        optional: true,
      },
      {
        id: 'social_life',
        title: { en: 'Social Life', no: 'Sosialt liv' },
        options: [
          {
            score: 0,
            text: {
              en: 'My social life is normal and causes no extra pain',
              no: 'Det sosiale livet mitt er normalt og gir ingen ekstra smerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'My social life is normal but increases the degree of pain',
              no: 'Det sosiale livet mitt er normalt, men øker smertegraden',
            },
          },
          {
            score: 2,
            text: {
              en: 'Pain has no significant effect on my social life apart from limiting my more energetic interests',
              no: 'Smerter har ingen betydelig effekt på det sosiale livet mitt bortsett fra å begrense mer energiske interesser',
            },
          },
          {
            score: 3,
            text: {
              en: 'Pain has restricted my social life and I do not go out as often',
              no: 'Smerter har begrenset det sosiale livet mitt og jeg går ikke ut så ofte',
            },
          },
          {
            score: 4,
            text: {
              en: 'Pain has restricted social life to my home',
              no: 'Smerter har begrenset det sosiale livet til hjemmet',
            },
          },
          {
            score: 5,
            text: {
              en: 'I have no social life because of pain',
              no: 'Jeg har ikke noe sosialt liv på grunn av smerter',
            },
          },
        ],
      },
      {
        id: 'travelling',
        title: { en: 'Travelling', no: 'Reising' },
        options: [
          {
            score: 0,
            text: {
              en: 'I can travel anywhere without pain',
              no: 'Jeg kan reise hvor som helst uten smerter',
            },
          },
          {
            score: 1,
            text: {
              en: 'I can travel anywhere but it gives extra pain',
              no: 'Jeg kan reise hvor som helst, men det gir ekstra smerter',
            },
          },
          {
            score: 2,
            text: {
              en: 'Pain is bad but I manage journeys over 2 hours',
              no: 'Smertene er ille, men jeg klarer reiser over 2 timer',
            },
          },
          {
            score: 3,
            text: {
              en: 'Pain restricts me to journeys of less than 1 hour',
              no: 'Smerter begrenser meg til reiser under 1 time',
            },
          },
          {
            score: 4,
            text: {
              en: 'Pain restricts me to short necessary journeys under 30 minutes',
              no: 'Smerter begrenser meg til korte nødvendige reiser under 30 minutter',
            },
          },
          {
            score: 5,
            text: {
              en: 'Pain prevents me from travelling except to receive treatment',
              no: 'Smerter hindrer meg fra å reise bortsett fra for behandling',
            },
          },
        ],
      },
    ],
    scoring: {
      maxScore: 50,
      interpretation: [
        {
          min: 0,
          max: 10,
          level: 'minimal',
          label: { en: 'Minimal Disability', no: 'Minimal funksjonsnedsettelse' },
          color: 'green',
        },
        {
          min: 11,
          max: 20,
          level: 'moderate',
          label: { en: 'Moderate Disability', no: 'Moderat funksjonsnedsettelse' },
          color: 'yellow',
        },
        {
          min: 21,
          max: 30,
          level: 'severe',
          label: { en: 'Severe Disability', no: 'Alvorlig funksjonsnedsettelse' },
          color: 'orange',
        },
        {
          min: 31,
          max: 40,
          level: 'crippling',
          label: { en: 'Crippling Disability', no: 'Invalidiserende' },
          color: 'red',
        },
        {
          min: 41,
          max: 50,
          level: 'bedbound',
          label: { en: 'Bed-bound or Exaggerating', no: 'Sengeliggende' },
          color: 'darkred',
        },
      ],
      mcid: 10, // Minimal Clinically Important Difference (percentage points)
    },
  },

  // ---------------------------------------------------------------------------
  // VAS - Visual Analog Scale
  // ---------------------------------------------------------------------------
  VAS: {
    id: 'VAS',
    name: { en: 'Visual Analog Scale', no: 'Visuell Analog Skala' },
    shortName: 'VAS',
    description: {
      en: 'Simple pain intensity measurement on a 0-100 scale',
      no: 'Enkel smertemåling på en 0-100 skala',
    },
    instructions: {
      en: 'Move the slider to indicate your current pain level',
      no: 'Flytt glidebryteren for å angi ditt nåværende smertenivå',
    },
    type: 'slider',
    min: 0,
    max: 100,
    labels: {
      left: { en: 'No Pain', no: 'Ingen smerte' },
      right: { en: 'Worst Pain Imaginable', no: 'Verst tenkelige smerte' },
    },
    scoring: {
      maxScore: 100,
      interpretation: [
        {
          min: 0,
          max: 0,
          level: 'none',
          label: { en: 'No Pain', no: 'Ingen smerte' },
          color: 'green',
        },
        {
          min: 1,
          max: 30,
          level: 'mild',
          label: { en: 'Mild Pain', no: 'Mild smerte' },
          color: 'yellow',
        },
        {
          min: 31,
          max: 60,
          level: 'moderate',
          label: { en: 'Moderate Pain', no: 'Moderat smerte' },
          color: 'orange',
        },
        {
          min: 61,
          max: 100,
          level: 'severe',
          label: { en: 'Severe Pain', no: 'Sterk smerte' },
          color: 'red',
        },
      ],
      mcid: 13, // Minimal Clinically Important Difference (mm)
    },
  },

  // ---------------------------------------------------------------------------
  // NRS - Numeric Rating Scale
  // ---------------------------------------------------------------------------
  NRS: {
    id: 'NRS',
    name: { en: 'Numeric Rating Scale', no: 'Numerisk Smerteskala' },
    shortName: 'NRS',
    description: {
      en: 'Rate your pain from 0 to 10',
      no: 'Angi smerten din fra 0 til 10',
    },
    instructions: {
      en: 'Select a number from 0 to 10 that best describes your current pain',
      no: 'Velg et tall fra 0 til 10 som best beskriver din nåværende smerte',
    },
    type: 'numeric',
    min: 0,
    max: 10,
    labels: {
      0: { en: 'No Pain', no: 'Ingen smerte' },
      10: { en: 'Worst Pain', no: 'Verste smerte' },
    },
    scoring: {
      maxScore: 10,
      interpretation: [
        {
          min: 0,
          max: 0,
          level: 'none',
          label: { en: 'No Pain', no: 'Ingen smerte' },
          color: 'green',
        },
        {
          min: 1,
          max: 3,
          level: 'mild',
          label: { en: 'Mild Pain', no: 'Mild smerte' },
          color: 'yellow',
        },
        {
          min: 4,
          max: 6,
          level: 'moderate',
          label: { en: 'Moderate Pain', no: 'Moderat smerte' },
          color: 'orange',
        },
        {
          min: 7,
          max: 10,
          level: 'severe',
          label: { en: 'Severe Pain', no: 'Sterk smerte' },
          color: 'red',
        },
      ],
      mcid: 2,
    },
  },

  // ---------------------------------------------------------------------------
  // FABQ - Fear Avoidance Beliefs Questionnaire
  // ---------------------------------------------------------------------------
  FABQ: {
    id: 'FABQ',
    name: { en: 'Fear Avoidance Beliefs Questionnaire', no: 'Spørreskjema om Frykt-Unngåelse' },
    shortName: 'FABQ',
    description: {
      en: 'Assesses fear-avoidance beliefs about physical activity and work',
      no: 'Vurderer frykt-unngåelse overbevisninger om fysisk aktivitet og arbeid',
    },
    instructions: {
      en: 'Rate how much you agree with each statement (0 = completely disagree, 6 = completely agree)',
      no: 'Angi hvor enig du er i hver påstand (0 = helt uenig, 6 = helt enig)',
    },
    subscales: {
      physical: {
        name: { en: 'Physical Activity', no: 'Fysisk aktivitet' },
        items: [2, 3, 4, 5], // Items that count for this subscale (1-indexed in original)
      },
      work: {
        name: { en: 'Work', no: 'Arbeid' },
        items: [6, 7, 9, 10, 11, 12, 15], // Items that count for this subscale
      },
    },
    sections: [
      {
        id: 'fabq1',
        text: {
          en: 'My pain was caused by physical activity',
          no: 'Smertene mine ble forårsaket av fysisk aktivitet',
        },
        subscale: null,
      },
      {
        id: 'fabq2',
        text: {
          en: 'Physical activity makes my pain worse',
          no: 'Fysisk aktivitet gjør smertene mine verre',
        },
        subscale: 'physical',
      },
      {
        id: 'fabq3',
        text: {
          en: 'Physical activity might harm my back',
          no: 'Fysisk aktivitet kan skade ryggen min',
        },
        subscale: 'physical',
      },
      {
        id: 'fabq4',
        text: {
          en: 'I should not do physical activities which might make my pain worse',
          no: 'Jeg bør ikke gjøre fysiske aktiviteter som kan gjøre smertene mine verre',
        },
        subscale: 'physical',
      },
      {
        id: 'fabq5',
        text: {
          en: 'I cannot do physical activities which might make my pain worse',
          no: 'Jeg kan ikke gjøre fysiske aktiviteter som kan gjøre smertene mine verre',
        },
        subscale: 'physical',
      },
      {
        id: 'fabq6',
        text: {
          en: 'My pain was caused by my work or by an accident at work',
          no: 'Smertene mine ble forårsaket av arbeidet mitt eller en arbeidsulykke',
        },
        subscale: 'work',
      },
      {
        id: 'fabq7',
        text: { en: 'My work aggravated my pain', no: 'Arbeidet mitt forverret smertene mine' },
        subscale: 'work',
      },
      {
        id: 'fabq8',
        text: {
          en: 'I have a claim for compensation for my pain',
          no: 'Jeg har krav på erstatning for smertene mine',
        },
        subscale: null,
      },
      {
        id: 'fabq9',
        text: { en: 'My work is too heavy for me', no: 'Arbeidet mitt er for tungt for meg' },
        subscale: 'work',
      },
      {
        id: 'fabq10',
        text: {
          en: 'My work makes or would make my pain worse',
          no: 'Arbeidet mitt gjør eller ville gjøre smertene mine verre',
        },
        subscale: 'work',
      },
      {
        id: 'fabq11',
        text: { en: 'My work might harm my back', no: 'Arbeidet mitt kan skade ryggen min' },
        subscale: 'work',
      },
      {
        id: 'fabq12',
        text: {
          en: 'I should not do my normal work with my present pain',
          no: 'Jeg bør ikke gjøre mitt vanlige arbeid med mine nåværende smerter',
        },
        subscale: 'work',
      },
      {
        id: 'fabq13',
        text: {
          en: 'I cannot do my normal work with my present pain',
          no: 'Jeg kan ikke gjøre mitt vanlige arbeid med mine nåværende smerter',
        },
        subscale: null,
      },
      {
        id: 'fabq14',
        text: {
          en: 'I cannot do my normal work until my pain is treated',
          no: 'Jeg kan ikke gjøre mitt vanlige arbeid før smertene mine er behandlet',
        },
        subscale: null,
      },
      {
        id: 'fabq15',
        text: {
          en: 'I do not think that I will be back to my normal work within 3 months',
          no: 'Jeg tror ikke jeg vil være tilbake i normalt arbeid innen 3 måneder',
        },
        subscale: 'work',
      },
      {
        id: 'fabq16',
        text: {
          en: 'I do not think that I will ever be able to go back to that work',
          no: 'Jeg tror ikke jeg noen gang vil kunne gå tilbake til det arbeidet',
        },
        subscale: null,
      },
    ],
    options: [
      { score: 0, text: { en: 'Completely Disagree', no: 'Helt uenig' } },
      { score: 1, text: { en: '', no: '' } },
      { score: 2, text: { en: '', no: '' } },
      { score: 3, text: { en: 'Unsure', no: 'Usikker' } },
      { score: 4, text: { en: '', no: '' } },
      { score: 5, text: { en: '', no: '' } },
      { score: 6, text: { en: 'Completely Agree', no: 'Helt enig' } },
    ],
    scoring: {
      physical: { maxScore: 24 },
      work: { maxScore: 42 },
      interpretation: {
        physical: [
          {
            min: 0,
            max: 14,
            level: 'low',
            label: { en: 'Low Fear-Avoidance', no: 'Lav frykt-unngåelse' },
            color: 'green',
          },
          {
            min: 15,
            max: 24,
            level: 'high',
            label: { en: 'High Fear-Avoidance', no: 'Høy frykt-unngåelse' },
            color: 'red',
          },
        ],
        work: [
          {
            min: 0,
            max: 24,
            level: 'low',
            label: { en: 'Low Fear-Avoidance', no: 'Lav frykt-unngåelse' },
            color: 'green',
          },
          {
            min: 25,
            max: 42,
            level: 'high',
            label: { en: 'High Fear-Avoidance', no: 'Høy frykt-unngåelse' },
            color: 'red',
          },
        ],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // RMDQ - Roland-Morris Disability Questionnaire (Roland & Morris, 1983)
  // ---------------------------------------------------------------------------
  RMDQ: {
    id: 'RMDQ',
    name: { en: 'Roland-Morris Disability Questionnaire', no: 'Roland-Morris Funksjonsskjema' },
    shortName: 'RMDQ',
    description: {
      en: 'Measures disability due to low back pain using 24 yes/no questions',
      no: 'Måler funksjonshemming på grunn av korsryggsmerter med 24 ja/nei spørsmål',
    },
    instructions: {
      en: 'When your back hurts, you may find it difficult to do some of the things you normally do. Check only the statements that describe you TODAY.',
      no: 'Når ryggen din gjør vondt, kan det være vanskelig å gjøre ting du vanligvis gjør. Kryss av kun for påstandene som beskriver deg I DAG.',
    },
    type: 'checklist',
    sections: [
      {
        id: 'rmdq1',
        text: {
          en: 'I stay at home most of the time because of my back',
          no: 'Jeg er hjemme det meste av tiden på grunn av ryggen',
        },
      },
      {
        id: 'rmdq2',
        text: {
          en: 'I change position frequently to try and get my back comfortable',
          no: 'Jeg skifter stilling ofte for å prøve å få ryggen komfortabel',
        },
      },
      {
        id: 'rmdq3',
        text: {
          en: 'I walk more slowly than usual because of my back',
          no: 'Jeg går saktere enn vanlig på grunn av ryggen',
        },
      },
      {
        id: 'rmdq4',
        text: {
          en: 'Because of my back, I am not doing any of the jobs that I usually do around the house',
          no: 'På grunn av ryggen gjør jeg ikke noe av husarbeidet jeg vanligvis gjør',
        },
      },
      {
        id: 'rmdq5',
        text: {
          en: 'Because of my back, I use a handrail to get upstairs',
          no: 'På grunn av ryggen bruker jeg gelender for å gå opp trappen',
        },
      },
      {
        id: 'rmdq6',
        text: {
          en: 'Because of my back, I lie down to rest more often',
          no: 'På grunn av ryggen legger jeg meg ned for å hvile oftere',
        },
      },
      {
        id: 'rmdq7',
        text: {
          en: 'Because of my back, I have to hold on to something to get out of an easy chair',
          no: 'På grunn av ryggen må jeg holde meg i noe for å reise meg fra en lenestol',
        },
      },
      {
        id: 'rmdq8',
        text: {
          en: 'Because of my back, I try to get other people to do things for me',
          no: 'På grunn av ryggen prøver jeg å få andre til å gjøre ting for meg',
        },
      },
      {
        id: 'rmdq9',
        text: {
          en: 'I get dressed more slowly than usual because of my back',
          no: 'Jeg kler på meg saktere enn vanlig på grunn av ryggen',
        },
      },
      {
        id: 'rmdq10',
        text: {
          en: 'I only stand for short periods of time because of my back',
          no: 'Jeg står bare korte perioder om gangen på grunn av ryggen',
        },
      },
      {
        id: 'rmdq11',
        text: {
          en: 'Because of my back, I try not to bend or kneel down',
          no: 'På grunn av ryggen prøver jeg å ikke bøye meg eller knele',
        },
      },
      {
        id: 'rmdq12',
        text: {
          en: 'I find it difficult to get out of a chair because of my back',
          no: 'Jeg synes det er vanskelig å reise meg fra en stol på grunn av ryggen',
        },
      },
      {
        id: 'rmdq13',
        text: {
          en: 'My back is painful almost all the time',
          no: 'Ryggen min er smertefull nesten hele tiden',
        },
      },
      {
        id: 'rmdq14',
        text: {
          en: 'I find it difficult to turn over in bed because of my back',
          no: 'Jeg synes det er vanskelig å snu meg i sengen på grunn av ryggen',
        },
      },
      {
        id: 'rmdq15',
        text: {
          en: 'My appetite is not very good because of my back pain',
          no: 'Appetitten min er ikke så god på grunn av ryggsmertene',
        },
      },
      {
        id: 'rmdq16',
        text: {
          en: 'I have trouble putting on my socks (or stockings) because of the pain in my back',
          no: 'Jeg har problemer med å ta på meg sokker på grunn av smerter i ryggen',
        },
      },
      {
        id: 'rmdq17',
        text: {
          en: 'I only walk short distances because of my back pain',
          no: 'Jeg går bare korte avstander på grunn av ryggsmertene',
        },
      },
      {
        id: 'rmdq18',
        text: {
          en: 'I sleep less well because of my back',
          no: 'Jeg sover dårligere på grunn av ryggen',
        },
      },
      {
        id: 'rmdq19',
        text: {
          en: 'Because of my back pain, I get dressed with help from someone else',
          no: 'På grunn av ryggsmertene kler jeg på meg med hjelp fra noen andre',
        },
      },
      {
        id: 'rmdq20',
        text: {
          en: 'I sit down for most of the day because of my back',
          no: 'Jeg sitter det meste av dagen på grunn av ryggen',
        },
      },
      {
        id: 'rmdq21',
        text: {
          en: 'I avoid heavy jobs around the house because of my back',
          no: 'Jeg unngår tunge oppgaver i hjemmet på grunn av ryggen',
        },
      },
      {
        id: 'rmdq22',
        text: {
          en: 'Because of my back pain, I am more irritable and bad tempered with people than usual',
          no: 'På grunn av ryggsmertene er jeg mer irritabel og i dårlig humør overfor andre enn vanlig',
        },
      },
      {
        id: 'rmdq23',
        text: {
          en: 'Because of my back, I go upstairs more slowly than usual',
          no: 'På grunn av ryggen går jeg opp trappen saktere enn vanlig',
        },
      },
      {
        id: 'rmdq24',
        text: {
          en: 'I stay in bed most of the time because of my back',
          no: 'Jeg ligger i sengen det meste av tiden på grunn av ryggen',
        },
      },
    ],
    scoring: {
      maxScore: 24,
      interpretation: [
        {
          min: 0,
          max: 4,
          level: 'minimal',
          label: { en: 'Minimal Disability', no: 'Minimal funksjonsnedsettelse' },
          color: 'green',
        },
        {
          min: 5,
          max: 9,
          level: 'mild',
          label: { en: 'Mild Disability', no: 'Mild funksjonsnedsettelse' },
          color: 'yellow',
        },
        {
          min: 10,
          max: 14,
          level: 'moderate',
          label: { en: 'Moderate Disability', no: 'Moderat funksjonsnedsettelse' },
          color: 'orange',
        },
        {
          min: 15,
          max: 19,
          level: 'severe',
          label: { en: 'Severe Disability', no: 'Alvorlig funksjonsnedsettelse' },
          color: 'red',
        },
        {
          min: 20,
          max: 24,
          level: 'very_severe',
          label: { en: 'Very Severe Disability', no: 'Svært alvorlig funksjonsnedsettelse' },
          color: 'darkred',
        },
      ],
      mcid: 5, // Minimal Clinically Important Difference
    },
  },

  // ---------------------------------------------------------------------------
  // STarT Back - STarT Back Screening Tool (Keele University, 2008)
  // ---------------------------------------------------------------------------
  STARTBACK: {
    id: 'STARTBACK',
    name: { en: 'STarT Back Screening Tool', no: 'STarT Back Screeningverktøy' },
    shortName: 'STarT Back',
    description: {
      en: 'Stratifies patients with low back pain into low, medium, or high risk for chronicity',
      no: 'Stratifiserer pasienter med korsryggsmerter i lav, middels eller høy risiko for kronisitet',
    },
    instructions: {
      en: 'Thinking about the last 2 weeks, please indicate your agreement with the following statements about your back pain.',
      no: 'Tenk på de siste 2 ukene og angi hvor enig du er i følgende påstander om ryggsmertene dine.',
    },
    sections: [
      // Items 1-4: Physical domain + Total score
      {
        id: 'start1',
        text: {
          en: 'My back pain has spread down my leg(s) at some time in the last 2 weeks',
          no: 'Ryggsmertene mine har spredt seg ned i beinet/beinene mine i løpet av de siste 2 ukene',
        },
        domain: 'physical',
      },
      {
        id: 'start2',
        text: {
          en: 'I have had pain in the shoulder or neck at some time in the last 2 weeks',
          no: 'Jeg har hatt smerter i skulder eller nakke i løpet av de siste 2 ukene',
        },
        domain: 'physical',
      },
      {
        id: 'start3',
        text: {
          en: 'I have only walked short distances because of my back pain',
          no: 'Jeg har bare gått korte avstander på grunn av ryggsmertene mine',
        },
        domain: 'physical',
      },
      {
        id: 'start4',
        text: {
          en: 'In the last 2 weeks, I have dressed more slowly than usual because of back pain',
          no: 'I de siste 2 ukene har jeg kledd på meg saktere enn vanlig på grunn av ryggsmerter',
        },
        domain: 'physical',
      },
      // Items 5-9: Psychosocial domain + Total score
      {
        id: 'start5',
        text: {
          en: "It's not really safe for a person with a condition like mine to be physically active",
          no: 'Det er egentlig ikke trygt for en person med en tilstand som min å være fysisk aktiv',
        },
        domain: 'psychosocial',
      },
      {
        id: 'start6',
        text: {
          en: 'Worrying thoughts have been going through my mind a lot of the time',
          no: 'Bekymringsfulle tanker har gått gjennom hodet mitt mye av tiden',
        },
        domain: 'psychosocial',
      },
      {
        id: 'start7',
        text: {
          en: "I feel that my back pain is terrible and it's never going to get any better",
          no: 'Jeg føler at ryggsmertene mine er forferdelige og at det aldri kommer til å bli bedre',
        },
        domain: 'psychosocial',
      },
      {
        id: 'start8',
        text: {
          en: 'In general I have not enjoyed all the things I used to enjoy',
          no: 'Generelt har jeg ikke nytt alle tingene jeg pleide å nyte',
        },
        domain: 'psychosocial',
      },
    ],
    // Item 9 is a special 5-point scale
    specialItems: [
      {
        id: 'start9',
        text: {
          en: 'Overall, how bothersome has your back pain been in the last 2 weeks?',
          no: 'Totalt sett, hvor plagsom har ryggsmertene dine vært de siste 2 ukene?',
        },
        domain: 'psychosocial',
        options: [
          { score: 0, text: { en: 'Not at all', no: 'Ikke i det hele tatt' } },
          { score: 0, text: { en: 'Slightly', no: 'Litt' } },
          { score: 0, text: { en: 'Moderately', no: 'Moderat' } },
          { score: 1, text: { en: 'Very much', no: 'Veldig mye' } },
          { score: 1, text: { en: 'Extremely', no: 'Ekstremt' } },
        ],
      },
    ],
    options: [
      { score: 0, text: { en: 'Disagree', no: 'Uenig' } },
      { score: 1, text: { en: 'Agree', no: 'Enig' } },
    ],
    scoring: {
      totalMaxScore: 9,
      psychosocialMaxScore: 5,
      interpretation: [
        {
          min: 0,
          max: 3,
          psychMin: 0,
          psychMax: 3,
          level: 'low',
          label: { en: 'Low Risk', no: 'Lav risiko' },
          color: 'green',
          recommendation: {
            en: 'Reassurance, advice, simple analgesia',
            no: 'Betryggende informasjon, råd, enkel smertelindring',
          },
        },
        {
          min: 4,
          max: 9,
          psychMin: 0,
          psychMax: 3,
          level: 'medium',
          label: { en: 'Medium Risk', no: 'Middels risiko' },
          color: 'yellow',
          recommendation: {
            en: 'Physiotherapy with focus on physical symptoms',
            no: 'Fysioterapi med fokus på fysiske symptomer',
          },
        },
        {
          min: 4,
          max: 9,
          psychMin: 4,
          psychMax: 5,
          level: 'high',
          label: { en: 'High Risk', no: 'Høy risiko' },
          color: 'red',
          recommendation: {
            en: 'Physiotherapy addressing psychosocial factors',
            no: 'Fysioterapi som adresserer psykososiale faktorer',
          },
        },
      ],
      mcid: 2,
    },
  },

  // ---------------------------------------------------------------------------
  // BQ - Bournemouth Questionnaire (Bolton & Breen, 1999)
  // ---------------------------------------------------------------------------
  BQ: {
    id: 'BQ',
    name: { en: 'Bournemouth Questionnaire', no: 'Bournemouth Spørreskjema' },
    shortName: 'BQ',
    description: {
      en: 'Multi-dimensional assessment of back and neck pain across 7 domains',
      no: 'Flerdimensjonal vurdering av rygg- og nakkesmerter på tvers av 7 domener',
    },
    instructions: {
      en: 'Please answer each question by marking the appropriate point on the scale that best describes how you feel.',
      no: 'Vennligst svar på hvert spørsmål ved å markere det passende punktet på skalaen som best beskriver hvordan du føler deg.',
    },
    type: 'vas_scale',
    sections: [
      {
        id: 'bq1',
        title: { en: 'Pain Intensity', no: 'Smerteintensitet' },
        question: {
          en: 'Over the past week, on average, how would you rate your back/neck pain?',
          no: 'I løpet av den siste uken, i gjennomsnitt, hvordan vil du vurdere rygg/nakke-smertene dine?',
        },
        leftLabel: { en: 'No pain', no: 'Ingen smerte' },
        rightLabel: { en: 'Worst pain possible', no: 'Verst mulige smerte' },
      },
      {
        id: 'bq2',
        title: { en: 'Daily Activities', no: 'Daglige aktiviteter' },
        question: {
          en: 'Over the past week, how much has your back/neck pain interfered with your daily activities (housework, washing, dressing, lifting, reading, driving)?',
          no: 'I løpet av den siste uken, hvor mye har rygg/nakke-smertene dine påvirket dine daglige aktiviteter (husarbeid, vask, påkledning, løfting, lesing, bilkjøring)?',
        },
        leftLabel: { en: 'No interference', no: 'Ingen påvirkning' },
        rightLabel: {
          en: 'Unable to carry out activities',
          no: 'Ute av stand til å utføre aktiviteter',
        },
      },
      {
        id: 'bq3',
        title: { en: 'Social Activities', no: 'Sosiale aktiviteter' },
        question: {
          en: 'Over the past week, how much has your back/neck pain interfered with your ability to take part in recreational, social and family activities?',
          no: 'I løpet av den siste uken, hvor mye har rygg/nakke-smertene dine påvirket din evne til å delta i fritids-, sosiale- og familieaktiviteter?',
        },
        leftLabel: { en: 'No interference', no: 'Ingen påvirkning' },
        rightLabel: {
          en: 'Unable to carry out activities',
          no: 'Ute av stand til å utføre aktiviteter',
        },
      },
      {
        id: 'bq4',
        title: { en: 'Anxiety', no: 'Angst' },
        question: {
          en: 'Over the past week, how anxious (tense, uptight, irritable, difficulty concentrating/relaxing) have you been feeling?',
          no: 'I løpet av den siste uken, hvor engstelig (anspent, oppjaget, irritabel, vanskeligheter med å konsentrere seg/slappe av) har du følt deg?',
        },
        leftLabel: { en: 'Not at all anxious', no: 'Ikke engstelig i det hele tatt' },
        rightLabel: { en: 'Extremely anxious', no: 'Ekstremt engstelig' },
      },
      {
        id: 'bq5',
        title: { en: 'Depression', no: 'Depresjon' },
        question: {
          en: 'Over the past week, how depressed (down-in-the-dumps, sad, in low spirits, pessimistic, unhappy) have you been feeling?',
          no: 'I løpet av den siste uken, hvor deprimert (nedstemt, trist, i lavt humør, pessimistisk, ulykkelig) har du følt deg?',
        },
        leftLabel: { en: 'Not at all depressed', no: 'Ikke deprimert i det hele tatt' },
        rightLabel: { en: 'Extremely depressed', no: 'Ekstremt deprimert' },
      },
      {
        id: 'bq6',
        title: { en: 'Fear-Avoidance Beliefs - Work', no: 'Frykt-unngåelse - Arbeid' },
        question: {
          en: 'Over the past week, how much have you felt that your work (both inside and outside the home) has affected (or would affect) your back/neck pain?',
          no: 'I løpet av den siste uken, hvor mye har du følt at arbeidet ditt (både inne og utenfor hjemmet) har påvirket (eller ville påvirke) rygg/nakke-smertene dine?',
        },
        leftLabel: { en: 'Not at all', no: 'Ikke i det hele tatt' },
        rightLabel: { en: 'A great deal', no: 'Veldig mye' },
      },
      {
        id: 'bq7',
        title: { en: 'Locus of Control', no: 'Kontrollplassering' },
        question: {
          en: 'Over the past week, how much have you been able to control (reduce/help) your back/neck pain on your own?',
          no: 'I løpet av den siste uken, hvor mye har du vært i stand til å kontrollere (redusere/hjelpe) rygg/nakke-smertene dine på egen hånd?',
        },
        leftLabel: { en: 'Completely control it', no: 'Fullstendig kontroll' },
        rightLabel: { en: 'No control whatsoever', no: 'Ingen kontroll overhodet' },
      },
    ],
    scoring: {
      maxScore: 70, // 7 items x 10 max
      interpretation: [
        {
          min: 0,
          max: 14,
          level: 'minimal',
          label: { en: 'Minimal Impact', no: 'Minimal påvirkning' },
          color: 'green',
        },
        {
          min: 15,
          max: 28,
          level: 'mild',
          label: { en: 'Mild Impact', no: 'Mild påvirkning' },
          color: 'yellow',
        },
        {
          min: 29,
          max: 42,
          level: 'moderate',
          label: { en: 'Moderate Impact', no: 'Moderat påvirkning' },
          color: 'orange',
        },
        {
          min: 43,
          max: 56,
          level: 'severe',
          label: { en: 'Severe Impact', no: 'Alvorlig påvirkning' },
          color: 'red',
        },
        {
          min: 57,
          max: 70,
          level: 'very_severe',
          label: { en: 'Very Severe Impact', no: 'Svært alvorlig påvirkning' },
          color: 'darkred',
        },
      ],
      mcid: 13, // Minimal Clinically Important Difference (points)
    },
  },

  // ---------------------------------------------------------------------------
  // DASH - Disabilities of the Arm, Shoulder and Hand (AAOS, 1996)
  // ---------------------------------------------------------------------------
  DASH: {
    id: 'DASH',
    name: {
      en: 'Disabilities of Arm, Shoulder and Hand',
      no: 'Funksjonshemming i Arm, Skulder og Hånd',
    },
    shortName: 'DASH',
    description: {
      en: 'Measures upper extremity function and symptoms. Uses 30 core items.',
      no: 'Måler funksjon og symptomer i overekstremitetene. Bruker 30 kjernespørsmål.',
    },
    instructions: {
      en: 'Please rate your ability to do the following activities in the last week. If you did not have the opportunity to do an activity in the past week, please make your best estimate.',
      no: 'Vennligst vurder din evne til å gjøre følgende aktiviteter i løpet av den siste uken. Hvis du ikke hadde mulighet til å gjøre en aktivitet, vennligst gjør ditt beste estimat.',
    },
    sections: [
      // Activities (1-21)
      {
        id: 'dash1',
        text: { en: 'Open a tight or new jar', no: 'Åpne et stramt eller nytt glass' },
        category: 'activities',
      },
      { id: 'dash2', text: { en: 'Write', no: 'Skrive' }, category: 'activities' },
      { id: 'dash3', text: { en: 'Turn a key', no: 'Vri en nøkkel' }, category: 'activities' },
      { id: 'dash4', text: { en: 'Prepare a meal', no: 'Lage et måltid' }, category: 'activities' },
      {
        id: 'dash5',
        text: { en: 'Push open a heavy door', no: 'Skyve opp en tung dør' },
        category: 'activities',
      },
      {
        id: 'dash6',
        text: {
          en: 'Place an object on a shelf above your head',
          no: 'Plassere en gjenstand på en hylle over hodet',
        },
        category: 'activities',
      },
      {
        id: 'dash7',
        text: {
          en: 'Do heavy household chores (e.g., wash walls, floors)',
          no: 'Gjøre tunge husarbeidsoppgaver (f.eks. vaske vegger, gulv)',
        },
        category: 'activities',
      },
      {
        id: 'dash8',
        text: { en: 'Garden or do yard work', no: 'Hagearbeid eller arbeid i hagen' },
        category: 'activities',
      },
      { id: 'dash9', text: { en: 'Make a bed', no: 'Re opp en seng' }, category: 'activities' },
      {
        id: 'dash10',
        text: {
          en: 'Carry a shopping bag or briefcase',
          no: 'Bære en handlepose eller dokumentmappe',
        },
        category: 'activities',
      },
      {
        id: 'dash11',
        text: { en: 'Carry a heavy object (over 5 kg)', no: 'Bære en tung gjenstand (over 5 kg)' },
        category: 'activities',
      },
      {
        id: 'dash12',
        text: { en: 'Change a lightbulb overhead', no: 'Skifte en lyspære over hodet' },
        category: 'activities',
      },
      {
        id: 'dash13',
        text: { en: 'Wash or blow dry your hair', no: 'Vaske eller føne håret' },
        category: 'activities',
      },
      { id: 'dash14', text: { en: 'Wash your back', no: 'Vaske ryggen' }, category: 'activities' },
      {
        id: 'dash15',
        text: { en: 'Put on a pullover sweater', no: 'Ta på en genser' },
        category: 'activities',
      },
      {
        id: 'dash16',
        text: { en: 'Use a knife to cut food', no: 'Bruke en kniv til å skjære mat' },
        category: 'activities',
      },
      {
        id: 'dash17',
        text: {
          en: 'Recreational activities requiring little effort (e.g., cardplaying)',
          no: 'Fritidsaktiviteter som krever liten innsats (f.eks. kortspill)',
        },
        category: 'activities',
      },
      {
        id: 'dash18',
        text: {
          en: 'Recreational activities with force/impact (e.g., golf, hammering, tennis)',
          no: 'Fritidsaktiviteter med kraft/støt (f.eks. golf, hamring, tennis)',
        },
        category: 'activities',
      },
      {
        id: 'dash19',
        text: {
          en: 'Recreational activities with free arm movement (e.g., frisbee, badminton)',
          no: 'Fritidsaktiviteter med fri armbevegelse (f.eks. frisbee, badminton)',
        },
        category: 'activities',
      },
      {
        id: 'dash20',
        text: {
          en: 'Manage transportation needs (getting from one place to another)',
          no: 'Håndtere transportbehov (komme seg fra ett sted til et annet)',
        },
        category: 'activities',
      },
      {
        id: 'dash21',
        text: { en: 'Sexual activities', no: 'Seksuelle aktiviteter' },
        category: 'activities',
        optional: true,
      },
      // Social/Role (22-23)
      {
        id: 'dash22',
        text: {
          en: 'During the past week, to what extent has your arm, shoulder or hand problem interfered with your normal social activities with family, friends, neighbors or groups?',
          no: 'I løpet av den siste uken, i hvilken grad har ditt arm-, skulder- eller håndproblem påvirket dine normale sosiale aktiviteter med familie, venner, naboer eller grupper?',
        },
        category: 'social',
      },
      {
        id: 'dash23',
        text: {
          en: 'During the past week, were you limited in your work or other regular daily activities as a result of your arm, shoulder or hand problem?',
          no: 'I løpet av den siste uken, var du begrenset i arbeidet ditt eller andre daglige aktiviteter som følge av ditt arm-, skulder- eller håndproblem?',
        },
        category: 'social',
      },
      // Symptoms (24-29)
      {
        id: 'dash24',
        text: { en: 'Arm, shoulder or hand pain', no: 'Smerter i arm, skulder eller hånd' },
        category: 'symptoms',
      },
      {
        id: 'dash25',
        text: {
          en: 'Arm, shoulder or hand pain when performing any specific activity',
          no: 'Smerter i arm, skulder eller hånd ved utførelse av en spesifikk aktivitet',
        },
        category: 'symptoms',
      },
      {
        id: 'dash26',
        text: {
          en: 'Tingling (pins and needles) in your arm, shoulder or hand',
          no: 'Prikking (stikking) i arm, skulder eller hånd',
        },
        category: 'symptoms',
      },
      {
        id: 'dash27',
        text: {
          en: 'Weakness in your arm, shoulder or hand',
          no: 'Svakhet i arm, skulder eller hånd',
        },
        category: 'symptoms',
      },
      {
        id: 'dash28',
        text: {
          en: 'Stiffness in your arm, shoulder or hand',
          no: 'Stivhet i arm, skulder eller hånd',
        },
        category: 'symptoms',
      },
      // Sleep (29-30)
      {
        id: 'dash29',
        text: {
          en: 'During the past week, how much difficulty have you had sleeping because of the pain in your arm, shoulder or hand?',
          no: 'I løpet av den siste uken, hvor mye vanskeligheter har du hatt med å sove på grunn av smerter i arm, skulder eller hånd?',
        },
        category: 'sleep',
      },
      {
        id: 'dash30',
        text: {
          en: 'I feel less capable, less confident or less useful because of my arm, shoulder or hand problem',
          no: 'Jeg føler meg mindre kapabel, mindre selvsikker eller mindre nyttig på grunn av mitt arm-, skulder- eller håndproblem',
        },
        category: 'confidence',
      },
    ],
    options: [
      { score: 1, text: { en: 'No difficulty', no: 'Ingen vanskeligheter' } },
      { score: 2, text: { en: 'Mild difficulty', no: 'Mild vanskeligheter' } },
      { score: 3, text: { en: 'Moderate difficulty', no: 'Moderate vanskeligheter' } },
      { score: 4, text: { en: 'Severe difficulty', no: 'Store vanskeligheter' } },
      { score: 5, text: { en: 'Unable', no: 'Ikke i stand' } },
    ],
    symptomOptions: [
      { score: 1, text: { en: 'None', no: 'Ingen' } },
      { score: 2, text: { en: 'Mild', no: 'Mild' } },
      { score: 3, text: { en: 'Moderate', no: 'Moderat' } },
      { score: 4, text: { en: 'Severe', no: 'Alvorlig' } },
      { score: 5, text: { en: 'Extreme', no: 'Ekstremt' } },
    ],
    scoring: {
      // Formula: [(sum of n responses) / n - 1] x 25
      maxScore: 100,
      interpretation: [
        {
          min: 0,
          max: 20,
          level: 'minimal',
          label: { en: 'Minimal Disability', no: 'Minimal funksjonsnedsettelse' },
          color: 'green',
        },
        {
          min: 21,
          max: 40,
          level: 'mild',
          label: { en: 'Mild Disability', no: 'Mild funksjonsnedsettelse' },
          color: 'yellow',
        },
        {
          min: 41,
          max: 60,
          level: 'moderate',
          label: { en: 'Moderate Disability', no: 'Moderat funksjonsnedsettelse' },
          color: 'orange',
        },
        {
          min: 61,
          max: 80,
          level: 'severe',
          label: { en: 'Severe Disability', no: 'Alvorlig funksjonsnedsettelse' },
          color: 'red',
        },
        {
          min: 81,
          max: 100,
          level: 'very_severe',
          label: { en: 'Very Severe Disability', no: 'Svært alvorlig funksjonsnedsettelse' },
          color: 'darkred',
        },
      ],
      mcid: 10.2, // Minimal Clinically Important Difference
    },
  },

  // ---------------------------------------------------------------------------
  // HIT-6 - Headache Impact Test (Ware et al., 2000)
  // ---------------------------------------------------------------------------
  HIT6: {
    id: 'HIT6',
    name: { en: 'Headache Impact Test', no: 'Hodepine Påvirkningstest' },
    shortName: 'HIT-6',
    description: {
      en: 'Measures the impact of headaches on daily life and functioning',
      no: 'Måler hodepinens påvirkning på dagligliv og funksjon',
    },
    instructions: {
      en: 'This questionnaire helps you describe and communicate the way you feel and what you cannot do because of headaches. Please answer every question.',
      no: 'Dette spørreskjemaet hjelper deg å beskrive og kommunisere hvordan du føler deg og hva du ikke kan gjøre på grunn av hodepine. Vennligst svar på alle spørsmålene.',
    },
    sections: [
      {
        id: 'hit1',
        text: {
          en: 'When you have headaches, how often is the pain severe?',
          no: 'Når du har hodepine, hvor ofte er smerten sterk?',
        },
      },
      {
        id: 'hit2',
        text: {
          en: 'How often do headaches limit your ability to do usual daily activities including household work, work, school, or social activities?',
          no: 'Hvor ofte begrenser hodepine din evne til å gjøre vanlige daglige aktiviteter inkludert husarbeid, arbeid, skole eller sosiale aktiviteter?',
        },
      },
      {
        id: 'hit3',
        text: {
          en: 'When you have a headache, how often do you wish you could lie down?',
          no: 'Når du har hodepine, hvor ofte ønsker du at du kunne legge deg ned?',
        },
      },
      {
        id: 'hit4',
        text: {
          en: 'In the past 4 weeks, how often have you felt too tired to do work or daily activities because of your headaches?',
          no: 'I løpet av de siste 4 ukene, hvor ofte har du følt deg for sliten til å gjøre arbeid eller daglige aktiviteter på grunn av hodepinen din?',
        },
      },
      {
        id: 'hit5',
        text: {
          en: 'In the past 4 weeks, how often have you felt fed up or irritated because of your headaches?',
          no: 'I løpet av de siste 4 ukene, hvor ofte har du følt deg lei eller irritert på grunn av hodepinen din?',
        },
      },
      {
        id: 'hit6',
        text: {
          en: 'In the past 4 weeks, how often did headaches limit your ability to concentrate on work or daily activities?',
          no: 'I løpet av de siste 4 ukene, hvor ofte begrenset hodepine din evne til å konsentrere deg om arbeid eller daglige aktiviteter?',
        },
      },
    ],
    options: [
      { score: 6, text: { en: 'Never', no: 'Aldri' } },
      { score: 8, text: { en: 'Rarely', no: 'Sjelden' } },
      { score: 10, text: { en: 'Sometimes', no: 'Noen ganger' } },
      { score: 11, text: { en: 'Very Often', no: 'Veldig ofte' } },
      { score: 13, text: { en: 'Always', no: 'Alltid' } },
    ],
    scoring: {
      minScore: 36, // 6 items x 6 minimum
      maxScore: 78, // 6 items x 13 maximum
      interpretation: [
        {
          min: 36,
          max: 49,
          level: 'little',
          label: { en: 'Little or No Impact', no: 'Liten eller ingen påvirkning' },
          color: 'green',
        },
        {
          min: 50,
          max: 55,
          level: 'some',
          label: { en: 'Some Impact', no: 'Noe påvirkning' },
          color: 'yellow',
        },
        {
          min: 56,
          max: 59,
          level: 'substantial',
          label: { en: 'Substantial Impact', no: 'Betydelig påvirkning' },
          color: 'orange',
        },
        {
          min: 60,
          max: 78,
          level: 'severe',
          label: { en: 'Severe Impact', no: 'Alvorlig påvirkning' },
          color: 'red',
        },
      ],
      mcid: 2.5, // Minimal Clinically Important Difference (individual) / 6 for group
    },
  },

  // ---------------------------------------------------------------------------
  // QBPDS - Quebec Back Pain Disability Scale (Kopec et al., 1995)
  // ---------------------------------------------------------------------------
  QBPDS: {
    id: 'QBPDS',
    name: { en: 'Quebec Back Pain Disability Scale', no: 'Quebec Ryggsmerte Funksjonsskala' },
    shortName: 'Quebec',
    description: {
      en: 'Measures functional disability due to back pain across 20 daily activities',
      no: 'Måler funksjonshemming på grunn av ryggsmerter på tvers av 20 daglige aktiviteter',
    },
    instructions: {
      en: 'This questionnaire asks about how your back pain affects your daily life. For each activity, please indicate how difficult it is for you to perform TODAY because of your back pain.',
      no: 'Dette spørreskjemaet spør om hvordan ryggsmertene dine påvirker dagliglivet. For hver aktivitet, vennligst angi hvor vanskelig det er for deg å utføre I DAG på grunn av ryggsmertene dine.',
    },
    sections: [
      { id: 'qbpds1', text: { en: 'Get out of bed', no: 'Komme seg opp av sengen' } },
      { id: 'qbpds2', text: { en: 'Sleep through the night', no: 'Sove gjennom natten' } },
      { id: 'qbpds3', text: { en: 'Turn over in bed', no: 'Snu seg i sengen' } },
      { id: 'qbpds4', text: { en: 'Ride in a car', no: 'Kjøre bil' } },
      { id: 'qbpds5', text: { en: 'Stand up for 20-30 minutes', no: 'Stå i 20-30 minutter' } },
      {
        id: 'qbpds6',
        text: { en: 'Sit in a chair for several hours', no: 'Sitte i en stol i flere timer' },
      },
      {
        id: 'qbpds7',
        text: { en: 'Climb one flight of stairs', no: 'Gå opp en etasje i trappen' },
      },
      {
        id: 'qbpds8',
        text: { en: 'Walk a few blocks (300-400 m)', no: 'Gå noen kvartaler (300-400 m)' },
      },
      { id: 'qbpds9', text: { en: 'Walk several kilometers', no: 'Gå flere kilometer' } },
      {
        id: 'qbpds10',
        text: { en: 'Reach up to high shelves', no: 'Strekke seg opp til høye hyller' },
      },
      { id: 'qbpds11', text: { en: 'Throw a ball', no: 'Kaste en ball' } },
      {
        id: 'qbpds12',
        text: { en: 'Run one block (about 100 m)', no: 'Løpe en blokk (ca. 100 m)' },
      },
      {
        id: 'qbpds13',
        text: { en: 'Take food out of the refrigerator', no: 'Ta mat ut av kjøleskapet' },
      },
      { id: 'qbpds14', text: { en: 'Make your bed', no: 'Re opp sengen' } },
      {
        id: 'qbpds15',
        text: { en: 'Put on socks (or pantyhose)', no: 'Ta på sokker (eller strømpebukse)' },
      },
      {
        id: 'qbpds16',
        text: { en: 'Bend over to clean the bathtub', no: 'Bøye seg for å rengjøre badekaret' },
      },
      { id: 'qbpds17', text: { en: 'Move a chair', no: 'Flytte en stol' } },
      {
        id: 'qbpds18',
        text: { en: 'Pull or push heavy doors', no: 'Dra eller skyve tunge dører' },
      },
      { id: 'qbpds19', text: { en: 'Carry two bags of groceries', no: 'Bære to handleposer' } },
      {
        id: 'qbpds20',
        text: { en: 'Lift and carry a heavy suitcase', no: 'Løfte og bære en tung koffert' },
      },
    ],
    options: [
      { score: 0, text: { en: 'Not difficult at all', no: 'Ikke vanskelig i det hele tatt' } },
      { score: 1, text: { en: 'Minimally difficult', no: 'Minimalt vanskelig' } },
      { score: 2, text: { en: 'Somewhat difficult', no: 'Noe vanskelig' } },
      { score: 3, text: { en: 'Fairly difficult', no: 'Ganske vanskelig' } },
      { score: 4, text: { en: 'Very difficult', no: 'Veldig vanskelig' } },
      { score: 5, text: { en: 'Unable to do', no: 'Ikke i stand til å gjøre' } },
    ],
    scoring: {
      maxScore: 100, // 20 items x 5 max
      interpretation: [
        {
          min: 0,
          max: 20,
          level: 'minimal',
          label: { en: 'Minimal Disability', no: 'Minimal funksjonsnedsettelse' },
          color: 'green',
        },
        {
          min: 21,
          max: 40,
          level: 'mild',
          label: { en: 'Mild Disability', no: 'Mild funksjonsnedsettelse' },
          color: 'yellow',
        },
        {
          min: 41,
          max: 60,
          level: 'moderate',
          label: { en: 'Moderate Disability', no: 'Moderat funksjonsnedsettelse' },
          color: 'orange',
        },
        {
          min: 61,
          max: 80,
          level: 'severe',
          label: { en: 'Severe Disability', no: 'Alvorlig funksjonsnedsettelse' },
          color: 'red',
        },
        {
          min: 81,
          max: 100,
          level: 'very_severe',
          label: { en: 'Very Severe Disability', no: 'Svært alvorlig funksjonsnedsettelse' },
          color: 'darkred',
        },
      ],
      mcid: 15, // Minimal Clinically Important Difference (points)
    },
  },
};

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate score for standard questionnaires (NDI, ODI)
 */
export function calculateScore(questionnaireId, answers) {
  const questionnaire = QUESTIONNAIRES[questionnaireId];
  if (!questionnaire) {
    return null;
  }

  if (questionnaire.type === 'slider' || questionnaire.type === 'numeric') {
    return {
      rawScore: answers.value || 0,
      percentage: ((answers.value || 0) / questionnaire.scoring.maxScore) * 100,
      interpretation: getInterpretation(questionnaire, answers.value || 0),
    };
  }

  // Standard section-based questionnaires
  const answeredSections = questionnaire.sections.filter(
    (s) => answers[s.id] !== undefined && !s.optional
  );
  const totalSections = questionnaire.sections.filter((s) => !s.optional).length;

  if (answeredSections.length === 0) {
    return null;
  }

  const rawScore = Object.values(answers).reduce((sum, val) => sum + (val || 0), 0);
  const maxPossible = answeredSections.length * 5;
  const percentage = (rawScore / maxPossible) * 100;

  return {
    rawScore,
    maxPossible,
    percentage: Math.round(percentage * 10) / 10,
    interpretation: getInterpretation(questionnaire, percentage),
    sectionsAnswered: answeredSections.length,
    sectionsTotal: totalSections,
  };
}

/**
 * Calculate FABQ subscale scores
 */
export function calculateFABQScore(answers) {
  const _fabq = QUESTIONNAIRES.FABQ;

  // Physical Activity subscale (items 2,3,4,5 in 1-indexed = fabq2,3,4,5)
  const physicalItems = ['fabq2', 'fabq3', 'fabq4', 'fabq5'];
  const physicalScore = physicalItems.reduce((sum, id) => sum + (answers[id] || 0), 0);

  // Work subscale (items 6,7,9,10,11,12,15)
  const workItems = ['fabq6', 'fabq7', 'fabq9', 'fabq10', 'fabq11', 'fabq12', 'fabq15'];
  const workScore = workItems.reduce((sum, id) => sum + (answers[id] || 0), 0);

  return {
    physical: {
      score: physicalScore,
      maxScore: 24,
      percentage: Math.round((physicalScore / 24) * 100),
      interpretation: physicalScore >= 15 ? 'high' : 'low',
    },
    work: {
      score: workScore,
      maxScore: 42,
      percentage: Math.round((workScore / 42) * 100),
      interpretation: workScore >= 25 ? 'high' : 'low',
    },
  };
}

/**
 * Get interpretation level for a score
 */
function getInterpretation(questionnaire, score) {
  const interpretations = questionnaire.scoring.interpretation;
  return interpretations.find((i) => score >= i.min && score <= i.max) || interpretations[0];
}

/**
 * Calculate change between two assessments
 */
export function calculateChange(previousScore, currentScore, mcid) {
  const change = previousScore - currentScore; // Positive = improvement
  const percentChange = previousScore > 0 ? (change / previousScore) * 100 : 0;

  let significance = 'none';
  if (Math.abs(change) >= mcid) {
    significance = change > 0 ? 'improved' : 'worsened';
  }

  return {
    absoluteChange: change,
    percentChange: Math.round(percentChange * 10) / 10,
    significance,
    mcid,
    clinicallySignificant: Math.abs(change) >= mcid,
  };
}

/**
 * Calculate RMDQ score (Roland-Morris Disability Questionnaire)
 * Simple count of checked items (0-24)
 */
export function calculateRMDQScore(answers) {
  const rmdq = QUESTIONNAIRES.RMDQ;
  const checkedItems = rmdq.sections.filter((s) => answers[s.id] === true || answers[s.id] === 1);
  const rawScore = checkedItems.length;

  return {
    rawScore,
    maxScore: 24,
    percentage: Math.round((rawScore / 24) * 100),
    interpretation: getInterpretation(rmdq, rawScore),
  };
}

/**
 * Calculate STarT Back score
 * Returns total score (0-9) and psychosocial subscore (0-5)
 */
export function calculateSTarTBackScore(answers) {
  const startBack = QUESTIONNAIRES.STARTBACK;

  // Calculate total score (items 1-9)
  let totalScore = 0;
  startBack.sections.forEach((section) => {
    if (answers[section.id] === 1 || answers[section.id] === true) {
      totalScore += 1;
    }
  });

  // Item 9 (special 5-point scale) - add to total if "Very much" or "Extremely"
  if (answers.start9 >= 3) {
    totalScore += 1;
  }

  // Calculate psychosocial subscore (items 5-9)
  let psychosocialScore = 0;
  ['start5', 'start6', 'start7', 'start8'].forEach((id) => {
    if (answers[id] === 1 || answers[id] === true) {
      psychosocialScore += 1;
    }
  });
  if (answers.start9 >= 3) {
    psychosocialScore += 1;
  }

  // Determine risk category
  let riskLevel, interpretation;
  if (totalScore <= 3) {
    riskLevel = 'low';
    interpretation = startBack.scoring.interpretation[0];
  } else if (psychosocialScore <= 3) {
    riskLevel = 'medium';
    interpretation = startBack.scoring.interpretation[1];
  } else {
    riskLevel = 'high';
    interpretation = startBack.scoring.interpretation[2];
  }

  return {
    totalScore,
    psychosocialScore,
    maxTotalScore: 9,
    maxPsychosocialScore: 5,
    riskLevel,
    interpretation,
  };
}

/**
 * Calculate Bournemouth Questionnaire score
 * Sum of 7 VAS scales (0-10 each), total 0-70
 */
export function calculateBQScore(answers) {
  const bq = QUESTIONNAIRES.BQ;
  let totalScore = 0;
  let answeredCount = 0;

  bq.sections.forEach((section) => {
    if (answers[section.id] !== undefined && answers[section.id] !== null) {
      totalScore += answers[section.id];
      answeredCount++;
    }
  });

  if (answeredCount === 0) {
    return null;
  }

  // If some items missing, prorate the score
  const proratedScore = answeredCount < 7 ? (totalScore / answeredCount) * 7 : totalScore;

  return {
    rawScore: totalScore,
    proratedScore: Math.round(proratedScore * 10) / 10,
    maxScore: 70,
    percentage: Math.round((proratedScore / 70) * 100),
    interpretation: getInterpretation(bq, proratedScore),
    itemsAnswered: answeredCount,
  };
}

/**
 * Calculate DASH score
 * Formula: [(sum of n responses / n) - 1] x 25
 * Requires at least 27 of 30 items answered
 */
export function calculateDASHScore(answers) {
  const dash = QUESTIONNAIRES.DASH;
  let totalScore = 0;
  let answeredCount = 0;

  dash.sections.forEach((section) => {
    if (answers[section.id] !== undefined && answers[section.id] !== null && !section.optional) {
      totalScore += answers[section.id];
      answeredCount++;
    }
  });

  // DASH requires at least 27 of 30 items (or 90%)
  const requiredItems = Math.ceil(dash.sections.filter((s) => !s.optional).length * 0.9);
  if (answeredCount < requiredItems) {
    return {
      error: true,
      message: {
        en: `At least ${requiredItems} items must be answered`,
        no: `Minst ${requiredItems} spørsmål må besvares`,
      },
      itemsAnswered: answeredCount,
      requiredItems,
    };
  }

  // DASH formula: [(sum/n) - 1] x 25
  const dashScore = (totalScore / answeredCount - 1) * 25;

  return {
    rawScore: Math.round(dashScore * 10) / 10,
    maxScore: 100,
    percentage: Math.round(dashScore),
    interpretation: getInterpretation(dash, dashScore),
    itemsAnswered: answeredCount,
  };
}

/**
 * Calculate HIT-6 score
 * Sum of 6 items with weighted scoring (6, 8, 10, 11, 13)
 * Range: 36-78
 */
export function calculateHIT6Score(answers) {
  const hit6 = QUESTIONNAIRES.HIT6;
  let totalScore = 0;
  let answeredCount = 0;

  hit6.sections.forEach((section) => {
    if (answers[section.id] !== undefined && answers[section.id] !== null) {
      totalScore += answers[section.id];
      answeredCount++;
    }
  });

  // HIT-6 requires all 6 items
  if (answeredCount < 6) {
    return {
      error: true,
      message: { en: 'All 6 items must be answered', no: 'Alle 6 spørsmål må besvares' },
      itemsAnswered: answeredCount,
    };
  }

  return {
    rawScore: totalScore,
    minScore: 36,
    maxScore: 78,
    interpretation: getInterpretation(hit6, totalScore),
  };
}

/**
 * Calculate Quebec Back Pain Disability Scale score
 * Sum of 20 items (0-5 each), total 0-100
 */
export function calculateQBPDSScore(answers) {
  const qbpds = QUESTIONNAIRES.QBPDS;
  let totalScore = 0;
  let answeredCount = 0;

  qbpds.sections.forEach((section) => {
    if (answers[section.id] !== undefined && answers[section.id] !== null) {
      totalScore += answers[section.id];
      answeredCount++;
    }
  });

  if (answeredCount === 0) {
    return null;
  }

  // Prorate if some items missing
  const proratedScore = answeredCount < 20 ? (totalScore / answeredCount) * 20 : totalScore;

  return {
    rawScore: totalScore,
    proratedScore: Math.round(proratedScore),
    maxScore: 100,
    percentage: Math.round(proratedScore),
    interpretation: getInterpretation(qbpds, proratedScore),
    itemsAnswered: answeredCount,
  };
}

/**
 * Universal scoring function for all questionnaires
 */
export function calculateQuestionnaireScore(questionnaireId, answers) {
  switch (questionnaireId) {
    case 'RMDQ':
      return calculateRMDQScore(answers);
    case 'STARTBACK':
      return calculateSTarTBackScore(answers);
    case 'BQ':
      return calculateBQScore(answers);
    case 'DASH':
      return calculateDASHScore(answers);
    case 'HIT6':
      return calculateHIT6Score(answers);
    case 'QBPDS':
      return calculateQBPDSScore(answers);
    case 'FABQ':
      return calculateFABQScore(answers);
    default:
      return calculateScore(questionnaireId, answers);
  }
}
