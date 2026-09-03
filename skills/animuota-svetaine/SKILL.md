---
name: animuota-svetaine
description: Paverskite bet kokį vaizdo įrašą prabangia, slinkimo animacijomis paremta svetaine su paralakso efektais
triggers:
  - animuota svetainė iš šio video
  - slinkimo animacijos svetainė
  - padaryk svetainę iš šio video
---

# Animuota svetainė iš vaizdo įrašo

Paverskite bet kokį MP4 vaizdo įrašą įspūdinga, slinkimu valdoma animuota svetaine su paralakso efektais, stiklo morfizmo kortelėmis ir kino kokybės blizgesiu. Viena komanda, vienas HTML failas, jokių priklausomybių.

## Reikalavimai

- Įdiegtas ir PATH kintamajame pasiekiamas **FFmpeg**
- **Python 3** (vietinei peržiūros serverio paleisčiai)
- Naudotojo pateiktas **MP4 vaizdo įrašo failas**

## Darbo eiga

### 1 žingsnis: vaizdo įrašo analizė

Paleiskite `ffprobe` su pateiktu MP4 failu, kad išgautumėte:
- Bendrą trukmę (sekundėmis)
- Kadrų dažnį (fps)
- Skiriamąją gebą (plotis x aukštis)
- Bendrą kadrų skaičių

Praneškite šią statistiką naudotojui prieš tęsdami.

### 2 žingsnis: kadrų išgavimas

Išgaukite kadrus iš vaizdo įrašo 2 fps dažniu (arba pakoreguokite pagal trukmę, kad bendras kadrų skaičius neviršytų 120).

```bash
# Darbalaukio kadrai (1920x1080 WebP, kokybė 80)
ffmpeg -i INPUT.mp4 -vf "fps=2,scale=1920:1080" -c:v libwebp -quality 80 frames/desktop_%04d.webp

# Mobiliojo įrenginio kadrai (960x540 WebP, kokybė 70)
ffmpeg -i INPUT.mp4 -vf "fps=2,scale=960:540" -c:v libwebp -quality 70 frames/mobile_%04d.webp
```

Laikinai saugokite kadrus `frames/` kataloge prie išvesties failo.

### 3 žingsnis: skyrių turinio generavimas

Analizuokite vaizdo įrašo kontekstą (failo pavadinimą, naudotojo aprašymą ar bet kokią pateiktą užduotį) ir sugeneruokite turinį **6 slinkimo skyriams**:

| Skyrius | Tikslas | Reikalingas turinys |
|---------|---------|---------------|
| **Hero** | Pilno ekrano įžanga | Antraštė, paantraštė, CTA mygtuko tekstas |
| **Funkcijos** | Pagrindinės galimybės | 3–4 funkcijų kortelės su piktograma, pavadinimu, aprašymu |
| **Statistika** | Socialinis įrodymas / skaičiai | 3–4 animuoti statistikos skaitikliai su etiketėmis |
| **Kaip tai veikia** | Proceso išskaidymas | 3–5 numeruoti žingsniai su trumpais aprašymais |
| **Galerija** | Vizualinė vitrina | Paralakso vaizdų tinklelis su antraštėmis |
| **CTA** | Galutinis konversijos kvietimas | Antraštė, pagrindinis tekstas, mygtuko tekstas, mygtuko URL |

Pateikite turinio juodraštį naudotojui patvirtinti prieš kuriant.

### 4 žingsnis: HTML failo kūrimas

Sugeneruokite vieną savarankišką HTML failą, kuriame visi resursai įterpti base64 formatu:

**Slinkimo animacijos variklis:**
- Canvas elementas atvaizduoja kadrus, sinchronizuotus su slinkimo padėtimi
- `requestAnimationFrame` ciklas sklandžiam atkūrimui
- Kadrų išankstinis įkėlimas su pažangos indikatoriumi
- Adaptyvus lūžio taškas keičia darbalaukio/mobiliojo kadrų rinkinius

