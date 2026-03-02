const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
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

const missing = REQUIRED.filter((key) => !process.env[key] || process.env[key].trim() === "");
if (missing.length > 0) {
  console.error(`[deploy-env-check] Missing required environment variables: ${missing.join(", ")}`);
  console.error("Set them in .env.local or CI/environment before deploy.");
  process.exit(1);
}

const emptyOptional = OPTIONAL.filter((key) => process.env[key] === "");
if (emptyOptional.length > 0) {
  console.log(`[deploy-env-check] Optional environment variables are intentionally empty: ${emptyOptional.join(", ")}`);
}

console.log(`[deploy-env-check] Required environment variables are present: ${REQUIRED.join(", ")}`);
console.log(`[deploy-env-check] Optional environment variables: ${OPTIONAL.join(", ")}`);
