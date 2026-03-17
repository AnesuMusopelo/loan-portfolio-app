create extension if not exists pgcrypto;

create table if not exists public.borrowers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  national_id text not null,
  address text default '',
  risk_notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null references public.borrowers(id) on delete cascade,
  principal numeric(12,2) not null check (principal >= 0),
  interest_rate numeric(6,2) not null check (interest_rate >= 0),
  issue_date date not null,
  due_date date not null,
  status text not null check (status in ('active', 'paid', 'overdue', 'defaulted')),
  purpose text default '',
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  payment_date date not null,
  method text not null default 'Cash',
  reference text default '',
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.collection_notes (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  note text not null,
  contact_date date not null,
  next_action_date date,
  created_at timestamptz not null default now()
);

create or replace view public.loan_overview as
select
  l.id,
  l.borrower_id,
  b.full_name,
  b.phone,
  b.national_id,
  l.principal,
  l.interest_rate,
  l.issue_date,
  l.due_date,
  l.status,
  l.purpose,
  l.notes,
  coalesce(sum(p.amount), 0)::numeric(12,2) as amount_paid,
  (l.principal * (1 + (l.interest_rate / 100)))::numeric(12,2) as total_due,
  greatest((l.principal * (1 + (l.interest_rate / 100))) - coalesce(sum(p.amount), 0), 0)::numeric(12,2) as outstanding_balance
from public.loans l
join public.borrowers b on b.id = l.borrower_id
left join public.payments p on p.loan_id = l.id
group by l.id, b.id;

alter table public.borrowers enable row level security;
alter table public.loans enable row level security;
alter table public.payments enable row level security;
alter table public.collection_notes enable row level security;

-- For a single-owner app, these starter policies allow any authenticated user to manage records.
-- Replace these later with owner-based policies if you add multiple staff accounts.
create policy if not exists "Authenticated users can read borrowers"
  on public.borrowers for select to authenticated using (true);
create policy if not exists "Authenticated users can insert borrowers"
  on public.borrowers for insert to authenticated with check (true);
create policy if not exists "Authenticated users can update borrowers"
  on public.borrowers for update to authenticated using (true) with check (true);

create policy if not exists "Authenticated users can read loans"
  on public.loans for select to authenticated using (true);
create policy if not exists "Authenticated users can insert loans"
  on public.loans for insert to authenticated with check (true);
create policy if not exists "Authenticated users can update loans"
  on public.loans for update to authenticated using (true) with check (true);

create policy if not exists "Authenticated users can read payments"
  on public.payments for select to authenticated using (true);
create policy if not exists "Authenticated users can insert payments"
  on public.payments for insert to authenticated with check (true);
create policy if not exists "Authenticated users can update payments"
  on public.payments for update to authenticated using (true) with check (true);

create policy if not exists "Authenticated users can read collection notes"
  on public.collection_notes for select to authenticated using (true);
create policy if not exists "Authenticated users can insert collection notes"
  on public.collection_notes for insert to authenticated with check (true);
create policy if not exists "Authenticated users can update collection notes"
  on public.collection_notes for update to authenticated using (true) with check (true);
