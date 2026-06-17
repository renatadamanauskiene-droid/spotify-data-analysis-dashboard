---
name: saskaitu-generatorius
description: Sugeneruoti profesionalią PDF sąskaitą faktūrą iš kelių duomenų. Naudokite šį įgūdį, kai vartotojas sako „sukurk sąskaitą faktūrą", „pateik sąskaitą šiam klientui", „išrašyk sąskaitą", „siųsk sąskaitą", „sugeneruok sąskaitą", „padaryk sąskaitą" arba bet kokį panašų prašymą išrašyti sąskaitą už atliktą darbą.
triggers:
  - sukurk sąskaitą faktūrą
  - pateik sąskaitą klientui
  - išrašyk sąskaitą
  - sugeneruok sąskaitą faktūrą
  - padaryk sąskaitą
---

# Sąskaitų Faktūrų Generatorius

Sukurkite švarią, profesionalią sąskaitą faktūrą PDF formatu iš kelių paprastų duomenų. Šablonų nereikia, programinės įrangos diegti nereikia. Tiesiog pasakykite, kam išrašyti sąskaitą, už ką ir kiek.

## Instrukcijos

### 1 žingsnis: Surinkti sąskaitos duomenis

Iš vartotojo užklausos nustatykite:

- **Kliento vardas** — Kam išrašoma sąskaita?
- **Kliento el. paštas ar adresas** — Neprivaloma, bet įtraukite, jei nurodyta
- **Jūsų įmonės pavadinimas** — Paimkite iš CLAUDE.md, jei yra
- **Sąskaitos numeris** — Sugeneruokite automatiškai, jei nenurodytas (formatas: INV-YYYY-001)
- **Data** — Šiandienos data, jei nenurodyta kitaip
- **Apmokėjimo terminas** — Pagal nutylėjimą 30 dienų, jei nenurodyta kitaip
- **Eilutės pozicijos** — Kokios paslaugos ar prekės yra įskaičiuotos?
- **Sumos** — Kaina už vienetą ar fiksuotas įkainis
- **Mokesčio tarifas** — Įtraukite tik tuo atveju, jei vartotojas paminėjo mokestį
- **Mokėjimo instrukcijos** — Banko duomenys, PayPal, Venmo ir pan. Paimkite iš CLAUDE.md arba paklauskite.

Jei turite pakankamai duomenų sąskaitai sukurti, sukurkite ją. Klauskite tik tuo atveju, jei trūksta kliento vardo ar sumų.

### 2 žingsnis: Apskaičiuoti sumas

Kiekvienai eilutės pozicijai:
- Kiekis x Įkainis = Eilutės suma

Tada:
- Tarpinė suma = Visų eilučių sumų suma
- Mokestis = Tarpinė suma x Mokesčio tarifas (jei taikoma)
- **Mokėtina suma** = Tarpinė suma + Mokestis

Dar kartą patikrinkite skaičiavimus. Sąskaitos su neteisingomis sumomis pakenkia patikimumui.

### 3 žingsnis: Sukurti sąskaitą

Naudokite švarų, profesionalų formatavimą:

```
[Jūsų įmonės pavadinimas]
[Jūsų adresas / kontaktai — jei yra]

SĄSKAITA FAKTŪRA

Sąskaitos Nr.: [Numeris]
Data: [Išrašymo data]
Apmokėti iki: [Apmokėjimo terminas]
Gavėjas: [Kliento vardas / Įmonė]

---

| Aprašymas                | Kiekis | Įkainis  | Suma     |
|--------------------------|-----|----------|----------|
| [Paslauga/Prekė]         | [X] | $[X.XX]  | $[X.XX]  |
| [Paslauga/Prekė]         | [X] | $[X.XX]  | $[X.XX]  |

---

                                    Tarpinė suma: $[X.XX]
                                    Mokestis (X%): $[X.XX]
                                    MOKĖTINA SUMA: $[X.XX]

Mokėjimo sąlygos: [30 dienų / Apmokėti gavus / ir pan.]
Mokėjimo būdas: [Banko pervedimas / PayPal / Venmo / ir pan.]

[Mokėjimo duomenys, jei nurodyti]

Dėkojame už bendradarbiavimą.
```

### 4 žingsnis: Sugeneruoti PDF

Naudokite Python su reportlab arba fpdf, kad sugeneruotumėte tinkamai formatuotą PDF sąskaitą. Išsaugokite ją vartotojo darbo aplanke.

Failo pavadinimas: `Invoice-[KlientoVardas]-[Numeris].pdf`

### 5 žingsnis: Pateikti

Pateikite failo nuorodą ir vienos eilutės santrauką:
- Bendra sąskaitos suma
- Apmokėjimo terminas
- Kliento vardas

Pasiūlykite: „Norite, kad ką nors pakoreguočiau, pridėčiau pastabų, ar sukurčiau pasikartojantį šabloną šiam klientui?"

## Taisyklės

- Visada dar kartą patikrinkite skaičiavimus. Tarpinės ir bendros sumos turi būti teisingos.
- Laikykitės švaraus, profesionalaus stiliaus. Be dekoratyvių elementų.
- Naudokite vartotojo įmonės pavadinimą ir duomenis iš CLAUDE.md, jei jie yra.
- Pagal nutylėjimą naudokite USD, jei vartotojas nenurodo kitos valiutos.
- Niekada neišgalvokite mokėjimo duomenų. Jei jų neturite, palikite vietą jiems įrašyti.
