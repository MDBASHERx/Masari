// Compare AI providers on fixed Arabic cases (docs/ai-eval/cases.json).
//
//   npm run eval:ai                      uses LLM_PROVIDER from server/.env
//   npm run eval:ai -- --runs 3          repeat each case (better latency numbers)
//
// Writes a Markdown report to docs/ai-eval/results/ for the team to score by hand.
// Real providers cost money per request: 12 cases × runs.
import "dotenv/config";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getProvider } from "../src/services/ai/providers/index.js";
import { runEvaluation, toMarkdown } from "./ai-eval/runEvaluation.js";

const runsArg = process.argv.indexOf("--runs");
const runs = runsArg > -1 ? Number(process.argv[runsArg + 1]) : 1;
if (!Number.isInteger(runs) || runs < 1 || runs > 5) {
    console.error("--runs must be 1 to 5");
    process.exit(1);
}

const casesUrl = new URL("../../docs/ai-eval/cases.json", import.meta.url);
const { cases } = JSON.parse(readFileSync(casesUrl, "utf8"));

const provider = getProvider();
const model = process.env.LLM_MODEL || "";
console.log(`Provider: ${provider.name}${model ? ` (${model})` : ""} · ${cases.length} cases × ${runs} run(s)\n`);

const { results, summary } = await runEvaluation({
    cases,
    provider,
    runs,
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
    onProgress: (r) => console.log(`${r.passed ? "✅" : "❌"} ${r.testCase.id.padEnd(22)} ${String(r.latencyMs).padStart(6)} ms`),
});

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const safeName = `${provider.name}${model ? `-${model}` : ""}`.replace(/[^a-zA-Z0-9.-]/g, "_");
const outDir = new URL("../../docs/ai-eval/results/", import.meta.url);
mkdirSync(outDir, { recursive: true });
const outFile = new URL(`${safeName}-${stamp}.md`, outDir);
writeFileSync(outFile, toMarkdown({ providerName: provider.name, model, summary, results }));

console.log(`\nPassed: ${summary.passedRuns}/${summary.runs} runs · checks ${summary.checksPassed}/${summary.checksTotal}`);
console.log(`Latency: median ${summary.latencyMedianMs} ms, p90 ${summary.latencyP90Ms} ms · errors ${summary.errors}`);
console.log(`Report: ${outFile.pathname}`);
