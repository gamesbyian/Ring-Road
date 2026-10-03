export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface RingGeometry {
  readonly radius: number;
  readonly circumference: number;
  readonly gapLength: number;
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly innerCircumference: number;
  readonly outerCircumference: number;
  readonly innerGapLength: number;
  readonly outerGapLength: number;
  readonly markerPoints: readonly Point[];
  readonly channelFloor: string;
  readonly notchFaces: readonly string[];
}

const CENTER_X = 210;
const TOP_CENTER_Y = 208;
export const RING_WALL_DEPTH = 8;
const HALF_RING_THICKNESS = 10.5;
const GAP_LENGTH = 22;
const cache = new Map<string, RingGeometry>();

const pointOnCircle = (radius: number, angle: number, yOffset = 0): Point => ({
  x: CENTER_X + radius * Math.cos(angle),
  y: TOP_CENTER_Y + radius * Math.sin(angle) + yOffset,
});

const pointsAttribute = (points: readonly Point[]): string =>
  points.map(({ x, y }) => `${x},${y}`).join(" ");

/** Builds immutable ring-local geometry once per radius/cycle pair and reuses it for every move. */
export function ringGeometry(radius: number, cycle: number): RingGeometry {
  if (!Number.isFinite(radius) || radius <= HALF_RING_THICKNESS) {
    throw new Error(`Ring radius must be greater than ${HALF_RING_THICKNESS}`);
  }
  if (!Number.isInteger(cycle) || cycle <= 0) {
    throw new Error("Ring cycle must be a positive integer");
  }
  const key = `${radius}:${cycle}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const halfGapAngle = GAP_LENGTH / radius / 2;
  const gapAngle = halfGapAngle * 2;
  const innerRadius = radius - HALF_RING_THICKNESS;
  const outerRadius = radius + HALF_RING_THICKNESS;
  const markerPoints = Array.from({ length: cycle }, (_, marker) => {
    const angle = (marker * 2 * Math.PI) / cycle - Math.PI / 2;
    return pointOnCircle(radius, angle);
  });
  const channelFloor = pointsAttribute([
    pointOnCircle(innerRadius, -halfGapAngle),
    pointOnCircle(outerRadius, -halfGapAngle),
    pointOnCircle(outerRadius, halfGapAngle),
    pointOnCircle(innerRadius, halfGapAngle),
  ]);
  const notchFaces = [-halfGapAngle, halfGapAngle].map((angle) => pointsAttribute([
    pointOnCircle(innerRadius, angle),
    pointOnCircle(outerRadius, angle),
    pointOnCircle(outerRadius, angle, RING_WALL_DEPTH),
    pointOnCircle(innerRadius, angle, RING_WALL_DEPTH),
  ]));
  const geometry = Object.freeze({
    radius,
    circumference: 2 * Math.PI * radius,
    gapLength: GAP_LENGTH,
    innerRadius,
    outerRadius,
    innerCircumference: 2 * Math.PI * innerRadius,
    outerCircumference: 2 * Math.PI * outerRadius,
    innerGapLength: gapAngle * innerRadius,
    outerGapLength: gapAngle * outerRadius,
    markerPoints: Object.freeze(markerPoints),
    channelFloor,
    notchFaces: Object.freeze(notchFaces),
  });
  cache.set(key, geometry);
  return geometry;
}
