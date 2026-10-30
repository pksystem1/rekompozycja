# Dziennik treningowy

Prosta aplikacja na telefon do zapisywania treningów siłowych. Ćwiczenia wybierasz swobodnie z biblioteki (ponad 160 pozycji) albo korzystasz z gotowych szablonów A i B.
Działa w przeglądarce, bez konta i bez serwera. **Wszystkie dane zostają na Twoim urządzeniu.**

## Co potrafi

- **Biblioteka ćwiczeń.** Na ekranie Trening dodajesz ćwiczenia do listy na dany dzień (przycisk Dodaj ćwiczenie). Biblioteka ma wyszukiwarkę (działa też bez polskich znaków i po angielskich nazwach, np. „hip thrust”), filtry według partii mięśniowej i sprzętu, ulubione (★) i listę ostatnio robionych. Obejmuje klatkę, plecy, barki, biceps, triceps, nogi, pośladki, łydki, core oraz mobilność bioder, barków i klatki piersiowej.
- **Własne ćwiczenia.** Brakuje czegoś? W bibliotece wybierz „Dodaj własne ćwiczenie”: nazwa, partia, sprzęt i sposób zapisu serii (z ciężarem, z masą ciała, same powtórzenia albo czas).
- **Trening.** Ćwiczenia wykonujesz w dowolnej kolejności. Serie wpisujesz przyciskami − / + lub z klawiatury, a ciężar i powtórzenia podpowiadają się z poprzedniego treningu. Po każdej serii rusza stoper przerwy. Przycisk „Zakończ” pokazuje podsumowanie dnia z porównaniem do poprzedniego razu.
- **Zamiana ćwiczenia w trakcie.** W oknie ćwiczenia przycisk „Zamień na inne ćwiczenie” otwiera bibliotekę. Ćwiczenie bez zapisanych serii zostaje podmienione, a to z seriami zostaje w historii dnia.
- **Szablony A i B.** Gotowe listy po 8 ćwiczeń (przyciski Szablon A i Szablon B). Ćwiczenia w szablonie zmienisz w zakładce Więcej, tam też ustawisz rotację.
- **Rotacja co tydzień.** W zakładce Więcej, w szablonie, możesz ustawić, że w jednym tygodniu robisz np. wyciskanie na skosie, a w następnym na płaskiej ławce, i tak na przemian. Aplikacja sama pokazuje właściwe ćwiczenie według tygodnia (poniedziałek–niedziela). Historia każdego ćwiczenia zapisuje się osobno.
- **Historia.** Lista dni z szczegółami i usuwaniem.
- **Wykresy.** Wybierasz ćwiczenie (lista pogrupowana według partii, tylko ćwiczenia z historią) i widzisz zmianę powtórzeń oraz ciężaru (▲ wzrost, ▼ spadek) względem poprzedniej sesji i startu. Do tego frekwencja: słupki tygodniowe z celem 2, wykonanie planu i serie tygodni.
- **Kopia zapasowa.** Eksport i import danych (JSON), eksport do arkusza (CSV).
- **Offline.** Po pierwszym otwarciu działa bez internetu.

## Szablony A i B

| Trening A | Trening B |
|---|---|
| Przysiad goblet 3 × 8–12 | Rumuński martwy ciąg (hantle) 3 × 8–12 |
| Wyciskanie hantli na skosie 3 × 8–12 | Wyciskanie hantli nad głowę 3 × 8–12 |
| Wiosłowanie w podporze 3 × 8–12 | Ściąganie drążka (chwyt neutralny) 3 × 8–12 |
| Podciąganie 3 × 5–10 | Przysiad bułgarski 3 × 8–12 na stronę |
| Dipy 3 × 6–12 | Pompki 3 × 8–15 |
| Przysiad kozacki 2 × 6–8 na stronę | Wiosłowanie hantlem jednorącz 3 × 8–12 na stronę |
| Face pull 3 × 12–20 | Wznosy hantli bokiem 3 × 12–20 |
| Pallof press 2 × 10–12 na stronę | Deska boczna 2 × 20–40 s na stronę |

