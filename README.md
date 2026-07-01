# Vlot — persoonlijke budgetplanner

Vul je maandelijks netto-inkomen en je terugkerende kosten in (op om het even
welke frequentie). Vlot toont wat je elke maand overhoudt en hoeveel je opzij
moet zetten voor de niet-maandelijkse rekeningen.

Built on a small Next.js + Drizzle + Postgres slice: password-only login →
server action → Postgres. Multiple accounts, each with its own private budget;
no public signup (you provision accounts from the CLI).

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
cp .env.example .env            # fill in DATABASE_URL and APP_SECRET
openssl rand -base64 32         # paste the output as APP_SECRET
npm run db:push                 # create the tables in your database
npm run user:create -- "Liam" "a-strong-password"   # add an account
npm run dev                     # http://localhost:3000
```

On Windows without `openssl` on PATH, generate `APP_SECRET` with PowerShell
(uses the cryptographic RNG, not the non-secure `Get-Random`):

```powershell
$b = New-Object byte[] 32
([System.Security.Cryptography.RNGCryptoServiceProvider]::new()).GetBytes($b)
[Convert]::ToBase64String($b)
```

`db:push` is the quick path for prototyping. For real projects use migrations:

```bash
npm run db:generate             # write a SQL migration from schema.ts
npm run db:migrate              # apply it
```

## Auth: password-only accounts

Accounts live in the `users` table. There's no public signup — you provision
accounts from the CLI:

```bash
npm run user:create -- "Liam" "a-strong-password"
```

- The **name** is just a label for managing/greeting the account; it's never
  typed at login.
- Login is by **password only** — so each account's password must be unique. The
  script refuses a password already used by another account.
- Re-running with an existing name overwrites that account's password (a reset).

Passwords are stored as a salted **scrypt** hash (`src/lib/password.ts`), never
plaintext — a leaked database can't be reversed into passwords. The login server
action loads the accounts and finds the one whose hash matches; on success it
mints a **signed, httpOnly** session cookie carrying the user's id (HMAC-SHA256
over `<userId>.<issuedAt>`, keyed by `APP_SECRET`). `requireUser()` (in
`src/lib/session.ts`) verifies that cookie on every protected route/action and
returns the user id, or redirects to `/login`.

Each account's data is private: `expenses` and `settings` carry a `userId`, and
**every query is scoped by it** so accounts never see each other's budgets.

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
    layout.tsx              # root shell + globals.css + no-flash theme script
    page.tsx                # planner: requireUser(), reads this user's data, composes UI
    actions.ts             # setIncome / addExpense / updateExpense / deleteExpense / logout (Zod, userId-scoped)
    theme-toggle.tsx        # client light/dark toggle
    income-form.tsx         # client form -> setIncome
    expense-form.tsx        # client form -> addExpense + quick-add presets
    expense-row.tsx         # client row: inline edit + delete
    frequency-select.tsx    # native <select> sharing the Input look
    results-panel.tsx       # three totals + reserve breakdown
    login/
      page.tsx              # password-only gate
      login-form.tsx        # client form -> login action
      actions.ts            # match password against accounts + set cookie
  lib/
    session.ts              # cookie sign/verify (carries userId), requireUser()
    password.ts             # scrypt hash/verify for stored account passwords
    budget.ts               # frequency config + pure normalization/summarize
    format.ts               # nl-BE euro
    utils.ts                # cn()
  db/
    index.ts                # Drizzle client (node-postgres)
    schema.ts               # users + expenses + per-user settings (income)
  components/ui/            # button, input, label, card
scripts/
  create-user.mjs           # provision/reset an account (npm run user:create)
drizzle.config.ts           # migration config
```

## Next pass

- A 12-month cashflow chart (the reserve math already gives the per-month figures).
