// Only photos and words that families agreed to share (permissionGiven) ever appear here.
import { queryItems } from "../../wix/items";
import { img, voice } from "../cards";
import { observeReveals } from "../site";
import { $, esc, str } from "../util";

export default async function families(): Promise<void> {
  const grid = $("[data-families]")!;
  const voices = $("[data-voices]")!;
  const allowed = [{ field: "permissionGiven", op: "eq", value: true }];
  const [f, t] = await Promise.allSettled([
    queryItems("families", { filters: allowed, sort: [{ field: "sortOrder" }], limit: 60 }),
    queryItems("testimonials", { filters: allowed, sort: [{ field: "sortOrder" }], limit: 30 }),
  ]);
  const photos = f.status === "fulfilled" ? f.value.items : [];
  const words = t.status === "fulfilled" ? t.value.items : [];
  grid.innerHTML = photos.map((x) => `<figure class="pup reveal" style="margin:0">
    <div class="frame">${img(x.photo, str(x.caption) || `${str(x.puppyName) || "A puppy"} at home with their family`, "(max-width: 880px) 100vw, 40vw", 1.25)}</div>
    <figcaption class="pup__meta"><span class="pup__name">${esc(x.puppyName)}</span><span class="pup__facts">${esc(x.caption)}</span></figcaption>
  </figure>`).join("");
  voices.innerHTML = words.map(voice).join("");
  if (!photos.length && !words.length) {
    grid.innerHTML = `<div class="empty"><h3>Photos are on their way.</h3><p class="muted">As families share photos of their puppies settling in, with their permission, they'll appear here.</p><div class="hero__ctas"><a class="btn btn--ghost" href="puppies.html">Meet the current puppies</a></div></div>`;
  }
  observeReveals(document);
}