W pierwszych czterech tygodniach aplikacja pokazuje podpowiedź „powrót po przerwie” (2 serie, ok. 60% dawnego ciężaru, a potem pełna liczba serii). Możesz ją wyłączyć w zakładce Więcej.

## Uruchomienie

### Opcja 1: GitHub Pages (najwygodniejsza)

1. Utwórz **publiczne** repozytorium na GitHubie i wgraj do niego wszystkie pliki z tego folderu.
2. Wejdź w **Settings → Pages**, w polu „Source” wybierz **Deploy from a branch**, gałąź `main` i folder `/ (root)`.
3. Po chwili strona będzie pod adresem `https://TWOJ-LOGIN.github.io/NAZWA-REPOZYTORIUM/`.

GitHub Pages jest darmowy dla publicznych repozytoriów. Dla prywatnych wymaga płatnego planu.

### Opcja 2: lokalnie na komputerze

```
python3 -m http.server 8000
```

i wejdź na `http://localhost:8000`. Tryb offline (service worker) działa tylko przez HTTPS lub `localhost`.

## Instalacja na iPhonie

1. Otwórz adres strony w **Safari**.
2. Stuknij **Udostępnij**, a potem **Do ekranu początkowego**.

Zrób to od razu: Safari usuwa dane stron, z którymi nie wchodziłeś w interakcję przez 7 dni używania Safari, a aplikacje z ekranu początkowego są z tej reguły wyłączone. Mimo to raz na jakiś czas wykonaj kopię zapasową (Więcej → Eksportuj dane).

## Dane i prywatność

- Dane trzymane są w `localStorage` przeglądarki pod kluczem `trening.v1`. Nic nie jest wysyłane na żaden serwer.
- Wyczyszczenie danych przeglądarki, zmiana telefonu lub odinstalowanie aplikacji z ekranu początkowego usuwa dane. Dlatego robisz kopie zapasowe.
- Import dopisuje treningi, własne ćwiczenia, ulubione i ustawienia szablonów z kopii. Jeśli dzień o tej samej dacie już istnieje, zostaje zastąpiony.

## Aktualizacja bez utraty danych

Dane siedzą w przeglądarce telefonu, a nie w plikach aplikacji, więc podmiana plików w repozytorium ich nie rusza. Warunek: **adres strony musi zostać taki sam** (inna domena lub inna nazwa repozytorium to dla przeglądarki inna aplikacja z pustymi danymi).

1. Zrób kopię: Więcej → Eksportuj dane.
2. Wgraj nowe pliki do tego samego repozytorium (nadpisz stare). Od wersji 2.0 dochodzi nowy plik `cwiczenia.js`, a zmieniają się też `index.html` i `styles.css`, więc wgraj całą zawartość folderu.
3. Na telefonie otwórz aplikację, zamknij ją całkiem i otwórz jeszcze raz. Za pierwszym razem może się pokazać stara wersja, bo aplikacja najpierw pobiera nową w tle. Numer wersji jest na dole zakładki Więcej.

Format danych (`trening.v1`) jest zgodny wstecz: nowe wersje czytają stare dane, a ustawienia z wcześniejszych wersji są przenoszone automatycznie.

## Historia wersji

- **2.0.0** – biblioteka ćwiczeń (164 pozycje) z wyszukiwarką, filtrami, ulubionymi i własnymi ćwiczeniami, swobodna lista ćwiczeń na dzień, plan A/B jako szablony, wykresy dla każdego ćwiczenia z historią, nowa kolumna „grupa” w eksporcie CSV. Dane z wersji 1.x działają bez zmian.
- **1.1.0** – płaska ławka jest zamiennikiem wyciskania na skosie (trening A), rotacja ćwiczeń co tydzień, rotacja zapisywana w kopii zapasowej. Dawny wybór „płaska ławka zamiast pompek” przenosi się automatycznie na miejsce skosu.
- **1.0.0** – pierwsza wersja.

