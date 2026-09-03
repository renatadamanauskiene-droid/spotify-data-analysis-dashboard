---
name: ryto-apzvalga
description: Kasdienė pramonės apžvalga su geriausiomis turinio galimybėmis ir skubumo lygiais
triggers:
  - rytinė apžvalga
  - dienos apžvalga
  - ką turėčiau filmuoti šiandien
  - pradėk mano dieną
---

# Rytinė Apžvalga

Kasdienė pramonės apžvalga, kuri atskleidžia geriausias turinio galimybes jūsų nišoje, įvertintas balais ir surikiuotas su skubumo lygiais, kad tiksliai žinotumėte, ką filmuoti šiandien.

## Instrukcijos

### 1 žingsnis: Nustatyti vartotojo nišą

Patikrinkite CLAUDE.md, ar jame yra vartotojo niša, auditorija ir turinio kryptis. Jei CLAUDE.md egzistuoja ir jame yra ši informacija, naudokite ją ir tęskite.

Jei niša nenustatyta, užduokite lygiai vieną klausimą:
> „Kokią nišą ar pramonės sritį turėčiau apžvelgti? (pvz., AI įrankiai, fitnesas, kulinarija, asmeniniai finansai, SaaS)"

Tęskite tik tada, kai turėsite aiškią nišą.

### 2 žingsnis: Ištirti dabartinę situaciją

Naudokite WebSearch, kad ištirtumėte šias sritis vartotojo nišoje. Atlikite bent 4-5 paieškas šiose kategorijose:

1. **Naujausios žinios** — Produktų pristatymai, svarbūs atnaujinimai, įmonių pranešimai per pastarąsias 24-48 valandas
2. **Populiarios diskusijos** — Apie ką žmonės dabar kalba socialiniuose tinkluose, Reddit, forumuose ir YouTube
3. **Konkurentų veikla** — Apie ką šiandien rašo geriausi šios nišos kūrėjai? Kas sulaukia daugiausia įsitraukimo?
4. **Paieškos tendencijos** — Ko žmonės aktyviai ieško? Ar yra susidomėjimo pokyčių?
5. **Artėjantys įvykiai** — Pristatymai, konferencijos, terminai ar sezoniniai momentai per ateinančias 7 dienas

Užsirašykite visus radinius. Reikia bent 8-10 neapdorotų radinių prieš vertinimą.

### 3 žingsnis: Įvertinti kiekvieną radinį

Įvertinkite kiekvieną radinį pagal šiuos 6 kriterijus:

| Kriterijus | Skalė | Ką matuoja |
|---|---|---|
| Populiarumas | 1-5 | Kiek dėmesio tai sulaukia dabar? |
| Auditorijos atitiktis | 1-5 | Kiek tai aktualu konkrečiai vartotojo auditorijai? |
| Laikinumas | 1-3 | Kiek tai laikui jautru? (3 = tik šiandien, 1 = nesensta) |
| Turinio trūkumas | 1-3 | Ar kiti kūrėjai jau gerai tai aptaria? (3 = niekas, 1 = perpildyta) |
| Vizualinis potencialas | 1-3 | Ar tai galima įtikinamai parodyti ekrane? |
| Pasiekiamumas | 1-3 | Ar vartotojas realiai gali sukurti šį vaizdo įrašą šiandien? (3 = lengva, 1 = reikia įrangos/prieigos) |

**Maksimalus balas: 22 taškai**

Atmeskite kiekvieną radinį, kurio balas mažesnis nei 12. Rodykite tik radinius, kurių balas 12 ar daugiau.

### 4 žingsnis: Sukurti apžvalgą

Pateikite apžvalgą tiksliai šiuo formatu:

```
# Rytinė apžvalga — [Data]
**Niša:** [Vartotojo niša]
**Apžvelgti šaltiniai:** [Skaičius] iš naujienų, socialinių tinklų, paieškos tendencijų, konkurentų

---

## Top 3 galimybės

### 1. [Temos pavadinimas]
**Balas:** XX/22 | **Skubumas:** [emoji]
**Kas atsitiko:** [2-3 sakinių naujienos/tendencijos santrauka]
**Kodėl tai svarbu jūsų auditorijai:** [1 sakinys, susiejantis su jų žiūrovais]
**Hook idėja:** „[Paruoštas naudoti įžanginis sakinys]"
**Turinio kampas:** [Kaip pateikti vaizdo įrašą — pamoka, reakcija, aiškinimas ir pan.]

### 2. [Temos pavadinimas]
**Balas:** XX/22 | **Skubumas:** [emoji]
**Kas atsitiko:** [2-3 sakinių santrauka]
**Kodėl tai svarbu jūsų auditorijai:** [1 sakinys]
**Hook idėja:** „[Įžanginis sakinys]"
**Turinio kampas:** [Kaip tai pateikti]

### 3. [Temos pavadinimas]
**Balas:** XX/22 | **Skubumas:** [emoji]
**Kas atsitiko:** [2-3 sakinių santrauka]
**Kodėl tai svarbu jūsų auditorijai:** [1 sakinys]
**Hook idėja:** „[Įžanginis sakinys]"
**Turinio kampas:** [Kaip tai pateikti]
```

**Skubumo lygiai:**
- 🔴 **Filmuoti šiandien** — Tai laikui jautru. Palaukus net 24 valandas, prarasite bangą.
- 🟡 **Filmuoti šią savaitę** — Populiaru, bet su ilgesniu laiko langu. 3-5 dienos, kol atvėsta.
- 🟢 **Nesenstanti galimybė** — Nėra laikui jautru, bet turi didelį potencialą. Įtraukite į eilę.

### 5 žingsnis: Greitų aktualijų skiltis

Po top 3 įtraukite „Greitos aktualijos" skiltį su 3-5 mažesniais radiniais, kurie nepatenka į top 3, bet vis tiek verti dėmesio. Po viena eilutę kiekvienam.

```
## Greitos aktualijos
- [Trumpas radinys 1 — kas tai yra ir kodėl tai pastebėtina]
- [Trumpas radinys 2]
- [Trumpas radinys 3]
- [Trumpas radinys 4]
```

### 6 žingsnis: Rekomendacija

Užbaikite aiškia, konkrečia nuomone pagrįsta rekomendacija:

```
## Mano rekomendacija
[1-2 sakiniai, tiksliai nurodantys vartotojui, ką filmuoti pirmiausia ir kodėl. Būkite tiesūs. Nesvyruokite.]
```

### 7 žingsnis: Pasiūlyti kitus žingsnius

Pateikę apžvalgą, paklauskite:
> „Norite, kad parašyčiau pilną scenarijų bet kuriai iš šių temų, sugeneruočiau hook variantų, ar giliau panagrinėčiau konkrečią temą?"

## Taisyklės

- Visada įtraukite šiandienos datą apžvalgos viršuje.
- Turėkite aiškią nuomonę. Nepateikite variantų neutraliai. Pasakykite vartotojui, ką JŪS manote, kad jie turėtų daryti.
- Patikrinkite faktus. Nespėliokite apie produktų pristatymus ar funkcijas. Jei paieškos rezultatas neaiškus, paminėkite šį netikrumą.
- Nepridėkite apžvalgai nereikalingo turinio. Jei tik 2 temos surenka daugiau nei 12 balų, pateikite 2. Niekada neįtraukite užpildo.
- Hook idėjos turi būti paruoštos naudoti kameros priešakyje. Parašytos suprantamai, paprasta kalba. Trumpos ir veiksmingos.
