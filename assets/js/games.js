(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // --- DevTools easter-egg greeting ---
  (function consoleEgg() {
    const hue = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hue-color'), 10) || 330) % 360;
    const accent = `hsl(${hue} 82% 62%)`;
    console.log(
      '%cHi — thanks for inspecting. %c\nThere\'s an old-school cheat code somewhere on this page. 🦖',
      `color:${accent};font-weight:700;font-size:14px;font-family:ui-monospace,monospace`,
      'color:#9ca3af;font-size:12px;font-family:ui-monospace,monospace'
    );
  })();

  // --- Konami listener ---
  const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  window.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const expected = SEQ[pos];
    if (k === expected) {
      pos++;
      if (pos === SEQ.length) {
        pos = 0;
        Manager.open();
      }
    } else {
      pos = (k === SEQ[0]) ? 1 : 0;
    }
  });

  // --- Color helpers (read --hue-color live) ---
  function hue() {
    return (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hue-color'), 10) || 330) % 360;
  }
  function getAccent() { return `hsl(${hue()} 82% 62%)`; }
  function getAccentSoft() { return `hsl(${hue()} 88% 75%)`; }

  // --- Overlay manager ---
  const overlay = $('game-overlay');
  const titleEl = $('game-title');
  const backBtn = $('game-back');
  const closeBtn = $('game-close');
  const views = {
    chooser: $('view-chooser'),
    dino: $('view-dino'),
    reaction: $('view-reaction'),
  };

  const Manager = {
    open() {
      overlay.classList.remove('hidden');
      overlay.classList.add('flex');
      document.body.style.overflow = 'hidden';
      this.show('chooser');
    },
    close() {
      Dino.stop();
      Reaction.stop();
      overlay.classList.remove('flex');
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
    },
    show(view) {
      Dino.stop();
      Reaction.stop();
      Object.entries(views).forEach(([k, el]) => { el.hidden = (k !== view); });
      backBtn.hidden = (view === 'chooser');
      titleEl.textContent =
        view === 'dino' ? '🦖 Dino Run'
          : view === 'reaction' ? '⚡ Reaction Time'
            : '🎮 Cheat code unlocked';
      if (view === 'dino') Dino.start();
      else if (view === 'reaction') Reaction.start();
    },
    isOpen() { return !overlay.classList.contains('hidden'); },
    currentView() {
      return Object.entries(views).find(([, el]) => !el.hidden)?.[0] || null;
    }
  };

  closeBtn.addEventListener('click', () => Manager.close());
  backBtn.addEventListener('click', () => Manager.show('chooser'));
  document.querySelectorAll('[data-game]').forEach(b => {
    b.addEventListener('click', () => Manager.show(b.dataset.game));
  });

  // Esc: from a game → chooser; from chooser → close
  window.addEventListener('keydown', (e) => {
    if (!Manager.isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (Manager.currentView() === 'chooser') Manager.close();
      else Manager.show('chooser');
    }
  });

  // --- Dino game ---
  const Dino = (function () {
    const canvas = $('dino-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = $('dino-score');
    const hiEl = $('dino-hi');
    const msgEl = $('dino-msg');

    const W = canvas.width, H = canvas.height;
    const GROUND_Y = H - 40;
    const GRAVITY = 0.7;
    const JUMP_V = -12.5;
    const SPEED_START = 4;
    const SPEED_MAX = 13;
    const SPEED_RAMP = 0.0009;

    let hi = parseInt(localStorage.getItem('dino-hi') || '0', 10);
    let dino, obstacles, clouds, speed, score, frame, running, started, rafId;
    let listenersAttached = false;

    function reset() {
      dino = { x: 60, y: GROUND_Y - 44, w: 44, h: 44, vy: 0, ducking: false, alive: true };
      obstacles = [];
      clouds = [{ x: W * 0.5, y: 50 }, { x: W * 0.9, y: 80 }];
      speed = SPEED_START;
      score = 0;
      frame = 0;
    }

    function spawnObstacle() {
      const isBird = score > 300 && Math.random() < 0.3;
      if (isBird) {
        const altitude = Math.random() < 0.5 ? GROUND_Y - 70 : GROUND_Y - 35;
        obstacles.push({ type: 'bird', x: W + 20, y: altitude, w: 38, h: 24, flap: 0 });
      } else {
        const big = Math.random() < 0.4;
        obstacles.push({ type: 'cactus', x: W + 20, y: GROUND_Y - (big ? 50 : 36), w: big ? 22 : 16, h: big ? 50 : 36 });
      }
    }
    function rectsHit(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function tick() {
      if (!running) return;
      rafId = requestAnimationFrame(tick);
      frame++;

      dino.vy += GRAVITY;
      dino.y += dino.vy;
      const standY = GROUND_Y - dino.h;
      if (dino.y >= standY) { dino.y = standY; dino.vy = 0; }

      if (speed < SPEED_MAX) speed = Math.min(SPEED_MAX, speed + SPEED_RAMP);
      const spawnEvery = Math.max(55, Math.floor(110 - speed * 4));
      if (frame % spawnEvery === 0 && Math.random() < 0.8) spawnObstacle();
      if (frame % 200 === 0) clouds.push({ x: W + 10, y: 30 + Math.random() * 70 });

      obstacles.forEach(o => { o.x -= speed; if (o.type === 'bird') o.flap = (o.flap + 1) % 30; });
      obstacles = obstacles.filter(o => o.x + o.w > -10);
      clouds.forEach(c => c.x -= speed * 0.3);
      clouds = clouds.filter(c => c.x + 60 > 0);

      const hb = dino.ducking
        ? { x: dino.x, y: dino.y + 18, w: dino.w + 12, h: dino.h - 18 }
        : { x: dino.x + 4, y: dino.y + 4, w: dino.w - 8, h: dino.h - 8 };
      for (const o of obstacles) if (rectsHit(hb, o)) { gameOver(); return; }

      score++;
      scoreEl.textContent = String(score).padStart(5, '0');
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const accent = getAccent();
      const accentSoft = getAccentSoft();

      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      clouds.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
        ctx.arc(c.x + 14, c.y + 4, 10, 0, Math.PI * 2);
        ctx.arc(c.x - 14, c.y + 4, 10, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(W, GROUND_Y);
      ctx.stroke();
      ctx.globalAlpha = 0.35;
      const off = (frame * speed) % 20;
      for (let x = -off; x < W; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 6);
        ctx.lineTo(x + 8, GROUND_Y + 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = accent;
      if (dino.ducking && dino.y === GROUND_Y - dino.h) {
        ctx.fillRect(dino.x, dino.y + 18, dino.w + 12, dino.h - 18);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(dino.x + dino.w + 2, dino.y + 22, 3, 3);
      } else {
        ctx.fillRect(dino.x + 8, dino.y + 4, dino.w - 16, dino.h - 8);
        ctx.fillRect(dino.x + 18, dino.y, 22, 18);
        ctx.fillRect(dino.x, dino.y + 16, 12, 8);
        const onGround = dino.y === GROUND_Y - dino.h;
        const step = onGround ? Math.floor(frame / 6) % 2 : 0;
        ctx.fillRect(dino.x + 12, dino.y + dino.h - 6, 6, 8 - step * 4);
        ctx.fillRect(dino.x + 24, dino.y + dino.h - 6, 6, 4 + step * 4);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(dino.x + 32, dino.y + 6, 3, 3);
      }

      obstacles.forEach(o => {
        if (o.type === 'cactus') {
          ctx.fillStyle = accentSoft;
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.fillRect(o.x - 4, o.y + 8, 4, o.h / 2);
          ctx.fillRect(o.x + o.w, o.y + 12, 4, o.h / 2);
        } else {
          ctx.fillStyle = accentSoft;
          const wingUp = o.flap < 15;
          ctx.fillRect(o.x + 8, o.y + 8, 22, 8);
          ctx.fillRect(o.x + 28, o.y + 6, 10, 6);
          if (wingUp) ctx.fillRect(o.x + 6, o.y - 6, 18, 8);
          else ctx.fillRect(o.x + 6, o.y + 14, 18, 8);
        }
      });
    }

    function gameOver() {
      running = false;
      dino.alive = false;
      if (score > hi) {
        hi = score;
        localStorage.setItem('dino-hi', String(hi));
      }
      hiEl.textContent = String(hi).padStart(5, '0');
      msgEl.innerHTML =
        '<p class="text-white text-2xl font-extrabold">Game Over</p>' +
        '<p class="text-zinc-400 text-sm mt-1">Score ' + score + ' · HI ' + hi + '</p>' +
        '<p class="text-zinc-500 text-xs mt-3">Press <kbd class="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono">Space</kbd> to restart</p>';
      msgEl.classList.remove('hidden');
      started = false;
    }

    function startGame() {
      reset();
      msgEl.classList.add('hidden');
      running = true;
      started = true;
      tick();
    }

    function onKeydown(e) {
      if (views.dino.hidden) return;
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!started) { startGame(); return; }
        if (running && dino.y === GROUND_Y - dino.h) dino.vy = JUMP_V;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (running) dino.ducking = true;
      }
    }
    function onKeyup(e) {
      if (views.dino.hidden) return;
      if (e.key === 'ArrowDown' && dino) dino.ducking = false;
    }

    return {
      start() {
        hiEl.textContent = String(hi).padStart(5, '0');
        scoreEl.textContent = '00000';
        reset();
        running = false;
        started = false;
        if (rafId) cancelAnimationFrame(rafId);
        msgEl.innerHTML =
          '<p class="text-white text-lg font-bold">Press <kbd class="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-sm">Space</kbd> to start</p>' +
          '<p class="text-zinc-400 text-xs">Space / ↑ to jump · ↓ to duck</p>';
        msgEl.classList.remove('hidden');
        draw();
        if (!listenersAttached) {
          window.addEventListener('keydown', onKeydown);
          window.addEventListener('keyup', onKeyup);
          listenersAttached = true;
        }
      },
      stop() {
        running = false;
        started = false;
        if (rafId) cancelAnimationFrame(rafId);
      }
    };
  })();

  // --- Reaction time game ---
  const Reaction = (function () {
    const stage = $('reaction-stage');
    const msg = $('reaction-msg');
    const sub = $('reaction-sub');
    const bestEl = $('reaction-best');
    const lastEl = $('reaction-last');

    let best = parseInt(localStorage.getItem('reaction-best') || '0', 10);
    let state = 'idle'; // idle | waiting | go | done | early
    let waitTimer = null;
    let goTime = 0;

    function setStage(cls) {
      stage.className =
        'aspect-[16/6] flex flex-col items-center justify-center cursor-pointer select-none transition-colors duration-150 px-6 ' + cls;
    }
    function refreshBest() { bestEl.textContent = best ? best + ' ms' : '— ms'; }

    function toIdle() {
      state = 'idle';
      msg.textContent = 'Click to start';
      sub.textContent = 'Wait for green, then click as fast as you can.';
      setStage('bg-zinc-900 hover:bg-zinc-800');
    }
    function toWaiting() {
      state = 'waiting';
      msg.textContent = 'Wait…';
      sub.textContent = "Don't click yet.";
      setStage('bg-red-600/80');
      waitTimer = setTimeout(toGo, 1200 + Math.random() * 2800);
    }
    function toGo() {
      if (state !== 'waiting') return;
      state = 'go';
      goTime = performance.now();
      msg.textContent = 'CLICK!';
      sub.textContent = '';
      setStage('bg-emerald-500/90');
    }

    function rate(ms) {
      if (ms < 200) return 'Lightning fast.';
      if (ms < 260) return 'Excellent.';
      if (ms < 320) return 'Solid.';
      if (ms < 400) return 'Decent.';
      return 'Try again to improve.';
    }

    function handleAction() {
      if (state === 'idle' || state === 'done' || state === 'early') {
        toWaiting();
      } else if (state === 'waiting') {
        clearTimeout(waitTimer);
        state = 'early';
        msg.textContent = 'Too soon!';
        sub.textContent = 'Click to try again.';
        setStage('bg-amber-500/80');
      } else if (state === 'go') {
        const ms = Math.round(performance.now() - goTime);
        lastEl.textContent = ms + ' ms';
        if (!best || ms < best) {
          best = ms;
          localStorage.setItem('reaction-best', String(best));
          refreshBest();
        }
        state = 'done';
        msg.textContent = ms + ' ms';
        sub.textContent = rate(ms) + ' Click to retry.';
        setStage('bg-zinc-900 hover:bg-zinc-800');
      }
    }

    function onKeydown(e) {
      if (views.reaction.hidden) return;
      if (e.code === 'Space') { e.preventDefault(); handleAction(); }
    }

    let listenersAttached = false;

    return {
      start() {
        refreshBest();
        lastEl.textContent = '— ms';
        toIdle();
        if (!listenersAttached) {
          stage.addEventListener('click', handleAction);
          window.addEventListener('keydown', onKeydown);
          listenersAttached = true;
        }
      },
      stop() {
        if (waitTimer) clearTimeout(waitTimer);
        state = 'idle';
      }
    };
  })();

})();
