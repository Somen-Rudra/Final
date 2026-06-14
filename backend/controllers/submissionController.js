// src/controllers/submissionController.js
import Problem from "../models/problemModel.js";

const JUDGE_URL = process.env.JUDGE_URL || "http://localhost:3000";

const JUDGE_LANG_MAP = {
  c:      "c",
  cpp:    "cpp",
  js:     "javascript",
  py:     "python",
  java:   "java",
  kotlin: "kotlin",
  swift:  "swift",
};

// ─────────────────────────────────────────────
// Judge helper
// ─────────────────────────────────────────────
async function judgePost(path, body) {
  let response;
  try {
    response = await fetch(`${JUDGE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(`Cannot reach judge server: ${networkErr.message}`);
  }

  const text = await response.text();
  if (!text) throw new Error(`Judge returned HTTP ${response.status} with no body`);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Judge returned HTTP ${response.status} with non-JSON body: ${text.slice(0, 200)}`
    );
  }

  if (!response.ok) throw new Error(data?.error || `Judge error: HTTP ${response.status}`);

  return data;
}

// ─────────────────────────────────────────────
// Stitch code per language
//
// Most languages:   header + userCode + driver
//
// Java is special:  javac needs everything inside one public class.
//                   The driver field contains the full class shell with
//                   main() already written. We inject the user's method
//                   just before the closing brace of the class.
//
//   driver template (stored in DB):
//   "import java.util.*;\npublic class Main {\n    <<USER_CODE>>\n    public static void main(...) { ... }\n}"
//
// ─────────────────────────────────────────────
function stitchCode(language, template, userCode) {
  const header = template.header?.trim() || "";
  const driver = template.driver?.trim() || "";
  const code   = userCode.trim();

  if (language === "java") {
    // Driver contains the full class; inject user code via placeholder
    if (driver.includes("<<USER_CODE>>")) {
      return driver.replace("<<USER_CODE>>", code);
    }
    // Fallback: inject user code just before the last closing brace
    const lastBrace = driver.lastIndexOf("}");
    if (lastBrace !== -1) {
      return (
        driver.slice(0, lastBrace) +
        "\n" + code + "\n" +
        driver.slice(lastBrace)
      );
    }
    // Last resort — just concatenate
    return [header, code, driver].filter(Boolean).join("\n\n");
  }

  // All other languages: header + user code + driver
  return [header, code, driver].filter(Boolean).join("\n\n");
}

// ─────────────────────────────────────────────
// POST /problemSet/:slug/run
// ─────────────────────────────────────────────
export async function runCode(req, res) {
  const { slug } = req.params;
  const { language, code } = req.body;

  if (!language || !code?.trim()) {
    return res.status(400).json({ error: "language and code are required" });
  }

  const dbKey = Object.entries(JUDGE_LANG_MAP).find(([, v]) => v === language)?.[0];
  if (!dbKey) return res.status(400).json({ error: `Unsupported language: ${language}` });

  const problem = await Problem.findOne({ slug, isPublished: true }).select("languages");
  if (!problem) return res.status(404).json({ error: "Problem not found" });

  const template = problem.languages?.get(dbKey);
  if (!template) {
    return res.status(400).json({
      error: `Language "${language}" is not available for this problem`,
    });
  }

  try {
    const stitched = stitchCode(dbKey, template, code);
    const result = await judgePost("/run", { language, code: stitched });
    return res.json(result);
  } catch (err) {
    console.error("[runCode]", err);
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// POST /problemSet/:slug/submit
// ─────────────────────────────────────────────
export async function submitCode(req, res) {
  const { slug } = req.params;
  const { language, code, customCases = [] } = req.body;

  if (!language || !code?.trim()) {
    return res.status(400).json({ error: "language and code are required" });
  }

  const dbKey = Object.entries(JUDGE_LANG_MAP).find(([, v]) => v === language)?.[0];
  if (!dbKey) return res.status(400).json({ error: `Unsupported language: ${language}` });

  const problemId = await Problem.findOne({ slug, isPublished: true }).then((p) => p?._id);
  if (!problemId) return res.status(404).json({ error: "Problem not found" });

  const problem = await Problem.findForJudge(problemId).select(
    "languages visibleTestCases hiddenTestCases"
  );

  const template = problem.languages?.get(dbKey);
  if (!template) {
    return res.status(400).json({
      error: `Language "${language}" is not available for this problem`,
    });
  }

  const testCases = [
    ...problem.visibleTestCases.map((tc) => ({ input: tc.input, output: tc.output })),
    ...problem.hiddenTestCases.map((tc)  => ({ input: tc.input, output: tc.output })),
    ...customCases.map((tc)              => ({ input: tc.input, output: tc.output })),
  ];

  try {
    const stitched = stitchCode(dbKey, template, code);
    const judgeResponse = await judgePost("/run-tests", {
      language,
      code: stitched,
      testCases,
    });

    const visibleCount = problem.visibleTestCases.length;
    const hiddenCount  = problem.hiddenTestCases.length;

    const results = (judgeResponse.results || []).map((r, i) => {
      const isHidden = i >= visibleCount && i < visibleCount + hiddenCount;
      return {
        index:        r.index,
        passed:       r.passed,
        status:       r.status,
        stderr:       r.stderr,
        timedOut:     r.timedOut,
        elapsed:      r.elapsed,
        // Visible + custom: show full details; hidden: only pass/fail
        ...(isHidden
          ? {}
          : {
              stdin:          r.stdin,
              expectedOutput: r.expectedOutput,
              actualOutput:   r.actualOutput ?? r.stdout,
            }),
      };
    });

    const passed = results.filter((r) => r.passed).length;

    return res.json({
      totalElapsed: judgeResponse.totalElapsed,
      passed,
      failed:       results.length - passed,
      total:        results.length,
      visibleCount,
      hiddenCount,
      customCount:  customCases.length,
      results,
    });
  } catch (err) {
    console.error("[submitCode]", err);
    return res.status(500).json({ error: err.message });
  }
}