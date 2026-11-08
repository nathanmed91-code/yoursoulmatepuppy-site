import { queryItems } from "../../wix/items";
import { breedCard } from "../cards";
import { observeReveals } from "../site";
import { $ } from "../util";

export default async function care(): Promise<void> {
  const breeds = $("[data-breeds]");
  if (!breeds) return;
  try {
    const p = await queryItems("breeds", { sort: [{ field: "sortOrder" }], limit: 6 });
    breeds.innerHTML = p.items.map(breedCard).join("");
    observeReveals(breeds);
  } catch { breeds.closest("section")?.setAttribute("hidden", ""); }
}
