"use strict";
/*
  BIBLIOTEKA ĆWICZEŃ (wybierana swobodnie na ekranie Trening).

  Każde ćwiczenie ma: grupę główną i dodatkowe (pole g, pierwsza to główna), sprzęt (eq),
  podpowiedź techniczną (cue), domyślne serie i zakres powtórzeń (ustawia typ "kind").
  Typy (kind):
    C = duże ćwiczenie wielostawowe, 3 × 6–10, przerwa 2 min
    M = ćwiczenie wielostawowe, 3 × 8–12, przerwa 90 s
    I = izolacja, 3 × 10–15, przerwa 60 s
    L = lekka izolacja, 3 × 12–20, przerwa 60 s
    B = z masą ciała, 3 × 8–15 (w polu kg wpisujesz dodatkowy ciężar, 0 = sama masa ciała)
    T = na czas, 2 × 20–40 s
    H = rozciąganie lub mobilność na czas, 2 × 30–60 s
    N = mobilność w powtórzeniach, bez ciężaru, 2 × 6–10
    K = cardio na maszynie, jedna seria = czas w minutach, bez ciężaru
  Zakres powtórzeń to propozycja startowa, nie przepis. Zmienisz go, wpisując własne wartości przy serii.
  Ćwiczenia z planu A/B (plan.js) mają tu tylko metadane (META), ich parametry zostają w plan.js.
  Własne ćwiczenia dodajesz w aplikacji (Trening, Dodaj ćwiczenie, Dodaj własne ćwiczenie).
*/
const GROUPS=[
  {id:"chest",name:"Klatka"},{id:"back",name:"Plecy"},{id:"shoulders",name:"Barki"},
  {id:"biceps",name:"Biceps"},{id:"triceps",name:"Triceps"},
  {id:"quads",name:"Czworogłowe"},{id:"hams",name:"Tył uda"},{id:"glutes",name:"Pośladki"},{id:"adductors",name:"Przywodziciele"},{id:"calves",name:"Łydki"},
  {id:"core",name:"Brzuch i core"},{id:"mobility",name:"Mobilność"},{id:"cardio",name:"Cardio"}
];
const EQUIP=[
  {id:"bw",name:"Masa ciała"},{id:"db",name:"Hantle"},{id:"bb",name:"Sztanga"},
  {id:"ma",name:"Maszyna"},{id:"ca",name:"Wyciąg"},{id:"ot",name:"Inne"}
];
const GMAP={},EMAP={};
GROUPS.forEach(g=>GMAP[g.id]=g);EQUIP.forEach(e=>EMAP[e.id]=e);

const KIND={
  C:{sets:3,lo:6,hi:10,rest:120},
  M:{sets:3,lo:8,hi:12,rest:90},
  I:{sets:3,lo:10,hi:15,rest:60},
  L:{sets:3,lo:12,hi:20,rest:60},
  B:{sets:3,lo:8,hi:15,rest:75,bw:true},
  T:{sets:2,lo:20,hi:40,rest:45,unit:"sec"},
  H:{sets:2,lo:30,hi:60,rest:20,unit:"sec"},
  N:{sets:2,lo:6,hi:10,rest:20,nw:true},
  K:{sets:1,lo:10,hi:30,rest:0,unit:"min",nw:true}
};

/* metadane ćwiczeń z planu A/B: [grupy, sprzęt, aliasy do wyszukiwania] */
const META={
  squat:["quads,glutes","db","goblet squat przysiad"],
  legpress:["quads,glutes","ma","leg press suwnica"],
  hacksquat:["quads,glutes","ma","hack squat"],
  smithsquat:["quads,glutes","ma","smith"],
  dbsquat:["quads,glutes","db","przysiad z hantlami"],
  incline:["chest,shoulders,triceps","db","incline dumbbell press skos"],
  incmachine:["chest,shoulders,triceps","ma","incline machine"],
  smithinc:["chest,shoulders,triceps","ma","smith skos"],
  neutralinc:["chest,shoulders,triceps","db","chwyt neutralny"],
  flatdb:["chest,triceps,shoulders","db","dumbbell bench press plaska lawka"],
  csrow:["back,biceps","db","chest supported row wioslowanie"],
  csmachine:["back,biceps","ma","chest supported row wioslowanie"],
  csmachinewide:["back,shoulders","ma","wioslowanie szeroki chwyt"],
  tbarcs:["back,biceps","ma","t-bar row"],
  pullup:["back,biceps","bw","pull up podciaganie drazek"],
  chinup:["back,biceps","bw","chin up podchwyt"],
  neutralpull:["back,biceps","bw","podciaganie neutralne"],
  assistpull:["back,biceps","ma","asysta podciaganie"],
  bandpull:["back,biceps","ot","guma podciaganie"],
  latwide:["back,biceps","ca","lat pulldown sciaganie drazka"],
  dips:["triceps,chest","bw","dip poreczy"],
  dipmachine:["triceps,chest","ma","dip maszyna"],
  dipassist:["triceps,chest","ma","dip asysta"],
  closepush:["triceps,chest","bw","pompki waskie"],
  cossack:["quads,glutes,adductors,mobility","bw","cossack squat kozacki"],
  cossacksupport:["quads,glutes,adductors,mobility","bw","kozacki z podparciem"],
  latlunge:["quads,glutes,adductors,mobility","bw","wykrok boczny lateral lunge"],
  sumogoblet:["quads,glutes,adductors,mobility","db","sumo squat"],
  facepull:["shoulders,back","ca","face pull"],
  revpec:["shoulders,back","ma","reverse fly odwrotne rozpietki"],
  revdb:["shoulders,back","db","reverse fly odwrotne rozpietki"],
  bandapart:["shoulders,back","ot","guma pull apart"],
  pallof:["core","ca","pallof press"],
  pallofkneel:["core","ca","pallof klek"],
  pallofhold:["core","ca","pallof przytrzymanie"],
  deadbug:["core","bw","dead bug martwy robak"],
  birddog:["core,back","bw","bird dog"],
  rdl:["hams,glutes,back","db","romanian deadlift rumunski martwy ciag"],
  rdlbb:["hams,glutes,back","bb","romanian deadlift rumunski martwy ciag"],
  hyper45:["back,glutes,hams","ma","hyperextension wyprosty lawka rzymska"],
  legcurl:["hams","ma","leg curl uginanie nog lezac"],
  slrdl:["hams,glutes","db","single leg rdl jednonoz"],
  ohp:["shoulders,triceps","db","overhead press wyciskanie nad glowe"],
  ohpseated:["shoulders,triceps","db","overhead press siedzac"],
  ohpmachine:["shoulders,triceps","ma","shoulder press maszyna"],
  landmine:["shoulders,chest,triceps","bb","landmine press"],
  pulldown:["back,biceps","ca","lat pulldown sciaganie drazka"],
  pdwide:["back,biceps","ca","lat pulldown szeroki"],
  pdunder:["back,biceps","ca","lat pulldown podchwyt"],
  pd1arm:["back,biceps","ca","lat pulldown jednorecz"],
  straightarm:["back","ca","straight arm pulldown"],
  split:["quads,glutes","db","bulgarian split squat"],
  revlunge:["quads,glutes","db","reverse lunge wykrok w tyl"],
  stepup:["quads,glutes","db","step up wejscia"],
  walklunge:["quads,glutes","db","walking lunge"],
  smithsplit:["quads,glutes","ma","bulgarian smith"],
  pushup:["chest,triceps,shoulders","bw","push up pompki"],
  inclinepush:["chest,triceps,shoulders","bw","pompki na podwyzszeniu"],
  chestpress:["chest,triceps,shoulders","ma","chest press maszyna"],
  dbrow:["back,biceps","db","one arm row wioslowanie"],
  dbrowinc:["back,biceps","db","one arm row lawka skosna"],
  rowmachine1:["back,biceps","ma","wioslowanie maszyna jednorecz"],
  invrow:["back,biceps","bw","inverted row australijskie"],
  lateral:["shoulders","db","lateral raise wznosy bokiem"],
  cablelat:["shoulders","ca","lateral raise wyciag"],
  machinelat:["shoulders","ma","lateral raise maszyna"],
  lyinglat:["shoulders","db","lateral raise lezac bokiem"],
  sideplank:["core","bw","side plank"],
  sideplankknee:["core","bw","side plank kolana"],
  sideplanklift:["core,glutes","bw","side plank unoszenie nogi"],
  copenhagen:["core,adductors","bw","copenhagen plank przywodziciele"]
};

