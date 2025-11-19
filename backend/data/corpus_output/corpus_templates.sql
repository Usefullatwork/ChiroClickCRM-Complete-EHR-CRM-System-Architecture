-- Clinical Templates from Corpus Analysis
-- Auto-generated from Norwegian clinical notes
-- 2025-11-19T02:44:27.296Z

-- Template 1: Palpasjon - Funn
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Palpasjon',
  'Funn',
  'Palpasjonseksempel',
  'palpasjon av v trapz, interscapulær mm trigger kjent smerte i v ux. Også anspent i rotatorcuff infraspinatus og noe i nakke.',
  'NO',
  'objective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 2: Cervical - Behandling
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Cervical',
  'Behandling',
  'Behandlingseksempel',
  'V interscapulær mm bvm, slipper bra. Bilat trapz ims, Pasienten samtykker til nålebehandling. Området som skal penetreres med nål desinfeseres nøye før teknikken utføres. V lats bvm, slipper bra. V lats ims, Pasienten samtykker til nålebehandling. Området som skal penetreres med nål desinfeseres nøye før teknikken utføres. V trapz bvm, slipper bra. T6 hvla, slipper bra. T4 hvla, slipper bra. Ser fredag og neste fredag.',
  'NO',
  'plan',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 3: Korsrygg - Undersøkelse
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Korsrygg',
  'Undersøkelse',
  'Lumbal eksempel fra praksis',
  'Kemp: ua. Slump: ua. Reflekser ux: ua. Sensibilitet ux: ua. Palpasjon: palpasjonsøm høyre ekstensor antebrachi, biceps brachi, h ant delt, h trapz, h interscapulær mm, h ql og h sete.',
  'NO',
  'objective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 4: Palpasjon - Funn
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Palpasjon',
  'Funn',
  'Palpasjonseksempel',
  'palpasjonsøm høyre ekstensor antebrachi, biceps brachi, h ant delt, h trapz, h interscapulær mm, h ql og h sete.',
  'NO',
  'objective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 5: Thoracal - Behandling
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Thoracal',
  'Behandling',
  'Behandlingseksempel',
  'V paraspinal lumbal mm bvm, slipper bra. V paraspinal thoracal mm bvm, slipper bra. V nedre trapz bvm, slipper bra. T10 lett hvla, slipper bra. L2 v hvla, lett trykk, slipper bra. Viser jeffersons curl og sidebøy med samme prinsipp. Ser om en uke.',
  'NO',
  'plan',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 6: Palpasjon - Funn
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Palpasjon',
  'Funn',
  'Palpasjonseksempel',
  'palpasjon av ryggstrekkerne av øvre lumbal og nedre thorax trigger kjent smerte, også svært hyperton i nedre trapz.',
  'NO',
  'objective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 7: Palpasjon - Funn
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Palpasjon',
  'Funn',
  'Palpasjonseksempel',
  'palpasjon av h trapz og lev sca trigger kjent smerte han har hatt de siste dagene. Er også hyperton interscapulært og noe leddrestriksjon thoracalt fra TL overgang og opp til h 1 ribbe.

