// Renders a Wix Form from its schema. Fields, labels, steps, required marks and the thank-you
// text all come from the form Elia edits in her dashboard; nothing here names a field.
import { FORM_ERROR, createFormStore, type FormStore } from "../wix/form-store";
import type { FormFieldDto, FormValues } from "../wix/types";
import { $, $$, esc, str } from "./util";

export const FORMS = {
  application: "d5945b75-2197-44a5-923d-2072899a844c",
  newsletter: "6ec59c4b-0a37-4186-8716-f0814649987d",
};

interface Options {
  variant: "application" | "newsletter";
  prefill?: (fields: FormFieldDto[]) => FormValues;
}

let uid = 0;

/** US numbers typed the usual way (480-447-0844) become the +1 form Wix stores. */
function toE164(raw: string): string {
  const d = raw.replace(/[^0-9]/g, "");
  if (raw.trim().startsWith("+")) return "+" + d;
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d.startsWith("1")) return "+" + d;
  return raw;
}

/** +14805550101 reads back as 480-555-0101; anything else as typed. */
function phoneText(v: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(v);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : v;
}

/** Common slips in the big email providers' domains, so a typo is caught before it costs a reply. */
const DOMAIN_FIXES: Record<string, string> = {
  "gmial.com": "gmail.com", "gmal.com": "gmail.com", "gmaill.com": "gmail.com", "gamil.com": "gmail.com", "gnail.com": "gmail.com",
  "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmail.cm": "gmail.com", "gmail.om": "gmail.com", "gmai.com": "gmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.co": "yahoo.com", "yahoo.con": "yahoo.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmail.co": "hotmail.com", "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com", "outlook.co": "outlook.com", "outlook.con": "outlook.com",
  "iclod.com": "icloud.com", "icloud.co": "icloud.com", "icloud.con": "icloud.com", "aol.co": "aol.com", "aol.con": "aol.com",
};
export function emailSuggestion(v: string): string {
  const m = /^([^@\s]+)@([^@\s]+)$/.exec(v.trim().toLowerCase());
  if (!m) return "";
  const fix = DOMAIN_FIXES[m[2]];
  return fix ? `${m[1]}@${fix}` : "";
}

