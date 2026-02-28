const { spawnSync } = require("node:child_process");

function run(command, args) {
  const runResult = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (runResult.status !== 0) {
    process.exit(runResult.status || 1);
  }
}

function main() {
  console.log("[multi-agent] analyzer");
  run("node", ["scripts/refactor/analyzer.js"]);

  console.log("[multi-agent] refactorer");
  run("node", ["scripts/refactor/refactor-safe.js"]);

  console.log("[multi-agent] validator");
  run("node", ["scripts/refactor/validator.js"]);

  console.log("[multi-agent] done");
}

main();
