// ─── Inline response type (avoids cross-lib rootDir TS error) ────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
}

export const buildPaginationMeta = <T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> => ({
  data,
  total,
  page: params.page,
  limit: params.limit,
  totalPages: Math.ceil(total / params.limit),
});

export const toSkip = (page: number, limit: number): number => (page - 1) * limit;

// ─── Async error wrapper ───────────────────────────────────────────────────────

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// ─── Date utilities ───────────────────────────────────────────────────────────

export const addHours = (date: Date, hours: number): Date =>
  new Date(date.getTime() + hours * 60 * 60 * 1000);

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export const isWithinHours = (date: Date, hours: number): boolean => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff > 0 && diff <= hours * 60 * 60 * 1000;
};

export const isWithinDays = (date: Date, days: number): boolean =>
  isWithinHours(date, days * 24);

// ─── String utilities ─────────────────────────────────────────────────────────

export const sanitizeSearchQuery = (q: string): string =>
  q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();

// ─── Object utilities ─────────────────────────────────────────────────────────

/** Removes undefined fields from an object (for MongoDB $set patches) */
export const stripUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
