export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function paginatedQuery(page: number, limit: number) {
  return `page=${page}&limit=${limit}`;
}
