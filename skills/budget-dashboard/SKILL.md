---
name: budget-dashboard
description: Sugeneruokite interaktyvų finansinį skydelį kaip savarankišką HTML failą su Apple Swiss dizainu. Apima šliaužiklius pajamoms ir išlaidoms koreguoti realiuoju laiku, žiedinę diagramą su detalizacija, 12 mėnesių taupymo prognozę su investavimo scenarijais, etapų sekimą ir palyginimą su gairėmis. Naudokite šį įgūdį, kai naudotojas sako „biudžeto skydelis", „finansinis skydelis", „interaktyvus biudžetas", „biudžeto programa", „vizualizuok mano biudžetą", „biudžeto planuoklis", „kur dingsta mano pinigai", „taupymo skydelis" arba bet kokį variantą, kai norima vizualiai pamatyti savo finansus.
triggers:
  - biudžeto skydelis
  - finansinis skydelis
  - interaktyvus biudžetas
  - biudžeto programa
  - vizualizuok mano biudžetą
  - biudžeto planuoklis
  - padėk man susiplanuoti biudžetą
  - kur dingsta mano pinigai
  - taupymo skydelis
  - parodyk mano finansus
---

# Biudžeto skydelis

Sukurkite interaktyvų, savarankišką HTML finansinį skydelį su **Apple Swiss dizaino estetika** — švarūs balti fonai, SF stiliaus tipografija (naudokite Instrument Sans + Newsreader iš Google Fonts), gausus tuščias plotas, švelnūs šešėliai, piliulės formos mygtukai ir Apple sistemos spalvos (#34c759 žalia, #007aff mėlyna, #ff2d55 rožinė, #ff9500 oranžinė, #af52de violetinė).

## Kas pateikiama

Vienas HTML failas, kurį naudotojas gali atidaryti bet kurioje naršyklėje. Visa atnaujinama realiuoju laiku, kai jis tampo šliaužiklius. Nėra back-end, nėra priklausomybių, išskyrus Chart.js iš CDN.

## Reikalingos funkcijos

1. **Viršutinės statistikos kortelės** (4 iš eilės) — Pajamos, Išlaidos, Santaupos, Taupymo norma — kiekviena su piktograma, reikšme ir paantrašte
2. **Šliaužiklių skydelis** — Šliaužikliai pajamoms ir kiekvienai išlaidų kategorijai. Kiekvienas šliaužiklis rodo dabartinę reikšmę ir diapazoną. Visi šliaužikliai sukelia `update()` įvykdami input veiksmą.
3. **Žiedinė diagrama** — Rodo išlaidų detalizaciją + santaupas kaip didžiausią segmentą. Centro tekstas rodo taupymo normą procentais. Naudoja Chart.js doughnut.
4. **Legenda** — Spalvomis pažymėtas sąrašas šalia žiedinės diagramos su kategorijų pavadinimais, sumomis doleriais ir procentais.
5. **12 mėnesių prognozės diagrama** — Linijinė diagrama (Chart.js) su 3 scenarijų perjungimo mygtukais: „Tiesiog taupau" (0% grąža), „Aukšto pajamingumo taupymo sąskaita" (4,5% metinė norma), „Investuoju" (7% metinė grąža). Diagramos spalva keičiasi pagal scenarijų.
6. **Etapai (milestones)** — Pažangos juostos siekiant: Avarinis fondas 3 mėn., Avarinis fondas 6 mėn., 100 000 USD, 250 000 USD. Kiekviena rodo numatomą pasiekimo laiką mėnesiais/metais.
7. **Palyginimas su gairėmis** — Būstas, Maistas, Santaupos, Norai prieš standartines gaires (50/30/20 taisyklė). Vizualinė juosta su gairės žymekliu.
8. **Įžvalgų laukelis** — Dinamiškas tekstas, kuris keičiasi pagal taupymo normą (skirtingi pranešimai <20%, 20–50%, 50%+ ir neigiamai normai).

## Instrukcijos

### 1 žingsnis: surinkite skaičius

Paklauskite (arba padėkite įvertinti):

**Asmeniniam biudžetui:**
- Bendros mėnesinės pajamos (po mokesčių)
- Fiksuotos išlaidos (nuoma, komunaliniai mokesčiai, draudimas, prenumeratos, paskolų mokėjimai)
- Kintamos išlaidos (maistas, kuras, pramogos, apsipirkimas)
- Dabartinė taupymo norma
- Bet kokie skolų mokėjimai
- Finansiniai tikslai

**Verslo biudžetui:**
- Mėnesinės pajamos
- Fiksuotos sąnaudos (nuoma, programinė įranga, atlyginimai, draudimas)
- Kintamos sąnaudos (rinkodara, rangovai, atsargos, kelionės)
- Investicijos į augimą
- Mokesčiams atidedama procentinė dalis
- Pelno tikslai

### 2 žingsnis: sukurkite skydelį

Sugeneruokite savarankišką HTML failą su visu CSS įterptu (`<style>` žymoje) ir visu JS įterptu (`<script>` žymoje). Importuokite Chart.js iš CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
```

Importuokite šriftus iš Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600&display=swap" rel="stylesheet">
```

### 3 žingsnis: dizaino taisyklės (Apple Swiss)

- **Fonas**: #f5f5f7 (Apple šviesiai pilka)
- **Kortelės**: #ffffff su border-radius: 20px, švelnus šešėlis (0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04))
- **Tipografija**: Instrument Sans pagrindiniam tekstui/sąsajai, Newsreader (serif) didiems skaičiams ir antraštėms
- **Spalvos**: naudokite Apple sistemos spalvas — žalia #34c759, mėlyna #007aff, rožinė #ff2d55, oranžinė #ff9500, violetinė #af52de, žalsvai mėlyna #5ac8fa
- **Šliaužikliai**: švarūs balti slankikliai su mėlyna kraštine, plonos 4px takeliai
- **Mygtukai**: piliulės formos (border-radius: 100px), aktyvi būsena užpildoma mėlyna spalva
- **Tarpai**: gausūs — 24–28px kortelės vidiniai laukai, 16px tinklelio tarpai
- **Animacijos**: subtilus fadeIn įkeliant, su pavėluotais (staggered) intervalais
- **Užvedimo (hover) būsenos**: kortelės šiek tiek pakyla su sustiprintu šešėliu
- **Be tamsiojo režimo** — palikite šviesų ir švarų

### 4 žingsnis: užpildykite naudotojo skaičiais

Nustatykite šliaužiklių numatytąsias reikšmes ir state objektą, kad atitiktų naudotojo tikrąsias pajamų ir išlaidų reikšmes. Visi šliaužikliai turėtų turėti tinkamus min/max diapazonus (pvz., pajamos 2 tūkst.–30 tūkst., nuoma 0–5 tūkst.).

### 5 žingsnis: išsaugokite ir pateikite

Išsaugokite kaip: `financial-dashboard.html`

Failas turi būti visiškai savarankiškas — atidarius jį bet kurioje naršyklėje, turėtų rodytis pilnas interaktyvus skydelis be jokių kitų priklausomybių.

### 6 žingsnis: patikrinkite

Dar kartą patikrinkite:
- Visa matematika susideda (pajamos − išlaidos = santaupos)
- Žiedinės diagramos procentai sudaro 100%
- Prognozės diagrama naudoja teisingas sudėtinių palūkanų formules
- Etapų pasiekimo laikai apskaičiuoti teisingai
- Visi šliaužikliai atnaujina visą informaciją realiuoju laiku

## Taisyklės

- Niekada neteikite konkrečių investavimo patarimų. Biudžeto vizualizacija – gerai. „Įdėk pinigus į X akciją" – ne.
- Įtraukite mažą footer pastabą, kad tai planavimo įrankis, o ne finansinė konsultacija.
- Visada dar kartą patikrinkite matematiką. Biudžeto sumos turi susidėti teisingai.
- Jei naudotojas pasidalija jautriais finansiniais duomenimis, elkitės su jais atsargiai ir neišsaugokite jų atmintyje.
- Apvalinkite iki sveikų dolerių.
