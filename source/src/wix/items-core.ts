// Wix Data rules and DTO mapping — copied (read paths) from wix-headless-templates cms/app/wix/cms/items-core.ts.
export type Raw = Record<string, any>;
export type CmsItem = Raw & { _id: string };
export type CmsFilter = { field: string; op: string; value?: unknown };
export type CmsSort = { field: string; direction?: "asc" | "desc" };
export type CmsQuery = { filters?: CmsFilter[]; sort?: CmsSort[]; limit?: number; skip?: number; include?: string[]; withTotal?: boolean };
export type CmsPage = { items: CmsItem[]; hasNext: boolean; total: number | null };
export interface Media {
  imgSrc: (value: any, width: number, height: number) => string;
  imgRatio: (value: any) => number | null;
}

export const DEFAULT_LIMIT = 20;
export const DISTINCT_LIMIT = 100;
export const IMAGE_WIDTH = 1200;
export const IMAGE_HEIGHT = 900;

function isDateWrapper(v: unknown): v is { $date: string } {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const keys = Object.keys(v as Raw);
  return keys.length === 1 && keys[0] === "$date" && typeof (v as Raw).$date === "string";
}

export function imageSize(ratio: number | null): { width: number; height: number } {
  return { width: IMAGE_WIDTH, height: ratio ? Math.round(IMAGE_WIDTH * ratio) : IMAGE_HEIGHT };
}

export function toValue(v: unknown, media: Media): unknown {
  if (v instanceof Date) return v.toISOString();
  if (isDateWrapper(v)) {
    const t = new Date(v.$date);
    return Number.isNaN(t.getTime()) ? v.$date : t.toISOString();
  }
  if (typeof v === "string" && v.startsWith("wix:image://")) {
    const { width, height } = imageSize(media.imgRatio(v));
    return media.imgSrc(v, width, height);
  }
  if (Array.isArray(v)) return v.map((x) => toValue(x, media));
  if (v && typeof v === "object") {
    const out: Raw = {};
    for (const [k, val] of Object.entries(v as Raw)) out[k] = toValue(val, media);
    return out;
  }
  return v;
}

export const toItem = (raw: Raw, media: Media): CmsItem => toValue(raw, media) as CmsItem;

export function toPage(items: Raw[], hasNext: boolean, total: number | null | undefined, media: Media): CmsPage {
  return { items: items.map((r) => toItem(r, media)), hasNext, total: total ?? null };
}

export const toValues = (values: unknown[], media: Media): unknown[] => values.map((v) => toValue(v, media));

export function formatDate(iso: unknown, locale = "en-US", options: Intl.DateTimeFormatOptions = { dateStyle: "long" }): string {
  if (typeof iso !== "string" || !iso) return "";
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? "" : new Intl.DateTimeFormat(locale, options).format(t);
}

export function assertFilterValue(f: CmsFilter): void {
  if (f.op === "isEmpty" || f.op === "isNotEmpty") return;
  if (f.value === undefined) throw new Error(`cms: filter on "${f.field}" (${f.op}) has an undefined value — pass a real value or omit the filter.`);
  if (f.op === "between" && !(Array.isArray(f.value) && f.value.length === 2)) throw new Error(`cms: filter on "${f.field}" (between) takes [start, end].`);
}

export function restValue(v: unknown): unknown {
  if (v instanceof Date) return { $date: v.toISOString() };
  if (Array.isArray(v)) return v.map(restValue);
  return v;
}

const REST_OPS: Record<string, string> = {
  eq: "$eq", ne: "$ne", gt: "$gt", ge: "$gte", lt: "$lt", le: "$lte",
  contains: "$contains", startsWith: "$startsWith", endsWith: "$endsWith",
  in: "$hasSome", hasSome: "$hasSome", hasAll: "$hasAll",
};

export function restCondition(f: CmsFilter): Raw {
  assertFilterValue(f);
  if (f.op === "isEmpty") return { [f.field]: null };
  if (f.op === "isNotEmpty") return { [f.field]: { $ne: null } };
  if (f.op === "between") {
    const [start, end] = f.value as unknown[];
    return { [f.field]: { $gte: restValue(start), $lt: restValue(end) } };
  }
  return { [f.field]: { [REST_OPS[f.op]]: restValue(f.value) } };
}

export function restFilter(filters: CmsFilter[] = []): Raw {
  const conditions = filters.map(restCondition);
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
}

export function restSort(sort: CmsSort[] = []): { fieldName: string; order: "ASC" | "DESC" }[] {
  return sort.map((s) => ({ fieldName: s.field, order: s.direction === "desc" ? "DESC" : "ASC" }));
}

export function queryBody(collectionId: string, query: CmsQuery = {}): Raw {
  const { filters = [], sort = [], limit = DEFAULT_LIMIT, skip = 0, include = [], withTotal = false } = query;
  return {
    dataCollectionId: collectionId,
    query: {
      filter: restFilter(filters),
      ...(sort.length ? { sort: restSort(sort) } : {}),
      paging: { limit, offset: skip },
    },
    ...(include.length ? { includeReferences: include.map((field) => ({ field })) } : {}),
    ...(withTotal ? { returnTotalCount: true } : {}),
  };
}

export function restHasNext(pagingMetadata: Raw | undefined, offset: number, limit: number): boolean {
  if (typeof pagingMetadata?.hasNext === "boolean") return pagingMetadata.hasNext;
  if (typeof pagingMetadata?.total === "number") return offset + (pagingMetadata.count ?? 0) < pagingMetadata.total;
  return (pagingMetadata?.count ?? 0) >= limit;
}

export function distinctBody(collectionId: string, field: string, filters: CmsFilter[] = [], limit = DISTINCT_LIMIT): Raw {
  return { dataCollectionId: collectionId, fieldName: field, filter: restFilter(filters), paging: { limit, offset: 0 } };
}
