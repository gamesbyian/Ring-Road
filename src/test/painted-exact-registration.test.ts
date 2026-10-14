import { describe, expect, it } from "vitest";
import { CAMPAIGN, CAMPAIGN_ANALYSES } from "../content/campaign";
import { alignedSpoke } from "../domain/puzzle";
import { initialGameState, reduceGame, isExactSolved } from "../app/game-state";
import { NATIVE_GAP_DEGREES, paintedRingDegrees } from "../render/painted-geometry";

/** Normalize a painted gap's screen-space bearing after its native calibration. */
const normalizedBearing = (degrees: number) => ((degrees % 360) + 360) % 360;

describe("painted physical gaps vs mathematically exact gameplay", () => {
  it("every exact authored campaign solution produces one visually shared gap bearing", () => {
    CAMPAIGN.forEach((puzzle, index) => {
      const plan = CAMPAIGN_ANALYSES[index]?.exactPlan;
      expect(plan, "missing exact plan for puzzle " + puzzle.id).toBeDefined();
      let state = initialGameState(puzzle, index);
      plan!.selectedRingOptions.forEach((option, ring) => {
        for (let move = 0; move < option.moveCount; move++) {
          state = reduceGame(state, { type: "rotate", ring, direction: option.direction }, CAMPAIGN);
        }
      });
      expect(isExactSolved(state, puzzle), "puzzle " + puzzle.id).toBe(true);
      const reference = normalizedBearing(paintedRingDegrees(
        puzzle, state.visualStates, state.boardOrientation, 0,
      ) + NATIVE_GAP_DEGREES[0]);
      for (let art = 1; art < 7; art++) {
        const bearing = normalizedBearing(paintedRingDegrees(
          puzzle, state.visualStates, state.boardOrientation, art,
        ) + (NATIVE_GAP_DEGREES[art] ?? 0));
        const difference = Math.abs(bearing - reference);
        expect(Math.min(difference, 360 - difference), "puzzle " + puzzle.id + " ring " + art)
          .toBeLessThan(1e-6);
      }
      expect(alignedSpoke(state.rotations, puzzle.ringCycles)).not.toBeNull();
    });
  });

  it("reset and undo restore each artwork orientation exactly, modulo complete revolutions", () => {
    CAMPAIGN.forEach((puzzle, index) => {
      const initial = initialGameState(puzzle, index);
      const moved = reduceGame(initial, { type: "rotate", ring: 4, direction: 1 }, CAMPAIGN);
      const undone = reduceGame(moved, { type: "undo" }, CAMPAIGN);
      const reset = reduceGame(moved, { type: "reset" }, CAMPAIGN);
      for (let art = 0; art < 7; art++) {
        const original = paintedRingDegrees(puzzle, initial.visualStates, initial.boardOrientation, art);
        expect(paintedRingDegrees(puzzle, undone.visualStates, undone.boardOrientation, art))
          .toBeCloseTo(original, 9);
        expect(paintedRingDegrees(puzzle, reset.visualStates, reset.boardOrientation, art))
          .toBeCloseTo(original, 9);
      }
    });
  });
});
