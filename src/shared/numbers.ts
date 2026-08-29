import { Prisma } from '@prisma/client';

export function decimalNumber(value: Prisma.Decimal | number | string): number {
  const result = typeof value === 'number' ? value : Number(value.toString());
  if (!Number.isFinite(result)) throw new Error('Decimal nao finito recebido do banco.');
  return result;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function paceSeconds(durationSeconds: number, distanceKm: number): number {
  if (!Number.isFinite(durationSeconds) || !Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new Error('Valores invalidos para pace.');
  }
  return Math.round(durationSeconds / distanceKm);
}
