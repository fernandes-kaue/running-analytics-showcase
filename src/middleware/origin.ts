import type { RequestHandler } from 'express';
import { ApiError } from '../http/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function mutationGuard(appOrigin: string): RequestHandler {
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    if (req.get('origin') !== appOrigin) return next(new ApiError(403, 'Origem da requisicao nao autorizada.'));
    if (!req.is('application/json')) return next(new ApiError(415, 'Content-Type deve ser application/json.'));
    next();
  };
}
