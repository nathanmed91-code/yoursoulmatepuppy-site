import { queryItems } from "../../wix/items";
import { img, sampleFlag } from "../cards";
import { observeReveals } from "../site";
import { $, esc, str } from "../util";

export default async function parents(): Promise<void> {
  const root = $("[data-parents]")!;
  root.innerHTML = `<div class="grid parent-feature"><div class="parent-feature__media frame frame--4x5 skeleton"></div></div>`;
  try {
    const page = await queryItems("parents", { sort: [{ field: "sortOrder" }], limit: 50 });
    if (!page.items.length) {
      root.innerHTML = `<div class="empty"><h3>Meet the parents soon.</h3><p class="muted">Photos and stories of our moms and dads are on their way.</p></div>`;
      return;
    }
    root.innerHTML = page.items.map((p) => {
      const row = (label: string, v: unknown) => (str(v) ? `<div><dt>${label}</dt><dd>${esc(v)}</dd></div>` : "");
      return `<article class="grid parent-feature" id="${esc(p.slug)}">
  <div class="parent-feature__media frame frame--4x5 reveal-img">${img(p.photo, `${str(p.name)}, one of our ${str(p.role).toLowerCase() === "dad" ? "dads" : "moms"}`, "(max-width: 880px) 100vw, 50vw", 1.25)}</div>
  <div class="parent-feature__text">
    <p class="eyebrow">${esc([p.role, p.breed].filter(Boolean).join(" · "))}</p>
    <h2 class="reveal" style="font-size:var(--step-4);margin-bottom:20px">${esc(p.name)}</h2>
    ${str(p.temperament) ? `<p class="lede reveal" data-delay="1">${esc(p.temperament)}</p>` : ""}
    <dl class="facts">${row("Weight", p.weight)}${row("Coat", p.coat)}</dl>
    ${str(p.bio) ? `<p class="muted">${esc(p.bio)}</p>` : ""}
    ${sampleFlag(p)}
  </div>
</article>`;
    }).join("");
    observeReveals(root);
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  } catch {
    root.innerHTML = `<div class="empty"><h3>The parents couldn't load.</h3><p class="muted">Please refresh the page.</p></div>`;
  }
}
