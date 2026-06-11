const express = require("express");
const { spawn } = require("child_process");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const app = express();

app.use(express.json({ limit: "64kb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5000" }));

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3000", 10);
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || "10000", 10);
const POOL_SIZE = parseInt(process.env.POOL_SIZE || "1", 10);
const RECYCLE_AFTER = parseInt(process.env.RECYCLE_AFTER || "200", 10);
const MAX_OUTPUT = parseInt(process.env.MAX_OUTPUT || "10000", 10);
const MAX_CODE_LENGTH = parseInt(process.env.MAX_CODE_LENGTH || "65536", 10);
const MAX_TEST_CASES = parseInt(process.env.MAX_TEST_CASES || "20", 10);
const MAX_QUEUE_DEPTH = parseInt(process.env.MAX_QUEUE_DEPTH || "100", 10);

// Rate limits — editor (/run) vs submission (/submit)
const RUN_LIMIT_WINDOW = parseInt(process.env.RUN_LIMIT_WINDOW || "60000", 10);
const RUN_LIMIT_MAX = parseInt(process.env.RUN_LIMIT_MAX || "30", 10); // frequent: code editor
const SUB_LIMIT_WINDOW = parseInt(process.env.SUB_LIMIT_WINDOW || "60000", 10);
const SUB_LIMIT_MAX = parseInt(process.env.SUB_LIMIT_MAX || "5", 10); // rare: final submit

// ─────────────────────────────────────────────
// Language definitions
// ─────────────────────────────────────────────

const LANGUAGES = {
  javascript: {
    ext: "js",
    image: "judge-sandbox:latest",
    command: (file, _bin) => ["timeout", "5s", "node", `/tmp/${file}`],
  },
  python: {
    ext: "py",
    image: "judge-sandbox:latest",
    command: (file, _bin) => ["timeout", "5s", "python3", "-u", `/tmp/${file}`],
  },
  c: {
    ext: "c",
    image: "judge-sandbox:latest",
    command: (file, bin) => [
      "timeout",
      "5s",
      "sh",
      "-c",
      `gcc /tmp/${file} -O2 -pipe -s -o /tmp/${bin} -lm && /tmp/${bin}`,
    ],
  },
  cpp: {
    ext: "cpp",
    image: "judge-sandbox:latest",
    command: (file, bin) => [
      "timeout",
      "5s",
      "sh",
      "-c",
      `g++ /tmp/${file} -O2 -pipe -s -o /tmp/${bin} && /tmp/${bin}`,
    ],
  },
};

// Language key normalisation: accept "js"/"py" aliases from DB
const LANG_ALIASES = { js: "javascript", py: "python" };
function resolveLanguage(lang) {
  return LANG_ALIASES[lang] || lang;
}

// ─────────────────────────────────────────────
// DB stub  (replace with your real Mongo client)
// ─────────────────────────────────────────────

/**
 * Fetch a problem document by slug.
 * Shape expected:
 *   { header, driver, visibleTestCases, hiddenTestCases, codeStub, timeLimit }
 *
 * Replace this with your actual DB call, e.g.:
 *   const Problem = require('./models/problem');
 *   async function fetchProblem(slug) { return Problem.findOne({ slug }); }
 */
async function fetchProblem(slug) {
  // TODO: replace with real DB lookup
  throw new Error(`fetchProblem("${slug}") — wire up your DB here`);
}

// ─────────────────────────────────────────────
// Code assembly  (SERVER-SIDE — clients never see drivers or hidden cases)
// ─────────────────────────────────────────────

/**
 * Assemble a complete, runnable program from problem metadata + user code.
 *
 * Order: header  →  userCode  →  driver
 *
 * The driver owns main() / top-level IO.  userCode is a pure function/solution.
 * Neither hidden test cases nor driver logic ever leave this process.
 */
function assembleCode(problem, language, userCode) {
  const langKey = resolveLanguage(language); // "js" → "javascript"
  const dbKey =
    { javascript: "js", python: "py", c: "c", cpp: "cpp" }[langKey] || langKey;

  const header = problem.header?.[dbKey] ?? "";
  const driver = problem.driver?.[dbKey];

  if (!driver)
    throw new Error(
      `No driver found for language "${language}" on this problem`,
    );

  return [header, userCode, driver].filter(Boolean).join("\n\n");
}