/* nowe ćwiczenia: X(id, nazwa, grupy, sprzęt, typ, podpowiedź, aliasy, nadpisania) */
const LIB=[];
const X=(id,name,g,eq,kind,cue,alias,o)=>LIB.push({id:id,name:name,g:g.split(","),eq:eq,kind:kind,cue:cue,alias:alias||"",o:o||{}});

/* ---- KLATKA ---- */
X("bbbench","Wyciskanie sztangi na ławce płaskiej","chest,triceps,shoulders","bb","C","Łopatki ściągnięte, stopy mocno na podłodze, sztanga schodzi do dolnej części klatki, łokcie ok. 45–70° od tułowia. Przy ciężkich seriach użyj asekuracji lub stojaków z bezpiecznikami.","bench press wyciskanie lezac");
X("bbincline","Wyciskanie sztangi na ławce skośnej","chest,shoulders,triceps","bb","C","Ławka ok. 30°, sztanga schodzi do górnej części klatki, łopatki ściągnięte, łokcie ok. 45–70° od tułowia.","incline bench press skos");
X("smithflat","Wyciskanie na suwnicy Smitha na ławce płaskiej","chest,triceps,shoulders","ma","M","Ustaw ławkę tak, by sztanga schodziła do dolnej części klatki, łopatki ściągnięte, stopy stabilnie na podłodze.","smith bench");
X("dbflyflat","Rozpiętki z hantlami na ławce płaskiej","chest","db","I","Łokcie lekko ugięte i stałe, opuszczaj hantle łukiem do wyraźnego rozciągnięcia klatki, nie schodź poniżej linii barków.","fly rozpietki");
X("dbflyinc","Rozpiętki z hantlami na ławce skośnej","chest,shoulders","db","I","Ławka ok. 30°, łokcie lekko ugięte, ruch łukiem, hantle schodzą się nad górną częścią klatki.","incline fly rozpietki");
X("pecdeck","Rozpiętki na maszynie (pec deck)","chest","ma","I","Łopatki na oparciu, łokcie na wysokości barków, zbliżaj ramiona przed klatką i kontroluj powrót.","butterfly peck deck");
X("cablefly","Rozpiętki na wyciągach (brama)","chest","ca","I","Lekki wykrok dla stabilności, łokcie lekko ugięte, ręce schodzą się przed klatką, kontroluj powrót.","cable crossover bramka");
X("lowcablefly","Rozpiętki na wyciągach od dołu do góry","chest,shoulders","ca","I","Linki od dołu, unoś ręce łukiem do wysokości górnej części klatki, łokcie lekko ugięte.","low to high cable fly");
X("floorpress","Wyciskanie hantli leżąc na podłodze","chest,triceps","db","M","Łokcie dotykają podłogi na dole ruchu, co ogranicza zakres w barkach, łopatki ściągnięte.","floor press");
X("pushupfeet","Pompki z nogami na podwyższeniu","chest,shoulders,triceps","bw","B","Stopy na ławce, ciało w jednej linii, klatka do podłogi, łokcie ok. 45° od tułowia.","decline pushup pompki");
X("dbpullover","Pullover z hantlą","chest,back","db","I","Hantla oburącz, prowadź ją łukiem za głowę z lekko ugiętymi łokciami, bez wyginania lędźwi.","pullover");

/* ---- PLECY ---- */
X("bbrow","Wiosłowanie sztangą w opadzie tułowia","back,biceps","bb","C","Tułów ok. 45°, plecy neutralne, sztanga do pępka, łopatki ściągnięte. Mocno obciąża lędźwia, przy bólach pleców wybierz wiosłowanie z podparciem klatki.","barbell row wioslowanie");
X("cablerow","Wiosłowanie na wyciągu siedząc","back,biceps","ca","M","Tułów stabilny, ciągnij uchwyt do brzucha, łopatki ściągnięte na końcu, bez bujania tułowiem.","seated row wioslowanie");
X("cablerow1","Wiosłowanie jednorącz na wyciągu","back,biceps","ca","M","Tułów stabilny, ciągnij łokieć do tyłu, łopatka ściągnięta na końcu ruchu.","one arm cable row wioslowanie",{side:true});
X("deadlift","Martwy ciąg ze sztangą","back,glutes,hams","bb","C","Sztanga nad środkiem stopy, plecy neutralne, napnij brzuch, wypchnij podłogę nogami i prostuj biodra, sztanga blisko nóg. Zacznij od lekkich ciężarów.","deadlift",{lo:5,hi:8});
X("trapbar","Martwy ciąg z gryfem trap bar","back,quads,glutes","bb","C","Stań w środku gryfu, uchwyty neutralne, plecy neutralne, wypchnij podłogę nogami i prostuj biodra.","hex bar trap bar deadlift",{lo:5,hi:8});
X("sumodl","Martwy ciąg sumo","glutes,quads,back","bb","C","Szeroki rozstaw stóp, palce na zewnątrz, plecy neutralne, wypchnij podłogę nogami, sztanga blisko ciała.","sumo deadlift",{lo:5,hi:8});
X("goodmorning","Good morning ze sztangą","hams,glutes,back","bb","M","Sztanga na plecach, biodra do tyłu, kolana lekko ugięte, plecy neutralne. Mocno obciąża lędźwia, zacznij od bardzo lekkiego ciężaru.","dzien dobry");
X("shrug","Wzruszanie barkami z hantlami","back,shoulders","db","I","Unoś barki prosto w górę, bez rotacji, pauza 1 s na górze, spokojnie w dół.","szrugsy kaptury trapez shrugs");
X("scapulapull","Podciąganie łopatek w zwisie","back","bw","B","Zwis na drążku, ramiona proste, opuść i zbliż łopatki, unosząc ciało o kilka centymetrów.","scapular pull",{lo:6,hi:12});
X("hang","Zwis na drążku","back,mobility","bw","T","Chwyt na szerokość barków, ciało rozluźnione, spokojny oddech. Ćwiczy chwyt i otwiera barki.","dead hang",{lo:20,hi:45});
X("superman","Superman (unoszenie rąk i nóg leżąc przodem)","back,glutes","bw","B","Leżysz przodem, unoś ramiona i nogi lekko nad podłogę, pauza 2 s, bez przeprostu lędźwi.","superman",{lo:8,hi:12});
X("kbswing","Swing z kettlebell","glutes,hams,back","ot","M","Ruch z bioder, nie z przysiadu, ramiona tylko prowadzą kettlebell, na górze pośladki napięte, plecy neutralne.","kettlebell swing",{lo:10,hi:20});

