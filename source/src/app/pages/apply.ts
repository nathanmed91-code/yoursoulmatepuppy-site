// The free-quote request (the Puppy Application form). A ?puppy= link names the puppy or breed,
// which prefills the "which puppy" question when the form has one.
import { getItemBy } from "../../wix/items";
import { FORMS, mountForm } from "../forms-ui";
import { $, esc, str } from "../util";

export default async function apply(): Promise<void> {
  const el = $("[data-form=application]");
  if (!el) return;
  const wanted = new URLSearchParams(location.search).get("puppy") ?? "";
  let label = wanted;
  if (wanted) {
    try {
      const p = await getItemBy("puppies", "slug", wanted);
      if (p) label = `${str(p.name)} (${str(p.breed)})`;
    } catch { /* fall back to the raw value */ }
    const note = $("[data-puppy-note]");
    if (note && label) { note.innerHTML = `Asking about <strong>${esc(label)}</strong>.`; note.hidden = false; }
  }
  mountForm(el, FORMS.application, {
    variant: "application",
    prefill: (fields) => {
      if (!label) return {};
      // Match the question by its wording, since the owner can rename or remove it.
      const f = fields.find((x) => (x.control === "text" || x.control === "textarea") && /puppy|breed/i.test(x.label));
      return f ? { [f.target]: label } : {};
    },
  });
}
