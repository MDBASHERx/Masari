begin;

create table public.grades (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id) on delete cascade,

    subject text not null
        check (char_length(btrim(subject)) between 1 and 80),

    title text not null
        check (char_length(btrim(title)) between 1 and 120),

    score numeric(5, 2) not null
        check (score between 0 and 100),

    assessed_on date not null,

    notes text not null default ''
        check (char_length(notes) <= 500),

    request_id uuid not null,

    created_at timestamptz not null default now(),

    constraint grades_user_request_unique
        unique (user_id, request_id)
);

create index grades_user_date_idx
    on public.grades (
        user_id,
        assessed_on desc,
        created_at desc,
        id desc
    );

alter table public.grades enable row level security;

-- Students can only read and add their own records.
revoke all on table public.grades
    from public, anon, authenticated, service_role;

grant select on table public.grades
    to authenticated;

grant insert (
    user_id,
    subject,
    title,
    score,
    assessed_on,
    notes,
    request_id
) on public.grades to authenticated;

create policy grades_select_own
on public.grades
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy grades_insert_own
on public.grades
for insert
to authenticated
with check ((select auth.uid()) = user_id);

commit;