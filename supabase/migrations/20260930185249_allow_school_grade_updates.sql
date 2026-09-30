begin;

grant update (
    subject,
    title,
    score,
    assessed_on,
    notes
) on public.grades to authenticated;

create policy grades_update_own
on public.grades
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

commit;