// ─────────────────────────────────────────────
// Spawn helper
// ─────────────────────────────────────────────

function runProcess(command, args, stdin = "") {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);

    let stdout = "";
    let stderr = "";
    let killed = false;
    let outputExceeded = false;

    const killChild = (reason) => {
      if (killed) return;
      killed = true;
      if (reason === "output") outputExceeded = true;
      try {
        child.kill("SIGKILL");
      } catch {}
    };

    const timer = setTimeout(() => killChild("timeout"), TIMEOUT_MS);

    child.stdout.on("data", (data) => {
      if (killed) return;
      stdout += data.toString();
      if (stdout.length > MAX_OUTPUT) {
        stdout = stdout.slice(0, MAX_OUTPUT);
        stderr += "\n[Output limit exceeded]";
        killChild("output");
      }
    });

    child.stderr.on("data", (data) => {
      if (killed) return;
      stderr += data.toString();
      if (stderr.length > MAX_OUTPUT) {
        stderr = stderr.slice(0, MAX_OUTPUT);
        killChild("output");
      }
    });

    child.on("error", reject);

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: code,
        signal,
        timedOut: killed && !outputExceeded,
        outputExceeded,
      });
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}

// ─────────────────────────────────────────────
// Container helpers
// ─────────────────────────────────────────────

async function containerExists(name) {
  const r = await runProcess("docker", [
    "ps",
    "-a",
    "--filter",
    `name=^${name}$`,
    "--format",
    "{{.Names}}",
  ]);
  return r.stdout.trim() === name;
}

async function startContainer(name, language) {
  const lang = LANGUAGES[language];
  await runProcess("docker", [
    "run",
    "-d",
    "--init",
    "--name",
    name,
    "--network",
    "none",
    "--memory",
    "256m",
    "--memory-swap",
    "256m",
    "--memory-swappiness",
    "0",
    "--oom-kill-disable=false",
    "--cpus",
    "1",
    "--pids-limit",
    "64",
    "--read-only",
    "--tmpfs",
    "/tmp:rw,exec,nosuid,size=64m",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--user",
    "1000:1000",
    lang.image,
    "sleep",
    "infinity",
  ]);
}

async function removeContainer(name) {
  await runProcess("docker", ["rm", "-f", name]);
}

