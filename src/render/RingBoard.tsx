import { memo } from "react";
import type { Puzzle } from "../domain/puzzle";
import { ringGeometry } from "./ring-geometry";

const COLORS = ["#9c6cff", "#6366f1", "#35a7ff", "#24c875", "#e8c326", "#ff8635", "#f34e59"];
const LABELS = ["V", "I", "B", "G", "Y", "O", "R"];

interface Props {
  puzzle: Puzzle;
  visualStates: readonly number[];
  boardOrientation: number;
  rotationMotion: "step" | "instant";
  canFire: boolean;
  completed: boolean;
  onFire: () => void;
}

interface RingProps {
  index: number;
  cycle: number;
  state: number;
  rotationMotion: "step" | "instant";
}

const Ring = memo(function Ring({ index, cycle, state, rotationMotion }: RingProps) {
  const radius = 38 + index * 27;
  const geometry = ringGeometry(radius, cycle);
  const displayedState = ((state % cycle) + cycle) % cycle;

  return (
    <g
      className={`ring ${rotationMotion === "instant" ? "ring-instant" : ""}`}
      style={{ transform: `rotate(${(state * 360) / cycle}deg)`, transformOrigin: "210px 210px" }}
    >
      <circle
        className="ring-shadow"
        cx="210"
        cy="214"
        r={radius}
        strokeWidth="20"
        strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
      />
      <circle
        className="ring-wall"
        cx="210"
        cy="212"
        r={radius}
        strokeWidth="19"
        strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
      />
      <circle
        className="ring-edge ring-outer-edge"
        cx="210"
        cy="212"
        r={geometry.outerRadius}
        strokeDasharray={`${geometry.outerCircumference - geometry.outerGapLength} ${geometry.outerGapLength}`}
      />
      <circle
        className="ring-edge ring-inner-edge"
        cx="210"
        cy="212"
        r={geometry.innerRadius}
        strokeDasharray={`${geometry.innerCircumference - geometry.innerGapLength} ${geometry.innerGapLength}`}
      />
      <circle
        className="ring-top"
        cx="210"
        cy="208"
        r={radius}
        stroke={COLORS[index]}
        strokeWidth="17"
        strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
      />
      {geometry.notchFaces.map((points, face) => (
        <polygon key={face} points={points} className="notch-wall" />
      ))}
      {geometry.markerPoints.map(({ x, y }, marker) => <circle key={marker} cx={x} cy={y} r="2.3" className="marker" />)}
      <text className="ring-id" x={210 - radius} y="208" aria-hidden="true">{LABELS[index]}</text>
      <title>{`${LABELS[index]} ring: orientation ${displayedState + 1} of ${cycle}`}</title>
    </g>
  );
});

export function RingBoard({ puzzle, visualStates, boardOrientation, rotationMotion, canFire, completed, onFire }: Props) {
  const boardRotation = (boardOrientation * 360) / puzzle.ringCycles[0];
  const fireLabel = completed ? "Puzzle complete" : canFire ? "Fire center ball" : "Center ball locked until exact alignment";

  return (
    <div className="board-frame">
      <div className="board-surface">
        <svg
          className="board"
          viewBox="0 0 420 420"
          role="img"
          aria-label="Seven concentric puzzle rings. Use the named controls to rotate them."
        >
        <defs>
          <radialGradient id="hub-material" cx="35%" cy="25%">
            <stop offset="0" stopColor="#626c84" />
            <stop offset="0.55" stopColor="#303749" />
            <stop offset="1" stopColor="#151925" />
          </radialGradient>
          <radialGradient id="ball-material" cx="32%" cy="24%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.28" stopColor="#dce4f5" />
            <stop offset="0.72" stopColor="#8f9bb3" />
            <stop offset="1" stopColor="#515b70" />
          </radialGradient>
        </defs>
        <circle className="board-base-rim" cx="210" cy="215" r="206" />
        <circle className="board-base" cx="210" cy="208" r="206" />
        <g style={{ transform: `rotate(${boardRotation}deg)`, transformOrigin: "210px 210px" }}>
          {puzzle.ringCycles.map((cycle, index) => (
            <Ring
              key={index}
              index={index}
              cycle={cycle}
              state={visualStates[index] ?? 0}
              rotationMotion={rotationMotion}
            />
          ))}
        </g>
        <circle className="hub" cx="210" cy="208" r="25" />
        <circle className={`ball ${completed ? "ball-fired" : ""}`} cx="210" cy="202" r="15" />
        <circle className={`ball-shine ${completed ? "ball-fired" : ""}`} cx="205" cy="197" r="4" />
        </svg>
        <button className="hub-button" onClick={onFire} disabled={!canFire || completed} aria-label={fireLabel}>
          <span className="visually-hidden">{fireLabel}</span>
        </button>
      </div>
      <p className="center-instruction" aria-hidden="true">
        {completed ? "Complete!" : canFire ? "Fire center" : "Center locked"}
      </p>
    </div>
  );
}
