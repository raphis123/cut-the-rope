/**
 * Verlet rope physics with natural sag, swing, and clean rope splitting on cut.
 */
const GamePerf = (() => {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const isLowEnd = isTouch && (cores <= 4 || mem < 4);
  const isVeryLowEnd = isTouch && (cores <= 2 || mem <= 2);

  function getDprCap() {
    if (!isTouch) return 2;
    if (isVeryLowEnd) return 1;
    if (isLowEnd) return 1.25;
    return 1.5;
  }

  function getRopeQuality(w, h) {
    const area = w * h;
    if (isTouch) {
      if (isVeryLowEnd) {
        return { segmentMul: 0.82, iterations: area <= 400000 ? 3 : 4 };
      }
      if (isLowEnd) {
        return { segmentMul: 0.92, iterations: area <= 450000 ? 4 : 5 };
      }
      if (area <= 500000) return { segmentMul: 1.0, iterations: 5 };
      return { segmentMul: 1.08, iterations: 5 };
    }
    if (area <= 350000) return { segmentMul: 1.2, iterations: 6 };
    if (area <= 700000) return { segmentMul: 1.35, iterations: 7 };
    return { segmentMul: 1.5, iterations: 8 };
  }

  function maxRopeSegments() {
    if (isVeryLowEnd) return 14;
    if (isLowEnd) return 17;
    if (isTouch) return 20;
    return 26;
  }

  function settleSteps() {
    if (isVeryLowEnd) return 10;
    if (isLowEnd) return 16;
    if (isTouch) return 20;
    return 35;
  }

  function cutMoveThresholdSq() {
    if (isVeryLowEnd) return 36;
    if (isLowEnd) return 25;
    return 16;
  }

  return {
    isTouch,
    isLowEnd,
    isVeryLowEnd,
    getDprCap,
    getRopeQuality,
    maxRopeSegments,
    settleSteps,
    cutMoveThresholdSq
  };
})();

