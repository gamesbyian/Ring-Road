import { constructPuzzle, type IntendedRingMove, type PuzzleConstruction } from "../domain/authoring";
import { validatePuzzleShape, type Direction, type Puzzle, type SevenNumbers } from "../domain/puzzle";
import { analyzePuzzle } from "../domain/solver";

const move = (direction: Direction, moveCount: number): IntendedRingMove => ({ direction, moveCount });
const moves = (...entries: PuzzleConstruction["intendedMoves"]): PuzzleConstruction["intendedMoves"] => entries;

interface CampaignConstruction {
  readonly id: number;
  readonly ringCycles: SevenNumbers;
  readonly intendedMoves: PuzzleConstruction["intendedMoves"];
  readonly expectedExactVectorCount: number;
}

const author = ({ id, ringCycles, intendedMoves, expectedExactVectorCount }: CampaignConstruction): Puzzle =>
  constructPuzzle({ id, ringCycles, intendedMoves, expectedExactVectorCount, sharedSpoke: 0 });

export const CAMPAIGN = [
  author({
    id: 1,
    ringCycles: [3, 5, 3, 5, 7, 3, 5],
    intendedMoves: moves(move(1, 1), move(-1, 2), move(-1, 1), move(-1, 2), move(1, 3), move(-1, 0), move(-1, 2)),
    expectedExactVectorCount: 1,
  }),
  author({
    id: 2,
    ringCycles: [5, 7, 13, 3, 2, 11, 2],
    intendedMoves: moves(move(-1, 0), move(1, 2), move(1, 5), move(-1, 2), move(-1, 0), move(-1, 2), move(-1, 0)),
    expectedExactVectorCount: 1,
  }),
  author({
    id: 3,
    ringCycles: [2, 3, 5, 2, 5, 13, 19],
    intendedMoves: moves(move(-1, 0), move(-1, 0), move(1, 2), move(-1, 0), move(1, 2), move(1, 3), move(-1, 5)),
    expectedExactVectorCount: 1,
  }),
  author({
    id: 4,
    ringCycles: [2, 2, 5, 17, 17, 13, 7],
    intendedMoves: moves(move(-1, 0), move(-1, 0), move(-1, 0), move(-1, 0), move(-1, 6), move(-1, 6), move(-1, 1)),
    expectedExactVectorCount: 1,
  }),
  author({
    id: 5,
    ringCycles: [2, 5, 5, 13, 19, 2, 17],
    intendedMoves: moves(move(-1, 0), move(1, 1), move(1, 3), move(-1, 5), move(-1, 6), move(-1, 0), move(1, 2)),
    expectedExactVectorCount: 1,
  }),
  author({
    id: 6,
    ringCycles: [3, 2, 7, 13, 5, 11, 11],
    intendedMoves: moves(move(-1, 0), move(1, 2), move(-1, 0), move(-1, 3), move(-1, 0), move(1, 1), move(1, 4)),
    expectedExactVectorCount: 2,
  }),
  author({
    id: 7,
    ringCycles: [3, 2, 13, 5, 11, 17, 2],
    intendedMoves: moves(move(1, 3), move(-1, 0), move(1, 1), move(-1, 0), move(-1, 2), move(1, 6), move(-1, 0)),
    expectedExactVectorCount: 2,
  }),
  author({
    id: 8,
    ringCycles: [5, 11, 11, 19, 3, 3, 19],
    intendedMoves: moves(move(-1, 7), move(-1, 4), move(-1, 0), move(-1, 0), move(-1, 0), move(-1, 0), move(-1, 5)),
    expectedExactVectorCount: 1,
  }),
  author({
    id: 9,
    ringCycles: [3, 5, 17, 5, 17, 11, 13],
    intendedMoves: moves(move(1, 3), move(-1, 0), move(-1, 5), move(1, 3), move(1, 1), move(1, 2), move(1, 3)),
    expectedExactVectorCount: 2,
  }),
  author({
    id: 10,
    ringCycles: [3, 3, 19, 3, 7, 17, 17],
    intendedMoves: moves(move(-1, 0), move(1, 2), move(1, 2), move(-1, 0), move(1, 7), move(-1, 2), move(1, 4)),
    expectedExactVectorCount: 2,
  }),
  author({
    id: 11,
    ringCycles: [3, 2, 17, 13, 13, 7, 19],
    intendedMoves: moves(move(-1, 1), move(1, 2), move(1, 4), move(-1, 2), move(-1, 4), move(1, 1), move(1, 6)),
    expectedExactVectorCount: 2,
  }),
  author({
    id: 12,
    ringCycles: [3, 5, 17, 19, 5, 11, 19],
    intendedMoves: moves(move(-1, 4), move(-1, 0), move(1, 4), move(1, 6), move(-1, 2), move(-1, 3), move(1, 2)),
    expectedExactVectorCount: 1,
  }),
] as const satisfies readonly Puzzle[];

export const CAMPAIGN_ANALYSES = CAMPAIGN.map(analyzePuzzle);

export function validateCampaign(): void {
  const ids = new Set<number>();
  CAMPAIGN.forEach((puzzle, index) => {
    const errors = validatePuzzleShape(puzzle);
    if (ids.has(puzzle.id)) errors.push("id must be unique");
    ids.add(puzzle.id);
    if (puzzle.id !== index + 1) errors.push(`expected sequential id ${index + 1}`);
    const analysis = CAMPAIGN_ANALYSES[index];
    if (!analysis || analysis.exactSolutionVectorCount === 0) errors.push("has no exact directed solution");
    if (analysis && analysis.exactSolutionVectorCount !== puzzle.authoring.expectedExactVectorCount) {
      errors.push(`expected ${puzzle.authoring.expectedExactVectorCount} exact vectors, found ${analysis.exactSolutionVectorCount}`);
    }
    if (puzzle.authoring.requireWrapInIntendedPlan && !analysis?.usesWraps) {
      errors.push("requires a wrapped intended plan");
    }
    if (errors.length) throw new Error(`Puzzle ${puzzle.id}: ${errors.join("; ")}`);
  });
}

validateCampaign();
