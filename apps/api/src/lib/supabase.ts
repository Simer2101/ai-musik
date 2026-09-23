import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { config } from "../config.js";

export const supabaseAdmin: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const supabaseAnon: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function getUserFromToken(token?: string): Promise<User | null> {
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function publicUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
