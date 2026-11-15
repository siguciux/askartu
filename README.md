# Aš kartu

Programėlė senjorams ir jų artimiesiems: vaistų priminimai, „Viskas gerai“, SOS, vaizdo skambučiai ir pagalbininko pusė šeimai ar slaugytojai.

Vienas kodas iPhone ir Android telefonams (Expo, React Native).

## Kaip paleisti savo telefone

Reikia vieną kartą:

1. Kompiuteryje įdiekite [Node.js](https://nodejs.org) (LTS versiją).
2. Telefone įdiekite **Expo Go** iš App Store arba Google Play.
3. Atsisiųskite šį kodą (VS Code: „Clone Git Repository“ arba terminale `git clone`).

Kiekvieną kartą:

1. Atsidarykite terminalą šio projekto aplanke.
2. Pirmą kartą (ir kai pasikeičia `package.json`) parašykite `npm install`.
3. Parašykite `npx expo start`.
4. Ekrane atsiras QR kodas:
   - **iPhone:** nuskenuokite jį įprasta kameros programėle.
   - **Android:** nuskenuokite jį Expo Go programėlėje.
5. Programėlė atsidarys telefone. Kai kode kas nors pasikeičia, telefone atsinaujina pats.

Telefonas ir kompiuteris turi būti tame pačiame „Wi‑Fi“. Jei neveikia, paleiskite `npx expo start --tunnel`.

## Kas jau yra (1 etapas)

- Pirmą kartą atidarius: pasirinkimas „Aš senjoras“ arba „Aš pagalbininkas“. Telefonas jį įsimena.
- **Senjoro ekranas:** laikrodis, data, „Viskas gerai“, „Skambinti artimiesiems“, „Vaistai“, „Ar tai sukčiai?“ ir SOS. Mygtukai kol kas tik parodo, kad funkcija dar kuriama.
- **Pagalbininko ekranas:** keturi skirtukai apačioje (Apžvalga, Vaistai, Gidas, Nustatymai), kol kas tušti.
- „Apie programėlę“ su įspėjimu, kad tai ne medicinos priemonė ir SOS nepakeičia 112.
- Abiejose pusėse yra „Keisti vaidmenį“, kad galėtumėte pereiti tarp jų.
- Šriftas Atkinson Hyperlegible, spalvos su patikrintu kontrastu (WCAG AA).

## Patikros sąrašas telefone

- [ ] Programėlė atsidaro ir rodo „Sveiki! Čia ‚Aš kartu‘“.
- [ ] Paspaudus „Aš senjoras“, matote laikrodį su dabartiniu laiku ir šiandienos datą.
- [ ] Paspaudus bet kurį senjoro mygtuką, pasirodo „Ši dalis dar kuriama“.
- [ ] Uždarius ir vėl atidarius programėlę, iškart rodomas senjoro ekranas.
- [ ] „Keisti vaidmenį“ (apačioje) → „Aš pagalbininkas“ → matote 4 skirtukus ir galite tarp jų pereiti.
- [ ] Nustatymai → „Apie programėlę“ → „← Atgal“ grįžta į nustatymus.
- [ ] Telefono nustatymuose padidinus šriftą, tekstas padidėja ir nieko neuždengia.

## Kodo tvarka

```
src/app/          ekranai (kiekvienas failas yra ekranas)
  pasirinkimas    „Aš senjoras“ / „Aš pagalbininkas“
  senjoras        senjoro pradžios ekranas
  pagalbininkas/  pagalbininko skirtukai
  apie            „Apie programėlę“
src/components/   dideli mygtukai, kortelės, antraštė, „Atgal“
src/theme/        spalvos, šriftai, dydžiai
src/lib/          datos formatavimas, vaidmens įsiminimas
__tests__/        automatiniai testai
```

## Programuotojui

```bash
npm install
npm start          # Expo kūrimo serveris
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Jest testai
```

GitHub automatiškai paleidžia lint, tipų patikrą ir testus kiekvienam pakeitimui (`.github/workflows/ci.yml`).

Paketo vardas abiem platformoms: `lt.askartu.app`.
