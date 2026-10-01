import {
  RING_COUNT,
  clockwiseDistance,
  counterClockwiseDistance,
  normalizeState,
  ringTargetStatesForSpoke,
  type Direction,
  type Puzzle,
} from "./puzzle";

export interface DirectedRingOption {
  readonly targetState: number;
  readonly direction: Direction;
  readonly moveCount: number;
  readonly baseDistance: number;
  readonly wraps: number;
}

export interface ExactPlan {
  readonly sharedSpoke: number;
  readonly selectedRingOptions: readonly DirectedRingOption[];
}

export interface PuzzleAnalysis {
  readonly exactSolutionVectorCount: number;
  readonly exactPlan: ExactPlan | null;
  readonly usesWraps: boolean;
}

interface PartialPlans {
  readonly count: number;
  readonly firstPath: readonly DirectedRingOption[];
}

const optionKey = (option: DirectedRingOption): string => {
  const direction = option.moveCount === 0 ? "stationary" : option.direction;
  return `${option.targetState}|${direction}|${option.moveCount}|${option.wraps}`;
};

const optionsForRing = (
  initial: number,
  cycle: number,
  targets: readonly number[],
  budget: number,
): DirectedRingOption[] => {
  const options = new Map<string, DirectedRingOption>();
  for (const targetState of targets) {
    const directions: readonly [Direction, number][] = [
      [1, clockwiseDistance(initial, targetState, cycle)],
      [-1, counterClockwiseDistance(initial, targetState, cycle)],
    ];
    for (const [direction, baseDistance] of directions) {
      for (let wraps = 0; baseDistance + wraps * cycle <= budget; wraps += 1) {
        const option = {
          targetState,
          direction,
          baseDistance,
          wraps,
          moveCount: baseDistance + wraps * cycle,
        } satisfies DirectedRingOption;
        options.set(optionKey(option), option);
      }
    }
  }
  return [...options.values()].sort((left, right) =>
    left.moveCount - right.moveCount
    || left.targetState - right.targetState
    || right.direction - left.direction
    || left.wraps - right.wraps);
};

const exactPlansForSpoke = (
  ringOptions: readonly (readonly DirectedRingOption[])[],
  targetMoves: number,
): PartialPlans | null => {
  let partials = new Map<number, PartialPlans>([[0, { count: 1, firstPath: [] }]]);
  for (const options of ringOptions) {
    const next = new Map<number, PartialPlans>();
    for (const [movesUsed, partial] of partials) {
      for (const option of options) {
        const nextMoves = movesUsed + option.moveCount;
        if (nextMoves > targetMoves) continue;
        const existing = next.get(nextMoves);
        next.set(nextMoves, {
          count: (existing?.count ?? 0) + partial.count,
          firstPath: existing?.firstPath ?? [...partial.firstPath, option],
        });
      }
    }
    partials = next;
  }
  return partials.get(targetMoves) ?? null;
};

export function analyzePuzzle(puzzle: Puzzle): PuzzleAnalysis {
  const centerCycle = puzzle.ringCycles[0];
  let exactSolutionVectorCount = 0;
  let exactPlan: ExactPlan | null = null;

  for (let sharedSpoke = 0; sharedSpoke < centerCycle; sharedSpoke += 1) {
    const ringOptions = puzzle.ringCycles.map((cycle, ring) => optionsForRing(
      normalizeState(puzzle.initial[ring] ?? 0, cycle),
      cycle,
      ringTargetStatesForSpoke(cycle, sharedSpoke, centerCycle),
      puzzle.targetMoves,
    ));
    if (ringOptions.some((options) => options.length === 0)) continue;

    const exact = exactPlansForSpoke(ringOptions, puzzle.targetMoves);
    if (!exact) continue;
    exactSolutionVectorCount += exact.count;
    if (!exactPlan && exact.firstPath.length === RING_COUNT) {
      exactPlan = { sharedSpoke, selectedRingOptions: exact.firstPath };
    }
  }

  return {
    exactSolutionVectorCount,
    exactPlan,
    usesWraps: exactPlan?.selectedRingOptions.some((option) => option.wraps > 0) ?? false,
  };
}
