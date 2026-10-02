import { memo } from "react";
import type { Puzzle } from "../domain/puzzle";
import { RING_WALL_DEPTH, ringGeometry } from "./ring-geometry";

const COLORS = ["#a67cff", "#6670f4", "#45b3ff", "#33cf83", "#efcc35", "#ff9147", "#f45d67"];
const TOP_HIGHLIGHTS = ["#c9b2ff", "#9da4ff", "#91d1ff", "#84e4ae", "#f8df74", "#ffbf83", "#ff969d"];
const TOP_SHADOWS = ["#7d55c9", "#4b53b9", "#2d8fc9", "#269b63", "#b79624", "#c76a34", "#bd414b"];
const WALL_COLORS = ["#6948ad", "#3f47a3", "#2778a8", "#237d53", "#9d7f1f", "#aa5d2d", "#a33b43"];
const LABELS = ["V", "I", "B", "G", "Y", "O", "R"];
const CENTER_X = 210;
const CENTER_Y = 208;

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
  const rotationDegrees = (state * 360) / cycle;
  const rotorClass = `ring-rotor ${rotationMotion === "instant" ? "ring-instant" : ""}`;
  const rotorStyle = {
    transform: `rotate(${rotationDegrees}deg)`,
    transformOrigin: `${CENTER_X}px ${CENTER_Y}px`,
  };

  return (
    <g className="ring">
      <g className="ring-shadow-layer" transform={`translate(0 ${RING_WALL_DEPTH + 4})`}>
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

      <g className="ring-wall-layer" transform={`translate(0 ${RING_WALL_DEPTH})`}>
        <g className={rotorClass} style={rotorStyle}>
          <circle
            className="ring-wall"
            cx={CENTER_X}
            cy={CENTER_Y}
            r={radius}
            stroke={WALL_COLORS[index]}
            strokeWidth="20"
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
        <polygon points={geometry.channelFloor} className="ring-channel-floor" />
        {geometry.notchFaces.map((points, face) => (
          <polygon
            key={face}
            points={points}
            className={`notch-wall notch-wall-${face === 0 ? "lit" : "shade"}`}
            style={{ fill: COLORS[index] }}
          />
        ))}
        <circle
          className="ring-top-bevel"
          cx={CENTER_X}
          cy={CENTER_Y}
          r={radius}
          strokeWidth="21"
          strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
        />
        <circle
          className="ring-top"
          cx={CENTER_X}
          cy={CENTER_Y}
          r={radius}
          stroke={`url(#ring-top-${index})`}
          strokeWidth="18"
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
    <div className={`board-frame ${completed ? "board-complete" : ""}`}>
      <div className="board-surface">
        <svg
          className="board"
          viewBox="0 0 420 440"
          role="img"
          aria-label="Seven concentric puzzle rings. Use the named controls to rotate them."
        >
          <defs>
            {COLORS.map((color, index) => (
              <linearGradient
                key={color}
                id={`ring-top-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0" stopColor={TOP_HIGHLIGHTS[index]} />
                <stop offset="0.36" stopColor={color} />
                <stop offset="1" stopColor={TOP_SHADOWS[index]} />
              </linearGradient>
            ))}
            <radialGradient id="hub-material" cx="35%" cy="25%">
              <stop offset="0" stopColor="#f6e8cb" />
              <stop offset="0.5" stopColor="#c7aa78" />
              <stop offset="1" stopColor="#7e6544" />
            </radialGradient>
            <radialGradient id="ball-material" cx="30%" cy="22%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.22" stopColor="#fff8e6" />
              <stop offset="0.58" stopColor="#d7c9ac" />
              <stop offset="1" stopColor="#8d795c" />
            </radialGradient>
            <radialGradient id="marker-recess" cx="38%" cy="32%">
              <stop offset="0" stopColor="#2b241d" />
              <stop offset="0.52" stopColor="#4a3d30" />
              <stop offset="0.76" stopColor="#8c7456" />
              <stop offset="1" stopColor="#fff8e6" stopOpacity="0.62" />
            </radialGradient>
          </defs>
          <ellipse className="board-cast-shadow" cx={CENTER_X + 4} cy={CENTER_Y + 31} rx="204" ry="189" />
          <circle className="board-base-depth board-base-depth-low" cx={CENTER_X} cy={CENTER_Y + 18} r="208" />
          <circle className="board-base-depth" cx={CENTER_X} cy={CENTER_Y + 12} r="208" />
          <circle className="board-base-rim" cx={CENTER_X} cy={CENTER_Y + 4} r="208" />
          <circle className="board-base" cx={CENTER_X} cy={CENTER_Y} r="202" />
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
          <polygon
            className="hub-sun"
            aria-hidden="true"
            points="210,187 213,197 220.5,189.8 218.5,200.5 228.2,197.5 220.5,205 231,208 220.5,211 228.2,218.5 218.5,215.5 220.5,226.2 213,219 210,229 207,219 199.5,226.2 201.5,215.5 191.8,218.5 199.5,211 189,208 199.5,205 191.8,197.5 201.5,200.5 199.5,189.8 207,197"
          />
          <circle className={`ball ${completed ? "ball-fired" : ""}`} cx={CENTER_X} cy={CENTER_Y - 6} r="15" />
          <circle className={`ball-shine ${completed ? "ball-fired" : ""}`} cx={CENTER_X - 5} cy={CENTER_Y - 11} r="4" />
        </svg>
        <span className={`completion-halo ${completed ? "completion-halo-active" : ""}`} aria-hidden="true" />
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
