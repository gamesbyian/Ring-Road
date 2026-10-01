export const RING_COUNT = 7 as const;
export const CYCLE_LIMITS = [5, 11, 19, 19, 19, 19, 19] as const;

export type Direction = -1 | 1;
export type SevenNumbers = readonly [number, number, number, number, number, number, number];

export interface Puzzle {
  readonly id: number;
  readonly targetMoves: number;
  readonly ringCycles: SevenNumbers;
  readonly initial: SevenNumbers;
  readonly authoring: {
    readonly requireWrapInIntendedPlan: boolean;
    readonly expectedExactVectorCount: number;
  };
}

export const normalizeState = (state: number, cycle: number): number =>
  ((state % cycle) + cycle) % cycle;

export const rotateState = (state: number, cycle: number, direction: Direction): number =>
  normalizeState(state + direction, cycle);

export const spokeFromState = (state: number, cycle: number, centerCycle: number): number | null => {
  const spoke = (normalizeState(state, cycle) * centerCycle) / cycle;
  return Number.isInteger(spoke) ? spoke % centerCycle : null;
};

export const ringTargetStatesForSpoke = (
  cycle: number,
  spoke: number,
  centerCycle: number,
): number[] => Array.from({ length: cycle }, (_, state) => state)
  .filter((state) => spokeFromState(state, cycle, centerCycle) === spoke);

export const alignedSpoke = (states: readonly number[], cycles: readonly number[]): number | null => {
  if (states.length !== RING_COUNT || cycles.length !== RING_COUNT) return null;
  const centerCycle = cycles[0];
  if (centerCycle === undefined) return null;
  const expectedSpoke = spokeFromState(states[0] ?? 0, centerCycle, centerCycle);
  return states.every((state, index) =>
    spokeFromState(state, cycles[index] ?? 0, centerCycle) === expectedSpoke)
    ? expectedSpoke
    : null;
};

export const clockwiseDistance = (from: number, to: number, cycle: number): number =>
  normalizeState(to - from, cycle);

export const counterClockwiseDistance = (from: number, to: number, cycle: number): number =>
  normalizeState(from - to, cycle);

export const isPrime = (value: number): boolean => {
  if (!Number.isInteger(value) || value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) return false;
  }
  return true;
};

export function validatePuzzleShape(puzzle: Puzzle): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(puzzle.id) || puzzle.id <= 0) {
    errors.push("id must be a positive integer");
  }
  if (puzzle.ringCycles.length !== RING_COUNT || puzzle.initial.length !== RING_COUNT) {
    errors.push("must contain seven rings");
  }
  if (!Number.isInteger(puzzle.targetMoves) || puzzle.targetMoves <= 0) {
    errors.push("targetMoves must be a positive integer");
  }
  if (!Number.isInteger(puzzle.authoring.expectedExactVectorCount)
    || puzzle.authoring.expectedExactVectorCount <= 0) {
    errors.push("expectedExactVectorCount must be a positive integer");
  }
  puzzle.ringCycles.forEach((cycle, index) => {
    const limit = CYCLE_LIMITS[index] ?? 0;
    if (!isPrime(cycle) || cycle > limit) {
      errors.push(`ring ${index} cycle ${cycle} must be prime and <= ${limit}`);
    }
    const initial = puzzle.initial[index] ?? -1;
    if (!Number.isInteger(initial) || initial < 0 || initial >= cycle) {
      errors.push(`ring ${index} initial state is outside its cycle`);
    }
  });
  return errors;
}
