// Submissions over REST — copied from wix-headless-templates forms/rest/submissions.ts (flat imports).
import { wixRequest } from "./client";
import type { Raw } from "./forms-core";
import {
  SUBMITTED_OK,
  formLevelError,
  normalizePhone,
  normalizeUrl,
  putUpload,
  redirectSessionBody,
  redirectSessionUrl,
  submissionErrors,
  toSubmission,
  toSubmissionValues,
  uploadFilesWith,
  uploadMimeType,
} from "./submissions-core";
import type { FormFieldDto, FormValues, SubmissionDto, UploadedFile } from "./types";

export { SUBMITTED_OK, formLevelError, normalizePhone, normalizeUrl, submissionErrors, toSubmissionValues };

const SUBMISSIONS = "/form-submission-service/v4/submissions";

export async function uploadFile(formId: string, file: File): Promise<UploadedFile> {
  const mimeType = uploadMimeType(file);
  const res = await wixRequest<Raw>(`${SUBMISSIONS}/media-upload-url`, { body: { formId, filename: file.name, mimeType } });
  const uploadUrl: string | undefined = res?.uploadUrl;
  if (!uploadUrl) throw new Error(`forms: no upload URL for "${file.name}".`);
  return putUpload(uploadUrl, file, mimeType);
}

export async function uploadFiles(formId: string, fields: FormFieldDto[], values: FormValues): Promise<FormValues> {
  return uploadFilesWith(uploadFile, formId, fields, values);
}

export interface CreateSubmissionOptions {
  captchaToken?: string;
}

export async function createSubmission(
  formId: string,
  values: Record<string, unknown>,
  { captchaToken }: CreateSubmissionOptions = {},
): Promise<SubmissionDto> {
  const created = await wixRequest<Raw>(SUBMISSIONS, {
    body: { submission: { formId, submissions: values }, ...(captchaToken ? { captchaToken } : {}) },
  });
  return toSubmission(created);
}

export async function checkoutUrl(checkoutId: string, origin: string = typeof window !== "undefined" ? window.location.origin : ""): Promise<string> {
  const res = await wixRequest<Raw>("/headless/v1/redirect-session", { body: redirectSessionBody(checkoutId, origin) });
  return redirectSessionUrl(res);
}
