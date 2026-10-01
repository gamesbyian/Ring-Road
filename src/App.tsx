import { useCallback, useEffect, useMemo, useReducer } from "react";
import { completionStatus, initialGameState, isExactSolved, nextMoveHint, reduceGame } from "./app/game-state";
import { CAMPAIGN, CAMPAIGN_ANALYSES } from "./content/campaign";
import { DioramaScene } from "./render/DioramaScene";
import { RingBoard } from "./render/RingBoard";
import "./styles/app.css";
import { Modal } from "./ui/Modal";

const LABELS = ["Violet", "Indigo", "Blue", "Green", "Yellow", "Orange", "Red"];
const RING_ORDER = [6, 5, 4, 3, 2, 1, 0] as const;

export default function App() {
  const [state, dispatch] = useReducer(
    (current: ReturnType<typeof initialGameState>, action: Parameters<typeof reduceGame>[1]) =>
      reduceGame(current, action, CAMPAIGN),
    initialGameState(CAMPAIGN[0], 0, true),
  );
  const puzzle = CAMPAIGN[state.puzzleIndex] ?? CAMPAIGN[0];
  const analysis = CAMPAIGN_ANALYSES[state.puzzleIndex];
  const exact = isExactSolved(state, puzzle);
  const closeGuide = useCallback(() => dispatch({ type: "toggle-guide" }), []);
  const closeHint = useCallback(() => dispatch({ type: "toggle-hint" }), []);
  const closeSolution = useCallback(() => dispatch({ type: "toggle-solution" }), []);
  const closeCompletion = useCallback(() => dispatch({ type: "dismiss-completion" }), []);
  const hint = analysis?.exactPlan ? nextMoveHint(state, analysis.exactPlan) : "off-plan";
  const moveState = state.history.length > puzzle.targetMoves
    ? "over"
    : state.history.length === puzzle.targetMoves
      ? "exact"
      : "under";

  useEffect(() => {
    if (!state.completed || state.completionPresented) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => dispatch({ type: "show-completion" }),
      reducedMotion ? 0 : 400,
    );
    return () => window.clearTimeout(timer);
  }, [state.completed, state.completionPresented]);

  const status = useMemo(() => {
    const result = completionStatus(state, puzzle);
    switch (result.kind) {
      case "complete": return `Puzzle ${puzzle.id} complete.`;
      case "ready": return "Road aligned — fire the center.";
      case "under": return `Road aligned — ${result.difference} more move${result.difference === 1 ? "" : "s"} needed.`;
      case "over": return `Road aligned — ${result.difference} move${result.difference === 1 ? "" : "s"} over target.`;
      case "invalid-route": return "Road aligned at the target, but a ring changed direction. Undo or reset to keep each ring on one continuous route.";
      case "unaligned": return "Rotate the ring gaps onto one shared road.";
    }
  }, [puzzle, state]);

  const title = (
    <header className="world-header">
      <div className="title-plaque world-plaque">
        <span className="eyebrow">Precision alignment puzzle</span>
        <h1>Ring Road</h1>
      </div>
      <button className="guide-button plaque-button" onClick={() => dispatch({ type: "toggle-guide" })}>Guide</button>
    </header>
  );

  const board = (
    <RingBoard
      puzzle={puzzle}
      visualStates={state.visualStates}
      boardOrientation={state.boardOrientation}
      rotationMotion={state.rotationMotion}
      canFire={exact}
      completed={state.completed}
      onFire={() => dispatch({ type: "fire" })}
    />
  );

  const controls = (
    <aside className="control-monument" aria-label="Ring controls">
      <div className={`counter counter-${moveState}`} aria-label={`${state.history.length} of ${puzzle.targetMoves} moves`}>
        <span className="counter-label" aria-hidden="true">Moves</span>
        <strong>{state.history.length}</strong>
        <span className="counter-target">/ {puzzle.targetMoves}</span>
      </div>
      <div className="ring-controls">
        {RING_ORDER.map((ring) => {
          const cycle = puzzle.ringCycles[ring];
          return (
            <div
              className={`ring-control ring-control-${ring}`}
              key={ring}
              role="group"
              aria-label={`${LABELS[ring]} ring, orientation ${(state.rotations[ring] ?? 0) + 1} of ${cycle}`}
            >
              <span className={`swatch ring-${ring}`} aria-hidden="true">{ring + 1}</span>
              <span className="ring-name">{LABELS[ring]} <small>{cycle} steps</small></span>
              <button
                onClick={() => dispatch({ type: "rotate", ring, direction: -1 })}
                disabled={state.completed}
                aria-label={`Rotate ${LABELS[ring]} counterclockwise`}
              >↶</button>
              <button
                onClick={() => dispatch({ type: "rotate", ring, direction: 1 })}
                disabled={state.completed}
                aria-label={`Rotate ${LABELS[ring]} clockwise`}
              >↷</button>
            </div>
          );
        })}
      </div>
      <div className="actions" aria-label="Puzzle actions">
        <button onClick={() => dispatch({ type: "undo" })} disabled={!state.history.length || state.completed}>Undo</button>
        <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
        <button onClick={() => dispatch({ type: "toggle-hint" })}>Hint</button>
        <button onClick={() => dispatch({ type: "toggle-solution" })}>Solution</button>
      </div>
    </aside>
  );

  const navigation = (
    <nav className="puzzle-plaque" aria-label="Puzzle navigation">
      <button onClick={() => dispatch({ type: "select", index: state.puzzleIndex - 1 })}>Previous</button>
      <span className="puzzle-index"><small>Puzzle</small>{puzzle.id}<small>of {CAMPAIGN.length}</small></span>
      <button onClick={() => dispatch({ type: "select", index: state.puzzleIndex + 1 })}>Next</button>
    </nav>
  );

  return (
    <main className="app-shell">
      <DioramaScene
        title={title}
        board={board}
        controls={controls}
        status={<p className={`status status-${moveState}`} role="status" aria-live="polite">{status}</p>}
        navigation={navigation}
      />

      {state.guideOpen && (
        <Modal title="How to play" onClose={closeGuide} closeLabel="Play">
          <p>Rotate each colored ring one legal step at a time. Make all seven gaps meet on one shared spoke in exactly the target number of moves. A full same-direction turn can be part of a solution, but changing direction on a ring cannot be used to pad the count.</p>
        </Modal>
      )}
      {state.solutionOpen && (
        <Modal title="Exact solution" onClose={closeSolution}>
          {RING_ORDER.map((ring) => {
            const option = analysis?.exactPlan?.selectedRingOptions[ring];
            if (!option) return null;
            return (
              <p key={ring}>
                {LABELS[ring]}: {option.moveCount === 0 ? "0" : `${option.moveCount} ${option.direction === 1 ? "CW" : "CCW"}`}
                {option.wraps ? ` (${option.wraps} full wrap${option.wraps > 1 ? "s" : ""})` : ""}
              </p>
            );
          })}
        </Modal>
      )}
      {state.hintOpen && (
        <Modal title="Next move" onClose={closeHint}>
          {hint === "off-plan" && <p>Your moves no longer follow the authored plan. Undo or reset to use guided hints.</p>}
          {hint === "complete" && <p>The authored move allocation is complete. Align the road and fire the center.</p>}
          {typeof hint === "object" && (
            <p>
              Rotate {LABELS[hint.ring]} {hint.direction === 1 ? "clockwise" : "counterclockwise"}.
              {hint.remainingOnRing > 1 ? ` The plan uses ${hint.remainingOnRing} more moves on this ring.` : ""}
            </p>
          )}
        </Modal>
      )}
      {state.completionOpen && (
        <Modal title="Puzzle complete!" onClose={closeCompletion}>
          <p>Aligned in exactly {state.history.length} moves.</p>
          {state.puzzleIndex < CAMPAIGN.length - 1 ? (
            <button onClick={() => dispatch({ type: "select", index: state.puzzleIndex + 1 })}>Next puzzle</button>
          ) : (
            <p className="campaign-complete">Grand Master — campaign complete.</p>
          )}
        </Modal>
      )}
    </main>
  );
}
