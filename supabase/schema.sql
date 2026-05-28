create extension if not exists vector;

create table if not exists public.finance_bill_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  summary text,
  source_name text,
  source_url text,
  pdf_path text,
  pdf_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  chunk_count integer not null default 0,
  processed_at timestamptz,
  processing_error text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.finance_bill_documents
  add column if not exists chunk_count integer not null default 0;

alter table public.finance_bill_documents
  add column if not exists processed_at timestamptz;

alter table public.finance_bill_documents
  add column if not exists processing_error text;

create index if not exists finance_bill_documents_status_idx
  on public.finance_bill_documents (status);

create index if not exists finance_bill_documents_slug_status_idx
  on public.finance_bill_documents (slug, status);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.finance_bill_documents(id) on delete cascade,
  chunk_index integer not null,
  chunk_text text not null,
  section_title text,
  page_number integer,
  token_count integer,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

alter table public.document_chunks
  alter column embedding type vector(1536);

create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id);

create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_document_chunks (
  query_embedding vector(1536),
  match_count int default 8
)
returns table (
  id uuid,
  document_id uuid,
  chunk_text text,
  section_title text,
  page_number integer,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.chunk_text,
    chunks.section_title,
    chunks.page_number,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from public.document_chunks chunks
  join public.finance_bill_documents documents
    on documents.id = chunks.document_id
  where documents.status = 'published'
    and chunks.embedding is not null
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;

create table if not exists public.rag_queries (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text,
  sources_used jsonb not null default '[]'::jsonb,
  anonymous_session_id text,
  created_at timestamptz not null default now()
);

create index if not exists rag_queries_created_at_idx
  on public.rag_queries (created_at desc);

create table if not exists public.ask_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  anonymous_name text not null default 'True Patriot',
  status text not null default 'open' check (status in ('open', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ask_threads_status_updated_at_idx
  on public.ask_threads (status, updated_at desc);

create table if not exists public.ask_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.ask_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources_used jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ask_messages_thread_id_created_at_idx
  on public.ask_messages (thread_id, created_at);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  source_name text,
  source_url text,
  original_url text,
  external_id text,
  summary text,
  excerpt text,
  content text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'rejected', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_articles
  add column if not exists external_id text;

alter table public.news_articles
  add column if not exists excerpt text;

create unique index if not exists news_articles_original_url_idx
  on public.news_articles (original_url)
  where original_url is not null;

create index if not exists news_articles_status_published_at_idx
  on public.news_articles (status, published_at desc);

create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  source_url text,
  source_type text not null default 'rss' check (source_type in ('rss', 'google_news')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_sources_active_idx
  on public.news_sources (active);

create table if not exists public.public_participation_deadlines (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  deadline_at timestamptz,
  committee text,
  submission_channel text,
  source_name text,
  source_url text,
  status text not null default 'to_be_confirmed' check (status in ('to_be_confirmed', 'confirmed', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_participation_deadlines_status_idx
  on public.public_participation_deadlines (status, deadline_at);

create unique index if not exists public_participation_deadlines_source_url_idx
  on public.public_participation_deadlines (source_url)
  where source_url is not null;

create table if not exists public.public_polls (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  question text not null,
  description text,
  category text not null default 'public-participation',
  anonymous_name text not null default 'True Patriot 001',
  anonymous_session_id text,
  status text not null default 'open' check (status in ('open', 'closed', 'hidden')),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.public_polls
  add column if not exists anonymous_name text not null default 'True Patriot 001';

alter table public.public_polls
  add column if not exists anonymous_session_id text;

alter table public.public_polls
  add column if not exists expires_at timestamptz not null default (now() + interval '24 hours');

update public.public_polls
set expires_at = created_at + interval '24 hours'
where expires_at is null;

create table if not exists public.public_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.public_polls(id) on delete cascade,
  label text not null,
  vote_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.public_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.public_polls(id) on delete cascade,
  option_id uuid not null references public.public_poll_options(id) on delete cascade,
  anonymous_session_id text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, anonymous_session_id)
);

create index if not exists public_poll_options_poll_id_idx
  on public.public_poll_options (poll_id);

create index if not exists public_poll_votes_poll_id_idx
  on public.public_poll_votes (poll_id);

create or replace function public.adjust_public_poll_option_count (
  target_option_id uuid,
  vote_delta int
)
returns void
language plpgsql
security definer
as $$
begin
  update public.public_poll_options
  set vote_count = greatest(vote_count + vote_delta, 0)
  where id = target_option_id;
end;
$$;

insert into public.public_polls (slug, question, description, category, status)
select
  'schema-placeholder-do-not-use',
  'Schema placeholder',
  'This row is removed immediately and only keeps old migrations deterministic.',
  'public-participation',
  'hidden'
where false
on conflict (slug) do nothing;

delete from public.public_polls
where slug in ('finance-bill-priority-2026', 'schema-placeholder-do-not-use');

insert into public.news_sources (name, feed_url, source_url, source_type, active)
values
  (
    'Google News - Finance Bill Kenya',
    'https://news.google.com/rss/search?q=%22Finance%20Bill%202026%22%20Kenya%20OR%20%22Finance%20Bill%22%20Kenya&hl=en-KE&gl=KE&ceid=KE:en',
    'https://news.google.com',
    'google_news',
    true
  ),
  (
    'Google News - Kenya Tax Policy',
    'https://news.google.com/rss/search?q=Kenya%20tax%20policy%20Finance%20Bill&hl=en-KE&gl=KE&ceid=KE:en',
    'https://news.google.com',
    'google_news',
    true
  ),
  (
    'Google News - Public Participation Kenya Finance Bill',
    'https://news.google.com/rss/search?q=Kenya%20Finance%20Bill%20public%20participation%20OR%20memoranda%20OR%20committee%20submissions&hl=en-KE&gl=KE&ceid=KE:en',
    'https://news.google.com',
    'google_news',
    true
  )
on conflict (feed_url) do nothing;

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  thread_type text not null default 'user_post' check (thread_type in ('user_post', 'user_question', 'ai_daily_prompt', 'news_discussion', 'bill_section_discussion')),
  title text not null,
  body text not null,
  category text not null default 'general',
  anonymous_name text not null,
  anonymous_session_id text,
  linked_document_id uuid references public.finance_bill_documents(id) on delete set null,
  linked_news_article_id uuid references public.news_articles(id) on delete set null,
  ai_generated boolean not null default false,
  status text not null default 'open' check (status in ('open', 'locked', 'hidden', 'removed')),
  like_count integer not null default 0,
  comment_count integer not null default 0,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.forum_threads
  add column if not exists thread_type text not null default 'user_post';

alter table public.forum_threads
  add column if not exists linked_document_id uuid references public.finance_bill_documents(id) on delete set null;

alter table public.forum_threads
  add column if not exists linked_news_article_id uuid references public.news_articles(id) on delete set null;

alter table public.forum_threads
  add column if not exists ai_generated boolean not null default false;

alter table public.forum_threads
  add column if not exists like_count integer not null default 0;

alter table public.forum_threads
  add column if not exists comment_count integer not null default 0;

alter table public.forum_threads
  add column if not exists score integer not null default 0;

create index if not exists forum_threads_status_created_at_idx
  on public.forum_threads (status, created_at desc);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  parent_comment_id uuid references public.forum_comments(id) on delete cascade,
  body text not null,
  anonymous_name text not null,
  anonymous_session_id text,
  is_ai_response boolean not null default false,
  ai_sources jsonb not null default '[]'::jsonb,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  like_count integer not null default 0,
  reply_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.forum_comments
  add column if not exists is_ai_response boolean not null default false;

alter table public.forum_comments
  add column if not exists ai_sources jsonb not null default '[]'::jsonb;

alter table public.forum_comments
  add column if not exists like_count integer not null default 0;

alter table public.forum_comments
  add column if not exists reply_count integer not null default 0;

create index if not exists forum_comments_thread_id_created_at_idx
  on public.forum_comments (thread_id, created_at);

create table if not exists public.forum_reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('thread', 'comment')),
  target_id uuid not null,
  anonymous_session_id text not null,
  reaction_type text not null default 'like' check (reaction_type in ('like')),
  created_at timestamptz not null default now(),
  unique (target_type, target_id, anonymous_session_id, reaction_type)
);

create index if not exists forum_reactions_target_idx
  on public.forum_reactions (target_type, target_id);

create or replace function public.increment_forum_counts (
  target_thread_id uuid,
  parent_comment_id uuid default null
)
returns void
language plpgsql
security definer
as $$
begin
  update public.forum_threads
  set
    comment_count = comment_count + 1,
    score = score + 4,
    updated_at = now()
  where id = target_thread_id;

  if parent_comment_id is not null then
    update public.forum_comments
    set reply_count = reply_count + 1
    where id = parent_comment_id;
  end if;
end;
$$;

create table if not exists public.forum_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('thread', 'comment')),
  target_id uuid not null,
  reason text not null,
  details text,
  reporter_session_id text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists forum_reports_status_created_at_idx
  on public.forum_reports (status, created_at desc);

alter table public.finance_bill_documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.rag_queries enable row level security;
alter table public.ask_threads enable row level security;
alter table public.ask_messages enable row level security;
alter table public.news_articles enable row level security;
alter table public.news_sources enable row level security;
alter table public.public_participation_deadlines enable row level security;
alter table public.public_polls enable row level security;
alter table public.public_poll_options enable row level security;
alter table public.public_poll_votes enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_comments enable row level security;
alter table public.forum_reactions enable row level security;
alter table public.forum_reports enable row level security;

drop policy if exists "Public can read published finance bill documents"
  on public.finance_bill_documents;

create policy "Public can read published finance bill documents"
  on public.finance_bill_documents
  for select
  using (status = 'published');

drop policy if exists "Public can read chunks for published documents"
  on public.document_chunks;

create policy "Public can read chunks for published documents"
  on public.document_chunks
  for select
  using (
    exists (
      select 1
      from public.finance_bill_documents documents
      where documents.id = document_chunks.document_id
        and documents.status = 'published'
      )
  );

drop policy if exists "Public can read open ask threads"
  on public.ask_threads;

create policy "Public can read open ask threads"
  on public.ask_threads
  for select
  using (status = 'open');

drop policy if exists "Public can read open ask messages"
  on public.ask_messages;

create policy "Public can read open ask messages"
  on public.ask_messages
  for select
  using (
    exists (
      select 1
      from public.ask_threads threads
      where threads.id = ask_messages.thread_id
        and threads.status = 'open'
    )
  );

drop policy if exists "Public can read published news"
  on public.news_articles;

create policy "Public can read published news"
  on public.news_articles
  for select
  using (status = 'published');

drop policy if exists "Public can read active news sources"
  on public.news_sources;

create policy "Public can read active news sources"
  on public.news_sources
  for select
  using (active = true);

drop policy if exists "Public can read public participation deadlines"
  on public.public_participation_deadlines;

create policy "Public can read public participation deadlines"
  on public.public_participation_deadlines
  for select
  using (true);

drop policy if exists "Public can read open public polls"
  on public.public_polls;

create policy "Public can read open public polls"
  on public.public_polls
  for select
  using (status = 'open');

drop policy if exists "Public can read public poll options"
  on public.public_poll_options;

create policy "Public can read public poll options"
  on public.public_poll_options
  for select
  using (
    exists (
      select 1
      from public.public_polls polls
      where polls.id = public_poll_options.poll_id
        and polls.status = 'open'
    )
  );

drop policy if exists "Public can read public poll votes"
  on public.public_poll_votes;

create policy "Public can read public poll votes"
  on public.public_poll_votes
  for select
  using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'public_participation_deadlines'
  ) then
    alter publication supabase_realtime add table public.public_participation_deadlines;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'public_polls'
  ) then
    alter publication supabase_realtime add table public.public_polls;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'public_poll_options'
  ) then
    alter publication supabase_realtime add table public.public_poll_options;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'public_poll_votes'
  ) then
    alter publication supabase_realtime add table public.public_poll_votes;
  end if;
end $$;

drop policy if exists "Public can read visible forum threads"
  on public.forum_threads;

create policy "Public can read visible forum threads"
  on public.forum_threads
  for select
  using (status in ('open', 'locked'));

drop policy if exists "Public can read visible forum comments"
  on public.forum_comments;

create policy "Public can read visible forum comments"
  on public.forum_comments
  for select
  using (status = 'visible');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'forum_threads'
  ) then
    alter publication supabase_realtime add table public.forum_threads;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'forum_comments'
  ) then
    alter publication supabase_realtime add table public.forum_comments;
  end if;
end $$;

drop policy if exists "Public can read forum reactions"
  on public.forum_reactions;

create policy "Public can read forum reactions"
  on public.forum_reactions
  for select
  using (true);

insert into storage.buckets (id, name, public)
values ('finance-bill-documents', 'finance-bill-documents', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read finance bill PDFs"
  on storage.objects;

create policy "Public can read finance bill PDFs"
  on storage.objects
  for select
  using (bucket_id = 'finance-bill-documents');

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


NOTIFY pgrst, 'reload schema';

