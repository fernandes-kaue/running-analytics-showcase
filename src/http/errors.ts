import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada.' });
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'JSON malformado.' });
    return;
  }
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) fields[issue.path.join('.') || '_'] = issue.message;
    res.status(422).json({ error: 'Dados invalidos.', fields });
    return;
  }
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.message, ...(error.fields ? { fields: error.fields } : {}) });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({ error: 'Registro duplicado.' });
    return;
  }
  console.error(JSON.stringify({
    level: 'error',
    request_id: res.locals.requestId,
    method: req.method,
    path: req.path,
    error: error instanceof Error ? error.message : 'erro desconhecido',
  }));
  res.status(500).json({ error: 'Erro interno do servidor.' });
};
