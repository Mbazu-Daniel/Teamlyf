/**
 * Response envelopes the ported chat UI reads. Two shapes are used:
 *
 * - `ListEnvelope` — the `{name,size,limit,pageCount,page,previousPage,nextPage,
 *   totalItems,records}` list wrapper (conversations, threads, members).
 * - `MessagePage` — cursor-paginated message pages; the infinite query only
 *   advances while `hasMore && nextCursor` are both set.
 */

export type ListEnvelope<T> = {
  name: string;
  size: number;
  limit: number;
  pageCount: number;
  page: number;
  previousPage: number | null;
  nextPage: number | null;
  totalItems: number;
  records: T[];
};

export type PageParams = { page: number; limit: number };

export function parsePageParams(query: { page?: number; limit?: number }): PageParams {
  const page = Math.max(Math.floor(query.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Math.floor(query.limit ?? 50) || 50, 1), 100);
  return { page, limit };
}

export function toListEnvelope<T>(
  name: string,
  records: T[],
  totalItems: number,
  { page, limit }: PageParams,
): ListEnvelope<T> {
  const pageCount = Math.ceil(totalItems / limit) || 1;
  return {
    name,
    size: records.length,
    limit,
    pageCount,
    page,
    previousPage: page > 1 ? Math.min(page - 1, pageCount) : null,
    nextPage: page < pageCount ? page + 1 : null,
    totalItems,
    records,
  };
}

export type MessagePage<T> = {
  messages: T[];
  total: number;
  page: number;
  totalPages: number;
  /** Oldest `createdAt` in this page — pass it back as `before` for the next one. */
  nextCursor: string | null;
  hasMore: boolean;
};

/**
 * Shapes an ascending list of messages (oldest first) plus one extra older row
 * — the caller fetches `limit + 1` to learn whether another page exists — into
 * the page envelope the UI consumes.
 */
export function toMessagePage<T>(
  rows: T[],
  hasOlderRow: boolean,
  oldestCreatedAt: Date | null,
  total: number,
  { page, limit }: PageParams,
): MessagePage<T> {
  return {
    messages: rows,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    nextCursor: hasOlderRow && oldestCreatedAt ? oldestCreatedAt.toISOString() : null,
    hasMore: hasOlderRow,
  };
}
