import { BOARD } from './puzzleGeometry';
import type { NeighborhoodPiece } from './neighborhoodPuzzles';
import type { DifficultyId } from '../types/game';

/** A little above the 44 CSS px minimum to allow for fractional SVG scaling. */
export const HIT_PX = 48;

export function trayHitSide(visibleSide: number, pieceScale: number, svgPxPerUnit: number): number {
  return Math.max(visibleSide, HIT_PX / (pieceScale * svgPxPerUnit));
}

export function dropHalfSide(piece: NeighborhoodPiece, difficulty: DifficultyId, svgPxPerUnit: number): number {
  const regular = { easy: 72, medium: 48, hard: 36 }[difficulty];
  return Math.max(regular, piece.tiny ? 40 : 0, HIT_PX / (2 * svgPxPerUnit));
}

export function dropCenter(piece: NeighborhoodPiece, halfSide: number): { x: number; y: number } {
  return {
    x: Math.max(BOARD.x0 + halfSide, Math.min(BOARD.x1 - halfSide, piece.targetX)),
    y: Math.max(BOARD.y0 + halfSide, Math.min(BOARD.y1 - halfSide, piece.targetY)),
  };
}

/** Logical, invisible board targets: nearest-centre ownership makes overlaps unambiguous. */
export function acceptsNeighborhoodDrop(id: string, point: { x: number; y: number },
  pieces: readonly NeighborhoodPiece[], placed: readonly string[], difficulty: DifficultyId, svgPxPerUnit: number): boolean {
  const available = pieces.filter(piece => !placed.includes(piece.id)).map(piece => {
    const half = dropHalfSide(piece, difficulty, svgPxPerUnit);
    const center = dropCenter(piece, half);
    return { id: piece.id, half, dx: point.x - center.x, dy: point.y - center.y };
  });
  available.sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));
  const nearest = available[0];
  return nearest?.id === id && Math.abs(nearest.dx) <= nearest.half && Math.abs(nearest.dy) <= nearest.half;
}