/* ---- BARKI ---- */
X("bbohp","Wyciskanie sztangi nad głowę stojąc","shoulders,triceps","bb","C","Pośladki i brzuch napięte, sztanga startuje na obojczykach, wyciskaj prosto nad głowę, bez wyginania lędźwi.","ohp military press zolnierskie");
X("arnold","Wyciskanie Arnolda","shoulders,triceps","db","M","Start z hantlami przed twarzą, dłonie do siebie, rotuj dłonie na zewnątrz podczas wyciskania, brzuch napięty.","arnold press");
X("frontraise","Wznosy hantli w przód","shoulders","db","L","Łokcie lekko ugięte, unoś hantle do linii barków, bez bujania tułowiem.","front raise");
X("reardelt","Odwodzenie ramion w tył z hantlami w opadzie","shoulders,back","db","L","Tułów w opadzie, łokcie lekko ugięte, unoś hantle na boki do linii tułowia, bez bujania.","reverse fly tylny akton");
X("cablerear","Odwodzenie ramion w tył na wyciągach (krzyżowanie linek)","shoulders,back","ca","L","Linki krzyżowo, łokcie lekko ugięte, odwodź ramiona w tył do linii tułowia.","reverse cable fly tylny akton");
X("extrot","Rotacja zewnętrzna barku na wyciągu","shoulders","ca","L","Łokieć przy tułowiu zgięty do 90°, obracaj przedramię na zewnątrz, mały zakres, powoli.","rotator cuff external rotation",{side:true,lo:12,hi:20});
X("yraise","Unoszenie ramion w Y na ławce skośnej","shoulders,back","db","L","Leżysz przodem na ławce skośnej, ramiona w kształcie litery Y, unoś kciuki do sufitu z lekkim ciężarem.","y raise",{lo:10,hi:15});

/* ---- BICEPS ---- */
X("dbcurl","Uginanie ramion z hantlami stojąc","biceps","db","I","Łokcie przy tułowiu, bez bujania, pełne wyprostowanie na dole, 2–3 s w dół.","curl bicepsy");
X("hammer","Uginanie młotkowe z hantlami","biceps","db","I","Chwyt neutralny (kciuki w górę), łokcie przy tułowiu, bez bujania.","hammer curl mlotki");
X("inclinecurl","Uginanie ramion z hantlami na ławce skośnej","biceps","db","I","Ławka ok. 45–60°, ramiona zwisają za linią tułowia, co mocniej rozciąga długą głowę bicepsa.","incline curl");
X("ezcurl","Uginanie ramion ze sztangą łamaną","biceps","bb","I","Chwyt na szerokość barków, łokcie przy tułowiu, bez odchylania tułowia.","ez curl");
X("cablecurl","Uginanie ramion na wyciągu dolnym","biceps","ca","I","Łokcie przy tułowiu, stałe napięcie na całym zakresie, bez bujania.","cable curl");
X("preacher","Uginanie ramion na modlitewniku","biceps","ma","I","Ramiona oparte na poduszce, pełny zakres, nie odrywaj ramion od poduszki.","preacher curl");

/* ---- TRICEPS ---- */
X("pushdown","Prostowanie ramion na wyciągu górnym (triceps)","triceps","ca","I","Łokcie przy tułowiu, pełny wyprost, kontrolowany powrót, bez bujania tułowiem.","pushdown triceps");
X("ohtri","Prostowanie ramion nad głową na wyciągu","triceps","ca","I","Łokcie blisko głowy, pełne rozciągnięcie za głową, wyprost bez ruszania ramionami. Wersja nad głową mocno angażuje długą głowę tricepsa.","overhead triceps extension");
X("skull","Wyciskanie francuskie leżąc","triceps","bb","I","Łokcie nieruchome, sztanga łamana opada do czoła lub za głowę, pełny wyprost.","skullcrusher french press");
X("dbohtri","Prostowanie ramion z hantlą nad głową","triceps","db","I","Jedna hantla oburącz, łokcie blisko głowy, opuszczaj za głowę do rozciągnięcia, pełny wyprost.","french extension");
X("closebench","Wyciskanie sztangi wąskim chwytem","triceps,chest","bb","M","Chwyt na szerokość barków, łokcie blisko tułowia, sztanga do dolnej części klatki.","close grip bench press");
X("kickback","Prostowanie ramienia w opadzie (kickback)","triceps","db","L","Łokieć przy tułowiu i nieruchomy, prostuj przedramię do pełnego wyprostu.","kickback triceps",{side:true});
X("benchdip","Dipy tyłem na ławce","triceps,shoulders","bw","B","Dłonie na ławce za plecami, łokcie do tyłu, schodź tylko tak, by barki były komfortowe. Przy bólu barku wybierz inne ćwiczenie.","bench dip");
X("diamond","Pompki diamentowe","triceps,chest","bw","B","Dłonie blisko siebie pod klatką, łokcie przy tułowiu, ciało w jednej linii.","diamond pushup pompki",{lo:6,hi:12});

