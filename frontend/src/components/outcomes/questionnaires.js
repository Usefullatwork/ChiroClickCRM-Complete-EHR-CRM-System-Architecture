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
          { score: 0, text: { en: 'I have no pain at the moment', no: 'Jeg har ingen smerter for øyeblikket' } },
          { score: 1, text: { en: 'The pain is very mild at the moment', no: 'Smertene er veldig milde for øyeblikket' } },
          { score: 2, text: { en: 'The pain is moderate at the moment', no: 'Smertene er moderate for øyeblikket' } },
          { score: 3, text: { en: 'The pain is fairly severe at the moment', no: 'Smertene er ganske sterke for øyeblikket' } },
          { score: 4, text: { en: 'The pain is very severe at the moment', no: 'Smertene er veldig sterke for øyeblikket' } },
          { score: 5, text: { en: 'The pain is the worst imaginable at the moment', no: 'Smertene er verst tenkelig for øyeblikket' } },
        ],
      },
      {
        id: 'personal_care',
        title: { en: 'Personal Care (Washing, Dressing)', no: 'Personlig stell (vask, påkledning)' },
        options: [
          { score: 0, text: { en: 'I can look after myself normally without causing extra pain', no: 'Jeg kan stelle meg selv normalt uten ekstra smerter' } },
          { score: 1, text: { en: 'I can look after myself normally but it causes extra pain', no: 'Jeg kan stelle meg selv normalt, men det gir ekstra smerter' } },
          { score: 2, text: { en: 'It is painful to look after myself and I am slow and careful', no: 'Det er smertefullt å stelle meg selv og jeg er treg og forsiktig' } },
          { score: 3, text: { en: 'I need some help but manage most of my personal care', no: 'Jeg trenger litt hjelp, men klarer det meste av personlig stell' } },
          { score: 4, text: { en: 'I need help every day in most aspects of self-care', no: 'Jeg trenger hjelp hver dag til det meste av personlig stell' } },
          { score: 5, text: { en: 'I do not get dressed, I wash with difficulty and stay in bed', no: 'Jeg kler meg ikke, vasker meg med vanskelighet og ligger i sengen' } },
        ],
      },
      {
        id: 'lifting',
        title: { en: 'Lifting', no: 'Løfting' },
        options: [
          { score: 0, text: { en: 'I can lift heavy weights without extra pain', no: 'Jeg kan løfte tunge ting uten ekstra smerter' } },
          { score: 1, text: { en: 'I can lift heavy weights but it gives extra pain', no: 'Jeg kan løfte tunge ting, men det gir ekstra smerter' } },
          { score: 2, text: { en: 'Pain prevents me from lifting heavy weights off the floor, but I can manage if they are conveniently placed', no: 'Smerter hindrer meg fra å løfte tunge ting fra gulvet, men jeg klarer det hvis de er praktisk plassert' } },
          { score: 3, text: { en: 'Pain prevents me from lifting heavy weights but I can manage light to medium weights if they are conveniently positioned', no: 'Smerter hindrer meg fra å løfte tunge ting, men jeg klarer lette til middels tunge ting hvis de er praktisk plassert' } },
          { score: 4, text: { en: 'I can lift very light weights', no: 'Jeg kan bare løfte veldig lette ting' } },
          { score: 5, text: { en: 'I cannot lift or carry anything at all', no: 'Jeg kan ikke løfte eller bære noe som helst' } },
        ],
      },
      {
        id: 'reading',
        title: { en: 'Reading', no: 'Lesing' },
        options: [
          { score: 0, text: { en: 'I can read as much as I want with no pain in my neck', no: 'Jeg kan lese så mye jeg vil uten smerter i nakken' } },
          { score: 1, text: { en: 'I can read as much as I want with slight pain in my neck', no: 'Jeg kan lese så mye jeg vil med lette smerter i nakken' } },
          { score: 2, text: { en: 'I can read as much as I want with moderate pain in my neck', no: 'Jeg kan lese så mye jeg vil med moderate smerter i nakken' } },
          { score: 3, text: { en: 'I cannot read as much as I want because of moderate pain in my neck', no: 'Jeg kan ikke lese så mye jeg vil på grunn av moderate smerter i nakken' } },
          { score: 4, text: { en: 'I can hardly read at all because of severe pain in my neck', no: 'Jeg kan knapt lese i det hele tatt på grunn av sterke smerter i nakken' } },
          { score: 5, text: { en: 'I cannot read at all', no: 'Jeg kan ikke lese i det hele tatt' } },
        ],
      },
      {
        id: 'headaches',
        title: { en: 'Headaches', no: 'Hodepine' },
        options: [
          { score: 0, text: { en: 'I have no headaches at all', no: 'Jeg har ingen hodepine i det hele tatt' } },
          { score: 1, text: { en: 'I have slight headaches which come infrequently', no: 'Jeg har lett hodepine som kommer sjelden' } },
          { score: 2, text: { en: 'I have moderate headaches which come infrequently', no: 'Jeg har moderat hodepine som kommer sjelden' } },
          { score: 3, text: { en: 'I have moderate headaches which come frequently', no: 'Jeg har moderat hodepine som kommer ofte' } },
          { score: 4, text: { en: 'I have severe headaches which come frequently', no: 'Jeg har sterk hodepine som kommer ofte' } },
          { score: 5, text: { en: 'I have headaches almost all the time', no: 'Jeg har hodepine nesten hele tiden' } },
        ],
      },
      {
        id: 'concentration',
        title: { en: 'Concentration', no: 'Konsentrasjon' },
        options: [
          { score: 0, text: { en: 'I can concentrate fully when I want with no difficulty', no: 'Jeg kan konsentrere meg fullt ut når jeg vil uten vanskeligheter' } },
          { score: 1, text: { en: 'I can concentrate fully when I want with slight difficulty', no: 'Jeg kan konsentrere meg fullt ut når jeg vil med litt vanskeligheter' } },
          { score: 2, text: { en: 'I have a fair degree of difficulty in concentrating when I want', no: 'Jeg har en del vanskeligheter med å konsentrere meg når jeg vil' } },
          { score: 3, text: { en: 'I have a lot of difficulty in concentrating when I want', no: 'Jeg har mye vanskeligheter med å konsentrere meg når jeg vil' } },
          { score: 4, text: { en: 'I have a great deal of difficulty in concentrating when I want', no: 'Jeg har veldig store vanskeligheter med å konsentrere meg når jeg vil' } },
          { score: 5, text: { en: 'I cannot concentrate at all', no: 'Jeg kan ikke konsentrere meg i det hele tatt' } },
        ],
      },
      {
        id: 'work',
        title: { en: 'Work', no: 'Arbeid' },
        options: [
          { score: 0, text: { en: 'I can do as much work as I want', no: 'Jeg kan gjøre så mye arbeid som jeg vil' } },
          { score: 1, text: { en: 'I can only do my usual work, but no more', no: 'Jeg kan bare gjøre mitt vanlige arbeid, men ikke mer' } },
          { score: 2, text: { en: 'I can do most of my usual work, but no more', no: 'Jeg kan gjøre det meste av mitt vanlige arbeid, men ikke mer' } },
          { score: 3, text: { en: 'I cannot do my usual work', no: 'Jeg kan ikke gjøre mitt vanlige arbeid' } },
          { score: 4, text: { en: 'I can hardly do any work at all', no: 'Jeg kan knapt gjøre noe arbeid i det hele tatt' } },
          { score: 5, text: { en: 'I cannot do any work at all', no: 'Jeg kan ikke gjøre noe arbeid i det hele tatt' } },
        ],
      },
      {
        id: 'driving',
        title: { en: 'Driving', no: 'Bilkjøring' },
        options: [
          { score: 0, text: { en: 'I can drive my car without any neck pain', no: 'Jeg kan kjøre bil uten nakkesmerter' } },
          { score: 1, text: { en: 'I can drive my car as long as I want with slight pain in my neck', no: 'Jeg kan kjøre bil så lenge jeg vil med lette smerter i nakken' } },
          { score: 2, text: { en: 'I can drive my car as long as I want with moderate pain in my neck', no: 'Jeg kan kjøre bil så lenge jeg vil med moderate smerter i nakken' } },
          { score: 3, text: { en: 'I cannot drive my car as long as I want because of moderate pain in my neck', no: 'Jeg kan ikke kjøre bil så lenge jeg vil på grunn av moderate smerter i nakken' } },
          { score: 4, text: { en: 'I can hardly drive at all because of severe pain in my neck', no: 'Jeg kan knapt kjøre i det hele tatt på grunn av sterke smerter i nakken' } },
          { score: 5, text: { en: 'I cannot drive my car at all', no: 'Jeg kan ikke kjøre bil i det hele tatt' } },
        ],
      },
      {
        id: 'sleeping',
        title: { en: 'Sleeping', no: 'Søvn' },
        options: [
          { score: 0, text: { en: 'I have no trouble sleeping', no: 'Jeg har ingen problemer med å sove' } },
          { score: 1, text: { en: 'My sleep is slightly disturbed (less than 1 hour sleepless)', no: 'Søvnen min er litt forstyrret (mindre enn 1 time søvnløs)' } },
          { score: 2, text: { en: 'My sleep is mildly disturbed (1-2 hours sleepless)', no: 'Søvnen min er mildt forstyrret (1-2 timer søvnløs)' } },
          { score: 3, text: { en: 'My sleep is moderately disturbed (2-3 hours sleepless)', no: 'Søvnen min er moderat forstyrret (2-3 timer søvnløs)' } },
          { score: 4, text: { en: 'My sleep is greatly disturbed (3-5 hours sleepless)', no: 'Søvnen min er sterkt forstyrret (3-5 timer søvnløs)' } },
          { score: 5, text: { en: 'My sleep is completely disturbed (5-7 hours sleepless)', no: 'Søvnen min er helt forstyrret (5-7 timer søvnløs)' } },
        ],
      },
      {
        id: 'recreation',
        title: { en: 'Recreation', no: 'Fritidsaktiviteter' },
        options: [
          { score: 0, text: { en: 'I am able to engage in all my recreation activities with no neck pain at all', no: 'Jeg kan delta i alle fritidsaktiviteter uten nakkesmerter' } },
          { score: 1, text: { en: 'I am able to engage in all my recreation activities with some pain in my neck', no: 'Jeg kan delta i alle fritidsaktiviteter med noe smerter i nakken' } },
          { score: 2, text: { en: 'I am able to engage in most, but not all of my usual recreation activities because of pain in my neck', no: 'Jeg kan delta i de fleste, men ikke alle fritidsaktiviteter på grunn av smerter i nakken' } },
          { score: 3, text: { en: 'I am able to engage in only a few of my usual recreation activities because of pain in my neck', no: 'Jeg kan bare delta i noen få fritidsaktiviteter på grunn av smerter i nakken' } },
          { score: 4, text: { en: 'I can hardly do any recreation activities because of pain in my neck', no: 'Jeg kan knapt delta i fritidsaktiviteter på grunn av smerter i nakken' } },
          { score: 5, text: { en: 'I cannot do any recreation activities at all', no: 'Jeg kan ikke delta i noen fritidsaktiviteter i det hele tatt' } },
        ],
      },
    ],
    scoring: {
      maxScore: 50,
      interpretation: [
        { min: 0, max: 4, level: 'none', label: { en: 'No Disability', no: 'Ingen funksjonsnedsettelse' }, color: 'green' },
        { min: 5, max: 14, level: 'mild', label: { en: 'Mild Disability', no: 'Mild funksjonsnedsettelse' }, color: 'yellow' },
        { min: 15, max: 24, level: 'moderate', label: { en: 'Moderate Disability', no: 'Moderat funksjonsnedsettelse' }, color: 'orange' },
        { min: 25, max: 34, level: 'severe', label: { en: 'Severe Disability', no: 'Alvorlig funksjonsnedsettelse' }, color: 'red' },
        { min: 35, max: 50, level: 'complete', label: { en: 'Complete Disability', no: 'Fullstendig funksjonsnedsettelse' }, color: 'darkred' },
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
          { score: 0, text: { en: 'I have no pain at the moment', no: 'Jeg har ingen smerter for øyeblikket' } },
          { score: 1, text: { en: 'The pain is very mild at the moment', no: 'Smertene er veldig milde for øyeblikket' } },
          { score: 2, text: { en: 'The pain is moderate at the moment', no: 'Smertene er moderate for øyeblikket' } },
          { score: 3, text: { en: 'The pain is fairly severe at the moment', no: 'Smertene er ganske sterke for øyeblikket' } },
          { score: 4, text: { en: 'The pain is very severe at the moment', no: 'Smertene er veldig sterke for øyeblikket' } },
          { score: 5, text: { en: 'The pain is the worst imaginable at the moment', no: 'Smertene er verst tenkelig for øyeblikket' } },
        ],
      },
      {
        id: 'personal_care',
        title: { en: 'Personal Care', no: 'Personlig stell' },
        options: [
          { score: 0, text: { en: 'I can look after myself normally without causing extra pain', no: 'Jeg kan stelle meg selv normalt uten ekstra smerter' } },
          { score: 1, text: { en: 'I can look after myself normally but it is very painful', no: 'Jeg kan stelle meg selv normalt, men det er veldig smertefullt' } },
          { score: 2, text: { en: 'It is painful to look after myself and I am slow and careful', no: 'Det er smertefullt å stelle meg selv og jeg er treg og forsiktig' } },
          { score: 3, text: { en: 'I need some help but manage most of my personal care', no: 'Jeg trenger litt hjelp, men klarer det meste' } },
          { score: 4, text: { en: 'I need help every day in most aspects of self care', no: 'Jeg trenger hjelp hver dag til det meste' } },
          { score: 5, text: { en: 'I do not get dressed, wash with difficulty and stay in bed', no: 'Jeg kler meg ikke, vasker meg med vanskelighet og ligger i sengen' } },
        ],
      },
      {
        id: 'lifting',
        title: { en: 'Lifting', no: 'Løfting' },
        options: [
          { score: 0, text: { en: 'I can lift heavy weights without extra pain', no: 'Jeg kan løfte tunge ting uten ekstra smerter' } },
          { score: 1, text: { en: 'I can lift heavy weights but it gives extra pain', no: 'Jeg kan løfte tunge ting, men det gir ekstra smerter' } },
          { score: 2, text: { en: 'Pain prevents me from lifting heavy weights off the floor', no: 'Smerter hindrer meg fra å løfte tunge ting fra gulvet' } },
          { score: 3, text: { en: 'Pain prevents me from lifting heavy weights but I can manage light to medium weights', no: 'Smerter hindrer meg fra å løfte tunge ting, men jeg klarer lette til middels tunge' } },
          { score: 4, text: { en: 'I can only lift very light weights', no: 'Jeg kan bare løfte veldig lette ting' } },
          { score: 5, text: { en: 'I cannot lift or carry anything at all', no: 'Jeg kan ikke løfte eller bære noe som helst' } },
        ],
      },
      {
        id: 'walking',
        title: { en: 'Walking', no: 'Gåing' },
        options: [
          { score: 0, text: { en: 'Pain does not prevent me walking any distance', no: 'Smerter hindrer meg ikke fra å gå noen avstand' } },
          { score: 1, text: { en: 'Pain prevents me walking more than 1 mile', no: 'Smerter hindrer meg fra å gå mer enn 1,5 km' } },
          { score: 2, text: { en: 'Pain prevents me walking more than 1/2 mile', no: 'Smerter hindrer meg fra å gå mer enn 800 meter' } },
          { score: 3, text: { en: 'Pain prevents me walking more than 100 yards', no: 'Smerter hindrer meg fra å gå mer enn 100 meter' } },
          { score: 4, text: { en: 'I can only walk using a stick or crutches', no: 'Jeg kan bare gå med stokk eller krykker' } },
          { score: 5, text: { en: 'I am in bed most of the time and have to crawl to the toilet', no: 'Jeg er i sengen det meste av tiden og må krype til toalettet' } },
        ],
      },
      {
        id: 'sitting',
        title: { en: 'Sitting', no: 'Sitting' },
        options: [
          { score: 0, text: { en: 'I can sit in any chair as long as I like', no: 'Jeg kan sitte i hvilken som helst stol så lenge jeg vil' } },
          { score: 1, text: { en: 'I can sit in my favourite chair as long as I like', no: 'Jeg kan sitte i favorittestolen min så lenge jeg vil' } },
          { score: 2, text: { en: 'Pain prevents me from sitting more than 1 hour', no: 'Smerter hindrer meg fra å sitte mer enn 1 time' } },
          { score: 3, text: { en: 'Pain prevents me from sitting more than 1/2 hour', no: 'Smerter hindrer meg fra å sitte mer enn 30 minutter' } },
          { score: 4, text: { en: 'Pain prevents me from sitting more than 10 minutes', no: 'Smerter hindrer meg fra å sitte mer enn 10 minutter' } },
          { score: 5, text: { en: 'Pain prevents me from sitting at all', no: 'Smerter hindrer meg fra å sitte i det hele tatt' } },
        ],
      },
      {
        id: 'standing',
        title: { en: 'Standing', no: 'Ståing' },
        options: [
          { score: 0, text: { en: 'I can stand as long as I want without extra pain', no: 'Jeg kan stå så lenge jeg vil uten ekstra smerter' } },
          { score: 1, text: { en: 'I can stand as long as I want but it gives me extra pain', no: 'Jeg kan stå så lenge jeg vil, men det gir ekstra smerter' } },
          { score: 2, text: { en: 'Pain prevents me from standing for more than 1 hour', no: 'Smerter hindrer meg fra å stå mer enn 1 time' } },
          { score: 3, text: { en: 'Pain prevents me from standing for more than 30 minutes', no: 'Smerter hindrer meg fra å stå mer enn 30 minutter' } },
          { score: 4, text: { en: 'Pain prevents me from standing for more than 10 minutes', no: 'Smerter hindrer meg fra å stå mer enn 10 minutter' } },
          { score: 5, text: { en: 'Pain prevents me from standing at all', no: 'Smerter hindrer meg fra å stå i det hele tatt' } },
        ],
      },
      {
        id: 'sleeping',
        title: { en: 'Sleeping', no: 'Søvn' },
        options: [
          { score: 0, text: { en: 'My sleep is never disturbed by pain', no: 'Søvnen min er aldri forstyrret av smerter' } },
          { score: 1, text: { en: 'My sleep is occasionally disturbed by pain', no: 'Søvnen min er av og til forstyrret av smerter' } },
          { score: 2, text: { en: 'Because of pain I have less than 6 hours sleep', no: 'På grunn av smerter sover jeg mindre enn 6 timer' } },
          { score: 3, text: { en: 'Because of pain I have less than 4 hours sleep', no: 'På grunn av smerter sover jeg mindre enn 4 timer' } },
          { score: 4, text: { en: 'Because of pain I have less than 2 hours sleep', no: 'På grunn av smerter sover jeg mindre enn 2 timer' } },
          { score: 5, text: { en: 'Pain prevents me from sleeping at all', no: 'Smerter hindrer meg fra å sove i det hele tatt' } },
        ],
      },
      {
        id: 'sex_life',
        title: { en: 'Sex Life (if applicable)', no: 'Seksualliv (hvis aktuelt)' },
        options: [
          { score: 0, text: { en: 'My sex life is normal and causes no extra pain', no: 'Seksuallivet mitt er normalt og gir ingen ekstra smerter' } },
          { score: 1, text: { en: 'My sex life is normal but causes some extra pain', no: 'Seksuallivet mitt er normalt, men gir noe ekstra smerter' } },
          { score: 2, text: { en: 'My sex life is nearly normal but is very painful', no: 'Seksuallivet mitt er nesten normalt, men er veldig smertefullt' } },
          { score: 3, text: { en: 'My sex life is severely restricted by pain', no: 'Seksuallivet mitt er sterkt begrenset av smerter' } },
          { score: 4, text: { en: 'My sex life is nearly absent because of pain', no: 'Seksuallivet mitt er nesten fraværende på grunn av smerter' } },
          { score: 5, text: { en: 'Pain prevents any sex life at all', no: 'Smerter hindrer alt seksualliv' } },
        ],
        optional: true,
      },
      {
        id: 'social_life',
        title: { en: 'Social Life', no: 'Sosialt liv' },
        options: [
          { score: 0, text: { en: 'My social life is normal and causes no extra pain', no: 'Det sosiale livet mitt er normalt og gir ingen ekstra smerter' } },
          { score: 1, text: { en: 'My social life is normal but increases the degree of pain', no: 'Det sosiale livet mitt er normalt, men øker smertegraden' } },
          { score: 2, text: { en: 'Pain has no significant effect on my social life apart from limiting my more energetic interests', no: 'Smerter har ingen betydelig effekt på det sosiale livet mitt bortsett fra å begrense mer energiske interesser' } },
          { score: 3, text: { en: 'Pain has restricted my social life and I do not go out as often', no: 'Smerter har begrenset det sosiale livet mitt og jeg går ikke ut så ofte' } },
          { score: 4, text: { en: 'Pain has restricted social life to my home', no: 'Smerter har begrenset det sosiale livet til hjemmet' } },
          { score: 5, text: { en: 'I have no social life because of pain', no: 'Jeg har ikke noe sosialt liv på grunn av smerter' } },
        ],
      },
      {
        id: 'travelling',
        title: { en: 'Travelling', no: 'Reising' },
        options: [
          { score: 0, text: { en: 'I can travel anywhere without pain', no: 'Jeg kan reise hvor som helst uten smerter' } },
          { score: 1, text: { en: 'I can travel anywhere but it gives extra pain', no: 'Jeg kan reise hvor som helst, men det gir ekstra smerter' } },
          { score: 2, text: { en: 'Pain is bad but I manage journeys over 2 hours', no: 'Smertene er ille, men jeg klarer reiser over 2 timer' } },
          { score: 3, text: { en: 'Pain restricts me to journeys of less than 1 hour', no: 'Smerter begrenser meg til reiser under 1 time' } },
          { score: 4, text: { en: 'Pain restricts me to short necessary journeys under 30 minutes', no: 'Smerter begrenser meg til korte nødvendige reiser under 30 minutter' } },
          { score: 5, text: { en: 'Pain prevents me from travelling except to receive treatment', no: 'Smerter hindrer meg fra å reise bortsett fra for behandling' } },
        ],
      },
    ],
    scoring: {
      maxScore: 50,
      interpretation: [
        { min: 0, max: 10, level: 'minimal', label: { en: 'Minimal Disability', no: 'Minimal funksjonsnedsettelse' }, color: 'green' },
        { min: 11, max: 20, level: 'moderate', label: { en: 'Moderate Disability', no: 'Moderat funksjonsnedsettelse' }, color: 'yellow' },
        { min: 21, max: 30, level: 'severe', label: { en: 'Severe Disability', no: 'Alvorlig funksjonsnedsettelse' }, color: 'orange' },
        { min: 31, max: 40, level: 'crippling', label: { en: 'Crippling Disability', no: 'Invalidiserende' }, color: 'red' },
        { min: 41, max: 50, level: 'bedbound', label: { en: 'Bed-bound or Exaggerating', no: 'Sengeliggende' }, color: 'darkred' },
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
        { min: 0, max: 0, level: 'none', label: { en: 'No Pain', no: 'Ingen smerte' }, color: 'green' },
        { min: 1, max: 30, level: 'mild', label: { en: 'Mild Pain', no: 'Mild smerte' }, color: 'yellow' },
        { min: 31, max: 60, level: 'moderate', label: { en: 'Moderate Pain', no: 'Moderat smerte' }, color: 'orange' },
        { min: 61, max: 100, level: 'severe', label: { en: 'Severe Pain', no: 'Sterk smerte' }, color: 'red' },
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
        { min: 0, max: 0, level: 'none', label: { en: 'No Pain', no: 'Ingen smerte' }, color: 'green' },
        { min: 1, max: 3, level: 'mild', label: { en: 'Mild Pain', no: 'Mild smerte' }, color: 'yellow' },
        { min: 4, max: 6, level: 'moderate', label: { en: 'Moderate Pain', no: 'Moderat smerte' }, color: 'orange' },
        { min: 7, max: 10, level: 'severe', label: { en: 'Severe Pain', no: 'Sterk smerte' }, color: 'red' },
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
      { id: 'fabq1', text: { en: 'My pain was caused by physical activity', no: 'Smertene mine ble forårsaket av fysisk aktivitet' }, subscale: null },
      { id: 'fabq2', text: { en: 'Physical activity makes my pain worse', no: 'Fysisk aktivitet gjør smertene mine verre' }, subscale: 'physical' },
      { id: 'fabq3', text: { en: 'Physical activity might harm my back', no: 'Fysisk aktivitet kan skade ryggen min' }, subscale: 'physical' },
      { id: 'fabq4', text: { en: 'I should not do physical activities which might make my pain worse', no: 'Jeg bør ikke gjøre fysiske aktiviteter som kan gjøre smertene mine verre' }, subscale: 'physical' },
      { id: 'fabq5', text: { en: 'I cannot do physical activities which might make my pain worse', no: 'Jeg kan ikke gjøre fysiske aktiviteter som kan gjøre smertene mine verre' }, subscale: 'physical' },
      { id: 'fabq6', text: { en: 'My pain was caused by my work or by an accident at work', no: 'Smertene mine ble forårsaket av arbeidet mitt eller en arbeidsulykke' }, subscale: 'work' },
      { id: 'fabq7', text: { en: 'My work aggravated my pain', no: 'Arbeidet mitt forverret smertene mine' }, subscale: 'work' },
      { id: 'fabq8', text: { en: 'I have a claim for compensation for my pain', no: 'Jeg har krav på erstatning for smertene mine' }, subscale: null },
      { id: 'fabq9', text: { en: 'My work is too heavy for me', no: 'Arbeidet mitt er for tungt for meg' }, subscale: 'work' },
      { id: 'fabq10', text: { en: 'My work makes or would make my pain worse', no: 'Arbeidet mitt gjør eller ville gjøre smertene mine verre' }, subscale: 'work' },
      { id: 'fabq11', text: { en: 'My work might harm my back', no: 'Arbeidet mitt kan skade ryggen min' }, subscale: 'work' },
      { id: 'fabq12', text: { en: 'I should not do my normal work with my present pain', no: 'Jeg bør ikke gjøre mitt vanlige arbeid med mine nåværende smerter' }, subscale: 'work' },
      { id: 'fabq13', text: { en: 'I cannot do my normal work with my present pain', no: 'Jeg kan ikke gjøre mitt vanlige arbeid med mine nåværende smerter' }, subscale: null },
      { id: 'fabq14', text: { en: 'I cannot do my normal work until my pain is treated', no: 'Jeg kan ikke gjøre mitt vanlige arbeid før smertene mine er behandlet' }, subscale: null },
      { id: 'fabq15', text: { en: 'I do not think that I will be back to my normal work within 3 months', no: 'Jeg tror ikke jeg vil være tilbake i normalt arbeid innen 3 måneder' }, subscale: 'work' },
      { id: 'fabq16', text: { en: 'I do not think that I will ever be able to go back to that work', no: 'Jeg tror ikke jeg noen gang vil kunne gå tilbake til det arbeidet' }, subscale: null },
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
          { min: 0, max: 14, level: 'low', label: { en: 'Low Fear-Avoidance', no: 'Lav frykt-unngåelse' }, color: 'green' },
          { min: 15, max: 24, level: 'high', label: { en: 'High Fear-Avoidance', no: 'Høy frykt-unngåelse' }, color: 'red' },
        ],
        work: [
          { min: 0, max: 24, level: 'low', label: { en: 'Low Fear-Avoidance', no: 'Lav frykt-unngåelse' }, color: 'green' },
          { min: 25, max: 42, level: 'high', label: { en: 'High Fear-Avoidance', no: 'Høy frykt-unngåelse' }, color: 'red' },
        ],
      },
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
  if (!questionnaire) return null;

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

  if (answeredSections.length === 0) return null;

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
  const fabq = QUESTIONNAIRES.FABQ;

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
