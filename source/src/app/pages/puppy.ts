// One puppy's page: gallery with lightbox, the facts, care notes, parents, and a puppy-application ask.
// Prices are never shown; families fill out a puppy application instead.
import { getItemBy, queryItems } from "../../wix/items";
import type { CmsItem } from "../../wix/items-core";
import { imgSrc } from "../../wix/media";
import { img, puppyCard, sampleFlag, statusBadge } from "../cards";
import { observeReveals, type Settings } from "../site";
import { $, $$, ageText, dateText, esc, readyText, safeHtml, setMeta, str, telHref } from "../util";

export default async function puppy(settings: Promise<Settings>): Promise<void> {
  const root = $("[data-profile]")!;
  const slug = new URLSearchParams(location.search).get("slug") ?? "";
  let p: CmsItem | null = null;
  try {
    p = slug ? await getItemBy("puppies", "slug", slug, { include: ["mom", "dad"] }) : null;
  } catch {
    root.innerHTML = notFound("This puppy couldn't load.", "Please refresh the page. If it keeps happening, call or text Elia.");
    return;
  }
  if (!p) {
    root.innerHTML = notFound("We couldn't find that puppy.", "They may have gone home already. Here's everyone listed right now.");
    setMeta("Puppy not found | Your Soulmate Puppy");
    return;
  }
  const s = await settings;
  render(root, p, s);
  observeReveals(root);
  related(root, p);
}

function notFound(title: string, body: string): string {
  return `<section class="section"><div class="wrap"><div class="empty"><h3>${esc(title)}</h3><p class="muted">${esc(body)}</p><div class="hero__ctas"><a class="btn" href="puppies.html">See the puppies</a></div></div></div></section>`;
}

