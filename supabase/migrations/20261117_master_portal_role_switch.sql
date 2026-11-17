-- Sampling For Good Marketplace: allow two verified Iconx staff logins
-- to access both existing Organization and Brand views using one session.
-- This is portal-role access, NOT access to other users' private data.
create table if not exists public.sfg_marketplace_role_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sfg_marketplace_role_access enable row level security;
revoke all on public.sfg_marketplace_role_access from public, anon, authenticated;
grant select on public.sfg_marketplace_role_access to authenticated;

create policy "role_access_read_self"
on public.sfg_marketplace_role_access for select to authenticated
using (user_id = (select auth.uid()));

-- Bind to the verified Supabase Auth identities, not editable profile/email input.
insert into public.sfg_marketplace_role_access (user_id, enabled)
select id, true from auth.users
where lower(email) in ('jhudson@iconx.io', 'rcramer@iconx.io')
  and email_confirmed_at is not null
on conflict (user_id) do update set enabled = excluded.enabled;

-- Existing directory profiles remain owned by the signed-in user.
-- RLS only adds an alternative INSERT path for the two approved accounts.
create policy "brand_directory_insert_master_own"
on public.sfg_marketplace_brands for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.sfg_marketplace_role_access a
    where a.user_id = (select auth.uid()) and a.enabled
  )
);

create policy "organization_directory_insert_master_own"
on public.sfg_marketplace_chapters for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.sfg_marketplace_role_access a
    where a.user_id = (select auth.uid()) and a.enabled
  )
);

create policy "proposals_insert_master_as_brand"
on public.sfg_marketplace_proposals for insert to authenticated
with check (
  brand_user_id = (select auth.uid())
  and exists (
    select 1 from public.sfg_marketplace_role_access a
    where a.user_id = (select auth.uid()) and a.enabled
  )
  and exists (
    select 1 from public.sfg_marketplace_chapters c
    where c.user_id = chapter_user_id and c.is_visible
  )
);
