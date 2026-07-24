/**
 * Level definitions for Cut the Rope clone.
 * Coordinates are normalized 0-1 relative to canvas size.
 * 100 levels across 10 boxes.
 * Design rules (enforceHeadGateRule, resolveObstacleOverlaps):
 * - Platforms must not permanently block the gate above Om Nom.
 * - Obstacles must not overlap each other.
 */
const BASE_LEVELS = [
  {
    id: 1,
    name: 'Getting Started',
    candy: { x: 0.5, y: 0.28 },
    omNom: { x: 0.5, y: 0.88 },
    anchors: [{ x: 0.5, y: 0.05 }],
    ropes: [{ anchorIndex: 0, segments: 14 }],
    stars: [{ x: 0.5, y: 0.54 }],
    obstacles: [],
    winds: []
  },
  {
    id: 2,
    name: 'Two Ropes',
    candy: { x: 0.35, y: 0.24 },
    omNom: { x: 0.65, y: 0.88 },
    anchors: [{ x: 0.35, y: 0.04 }, { x: 0.55, y: 0.06 }],
    ropes: [
      { anchorIndex: 0, segments: 12 },
      { anchorIndex: 1, segments: 10, attachToCandy: true }
    ],
    stars: [
      { x: 0.44, y: 0.26 },
      { x: 0.58, y: 0.56 }
    ],
    obstacles: [],
    winds: []
  },
  {
    id: 3,
    name: 'Stars',
    candy: { x: 0.5, y: 0.22 },
    omNom: { x: 0.5, y: 0.88 },
    anchors: [{ x: 0.5, y: 0.03 }],
    ropes: [{ anchorIndex: 0, segments: 16 }],
    stars: [
      { x: 0.5, y: 0.40 },
      { x: 0.5, y: 0.54 },
      { x: 0.5, y: 0.68 }
    ],
    obstacles: [],
    winds: []
  },
  {
    id: 4,
    name: 'Obstacle',
    candy: { x: 0.35, y: 0.24 },
    omNom: { x: 0.65, y: 0.88 },
    anchors: [{ x: 0.35, y: 0.04 }],
    ropes: [{ anchorIndex: 0, segments: 14 }],
    stars: [
      { x: 0.44, y: 0.26 },
      { x: 0.58, y: 0.56 }
    ],
    obstacles: [
      { x: 0.50, y: 0.68, w: 0.22, h: 0.04, type: 'wood' }
    ],
    winds: []
  },
  {
    id: 5,
    name: 'Challenge',
    candy: { x: 0.5, y: 0.22 },
    omNom: { x: 0.5, y: 0.88 },
    anchors: [
      { x: 0.3, y: 0.04 },
      { x: 0.5, y: 0.02 },
      { x: 0.7, y: 0.04 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 8, attachToCandy: true },
      { anchorIndex: 1, segments: 12 },
      { anchorIndex: 2, segments: 8, attachToCandy: true }
    ],
    stars: [
      { x: 0.42, y: 0.28 },
      { x: 0.58, y: 0.28 },
      { x: 0.5, y: 0.40 }
    ],
    obstacles: [
      { x: 0.62, y: 0.58, w: 0.20, h: 0.04, type: 'stone' }
    ],
    winds: []
  },
  {
    id: 6,
    name: 'Ice Slide',
    candy: { x: 0.35, y: 0.24 },
    omNom: { x: 0.65, y: 0.88 },
    anchors: [{ x: 0.35, y: 0.04 }],
    ropes: [{ anchorIndex: 0, segments: 14 }],
    stars: [
      { x: 0.44, y: 0.26 },
      { x: 0.50, y: 0.44 },
      { x: 0.62, y: 0.72 }
    ],
    obstacles: [
      { x: 0.52, y: 0.62, w: 0.28, h: 0.04, type: 'ice' }
    ],
    winds: []
  },
  {
    id: 7,
    name: 'Bubble',
    candy: { x: 0.5, y: 0.24 },
    omNom: { x: 0.5, y: 0.88 },
    anchors: [{ x: 0.5, y: 0.04 }],
    ropes: [{ anchorIndex: 0, segments: 14 }],
    stars: [
      { x: 0.44, y: 0.26 },
      { x: 0.56, y: 0.26 }
    ],
    bubbles: [{ x: 0.5, y: 0.62, radius: 0.08 }],
    obstacles: [],
    winds: []
  },
  {
    id: 8,
    name: 'Bounce Pad',
    candy: { x: 0.5, y: 0.22 },
    omNom: { x: 0.5, y: 0.88 },
    anchors: [
      { x: 0.25, y: 0.04 },
      { x: 0.5, y: 0.02 },
      { x: 0.75, y: 0.04 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 8, attachToCandy: true },
      { anchorIndex: 1, segments: 12 },
      { anchorIndex: 2, segments: 8, attachToCandy: true }
    ],
    stars: [
      { x: 0.42, y: 0.28 },
      { x: 0.58, y: 0.28 },
      { x: 0.38, y: 0.58 }
    ],
    obstacles: [
      { x: 0.38, y: 0.66, w: 0.14, h: 0.04, type: 'bounce' }
    ],
    winds: []
  },
  {
    id: 9,
    name: 'Spike Trap',
    candy: { x: 0.35, y: 0.24 },
    omNom: { x: 0.65, y: 0.88 },
    anchors: [{ x: 0.35, y: 0.04 }],
    ropes: [{ anchorIndex: 0, segments: 14 }],
    stars: [
      { x: 0.44, y: 0.26 },
      { x: 0.50, y: 0.42 },
      { x: 0.58, y: 0.56 }
    ],
    obstacles: [
      { x: 0.42, y: 0.50, w: 0.16, h: 0.03, type: 'wood' },
      { x: 0.72, y: 0.76, w: 0.10, h: 0.025, type: 'spike' }
    ],
    winds: []
  },
  {
    id: 10,
    name: 'World 1 Boss',
    candy: { x: 0.5, y: 0.18 },
    omNom: { x: 0.5, y: 0.88 },
    anchors: [
      { x: 0.2, y: 0.03 },
      { x: 0.8, y: 0.03 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 10, attachToCandy: true },
      { anchorIndex: 1, segments: 10, attachToCandy: true }
    ],
    stars: [
      { x: 0.42, y: 0.26 },
      { x: 0.58, y: 0.26 },
      { x: 0.5, y: 0.38 },
      { x: 0.5, y: 0.52 }
    ],
    obstacles: [],
    bubbles: [{ x: 0.5, y: 0.58, radius: 0.07 }],
    winds: []
  }
];

function seededRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function pickSide(r, id) {
  return (r() + id * 0.17) % 1 < 0.5 ? 0.28 : 0.72;
}

function starCountFor(id) {
  if (id <= 20) return 2 + (id % 2);
  if (id <= 45) return 3;
  if (id <= 70) return 3 + (id % 2);
  return 4;
}

function worldName(id) {
  const world = Math.ceil(id / 10);
  const names = ['Garden', 'Forest', 'Cave', 'Sky', 'Factory', 'Beach', 'Mountain', 'Space', 'Castle', 'Final'];
  return `${names[world - 1] || 'Zone'} ${id % 10 || 10}`;
}

function featureTier(id) {
  if (id < 25) {
    return {
      ice: id >= 12,
      bounce: id >= 22,
      spike: id >= 28,
      wind: id >= 38,
      moving: id >= 52,
      driftBubble: id >= 45,
      multiBubble: id >= 58
    };
  }
  return {
    ice: true,
    bounce: true,
    spike: id >= 28,
    wind: true,
    moving: id >= 40,
    driftBubble: id >= 45,
    multiBubble: id >= 50,
    quadRope: id >= 55,
    dualWind: id >= 65,
    triplePlatform: id >= 75
  };
}

const PLACE = {
  pathT(level, t) {
    return pathMid(level.candy.x, level.omNom.x, t);
  },
  side(level) {
    return level.candy.x <= level.omNom.x ? -1 : 1;
  },
  besideOmNom(level, extra) {
    return level.omNom.x + PLACE.side(level) * (0.14 + (extra || 0));
  },
  spike(level, extra) {
    return obs('spike', PLACE.besideOmNom(level, extra || 0), 0.76, 0.10, 0.025);
  },
  platform(level, type, t, y, w, move) {
    return obs(type, PLACE.pathT(level, t), y, w || 0.16, 0.04, move || null);
  },
  bubble(level, t, y, radius, drift) {
    const x = PLACE.pathT(level, t);
    const d = drift ? Math.sign(level.omNom.x - x) * Math.abs(drift) : 0;
    return bubbleAt(x, y, radius || 0.07, d || undefined);
  },
  wind(level, y, h, strength) {
    const dir = Math.sign(level.omNom.x - level.candy.x) || 1;
    return windZone(PLACE.pathT(level, 0.5), y, 0.20, h || 0.18, dir, strength || 240);
  }
};

