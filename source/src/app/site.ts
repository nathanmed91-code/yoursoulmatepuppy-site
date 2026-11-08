// Everything every page shares: the owner's Settings item (copy, contact details, fonts and accent),
// the header and mobile menu, scroll reveals, and the split-line hero headline.
import { queryItems } from "../wix/items";
import { imgAttrs } from "../wix/media";
import { $, $$, debounce, esc, reducedMotion, safeHtml, str, telHref } from "./util";

export type Settings = Record<string, any>;

const SETTINGS_KEY = "ysp-settings";
const THEME_KEY = "ysp-theme";

/** Font pairings the owner can pick from (Settings → fontPairing). Each is tested against the layout. */
const FONT_PAIRS: Record<string, { href: string; display: string; body: string; weight: string; variation: string; tracking: string }> = {
  journal: {
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..600,0..100,0..1;1,9..144,300..600,0..100,0..1&family=Instrument+Sans:wght@400;500;600&display=swap",
    display: '"Fraunces", "Iowan Old Style", Georgia, serif', body: '"Instrument Sans", "Helvetica Neue", Arial, sans-serif',
    weight: "340", variation: '"SOFT" 60, "WONK" 0, "opsz" 144', tracking: "-0.025em",
  },
  modern: {
    href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600&display=swap",
    display: '"Instrument Serif", Georgia, serif', body: '"Inter Tight", "Helvetica Neue", Arial, sans-serif',
    weight: "400", variation: "normal", tracking: "-0.015em",
  },
  classic: {
    href: "https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Work+Sans:wght@400;500;600&display=swap",
    display: '"Libre Caslon Text", Georgia, serif', body: '"Work Sans", "Helvetica Neue", Arial, sans-serif',
    weight: "400", variation: "normal", tracking: "-0.03em",
  },
  soft: {
    href: "https://fonts.googleapis.com/css2?family=Young+Serif&family=Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600&display=swap",
    display: '"Young Serif", Georgia, serif', body: '"Nunito Sans", "Helvetica Neue", Arial, sans-serif',
    weight: "400", variation: "normal", tracking: "-0.02em",
  },
};

/** Accent colours (Settings → accentColor). All pass 4.5:1 on ivory, for text and for buttons. */
const ACCENTS: Record<string, string> = {
  rosewood: "#9A4A3F",
  sage: "#56664A",
  clay: "#9A5530",
  ink: "#2F3A4A",
  honey: "#7E5D1C",
};

const key = (v: unknown) => str(v).toLowerCase().replace(/[^a-z]/g, "");

export function applyTheme(s: Settings): void {
  const pair = FONT_PAIRS[key(s.fontPairing)] ?? FONT_PAIRS.journal;
  const accent = ACCENTS[key(s.accentColor)] ?? ACCENTS.rosewood;
  const vars: Record<string, string> = {
    "--font-display": pair.display,
    "--font-body": pair.body,
    "--display-weight": pair.weight,
    "--display-variation": pair.variation,
    "--display-tracking": pair.tracking,
    "--accent": accent,
  };
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(vars)) root.setProperty(k, v);
  const link = document.getElementById("font-css") as HTMLLinkElement | null;
  if (link && link.href !== pair.href) link.href = pair.href;
  try { localStorage.setItem(THEME_KEY, JSON.stringify({ vars, fontHref: pair.href })); } catch { /* private mode */ }
}

function cachedSettings(): Settings | null {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null"); } catch { return null; }
}

let settingsPromise: Promise<Settings> | null = null;
/** The owner's Settings item. Resolves from cache at once when there is one; the fresh copy is applied when it lands. */
export function loadSettings(): Promise<Settings> {
  settingsPromise ??= queryItems("settings", { limit: 1 })
    .then((page) => {
      const s = page.items[0] ?? {};
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
      return s;
    })
    .catch(() => cachedSettings() ?? {});
  return settingsPromise;
}

