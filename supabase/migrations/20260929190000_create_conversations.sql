begin;

create table public.conversations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null default 'محادثة جديدة'
        check (char_length(btrim(title)) between 1 and 100),
    mode text not null default 'tutor'
        check (mode in ('tutor', 'mentor')),
    created_at timestamptz not null default now()
);

create table public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null
        references public.conversations(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null
        check (char_length(btrim(content)) between 1 and 2000),
    request_id uuid not null,
    created_at timestamptz not null default now(),

    unique (conversation_id, request_id, role)
);

create index conversations_owner_created_idx
    on public.conversations (user_id, created_at desc, id desc);

create index messages_conversation_created_idx
    on public.messages (conversation_id, created_at, id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Reset client permissions, then grant only what this feature needs.
revoke all on public.conversations from anon, authenticated;
revoke all on public.messages from anon, authenticated;

grant select on public.conversations to authenticated;
grant insert (user_id, title, mode)
    on public.conversations to authenticated;

grant select on public.messages to authenticated;
grant insert (conversation_id, role, content, request_id)
    on public.messages to authenticated;

-- Reserved for trusted server operations such as saving AI replies.
grant select, insert on public.conversations to service_role;
grant select, insert on public.messages to service_role;

create policy "Read own conversations"
on public.conversations
for select to authenticated
using (user_id = (select auth.uid()));

create policy "Create own conversations"
on public.conversations
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Read messages from own conversations"
on public.messages
for select to authenticated
using (
    exists (
        select 1
        from public.conversations c
        where c.id = messages.conversation_id
          and c.user_id = (select auth.uid())
    )
);

create policy "Send user messages to own conversations"
on public.messages
for insert to authenticated
with check (
    role = 'user'
    and exists (
        select 1
        from public.conversations c
        where c.id = messages.conversation_id
          and c.user_id = (select auth.uid())
    )
);

commit;