function obs(type, x, y, w, h, move) {
  const o = { x, y, w, h, type };
  if (move) o.move = move;
  return o;
}

function windZone(x, y, w, h, dir, strength) {
  return { x, y, w, h, dir, strength };
}

function bubbleAt(x, y, radius, drift) {
  const b = { x, y, radius };
  if (drift) b.drift = drift;
  return b;
}

function verticalStars(cx, count, yStart, yStep) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({ x: cx, y: yStart + i * yStep });
  }
  return stars;
}

function arcStars(candyX, omNomX, count, yBase) {
  const stars = [];
  const base = yBase || 0.26;
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    stars.push({
      x: candyX + (omNomX - candyX) * t,
      y: base + t * 0.34
    });
  }
  return stars;
}

function zigzagStars(candyX, omNomX, count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    stars.push({
      x: candyX + (omNomX - candyX) * t + (i % 2 === 0 ? -0.06 : 0.06),
      y: 0.28 + t * 0.38
    });
  }
  return stars;
}

function starHitsObstacle(star, o, margin) {
  const r = rectNorm(o);
  const pad = margin ?? 0.034;
  const cx = clamp(star.x, r.left, r.right);
  const cy = clamp(star.y, r.top, r.bottom);
  const dx = star.x - cx;
  const dy = star.y - cy;
  return dx * dx + dy * dy < pad * pad;
}

function nudgeStarFromObstacle(star, o) {
  const r = rectNorm(o);
  const pad = 0.038;
  star.y = r.top - pad;
  if (starHitsObstacle(star, o, pad)) {
    const side = star.x <= o.x ? -1 : 1;
    star.x = o.x + side * (o.w / 2 + pad + 0.03);
  }
  if (starHitsObstacle(star, o, pad)) {
    star.x = clamp(star.x, 0.12, 0.88);
    star.y = clamp(r.top - pad - 0.04, 0.22, 0.72);
  }
}

function resolveStarObstacleOverlaps(level) {
  const stars = level.stars || [];
  const obstacles = level.obstacles || [];
  if (!stars.length || !obstacles.length) return;

  for (let pass = 0; pass < 8; pass++) {
    let any = false;
    stars.forEach((star) => {
      obstacles.forEach((o) => {
        if (starHitsObstacle(star, o)) {
          any = true;
          nudgeStarFromObstacle(star, o);
        }
      });
      star.x = clamp(star.x, 0.12, 0.88);
      star.y = clamp(star.y, level.candy.y + 0.04, level.omNom.y - 0.12);
    });
    if (!any) break;
  }
}

function pathStars(candyX, omNomX, count, yStart, yStep) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    stars.push({
      x: candyX + (omNomX - candyX) * t,
      y: yStart + i * yStep
    });
  }
  return stars;
}

function pathMid(candyX, omNomX, t) {
  return candyX + (omNomX - candyX) * t;
}

function layoutForTemplate(template, r, id) {
  if (template === 0) {
    return {
      candyX: 0.5,
      omNomX: 0.5 + (id % 2 === 0 ? 0.08 : -0.08),
      centered: true
    };
  }
  const centeredTemplates = new Set([3, 5, 6, 9, 12, 14, 15, 17, 19]);
  if (centeredTemplates.has(template)) {
    return { candyX: 0.5, omNomX: 0.5, centered: true };
  }
  const candyX = pickSide(r, id);
  const omNomX = candyX < 0.5 ? 0.72 : 0.28;
  return { candyX, omNomX, centered: false };
}

function rectNorm(o) {
  return {
    left: o.x - o.w / 2,
    right: o.x + o.w / 2,
    top: o.y - o.h / 2,
    bottom: o.y + o.h / 2
  };
}

function lineIntersectsRect(x1, y1, x2, y2, o) {
  const r = rectNorm(o);
  const samples = 12;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) return true;
  }
  return false;
}

function spikeBlocksOmNom(spike, omNomX) {
  const r = rectNorm(spike);
  const mouthLeft = omNomX - 0.09;
  const mouthRight = omNomX + 0.09;
  return r.bottom > 0.72 && r.right > mouthLeft && r.left < mouthRight;
}

/** Platform types that act as shelves / gates. */
const PLATFORM_TYPES = new Set(['wood', 'ice', 'stone', 'bounce']);

/** Horizontal half-width of the drop gate above Om Nom's mouth. */
const OM_NOM_HEAD_GATE_HALF = 0.10;

/** Y band (normalized) where a platform over Om Nom blocks the candy drop. */
const HEAD_GATE_Y_MIN = 0.58;
const HEAD_GATE_Y_MAX = 0.84;

function isPlatformObstacle(o) {
  return PLATFORM_TYPES.has(o.type);
}

function minMoveRangeToClearHead(o, omNomX) {
  return OM_NOM_HEAD_GATE_HALF + o.w / 2 + 0.025;
}

function moveClearsHeadGate(o, omNomX) {
  if (!o.move) return false;
  return o.move.range >= minMoveRangeToClearHead(o, omNomX);
}

/**
 * Design rule: a static platform must not permanently block the gate above Om Nom.
 * If it overlaps that gate, shift it sideways OR give it enough horizontal oscillation
 * so the candy can pass through at some point in the cycle.
 */
function platformBlocksOmNomHead(o, omNomX, omNomY) {
  if (!isPlatformObstacle(o)) return false;

  const r = rectNorm(o);
  const gateLeft = omNomX - OM_NOM_HEAD_GATE_HALF;
  const gateRight = omNomX + OM_NOM_HEAD_GATE_HALF;
  const overlapsGateX = r.right > gateLeft && r.left < gateRight;
  const inHeadBandY = r.bottom > HEAD_GATE_Y_MIN && r.top < HEAD_GATE_Y_MAX;

  if (!overlapsGateX || !inHeadBandY) return false;
  if (moveClearsHeadGate(o, omNomX)) return false;
  return true;
}

/** Platform blocking the vertical drop line when candy and Om Nom share the same x. */
function platformBlocksVerticalDrop(o, candyX, candyY, omNomX, omNomY) {
  if (!isPlatformObstacle(o)) return false;
  if (Math.abs(candyX - omNomX) >= 0.07) return false;
  const r = rectNorm(o);
  if (omNomX < r.left || omNomX > r.right) return false;
  return r.bottom > candyY + 0.06 && r.top < omNomY - 0.04 && !moveClearsHeadGate(o, omNomX);
}

function enforceHeadGateRule(level, o) {
  const ox = level.omNom.x;
  const oy = level.omNom.y;
  const cx = level.candy.x;
  const cy = level.candy.y;
  const blocksHead = platformBlocksOmNomHead(o, ox, oy);
  const blocksDrop = platformBlocksVerticalDrop(o, cx, cy, ox, oy);
  if (!blocksHead && !blocksDrop) return o;

  const side = PLACE.side(level);

  if (o.move) {
    o.move.range = Math.max(o.move.range || 0, minMoveRangeToClearHead(o, ox));
    o.move.speed = Math.max(o.move.speed || 0, 1.05);
    o.move.phase = o.move.phase ?? (o.x + o.y) * 10;
    if (!platformBlocksOmNomHead(o, ox, oy) && !platformBlocksVerticalDrop(o, cx, cy, ox, oy)) return o;
  }

  o.x = ox + side * (OM_NOM_HEAD_GATE_HALF + o.w / 2 + 0.05);
  delete o.move;

  if (platformBlocksOmNomHead(o, ox, oy) || platformBlocksVerticalDrop(o, cx, cy, ox, oy)) {
    o.x = ox;
    o.move = {
      range: minMoveRangeToClearHead(o, ox),
      speed: 1.15,
      phase: (level.id || 0) * 0.7
    };
  }

  return o;
}

function rectsOverlap(a, b, margin) {
  const m = margin ?? 0.012;
  const ra = rectNorm(a);
  const rb = rectNorm(b);
  return (
    ra.left < rb.right + m &&
    ra.right > rb.left - m &&
    ra.top < rb.bottom + m &&
    ra.bottom > rb.top - m
  );
}

