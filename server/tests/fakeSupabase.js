import { vi } from "vitest";

// Tiny stand-in for supabase-js: supports from().select().eq().order()
// with maybeSingle() or await, plus rpc(). Rows are plain objects.
export function fakeClient({ tables = {}, rpc = {} } = {}) {
    return {
        from(table) {
            const filters = [];
            const rows = () => (tables[table] ?? []).filter((row) => filters.every(([c, v]) => row[c] === v));
            const builder = {
                select: () => builder,
                order: () => builder,
                eq: (column, value) => {
                    filters.push([column, value]);
                    return builder;
                },
                maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
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
