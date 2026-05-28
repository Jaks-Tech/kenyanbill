create table if not exists public.public_poll_analyses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  content text not null,
  poll_count integer not null default 0,
  vote_count integer not null default 0,
  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists public_poll_analyses_analyzed_at_idx
  on public.public_poll_analyses (analyzed_at desc);

alter table public.public_poll_analyses enable row level security;

drop policy if exists "Public can read poll analyses"
  on public.public_poll_analyses;

create policy "Public can read poll analyses"
  on public.public_poll_analyses
  for select
  using (true);

-- Add to realtime
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'public_poll_analyses'
  ) then
    alter publication supabase_realtime add table public.public_poll_analyses;
  end if;
end $$;
