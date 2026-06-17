---
name: procesu-vizualizatorius
description: Pavaizduoti bet kokią sistemą ar darbo eigą kaip gražią interaktyvią HTML diagramą
triggers:
  - vizualizuok šią darbo eigą
  - sudaryk šios sistemos schemą
  - nubraižyk mano darbo eigos diagramą
  - parodyk, kaip tai veikia
---

# Darbo Eigos Vizualizavimo Įrankis

Paverčia bet kokį sistemos aprašymą graža, interaktyvia HTML diagrama. Spustelėk mazgus, užvesk pelę detalėms ir pamatyk tiksliai, kaip duomenys keliauja per tavo darbo eigą. Vienas savarankiškas HTML failas, be priklausomybių.

## Kaip Tai Veikia

Kai pasakai „vizualizuok šią darbo eigą" arba „sudaryk šios sistemos schemą", šis įgūdis išanalizuoja tavo aprašymą, identifikuoja kiekvieną komponentą ir sukuria interaktyvią diagramą, kurią gali atidaryti bet kurioje naršyklėje.

## 1 žingsnis: Išanalizuoti Sistemą

Iš naudotojo aprašymo išgauk šiuos komponentus:

| Komponentas | Į ką atkreipti dėmesį | Pavyzdys |
|-----------|-----------------|---------|
| **Trigeriai** | Kas pradeda darbo eigą | „Kai gaunamas naujas el. laiškas", „Kiekvieną rytą 9 val." |
| **Įvestys** | Duomenys, patenkantys į sistemą | „El. laiško tekstas", „CSV failas", „API atsakymas" |
| **Apdorojimo Žingsniai** | Veiksmai, transformuojantys duomenis | „Išgauti pagrindinę informaciją", „Apibendrinti tekstą", „Filtruoti rezultatus" |
| **Įrankiai / Paslaugos** | Naudojami išoriniai įrankiai ar API | „Claude", „Zapier", „Google Sheets", „Slack" |
| **Sprendimo Taškai** | Sąlyginės šakos | „Jei prioritetas aukštas", „Kai suma > $100" |
| **Išvestys** | Galutiniai rezultatai ar pristatomi elementai | „Siųsti Slack pranešimą", „Atnaujinti skaičiuoklę", „Sugeneruoti ataskaitą" |
| **Ciklai** | Pasikartojantys žingsniai | „Kartoti kiekvienam elementui", „Vykdyti kasdien" |
| **Duomenų Saugyklos** | Kur duomenys laikomi tarp žingsnių | „Duomenų bazė", „JSON failas", „Skaičiuoklė" |

Jei naudotojo aprašymas neaiškus, prieš kuriant užduok patikslinančius klausimus.

## 2 žingsnis: Pasirinkti Maketą

Pasirink maketą, kuris geriausiai atitinka darbo eigos formą:

| Maketas | Struktūra | Geriausiai tinka |
|--------|-----------|----------|
| **Iš Kairės į Dešinę** | Horizontali mazgų grandinė | Linijiniams procesams, srautams (pipelines), paprastoms darbo eigoms |
| **Iš Viršaus į Apačią (Krioklys)** | Vertikali kaskada | Sekos žingsniams, sprendimų medžiams, piltuvams |
| **Centras su Spinduliais** | Centrinis mazgas su besišakojančiais ryšiais | Vienam įrankiui, jungiamam su daugeliu, API integracijoms |
| **Takeliai (Swimlane)** | Horizontalūs takeliai pagal įrankį/asmenį | Daugiakomandiniams procesams, perdavimams tarp sistemų |
| **Žiedinis** | Grįžimas atgal į pradžią | Pasikartojančioms darbo eigoms, grįžtamojo ryšio ciklams, stebėjimui |

## 3 žingsnis: Sukurti Interaktyvų HTML

Sugeneruok vieną savarankišką HTML failą su šiomis funkcijomis:

### Mazgų Tipai ir Spalvos

