import { queryItems } from "../../wix/items";
import { FAQ_VISIBLE as VISIBLE, faqItem, journeyItem } from "../cards";
import { observeReveals } from "../site";
import { $ } from "../util";

export default async function journey(): Promise<void> {
  const steps = $("[data-journey]");
  const faq = $("[data-faq]");
  await Promise.allSettled([
    steps && queryItems("journey", { sort: [{ field: "sortOrder" }], limit: 12 }).then((p) => { steps.innerHTML = p.items.map(journeyItem).join(""); observeReveals(steps); }),
    faq && queryItems("faq", { filters: VISIBLE, sort: [{ field: "sortOrder" }], limit: 5 }).then((p) => {
      faq.innerHTML = p.items.map(faqItem).join("");
      if (!p.items.length) faq.closest("section")?.setAttribute("hidden", "");
    }),
  ]);
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}
