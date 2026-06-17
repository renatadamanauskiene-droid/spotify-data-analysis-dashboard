---
name: slide-deck-builder
description: Generuoti vizualias skaidrių pateiktis su turtingais komponentais
triggers:
  - sukurk skaidrių pateiktį
  - paruošk skaidres
  - sudaryk prezentaciją
  - sugeneruok skaidres
---

# Skaidrių Pateikčių Kūrimo Įrankis

Generuoja gražias, savarankiškas HTML skaidrių pateiktis su turtingais vizualiniais komponentais. Nereikia PowerPoint, nereikia Google Slides, nėra priklausomybių. Tiesiog atidaryk HTML failą naršyklėje ir pristatyk.

## Kaip Tai Veikia

Kai pasakai „sukurk skaidrių pateiktį apie [tema]" arba „paruošk skaidres [prezentacijai]", šis įgūdis sukuria pilną HTML failą su per visą ekraną rodomomis skaidrėmis, navigacija klaviatūra ir išpuoselėtais vizualiniais komponentais.

## Skaidrių Struktūra

Kiekviena pateiktis seka šia patikrinta struktūra:

| Skaidrė | Tikslas | Turinys |
|-------|---------|---------|
| **1. Antraštė** | Nustatyti toną | Didelis pavadinimas, paantraštė, tavo vardas ar prekės ženklas |
| **2. Įvadas** | Apibrėžti problemą ar kontekstą | Kodėl tai svarbu, ko klausytojai sužinos |
| **3-8. Pagrindinis turinys** | Pateikti esmę | Viena idėja vienoje skaidrėje, kiekviena su vizualiniu komponentu |
| **9. Įrodymai** | Pagrįsti savo teiginį | Statistika, citatos, atvejų analizės, pavyzdžiai |
| **10. Apibendrinimas** | Įtvirtinti pagrindinę žinutę | Santrauka, kvietimas veikti, kiti žingsniai |

Pagrindinio turinio skaidrių skaičių pritaikyk pagal temos sudėtingumą. Paprastos temos: 5-7 skaidrės iš viso. Sudėtingos temos: 10-15 skaidrių. Niekada neviršyk 15 skaidrių.

## Vizualiniai Komponentai

Kiekviena skaidrė BŪTINAI turi turėti vizualinį komponentą. Skaidrės, kuriose yra tik tekstas, neleidžiamos. Rinkis iš:

### Kortelių Tinklelis
2-4 kortelės eilutėje, kiekviena su piktograma/emoji, pavadinimu ir vienos eilutės aprašymu. Naudoti: funkcijoms, privalumams, kategorijoms.

### Palyginimo Skydelis
Du stulpeliai vienas prie kito su „vs" skirtuku. Naudoti: senas vs naujas, įrankis A vs įrankis B, prieš vs po.

### Statistikos Akcentas
Vienas didelis skaičius ar procentas su trumpa etikete žemiau. Naudoti: įspūdingiems duomenų taškams, augimo skaičiams, sąnaudoms.

### Žingsnių Eiga
Horizontalūs ar vertikalūs numeruoti žingsniai su rodyklėmis tarp jų. Naudoti: procesams, vadovėliams, veikimo principui.

### Citatos Blokas
Didelės kabutės, kursyvu rašytas tekstas, autorystė žemiau. Naudoti: atsiliepimams, ekspertų citatoms, svarbiems teiginiams.

### Piktogramos + Etiketės Sąrašas
Vertikalus sąrašas su emoji ar piktogramomis kairėje, etiketėmis dešinėje. Naudoti: funkcijų sąrašams, darbotvarkėms, kontroliniams sąrašams.

### Kodo Blokas
Lygiapločiu šriftu rašytas tekstas tamsioje kortelėje su sintaksės stiliaus spalvinimu. Naudoti: kodo pavyzdžiams, komandinei eilutei, konfigūracijos failams.

### Laiko Skalė
Horizontali linija su taškais ir etiketėmis virš ir žemiau. Naudoti: istorijai, planui, projekto etapams.

