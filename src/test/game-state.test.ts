import { describe, expect, it } from "vitest";
import { completionStatus, initialGameState, isExactSolved, nextMoveHint, reduceGame, type GameState } from "../app/game-state";
import { CAMPAIGN, CAMPAIGN_ANALYSES } from "../content/campaign";

const applyExactPlan = (puzzleIndex: number): GameState => {
  let state = initialGameState(CAMPAIGN[puzzleIndex]!, puzzleIndex);
  const plan = CAMPAIGN_ANALYSES[puzzleIndex]?.exactPlan;
  if (!plan) throw new Error(`Puzzle ${puzzleIndex + 1} has no exact plan`);
  plan.selectedRingOptions.forEach((option, ring) => {
    for (let move = 0; move < option.moveCount; move += 1) {
      state = reduceGame(state, { type: "rotate", ring, direction: option.direction }, CAMPAIGN);
    }
  });
  return state;
};

describe("game state", () => {
  it("can open the guide on first launch without reopening it on puzzle loads", () => {
    const launched = initialGameState(CAMPAIGN[0], 0, true);
    expect(launched.guideOpen).toBe(true);
    const next = reduceGame(launched, { type: "select", index: 1 }, CAMPAIGN);
    expect(next.guideOpen).toBe(false);
  });

  it("rotates by one state and undo restores the exact prior state", () => {
    const start = initialGameState(CAMPAIGN[0]);
    const moved = reduceGame(start, { type: "rotate", ring: 0, direction: 1 }, CAMPAIGN);
    expect(moved.history).toEqual([{ ring: 0, direction: 1 }]);
    expect(moved.rotationMotion).toBe("step");
    expect(moved.rotations[0]).not.toBe(start.rotations[0]);
    expect(moved.visualStates[0]).toBe((start.visualStates[0] ?? 0) + 1);
    expect(reduceGame(moved, { type: "undo" }, CAMPAIGN)).toMatchObject({
      rotations: start.rotations,
      visualStates: start.visualStates,
      history: [],
    });
  });

  it("reset restores the puzzle without changing cosmetic orientation", () => {
    const start = initialGameState(CAMPAIGN[0]);
    const moved = reduceGame(start, { type: "rotate", ring: 3, direction: -1 }, CAMPAIGN);
    const reset = reduceGame(moved, { type: "reset" }, CAMPAIGN);
    expect(reset.rotations).toEqual(CAMPAIGN[0].initial);
    expect(reset.visualStates).toEqual(CAMPAIGN[0].initial);
    expect(reset.history).toEqual([]);
    expect(reset.boardOrientation).toBe(start.boardOrientation);
    expect(reset.rotationMotion).toBe("instant");
  });

  it("keeps visual orientation continuous across a normalized logical wrap", () => {
    let state = initialGameState(CAMPAIGN[0]);
    const cycle = CAMPAIGN[0].ringCycles[0];
    for (let move = 0; move < cycle; move += 1) {
      state = reduceGame(state, { type: "rotate", ring: 0, direction: 1 }, CAMPAIGN);
    }
    expect(state.rotations[0]).toBe(CAMPAIGN[0].initial[0]);
    expect(state.visualStates[0]).toBe(CAMPAIGN[0].initial[0] + cycle);
  });

  it("applies rapid alternating input synchronously and resets without queued motion", () => {
    const start = initialGameState(CAMPAIGN[0]);
    let state = start;
    for (let move = 0; move < 2_000; move += 1) {
      state = reduceGame(
        state,
        { type: "rotate", ring: 6, direction: move % 2 === 0 ? 1 : -1 },
        CAMPAIGN,
      );
    }
    expect(state.history).toHaveLength(2_000);
    expect(state.rotations).toEqual(start.rotations);
    expect(state.visualStates).toEqual(start.visualStates);

    const reset = reduceGame(state, { type: "reset" }, CAMPAIGN);
    expect(reset).toMatchObject({
      rotations: start.rotations,
      visualStates: start.visualStates,
      history: [],
      rotationMotion: "instant",
    });
  });

  it("loads navigation as a fresh puzzle", () => {
    const next = reduceGame(initialGameState(CAMPAIGN[0]), { type: "select", index: 1 }, CAMPAIGN);
    expect(next).toMatchObject({ puzzleIndex: 1, rotations: CAMPAIGN[1].initial, history: [], completed: false });
    expect(next.rotationMotion).toBe("instant");
  });

  it("wraps manual puzzle navigation at campaign boundaries", () => {
    const previous = reduceGame(initialGameState(CAMPAIGN[0]), { type: "select", index: -1 }, CAMPAIGN);
    expect(previous.puzzleIndex).toBe(CAMPAIGN.length - 1);
    const next = reduceGame(previous, { type: "select", index: CAMPAIGN.length }, CAMPAIGN);
    expect(next.puzzleIndex).toBe(0);
  });

  it("replays every authored exact plan and permits center fire", () => {
    CAMPAIGN.forEach((puzzle, index) => {
      const solved = applyExactPlan(index);
      expect(solved.history).toHaveLength(puzzle.targetMoves);
      expect(isExactSolved(solved, puzzle)).toBe(true);
      const fired = reduceGame(solved, { type: "fire" }, CAMPAIGN);
      expect(fired.completed).toBe(true);
      expect(fired.completionOpen).toBe(false);
      expect(reduceGame(fired, { type: "show-completion" }, CAMPAIGN)).toMatchObject({
        completionOpen: true,
        completionPresented: true,
      });
    });
  });

  it("dismisses completion presentation without unlocking the solved board", () => {
    const fired = reduceGame(
      reduceGame(applyExactPlan(0), { type: "fire" }, CAMPAIGN),
      { type: "show-completion" },
      CAMPAIGN,
    );
    const dismissed = reduceGame(fired, { type: "dismiss-completion" }, CAMPAIGN);
    expect(dismissed).toMatchObject({ completed: true, completionOpen: false, completionPresented: true });
    expect(reduceGame(dismissed, { type: "rotate", ring: 0, direction: 1 }, CAMPAIGN)).toBe(dismissed);
    expect(reduceGame(dismissed, { type: "undo" }, CAMPAIGN)).toBe(dismissed);
  });

  it("does not complete an aligned board at the wrong move count", () => {
    const alignedAtZero = initialGameState(CAMPAIGN[0]);
    const artificiallyAligned = { ...alignedAtZero, rotations: [0, 0, 0, 0, 0, 0, 0] };
    expect(isExactSolved(artificiallyAligned, CAMPAIGN[0])).toBe(false);
    expect(reduceGame(artificiallyAligned, { type: "fire" }, CAMPAIGN).completed).toBe(false);
    expect(completionStatus(artificiallyAligned, CAMPAIGN[0])).toEqual({ kind: "under", difference: 11 });
    const overTarget = { ...artificiallyAligned, history: Array.from({ length: 12 }, () => ({ ring: 0, direction: 1 as const })) };
    expect(completionStatus(overTarget, CAMPAIGN[0])).toEqual({ kind: "over", difference: 1 });
  });

  it("locks rotations after completion", () => {
    const completed = reduceGame(applyExactPlan(0), { type: "fire" }, CAMPAIGN);
    expect(reduceGame(completed, { type: "rotate", ring: 0, direction: 1 }, CAMPAIGN)).toBe(completed);
  });

  it("offers plan-aware hints without imposing a global move order", () => {
    const start = initialGameState(CAMPAIGN[0]);
    const plan = CAMPAIGN_ANALYSES[0]!.exactPlan!;
    const firstHint = nextMoveHint(start, plan);
    expect(firstHint).toMatchObject({ ring: 6, direction: -1, remainingOnRing: 2 });

    const innerMoveFirst = reduceGame(start, { type: "rotate", ring: 0, direction: 1 }, CAMPAIGN);
    expect(nextMoveHint(innerMoveFirst, plan)).toMatchObject({ ring: 6, remainingOnRing: 2 });
    expect(nextMoveHint(applyExactPlan(0), plan)).toBe("complete");
  });

  it("detects deviations from the authored hint plan", () => {
    const start = initialGameState(CAMPAIGN[0]);
    const plan = CAMPAIGN_ANALYSES[0]!.exactPlan!;
    const wrongDirection = reduceGame(start, { type: "rotate", ring: 6, direction: 1 }, CAMPAIGN);
    expect(nextMoveHint(wrongDirection, plan)).toBe("off-plan");
  });

  it("keeps guide, hint, and solution overlays mutually exclusive", () => {
    const start = initialGameState(CAMPAIGN[0]);
    const guide = reduceGame(start, { type: "toggle-guide" }, CAMPAIGN);
    expect(guide).toMatchObject({ guideOpen: true, hintOpen: false, solutionOpen: false });
    const hint = reduceGame(guide, { type: "toggle-hint" }, CAMPAIGN);
    expect(hint).toMatchObject({ guideOpen: false, hintOpen: true, solutionOpen: false });
    const solution = reduceGame(hint, { type: "toggle-solution" }, CAMPAIGN);
    expect(solution).toMatchObject({ guideOpen: false, hintOpen: false, solutionOpen: true });
  });
});