function render(root: HTMLElement, p: CmsItem, s: Settings): void {
  const name = str(p.name);
  const status = str(p.status) || "Available";
  const pronoun = str(p.sex) === "Boy" ? "him" : str(p.sex) === "Girl" ? "her" : "them";
  setMeta(`${name}, ${str(p.breed)} ${str(p.sex).toLowerCase()} | Your Soulmate Puppy`, str(p.summary) || `Meet ${name}, raised in our home in ${str(s.serviceArea) || "Gilbert, Arizona"}.`);

  const photos = [p.photo, p.photo2, p.photo3, p.photo4].filter(Boolean);
  const alt = (i: number) => `${name}, photo ${i + 1} of ${photos.length}`;
  const main = photos.length
    ? `<button class="gallery__main frame frame--4x5" type="button" aria-label="Enlarge photo">${img(photos[0], alt(0), "(max-width: 880px) 100vw, 58vw", 1.25, ' fetchpriority="high"').replace(' loading="lazy"', "")}</button>`
    : `<div class="frame frame--4x5"><span class="frame--placeholder">Photos coming soon</span></div>`;
  const thumbs = photos.length > 1
    ? `<div class="gallery__thumbs">${photos.map((ph, i) => `<button class="gallery__thumb frame frame--1x1" type="button" aria-label="Show photo ${i + 1}"${i === 0 ? ' aria-current="true"' : ""}>${img(ph, "", "15vw", 1)}</button>`).join("")}</div>`
    : "";

  const fact = (label: string, v: string) => (v ? `<div><dt>${label}</dt><dd>${esc(v)}</dd></div>` : "");
  const born = dateText(p.birthDate);
  const facts = [
    fact("Breed", str(p.breed)),
    fact("Sex", str(p.sex)),
    fact("Born", born),
    fact("Age", ageText(p.birthDate)),
    fact("Expected adult weight", str(p.expectedAdultWeight)),
    fact("Size", str(p.size)),
    fact("Coat", str(p.coat)),
    fact("Going home", status === "Available" ? readyText(p.birthDate) : ""),
  ].join("");
  const temperament = Array.isArray(p.temperament) && p.temperament.length
    ? `<ul class="tags" aria-label="Temperament">${p.temperament.map((t: unknown) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";

  const phone = str(s.phone);
  const cta = status === "Available"
    ? `<div class="hero__ctas"><a class="btn" href="apply.html?puppy=${encodeURIComponent(str(p.slug))}">Start a puppy application for ${esc(name)} <span class="arrow" aria-hidden="true">&rarr;</span></a>${phone ? `<a class="btn btn--ghost" href="${esc(telHref(phone))}">Call or text Elia</a>` : ""}</div>
       <p class="muted" style="font-size:0.9rem;margin-top:16px">Applying is free with no obligation. Applying doesn't reserve ${pronoun}.</p>`
    : status === "Reserved"
      ? `<p class="lede" style="font-size:var(--step-0)">${esc(name)} is reserved. Tell me what you're hoping for and I'll let you know about similar puppies.</p><div class="hero__ctas"><a class="btn" href="apply.html?puppy=${encodeURIComponent(str(p.breed))}">Start a puppy application</a></div>`
      : `<p class="lede" style="font-size:var(--step-0)">${esc(name)} has gone home to a new family.</p><div class="hero__ctas"><a class="btn" href="puppies.html">See who's available</a></div>`;

  const health = [
    p.vetChecked ? `<div><h3>Vet care</h3><p class="muted">Seen by our veterinarian.</p></div>` : "",
    str(p.vaccinations) ? `<div><h3>Vaccinations</h3><p class="muted">${esc(p.vaccinations)}</p></div>` : "",
    str(p.recordsNote) ? `<div><h3>Records</h3><p class="muted">${esc(p.recordsNote)}</p></div>` : "",
  ].join("");

  const parents = [p.mom, p.dad].filter((x) => x && typeof x === "object") as CmsItem[];
  const parentCards = parents.map((par) => `<a class="parent-card reveal" href="parents.html#${encodeURIComponent(str(par.slug))}">
      <div class="frame frame--4x5">${img(par.photo, `${str(par.name)}, ${str(par.role).toLowerCase()}`, "(max-width: 880px) 40vw, 20vw", 1.25)}</div>
      <div><p class="eyebrow">${esc(par.role)} · ${esc(par.breed)}</p><h3>${esc(par.name)}</h3><p class="muted">${esc(par.temperament)}</p>${sampleFlag(par)}</div>
    </a>`).join("");

  root.innerHTML = `
<section class="section section--tight">
  <div class="wrap">
    <p style="margin:0 0 28px"><a class="link-arrow" href="puppies.html"><span aria-hidden="true">&larr;</span> All puppies</a></p>
    <div class="grid profile-hero">
      <div class="profile-hero__media gallery">${main}${thumbs}</div>
      <div class="profile-hero__info">
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${statusBadge(status)}${sampleFlag(p)}</div>
        <h1>${esc(name)}</h1>
        ${str(p.summary) ? `<p class="lede">${esc(p.summary)}</p>` : ""}
        ${temperament}
        <dl class="facts">${facts}</dl>
        ${cta}
      </div>
    </div>
  </div>
</section>
${str(p.story) || health ? `<section class="section section--cream">
  <div class="wrap grid" style="row-gap:48px">
    ${str(p.story) ? `<div style="grid-column:1/span 6" class="reveal"><p class="eyebrow">About ${esc(name)}</p><div class="prose" style="font-size:var(--step-1)">${safeHtml(p.story)}</div></div>` : ""}
    ${health ? `<div style="grid-column:8/span 5"><p class="eyebrow">Care so far</p><div class="health" style="grid-template-columns:1fr">${health}</div></div>` : ""}
  </div>
</section>` : ""}
${parentCards ? `<section class="section"><div class="wrap"><p class="eyebrow">The parents</p><h2 class="reveal" style="margin-bottom:48px;font-size:var(--step-4)">Where ${esc(name)} gets it from.</h2><div class="parents-row">${parentCards}</div></div></section>` : ""}
<section class="section section--tight" data-related hidden><div class="wrap"><div class="collection-head"><div><p class="eyebrow">You might also like</p><h2 class="reveal">More puppies.</h2></div><a class="link-arrow" href="puppies.html">See every puppy <span class="arrow" aria-hidden="true">&rarr;</span></a></div><div class="collection"></div></div></section>`;

  if (photos.length) gallery(root, photos, name);
}