function separateObstaclePair(a, b, level) {
  const ra = rectNorm(a);
  const rb = rectNorm(b);
  const overlapX = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
  const overlapY = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
  if (overlapX <= 0 || overlapY <= 0) return;

  const ox = level.omNom.x;

  if (overlapY <= overlapX) {
    const push = overlapY / 2 + 0.014;
    if (a.y <= b.y) {
      a.y -= push;
      b.y += push;
    } else {
      a.y += push;
      b.y -= push;
    }
  } else {
    const push = overlapX / 2 + 0.016;
    if ((a.x + b.x) / 2 < ox) {
      a.x -= push;
      b.x += push;
    } else {
      a.x += push;
      b.x -= push;
    }
  }

  a.x = clamp(a.x, 0.14, 0.86);
  b.x = clamp(b.x, 0.14, 0.86);
  a.y = clamp(a.y, 0.46, 0.78);
  b.y = clamp(b.y, 0.46, 0.78);
}

function resolveObstacleOverlaps(level) {
  const obs = level.obstacles;
  if (!obs || obs.length < 2) return;

  for (let pass = 0; pass < 14; pass++) {
    let any = false;
    for (let i = 0; i < obs.length; i++) {
      for (let j = i + 1; j < obs.length; j++) {
        if (rectsOverlap(obs[i], obs[j])) {
          any = true;
          separateObstaclePair(obs[i], obs[j], level);
        }
      }
    }
    obs.forEach((o) => enforceHeadGateRule(level, o));
    if (!any) break;
  }
}

function syncPrimaryAnchor(level) {
  if (level.ropes.length === 1 && level.anchors[0]) {
    level.anchors[0].x = level.candy.x;
    level.anchors[0].y = Math.min(level.anchors[0].y, 0.05);
  }
}

function validateLevel(level) {
  const issues = [];
  const cx = level.candy.x;
  const cy = level.candy.y;
  const ox = level.omNom.x;
  const oy = level.omNom.y;

  if (level.ropes.length === 1 && level.anchors[0]) {
    if (Math.abs(level.anchors[0].x - cx) > 0.03) {
      issues.push({ type: 'anchor_mismatch' });
    }
  }

  (level.obstacles || []).forEach((o, i) => {
    if (o.type === 'spike') {
      if (spikeBlocksOmNom(o, ox)) issues.push({ type: 'spike_blocks_omnom', index: i });
      if (lineIntersectsRect(cx, cy, ox, oy, o)) issues.push({ type: 'spike_on_path', index: i });
    }
    if (isPlatformObstacle(o) && (platformBlocksOmNomHead(o, ox, oy) || platformBlocksVerticalDrop(o, cx, cy, ox, oy))) {
      issues.push({ type: 'platform_blocks_head', index: i });
    }
    if (o.y < cy + 0.06 && o.type !== 'spike') {
      issues.push({ type: 'obstacle_too_high', index: i });
    }
  });

  (level.bubbles || []).forEach((b, i) => {
    const minX = Math.min(cx, ox) + 0.04;
    const maxX = Math.max(cx, ox) - 0.04;
    if (b.x < minX || b.x > maxX) issues.push({ type: 'bubble_off_path', index: i });
    if (b.y < 0.48 || b.y > 0.68) issues.push({ type: 'bubble_bad_y', index: i });
  });

  (level.winds || []).forEach((w, i) => {
    const wantDir = Math.sign(ox - cx) || 1;
    if ((w.dir >= 0 ? 1 : -1) !== wantDir) issues.push({ type: 'wind_wrong_dir', index: i });
  });

  const obstacles = level.obstacles || [];
  for (let i = 0; i < obstacles.length; i++) {
    for (let j = i + 1; j < obstacles.length; j++) {
      if (rectsOverlap(obstacles[i], obstacles[j])) {
        issues.push({ type: 'obstacles_overlap', indexA: i, indexB: j });
      }
    }
  }

  return issues;
}

function fixValidationIssues(level, issues) {
  const cx = level.candy.x;
  const ox = level.omNom.x;
  const oy = level.omNom.y;
  const toward = (t) => pathMid(cx, ox, t);
  const side = PLACE.side(level);

  issues.forEach((issue) => {
    if (issue.type === 'anchor_mismatch') syncPrimaryAnchor(level);
    if (issue.type === 'spike_blocks_omnom' || issue.type === 'spike_on_path') {
      const o = level.obstacles[issue.index];
      if (o) o.x = PLACE.besideOmNom(level, 0.02);
    }
    if (issue.type === 'platform_blocks_head') {
      const o = level.obstacles[issue.index];
      if (o) enforceHeadGateRule(level, o);
    }
    if (issue.type === 'obstacles_overlap') {
      resolveObstacleOverlaps(level);
    }
    if (issue.type === 'obstacle_too_high') {
      const o = level.obstacles[issue.index];
      if (o) o.y = clamp(o.y, 0.48, 0.72);
    }
    if (issue.type === 'bubble_off_path' || issue.type === 'bubble_bad_y') {
      const b = level.bubbles[issue.index];
      if (b) {
        b.x = toward(0.52);
        b.y = clamp(b.y, 0.52, 0.64);
      }
    }
    if (issue.type === 'wind_wrong_dir') {
      const w = level.winds[issue.index];
      if (w) w.dir = Math.sign(ox - cx) || 1;
    }
  });
}

