import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function parsePagination(query: Record<string, unknown>): PaginationQuery {
  return paginationQuerySchema.parse({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
  });
}

export function parsePaginationSafe(query: Record<string, unknown>): PaginationQuery {
  const result = paginationQuerySchema.safeParse({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
  });
  return result.success ? result.data : { page: 1, limit: 20 };
}

export function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function paginatedResult<T>(items: T[], total: number, page: number, limit: number) {
  return {
    items,
    ...paginationMeta(total, page, limit),
  };
}

export function skipTake(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}
