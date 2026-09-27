begin;

-- Student profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text not null default ''
    check (char_length(full_name) <= 100),

  grade_level text not null default ''
    check (char_length(grade_level) <= 50),

  goal text not null default ''
    check (char_length(goal) <= 500),

  daily_minutes integer not null default 30
    check (daily_minutes between 5 and 240),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable row-level security
alter table public.profiles enable row level security;

-- Allow only the required operations
revoke all on table public.profiles from public, anon, authenticated;

grant select on table public.profiles to authenticated;

grant update (
  full_name,
  grade_level,
  goal,
  daily_minutes
) on public.profiles to authenticated;

-- Students can read their own profile
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- Students can update their own profile
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Maintain the update timestamp
create function public.my_coach_set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.my_coach_set_profile_updated_at();

-- Create a profile when an account is created
create function public.my_coach_create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(
      trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')),
      100
    )
  );

  return new;
end;
$$;

revoke execute on function public.my_coach_create_profile()
from public, anon, authenticated;

revoke execute on function public.my_coach_set_profile_updated_at()
from public, anon, authenticated;

create trigger my_coach_auth_user_created
after insert on auth.users
for each row
execute function public.my_coach_create_profile();

-- Create profiles for accounts that already exist
insert into public.profiles (id, full_name)
select
  id,
  left(
    trim(coalesce(raw_user_meta_data ->> 'full_name', '')),
    100
  )
from auth.users
on conflict (id) do nothing;

commit;

begin;

-- Prevent changes while converting existing values
lock table public.profiles in access exclusive mode;

-- Normalize recognized grade names
update public.profiles
set grade_level = case trim(grade_level)
  when '١٠' then '10'
  when 'عاشر' then '10'
  when 'العاشر' then '10'
  when 'صف عاشر' then '10'
  when 'الصف العاشر' then '10'

  when '١١' then '11'
  when 'الحادي عشر' then '11'
  when 'الصف الحادي عشر' then '11'

  when '١٢' then '12'
  when 'الثاني عشر' then '12'
  when 'الصف الثاني عشر' then '12'

  else trim(grade_level)
end;

-- Stop if an existing value needs manual review
do $$
begin
  if exists (
    select 1
    from public.profiles
    where grade_level not in ('', '10', '11', '12')
  ) then
    raise exception
      'Unrecognized grade values exist. Review them before converting.';
  end if;
end;
$$;

-- Empty values represent a grade that has not been selected
alter table public.profiles
  alter column grade_level drop default,
  alter column grade_level drop not null;

alter table public.profiles
  drop constraint profiles_grade_level_check;

alter table public.profiles
  alter column grade_level type smallint
  using nullif(grade_level, '')::smallint;

alter table public.profiles
  add constraint profiles_grade_level_check
  check (grade_level in (10, 11, 12));

commit;

begin;

alter table public.profiles
  drop constraint profiles_grade_level_check;

alter table public.profiles
  add constraint profiles_grade_level_check
  check (grade_level between 1 and 12);

commit;