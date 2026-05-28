alter table public.public_polls add column if not exists like_count integer not null default 0;
alter table public.public_poll_analyses add column if not exists like_count integer not null default 0;

create table if not exists public.site_likes (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('poll', 'analysis')),
  target_id uuid not null,
  anonymous_session_id text not null,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, anonymous_session_id)
);

create index if not exists site_likes_target_idx on public.site_likes (target_type, target_id);

alter table public.site_likes enable row level security;
drop policy if exists "Public can read site likes" on public.site_likes;
create policy "Public can read site likes" on public.site_likes for select using (true);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;
-- Only allow insert, no public read
drop policy if exists "Public can insert subscribers" on public.subscribers;
create policy "Public can insert subscribers" on public.subscribers for insert with check (true);
