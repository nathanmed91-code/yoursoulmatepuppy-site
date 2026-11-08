import { queryItems } from "../../wix/items";
import { breedCard, journeyItem, puppyCard, renderWeeks, voice } from "../cards";
import { observeReveals } from "../site";
import { $ } from "../util";

export default async function home(): Promise<void> {
  const featured = $("[data-featured]");
  const tasks: Promise<unknown>[] = [];

  if (featured) {
    featured.innerHTML = [0, 1, 2].map(() => `<div class="pup"><div class="frame skeleton"></div></div>`).join("");
    tasks.push(
      queryItems("puppies", {
        filters: [{ field: "status", op: "ne", value: "Home" }],
        sort: [{ field: "featured", direction: "desc" }, { field: "sortOrder", direction: "asc" }],
        limit: 3,
      }).then((page) => {
        featured.innerHTML = page.items.length
          ? page.items.map((p, i) => puppyCard(p, i === 0 ? "(max-width: 880px) 100vw, 50vw" : "(max-width: 880px) 100vw, 40vw")).join("")
          : `<div class="empty"><h3>The next litter is on its way.</h3><p class="muted">There are no puppies available right now. Join the list below and you'll hear first when there are.</p></div>`;
        observeReveals(featured);
      }).catch(() => { featured.innerHTML = `<div class="empty"><h3>Puppies couldn't load.</h3><p class="muted">Refresh the page, or <a href="puppies.html">see all puppies</a>.</p></div>`; }),
    );
  }

  const weeks = $("[data-weeks]");
  if (weeks) tasks.push(queryItems("weeks", { sort: [{ field: "sortOrder" }], limit: 8 }).then((p) => renderWeeks(weeks, p.items)).catch(() => weeks.closest("section")?.setAttribute("hidden", "")));

  const breeds = $("[data-breeds]");
  if (breeds) tasks.push(queryItems("breeds", { sort: [{ field: "sortOrder" }], limit: 6 }).then((p) => { breeds.innerHTML = p.items.map(breedCard).join(""); observeReveals(breeds); }).catch(() => breeds.closest("section")?.setAttribute("hidden", "")));

  const journey = $("[data-journey]");
  if (journey) tasks.push(queryItems("journey", { sort: [{ field: "sortOrder" }], limit: 12 }).then((p) => { journey.innerHTML = p.items.map(journeyItem).join(""); observeReveals(journey); }).catch(() => {}));

  // Family words appear only once real families have given permission. No placeholders, ever.
  const voices = $("[data-voices]");
  if (voices) tasks.push(queryItems("testimonials", { filters: [{ field: "permissionGiven", op: "eq", value: true }], sort: [{ field: "sortOrder" }], limit: 3 }).then((p) => {
    if (!p.items.length) return;
    voices.innerHTML = p.items.map(voice).join("");
    $("[data-voices-section]")?.removeAttribute("hidden");
    observeReveals(voices);
  }).catch(() => {}));

  await Promise.allSettled(tasks);
}
