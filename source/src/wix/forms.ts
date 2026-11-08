// Form-schema reads over REST — copied from wix-headless-templates forms/rest/forms.ts (flat imports).
import { wixRequest } from "./client";
import { imgSrc } from "./media";
import { FORMS_NAMESPACE, applyRules, isClosed, otherText, otherValue, toForm, type Raw } from "./forms-core";
import type { FormDto } from "./types";

export { FORMS_NAMESPACE, applyRules, isClosed, otherText, otherValue };

export async function getForm(formId: string): Promise<FormDto> {
  const res = await wixRequest<Raw>(`/form-schema-service/v4/forms/${encodeURIComponent(formId)}`, { method: "GET" });
  if (!res?.form) throw new Error(`forms: form "${formId}" not found.`);
  return toForm(res.form, imgSrc);
}

export async function listForms(): Promise<FormDto[]> {
  const res = await wixRequest<Raw>("/form-schema-service/v4/forms", { method: "GET", query: { namespace: FORMS_NAMESPACE } });
  return ((res?.forms ?? []) as Raw[]).map((raw) => toForm(raw, imgSrc));
}
