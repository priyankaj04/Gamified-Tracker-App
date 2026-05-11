import { NextFunction, Request, Response } from 'express';

export const ok = <T>(res: Response, data: T, status = 200) =>
  res.status(status).json({ data, error: null });

export const fail = (res: Response, error: string, status = 400) =>
  res.status(status).json({ data: null, error });

const extractMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    // Supabase PostgrestError: { message, code, details, hint }
    const parts = [e.message, e.code && `(${e.code})`, e.hint, e.details]
      .filter((p): p is string => typeof p === 'string' && p.length > 0);
    if (parts.length) return parts.join(' ');
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return 'Unknown error';
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const message = extractMessage(err);
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err);
  if (!res.headersSent) {
    res.status(500).json({ data: null, error: message });
  }
};

export const asyncHandler =
  <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