/* ---- CZWOROGŁOWE ---- */
X("backsquat","Przysiad ze sztangą na plecach","quads,glutes","bb","C","Sztanga na górnej części pleców, stopy na szerokość barków lub szerzej, kolana w kierunku palców, zejdź w komfortową głębokość z neutralnym kręgosłupem.","back squat przysiad");
X("frontsquat","Przysiad ze sztangą z przodu","quads,glutes","bb","C","Sztanga na przednich barkach, łokcie wysoko, tułów wyprostowany, pełne zejście.","front squat przysiad");
X("legext","Prostowanie nóg na maszynie","quads","ma","I","Plecy na oparciu, pełny wyprost, 2–3 s w dół.","leg extension");
X("splitsq","Wykrok w miejscu z hantlami (split squat)","quads,glutes","db","M","Stopy w rozkroku przód–tył, opuszczaj biodra pionowo w dół, przednia stopa stabilnie na podłodze.","split squat",{side:true});
X("boxpistol","Przysiad na jednej nodze do ławki","quads,glutes","bw","B","Usiądź na ławce na jednej nodze i wstań, druga noga wyprostowana przed ciałem. Wysokość ławki dobierz do siły.","pistol squat",{side:true,lo:5,hi:10});
X("bwsquat","Przysiad z masą ciała","quads,glutes","bw","B","Pełne zejście, pięty na podłodze, ręce przed sobą, kolana w kierunku palców.","air squat przysiad",{lo:10,hi:20});

/* ---- TYŁ UDA ---- */
X("seatedcurl","Uginanie nóg siedząc na maszynie","hams","ma","I","Plecy na oparciu, pełny zakres, 2–3 s w dół, uda dociśnięte do siedziska.","seated leg curl");
X("nordic","Nordic curl (opadanie tułowia z zablokowanymi stopami)","hams","bw","B","Stopy zablokowane, biodra proste, opadaj tułowiem jak najwolniej, ręce asekurują lądowanie. Zacznij od kilku powtórzeń.","nordic hamstring curl",{lo:3,hi:8});
X("slidecurl","Uginanie nóg na ślizgach lub ręczniku","hams,glutes","bw","B","Leżysz na plecach, biodra w górze, ślizgaj stopy od siebie i do siebie, nie opuszczając bioder.","slider leg curl",{lo:6,hi:12});

/* ---- POŚLADKI ---- */
X("hipthrust","Hip thrust ze sztangą","glutes,hams","bb","M","Łopatki na ławce, stopy pod kolanami, na górze miednica lekko podwinięta, żebra w dół, bez wyginania lędźwi.","hip thrust unoszenie bioder");
X("hipthrustdb","Hip thrust z hantlą","glutes,hams","db","M","Hantla na biodrach, łopatki na ławce, na górze pełny wyprost bioder i miednica lekko podwinięta.","hip thrust unoszenie bioder");
X("glutebridge","Mostek biodrowy (glute bridge)","glutes,hams","bw","B","Leżysz na plecach, stopy blisko pośladków, unoś biodra, pauza 1–2 s na górze.","mostek glute bridge",{lo:10,hi:20});
X("slbridge","Mostek biodrowy na jednej nodze","glutes,hams","bw","B","Jedna stopa na podłodze, druga noga prosta, unoś biodra bez opadania miednicy na bok.","single leg glute bridge",{side:true,lo:8,hi:15});
X("cablekick","Odwodzenie nogi w tył na wyciągu","glutes","ca","I","Mankiet na kostce, lekko pochylony tułów, wypychaj nogę w tył siłą pośladka, bez wyginania lędźwi.","glute kickback",{side:true});
X("abductionm","Odwodzenie nóg na maszynie siedząc","glutes","ma","L","Plecy na oparciu, odwodź uda na zewnątrz, kontroluj powrót.","abduction maszyna");
X("cablehipabd","Odwodzenie nogi w bok na wyciągu","glutes","ca","L","Stań bokiem do wyciągu, odwodź nogę w bok bez przechylania tułowia.","hip abduction",{side:true});
X("sidelegraise","Odwodzenie nogi w leżeniu bokiem","glutes","bw","B","Leżysz bokiem, unoś górną nogę lekko w tył, bez obracania miednicy. Możesz dodać gumę.","side lying leg raise",{side:true,lo:10,hi:20});

/* ---- ŁYDKI ---- */
X("standcalf","Wspięcia na palce stojąc (maszyna lub Smith)","calves","ma","I","Pełne rozciągnięcie na dole, 1–2 s pauzy na górze, bez odbijania.","calf raise lydki");
X("seatedcalf","Wspięcia na palce siedząc","calves","ma","I","Kolana zgięte do ok. 90°, pełny zakres, pauza na górze i na dole.","seated calf raise lydki");
X("presscalf","Wspięcia na palce na suwnicy","calves","ma","I","Stopy nisko na platformie, nogi proste (bez blokowania kolan), pełny zakres.","leg press calf raise lydki");
X("dbcalf","Wspięcia na palce na jednej nodze z hantlą","calves","db","I","Palce na podwyższeniu, pełne rozciągnięcie na dole, jedna ręka dla równowagi.","single leg calf raise lydki",{side:true});
X("tibraise","Unoszenie palców stóp (przedni piszczelowy)","calves","bw","B","Plecy i pięty przy ścianie, unoś palce do góry, pauza 1 s.","tibialis raise piszczel",{lo:12,hi:25});

/* ---- BRZUCH I CORE ---- */
X("plank","Deska (plank)","core","bw","T","Łokcie pod barkami, ciało w jednej linii, miednica lekko podwinięta, oddychaj spokojnie.","plank");
X("hollow","Hollow hold","core","bw","T","Lędźwia przy podłodze, ręce i nogi nisko nad podłogą. Gdy lędźwia się odrywają, zegnij kolana.","hollow body",{lo:15,hi:40});
X("hangleg","Unoszenie nóg w zwisie","core","bw","B","Zwis na drążku, unoś nogi bez bujania, na górze podwiń miednicę.","hanging leg raise",{lo:6,hi:12});
X("hangknee","Unoszenie kolan w zwisie","core","bw","B","Zwis na drążku, unoś kolana do klatki, podwijając miednicę, bez bujania.","hanging knee raise",{lo:8,hi:15});
X("cablecrunch","Brzuszki na wyciągu górnym (w klęku)","core","ca","I","Klęk, linka przy głowie, zwijaj tułów, podwijając miednicę, nie ciągnij ramionami.","cable crunch");
X("abwheel","Kółko do brzucha (ab wheel)","core","ot","B","Miednica podwinięta, żebra w dół, jedź tak daleko, jak pozwala kontrola, bez zapadania lędźwi.","ab roller kolko",{lo:5,hi:10});
X("russian","Skręty tułowia z ciężarem (russian twist)","core","ot","I","Tułów odchylony, plecy proste, obracaj klatkę piersiową razem z rękami.","russian twist",{lo:12,hi:20});
X("woodchop","Przenoszenie linki po przekątnej (wood chop)","core,shoulders","ca","I","Obrót tułowia z bioder i klatki, ręce prowadzą linkę po przekątnej, miednica stabilna.","wood chop",{side:true});
X("crunch","Brzuszki","core","bw","B","Żebra do miednicy, ruch z brzucha, szyja neutralna.","crunch",{lo:10,hi:20});
X("revcrunch","Zwijanie miednicy w leżeniu (reverse crunch)","core","bw","B","Leżysz na plecach, kolana zgięte, unoś miednicę ruchem z brzucha, bez bujania nogami.","reverse crunch",{lo:8,hi:15});

