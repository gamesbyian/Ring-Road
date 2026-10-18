/** The reference plaque has six illustrated progress beads.
 * The campaign currently has twelve puzzles, so each bead represents
 * a two-puzzle segment. No extra DOM rows or phone-height cost.
 */
export const PROGRESS_BEADS = 6;

export function progressBeadIndex(puzzleIndex: number, puzzleCount: number, beads = PROGRESS_BEADS): number {
  if (!Number.isInteger(puzzleCount) || puzzleCount < 1 || !Number.isInteger(beads) || beads < 1) {
    return 0;
  }
  const index = Number.isFinite(puzzleIndex) ? Math.max(0, Math.min(puzzleCount - 1, Math.floor(puzzleIndex))) : 0;
  return Math.min(beads - 1, Math.floor(index * beads / puzzleCount));
}
