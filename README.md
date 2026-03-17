# Loan Portfolio App

A small loan business web app built with React, Vite, and Supabase.

It gives you a portfolio-level overview of:

- borrowers
- loan book
- repayments
- overdue accounts
- collection notes
- exposure and performance metrics

## What is included

- Clean dashboard UI
- Borrower capture form
- Loan creation form
- Payment recording form
- Collections follow-up board
- Portfolio charts and summary cards
- Supabase SQL schema
- GitHub Pages deployment workflow
- Demo mode fallback using localStorage when Supabase keys are missing

## Stack

- React + TypeScript
- Vite
- Supabase
- Recharts
- GitHub Pages

## 1. Install locally

```bash
npm install
npm run dev
```

## 2. Connect to Supabase

Create a `.env` file in the root using the values from `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Then open your Supabase project and run the SQL in:

```text
supabase/schema.sql
```

That creates these tables:

- borrowers
- loans
- payments
- collection_notes

## 3. Deploy to GitHub Pages

1. Push this code to a GitHub repository.
2. In the repo settings, enable **Pages** and set the source to **GitHub Actions**.
3. Add these GitHub repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Push to `main`.
5. The workflow in `.github/workflows/deploy-pages.yml` will build and publish the app.

## 4. Important security note

This starter uses simple authenticated-user policies in Supabase so one owner can get going quickly.
If you later add staff accounts, replace the policies with owner-based row-level security.

## 5. Suggested next upgrades

- add login/signup with Supabase Auth
- add editing and deleting records
- add penalty/late fee logic
- add guarantor tracking
- add PDF receipts
- add WhatsApp reminder integration
- add borrower scoring based on repayment history

## Demo mode

If you run the app without Supabase environment variables, it still works using seeded demo data stored in browser localStorage.
That makes it easier to preview the app before connecting your backend.