function applyLevelFixes(level) {
  switch (level.id) {
    case 12:
      level.obstacles = [{ x: 0.55, y: 0.60, w: 0.18, h: 0.04, type: 'ice' }];
      break;
    case 14:
      level.obstacles = [];
      level.bubbles = [{ x: 0.5, y: 0.56, radius: 0.065 }];
      break;
    case 19:
      level.obstacles = [
        { x: 0.36, y: 0.54, w: 0.12, h: 0.03, type: 'stone' },
        { x: 0.64, y: 0.60, w: 0.12, h: 0.04, type: 'ice' }
      ];
      level.winds = [];
      level.bubbles = [];
      break;
    case 20:
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [{ x: 0.5, y: 0.03 }];
      level.ropes = [{ anchorIndex: 0, segments: 14 }];
      level.obstacles = [{ x: 0.58, y: 0.64, w: 0.16, h: 0.04, type: 'ice' }];
      level.bubbles = [];
      level.winds = [];
      break;
    case 25:
      level.obstacles = [
        { x: 0.40, y: 0.52, w: 0.12, h: 0.03, type: 'wood' },
        { x: 0.60, y: 0.58, w: 0.14, h: 0.04, type: 'ice' }
      ];
      break;
    case 29:
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.obstacles = [
        { x: 0.36, y: 0.52, w: 0.12, h: 0.03, type: 'stone' },
        { x: 0.64, y: 0.58, w: 0.12, h: 0.04, type: 'ice' },
        { x: 0.38, y: 0.66, w: 0.14, h: 0.04, type: 'bounce' }
      ];
      level.bubbles = [{ x: 0.5, y: 0.56, radius: 0.065 }];
      level.winds = [{ x: 0.5, y: 0.40, w: 0.20, h: 0.14, dir: 1, strength: 220 }];
      break;
    case 34:
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [
        { x: 0.38, y: 0.04 },
        { x: 0.62, y: 0.04 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 10, attachToCandy: true },
        { anchorIndex: 1, segments: 10, attachToCandy: true }
      ];
      level.stars = pathStars(0.5, 0.5, 3, 0.28, 0.08);
      level.obstacles = [
        { x: 0.36, y: 0.54, w: 0.12, h: 0.03, type: 'wood' },
        { x: 0.64, y: 0.60, w: 0.12, h: 0.04, type: 'ice' }
      ];
      level.bubbles = [];
      level.winds = [];
      break;
    case 40:
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.name = 'World 4 Boss';
      level.anchors = [
        { x: 0.32, y: 0.04 },
        { x: 0.58, y: 0.05 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 11, attachToCandy: true },
        { anchorIndex: 1, segments: 11, attachToCandy: true }
      ];
      level.stars = [
        { x: 0.42, y: 0.27 },
        { x: 0.58, y: 0.27 },
        { x: 0.5, y: 0.42 },
        { x: 0.5, y: 0.56 }
      ];
      level.obstacles = [
        { x: 0.36, y: 0.54, w: 0.12, h: 0.03, type: 'stone' },
        { x: 0.64, y: 0.60, w: 0.12, h: 0.04, type: 'ice' },
        { x: 0.38, y: 0.66, w: 0.14, h: 0.04, type: 'bounce' }
      ];
      level.bubbles = [{ x: 0.5, y: 0.54, radius: 0.065 }];
      level.winds = [{ x: 0.5, y: 0.40, w: 0.18, h: 0.14, dir: 1, strength: 220 }];
      break;
    case 45:
      level.candy.x = 0.28;
      level.omNom.x = 0.72;
      level.anchors = [{ x: 0.28, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: 13 }];
      level.stars = pathStars(0.28, 0.72, 3, 0.28, 0.08);
      level.obstacles = [
        { x: 0.44, y: 0.52, w: 0.14, h: 0.03, type: 'wood' },
        { x: 0.80, y: 0.76, w: 0.10, h: 0.025, type: 'spike' }
      ];
      level.bubbles = [];
      level.winds = [];
      break;
    case 48:
      level.candy.x = 0.58;
      level.omNom.x = 0.42;
      level.anchors = [{ x: 0.58, y: 0.05 }];
      level.ropes = [{ anchorIndex: 0, segments: 11 }];
      level.stars = pathStars(0.58, 0.42, 3, 0.24, 0.07);
      level.obstacles = [];
      level.bubbles = [];
      level.winds = [];
      break;
    case 50:
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.name = 'World 5 Boss';
      level.anchors = [
        { x: 0.35, y: 0.04 },
        { x: 0.55, y: 0.05 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 12 },
        { anchorIndex: 1, segments: 10, attachToCandy: true }
      ];
      level.stars = [
        { x: 0.42, y: 0.27 },
        { x: 0.58, y: 0.27 },
        { x: 0.5, y: 0.42 },
        { x: 0.5, y: 0.56 }
      ];
      level.obstacles = [
        { x: 0.36, y: 0.52, w: 0.12, h: 0.03, type: 'wood', move: { range: 0.05, speed: 1.1 } },
        { x: 0.64, y: 0.62, w: 0.14, h: 0.04, type: 'bounce' }
      ];
      level.bubbles = [
        { x: 0.5, y: 0.54, radius: 0.065 },
        { x: 0.56, y: 0.60, radius: 0.06, drift: 0.06 }
      ];
      level.winds = [{ x: 0.5, y: 0.38, w: 0.18, h: 0.14, dir: 1, strength: 210 }];
      break;
    case 30:
      level.stars = pathStars(0.5, 0.5, 3, 0.28, 0.08);
      break;
    case 39:
      level.stars = [
        { x: 0.46, y: 0.28 },
        { x: 0.54, y: 0.36 },
        { x: 0.48, y: 0.44 }
      ];
      break;
    case 54:
      level.candy.x = 0.28;
      level.omNom.x = 0.72;
      level.anchors = [{ x: 0.28, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: 14 }];
      level.obstacles = [{ x: 0.64, y: 0.62, w: 0.14, h: 0.04, type: 'bounce' }];
      level.bubbles = [{ x: 0.48, y: 0.56, radius: 0.07 }];
      level.winds = [{ x: 0.52, y: 0.44, w: 0.18, h: 0.16, dir: 1, strength: 230 }];
      break;
    case 55:
      level.candy.x = 0.35;
      level.omNom.x = 0.65;
      level.anchors = [
        { x: 0.35, y: 0.04 },
        { x: 0.55, y: 0.05 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 12 },
        { anchorIndex: 1, segments: 10, attachToCandy: true }
      ];
      level.obstacles = [
        { x: 0.40, y: 0.52, w: 0.12, h: 0.03, type: 'wood' },
        { x: 0.60, y: 0.58, w: 0.14, h: 0.04, type: 'ice' }
      ];
      level.bubbles = [];
      level.winds = [];
      break;
    case 57:
      level.candy.x = 0.65;
      level.omNom.x = 0.35;
      level.anchors = [{ x: 0.65, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: 14 }];
      level.obstacles = [
        { x: 0.52, y: 0.52, w: 0.12, h: 0.03, type: 'wood', move: { range: 0.05, speed: 1.1 } },
        { x: 0.68, y: 0.58, w: 0.12, h: 0.04, type: 'ice' },
        { x: 0.80, y: 0.76, w: 0.10, h: 0.025, type: 'spike' }
      ];
      level.bubbles = [];
      level.winds = [];
      break;
    case 60:
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.name = 'World 6 Boss';
      level.anchors = [
        { x: 0.30, y: 0.03 },
        { x: 0.70, y: 0.03 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 11, attachToCandy: true },
        { anchorIndex: 1, segments: 11, attachToCandy: true }
      ];
      level.stars = [
        { x: 0.42, y: 0.27 },
        { x: 0.58, y: 0.27 },
        { x: 0.5, y: 0.42 },
        { x: 0.5, y: 0.56 }
      ];
      level.obstacles = [
        { x: 0.36, y: 0.54, w: 0.12, h: 0.03, type: 'stone' },
        { x: 0.64, y: 0.60, w: 0.12, h: 0.04, type: 'ice' },
        { x: 0.38, y: 0.66, w: 0.14, h: 0.04, type: 'bounce' }
      ];
      level.bubbles = [{ x: 0.5, y: 0.54, radius: 0.065 }];
      level.winds = [{ x: 0.5, y: 0.40, w: 0.18, h: 0.14, dir: 1, strength: 220 }];
      break;
    case 75:
      level.candy.x = 0.72;
      level.omNom.x = 0.28;
      level.anchors = [{ x: 0.72, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: 14 }];
      level.stars = pathStars(0.72, 0.28, 4, 0.28, 0.08);
      level.obstacles = [
        { x: 0.50, y: 0.52, w: 0.12, h: 0.03, type: 'wood' },
        { x: 0.62, y: 0.58, w: 0.12, h: 0.04, type: 'stone' },
        { x: 0.12, y: 0.76, w: 0.10, h: 0.025, type: 'spike' },
        { x: 0.20, y: 0.76, w: 0.10, h: 0.025, type: 'spike' }
      ];
      level.bubbles = [];
      level.winds = [];
      break;
    case 79:
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [{ x: 0.5, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: 15 }];
      level.stars = [
        { x: 0.44, y: 0.26 },
        { x: 0.56, y: 0.32 },
        { x: 0.48, y: 0.38 },
        { x: 0.52, y: 0.42 }
      ];
      level.obstacles = [
        { x: 0.36, y: 0.56, w: 0.12, h: 0.04, type: 'ice' },
        { x: 0.64, y: 0.64, w: 0.14, h: 0.04, type: 'bounce' }
      ];
      level.bubbles = [{ x: 0.50, y: 0.50, radius: 0.065 }];
      level.winds = [{ x: 0.5, y: 0.36, w: 0.18, h: 0.12, dir: 1, strength: 210 }];
      break;
    case 69:
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [{ x: 0.5, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: 14 }];
      level.obstacles = [
        { x: 0.36, y: 0.52, w: 0.12, h: 0.03, type: 'wood' },
        { x: 0.64, y: 0.58, w: 0.12, h: 0.04, type: 'ice' },
        { x: 0.38, y: 0.66, w: 0.14, h: 0.04, type: 'bounce' }
      ];
      level.bubbles = [];
      level.winds = [];
      break;
    case 70:
      level.anchors = [{ x: level.candy.x, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: 13 }];
      break;
    default:
      break;
  }
}

function finalizeLevel(level) {
  applyLevelFixes(level);
  syncPrimaryAnchor(level);
  for (let pass = 0; pass < 8; pass++) {
    sanitizeLevel(level);
    const issues = validateLevel(level);
    if (!issues.length) break;
    fixValidationIssues(level, issues);
  }
}