Behandling (05.01.2024): H trapz ims, Pasienten samtykker til nålebehandling. Området som skal penetreres med nål desinfeseres nøye før teknikken utføres. H lev sca bvm, slipper bra. Bilat interscapulær mm bvm, slipper bra. H infraspintus bvm, slipper bra. H 1 ribbe hvla, slipper bra. T4 hvla, slipper bra. T6 h hvla, slipper bra. L1 h hvla, slipper bra. T1 h hvla, slipper bra. T2 v hvla, slipper bra. C7 h hvla, slipper bra. Snakker om styrketrening og at han må ha fokus på retraksjon og depresjon av skulderen og aktive skulderblader under trekk og nedtrekk øvelser. Booker selv over helgen ved behov, reiser tilbake til Trondheim i midten av neste uke.',
  'NO',
  'objective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 8: Cervical - Behandling
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Cervical',
  'Behandling',
  'Behandlingseksempel',
  'Cervical traksjon, god effekt, ror muskler noe. H trapz inhib og lett bvm, slipper bra. Bilat paraspinal cervical mm bvm, slipper bra. C2 v gapping, slipper bra. C3 h lett hvla, slipper bra. T5 hvla, slipper bra. T11 hvla, slipper bra. Snakker med mor på tlf i morgen og onsdag, mulig oppfølging onsdag.',
  'NO',
  'plan',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 9: Cervical - Anamnese
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Cervical',
  'Anamnese',
  'Anamnese eksempel',
  'Kommer akutt idag på anbefaling fra turntrener og hjelpetrener da hun har akutt kink i nakken. Det startet på fredag med vondt i ryggen interscapulært. Søndag var hun på trening, slår hjul og gjør mye der hun jobber med utstrakte hender. Kjente noe under et hopp i nakken, men var ikke umiddelbart vondt. Når hun våknet idag var hun veldig vond. Hun har hodet i avvergestilling mot høyre og klarer ikke løfte armen over hodet. Merker selv hun er hoven på høyre side i nakken. Klarer nesten ikke rotere eller sidebøye. Måtte avbryte turntrening istad pga dette. Har ikke hatt dette tidligere. Ingen strålende smerter, prikking eller parestesier i ox.',
  'NO',
  'subjective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 10: Palpasjon - Funn
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Palpasjon',
  'Funn',
  'Palpasjonseksempel',
  'svært palpasjonsøm høyre trapz, og øm i resten av nakken totalt sett. Tydelig i spasme.',
  'NO',
  'objective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 11: Generelt - Anamnese
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Generelt',
  'Anamnese',
  'Anamnese eksempel',
  'Kommer i klinikk idag for kostveiledning for irritabel tarm, er henvist fra kvinnehelsesenter. Plager med magen, løs avføring og øm mage etter måltider. Prøvd lowfoodmap diet uten suksess. Usikker varighet, men siden mai, forverret siste mnd. Ofte magesmerter, vanskelig å lokalisere. Reagerer på melkeprodukter og olivenolje (diare/øm mage). Har mye kramper og vondt i magen. Lite matlyst, ofte kvalm. Gjærbakst og alkohol er triggere. Forverring før reise til Tanzania i fjor (var forstoppet der i 3 mnd, brukte laksoral/mikrolaks). Nå løs avføring. Tidligere plager fra tenårene (også vaginisme). Mye stress i hverdagen (jobb/studier), som påvirker magen. Spiser lite frokost/lunsj, mye middag. Diare ofte etter middag. Analyse av kostdagbok:

Fettmalabsorpsjon? (olivenolje).

Meieriprodukter kuttet, men spiser brunost.

Stress, angst, søvnfaktorer?',
  'NO',
  'subjective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 12: Cervical - Behandling
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Cervical',
  'Behandling',
  'Behandlingseksempel',
  'Hadde ganske vondt etter behandlingen i et par dager etter sist, men etter det ble hun veldig mye bedre. Sitter også en del nederst i korsryggen. Bilat trapz bvm, slipper bra. Bilat pec minor inhib, slipper bra. Bilat sternocleido tgp, slipper bra. Bilat paraspinal cervical mm bvm, slipper bra. Bilat suboccipital mm bvm, slipper bra. Diskuterer strategier for trening, tester trening med Andreas. Anbefaler 10 klipp før avgjørelse om fast. Ser om en uke.

Dato: 01.02.2024
Behandling: Litt øm etter sist, synes hun har blitt litt lettere i nakke og skuldre. Ved fleksjonsøvelser har hun kjent noe ut i skulderen. Bilat trapz bvm, slipper bra. Bilat pec minor inhib, slipper bra. Bilat sternocleido tgp, slipper bra. Bilat paraspinal cervical mm bvm, slipper bra. Bilat suboccipital mm bvm, slipper bra. Ser om en uke.

Dato: 18.01.2024',
  'NO',
  'plan',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 13: Palpasjon - Funn
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Palpasjon',
  'Funn',
  'Palpasjonseksempel',
  'hun er svært hyperton og palpasjonsøm interscapulært trapz, lat og paraspinal cx, samt sub oc mm. Sternocleido mm svært ømt.

Konklusjon (11.01.2024): Dette er en tydelig psykosomatisk case der det er forespeilet ukentlig oppfølging over tid, og det er helt avhengig av oppfølging fra henne selv. Både med styrkeøvelser og intervaller. Blir enige om at hun skal gjøre noe hver dag. Hun skal også starte hos Psykolog, anbefaler Morten MN. Ser ukentlig fremover. På sikt muligens trene med fysio.

Anamnese (11.01.2024): Hun oppsøker i dag klinikken på grunn av angst og stress, som hun har slitt med av og på gjennom livet. Disse plagene har forverret seg under pandemien. Hun føler at stresset påvirker nakken og skuldrene, og beskriver en anspent følelse som trekker seg opp i trapeziusmusklene. To uker etter mottak av første vaksinedose opplevde hun en forverring, og ble "helt rar" i hele kroppen. Hun tror selv at vaksinen kan ha vært en utløsende faktor. Tilstanden har bedret seg noe, og hun er nå i stand til å gå i en butikk. Det er ingen rapporter om strålende smerter, prikking eller parestesier i overekstremitetene (ox). Hun har ikke vært hos en psykolog og har heller ikke vurdert det. Hun nevner ikke at hun har trent, men vi snakker om "fire ganger fire" som en god mulighet da hun lufter hunden daglig. Pasienten tar Escitalopram 10 mg, men ingen andre medisiner.

