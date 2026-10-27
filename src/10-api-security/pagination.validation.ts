export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export function validatePagination(
  pageValue: unknown,
  limitValue: unknown
): Pagination | null {
  const page = Number(pageValue ?? 1);
  const limit = Number(limitValue ?? 10);

  if (
    !Number.isSafeInteger(page) ||
    !Number.isSafeInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    return null;
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}