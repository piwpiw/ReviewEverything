#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

function fail(message) {
  console.error(`[deploy-target-check] ${message}`);
  process.exit(1);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing ${label}: ${filePath}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Invalid JSON in ${label}: ${error.message}`);
  }
}

function normalizeAlias(alias) {
  return alias.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase();
}

function looksLikeDeploymentUrl(alias, projectName) {
  const escapedProject = projectName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const deploymentLike = [
    new RegExp(`^${escapedProject}-[a-z0-9]{8}\\.vercel\\.app$`, "i"),
    new RegExp(`^${escapedProject}-git-[a-z0-9]{6,}\\.vercel\\.app$`, "i"),
  ];
  return deploymentLike.some((regex) => regex.test(alias));
}

function validateConfig(config, label) {
  const requiredKeys = ["projectId", "orgId", "projectName", "canonicalAlias"];
  for (const key of requiredKeys) {
    if (!isNonEmptyString(config[key])) {
      fail(`${label} must include non-empty '${key}'.`);
    }
  }

  const canonicalAlias = normalizeAlias(config.canonicalAlias);
  if (!canonicalAlias.includes(".")) {
    fail(`${label} canonicalAlias is invalid: '${config.canonicalAlias}'.`);
  }

  if (looksLikeDeploymentUrl(canonicalAlias, config.projectName)) {
    fail(
      `${label} canonicalAlias looks like a deployment URL ('${canonicalAlias}'). Use a stable alias/domain instead.`
    );
  }

  return {
    projectId: config.projectId.trim(),
    orgId: config.orgId.trim(),
    projectName: config.projectName.trim(),
    canonicalAlias,
  };
}

function compareConfigs(appConfig, repoConfig) {
  const keys = ["projectId", "orgId", "projectName", "canonicalAlias"];
  for (const key of keys) {
    if (appConfig[key] !== repoConfig[key]) {
      fail(`Root and app deploy config mismatch for '${key}': app='${appConfig[key]}', root='${repoConfig[key]}'.`);
    }
  }
}

function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(projectRoot, "..", "..");
  const appConfigPath = path.join(projectRoot, ".vercel", "project.json");
  const repoConfigPath = path.join(repoRoot, ".vercel", "project.json");

  const appConfigRaw = readJson(appConfigPath, "apps/web/.vercel/project.json");
  const appConfig = validateConfig(appConfigRaw, "apps/web/.vercel/project.json");

  if (fs.existsSync(repoConfigPath)) {
    const repoConfigRaw = readJson(repoConfigPath, ".vercel/project.json");
    const repoConfig = validateConfig(repoConfigRaw, ".vercel/project.json");
    compareConfigs(appConfig, repoConfig);
  }

  console.log("[deploy-target-check] PASS");
  console.log(`[deploy-target-check] project: ${appConfig.projectName}`);
  console.log(`[deploy-target-check] scope: ${appConfig.orgId}`);
  console.log(`[deploy-target-check] canonicalAlias: ${appConfig.canonicalAlias}`);
}

main();
