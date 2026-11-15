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

## Kas jau yra (2 etapas)

- **Pagalbininkas** prisijungia el. paštu: įrašo adresą, gauna laišką su kodu, įveda jį. Slaptažodžio nėra. Pirmą kartą įrašo savo vardą.
- **Senjoro telefonas** slaptažodžio neturi. Pasirinkus „Aš senjoras“, rodomas didelis QR kodas.
- Pagalbininkas apžvalgoje spaudžia „Susieti senjoro telefoną“, nuskenuoja QR kodą, įrašo senjoro vardą ir pasirenka, kas jis senjorui (šeimos narys, slaugytoja, socialinė darbuotoja).
- Po to senjoro telefonas pats persijungia į pradžios ekraną ir rodo „Jumis rūpinasi: …“.
- Senjorą susiejęs pagalbininkas gali **pakviesti kitą** (gauna 8 ženklų kodą, galiojantį 7 dienas) ir pašalinti pagalbininkus.
- Duomenys laikomi Supabase (Frankfurtas, ES). Kiekvienas mato tik savo senjorus: tai tikrina pati duomenų bazė (žr. `supabase/`).

## Patikros sąrašas telefone (2 etapas)

Reikia dviejų telefonų: jūsų (pagalbininkas) ir antro (senjoras).

- [ ] Antrame telefone: „Aš senjoras“ → matote QR kodą.
- [ ] Savo telefone: „Aš pagalbininkas“ → įrašote el. paštą → gaunate laišką su kodu → įvedate → įrašote savo vardą.
- [ ] Apžvalga → „Susieti senjoro telefoną“ → leidžiate kamerą → nuskenuojate QR.
- [ ] Įrašote senjoro vardą, pasirenkate „Šeimos narys“ → „Susieti“.
- [ ] Per kelias sekundes senjoro telefone atsiranda „Jumis rūpinasi“ ir jūsų vardas.
- [ ] Jūsų apžvalgoje matote senjoro vardą.
- [ ] „Pakviesti pagalbininką“ → sukuriamas kodas, jį galima nusiųsti.
- [ ] Uždarius ir vėl atidarius programėlę abiejuose telefonuose, viskas išlieka.

## Patikros sąrašas telefone (1 etapas)

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
src/lib/          datos, vaidmuo, ryšys su serveriu (api.ts)
supabase/         duomenų bazė, saugumo taisyklės ir jų testai
__tests__/        automatiniai testai
test-utils/       netikras serveris testams
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
