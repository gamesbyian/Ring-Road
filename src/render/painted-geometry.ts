import type { Puzzle } from "../domain/puzzle";

/** The user's art calls the outer red circle Ring 1, opposite domain index 0. */
export const ART_ORDER_TO_DOMAIN = [6, 5, 4, 3, 2, 1, 0] as const;
export const NATIVE_GAP_DEGREES = [-90, -60, -4, 0, 0, 4, 0] as const;
export const PAINTED_RING_COLORS = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"] as const;

/**
 * Display-only mapping. The reducer owns discrete state. Unbounded visualStates
 * makes animations cross normalized wrap boundaries without reversing a turn.
 *
 * Calibration offsets align each source C's baked notch at east (0 degrees).
 * Recheck offsets via alpha masks before approving the shipping skin.
 */
export function paintedRingDegrees(
  puzzle: Pick<Puzzle, "ringCycles">,
  visualStates: readonly number[],
  boardOrientation: number,
  artIndex: number,
): number {
  const domainIndex = ART_ORDER_TO_DOMAIN[artIndex];
  const nativeGap = NATIVE_GAP_DEGREES[artIndex];
  if (domainIndex === undefined || nativeGap === undefined) {
    throw new RangeError("Painted ring index must be in 0..6");
  }
  const cycle = puzzle.ringCycles[domainIndex];
  const boardDegrees = boardOrientation * 360 / puzzle.ringCycles[0];
  return boardDegrees + (visualStates[domainIndex] ?? 0) * 360 / cycle - nativeGap;
}
