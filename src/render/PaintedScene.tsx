import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Puzzle } from "../domain/puzzle";
import { PAINTED_RING_COLORS, paintedRingDegrees } from "./painted-geometry";

/**
 * Reference-image scene. The game itself stays owned by App and its reducer.
 * Experimental until art binaries are shipped and zero-scroll mobile tests pass.
 */
export interface PaintedSceneProps {
  title: ReactNode;
  board: ReactNode;
  controls: ReactNode;
  status: ReactNode;
  navigation: ReactNode;
  moves: ReactNode;
  goal: ReactNode;
  solution: ReactNode;
}
export const paintedAsset = (filename: string): string =>
  import.meta.env.BASE_URL + "reference-skin/" + filename;

export interface PaintedRingBoardProps {
  puzzle: Puzzle;
  visualStates: readonly number[];
  boardOrientation: number;
  rotationMotion: "step" | "instant";
  canFire: boolean;
  completed: boolean;
  onFire: () => void;
}

export function PaintedRingBoard({
  puzzle, visualStates, boardOrientation, rotationMotion, canFire, completed, onFire,
}: PaintedRingBoardProps) {
  const label = completed ? "Puzzle complete"
    : canFire ? "Fire center ball" : "Center ball locked until exact alignment";
  return (
    <div className="painted-ring-board board-frame" aria-label="Seven concentric puzzle rings">
      <div className="painted-ring-projection">
        {PAINTED_RING_COLORS.map((color, artIndex) => {
          const degrees = paintedRingDegrees(puzzle, visualStates, boardOrientation, artIndex);
          return (
            <img key={color}
              className={"painted-ring-sprite " + (rotationMotion === "instant" ? "painted-ring-instant" : "")}
              src={paintedAsset("ring-" + (artIndex + 1) + "-" + color + "-normalized.webp")}
              width={900} height={900} alt="" draggable={false} aria-hidden="true"
              style={{ transform: "rotate(" + degrees + "deg)", zIndex: artIndex + 1 }}
            />
          );
        })}
      </div>
      <span className={"painted-pearl " + (completed ? "painted-pearl-fired" : "")} aria-hidden="true" />
      <button className="painted-hub-button" disabled={!canFire || completed}
        onClick={onFire} aria-label={label}>
        <span className="visually-hidden">{label}</span>
      </button>
    </div>
  );
}

function ArtImage({ filename, className }: { filename: string; className: string }) {
  return (
    <img className={className} src={paintedAsset(filename)} width={1536} height={864}
      loading="eager" decoding="async" alt="" draggable={false} aria-hidden="true" />
  );
}

const DESIGN_HEIGHT = 864;
function useLandscapeDimensions() {
  const getDimensions = () => ({
    long: typeof window === "undefined" ? 1536 : Math.max(window.innerWidth, window.innerHeight),
    short: typeof window === "undefined" ? 864 : Math.min(window.innerWidth, window.innerHeight),
  });
  const [value, setValue] = useState(getDimensions);
  useEffect(() => {
    const update = () => setValue(getDimensions());
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);
  return value;
}

export function PaintedScene({
  title, board, controls, status, navigation, moves, goal, solution,
}: PaintedSceneProps) {
  const screen = useLandscapeDimensions();
  const scale = Math.max(0.01, screen.short / DESIGN_HEIGHT);
  const stageWidth = screen.long / scale;
  const touch = 44 / scale;
  const customProperties = {
    "--painted-stage-width": stageWidth + "px",
    "--painted-scale": String(scale),
    "--painted-touch": touch + "px",
    "--painted-logo-left": (screen.short < 370 ? 365 : 20) + "px",
    "--painted-rail-top": Math.max(0, Math.min(180, DESIGN_HEIGHT - touch * 7)) + "px",
  } as CSSProperties;
  return (
    <section className="painted-stage-host" aria-label="Ring Road play area">
      <div className="painted-stage reference-first-scene" style={customProperties}>
        <ArtImage filename="ocean-sky-mountains.webp" className="painted-ocean" />
        <div className="painted-world" aria-hidden="true">
          <ArtImage filename="castle-waterfalls-terrain.webp" className="painted-landscape" />
          <ArtImage filename="arena-plinth-empty.webp" className="painted-arena" />
        </div>
        <div className="painted-board-slot">{board}</div>
        <div className="painted-world painted-foreground" aria-hidden="true">
          <ArtImage filename="foreground-stairs-flowers.webp" className="painted-front-art" />
        </div>
        <div className="painted-title-slot">{title}</div>
        <div className="painted-control-slot">{controls}</div>
        <div className="painted-goal-slot">{goal}</div>
        <div className="painted-navigation-slot">{navigation}</div>
        <div className="painted-moves-slot">{moves}</div>
        <div className="painted-solution-slot">{solution}</div>
        <div className="painted-status-slot">{status}</div>
      </div>
    </section>
  );
}
