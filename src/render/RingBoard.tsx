import { memo } from "react";
import type { Puzzle } from "../domain/puzzle";
import { ringGeometry } from "./ring-geometry";

const COLORS = ["#9c6cff", "#6366f1", "#35a7ff", "#24c875", "#e8c326", "#ff8635", "#f34e59"];
const LABELS = ["V", "I", "B", "G", "Y", "O", "R"];
const CENTER_X = 210;
const CENTER_Y = 208;
const WALL_DEPTH = 10;

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

const pointOnCircle = (radius: number, angle: number, yOffset = 0) => ({
  x: CENTER_X + radius * Math.cos(angle),
  y: CENTER_Y + radius * Math.sin(angle) + yOffset,
});

const pointsAttribute = (points: readonly { x: number; y: number }[]) =>
  points.map(({ x, y }) => `${x},${y}`).join(" ");

const Ring = memo(function Ring({ index, cycle, state, rotationMotion }: RingProps) {
  const radius = 38 + index * 27;
  const geometry = ringGeometry(radius, cycle);
  const displayedState = ((state % cycle) + cycle) % cycle;
  const rotationDegrees = (state * 360) / cycle;
  const rotationRadians = (state * 2 * Math.PI) / cycle;
  const rotorClass = `ring-rotor ${rotationMotion === "instant" ? "ring-instant" : ""}`;
  const rotorStyle = {
    transform: `rotate(${rotationDegrees}deg)`,
    transformOrigin: `${CENTER_X}px ${CENTER_Y}px`,
  };
  const halfGapAngle = geometry.gapLength / radius / 2;
  const notchFaces = [-halfGapAngle, halfGapAngle].map((edgeAngle) => {
    const angle = edgeAngle + rotationRadians;
    return pointsAttribute([
      pointOnCircle(geometry.innerRadius, angle),
      pointOnCircle(geometry.outerRadius, angle),
      pointOnCircle(geometry.outerRadius, angle, WALL_DEPTH),
      pointOnCircle(geometry.innerRadius, angle, WALL_DEPTH),
    ]);
  });
  const channelFloorPoints = pointsAttribute([
    pointOnCircle(geometry.innerRadius, -halfGapAngle),
    pointOnCircle(geometry.outerRadius, -halfGapAngle),
    pointOnCircle(geometry.outerRadius, halfGapAngle),
    pointOnCircle(geometry.innerRadius, halfGapAngle),
  ]);

  return (
    <g className="ring">
      <g className="ring-shadow-layer" transform={`translate(0 ${WALL_DEPTH + 4})`}>
        <g className={rotorClass} style={rotorStyle}>
          <circle
            className="ring-shadow"
            cx={CENTER_X}
            cy={CENTER_Y}
            r={radius}
            strokeWidth="20"
            strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
          />
        </g>
      </g>

      <g className="ring-wall-layer" transform={`translate(0 ${WALL_DEPTH})`}>
        <g className={rotorClass} style={rotorStyle}>
          <circle
            className="ring-wall"
            cx={CENTER_X}
            cy={CENTER_Y}
            r={radius}
            strokeWidth="19"
            strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
          />
          <circle
            className="ring-edge ring-outer-edge"
            cx={CENTER_X}
            cy={CENTER_Y}
            r={geometry.outerRadius}
            strokeDasharray={`${geometry.outerCircumference - geometry.outerGapLength} ${geometry.outerGapLength}`}
          />
          <circle
            className="ring-edge ring-inner-edge"
            cx={CENTER_X}
            cy={CENTER_Y}
            r={geometry.innerRadius}
            strokeDasharray={`${geometry.innerCircumference - geometry.innerGapLength} ${geometry.innerGapLength}`}
          />
        </g>
      </g>

      <g className={rotorClass} style={rotorStyle}>
        <polygon points={channelFloorPoints} className="ring-channel-floor" />
      </g>

      {notchFaces.map((points, face) => (
        <polygon
          key={face}
          points={points}
          className={`notch-wall notch-wall-${face === 0 ? "lit" : "shade"}`}
          style={{ fill: COLORS[index] }}
        />
      ))}

      <g className={rotorClass} style={rotorStyle}>
        <circle
          className="ring-top-bevel"
          cx={CENTER_X}
          cy={CENTER_Y}
          r={radius}
          strokeWidth="20"
          strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
        />
        <circle
          className="ring-top"
          cx={CENTER_X}
          cy={CENTER_Y}
          r={radius}
          stroke={COLORS[index]}
          strokeWidth="17"
          strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
        />
        {geometry.markerPoints.map(({ x, y }, marker) => (
          <circle key={marker} cx={x} cy={y} r="2.6" className="marker" fill="url(#marker-recess)" />
        ))}
        <text className="ring-id" x={CENTER_X - radius} y={CENTER_Y} aria-hidden="true">
          {LABELS[index]}
        </text>
      </g>
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
          viewBox="0 0 420 440"
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
            <radialGradient id="marker-recess" cx="38%" cy="32%">
              <stop offset="0" stopColor="#05070d" />
              <stop offset="0.56" stopColor="#0b1020" />
              <stop offset="0.78" stopColor="#20293d" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.34" />
            </radialGradient>
          </defs>
          <circle className="board-base-rim" cx={CENTER_X} cy={CENTER_Y + 13} r="206" />
          <circle className="board-base" cx={CENTER_X} cy={CENTER_Y} r="206" />
          <g style={{ transform: `rotate(${boardRotation}deg)`, transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}>
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
          <circle className="hub" cx={CENTER_X} cy={CENTER_Y} r="25" />
          <circle className={`ball ${completed ? "ball-fired" : ""}`} cx={CENTER_X} cy={CENTER_Y - 6} r="15" />
          <circle className={`ball-shine ${completed ? "ball-fired" : ""}`} cx={CENTER_X - 5} cy={CENTER_Y - 11} r="4" />
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
