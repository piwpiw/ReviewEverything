#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function runCommand(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.stdio || 'inherit',
    cwd: options.cwd,
    shell: process.platform === 'win32',
    env: { ...process.env, ...options.env },
  });

  if (result.status !== 0) {
    const code = result.status || 1;
    if (options.exitOnFailure !== false) process.exit(code);
  }

  return result;
}

function runCapture(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: options.cwd,
    shell: process.platform === 'win32',
    env: { ...process.env, ...options.env },
  });

  const output = `${result.stdout || ''}${result.stderr || ''}`.toString();

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  return output.trim();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    message: 'chore: release',
    autoCommit: args.includes('--auto-commit'),
    fastMode: args.includes('--fast'),
    includeTest: !args.includes('--skip-tests'),
    includeSmoke: args.includes('--smoke'),
    noPush: args.includes('--no-push'),
    noBuild: args.includes('--skip-build'),
    skipVerify: args.includes('--skip-verify'),
    waitForDeploy: !args.includes('--no-wait'),
  };

  if (parsed.fastMode) {
    parsed.includeTest = false;
    parsed.noBuild = true;
  }

  parsed.includeLint = args.includes('--skip-lint') ? false : !parsed.fastMode;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--message' && i + 1 < args.length) {
      parsed.message = args[i + 1];
      i++;
      continue;
    }
    if (a.startsWith('--message=')) {
      parsed.message = a.split('=')[1];

      // Handle edge case where shell splits quoted message with spaces (npm / win32 quirk).
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed.message = `${parsed.message} ${args[i + 1]}`;
        i++;
      }
      continue;
    }
  }

  return parsed;
}

function getCurrentBranch() {
  return runCapture('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
}

function hasChanges() {
  const status = runCapture('git', ['status', '--short']);
  return status.length > 0;
}

function ensureCleanGitState() {
  const status = runCapture('git', ['status', '--short']);
  if (!status) return true;
  return false;
}

function getCanonicalAliasUrl() {
  const configPath = path.join(process.cwd(), '.vercel', 'project.json');
  if (!fs.existsSync(configPath)) {
    console.error(`[release] missing deploy config: ${configPath}`);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error(`[release] invalid deploy config JSON: ${error.message}`);
    process.exit(1);
  }

  const alias = typeof config.canonicalAlias === 'string' ? config.canonicalAlias.trim() : '';
  if (!alias) {
    console.error('[release] canonicalAlias is missing in .vercel/project.json');
    process.exit(1);
  }

  const normalized = alias.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  return `https://${normalized}`;
}

function run() {
  const options = parseArgs();
  console.log('[release] start');

  if (!options.skipVerify) {
    runCommand('npm', ['run', 'verify:local'], { cwd: process.cwd() });
  } else {
    runCommand('npm', ['run', 'deploy:target-check'], { cwd: process.cwd() });
    console.log('[release] --skip-verify enabled. Skipping local build verification.');
  }

  const branch = getCurrentBranch();
  if (!branch) {
    console.error('[release] failed to resolve git branch');
    process.exit(1);
  }

  if (options.includeLint) {
    runCommand('npm', ['run', 'lint'], { cwd: process.cwd() });
  }

  if (!options.fastMode) {
    runCommand('npm', ['run', 'typecheck'], { cwd: process.cwd() });
  }

  if (options.includeTest) {
    runCommand('npm', ['run', 'test:ci'], { cwd: process.cwd() });
  }

  if (!options.noBuild && options.skipVerify) {
    runCommand('npm', ['run', 'build'], { cwd: process.cwd(), shell: true, stdio: 'inherit' });
  }

  const dirty = hasChanges();
  if (dirty) {
    if (!options.autoCommit) {
      console.error('[release] working tree is dirty. Use --auto-commit to include local changes, or commit manually before release.');
      process.exit(1);
    }

    const msg = options.message || `Release ${new Date().toISOString()}`;
    runCommand('git', ['add', '.']);
    runCommand('git', ['commit', '-m', msg]);
    console.log(`[release] committed with message: ${msg}`);
  }

  if (!options.noPush) {
    runCommand('git', ['push', 'origin', branch]);
  }

  const vercelCheck = runCapture('vercel', ['--version']).trim();
  if (!vercelCheck) {
    console.error('[release] Vercel CLI not found. Install by: npm i -g vercel');
    process.exit(1);
  }

  if (!options.waitForDeploy) {
    console.log('[release] --no-wait is ignored because deploy:prod:auto enforces completion and alias sync.');
  }

  runCommand('npm', ['run', 'deploy:prod:auto'], { cwd: process.cwd() });
  const url = getCanonicalAliasUrl();

  console.log(`\n[release] deploy command finished`);
  console.log(`- branch: ${branch}`);
  console.log(`- production URL: ${url}`);

  if (options.includeSmoke) {
    console.log('[release] smoke check skipped in this environment. Set SMOKE_BASE_URL for verification.');
  }
}

run();