/* ---- MOBILNOŚĆ ---- */
X("hips9090","Przejścia 90/90 (hip switches)","mobility,glutes","bw","N","Siedzisz z obiema nogami zgiętymi do 90°, przenoś kolana na drugą stronę, tułów wyprostowany.","90/90 biodra hip switch",{lo:6,hi:10});
X("hold9090","Siad 90/90 (przytrzymanie)","mobility,glutes","bw","H","Obie nogi zgięte do 90°, plecy wyprostowane, pochyl się nad przednią nogą, bez bólu w kolanach.","90/90 stretch biodra",{side:true});
X("hipflexor","Rozciąganie zginaczy bioder w klęku","mobility,quads","bw","H","Klęk podparty, miednica podwinięta, pośladek tylnej nogi napięty, przesuń biodro do przodu, aż poczujesz rozciąganie z przodu biodra.","hip flexor stretch zginacze",{side:true});
X("couch","Rozciąganie czworogłowego przy ścianie (couch stretch)","mobility,quads","bw","H","Tylne kolano przy ścianie, stopa na ścianie lub ławce, miednica podwinięta. Zacznij łagodnie, to mocne rozciąganie.","couch stretch",{side:true});
X("deepsquat","Głęboki przysiad (przytrzymanie)","mobility,quads,glutes","bw","H","Pięty na podłodze (podłóż klin, jeśli się odrywają), łokcie dociskają kolana na zewnątrz, plecy wyprostowane, spokojny oddech.","deep squat hold przysiad biodra");
X("wgs","World's greatest stretch","mobility,glutes,hams","bw","N","Głęboki wykrok, dłoń przy podłodze, rotuj tułów i unieś ramię do sufitu, potem prostuj tylną nogę.","najlepsze rozciaganie wykrok",{side:true,lo:4,hi:8});
X("catcow","Kot-wielbłąd","mobility,back","bw","N","W podporze klęku na zmianę zaokrąglaj i wyginaj kręgosłup w komfortowym zakresie, w rytmie oddechu.","cat cow kot wielblad",{lo:8,hi:12});
X("openbook","Rotacje klatki piersiowej w leżeniu bokiem (open book)","mobility,back","bw","N","Leżysz bokiem, kolana zgięte, otwieraj górną rękę za siebie, wzrok za ręką, biodra nieruchome.","thoracic rotation open book",{side:true,lo:6,hi:10});
X("pigeon","Rozciąganie pośladków w pozycji gołębia","mobility,glutes","bw","H","Przednia noga zgięta przed ciałem, tułów pochylony, tylna noga wyciągnięta. Schodź tylko tak, by nie czuć bólu w kolanie.","pigeon pose golab",{side:true});
X("lizard","Wykrok jaszczurki (lizard lunge)","mobility,glutes","bw","H","Głęboki wykrok, obie dłonie po wewnętrznej stronie przedniej stopy, biodra nisko, tylna noga prosta lub na kolanie.","lizard lunge",{side:true});
X("adductrock","Kołysanie w rozkroku na kolanach","mobility,adductors","bw","N","Klęk podparty, jedna noga wyprostowana w bok, kołysz biodra do tyłu, plecy proste.","adductor rock przywodziciele",{side:true,lo:8,hi:12});
X("frog","Żaba (rozciąganie przywodzicieli)","mobility,adductors","bw","H","Klęk w szerokim rozkroku, biodra do tyłu, ręce lub łokcie na podłodze, kolana wygodnie, plecy proste.","frog stretch przywodziciele zaba");
X("anklemob","Mobilizacja stawu skokowego (kolano do ściany)","mobility","bw","N","Stopa kilka centymetrów od ściany, pięta na podłodze, dosuwaj kolano do ściany.","ankle dorsiflexion kostka",{side:true,lo:8,hi:12});
X("hipcars","Kółka biodrem (CARs)","mobility","bw","N","Stojąc przy podparciu, unieś kolano, otwórz je na zewnątrz i wracaj dużym, powolnym kołem, bez ruchu miednicą.","hip cars krazenia biodra",{side:true,lo:3,hi:5});
X("shoulderpass","Okrążenia ramion z kijem lub gumą","mobility,shoulders","ot","N","Szeroki chwyt, ramiona proste, przenoś kij nad głową za plecy tak daleko, jak pozwala komfort.","shoulder dislocates",{lo:8,hi:12});
X("thoracicroll","Mobilizacja klatki piersiowej na rolce","mobility,back","ot","H","Rolka pod łopatkami, ręce za głową, odchylaj się nad rolką, przesuwaj się co kilka oddechów, bez wyginania lędźwi.","foam roller piersiowy",{lo:30,hi:60});
X("hamstretch","Rozciąganie tyłu uda w leżeniu (z pasem lub gumą)","mobility,hams","ot","H","Leżysz na plecach, pas na stopie, noga prosta do góry, druga noga na podłodze, bez zaokrąglania lędźwi.","hamstring stretch tyl uda",{side:true});


