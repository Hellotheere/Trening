/* Generert fra coach.py – øvelser og måltider. */
var TRENER_DATA = {
 "EXERCISES": {
  "kneboy_kv": {
   "name": "Knebøy",
   "muscle": "bein",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Stå med føttene omtrent i skulderbredde, tærne litt ut. Sett hofta bak og ned som om du skal sette deg på en stol. Brystet opp, hælene i bakken. Reis deg rolig opp.",
   "tips": "Kneene skal følge tærne. Gå så dypt at hofta er omtrent i knehøyde, eller så langt du har kontroll."
  },
  "goblet": {
   "name": "Goblet-knebøy",
   "muscle": "bein",
   "eq": [
    1,
    2
   ],
   "desc": "Hold en manual inntil brystet som et beger. Sett deg ned mellom knærne og reis deg opp.",
   "tips": "Albuene inni knærne nederst hjelper deg å komme dypere med rett rygg."
  },
  "utfall": {
   "name": "Utfall",
   "muscle": "bein",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Ta et steg frem, senk bakre kne mot gulvet og hold overkroppen oppreist. Skyv ifra med fremre hæl og bytt bein.",
   "tips": "Fremre kne skal ikke falle innover. Ta kortere steg hvis du kjenner det i knærne."
  },
  "oppsteg": {
   "name": "Oppsteg",
   "muscle": "bein",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Sett én fot på et solid trinn eller en lav benk. Reis deg opp med det beinet og senk deg kontrollert ned igjen. Bytt bein.",
   "tips": "Unngå å skyve ifra med bakre fot. Hold hofta rett frem."
  },
  "glute_bridge": {
   "name": "Hoftehev",
   "muscle": "sete",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Ligg på ryggen med bøyde knær og føttene i bakken. Press hofta opp til en rett linje fra knær til skuldre, klem setet, og senk rolig ned.",
   "tips": "Ikke svai ryggen hardt øverst. Press gjennom hælene."
  },
  "hip_thrust": {
   "name": "Hip thrust",
   "muscle": "sete",
   "eq": [
    1,
    2
   ],
   "desc": "Øvre rygg mot en benk, manual eller stang over hofta. Press hofta opp til en rett linje og senk ned.",
   "tips": "Haken lett inn. Klem setet øverst uten å oversvai ryggen."
  },
  "rdl": {
   "name": "Rumensk markløft",
   "muscle": "bakside",
   "eq": [
    1,
    2
   ],
   "desc": "Hold vektene foran lårene. Med myke knær skyver du hofta bak og senker overkroppen til du kjenner et strekk bak i lårene. Reis deg ved å strekke hofta.",
   "tips": "Ryggen skal være nøytral hele veien. Tenk at du lukker en bildør med setet."
  },
  "markloft": {
   "name": "Markløft",
   "muscle": "bakside",
   "eq": [
    2
   ],
   "desc": "Stå med stangen inntil leggerne, grep i skulderbredde. Brystet opp, trekk stangen rett opp langs beina og lås hofta øverst. Senk med kontroll.",
   "tips": "Hold stangen tett inntil kroppen. Ikke rykk med ryggen. Som nybegynner: start lett og prioriter teknikk."
  },
  "leg_press": {
   "name": "Beinpress",
   "muscle": "bein",
   "eq": [
    2
   ],
   "desc": "Plasser føttene i skulderbredde på platen. Løsne sikringen, bøy knærne til ca. 90 grader og press opp uten å låse hardt.",
   "tips": "Ikke slipp hofta av setet. Pust ut på vei opp."
  },
  "leg_curl": {
   "name": "Lårcurl",
   "muscle": "bakside",
   "eq": [
    2
   ],
   "desc": "Ligg eller sitt i maskinen og bøy hælene mot setet. Senk rolig tilbake.",
   "tips": "Unngå å smekke vektskivene. Hold hofta i ro."
  },
  "calf": {
   "name": "Tåhev",
   "muscle": "legg",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Stå på et trinn eller på gulvet. Reis deg opp på tærne, hold et sekund, og senk hælen rolig ned.",
   "tips": "Hold deg i noe hvis balansen svikter."
  },
  "wall_sit": {
   "name": "Vegghold (wall sit)",
   "muscle": "bein",
   "eq": [
    0
   ],
   "desc": "Len ryggen mot veggen og gli ned til knærne er ca. 90 grader. Hold tiden ut.",
   "tips": "Tyngden på hælene. Pust rolig – det gjør det lettere enn du tror."
  },
  "armhev": {
   "name": "Armhevinger",
   "muscle": "bryst",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Hender under skuldrene, kroppen som en planke. Senk brystet mot gulvet og press opp. På knærne er helt greit, og ofte lurt i starten.",
   "tips": "Ikke la hofta synke. Hvis det er for tungt: gjør dem mot en benk eller vegg."
  },
  "benk": {
   "name": "Benkpress",
   "muscle": "bryst",
   "eq": [
    2
   ],
   "desc": "Ligg på benken med føttene i gulvet. Senk stangen kontrollert til midt på brystet og press opp.",
   "tips": "Skulderbladene samlet. Ikke spretter stangen på brystet. Be om en spotter når det blir tungt."
  },
  "gulvpress": {
   "name": "Gulvpress med manualer",
   "muscle": "bryst",
   "eq": [
    1
   ],
   "desc": "Ligg på ryggen med knekte knær. Press manualene opp over brystet og senk til overarmene treffer gulvet.",
   "tips": "Hold håndleddene rette. Pause et øyeblikk nederst."
  },
  "skulderpress": {
   "name": "Skulderpress",
   "muscle": "skulder",
   "eq": [
    1,
    2
   ],
   "desc": "Press vektene fra skulderhøyde rett opp til armene er rette, og senk rolig ned igjen. Sitt eller stå med stram midje.",
   "tips": "Ikke svai ryggen. Hvis du står, knip setet lett."
  },
  "pike": {
   "name": "Pike-armhevinger",
   "muscle": "skulder",
   "eq": [
    0
   ],
   "desc": "Stå i en omvendt V med hofta høyt. Bøy albuene og senk hodet mot gulvet, press opp igjen.",
   "tips": "Hold nakken nøytral. Bøy mer i hofta hvis det er for tungt."
  },
  "roing": {
   "name": "Roing",
   "muscle": "rygg",
   "eq": [
    1,
    2
   ],
   "desc": "Len overkroppen litt frem med rett rygg. Trekk vektene inn mot hofta og klem skulderbladene sammen. Senk med kontroll.",
   "tips": "Ikke krum ryggen. Tenk at du putter albuene i baklommene."
  },
  "sittende_roing": {
   "name": "Sittende kabelroing",
   "muscle": "rygg",
   "eq": [
    2
   ],
   "desc": "Sitt med strak rygg, trekk håndtaket mot magen og klem skulderbladene. Strekk rolig frem igjen.",
   "tips": "Unngå å lene deg langt bak. Skuldrene skal ikke trekkes opp mot ørene."
  },
  "nedtrekk": {
   "name": "Nedtrekk",
   "muscle": "rygg",
   "eq": [
    2
   ],
   "desc": "Grip stangen litt utenfor skulderbredde. Trekk den ned til øvre del av brystet og slipp rolig opp.",
   "tips": "Len deg bare litt bak. Trekk albuene ned langs kroppen."
  },
  "omvendt_roing": {
   "name": "Omvendt roing ved bord",
   "muscle": "rygg",
   "eq": [
    0
   ],
   "desc": "Ligg under et stabilt bord, grip kanten og trekk brystet opp mot platen. Senk deg rolig ned. Alternativ: håndkle-roing i en dørkarm.",
   "tips": "Kroppen skal være stiv som en planke. Bøy mer i beina for å gjøre det lettere."
  },
  "face_pull": {
   "name": "Face pull",
   "muscle": "skulder",
   "eq": [
    2
   ],
   "desc": "Trekk tauet mot ansiktet med albuene høyt, og roter slik at hendene ender ved ørene.",
   "tips": "Lett vekt og mye kontroll. Dette er for skulderhelse, ikke for å slå rekorder."
  },
  "lateral": {
   "name": "Sidehev",
   "muscle": "skulder",
   "eq": [
    1,
    2
   ],
   "desc": "Løft armene ut til siden til de er omtrent i skulderhøyde, med en svak bøy i albuen. Senk rolig.",
   "tips": "Ikke sving med kroppen. Tenk at du heller vann ut av en mugge."
  },
  "dips_stol": {
   "name": "Dips mot stol",
   "muscle": "triceps",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Hendene på kanten av en stabil stol, beina strake eller bøyde. Senk deg noen centimeter og press opp.",
   "tips": "Hold skuldrene nede. Gå ikke for dypt hvis det kjennes ustabilt ut foran i skulderen."
  },
  "biceps": {
   "name": "Bicepscurl",
   "muscle": "arm",
   "eq": [
    1,
    2
   ],
   "desc": "Hold vektene langs siden, bøy albuene og løft mot skuldrene. Senk langsomt ned.",
   "tips": "Albuene skal stå i ro. Ikke kipp med overkroppen."
  },
  "triceps": {
   "name": "Tricepspress",
   "muscle": "triceps",
   "eq": [
    1,
    2
   ],
   "desc": "Strekk vekta over hodet eller ned i en kabel til armen er rett, og bøy kontrollert tilbake.",
   "tips": "Hold albuen pekende frem, ikke ut til siden."
  },
  "planke": {
   "name": "Planke",
   "muscle": "kjerne",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Støtt deg på underarmer og tær. Kroppen skal danne en rett linje. Stram mage og sete, pust rolig.",
   "tips": "Ikke la hofta synke eller stikke opp. Avslutt når teknikken svikter, ikke når du skjelver mest."
  },
  "sideplanke": {
   "name": "Sideplanke",
   "muscle": "kjerne",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Liggende på siden, støtt på underarmen. Løft hofta slik at kroppen er en rett linje, hold, og bytt side.",
   "tips": "Skyv gulvet unna med underarmen så skulderen er stabil."
  },
  "dead_bug": {
   "name": "Dead bug",
   "muscle": "kjerne",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Ligg på ryggen med armer og bein mot taket. Senk motsatt arm og bein mot gulvet uten at korsryggen slipper underlaget. Bytt side.",
   "tips": "Bevegelsen skal være sakte. Hvis ryggen svai, gjør kortere utslag."
  },
  "superman": {
   "name": "Superman",
   "muscle": "rygg",
   "eq": [
    0
   ],
   "desc": "Ligg på magen og løft samtidig armer, bryst og bein noen centimeter. Hold to sekunder og senk ned.",
   "tips": "Se ned i gulvet. Løft lavt og kontrollert, ikke sprell."
  },
  "mountain": {
   "name": "Mountain climbers",
   "muscle": "kjerne",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Start i planke og trekk knærne vekselvis inn mot brystet i et jevnt tempo.",
   "tips": "Hold hofta i ro. Senk tempoet hvis du mister formen."
  },
  "burpee": {
   "name": "Burpees",
   "muscle": "helkropp",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Sett hendene i gulvet, hopp beina bak til planke, eventuelt en armheving, hopp beina frem og reis deg. Hoppet øverst er valgfritt.",
   "tips": "Som nybegynner: dropp hoppet og armhevingen. Kvalitet foran fart."
  },
  "jumping_jacks": {
   "name": "Jumping jacks",
   "muscle": "kondisjon",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Hopp føttene ut og løft armene til siden, hopp sammen igjen. Rolig og jevnt.",
   "tips": "Land mykt. Steg ut til siden uten hopp hvis leddene protesterer."
  },
  "gattur": {
   "name": "Gåtur",
   "muscle": "kondisjon",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Gå i et tempo der du blir varm, men fortsatt kan snakke. I Kragerø er en runde langs brygga, opp mot fjellene eller over til en holme perfekt når været tillater det.",
   "tips": "Gode sko, gjerne litt motbakke. Ta med vindjakke – kysten skifter fort."
  },
  "intervall_gang": {
   "name": "Gangintervaller",
   "muscle": "kondisjon",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Veksle mellom 2 minutter rolig gange og 1 minutt rask gange eller lett jogg. Gjenta til tiden er brukt opp.",
   "tips": "Den raske delen skal være anstrengende, ikke helt i kjelleren."
  },
  "jogg": {
   "name": "Jogg / lett løping",
   "muscle": "kondisjon",
   "eq": [
    0,
    1,
    2
   ],
   "desc": "Løp rolig i et tempo der du kan si korte setninger. Ta gåpauser når du trenger det.",
   "tips": "Korte steg, land under kroppen. Øk bare noen minutter om gangen fra uke til uke."
  },
  "sykkel": {
   "name": "Sykkel eller romaskin",
   "muscle": "kondisjon",
   "eq": [
    2
   ],
   "desc": "Hold jevn kadens i den roligere delen, og øk motstand eller fart i intervallene.",
   "tips": "Sett setet slik at kneet er nesten strakt nederst. Rolige skuldre."
  },
  "farmers": {
   "name": "Kassebæring",
   "muscle": "helkropp",
   "eq": [
    1,
    2
   ],
   "desc": "Løft to tunge gjenstander (manualer, handleposer eller kanner) og gå med rette skuldre og stram midje.",
   "tips": "Ikke len deg til siden. Sett ned vektene rolig når grepet gir etter."
  },
  "maskin_brystpress": {
   "name": "Brystpress i maskin",
   "muscle": "bryst",
   "eq": [
    2
   ],
   "desc": "Juster setet slik at håndtakene er midt på brystet. Press ut til armene er nesten strake, og senk kontrollert tilbake uten å la vektene slå i stabelen.",
   "tips": "Hold skulderbladene samlet mot puten. Pust ut på vei frem. Ikke lås albuene hardt."
  },
  "incline_manualpress": {
   "name": "Skråbenk med manualer",
   "muscle": "bryst",
   "eq": [
    1,
    2
   ],
   "desc": "Sett benken i cirka 30–45 grader. Press manualene opp over øvre del av brystet og senk dem rolig til overarmene er omtrent parallelle med gulvet.",
   "tips": "Føttene i bakken, lett svai er greit. Ikke slå sammen vektene øverst – stopp når armene er rette."
  },
  "pec_fly_maskin": {
   "name": "Pec fly i maskin",
   "muscle": "bryst",
   "eq": [
    2
   ],
   "desc": "Sitt med ryggen inntil puten og underarmene på putene eller hendene på håndtakene. Før armene sammen foran brystet som en klem, og slipp rolig tilbake.",
   "tips": "Tenk at du klemmer en ball mellom albuene. Unngå å trekke med skuldrene eller å gå for langt bak."
  },
  "incline_biceps": {
   "name": "Skrå bicepscurl med manualer",
   "muscle": "arm",
   "eq": [
    1,
    2
   ],
   "desc": "Sitt på en skråbenk med armene hengende rett ned. Bøy albuene og løft manualene opp, og senk langsomt til armene er nesten strake.",
   "tips": "Hold overarmene i ro. Den skrå vinkelen gjør det vanskeligere å jukse – det er poenget."
  },
  "preacher_curl": {
   "name": "Preacher curl",
   "muscle": "arm",
   "eq": [
    1,
    2
   ],
   "desc": "Legg overarmene på preacher-puten, grep stangen eller manualene og bøy albuene. Senk vekta rolig til armene er nesten rette, og løft opp igjen.",
   "tips": "Ikke smekk i bunnen. Stopp like før albuene låses, og hold rumpa i setet."
  },
  "triceps_pushdown": {
   "name": "Triceps pushdown",
   "muscle": "triceps",
   "eq": [
    2
   ],
   "desc": "Stå med albuene inntil siden foran en kabel. Press stangen eller tauet ned til armene er rette, klem triceps nederst, og slipp kontrollert opp igjen.",
   "tips": "Du kan bruke rett stang eller tau. Stang tåler typisk mer vekt; tau gir ofte en bedre klem nederst når du trekker endene litt fra hverandre. Hold albuene i ro."
  },
  "reverse_pec_fly": {
   "name": "Omvendt pec fly",
   "muscle": "skulder",
   "eq": [
    1,
    2
   ],
   "desc": "I maskin: sitt vendt mot puten og før armene bakover i en vid bue, slik at du klemmer de bakre skuldrene. Med manualer: len overkroppen frem og løft armene ut til siden med myke albuer.",
   "tips": "Lett vekt og rolig tempo. Dette er for bakre skulder, ikke for å svinge med ryggen. Tenk at du er en fugl som åpner vingene."
  },
  "front_raise": {
   "name": "Fronthev med manualer",
   "muscle": "skulder",
   "eq": [
    1,
    2
   ],
   "desc": "Stå med manualene foran lårene. Løft dem rett opp foran kroppen til omtrent skulderhøyde, og senk rolig ned igjen. Én arm om gangen eller begge samtidig.",
   "tips": "Løft med skuldrene, ikke med et rykk i ryggen. Stopp i skulderhøyde – du trenger ikke å løfte over hodet."
  }
 },
 "MEALS": [
  {
   "id": "havre",
   "slot": "frokost",
   "name": "Havregryn med melk og bær",
   "desc": "1 dl havregryn kokt på melk, en neve bær og en teskje honning.",
   "kcal": 420,
   "protein": 18,
   "tags": [
    "animal",
    "gluten",
    "laktose"
   ]
  },
  {
   "id": "havre_vann",
   "slot": "frokost",
   "name": "Havregryn med havredrikk og bær",
   "desc": "1 dl havregryn kokt på havredrikk, bær og en skje peanøttsmør.",
   "kcal": 430,
   "protein": 14,
   "tags": [
    "gluten",
    "nøtter"
   ]
  },
  {
   "id": "havre_fri",
   "slot": "frokost",
   "name": "Bokhvetegrøt med bær",
   "desc": "Bokhvetegrøt kokt på vann eller havredrikk, med bær og en skje solsikkefrø.",
   "kcal": 400,
   "protein": 13,
   "tags": []
  },
  {
   "id": "brod_egg",
   "slot": "frokost",
   "name": "Grove brødskiver med egg og tomat",
   "desc": "To grove skiver med eggerøre eller kokt egg, tomat og agurk.",
   "kcal": 420,
   "protein": 22,
   "tags": [
    "animal",
    "egg",
    "gluten"
   ]
  },
  {
   "id": "kvarg_banan",
   "slot": "frokost",
   "name": "Kvarg med banan",
   "desc": "2 dl kvarg eller cottage cheese, en banan og litt kanel.",
   "kcal": 320,
   "protein": 28,
   "tags": [
    "animal",
    "laktose"
   ]
  },
  {
   "id": "soya_bær",
   "slot": "frokost",
   "name": "Soyayoghurt med bær og frø",
   "desc": "Soyayoghurt, bær og en skje gresskarkjerner. Et knekkebrød uten gluten ved siden av hvis du vil.",
   "kcal": 340,
   "protein": 16,
   "tags": []
  },
  {
   "id": "smoothie",
   "slot": "frokost",
   "name": "Smoothie med havre og bær",
   "desc": "Melk eller havredrikk, banan, frosne bær og 2 ss havre.",
   "kcal": 380,
   "protein": 16,
   "tags": [
    "gluten"
   ]
  },
  {
   "id": "knekke_makrell",
   "slot": "lunsj",
   "name": "Knekkebrød med makrell i tomat",
   "desc": "Tre grove knekkebrød med makrell i tomat og paprika. En gulrot ved siden av.",
   "kcal": 450,
   "protein": 26,
   "tags": [
    "animal",
    "fisk",
    "gluten"
   ]
  },
  {
   "id": "kylling_ris",
   "slot": "lunsj",
   "name": "Kylling, ris og brokkoli",
   "desc": "En kyllingfilet, 1 dl tørr ris og en porsjon dampet brokkoli. Litt olje og sitron.",
   "kcal": 550,
   "protein": 42,
   "tags": [
    "animal",
    "kjøtt"
   ]
  },
  {
   "id": "brod_ost",
   "slot": "lunsj",
   "name": "Grove brødskiver med ost og kalkun",
   "desc": "To skiver med hvitost eller brunost, kalkunpålegg, paprika og agurk. Et eple til.",
   "kcal": 480,
   "protein": 24,
   "tags": [
    "animal",
    "gluten",
    "kjøtt",
    "laktose"
   ]
  },
  {
   "id": "fiskekaker",
   "slot": "lunsj",
   "name": "Fiskekaker med potet og gulrot",
   "desc": "Fiskekaker, kokte poteter, gulrøtter og en skje tyttebær.",
   "kcal": 520,
   "protein": 28,
   "tags": [
    "animal",
    "fisk"
   ]
  },
  {
   "id": "bonnebolle",
   "slot": "lunsj",
   "name": "Bønnebolle med ris og grønnsaker",
   "desc": "Kikerter eller svarte bønner, ris, mais, agurk, tomat og guacamole eller olivenolje.",
   "kcal": 540,
   "protein": 22,
   "tags": []
  },
  {
   "id": "lefse_kylling",
   "slot": "lunsj",
   "name": "Lefse eller wrap med kylling",
   "desc": "En lefse eller tortilla med kylling, salat, agurk og rømme eller hummus.",
   "kcal": 500,
   "protein": 32,
   "tags": [
    "animal",
    "gluten",
    "kjøtt"
   ]
  },
  {
   "id": "potetsalat_bønner",
   "slot": "lunsj",
   "name": "Potet og kikerter med salat",
   "desc": "Kokte poteter, kikerter, agurk, tomat og en god olje- og sitrondressing.",
   "kcal": 500,
   "protein": 18,
   "tags": []
  },
  {
   "id": "laks_potet",
   "slot": "middag",
   "name": "Laks med poteter og brokkoli",
   "desc": "En laksefilet i ovn, kokte poteter og brokkoli eller aspargesbønner. Sitron over.",
   "kcal": 620,
   "protein": 40,
   "tags": [
    "animal",
    "fisk"
   ]
  },
  {
   "id": "kylling_ovn",
   "slot": "middag",
   "name": "Ovnsbakt kylling med søtpotet",
   "desc": "Kyllinglår eller filet, søtpotetbåter og en stor salat med olje og eddik.",
   "kcal": 640,
   "protein": 45,
   "tags": [
    "animal",
    "kjøtt"
   ]
  },
  {
   "id": "torsk",
   "slot": "middag",
   "name": "Torsk med gulrot og potet",
   "desc": "Torskefilet, kokte poteter og gulrøtter. En klype dill og litt olje.",
   "kcal": 560,
   "protein": 38,
   "tags": [
    "animal",
    "fisk"
   ]
  },
  {
   "id": "kjottdeig",
   "slot": "middag",
   "name": "Kjøttdeiggryte med pasta",
   "desc": "Kjøttdeig av storfe, løk, tomat og paprika servert med fullkornspasta.",
   "kcal": 680,
   "protein": 40,
   "tags": [
    "animal",
    "gluten",
    "kjøtt"
   ]
  },
  {
   "id": "bonnegryte",
   "slot": "middag",
   "name": "Linse- og grønnsaksgryte",
   "desc": "Røde linser, tomat, gulrot, løk og krydder. Serveres med ris eller potet.",
   "kcal": 600,
   "protein": 26,
   "tags": []
  },
  {
   "id": "fiskegrateng",
   "slot": "middag",
   "name": "Fiskegrateng med grønnsaker",
   "desc": "Fiskegrateng og en stor porsjon ert og gulrot.",
   "kcal": 650,
   "protein": 36,
   "tags": [
    "animal",
    "fisk",
    "gluten",
    "laktose"
   ]
  },
  {
   "id": "byggryn_kylling",
   "slot": "middag",
   "name": "Byggryn med kylling og rotgrønnsaker",
   "desc": "Byggryn kokt i buljong, kyllingbiter, gulrot og kålrot. Enkel og mettende hverdagsmiddag.",
   "kcal": 630,
   "protein": 40,
   "tags": [
    "animal",
    "gluten",
    "kjøtt"
   ]
  },
  {
   "id": "tofu_wok",
   "slot": "middag",
   "name": "Tofu-wok med ris",
   "desc": "Tofu, paprika, løk, brokkoli og soyasaus, servert med ris.",
   "kcal": 580,
   "protein": 28,
   "tags": []
  },
  {
   "id": "kvarg_snack",
   "slot": "kvelds",
   "name": "Kvarg med bær",
   "desc": "2 dl kvarg og en neve bær. Enkelt, billig og mye protein.",
   "kcal": 200,
   "protein": 24,
   "tags": [
    "animal",
    "laktose"
   ]
  },
  {
   "id": "eple_mandel",
   "slot": "kvelds",
   "name": "Eple og en neve mandler",
   "desc": "Ett eple og rundt 15 mandler eller en liten neve usaltede nøtter.",
   "kcal": 230,
   "protein": 6,
   "tags": [
    "nøtter"
   ]
  },
  {
   "id": "knekke_kalkun",
   "slot": "kvelds",
   "name": "Knekkebrød med kalkun",
   "desc": "To knekkebrød med kalkunpålegg og agurk.",
   "kcal": 180,
   "protein": 12,
   "tags": [
    "animal",
    "gluten",
    "kjøtt"
   ]
  },
  {
   "id": "gulrot_hummus",
   "slot": "kvelds",
   "name": "Gulrot og hummus",
   "desc": "Et par gulrøtter og 3 ss hummus. Godt som kvelds eller før økten.",
   "kcal": 190,
   "protein": 6,
   "tags": []
  },
  {
   "id": "soya_kveld",
   "slot": "kvelds",
   "name": "Soyayoghurt med banan",
   "desc": "En beger soyayoghurt og en halv banan.",
   "kcal": 210,
   "protein": 9,
   "tags": []
  },
  {
   "id": "kesam",
   "slot": "kvelds",
   "name": "Kesam med honning",
   "desc": "2 dl kesam, en teskje honning og kanel.",
   "kcal": 190,
   "protein": 22,
   "tags": [
    "animal",
    "laktose"
   ]
  }
 ],
 "SAFETY": "Dette er ikke medisinsk rådgivning. Planen er laget for friske voksne. Snakk med lege før du starter hvis du er skadet, gravid, har sykdom eller er usikker."
};
if (typeof globalThis !== 'undefined') globalThis.TRENER_DATA = TRENER_DATA;
