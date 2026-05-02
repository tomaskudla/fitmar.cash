# Deployment guide — krok za krokem

## Co budeš potřebovat
- GitHub účet ✓ (už máš)
- Vercel účet — vytvoříš si přes GitHub během 30 sekund
- Cca 10 minut času

---

## KROK 1 — Nahrát kód na GitHub

### Možnost A: Přes web (jednodušší, doporučuji)

1. Jdi na **https://github.com/new**
2. **Repository name:** `fitmar-calc`
3. **Visibility:** Private (důležité — ať to nikdo necizí)
4. NEZAŠKRTÁVAT žádné z "Add a README", "Add .gitignore", "license" — necháme to prázdné
5. Klik **Create repository**

Na další stránce uvidíš sekci **"…or upload an existing file"** — klikni na ten odkaz.

6. Otevři ZIP soubor `fitmar-calc.zip`, který ti pošlu, a rozbal ho někam u sebe v počítači
7. **Vyber všechny soubory a složky uvnitř** (ne tu venkovní složku `fitmar-calc`, ale to co je v ní) a přetáhni je do GitHubu
8. Dolů: **Commit changes** → "Initial commit" → klikni zelené tlačítko

Hotovo, kód je nahraný.

### Možnost B: Přes Git CLI (pokud preferuješ terminál)

```bash
cd ~/Downloads/fitmar-calc
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TVOJE-JMENO/fitmar-calc.git
git push -u origin main
```

---

## KROK 2 — Deploy na Vercel

1. Jdi na **https://vercel.com/signup**
2. **Continue with GitHub** — autorizuj přístup
3. Po přihlášení klik **Add New… → Project**
4. Najdi v seznamu repozitář `fitmar-calc` → klik **Import**
5. Na konfigurační obrazovce:
   - **Framework Preset:** Next.js (mělo by se detekovat automaticky)
   - **Root Directory:** ponech `.`
   - **Environment Variables:** rozklikni a přidej ZATÍM jen jednu:
     - Name: `APP_PASSWORD`
     - Value: *(zvol si silné heslo, např. `Mar2026Cash$Flow!`)* — zapamatuj si ho, budeš se jím přihlašovat
   - Build a output settings nechej výchozí
6. Klik **Deploy** → počkej cca 2 minuty

Po dokončení uvidíš úspěšnou obrazovku s živým odkazem typu `fitmar-calc-xxx.vercel.app`.

---

## KROK 3 — Přidat Vercel KV (cloud databáze, zdarma)

Tohle je důležité — bez KV se data neukládají.

1. V Vercel dashboardu otevři svůj projekt `fitmar-calc`
2. Nahoře záložka **Storage** → klik **Create Database**
3. Vyber **KV (Redis)** → klik **Continue**
4. Zvol nejbližší region (Frankfurt = `fra1` je nejlepší pro ČR)
5. Pojmenuj databázi (třeba `fitmar-data`) → klik **Create**
6. Na obrazovce, která se objeví, klik **Connect Project** → vyber `fitmar-calc` → potvrď

Tímto se automaticky přidají potřebné environment variables (KV_URL, KV_REST_API_TOKEN atd.) k tvému projektu.

---

## KROK 4 — Redeploy

Změna environment variables vyžaduje nový build:

1. V projektu Vercel jdi na záložku **Deployments**
2. U posledního deploymentu klik na tři tečky **⋯** → **Redeploy**
3. Klikni **Redeploy** v dialogu
4. Počkej 1-2 minuty

---

## KROK 5 — Otevři aplikaci

Klikni na svůj URL (`fitmar-calc-xxx.vercel.app`):
- Zadej heslo, které jsi nastavil
- Vyplň první měsíc → uvidíš nahoře "Uloženo" se zelenou ikonou cloudu = data jdou do KV
- Otevři tu samou URL z mobilu, přihlaš se → uvidíš stejná data ✓

---

## Bonus — vlastní doména (volitelné)

Pokud chceš místo `fitmar-calc-xxx.vercel.app` třeba `cashflow.fitmar.cz`:

1. V projektu jdi na **Settings → Domains**
2. Přidej `cashflow.fitmar.cz`
3. Vercel ti řekne, jaký CNAME nebo A záznam přidat u svého DNS providera
4. Po nastavení DNS je doména aktivní za 5 minut až pár hodin

---

## Co když něco nefunguje?

- **"Authentication failed" při přihlášení:** zkontroluj, že jsi `APP_PASSWORD` zadal správně v Settings → Environment Variables → a že jsi po přidání udělal Redeploy
- **"Chyba" u cloud ikony:** KV není připojené — vrať se ke kroku 3
- **Build fail:** napiš mi konkrétní hlášku z Vercel logu, vyřeším

---

## Jak udělat změny po nasazení

Když budeš chtít cokoliv změnit (nová políčka, jiné výpočty, design):
1. Pošli mi co potřebuješ
2. Já ti dám upravené soubory
3. Nahraješ je do GitHubu (přepíšeš stávající)
4. Vercel automaticky udělá nový deploy během 1-2 minut

---

Hodně štěstí! Pokud cokoli nepůjde, screenshot a pošli — provedu tě.