### Vaizdas + Antraštė
Centruotas vaizdo vietos rezervavimo elementas su antrašte žemiau. Naudoti: ekrano nuotraukoms, diagramoms, produktų nuotraukoms.

### Metrikų Suvestinė
3-4 statistikos langeliai eilutėje, kiekvienas su etikete ir reikšme. Naudoti: KPI rodikliams, našumo duomenims, palyginimams.

## HTML Išvestis

Sugeneruok vieną savarankišką HTML failą. Be išorinių šriftų, CDN nuorodų ar vaizdų. Visa integruota tiesiogiai į failą.

**Maketas:** Per visą ekraną rodomos skaidrės (100vw x 100vh), centruotas turinys, maksimalus plotis 900px, 60px užpildymas.

**Spalvos:** Fonas `#0a0a0a`, tekstas `#ffffff`, antrinis tekstas `#a0a0a0`, kortelės `#1a1a1a`, kraštinės `#2a2a2a`, plius viena akcentinė spalva kiekvienai pateikčiai.

**Tipografija:** Antraštės — pusjuodis sans-serif šriftas 48-64px, pagrindinis tekstas 24-28px, statistikos skaičiai 72-96px akcentine spalva, kodas lygiapločiu šriftu 18px.

**Navigacija:** Rodyklių klavišai skaidrėms keisti, skaitliukas dešiniame apatiniame kampe, sklandūs perėjimai, neprivalomas perėjimas paspaudus.

## Turinio Taisyklės

1. **Viena idėja vienoje skaidrėje.** Jei turi du teiginius, sukurk dvi skaidres
2. **Maksimaliai 30 žodžių skaidrėje.** Skaidrės yra vizualinė priemonė, ne dokumentas
3. **Kiekviena skaidrė turi vizualinį komponentą.** Be išimčių. Žr. sąrašą aukščiau
4. **Vienoda akcentinė spalva.** Pasirink vieną akcentą ir naudok jį visiems akcentams, mygtukams ir pabrėžimams
5. **Be punktų sąrašų krūvos.** Jei reikia punktų, naudok Piktogramos + Etiketės Sąrašo komponentą
6. **Didelis tekstas geriau nei mažas.** Kai nesi tikras, daryk didesnį
7. **Tuščia erdvė — tavo draugas.** Perkrautos skaidrės atbaido auditoriją

## Akcentinės Spalvos Pasirinkimas

Pasirink akcentinę spalvą pagal temos sritį:

| Temos Sritis | Rekomenduojamas Akcentas | Hex |
|-----------|-----------------|-----|
| AI / Technologijos | Elektrinė mėlyna | `#3B82F6` |
| Verslas | Šilta gintaro | `#F59E0B` |
| Dizainas | Koralinė rožinė | `#F43F5E` |
| Finansai | Smaragdo žalia | `#10B981` |
| Sveikata | Švelni žalsvai mėlyna | `#14B8A6` |
| Švietimas | Karališka violetinė | `#8B5CF6` |
| Marketingas | Ryški oranžinė | `#F97316` |
| Bendra | Švarus baltas akcentas tamsiame fone | `#E5E5E5` |

## Naudojimo Pavyzdžiai

- „Sukurk skaidrių pateiktį apie tai, kaip veikia AI agentai"
- „Paruošk skaidres mano komandos susitikimui apie Q1 rezultatus"
- „Sudaryk prezentaciją, paaiškinančią mūsų naują produktą"
- „Sugeneruok skaidres 5 minučių pranešimui apie užklausų inžineriją"

## Patarimai Geriausiems Rezultatams

- Nurodyk, kiek skaidrių nori, ir tankis bus pritaikytas atitinkamai
- Paminėk savo auditoriją, kad turinio lygis būtų pritaikytas
- Pasidalink savo prekės ženklo spalva, ir ji taps akcentu
- Paprašyk pranešėjo pastabų, jei norite kalbėjimo punktų kartu su kiekviena skaidre
- HTML failas veikia be interneto -- pristatymui internetas nereikalingas
