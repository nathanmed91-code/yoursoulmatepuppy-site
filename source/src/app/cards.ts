// Markup for the repeating pieces: puppy cards, breed guides, steps, questions, family quotes.
import type { CmsItem } from "../wix/items-core";
import { imgAttrs } from "../wix/media";
import { $, $$, esc, shortAge, str } from "./util";

export function img(value: unknown, alt: string, sizes: string, ratio: number, extra = ""): string {
  const a = imgAttrs(value, sizes, ratio, [360, 540, 720, 960, 1200]);
  if (!a.src) return "";
  return `<img src="${esc(a.src)}" srcset="${esc(a.srcset)}" sizes="${esc(a.sizes)}" alt="${esc(alt)}" loading="lazy" decoding="async"${extra}>`;
}

export const STATUS_LABEL: Record<string, string> = { Available: "Available", Reserved: "Reserved", Home: "Gone home" };
export function statusBadge(status: unknown, cls = ""): string {
  const s = str(status) || "Available";
  return `<span class="status status--${esc(s.toLowerCase())} ${cls}">${esc(STATUS_LABEL[s] ?? s)}</span>`;
}

/** Every sample record says so on screen, so nobody mistakes a placeholder for a real puppy or parent. */
export const sampleFlag = (item: CmsItem): string => (item.isSample ? `<span class="sample-flag">Sample listing</span>` : "");

export function puppyCard(p: CmsItem, sizes = "(max-width: 880px) 100vw, 40vw"): string {
  const name = str(p.name) || "Puppy";
  const facts = [str(p.breed), str(p.sex), shortAge(p.birthDate)].filter(Boolean).join(" · ");
  const alt = `${name}, a ${[str(p.coat).toLowerCase(), str(p.breed)].filter(Boolean).join(" ")} puppy`;
  const photo = p.photo
    ? img(p.photo, alt, sizes, 1.25)
    : `<span class="frame--placeholder">Photo coming soon</span>`;
  return `<a class="pup reveal" href="puppy.html?slug=${encodeURIComponent(str(p.slug))}">
  <div class="frame">${photo}</div>
  <div class="pup__tags">${statusBadge(p.status, "chip-on-photo")}${sampleFlag(p)}</div>
  <div class="pup__meta"><span class="pup__name">${esc(name)}</span><span class="pup__facts">${esc(facts)}</span></div>
  ${str(p.summary) ? `<p class="pup__summary">${esc(p.summary)}</p>` : ""}
</a>`;
}

const SCALE_MAX = 15;
export function breedCard(b: CmsItem): string {
  const min = Number(b.adultWeightMinLb) || 0;
  const max = Number(b.adultWeightMaxLb) || 0;
  const scale = max > 0
    ? `<div class="scale" aria-hidden="true">
    <div class="scale__track"><span class="scale__range" style="left:${(min / SCALE_MAX) * 100}%;width:${((max - min) / SCALE_MAX) * 100}%"></span></div>
    <div class="scale__ticks"><span>0</span><span>5</span><span>10</span><span>15 lb</span></div>
  </div>
  <p class="scale__label">Typically ${min}–${max} lb as an adult</p>`
    : "";
  const row = (label: string, v: unknown) => (str(v) ? `<div><dt>${label}</dt><dd>${esc(v)}</dd></div>` : "");
  return `<article class="breed">
  <h3>${esc(b.name)}</h3>
  ${str(b.summary) ? `<p class="muted">${esc(b.summary)}</p>` : ""}
  ${scale}
  <dl>${row("Temperament", b.temperament)}${row("Grooming", b.grooming)}${row("Exercise", b.exercise)}${row("A good fit for", b.goodFor)}</dl>
</article>`;
}

export const journeyItem = (j: CmsItem, i: number): string =>
  `<li class="reveal" data-delay="${i % 3}"><div><h3>${esc(j.title)}</h3><p>${esc(j.body)}</p></div></li>`;

/** Questions Elia ticked "Hide from site" (drafts) never show. */
export const FAQ_VISIBLE = [{ field: "hidden", op: "ne", value: true }];

export const faqItem = (f: CmsItem, id = ""): string =>
  `<details${id ? ` id="${esc(id)}"` : ""}><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`;

export function voice(t: CmsItem): string {
  const by = [str(t.name), str(t.location)].filter(Boolean).join(", ");
  const pup = str(t.puppyName) ? ` · ${esc(t.puppyName)}'s family` : "";
  return `<figure class="voice reveal"><blockquote>“${esc(t.quote)}”</blockquote><figcaption>${esc(by)}${pup}</figcaption></figure>`;
}

/** The sticky "first eight weeks" chapter: text scrolls, the photo beside it changes with each stage. */
export function renderWeeks(root: HTMLElement, weeks: CmsItem[]): void {
  const stack = $(".weeks__stack", root)!;
  const progress = $(".weeks__progress", root)!;
  const list = $(".weeks__list", root)!;
  if (!weeks.length) { root.closest("section")?.setAttribute("hidden", ""); return; }
  stack.innerHTML = weeks.map((w, i) => img(w.photo, "", "(max-width: 880px) 100vw, 45vw", 1.25, i === 0 ? ' class="is-active"' : "")).join("");
  progress.innerHTML = weeks.map((_, i) => `<span${i === 0 ? ' class="is-done"' : ""}></span>`).join("");
  list.innerHTML = weeks.map((w) => `<li class="weeks__item">
    <div class="frame">${img(w.photo, "", "100vw", 0.75)}</div>
    <p class="weeks__label">${esc(w.label)}</p><h3>${esc(w.title)}</h3><p>${esc(w.body)}</p>
  </li>`).join("");
  const imgs = $$("img", stack);
  const bars = $$("span", progress);
  const items = $$(".weeks__item", list);
  const setActive = (i: number) => {
    imgs.forEach((im, k) => im.classList.toggle("is-active", k === i));
    bars.forEach((b, k) => b.classList.toggle("is-done", k <= i));
  };
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) setActive(items.indexOf(e.target as HTMLElement));
  }, { rootMargin: "-45% 0px -45% 0px" });
  items.forEach((it) => io.observe(it));
}
