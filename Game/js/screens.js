/**
 * Loading, main menu, and level select screens.
 */
(function () {
  'use strict';

  const IDLE_FPS = 6;
  const CHARACTER_OFFSETS = [0, 260, 520];
  const CHARACTER_KEYS = ['character03', 'character01', 'character02'];
  const LOADING_BG_SRC = 'img/backgrounds/title_bg02.webp';
  const LEVEL_STAR_FRONT_SRC = 'img/ui/menu/level_star.png';
  const LEVEL_STAR_BACK_SRC = 'img/ui/menu/level_star_back.png';

  const screenLoading = document.getElementById('screen-loading');
  const screenMenu = document.getElementById('screen-menu');
  const screenLevels = document.getElementById('screen-levels');
  const screenSettings = document.getElementById('screen-settings');
  const appEl = document.getElementById('app');

  const loadingStage = document.getElementById('loading-stage');
  const loadingLogo = document.getElementById('loading-logo');
  const loadingCandy = document.getElementById('loading-candy');
  const loadingStar = document.getElementById('loading-star');
  const loadingBubble = document.getElementById('loading-bubble');
  const loadingCharacterEls = [
    document.getElementById('loading-character-1'),
    document.getElementById('loading-character-2'),
    document.getElementById('loading-character-3')
  ];

  const loadingFill = document.getElementById('loading-bar-fill');
  const loadingStatus = document.getElementById('loading-status');
  const btnLoadingStart = document.getElementById('btn-loading-start');
  const menuStarsTotal = document.getElementById('menu-stars-total');
  const levelsProgressFill = document.getElementById('levels-progress-fill');
  const levelsProgressText = document.getElementById('levels-progress-text');
  const levelsTotalBadge = document.getElementById('levels-total-badge');
  const levelsGrid = document.getElementById('levels-screen-grid');

  let loadingDone = false;
  let loadingLaunchLocked = false;
  let loadingAnimFrame = 0;
  let loadingAnimStart = performance.now();

  const characterFramePaths = CHARACTER_KEYS.map((key) => [
    `img/characters/${key}/idle/idle01.png`,
    `img/characters/${key}/idle/idle02.png`,
    `img/characters/${key}/idle/idle03.png`
  ]);

  function sfx(name) {
    if (!window.GameSettings) return;
    GameSettings.unlockAudio();
    GameSettings.play(name);
  }

  function startMenuAudio() {
    if (!window.GameSettings) return;
    GameSettings.startMenuMusic();
    GameSettings.unlockAudio();
  }

  function startGameAudio() {
    if (!window.GameSettings) return;
    GameSettings.startGameMusic();
    GameSettings.unlockAudio();
  }

  async function unlockAudioFromGesture() {
    if (!window.GameSettings) return false;
    return GameSettings.unlockFromGesture();
  }

  function setLoadingButtonReady(ready) {
    btnLoadingStart.hidden = !ready;
    btnLoadingStart.classList.toggle('is-ready', ready);
  }

  function setLoadingProgress(state) {
    const progress = state ? state.progress : 0;
    const loaded = state ? state.loaded : 0;
    const total = state ? state.total : 0;
    const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
    loadingFill.style.width = pct + '%';
    loadingStatus.textContent = '';
    if (state && state.ready) {
      loadingDone = true;
      setLoadingButtonReady(true);
      if (window.GameSettings) GameSettings.startMenuMusic();
    } else {
      loadingDone = false;
      setLoadingButtonReady(false);
    }
  }

  function preloadLoadingImage(img) {
    if (!img) return;
    const src = img.dataset.src;
    if (!src) return;
    void GameAssetLoader.loadImage(src).then((loadedImg) => {
      if (loadedImg) img.src = src;
    });
  }

  function preloadLoadingSceneAssets() {
    void GameAssetLoader.loadImage(LOADING_BG_SRC);
    [loadingLogo, loadingCandy, loadingStar, loadingBubble, ...loadingCharacterEls].forEach(preloadLoadingImage);
    characterFramePaths.forEach((frames) => frames.forEach((src) => void GameAssetLoader.loadImage(src)));
  }

  function syncLoadingCharacterFrames() {
    const now = performance.now();
    const elapsed = now - loadingAnimStart;

    loadingCharacterEls.forEach((img, index) => {
      if (!img) return;
      const frames = characterFramePaths[index];
      if (!frames) return;
      const frameIndex = Math.floor(((elapsed + CHARACTER_OFFSETS[index]) / 1000) * IDLE_FPS) % frames.length;
      const frameSrc = frames[frameIndex];
      if (img.dataset.frame !== frameSrc) {
        img.dataset.frame = frameSrc;
        img.src = frameSrc;
      }
    });
  }

  function startLoadingAnimation() {
    const tick = () => {
      syncLoadingCharacterFrames();
      if (screenLoading.classList.contains('screen-active') && !loadingLaunchLocked) {
        loadingAnimFrame = requestAnimationFrame(tick);
      }
    };
    cancelAnimationFrame(loadingAnimFrame);
    loadingAnimFrame = requestAnimationFrame(tick);
  }

  function stopLoadingAnimation() {
    if (loadingAnimFrame) {
      cancelAnimationFrame(loadingAnimFrame);
      loadingAnimFrame = 0;
    }
  }

  function bootstrapLoadingScene() {
    preloadLoadingSceneAssets();

    if (window.GameAssetLoader) {
      GameAssetLoader.onProgress((state) => {
        setLoadingProgress(state);
      });
      const state = GameAssetLoader.getState();
      setLoadingProgress(state);
    } else {
      loadingFill.style.width = '100%';
      loadingStatus.textContent = '';
      loadingDone = true;
      setLoadingButtonReady(true);
    }

    syncLoadingCharacterFrames();
    startLoadingAnimation();
  }

  function showScreen(screen) {
    [screenLoading, screenMenu, screenLevels, screenSettings].forEach((el) => {
      el.classList.toggle('screen-active', el === screen);
    });
  }

  function getProgress() {
    if (window.CutRope && window.CutRope.getProgress) {
      return window.CutRope.getProgress();
    }
    return loadProgress();
  }

  function totalStarsCollected(progress) {
    return Object.values(progress.stars || {}).reduce((sum, n) => sum + n, 0);
  }

  function updateMenuStats() {
    const progress = getProgress();
    menuStarsTotal.textContent = String(totalStarsCollected(progress));
  }

  function levelsCleared(progress) {
    let count = 0;
    LEVELS.forEach((lvl) => {
      if ((progress.stars[lvl.id] || 0) > 0) count += 1;
    });
    return count;
  }

  function updateProgressBar(progress) {
    const cleared = levelsCleared(progress);
    const total = LEVELS.length;
    levelsProgressText.textContent = cleared + ' / ' + total + ' cleared';
    levelsProgressFill.style.width = (total ? (cleared / total) * 100 : 0) + '%';
    if (levelsTotalBadge) levelsTotalBadge.textContent = String(total);
  }

  function renderLevelStars(container, earned, max) {
    container.innerHTML = '';
    const totalSlots = Math.max(0, max || 0);
    const visibleStars = Math.max(0, Math.min(totalSlots, earned || 0));

    for (let i = 0; i < totalSlots; i++) {
      const slot = document.createElement('span');
      slot.className = 'lvl-star-slot';

      const back = document.createElement('img');
      back.className = 'lvl-star-img lvl-star-back';
      back.src = LEVEL_STAR_BACK_SRC;
      back.alt = '';
      back.setAttribute('aria-hidden', 'true');
      slot.appendChild(back);

      const front = document.createElement('img');
      front.className = 'lvl-star-img lvl-star-front' + (i < visibleStars ? ' is-earned' : '');
      front.src = LEVEL_STAR_FRONT_SRC;
      front.alt = '';
      front.setAttribute('aria-hidden', 'true');
      slot.appendChild(front);

      container.appendChild(slot);
    }
  }

  function setLevelsScrollMode(on) {
    document.body.classList.toggle('levels-scroll-active', on);
  }

  function setupLevelGridTouchScroll() {
    let startY = 0;
    let moved = false;

    levelsGrid.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      moved = false;
    }, { passive: true });

    levelsGrid.addEventListener('touchmove', (e) => {
      if (Math.abs(e.touches[0].clientY - startY) > 10) moved = true;
    }, { passive: true });

    levelsGrid.addEventListener('click', (e) => {
      const cell = e.target.closest('.lvl-cell');
      if (!cell || !moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }, true);
  }

  function buildLevelsGrid() {
    const progress = getProgress();
    levelsGrid.innerHTML = '';
    updateProgressBar(progress);

    LEVELS.forEach((lvl, levelIndex) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lvl-cell';
      const stars = progress.stars[lvl.id] || 0;
      const maxStars = (lvl.stars || []).length || 3;

      const num = document.createElement('span');
      num.className = 'lvl-cell-num';
      num.textContent = lvl.id;
      btn.appendChild(num);

      const starRow = document.createElement('span');
      starRow.className = 'lvl-cell-stars';
      renderLevelStars(starRow, stars, maxStars);
      btn.appendChild(starRow);

      if (stars > 0) {
        btn.classList.add('completed');
      }

      if (lvl.id > progress.unlocked) {
        btn.classList.add('locked');
        const lock = document.createElement('span');
        lock.className = 'lvl-cell-lock';
        lock.textContent = '🔒';
        btn.appendChild(lock);
      } else if (lvl.id === progress.unlocked) {
        btn.classList.add('current');
      }

      btn.addEventListener('click', () => {
        if (lvl.id > progress.unlocked) {
          sfx('locked');
          return;
        }
        sfx('levelPick');
        startGame(levelIndex);
      });

      levelsGrid.appendChild(btn);
    });
  }

  function scrollToCurrentLevel() {
    requestAnimationFrame(() => {
      const current = levelsGrid.querySelector('.lvl-cell.current');
      if (!current) return;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      current.scrollIntoView({
        block: 'center',
        behavior: prefersReduced || isCoarse ? 'auto' : 'smooth'
      });
    });
  }

  function showMenu(fromGame) {
    setLevelsScrollMode(false);
    updateMenuStats();
    showScreen(screenMenu);
    appEl.classList.add('screen-hidden');
    startMenuAudio();
    if (!fromGame && loadingDone) sfx('menuIn');
  }

  function showSettings() {
    setLevelsScrollMode(false);
    if (window.GameSettings) GameSettings.syncToggleUI();
    showScreen(screenSettings);
    appEl.classList.add('screen-hidden');
    startMenuAudio();
    sfx('openSettings');
  }

  function showLevelSelect() {
    buildLevelsGrid();
    showScreen(screenLevels);
    appEl.classList.add('screen-hidden');
    setLevelsScrollMode(true);
    startMenuAudio();
    sfx('openLevels');
    scrollToCurrentLevel();
  }

  function startGame(levelIndex) {
    setLevelsScrollMode(false);
    if (!window.CutRope || !window.CutRope.enterGame) {
      console.warn('CutRope.enterGame not ready');
      return;
    }
    if (window.GameSettings) {
      GameSettings.stopMusic();
      sfx('enterGame');
    }
    appEl.classList.remove('screen-hidden');
    [screenLoading, screenMenu, screenLevels, screenSettings].forEach((el) => el.classList.remove('screen-active'));
    startGameAudio();
    window.CutRope.enterGame(levelIndex);
  }

  async function enterMenuFromLoading() {
    if (!loadingDone || loadingLaunchLocked || !window.GameSettings) return;
    loadingLaunchLocked = true;
    btnLoadingStart.hidden = true;
    stopLoadingAnimation();
    GameSettings.startMenuMusic();
    await unlockAudioFromGesture();
    showMenu(false);
  }

  function handleLoadingStart(event) {
    event.preventDefault();
    enterMenuFromLoading();
  }

  function runLoadingSequence() {
    bootstrapLoadingScene();
  }

  btnLoadingStart.addEventListener('pointerup', handleLoadingStart);
  btnLoadingStart.addEventListener('click', handleLoadingStart);

  document.getElementById('btn-menu-play').addEventListener('click', async () => {
    await unlockAudioFromGesture();
    sfx('levelPick');
    // 새 게임은 항상 첫 번째 레벨(인덱스 0 = Level 1)부터 시작
    startGame(0);
  });

  document.getElementById('btn-menu-levels').addEventListener('click', async () => {
    await unlockAudioFromGesture();
    showLevelSelect();
  });
  document.getElementById('btn-menu-settings').addEventListener('click', async () => {
    await unlockAudioFromGesture();
    showSettings();
  });

  document.getElementById('btn-levels-back').addEventListener('click', () => {
    sfx('back');
    showMenu(false);
  });
  document.getElementById('btn-settings-back').addEventListener('click', () => {
    sfx('back');
    showMenu(false);
  });

  window.GameScreens = {
    showMenu,
    showLevelSelect,
    showSettings,
    isLoadingDone: () => loadingDone
  };

  runLoadingSequence();
  setupLevelGridTouchScroll();
})();
