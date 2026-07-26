/**
 * Cartoon-style canvas renderer (ready for sprite swap).
 */
const Renderer = (() => {
  let ctx = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let cloudOffset = 0;
  let bgCache = null;
  let bgCacheValid = false;

  const assets = {
    omNom: null,
    candy: null,
    star: null,
    starFx: Array(12).fill(null),
    characters: {
      character01: {
        idle: [],
        eat: [],
        eat_no: []
      },
      character02: {
        idle: [],
        eat: [],
        eat_no: []
      },
      character03: {
        idle: [],
        eat: [],
        eat_no: []
      }
    }
  };

  const OUTLINE = '#2d3436';
  const OUTLINE_W = 2.5;

  // ✨ 별 획득 이펙트 설정
  const STAR_FX_FRAME_COUNT = 12;
  const STAR_FX_FPS = 18.72;
  const STAR_FX_DURATION = STAR_FX_FRAME_COUNT / STAR_FX_FPS;
  const STAR_FX_REFERENCE_SIZE = 1.0;
  const STAR_FX_SCALE = 5.5;
  const STAR_FX_OFFSET_X = 0;
  const STAR_FX_OFFSET_Y = 2;

  // 🎭 캐릭터 애니메이션 설정
  const CHARACTER_ANIM_CONFIG = {
    idle: {
      fps: 4,
      loop: true
    },
    eat: {
      duration: 1.2,
      loop: false
    },
    eat_no: {
      duration: 0.5,
      loop: true  // 반복 재생
    }
  };
  const CHARACTER_SCALE = 2.2;  // 2 * 1.1 = 2.2배 확대 (1.1배 증가)
  const CHARACTER_OFFSET_X = 0;
  const CHARACTER_OFFSET_Y = 0;
  
  // 애니메이션 속도 설정 (1.5배, 1.5배, 5배 - eat만 2배 더 빠르게)
  const IDLE_FPS = CHARACTER_ANIM_CONFIG.idle.fps * 1.5;  // 4 * 1.5 = 6
  const EAT_NO_FPS = 6 * 1.5;  // 6 * 1.5 = 9
  const EAT_SPEED_MULTIPLIER = 5.0;  // 2.5 * 2 = 5.0 (현재 속도에서 2배 더 빠름)
  const EAT_DURATION = CHARACTER_ANIM_CONFIG.eat.duration / EAT_SPEED_MULTIPLIER;  // 1.2 / 5.0 = 0.24

  function getCharacterAnimationState(omNom) {
    // eat 애니메이션이 아직 재생 중인지 확인
    if (omNom.eating && omNom.eatTime < EAT_DURATION) {
      return 'eat';
    }
    // 실패 상태면 eat_no 반복
    if (omNom.sad) {
      return 'eat_no';
    }
    // 그 외는 idle 반복
    return 'idle';
  }

  function getCharacterKeyForLevel(levelIndex) {
    // levelIndex는 0부터 시작하므로 display level = levelIndex + 1
    const levelNumber = levelIndex + 1;
    
    if (levelNumber <= 10) {
      return 'character01';
    }
    if (levelNumber <= 20) {
      return 'character02';
    }
    return 'character03';
  }

  function getCharacterFrameIndex(state, omNom, time) {
    if (state === 'idle') {
      return Math.floor(time * IDLE_FPS) % 3;
    }
    if (state === 'eat') {
      const progress = Math.max(0, Math.min(1, omNom.eatTime / EAT_DURATION));
      return Math.min(4, Math.floor(progress * 5));
    }
    if (state === 'eat_no') {
      // eat_no는 EAT_NO_FPS로 반복 재생
      return Math.floor(omNom.sadTime * EAT_NO_FPS) % 3;
    }
    return 0;
  }

  function isTouchDevice() {
    return GamePerf.isTouch;
  }

  function isLiteRender() {
    return GamePerf.isTouch || GamePerf.isLowEnd;
  }

  function getDpr() {
    return Math.min(window.devicePixelRatio || 1, GamePerf.getDprCap());
  }

  function invalidateBgCache() {
    bgCacheValid = false;
  }

  function rebuildBgCache() {
    if (!width || !height) return;
    if (!bgCache) bgCache = document.createElement('canvas');
    bgCache.width = Math.round(width * dpr);
    bgCache.height = Math.round(height * dpr);
    const cacheCtx = bgCache.getContext('2d');
    cacheCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const prevCtx = ctx;
    ctx = cacheCtx;
    drawCardboardBox();
    ctx = prevCtx;
    bgCacheValid = true;
  }

  function init(canvas) {
    ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    dpr = getDpr();
    
    // 별 이펙트 이미지 미리 로드
    for (let i = 1; i <= 12; i++) {
      const idx = i < 10 ? '0' + i : i;
      const img = new Image();
      img.src = `img/effects/star_fx_${idx}.png`;
      img.onerror = function() {
        console.warn(`Failed to load star effect image: effects/star_fx_${idx}.png`);
      };
      assets.starFx[i - 1] = img;
    }
    
    // 🎭 캐릭터 애니메이션 이미지 미리 로드 (3개 캐릭터 × 3 상태 × (3 + 5 + 3) 프레임)
    const characterNames = ['character01', 'character02', 'character03'];
    
    characterNames.forEach(charName => {
      // idle: 3프레임
      for (let i = 1; i <= 3; i++) {
        const idx = i < 10 ? '0' + i : i;
        const img = new Image();
        img.src = `img/characters/${charName}/idle/idle${idx}.png`;
        img.onerror = function() {
          console.error(`Failed to load character image: characters/${charName}/idle/idle${idx}.png`);
        };
        assets.characters[charName].idle[i - 1] = img;
      }
      
      // eat: 5프레임
      for (let i = 1; i <= 5; i++) {
        const idx = i < 10 ? '0' + i : i;
        const img = new Image();
        img.src = `img/characters/${charName}/eat/eat${idx}.png`;
        img.onerror = function() {
          console.error(`Failed to load character image: characters/${charName}/eat/eat${idx}.png`);
        };
        assets.characters[charName].eat[i - 1] = img;
      }
      
      // eat_no: 3프레임
      for (let i = 1; i <= 3; i++) {
        const idx = i < 10 ? '0' + i : i;
        const img = new Image();
        img.src = `img/characters/${charName}/eat_no/eat_no${idx}.png`;
        img.onerror = function() {
          console.error(`Failed to load character image: characters/${charName}/eat_no/eat_no${idx}.png`);
        };
        assets.characters[charName].eat_no[i - 1] = img;
      }
    });
    
    return ctx;
  }

  function resize(canvas, w, h) {
    width = w;
    height = h;
    dpr = getDpr();
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    invalidateBgCache();
  }

  function setAsset(name, img) {
    if (assets.hasOwnProperty(name)) {
      assets[name] = img;
      return;
    }
    const fxMatch = name.match(/^starFx_(\d+)$/);
    if (fxMatch) {
      const frameNum = parseInt(fxMatch[1], 10);
      if (frameNum >= 1 && frameNum <= 12) {
        assets.starFx[frameNum - 1] = img;
      }
    }
  }

  function strokePath(color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function clear() {
    if (!bgCacheValid) rebuildBgCache();
    if (bgCache) {
      ctx.drawImage(bgCache, 0, 0, width, height);
      return;
    }
    drawCardboardBox();
  }

  /* Palette + layer order mirror css/background.css (.screen-bg-*) */
  const CARDBOARD = {
    top: '#FAE5B8',
    light: '#F5DDB0',
    mid: '#E8C078',
    warm: '#D4A860',
    dark: '#B88040',
    deep: '#9A6830',
    glow: 'rgba(255, 228, 165, 0.82)',
    glowMid: 'rgba(255, 205, 130, 0.45)',
    glowEdge: 'rgba(255, 185, 110, 0.12)',
    cupLight: '#7EC8DC',
    cupMid: '#5AADC4',
    cupDark: '#4490A8',
    stamp: '#7A4E28',
  };

  function drawCardboardBox() {
    drawCardboardBase();
    drawCardboardRepeatingTexture();
    drawCardboardMainGlow();
    if (!GamePerf.isVeryLowEnd) drawCardboardCoreGlow();
    // Disable only the top blue glow layer.
    // if (!GamePerf.isLowEnd) drawCardboardCupGlow();
    drawCardboardMesh();
    drawCardboardTopFlap();
    if (!GamePerf.isLowEnd) {
      drawCardboardStamps();
      drawCardboardTape();
      drawCardboardCornerShade();
    }
    drawCardboardFloor();
    drawCardboardVignette();
    // Keep the top-cup function intact, but disable only this large blue sphere draw call.
    // if (!GamePerf.isVeryLowEnd) drawCardboardTopCup();
  }

  function drawEllipticalGlow(cx, cy, rx, ry, stops) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx / ry, 1);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
    stops.forEach(([pos, color]) => g.addColorStop(pos, color));
    ctx.fillStyle = g;
    ctx.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4);
    ctx.restore();
  }

  function drawCardboardBase() {
    ctx.fillStyle = CARDBOARD.mid;
    ctx.fillRect(0, 0, width, height);

    const base = ctx.createLinearGradient(width * 0.12, 0, width * 0.88, height);
    base.addColorStop(0, CARDBOARD.top);
    base.addColorStop(0.18, CARDBOARD.light);
    base.addColorStop(0.42, CARDBOARD.mid);
    base.addColorStop(0.68, CARDBOARD.warm);
    base.addColorStop(0.88, CARDBOARD.dark);
    base.addColorStop(1, CARDBOARD.deep);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
  }

  function drawCardboardRepeatingTexture() {
    const mobile = isTouchDevice();
    const yStep = GamePerf.isVeryLowEnd ? 8 : (mobile ? 5 : 3);
    const xStep = GamePerf.isVeryLowEnd ? 0 : (mobile ? 30 : 23);
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = 'rgba(139, 90, 40, 1)';
    ctx.lineWidth = 1;
    for (let y = 2; y < height; y += yStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    if (xStep > 0) {
      ctx.globalAlpha = 0.055;
      ctx.strokeStyle = 'rgba(160, 110, 45, 1)';
      for (let x = xStep; x < width; x += xStep + 1) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawCardboardMainGlow() {
    drawEllipticalGlow(width * 0.5, height * 0.36, width * 0.36, height * 0.29, [
      [0, CARDBOARD.glow],
      [0.28, CARDBOARD.glowMid],
      [0.52, CARDBOARD.glowEdge],
      [0.72, 'rgba(0, 0, 0, 0)'],
    ]);
  }

  function drawCardboardCoreGlow() {
    drawEllipticalGlow(width * 0.5, height * 0.32, width * 0.14, height * 0.11, [
      [0, 'rgba(255, 240, 190, 0.5)'],
      [0.55, 'rgba(255, 220, 160, 0.1)'],
      [1, 'rgba(0, 0, 0, 0)'],
    ]);
  }

  function drawCardboardCupGlow() {
    drawEllipticalGlow(width * 0.5, height * 0.045, width * 0.03, height * 0.025, [
      [0, 'rgba(126, 200, 220, 0.32)'],
      [0.45, 'rgba(90, 173, 196, 0.14)'],
      [0.72, 'rgba(0, 0, 0, 0)'],
    ]);
  }

  function drawCardboardMesh() {
    ctx.save();

    const left = ctx.createLinearGradient(0, 0, width * 0.16, 0);
    left.addColorStop(0, 'rgba(58, 36, 18, 0.36)');
    left.addColorStop(0.5, 'rgba(58, 36, 18, 0.14)');
    left.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = left;
    ctx.fillRect(0, 0, width, height);

    const right = ctx.createLinearGradient(width, 0, width * 0.86, 0);
    right.addColorStop(0, 'rgba(58, 36, 18, 0.32)');
    right.addColorStop(0.5, 'rgba(58, 36, 18, 0.12)');
    right.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = right;
    ctx.fillRect(0, 0, width, height);

    const vert = ctx.createLinearGradient(0, 0, 0, height);
    vert.addColorStop(0, 'rgba(52, 32, 16, 0.24)');
    vert.addColorStop(0.09, 'rgba(0, 0, 0, 0)');
    vert.addColorStop(0.86, 'rgba(0, 0, 0, 0)');
    vert.addColorStop(1, 'rgba(48, 28, 14, 0.28)');
    ctx.fillStyle = vert;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  function drawCardboardTopFlap() {
    const flapH = height * 0.1;
    ctx.save();
    const flap = ctx.createLinearGradient(0, 0, 0, flapH);
    flap.addColorStop(0, 'rgba(90, 55, 25, 0.34)');
    flap.addColorStop(0.55, 'rgba(110, 70, 35, 0.14)');
    flap.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = flap;
    ctx.fillRect(0, 0, width, flapH);
    ctx.strokeStyle = 'rgba(110, 70, 35, 0.26)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, flapH);
    ctx.lineTo(width, flapH);
    ctx.stroke();
    ctx.restore();
  }

  function drawCardboardCornerShade() {
    ctx.save();
    const corners = [
      { x0: 0, y0: 0, x1: width * 0.2, y1: height * 0.2, alpha: 0.18 },
      { x0: width, y0: 0, x1: width * 0.82, y1: height * 0.18, alpha: 0.16 },
      { x0: 0, y0: height, x1: width * 0.2, y1: height * 0.8, alpha: 0.2 },
      { x0: width, y0: height, x1: width * 0.83, y1: height * 0.83, alpha: 0.17 },
    ];
    corners.forEach(({ x0, y0, x1, y1, alpha }) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, `rgba(48, 28, 14, ${alpha})`);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    });
    ctx.restore();
  }

  function drawCardboardFloor() {
    const floorTop = height * 0.85;
    ctx.save();
    const floor = ctx.createLinearGradient(0, floorTop, 0, height);
    floor.addColorStop(0, 'rgba(0, 0, 0, 0)');
    floor.addColorStop(0.25, 'rgba(110, 70, 35, 0.16)');
    floor.addColorStop(1, 'rgba(80, 50, 25, 0.34)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, floorTop, width, height - floorTop);
    ctx.strokeStyle = 'rgba(110, 70, 35, 0.28)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, floorTop);
    ctx.lineTo(width, floorTop);
    ctx.stroke();
    ctx.restore();
  }

  function drawCardboardTopCup() {
    const cx = width * 0.5;
    const cy = height * 0.032;
    const r = Math.max(19, Math.min(width * 0.075, 29));

    ctx.save();
    const cup = ctx.createRadialGradient(cx - r * 0.16, cy - r * 0.22, 0, cx, cy, r);
    cup.addColorStop(0, CARDBOARD.cupLight);
    cup.addColorStop(0.48, CARDBOARD.cupMid);
    cup.addColorStop(1, CARDBOARD.cupDark);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = cup;
    ctx.fill();
    ctx.strokeStyle = 'rgba(68, 144, 168, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawCardboardTape() {
    const tapeW = width * 0.11;
    const tapeH = height * 0.09;
    const floorTop = height * 0.85;

    ctx.save();
    ctx.globalAlpha = 0.32;
    [[width * 0.025, floorTop - tapeH * 0.2], [width * 0.865, floorTop - tapeH * 0.2]].forEach(([x, y], i) => {
      ctx.save();
      ctx.translate(x + tapeW * 0.5, y + tapeH * 0.5);
      ctx.rotate(i === 0 ? -0.07 : 0.07);
      const tape = ctx.createLinearGradient(0, -tapeH * 0.5, 0, tapeH * 0.5);
      tape.addColorStop(0, 'rgba(190, 155, 100, 0.6)');
      tape.addColorStop(1, 'rgba(150, 115, 70, 0.5)');
      ctx.fillStyle = tape;
      ctx.fillRect(-tapeW * 0.5, -tapeH * 0.5, tapeW, tapeH);
      ctx.strokeStyle = 'rgba(110, 80, 45, 0.38)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-tapeW * 0.5, -tapeH * 0.5, tapeW, tapeH);
      ctx.restore();
    });
    ctx.restore();
  }

  function drawCardboardStamps() {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = CARDBOARD.stamp;
    ctx.fillStyle = CARDBOARD.stamp;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const lx = width * 0.07;
    let ly = height * 0.19;

    ctx.beginPath();
    ctx.arc(lx, ly, 11, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx, ly + 16);
    ctx.stroke();

    ly += 36;
    ctx.beginPath();
    ctx.moveTo(lx - 9, ly + 12);
    ctx.lineTo(lx, ly);
    ctx.lineTo(lx + 9, ly + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx - 9, ly + 22);
    ctx.lineTo(lx, ly + 10);
    ctx.lineTo(lx + 9, ly + 22);
    ctx.stroke();

    ly += 36;
    ctx.strokeRect(lx - 8, ly + 4, 16, 16);
    ctx.beginPath();
    ctx.moveTo(lx, ly + 4);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx - 5, ly + 14);
    ctx.lineTo(lx + 5, ly + 14);
    ctx.stroke();

    ctx.restore();
  }

  function drawCardboardVignette() {
    drawEllipticalGlow(width * 0.5, height * 0.4, width * 0.37, height * 0.31, [
      [0.18, 'rgba(0, 0, 0, 0)'],
      [1, 'rgba(48, 30, 14, 0.38)'],
    ]);
  }

  function drawSun() {
    const sx = width * 0.85;
    const sy = height * 0.1;
    const r = Math.min(width, height) * 0.06;

    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 220, 80, 0.35)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFE066';
    ctx.fill();
    strokePath('#F39C12', 3);

    ctx.fillStyle = '#FFF';
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(sx - r * 0.28, sy - r * 0.28, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCloud(cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.arc(30, 4, 22, 0, Math.PI * 2);
    ctx.arc(-28, 6, 20, 0, Math.PI * 2);
    ctx.arc(12, -12, 18, 0, Math.PI * 2);
    ctx.fill();
    strokePath('rgba(45,52,54,0.15)', 2);
    ctx.restore();
  }

  function drawClouds() {
    const clouds = [
      { x: 0.12, y: 0.1, s: 0.9 },
      { x: 0.45, y: 0.07, s: 1.1 },
      { x: 0.72, y: 0.13, s: 0.75 },
      { x: 0.3, y: 0.18, s: 0.65 }
    ];
    clouds.forEach((c, i) => {
      const drift = Math.sin(cloudOffset * 0.02 + i) * 8;
      drawCloud(width * c.x + drift, height * c.y, c.s);
    });
  }

  function drawHills() {
    const baseY = height * 0.68;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, baseY + 40);
    ctx.bezierCurveTo(width * 0.25, baseY - 20, width * 0.45, baseY + 60, width * 0.65, baseY + 10);
    ctx.bezierCurveTo(width * 0.85, baseY - 30, width, baseY + 30, width, baseY + 50);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = '#6BCB77';
    ctx.fill();
    strokePath('#3DA35D', 3);

    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, baseY + 80);
    ctx.bezierCurveTo(width * 0.3, baseY + 40, width * 0.6, baseY + 100, width, baseY + 70);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = '#4CAF50';
    ctx.fill();
    strokePath('#2E7D32', 3);
    ctx.restore();
  }

  function drawGrass() {
    const groundY = height * 0.82;
    const ground = ctx.createLinearGradient(0, groundY, 0, height);
    ground.addColorStop(0, '#7DCE82');
    ground.addColorStop(1, '#3DA35D');
    ctx.fillStyle = ground;
    ctx.fillRect(0, groundY, width, height - groundY);
    strokePath('#2E7D32', 3);
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    ctx.save();
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.35;
    for (let x = 8; x < width; x += 14) {
      const h = 6 + (x % 11);
      ctx.beginPath();
      ctx.moveTo(x, groundY + 2);
      ctx.quadraticCurveTo(x + 3, groundY - h, x + 6, groundY + 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAnchor(x, y) {
    ctx.save();
    ctx.translate(x, y);
    const lite = isTouchDevice();

    ctx.fillStyle = '#78909C';
    ctx.beginPath();
    ctx.arc(0, 5, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -8, 7.5, 0, Math.PI * 2);
    const ringGrad = ctx.createRadialGradient(-2, -10, 1, 0, -8, 7.5);
    ringGrad.addColorStop(0, lite ? '#CFD8DC' : '#ECEFF1');
    ringGrad.addColorStop(0.55, '#90A4AE');
    ringGrad.addColorStop(1, '#607D8B');
    ctx.fillStyle = ringGrad;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -8, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#37474F';
    ctx.fill();

    if (!lite) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(-2.5, -10.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRopePath(segs, color, width) {
    ctx.beginPath();
    ctx.moveTo(segs[0].p1.x, segs[0].p1.y);
    for (let i = 0; i < segs.length; i++) {
      ctx.lineTo(segs[i].p2.x, segs[i].p2.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawRope(rope) {
    if (!rope.active) return;
    const segs = rope.getSegments();
    if (segs.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawRopePath(segs, OUTLINE, 9);
    if (isTouchDevice()) {
      drawRopePath(segs, '#D4A055', 4.5);
      drawRopePath(segs, '#F0C878', 2);
    } else {
      drawRopePath(segs, '#8B5A2B', 6);
      drawRopePath(segs, '#C68642', 4.5);
      drawRopePath(segs, '#F0C878', 2.2);

      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.2;
      for (let i = 1; i < segs.length; i += 2) {
        const mx = (segs[i].p1.x + segs[i].p2.x) * 0.5;
        const my = (segs[i].p1.y + segs[i].p2.y) * 0.5;
        ctx.beginPath();
        ctx.moveTo(mx - 1.5, my - 1.5);
        ctx.lineTo(mx + 1.5, my + 1.5);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawObstacle(obs) {
    ctx.save();
    const r = 6;
    const type = obs.type || 'wood';
    const lite = isTouchDevice();

    if (type === 'spike') {
      ctx.fillStyle = '#546E7A';
      roundRect(ctx, obs.x, obs.y, obs.w, obs.h, 4);
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const spikes = Math.max(3, Math.floor(obs.w / 14));
      const spikeW = obs.w / spikes;
      for (let i = 0; i < spikes; i++) {
        const sx = obs.x + i * spikeW;
        const tipX = sx + spikeW * 0.5;
        const tipY = obs.y - obs.h * 1.45;
        const spikeGrad = ctx.createLinearGradient(tipX, tipY, tipX, obs.y);
        spikeGrad.addColorStop(0, lite ? '#FF8A80' : '#FFEBEE');
        spikeGrad.addColorStop(0.35, '#EF5350');
        spikeGrad.addColorStop(1, '#C62828');
        ctx.beginPath();
        ctx.moveTo(sx, obs.y);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(sx + spikeW, obs.y);
        ctx.closePath();
        ctx.fillStyle = spikeGrad;
        ctx.fill();
        ctx.strokeStyle = '#B71C1C';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (type === 'ice') {
      const iceGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y + obs.h);
      iceGrad.addColorStop(0, lite ? '#E1F5FE' : '#F0FAFF');
      iceGrad.addColorStop(0.45, '#81D4FA');
      iceGrad.addColorStop(1, '#29B6F6');
      ctx.fillStyle = iceGrad;
      roundRect(ctx, obs.x, obs.y, obs.w, obs.h, r);
      ctx.fill();
      ctx.strokeStyle = '#0288D1';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      roundRect(ctx, obs.x + 4, obs.y + 3, obs.w * 0.42, obs.h * 0.32, 4);
      ctx.fill();

      if (!lite) {
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.5;
        for (let i = obs.x + 10; i < obs.x + obs.w - 6; i += 14) {
          ctx.beginPath();
          ctx.moveTo(i, obs.y + 5);
          ctx.lineTo(i + 5, obs.y + obs.h - 5);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(180,230,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.w * 0.7, obs.y + 4);
        ctx.lineTo(obs.x + obs.w - 4, obs.y + obs.h * 0.35);
        ctx.lineTo(obs.x + obs.w * 0.55, obs.y + obs.h - 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (type === 'bounce') {
      const padGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
      padGrad.addColorStop(0, '#F48FB1');
      padGrad.addColorStop(0.5, '#E040FB');
      padGrad.addColorStop(1, '#8E24AA');
      ctx.fillStyle = padGrad;
      roundRect(ctx, obs.x, obs.y, obs.w, obs.h, r);
      ctx.fill();
      ctx.strokeStyle = '#6A1B9A';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = lite ? 1.5 : 2;
      const coils = lite ? 3 : 5;
      for (let i = 0; i < coils; i++) {
        const sx = obs.x + obs.w * ((i + 0.5) / coils);
        ctx.beginPath();
        ctx.arc(sx, obs.y + obs.h * 0.42, obs.h * 0.24, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!lite) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        roundRect(ctx, obs.x + 4, obs.y + 3, obs.w - 8, obs.h * 0.28, 4);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (type === 'stone') {
      const stoneGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
      stoneGrad.addColorStop(0, '#B0BEC5');
      stoneGrad.addColorStop(0.55, '#78909C');
      stoneGrad.addColorStop(1, '#546E7A');
      ctx.fillStyle = stoneGrad;
      roundRect(ctx, obs.x, obs.y, obs.w, obs.h, r);
      ctx.fill();
      ctx.strokeStyle = '#455A64';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      roundRect(ctx, obs.x + 3, obs.y + 3, obs.w * 0.55, obs.h * 0.28, 4);
      ctx.fill();

      if (!lite) {
        ctx.fillStyle = 'rgba(69,90,100,0.25)';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.w * 0.72, obs.y + obs.h * 0.62, obs.w * 0.12, obs.h * 0.22, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    const plankN = lite ? 2 : 3;
    const plankW = obs.w / plankN;
    for (let p = 0; p < plankN; p++) {
      const px = obs.x + p * plankW;
      const plankGrad = ctx.createLinearGradient(px, obs.y, px, obs.y + obs.h);
      plankGrad.addColorStop(0, '#F5D08A');
      plankGrad.addColorStop(0.45, '#D4A055');
      plankGrad.addColorStop(1, '#9A6828');
      roundRect(ctx, px + 1.5, obs.y + 1, plankW - 3, obs.h - 2, p === 0 || p === plankN - 1 ? r : 3);
      ctx.fillStyle = plankGrad;
      ctx.fill();
      if (!lite && p === 1) {
        ctx.fillStyle = 'rgba(120,70,20,0.18)';
        ctx.beginPath();
        ctx.ellipse(px + plankW * 0.5, obs.y + obs.h * 0.55, plankW * 0.12, obs.h * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    roundRect(ctx, obs.x, obs.y, obs.w, obs.h, r);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (!lite) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      roundRect(ctx, obs.x + 3, obs.y + 3, obs.w - 6, obs.h * 0.22, 3);
      ctx.fill();
    }

    if (obs.move) {
      ctx.fillStyle = '#5D4037';
      ctx.font = '600 11px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('↔', obs.x + obs.w * 0.5, obs.y - 6);
    }
    ctx.restore();
  }

  function drawWindZone(wind, time) {
    ctx.save();
    ctx.fillStyle = 'rgba(120, 200, 255, 0.12)';
    roundRect(ctx, wind.x, wind.y, wind.w, wind.h, 8);
    ctx.fill();
    strokePath('rgba(91, 192, 235, 0.45)', 2);

    const mobile = isTouchDevice();
    const dir = wind.forceX >= 0 ? 1 : -1;
    const rows = mobile ? 2 : 3;
    const spacing = mobile ? 36 : 28;
    for (let row = 0; row < rows; row++) {
      const y = wind.y + wind.h * (0.25 + row * (mobile ? 0.35 : 0.25));
      const offset = ((time * 120 * dir) + row * 18) % (wind.w + 30);
      for (let x = wind.x - 20 + offset; x < wind.x + wind.w + 10; x += spacing) {
        ctx.strokeStyle = 'rgba(91, 192, 235, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 14 * dir, y);
        ctx.lineTo(x + 10 * dir, y - 4);
        ctx.moveTo(x + 14 * dir, y);
        ctx.lineTo(x + 10 * dir, y + 4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawSoapBubble(x, y, radius, lite, time) {
    ctx.save();
    const t = time || 0;

    const aura = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius * 1.2);
    aura.addColorStop(0, 'rgba(160,220,255,0.2)');
    aura.addColorStop(1, 'rgba(160,220,255,0)');
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.15, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();

    const bubbleGrad = ctx.createRadialGradient(
      x - radius * 0.35, y - radius * 0.35, radius * 0.04,
      x, y, radius
    );
    bubbleGrad.addColorStop(0, 'rgba(255,255,255,0.62)');
    bubbleGrad.addColorStop(0.4, 'rgba(190,240,255,0.3)');
    bubbleGrad.addColorStop(1, 'rgba(120,200,255,0.1)');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = bubbleGrad;
    ctx.fill();

    if (!lite) {
      const rimColors = ['rgba(255,160,200,0.4)', 'rgba(140,255,210,0.35)', 'rgba(190,150,255,0.35)'];
      rimColors.forEach((col, i) => {
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.97, t * 0.7 + i * 2.1, t * 0.7 + i * 2.1 + 1.1);
        ctx.strokeStyle = col;
        ctx.lineWidth = radius * 0.07;
        ctx.stroke();
      });
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(80,170,230,0.7)';
    ctx.lineWidth = lite ? 2 : 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x - radius * 0.28, y - radius * 0.32, radius * 0.24, radius * 0.15, -0.55, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + radius * 0.22, y + radius * 0.2, radius * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();

    ctx.restore();
  }

  function drawBubbleZone(bubble, time) {
    if (bubble.popped) return;
    drawSoapBubble(bubble.x, bubble.y, bubble.radius, isTouchDevice(), time);
  }

  function drawCandyBubble(candy, time) {
    if (!candy.inBubble) return;
    drawSoapBubble(candy.x, candy.y, candy.radius * 1.85, isTouchDevice(), time);
  }

  function drawJellyCandy(r, lite, time) {
    const pulse = (lite || GamePerf.isLowEnd) ? 1 : 1 + Math.sin((time || 0) * 4) * 0.018;

    ctx.save();
    ctx.scale(pulse, pulse);

    ctx.beginPath();
    ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const jelly = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.06, r * 0.06, r * 0.1, r * 1.05);
    jelly.addColorStop(0, '#FFE082');
    jelly.addColorStop(0.32, '#FF7043');
    jelly.addColorStop(0.62, '#F4511E');
    jelly.addColorStop(1, '#BF360C');
    ctx.fillStyle = jelly;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
    ctx.clip();

    ctx.lineWidth = r * (lite ? 0.24 : 0.18);
    ctx.lineCap = 'round';
    if (lite) {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.52, -0.7, 1.1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,224,102,0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0.6, 2.3);
      ctx.stroke();
    } else if (GamePerf.isLowEnd) {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      for (let deg = 0; deg <= 360; deg += 12) {
        const rad = (deg / 360) * r * 0.75;
        const ang = (deg * Math.PI) / 180;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (deg === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else {
      ctx.beginPath();
      for (let deg = 0; deg <= 540; deg += 5) {
        const rad = (deg / 540) * r * 0.88;
        const ang = (deg * Math.PI) / 180;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (deg === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.58)';
      ctx.stroke();

      ctx.beginPath();
      for (let deg = 36; deg <= 540; deg += 5) {
        const rad = (deg / 540) * r * 0.88;
        const ang = (deg * Math.PI) / 180;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (deg === 36) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(255,224,102,0.88)';
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(-r * 0.28, -r * 0.32, r * 0.34, r * 0.24, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = lite ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.72)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.4, r * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  function drawCandy(candy, time) {
    // 🍬 사탕 먹기 성공 시 즉시 화면에서 숨김
    if (candy.collected) return;

    if (candy.loseAnim && candy.shatter && (candy.shatterT || 0) > 0.06) {
      drawCandyShatter(candy);
      if ((candy.loseAlpha || 0) <= 0.05) return;
    }

    const showEat = candy.collected && candy.eatVisible;
    const showLose = candy.loseAnim && candy.loseVisible;
    if (candy.destroyed && !showEat && !showLose) return;
    if (candy.collected && !candy.eatVisible) return;
    if (candy.loseAnim && !candy.loseVisible && !candy.shatter) return;

    const drawX = showEat ? candy.drawX : (showLose ? (candy.loseX ?? candy.x) : candy.x);
    const drawY = showEat ? candy.drawY : (showLose ? (candy.loseY ?? candy.y) : candy.y);
    const scale = showEat ? (candy.drawScale || 1) : 1;
    const r = candy.radius * scale;
    const angle = showEat ? (candy.drawAngle ?? candy.angle ?? 0) : (candy.angle || 0);
    const alpha = showEat ? 1 : (candy.loseAlpha ?? 1);
    const grey = candy.greyOut || 0;

    if (!candy.collected && !candy.loseAnim) drawCandyBubble(candy, time);
    if (r < 1.5) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    if (grey > 0) {
      if (GamePerf.isLowEnd) {
        ctx.globalAlpha = alpha * (1 - grey * 0.35);
      } else {
        ctx.filter = `grayscale(${grey}) brightness(${1 - grey * 0.25})`;
      }
    }

    if (assets.candy) {
      ctx.translate(drawX, drawY);
      ctx.rotate(angle);
      ctx.drawImage(assets.candy, -r, -r, r * 2, r * 2);
      ctx.restore();
      return;
    }

    ctx.translate(drawX, drawY);
    ctx.rotate(angle);

    if (!candy.collected && !candy.loseAnim) {
      ctx.save();
      ctx.translate(0, candy.radius * 0.55);
      ctx.scale(1, 0.26);
      ctx.beginPath();
      ctx.arc(0, 0, candy.radius * 0.88, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(40,20,10,0.16)';
      ctx.fill();
      ctx.restore();
    }

    drawJellyCandy(r, isTouchDevice(), time);

    ctx.restore();
  }

  function drawCandyShatter(candy) {
    const t = candy.shatterT || 0;
    const x = candy.loseX ?? candy.x;
    const y = candy.loseY ?? candy.y;
    const r = candy.radius;
    const lite = isTouchDevice();
    const pieces = lite ? 6 : 9;
    const alpha = Math.max(0, 1 - t * 1.1);
    const shardColors = ['#FFE082', '#FF7043', '#FFAB91', '#FFF8E1'];

    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < pieces; i++) {
      const a = (i / pieces) * Math.PI * 2 + t * 2.2;
      const dist = r * (0.18 + t * 1.15);
      const px = x + Math.cos(a) * dist;
      const py = y + Math.sin(a) * dist + t * r * 0.45;
      const pr = r * (0.16 - t * 0.07);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a + t * 3);
      ctx.fillStyle = shardColors[i % shardColors.length];
      ctx.beginPath();
      ctx.moveTo(0, -Math.max(2, pr));
      ctx.lineTo(Math.max(2, pr) * 0.8, Math.max(2, pr) * 0.4);
      ctx.lineTo(-Math.max(2, pr) * 0.6, Math.max(2, pr) * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawStar(star, time) {
    if (!window.myStar) {
        window.myStar = new Image();
        window.myStar.src = "img/props/star.png";
        assets.star = window.myStar;
    }
    
    if (star.collected) return;

    const r = star.radius;
    const t = time || 0;
    const lite = isTouchDevice();
    const pulse = 1 + Math.sin(t * 2 + star.angle) * 0.03
    ;

    ctx.save();
    ctx.translate(star.x, star.y);
    //ctx.rotate(star.angle);
    ctx.scale(pulse, pulse);

    if (assets.star) {
      ctx.drawImage(assets.star, -r, -r, r * 3, r * 3);
      ctx.restore();
      return;
    }

    if (!lite) {
      ctx.shadowColor = '#FFD54F';
      ctx.shadowBlur = 6 + Math.sin(t * 4) * 3;
    }

    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.75);
    glow.addColorStop(0, 'rgba(255,213,79,0.45)');
    glow.addColorStop(1, 'rgba(255,213,79,0)');
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.65, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    drawStarShape(ctx, 0, 0, 5, r + 3, (r + 3) * 0.48, OUTLINE, null);

    const starGrad = ctx.createLinearGradient(-r, -r, r, r);
    starGrad.addColorStop(0, '#FFF9C4');
    starGrad.addColorStop(0.4, '#FFD54F');
    starGrad.addColorStop(0.75, '#FFB300');
    starGrad.addColorStop(1, '#FF8F00');
    drawStarShape(ctx, 0, 0, 5, r, r * 0.48, starGrad, '#E65100');

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.16, r * 0.17, 0, Math.PI * 2);
    ctx.fill();

    if (!lite) {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + t * 2.2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35);
        ctx.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawStarEffect(star, worldTime) {
    // Lazy load star effect images on first call
    if (!starFxLoadingStarted) {
      starFxLoadingStarted = true;
      for (let i = 1; i <= 12; i++) {
        const idx = i < 10 ? '0' + i : i;
        const img = new Image();
        img.src = `img/effects/star_fx_${idx}.png`;
        img.onerror = function() {
          console.warn(`Failed to load star effect image: effects/star_fx_${idx}.png`);
        };
        assets.starFx[i - 1] = img;
      }
    }

    if (!star.fxActive) return;
    
    const elapsed = worldTime - star.fxStartTime;
    if (elapsed < 0) return;
    
    const frameIndex = Math.floor(elapsed * STAR_FX_FPS);
    if (frameIndex >= STAR_FX_FRAME_COUNT) return;
    
    const img = assets.starFx[frameIndex];
    if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return;
    
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const referenceSize = star.radius * 2 * STAR_FX_REFERENCE_SIZE * STAR_FX_SCALE;
    const displayWidth = referenceSize * aspectRatio;
    const displayHeight = referenceSize;
    
    ctx.save();
    ctx.translate(
      star.x + STAR_FX_OFFSET_X,
      star.y + STAR_FX_OFFSET_Y
    );
    
    ctx.drawImage(
      img,
      -displayWidth / 2,
      -displayHeight / 2,
      displayWidth,
      displayHeight
    );
    
    ctx.restore();
  }

  function drawEffects(world) {
    // 안전장치: world.effects가 배열인지, 비어있지 않은지 확인
    if (!Array.isArray(world.effects) || world.effects.length === 0) return;
    
    for (let i = world.effects.length - 1; i >= 0; i--) {
      const effect = world.effects[i];
      
      if (effect.type !== 'star') continue;
      
      const elapsed = world.time - effect.startTime;
      
      // elapsed < 0: 이전 레벨 데이터 또는 시간 동기화 오류
      // 이 경우 배열에서 즉시 제거
      if (elapsed < 0) {
        world.effects.splice(i, 1);
        continue;
      }
      
      const frameIndex = Math.floor(elapsed * STAR_FX_FPS);
      if (frameIndex >= STAR_FX_FRAME_COUNT) {
        world.effects.splice(i, 1);
        continue;
      }
      
      const img = assets.starFx[frameIndex];
      if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) continue;
      
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const referenceSize = effect.radius * 2 * STAR_FX_REFERENCE_SIZE * STAR_FX_SCALE;
      const displayWidth = referenceSize * aspectRatio * 1.3;
      const displayHeight = referenceSize * 1.3;
      
      ctx.save();
      ctx.translate(
        effect.x + STAR_FX_OFFSET_X,
        effect.y + STAR_FX_OFFSET_Y
      );
      
      ctx.drawImage(
        img,
        -displayWidth / 2,
        -displayHeight / 2,
        displayWidth,
        displayHeight
      );
      
      ctx.restore();
    }
  }

  function drawStarShape(c, cx, cy, spikes, outerR, innerR, fill, stroke) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    c.beginPath();
    c.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      c.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      c.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 2;
      c.lineJoin = 'round';
      c.stroke();
    }
  }

  const MOMO = {
    skinHi: '#FFEDE0',
    skin: '#FFB899',
    skinMid: '#FF9878',
    skinSh: '#E86E52',
    belly: '#FFFBF7',
    blush: 'rgba(255, 100, 120, 0.45)',
    iris: '#6B4FA8',
    irisHi: '#A888D8',
    nose: '#E89078',
  };

  function drawMomoBody(r, lite) {
    ctx.beginPath();
    ctx.ellipse(0, r * 0.02, r + 3.5, r * 0.92 + 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, r * 0.02, r, r * 0.88, 0, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(-r * 0.26, -r * 0.34, r * 0.04, 0, r * 0.04, r * 1.1);
    bodyGrad.addColorStop(0, MOMO.skinHi);
    bodyGrad.addColorStop(0.32, MOMO.skin);
    bodyGrad.addColorStop(0.62, MOMO.skinMid);
    bodyGrad.addColorStop(1, MOMO.skinSh);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    if (!lite) {
      ctx.beginPath();
      ctx.ellipse(-r * 0.2, -r * 0.24, r * 0.2, r * 0.12, -0.45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.ellipse(0, r * 0.18, r * 0.48, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fillStyle = MOMO.belly;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, r * 0.2, r * 0.38, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 220, 200, 0.35)';
    ctx.fill();
  }

  function drawMomoNose(r) {
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.065, r * 0.048, 0, 0, Math.PI * 2);
    ctx.fillStyle = MOMO.nose;
    ctx.fill();
  }

  function drawOmNom(omNom, candy, time, world) {
    const r = omNom.radius;
    const open = omNom.mouthOpen || 0;
    const faceDir = omNom.faceDir || 1;
    const excited = omNom.excited || 0;
    const blink = omNom.blink || 0;
    const t = time || 0;
    const lite = isTouchDevice();
    const lookX = omNom.lookX ?? 0;
    const lookY = omNom.lookY ?? 0;
    const eating = omNom.eating && candy.collected;
    const sad = omNom.sad;
    const happy = omNom.happy || 0;
    const cheekSquish = omNom.cheekSquish || 0;
    const et = omNom.eatTime || 0;
    const st = omNom.sadTime || 0;
    const slouch = omNom.slouch || 0;
    const sadAmt = omNom.sadAmount || 0;

    // 🎭 현재 레벨에 맞는 캐릭터 선택
    const characterKey = world && world.levelIndex !== undefined 
      ? getCharacterKeyForLevel(world.levelIndex)
      : 'character01';  // 폴백
    
    // 🎭 캐릭터 PNG 애니메이션 렌더링
    const animState = getCharacterAnimationState(omNom);
    const characterSet = assets.characters[characterKey];
    const frames = characterSet ? characterSet[animState] : null;
    
    if (frames && frames.length > 0) {
      const frameIdx = getCharacterFrameIndex(animState, omNom, t);
      const img = frames[frameIdx];
      
      // 폴백: 현재 캐릭터의 이미지가 없으면 character01로 시도
      let fallbackImg = null;
      if (!img || !img.complete || !img.naturalWidth) {
        if (characterKey !== 'character01') {
          const fallbackSet = assets.characters['character01'];
          if (fallbackSet && fallbackSet[animState] && fallbackSet[animState][frameIdx]) {
            fallbackImg = fallbackSet[animState][frameIdx];
          }
        }
      }
      
      const displayImg = (img && img.complete && img.naturalWidth > 0) ? img : fallbackImg;
      if (displayImg && displayImg.complete && displayImg.naturalWidth > 0) {
        const drawWidth = r * 2 * CHARACTER_SCALE;
        const drawHeight = r * 2 * CHARACTER_SCALE;
        const drawX = omNom.x - drawWidth / 2 + CHARACTER_OFFSET_X;
        const drawY = omNom.y - drawHeight / 2 + CHARACTER_OFFSET_Y;
        ctx.drawImage(displayImg, drawX, drawY, drawWidth, drawHeight);
        return;
      }
    }

    if (assets.omNom) {
      ctx.drawImage(assets.omNom, omNom.x - r, omNom.y - r, r * 2, r * 2);
      return;
    }

    const idleBob = (eating || sad) ? 0 : Math.sin(t * 3.8) * r * 0.065;
    const chewBounce = eating && et > 0.48 ? Math.sin((et - 0.48) * 7.5) * r * 0.045 : 0;
    const sadSway = sad ? Math.sin(st * 2.2) * r * 0.018 * sadAmt : 0;
    const squash = 1 + excited * 0.045 + (eating ? cheekSquish * 0.8 : 0) - slouch * 0.04;
    const stretch = 1 - excited * 0.028 - (eating ? cheekSquish * 0.45 : 0) - slouch * 0.07;
    const earDroop = sad ? slouch * 0.35 : 0;

    // 벡터 그래픽 폴백 (캐릭터 PNG 없을 때)
    ctx.save();
    ctx.translate(omNom.x + sadSway, omNom.y + idleBob + chewBounce + slouch * r * 0.1);

    if (!lite && !eating && !sad) {
      ctx.save();
      ctx.scale(1.12, 0.2);
      ctx.beginPath();
      ctx.arc(0, r * 2.7, r * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(45, 28, 15, 0.12)';
      ctx.fill();
      ctx.restore();
    }

    ctx.scale(faceDir * squash, stretch);

    drawMomoEar(-r * 0.56, -r * 0.5, r * 0.31, t, -1, lite, earDroop);
    drawMomoEar(r * 0.56, -r * 0.5, r * 0.31, t, 1, lite, earDroop);
    drawMomoFoot(-r * 0.34, r * 0.7, r * 0.19, lite);
    drawMomoFoot(r * 0.34, r * 0.7, r * 0.19, lite);
    drawMomoBody(r, lite && !sad);
    drawMomoTuft(r, t, lite);

    ctx.fillStyle = sad
      ? `rgba(180, 200, 230, ${0.25 + sadAmt * 0.2})`
      : `rgba(255, 90, 110, ${eating ? 0.55 + cheekSquish * 1.2 : 0.32 + excited * 0.22})`;
    const blushW = r * (sad ? 0.1 : 0.12 + cheekSquish * 0.35);
    const blushH = r * (sad ? 0.07 : 0.08 + cheekSquish * 0.25);
    ctx.beginPath();
    ctx.ellipse(-r * 0.44, r * 0.15, blushW, blushH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.44, r * 0.15, blushW, blushH, 0, 0, Math.PI * 2);
    ctx.fill();

    drawMomoNose(r);

    if (eating && happy > 0.35) {
      drawMomoHappyEyes(-r * 0.29, -r * 0.05, r * 0.26, happy);
      drawMomoHappyEyes(r * 0.29, -r * 0.05, r * 0.26, happy);
    } else if (sad && sadAmt > 0.2) {
      drawMomoSadEyes(-r * 0.29, -r * 0.04, r * 0.26, sadAmt);
      drawMomoSadEyes(r * 0.29, -r * 0.04, r * 0.26, sadAmt);
      drawMomoTears(r, st, lite, sadAmt);
    } else {
      drawMomoEye(-r * 0.29, -r * 0.06, r * 0.26, lookX, lookY, blink, excited, lite);
      drawMomoEye(r * 0.29, -r * 0.06, r * 0.26, lookX, lookY, blink, excited, lite);
    }

    if (sad) {
      drawMomoSadMouth(r, sadAmt);
    } else {
      drawMomoMouth(open, r, excited, t, lite, eating);
    }

    if (eating && open > 0.35) {
      drawMomoChewHands(r, t, lite);
    } else if (sad && sadAmt > 0.35) {
      drawMomoSadHands(r, st, lite);
    } else if (excited > 0.3 && open < 0.2) {
      drawMomoArm(-r * 0.74, r * 0.06, r * 0.2, -0.85 - excited * 0.3, t, lite);
      drawMomoArm(r * 0.74, r * 0.06, r * 0.2, 0.85 + excited * 0.3, t, lite);
    }

    if (eating) {
      drawMomoEatFX(r, et, lite);
    } else if (sad) {
      drawMomoSadFX(r, st, lite);
    } else if (open > 0.4) {
      drawMomoJoy(r, t, lite);
    }

    ctx.restore();
  }

  function drawMomoSadEyes(ex, ey, eyeR, sadAmt) {
    ctx.save();
    ctx.translate(ex, ey);
    ctx.beginPath();
    ctx.arc(0, 0, eyeR + 2, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = MOMO.iris;
    ctx.beginPath();
    ctx.arc(0, eyeR * 0.12, eyeR * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -eyeR * 0.08, eyeR * 0.42 * sadAmt, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  }

  function drawMomoSadMouth(r, sadAmt) {
    const mouthY = r * 0.34;
    const w = r * (0.18 + sadAmt * 0.06);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, mouthY + w * 0.35, w, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  function drawMomoTears(r, st, lite, sadAmt) {
    ctx.save();
    ctx.globalAlpha = sadAmt;
    const drops = lite ? 1 : 2;
    for (let i = 0; i < drops; i++) {
      const side = i === 0 ? -1 : 1;
      const fall = (st * 1.4 + i * 0.3) % 1;
      ctx.fillStyle = '#7EC8F0';
      ctx.beginPath();
      ctx.ellipse(side * r * 0.34, r * 0.08 + fall * r * 0.35, r * 0.045, r * 0.065, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMomoSadHands(r, st, lite) {
    const droop = 0.4 + Math.sin(st * 2) * 0.08;
    drawMomoArm(-r * 0.48, r * 0.35, r * 0.14, droop, st, lite);
    drawMomoArm(r * 0.48, r * 0.35, r * 0.14, -droop, st, lite);
  }

  function drawMomoSadFX(r, st, lite) {
    if (st < 0.35 || st > 1.2) return;
    ctx.save();
    ctx.globalAlpha = Math.min(0.7, (st - 0.35) * 0.8);
    ctx.font = `600 ${Math.round(r * 0.5)}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7EC8F0';
    ctx.fillText('…', 0, -r * 0.92 + Math.sin(st * 3) * r * 0.04);
    ctx.restore();
  }

  function drawMomoHappyEyes(ex, ey, eyeR, happy) {
    ctx.save();
    ctx.translate(ex, ey);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const curve = eyeR * 0.55 * happy;
    ctx.beginPath();
    ctx.arc(0, eyeR * 0.05, curve, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.restore();
  }

  function drawMomoChewHands(r, time, lite) {
    const wiggle = Math.sin(time * 9) * 0.12;
    drawMomoArm(-r * 0.52, r * 0.22, r * 0.15, -0.55 + wiggle, time, lite);
    drawMomoArm(r * 0.52, r * 0.22, r * 0.15, 0.55 - wiggle, time, lite);
  }

  function drawMomoEatFX(r, et, lite) {
    ctx.save();
    if (et > 0.28 && et < 0.42) {
      ctx.globalAlpha = 1 - (et - 0.28) / 0.14;
      ctx.fillStyle = '#FFE066';
      for (let i = 0; i < (lite ? 3 : 5); i++) {
        const a = (i / 5) * Math.PI * 2 + et * 8;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.75, -r * 0.55 + Math.sin(a) * r * 0.35, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (et > 0.52) {
      const crumbs = lite ? 2 : 3;
      for (let i = 0; i < crumbs; i++) {
        const phase = et * 6 + i * 2.1;
        ctx.globalAlpha = 0.35 + Math.abs(Math.sin(phase)) * 0.35;
        ctx.fillStyle = i % 2 === 0 ? '#FF7070' : '#FFE066';
        ctx.beginPath();
        ctx.arc(
          (i - 1) * r * 0.22,
          r * 0.48 + Math.sin(phase) * r * 0.04,
          r * 0.035,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawMomoTuft(r, time, lite) {
    const sway = Math.sin(time * 2.6) * r * 0.025;
    ctx.save();
    ctx.translate(sway, -r * 0.72);
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = MOMO.skinHi;
    ctx.beginPath();
    ctx.arc(0, r * 0.01, r * 0.085, 0, Math.PI * 2);
    ctx.fill();
    if (!lite) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.14);
      ctx.lineTo(r * 0.04, -r * 0.04);
      ctx.lineTo(-r * 0.04, -r * 0.04);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMomoFoot(x, y, size, lite) {
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.64, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.05, size * 0.52, size * 0.32, 0, 0, Math.PI * 2);
    const footGrad = ctx.createLinearGradient(x, y - size, x, y + size);
    footGrad.addColorStop(0, MOMO.skin);
    footGrad.addColorStop(1, MOMO.skinSh);
    ctx.fillStyle = lite ? MOMO.skinMid : footGrad;
    ctx.fill();
    if (!lite) {
      ctx.fillStyle = 'rgba(45, 30, 20, 0.2)';
      ctx.beginPath();
      ctx.arc(x - size * 0.18, y - size * 0.02, size * 0.08, 0, Math.PI * 2);
      ctx.arc(x + size * 0.18, y - size * 0.02, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawMomoEar(x, y, size, time, side, lite, droop) {
    droop = droop || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(side * (-0.2 + Math.sin(time * 3.2 + side) * 0.1) + droop * side * 0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.52, size, -0.18 * side, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, size * 0.04, size * 0.4, size * 0.8, -0.18 * side, 0, Math.PI * 2);
    ctx.fillStyle = lite ? MOMO.skin : MOMO.skinSh;
    ctx.fill();
    if (!lite) {
      ctx.beginPath();
      ctx.ellipse(0, size * 0.1, size * 0.2, size * 0.38, -0.18 * side, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 170, 195, 0.7)';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMomoEye(ex, ey, eyeR, lookX, lookY, blink, excited, lite) {
    const track = eyeR * (0.26 + excited * 0.1);
    const px = lookX * track;
    const py = lookY * track;
    const blinkScale = blink > 0 ? Math.max(0.08, 1 - blink * 1.12) : 1;

    ctx.save();
    ctx.translate(ex, ey);
    ctx.scale(1, blinkScale);

    ctx.beginPath();
    ctx.arc(0, 0, eyeR + 2, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    if (lite) {
      ctx.beginPath();
      ctx.arc(px, py, eyeR * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = MOMO.iris;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px - eyeR * 0.08, py - eyeR * 0.12, eyeR * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    } else {
      const iris = ctx.createRadialGradient(px - eyeR * 0.08, py - eyeR * 0.1, 0, px, py, eyeR * 0.55);
      iris.addColorStop(0, MOMO.irisHi);
      iris.addColorStop(0.55, MOMO.iris);
      iris.addColorStop(1, '#3D2868');
      ctx.beginPath();
      ctx.arc(px, py, eyeR * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = iris;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + eyeR * 0.1, py - eyeR * 0.08, eyeR * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a2e';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px - eyeR * 0.1, py - eyeR * 0.16, eyeR * 0.13, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    if (excited > 0.45 && !lite) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -eyeR * 1.02, eyeR * 0.32, Math.PI * 0.12, Math.PI * 0.88);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawMomoMouth(open, r, excited, time, lite, eating) {
    const mouthY = r * 0.32;
    const mouthW = r * (0.2 + excited * 0.07) + open * r * 0.42;
    const mouthH = r * (0.09 + excited * 0.03) + open * r * 0.36;

    if (!eating && open < 0.22) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, mouthY, mouthW, 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.stroke();
      return;
    }

    if (eating && open > 0.5) {
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, mouthY - mouthH * 0.35, mouthW * 0.85, mouthH * 0.35, 0, Math.PI, 0);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.ellipse(0, mouthY, mouthW + 1.5, mouthH + 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, mouthY, mouthW, mouthH, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3d2220';
    ctx.fill();

    if (open > 0.35 && eating && !lite) {
      ctx.fillStyle = '#FFF8F0';
      const toothY = mouthY - mouthH * 0.15;
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.arc(i * mouthW * 0.28, toothY, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.beginPath();
    ctx.ellipse(0, mouthY + mouthH * 0.22, mouthW * 0.72, open * r * 0.17, 0, 0, Math.PI);
    ctx.fillStyle = '#FF7090';
    ctx.fill();

    if (open > 0.25 && !lite) {
      ctx.beginPath();
      ctx.ellipse(0, mouthY + mouthH * 0.48, mouthW * 0.38, open * r * 0.11, 0, 0, Math.PI);
      ctx.fillStyle = '#FF9BB5';
      ctx.fill();
    }
  }

  function drawMomoArm(x, y, armR, angle, time, lite) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.sin(time * 7) * 0.12);
    ctx.beginPath();
    ctx.ellipse(0, armR * 0.48, armR * 0.38, armR * 0.92, 0, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, armR * 0.48, armR * 0.3, armR * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = MOMO.skin;
    ctx.fill();
    if (!lite) {
      ctx.beginPath();
      ctx.arc(0, armR * 0.98, armR * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = MOMO.skinHi;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMomoJoy(r, time, lite) {
    ctx.save();
    ctx.globalAlpha = lite ? 0.75 : 1;
    const sparks = lite
      ? [[-r * 0.8, -r * 0.5], [r * 0.75, -r * 0.45]]
      : [[-r * 0.9, -r * 0.52, 0], [r * 0.85, -r * 0.42, 1.4], [0, -r * 0.88, 2.2]];
    sparks.forEach((s) => {
      const pulse = lite ? 1 : 0.65 + Math.sin(time * 9 + (s[2] || 0)) * 0.35;
      ctx.fillStyle = '#FFE066';
      ctx.beginPath();
      ctx.arc(s[0], s[1], r * 0.055 * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawCutLine(points, alpha) {
    if (points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    if (!isTouchDevice()) {
      ctx.shadowColor = '#FFE066';
      ctx.shadowBlur = 10;
    }
    ctx.stroke();

    ctx.restore();
  }

  function drawWorld(world, cutPoints) {
    clear();

    world.anchors.forEach(a => drawAnchor(a.x, a.y));
    (world.winds || []).forEach(w => drawWindZone(w, world.time || 0));
    world.obstacles.forEach(drawObstacle);
    world.bubbles.forEach(b => drawBubbleZone(b, world.time || 0));
    
    // 별 획득 이펙트 렌더링 (별보다 뒤에)
    drawEffects(world);
    
    world.stars.forEach(s => {
      drawStar(s, world.time || 0);
    });
    
    // 🎭 캐릭터 (줄과 사탕보다 먼저 그리기)
    drawOmNom(world.omNom, world.candy, world.time || 0, world);
    
    // 🧵 줄 (캐릭터 위에)
    world.ropes.forEach(drawRope);
    
    // 🍬 사탕 (캐릭터와 줄보다 위에, 먹힌 사탕은 그리지 않음)
    drawCandy(world.candy, world.time || 0);

    if (cutPoints && cutPoints.length > 1) {
      drawCutLine(cutPoints, 0.85);
    }
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  return {
    init,
    resize,
    setAsset,
    drawWorld,
    get width() { return width; },
    get height() { return height; }
  };
})();