function sanitizeLevel(level) {
  const cx = level.candy.x;
  const cy = level.candy.y;
  const ox = level.omNom.x;
  const oy = level.omNom.y;
  const toward = (t) => pathMid(cx, ox, t);
  const side = cx <= ox ? -1 : 1;

  level.winds = (level.winds || []).map((w) => {
    const wantDir = Math.sign(ox - cx) || 1;
    return { ...w, dir: wantDir };
  });

  level.bubbles = (level.bubbles || []).map((b) => {
    const fixed = { ...b };
    fixed.x = clamp(fixed.x, Math.min(cx, ox) + 0.06, Math.max(cx, ox) - 0.06);
    if (Math.abs(fixed.x - toward(0.5)) > 0.14) fixed.x = toward(0.52);
    fixed.y = clamp(fixed.y, 0.50, 0.66);
    if (fixed.drift) {
      const want = Math.sign(ox - fixed.x) || 1;
      fixed.drift = Math.min(Math.abs(fixed.drift), 0.12) * want;
    }
    return fixed;
  });

  level.obstacles = (level.obstacles || []).map((o) => {
    const fixed = { ...o };
    if (fixed.type === 'spike') {
      fixed.w = Math.min(fixed.w, 0.11);
      fixed.h = Math.min(fixed.h, 0.025);
      fixed.y = clamp(fixed.y, 0.70, 0.78);
      if (spikeBlocksOmNom(fixed, ox) || lineIntersectsRect(cx, cy, ox, oy, fixed)) {
        fixed.x = toward(0.38) + side * 0.13;
      }
      if (spikeBlocksOmNom(fixed, ox)) {
        fixed.x = ox + side * 0.16;
      }
    } else if (fixed.type === 'ice') {
      fixed.y = clamp(fixed.y, 0.56, 0.66);
      fixed.w = clamp(fixed.w, 0.14, 0.26);
      const r = rectNorm(fixed);
      const alignedDrop = Math.abs(cx - ox) < 0.07;
      const blocksDrop = cx >= r.left && cx <= r.right;
      if (alignedDrop && blocksDrop) {
        fixed.x = cx + side * 0.10;
      } else if (!alignedDrop) {
        fixed.x = toward(0.52);
      }
    } else if (fixed.type === 'bounce') {
      const onDropLine = Math.abs(cx - ox) < 0.07;
      const r = rectNorm(fixed);
      const coversDrop = cx >= r.left - 0.01 && cx <= r.right + 0.01;
      if (onDropLine && coversDrop) {
        fixed.x = toward(0.32) + side * 0.04;
      } else {
        fixed.x = toward(0.62);
      }
      fixed.y = clamp(fixed.y, 0.64, 0.72);
      fixed.w = clamp(fixed.w, 0.12, 0.18);
    } else if (fixed.type === 'wood' || fixed.type === 'stone') {
      if (lineIntersectsRect(cx, cy, ox, oy, fixed) && fixed.y > 0.58) {
        fixed.x = toward(0.48) + side * 0.10;
      }
      fixed.y = clamp(fixed.y, 0.46, 0.62);
    }
    if (fixed.move) {
      const minClear = minMoveRangeToClearHead(fixed, ox);
      const r = rectNorm(fixed);
      const nearHeadGate =
        r.bottom > HEAD_GATE_Y_MIN &&
        r.top < HEAD_GATE_Y_MAX &&
        r.right > ox - OM_NOM_HEAD_GATE_HALF &&
        r.left < ox + OM_NOM_HEAD_GATE_HALF;
      if (nearHeadGate) {
        fixed.move.range = clamp(Math.max(fixed.move.range || 0, minClear), minClear, 0.12);
        fixed.move.speed = Math.max(fixed.move.speed || 0, 1.05);
      } else {
        fixed.move.range = Math.min(fixed.move.range || 0.05, 0.08);
      }
    }
    return enforceHeadGateRule(level, fixed);
  });

  level.obstacles.forEach((o) => enforceHeadGateRule(level, o));
  resolveObstacleOverlaps(level);
  level.obstacles.forEach((o) => enforceHeadGateRule(level, o));

  level.stars = (level.stars || []).map((s) => {
    const star = { ...s };
    star.x = clamp(star.x, 0.12, 0.88);
    star.y = clamp(star.y, cy + 0.04, oy - 0.12);
    return star;
  });
  resolveStarObstacleOverlaps(level);

  level.omNom.y = 0.88;
  level.candy.y = clamp(level.candy.y, 0.18, 0.26);
}

function createLevelShell(id, layout) {
  const tier = Math.floor((id - 1) / 20);
  return {
    id,
    name: worldName(id),
    candy: { x: layout.candyX, y: 0.20 + (id % 4) * 0.015 },
    omNom: { x: layout.omNomX, y: 0.88 },
    anchors: [],
    ropes: [],
    stars: [],
    obstacles: [],
    bubbles: [],
    winds: []
  };
}

function applyBossTweaks(level, id) {
  if (id % 10 !== 0 || id <= 10) return;
  level.name = `World ${id / 10} Boss`;
  level.candy.x = 0.5;
  level.omNom.x = 0.5;
  level.stars = [
    { x: 0.42, y: 0.27 },
    { x: 0.58, y: 0.27 },
    { x: 0.5, y: 0.42 },
    { x: 0.5, y: 0.56 }
  ];
  const ft = featureTier(id);
  if (ft.bounce && !level.obstacles.some((o) => o.type === 'bounce')) {
    level.obstacles.push(obs('bounce', 0.38, 0.66, 0.14, 0.04));
  }
  if (ft.wind && !level.winds.length) {
    level.winds.push(PLACE.wind(level, 0.42, 0.20, 250));
  }
  if (ft.multiBubble && level.bubbles.length < 2) {
    level.bubbles.push(PLACE.bubble(level, 0.56, 0.56, 0.065, 0.06));
  }
  if (id >= 25 && ft.spike && level.obstacles.filter((o) => o.type === 'spike').length < 2) {
    level.obstacles.push(PLACE.spike(level, 0.04));
  }
}

function layoutForAdvanced(id, r) {
  const layouts = [
    { candyX: 0.5, omNomX: 0.5 },
    { candyX: 0.28, omNomX: 0.72 },
    { candyX: 0.72, omNomX: 0.28 },
    { candyX: 0.5, omNomX: 0.58 },
    { candyX: 0.5, omNomX: 0.42 },
    { candyX: 0.35, omNomX: 0.65 },
    { candyX: 0.65, omNomX: 0.35 }
  ];
  return layouts[(id * 3 + Math.floor(r() * 5)) % layouts.length];
}

