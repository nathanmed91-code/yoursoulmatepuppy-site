// The one auth seam for every Wix REST call — copied from wix-headless-templates shared/rest/client.ts.
// The visitor token is minted once, persisted in localStorage and refreshed; never minted per request.
import { WIX_CLIENT_ID } from "./config";

export const WIX_API_BASE = "https://www.wixapis.com";
const TOKEN_URL = `${WIX_API_BASE}/oauth2/token`;
const STORAGE_KEY = `wix-visitor-${WIX_CLIENT_ID}`;

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  role?: "visitor" | "member";
}

let memory: Tokens | null = null;
const store = {
  load(): Tokens | null {
    if (memory) return memory;
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memory = JSON.parse(raw) as Tokens;
    } catch {
      /* disabled or corrupt storage — mint a fresh visitor */
    }
    return memory;
  },
  save(tokens: Tokens) {
    memory = tokens;
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } catch {
      /* storage full or disabled — the session just won't survive a reload */
    }
  },
};

export async function mintTokens(body: Record<string, string>, role: Tokens["role"] = "visitor"): Promise<Tokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: WIX_CLIENT_ID, ...body }),
  });
  if (!res.ok) throw new Error(`Wix auth failed (${res.status}).`);
  const data = await res.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000, role };
}

let pending: Promise<string> | null = null;
export async function accessToken(): Promise<string> {
  const t = store.load();
  if (t && t.expiresAt - 60_000 > Date.now()) return t.accessToken;
  // Several parallel reads on first load share one mint (one visitor, not five).
  pending ??= (async () => {
    let fresh: Tokens | undefined;
    if (t?.refreshToken) {
      try {
        fresh = await mintTokens({ grantType: "refresh_token", refreshToken: t.refreshToken }, t.role ?? "visitor");
      } catch {
        /* fall through to a new visitor */
      }
    }
    fresh ??= await mintTokens({ grantType: "anonymous" });
    store.save(fresh);
    return fresh.accessToken;
  })().finally(() => {
    pending = null;
  });
  return pending;
}

export class WixApiError extends Error {
  public details?: Record<string, any>;
  constructor(message: string, public status: number, public code?: string, details?: Record<string, any>) {
    super(message);
    this.details = details;
  }
}

export async function wixRequest<T = any>(
  path: string,
  { method = "POST", body, query }: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; query?: Record<string, string | readonly string[]> } = {},
): Promise<T> {
  const url = new URL(path, WIX_API_BASE);
  for (const [k, v] of Object.entries(query ?? {})) {
    for (const item of Array.isArray(v) ? v : [v as string]) url.searchParams.append(k, String(item));
  }
  const res = await fetch(url, {
    method,
    headers: { Authorization: await accessToken(), "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let message = "", code: string | undefined, details: Record<string, any> | undefined;
    try {
      const j = await res.json();
      message = j?.message ?? "";
      code = j?.details?.applicationError?.code;
      details = j?.details;
    } catch {
      /* no JSON body */
    }
    throw new WixApiError(message || `${method} ${url.pathname} failed (${res.status}).`, res.status, code, details);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}
