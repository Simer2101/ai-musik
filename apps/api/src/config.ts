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
  dailyGenerationLimit: Number(process.env.DAILY_GENERATION_LIMIT ?? 3),
  corsOrigins: (process.env.CORS_ORIGINS ?? "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export const isConfigured = {
  supabase:
    !config.supabaseUrl.includes("placeholder") &&
    !config.supabaseAnonKey.includes("placeholder"),
  elevenLabs: Boolean(config.elevenLabsApiKey),
};
