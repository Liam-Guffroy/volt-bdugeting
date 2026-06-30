# Vlot — persoonlijke budgetplanner

Vul je maandelijks netto-inkomen en je terugkerende kosten in (op om het even
welke frequentie). Vlot toont wat je elke maand overhoudt en hoeveel je opzij
moet zetten voor de niet-maandelijkse rekeningen.

Built on a small Next.js + Drizzle + Postgres slice: one shared-password gate →
server action → Postgres. Single owner, no signup.

## Stack

- **Next.js 15** (App Router, server actions, React 19)
- **Drizzle ORM** over **Postgres** via the portable `node-postgres` driver
- **Zod** for input validation
- **Tailwind v4** + small shadcn-style components

## The one knob that matters: `DATABASE_URL`

The whole app talks to Postgres through Drizzle, so the database is a connection
string, not a commitment. Swap the value, change nothing else:

| Provider | What to paste |
|---|---|
| **Neon** | the **pooled** connection string (host ends in `-pooler`) |
| **Supabase** | Project Settings → Database → Connection string → **Session pooler** |
| **Local** | `postgresql://postgres:postgres@localhost:5432/postgres` |

## Setup

```bash
npm install
cp .env.example .env            # fill in DATABASE_URL, APP_PASSWORD, APP_SECRET
openssl rand -base64 32         # paste the output as APP_SECRET
npm run db:push                 # create the tables in your database
npm run dev                     # http://localhost:3000
```

On Windows without `openssl` on PATH, generate `APP_SECRET` with PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
```

`db:push` is the quick path for prototyping. For real projects use migrations:

```bash
npm run db:generate             # write a SQL migration from schema.ts
npm run db:migrate              # apply it
```

## Auth: a single shared-password gate

No signup, no user table — just one `APP_PASSWORD` in the environment. The login
form posts to a server action that does a **constant-time** compare (both sides
SHA-256'd, then `crypto.timingSafeEqual`). On success it mints a **signed,
httpOnly** session cookie (HMAC-SHA256 over an issued-at timestamp, keyed by
`APP_SECRET`). `requireUser()` (in `src/lib/session.ts`) verifies that cookie on
every protected route and action, or redirects to `/login`.

Because it's a single-owner app, expense rows have no per-user column — the gate
*is* the boundary.

## Core logic

Pure functions in `src/lib/budget.ts`, no I/O:

- Every expense is normalized to a **monthly equivalent**.
- **Regular** = weekly / biweekly / monthly (what you actually pay each month).
- **Reserve** = anything less frequent than monthly, divided down to a monthly
  set-aside (a yearly €1.200 bill → €100/month).
- `summarize(income, expenses)` returns `remaining` (income − regular − reserve),
  `regularTotal`, `reserveTotal`, and a per-bill reserve breakdown.

Belgian euro formatting (`nl-BE`, "€ 1.234,56") lives in `src/lib/format.ts`.

## Where things live

```
src/
  app/
    layout.tsx              # root shell + globals.css
    page.tsx                # planner: requireUser(), reads data, composes UI
    actions.ts             # setIncome / addExpense / updateExpense / deleteExpense / logout (Zod)
    income-form.tsx         # client form -> setIncome
    expense-form.tsx        # client form -> addExpense
    expense-row.tsx         # client row: inline edit + delete
    frequency-select.tsx    # native <select> sharing the Input look
    results-panel.tsx       # three totals + reserve breakdown
    login/
      page.tsx              # one-field gate
      login-form.tsx        # client form -> login action
      actions.ts            # constant-time compare + set cookie
  lib/
    session.ts              # password verify, cookie sign/verify, requireUser()
    budget.ts               # frequency config + pure normalization/summarize
    format.ts               # nl-BE euro
    utils.ts                # cn()
  db/
    index.ts                # Drizzle client (node-postgres)
    schema.ts               # expenses + one-row settings (income)
  components/ui/            # button, input, label, card
drizzle.config.ts           # migration config
```

## Next pass

- A 12-month cashflow chart (the reserve math already gives the per-month figures).
