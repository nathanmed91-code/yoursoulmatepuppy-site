// The FAQ page: every question Elia keeps in the "faq" CMS collection, grouped by its Topic
// (in the order the topics first appear by sortOrder), with a topic index and FAQ rich-result data.
import { queryItems } from "../../wix/items";
import { FAQ_VISIBLE, faqItem } from "../cards";
import { observeReveals } from "../site";
import { $, esc, str } from "../util";
import type { CmsItem } from "../../wix/items-core";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "more";

export default async function faq(): Promise<void> {
  const list = $("[data-faq-page]")!;
  const topics = $("[data-faq-topics]")!;
  let items: CmsItem[] = [];
  try {
    items = (await queryItems("faq", { filters: FAQ_VISIBLE, sort: [{ field: "sortOrder" }], limit: 100 })).items;
  } catch (e) { console.error(e); }
  items = items.filter((f) => str(f.question) && str(f.answer));

  if (!items.length) {
    list.innerHTML = `<div class="empty"><h3>Questions are on their way.</h3><p class="muted">In the meantime, call or text me and I'll answer anything you'd like to know.</p></div>`;
    return;
  }

  const groups = new Map<string, CmsItem[]>();
  for (const f of items) {
    const t = str(f.topic) || "More questions";
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t)!.push(f);
  }
  const used = new Set<string>();
  const ids = [...groups.keys()].map((t) => { let id = `topic-${slug(t)}`; while (used.has(id)) id += "-2"; used.add(id); return id; });

  list.innerHTML = [...groups.entries()].map(([t, qs], gi) => `
<section class="faq-group" id="${ids[gi]}" aria-labelledby="${ids[gi]}-h">
  ${groups.size > 1 ? `<h2 class="faq-group__title reveal" id="${ids[gi]}-h">${esc(t)}</h2>` : ""}
  <div class="faq">${qs.map((f) => faqItem(f, `q-${slug(str(f.question))}`)).join("")}</div>
</section>`).join("");

  if (groups.size > 1) {
    topics.innerHTML = `<p class="eyebrow">Topics</p><ul>${[...groups.keys()].map((t, i) => `<li><a href="#${ids[i]}">${esc(t)}</a></li>`).join("")}</ul>`;
    topics.hidden = false;
  } else {
    list.closest(".faq-page")?.classList.add("faq-page--single");
  }

  // Structured data so search engines can show these answers directly.
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: str(f.question), acceptedAnswer: { "@type": "Answer", text: str(f.answer) } })),
  }); // Set via textContent, never parsed as HTML, so "</script>" in an answer can't break out.
  document.head.appendChild(ld);

  // A link straight to one question (faq.html#q-...) opens it.
  const open = () => {
    const el = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (el instanceof HTMLDetailsElement) el.open = true;
    el?.scrollIntoView();
  };
  open();
  addEventListener("hashchange", open);
  observeReveals(list);
}