/* ---- MASZYNY, SUWNICE SMITHA, WYCIĄGI, CARDIO (nazwy angielskie w tabeli EN poniżej) ---- */
X("declinepressm","Wyciskanie na maszynie skośnej w dół","chest,triceps","ma","M","Ustaw siedzisko tak, by uchwyty były na wysokości dolnej części klatki, łopatki oparte, wyciskaj bez blokowania łokci.","decline chest press");
X("isochest","Wyciskanie na maszynie z niezależnymi ramionami (iso-lateral)","chest,triceps,shoulders","ma","M","Uchwyty na wysokości środka klatki, każde ramię pracuje osobno, więc wyrównujesz różnice między stronami. Łopatki oparte.","hammer strength iso lateral chest press");
X("highrowm","Wiosłowanie na maszynie z góry (high row)","back,shoulders","ma","M","Klatka oparta, uchwyty wysoko, ciągnij łokcie w dół i do tyłu, łopatki ściągnięte na końcu.","high row machine");
X("lowrowm","Wiosłowanie na maszynie z dołu (low row)","back,biceps","ma","M","Klatka oparta o poduszkę, ciągnij łokcie do tyłu wzdłuż tułowia, ściągnij łopatki, wracaj powoli.","low row machine");
X("isorow","Wiosłowanie na maszynie z niezależnymi ramionami (iso-lateral row)","back,biceps","ma","M","Klatka oparta, każde ramię pracuje osobno, ciągnij łokieć do tyłu, łopatki ściągnięte.","hammer strength iso lateral row");
X("latmachine","Ściąganie na maszynie (lat pulldown machine)","back,biceps","ma","M","Siedzisko z blokadą ud, ciągnij uchwyty w dół do górnej części klatki, łokcie w dół i do tyłu.","lat pulldown maszyna");
X("pulloverm","Pullover na maszynie","back,chest","ma","I","Łokcie na poduszkach, ciągnij ramiona łukiem w dół do tułowia, bez wyginania lędźwi.","pullover machine");
X("backextm","Wyprosty tułowia na maszynie (back extension)","back,glutes","ma","I","Plecy oparte, poruszaj się w komfortowym zakresie bez przeprostu. Przy bólu lędźwi zacznij od lekkiego ciężaru albo wybierz inne ćwiczenie.","lumbar extension machine prostowniki",{lo:10,hi:15});
X("shrugm","Wzruszanie barkami na maszynie","back,shoulders","ma","I","Unoś barki prosto w górę, pauza 1 s na górze, bez rotacji.","shrug machine kaptury trapez");
X("revhypm","Odwrócone wyprosty na maszynie (reverse hyper)","glutes,hams,back","ma","I","Brzuch na podkładce, unoś nogi do linii tułowia, bez bujania i bez przeprostu lędźwi.","reverse hyperextension");
X("ghd","Wspięcia na maszynie GHD (glute-ham raise)","hams,glutes","ma","B","Stopy zablokowane, zginaj kolana i unoś tułów, ruch kontrolowany. Zacznij od kilku powtórzeń.","glute ham developer",{lo:5,hi:10});
X("isoshoulder","Wyciskanie nad głowę na maszynie z niezależnymi ramionami","shoulders,triceps","ma","M","Plecy na oparciu, uchwyty na wysokości barków, wyciskaj w górę bez blokowania łokci.","iso lateral shoulder press hammer");
X("smithohp","Wyciskanie nad głowę na suwnicy Smitha","shoulders,triceps","ma","M","Ławka z oparciem, sztanga startuje na wysokości brody, wyciskaj prosto w górę, brzuch napięty.","smith shoulder press");
X("bicepsm","Uginanie ramion na maszynie","biceps","ma","I","Ramiona oparte na poduszce, pełny zakres, nie odrywaj ramion od poduszki.","biceps curl machine");
X("tricepsm","Prostowanie ramion na maszynie","triceps","ma","I","Łokcie nieruchome, pełny wyprost, kontrolowany powrót.","triceps extension machine");
X("legpresshoriz","Wypychanie na suwnicy poziomej (seated leg press)","quads,glutes","ma","M","Plecy i miednica oparte, stopy na szerokość barków, nie blokuj kolan na górze.","horizontal leg press",{rest:120});
X("singlelegpress","Wypychanie na suwnicy jedną nogą","quads,glutes","ma","M","Jedna stopa na platformie, miednica oparta, kontroluj zejście, nie blokuj kolana.","single leg press",{side:true});
X("pendulum","Przysiad wahadłowy (pendulum squat)","quads,glutes","ma","M","Plecy oparte, schodź głęboko w komfortowym zakresie, kolana w kierunku palców.","pendulum squat machine",{rest:120});
X("vsquat","Przysiad na maszynie V-squat","quads,glutes","ma","M","Plecy oparte, stopy lekko przed ciałem, pełne zejście bez odrywania miednicy.","v squat machine",{rest:120});
X("beltsquat","Przysiad z pasem (belt squat)","quads,glutes","ma","M","Obciążenie zawieszone na biodrach, tułów wyprostowany. Kręgosłup nie dźwiga obciążenia osiowo.","belt squat machine",{rest:120});
X("standcurl","Uginanie nogi stojąc na maszynie","hams","ma","I","Biodra stabilne, zginaj nogę w kolanie, wracaj powoli, bez bujania.","standing leg curl",{side:true});
X("hipadductm","Przywodzenie nóg na maszynie (hip adduction)","adductors","ma","L","Plecy oparte, zbliżaj uda do siebie powoli, bez szarpania, zakres dobierz do komfortu.","adduction machine inner thigh przywodziciele");
X("glutekickm","Odwodzenie nogi w tył na maszynie (glute kickback)","glutes","ma","I","Klatka oparta, wypychaj nogę w tył siłą pośladka, bez wyginania lędźwi.","glute kickback machine",{side:true});
X("hipthrustm","Hip thrust na maszynie (glute drive)","glutes,hams","ma","M","Plecy na oparciu, pas na biodrach, na górze miednica lekko podwinięta, żebra w dół.","hip thrust machine glute drive");
X("donkeycalf","Wspięcia na palce w pochyleniu (donkey calf raise)","calves","ma","I","Pełne rozciągnięcie na dole, pauza 1–2 s na górze, bez odbijania.","donkey calf raise lydki");
X("smithrow","Wiosłowanie na suwnicy Smitha","back,biceps","ma","M","Tułów ok. 45°, plecy neutralne, sztanga do pępka, łopatki ściągnięte. Obciąża lędźwia, przy bólach wybierz wiosłowanie z podparciem klatki.","smith row");
X("smithhip","Hip thrust na suwnicy Smitha","glutes,hams","ma","M","Łopatki na ławce, stopy pod kolanami, na górze miednica lekko podwinięta, bez wyginania lędźwi.","smith hip thrust");
X("smithlunge","Wykroki na suwnicy Smitha","quads,glutes","ma","M","Krok do przodu lub w tył względem sztangi, tułów wyprostowany, kolano przednie stabilne.","smith lunge",{side:true});
X("smithrdl","Rumuński martwy ciąg na suwnicy Smitha","hams,glutes,back","ma","M","Biodra do tyłu, sztanga blisko nóg, plecy neutralne, schodź tylko do momentu zaokrąglania lędźwi.","smith romanian deadlift");
X("pullthrough","Przeciąganie linki między nogami (pull-through)","glutes,hams","ca","M","Tyłem do wyciągu, biodra do tyłu z lekko ugiętymi kolanami, plecy neutralne, na górze zaciśnij pośladki.","cable pull through");
X("cablechest","Wyciskanie na wyciągach stojąc","chest,triceps,shoulders","ca","M","Wykrok dla stabilności, uchwyty na wysokości klatki, wyciskaj do przodu, łopatki ściągnięte.","cable chest press");
X("cableadd","Przywodzenie nogi na wyciągu","adductors","ca","L","Mankiet na kostce, stań bokiem do wyciągu, przyciągaj nogę przed ciałem, tułów stabilny.","cable hip adduction przywodziciele",{side:true});
X("ropehammer","Uginanie młotkowe na wyciągu z liną","biceps","ca","I","Łokcie przy tułowiu, chwyt neutralny, bez bujania.","rope hammer curl");
X("abcrunchm","Brzuszki na maszynie (ab crunch)","core","ma","I","Ruch z brzucha, podwijaj klatkę do miednicy, nie ciągnij uchwytami ramionami.","ab crunch machine");
X("torsorot","Rotacja tułowia na maszynie","core","ma","I","Miednica stabilna, obracaj tułów, nie ramiona, kontroluj powrót.","rotary torso machine",{side:true,lo:10,hi:15});
X("captain","Unoszenie nóg na krzesełku rzymskim (captain's chair)","core","ma","B","Plecy i przedramiona oparte, unoś kolana lub proste nogi, na górze podwiń miednicę, bez bujania.","captains chair leg raise roman chair",{lo:8,hi:15});
X("treadmill","Bieżnia","cardio","ma","K","Zacznij od kilku minut spokojnego marszu. Tempo, w którym możesz mówić pełnymi zdaniami, to łagodna intensywność.","treadmill bieznia");
X("bikeup","Rower stacjonarny","cardio","ma","K","Siodełko na wysokości bioder, kolana lekko ugięte na dole obrotu, na początek spokojne tempo.","stationary bike spinning");
X("bikerec","Rower poziomy","cardio","ma","K","Plecy oparte, siodełko tak, by kolano było lekko ugięte na końcu wyprostu.","recumbent bike");
X("airbike","Rower powietrzny (air bike)","cardio","ma","K","Pracujesz rękami i nogami, opór rośnie z tempem. Zacznij od spokojnego tempa, potem możesz robić interwały.","assault bike air bike");
X("elliptical","Orbitrek","cardio","ma","K","Tułów wyprostowany, nie opieraj ciężaru na uchwytach, stopy płasko na pedałach.","elliptical cross trainer orbitrek");
X("rowerg","Wioślarz","cardio","ma","K","Kolejność ruchu: nogi, tułów, ręce, potem w odwrotnej kolejności. Plecy neutralne, nie ciągnij samymi rękami.","rowing machine ergometr concept2");
X("stairs","Stepper schodowy","cardio","ma","K","Tułów wyprostowany, trzymaj poręcze tylko dla równowagi, stopy płasko na stopniach.","stair climber stairmaster stepper");
X("skierg","SkiErg","cardio","ma","K","Ruch z bioder i tułowia, ręce prowadzą uchwyty w dół, plecy neutralne.","ski erg concept2");

