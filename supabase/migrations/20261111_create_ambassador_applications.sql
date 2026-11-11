-- Private campus ambassador recruiting records.
-- Applications are inserted only through the sfg-ambassador-apply Edge Function.
create table if not exists public.sfg_ambassador_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 150),
  instagram_handle text,
  email text not null,
  mobile text not null,
  school text not null,
  experience text,
  status text not null default 'new'
    check (status in ('new','screening','contacted','approved','declined')),
  source text not null default 'marketplace',
  consent_at timestamptz not null default now()
);

alter table public.sfg_ambassador_applications enable row level security;
revoke all on public.sfg_ambassador_applications from anon, authenticated;
comment on table public.sfg_ambassador_applications is
  'Private recruiting submissions for Campus Brand Ambassador paid internship screening. Service-role access only.';
