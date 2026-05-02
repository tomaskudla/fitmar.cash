# FitMar Cash Flow Kalkulačka

Měsíční P&L se zohledněním DPH asymetrie pro FitMar / Peanut Company s.r.o.

## Co umí

- Vstupy po měsících: tržba ČR / SK, COGS, logistika, marketing po platformách, fixní náklady, vratky
- Automatický výpočet krycího příspěvku, KP marže, provozního HV
- DPH cash flow s asymetrií 12 / 19 / 21 % a reverse charge
- Roční přehled s kumulativními součty
- Heslové uzamčení
- Cloud storage (Vercel KV) — sync mezi zařízeními

## Lokální spuštění (volitelné)

```bash
npm install
npm run dev
```

## Deployment na Vercel

Viz `DEPLOY.md` v této složce.

## Environment variables

- `APP_PASSWORD` — heslo k aplikaci (povinné)
- `KV_REST_API_URL` — automaticky doplní Vercel KV
- `KV_REST_API_TOKEN` — automaticky doplní Vercel KV
- `KV_REST_API_READ_ONLY_TOKEN` — automaticky doplní Vercel KV
- `KV_URL` — automaticky doplní Vercel KV
