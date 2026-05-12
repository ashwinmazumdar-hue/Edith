-- ═══════════════════════════════════════════════════════════
-- EDITH DASHBOARD — SUPABASE SETUP (Run this in SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- ── STEP 1: Profiles table ─────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'user',
  is_blocked boolean not null default false,
  created_at timestamptz default now()
);

-- ── STEP 2: Drop old campaign_data and recreate ────────────
-- OLD table had user_id as UUID — caused silent save failures
-- NEW table uses text so 'dashboard' key works
drop table if exists public.campaign_data cascade;

create table public.campaign_data (
  id uuid default gen_random_uuid() primary key,
  user_id text not null unique,
  rows jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Pre-create the shared dashboard row
insert into public.campaign_data (user_id, rows)
values ('dashboard', '[]')
on conflict (user_id) do nothing;

-- ── STEP 3: Auto-create profile on signup ──────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── STEP 4: Row Level Security ─────────────────────────────
alter table public.profiles enable row level security;
alter table public.campaign_data enable row level security;

drop policy if exists "Users view own profile"       on public.profiles;
drop policy if exists "Admins view all profiles"     on public.profiles;
drop policy if exists "Admins update profiles"       on public.profiles;
drop policy if exists "Anyone reads dashboard data"  on public.campaign_data;
drop policy if exists "Admins write dashboard data"  on public.campaign_data;
drop policy if exists "Admins update dashboard data" on public.campaign_data;

create policy "Users view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins update profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Anyone reads dashboard data" on public.campaign_data
  for select using (auth.role() = 'authenticated');

create policy "Admins write dashboard data" on public.campaign_data
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins update dashboard data" on public.campaign_data
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── STEP 5: Make yourself admin ────────────────────────────
-- Run this AFTER signing up (replace the email):
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
