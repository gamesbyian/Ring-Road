import { paintedRingSpriteUrl } from "./painted-ring-retopology";
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
    <div className="painted-ring-board" aria-label="Seven concentric puzzle rings">
      <div className="painted-ring-projection">
        <span className="painted-violet-medallion" aria-hidden="true" />
        {PAINTED_RING_COLORS.map((color, artIndex) => {
          const degrees = paintedRingDegrees(puzzle, visualStates, boardOrientation, artIndex);
          return (
            <img key={color}
              className={"painted-ring-sprite " + (rotationMotion === "instant" ? "painted-ring-instant" : "")}
              src={paintedRingSpriteUrl("ring-" + (artIndex + 1) + "-" + color + "-normalized.webp", import.meta.env.BASE_URL + "reference-skin/")}
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
  // The 16:9 illustration is the exact 1536×864 registration authority;
  // shorter phone layouts must keep the full-height seven-button rail.
  const photoLayout = screen.short >= 600 && screen.long / screen.short >= 1.65;
  // Taller-than-16:9 landscape screens need a narrower three-column scene,
  // rather than stretching the short-phone rail over the full-size board.
  const tallLayout = screen.short >= 600 && !photoLayout;
  const customProperties = {
    "--painted-stage-width": stageWidth + "px",
    "--painted-scale": String(scale),
    "--painted-touch": touch + "px",
    "--painted-action-font": Math.max(22, Math.min(38, 13 / scale)) + "px",
    "--painted-logo-left": (photoLayout ? 175 : tallLayout ? 8 : screen.short < 370 ? 365 : 20) + "px",
    "--painted-logo-top": (photoLayout ? 19 : tallLayout ? 5 : 6) + "px",
    "--painted-logo-width": (photoLayout ? 356 : tallLayout ? 258 : 335) + "px",
    "--painted-logo-height": (photoLayout ? 214 : tallLayout ? 155 : 180) + "px",
    "--painted-rail-left": (photoLayout ? 190 : 8) + "px",
    "--painted-rail-width": (photoLayout ? 205 : tallLayout ? 205 : 345) + "px",
    "--painted-row-height": (photoLayout ? 50 : tallLayout ? Math.max(50, touch) : touch) + "px",
    "--painted-nav-right": (photoLayout ? 161 : tallLayout ? 12 : 12) + "px",
    "--painted-nav-top": (photoLayout ? 36 : tallLayout ? 12 : 12) + "px",
    "--painted-nav-width": (photoLayout ? 223 : tallLayout ? 215 : 400) + "px",
    "--painted-nav-height": (photoLayout ? 104 : tallLayout ? 92 : 132) + "px",
    "--painted-moves-right": (photoLayout ? 161 : tallLayout ? 19 : 18) + "px",
    "--painted-moves-top": (photoLayout ? 147 : tallLayout ? 120 : 155) + "px",
    "--painted-moves-width": (photoLayout ? 172 : tallLayout ? 180 : 245) + "px",
    "--painted-moves-height": (photoLayout ? 138 : tallLayout ? 140 : 158) + "px",
    "--painted-solution-right": (photoLayout ? 109 : tallLayout ? 12 : 17) + "px",
    "--painted-solution-bottom": (photoLayout ? 39 : tallLayout ? 12 : 13) + "px",
    "--painted-solution-width": (photoLayout ? 192 : tallLayout ? 194 : 210) + "px",
    "--painted-solution-height": (photoLayout ? 193 : tallLayout ? 190 : 196) + "px",
    "--painted-rail-top": (photoLayout ? 249 : tallLayout ? 165 : Math.max(0, Math.min(180, DESIGN_HEIGHT - touch * 7))) + "px",
    "--painted-goal-left": (photoLayout ? 128 : tallLayout ? 9 : 370) + "px",
    "--painted-goal-bottom": (photoLayout ? 55 : tallLayout ? 12 : 16) + "px",
    "--painted-goal-height": (photoLayout ? 172 : 190) + "px",
  } as CSSProperties;
  return (
    <section className="painted-stage-host" aria-label="Ring Road play area">
      <div className="painted-stage reference-first-scene" data-photo-layout={photoLayout ? "true" : "false"} data-tall-layout={tallLayout ? "true" : "false"} style={customProperties}>
        <ArtImage filename="ocean-sky-mountains.webp" className="painted-ocean" />
        <div className="painted-world" aria-hidden="true">
          <ArtImage filename="reference-empty-arena.webp" className="painted-registered-scene" />
        </div>
        <div className="painted-board-slot">{board}</div>
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