async function copyCode(container, filename, code) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", [
      "exec",
      "-i",
      container,
      "tee",
      `/tmp/${filename}`,
    ]);
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.stdin.write(code);
    child.stdin.end();
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tee failed (exit ${code}): ${stderr.trim()}`));
    });
  });
}

async function cleanupTmp(container) {
  try {
    await runProcess("docker", [
      "exec",
      container,
      "find",
      "/tmp",
      "-mindepth",
      "1",
      "-delete",
    ]);
  } catch {
    /* best-effort */
  }
}

// ─────────────────────────────────────────────
// Container pool  (work-queue model, not round-robin)
// ─────────────────────────────────────────────

class ContainerPool {
  constructor(language, size) {
    this.language = language;
    this.size = size;
    this.freeSlots = []; // slot objects ready to accept work
    this.queue = []; // { code, stdin?, testCases?, resolve, reject, kind }
  }

  slotName(index) {
    return `judge-${this.language}-${index}`;
  }

  async init() {
    for (let i = 0; i < this.size; i++) {
      const name = this.slotName(i);
      if (await containerExists(name)) {
        console.log(`[pool:${this.language}:${i}] removing stale container`);
        await removeContainer(name);
      }
      console.log(`[pool:${this.language}:${i}] starting`);
      await startContainer(name, this.language);
      this.freeSlots.push({ name, executions: 0, recycling: false });
    }
  }

  // ── Public: enqueue a single run ─────────────────────────────────────────

  execute(code, stdin = "") {
    return new Promise((resolve, reject) => {
      this.queue.push({ kind: "run", code, stdin, resolve, reject });
      this._drain();
    });
  }

  // ── Public: enqueue a test batch ─────────────────────────────────────────

  executeTests(code, testCases) {
    return new Promise((resolve, reject) => {
      this.queue.push({ kind: "tests", code, testCases, resolve, reject });
      this._drain();
    });
  }

  // ── Internal: pull next job onto next free slot ───────────────────────────

  _drain() {
    while (this.queue.length > 0 && this.freeSlots.length > 0) {
      const slot = this.freeSlots.pop();
      const job = this.queue.shift();
      this._dispatch(slot, job);
    }
  }

  async _dispatch(slot, job) {
    try {
      let result;
      if (job.kind === "run") {
        result = await this._runOne(slot, job.code, job.stdin);
      } else {
        result = await this._runTests(slot, job.code, job.testCases);
      }
      job.resolve(result);
    } catch (err) {
      job.reject(err);
    } finally {
      slot.executions +=
        job.kind === "tests" ? (job.testCases?.length ?? 1) : 1;

      if (slot.executions >= RECYCLE_AFTER && !slot.recycling) {
        slot.recycling = true;
        setImmediate(() => this._recycle(slot));
      } else {
        this.freeSlots.push(slot);
        this._drain();
      }
    }
  }

  // ── Execution internals ───────────────────────────────────────────────────

  async _runOne(slot, code, stdin) {
    const lang = LANGUAGES[this.language];
    const filename = `${crypto.randomUUID()}.${lang.ext}`;
    const binary = crypto.randomUUID();

    try {
      await copyCode(slot.name, filename, code);
      return await runProcess(
        "docker",
        ["exec", "-i", slot.name, ...lang.command(filename, binary)],
        stdin,
      );
    } finally {
      await cleanupTmp(slot.name);
    }
  }

  async _runTests(slot, code, testCases) {
    const lang = LANGUAGES[this.language];
    const filename = `${crypto.randomUUID()}.${lang.ext}`;
    const binary = crypto.randomUUID();
    const results = [];

    try {
      await copyCode(slot.name, filename, code);

      const isCompiled = this.language === "c" || this.language === "cpp";

      if (isCompiled) {
        const compileCmd =
          this.language === "c"
            ? `gcc /tmp/${filename} -O2 -pipe -s -o /tmp/${binary} -lm`
            : `g++ /tmp/${filename} -O2 -pipe -s -o /tmp/${binary}`;

        const compileResult = await runProcess("docker", [
          "exec",
          "-i",
          slot.name,
          "sh",
          "-c",
          compileCmd,
        ]);

        if (compileResult.exitCode !== 0) {
          return testCases.map((tc, i) => ({
            index: i,
            passed: false,
            status: "compile_error",
            stdin: tc.input,
            expectedOutput: tc.output,
            actualOutput: "",
            stderr: compileResult.stderr,
            exitCode: compileResult.exitCode,
            timedOut: false,
            outputExceeded: false,
            elapsed: 0,
          }));
        }
      }

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const stdin = tc.input ?? "";
        const expected = normalizeOutput(tc.output ?? "");

        const runCmd = isCompiled
          ? ["exec", "-i", slot.name, "timeout", "5s", `/tmp/${binary}`]
          : ["exec", "-i", slot.name, ...lang.command(filename, binary)];

        const t0 = Date.now();
        const runResult = await runProcess("docker", runCmd, stdin);
        const elapsed = Date.now() - t0;

        const actual = normalizeOutput(runResult.stdout);
        const passed =
          !runResult.timedOut &&
          !runResult.outputExceeded &&
          runResult.exitCode === 0 &&
          actual === expected;

        results.push({
          index: i,
          passed,
          status: deriveStatus(runResult, passed),
          stdin,
          expectedOutput: tc.output ?? "",
          actualOutput: runResult.stdout,
          stderr: runResult.stderr,
          exitCode: runResult.exitCode,
          signal: runResult.signal,
          timedOut: runResult.timedOut || false,
          outputExceeded: runResult.outputExceeded || false,
          elapsed,
        });
      }
    } finally {
      await cleanupTmp(slot.name);
    }

    return results;
  }

  // ── Recycle ───────────────────────────────────────────────────────────────

  async _recycle(slot) {
    const index = this.slots ? this.slots.indexOf(slot) : "?";
    console.log(
      `[pool:${this.language}:${index}] recycling after ${slot.executions} executions`,
    );
    try {
      await removeContainer(slot.name);
      await startContainer(slot.name, this.language);
      slot.executions = 0;
      slot.recycling = false;
      this.freeSlots.push(slot);
      this._drain();
      console.log(`[pool:${this.language}:${index}] recycled OK`);
    } catch (err) {
      console.error(`[pool:${this.language}:${index}] recycle failed`, err);
      setTimeout(() => this._recycle(slot), 5000);
    }
  }

  async destroy() {
    for (let i = 0; i < this.size; i++) {
      try {
        await removeContainer(this.slotName(i));
      } catch {}
    }
  }

  get queueDepth() {
    return this.queue.length;
  }

  status() {
    return {
      freeSlots: this.freeSlots.length,
      busySlots: this.size - this.freeSlots.length,
      queueDepth: this.queue.length,
      slots: [...this.freeSlots].map((s) => ({
        name: s.name,
        executions: s.executions,
        recycling: s.recycling,
      })),
    };
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function normalizeOutput(str) {
  return (str || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();
}

function deriveStatus(result, passed) {
  if (result.timedOut) return "time_limit_exceeded";
  if (result.outputExceeded) return "output_limit_exceeded";
  if (result.exitCode !== 0) return "runtime_error";
  if (!passed) return "wrong_answer";
  return "accepted";
}

function totalQueueDepth() {
  return Object.values(pools).reduce((sum, p) => sum + p.queueDepth, 0);
}

// ─────────────────────────────────────────────
// Pool registry
// ─────────────────────────────────────────────

const pools = {};

async function initPools() {
  for (const language of Object.keys(LANGUAGES)) {
    pools[language] = new ContainerPool(language, POOL_SIZE);
    await pools[language].init();
  }
}

async function destroyPools() {
  for (const pool of Object.values(pools)) {
    await pool.destroy();
  }
}

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

function validate(body) {
  const { language, code, stdin } = body || {};
  if (!language || !LANGUAGES[resolveLanguage(language)])
    return "Unsupported language";
  if (typeof code !== "string" || !code.trim()) return "Code must be non-empty";
  if (code.length > MAX_CODE_LENGTH)
    return `Code exceeds ${MAX_CODE_LENGTH} byte limit`;
  if (stdin !== undefined && typeof stdin !== "string")
    return "stdin must be a string";
  return null;
}

function validateSubmit(body) {
  const { language, userCode, problemSlug } = body || {};
  if (!language || !LANGUAGES[resolveLanguage(language)])
    return "Unsupported language";
  if (typeof userCode !== "string" || !userCode.trim())
    return "userCode must be non-empty";
  if (userCode.length > MAX_CODE_LENGTH)
    return `userCode exceeds ${MAX_CODE_LENGTH} byte limit`;
  if (typeof problemSlug !== "string" || !problemSlug.trim())
    return "problemSlug must be a non-empty string";
  return null;
}

// ─────────────────────────────────────────────
// Rate limiters  — SEPARATE budgets per use-case
// ─────────────────────────────────────────────

// /run  — code editor "Run" button, hits frequently
const runLimiter = rateLimit({
  windowMs: RUN_LIMIT_WINDOW,
  max: RUN_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many run requests, slow down" },
});

// /submit — final submission, should be rare
const submitLimiter = rateLimit({
  windowMs: SUB_LIMIT_WINDOW,
  max: SUB_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions, please wait before resubmitting" },
});

app.use("/run", runLimiter);
app.use("/submit", submitLimiter);

// ─────────────────────────────────────────────
// Queue depth guard  (shared across all pools)
// ─────────────────────────────────────────────

function checkQueueDepth(req, res, next) {
  if (totalQueueDepth() >= MAX_QUEUE_DEPTH) {
    return res.status(503).json({ error: "Server busy, try again shortly" });
  }
  next();
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

// Health
app.get("/health", (_req, res) => {
  const poolStatus = {};
  for (const [lang, pool] of Object.entries(pools)) {
    poolStatus[lang] = pool.status();
  }
  res.json({
    status: "ok",
    poolSize: POOL_SIZE,
    queueDepth: totalQueueDepth(),
    pools: poolStatus,
  });
});

// ── /run — code editor scratchpad ────────────────────────────────────────────
//   Accepts raw code + optional stdin.  No problem DB lookup.
//   Use this for "Run" button (user-visible test cases only, no grading).
app.post("/run", checkQueueDepth, async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const { code, stdin = "" } = req.body;
  const language = resolveLanguage(req.body.language);
  const pool = pools[language];
  if (!pool) return res.status(503).json({ error: "Pool not ready" });

  const queuedAt = Date.now();
  try {
    const result = await pool.execute(code, stdin);
    return res.json({
      elapsed: Date.now() - queuedAt,
      exitCode: result.exitCode,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
      timedOut: result.timedOut || false,
      outputExceeded: result.outputExceeded || false,
    });
  } catch (err) {
    console.error("[/run]", err);
    return res.status(500).json({ error: "Execution failed" });
  }
});

// ── /submit — graded submission ───────────────────────────────────────────────
//   Accepts userCode + problemSlug.  Fetches problem from DB server-side.
//   Assembles full program (header + userCode + driver).
//   Runs ALL test cases (visible + hidden).  Hidden cases never sent to client.
app.post("/submit", checkQueueDepth, async (req, res) => {
  const error = validateSubmit(req.body);
  if (error) return res.status(400).json({ error });

  const { userCode, problemSlug } = req.body;
  const language = resolveLanguage(req.body.language);
  const pool = pools[language];
  if (!pool) return res.status(503).json({ error: "Pool not ready" });

  // ── Fetch problem (server-side only) ──────────────────────────────────────
  let problem;
  try {
    problem = await fetchProblem(problemSlug);
    if (!problem) return res.status(404).json({ error: "Problem not found" });
  } catch (err) {
    console.error("[/submit] DB error", err);
    return res.status(500).json({ error: "Could not load problem" });
  }

  // ── Assemble full code ────────────────────────────────────────────────────
  let code;
  try {
    code = assembleCode(problem, language, userCode);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // ── Combine visible + hidden — order matters for index alignment ──────────
  const visibleCount = problem.visibleTestCases?.length ?? 0;
  const testCases = [
    ...(problem.visibleTestCases ?? []),
    ...(problem.hiddenTestCases ?? []),
  ];

  if (testCases.length === 0) {
    return res.status(500).json({ error: "Problem has no test cases" });
  }
  if (testCases.length > MAX_TEST_CASES) {
    return res.status(500).json({ error: "Problem exceeds test case limit" });
  }

  // ── Execute ───────────────────────────────────────────────────────────────
  const batchStart = Date.now();
  try {
    const results = await pool.executeTests(code, testCases);
    const passed = results.filter((r) => r.passed).length;

    // Strip hidden test case inputs/outputs from the response.
    // The client sees: visible results in full, hidden results as pass/fail only.
    const sanitizedResults = results.map((r, i) => {
      const isHidden = i >= visibleCount;
      if (isHidden) {
        return {
          index: r.index,
          passed: r.passed,
          status: r.status,
          // No stdin / expectedOutput / actualOutput for hidden cases
          stderr: r.stderr,
          exitCode: r.exitCode,
          timedOut: r.timedOut,
          elapsed: r.elapsed,
        };
      }
      return r;
    });

    return res.json({
      totalElapsed: Date.now() - batchStart,
      passed,
      failed: results.length - passed,
      total: results.length,
      results: sanitizedResults,
    });
  } catch (err) {
    console.error("[/submit]", err);
    return res.status(500).json({ error: "Test execution failed" });
  }
});

// ─────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────

async function shutdown(signal) {
  console.log(`\n[shutdown] received ${signal}`);
  await destroyPools();
  console.log("[shutdown] all containers removed");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ─────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────

(async () => {
  console.log(`[boot] starting ${POOL_SIZE} containers per language…`);
  await initPools();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[boot] judge running on port ${PORT}`);
  });
})();
