#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const mode = process.argv[2] === "qa" ? "qa" : "review";
const reportPath = path.join(process.cwd(), "reports", `agent-${mode}-summary.md`);

const stepsByMode = {
  review: [
    { name: "lint", cmd: ["run", "lint"] },
    { name: "typecheck", cmd: ["run", "typecheck"] },
    { name: "test", cmd: ["run", "test:ci"] },
  ],
  qa: [
    { name: "lint", cmd: ["run", "lint"] },
    { name: "typecheck", cmd: ["run", "typecheck"] },
    { name: "test", cmd: ["run", "test:ci"] },
    { name: "smoke", cmd: ["run", "smoke:ci"] },
    { name: "build", cmd: ["run", "build"] },
  ],
};

function run(step) {
  const started = Date.now();
  const result = spawnSync("npm", step.cmd, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const elapsedMs = Date.now() - started;
  return {
    name: step.name,
    exitCode: result.status ?? 0,
    elapsedMs,
    ok: (result.status ?? 0) === 0,
  };
}

function main() {
  const steps = stepsByMode[mode];
  const results = [];
  let hasFailure = false;

  fs.mkdirSync(path.join(process.cwd(), "reports"), { recursive: true });

  for (const step of steps) {
    const r = run(step);
    results.push(r);
    if (!r.ok) {
      hasFailure = true;
      break;
    }
  }

  const lines = [
    `# Agent Gate Report (${mode.toUpperCase()})`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Step | Result | Duration(ms) |",
    "| --- | --- | --- |",
  ];

  for (const r of results) {
    lines.push(`| ${r.name} | ${r.ok ? "PASS" : "FAIL"} | ${r.elapsedMs} |`);
  }

  if (results.length < steps.length) {
    for (let i = results.length; i < steps.length; i++) {
      lines.push(`| ${steps[i].name} | SKIPPED | - |`);
    }
  }

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
  console.log(`[agent:${mode}] report -> ${reportPath}`);

  if (hasFailure) {
    console.error(`[agent:${mode}] failed. fix and rerun.`);
    process.exit(1);
  }

  console.log(`[agent:${mode}] completed`);
}

main();