function gallery(root: HTMLElement, photos: unknown[], name: string): void {
  const mainBtn = $<HTMLButtonElement>(".gallery__main", root)!;
  const mainImg = $<HTMLImageElement>("img", mainBtn)!;
  const thumbs = $$<HTMLButtonElement>(".gallery__thumb", root);
  let index = 0;
  const show = (i: number) => {
    index = (i + photos.length) % photos.length;
    const tmp = document.createElement("div");
    tmp.innerHTML = img(photos[index], `${name}, photo ${index + 1} of ${photos.length}`, mainImg.sizes, 1.25);
    const next = tmp.firstElementChild as HTMLImageElement;
    mainImg.srcset = next.srcset;
    mainImg.src = next.src;
    mainImg.alt = next.alt;
    thumbs.forEach((t, k) => t.setAttribute("aria-current", String(k === index)));
  };
  thumbs.forEach((t, i) => t.addEventListener("click", () => show(i)));

  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", `Photos of ${name}`);
  box.innerHTML = `<img alt=""><button class="lightbox__close" type="button">Close</button>${photos.length > 1 ? `<button class="lightbox__prev" type="button" aria-label="Previous photo">&larr;</button><button class="lightbox__next" type="button" aria-label="Next photo">&rarr;</button>` : ""}<p class="lightbox__count" aria-live="polite"></p>`;
  document.body.append(box);
  const big = $<HTMLImageElement>("img", box)!;
  const countEl = $(".lightbox__count", box)!;
  const paint = () => {
    big.src = imgSrc(photos[index], 1600, 1600 * 0.75);
    big.alt = `${name}, photo ${index + 1} of ${photos.length}`;
    countEl.textContent = photos.length > 1 ? `${index + 1} / ${photos.length}` : "";
  };
  // The lightbox shows the whole photo, so ask Wix for it uncropped.
  const fit = (v: unknown) => imgSrc(v, 1600, 1600).replace("/v1/fill/", "/v1/fit/");
  const paintFit = () => { paint(); big.src = fit(photos[index]); };
  const open = () => { paintFit(); box.classList.add("is-open"); document.documentElement.style.overflow = "hidden"; $<HTMLButtonElement>(".lightbox__close", box)!.focus(); };
  const close = () => { box.classList.remove("is-open"); document.documentElement.style.overflow = ""; mainBtn.focus(); };
  const step = (d: number) => { show(index + d); paintFit(); };
  mainBtn.addEventListener("click", open);
  $(".lightbox__close", box)!.addEventListener("click", close);
  $(".lightbox__prev", box)?.addEventListener("click", () => step(-1));
  $(".lightbox__next", box)?.addEventListener("click", () => step(1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  box.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "Tab") {
      const btns = $$<HTMLButtonElement>("button", box);
      const i = btns.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
    }
  });
}

async function related(root: HTMLElement, p: CmsItem): Promise<void> {
  try {
    const page = await queryItems("puppies", { filters: [{ field: "status", op: "eq", value: "Available" }, { field: "slug", op: "ne", value: p.slug }], sort: [{ field: "sortOrder" }], limit: 3 });
    if (!page.items.length) return;
    const sec = $("[data-related]", root)!;
    $(".collection", sec)!.innerHTML = page.items.map((x) => puppyCard(x, "(max-width: 880px) 100vw, 30vw")).join("");
    sec.hidden = false;
    observeReveals(sec);
  } catch { /* optional section */ }
}
