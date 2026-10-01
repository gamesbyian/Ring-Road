import { alignedSpoke, rotateState, type Direction, type Puzzle } from "../domain/puzzle";
import type { ExactPlan } from "../domain/solver";

export interface Move {
  readonly ring: number;
  readonly direction: Direction;
}

export interface GameState {
  readonly puzzleIndex: number;
  readonly rotations: readonly number[];
  /** Unbounded render orientations preserve one-step motion across logical wraps. */
  readonly visualStates: readonly number[];
  readonly history: readonly Move[];
  readonly boardOrientation: number;
  readonly rotationMotion: "step" | "instant";
  readonly guideOpen: boolean;
  readonly hintOpen: boolean;
  readonly solutionOpen: boolean;
  readonly completed: boolean;
  readonly completionOpen: boolean;
  readonly completionPresented: boolean;
}

export type GameAction =
  | { type: "rotate"; ring: number; direction: Direction }
  | { type: "undo" }
  | { type: "reset" }
  | { type: "select"; index: number }
  | { type: "toggle-guide" }
  | { type: "toggle-hint" }
  | { type: "toggle-solution" }
  | { type: "show-completion" }
  | { type: "dismiss-completion" }
  | { type: "fire" };

export const initialGameState = (puzzle: Puzzle, puzzleIndex = 0, guideOpen = false): GameState => ({
  puzzleIndex,
  rotations: [...puzzle.initial],
  visualStates: [...puzzle.initial],
  history: [],
  boardOrientation: puzzle.id % puzzle.ringCycles[0],
  rotationMotion: "instant",
  guideOpen,
  hintOpen: false,
  solutionOpen: false,
  completed: false,
  completionOpen: false,
  completionPresented: false,
});

/**
 * Exact Ring Road routes are directed per ring: once a ring moves CW or CCW,
 * every counted move on that ring must keep that direction. This admits full
 * wraps while rejecting cancellation padding such as CW then CCW.
 */
export function followsDirectedRoute(history: readonly Move[]): boolean {
  const directionByRing = new Map<number, Direction>();
  for (const move of history) {
    const previous = directionByRing.get(move.ring);
    if (previous !== undefined && previous !== move.direction) return false;
    directionByRing.set(move.ring, move.direction);
  }
  return true;
}

export const isExactSolved = (state: GameState, puzzle: Puzzle): boolean =>
  alignedSpoke(state.rotations, puzzle.ringCycles) !== null
  && state.history.length === puzzle.targetMoves
  && followsDirectedRoute(state.history);

export type CompletionStatus =
  | { readonly kind: "unaligned" }
  | { readonly kind: "under"; readonly difference: number }
  | { readonly kind: "over"; readonly difference: number }
  | { readonly kind: "invalid-route" }
  | { readonly kind: "ready" }
  | { readonly kind: "complete" };

export function completionStatus(state: GameState, puzzle: Puzzle): CompletionStatus {
  if (state.completed) return { kind: "complete" };
  if (alignedSpoke(state.rotations, puzzle.ringCycles) === null) return { kind: "unaligned" };
  const difference = puzzle.targetMoves - state.history.length;
  if (difference > 0) return { kind: "under", difference };
  if (difference < 0) return { kind: "over", difference: Math.abs(difference) };
  if (!followsDirectedRoute(state.history)) return { kind: "invalid-route" };
  return { kind: "ready" };
}

export function reduceGame(state: GameState, action: GameAction, puzzles: readonly Puzzle[]): GameState {
  const puzzle = puzzles[state.puzzleIndex];
  if (!puzzle) return state;

  switch (action.type) {
    case "select": {
      if (puzzles.length === 0) return state;
      const index = ((action.index % puzzles.length) + puzzles.length) % puzzles.length;
      const selected = puzzles[index];
      return selected ? initialGameState(selected, index) : state;
    }
    case "reset":
      return {
        ...initialGameState(puzzle, state.puzzleIndex),
        boardOrientation: state.boardOrientation,
      };
    case "toggle-guide":
      return { ...state, guideOpen: !state.guideOpen, hintOpen: false, solutionOpen: false };
    case "toggle-hint":
      return { ...state, guideOpen: false, hintOpen: !state.hintOpen, solutionOpen: false };
    case "toggle-solution":
      return { ...state, guideOpen: false, hintOpen: false, solutionOpen: !state.solutionOpen };
    case "dismiss-completion":
      return { ...state, completionOpen: false };
    case "show-completion":
      return state.completed ? { ...state, completionOpen: true, completionPresented: true } : state;
    case "fire":
      return isExactSolved(state, puzzle)
        ? {
          ...state,
          completed: true,
          completionOpen: false,
          completionPresented: false,
          guideOpen: false,
          hintOpen: false,
          solutionOpen: false,
        }
        : state;
    case "rotate": {
      const cycle = puzzle.ringCycles[action.ring];
      if (cycle === undefined || state.completed) return state;
      const rotations = [...state.rotations];
      const visualStates = [...state.visualStates];
      rotations[action.ring] = rotateState(rotations[action.ring] ?? 0, cycle, action.direction);
      visualStates[action.ring] = (visualStates[action.ring] ?? 0) + action.direction;
      return {
        ...state,
        rotations,
        visualStates,
        rotationMotion: "step",
        history: [...state.history, { ring: action.ring, direction: action.direction }],
      };
    }
    case "undo": {
      if (state.completed) return state;
      const move = state.history.at(-1);
      if (!move) return state;
      const cycle = puzzle.ringCycles[move.ring];
      if (cycle === undefined) return state;
      const rotations = [...state.rotations];
      const visualStates = [...state.visualStates];
      rotations[move.ring] = rotateState(
        rotations[move.ring] ?? 0,
        cycle,
        move.direction === 1 ? -1 : 1,
      );
      visualStates[move.ring] = (visualStates[move.ring] ?? 0) - move.direction;
      return {
        ...state,
        rotations,
        visualStates,
        rotationMotion: "step",
        history: state.history.slice(0, -1),
        completed: false,
      };
    }
  }
}

export interface MoveHint {
  readonly ring: number;
  readonly direction: Direction;
  readonly remainingOnRing: number;
}

export type HintResult = MoveHint | "off-plan" | "complete";

/** Compares unordered per-ring progress with an exact plan without changing gameplay truth. */
export function nextMoveHint(state: GameState, plan: ExactPlan): HintResult {
  const used = Array.from({ length: 7 }, () => 0);
  for (const move of state.history) {
    const intended = plan.selectedRingOptions[move.ring];
    if (!intended || intended.moveCount === 0 || intended.direction !== move.direction) return "off-plan";
    used[move.ring] = (used[move.ring] ?? 0) + 1;
    if ((used[move.ring] ?? 0) > intended.moveCount) return "off-plan";
  }

  for (const ring of [6, 5, 4, 3, 2, 1, 0]) {
    const intended = plan.selectedRingOptions[ring];
    if (!intended) continue;
    const remainingOnRing = intended.moveCount - (used[ring] ?? 0);
    if (remainingOnRing > 0) return { ring, direction: intended.direction, remainingOnRing };
  }
  return "complete";
}
