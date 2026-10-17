import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function loadEnvFile() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(here, "../.env"),
  ];
  const file = candidates.find((path) => existsSync(path));
  if (!file) return;

  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const flag = (name: string) => /^(1|true|yes|require)$/i.test(process.env[name] ?? "");

export const config = {
  port: Number(process.env.PORT ?? 8787),
  production: process.env.NODE_ENV === "production",
  publicAppUrl: process.env.PUBLIC_APP_URL ?? "https://sonari.app",
  /** postgresql://user:password@host:5432/dbname — from the Timeweb database panel. */
  databaseUrl: process.env.DATABASE_URL ?? "",
  databaseSsl: flag("DATABASE_SSL"),
  /** Sessions last this long without the listener signing in again. */
  sessionDays: Number(process.env.SESSION_DAYS ?? 180),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  /** API key from sms.ru → Settings → API. */
  smsRuApiId: process.env.SMS_RU_API_ID ?? "",
  /** Development only: print SMS codes to the log instead of sending them. Ignored in production. */
  smsDevEcho: flag("SMS_DEV_ECHO"),
  githubRepo: process.env.GITHUB_REPO ?? "Simer2101/ai-musik",
  githubBranch: process.env.GITHUB_BRANCH ?? "main",
  corsOrigins: (process.env.CORS_ORIGINS ?? "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

function looksReal(value: string) {
  const lower = value.toLowerCase();
  return Boolean(value) &&
    !lower.includes("placeholder") &&
    !lower.includes("your-") &&
    !lower.includes("your_");
}

export const isConfigured = {
  database: looksReal(config.databaseUrl),
  github: Boolean(config.githubRepo),
  telegram: looksReal(config.telegramBotToken),
  sms: looksReal(config.smsRuApiId) || (config.smsDevEcho && !config.production),
};
