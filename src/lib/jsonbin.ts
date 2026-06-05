const BIN_ID  = import.meta.env.VITE_JSONBIN_BIN_ID  as string | undefined;
const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY as string | undefined;
const BASE    = "https://api.jsonbin.io/v3/b";

export const isSyncEnabled = !!(BIN_ID && API_KEY);

/** Fetch the full data blob from JSONBin */
export async function readBin(): Promise<Record<string, unknown> | null> {
  if (!isSyncEnabled) return null;
  try {
    const res = await fetch(`${BASE}/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": API_KEY!, "X-Bin-Meta": "false" },
    });
    if (!res.ok) return null;
    return await res.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Write the full data blob to JSONBin */
export async function writeBin(data: Record<string, unknown>): Promise<void> {
  if (!isSyncEnabled) return;
  try {
    await fetch(`${BASE}/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "X-Master-Key": API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch { /* silent fail — local state is still intact */ }
}
