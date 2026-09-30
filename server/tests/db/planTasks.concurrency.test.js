// Concurrency regression tests for add_plan_task, against a REAL database.
// They send requests at the same time on separate connections, which the
// fake Supabase client cannot do.
//
// Skipped unless TEST_DATABASE_URL is set. With the local Supabase stack:
//   npx supabase start
//   TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm test
// Never point this at the shared project: it writes (and then deletes) test rows.
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;

const USER_ID = "00000000-0000-4000-8000-0000000000aa";
const ATTEMPT_ID = "00000000-0000-4000-8000-0000000000a9";
const PLAN_ID = "00000000-0000-4000-8000-0000000000a8";
const SKILL_ID = "race-test-skill";
const MAX_TASKS = 20;

describe.skipIf(!url)("add_plan_task under concurrent requests", () => {
    let pool;

    const cleanUp = async () => {
        await pool.query("delete from auth.users where id = $1", [USER_ID]); // cascades to attempts, plans, tasks
        await pool.query("delete from public.skills where id = $1", [SKILL_ID]);
    };

    // A current plan that already has `count` tasks
    const planWithTasks = async (count) => {
        await cleanUp();
        await pool.query("insert into auth.users (id, email) values ($1, 'race@test.local')", [USER_ID]);
        await pool.query("delete from public.profiles where id = $1", [USER_ID]).catch(() => {});
        await pool.query("insert into public.skills (id, name, position) values ($1, 'Race test', 95)", [SKILL_ID]);
        await pool.query(
            `insert into public.attempts (id, user_id, type, status, score, submitted_at)
             values ($1, $2, 'diagnostic', 'submitted', 0, now())`,
            [ATTEMPT_ID, USER_ID],
        );
        await pool.query(
            "insert into public.learning_plans (id, user_id, source_attempt_id, version) values ($1, $2, $3, 1)",
            [PLAN_ID, USER_ID, ATTEMPT_ID],
        );
        await pool.query(
            `insert into public.plan_tasks (plan_id, skill_id, title, minutes, position)
             select $1, $2, 'existing ' || n, 10, n from generate_series(1, $3::int) as n`,
            [PLAN_ID, SKILL_ID, count],
        );
    };

    // Each call gets its own connection, and all start together
    const addTasksAtOnce = (requestIds) =>
        Promise.all(
            requestIds.map(async (requestId) => {
                const client = await pool.connect();
                try {
                    const { rows } = await client.query(
                        "select public.add_plan_task($1, $2, $3, 'Suggested', 10, $4) as result",
                        [USER_ID, PLAN_ID, SKILL_ID, requestId],
                    );
                    return rows[0].result;
                } finally {
                    client.release();
                }
            }),
        );

    const taskCount = async () =>
        Number((await pool.query("select count(*) from public.plan_tasks where plan_id = $1", [PLAN_ID])).rows[0].count);

    beforeAll(() => {
        pool = new pg.Pool({ connectionString: url, max: 12 });
    });
    beforeEach(cleanUp);
    afterAll(async () => {
        await cleanUp();
        await pool.end();
    });

    it(`never goes over ${MAX_TASKS} tasks when requests race at ${MAX_TASKS - 1}`, async () => {
        await planWithTasks(MAX_TASKS - 1);

        const results = await addTasksAtOnce(Array.from({ length: 10 }, (_, i) => `race-${i}`));

        expect(await taskCount()).toBe(MAX_TASKS);
        expect(results.filter((r) => r.created === true)).toHaveLength(1);
        expect(results.filter((r) => r.planFull === true)).toHaveLength(9);
    });

    it("a retry of an already-added task still succeeds when the plan is full", async () => {
        await planWithTasks(MAX_TASKS - 1);
        const [first] = await addTasksAtOnce(["last-slot"]);

        const [retry] = await addTasksAtOnce(["last-slot"]);

        expect(first.created).toBe(true);
        expect(retry).toMatchObject({ created: false, taskId: first.taskId });
        expect(await taskCount()).toBe(MAX_TASKS);
    });

    it("the same request sent many times at once adds exactly one task", async () => {
        await planWithTasks(5);

        const results = await addTasksAtOnce(Array.from({ length: 8 }, () => "double-click"));

        expect(await taskCount()).toBe(6);
        expect(results.filter((r) => r.created === true)).toHaveLength(1);
        expect(new Set(results.map((r) => r.taskId)).size).toBe(1);
    });
});
