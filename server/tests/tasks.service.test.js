import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient } from "./fakeSupabase.js";

const clients = vi.hoisted(() => ({ admin: null, user: null }));
vi.mock("../src/utils/createAdminClient.js", () => ({ default: () => clients.admin }));
vi.mock("../src/utils/createUserClient.js", () => ({ default: () => clients.user }));

const { addSuggestedTask, updateTaskStatus } = await import("../src/services/tasks.service.js");

const MAX_TASKS = 20;

const STUDENT_A = "11111111-1111-1111-1111-111111111111";
const PLAN_ID = "bbbbbbbb-0000-4000-8000-000000000001";

const SUGGESTION = { title: "Practice equations", skillId: "equations", minutes: 10, requestId: "request-0001" };

const taskRow = (id, extra = {}) => ({
    id,
    skill_id: "equations",
    title: "Practice equations",
    minutes: 10,
    status: "todo",
    position: 2,
    reason: "أضفتها من المحادثة مع المعلم",
    source: "chat",
    request_id: null,
    skills: { name: "المعادلات" },
    ...extra,
});

describe("addSuggestedTask", () => {
    let plan;
    let tasks;

    beforeEach(() => {
        tasks = [];
        plan = { id: PLAN_ID, is_current: true, plan_tasks: tasks };

        clients.admin = fakeClient({
            rpc: {
                // Behaves like the database function: retry first, then the limit
                add_plan_task: async (args) => {
                    const existing = tasks.find((t) => t.request_id === args.p_request_id);
                    if (existing) return { data: { taskId: existing.id, created: false, planFull: false }, error: null };
                    if (tasks.length >= MAX_TASKS) {
                        return { data: { taskId: null, created: false, planFull: true, maxTasks: MAX_TASKS }, error: null };
                    }
                    const row = taskRow(`task-${tasks.length + 1}`, {
                        skill_id: args.p_skill_id, title: args.p_title,
                        minutes: args.p_minutes, request_id: args.p_request_id,
                    });
                    tasks.push(row);
                    return { data: { taskId: row.id, created: true, planFull: false }, error: null };
                },
            },
        });
        clients.user = fakeClient({
            tables: {
                learning_plans: [plan],
                skills: [{ id: "fractions" }, { id: "equations" }],
                plan_tasks: tasks,
            },
        });
    });

    const add = (overrides = {}) =>
        addSuggestedTask({ userId: STUDENT_A, accessToken: "t", planId: PLAN_ID, ...SUGGESTION, ...overrides });

    it("adds the suggested task to the student's current plan", async () => {
        const { task, created } = await add();

        expect(created).toBe(true);
        expect(task).toMatchObject({ skillId: "equations", minutes: 10, source: "chat", status: "todo" });
        expect(clients.admin.rpc.mock.calls[0][1].p_user_id).toBe(STUDENT_A);
    });

    it("does not duplicate the task when the same request is retried", async () => {
        await add();
        const retry = await add();

        expect(retry.created).toBe(false);
        expect(tasks).toHaveLength(1);
    });

    it("returns 404 for a plan the student cannot see", async () => {
        clients.user = fakeClient({ tables: { learning_plans: [] } });

        await expect(add()).rejects.toMatchObject({ status: 404, code: "PLAN_NOT_FOUND" });
        expect(clients.admin.rpc).not.toHaveBeenCalled();
    });

    it("refuses an old plan", async () => {
        plan.is_current = false;
        await expect(add()).rejects.toMatchObject({ status: 409, code: "PLAN_NOT_CURRENT" });
    });

    it("refuses a skill that does not exist", async () => {
        await expect(add({ skillId: "chemistry" })).rejects.toMatchObject({ status: 400 });
        expect(clients.admin.rpc).not.toHaveBeenCalled();
    });

    it("returns 409 when the database reports the plan is full, but still accepts a retry", async () => {
        await add(); // request-0001 is now in the plan
        for (let i = tasks.length; i < MAX_TASKS; i += 1) {
            tasks.push(taskRow(`filler-${i}`, { request_id: `filler-${i}` }));
        }

        await expect(add({ requestId: "request-new" }))
            .rejects.toMatchObject({ status: 409, code: "PLAN_FULL" });

        const retry = await add();
        expect(retry.created).toBe(false);
    });
});

describe("updateTaskStatus", () => {
    it("changes the status of the student's task", async () => {
        const row = taskRow("task-1");
        clients.user = fakeClient({ tables: { plan_tasks: [row] } });

        const task = await updateTaskStatus({ accessToken: "t", taskId: "task-1", status: "done" });

        expect(task.status).toBe("done");
        expect(row.status).toBe("done");
    });

    it("returns 404 for a task the student cannot see", async () => {
        clients.user = fakeClient({ tables: { plan_tasks: [] } });

        await expect(updateTaskStatus({ accessToken: "t", taskId: "task-1", status: "done" }))
            .rejects.toMatchObject({ status: 404, code: "TASK_NOT_FOUND" });
    });
});
