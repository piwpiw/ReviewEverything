#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

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
    includeTest: !args.includes('--skip-tests'),
    includeSmoke: args.includes('--smoke'),
    noPush: args.includes('--no-push'),
    noBuild: args.includes('--skip-build'),
  };

  const msgArg = args.find((a) => a.startsWith('--message='));
  if (msgArg) parsed.message = msgArg.split('=')[1];

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

function getDeploymentUrl(logText) {
  const lines = logText.split(/\r?\n/).reverse();
  const urlLine = lines.find((line) => /https?:\/\//.test(line) && /\.(vercel\.app|now\.sh)/i.test(line));

  if (urlLine) {
    const match = urlLine.match(/https?:\/\/[^\s]+/);
    if (match) return match[0];
  }

  return null;
}

function run() {
  const options = parseArgs();
  console.log('[release] start');

  const branch = getCurrentBranch();
  if (!branch) {
    console.error('[release] failed to resolve git branch');
    process.exit(1);
  }

  runCommand('npm', ['run', 'lint'], { cwd: process.cwd() });
  runCommand('npm', ['run', 'typecheck'], { cwd: process.cwd() });

  if (options.includeTest) {
    runCommand('npm', ['run', 'test:ci'], { cwd: process.cwd() });
  }

  if (!options.noBuild) {
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

  const deployArgs = ['--prod', '--yes'];
  const deployOutput = runCapture('vercel', deployArgs, { cwd: process.cwd() });

  const url = getDeploymentUrl(deployOutput) || 'https://vercel.com/dashboard';

  console.log(`\n[release] deploy command finished`);
  console.log(`- branch: ${branch}`);
  console.log(`- production URL: ${url}`);
  console.log(`- raw output: ${deployOutput.split('\n').slice(-6).join('\n')}`);

  if (options.includeSmoke) {
    console.log('[release] smoke check skipped in this environment. Set SMOKE_BASE_URL for verification.');
  }
}

run();