/* ---- nazwy angielskie (tak ćwiczenia są opisane na maszynach i w większości siłowni) ---- */
const EN={
  squat:"Goblet Squat",legpress:"Leg Press (45°)",hacksquat:"Hack Squat (Machine)",smithsquat:"Smith Machine Squat",dbsquat:"Dumbbell Squat (Held at Shoulders)",
  incline:"Incline Dumbbell Press (30°)",incmachine:"Incline Chest Press (Machine)",smithinc:"Smith Machine Incline Press",neutralinc:"Neutral-Grip Incline Dumbbell Press",flatdb:"Flat Dumbbell Bench Press",
  csrow:"Chest-Supported Dumbbell Row (Incline Bench)",csmachine:"Chest-Supported Row (Machine)",csmachinewide:"Chest-Supported Row, Wide Grip (Machine)",tbarcs:"Chest-Supported T-Bar Row",
  pullup:"Pull-Up",chinup:"Chin-Up",neutralpull:"Neutral-Grip Pull-Up",assistpull:"Assisted Pull-Up Machine",bandpull:"Band-Assisted Pull-Up",latwide:"Wide-Grip Lat Pulldown",
  dips:"Dip (Parallel Bars)",dipmachine:"Seated Dip Machine",dipassist:"Assisted Dip",closepush:"Close-Grip Push-Up",
  cossack:"Cossack Squat",cossacksupport:"Supported Cossack Squat",latlunge:"Lateral Lunge",sumogoblet:"Dumbbell Sumo Squat",
  facepull:"Face Pull",revpec:"Reverse Pec Deck (Rear Delt Machine)",revdb:"Chest-Supported Dumbbell Reverse Fly",bandapart:"Band Pull-Apart",
  pallof:"Pallof Press",pallofkneel:"Half-Kneeling Pallof Press",pallofhold:"Pallof Press (3 s Hold)",deadbug:"Dead Bug",birddog:"Bird Dog",
  rdl:"Dumbbell Romanian Deadlift",rdlbb:"Barbell Romanian Deadlift",hyper45:"45° Back Extension (Roman Chair)",legcurl:"Lying Leg Curl (Machine)",slrdl:"Single-Leg Romanian Deadlift",
  ohp:"Dumbbell Overhead Press",ohpseated:"Seated Dumbbell Shoulder Press (Back Support)",ohpmachine:"Shoulder Press Machine",landmine:"Single-Arm Landmine Press",
  pulldown:"Neutral-Grip Lat Pulldown",pdwide:"Wide Overhand-Grip Lat Pulldown",pdunder:"Underhand-Grip Lat Pulldown",pd1arm:"Single-Arm Lat Pulldown (Cable)",straightarm:"Straight-Arm Pulldown",
  split:"Bulgarian Split Squat",revlunge:"Dumbbell Reverse Lunge",stepup:"Dumbbell Step-Up",walklunge:"Dumbbell Walking Lunge",smithsplit:"Smith Machine Bulgarian Split Squat",
  pushup:"Push-Up",inclinepush:"Incline Push-Up (Hands Elevated)",chestpress:"Chest Press Machine",
  dbrow:"One-Arm Dumbbell Row",dbrowinc:"Chest-Supported One-Arm Dumbbell Row",rowmachine1:"Single-Arm Row Machine",invrow:"Inverted Row (Australian Pull-Up)",
  lateral:"Dumbbell Lateral Raise",cablelat:"Cable Lateral Raise",machinelat:"Lateral Raise Machine",lyinglat:"Side-Lying Lateral Raise",
  sideplank:"Side Plank",sideplankknee:"Side Plank (Knees Bent)",sideplanklift:"Side Plank with Leg Lift",copenhagen:"Copenhagen Plank",
  bbbench:"Barbell Bench Press",bbincline:"Incline Barbell Bench Press",smithflat:"Smith Machine Bench Press",dbflyflat:"Flat Dumbbell Fly",dbflyinc:"Incline Dumbbell Fly",
  pecdeck:"Pec Deck (Machine Fly)",cablefly:"Cable Crossover (Cable Fly)",lowcablefly:"Low-to-High Cable Fly",floorpress:"Dumbbell Floor Press",pushupfeet:"Decline Push-Up (Feet Elevated)",dbpullover:"Dumbbell Pullover",
  bbrow:"Bent-Over Barbell Row",cablerow:"Seated Cable Row",cablerow1:"Single-Arm Cable Row",deadlift:"Barbell Deadlift",trapbar:"Trap Bar (Hex Bar) Deadlift",sumodl:"Sumo Deadlift",
  goodmorning:"Barbell Good Morning",shrug:"Dumbbell Shrug",scapulapull:"Scapular Pull-Up",hang:"Dead Hang",superman:"Superman (Prone Back Extension)",kbswing:"Kettlebell Swing",
  bbohp:"Standing Barbell Overhead Press",arnold:"Arnold Press",frontraise:"Dumbbell Front Raise",reardelt:"Bent-Over Dumbbell Reverse Fly",cablerear:"Cable Reverse Fly (Crossover)",extrot:"Cable External Rotation",yraise:"Incline Bench Y-Raise",
  dbcurl:"Standing Dumbbell Curl",hammer:"Hammer Curl",inclinecurl:"Incline Dumbbell Curl",ezcurl:"EZ-Bar Curl",cablecurl:"Low Cable Curl",preacher:"Preacher Curl (Machine)",
  pushdown:"Triceps Pushdown (Cable)",ohtri:"Overhead Cable Triceps Extension",skull:"Lying Triceps Extension (Skullcrusher)",dbohtri:"Overhead Dumbbell Triceps Extension",closebench:"Close-Grip Bench Press",kickback:"Dumbbell Triceps Kickback",benchdip:"Bench Dip",diamond:"Diamond Push-Up",
  backsquat:"Barbell Back Squat",frontsquat:"Barbell Front Squat",legext:"Leg Extension (Machine)",splitsq:"Dumbbell Split Squat",boxpistol:"Box Pistol Squat (Single-Leg Box Squat)",bwsquat:"Bodyweight Squat",
  seatedcurl:"Seated Leg Curl (Machine)",nordic:"Nordic Hamstring Curl",slidecurl:"Slider Leg Curl",
  hipthrust:"Barbell Hip Thrust",hipthrustdb:"Dumbbell Hip Thrust",glutebridge:"Glute Bridge",slbridge:"Single-Leg Glute Bridge",cablekick:"Cable Glute Kickback",abductionm:"Hip Abduction Machine",cablehipabd:"Cable Hip Abduction",sidelegraise:"Side-Lying Leg Raise",
  standcalf:"Standing Calf Raise (Machine/Smith)",seatedcalf:"Seated Calf Raise",presscalf:"Leg Press Calf Raise",dbcalf:"Single-Leg Dumbbell Calf Raise",tibraise:"Tibialis Raise",
  plank:"Plank",hollow:"Hollow Hold",hangleg:"Hanging Leg Raise",hangknee:"Hanging Knee Raise",cablecrunch:"Cable Crunch",abwheel:"Ab Wheel Rollout",russian:"Russian Twist",woodchop:"Cable Wood Chop",crunch:"Crunch",revcrunch:"Reverse Crunch",
  hips9090:"90/90 Hip Switches",hold9090:"90/90 Hip Stretch",hipflexor:"Kneeling Hip Flexor Stretch",couch:"Couch Stretch",deepsquat:"Deep Squat Hold",wgs:"World's Greatest Stretch",catcow:"Cat-Cow",openbook:"Open Book (Thoracic Rotation)",
  pigeon:"Pigeon Pose",lizard:"Lizard Lunge",adductrock:"Adductor Rock-Back",frog:"Frog Stretch",anklemob:"Ankle Mobilization (Knee-to-Wall)",hipcars:"Hip CARs (Controlled Articular Rotations)",
  shoulderpass:"Shoulder Dislocates (Band or Stick)",thoracicroll:"Thoracic Foam Roll",hamstretch:"Supine Hamstring Stretch (Strap)",
  declinepressm:"Decline Chest Press (Machine)",isochest:"Iso-Lateral Chest Press (Hammer Strength)",highrowm:"High Row Machine",lowrowm:"Low Row Machine",isorow:"Iso-Lateral Row (Hammer Strength)",
  latmachine:"Lat Pulldown Machine",pulloverm:"Pullover Machine",backextm:"Back Extension Machine (Lumbar Extension)",shrugm:"Shrug Machine",revhypm:"Reverse Hyperextension Machine",ghd:"Glute-Ham Raise (GHD)",
  isoshoulder:"Iso-Lateral Shoulder Press",smithohp:"Smith Machine Shoulder Press",bicepsm:"Biceps Curl Machine",tricepsm:"Triceps Extension Machine",
  legpresshoriz:"Seated Leg Press (Horizontal)",singlelegpress:"Single-Leg Leg Press",pendulum:"Pendulum Squat",vsquat:"V-Squat Machine",beltsquat:"Belt Squat",standcurl:"Standing Leg Curl",
  hipadductm:"Hip Adduction Machine (Inner Thigh)",glutekickm:"Glute Kickback Machine",hipthrustm:"Hip Thrust Machine (Glute Drive)",donkeycalf:"Donkey Calf Raise",
  smithrow:"Smith Machine Row",smithhip:"Smith Machine Hip Thrust",smithlunge:"Smith Machine Lunge",smithrdl:"Smith Machine Romanian Deadlift",
  pullthrough:"Cable Pull-Through",cablechest:"Standing Cable Chest Press",cableadd:"Cable Hip Adduction",ropehammer:"Rope Hammer Curl",
  abcrunchm:"Ab Crunch Machine",torsorot:"Rotary Torso Machine",captain:"Captain's Chair Leg Raise",
  treadmill:"Treadmill",bikeup:"Stationary Bike (Upright)",bikerec:"Recumbent Bike",airbike:"Air Bike (Assault Bike)",elliptical:"Elliptical Cross Trainer",rowerg:"Rowing Machine (Ergometer)",stairs:"Stair Climber (StairMaster)",skierg:"SkiErg"
};

/* ---- scalanie z EX (plan.js) ---- */
Object.keys(META).forEach(id=>{const e=EX[id];if(!e)return;const m=META[id];e.g=m[0].split(",");e.eq=m[1];e.alias=m[2]||""});
LIB.forEach(l=>{
  const k=KIND[l.kind],o=l.o,pick=(f)=>o[f]!==undefined?o[f]:k[f];
  EX[l.id]={id:l.id,slot:null,w:null,name:l.name,cue:l.cue,note:"",
    sets:pick("sets"),lo:pick("lo"),hi:pick("hi"),rest:pick("rest"),
    bw:o.bw!==undefined?!!o.bw:!!k.bw,side:!!o.side,unit:k.unit||"reps",nw:!!k.nw,
    g:l.g,eq:l.eq,alias:l.alias,lib:true};
  ORDER[l.id]=Object.keys(ORDER).length;
});
Object.keys(EX).forEach(id=>{EX[id].en=EN[id]||""});
