---
name: visual-page-builder
description: Generuoti gražius, savarankiškus HTML puslapius, kurie vizualiai paaiškina bet kokią koncepciją
triggers:
  - vizualus paaiškinimas
  - paaiškink tai vizualiai
  - sukurk vizualų puslapį
  - sudaryk html aiškinamąjį puslapį
---

# Vizualaus Puslapio Kūrimo Įrankis

Generuoja išpuoselėtą, savarankišką HTML puslapį, kuris paaiškina bet kokią koncepciją naudojant vizualinius komponentus. Be karkasų, be priklausomybių, be kūrimo etapo. Vienas failas, kuris atrodo kaip tikras produkto puslapis.

## Puslapių Tipai

| Tipas | Geriausiai tinka | Pagrindiniai komponentai |
|------|----------|---------------|
| **Architektūros Apžvalga** | Sistemoms, technologijų rinkiniams, infrastruktūrai | Eigos diagrama, jungiamosios linijos, komponentų kortelės |
| **Palyginimo Lentelė** | Įrankis vs įrankis, planas vs planas, prieš vs po | Tinkleliai vienas prie kito, varnelės, nugalėtojo paryškinimas |
| **Procesų Eiga** | Vadovėliams, įvadiniams kursams, instrukcijoms | Numeruoti žingsniai, rodyklės, būsenos indikatoriai |
| **Laiko Skalė** | Planams, projekto istorijai, pakeitimų sąrašams | Vertikali laiko skalė, datų žymės, etapų kortelės |
| **Suvestinė** | Metrikoms, KPI rodikliams, našumo santraukoms | Statistikos kortelės, juostinės diagramos, pažangos žiedai |
| **Koncepcijos Aiškintuvas** | Abstrakčioms idėjoms, karkasams, mentaliniams modeliams | Analogijų vaizdai, sluoksniuotos diagramos, pažymėjimo langeliai |
| **Projekto Apžvalga** | Projekto pabaigos santraukoms, atvejų analizėms | Prieš/po, statistika, atsiliepimų kortelės, galerija |

Paklausk naudotojo, kuris tipas geriausiai atitinka jo turinį, arba nustatyk automatiškai pagal jo aprašymą.

## Darbo Eiga

### 1 žingsnis: Surinkti Turinį

Paklausk naudotojo:
- **Puslapio pavadinimo**
- **3-6 skyrių**, kuriuos jis norėtų aprėpti (arba leisk pasiūlyti pagal temą)
- **Pagrindinių duomenų taškų** (skaičiai, statistika, palyginimai)
- **Sąsajų** tarp koncepcijų (kas su kuo susijęs)
- **Hierarchijos** (kas svarbiausia, kas papildoma detalė)

Jei naudotojas pateikia dokumentą, transkripciją ar užrašus, automatiškai išgauk šiuos elementus ir patvirtink.

### 2 žingsnis: Suplanuoti Maketą

Priskirk kiekvieną skyrių vizualiniam komponentui (žr. Vizualiniai Komponentai žemiau). Pristatyk planą:

```
1 skyrius: „Kas yra X" -> Koncepcijos kortelė su piktograma + 3 pagrindiniai punktai
2 skyrius: „Kaip tai veikia" -> 4 žingsnių proceso eiga su rodyklėmis
3 skyrius: „Našumas" -> Statistikos kortelės (3 eilutėje) + palyginimo tinklelis
4 skyrius: „Pradėti" -> Pažymėjimo langelis su kvietimu veikti
```

Gauk naudotojo patvirtinimą prieš kuriant.

### 3 žingsnis: Sukurti HTML

Sugeneruok vieną savarankišką HTML failą.

**Dizaino Sistema:**

| Žymuo | Reikšmė |
|-------|-------|
| Fonas | `#0f0f10` |
| Paviršius | `#1a1a1d` |
| Paviršiaus kraštinė | `#2a2a2d` |
| Pagrindinis tekstas | `#ffffff` |
| Antrinis tekstas | `#a0a0a0` |
| Akcentas | `#D97757` (arba naudotojo pasirinktas) |
| Pritemdytas akcentas | `rgba(217, 119, 87, 0.15)` |
| Šriftas | Inter per Google Fonts, atsarginis variantas `system-ui, sans-serif` |
| Maksimalus plotis | `1000px` |
| Kortelės kampų spindulys | `12px` |
| Skyrių tarpas | `80px` vertikaliai |

**Galimi Vizualiniai Komponentai:**

