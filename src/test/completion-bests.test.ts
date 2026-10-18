import { describe, expect, it } from "vitest";
import { completedBestFor, parseCompletionBests, withExactCompletion } from "../app/completion-bests";

describe("local puzzle completion best records", () => {
  it("shows no best until the real exact route has been completed", () => {
    expect(completedBestFor({}, 1, 11)).toBeNull();
    const unchanged = withExactCompletion({}, 1, 11, 10);
    expect(unchanged).toEqual({});
    const solved = withExactCompletion(unchanged, 1, 11, 11);
    expect(completedBestFor(solved, 1, 11)).toBe(11);
  });

  it("rejects stale bests when the authored move count changes", () => {
    const old = withExactCompletion({}, 1, 11, 11);
    expect(completedBestFor(old, 1, 12)).toBeNull();
    const latest = withExactCompletion(old, 1, 12, 12);
    expect(completedBestFor(latest, 1, 12)).toBe(12);
    expect(completedBestFor(latest, 1, 11)).toBeNull();
  });

  it("keeps the independent puzzle records and avoids redundant writes", () => {
    const one = withExactCompletion({}, 1, 11, 11);
    const two = withExactCompletion(one, 2, 7, 7);
    expect(completedBestFor(two, 1, 11)).toBe(11);
    expect(completedBestFor(two, 2, 7)).toBe(7);
    expect(withExactCompletion(two, 1, 11, 11)).toBe(two);
  });

  it("drops invalid or tampered records without risking gameplay", () => {
    const records = parseCompletionBests({
      "1": { target: 11, moves: 11 },
      "2": { target: 7, moves: 8 },
      "3": { target: "six", moves: 6 },
      "4": { target: -2, moves: -2 },
      "5": { target: 9999999, moves: 9999999 },
      "6": { target: 8, moves: 8 },
      malicious: { target: 10, moves: 10 },
    });
    expect(records).toEqual({ "1": { target: 11, moves: 11 }, "6": { target: 8, moves: 8 } });
    expect(parseCompletionBests(null)).toEqual({});
    expect(parseCompletionBests([])).toEqual({});
    expect(parseCompletionBests("text")).toEqual({});
  });
});
