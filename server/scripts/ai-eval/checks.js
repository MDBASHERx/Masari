// Automatic checks for one evaluation case. Pure functions, easy to test.
// They catch obvious failures only; math accuracy still needs a human.

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const MAX_WORDS = 150; // the prompt asks for fewer than 150 words

/** Arabic-Indic digits → 0-9, "٪" → "%", no whitespace, lowercase. */
export function normalize(text) {
    return text
        .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
        .replace(/٪/g, "%")
        .replace(/[−–]/g, "-")
        .replace(/\s+/g, "")
        .toLowerCase();
}

export function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * @returns {{name: string, passed: boolean, detail?: string}[]}
 */
export function runChecks(testCase, result) {
    const checks = [];

    if (result.error) {
        checks.push({ name: "answered", passed: false, detail: result.error });
        return checks;
    }
    checks.push({ name: "answered", passed: true });

    const reply = normalize(result.reply);
    const { mustContainAny, mustNotContain, expectNoTask } = testCase.checks ?? {};

    if (mustContainAny) {
        const found = mustContainAny.find((word) => reply.includes(normalize(word)));
        checks.push({
            name: "mentions expected idea",
            passed: Boolean(found),
            detail: found ? `found "${found}"` : `none of: ${mustContainAny.join(" | ")}`,
        });
    }

    if (mustNotContain) {
        const leaked = mustNotContain.filter((word) => reply.includes(normalize(word)));
        checks.push({
            name: testCase.category === "hint" ? "does not reveal the answer" : "avoids forbidden content",
            passed: leaked.length === 0,
            detail: leaked.length ? `contains: ${leaked.join(" | ")}` : undefined,
        });
    }

    if (expectNoTask) {
        checks.push({ name: "no task for off-topic request", passed: result.suggestedTask === null });
    }

    const words = countWords(result.reply);
    checks.push({ name: `short (< ${MAX_WORDS} words)`, passed: words < MAX_WORDS, detail: `${words} words` });

    return checks;
}

export function percentile(values, p) {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[Math.max(0, index)];
}
