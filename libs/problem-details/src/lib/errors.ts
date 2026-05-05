/**
 * RFC 9457 Problem Details for HTTP APIs
 * https://www.rfc-editor.org/rfc/rfc9457
 *
 * Content-Type: application/problem+json
 */

export interface ProblemDetailsFields {
  /** A URI reference that identifies the problem type */
  type?: string;
  /** A short, human-readable summary of the problem type */
  title: string;
  /** The HTTP status code */
  status: number;
  /** A human-readable explanation specific to this occurrence */
  detail?: string;
  /** A URI reference that identifies the specific occurrence */
  instance?: string;
  /** Extension members */
  [key: string]: unknown;
}

// ─── Base Problem Details class ───────────────────────────────────────────────

export class ProblemDetailsError extends Error {
  public readonly type: string;
  public readonly title: string;
  public readonly status: number;
  public readonly detail?: string;
  public readonly instance?: string;
  public readonly extensions: Record<string, unknown>;

  constructor(fields: ProblemDetailsFields & Record<string, unknown>) {
    super(fields.detail ?? fields.title);
    this.name = 'ProblemDetailsError';
    this.type = fields.type ?? `https://problems.meeting-memory.app/${fields.status}`;
    this.title = fields.title;
    this.status = fields.status;
    this.detail = fields.detail;
    this.instance = fields.instance;

    // Collect extension members (anything beyond the standard fields)
    const { type: _t, title: _ti, status: _s, detail: _d, instance: _i, ...rest } = fields;
    this.extensions = rest;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      ...(this.detail !== undefined && { detail: this.detail }),
      ...(this.instance !== undefined && { instance: this.instance }),
      ...this.extensions,
    };
  }
}

// ─── Typed error subclasses ───────────────────────────────────────────────────

export class NotFoundError extends ProblemDetailsError {
  constructor(resource: string, id?: string) {
    super({
      type: 'https://problems.meeting-memory.app/not-found',
      title: 'Resource Not Found',
      status: 404,
      detail: id ? `${resource} with ID "${id}" was not found` : `${resource} was not found`,
    });
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ProblemDetailsError {
  constructor(detail = 'Authentication is required to access this resource') {
    super({
      type: 'https://problems.meeting-memory.app/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail,
    });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ProblemDetailsError {
  constructor(detail = 'You do not have permission to perform this action') {
    super({
      type: 'https://problems.meeting-memory.app/forbidden',
      title: 'Forbidden',
      status: 403,
      detail,
    });
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ProblemDetailsError {
  constructor(detail: string) {
    super({
      type: 'https://problems.meeting-memory.app/conflict',
      title: 'Conflict',
      status: 409,
      detail,
    });
    this.name = 'ConflictError';
  }
}

export class BadRequestError extends ProblemDetailsError {
  constructor(detail: string) {
    super({
      type: 'https://problems.meeting-memory.app/bad-request',
      title: 'Bad Request',
      status: 400,
      detail,
    });
    this.name = 'BadRequestError';
  }
}

export class InternalServerError extends ProblemDetailsError {
  constructor(detail = 'An unexpected error occurred') {
    super({
      type: 'https://problems.meeting-memory.app/internal-server-error',
      title: 'Internal Server Error',
      status: 500,
      detail,
    });
    this.name = 'InternalServerError';
  }
}

export class ValidationError extends ProblemDetailsError {
  public readonly errors: Array<{ field: string; message: string }>;

  constructor(errors: Array<{ field: string; message: string }>) {
    super({
      type: 'https://problems.meeting-memory.app/validation-error',
      title: 'Validation Error',
      status: 422,
      detail: 'One or more fields failed validation',
    });
    this.name = 'ValidationError';
    this.errors = errors;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}
