import { beforeEach, describe, expect, it, vi } from "vitest";
const createUserClient = vi.hoisted(() => vi.fn());
vi.mock("../src/utils/createUserClient.js", () => ({ default: createUserClient }));
import { updateGrade } from "../src/controllers/grades.controller.js";
import { createGradeSchema, updateGradeSchema } from "../src/validators/grades.validator.js";
const body = { subject: "Math", title: "Equations", score: 85, assessedOn: "2026-09-30", notes: "Review" };
beforeEach(() => vi.clearAllMocks());
describe("school grade updates", () => {
    it.each([{ score: -1 }, { score: 101 }, { score: 12.345 }, { assessedOn: "2026-02-30" }, { user_id: "other" }])("rejects invalid or privileged fields: %j", (change) => {
        expect(updateGradeSchema.safeParse({ ...body, ...change }).success).toBe(false);
    });
    it("requires an idempotency key on create", () => {
        expect(createGradeSchema.safeParse(body).success).toBe(false);
    });
    it("scopes updates to the authenticated student and requested grade", async () => {
        const query = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
        for (const method of ["update", "eq", "select"]) query[method].mockReturnValue(query);
        query.maybeSingle.mockResolvedValue({ data: null, error: null });
        createUserClient.mockReturnValue({ from: vi.fn(() => query) });
        const res = { status: vi.fn(), json: vi.fn() };
        res.status.mockReturnValue(res);
        await updateGrade({ user: { id: "student-a" }, accessToken: "token-a", validated: { params: { id: "grade-b" }, body } }, res);
        expect(createUserClient).toHaveBeenCalledWith("token-a");
        expect(query.eq).toHaveBeenCalledWith("id", "grade-b");
        expect(query.eq).toHaveBeenCalledWith("user_id", "student-a");
        expect(query.update.mock.calls[0][0]).not.toHaveProperty("user_id");
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "GRADE_NOT_FOUND" }));
    });
});
