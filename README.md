# Dziennik treningowy

Prosta aplikacja na telefon do zapisywania treningów siłowych 2 razy w tygodniu (plan A/B).
Działa w przeglądarce, bez konta i bez serwera. **Wszystkie dane zostają na Twoim urządzeniu.**

## Co potrafi

- **Trening.** Ćwiczenia wybierasz w dowolnej kolejności. Serie wpisujesz przyciskami − / + lub z klawiatury, a ciężar i powtórzenia podpowiadają się z poprzedniego treningu. Po każdej serii rusza stoper przerwy. Przycisk „Zakończ” pokazuje podsumowanie dnia z porównaniem do poprzedniego razu.
- **Zamienniki ćwiczeń.** Plan jest sztywny (16 miejsc: 8 w treningu A i 8 w treningu B), ale każde ćwiczenie możesz zamienić na inne z listy o tym samym wzorcu ruchu, np. przysiad goblet na leg press. Serie i przerwa zostają z planu.
- **Historia.** Lista dni z szczegółami i usuwaniem.
- **Wykresy.** Wybierasz ćwiczenie i widzisz zmianę powtórzeń oraz ciężaru (▲ wzrost, ▼ spadek) względem poprzedniej sesji i startu. Do tego frekwencja: słupki tygodniowe z celem 2, wykonanie planu i serie tygodni.
- **Kopia zapasowa.** Eksport i import danych (JSON), eksport do arkusza (CSV).
- **Offline.** Po pierwszym otwarciu działa bez internetu.

## Plan

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
- Import dopisuje treningi z kopii. Jeśli dzień o tej samej dacie już istnieje, zostaje zastąpiony.

## Zamienniki ćwiczeń: na czym się opierają

Zamienniki dobrano według wzorca ruchu i pracujących mięśni, z uwzględnieniem wersji łagodniejszych dla lędźwi i barków. To propozycja autora, a nie wynik badań nad każdą parą ćwiczeń. Wsparcie literaturowe dla części wyborów:

- Youdas JW i wsp. (2010), *J Strength Cond Res* 24(12): 3404–3414. Aktywność mięśni w podciąganiu nachwytem i podchwytem.
- Porównanie aktywności czworogłowego w przysiadzie i leg pressie: *Front Sports Act Living* (2021), doi:10.3389/fspor.2021.686335.
- Porównanie treningu z wolnymi ciężarami i na maszynach: *Effects of Training With Free Weights Versus Machines on Muscle Mass, Strength, Free Testosterone, and Free Cortisol Levels*, *J Strength Cond Res* (2020). Przyrost mięśni i siły był podobny w obu grupach.

Historia każdego ćwiczenia jest liczona osobno, więc po zamianie wykresy zaczynają się od nowa dla nowego ćwiczenia.

## Struktura projektu

| Plik | Zawartość |
|---|---|
| `index.html` | strona |
| `styles.css` | wygląd |
| `plan.js` | plan i lista zamienników (tutaj dodasz własne ćwiczenia) |
| `app.js` | logika aplikacji |
| `sw.js`, `manifest.webmanifest`, `icons/` | tryb offline i instalacja na telefonie |

### Własne zamienniki

W `plan.js` do tablicy `alts` wybranego miejsca w planie dodaj wpis:

```js
V("moj_id", "Nazwa ćwiczenia", "Wskazówka techniczna", "Czym różni się od domyślnego", {lo:8, hi:12})
```

Ostatni argument jest opcjonalny i nadpisuje parametry: `sets`, `lo`, `hi`, `rest`, `bw`, `side`, `unit`. Identyfikator musi być unikalny.

## Zastrzeżenie

To narzędzie do zapisywania treningów, a nie porada medyczna ani trenerska. Przy bólu promieniującym, drętwieniu lub narastających dolegliwościach skonsultuj się z lekarzem lub fizjoterapeutą.

## Licencja

MIT. W pliku `LICENSE` uzupełnij imię i nazwisko autora.
