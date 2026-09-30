import { generateTutorReply } from "../../src/services/ai/generateTutorReply.js";
import { percentile, runChecks } from "./checks.js";

const SKILLS = [
    { id: "fractions", name: "الكسور" },
    { id: "equations", name: "المعادلات" },
    { id: "percentages", name: "النسب المئوية" },
];

// A typical secondary-school student; each case can override fields
export function learnerFor(testCase) {
    const skill = SKILLS.find((s) => s.id === testCase.skillId) ?? null;
    return {
        gradeLevel: 10,
        goal: "أريد أن أتحسن في الرياضيات",
        dailyMinutes: 20,
        currentSkill: skill,
        skillResults: [
            { skillId: "fractions", name: "الكسور", percent: 50 },
            { skillId: "equations", name: "المعادلات", percent: 0 },
            { skillId: "percentages", name: "النسب المئوية", percent: 100 },
        ],
        nextTask: null,
        availableSkills: SKILLS,
        ...testCase.learner,
    };
}

/**
 * Run every case `runs` times against one provider.
 * @returns {Promise<{results: object[], summary: object}>}
 */
export async function runEvaluation({ cases, provider, runs = 1, timeoutMs, onProgress = () => {} }) {
    const results = [];

    for (const testCase of cases) {
        for (let run = 1; run <= runs; run += 1) {
            const started = performance.now();
            let result;

            try {
                const reply = await generateTutorReply({
                    mode: testCase.mode,
                    learner: learnerFor(testCase),
                    history: testCase.history ?? [],
                    message: testCase.message,
                    provider,
                    timeoutMs,
                });
                result = { reply: reply.reply, suggestedTask: reply.suggestedTask, isDemo: reply.isDemo };
            } catch (error) {
                result = { error: error.code ?? error.message };
            }

            const latencyMs = Math.round(performance.now() - started);
            const checks = runChecks(testCase, result);
            results.push({ testCase, run, latencyMs, ...result, checks, passed: checks.every((c) => c.passed) });
            onProgress(results.at(-1));
        }
    }

    return { results, summary: summarize(results) };
}

export function summarize(results) {
    const latencies = results.filter((r) => !r.error).map((r) => r.latencyMs);
    const allChecks = results.flatMap((r) => r.checks);

    const byCategory = {};
    for (const r of results) {
        const c = (byCategory[r.testCase.category] ??= { runs: 0, passed: 0 });
        c.runs += 1;
        if (r.passed) c.passed += 1;
    }

    return {
        runs: results.length,
        passedRuns: results.filter((r) => r.passed).length,
        errors: results.filter((r) => r.error).length,
        checksPassed: allChecks.filter((c) => c.passed).length,
        checksTotal: allChecks.length,
        latencyMedianMs: percentile(latencies, 50),
        latencyP90Ms: percentile(latencies, 90),
        replyChars: results.reduce((sum, r) => sum + (r.reply?.length ?? 0), 0),
        byCategory,
    };
}

const escape = (text) => String(text ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");

/** Markdown report with automatic results and blank columns for human scores. */
export function toMarkdown({ providerName, model, summary, results, date = new Date() }) {
    const lines = [
        `# AI tutor evaluation: ${providerName}${model ? ` (${model})` : ""}`,
        "",
        `Date: ${date.toISOString().slice(0, 16).replace("T", " ")} UTC`,
        "",
        "## Automatic summary",
        "",
        "| Metric | Value |",
        "|---|---|",
        `| Runs fully passing automatic checks | ${summary.passedRuns} / ${summary.runs} |`,
        `| Individual checks passed | ${summary.checksPassed} / ${summary.checksTotal} |`,
        `| Errors (timeout, bad output, provider) | ${summary.errors} |`,
        `| Latency median / p90 | ${summary.latencyMedianMs ?? "-"} ms / ${summary.latencyP90Ms ?? "-"} ms |`,
        `| Total reply length (cost proxy) | ${summary.replyChars} characters |`,
        "",
        "| Category | Passed runs |",
        "|---|---|",
        ...Object.entries(summary.byCategory).map(([category, c]) => `| ${category} | ${c.passed} / ${c.runs} |`),
        "",
        "Automatic checks only catch obvious failures (errors, revealed answers, missing key ideas, length).",
        "**A person must score every reply below** before choosing a provider.",
        "",
        "## Human scoring guide",
        "",
        "Score each reply 0–2: **Accuracy** (math is correct), **Teaching** (explains step by step; hints without revealing when asked to solve), **Arabic** (clear, natural, suitable for a secondary-school student).",
        "",
        "## Replies",
        "",
    ];

    for (const r of results) {
        lines.push(
            `### ${r.testCase.id}${r.run > 1 ? ` (run ${r.run})` : ""}: ${r.passed ? "✅" : "❌"}`,
            "",
            `**Student:** ${r.testCase.message}`,
            "",
        );
        if (r.testCase.expected) lines.push(`**Expected:** ${r.testCase.expected}`, "");
        lines.push(
            r.error ? `**Error:** ${r.error}` : `**Reply (${r.latencyMs} ms):** ${escape(r.reply)}`,
            "",
        );
        if (r.suggestedTask) lines.push(`**Suggested task:** ${r.suggestedTask.title} (${r.suggestedTask.skillId}, ${r.suggestedTask.minutes} min)`, "");
        lines.push(
            "| Automatic check | Result |",
            "|---|---|",
            ...r.checks.map((c) => `| ${c.name} | ${c.passed ? "✅" : "❌"}${c.detail ? ` ${escape(c.detail)}` : ""} |`),
            "",
            "| Human score | Accuracy (0–2) | Teaching (0–2) | Arabic (0–2) | Notes |",
            "|---|---|---|---|---|",
            "| | | | | |",
            "",
        );
    }

    return lines.join("\n");
}
