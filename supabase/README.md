# Supabase (serveris)

Čia yra viskas, ko reikia „Aš kartu“ duomenų bazei.

- `migrations/` – duomenų bazės lentelės, saugumo taisyklės (RLS) ir veiksmai.
  Paleidžiama eilės tvarka Supabase **SQL Editor** lange.
- `email/prisijungimo-kodas.html` – laiškas su prisijungimo kodu pagalbininkams.
- `tests/` – automatiniai duomenų bazės testai (GitHub juos paleidžia pats).

## Vienkartinis paruošimas (Supabase svetainėje)

1. **SQL Editor** → **New query** → įklijuokite visą
   `migrations/20261115000000_paskyros_ir_susiejimas.sql` turinį → **Run**.
2. **Authentication** → **Sign In / Providers** → įjunkite
   **Allow anonymous sign-ins** → **Save**. (Senjoro telefonas jungiasi be slaptažodžio.)
3. **Authentication** → **Emails** → **Magic Link**:
   - Subject: `Jūsų prisijungimo kodas`
   - Body: įklijuokite `email/prisijungimo-kodas.html` turinį → **Save**.

Nemokamas Supabase planas siunčia tik kelis laiškus per valandą. Kai bus daugiau
naudotojų, reikės prijungti savo el. pašto siuntimo paslaugą (SMTP).

## Testai savo kompiuteryje

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres supabase/tests/run.sh
```
