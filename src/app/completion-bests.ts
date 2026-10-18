/**
 * Best completed move counts are purely a local presentation record. A valid
 * completion still requires the game reducer's exact move and route checks.
 * The storage format contains a target fingerprint so re-authored puzzles do
 * not display stale bests.
 */
export const RECORDS_KEY = "ring-road:completed-bests:v1";

export type CompletionBests = Record<string, { target: number; moves: number }>;

function natural(n: unknown): n is number {
  return typeof n === "number" && Number.isSafeInteger(n) && n > 0 && n <= 100000;
}

export function parseCompletionBests(value: unknown): CompletionBests {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: CompletionBests = {};
  for (const [id, record] of Object.entries(value)) {
    if (!/^[1-9][0-9]{0,4}$/.test(id) || !record || typeof record !== "object") continue;
    const row = record as { target?: unknown; moves?: unknown };
    if (natural(row.target) && natural(row.moves) && row.moves === row.target) {
      out[id] = { target: row.target, moves: row.moves };
    }
  }
  return out;
}

export function completedBestFor(
  records: CompletionBests, puzzleId: number, targetMoves: number,
): number | null {
  const record = records[String(puzzleId)];
  return record && record.target === targetMoves ? record.moves : null;
}

export function withExactCompletion(
  records: CompletionBests, puzzleId: number, targetMoves: number, moves: number,
): CompletionBests {
  if (!natural(puzzleId) || !natural(targetMoves) || moves !== targetMoves) return records;
  const id = String(puzzleId);
  if (completedBestFor(records, puzzleId, targetMoves) === moves) return records;
  return { ...records, [id]: { target: targetMoves, moves } };
}

export function loadCompletionBests(): CompletionBests {
  try {
    return parseCompletionBests(JSON.parse(window.localStorage.getItem(RECORDS_KEY) || "{}"));
  } catch {
    return {};
  }
}

export function saveCompletionBests(records: CompletionBests): void {
  try {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    // Private browsing, exhausted storage or disabled localStorage must not
    // interfere with the puzzle or presentation.
  }
}
