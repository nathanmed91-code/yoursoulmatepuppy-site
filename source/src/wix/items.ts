// Wix Data reads over REST — copied (read paths) from wix-headless-templates cms/rest/items.ts.
// Reads work with a visitor token on any collection whose read permission is ANYONE.
import { wixRequest } from "./client";
import { imgRatio, imgSrc } from "./media";
import {
  DEFAULT_LIMIT,
  DISTINCT_LIMIT,
  distinctBody,
  queryBody,
  restHasNext,
  toPage,
  toValues,
  type CmsFilter,
  type CmsItem,
  type CmsPage,
  type CmsQuery,
  type Media,
  type Raw,
} from "./items-core";

const media: Media = { imgSrc, imgRatio };

export async function queryItems(collectionId: string, query: CmsQuery = {}): Promise<CmsPage> {
  const { limit = DEFAULT_LIMIT, skip = 0 } = query;
  const res = await wixRequest<Raw>("/wix-data/v2/items/query", { body: queryBody(collectionId, query) });
  const items = ((res?.dataItems ?? []) as Raw[]).map((d) => d.data ?? {});
  return toPage(items, restHasNext(res?.pagingMetadata, skip, limit), res?.pagingMetadata?.total, media);
}

export async function getItemBy(
  collectionId: string,
  field: string,
  value: string | number,
  { include = [] }: { include?: string[] } = {},
): Promise<CmsItem | null> {
  const page = await queryItems(collectionId, { filters: [{ field, op: "eq", value }], limit: 1, include });
  return page.items[0] ?? null;
}

export async function distinctValues(
  collectionId: string,
  field: string,
  { filters = [], limit = DISTINCT_LIMIT }: { filters?: CmsFilter[]; limit?: number } = {},
): Promise<unknown[]> {
  const res = await wixRequest<Raw>("/wix-data/v2/items/query-distinct-values", { body: distinctBody(collectionId, field, filters, limit) });
  return toValues((res?.distinctValues ?? []) as unknown[], media);
}