## Biblioteka i zamienniki: na czym się opierają

Domyślne serie i zakresy powtórzeń w bibliotece to propozycje startowe: ćwiczenia wielostawowe 6–10 lub 8–12 powtórzeń, izolacje 10–20. Przyrost mięśni jest podobny w szerokim zakresie obciążeń, o ile serie kończą się blisko granicy możliwości, a tygodniowa liczba serii na partię (kilka do kilkunastu) ma większe znaczenie niż pojedyncza seria:

- Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW (2017), *J Strength Cond Res*. Adaptacje siły i hipertrofii przy niskich i wysokich obciążeniach (przegląd systematyczny z metaanalizą).
- Schoenfeld BJ, Ogborn D, Krieger JW (2017), *J Sports Sci*. Zależność między tygodniową objętością treningu a przyrostem masy mięśniowej (metaanaliza).

Zamienniki w szablonach dobrano według wzorca ruchu i pracujących mięśni, z uwzględnieniem wersji łagodniejszych dla lędźwi i barków. To propozycja autora, a nie wynik badań nad każdą parą ćwiczeń. Wsparcie literaturowe dla części wyborów:

- Youdas JW i wsp. (2010), *J Strength Cond Res* 24(12): 3404–3414. Aktywność mięśni w podciąganiu nachwytem i podchwytem.
- Porównanie aktywności czworogłowego w przysiadzie i leg pressie: *Front Sports Act Living* (2021), doi:10.3389/fspor.2021.686335.
- Porównanie treningu z wolnymi ciężarami i na maszynach: *Effects of Training With Free Weights Versus Machines on Muscle Mass, Strength, Free Testosterone, and Free Cortisol Levels*, *J Strength Cond Res* (2020). Przyrost mięśni i siły był podobny w obu grupach.

Historia każdego ćwiczenia jest liczona osobno, więc po zamianie wykresy zaczynają się od nowa dla nowego ćwiczenia.

## Struktura projektu

| Plik | Zawartość |
|---|---|
| `index.html` | strona |
| `styles.css` | wygląd |
| `plan.js` | szablony A i B oraz lista zamienników dla każdego miejsca |
| `cwiczenia.js` | biblioteka ćwiczeń: grupy, sprzęt, wskazówki, domyślne serie |
| `app.js` | logika aplikacji |
| `sw.js`, `manifest.webmanifest`, `icons/` | tryb offline i instalacja na telefonie |

### Dodawanie ćwiczeń do biblioteki

Pojedyncze ćwiczenie dodasz w samej aplikacji (Dodaj własne ćwiczenie). Na stałe, dla wszystkich, dopisz wiersz w `cwiczenia.js`:

```js
X("moj_id","Nazwa ćwiczenia","chest,triceps","db","M","Wskazówka techniczna","aliasy do wyszukiwania",{side:true})
```

Grupy: `chest, back, shoulders, biceps, triceps, quads, hams, glutes, calves, core, mobility` (pierwsza jest główną). Sprzęt: `bw, db, bb, ma, ca, ot`. Typ (`C, M, I, L, B, T, H, N`) ustawia domyślne serie i zakres powtórzeń, opis typów jest na górze pliku. Ostatni argument jest opcjonalny.

### Własne zamienniki w szablonie

W `plan.js` do tablicy `alts` wybranego miejsca w planie dodaj wpis:

```js
V("moj_id", "Nazwa ćwiczenia", "Wskazówka techniczna", "Czym różni się od domyślnego", {lo:8, hi:12})
```

Ostatni argument jest opcjonalny i nadpisuje parametry: `sets`, `lo`, `hi`, `rest`, `bw`, `side`, `unit`. Identyfikator musi być unikalny.

## Zastrzeżenie

To narzędzie do zapisywania treningów, a nie porada medyczna ani trenerska. Przy bólu promieniującym, drętwieniu lub narastających dolegliwościach skonsultuj się z lekarzem lub fizjoterapeutą.

## Licencja

MIT. W pliku `LICENSE` uzupełnij imię i nazwisko autora.