export function mountForm(el: HTMLElement, formId: string, opts: Options): FormStore {
  const store = createFormStore({ formId });
  const id = `wf${++uid}`;
  let signature = "";
  let prefilled = false;
  let pendingFocus: string | null = null;
  /** What the visitor just sent, kept so the thank-you can show it back and "Fix it" can refill the form. */
  let sent: { values: FormValues; fields: FormFieldDto[] } | null = null;

  const fid = (target: string) => `${id}-${target.replace(/[^\w-]/g, "_")}`;
  const required = (f: FormFieldDto) => (f.required ? `<span class="req">Required</span>` : "");
  const describe = (f: FormFieldDto) => [f.description ? `${fid(f.target)}-help` : "", `${fid(f.target)}-err`].filter(Boolean).join(" ");
  const help = (f: FormFieldDto) => (f.description ? `<p class="help" id="${fid(f.target)}-help">${esc(f.description)}</p>` : "");
  const err = (f: FormFieldDto) => `<p class="err" id="${fid(f.target)}-err" aria-live="polite"></p>`;

  function inputType(f: FormFieldDto): string {
    switch (f.control) {
      case "email": return "email";
      case "phone": return "tel";
      case "url": return "url";
      case "number": return "number";
      case "date": return "date";
      case "time": return "time";
      case "datetime": return "datetime-local";
      default: return "text";
    }
  }
  function autocomplete(f: FormFieldDto): string {
    const map: Record<string, string> = { CONTACTS_FIRST_NAME: "given-name", CONTACTS_LAST_NAME: "family-name", CONTACTS_EMAIL: "email", CONTACTS_PHONE: "tel" };
    return map[f.identifier] ? ` autocomplete="${map[f.identifier]}"` : "";
  }

  function field(f: FormFieldDto, values: FormValues): string {
    const v = values[f.target];
    const name = esc(f.target);
    const labelText = esc(f.label);
    const lab = f.showLabel ? "" : ' class="visually-hidden"';
    const common = `id="${fid(f.target)}" name="${name}" aria-describedby="${describe(f)}"${f.required ? ' aria-required="true"' : ""}${f.readOnly ? " disabled" : ""}`;
    switch (f.control) {
      case "textarea":
        return `<div class="field"><label for="${fid(f.target)}"${lab}>${labelText}${required(f)}</label>${help(f)}<textarea ${common} placeholder="${esc(f.placeholder)}">${esc(v)}</textarea>${err(f)}</div>`;
      case "select":
        return `<div class="field"><label for="${fid(f.target)}"${lab}>${labelText}${required(f)}</label>${help(f)}<select ${common}><option value="">${esc(f.placeholder || "Choose one")}</option>${f.choices.map((c) => `<option value="${esc(c.value)}"${c.value === v ? " selected" : ""}>${esc(c.label)}</option>`).join("")}</select>${err(f)}</div>`;
      case "radio":
      case "checkboxGroup":
      case "tags": {
        const type = f.control === "radio" ? "radio" : "checkbox";
        const picked = new Set(([] as unknown[]).concat(v ?? []).map(String));
        return `<fieldset class="field field--choices" id="${fid(f.target)}" aria-describedby="${describe(f)}"><legend>${labelText}${required(f)}</legend>${help(f)}${f.choices.map((c, i) => `<label><input type="${type}" name="${name}" value="${esc(c.value)}"${picked.has(c.value) ? " checked" : ""}${i === 0 ? ` id="${fid(f.target)}-0"` : ""}> ${esc(c.label)}</label>`).join("")}${err(f)}</fieldset>`;
      }
      case "checkbox":
        return `<div class="field field--check"><input type="checkbox" ${common}${v === true ? " checked" : ""}><label for="${fid(f.target)}">${labelText}</label>${help(f)}${err(f)}</div>`;
      default:
        return `<div class="field"><label for="${fid(f.target)}"${lab}>${labelText}${required(f)}</label>${help(f)}<input type="${inputType(f)}" ${common}${autocomplete(f)} placeholder="${esc(f.placeholder)}" value="${esc(f.control === "phone" ? phoneText(str(v)) : v)}"${f.control === "phone" ? ' inputmode="tel"' : ""}>${f.control === "email" ? `<p class="hint" data-hint="${name}" aria-live="polite" hidden></p>` : ""}${err(f)}</div>`;
    }
  }

  function successText(message?: string): string {
    const text = str(message) || (opts.variant === "newsletter"
      ? "Thank you. You're on the list, and the next note will land in your inbox."
      : "Thank you. I've got your request and will be in touch soon with your free quote.");
    return text.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("");
  }

  /** The answers just sent, read back so a mistyped email or number is easy to spot. */
  function summary(): string {
    if (!sent) return "";
    const rows = sent.fields
      .filter((f) => f.control !== "checkbox" && !f.hidden)
      .map((f) => {
        const raw = sent!.values[f.target];
        const v = Array.isArray(raw) ? raw.map(str).filter(Boolean).join(", ") : f.control === "phone" ? phoneText(str(raw)) : str(raw);
        return v ? `<div><dt>${esc(f.label)}</dt><dd>${esc(v)}</dd></div>` : "";
      })
      .join("");
    if (!rows) return "";
    return `<div class="wform__review"><p class="wform__review-title">Here's what you sent</p><dl>${rows}</dl>
  <p class="wform__review-note">Spot a typo? <button type="button" class="link-btn" data-fix>Fix it and send again</button></p></div>`;
  }

  function render(): void {
    const st = store.getState();
    if (st.outcome) {
      if ((st.outcome.action === "REDIRECT" || st.outcome.action === "CHECKOUT") && st.outcome.url) {
        if (st.outcome.newTab) open(st.outcome.url, "_blank", "noopener"); else location.assign(st.outcome.url);
      }
      el.innerHTML = `<div class="wform__done" tabindex="-1" role="status">${successText(st.outcome.message)}${summary()}${opts.variant === "newsletter" ? "" : `<p class="muted" style="font-size:var(--step-0)">Requesting a quote doesn't reserve a puppy or commit you to anything.</p>`}</div>`;
      const done = $(".wform__done", el)!;
      done.focus({ preventScroll: true });
      if (opts.variant === "application") done.scrollIntoView({ block: "center" });
      return;
    }
    if (!st.form) {
      el.innerHTML = st.errors[FORM_ERROR]
        ? `<p class="wform__formerr" role="alert">This form couldn't load. Please refresh the page, or reach Elia by phone or email.</p>`
        : `<div class="form-skeleton" aria-hidden="true">${(opts.variant === "newsletter" ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8]).map(() => `<span class="skeleton"></span>`).join("")}</div>`;
      return;
    }
    if (st.closed || !st.form.enabled) {
      el.innerHTML = `<p class="notice">${esc(st.form.disabledMessage || "This form isn't taking requests right now. Please call or text instead.")}</p>`;
      return;
    }
    const steps = st.form.steps;
    const multi = steps.length > 1;
    const current = steps[st.step];
    const fields = st.form.fields.filter((f) => !multi || f.stepId === current.id);
    const last = st.step >= steps.length - 1;
    const submitText = st.form.submitText || (opts.variant === "newsletter" ? "Sign up" : "Send my request");
    el.innerHTML = `<form class="wform" novalidate aria-label="${esc(opts.variant === "newsletter" ? "Monthly updates signup" : "Free quote request")}">
  ${multi ? `<div class="wform__steps" aria-hidden="true">${steps.map((_, i) => `<span${i <= st.step ? ' class="is-on"' : ""}></span>`).join("")}</div>
  <p class="wform__stepname" aria-live="polite">Step ${st.step + 1} of ${steps.length}${current.name ? ` · ${esc(current.name)}` : ""}</p>` : ""}
  ${fields.map((f) => field(f, st.values)).join("")}
  <p class="wform__formerr" role="alert"></p>
  <div class="wform__actions">
    ${multi && st.step > 0 ? `<button class="btn btn--ghost" type="button" data-back>${esc(st.form.previousText || "Back")}</button>` : ""}
    <button class="btn" type="submit">${esc(last ? submitText : st.form.nextText || "Next")}${last ? "" : ' <span class="arrow" aria-hidden="true">&rarr;</span>'}</button>
  </div>
</form>`;
    patch();
  }

  /** Errors and the busy state, updated in place so typing never loses focus. */
  function patch(): void {
    const st = store.getState();
    const form = $<HTMLFormElement>("form", el);
    if (!form || !st.form) return;
    for (const f of st.form.fields) {
      const msgEl = document.getElementById(`${fid(f.target)}-err`);
      if (!msgEl) continue;
      const msg = st.errors[f.target] ?? "";
      if (msgEl.textContent !== msg) msgEl.textContent = msg;
      const ctrl = document.getElementById(fid(f.target));
      const targets = ctrl?.tagName === "FIELDSET" ? $$("input", ctrl) : ctrl ? [ctrl] : [];
      for (const c of targets) { if (msg) c.setAttribute("aria-invalid", "true"); else c.removeAttribute("aria-invalid"); }
    }
    const formErr = $(".wform__formerr", form)!;
    formErr.textContent = st.errors[FORM_ERROR] ?? "";
    const submit = $<HTMLButtonElement>('button[type="submit"]', form)!;
    submit.disabled = st.loading;
    submit.setAttribute("aria-busy", String(st.loading));
    if (!submit.dataset.label) submit.dataset.label = submit.innerHTML;
    const busy = st.loading && $(".wform__actions", form) && submit.textContent !== "Sending…";
    if (st.loading) { if (busy) submit.innerHTML = `<span class="spinner" aria-hidden="true"></span>Sending…`; }
    else if (submit.dataset.label && submit.innerHTML !== submit.dataset.label) submit.innerHTML = submit.dataset.label;
    if (pendingFocus) {
      const node = form.elements.namedItem(pendingFocus) as HTMLElement | RadioNodeList | null;
      const target = node instanceof RadioNodeList ? (node[0] as HTMLElement) : node;
      target?.focus();
      pendingFocus = null;
    }
  }

  function sig(): string {
    const st = store.getState();
    if (st.outcome) return "done";
    if (!st.form) return st.errors[FORM_ERROR] ? "error" : "loading";
    return [st.step, st.closed, st.form.fields.map((f) => `${f.target}:${f.required}:${f.choices.map((c) => c.value).join("|")}`).join(",")].join("/");
  }

  store.subscribe(() => {
    const st = store.getState();
    if (st.form && !prefilled && opts.prefill) {
      prefilled = true;
      const extra = opts.prefill(st.form.fields);
      if (Object.keys(extra).length) { store.setValues((prev) => ({ ...prev, ...extra })); return; }
    }
    const next = sig();
    if (next !== signature) { signature = next; render(); } else patch();
  });

  function readValue(f: FormFieldDto, form: HTMLFormElement): unknown {
    if (f.control === "checkbox") return (form.elements.namedItem(f.target) as HTMLInputElement).checked;
    if (f.control === "checkboxGroup" || f.control === "tags") return $$<HTMLInputElement>(`input[name="${CSS.escape(f.target)}"]:checked`, form).map((i) => i.value);
    if (f.control === "radio") return $<HTMLInputElement>(`input[name="${CSS.escape(f.target)}"]:checked`, form)?.value ?? "";
    const raw = (form.elements.namedItem(f.target) as HTMLInputElement).value;
    return f.control === "phone" ? toE164(raw) : raw;
  }
  let hintTimer: ReturnType<typeof setTimeout> | undefined;
  const fieldFor = (name: string) => store.getState().form?.fields.find((f) => f.target === name);

  el.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement;
    const form = t.form;
    const f = t.name && fieldFor(t.name);
    if (!form || !f) return;
    store.setValue(f.target, readValue(f, form));
    // Clear a message as soon as the answer is fixed, but don't scold while someone is mid-word.
    if (store.getState().errors[f.target]) store.validate(f.target);
    // Phones don't always fire focusout before the next tap, so check for typos once typing pauses.
    if (f.control === "email") {
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => hint(f, emailSuggestion(t.value)), 700);
    }
  });
  el.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    const f = t.name && fieldFor(t.name);
    if (!t.form || !f) return;
    store.setValue(f.target, readValue(f, t.form));
    if (t.type === "checkbox" || t.type === "radio" || t.tagName === "SELECT") store.validate(f.target);
  });
  el.addEventListener("focusout", (e) => {
    const t = e.target as HTMLInputElement;
    const f = t.name && fieldFor(t.name);
    if (!f || t.type === "checkbox" || t.type === "radio") return;
    if (f.control === "email") hint(f, emailSuggestion(t.value));
    if (str(store.getState().values[f.target]) || store.getState().errors[f.target]) store.validate(f.target);
  });
  el.addEventListener("click", (e) => {
    if ((e.target as Element).closest("[data-fix]") && sent) {
      const again = sent.values;
      store.reset();
      store.setValues((prev) => ({ ...prev, ...again }));
      signature = "";
      render();
      $<HTMLElement>("input, select, textarea", el)?.focus();
      return;
    }
    const sug = (e.target as Element).closest<HTMLElement>("[data-use-email]");
    if (sug) {
      const f = fieldFor(sug.dataset.useEmail!);
      const input = f && (document.getElementById(fid(f.target)) as HTMLInputElement | null);
      if (f && input) { input.value = sug.dataset.value!; store.setValue(f.target, input.value); store.validate(f.target); hint(f, ""); input.focus(); }
      return;
    }
    if ((e.target as Element).closest("[data-back]")) { store.previous(); $<HTMLElement>("input, select, textarea", el)?.focus(); }
  });
  el.addEventListener("submit", async (e) => {
    e.preventDefault();
    const st = store.getState();
    if (!st.form || st.loading) return;
    const last = st.step >= st.form.steps.length - 1;
    const formEl = e.target as HTMLFormElement;
    if (!last) {
      const moved = store.next({ currentTarget: formEl });
      if (moved) { $<HTMLElement>("input, select, textarea", el)?.focus(); $(".wform__stepname", el)?.scrollIntoView({ block: "nearest" }); }
      else focusFirstError();
      return;
    }
    const before = { values: { ...st.values }, fields: st.form.fields.slice() };
    const ok = await store.submit({ currentTarget: formEl });
    if (ok) { sent = before; signature = ""; render(); }
    if (!ok) focusFirstError();
  });
  function hint(f: FormFieldDto, suggestion: string): void {
    const p = $<HTMLElement>(`[data-hint="${CSS.escape(f.target)}"]`, el);
    if (!p) return;
    p.hidden = !suggestion;
    p.innerHTML = suggestion ? `Did you mean <button type="button" class="link-btn" data-use-email="${esc(f.target)}" data-value="${esc(suggestion)}">${esc(suggestion)}</button>?` : "";
  }

  function focusFirstError(): void {
    const st = store.getState();
    const first = st.form?.fields.find((f) => st.errors[f.target]);
    if (first) { pendingFocus = first.target; patch(); }
    else if (st.errors[FORM_ERROR]) $(".wform__formerr", el)?.focus();
  }

  store.start();
  signature = sig();
  render();
  return store;
}
