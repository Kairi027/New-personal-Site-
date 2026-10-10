const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function dist2(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  return dist2(x1, y1, x2, y2) <= (r1 + r2) * (r1 + r2);
}

function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function normalizeAngle(angle) {
  while (angle < -Math.PI) angle += TAU;
  while (angle > Math.PI) angle -= TAU;
  return angle;
}

module.exports = {
  TAU,
  clamp,
  lerp,
  rand,
  randInt,
  dist2,
  circlesOverlap,
  angleTo,
  easeOutCubic,
  normalizeAngle,
};
