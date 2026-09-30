import { vi } from "vitest";

// Tiny stand-in for supabase-js: supports from().select().eq().order(),
// update(patch), maybeSingle() or await, plus rpc(). Rows are plain objects.
export function fakeClient({ tables = {}, rpc = {} } = {}) {
    return {
        from(table) {
            const filters = [];
            let patch = null;
            const rows = () => (tables[table] ?? []).filter((row) => filters.every(([c, v]) => row[c] === v));
            const builder = {
                select: () => builder,
                update: (values) => {
                    patch = values;
                    return builder;
                },
                order: () => builder,
                eq: (column, value) => {
                    filters.push([column, value]);
                    return builder;
                },
                maybeSingle: async () => {
                    const matches = rows();
                    if (patch) matches.forEach((row) => Object.assign(row, patch));
                    return { data: matches[0] ?? null, error: null };
                },
                then: (resolve, reject) => Promise.resolve({ data: rows(), error: null }).then(resolve, reject),
            };
            return builder;
        },
        rpc: vi.fn(async (name, args) => {
            if (!rpc[name]) throw new Error(`Unexpected rpc ${name}`);
            return rpc[name](args);
        }),
    };
}