| Komponentas | Kada naudoti | Struktūra |
|-----------|-------------|-----------|
| **Statistikos kortelės** | Pagrindiniams skaičiams | Horizontali eilutė, didelis skaičius + etiketė + neprivaloma tendencijos rodyklė |
| **Skyriaus kortelės** | Funkcijų sąrašams, sugrupuotai informacijai | Kortelių tinklelis su piktograma/emoji, pavadinimu, aprašymu |
| **Palyginimo tinklelis** | Analizei vienas prieš kitą | 2-3 stulpeliai, eilutės su varnelėmis ar reikšmėmis |
| **Eigos žingsniai** | Sekos procesams | Numeruoti apskritimai, sujungti linijomis, pavadinimas + aprašymas |
| **Būsenos ženkleliai** | Žymoms, kategorijoms, būsenoms | Spalvoti piliulės formos ženkleliai (žalia/geltona/raudona/mėlyna) |
| **Kodo blokai** | Techniniam turiniui, konfigūracijoms | Tamsus fonas, lygiapločio šrifto, sintaksės paryškinimas, jei tinka |
| **Pažymėjimo langeliai** | Svarbioms pastaboms, įspėjimams, patarimams | Akcentinė kraštinė kairėje, piktograma, paryškintas fonas |
| **Pažangos juostos** | Užbaigimui, talpai, įverčiams | Horizontali juosta su užpildymo procentu ir etikete |
| **Lentelės** | Struktūrizuotiems duomenims, specifikacijoms | Dryžuotos eilutės, prisegta antraštė, slenkamas turinys mobiliesiems |
| **Laiko skalės** | Chronologiniams įvykiams | Vertikali linija su taškais, alternuojančios kortelės kairėje/dešinėje |
| **Citatų blokai** | Atsiliepimams, svarbiems teiginiams | Didelis kabučių ženklas, kursyvu rašytas tekstas, autorystė |
| **Piktogramų tinkleliai** | Funkcijų apžvalgoms, įrankių sąrašams | 2-3 stulpelių tinklelis su emoji + pavadinimu + vienos eilutės aprašymu |

### 4 žingsnis: Išsaugoti ir Peržiūrėti

Išsaugok failą kaip `[temos-slug]-visual.html` esamame darbiniame kataloge.

Atidaryk numatytojoje naršyklėje:
```bash
open [temos-slug]-visual.html
```

### 5 žingsnis: Tobulinti

Paklausk: „Kaip atrodo? Galiu pakeisti spalvas, sukeisti komponentus, pridėti skyrių ar pakeisti bet kokį tekstą."

Dažni pakeitimai:
- Akcentinės spalvos pakeitimas
- Skyrių pridėjimas ar pašalinimas
- Komponento tipo sukeitimas (pvz., lentelė į palyginimo tinklelį)
- Teksto turinio koregavimas
- Logotipo ar antraštės vaizdo pridėjimas (base64 integruotas)

## Taisyklės

- **Kiekvienam skyriui reikia vizualinio komponento.** Joks skyrius neturėtų būti vien teksto siena. Jei akivaizdaus vizualinio sprendimo nėra, naudok pažymėjimo langelį ar piktogramų tinklelį.
- **Maksimaliai 50 žodžių prieš vizualinį elementą.** Skyriaus įžanginis tekstas turi būti trumpas. Tegul vizualinis elementas atlieka pagrindinį darbą.
- **Visas CSS ir JS integruotas.** Nulis išorinių priklausomybių. Failas turi veikti, kai jį atidari dukart spustelėjus iš darbalaukio, be serverio.
- **Nulis reikalingų išorinių užklausų.** Google Fonts yra vienintelė leidžiama išimtis (su sistemos šrifto atsarginiu variantu). Visa kita integruota.
- **Pritaikytas mobiliesiems.** Turi gerai atrodyti mobiliajame įrenginyje (tinkleliai sutraukiami į vieną stulpelį, statistikos kortelės sumažinamos, lentelės slenkamos).
- **JavaScript turiniui nereikalingas.** JS naudojamas tik neprivalomiems patobulinimams (sklandus slinkimas, atsiradimo animacijos). Puslapis turi būti visiškai skaitomas su išjungtu JS.
- **Vienodi tarpai.** Naudok dizaino sistemos žymenis. Nespėliok užpildymo ar paraščių dydžių.
- **Tik tamsi tema.** Nesiūlyk šviesios temos. Tamsi paletė yra prekės ženklo dalis.
- **Pritaikytas prieinamumui.** Pakankamas spalvų kontrastas (mažiausiai WCAG AA), semantinis HTML, alt tekstas vaizdams.
- Bendras failo dydis turi būti mažesnis nei 500KB. Jei integruoji vaizdus, pirmiausia juos suspausk.
- Puslapio pavadinimas turi būti rodomas naršyklės skirtuke (title žyma).
