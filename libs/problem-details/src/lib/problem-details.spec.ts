import {
  ProblemDetailsError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  BadRequestError,
  InternalServerError,
} from '../lib/errors';
import { problemDetailsHandler } from '../lib/middleware';
import type { Request, Response, NextFunction } from 'express';

// ─── ProblemDetailsError ──────────────────────────────────────────────────────

describe('ProblemDetailsError', () => {
  it('should serialize to valid RFC 9457 structure', () => {
    const err = new ProblemDetailsError({
      title: 'Test Error',
      status: 400,
      detail: 'Something went wrong',
    });
    const json = err.toJSON();
    expect(json['type']).toBeDefined();
    expect(json['title']).toBe('Test Error');
    expect(json['status']).toBe(400);
    expect(json['detail']).toBe('Something went wrong');
  });

  it('NotFoundError should return 404', () => {
    const err = new NotFoundError('Meeting', '123');
    expect(err.status).toBe(404);
    expect(err.detail).toContain('123');
  });

  it('UnauthorizedError should return 401', () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
  });

  it('ForbiddenError should return 403', () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
  });

  it('ConflictError should return 409', () => {
    const err = new ConflictError('Duplicate entry');
    expect(err.status).toBe(409);
  });

  it('ValidationError should include errors array', () => {
    const err = new ValidationError([{ field: 'email', message: 'Invalid email' }]);
    const json = err.toJSON();
    expect(err.status).toBe(422);
    expect((json as { errors: unknown[] }).errors).toHaveLength(1);
    expect((json as { errors: { field: string }[] }).errors[0].field).toBe('email');
  });
});

// ─── problemDetailsHandler middleware ─────────────────────────────────────────

describe('problemDetailsHandler middleware', () => {
  const makeResponse = () => {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  const makeRequest = (url = '/test') =>
    ({ originalUrl: url } as unknown as Request);

  const next: NextFunction = jest.fn();

  it('should handle ProblemDetailsError with correct status and content-type', () => {
    const res = makeResponse();
    const err = new NotFoundError('User', '42');
    problemDetailsHandler(err, makeRequest(), res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/problem+json');
  });

  it('should handle unknown errors with 500', () => {
    const res = makeResponse();
    const err = new Error('Something exploded');
    problemDetailsHandler(err, makeRequest(), res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should include instance URI in response', () => {
    const res = makeResponse();
    const err = new BadRequestError('Bad input');
    problemDetailsHandler(err, makeRequest('/api/meetings'), res, next);
    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.instance).toBe('/api/meetings');
  });
});
