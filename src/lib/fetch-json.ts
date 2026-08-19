export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    if (!res.ok || !text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