export function fillSlots(s: Settings, root: ParentNode = document): void {
  for (const el of $$("[data-slot]", root)) {
    const name = el.dataset.slot!;
    if (name === "phone-link") {
      const phone = str(s.phone);
      if (phone) { el.textContent = phone; (el as HTMLAnchorElement).href = telHref(phone); }
    } else if (name === "email-link") {
      const email = str(s.email);
      if (email) { if (el.textContent?.includes("@")) el.textContent = email; (el as HTMLAnchorElement).href = `mailto:${email}`; }
    } else if (name === "instagram" || name === "facebook" || name === "youtube") {
      const url = str(s[`${name}Url`]);
      if (url) (el as HTMLAnchorElement).href = url;
      else if (s._id) el.hidden = true;
    } else if (name === "year") {
      el.textContent = String(new Date().getFullYear());
    } else if (name === "announcement") {
      const text = str(s.announcement);
      el.textContent = text;
      el.hidden = !text;
    } else if (name === "service-area") {
      if (str(s.serviceArea)) el.textContent = str(s.serviceArea);
    } else {
      const text = str(s[name]);
      const current = el.dataset.text ?? el.textContent;
      if (text && current !== text) {
        el.textContent = text;
        if (el.hasAttribute("data-split") && el.dataset.text) splitLines(el, true);
      }
    }
  }
  for (const el of $$<HTMLElement>("[data-slot-html]", root)) {
    const html = str(s[el.dataset.slotHtml!]);
    if (html) el.innerHTML = safeHtml(html);
  }
  for (const img of $$<HTMLImageElement>("[data-slot-img]", root)) {
    const value = s[img.dataset.slotImg!];
    if (!value) continue;
    const frame = img.closest(".frame");
    const ratio = frame?.classList.contains("frame--4x5") ? 1.25 : frame?.classList.contains("frame--3x4") ? 4 / 3 : 768 / 1376;
    const attrs = imgAttrs(value, img.closest(".hero__stage") ? "(max-width: 880px) 100vw, 1440px" : "(max-width: 880px) 100vw, 50vw", ratio, [480, 768, 1080, 1376, 1920]);
    if (img.hasAttribute("fetchpriority")) attrs.loading = "eager";
    if (img.getAttribute("src") === attrs.src) continue;
    for (const [k, v] of Object.entries(attrs)) img.setAttribute(k, v);
  }
}

// ---------- Header & menu ----------
export function initHeader(): void {
  const header = $(".site-header");
  const onScroll = () => header?.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = $<HTMLButtonElement>(".menu-toggle");
  const drawer = $("#drawer");
  if (!toggle || !drawer) return;
  const label = $(".menu-toggle__label", toggle);
  const outside = [$("main"), $(".site-footer"), $(".section--charcoal")].filter(Boolean) as HTMLElement[];
  const set = (open: boolean) => {
    document.documentElement.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (label) label.textContent = open ? "Close" : "Menu";
    for (const el of outside) el.inert = open;
    drawer.inert = !open;
    if (open) $("a", drawer)?.focus();
  };
  drawer.inert = true;
  toggle.addEventListener("click", () => set(toggle.getAttribute("aria-expanded") !== "true"));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { set(false); toggle.focus(); }
  });
  drawer.addEventListener("click", (e) => { if ((e.target as Element).closest("a")) set(false); });
  matchMedia("(min-width: 881px)").addEventListener("change", (e) => { if (e.matches) set(false); });
}

// ---------- Reveals ----------
let io: IntersectionObserver | null = null;
export function observeReveals(root: ParentNode = document): void {
  const els = $$(".reveal, .reveal-img, .breed", root).filter((el) => !el.classList.contains("is-in"));
  if (!("IntersectionObserver" in window) || reducedMotion()) { els.forEach((el) => el.classList.add("is-in")); return; }
  io ??= new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io!.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach((el) => io!.observe(el));
}

// ---------- Split-line headline ----------
/** Wrap a heading's words into masked lines so they can rise in one at a time. Screen readers get the plain text. */
export function splitLines(el: HTMLElement, force = false): void {
  const text = (el.dataset.text && !force ? el.dataset.text : el.textContent || "").trim();
  if (!text) return;
  el.dataset.text = text;
  const words = text.split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
  const lines: string[][] = [];
  let top = -1;
  for (const span of $$(".w", el)) {
    const t = span.offsetTop;
    if (Math.abs(t - top) > 4) { lines.push([]); top = t; }
    lines[lines.length - 1].push(span.textContent || "");
  }
  el.innerHTML = `<span class="visually-hidden">${esc(text)}</span>` +
    lines.map((l) => `<span class="line" aria-hidden="true"><span>${esc(l.join(" "))}</span></span>`).join("");
}

export function initSplit(): void {
  const els = $$("[data-split]");
  if (!els.length) { document.documentElement.classList.add("is-ready"); return; }
  const run = () => els.forEach((el) => splitLines(el));
  const fontsReady = (document as any).fonts?.ready ?? Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 900))]).then(() => {
    run();
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add("is-ready")));
  });
  let width = innerWidth;
  addEventListener("resize", debounce(() => { if (innerWidth !== width) { width = innerWidth; run(); } }, 150));
}
