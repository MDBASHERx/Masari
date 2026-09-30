begin;

alter table public.messages
add column suggested_task jsonb;

-- Only assistant messages may contain a suggested task.
alter table public.messages
add constraint messages_suggested_task_valid
check (
    suggested_task is null
    or (
        role = 'assistant'
        and coalesce(
            jsonb_typeof(suggested_task) = 'object'

            and jsonb_typeof(suggested_task -> 'title') = 'string'
            and char_length(
                btrim(suggested_task ->> 'title')
            ) between 1 and 120

            and jsonb_typeof(suggested_task -> 'skillId') = 'string'
            and char_length(
                btrim(suggested_task ->> 'skillId')
            ) between 1 and 80

            and jsonb_typeof(suggested_task -> 'minutes') = 'number'
            and (suggested_task ->> 'minutes')::numeric
                between 5 and 120
            and mod(
                (suggested_task ->> 'minutes')::numeric,
                1
            ) = 0,
            false
        )
    )
);

commit;