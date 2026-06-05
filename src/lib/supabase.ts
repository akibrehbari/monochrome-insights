import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = url && key ? createClient(url, key) : null;

/** Read a JSON blob stored under `key` */
export async function dbGet<T>(key: string): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_data")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return null;
  return data.value as T;
}

/** Upsert a JSON blob under `key` */
export async function dbSet<T>(key: string, value: T): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("app_data")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
}