const Physics = (() => {
  const GRAVITY = 1100;
  const ROPE_DAMPING = 0.992;
  const CANDY_DAMPING = 0.994;
  const ROPE_SLACK = 1.2;
  const CANDY_RADIUS_NORM = 0.035;
  const CANDY_MASS = 2.5;
  const ROPE_POINT_MASS = 1;
  const OBSTACLE_ROLL_DRAG = 0.09;
  const OBSTACLE_ICE_DRAG = 0.012;
  const OBSTACLE_STONE_DRAG = 0.16;
  const BUBBLE_RISE_SPEED = -46;

  function getRopeQuality(w, h) {
    return GamePerf.getRopeQuality(w, h);
  }

  function dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1), t, u };
    }
    return null;
  }

  function getCandyHook(candy) {
    return { x: candy.x, y: candy.y - candy.radius * 0.35 };
  }

  function isCandyOutOfWorld(candy, w, h) {
    const r = candy.radius;
    return (
      candy.x + r < 0 ||
      candy.x - r > w ||
      candy.y + r < 0 ||
      candy.y - r > h
    );
  }

  class RopePoint {
    constructor(x, y, pinned = false) {
      this.x = x;
      this.y = y;
      this.oldX = x;
      this.oldY = y;
      this.pinned = pinned;
    }

    update(dt, gravity) {
      if (this.pinned) return;
      const vx = (this.x - this.oldX) * ROPE_DAMPING;
      const vy = (this.y - this.oldY) * ROPE_DAMPING;
      this.oldX = this.x;
      this.oldY = this.y;
      this.x += vx;
      this.y += vy + gravity * dt * dt;
    }
  }

  class Rope {
    constructor(id, points, segmentLength) {
      this.id = id;
      this.points = points;
      this.segmentLength = segmentLength;
      this.active = true;
      this.attachedToCandy = false;
    }

    getSegments() {
      const segs = [];
      for (let i = 0; i < this.points.length - 1; i++) {
        segs.push({
          ropeId: this.id,
          index: i,
          p1: this.points[i],
          p2: this.points[i + 1]
        });
      }
      return segs;
    }

    constrainSegments() {
      const maxLen = this.segmentLength;
      for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (d <= maxLen) continue;
        const diff = (d - maxLen) / d;
        const offsetX = dx * diff * 0.5;
        const offsetY = dy * diff * 0.5;
        if (!p1.pinned) {
          p1.x += offsetX;
          p1.y += offsetY;
        }
        if (!p2.pinned) {
          p2.x -= offsetX;
          p2.y -= offsetY;
        }
      }
    }

    isAnchored() {
      return this.active && this.points.length > 0 && this.points[0].pinned;
    }
  }

  class Candy {
    constructor(x, y, radius) {
      this.x = x;
      this.y = y;
      this.oldX = x;
      this.oldY = y;
      this.vx = 0;
      this.vy = 0;
      this.radius = radius;
      this.attachedRopes = [];
      this.inBubble = false;
      this.bubbleTimer = 0;
      this.collected = false;
      this.destroyed = false;
      this.falling = false;
      this.angle = 0;
      this.spin = 0;
    }

    syncSpinFromMotion() {
      this.spin = this.vx / this.radius;
    }

    stepRotation(dt) {
      this.angle += this.spin * dt;
    }

    verletStep(dt, gravity) {
      const vx = (this.x - this.oldX) * CANDY_DAMPING;
      const vy = (this.y - this.oldY) * CANDY_DAMPING;
      this.oldX = this.x;
      this.oldY = this.y;
      this.x += vx;
      this.y += vy + gravity * dt * dt;
      this.vx = vx / Math.max(dt, 0.001);
      this.vy = vy / Math.max(dt, 0.001);
      this.spin += ((this.vx / this.radius) - this.spin) * Math.min(1, 8 * dt);
      this.stepRotation(dt);
    }

    transferVerletToVelocity(scale) {
      this.vx = (this.x - this.oldX) * scale;
      this.vy = (this.y - this.oldY) * scale;
      this.syncSpinFromMotion();
    }

    updateFalling(dt, gravity, w, h) {
      if (this.inBubble) {
        this.vy += (BUBBLE_RISE_SPEED - this.vy) * Math.min(1, 2.2 * dt);
        this.vx *= 0.97;
        this.vx += (this.bubbleDrift || 0) * dt;
      } else {
        this.vy += gravity * dt;
      }
      this.vx *= 0.999;
      this.vy *= 0.999;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.oldX = this.x;
      this.oldY = this.y;

      const targetSpin = this.vx / this.radius;
      this.spin += (targetSpin - this.spin) * Math.min(1, 10 * dt);
      this.stepRotation(dt);
    }
  }

  class Star {
    constructor(x, y, radius) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.collected = false;
      this.angle = Math.random() * Math.PI * 2;
    }

    update(dt) {
      if (!this.collected) {
        this.angle += dt * (GamePerf.isVeryLowEnd ? 1.3 : 2);
      }
    }
  }

  class Obstacle {
    constructor(x, y, w, h, type, move) {
      this.baseX = x;
      this.baseY = y;
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.type = type || 'wood';
      this.move = move || null;
    }
  }

  class WindZone {
    constructor(x, y, w, h, dir, strength) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.forceX = (dir >= 0 ? 1 : -1) * (strength || 320);
    }
  }

  class BubbleZone {
    constructor(x, y, radius, drift) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.drift = drift || 0;
      this.popped = false;
    }
  }

  function circleRectOverlap(cx, cy, r, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < r * r;
  }

  function lineIntersectsCircle(x1, y1, x2, y2, cx, cy, radius) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? ((cx - x1) * dx + (cy - y1) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const nearX = x1 + t * dx;
    const nearY = y1 + t * dy;
    const distSq = (cx - nearX) * (cx - nearX) + (cy - nearY) * (cy - nearY);
    return distSq < radius * radius;
  }

  function updateMovingObstacles(obstacles, time) {
    obstacles.forEach((obs) => {
      if (!obs.move) return;
      obs.x = obs.baseX + Math.sin(time * obs.move.speed + obs.move.phase) * obs.move.range;
    });
  }

  function rollDragForType(type) {
    if (type === 'ice') return OBSTACLE_ICE_DRAG;
    if (type === 'stone') return OBSTACLE_STONE_DRAG;
    return OBSTACLE_ROLL_DRAG;
  }

  function buildRopePoints(startX, startY, endX, endY, segments, slack, minDim) {
    const straight = dist(startX, startY, endX, endY);
    const segLen = (straight * slack) / segments;
    const sag = straight * 0.08 + minDim * 0.015;
    const points = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const px = startX + (endX - startX) * t;
      const py = startY + (endY - startY) * t + sag * Math.sin(t * Math.PI);
      points.push(new RopePoint(px, py, false));
    }

    return { points, segLen };
  }

  function isRopeSupportingCandy(rope, candy) {
    if (!rope.active || !rope.isAnchored() || !rope.attachedToCandy) return false;
    const hook = getCandyHook(candy);
    const tail = rope.points[rope.points.length - 1];
    return dist(tail.x, tail.y, hook.x, hook.y) < rope.segmentLength * 2.5;
  }

  function isCandySupported(world) {
    return world.candy.attachedRopes.some((r) => isRopeSupportingCandy(r, world.candy));
  }

  function isCandyAttached(world) {
    if (world.candy.inBubble) return false;
    return isCandySupported(world);
  }

  function constrainRopeToCandy(rope, candy) {
    if (!isRopeSupportingCandy(rope, candy)) return;
    const attach = rope.points[rope.points.length - 1];
    const hook = getCandyHook(candy);
    const dx = hook.x - attach.x;
    const dy = hook.y - attach.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.5) return;
    const nx = dx / d;
    const ny = dy / d;
    const total = CANDY_MASS + ROPE_POINT_MASS;
    attach.x += nx * d * (CANDY_MASS / total);
    attach.y += ny * d * (CANDY_MASS / total);
    candy.x -= nx * d * (ROPE_POINT_MASS / total);
    candy.y -= ny * d * (ROPE_POINT_MASS / total);
  }

  function solveConstraints(world, includeCandy) {
    const { candy, ropes, quality } = world;
    let iterations = quality.iterations;
    if (candy.collected && GamePerf.isLowEnd) {
      iterations = Math.max(2, iterations - 2);
    }
    for (let i = 0; i < iterations; i++) {
      ropes.forEach((rope) => {
        if (rope.active) rope.constrainSegments();
      });
      if (includeCandy && isCandyAttached(world)) {
        ropes.forEach((rope) => constrainRopeToCandy(rope, candy));
      }
    }
  }

  function settleRopes(world, steps) {
    for (let s = 0; s < steps; s++) {
      world.ropes.forEach((rope) => {
        rope.points.forEach((p) => p.update(0.016, GRAVITY));
      });
      solveConstraints(world, true);
    }
  }

  function applyInitialPendulumsSwing(world, level) {
    const { candy, w, h } = world;
    const minDim = Math.min(w, h);
    const push = minDim * 0.014;
    let dir = 1;
    if (level && level.omNom && level.candy) {
      if (level.omNom.x > level.candy.x + 0.02) dir = 1;
      else if (level.omNom.x < level.candy.x - 0.02) dir = -1;
      else dir = level.id % 2 === 0 ? 1 : -1;
    }

    candy.x += push * dir;
    candy.oldX = candy.x - push * dir * 1.8;
    candy.oldY = candy.y;

    const hook = getCandyHook(candy);

    world.ropes.forEach((rope) => {
      if (!rope.active || !rope.attachedToCandy) return;

      const tail = rope.points[rope.points.length - 1];
      tail.x = hook.x;
      tail.y = hook.y;
      tail.oldX = tail.x - push * dir * 1.8;
      tail.oldY = tail.y;

      const nudgeCount = Math.min(4, rope.points.length - 1);
      for (let i = 1; i <= nudgeCount; i++) {
        const p = rope.points[rope.points.length - 1 - i];
        if (p.pinned) break;
        const falloff = 1 - (i - 1) / nudgeCount;
        p.x += push * dir * falloff * 0.45;
        p.oldX = p.x - push * dir * falloff * 0.6;
      }
    });
  }

  function pruneCandyRopes(world) {
    world.candy.attachedRopes = world.candy.attachedRopes.filter((r) => r.active);
  }

  function destroyCandyRopeSegments(world) {
    const hook = getCandyHook(world.candy);
    const nearCandy = (p) =>
      dist(p.x, p.y, hook.x, hook.y) < world.candy.radius * 2 ||
      dist(p.x, p.y, world.candy.x, world.candy.y) < world.candy.radius * 2.5;

    world.ropes.forEach((rope) => {
      if (!rope.active) return;

      const tailNear = nearCandy(rope.points[rope.points.length - 1]);
      const linkedToCandy = rope.attachedToCandy || tailNear;

      if (!linkedToCandy) return;

      if (!rope.isAnchored()) {
        rope.active = false;
        rope.attachedToCandy = false;
        return;
      }

      while (rope.points.length > 2 && nearCandy(rope.points[rope.points.length - 1])) {
        rope.points.pop();
      }

      rope.attachedToCandy = false;

      if (rope.points.length < 2) {
        rope.active = false;
      }
    });

    world.candy.attachedRopes = [];
  }

  function snapApart(upperTip, lowerTip, hitPoint) {
    if (!upperTip || !lowerTip) return;
    const push = 4;
    if (hitPoint) {
      upperTip.x = hitPoint.x - push * 0.5;
      upperTip.y = hitPoint.y;
      lowerTip.x = hitPoint.x + push * 0.5;
      lowerTip.y = hitPoint.y + 1;
    } else {
      const dx = lowerTip.x - upperTip.x;
      const dy = lowerTip.y - upperTip.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      upperTip.x -= (dx / len) * push;
      upperTip.y -= (dy / len) * push;
      lowerTip.x += (dx / len) * push;
      lowerTip.y += (dy / len) * push;
    }
    lowerTip.oldX = lowerTip.x;
    lowerTip.oldY = lowerTip.y;
  }

  function splitRopeAt(world, rope, segmentIndex, hitPoint) {
    if (!rope.active) return false;

    const upperPoints = rope.points.slice(0, segmentIndex + 1);
    const lowerPoints = rope.points.slice(segmentIndex + 1);

    if (upperPoints.length >= 2) {
      rope.points = upperPoints;
    } else {
      rope.active = false;
      rope.attachedToCandy = false;
      if (upperPoints.length === 1) rope.points = upperPoints;
    }

    if (lowerPoints.length >= 2) {
      const frag = new Rope(world.nextRopeId++, lowerPoints, rope.segmentLength);
      frag.attachedToCandy = false;
      world.ropes.push(frag);
      snapApart(
        upperPoints.length ? upperPoints[upperPoints.length - 1] : null,
        lowerPoints[0],
        hitPoint
      );
    }

    if (!rope.active) rope.attachedToCandy = false;

    pruneCandyRopes(world);
    return true;
  }

  function createWorld(level, w, h) {
    const quality = getRopeQuality(w, h);
    const minDim = Math.min(w, h);
    const candyRadius = CANDY_RADIUS_NORM * minDim;
    const candy = new Candy(level.candy.x * w, level.candy.y * h, candyRadius);
    const anchors = level.anchors.map((a) => ({ x: a.x * w, y: a.y * h }));
    const ropes = [];
    let ropeId = 0;

    level.ropes.forEach((ropeDef) => {
      const anchor = anchors[ropeDef.anchorIndex];
      const baseSegments = ropeDef.segments || 12;
      const segments = Math.min(
        GamePerf.maxRopeSegments(),
        Math.max(10, Math.round(baseSegments * quality.segmentMul))
      );
      const hook = getCandyHook(candy);
      const { points, segLen } = buildRopePoints(
        anchor.x, anchor.y, hook.x, hook.y, segments, ROPE_SLACK, minDim
      );
      points[0].pinned = true;
      points[0].x = anchor.x;
      points[0].y = anchor.y;
      const rope = new Rope(ropeId++, points, segLen);
      rope.attachedToCandy = true;
      ropes.push(rope);
      candy.attachedRopes.push(rope);
    });

    const world = {
      candy,
      ropes,
      anchors,
      w,
      h,
      quality,
      nextRopeId: ropeId,
      omNom: {
        x: level.omNom.x * w,
        y: level.omNom.y * h,
        radius: 0.07 * minDim,
        mouthOpen: 0,
        faceDir: candy.x >= level.omNom.x * w ? 1 : -1,
        excited: 0,
        blink: 0,
        blinkTimer: 2.5 + Math.random() * 2
      },
      obstacles: (level.obstacles || []).map((o) => {
        const px = o.x * w - (o.w * w) / 2;
        const py = o.y * h - (o.h * h) / 2;
        const move = o.move ? {
          range: (o.move.range || 0.08) * w,
          speed: o.move.speed || 1.2,
          phase: o.move.phase ?? (o.x + o.y) * 10
        } : null;
        return new Obstacle(px, py, o.w * w, o.h * h, o.type, move);
      }),
      winds: (level.winds || []).map((wind) => new WindZone(
        wind.x * w - (wind.w * w) / 2,
        wind.y * h - (wind.h * h) / 2,
        wind.w * w,
        wind.h * h,
        wind.dir ?? 1,
        wind.strength
      )),
      bubbles: (level.bubbles || []).map((b) =>
        new BubbleZone(b.x * w, b.y * h, (b.radius || 0.06) * minDim, (b.drift || 0) * w)
      )
    };

    world.stars = (level.stars || []).map((s) =>
      new Star(s.x * w, s.y * h, 0.032 * minDim)
    );
    world.time = 0;

    settleRopes(world, GamePerf.settleSteps());
    applyInitialPendulumsSwing(world, level);
    return world;
  }

  function releaseCandyFromRopes(candy, dt) {
    if (!candy.falling) {
      candy.falling = true;
      candy.transferVerletToVelocity(1 / Math.max(dt || 0.016, 0.001));
    }
  }

  function resolveCircleRect(circle, rect, obsType) {
    const r = circle.radius;
    const supportLeft = rect.x + r;
    const supportRight = rect.x + rect.w - r;
    const topY = rect.y;
    const onTopFace = circle.x >= supportLeft && circle.x <= supportRight;

    if (circle.falling && onTopFace && circle.vy >= -30) {
      const bottom = circle.y + r;
      if (bottom > topY && bottom < topY + r * 1.5) {
        circle.y = topY - r;
        if (obsType === 'bounce') {
          circle.vy = -Math.abs(circle.vy) * 0.72;
          circle.vx *= 1.04;
          circle.syncSpinFromMotion();
          return;
        }
        if (circle.vy > 45) {
          circle.vy *= 0.52;
          circle.vx *= 0.96;
        } else if (circle.vy > 0) {
          circle.vy = 0;
        }
        circle.syncSpinFromMotion();
        return;
      }
    }

    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const dSq = dx * dx + dy * dy;
    if (dSq >= r * r || dSq < 1e-10) return;

    const d = Math.sqrt(dSq);
    const overlap = r - d;
    circle.x += (dx / d) * overlap;
    circle.y += (dy / d) * overlap;

    if (!circle.falling) return;

    const hitTop = Math.abs(closestY - topY) < 1 && dy <= 0;
    if (hitTop && onTopFace) {
      circle.y = topY - r;
      if (obsType === 'bounce' && circle.vy > 0) {
        circle.vy = -Math.abs(circle.vy) * 0.72;
        circle.vx *= 1.04;
      } else if (circle.vy > 0) {
        circle.vy = 0;
      }
    } else if (hitTop) {
      circle.vy *= 0.15;
    } else if (circle.y + r > topY + 4) {
      circle.vx *= 0.82;
      if (circle.vy > 0) circle.vy *= 0.88;
      else circle.vy *= -0.15;
    } else {
      circle.vx *= 0.5;
      circle.vy *= -0.3;
    }
    circle.syncSpinFromMotion();
  }

  function updateCandySurfaceRoll(candy, obstacles, h, dt) {
    if (!candy.falling) return;
    const r = candy.radius;
    let rolling = false;

    for (const obs of obstacles) {
      const supportLeft = obs.x + r;
      const supportRight = obs.x + obs.w - r;
      const topY = obs.y;
      const bottom = candy.y + r;
      const onTop =
        candy.x >= supportLeft &&
        candy.x <= supportRight &&
        bottom >= topY - 4 &&
        bottom <= topY + 6 &&
        candy.vy >= -35;

      if (!onTop) continue;

      rolling = true;
      candy.y = topY - r;

      const distLeft = candy.x - supportLeft;
      const distRight = supportRight - candy.x;
      const tipZone = r * 0.35;
      if (distRight < tipZone && candy.vx > 0) {
        candy.vy += (1 - distRight / tipZone) * 320 * dt;
      } else if (distLeft < tipZone && candy.vx < 0) {
        candy.vy += (1 - distLeft / tipZone) * 320 * dt;
      } else if (candy.vy > 0) {
        candy.vy = 0;
      }

      candy.vx *= Math.max(0, 1 - rollDragForType(obs.type) * dt);
      if (Math.abs(candy.vx) < 4) candy.vx = 0;
      candy.spin += ((candy.vx / r) - candy.spin) * Math.min(1, 12 * dt);
      candy.stepRotation(dt);
      break;
    }

    if (!rolling) {
      const targetSpin = candy.vx / r;
      candy.spin += (targetSpin - candy.spin) * Math.min(1, 12 * dt);
      candy.stepRotation(dt);
    }
  }

  function resolvePointRect(point, rect) {
    if (point.x >= rect.x && point.x <= rect.x + rect.w &&
        point.y >= rect.y && point.y <= rect.y + rect.h) {
      const dl = point.x - rect.x;
      const dr = rect.x + rect.w - point.x;
      const dt = point.y - rect.y;
      const db = rect.y + rect.h - point.y;
      const min = Math.min(dl, dr, dt, db);
      if (min === dl) point.x = rect.x - 1;
      else if (min === dr) point.x = rect.x + rect.w + 1;
      else if (min === dt) point.y = rect.y - 1;
      else point.y = rect.y + rect.h + 1;
    }
  }

  function startLoseSequence(world, reason) {
    const starsCollected = world.stars.filter((s) => s.collected).length;
    if (world.loseStarted) {
      return { won: false, lost: true, starsCollected };
    }

    world.loseStarted = true;
    world.loseReason = reason;
    const { omNom, candy } = world;

    omNom.sad = true;
    omNom.sadTime = 0;
    omNom.sadAmount = 0;
    omNom.slouch = 0;
    omNom.eating = false;
    omNom.excited = 0;

    const dx = candy.x - omNom.x;
    const dy = candy.y - omNom.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    omNom.lookX = dx / d;
    omNom.lookY = Math.min(0.35, dy / d);
    omNom.faceDir = dx >= 0 ? 1 : -1;

    candy.loseAnim = true;
    candy.loseTime = 0;
    candy.loseVisible = true;
    candy.loseX = candy.x;
    candy.loseY = candy.y;
    candy.shatter = reason === 'spike';
    candy.loseAlpha = 1;

    destroyCandyRopeSegments(world);
    return { won: false, lost: true, starsCollected };
  }

  function updateLoseAnim(world, dt) {
    const { omNom, candy } = world;
    omNom.sadTime = (omNom.sadTime || 0) + dt;
    const st = omNom.sadTime;

    omNom.sadAmount = Math.min(1, st * 1.6);
    omNom.slouch = Math.min(1, Math.max(0, (st - 0.12) * 1.8));

    if (st < 0.25) {
      omNom.mouthOpen = st * 0.35;
    } else {
      omNom.mouthOpen = Math.max(0, 0.35 - (st - 0.25) * 0.4);
    }

    if (!candy.loseAnim) return;

    candy.loseTime = (candy.loseTime || 0) + dt;
    const lt = candy.loseTime;
    const reason = world.loseReason;

    if (reason === 'spike') {
      candy.shatterT = Math.min(1, lt / 0.55);
      candy.loseAlpha = Math.max(0, 1 - candy.shatterT * 1.1);
      candy.loseVisible = candy.loseAlpha > 0.05;
    } else if (reason === 'fall') {
      candy.loseAlpha = Math.max(0, 1 - lt * 2.2);
      candy.loseVisible = candy.loseAlpha > 0.05;
    } else if (reason === 'miss') {
      candy.greyOut = Math.min(0.42, lt * 0.22);
      candy.loseX = candy.x;
      candy.loseY = candy.y;
    }
  }

  function updateEatingAnim(omNom, candy, dt) {
    omNom.eatTime = (omNom.eatTime || 0) + dt;
    const et = omNom.eatTime;
    const r = omNom.radius;
    const mouthX = omNom.x;
    const mouthY = omNom.y + r * 0.26;

    if (et < 0.08) {
      omNom.mouthOpen = 0.15 + (et / 0.08) * 0.85;
    } else if (et < 0.32) {
      omNom.mouthOpen = 1;
    } else if (et < 0.52) {
      omNom.mouthOpen = 1 - ((et - 0.32) / 0.2) * 0.2;
    } else {
      omNom.mouthOpen = 0.42 + 0.52 * Math.abs(Math.sin((et - 0.52) * 7.5));
    }

    omNom.happy = Math.min(1, Math.max(0, (et - 0.38) * 2.8));
    omNom.cheekSquish = et > 0.48 ? 0.12 + 0.1 * Math.abs(Math.sin((et - 0.48) * 7.5)) : 0;

    if (et < 0.52) {
      const t = Math.max(0, Math.min(1, (et - 0.06) / 0.38));
      const ease = 1 - Math.pow(1 - t, 2.8);
      candy.drawX = omNom.biteX + (mouthX - omNom.biteX) * ease;
      candy.drawY = omNom.biteY + (mouthY - omNom.biteY) * ease - Math.sin(t * Math.PI) * r * 0.35;
      candy.drawScale = 1 - ease * 0.7;
      candy.drawAngle = (candy.angle || 0) + t * 2.4;
      candy.eatVisible = candy.drawScale > 0.12;
    } else {
      candy.eatVisible = false;
    }
  }

  function updateOmNomAnim(world, dt) {
    const { omNom, candy } = world;
    if (candy.collected || omNom.sad) return;

    omNom.faceDir = candy.x >= omNom.x ? 1 : -1;

    const dx = candy.x - omNom.x;
    const dy = candy.y - omNom.y;
    const lookDist = Math.sqrt(dx * dx + dy * dy) || 1;
    omNom.lookX = dx / lookDist;
    omNom.lookY = dy / lookDist;

    const reach = omNom.radius * 5;
    const wantsCandy = candy.falling || candy.inBubble;
    const closeEnough = lookDist < reach;
    const targetExcited = wantsCandy && closeEnough ? 1 : 0;
    omNom.excited += (targetExcited - omNom.excited) * Math.min(1, dt * 6);

    omNom.blinkTimer -= dt;
    if (omNom.blinkTimer <= 0) {
      omNom.blink = 1;
      omNom.blinkTimer = 2.8 + Math.random() * 2.5;
    }
    if (omNom.blink > 0) {
      omNom.blink = Math.max(0, omNom.blink - dt * 9);
    }
  }

  function simulatePhysicsDuringLose(world, dt) {
    const gravity = GRAVITY;
    const { candy, ropes, obstacles, w, h } = world;
    const reason = world.loseReason;
    const attached = isCandyAttached(world);

    if (!attached && reason === 'fall') {
      candy.updateFalling(dt, gravity, w, h);
      obstacles.forEach((obs) => resolveCircleRect(candy, obs, obs.type));
      updateCandySurfaceRoll(candy, obstacles, h, dt);
      candy.loseX = candy.x;
      candy.loseY = candy.y;
    }

    ropes.forEach((rope) => {
      if (!rope.active) return;
      rope.points.forEach((p) => p.update(dt, gravity));
    });
    solveConstraints(world, false);

    ropes.forEach((rope) => {
      if (!rope.active) return;
      rope.points.forEach((p) => {
        if (p.pinned) return;
        obstacles.forEach((obs) => resolvePointRect(p, obs));
      });
    });

    ropes.forEach((rope) => {
      if (!rope.active) return;
      if (rope.points.every((p) => p.y > h + 60)) {
        rope.active = false;
      }
    });
  }

  function updateWorld(world, dt) {
    const { candy, ropes, stars, obstacles, bubbles, winds, omNom, w, h } = world;
    const gravity = GRAVITY;
    const attached = isCandyAttached(world);

    world.time = (world.time || 0) + dt;
    updateMovingObstacles(obstacles, world.time);
    updateOmNomAnim(world, dt);

    if (candy.collected) {
      updateEatingAnim(omNom, candy, dt);
      ropes.forEach((rope) => {
        if (!rope.active) return;
        rope.points.forEach((p) => p.update(dt, gravity));
      });
      solveConstraints(world, false);
      return { won: true, lost: false,starsCollected: world.stars.filter((s) => s.collected).length };
    }

    if (world.loseStarted) {
      updateLoseAnim(world, dt);
      simulatePhysicsDuringLose(world, dt);
      return { won: false, lost: true, starsCollected: world.stars.filter((s) => s.collected).length };
    }

    if (attached) candy.verletStep(dt, gravity);

    ropes.forEach((rope) => {
      if (!rope.active) return;
      rope.points.forEach((p) => p.update(dt, gravity));
    });

    solveConstraints(world, true);

    if (!attached) {
      candy.updateFalling(dt, gravity, w, h);
      if (candy.falling || candy.inBubble) {
        winds.forEach((wind) => {
          if (
            candy.x > wind.x && candy.x < wind.x + wind.w &&
            candy.y > wind.y && candy.y < wind.y + wind.h
          ) {
            candy.vx += wind.forceX * dt;
          }
        });
      }
    }

    for (const obs of obstacles) {
      if (obs.type === 'spike' && circleRectOverlap(candy.x, candy.y, candy.radius, obs)) {
        return startLoseSequence(world, 'spike');
      }
    }

    if (isCandyOutOfWorld(candy, w, h)) {
      return startLoseSequence(world, 'fall');
    }

    world.stars.forEach((star) => {
      star.update(dt);
      if (!star.collected && dist(candy.x, candy.y, star.x, star.y) < candy.radius + star.radius) {
        star.collected = true;
      }
    });

    bubbles.forEach((bubble) => {
      if (bubble.popped) return;
      if (dist(candy.x, candy.y, bubble.x, bubble.y) < bubble.radius + candy.radius * 0.5) {
        candy.inBubble = true;
        candy.falling = true;
        candy.vx *= 0.75;
        candy.vy = BUBBLE_RISE_SPEED;
        candy.bubbleDrift = bubble.drift;
        candy.oldX = candy.x;
        candy.oldY = candy.y;
        candy.syncSpinFromMotion();
        bubble.popped = true;
      }
    });

    if (candy.inBubble && candy.y - candy.radius < 20) {
      candy.y = candy.radius + 20;
      popBubble(candy);
    }

    obstacles.forEach((obs) => resolveCircleRect(candy, obs, obs.type));

    ropes.forEach((rope) => {
      if (!rope.active) return;
      rope.points.forEach((p) => {
        if (p.pinned) return;
        obstacles.forEach((obs) => resolvePointRect(p, obs));
      });
    });

    updateCandySurfaceRoll(candy, obstacles, h, dt);

    if (dist(candy.x, candy.y, omNom.x, omNom.y) < candy.radius + omNom.radius * 0.7) {
      candy.collected = true;
      omNom.eating = true;
      omNom.eatTime = 0;
      omNom.biteX = candy.x;
      omNom.biteY = candy.y;
      omNom.mouthOpen = 0.15;
      omNom.happy = 0;
      candy.eatVisible = true;
      candy.drawX = candy.x;
      candy.drawY = candy.y;
      candy.drawScale = 1;
      destroyCandyRopeSegments(world);
      return { won: true, lost: false,starsCollected: world.stars.filter((s) => s.collected).length };
    }

    const settledOnGround = candy.falling && candy.y >= h - candy.radius - 2 && Math.abs(candy.vy) < 30;
    const missedOmNom = settledOnGround &&
      dist(candy.x, candy.y, omNom.x, omNom.y) > omNom.radius + candy.radius;

    if (missedOmNom) {
      return startLoseSequence(world, 'miss');
    }

    return { won: false, lost: false,starsCollected: world.stars.filter((s) => s.collected).length };
  }

  function cutHitsBubble(candy, x1, y1, x2, y2) {
    if (!candy.inBubble) return false;
    const cx = candy.x;
    const cy = candy.y;
    const r = candy.radius * 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? ((cx - x1) * dx + (cy - y1) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const nearX = x1 + t * dx;
    const nearY = y1 + t * dy;
    const distSq = (cx - nearX) * (cx - nearX) + (cy - nearY) * (cy - nearY);
    return distSq < r * r;
  }

  function processCut(world, x1, y1, x2, y2, dt) {
    if (cutHitsBubble(world.candy, x1, y1, x2, y2)) {
      popBubble(world.candy);
    }

    world.bubbles.forEach((bubble) => {
      if (!bubble.popped && lineIntersectsCircle(x1, y1, x2, y2, bubble.x, bubble.y, bubble.radius)) {
        bubble.popped = true;
      }
    });

    const hits = [];
    world.ropes.forEach((rope) => {
      if (!rope.active) return;
      rope.getSegments().forEach((seg) => {
        const hit = lineIntersect(x1, y1, x2, y2, seg.p1.x, seg.p1.y, seg.p2.x, seg.p2.y);
        if (hit) hits.push({ rope, index: seg.index, point: hit });
      });
    });

    if (hits.length === 0) return false;

    hits.forEach((h) => splitRopeAt(world, h.rope, h.index, h.point));

    if (!isCandySupported(world)) {
      releaseCandyFromRopes(world.candy, dt);
    } else {
      world.candy.falling = false;
    }

    return true;
  }

  function processCutPath(world, points, dt) {
    let anyCut = false;
    for (let i = 1; i < points.length; i++) {
      if (processCut(world, points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, dt)) {
        anyCut = true;
      }
    }
    return anyCut;
  }

  function popBubble(candy) {
    if (!candy.inBubble) return false;
    candy.inBubble = false;
    candy.bubbleDrift = 0;
    candy.vy = Math.max(candy.vy * 0.1, 45);
    candy.syncSpinFromMotion();
    return true;
  }

  return {
    createWorld,
    updateWorld,
    processCut,
    processCutPath,
    popBubble,
    CANDY_RADIUS_NORM
  };
})();