function generateAdvancedLevel(id) {
  const r = seededRand(id * 7919 + 137);
  const template = id % 30;
  const tier = Math.floor((id - 1) / 20);
  const ft = featureTier(id);
  const starsN = starCountFor(id);
  const layout = layoutForAdvanced(id, r);
  const segBase = 11 + (id % 5) + tier;
  const cx = layout.candyX;
  const ox = layout.omNomX;
  const mid = (a, b, t) => a + (b - a) * t;
  const level = createLevelShell(id, layout);

  switch (template) {
    case 0: {
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [{ x: 0.5, y: 0.03 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase + 1 }];
      level.stars = pathStars(0.5, 0.5, starsN, 0.28, 0.08);
      if (ft.ice) {
        level.obstacles.push(obs('ice', 0.58, 0.62, 0.16, 0.04));
      }
      if (ft.bounce) {
        level.obstacles.push(obs('bounce', 0.38, 0.66, 0.14, 0.04));
      }
      break;
    }
    case 1: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = zigzagStars(cx, ox, starsN);
      level.winds.push(PLACE.wind(level, 0.44, 0.22, 250));
      if (ft.spike) level.obstacles.push(PLACE.spike(level));
      break;
    }
    case 2: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = verticalStars(PLACE.pathT(level, 0.5), starsN, 0.32, 0.11);
      level.bubbles.push(PLACE.bubble(level, 0.48, 0.54, 0.065));
      if (ft.multiBubble) level.bubbles.push(PLACE.bubble(level, 0.58, 0.62, 0.06, 0.06));
      break;
    }
    case 3: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(cx, ox, starsN);
      level.obstacles.push(PLACE.platform(level, 'ice', 0.48, 0.58, 0.20));
      level.obstacles.push(PLACE.platform(level, 'bounce', 0.66, 0.70, 0.16));
      break;
    }
    case 4: {
      const spread = 0.15 + tier * 0.01;
      level.anchors = [
        { x: cx, y: 0.04 },
        { x: mid(cx, ox, 0.45), y: 0.05 },
        { x: mid(cx, ox, 0.75), y: 0.05 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: segBase - 1 },
        { anchorIndex: 1, segments: segBase - 2, attachToCandy: true },
        { anchorIndex: 2, segments: segBase - 3, attachToCandy: true }
      ];
      level.stars = zigzagStars(cx, ox, starsN);
      level.obstacles.push(PLACE.platform(level, 'stone', 0.52, 0.54, 0.16));
      break;
    }
    case 5: {
      const off = 0.17 + r() * 0.04;
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [
        { x: 0.5 - off, y: 0.03 },
        { x: 0.5 + off, y: 0.03 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: segBase - 1, attachToCandy: true },
        { anchorIndex: 1, segments: segBase - 1, attachToCandy: true }
      ];
      level.stars = [
        { x: 0.5 - off * 0.7, y: 0.28 },
        { x: 0.5 + off * 0.7, y: 0.28 },
        { x: 0.5, y: 0.44 }
      ].slice(0, starsN);
      level.obstacles.push(PLACE.platform(level, 'bounce', 0.62, 0.68, 0.18));
      break;
    }
    case 6: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(cx, ox, starsN);
      level.obstacles.push(PLACE.platform(level, 'wood', 0.50, 0.56, 0.18, ft.moving ? { range: 0.05, speed: 1.2 } : null));
      if (ft.spike) {
        level.obstacles.push(PLACE.spike(level));
        level.obstacles.push(PLACE.spike(level, -0.06));
      }
      break;
    }
    case 7: {
      if (ft.quadRope) {
        const s = 0.13;
        level.candy.x = 0.5;
        level.omNom.x = 0.5;
        level.anchors = [
          { x: 0.5 - s, y: 0.03 },
          { x: 0.5 + s, y: 0.03 },
          { x: 0.5 - s * 0.5, y: 0.05 },
          { x: 0.5 + s * 0.5, y: 0.05 }
        ];
        level.ropes = [
          { anchorIndex: 0, segments: 7, attachToCandy: true },
          { anchorIndex: 1, segments: 7, attachToCandy: true },
          { anchorIndex: 2, segments: segBase - 2 },
          { anchorIndex: 3, segments: segBase - 2, attachToCandy: true }
        ];
      } else {
        const spread = 0.16;
        level.candy.x = 0.5;
        level.omNom.x = 0.5;
        level.anchors = [
          { x: 0.5 - spread, y: 0.03 },
          { x: 0.5, y: 0.02 },
          { x: 0.5 + spread, y: 0.03 }
        ];
        level.ropes = [
          { anchorIndex: 0, segments: 8, attachToCandy: true },
          { anchorIndex: 1, segments: segBase },
          { anchorIndex: 2, segments: 8, attachToCandy: true }
        ];
      }
      level.stars = verticalStars(0.5, starsN, 0.30, 0.10);
      break;
    }
    case 8: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase + 1 }];
      level.stars = arcStars(cx, ox, starsN);
      level.winds.push(PLACE.wind(level, 0.40, 0.18, 240));
      level.bubbles.push(PLACE.bubble(level, 0.54, 0.56, 0.07, ft.driftBubble ? 0.06 : 0));
      break;
    }
    case 9: {
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [{ x: 0.5, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = [
        { x: 0.46, y: 0.28 },
        { x: 0.54, y: 0.36 },
        { x: 0.48, y: 0.44 }
      ].slice(0, starsN);
      level.obstacles.push(obs('wood', 0.36, 0.52, 0.12, 0.03));
      level.obstacles.push(obs('ice', 0.64, 0.58, 0.12, 0.04));
      level.obstacles.push(obs('bounce', 0.38, 0.66, 0.14, 0.04));
      break;
    }
    case 10: {
      level.anchors = [
        { x: cx, y: 0.04 },
        { x: mid(cx, ox, 0.6), y: 0.05 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: segBase },
        { anchorIndex: 1, segments: segBase - 2, attachToCandy: true }
      ];
      level.stars = zigzagStars(cx, ox, starsN);
      level.obstacles.push(PLACE.platform(level, 'stone', 0.46, 0.52, 0.14));
      if (ft.wind) level.winds.push(PLACE.wind(level, 0.46, 0.16, 230));
      break;
    }
    case 11: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(cx, ox, starsN);
      level.obstacles.push(PLACE.platform(level, 'ice', 0.48, 0.58, 0.26));
      if (ft.spike) level.obstacles.push(PLACE.spike(level));
      break;
    }
    case 12: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = [
        { x: PLACE.pathT(level, 0.35), y: 0.30 },
        { x: PLACE.pathT(level, 0.65), y: 0.48 }
      ].slice(0, starsN);
      level.bubbles.push(PLACE.bubble(level, 0.50, 0.55, 0.075, ft.driftBubble ? 0.08 : 0));
      break;
    }
    case 13: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(cx, ox, starsN);
      level.winds.push(PLACE.wind(level, 0.38, 0.14, 220));
      if (ft.dualWind) level.winds.push(PLACE.wind(level, 0.52, 0.14, 200));
      break;
    }
    case 14: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(cx, ox, starsN);
      level.obstacles.push(PLACE.platform(level, 'bounce', 0.62, 0.68, 0.16, ft.moving ? { range: 0.04, speed: 1.1 } : null));
      break;
    }
    case 15: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = pathStars(cx, ox, starsN, 0.28, 0.08);
      level.obstacles.push(obs('wood', cx <= ox ? 0.58 : 0.42, 0.52, 0.12, 0.03));
      level.obstacles.push(PLACE.spike(level, 0));
      if (ft.spike) level.obstacles.push(PLACE.spike(level, 0.06));
      break;
    }
    case 16: {
      const spread = 0.18;
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [
        { x: 0.5 - spread, y: 0.03 },
        { x: 0.5 + spread, y: 0.03 },
        { x: 0.5, y: 0.02 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 7, attachToCandy: true },
        { anchorIndex: 1, segments: 7, attachToCandy: true },
        { anchorIndex: 2, segments: segBase - 1 }
      ];
      level.stars = [
        { x: 0.5 - spread * 0.8, y: 0.28 },
        { x: 0.5 + spread * 0.8, y: 0.28 },
        { x: 0.5, y: 0.42 }
      ].slice(0, starsN);
      level.bubbles.push(PLACE.bubble(level, 0.5, 0.58, 0.07));
      break;
    }
    case 17: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(cx, ox, starsN);
      level.bubbles.push(PLACE.bubble(level, 0.50, 0.54, 0.07));
      level.obstacles.push(PLACE.platform(level, 'bounce', 0.64, 0.70, 0.16));
      break;
    }
    case 18: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = zigzagStars(cx, ox, starsN);
      level.obstacles.push(PLACE.platform(level, 'stone', 0.40, 0.50, 0.14));
      level.obstacles.push(PLACE.platform(level, 'ice', 0.58, 0.58, 0.16));
      if (ft.spike) level.obstacles.push(PLACE.spike(level));
      break;
    }
    case 19: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase + 2 }];
      level.stars = pathStars(cx, ox, starsN, 0.26, 0.07);
      level.winds.push(PLACE.wind(level, 0.36, 0.12, 210));
      level.obstacles.push(obs('ice', cx <= ox ? 0.36 : 0.64, 0.56, 0.12, 0.04));
      level.obstacles.push(obs('bounce', cx <= ox ? 0.64 : 0.36, 0.64, 0.14, 0.04));
      if (ft.multiBubble) level.bubbles.push(PLACE.bubble(level, 0.50, 0.50, 0.065));
      break;
    }
    case 20: {
      level.anchors = [
        { x: cx, y: 0.04 },
        { x: mid(cx, ox, 0.35), y: 0.05 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: segBase },
        { anchorIndex: 1, segments: segBase - 3, attachToCandy: true }
      ];
      level.stars = arcStars(cx, ox, starsN);
      level.obstacles.push(PLACE.platform(level, 'wood', 0.44, 0.50, 0.14, ft.moving ? { range: 0.04, speed: 1.0 } : null));
      level.obstacles.push(PLACE.platform(level, 'bounce', 0.66, 0.68, 0.16));
      break;
    }
    case 21: {
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [{ x: 0.5, y: 0.03 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase + 2 }];
      level.stars = verticalStars(0.5, starsN, 0.32, 0.11);
      level.bubbles.push(PLACE.bubble(level, 0.5, 0.52, 0.065));
      level.bubbles.push(PLACE.bubble(level, 0.5, 0.60, 0.06));
      level.obstacles.push(PLACE.platform(level, 'ice', 0.5, 0.66, 0.22));
      break;
    }
    case 22: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = zigzagStars(cx, ox, starsN);
      level.winds.push(PLACE.wind(level, 0.42, 0.20, 260));
      level.obstacles.push(PLACE.platform(level, 'stone', 0.54, 0.56, 0.16));
      if (ft.spike) level.obstacles.push(PLACE.spike(level));
      break;
    }
    case 23: {
      const off = 0.20;
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [
        { x: 0.5 - off, y: 0.03 },
        { x: 0.5, y: 0.02 },
        { x: 0.5 + off, y: 0.03 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 8, attachToCandy: true },
        { anchorIndex: 1, segments: segBase },
        { anchorIndex: 2, segments: 8, attachToCandy: true }
      ];
      level.stars = verticalStars(0.5, starsN, 0.28, 0.10);
      level.obstacles.push(PLACE.platform(level, 'ice', 0.48, 0.56, 0.18));
      level.obstacles.push(PLACE.platform(level, 'bounce', 0.62, 0.68, 0.16));
      if (ft.wind) level.winds.push(PLACE.wind(level, 0.40, 0.16, 230));
      break;
    }
    case 24: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(cx, ox, starsN);
      level.bubbles.push(PLACE.bubble(level, 0.48, 0.56, 0.07, ft.driftBubble ? 0.07 : 0));
      level.winds.push(PLACE.wind(level, 0.44, 0.18, 240));
      level.obstacles.push(obs('bounce', PLACE.pathT(level, 0.72) > ox ? 0.64 : 0.36, 0.66, 0.14, 0.04));
      if (ft.spike) level.obstacles.push(PLACE.spike(level));
      break;
    }
    case 25: {
      level.anchors = [
        { x: cx, y: 0.04 },
        { x: mid(cx, ox, 0.65), y: 0.05 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: segBase - 1 },
        { anchorIndex: 1, segments: segBase - 2, attachToCandy: true }
      ];
      level.stars = zigzagStars(cx, ox, starsN);
      level.obstacles.push(PLACE.platform(level, 'wood', 0.40, 0.52, 0.12));
      level.obstacles.push(PLACE.platform(level, 'ice', 0.60, 0.58, 0.14));
      break;
    }
    case 26: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase + 1 }];
      level.stars = verticalStars(PLACE.pathT(level, 0.5), starsN, 0.30, 0.10);
      level.winds.push(PLACE.wind(level, 0.34, 0.12, 200));
      level.winds.push(PLACE.wind(level, 0.48, 0.12, 220));
      level.bubbles.push(PLACE.bubble(level, 0.52, 0.58, 0.07));
      break;
    }
    case 27: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(cx, ox, starsN);
      level.obstacles.push(obs('wood', 0.38, 0.52, 0.12, 0.03, { range: 0.05, speed: 1.15 }));
      level.obstacles.push(obs('ice', 0.62, 0.58, 0.12, 0.04));
      if (ft.spike) level.obstacles.push(PLACE.spike(level));
      break;
    }
    case 28: {
      level.anchors = [{ x: cx, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(cx, ox, starsN);
      level.winds.push(PLACE.wind(level, 0.40, 0.16, 250));
      level.obstacles.push(PLACE.platform(level, 'bounce', 0.58, 0.66, 0.16));
      level.bubbles.push(PLACE.bubble(level, 0.52, 0.54, 0.065, 0.05));
      break;
    }
    case 29: {
      const spread = 0.19;
      level.candy.x = 0.5;
      level.omNom.x = 0.5;
      level.anchors = [
        { x: 0.5 - spread, y: 0.03 },
        { x: 0.5 + spread, y: 0.03 },
        { x: 0.5, y: 0.02 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 8, attachToCandy: true },
        { anchorIndex: 1, segments: segBase },
        { anchorIndex: 2, segments: 8, attachToCandy: true }
      ];
      level.stars = verticalStars(0.5, starsN, 0.28, 0.09);
      level.winds.push(PLACE.wind(level, 0.38, 0.14, 230));
      level.obstacles.push(obs('stone', 0.36, 0.52, 0.12, 0.03));
      level.obstacles.push(obs('ice', 0.64, 0.58, 0.12, 0.04));
      level.obstacles.push(obs('bounce', 0.38, 0.66, 0.14, 0.04));
      level.bubbles.push(PLACE.bubble(level, 0.5, 0.56, 0.065));
      if (ft.spike) level.obstacles.push(PLACE.spike(level));
      break;
    }
    default:
      break;
  }

  applyBossTweaks(level, id);
  finalizeLevel(level);
  return level;
}

