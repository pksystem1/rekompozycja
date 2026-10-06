"use strict";
/*
  PLAN TRENINGOWY (sztywny): 16 miejsc w planie, 8 w treningu A i 8 w treningu B.
  Serie, zakres powtórzeń i przerwa są przypisane do miejsca w planie.
  Każde miejsce ma listę zamienników o tym samym wzorcu ruchu.
  Zamiennik może nadpisać wybrane parametry (pole "o": sets, lo, hi, rest, bw, side, unit).

  bw   = ćwiczenie z masą ciała (pole kg oznacza dodatkowy ciężar, 0 = sama masa ciała)
  side = liczba powtórzeń dotyczy jednej strony
  unit = "sec" dla ćwiczeń na czas
*/
const V=(id,name,cue,note,o)=>({id,name,cue,note,o:o||{}});

const SLOTS=[
/* ---------------- TRENING A ---------------- */
{id:"squat",w:"A",name:"Przysiad goblet",sets:3,lo:8,hi:12,rest:120,
 cue:"Pełne zejście, 1 s pauzy na dole, 3 s w dół. Klin 2–3 cm pod piętami pozwala zejść głębiej bez zaokrąglania lędźwi.",
 alts:[
  V("legpress","Wypychanie na suwnicy (leg press)","Stopy na szerokość barków, miednica przyklejona do oparcia, 2–3 s w dół, nie blokuj kolan na górze.","Ten sam wzorzec kolanowy na stabilnej maszynie, mniejsze obciążenie kręgosłupa. Zejdź tylko tak głęboko, by miednica nie odrywała się od oparcia."),
  V("hacksquat","Przysiad na maszynie hack","Plecy na oparciu, stopy lekko przed ciałem, schodź w pełnym zakresie bez odrywania miednicy.","Przysiad z oparciem pleców. Dobry wybór, gdy goblet robi się za lekki."),
  V("smithsquat","Przysiad na suwnicy Smitha","Stopy lekko przed sztangą, pięty na klinie, 3 s w dół, tułów wyprostowany.","Stabilna sztanga i łatwa progresja ciężaru."),
  V("dbsquat","Przysiad z dwiema hantlami przy barkach","Hantle przy barkach, łokcie do przodu, pełne zejście z pauzą 1 s.","Jak goblet, ale pozwala użyć większego ciężaru, gdy jedna hantla jest za lekka.")
 ]},
{id:"incline",w:"A",name:"Wyciskanie hantli na skosie 30°",sets:3,lo:8,hi:12,rest:90,
 cue:"Łopatki ściągnięte, łokcie ok. 45° od tułowia.",
 alts:[
  V("incmachine","Wyciskanie na maszynie skośnej","Ustaw siedzisko tak, by uchwyty były na wysokości górnej części klatki, łopatki ściągnięte.","Ten sam wzorzec na stabilnej maszynie, bez asekuracji."),
  V("smithinc","Wyciskanie na suwnicy Smitha na skosie","Ławka 30°, sztanga schodzi do górnej części klatki, łokcie ok. 45° od tułowia.","Prowadzona sztanga na skosie, łatwo dobrać ciężar."),
  V("neutralinc","Wyciskanie hantli na skosie chwytem neutralnym","Hantle równolegle do siebie, łokcie blisko tułowia, łopatki ściągnięte.","Chwyt równoległy bywa wygodniejszy dla barków.")
 ]},
{id:"csrow",w:"A",name:"Wiosłowanie w podporze (ławka skośna)",sets:3,lo:8,hi:12,rest:90,
 cue:"Klatka oparta o ławkę 30–45°, hantle do bioder, łopatki ściągnięte na końcu ruchu. Odciąża lędźwia.",
 alts:[
  V("csmachine","Wiosłowanie na maszynie z podparciem klatki","Klatka oparta o podpórkę, ciągnij łokcie do tyłu, ściągnij łopatki na końcu ruchu.","To samo ciąganie poziome na maszynie. Lędźwia odciążone, łatwa kontrola ruchu."),
  V("csmachinewide","Wiosłowanie na maszynie z podparciem, szeroki chwyt","Klatka oparta, łokcie na zewnątrz, ciągnij do górnej części klatki.","Większy nacisk na górną część pleców i tylną część barków."),
  V("tbarcs","Wiosłowanie T-bar z podparciem klatki","Klatka na podpórce, chwyt neutralny, łokcie blisko tułowia.","Wersja z podparciem, zachowuje wzorzec poziomego ciągnięcia.")
 ]},
{id:"pullup",w:"A",name:"Podciąganie",sets:3,lo:5,hi:10,rest:90,bw:true,
 cue:"Pełny zwis, klatka do drążka. Z gumą lub maszyną wpisz 0 kg, z obciążeniem wpisz dodatkowe kg.",
 alts:[
  V("chinup","Podciąganie podchwytem","Chwyt podchwytem na szerokość barków, pełny zwis, klatka do drążka.","W badaniach EMG główne mięśnie ciągnące pracują podobnie jak w nachwycie, a zwykle jest łatwiejsze."),
  V("neutralpull","Podciąganie chwytem neutralnym","Uchwyty równolegle, pełny zwis, łopatki w dół na początku ruchu.","Chwyt równoległy bywa przyjaźniejszy dla łokci i barków."),
  V("assistpull","Podciąganie na maszynie z asystą","Ustaw asystę tak, by zrobić 5–10 czystych powtórzeń. Z czasem zmniejszaj asystę.","Zmniejsza ciężar ciała, gdy nie robisz jeszcze pełnych powtórzeń. W polu kg wpisz 0."),
  V("bandpull","Podciąganie z gumą oporową","Guma pod kolanem lub stopą, pełny zakres ruchu.","Zamiennik asysty, gdy nie ma maszyny. W polu kg wpisz 0."),
  V("latwide","Ściąganie drążka do klatki szerokim chwytem","Siedzisko z blokadą ud, ściągaj drążek do górnej części klatki, tułów lekko odchylony.","Ten sam wzorzec pionowego ciągnięcia, ale ciężar dobierasz dokładnie ze stosu. Wpisuj kg ze stosu.",{bw:false,lo:8,hi:12})
 ]},
{id:"dips",w:"A",name:"Dipy",sets:3,lo:6,hi:12,rest:90,bw:true,
 cue:"Tułów lekko pochylony, zejście do ok. 90° w łokciach, barki nisko. Ból z przodu barku: skróć zakres.",
 alts:[
  V("dipmachine","Dipy na maszynie","Tułów lekko pochylony, łokcie nie rozjeżdżają się na boki, zejście do ok. 90°.","Ten sam wzorzec z dobieranym ciężarem.",{bw:false}),
  V("dipassist","Dipy z asystą (maszyna lub guma)","Tułów lekko pochylony, zejście do ok. 90°, pełny wyprost na górze.","Lżejsza wersja, gdy dipy z masą ciała są jeszcze za trudne. W polu kg wpisz 0."),
  V("closepush","Pompki wąskim chwytem","Dłonie pod barkami, łokcie blisko tułowia, ciało w jednej linii.","Podobny nacisk na triceps i klatkę, łatwo regulować trudność.",{lo:8,hi:15})
 ]},
{id:"cossack",w:"A",name:"Przysiad kozacki",sets:2,lo:6,hi:8,rest:75,side:true,
 cue:"Szeroki rozkrok, zejście na jedną nogę, druga prosta ze stopą w górę. Zakres rośnie z tygodnia na tydzień.",
 alts:[
  V("cossacksupport","Przysiad kozacki z podparciem","Trzymaj się stabilnego uchwytu i schodź na jedną nogę w komfortowym zakresie.","Łatwiejsza wersja, gdy brakuje zakresu ruchu w biodrach."),
  V("latlunge","Wykrok boczny","Krok w bok, biodra do tyłu, noga zakroczna prosta, stopa pewnie na podłożu.","Podobne otwarcie bioder i przywodzicieli, łatwiejsza kontrola. Możesz trzymać hantlę przy klatce.",{bw:true,lo:8,hi:12}),
  V("sumogoblet","Przysiad sumo z hantlą","Stopy szerzej niż barki, palce na zewnątrz, kolana w kierunku palców.","Szeroki rozstaw obustronnie, nadal rozciąga przywodziciele.",{side:false,lo:8,hi:12})
 ]},
{id:"facepull",w:"A",name:"Face pull",sets:3,lo:12,hi:20,rest:60,
 cue:"Linka do czoła, łokcie wysoko, rotacja zewnętrzna na końcu.",
 alts:[
  V("revpec","Odwrotne rozpiętki na maszynie","Klatka oparta, ruch z łokci, bez zrywu.","Ten sam cel (tylna część barków i środek pleców) w stabilnej pozycji."),
  V("revdb","Odwrotne rozpiętki z hantlami w podparciu","Klatka oparta o ławkę skośną, łokcie lekko ugięte, ruch tylko w barkach.","Wersja bez maszyny, użyj lekkich hantli."),
  V("bandapart","Rozciąganie gumy oporowej (band pull-apart)","Ręce na wysokości klatki, rozciągnij gumę łopatkami.","Najlżejsza opcja, gdy nie ma wyciągu. W polu kg wpisz 0.",{bw:true,lo:15,hi:25})
 ]},
{id:"pallof",w:"A",name:"Pallof press",sets:2,lo:10,hi:12,rest:60,side:true,
 cue:"Tułów nie rotuje: wypchnij i przytrzymaj 2 s.",
 alts:[
  V("pallofkneel","Pallof press w klęku","Klęk na jednym kolanie lub oba kolana, tułów nie rotuje, wypchnij i przytrzymaj 2 s.","Ta sama praca przeciw rotacji w stabilniejszej pozycji."),
  V("pallofhold","Pallof press z przytrzymaniem 3 s","Wypchnij i przytrzymaj 3 s, wróć w kontroli.","Dłuższe napięcie, ten sam wzorzec."),
  V("deadbug","Dead bug (martwy robak)","Lędźwia przy podłodze, naprzemiennie wyprost ręki i przeciwległej nogi.","Stabilizacja tułowia bez obciążenia lędźwi, bez potrzeby wyciągu.",{bw:true,lo:8,hi:12}),
  V("birddog","Bird dog","Naprzemiennie wyprost ręki i przeciwległej nogi, miednica nieruchoma.","Stabilizacja lędźwi i miednicy w podporze, łagodna dla pleców.",{bw:true,lo:8,hi:12})
 ]},

/* ---------------- TRENING B ---------------- */
{id:"rdl",w:"B",name:"Rumuński martwy ciąg (hantle)",sets:3,lo:8,hi:12,rest:120,
 cue:"Biodra do tyłu, hantle przy udach, neutralne plecy. Schodzisz tylko do momentu, w którym lędźwia zaczynają się zaokrąglać. 3 s w dół.",
 alts:[
  V("rdlbb","Rumuński martwy ciąg ze sztangą","Biodra do tyłu, sztanga przy udach, neutralne plecy, lekko ugięte kolana.","Pozwala użyć większego ciężaru, ale mocniej obciąża lędźwia. Przy bólu pleców zostań przy hantlach."),
  V("hyper45","Wyprosty na ławce rzymskiej 45°","Ruch z bioder, plecy neutralne, nie prostuj ponad linię tułowia.","Zawias biodrowy z podparciem, ruch kontrolowany i zwykle przyjazny dla lędźwi.",{bw:true,lo:10,hi:15}),
  V("legcurl","Uginanie nóg leżąc na maszynie","Biodra przy ławce, 3 s w dół, pełny zakres.","Izoluje tył uda i nie obciąża kręgosłupa, ale nie ćwiczy zawiasu biodrowego.",{lo:10,hi:15}),
  V("slrdl","Rumuński martwy ciąg na jednej nodze","Biodro do tyłu, noga zakroczna w linii z tułowiem, plecy neutralne.","Ten sam zawias jednostronnie, mniejszy ciężar i więcej równowagi.",{side:true,rest:90})
 ]},
{id:"ohp",w:"B",name:"Wyciskanie hantli nad głowę",sets:3,lo:8,hi:12,rest:90,
 cue:"Pośladki i brzuch napięte, bez wyginania lędźwi.",
 alts:[
  V("ohpseated","Wyciskanie hantli nad głowę siedząc z oparciem","Plecy na oparciu, brzuch napięty, hantle nad barkami.","Oparcie odciąża lędźwia i ogranicza wyginanie, dobry wybór przy bólach pleców."),
  V("ohpmachine","Wyciskanie nad głowę na maszynie","Siedzisko na wysokości barków, łokcie lekko przed tułowiem.","Stabilna maszyna, łatwa progresja."),
  V("landmine","Wyciskanie sztangi landmine jednorącz","Sztanga zamocowana w rogu, wyciskaj ukośnie do góry, tułów stabilny.","Tor ruchu pod kątem bywa łagodniejszy dla barków. Wymaga mocowania sztangi.",{side:true})
 ]},
{id:"pulldown",w:"B",name:"Ściąganie drążka (chwyt neutralny)",sets:3,lo:8,hi:12,rest:90,
 cue:"Drążek do górnej części klatki, łopatki w dół.",
 alts:[
  V("pdwide","Ściąganie drążka szerokim nachwytem","Drążek do górnej części klatki, łokcie w dół i do tyłu.","Ten sam wzorzec z szerszym chwytem."),
  V("pdunder","Ściąganie drążka podchwytem","Chwyt na szerokość barków, ściągaj do górnej części klatki.","Większy udział bicepsa, zwykle pozwala użyć większego ciężaru."),
  V("pd1arm","Ściąganie jednorącz na wyciągu","Ściągaj łokieć w dół i do żeber, tułów stabilny.","Każda strona osobno, wyrównuje różnice między rękami.",{side:true}),
  V("straightarm","Prostowanie ramion na wyciągu górnym","Ręce prawie proste, ściągaj linkę łukiem do ud.","Izolacja najszerszych bez bicepsa, lżejsze obciążenia.",{lo:10,hi:15})
 ]},
{id:"split",w:"B",name:"Przysiad bułgarski (głęboki)",sets:3,lo:8,hi:12,rest:90,side:true,
 cue:"Tylne kolano prawie do podłogi, pośladek tylnej nogi napięty. Pauza 2 s na dole.",
 alts:[
  V("revlunge","Wykrok w tył z hantlami","Krok w tył, tułów wyprostowany, przednie kolano stabilne.","Lżejszy dla kolan i prostszy w równowadze, ten sam wzorzec jednostronny."),
  V("stepup","Wejścia na podwyższenie z hantlami","Całą stopą na podwyższeniu, wchodź siłą przedniej nogi.","Praca jednostronna ze stabilnym podparciem, wysokość skrzyni dobierz do komfortu bioder."),
  V("walklunge","Wykroki chodzone z hantlami","Długi krok, tułów wyprostowany, kolano tylnej nogi prawie do podłogi.","Dynamiczniejsza wersja jednostronna, potrzebuje miejsca."),
  V("smithsplit","Przysiad bułgarski na suwnicy Smitha","Tylna stopa na ławce, sztanga prowadzona, 2 s pauzy na dole.","Prowadzona sztanga zwiększa stabilność.")
 ]},
{id:"pushup",w:"B",name:"Pompki",sets:3,lo:8,hi:15,rest:75,bw:true,
 cue:"Ciało w jednej linii. Przy łatwych pompkach dodaj obciążenie lub zwolnij tempo.",
 alts:[
  V("inclinepush","Pompki z rękami na podwyższeniu","Dłonie na ławce lub drążku, ciało w jednej linii.","Łatwiejsza wersja, gdy brakuje siły."),
  V("chestpress","Wyciskanie na maszynie (chest press)","Uchwyty na wysokości środka klatki, łopatki ściągnięte.","Pchanie poziome z dobieranym ciężarem, dobre, gdy pompki są za łatwe lub za trudne.",{bw:false}),
  V("flatdb","Wyciskanie hantli na płaskiej ławce","Łopatki ściągnięte, łokcie ok. 45° od tułowia.","Klasyczne pchanie poziome z hantlami, większy nacisk na środkową część klatki.",{bw:false})
 ]},
{id:"dbrow",w:"B",name:"Wiosłowanie hantlem jednorącz",sets:3,lo:8,hi:12,rest:75,side:true,
 cue:"Hantla do biodra, tułów stabilny.",
 alts:[
  V("dbrowinc","Wiosłowanie hantlem jednorącz z oparciem o ławkę skośną","Klatka oparta o ławkę, hantla do biodra, łopatka ściągnięta na końcu.","Klatka oparta, więc lędźwia są odciążone."),
  V("rowmachine1","Wiosłowanie jednorącz na maszynie","Klatka oparta, ciągnij łokieć do tyłu, łopatka ściągnięta na końcu.","To samo ciąganie jednostronne z podparciem."),
  V("invrow","Podciąganie australijskie (wiosłowanie pod sztangą)","Ciało w jednej linii, klatka do sztangi, łopatki ściągnięte.","Wiosłowanie z masą ciała, trudność regulujesz kątem ciała. W polu kg wpisz 0.",{bw:true,side:false,lo:8,hi:12})
 ]},
{id:"lateral",w:"B",name:"Wznosy hantli bokiem",sets:3,lo:12,hi:20,rest:60,
 cue:"Lekko pochylony tułów, łokcie minimalnie ugięte, unoś do linii barków.",
 alts:[
  V("cablelat","Wznosy bokiem na wyciągu dolnym","Łokieć minimalnie ugięty, unoś do linii barku, bez bujania tułowiem.","Stałe napięcie w całym zakresie ruchu, jedna ręka naraz.",{side:true}),
  V("machinelat","Wznosy bokiem na maszynie","Łokcie na poduszkach, unoś do linii barków.","Stabilna maszyna, łatwy dobór ciężaru."),
  V("lyinglat","Wznosy bokiem leżąc bokiem na ławce skośnej","Leżysz bokiem, unoś hantlę do linii barku bez bujania.","Zmienia krzywą oporu i eliminuje bujanie tułowiem.",{side:true})
 ]},
{id:"sideplank",w:"B",name:"Deska boczna",sets:2,lo:20,hi:40,rest:45,side:true,unit:"sec",
 cue:"Biodra wysoko, linia uszy–biodra–kostki.",
 alts:[
  V("sideplankknee","Deska boczna z ugiętymi kolanami","Kolana ugięte, biodra wysoko, linia uszy–biodra–kolana.","Łatwiejsza wersja przy braku siły w tułowiu."),
  V("sideplanklift","Deska boczna z unoszeniem górnej nogi","Biodra wysoko, unoś górną nogę bez opadania miednicy.","Trudniejsza wersja, mocniej angażuje pośladek średni."),
  V("copenhagen","Deska boczna Copenhagen (przywodziciele)","Górna noga na ławce, unoś biodra, linia uszy–biodra–kostki.","Zaawansowana, dodaje pracę przywodzicieli. Zacznij od krótkich serii.",{lo:15,hi:30})
 ]}
];

/* ---- budowa słowników ---- */
const EX={};   // id ćwiczenia -> parametry
SLOTS.forEach(s=>{
  s.variants=[{id:s.id,name:s.name,cue:s.cue,note:"",o:{}}].concat(s.alts||[]);
  s.variants.forEach(v=>{
    const o=v.o||{};
    EX[v.id]={
      id:v.id,slot:s.id,w:s.w,name:v.name,cue:v.cue||s.cue,note:v.note||"",
      sets:o.sets!==undefined?o.sets:s.sets,
      lo:o.lo!==undefined?o.lo:s.lo,
      hi:o.hi!==undefined?o.hi:s.hi,
      rest:o.rest!==undefined?o.rest:s.rest,
      bw:o.bw!==undefined?!!o.bw:!!s.bw,
      side:o.side!==undefined?!!o.side:!!s.side,
      unit:o.unit||s.unit||"reps"
    };
  });
});
const ORDER={};let _ord=0;
SLOTS.forEach(s=>s.variants.forEach(v=>{ORDER[v.id]=_ord++}));
const FOCUS={A:"przysiad, pchanie i ciąganie, core",B:"zawias biodrowy, nogi jednostronnie, barki, core"};
