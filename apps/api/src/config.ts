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

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  publicAppUrl: process.env.PUBLIC_APP_URL ?? "https://aimusik.app",
  supabaseUrl: required("SUPABASE_URL", "https://placeholder.supabase.co"),
  supabaseAnonKey: required("SUPABASE_ANON_KEY", "placeholder-anon-key"),
  supabaseServiceRoleKey: required(
    "SUPABASE_SERVICE_ROLE_KEY",
    "placeholder-service-role-key"
  ),
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenLabsModelId: process.env.ELEVENLABS_MODEL_ID ?? "music_v2",
  githubToken: process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "",
  githubRepo: process.env.GITHUB_REPO ?? "Simer2101/ai-musik",
  githubBranch: process.env.GITHUB_BRANCH ?? "main",
  dailyGenerationLimit: Number(process.env.DAILY_GENERATION_LIMIT ?? 3),
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
  supabase:
    looksReal(config.supabaseUrl) &&
    looksReal(config.supabaseAnonKey) &&
    !config.supabaseUrl.includes("YOUR_PROJECT"),
  elevenLabs: Boolean(config.elevenLabsApiKey),
  github: Boolean(config.githubRepo),
};
