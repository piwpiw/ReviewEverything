const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const cwd = process.cwd();
for (const fileName of [".env", ".env.local"]) {
  const filePath = path.join(cwd, fileName);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: true });
  }
}

const REQUIRED = [
  "DATABASE_URL",
  "DIRECT_URL",
  "CRON_SECRET",
];

const OPTIONAL = [
  "PUSH_ENDPOINT",
  "KAKAO_CHANNEL_KEY",
  "KAKAO_ENDPOINT",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "TELEGRAM_API_BASE",
];

function validateDatabaseUrl(key, value) {
  if (!value || value.trim() === "") {
    return `${key} is empty`;
  }

  if (value.includes("[YOUR_PASSWORD]")) {
    return `${key} contains placeholder [YOUR_PASSWORD]`;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch (error) {
    return `${key} is not a valid URL`;
  }

  const protocol = parsed.protocol.toLowerCase();
  const allowedProtocols = new Set(["postgres:", "postgresql:", "prisma+postgres:"]);
  if (!allowedProtocols.has(protocol)) {
    return `${key} must use postgres/postgresql/prisma+postgres protocol`;
  }

  if (parsed.hostname.toLowerCase() === "db.prisma.io") {
    return `${key} host 'db.prisma.io' is usually invalid without a project-specific endpoint`;
  }

  return null;
}

const missing = REQUIRED.filter((key) => !process.env[key] || process.env[key].trim() === "");
if (missing.length > 0) {
  console.error(`[deploy-env-check] Missing required environment variables: ${missing.join(", ")}`);
  console.error("Set them in .env or .env.local (local) and in deployment environment before deploy.");
  process.exit(1);
}

const hasAdminPassword = typeof process.env.ADMIN_PASSWORD === "string" && process.env.ADMIN_PASSWORD.trim() !== "";
if (!hasAdminPassword) {
  console.warn("[deploy-env-check] ADMIN_PASSWORD is missing. Falling back to CRON_SECRET for admin API gate.");
}

const dbUrlErrors = ["DATABASE_URL", "DIRECT_URL"]
  .map((key) => validateDatabaseUrl(key, process.env[key]))
  .filter(Boolean);
if (dbUrlErrors.length > 0) {
  console.error("[deploy-env-check] Invalid database configuration:");
  for (const message of dbUrlErrors) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

const emptyOptional = OPTIONAL.filter((key) => process.env[key] === "");
if (emptyOptional.length > 0) {
  console.log(`[deploy-env-check] Optional environment variables are intentionally empty: ${emptyOptional.join(", ")}`);
}

console.log(`[deploy-env-check] Required environment variables are present: ${REQUIRED.join(", ")}`);
console.log(`[deploy-env-check] Optional environment variables: ${OPTIONAL.join(", ")}`);
