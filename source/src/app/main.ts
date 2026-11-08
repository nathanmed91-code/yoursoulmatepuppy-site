// Entry point. Every page shares the header, theme and newsletter signup; each page's own
// code is loaded on demand, and the 3D hero only on the home page, only where it will run well.
import { FORMS, mountForm } from "./forms-ui";
import { applyTheme, fillSlots, initHeader, initSplit, loadSettings, observeReveals } from "./site";
import { $, reducedMotion } from "./util";

const pages: Record<string, () => Promise<{ default: (s: Promise<any>) => Promise<void> }>> = {
  home: () => import("./pages/home"),
  puppies: () => import("./pages/puppies"),
  puppy: () => import("./pages/puppy"),
  parents: () => import("./pages/parents"),
  care: () => import("./pages/care"),
  journey: () => import("./pages/journey"),
  apply: () => import("./pages/apply"),
  families: () => import("./pages/families"),
  faq: () => import("./pages/faq"),
};

function boot(): void {
  const page = document.body.dataset.page ?? "";
  initHeader();
  initSplit();
  observeReveals();

  try {
    const cached = JSON.parse(localStorage.getItem("ysp-settings") || "null");
    if (cached) fillSlots(cached);
  } catch { /* ignore */ }
  const settings = loadSettings();
  settings.then((s) => { applyTheme(s); fillSlots(s); observeReveals(); });

  const signup = $("[data-form=newsletter]");
  if (signup) {
    // The signup sits near the bottom of every page: fetch its schema only as it approaches.
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      mountForm(signup, FORMS.newsletter, { variant: "newsletter" });
    }, { rootMargin: "600px 0px" });
    io.observe(signup);
  }

  pages[page]?.().then((m) => m.default(settings)).catch((e) => console.error(e));

  const stage = $("[data-hero]");
  if (stage && wantsGl()) {
    const go = () => import("./hero3d").then((m) => m.default(stage)).catch(() => {});
    const img = stage.querySelector("img");
    const later = () => ("requestIdleCallback" in window ? (window as any).requestIdleCallback(go, { timeout: 2000 }) : setTimeout(go, 600));
    if (img && !img.complete) img.addEventListener("load", later, { once: true }); else later();
  }
}

function wantsGl(): boolean {
  if (reducedMotion()) return false;
  const conn = (navigator as any).connection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "")) return false;
  if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 3) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
