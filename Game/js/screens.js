/**
 * Loading, main menu, and level select screens.
 */
(function () {
  'use strict';

  const LOADING_STEPS = [
    { pct: 18, text: 'Loading levels…' },
    { pct: 42, text: 'Warming up physics…' },
    { pct: 68, text: 'Feeding Om Nom…' },
    { pct: 88, text: 'Polishing stars…' },
    { pct: 100, text: 'Ready!' }
  ];

  const screenLoading = document.getElementById('screen-loading');
  const screenMenu = document.getElementById('screen-menu');
  const screenLevels = document.getElementById('screen-levels');
  const screenSettings = document.getElementById('screen-settings');
  const appEl = document.getElementById('app');

  const loadingFill = document.getElementById('loading-bar-fill');
  const loadingStatus = document.getElementById('loading-status');
  const btnLoadingStart = document.getElementById('btn-loading-start');
  const menuContinueLabel = document.getElementById('menu-continue-label');
  const menuStarsTotal = document.getElementById('menu-stars-total');
  const levelsProgressFill = document.getElementById('levels-progress-fill');
  const levelsProgressText = document.getElementById('levels-progress-text');
  const levelsTotalBadge = document.getElementById('levels-total-badge');
  const levelsGrid = document.getElementById('levels-screen-grid');

  let loadingDone = false;

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
    const continueLevel = Math.max(1, Math.min(progress.unlocked, LEVELS.length));
    menuContinueLabel.textContent = 'Level ' + continueLevel;
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

  function renderStarDots(container, earned, max) {
    container.innerHTML = '';
    for (let i = 0; i < max; i++) {
      const dot = document.createElement('span');
      dot.className = 'lvl-star-dot' + (i < earned ? ' on' : '');
      dot.textContent = '★';
      container.appendChild(dot);
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

      if (stars > 0) {
        btn.classList.add('completed');
        const starRow = document.createElement('span');
        starRow.className = 'lvl-cell-stars';
        renderStarDots(starRow, stars, maxStars);
        btn.appendChild(starRow);
      } else if (lvl.id <= progress.unlocked) {
        const starRow = document.createElement('span');
        starRow.className = 'lvl-cell-stars';
        renderStarDots(starRow, 0, maxStars);
        btn.appendChild(starRow);
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
    if (!loadingDone || !window.GameSettings) return;
    btnLoadingStart.hidden = true;
    GameSettings.startMenuMusic();
    await unlockAudioFromGesture();
    showMenu(false);
  }

  function runLoadingSequence() {
    let stepIndex = 0;

    function nextStep() {
      if (stepIndex >= LOADING_STEPS.length) {
        loadingDone = true;
        loadingStatus.textContent = 'Ready!';
        if (window.GameSettings) GameSettings.startMenuMusic();
        btnLoadingStart.hidden = false;
        return;
      }
      const step = LOADING_STEPS[stepIndex];
      loadingFill.style.width = step.pct + '%';
      loadingStatus.textContent = step.text;
      stepIndex += 1;
      setTimeout(nextStep, 420 + Math.random() * 180);
    }

    loadingFill.style.width = '0%';
    loadingStatus.textContent = 'Starting up…';
    setTimeout(nextStep, 300);
  }

  btnLoadingStart.addEventListener('click', () => {
    enterMenuFromLoading();
  });

  document.getElementById('btn-menu-play').addEventListener('click', async () => {
    await unlockAudioFromGesture();
    const progress = getProgress();
    const idx = Math.max(0, Math.min(progress.unlocked - 1, LEVELS.length - 1));
    sfx('levelPick');
    startGame(idx);
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
