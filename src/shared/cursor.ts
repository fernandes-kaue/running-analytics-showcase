import { z } from 'zod';
import { ApiError } from '../http/errors.js';

const cursorSchema = z.object({ data: z.string().datetime(), criado_em: z.string().datetime(), id: z.string().uuid() }).strict();
export type ActivityCursor = z.infer<typeof cursorSchema>;

export function encodeCursor(cursor: ActivityCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeCursor(value: string): ActivityCursor {
  try {
    return cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
  } catch {
    throw new ApiError(422, 'Cursor invalido.', { cursor: 'Cursor de paginacao invalido.' });
  }
}
