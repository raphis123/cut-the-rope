/**
 * Main game loop, input handling, UI, and state management.
 */
(function () {
  'use strict';

  const HUD_STAR_FRONT_SRC = 'img/ui/menu/level_star.png';
  const HUD_STAR_BACK_SRC = 'img/ui/menu/level_star_back.png';

  const canvas = document.getElementById('game-canvas');
  const levelNumEl = document.getElementById('level-num');
  const starsDisplay = document.getElementById('stars-display');
  const overlayWin = document.getElementById('overlay-win');
  const overlayLose = document.getElementById('overlay-lose');
  const overlayPause = document.getElementById('overlay-pause');
  const overlayConfirm = document.getElementById('overlay-confirm');
  const winStarsEl = document.getElementById('win-stars');

  let confirmCallback = null;

  let world = null;
  let currentLevel = 0;
  let progress = loadProgress();
  let gameState = 'menu';
  let lastTime = 0;
  let lastDt = 0.016;
  let cutPoints = [];
  let isCutting = false;
  let animFrameId = null;
  let collectedThisLevel = 0;
  let winCelebrating = false;
  let loseCelebrating = false;
  let winTimeoutId = null;
  let loseTimeoutId = null;
  let hudStarFlightLayer = null;
  let hudDisplayedStars = 0;
  let hudPendingStars = 0;

  const btnRestart = document.getElementById('btn-restart');
  const btnMenu = document.getElementById('btn-menu');

  Renderer.init(canvas);

  function ensureHudStarFlightLayer() {
    if (hudStarFlightLayer && document.body.contains(hudStarFlightLayer)) return hudStarFlightLayer;
    hudStarFlightLayer = document.createElement('div');
    hudStarFlightLayer.className = 'hud-star-flight-layer';
    document.body.appendChild(hudStarFlightLayer);
    return hudStarFlightLayer;
  }

  function clearHudStarFlights() {
    if (hudStarFlightLayer) hudStarFlightLayer.innerHTML = '';
  }

  function animateCollectedStarToHUD(worldX, worldY, slotIndex, onLanded) {
    const targetSlot = starsDisplay.querySelectorAll('.hud-star-slot')[slotIndex];
    if (!targetSlot) {
      if (typeof onLanded === 'function') onLanded();
      return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const targetRect = targetSlot.getBoundingClientRect();
    const startCenterX = canvasRect.left + (worldX / Renderer.width) * canvasRect.width;
    const startCenterY = canvasRect.top + (worldY / Renderer.height) * canvasRect.height;
    const startSize = Math.max(18, targetRect.width * 0.85);
    const targetCenterX = targetRect.left + targetRect.width * 0.5;
    const targetCenterY = targetRect.top + targetRect.height * 0.5;
    const controlX = startCenterX + (targetCenterX - startCenterX) * 0.55;
    const controlY = Math.min(startCenterY, targetCenterY) - Math.max(30, Math.abs(targetCenterY - startCenterY) * 0.18);

    const flyer = document.createElement('img');
    flyer.className = 'hud-star-flight';
    flyer.src = HUD_STAR_FRONT_SRC;
    flyer.alt = '';
    flyer.setAttribute('aria-hidden', 'true');
    flyer.style.left = startCenterX - startSize * 0.5 + 'px';
    flyer.style.top = startCenterY - startSize * 0.5 + 'px';
    flyer.style.width = startSize + 'px';
    flyer.style.height = startSize + 'px';

    ensureHudStarFlightLayer().appendChild(flyer);

    const durationMs = 560;
    const startAt = performance.now();

    function tick(now) {
      const rawT = Math.min(1, (now - startAt) / durationMs);
      const easeT = 1 - Math.pow(1 - rawT, 3);
      const invT = 1 - easeT;
      const x = invT * invT * startCenterX + 2 * invT * easeT * controlX + easeT * easeT * targetCenterX;
      const y = invT * invT * startCenterY + 2 * invT * easeT * controlY + easeT * easeT * targetCenterY;
      const size = startSize + (targetRect.width - startSize) * easeT;
      const angle = (1 - easeT) * -10;

      flyer.style.left = x - size * 0.5 + 'px';
      flyer.style.top = y - size * 0.5 + 'px';
      flyer.style.width = size + 'px';
      flyer.style.height = size + 'px';
      flyer.style.transform = 'rotate(' + angle + 'deg)';
      flyer.style.opacity = String(0.94 - easeT * 0.08);

      if (rawT < 1) {
        requestAnimationFrame(tick);
        return;
      }

      flyer.remove();
      if (typeof onLanded === 'function') onLanded();
    }

    requestAnimationFrame(tick);
  }

  function revealHudStar(slotIndex) {
    const slot = starsDisplay.querySelectorAll('.hud-star-slot')[slotIndex];
    if (!slot) return;
    const front = slot.querySelector('.hud-star-front');
    if (front) front.classList.add('collected');
    hudDisplayedStars = Math.max(hudDisplayedStars, slotIndex + 1);
  }

  function getCanvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (Renderer.width / rect.width),
      y: (clientY - rect.top) * (Renderer.height / rect.height)
    };
  }

  function clearPendingOverlays() {
    if (winTimeoutId !== null) {
      clearTimeout(winTimeoutId);
      winTimeoutId = null;
    }
    if (loseTimeoutId !== null) {
      clearTimeout(loseTimeoutId);
      loseTimeoutId = null;
    }
  }

  function updateHudButtons() {
    const active = gameState === 'playing';
    btnRestart.disabled = !active;
    btnMenu.disabled = !active;
  }

  function hideAllGameOverlays() {
    hideOverlay(overlayWin);
    hideOverlay(overlayLose);
    hideOverlay(overlayPause);
    hideOverlay(overlayConfirm);
    confirmCallback = null;
  }

  function openPauseMenu() {
    if (gameState !== 'playing') return;
    gameState = 'paused';
    if (window.GameSettings) {
      GameSettings.syncToggleUI();
      GameSettings.play('pause');
    }
    overlayPause.classList.remove('hidden');
    updateHudButtons();
    stopGameLoop();
  }

  function resumeFromPause() {
    if (gameState !== 'paused') return;
    hideOverlay(overlayPause);
    hideOverlay(overlayConfirm);
    confirmCallback = null;
    gameState = 'playing';
    if (window.GameSettings) GameSettings.play('click');
    updateHudButtons();
    ensureGameRunning();
  }

  function showConfirm(title, message, onYes) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = onYes;
    overlayConfirm.classList.remove('hidden');
    if (window.GameSettings) GameSettings.play('click');
  }

  function closeConfirm(stay) {
    hideOverlay(overlayConfirm);
    if (!stay && confirmCallback) {
      const cb = confirmCallback;
      confirmCallback = null;
      cb();
    } else {
      confirmCallback = null;
    }
  }

  function loadLevel(index) {
    if (index < 0 || index >= LEVELS.length) return;
    clearPendingOverlays();
    clearHudStarFlights();
    currentLevel = index;
    levelNumEl.textContent = LEVELS[index].id;

    const wrap = canvas.parentElement;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    Renderer.resize(canvas, w, h);

    world = Physics.createWorld(LEVELS[index], w, h);
    // 🎭 현재 레벨 인덱스를 world에 저장 (렌더러에서 캐릭터 선택 시 사용)
    world.levelIndex = index;
    // 이전 레벨 이펙트 완전 제거
    world.effects = [];
    cutPoints = [];
    collectedThisLevel = 0;
    hudDisplayedStars = 0;
    hudPendingStars = 0;
    winCelebrating = false;
    loseCelebrating = false;
    gameState = 'playing';
    updateStarsHUD(0);

    hideAllGameOverlays();
    updateHudButtons();
    ensureGameRunning();
  }

  function updateStarsHUD(count) {
    const total = world ? world.stars.length : 3;
    starsDisplay.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const slot = document.createElement('span');
      slot.className = 'hud-star-slot';

      const back = document.createElement('img');
      back.className = 'hud-star-img hud-star-back';
      back.src = HUD_STAR_BACK_SRC;
      back.alt = '';
      back.setAttribute('aria-hidden', 'true');
      slot.appendChild(back);

      const front = document.createElement('img');
      front.className = 'hud-star-img hud-star-front' + (i < count ? ' collected' : '');
      front.src = HUD_STAR_FRONT_SRC;
      front.alt = '';
      front.setAttribute('aria-hidden', 'true');
      slot.appendChild(front);

      starsDisplay.appendChild(slot);
    }
  }

  function hideOverlay(el) {
    el.classList.add('hidden');
  }

  function showOverlay(el) {
    if (gameState === 'playing') return;
    el.classList.remove('hidden');
  }

  function leaveToLevelSelect() {
    hideAllGameOverlays();
    gameState = 'menu';
    stopGameLoop();
    clearHudStarFlights();
    world = null;
    updateHudButtons();
    if (window.GameSettings) {
      GameSettings.stopMusic();
      GameSettings.play('exitGame');
    }
    if (window.GameScreens) GameScreens.showLevelSelect();
  }

  function onWin(starsCollected) {
    if (winCelebrating) return;
    winCelebrating = true;
    gameState = 'celebrating';

    const levelId = LEVELS[currentLevel].id;
    const totalStars = LEVELS[currentLevel].stars.length;
    const prev = progress.stars[levelId] || 0;
    progress.stars[levelId] = Math.max(prev, starsCollected);
    if (levelId >= progress.unlocked && currentLevel + 1 < LEVELS.length) {
      progress.unlocked = levelId + 1;
    }
    saveProgress(progress);

    if (window.GameSettings) {
      GameSettings.play('win');
      GameSettings.vibrate(80);
    }

    winStarsEl.innerHTML = '';
    for (let i = 0; i < totalStars; i++) {
      const slot = document.createElement('span');
      slot.className = 'win-star-slot';
      const star = document.createElement('span');
      star.className = 'ui-sticker ui-star ui-star-md ' + (i < starsCollected ? 'star-on' : 'star-off');
      slot.appendChild(star);
      winStarsEl.appendChild(slot);
    }

    document.getElementById('btn-next').style.display =
      currentLevel + 1 < LEVELS.length ? 'block' : 'none';

    updateHudButtons();
    winTimeoutId = setTimeout(() => {
      winTimeoutId = null;
      if (gameState !== 'celebrating') return;
      gameState = 'won';
      showOverlay(overlayWin);
      updateHudButtons();
      stopGameLoop();
    }, 3000);
  }

  function onLose() {
    if (loseCelebrating || winCelebrating) return;
    loseCelebrating = true;
    gameState = 'losing';

    if (window.GameSettings) {
      GameSettings.play('lose');
      GameSettings.vibrate(120);
    }

    updateHudButtons();
    loseTimeoutId = setTimeout(() => {
      loseTimeoutId = null;
      if (gameState !== 'losing') return;
      gameState = 'lost';
      showOverlay(overlayLose);
      updateHudButtons();
      stopGameLoop();
    }, 3000);
  }

  function shouldRunGameLoop() {
    return world !== null && (
      gameState === 'playing' ||
      gameState === 'celebrating' ||
      gameState === 'losing'
    );
  }

  function stopGameLoop() {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function gameLoop(timestamp) {
    animFrameId = null;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
    lastDt = dt;
    lastTime = timestamp;

    if ((gameState === 'playing' || gameState === 'celebrating' || gameState === 'losing') && world) {
      const result = Physics.updateWorld(world, dt);
      const starCount = world.stars.filter(s => s.collected).length;
      if (starCount > collectedThisLevel) {
        const gained = starCount - collectedThisLevel;
        collectedThisLevel = starCount;
        const collectedNow = world.collectedStarsThisFrame || [];
        const animatedCount = Math.min(gained, collectedNow.length);
        const firstReservedSlot = hudDisplayedStars + hudPendingStars;
        hudPendingStars += animatedCount;

        for (let i = 0; i < animatedCount; i++) {
          const star = collectedNow[i];
          const slotIndex = firstReservedSlot + i;
          animateCollectedStarToHUD(star.x, star.y, slotIndex, () => {
            revealHudStar(slotIndex);
            hudPendingStars = Math.max(0, hudPendingStars - 1);
          });
        }

        // Fallback for unexpected cases where collected stars have no source point.
        for (let i = animatedCount; i < gained; i++) {
          revealHudStar(hudDisplayedStars + hudPendingStars);
        }

        if (window.GameSettings) {
          GameSettings.play('star');
          GameSettings.vibrate(30);
        }
      }

      if (result.won && gameState === 'playing') onWin(result.starsCollected);
      else if (result.lost && gameState === 'playing') onLose();
    }

    if (world && shouldRunGameLoop()) {
      Renderer.drawWorld(world, isCutting ? cutPoints : null);
    }

    if (shouldRunGameLoop()) {
      animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function startCut(x, y) {
    if (gameState !== 'playing') return;
    if (tryPopBubble(x, y)) return;
    isCutting = true;
    cutPoints = [{ x, y }];
  }

  function tryPopBubble(x, y) {
    if (!world || gameState !== 'playing') return false;
    const { candy } = world;
    if (!candy.inBubble) return false;
    const bubbleR = candy.radius * 2;
    const dx = x - candy.x;
    const dy = y - candy.y;
    if (dx * dx + dy * dy < bubbleR * bubbleR) {
      Physics.popBubble(candy);
      if (window.GameSettings) GameSettings.play('pop');
      return true;
    }
    return false;
  }

  function moveCut(x, y) {
    if (!isCutting || gameState !== 'playing') return;
    const last = cutPoints[cutPoints.length - 1];
    const dx = x - last.x;
    const dy = y - last.y;
    if (dx * dx + dy * dy > GamePerf.cutMoveThresholdSq()) {
      cutPoints.push({ x, y });
      if (cutPoints.length > 2) {
        Physics.processCutPath(world, cutPoints.slice(-2), lastDt);
        if (window.GameSettings) GameSettings.play('cut');
      }
    }
  }

  function endCut() {
    if (isCutting && cutPoints.length > 1 && world) {
      Physics.processCutPath(world, cutPoints, lastDt);
    }
    isCutting = false;
    cutPoints = [];
  }

  canvas.addEventListener('mousedown', e => {
    e.preventDefault();
    const p = getCanvasPoint(e.clientX, e.clientY);
    startCut(p.x, p.y);
  });

  window.addEventListener('mousemove', e => {
    if (!isCutting) return;
    const p = getCanvasPoint(e.clientX, e.clientY);
    moveCut(p.x, p.y);
  });

  window.addEventListener('mouseup', e => {
    if (isCutting && cutPoints.length <= 1) {
      const p = getCanvasPoint(e.clientX, e.clientY);
      tryPopBubble(p.x, p.y);
    }
    endCut();
  });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    const p = getCanvasPoint(t.clientX, t.clientY);
    startCut(p.x, p.y);
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    const p = getCanvasPoint(t.clientX, t.clientY);
    moveCut(p.x, p.y);
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (isCutting && cutPoints.length <= 1 && e.changedTouches[0]) {
      const t = e.changedTouches[0];
      const p = getCanvasPoint(t.clientX, t.clientY);
      tryPopBubble(p.x, p.y);
    }
    endCut();
  }, { passive: false });

  canvas.addEventListener('touchcancel', endCut);

  function handleResize() {
    if (world && gameState === 'playing') {
      loadLevel(currentLevel);
    } else {
      const wrap = canvas.parentElement;
      Renderer.resize(canvas, wrap.clientWidth, wrap.clientHeight);
    }
  }

  window.addEventListener('resize', handleResize);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopGameLoop();
      return;
    }
    if (shouldRunGameLoop()) ensureGameRunning();
  });

  function ensureGameRunning() {
    if (!animFrameId) {
      lastTime = performance.now();
      animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function enterGame(index) {
    if (window.GameSettings) {
      GameSettings.unlockAudio();
      GameSettings.startGameMusic();
    }
    ensureGameRunning();
    loadLevel(index);
  }

  function exitToMenu() {
    clearPendingOverlays();
    gameState = 'menu';
    winCelebrating = false;
    loseCelebrating = false;
    stopGameLoop();
    clearHudStarFlights();
    world = null;
    hideAllGameOverlays();
    updateHudButtons();
    if (window.GameSettings) {
      GameSettings.stopMusic();
      GameSettings.play('exitGame');
    }
    if (window.GameScreens) {
      window.GameScreens.showMenu(true);
    }
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!overlayConfirm.classList.contains('hidden')) {
        closeConfirm(true);
        e.preventDefault();
      } else if (gameState === 'paused') {
        resumeFromPause();
        e.preventDefault();
      }
    }
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    if (gameState === 'playing') openPauseMenu();
  });

  document.getElementById('btn-pause-resume').addEventListener('click', resumeFromPause);

  document.getElementById('btn-pause-levels').addEventListener('click', () => {
    showConfirm(
      'Leave level?',
      'Go to level select? Your progress on this attempt will be lost.',
      leaveToLevelSelect
    );
  });

  document.getElementById('btn-pause-menu').addEventListener('click', () => {
    showConfirm(
      'Return to main menu?',
      'Are you sure you want to leave? Your progress on this attempt will be lost.',
      exitToMenu
    );
  });

  document.getElementById('btn-confirm-yes').addEventListener('click', () => closeConfirm(false));
  document.getElementById('btn-confirm-no').addEventListener('click', () => closeConfirm(true));

  document.getElementById('btn-restart').addEventListener('click', () => {
    if (gameState !== 'playing') return;
    loadLevel(currentLevel);
  });

  document.getElementById('btn-win-menu').addEventListener('click', exitToMenu);
  document.getElementById('btn-lose-menu').addEventListener('click', exitToMenu);

  document.getElementById('btn-next').addEventListener('click', () => {
    hideOverlay(overlayWin);
    clearHudStarFlights();
    loadLevel(currentLevel + 1);
  });

  document.getElementById('btn-retry-win').addEventListener('click', () => {
    hideOverlay(overlayWin);
    clearHudStarFlights();
    loadLevel(currentLevel);
  });

  document.getElementById('btn-retry-lose').addEventListener('click', () => {
    hideOverlay(overlayLose);
    clearHudStarFlights();
    loadLevel(currentLevel);
  });

  /**
   * Public API for loading custom sprites later.
  * Usage: CutRope.loadSprites({ omNom: 'img/characters/character01/idle/idle01.png', candy: '...', star: 'img/props/star.png' })
   */
  window.CutRope = {
    loadSprites(paths) {
      const load = (name, src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { Renderer.setAsset(name, img); resolve(); };
        img.onerror = reject;
        img.src = src;
      });
      const tasks = [];
      if (paths.omNom) tasks.push(load('omNom', paths.omNom));
      if (paths.candy) tasks.push(load('candy', paths.candy));
      if (paths.star) tasks.push(load('star', paths.star));
      
      // ✨ 별 획득 이펙트 이미지 로드
      if (paths.starFx && typeof paths.starFx === 'object') {
        for (let i = 1; i <= 12; i++) {
          const key = `starFx_${i}`;
          if (paths.starFx[key]) {
            tasks.push(load(key, paths.starFx[key]));
          }
        }
      }
      
      return Promise.all(tasks);
    },
    loadLevel(index) {
      enterGame(index);
    },
    enterGame(index) {
      enterGame(index);
    },
    exitToMenu() {
      exitToMenu();
    },
    getProgress: () => ({ ...progress, stars: { ...progress.stars } })
  };

  handleResize();
  updateHudButtons();
})();
