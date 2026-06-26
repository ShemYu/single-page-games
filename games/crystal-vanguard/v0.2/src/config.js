export const PHASE = Object.freeze({
  BUILD: 'build',
  COMBAT: 'combat',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
});

export const GAME_CONFIG = Object.freeze({
  version: '0.2.0',
  width: 960,
  height: 640,
  backgroundColor: '#0a1215',
  board: Object.freeze({
    originX: 64,
    originY: 32,
    cols: 13,
    rows: 9,
    cell: 64,
    crystal: Object.freeze({ x: 6, y: 4 })
  }),
  economy: Object.freeze({
    startingGold: 38,
    sellRefundRate: 0.6,
    defenderCap: 8
  }),
  crystal: Object.freeze({
    maxHp: 1000
  }),
  timings: Object.freeze({
    stateBroadcastMs: 160,
    deathFadeMs: 360
  }),
  defaultCombatMode: 'realtime'
});

export const DIRECTION_ROWS = Object.freeze({
  S: 0,
  SE: 1,
  E: 2,
  NE: 3,
  N: 4,
  NW: 5,
  W: 6,
  SW: 7
});

const DIRECTION_SEQUENCE = Object.freeze([
  Object.freeze({ id: 'E', angle: 0 }),
  Object.freeze({ id: 'SE', angle: Math.PI / 4 }),
  Object.freeze({ id: 'S', angle: Math.PI / 2 }),
  Object.freeze({ id: 'SW', angle: Math.PI * 3 / 4 }),
  Object.freeze({ id: 'W', angle: Math.PI }),
  Object.freeze({ id: 'NW', angle: -Math.PI * 3 / 4 }),
  Object.freeze({ id: 'N', angle: -Math.PI / 2 }),
  Object.freeze({ id: 'NE', angle: -Math.PI / 4 })
]);

export const SPAWN_CELLS = Object.freeze({
  N: Object.freeze({ x: 6, y: 0 }),
  NE: Object.freeze({ x: 12, y: 0 }),
  E: Object.freeze({ x: 12, y: 4 }),
  SE: Object.freeze({ x: 12, y: 8 }),
  S: Object.freeze({ x: 6, y: 8 }),
  SW: Object.freeze({ x: 0, y: 8 }),
  W: Object.freeze({ x: 0, y: 4 }),
  NW: Object.freeze({ x: 0, y: 0 })
});

export const SPAWN_LABELS = Object.freeze({
  N: '北',
  NE: '東北',
  E: '東',
  SE: '東南',
  S: '南',
  SW: '西南',
  W: '西',
  NW: '西北'
});

export function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

export function directionFromVector(dx, dy, currentDirection = 'S', hysteresisDegrees = 5) {
  if (Math.hypot(dx, dy) < 0.001) return currentDirection;

  const angle = Math.atan2(dy, dx);
  const current = DIRECTION_SEQUENCE.find(direction => direction.id === currentDirection) ?? DIRECTION_SEQUENCE[2];
  const wrappedDistance = Math.abs(Math.atan2(
    Math.sin(angle - current.angle),
    Math.cos(angle - current.angle)
  ));
  const hysteresis = hysteresisDegrees * Math.PI / 180;
  if (wrappedDistance <= Math.PI / 8 + hysteresis) return current.id;

  const index = (Math.round(angle / (Math.PI / 4)) + 8) % 8;
  return DIRECTION_SEQUENCE[index].id;
}

export function phaseLabel(phase) {
  return ({
    [PHASE.BUILD]: '部署階段',
    [PHASE.COMBAT]: '戰鬥中',
    [PHASE.VICTORY]: '防守成功',
    [PHASE.DEFEAT]: '水晶失守'
  })[phase] ?? phase;
}
