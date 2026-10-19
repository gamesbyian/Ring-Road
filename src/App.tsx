import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { completionStatus, initialGameState, isExactSolved, nextMoveHint, reduceGame } from "./app/game-state";
import { CAMPAIGN, CAMPAIGN_ANALYSES } from "./content/campaign";
import { PaintedRingBoard, PaintedScene, paintedAsset } from "./render/PaintedScene";
import { paintedAssetsReady } from "./render/painted-assets";
import { completedBestFor, loadCompletionBests, saveCompletionBests, withExactCompletion } from "./app/completion-bests";
import { PROGRESS_BEADS, progressBeadIndex } from "./app/campaign-progress";
import "./styles/app.css";
import "./styles/painted-stage.css";
import { Modal } from "./ui/Modal";

const LABELS = ["Violet", "Indigo", "Blue", "Green", "Yellow", "Orange", "Red"];
const RING_ORDER = [6, 5, 4, 3, 2, 1, 0] as const;

export default function App() {
  // Painted is the single shipping presentation in both Android and web.
  // Fail visibly if artwork is absent; never silently fall back to obsolete
  // classic visuals or claim a partially loaded painted scene succeeded.
  const [paintedStatus, setPaintedStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [assetRetry, setAssetRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void paintedAssetsReady().then((ready) => {
      if (active) setPaintedStatus(ready ? "ready" : "unavailable");
    });
    return () => { active = false; };
  }, [assetRetry]);
  const [completionBests, setCompletionBests] = useState(loadCompletionBests);
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
  const previousBest = completedBestFor(completionBests, puzzle.id, puzzle.targetMoves);
  useEffect(() => {
    if (!state.completed) return;
    setCompletionBests((current) =>
      withExactCompletion(current, puzzle.id, puzzle.targetMoves, state.history.length));
  }, [state.completed, state.history.length, puzzle.id, puzzle.targetMoves]);
  useEffect(() => {
    // Persistence stays outside React's state updater, including StrictMode
    // render replays. Storage failures never change whether a route is solved.
    saveCompletionBests(completionBests);
  }, [completionBests]);

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
      <div className="title-plaque world-plaque" style={{ backgroundImage: "url(" + paintedAsset("logo.webp") + ")" }}>
        <span className="eyebrow">Precision alignment puzzle</span>
        <h1><span>Ring</span><span>Road</span></h1>
        <span className="title-mountain-mark" aria-hidden="true" />
        <span className="title-road-mark" aria-hidden="true" />
        <span className="title-tagline">Align the gaps. Clear the road.</span>
      </div>
    </header>
  );

  const board = (
    <PaintedRingBoard
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
      <div className="ring-controls">
        {RING_ORDER.map((ring) => {
          const cycle = puzzle.ringCycles[ring];
          return (
            <div
              className={`ring-control ring-control-${ring}`}
              key={ring}
              style={{ backgroundImage: "url(" + paintedAsset("row-" + (7 - ring) + ".webp") + ")" }}
              role="group"
              aria-label={`${LABELS[ring]} ring, orientation ${(state.rotations[ring] ?? 0) + 1} of ${cycle}`}
            >
              <span className={`swatch ring-${ring}`} aria-hidden="true"><i /></span>
              <span className="ring-name">Ring {7 - ring} <small>{cycle} stops</small></span>
              <button
                onClick={() => dispatch({ type: "rotate", ring, direction: -1 })}
                disabled={state.completed}
                aria-label={`Rotate ${LABELS[ring]} counterclockwise`}
              ><span className="rotation-glyph rotation-glyph-ccw" aria-hidden="true">↶</span></button>
              <button
                onClick={() => dispatch({ type: "rotate", ring, direction: 1 })}
                disabled={state.completed}
                aria-label={`Rotate ${LABELS[ring]} clockwise`}
              ><span className="rotation-glyph rotation-glyph-cw" aria-hidden="true">↷</span></button>
            </div>
          );
        })}
      </div>
      <div className="actions" aria-label="Puzzle actions">
        <button onClick={() => dispatch({ type: "undo" })} disabled={!state.history.length || state.completed}>Undo</button>
        <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
        <button onClick={() => dispatch({ type: "toggle-hint" })}>Hint</button>
        <button className="solution-inline-action solution-compact-action" onClick={() => dispatch({ type: "toggle-solution" })}>Solution</button>
      </div>
    </aside>
  );

  const moves = (
    <section className={`reference-moves-card counter counter-${moveState}`} aria-label={`${state.history.length} of ${puzzle.targetMoves} moves`}>
      <span className="reference-card-label">Moves</span>
      <strong>{state.history.length}</strong>
      <span className="reference-moves-rule" aria-hidden="true" />
      <span className="reference-moves-target">
        <span className="painted-best-readout">Best: <b>{previousBest ?? "—"}</b></span>
        <span className="painted-target-readout">Target <b>{puzzle.targetMoves}</b></span>
      </span>
    </section>
  );

  const goal = (
    <section className="reference-goal-card" aria-label="Puzzle goal">
      <div className="reference-goal-heading">
        <button
          className="reference-goal-badge reference-goal-guide"
          onClick={() => dispatch({ type: "toggle-guide" })}
          aria-label="Open guide"
        >?</button>
        <strong>Goal</strong>
      </div>
      <p aria-label="Rotate the rings to align all seven gaps into one straight path.">
        <span className="painted-goal-full-copy" aria-hidden="true">Rotate the rings to align all 7 gaps into one straight path.</span>
        <span className="painted-goal-compact-copy" aria-hidden="true">Align all 7 gaps into one path.</span>
      </p>
      <div className="reference-goal-miniature" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );

  const solutionCard = (
    <button
      className="reference-solution-card reference-solution-card-button"
      aria-label="View solution"
      onClick={() => dispatch({ type: "toggle-solution" })}
    >
      <span className="reference-solution-heading">
        <span className="reference-eye" aria-hidden="true" />
        <strong>Solution</strong>
      </span>
      <span className="reference-solution-preview" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
    </button>
  );

  const navigation = (
    <nav className="puzzle-plaque" aria-label="Puzzle navigation">
      <button aria-label="Previous puzzle" onClick={() => dispatch({ type: "select", index: state.puzzleIndex - 1 })}>Previous</button>
      <span className="puzzle-index">
        <span className="puzzle-numberline">Puzzle {String(puzzle.id).padStart(2, "0")}</span>
        <span className="puzzle-progress-dots" aria-hidden="true">
          {Array.from({ length: PROGRESS_BEADS }, (_, index) => (
            <i key={index} className={index === progressBeadIndex(state.puzzleIndex, CAMPAIGN.length) ? "active" : undefined} />
          ))}
        </span>
        <small className="puzzle-total">of {CAMPAIGN.length}</small>
      </span>
      <button aria-label="Next puzzle" onClick={() => dispatch({ type: "select", index: state.puzzleIndex + 1 })}>Next</button>
    </nav>
  );

  if (paintedStatus !== "ready") {
    return (
      <main className="app-shell painted-app" data-skin-mode="painted" data-skin-status={paintedStatus}>
        <section className="painted-startup" role={paintedStatus === "unavailable" ? "alert" : "status"}>
          <h1>Ring Road</h1>
          {paintedStatus === "loading"
            ? <p>Loading the painted game…</p>
            : <>
                <p>The painted artwork could not be loaded. All seven rings and scenery must be intact before play.</p>
                <button onClick={() => { setPaintedStatus("loading"); setAssetRetry((value) => value + 1); }}>
                  Retry artwork
                </button>
              </>
          }
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell painted-app" data-skin-mode="painted" data-skin-status="ready">
      <PaintedScene
        title={title}
        board={board}
        controls={controls}
        status={<p className={`status status-${moveState}`} role="status" aria-live="polite">{status}</p>}
        navigation={navigation}
        moves={moves}
        goal={goal}
        solution={solutionCard}
      />

      {state.guideOpen && (
        <Modal title="How to play" onClose={closeGuide} closeLabel="Play" variant="guide">
          <p>Rotate each ring one legal step at a time. Align all seven gaps on one spoke in exactly the target moves. A full same-direction turn counts, but reversing to pad the total does not.</p>
        </Modal>
      )}
      {state.solutionOpen && (
        <Modal title="Exact solution" onClose={closeSolution} variant="solution">
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
        <Modal title="Puzzle complete!" onClose={closeCompletion} variant="completion">
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
