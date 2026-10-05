import { memo } from "react";
import type { Puzzle } from "../domain/puzzle";
import { DIORAMA_TEXTURES } from "../assets/diorama/manifest";
import { RING_WALL_DEPTH, ringGeometry } from "./ring-geometry";

const COLORS = ["#9259d6", "#5d6bd9", "#3fa5e8", "#4fbd72", "#f1c941", "#f28a3a", "#e84f59"];
const TOP_HIGHLIGHTS = ["#aa7fe3", "#7f89e4", "#68b9ef", "#72cd8d", "#f6d96d", "#f6a45f", "#f27079"];
const TOP_SHADOWS = ["#7b49ba", "#4d58b7", "#338ac0", "#3d9d5c", "#cbaa34", "#d36f30", "#c7434a"];
const WALL_COLORS = ["#68428f", "#404a8a", "#2d7094", "#337047", "#927b28", "#a35e2f", "#a43d43"];
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
            strokeWidth="23"
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
            stroke={`url(#ring-wall-${index})`}
            strokeWidth="23"
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
        <polygon points={geometry.channelFloor} className="ring-channel-floor" style={{ fill: "url(#gap-floor-material)" }} />
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
          strokeWidth="24"
          strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
        />
        <circle
          className="ring-top"
          cx={CENTER_X}
          cy={CENTER_Y}
          r={radius}
          stroke={`url(#ring-top-${index})`}
          strokeWidth="21"
          strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
        />
        <circle
          className="ring-paint-grain"
          cx={CENTER_X}
          cy={CENTER_Y}
          r={radius}
          stroke="url(#paint-grain-pattern)"
          strokeWidth="20"
          strokeDasharray={`${geometry.circumference - geometry.gapLength} ${geometry.gapLength}`}
        />
        {geometry.markerPoints.map(({ x, y }, marker) => (
          <circle key={marker} cx={x} cy={y} r="2.35" className="marker" fill="url(#marker-recess)" />
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
              <g key={color}>
                <linearGradient
                  id={`ring-top-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0" stopColor={TOP_HIGHLIGHTS[index]} />
                  <stop offset="0.22" stopColor={color} />
                  <stop offset="0.86" stopColor={color} />
                  <stop offset="1" stopColor={TOP_SHADOWS[index]} />
                </linearGradient>
                <linearGradient
                  id={`ring-wall-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0" stopColor={WALL_COLORS[index]} />
                  <stop offset="0.48" stopColor={WALL_COLORS[index]} />
                  <stop offset="1" stopColor={TOP_SHADOWS[index]} />
                </linearGradient>
              </g>
            ))}
            <pattern id="paint-grain-pattern" width="64" height="64" patternUnits="userSpaceOnUse">
              <image href={DIORAMA_TEXTURES.paint.src} width="64" height="64" opacity="0.34" />
            </pattern>
            <linearGradient id="gap-floor-material" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0" stopColor="#76604a" />
              <stop offset="0.32" stopColor="#5a493b" />
              <stop offset="1" stopColor="#302923" />
            </linearGradient>
            <radialGradient id="hub-material" cx="35%" cy="25%">
              <stop offset="0" stopColor="#bfa1ee" />
              <stop offset="0.52" stopColor="#8e68c8" />
              <stop offset="1" stopColor="#5b3e8b" />
            </radialGradient>
            <radialGradient id="ball-material" cx="30%" cy="22%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.28" stopColor="#fffefe" />
              <stop offset="0.66" stopColor="#e6dfeb" />
              <stop offset="1" stopColor="#92889f" />
            </radialGradient>
            <radialGradient id="marker-recess" cx="38%" cy="32%">
              <stop offset="0" stopColor="#2b241d" />
              <stop offset="0.52" stopColor="#4a3d30" />
              <stop offset="0.76" stopColor="#8c7456" />
              <stop offset="1" stopColor="#fff8e6" stopOpacity="0.62" />
            </radialGradient>
          </defs>
          <ellipse className="board-cast-shadow" cx={CENTER_X + 4} cy={CENTER_Y + 31} rx="204" ry="189" />
          <circle className="board-base-depth board-base-depth-low" cx={CENTER_X} cy={CENTER_Y + 10} r="208" />
          <circle className="board-base-depth" cx={CENTER_X} cy={CENTER_Y + 6} r="208" />
          <circle
            aria-hidden="true"
            cx={CENTER_X}
            cy={CENTER_Y + 12}
            r="205"
            fill="none"
            stroke="#6f5138"
            strokeWidth="5"
            strokeDasharray="7 5"
            strokeLinecap="butt"
            opacity="0.58"
          />
          <circle className="board-base-rim" cx={CENTER_X} cy={CENTER_Y + 4} r="208" />
          <circle className="board-base" cx={CENTER_X} cy={CENTER_Y} r="202" />
          <circle className="board-base-blocks" cx={CENTER_X} cy={CENTER_Y - 1} r="197" />
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
          <circle className="hub" cx={CENTER_X} cy={CENTER_Y} r="22.5" />
          <polygon
            className="hub-sun"
            aria-hidden="true"
            points="210,189 214.6,203.4 229,208 214.6,212.6 210,227 205.4,212.6 191,208 205.4,203.4"
          />
          <ellipse
            className={`ball ${completed ? "ball-fired" : ""}`}
            cx={CENTER_X}
            cy={CENTER_Y - 6}
            rx="9.5"
            ry="12.5"
          />
          <circle
            className={`ball-shine ${completed ? "ball-fired" : ""}`}
            cx={CENTER_X - 3.2}
            cy={CENTER_Y - 10}
            r="2.3"
          />
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