| Mazgo Tipas | Fonas | Kraštinė | Piktogramos Stilius |
|-----------|-----------|--------|------------|
| **Trigeris** | `#1e3a5f` | `#3B82F6` (mėlyna) | Žaibas, laikrodis, webhook |
| **Apdorojimas** | `#1a3d2e` | `#10B981` (žalia) | Krumpliaratis, lazdelė, filtras |
| **Įrankis / Paslauga** | `#3d2e1a` | `#F59E0B` (gintaro) | Įrankio logotipas ar veržliaraktis |
| **Išvestis** | `#3d1a1a` | `#EF4444` (raudona) | Varnelė, siuntimas, eksportas |
| **Duomenų Saugykla** | `#1a1a2e` | `#6366F1` (indigo) | Duomenų bazė, aplankas, failas |
| **Sprendimas** | `#2e1a3d` | `#A855F7` (violetinė) | Klaustukas, šakojimasis |

### Mazgo Turinys

Kiekvienas mazgas rodo:
- **Piktogramą** (emoji ar SVG) viršuje
- **Etiketę** (2-4 žodžiai, pusjuodis)
- **Paantraštę** (viena trumpa eilutė, aprašanti, kas vyksta)

### Ryšiai ir Interaktyvumas

**Linijos:** Vientisos su rodyklių galais, spalva atitinka šaltinio mazgo kraštinę, neprivaloma duomenų etiketė, animuotas brūkšnys paryškinant.

**Užvedimas pele:** Mazgas padidėja 1,05x, kraštinė švyti, įrankio patarimas su žingsnio aprašymu.

**Spustelėjimas:** Paryškina mazgą ir tiesioginius ryšius, pritemdo nesusijusius mazgus, spustelėjimas fone atstato pradinę būseną.

**Pritaikymas skirtingiems ekranams:**
- Diagrama keičiasi pagal rodinio dydį
- Veikia darbalaukio ir planšetės ekranuose
- Mazgai apsivynioja arba slenka labai mažuose ekranuose

### Numatytasis Stilius

Puslapio fonas `#0f0f0f`, konteineris `#161616`, antraštės tekstas `#ffffff`, paantraštė `#888888`, mazgo tekstas `#ffffff`, ryšiai `#444444` (spalvoti, kai paryškinti). Sisteminis sans-serif šriftas, 12px kampų spindulys, 20px mazgo užpildymas, 160px minimalus mazgo plotis.

Įtrauk antraštę (darbo eigos pavadinimas + aprašymas), diagramos konteinerį ir spalvomis pažymėtą legendą (Mėlyna=Trigeriai, Žalia=Apdorojimas, Gintaro=Įrankiai, Raudona=Išvestys, Indigo=Duomenų Saugyklos, Violetinė=Sprendimai). Visi stiliai ir JS integruoti tiesiogiai, be išorinių priklausomybių.

## Taisyklės

1. **Kiekvienas mazgas turi būti konkretus veiksmas, ne neaiški etiketė.** „Apdoroti duomenis" — blogai. „Išgauti sąskaitos faktūros sumą iš PDF" — gerai
2. **Ryšiai turi rodyti, kokie duomenys keliauja tarp mazgų.** Ne tik, kad jie susiję, bet KAS per juos perduodama
3. **Sprendimo taškams reikia pažymėtų šakų.** „Taip" ir „Ne", arba konkrečios sąlygos
4. **Be izoliuotų mazgų.** Kiekvienas mazgas turi būti sujungtas su bent vienu kitu mazgu
5. **Visada tamsus fonas.** Šviesios temos diagramos atrodo išblukusios ir mažiau profesionalios
6. **Maksimaliai 20 mazgų vienoje diagramoje.** Jei darbo eiga didesnė, padalink į poddiagramas
7. **Savarankiškas HTML.** Be išorinių CSS, JS ar vaizdų priklausomybių. Turi veikti be interneto

## Naudojimo Pavyzdžiai

- „Vizualizuok šią darbo eigą: naujas potencialus klientas iš svetainės formos, įtraukiamas į CRM, pardavimų komanda gauna Slack pranešimą"
- „Sudaryk šios sistemos schemą: Claude rašo juodraščius, Grammarly tikrina, Google Docs naudojamas peržiūrai"
- „Nubraižyk mano darbo eigos diagramą: tikrinti el. laiškus, skirstyti į skubius ir neskubius, nukreipti į Slack ar Notion"

## Patarimai Geriausiems Rezultatams

- Aprašyk savo darbo eigą žingsnis po žingsnio paprasta kalba
- Paminėk kiekvieną dalyvaujantį įrankį ar paslaugą jos vardu
- Įtrauk visas sąlygas ar šakas („jei X, tada Y, kitaip Z")
- Kuo daugiau detalių pateiksi, tuo tikslesnė bus diagrama
