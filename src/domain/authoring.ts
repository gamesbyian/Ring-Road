import {
  normalizeState,
  ringTargetStatesForSpoke,
  validatePuzzleShape,
  type Direction,
  type Puzzle,
  type SevenNumbers,
} from "./puzzle";

export interface IntendedRingMove {
  readonly direction: Direction;
  readonly moveCount: number;
}

export interface PuzzleConstruction {
  readonly id: number;
  readonly ringCycles: SevenNumbers;
  readonly sharedSpoke: number;
  readonly intendedMoves: readonly [
    IntendedRingMove,
    IntendedRingMove,
    IntendedRingMove,
    IntendedRingMove,
    IntendedRingMove,
    IntendedRingMove,
    IntendedRingMove,
  ];
  readonly expectedExactVectorCount: number;
  readonly requireWrapInIntendedPlan?: boolean;
}

/** Derives runtime puzzle fields from an authored exact directed solution. */
export function constructPuzzle(construction: PuzzleConstruction): Puzzle {
  const centerCycle = construction.ringCycles[0];
  if (!Number.isInteger(construction.sharedSpoke)
    || construction.sharedSpoke < 0
    || construction.sharedSpoke >= centerCycle) {
    throw new Error(`Puzzle ${construction.id}: shared spoke is outside the center cycle`);
  }

  const initialValues = construction.ringCycles.map((cycle, ring) => {
    const targetStates = ringTargetStatesForSpoke(cycle, construction.sharedSpoke, centerCycle);
    if (targetStates.length !== 1) {
      throw new Error(`Puzzle ${construction.id} ring ${ring}: expected one target state for shared spoke`);
    }
    const intended = construction.intendedMoves[ring];
    if (!intended || !Number.isInteger(intended.moveCount) || intended.moveCount < 0) {
      throw new Error(`Puzzle ${construction.id} ring ${ring}: intended move count must be a non-negative integer`);
    }
    return normalizeState(targetStates[0]! - intended.direction * intended.moveCount, cycle);
  });
  const initial: SevenNumbers = [
    initialValues[0]!,
    initialValues[1]!,
    initialValues[2]!,
    initialValues[3]!,
    initialValues[4]!,
    initialValues[5]!,
    initialValues[6]!,
  ];

  const targetMoves = construction.intendedMoves.reduce((sum, move) => sum + move.moveCount, 0);
  const usesWrap = construction.intendedMoves.some((move, ring) =>
    move.moveCount >= (construction.ringCycles[ring] ?? Number.POSITIVE_INFINITY));

  const puzzle: Puzzle = {
    id: construction.id,
    targetMoves,
    ringCycles: construction.ringCycles,
    initial,
    authoring: {
      expectedExactVectorCount: construction.expectedExactVectorCount,
      requireWrapInIntendedPlan: construction.requireWrapInIntendedPlan ?? usesWrap,
    },
  };
  const errors = validatePuzzleShape(puzzle);
  if (errors.length > 0) throw new Error(`Puzzle ${construction.id}: ${errors.join("; ")}`);
  return puzzle;
}
