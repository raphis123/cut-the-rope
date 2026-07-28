/**
 * Game settings + procedural music & SFX (Web Audio API).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cutrope-settings';
  const DEFAULTS = {
    sound: true,
    music: true,
    vibration: true,
    particles: true
  };

  const NOTE = {
    G3: 196.0, A3: 220.0, E3: 164.81, F3: 174.61,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
    C6: 1046.5
  };

  const GAME_MELODY = [
    ['E5', 0.5], ['G5', 0.5], ['A5', 0.5], ['G5', 0.5],
    ['E5', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 1],
    ['G5', 0.5], ['E5', 0.5], ['C5', 0.5], ['D5', 0.5],
    ['E5', 1], ['G5', 0.5], ['A5', 0.5], ['B5', 0.5], ['C6', 1]
  ];

  const GAME_BASS = [
    ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1],
    ['A4', 1], ['A4', 1], ['E4', 1], ['E4', 1],
    ['F4', 1], ['F4', 1], ['C4', 1], ['C4', 1],
    ['G4', 1], ['G4', 1], ['G4', 1], ['C4', 1]
  ];

  const MENU_MELODY = [
    ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1],
    ['A4', 1], ['C5', 1], ['D5', 1], ['E5', 1.5],
    ['G4', 1], ['A4', 1], ['C5', 1], ['D5', 1],
    ['E5', 1.5], ['C5', 1], ['G4', 1], ['A4', 1], ['C5', 2]
  ];

  const MENU_BASS = [
    ['C4', 2], ['G3', 2], ['A3', 2], ['F3', 2],
    ['C4', 2], ['G3', 2], ['A3', 2], ['E3', 2],
    ['F3', 2], ['C4', 2], ['G3', 2], ['C4', 2]
  ];

  const MENU_SFX = new Set([
    'loadDone', 'menuIn', 'openLevels', 'openSettings', 'back', 'levelPick', 'locked', 'click', 'exitGame'
  ]);
  const CUT_SFX = {
    air: 'audio/cut-swipe-air.wav',
    hit: 'audio/cut-swipe-hit.wav'
  };

  let settings = load();
  let audioCtx = null;
  let menuSfxGain = null;
  let gameSfxGain = null;
  let musicGain = null;
  let musicTimer = null;
  let musicStep = 0;
  let musicContext = null;
  let fadeToken = 0;
  let musicAwaitingUnlock = false;
  let cutSampleBuffers = { air: null, hit: null };
  let cutSampleLoadPromise = null;

  function isAudioRunning() {
    return !!(audioCtx && audioCtx.state === 'running');
  }

  function initAudioNodesIfNeeded() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    menuSfxGain = audioCtx.createGain();
    menuSfxGain.gain.value = 0.72;
    menuSfxGain.connect(audioCtx.destination);
    gameSfxGain = audioCtx.createGain();
    gameSfxGain.gain.value = 0.88;
    gameSfxGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(audioCtx.destination);
    return audioCtx;
  }

  function retryMusicAfterUnlock() {
    if (!settings.music || !musicContext || !isAudioRunning()) return;
    if (musicAwaitingUnlock || !musicTimer) {
      musicAwaitingUnlock = false;
      beginMusicLoop();
    }
  }

  async function unlockFromGesture() {
    if (!settings.sound && !settings.music) return false;
    const ctx = initAudioNodesIfNeeded();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (_) {
        return false;
      }
    }
    retryMusicAfterUnlock();
    return isAudioRunning();
  }

  function unlockAudio() {
    if (!settings.sound && !settings.music) return null;
    const ctx = initAudioNodesIfNeeded();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      ctx.resume().then(retryMusicAfterUnlock).catch(() => {});
    } else {
      retryMusicAfterUnlock();
    }
    void loadCutSamples();
    return ctx;
  }

  function playBuffer(buffer, dest, gain, playbackRate, stopAfterSeconds) {
    if (!audioCtx || !dest || !buffer) return;
    const source = audioCtx.createBufferSource();
    const g = audioCtx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate || 1;
    g.gain.value = gain;
    source.connect(g);
    g.connect(dest);
    source.start();
    const stopAfter = Math.max(0.01, stopAfterSeconds || (buffer.duration / (playbackRate || 1)));
    source.stop(audioCtx.currentTime + stopAfter);
    return source;
  }

  function loadCutSamples() {
    if (cutSampleLoadPromise) return cutSampleLoadPromise;
    if (!audioCtx) return Promise.resolve(null);

    cutSampleLoadPromise = Promise.all(Object.entries(CUT_SFX).map(async ([key, src]) => {
      const response = await fetch(src, { cache: 'force-cache' });
      if (!response.ok) throw new Error('Failed to load ' + src);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      cutSampleBuffers[key] = buffer;
    })).then(() => cutSampleBuffers).catch((error) => {
      console.warn('Cut swipe samples failed to load:', error);
      cutSampleBuffers = { air: null, hit: null };
      return null;
    }).finally(() => {
      cutSampleLoadPromise = null;
    });

    return cutSampleLoadPromise;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch (_) { /* ignore */ }
    return { ...DEFAULTS };
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_) { /* ignore */ }
  }

  function get(key) {
    return settings[key];
  }

  function set(key, value) {
    settings[key] = !!value;
    save();
    if (key === 'music') {
      if (value && musicContext) setMusicContext(musicContext);
      else stopMusic();
    }
    syncToggleUI();
  }

  function ensureAudio() {
    return unlockAudio();
  }

  function now() {
    return audioCtx ? audioCtx.currentTime : 0;
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function playOsc(freq, start, dur, type, vol, dest, rampTo) {
    const ctx = audioCtx;
    if (!ctx || !dest) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (rampTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(rampTo, 1), start + dur);
    }
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function playNoise(start, dur, vol, dest, freq) {
    const ctx = audioCtx;
    if (!ctx || !dest) return;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq || 1200;
    filter.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  function sfxDest(name) {
    if (MENU_SFX.has(name)) return menuSfxGain;
    return gameSfxGain;
  }

  function musicConfig() {
    if (musicContext === 'menu') {
      return {
        melody: MENU_MELODY,
        bass: MENU_BASS,
        bpm: 92,
        targetVol: 0.16,
        leadType: 'sine',
        leadVol: 0.11,
        bassVol: 0.09
      };
    }
    return {
      melody: GAME_MELODY,
      bass: GAME_BASS,
      bpm: 108,
      targetVol: 0.24,
      leadType: 'triangle',
      leadVol: 0.14,
      bassVol: 0.1
    };
  }

  function clearMusicTimer() {
    if (musicTimer) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
  }

  function scheduleMusicStep() {
    if (!settings.music || !audioCtx || !musicGain || !musicContext) return;

    const cfg = musicConfig();
    const beatDur = 60 / cfg.bpm;
    const t = now() + 0.05;
    const mel = cfg.melody[musicStep % cfg.melody.length];
    const bass = cfg.bass[musicStep % cfg.bass.length];
    const beat = mel[1] * beatDur;

    playOsc(NOTE[mel[0]], t, beat * 0.9, cfg.leadType, cfg.leadVol, musicGain);
    if (musicContext === 'game') {
      playOsc(NOTE[mel[0]] * 2, t, beat * 0.35, 'sine', 0.04, musicGain);
    }
    playOsc(NOTE[bass[0]], t, beat * 0.95, 'sine', cfg.bassVol, musicGain);

    if (musicContext === 'menu' && musicStep % 2 === 0) {
      playOsc(NOTE.G4, t, beat * 0.12, 'triangle', 0.035, musicGain);
    }
    if (musicContext === 'game' && musicStep % 2 === 0) {
      playOsc(NOTE.E4, t, beat * 0.08, 'sine', 0.06, musicGain);
      playOsc(NOTE.G4, t + beat * 0.5, beat * 0.08, 'sine', 0.05, musicGain);
    }

    musicStep += 1;
    musicTimer = setTimeout(scheduleMusicStep, beat * 1000);
  }

  function fadeMusicTo(vol, durMs, done) {
    if (!musicGain || !audioCtx) {
      if (done) done();
      return;
    }
    const t = now();
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setValueAtTime(musicGain.gain.value, t);
    musicGain.gain.linearRampToValueAtTime(Math.max(vol, 0.0001), t + durMs / 1000);
    setTimeout(() => { if (done) done(); }, durMs + 30);
  }

  function beginMusicLoop() {
    clearMusicTimer();
    musicStep = 0;
    const cfg = musicConfig();
    if (musicGain) musicGain.gain.value = cfg.targetVol;
    if (!isAudioRunning()) {
      musicAwaitingUnlock = true;
      return;
    }
    musicAwaitingUnlock = false;
    scheduleMusicStep();
  }

  function setMusicContext(context) {
    if (!context) {
      stopMusic();
      return;
    }

    if (!settings.music) {
      musicContext = context;
      unlockAudio();
      return;
    }

    const token = ++fadeToken;
    const sameContext = musicContext === context && musicTimer && isAudioRunning() && !musicAwaitingUnlock;

    if (sameContext) {
      unlockAudio();
      return;
    }

    if (musicTimer) {
      fadeMusicTo(0, 180, () => {
        if (token !== fadeToken) return;
        clearMusicTimer();
        musicContext = context;
        beginMusicLoop();
        fadeMusicTo(musicConfig().targetVol, 220);
      });
      unlockAudio();
      return;
    }

    musicContext = context;
    beginMusicLoop();
    unlockAudio();
  }

  function stopMusic() {
    fadeToken += 1;
    clearMusicTimer();
    musicContext = null;
    musicStep = 0;
    if (musicGain && audioCtx) {
      const t = now();
      musicGain.gain.cancelScheduledValues(t);
      musicGain.gain.setValueAtTime(0, t);
    }
  }

  function startMenuMusic() {
    setMusicContext('menu');
  }

  function startGameMusic() {
    setMusicContext('game');
  }

  function vibrate(ms) {
    if (settings.vibration && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  function playSound(name, fn) {
    if (!settings.sound) return;
    const ctx = unlockAudio();
    const dest = sfxDest(name);
    if (!ctx || !dest) return;
    const play = () => fn(dest);
    if (ctx.state === 'running') {
      play();
    } else {
      ctx.resume().then(play).catch(() => {});
    }
  }

  const SOUNDS = {
    cut(payload) {
      playSound('cut', (dest) => {
        const info = payload || {};
        const distance = Math.max(0, info.distance || 0);
        const speed = Math.max(0, info.speed || 0);
        const isHit = !!info.hit;
        const distanceN = clamp01((distance - 12) / 130);
        const speedN = clamp01((speed - 300) / 1900);
        const intensity = clamp01(distanceN * 0.62 + speedN * 0.38);
        const isLongSwipe = intensity > 0.5;
        const airMasterGain = 0.042;
        const hitMasterGain = 0.11;
        const cutMasterGain = isHit ? hitMasterGain : airMasterGain;
        const hitGain = isHit ? 1 : 1;
        const fade = clamp01(info.fade == null ? 1 : info.fade);
        const gain = cutMasterGain * hitGain * fade;
        const kind = isHit ? 'hit' : 'air';
        const buffer = cutSampleBuffers[kind];

        if (buffer) {
          const playbackRate = isHit
            ? lerp(0.92, 0.8, intensity)
            : lerp(1.02, 1.18, intensity);
          const stopAfter = isHit
            ? (buffer.duration * 0.25) / playbackRate
            : buffer.duration / playbackRate;
          playBuffer(buffer, dest, gain, playbackRate, stopAfter);
          if (isHit && isLongSwipe) {
            const accentBuffer = cutSampleBuffers.air || buffer;
            playBuffer(accentBuffer, dest, airMasterGain * fade * 0.32, 1.22);
          }
          return;
        }

        const t = now();
        const fallbackNoiseFreq = isHit ? lerp(3600, 2400, intensity) : lerp(6000, 3800, intensity);
        const fallbackDur = isHit ? lerp(0.03, 0.06, intensity) : lerp(0.018, 0.045, intensity);
        playNoise(t, fallbackDur, lerp(0.65, 1.05, intensity) * gain, dest, fallbackNoiseFreq);
      });
    },

    star() {
      playSound('star', (dest) => {
        const t = now();
        [880, 1174.66, 1318.51].forEach((f, i) => {
          playOsc(f, t + i * 0.06, 0.14, 'sine', 0.09 - i * 0.015, dest);
        });
        playOsc(1760, t + 0.12, 0.2, 'triangle', 0.05, dest);
      });
    },

    win() {
      playSound('win', (dest) => {
        const t = now();
        const fanfare = [
          [523.25, 0], [659.25, 0.1], [783.99, 0.2], [1046.5, 0.32], [1318.51, 0.48]
        ];
        fanfare.forEach(([f, delay]) => {
          playOsc(f, t + delay, 0.22, 'triangle', 0.11, dest);
          playOsc(f * 1.5, t + delay + 0.02, 0.15, 'sine', 0.04, dest);
        });
        setTimeout(() => {
          if (!settings.sound || !gameSfxGain) return;
          playOsc(1567.98, now(), 0.35, 'sine', 0.08, gameSfxGain);
        }, 520);
      });
    },

    lose() {
      playSound('lose', (dest) => {
        const t = now();
        [392, 349.23, 311.13, 261.63].forEach((f, i) => {
          playOsc(f, t + i * 0.14, 0.28, 'sawtooth', 0.05, dest, f * 0.7);
        });
        playNoise(t + 0.1, 0.25, 0.06, dest, 400);
      });
    },

    pop() {
      playSound('pop', (dest) => {
        const t = now();
        playNoise(t, 0.05, 0.1, dest, 1800);
        playOsc(520, t, 0.06, 'sine', 0.1, dest, 890);
        playOsc(780, t + 0.03, 0.08, 'triangle', 0.06, dest, 1200);
      });
    },

    click() {
      playSound('click', (dest) => {
        const t = now();
        playOsc(660, t, 0.05, 'sine', 0.07, dest);
        playOsc(990, t + 0.015, 0.04, 'triangle', 0.04, dest);
      });
    },

    pause() {
      playSound('pause', (dest) => {
        const t = now();
        playOsc(440, t, 0.1, 'sine', 0.06, dest, 330);
        playOsc(330, t + 0.06, 0.12, 'triangle', 0.05, dest, 220);
      });
    },

    bounce() {
      playSound('bounce', (dest) => {
        const t = now();
        playOsc(280, t, 0.08, 'sine', 0.08, dest, 520);
        playOsc(180, t, 0.05, 'triangle', 0.04, dest, 360);
      });
    },

    spike() {
      playSound('spike', (dest) => {
        const t = now();
        playNoise(t, 0.08, 0.14, dest, 800);
        playOsc(150, t, 0.15, 'sawtooth', 0.07, dest, 80);
      });
    },

    loadDone() {
      playSound('loadDone', (dest) => {
        const t = now();
        playOsc(523.25, t, 0.12, 'triangle', 0.08, dest);
        playOsc(659.25, t + 0.1, 0.18, 'sine', 0.09, dest);
        playOsc(783.99, t + 0.22, 0.25, 'triangle', 0.07, dest);
      });
    },

    menuIn() {
      playSound('menuIn', (dest) => {
        const t = now();
        playOsc(392, t, 0.1, 'triangle', 0.07, dest, 523.25);
        playOsc(523.25, t + 0.08, 0.14, 'sine', 0.08, dest);
        playOsc(659.25, t + 0.18, 0.2, 'triangle', 0.06, dest);
      });
    },

    openLevels() {
      playSound('openLevels', (dest) => {
        const t = now();
        playOsc(440, t, 0.08, 'sine', 0.06, dest, 660);
        playOsc(554.37, t + 0.06, 0.1, 'triangle', 0.07, dest, 830);
        playNoise(t, 0.06, 0.05, dest, 1600);
      });
    },

    openSettings() {
      playSound('openSettings', (dest) => {
        const t = now();
        playOsc(587.33, t, 0.07, 'sine', 0.06, dest);
        playOsc(698.46, t + 0.05, 0.09, 'triangle', 0.05, dest);
      });
    },

    back() {
      playSound('back', (dest) => {
        const t = now();
        playOsc(554.37, t, 0.08, 'sine', 0.06, dest, 440);
        playOsc(440, t + 0.06, 0.1, 'triangle', 0.05, dest, 330);
      });
    },

    levelPick() {
      playSound('levelPick', (dest) => {
        const t = now();
        playOsc(659.25, t, 0.08, 'triangle', 0.09, dest);
        playOsc(783.99, t + 0.07, 0.12, 'sine', 0.08, dest);
        playOsc(987.77, t + 0.14, 0.16, 'triangle', 0.06, dest);
        playNoise(t + 0.02, 0.05, 0.04, dest, 2000);
      });
    },

    locked() {
      playSound('locked', (dest) => {
        const t = now();
        playOsc(220, t, 0.12, 'square', 0.05, dest, 160);
        playNoise(t, 0.06, 0.07, dest, 350);
      });
    },

    enterGame() {
      playSound('enterGame', (dest) => {
        const t = now();
        playOsc(440, t, 0.06, 'sine', 0.05, dest, 880);
        playNoise(t, 0.08, 0.06, dest, 2800);
      });
    },

    exitGame() {
      playSound('exitGame', (dest) => {
        const t = now();
        playOsc(880, t, 0.06, 'sine', 0.05, dest, 440);
        playNoise(t, 0.07, 0.05, dest, 1200);
      });
    }
  };

  function play(name, payload) {
    const fn = SOUNDS[name];
    if (fn) fn(payload);
  }

  function syncToggleUI() {
    document.querySelectorAll('[data-setting]').forEach((el) => {
      const key = el.getAttribute('data-setting');
      const on = !!settings[key];
      el.classList.toggle('setting-on', on);
      el.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  function bindToggles(root) {
    (root || document).querySelectorAll('[data-setting]').forEach((el) => {
      el.addEventListener('click', () => {
        const key = el.getAttribute('data-setting');
        set(key, !settings[key]);
        play('click');
      });
    });
    syncToggleUI();
  }

  function initMusicIfEnabled() {
    startGameMusic();
  }

  window.GameSettings = {
    get,
    set,
    play,
    vibrate,
    bindToggles,
    syncToggleUI,
    initMusicIfEnabled,
    setMusicContext,
    startMenuMusic,
    startGameMusic,
    stopMusic,
    unlockAudio: ensureAudio,
    unlockFromGesture
  };

  function bindAudioUnlock() {
    const onGesture = () => {
      unlockFromGesture();
    };
    document.addEventListener('pointerdown', onGesture, { passive: true });
    document.addEventListener('keydown', onGesture);
  }

  bindAudioUnlock();
  bindToggles(document);
})();
