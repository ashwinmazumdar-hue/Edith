-- ═══════════════════════════════════════════════════
-- EDITH DASHBOARD — SUPABASE SETUP
-- Run this entire file in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. PROFILES TABLE (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'user',   -- 'user' or 'admin'
  is_blocked boolean not null default false,
  created_at timestamptz default now()
);

-- 2. CAMPAIGN DATA TABLE (one row per user, stores all their data)
create table if not exists public.campaign_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  rows jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- 3. AUTO-CREATE PROFILE ON SIGNUP
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

-- 4. ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.campaign_data enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Users can manage own data" on public.campaign_data;
drop policy if exists "Admins can manage all data" on public.campaign_data;

-- Profiles: each user sees their own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Profiles: admins see everyone
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Profiles: admins can update (block/unblock, change role)
create policy "Admins can update all profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Campaign data: users manage their own
create policy "Users can manage own data" on public.campaign_data
  for all using (auth.uid() = user_id);

-- Campaign data: admins can see all
create policy "Admins can manage all data" on public.campaign_data
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 5. MAKE YOURSELF ADMIN
-- After signing up, run this with your email:
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