Behandling (11.01.2024): Snakker om helhetlig behandling, både med osteopati, psykolog og øvelser. Hun ønsker først å teste øvelser med meg. Jeg viser skulderretraksjon og hoderetraksjon, hun har store problemer med å få til dette. Bilat trapz bvm, slipper bra. Bilat pec minor inhib, slipper bra. Bilat sternocleido tgp, slipper bra. Bilat paraspinal cervical mm bvm, slipper bra. Bilat suboccipital mm bvm, slipper bra. Anbefaler myworkoutgo.',
  'NO',
  'objective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 14: Cervical - Behandling
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Cervical',
  'Behandling',
  'Behandlingseksempel',
  'Status quo, kanskje en liten bedring, men mye det samme. H ant delt bvm, ganske ømt, slipper bra. H pec minor tgp, veldig vondt, spesielt inn mot proc. coracoideus - slipper ok. H trapz bvm, slipper bra. H supraspinatus bvm, slipper bra. H coracobrachialis bvm og ims, trigger sterke og kjente smerter. Setter inn til Arne for øvelser.

Behandling (02.02.2024): Fortsatt vondt i skulderen, spesielt når hun skal flytte dyna f.eks. i ytterstilling, kan kjenne som om skulderen skal litt ut av ledd. Hjelper om hun trykker litt inn på fremsiden på smerten mens hun gjør bevegelsen. Vi snakker om instabilitet i skulderen. Ber henne teste in og utrot med strikk i tillegg til flies og arnoldpress. Behandling utført (bvm, tgp, inhib, hvla C4/C5). Ser om en uke.

Behandling (15.01.2024): Øm etter sist, følte jeg traff noe. Mild hp etter sist. H ant delt bvm, ganske ømt, slipper bra. H pec minor tgp, veldig vondt (proc. coracoideus). H trapz bvm, slipper bra. H supraspinatus bvm, slipper bra. H inhib i fossa supraclavicularis. H paraspinal cervical mm bvm. Bilat suboccipital mm bvm. H temporalis bvm. H C4 hvla. V C5 hvla. Trener på gym hjemme og ønsker øvelser som er litt "kule". Viser pec flies og arnoldpress, anbefaler å starte med 2 kg og fokusere på teknikk og øke gradvis.',
  'NO',
  'plan',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 15: Generelt - Anamnese
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Generelt',
  'Anamnese',
  'Anamnese eksempel',
  'Kommer for veiledning rundt ernæring og idrett. Aktiv TKD utøver, landslaget, skal til EM i Polen (april). Påmeldt i -55 kg, veier nå 49,5 kg. Trener sparring 1 gang/uke, styrke 4 ganger/uke. Samlinger/leire kan ha opp til 3 økter om dagen. Kostholdsanalyse: Spiser lite til frokost (yoghurt/frokostblanding). Lunsj: Brød/frukt. Middag: Vanlig sunn middag (fisk/kjøtt/pasta). Kvelds: Restemat/egg.',
  'NO',
  'subjective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 16: Cervical - Behandling
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Cervical',
  'Behandling',
  'Behandlingseksempel',
  'bvm og hvla.

Behandling (11.03.2024): Øresusen er litt bedre. Hodet kjennes fortsatt ut som om hun er ør i perioder. Kjent lite spenninger nå, kun i CT overgangen. Behandling: Bilat paraspinal cervical mm bvm, suboccipital mm bvm, temporalis bvm, ptergyideus med intern bvm, masseter bvm. Hvla: C3 v, C2 h, T1 h, T2 h.

Behandling (26.02.2024): Øresusen er bedre. Synes det er vanskelig å finne balansen mellom hvile og jobb. Var litt svimmel igår igjen. Behandling som over.',
  'NO',
  'plan',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 17: Palpasjon - Funn
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Palpasjon',
  'Funn',
  'Palpasjonseksempel',
  'svært hypertone og vond i adduktorene.

Anamnese (02.02.2024): Oppsøker klinikken pga smerter i hoftene (ca halvt år). Kommer ofte etter fotball/dans. Særlig i lyskene når hun går, noen ganger utsiden av hoftene. Etter fotballtrening kan hun gå saktere pga smerte (stramt skrå oppover mot lyskene). Kneppelyder fra hoftene. Trener 4 dager i uken.',
  'NO',
  'objective',
  false,
  0
) ON CONFLICT DO NOTHING;

-- Template 18: Cervical - Behandling
INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  'Cervical',
  'Behandling',
  'Behandlingseksempel',
  'Bilat solar plexus inhib, trapz ims, lateral cervical mm ims, sub oc ims, masseter ims.',
  'NO',
  'plan',
  false,
  0
) ON CONFLICT DO NOTHING;
