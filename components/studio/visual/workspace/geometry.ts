export type Point = { x: number; y: number };
export type SelectionRect = { x: number; y: number; width: number; height: number };

export function clampZoom(value: number) {
  return Math.max(20, Math.min(200, Math.round(value)));
}


export function rectsIntersect(a: SelectionRect, b: SelectionRect) {
  return (
    a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y
  );
}

export function distance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

