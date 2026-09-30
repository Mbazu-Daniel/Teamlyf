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

  nextCursor: string | null;
  hasMore: boolean;
};

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
