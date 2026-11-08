// Small DOM and formatting helpers shared by every page.
export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

export function esc(v: unknown): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export const str = (v: unknown): string => (typeof v === "string" ? v.trim() : v == null ? "" : String(v));

export const reducedMotion = (): boolean => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Rich text written by the owner in the CMS: keep the formatting, drop anything that could run. */
const ALLOWED = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "A", "UL", "OL", "LI", "H2", "H3", "H4", "BLOCKQUOTE", "SPAN"]);
export function safeHtml(html: unknown): string {
  const doc = new DOMParser().parseFromString(`<div>${str(html)}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement;
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (!ALLOWED.has(child.tagName)) {
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED"].includes(child.tagName)) child.remove();
        else child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const keep = child.tagName === "A" && attr.name === "href" && /^(https?:|mailto:|tel:|#|[\w./-]+\.html)/i.test(attr.value);
        if (!keep) child.removeAttribute(attr.name);
      }
      if (child.tagName === "A" && /^https?:/i.test(child.getAttribute("href") || "")) child.setAttribute("rel", "noopener");
      walk(child);
    }
  };
  walk(root);
  // Re-walk once: unwrapped nodes may have exposed new children.
  walk(root);
  return root.innerHTML;
}

const DAY = 86_400_000;
export function ageText(birth: unknown, now = new Date()): string {
  const t = Date.parse(str(birth));
  if (!t) return "";
  const days = Math.floor((now.getTime() - t) / DAY);
  if (days < 0) return "";
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} old`;
  const weeks = Math.floor(days / 7);
  if (weeks < 17) return `${weeks} weeks old`;
  const months = Math.floor(days / 30.44);
  return `${months} months old`;
}

export function shortAge(birth: unknown, now = new Date()): string {
  const t = Date.parse(str(birth));
  if (!t) return "";
  const weeks = Math.floor((now.getTime() - t) / (7 * DAY));
  return weeks >= 0 && weeks < 17 ? `${weeks} wks` : "";
}

export function dateText(v: unknown): string {
  const t = Date.parse(str(v));
  return t ? new Date(t).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
}

/** Going-home is at eight weeks at the earliest. */
export function readyText(birth: unknown, now = new Date()): string {
  const t = Date.parse(str(birth));
  if (!t) return "";
  const ready = new Date(t + 56 * DAY);
  if (ready.getTime() <= now.getTime()) return "Ready to go home";
  return `Ready to go home from ${ready.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })}`;
}

export function money(n: unknown): string {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "";
}

export function telHref(phone: string): string {
  const d = phone.replace(/[^0-9+]/g, "");
  return d ? `tel:${d.length === 10 ? "+1" + d : d}` : "";
}

export function setMeta(title: string, description?: string): void {
  document.title = title;
  if (description) {
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  }
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
}

export function debounce<T extends (...a: any[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout> | undefined;
  return ((...a: any[]) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }) as T;
}
