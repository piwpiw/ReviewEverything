const { spawnSync } = require("node:child_process");

function runStep(name, command, args) {
  console.log(`\\n[validator] ${name}`);
  const run = spawnSync(command, args, { stdio: "inherit", shell: true });
  return run.status === 0;
}

function main() {
  const results = {
    lint: runStep("lint", "npm", ["run", "lint"]),
    typecheck: runStep("typecheck", "npm", ["run", "typecheck"]),
    test: runStep("test", "npm", ["run", "test:ci"]),
    smoke: runStep("smoke", "npm", ["run", "smoke:ci"]),
  };

  const failed = Object.entries(results).filter(([, ok]) => !ok).map(([key]) => key);

  if (failed.length) {
    console.error(`\\n[validator] failed steps: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log("\\n[validator] all steps passed");
}

main();