**Vizualiniai efektai:**
- Aplinkos plūduriuojančios dalelės (subtilios, lėtai judančios, mažo nepermatomumo)
- Filmo grūdėtumo perdanga (CSS triukšmo animacija)
- Stiklo morfizmo kortelės (`backdrop-filter: blur(16px)`, pussskaidrus fonas)
- Raidžių išskaidymo teksto animacijos (kiekvienas simbolis pasirodo paeiliui slenkant)
- Paralakso galerija (sluoksniai juda skirtingu slinkimo greičiu)
- Navigacijos taškai, pritvirtinti dešiniajame krašte (paryškina aktyvų skyrių)

**Dizaino žetonai (design tokens):**
- Fonas: `#0a0a0b`
- Pagrindinis tekstas: `#ffffff`
- Antrinis tekstas: `rgba(255,255,255,0.6)`
- Akcentas: naudotojo pasirinktas arba numatytasis `#D97757`
- Kortelės fonas: `rgba(255,255,255,0.05)`
- Kortelės kraštinė: `rgba(255,255,255,0.1)`
- Šriftas: Inter (įkeltas iš Google Fonts) arba sisteminis sans-serif atsarginis variantas
- Kraštų apvalinimas: `16px` kortelėms, `999px` mygtukams

**Struktūra:**
```
- Pažangos juosta (viršuje, fiksuota)
- Navigacijos taškai (dešinėje, fiksuoti)
- 1 skyrius: Hero (visas ekranas, canvas fonas)
- 2 skyrius: Funkcijos (stiklo kortelių tinklelis)
- 3 skyrius: Statistika (animuoti skaitikliai)
- 4 skyrius: Kaip tai veikia (numeruoti žingsniai)
- 5 skyrius: Galerija (paralakso tinklelis)
- 6 skyrius: CTA (centruotas, didelis)
- Footer (minimalus)
```

Išsaugokite rezultatą kaip `animated-site-[tema].html` esamame darbiniame kataloge.

### 5 žingsnis: peržiūros paleidimas

Paleiskite vietinį Python serverį ir atidarykite numatytoje naršyklėje:

```bash
python3 -m http.server 8888 &
open http://localhost:8888/animated-site-[tema].html
```

## Pritaikymo galimybės

Po pradinio sukūrimo pasiūlykite šiuos patobulinimus:

| Parinktis | Ką tai pakeičia |
|--------|----------------|
| **Slinkimo greitis** | Kadrai vienam slinkimo pikseliui (numatyta: 0,5) |
| **Akcentinė spalva** | Pagrindinė paryškinimo spalva (numatyta: #D97757) |
| **Skyriaus tekstas** | Bet kokia antraštė, aprašymas ar CTA tekstas |
| **Logotipas** | Pridėti logotipo vaizdą į hero ir navigaciją |
| **Šriftas** | Pakeisti Inter kitu Google Font šriftu |
| **Kadrų tankis** | Daugiau ar mažiau išgaunamų kadrų (veikia failo dydį) |
| **Skyriai** | Pridėti, pašalinti ar pertvarkyti 6 skyrius |

## Taisyklės

- VISI resursai turi būti įterpti (base64 data URI). Galutinis HTML turi veikti neprisijungus prie interneto, neatliekant jokių išorinių užklausų (išskyrus nebūtiną Google Font).
- Bendras failo dydis turi būti mažesnis nei 50 MB. Jei kadrai jį viršija, sumažinkite kadrų skaičių arba kokybę.
- Kiekvienas skyrius turi būti bent 100vh aukščio, kad slinkimo animacijoms būtų vietos atsiskleisti.
- Patikrinkite, kad navigacijos taškai teisingai paryškina aktyvų skyrių.
- Pritaikymas mobiliesiems: kortelės sukraunamos vertikaliai, žemiau 768px naudojamas mobiliojo įrenginio kadrų rinkinys.
- Jei FFmpeg neįdiegtas, pasakykite naudotojui, kaip jį įdiegti, ir sustokite.
- Niekada neišgalvokite vaizdo įrašo turinio. Jei negalite nustatyti, apie ką yra vaizdo įrašas, paprašykite naudotojo jį aprašyti.