function generateLevel(id) {
  if (id >= 25) return generateAdvancedLevel(id);
  return generateBasicLevel(id);
}

function generateBasicLevel(id) {
  const r = seededRand(id * 9973 + 42);
  const template = id % 20;
  const tier = Math.floor((id - 1) / 20);
  const ft = featureTier(id);
  const starsN = starCountFor(id);
  const layout = layoutForTemplate(template, r, id);
  const candyX = layout.candyX;
  const omNomX = layout.omNomX;
  const segBase = 10 + (id % 6) + tier;
  const mid = (a, b, t) => a + (b - a) * t;

  const level = {
    id,
    name: worldName(id),
    candy: { x: candyX, y: 0.20 + (id % 4) * 0.015 },
    omNom: { x: omNomX, y: 0.88 },
    anchors: [],
    ropes: [],
    stars: [],
    obstacles: [],
    bubbles: [],
    winds: []
  };

  switch (template) {
    case 0: {
      level.anchors = [{ x: 0.5, y: 0.03 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase + 2 }];
      level.stars = pathStars(0.5, 0.5, starsN, 0.28, 0.08);
      if (ft.ice) {
        const iceX = omNomX >= candyX ? 0.58 : 0.42;
        level.obstacles.push(obs('ice', iceX, 0.64, 0.16, 0.04));
      }
      break;
    }
    case 1: {
      level.anchors = [{ x: candyX, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(candyX, omNomX, starsN);
      if (ft.spike) {
        const side = candyX < omNomX ? -1 : 1;
        level.obstacles.push(obs('spike', mid(candyX, omNomX, 0.62) + side * 0.12, 0.76, 0.10, 0.025));
      }
      break;
    }
    case 2: {
      level.anchors = [
        { x: candyX, y: 0.04 },
        { x: mid(candyX, omNomX, 0.5), y: 0.05 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: segBase },
        { anchorIndex: 1, segments: segBase - 2, attachToCandy: true }
      ];
      level.stars = zigzagStars(candyX, omNomX, starsN);
      break;
    }
    case 3: {
      const spread = 0.14 + tier * 0.02;
      level.anchors = [
        { x: 0.5 - spread, y: 0.03 },
        { x: 0.5, y: 0.02 },
        { x: 0.5 + spread, y: 0.03 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 8, attachToCandy: true },
        { anchorIndex: 1, segments: segBase },
        { anchorIndex: 2, segments: 8, attachToCandy: true }
      ];
      level.stars = [
        { x: 0.5 - spread * 0.8, y: 0.28 },
        { x: 0.5 + spread * 0.8, y: 0.28 },
        { x: 0.5, y: 0.40 + tier * 0.02 }
      ].slice(0, starsN);
      if (starsN >= 4) level.stars.push({ x: 0.5, y: 0.54 });
      break;
    }
    case 4: {
      level.anchors = [{ x: candyX, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase + 1 }];
      level.stars = arcStars(candyX, omNomX, starsN);
      level.obstacles.push(obs(
        ft.ice ? 'ice' : 'wood',
        mid(candyX, omNomX, 0.50),
        0.60,
        0.18,
        0.04
      ));
      if (ft.spike && id > 35) {
        const side = candyX < omNomX ? -1 : 1;
        level.obstacles.push(obs('spike', omNomX + side * 0.14, 0.76, 0.10, 0.025));
      }
      break;
    }
    case 5: {
      const off = 0.18 + r() * 0.06;
      level.anchors = [
        { x: 0.5 - off, y: 0.03 },
        { x: 0.5 + off, y: 0.03 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: segBase - 1, attachToCandy: true },
        { anchorIndex: 1, segments: segBase - 1, attachToCandy: true }
      ];
      level.stars = [
        { x: 0.5 - off * 0.7, y: 0.27 },
        { x: 0.5 + off * 0.7, y: 0.27 },
        { x: 0.5, y: 0.42 }
      ].slice(0, starsN);
      level.obstacles.push(obs(
        ft.bounce ? 'bounce' : 'wood',
        mid(0.5, 0.5, 0.62),
        0.66,
        0.16,
        0.04
      ));
      break;
    }
    case 6: {
      level.anchors = [{ x: 0.5, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = [
        { x: 0.44, y: 0.27 },
        { x: 0.56, y: 0.27 },
        ...(starsN >= 3 ? [{ x: 0.5, y: 0.44 }] : [])
      ].slice(0, starsN);
      level.bubbles = [bubbleAt(0.5, 0.56, 0.07, ft.driftBubble ? (omNomX >= candyX ? 0.08 : -0.08) : 0)];
      break;
    }
    case 7: {
      level.anchors = [{ x: candyX, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase + 2 }];
      level.stars = arcStars(candyX, omNomX, starsN);
      level.bubbles = [bubbleAt(mid(candyX, omNomX, 0.52), 0.58, 0.075)];
      if (ft.spike) {
        const side = candyX < omNomX ? -1 : 1;
        level.obstacles.push(obs('spike', omNomX + side * 0.14, 0.76, 0.10, 0.025));
      }
      break;
    }
    case 8: {
      level.anchors = [{ x: candyX, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = zigzagStars(candyX, omNomX, starsN);
      level.obstacles = [
        obs('wood', mid(candyX, omNomX, 0.38), 0.50, 0.14, 0.03),
        obs(ft.ice ? 'ice' : 'stone', mid(candyX, omNomX, 0.58), 0.58, 0.14, 0.03)
      ];
      break;
    }
    case 9: {
      const spread = 0.20 + r() * 0.05;
      level.anchors = [
        { x: 0.5 - spread, y: 0.03 },
        { x: 0.5, y: 0.02 },
        { x: 0.5 + spread, y: 0.03 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 8, attachToCandy: true },
        { anchorIndex: 1, segments: segBase },
        { anchorIndex: 2, segments: 8, attachToCandy: true }
      ];
      level.stars = verticalStars(0.5, starsN, 0.30, 0.12);
      level.obstacles = tier >= 1 ? [obs('wood', mid(0.5, 0.5, 0.48), 0.54, 0.16, 0.04)] : [];
      if (ft.bounce) level.obstacles.push(obs('bounce', 0.5, 0.68, 0.18, 0.04));
      if (tier >= 2) level.bubbles = [bubbleAt(0.5, 0.62, 0.075)];
      break;
    }
    case 10: {
      level.anchors = [{ x: candyX, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(candyX, omNomX, starsN);
      if (ft.moving) {
        level.obstacles.push(obs('wood', mid(candyX, omNomX, 0.52), 0.58, 0.16, 0.04, {
          range: 0.05,
          speed: 1.1 + r() * 0.3
        }));
      } else {
        level.obstacles.push(obs('stone', mid(candyX, omNomX, 0.52), 0.58, 0.16, 0.04));
      }
      break;
    }
    case 11: {
      level.anchors = [{ x: candyX, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(candyX, omNomX, starsN);
      if (ft.wind) {
        level.winds.push(windZone(
          mid(candyX, omNomX, 0.5),
          0.46,
          0.18,
          0.20,
          omNomX > candyX ? 1 : -1,
          240 + tier * 15
        ));
      }
      break;
    }
    case 12: {
      level.anchors = [{ x: 0.5, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = [
        { x: 0.44, y: 0.30 },
        { x: 0.56, y: 0.46 },
        ...(starsN >= 3 ? [{ x: 0.55, y: 0.56 }] : [])
      ].slice(0, starsN);
      level.obstacles = [obs('ice', 0.55, 0.60, 0.18, 0.04)];
      break;
    }
    case 13: {
      level.anchors = [
        { x: candyX, y: 0.04 },
        { x: mid(candyX, omNomX, 0.65), y: 0.05 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: segBase - 2 },
        { anchorIndex: 1, segments: segBase - 2, attachToCandy: true }
      ];
      level.stars = zigzagStars(candyX, omNomX, starsN);
      const side = candyX < omNomX ? -1 : 1;
      level.obstacles = [
        obs('spike', omNomX + side * 0.14, 0.76, 0.10, 0.025),
        obs('wood', mid(candyX, omNomX, 0.58), 0.52, 0.14, 0.03)
      ];
      break;
    }
    case 14: {
      level.anchors = [{ x: 0.5, y: 0.03 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase + 1 }];
      level.stars = verticalStars(0.5, starsN, 0.32, 0.11);
      level.bubbles = [bubbleAt(0.5, 0.56, 0.065)];
      level.obstacles = [];
      break;
    }
    case 15: {
      const spread = 0.16 + tier * 0.015;
      level.anchors = [
        { x: 0.5 - spread, y: 0.03 },
        { x: 0.5 + spread, y: 0.03 },
        { x: 0.5, y: 0.02 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 7, attachToCandy: true },
        { anchorIndex: 1, segments: 7, attachToCandy: true },
        { anchorIndex: 2, segments: segBase - 2 }
      ];
      level.stars = [
        { x: 0.5 - spread, y: 0.28 },
        { x: 0.5 + spread, y: 0.28 },
        { x: 0.5, y: 0.40 },
        { x: 0.5, y: 0.54 }
      ].slice(0, starsN);
      break;
    }
    case 16: {
      level.anchors = [{ x: candyX, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = arcStars(candyX, omNomX, starsN);
      const side = candyX < omNomX ? -1 : 1;
      level.obstacles = [
        obs('wood', mid(candyX, omNomX, 0.42), 0.50, 0.14, 0.03, ft.moving ? { range: 0.05, speed: 1.2 } : null),
        obs(ft.bounce ? 'bounce' : 'stone', mid(candyX, omNomX, 0.62), 0.66, 0.16, 0.04)
      ];
      if (ft.spike) {
        level.obstacles.push(obs('spike', omNomX + side * 0.14, 0.76, 0.10, 0.025));
      }
      break;
    }
    case 17: {
      level.anchors = [{ x: 0.5, y: 0.04 }];
      level.ropes = [{ anchorIndex: 0, segments: segBase }];
      level.stars = [
        { x: 0.42, y: 0.30 },
        { x: 0.58, y: 0.30 },
        { x: 0.5, y: 0.48 }
      ].slice(0, starsN);
      level.bubbles = [bubbleAt(0.5, 0.56, 0.08, 0)];
      if (ft.wind) {
        level.winds.push(windZone(0.5, 0.40, 0.22, 0.20, 1, 240));
      }
      break;
    }
    case 18: {
      level.anchors = [
        { x: candyX, y: 0.04 },
        { x: mid(candyX, omNomX, 0.35), y: 0.05 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: segBase },
        { anchorIndex: 1, segments: segBase - 3, attachToCandy: true }
      ];
      level.stars = zigzagStars(candyX, omNomX, starsN);
      const side = candyX < omNomX ? -1 : 1;
      level.obstacles = [
        obs('spike', mid(candyX, omNomX, 0.45) + side * 0.12, 0.74, 0.10, 0.025),
        obs('bounce', mid(candyX, omNomX, 0.62), 0.68, 0.14, 0.04)
      ];
      break;
    }
    case 19: {
      const spread = 0.22 + r() * 0.04;
      level.anchors = [
        { x: 0.5 - spread, y: 0.03 },
        { x: 0.5, y: 0.02 },
        { x: 0.5 + spread, y: 0.03 }
      ];
      level.ropes = [
        { anchorIndex: 0, segments: 8, attachToCandy: true },
        { anchorIndex: 1, segments: segBase },
        { anchorIndex: 2, segments: 8, attachToCandy: true }
      ];
      level.stars = verticalStars(0.5, starsN, 0.28, 0.10);
      level.obstacles = [
        obs('stone', 0.5 - spread * 0.55, 0.54, 0.12, 0.03),
        obs('ice', 0.5 + spread * 0.55, 0.60, 0.12, 0.04)
      ];
      break;
    }
    default:
      break;
  }

  applyBossTweaks(level, id);
  finalizeLevel(level);
  return level;
}

function buildAllLevels() {
  const levels = BASE_LEVELS.map((l) => {
    const copy = JSON.parse(JSON.stringify(l));
    finalizeLevel(copy);
    return copy;
  });
  for (let id = 11; id <= 100; id++) {
    levels.push(generateLevel(id));
  }
  return levels;
}

const LEVELS = buildAllLevels();

const STORAGE_KEY = 'cutRopeProgress';

function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data) return { unlocked: 1, stars: {} };
    data.unlocked = clamp(data.unlocked || 1, 1, LEVELS.length);
    return data;
  } catch {
    return { unlocked: 1, stars: {} };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
