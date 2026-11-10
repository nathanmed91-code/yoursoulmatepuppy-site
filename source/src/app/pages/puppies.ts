// Puppy discovery: filter by breed, sex, size and availability. Filters live in the URL so a
// filtered view can be shared or bookmarked; every query goes to the CMS, so what shows is what Elia listed.
import { queryItems } from "../../wix/items";
import type { CmsFilter } from "../../wix/items-core";
import { STATUS_LABEL, puppyCard } from "../cards";
import { observeReveals } from "../site";
import { $, $$, esc } from "../util";

const PAGE = 12;
type Group = "breed" | "sex" | "size" | "status";

export default async function puppies(): Promise<void> {
  const grid = $("[data-collection]")!;
  const count = $("[data-count]")!;
  const more = $("[data-more]")!;
  const form = $<HTMLFormElement>("[data-filters]")!;

  let breedNames = ["Yorkie", "Yorkipoo", "Morkie"];
  try {
    const b = await queryItems("breeds", { sort: [{ field: "sortOrder" }], limit: 20 });
    if (b.items.length) breedNames = b.items.map((x) => String(x.name));
  } catch { /* keep defaults */ }

  const options: Record<Group, [string, string][]> = {
    breed: breedNames.map((n) => [n, n]),
    sex: [["Girl", "Girls"], ["Boy", "Boys"]],
    size: [["Tiny", "Tiny"], ["Small", "Small"], ["Medium", "Medium"]],
    status: [["Available", "Available"], ["Reserved", "Reserved"], ["Home", STATUS_LABEL.Home]],
  };
  const params = new URLSearchParams(location.search);
  for (const g of Object.keys(options) as Group[]) {
    const current = params.get(g) ?? "";
    const chips = [["", "All"], ...options[g]].map(([value, label]) =>
      `<label class="chip"><input type="radio" name="${g}" value="${esc(value)}"${value === current ? " checked" : ""}><span>${esc(label)}</span></label>`).join("");
    $(`[data-chips="${g}"]`, form)!.innerHTML = chips;
  }

  let skip = 0;
  let seq = 0;
  const filters = (): CmsFilter[] => {
    const out: CmsFilter[] = [];
    const data = new FormData(form);
    for (const g of Object.keys(options) as Group[]) {
      const v = String(data.get(g) ?? "");
      if (v) out.push({ field: g, op: "eq", value: v });
    }
    return out;
  };

  async function load(reset: boolean) {
    const id = ++seq;
    if (reset) { skip = 0; grid.classList.add("is-fetching"); }
    if (!grid.children.length) grid.innerHTML = [0, 1, 2].map(() => `<div class="pup"><div class="frame skeleton"></div></div>`).join("");
    const active = filters();
    try {
      const page = await queryItems("puppies", {
        filters: active,
        sort: [{ field: "sortOrder", direction: "asc" }, { field: "_createdDate", direction: "desc" }],
        limit: PAGE, skip, withTotal: true,
      });
      if (id !== seq) return;
      const cards = page.items.map((p) => puppyCard(p)).join("");
      if (reset) grid.innerHTML = cards; else grid.insertAdjacentHTML("beforeend", cards);
      skip += page.items.length;
      const total = page.total ?? skip;
      if (!skip) {
        grid.innerHTML = active.length
          ? `<div class="empty"><h3>No puppies match, yet.</h3><p class="muted">Try a different breed or size, or join the list below to hear when new litters arrive.</p><div class="hero__ctas"><button class="btn btn--ghost" type="button" data-reset>Clear filters</button><a class="btn" href="#signup-title">Hear about new litters</a></div></div>`
          : `<div class="empty"><h3>The next litter is on its way.</h3><p class="muted">There are no puppies listed right now. Join the list below and you'll hear first, or start a puppy application and tell me what you're hoping for.</p><div class="hero__ctas"><a class="btn" href="apply.html">Start a puppy application</a></div></div>`;
      }
      count.textContent = skip ? `${total} ${total === 1 ? "puppy" : "puppies"}` : "";
      more.hidden = !page.hasNext;
      observeReveals(grid);
    } catch {
      if (id !== seq) return;
      grid.innerHTML = `<div class="empty"><h3>Puppies couldn't load.</h3><p class="muted">Please refresh the page. If it keeps happening, call or text Elia.</p></div>`;
      count.textContent = "";
      more.hidden = true;
    } finally {
      if (id === seq) grid.classList.remove("is-fetching");
    }
  }

  const syncUrl = () => {
    const q = new URLSearchParams();
    for (const f of filters()) q.set(f.field, String(f.value));
    history.replaceState(null, "", q.toString() ? `?${q}` : location.pathname);
  };
  form.addEventListener("change", () => { syncUrl(); load(true); });
  grid.addEventListener("click", (e) => {
    if (!(e.target as Element).closest("[data-reset]")) return;
    for (const input of $$<HTMLInputElement>('input[value=""]', form)) input.checked = true;
    syncUrl();
    load(true);
    $<HTMLInputElement>("input", form)?.focus();
  });
  $("button", more)?.addEventListener("click", () => load(false));
  await load(true);
}
