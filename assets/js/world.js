// The 3D scroll story: Himalaya → work path in the sky → stack sphere → project ring → globe in orbit.
// Each <section data-chapter> owns a camera pose; scrolling moves the camera between them.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const root = document.documentElement;
const canvas = document.getElementById('world');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fallback() {
  root.classList.add('no-webgl');
  if (canvas) canvas.remove();
}

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: window.innerWidth >= 768 });
} catch (e) {
  renderer = null;
}
if (!renderer) fallback();
else start().catch((e) => { console.error(e); fallback(); });

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
const JOBS = [
  { role: 'Senior Full Stack Engineer', company: 'Codexx', dates: 'Jan 2025 — Present', where: 'Remote · Kathmandu',
    bullets: ['Node.js + Express services', 'Payment gateway integrations, query tuning', 'Real-time analytics over WebSockets', 'Monorepo ownership, mentoring juniors'] },
  { role: 'Software Engineer', company: 'Acid Integrations', dates: 'Jun 2023 — Apr 2025', where: 'Remote · Ontario, Canada',
    bullets: ['Redis-backed queues and batch processing', '11Hype: scouting tool with LLMs + vision', 'Motion-tracking pipelines for physiotherapy', 'Job Manager for activity tracking'] },
  { role: 'Consultant Backend Engineer', company: 'Manage Vehicle', dates: 'Apr 2024 — Sep 2024', where: 'Contract · Australia',
    bullets: ['DVR system integration', 'Legacy PHP services migrated to Node.js', 'AWS S3 file operations'] },
  { role: 'Associate Engineer, QA', company: 'Rasan Technologies', dates: 'Jan 2022 — Aug 2022', where: 'Remote · Kathmandu',
    bullets: ['B2B platform on Python and Django', 'Manual testing across API, web and mobile'] },
  { role: 'Associate Engineer, QA', company: 'Clamphook', dates: 'Jun 2021 — Dec 2021', where: 'Remote · Kathmandu',
    bullets: ['Tested an IOE learning platform in Python', 'Bug tracking, reproducible regression reports'] },
  { role: 'B.E. Computer Engineering', company: 'Pokhara University', dates: 'Education · 2019 — 2024', where: 'MBMAN · Urlabari, Morang',
    bullets: ['+2 · Siddhartha HSBS · 2017 — 2019', 'SEE · Suryodaya English School · 2017'], edu: true },
];

const PROJECTS = [
  { title: 'Deluxe Hakka & Momo', desc: 'Online ordering, order tracking and catering requests for a halal Indo-Chinese restaurant in Mississauga.',
    meta: 'Next.js · 2026', url: 'https://www.deluxehakka.com/', img: 'assets/img/projects/deluxe-hakka.jpg', live: true },
  { title: 'D-Town, Damak', desc: 'Food, a pool, DJ nights and rooms at Himabi Chowk — one fast page that sells all of it.',
    meta: 'HTML/CSS · live', url: 'https://dtownbistro.com.np', img: 'assets/img/projects/dtown.jpg', live: true },
  { title: 'SpotBee', desc: 'Paste a Spotify playlist, get a YouTube link for every track.', meta: 'Python · 2021',
    url: 'https://github.com/thenishantsapkota/spotbee',
    term: ['$ python spotbee.py open.spotify.com/playlist/…', '→ resolving 37 tracks', '✓ youtu.be links written to playlist.txt'] },
  { title: 'Character Certificate Manager', desc: 'Issue, track and verify character certificates for schools and colleges.', meta: 'Django · 2022',
    url: 'https://github.com/thenishantsapkota/CCMS',
    term: ['GET /certificates/verify/PU-2022-0147', '→ 200 OK', '✓ { "valid": true, "issued": "2022-08-14" }'] },
  { title: 'PU Result → JSON', desc: 'Parses Pokhara University result PDFs into structured JSON.', meta: 'Python · 2022',
    url: 'https://github.com/thenishantsapkota',
    term: ['$ pu2json results-fall-2022.pdf', '→ 1,284 rows across 41 pages', '✓ results.json'] },
  { title: 'PyBlogger', desc: 'A small Django blog with post management and a clean reading view.', meta: 'Django · 2022',
    url: 'https://github.com/thenishantsapkota',
    term: ['$ python manage.py runserver', '→ Watching for file changes', '✓ http://127.0.0.1:8000/'] },
  { title: 'JobSeeker', desc: 'Job portal matching applicants with openings.', meta: 'Django · 2022',
    url: 'https://github.com/thenishantsapkota',
    term: ['GET /jobs?q=django&location=remote', '→ 200 OK', '✓ 12 openings'] },
];

// [label, group, simple-icons slug (vendored in assets/img/icons), brand colour]
const STACK = [
  ['TypeScript', 'lang', 'typescript', '#3178C6'], ['JavaScript', 'lang', 'javascript', '#F7DF1E'], ['Python', 'lang', 'python', '#3776AB'],
  ['React', 'fw', 'react', '#61DAFB'], ['Next.js', 'fw', 'nextdotjs', null], ['NestJS', 'fw', 'nestjs', '#E0234E'],
  ['Express', 'fw', 'express', null], ['Node.js', 'fw', 'nodedotjs', '#5FA04E'], ['Django', 'fw', 'django', '#44B78B'],
  ['PostgreSQL', 'data', 'postgresql', '#4169E1'], ['Redis', 'data', 'redis', '#FF4438'], ['AWS S3', 'data', 'amazons3', '#569A31'],
  ['WebSockets', 'data', 'socketdotio', null], ['Git', 'data', 'git', '#F05032'], ['Linux', 'data', 'linux', '#FCC624'],
  ['Postman', 'qa', 'postman', '#FF6C37'], ['Selenium', 'qa', 'selenium', '#43B02A'], ['Jira', 'qa', 'jira', '#2684FF'],
  ['Manual testing', 'qa', null, null],
];
// stroked checklist glyph for "Manual testing" (no brand mark exists)
const CHECKLIST = ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'];

const PLACES = {
  damak: [26.66, 87.70],
  kathmandu: [27.72, 85.32],
  ontario: [43.59, -79.64],
  australia: [-33.87, 151.21],
};

// ---------------------------------------------------------------------------
async function start() {
  const { clamp, lerp, smoothstep, smootherstep } = THREE.MathUtils;
  const $ = (id) => document.getElementById(id);
  let mobile = window.innerWidth < 768;

  let dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 13, 46);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);

  // ---- theme tokens from CSS -------------------------------------------------
  const theme = {};
  function readTheme() {
    const cs = getComputedStyle(root);
    const trip = (n) => cs.getPropertyValue(n).trim().split(/\s+/).map(Number);
    theme.rgb = { bg: trip('--bg'), fg: trip('--fg'), muted: trip('--muted'), surface: trip('--surface') };
    theme.dark = root.classList.contains('dark');
    theme.hue = (((parseInt(cs.getPropertyValue('--hue-color'), 10) || 330) % 360) + 360) % 360;
    theme.css = (k, a = 1) => `rgba(${theme.rgb[k].join(',')},${a})`;
    theme.accentCss = theme.dark ? `hsl(${theme.hue} 70% 66%)` : `hsl(${theme.hue} 58% 40%)`;
    // raw (no colour management) for ShaderMaterial uniforms
    theme.raw = (k) => new THREE.Color(theme.rgb[k][0] / 255, theme.rgb[k][1] / 255, theme.rgb[k][2] / 255);
    theme.rawAccent = new THREE.Color().setHSL(theme.hue / 360, theme.dark ? 0.7 : 0.58, theme.dark ? 0.66 : 0.4);
    // managed (sRGB) for built-in materials
    theme.srgb = (k) => new THREE.Color().setRGB(theme.rgb[k][0] / 255, theme.rgb[k][1] / 255, theme.rgb[k][2] / 255, THREE.SRGBColorSpace);
    theme.srgbAccent = new THREE.Color().setHSL(theme.hue / 360, theme.dark ? 0.7 : 0.58, theme.dark ? 0.66 : 0.4, THREE.SRGBColorSpace);
  }
  readTheme();

  // Canvas text needs the web fonts; don't wait forever for them.
  try {
    await Promise.race([
      Promise.all(['600 64px Geist', '500 40px Geist', '400 30px Geist', '400 28px "Geist Mono"', 'italic 48px "Instrument Serif"']
        .map((f) => document.fonts.load(f))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (e) { /* fall back to system fonts */ }

  // ---- canvas helpers -------------------------------------------------------
  function canvasTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    return tex;
  }
  function wrapLines(ctx, text, maxW) {
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  const loadImage = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

  // ===========================================================================
  // 1. Himalaya ridgeline (particles)
  // ===========================================================================
  const W = 40, D = 30, ZF = 7;
  const NX = mobile ? 120 : 220, NZ = mobile ? 80 : 140;
  function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  function ridged(x, y) {
    let sum = 0, amp = 0.55, freq = 1, prev = 1;
    for (let o = 0; o < 5; o++) {
      let n = 1 - Math.abs(vnoise(x * freq, y * freq) * 2 - 1);
      n *= n; sum += n * amp * prev; prev = n; freq *= 2.05; amp *= 0.5;
    }
    return sum;
  }
  function heightAt(x, z) {
    const zn = (ZF - z) / D;
    const back = smoothstep(zn, 0.3, 0.8);
    return Math.pow(ridged(x * 0.15 + 3.1, z * 0.15 + 7.7), 2.1) * (0.25 + back * 13.0);
  }

  const mCount = NX * NZ;
  const mPos = new Float32Array(mCount * 3), mH = new Float32Array(mCount), mSeed = new Float32Array(mCount);
  let maxH = 0;
  for (let j = 0, k = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++, k++) {
      const x = (i / (NX - 1) - 0.5) * W, z = ZF - (j / (NZ - 1)) * D, h = heightAt(x, z);
      mPos[k * 3] = x; mPos[k * 3 + 2] = z; mH[k] = h; mSeed[k] = Math.random();
      if (h > maxH) maxH = h;
    }
  }
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  mGeo.setAttribute('aH', new THREE.BufferAttribute(mH, 1));
  mGeo.setAttribute('aSeed', new THREE.BufferAttribute(mSeed, 1));

  const MAX_RIPPLES = 6;
  const mU = {
    uTime: { value: 0 }, uPR: { value: dpr }, uSize: { value: mobile ? 30 : 36 }, uMaxH: { value: maxH },
    uMouse: { value: new THREE.Vector3(999, 0, 999) }, uMouseAmt: { value: 0 },
    uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0)) },
    uBase: { value: new THREE.Color() }, uAccent: { value: new THREE.Color() }, uSnow: { value: new THREE.Color() },
    uOpacity: { value: 1 },
  };
  const mMat = new THREE.ShaderMaterial({
    uniforms: mU, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute float aH; attribute float aSeed;
      uniform float uTime, uPR, uSize, uMaxH, uMouseAmt;
      uniform vec3 uMouse; uniform vec4 uRipples[${MAX_RIPPLES}];
      varying float vGlow, vSnow, vFade;
      void main() {
        vec3 p = position; p.y = aH;
        float dm = distance(p.xz, uMouse.xz);
        float swell = exp(-dm * dm * 0.45) * uMouseAmt;
        p.y += swell * 1.1;
        float ring = 0.0;
        for (int i = 0; i < ${MAX_RIPPLES}; i++) {
          vec4 r = uRipples[i]; float t = uTime - r.z;
          if (t < 0.0 || t > 4.0) continue;
          float d = distance(p.xz, r.xy);
          ring += exp(-pow((d - t * 5.5) * 1.6, 2.0)) * exp(-t * 0.9) * r.w;
        }
        p.y += ring * 0.75;
        p.y += sin(p.x * 0.7 + uTime * 0.5 + aSeed * 6.2831) * 0.025;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float hn = aH / uMaxH;
        vGlow = clamp(swell * 1.2 + ring * 1.4, 0.0, 1.0);
        vSnow = smoothstep(0.25, 0.75, hn);
        vFade = smoothstep(60.0, 22.0, -mv.z) * smoothstep(1.0, 4.5, -mv.z);
        gl_PointSize = max(uSize * uPR * (0.35 + hn * 1.4 + vGlow * 1.6) / -mv.z, (1.4 + hn * 1.6) * uPR);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBase, uAccent, uSnow; uniform float uOpacity;
      varying float vGlow, vSnow, vFade;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        vec3 col = mix(mix(uBase, uSnow, vSnow), uAccent, vGlow);
        float a = smoothstep(0.5, 0.1, r) * vFade * uOpacity * (0.32 + vSnow * 0.68 + vGlow * 0.6);
        gl_FragColor = vec4(col, a);
      }`,
  });
  const mountains = new THREE.Points(mGeo, mMat);
  scene.add(mountains);

  // ===========================================================================
  // Stars / dust along the whole flight path
  // ===========================================================================
  const starN = mobile ? 900 : 1700;
  const starPos = new Float32Array(starN * 3);
  for (let i = 0; i < starN; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 140;
    starPos[i * 3 + 1] = 6 + Math.random() * 60;
    starPos[i * 3 + 2] = 20 - Math.random() * 210;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.5, depthWrite: false, fog: false });
  scene.add(new THREE.Points(starGeo, starMat));

  // ===========================================================================
  // 2. Work: cards floating along a path in the sky
  // ===========================================================================
  const WORK = { y: 20, z0: -12, gap: 7, w: 4.8, h: 3 };
  const workGroup = new THREE.Group();
  scene.add(workGroup);
  const cardGeo = new THREE.PlaneGeometry(WORK.w, WORK.h);
  const jobCards = JOBS.map(() => {
    const m = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
    workGroup.add(m);
    return m;
  });
  const workX = (i) => (i % 2 ? 1 : -1) * (mobile ? 0.2 : 1.6);

  function drawJob(job, i) {
    return canvasTexture(1024, 640, (ctx, w, h) => {
      ctx.beginPath(); ctx.roundRect(4, 4, w - 8, h - 8, 40);
      ctx.fillStyle = theme.css('surface', 0.94); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = theme.css('fg', 0.14); ctx.stroke();

      ctx.font = '600 230px Geist'; ctx.textAlign = 'right'; ctx.fillStyle = theme.css('fg', 0.05);
      ctx.fillText(String(i + 1).padStart(2, '0'), w - 44, h - 36);
      ctx.textAlign = 'left';

      ctx.fillStyle = theme.accentCss;
      ctx.beginPath(); ctx.arc(70, 80, 8, 0, Math.PI * 2); ctx.fill();
      ctx.font = '400 26px "Geist Mono"'; ctx.fillText(job.dates, 92, 89);
      ctx.textAlign = 'right'; ctx.fillStyle = theme.css('muted'); ctx.fillText(job.where, w - 64, 89); ctx.textAlign = 'left';

      ctx.font = '600 60px Geist'; ctx.fillStyle = theme.css('fg');
      let y = 190;
      for (const line of wrapLines(ctx, job.role, w - 128)) { ctx.fillText(line, 64, y); y += 66; }

      y += 6;
      ctx.font = 'italic 48px "Instrument Serif"'; ctx.fillStyle = theme.css('muted');
      ctx.fillText(job.edu ? 'from' : 'at', 64, y);
      const off = ctx.measureText(job.edu ? 'from ' : 'at ').width;
      ctx.font = '500 46px Geist'; ctx.fillStyle = theme.css('fg'); ctx.fillText(job.company, 64 + off + 4, y);

      y += 70;
      ctx.font = '400 29px Geist'; ctx.fillStyle = theme.css('fg', 0.72);
      for (const b of job.bullets) { ctx.fillText('— ' + b, 64, y); y += 44; }
    });
  }

  // ===========================================================================
  // 3. Stack: draggable sphere of labels
  // ===========================================================================
  const STACK_C = new THREE.Vector3(0, 21, -62);
  const STACK_R = 2.25;
  const stackGroup = new THREE.Group();
  const stackSpin = new THREE.Group();
  stackGroup.add(stackSpin);
  scene.add(stackGroup);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const stackSprites = STACK.map(([name, cat, slug, brand], i) => {
    const y = 1 - (i / (STACK.length - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * golden;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false }));
    s.position.set(Math.cos(th) * r * STACK_R, y * STACK_R, Math.sin(th) * r * STACK_R);
    s.userData = { name, cat, slug, brand, base: 0.36, hl: 0 };
    stackSpin.add(s);
    return s;
  });

  function drawPill(text, dot, font = '500 40px Geist', icon = null) {
    const H = 88;
    const m = document.createElement('canvas').getContext('2d');
    m.font = font;
    const lead = icon ? 56 : dot ? 28 : 0;
    const Wd = Math.ceil(m.measureText(text).width + 60 + lead);
    const tex = canvasTexture(Wd, H, (ctx, w, h) => {
      ctx.beginPath(); ctx.roundRect(2, 2, w - 4, h - 4, (h - 4) / 2);
      ctx.fillStyle = theme.css('surface', 0.92); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = theme.css('fg', 0.16); ctx.stroke();
      let x = 30;
      if (icon) {
        const size = 40, sc = size / 24;
        ctx.save();
        ctx.translate(x - 4, (h - size) / 2);
        ctx.scale(sc, sc);
        if (icon.paths) { ctx.fillStyle = icon.colour; icon.paths.forEach((p) => ctx.fill(p)); }
        else { ctx.strokeStyle = icon.colour; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; CHECKLIST.forEach((d) => ctx.stroke(new Path2D(d))); }
        ctx.restore();
        x += 56;
      } else if (dot) { ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(x + 7, h / 2, 8, 0, Math.PI * 2); ctx.fill(); x += 28; }
      ctx.font = font; ctx.fillStyle = theme.css('fg'); ctx.fillText(text, x, h / 2 + 14);
    });
    return { tex, aspect: Wd / H };
  }

  // brand icons → Path2D (fetched once from the vendored SVGs)
  const icons = {};
  await Promise.all(STACK.filter((x) => x[2]).map(async ([, , slug]) => {
    try {
      const svg = await (await fetch(`assets/img/icons/${slug}.svg`)).text();
      icons[slug] = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => new Path2D(m[1]));
    } catch (e) { /* label still renders without an icon */ }
  }));
  // keep brand colours readable on either theme
  function iconColour(hex) {
    if (!hex) return theme.css('fg');
    const c = new THREE.Color(hex), bg = theme.rgb.bg.map((v) => v / 255);
    const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const l1 = lum(c.r, c.g, c.b), l2 = lum(...bg);
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return contrast < 2.2 ? theme.css('fg') : hex;
  }

  // ===========================================================================
  // 4. Projects: a deck of screenshots
  // ===========================================================================
  const RING = { c: new THREE.Vector3(0, 21, -100), r: 5.6, w: 4, h: 2.5 };
  const ringGroup = new THREE.Group();
  scene.add(ringGroup);
  const ringGeo = new THREE.PlaneGeometry(RING.w, RING.h);
  const projCards = PROJECTS.map((p, i) => {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
    m.userData.index = i;
    ringGroup.add(m);
    return m;
  });
  // k = card index minus current position: 0 is the front card, >0 waits in the deck, <0 has been dealt off to the left
  function placeCard(m, k) {
    if (k >= 0) {
      const kk = Math.min(k, 3.5);
      m.position.set(kk * (mobile ? 0.22 : 1.05), kk * (mobile ? 0.32 : 0.16), -kk * (mobile ? 1.15 : 0.95));
      m.rotation.set(0, -Math.min(k, 1) * 0.22, 0);
      m.material.opacity = k > 3.5 ? 0 : 1 - kk * 0.24;
    } else {
      m.position.set(k * (mobile ? 3.2 : 6), -k * 0.15, k * 0.6);
      m.rotation.set(0, -k * 0.5, k * 0.06);
      m.material.opacity = clamp(1 + k * 1.3, 0, 1);
    }
    m.visible = m.material.opacity > 0.01;
  }

  async function drawProject(p) {
    const img = p.img ? await loadImage(p.img).catch(() => null) : null;
    return canvasTexture(1280, 800, (ctx, w, h) => {
      ctx.save();
      ctx.beginPath(); ctx.roundRect(3, 3, w - 6, h - 6, 34); ctx.clip();
      if (img) {
        const s = Math.max(w / img.width, h / img.height);
        ctx.drawImage(img, (w - img.width * s) / 2, 0, img.width * s, img.height * s);
      } else {
        // terminal-style cover: the output is the picture, the title lives in the page copy
        ctx.fillStyle = '#121211'; ctx.fillRect(0, 0, w, h);
        const glow = ctx.createRadialGradient(w * 0.85, h * 0.1, 0, w * 0.85, h * 0.1, w * 0.7);
        glow.addColorStop(0, `hsla(${theme.hue}, 70%, 60%, 0.16)`); glow.addColorStop(1, 'hsla(0,0%,0%,0)');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(236,233,226,0.045)'; ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        ctx.fillStyle = 'rgba(236,233,226,0.06)'; ctx.fillRect(0, 0, w, 96);
        ['#ff5f57', '#febc2e', '#28c840'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(52 + k * 32, 48, 10, 0, Math.PI * 2); ctx.fill(); });
        ctx.font = '400 26px "Geist Mono"'; ctx.fillStyle = 'rgba(236,233,226,0.55)'; ctx.textAlign = 'center';
        ctx.fillText('~/' + p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), w / 2, 57);
        ctx.textAlign = 'left';
        ctx.font = '400 40px "Geist Mono"';
        let y = 250;
        p.term.forEach((line, k) => {
          ctx.fillStyle = k === 0 ? '#ece9e2' : k === p.term.length - 1 ? `hsl(${theme.hue} 70% 66%)` : 'rgba(236,233,226,0.5)';
          for (const l of wrapLines(ctx, line, w - 150)) { ctx.fillText(l, 72, y); y += 64; }
          y += 18;
        });
        ctx.fillStyle = '#ece9e2'; ctx.fillText('$', 72, y + 10);
        ctx.fillStyle = `hsl(${theme.hue} 70% 66%)`; ctx.fillRect(112, y - 22, 22, 40);
        ctx.font = '400 24px "Geist Mono"'; ctx.fillStyle = 'rgba(236,233,226,0.35)'; ctx.textAlign = 'right';
        ctx.fillText(p.meta.toLowerCase(), w - 56, h - 48); ctx.textAlign = 'left';
      }
      ctx.restore();
      ctx.beginPath(); ctx.roundRect(3, 3, w - 6, h - 6, 34);
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(236,233,226,0.18)'; ctx.stroke();
    });
  }

  // ===========================================================================
  // 5. Globe in orbit, pinned on Damak
  // ===========================================================================
  const GLOBE = { c: new THREE.Vector3(0, 21, -148), r: 3.3 };
  const globeGroup = new THREE.Group();
  const globeTilt = new THREE.Group();
  const globeSpin = new THREE.Group();
  globeGroup.add(globeTilt); globeTilt.add(globeSpin);
  scene.add(globeGroup);
  const ll = (lat, lon, r) => {
    const p = THREE.MathUtils.degToRad(lat), l = THREE.MathUtils.degToRad(lon);
    return new THREE.Vector3(r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l));
  };

  const occluder = new THREE.Mesh(new THREE.SphereGeometry(GLOBE.r * 0.985, 48, 32), new THREE.MeshBasicMaterial({ fog: false }));
  globeSpin.add(occluder);

  // land dots from a small water/land mask
  let landPts = [];
  try {
    const mask = await loadImage('assets/img/earth-mask.png');
    const mc = document.createElement('canvas'); mc.width = mask.width; mc.height = mask.height;
    const mctx = mc.getContext('2d'); mctx.drawImage(mask, 0, 0);
    const data = mctx.getImageData(0, 0, mask.width, mask.height).data;
    const N = mobile ? 14000 : 26000;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, lat = Math.asin(y) * 180 / Math.PI;
      const th = i * golden, lon = ((Math.atan2(Math.sin(th), Math.cos(th)) * 180) / Math.PI);
      const px = Math.min(mask.width - 1, Math.floor(((lon + 180) / 360) * mask.width));
      const py = Math.min(mask.height - 1, Math.floor(((90 - lat) / 180) * mask.height));
      if (data[(py * mask.width + px) * 4] < 110) landPts.push(ll(lat, lon, GLOBE.r));
    }
  } catch (e) {
    for (let i = 0; i < 4000; i++) {
      const y = 1 - (i / 3999) * 2, r = Math.sqrt(1 - y * y), th = i * golden;
      landPts.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(GLOBE.r));
    }
  }
  const landGeo = new THREE.BufferGeometry().setFromPoints(landPts);
  const gU = { uColor: { value: new THREE.Color() }, uPR: { value: dpr }, uSize: { value: mobile ? 34 : 40 } };
  const landMat = new THREE.ShaderMaterial({
    uniforms: gU, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uPR, uSize; varying float vFacing;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFacing = normalize(normalMatrix * normalize(position)).z;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPR / -mv.z;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; varying float vFacing;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        gl_FragColor = vec4(uColor, smoothstep(0.5, 0.15, r) * smoothstep(-0.1, 0.45, vFacing) * 0.9);
      }`,
  });
  globeSpin.add(new THREE.Points(landGeo, landMat));

  // halo
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false }));
  halo.scale.setScalar(GLOBE.r * 3.1);
  globeGroup.add(halo);

  // pin + pulse on Damak
  const damak = ll(...PLACES.damak, GLOBE.r);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ fog: false }));
  pin.position.copy(damak).multiplyScalar(1.005);
  globeSpin.add(pin);
  const pulse = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.1, 48), new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, fog: false, depthWrite: false }));
  pulse.position.copy(damak).multiplyScalar(1.01);
  pulse.lookAt(damak.clone().multiplyScalar(2));
  globeSpin.add(pulse);

  // arcs to where the teams were
  const arcU = { uTime: { value: 0 }, uColor: { value: new THREE.Color() } };
  const arcMat = new THREE.ShaderMaterial({
    uniforms: arcU, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute float aT; attribute float aOff; varying float vT; varying float vOff;
      void main() { vT = aT; vOff = aOff; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uColor; varying float vT; varying float vOff;
      void main() {
        float head = fract(vT - uTime * 0.35 + vOff);
        gl_FragColor = vec4(uColor, 0.22 + 0.78 * smoothstep(0.82, 1.0, head));
      }`,
  });
  const endDots = [];
  ['kathmandu', 'ontario', 'australia'].forEach((key, k) => {
    const end = ll(...PLACES[key], GLOBE.r);
    const lift = 1.12 + damak.angleTo(end) * 0.28;
    const mid = damak.clone().add(end).normalize().multiplyScalar(GLOBE.r * lift);
    const pts = new THREE.QuadraticBezierCurve3(damak, mid, end).getPoints(90);
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(pts.map((_, i) => i / (pts.length - 1))), 1));
    g.setAttribute('aOff', new THREE.BufferAttribute(new Float32Array(pts.length).fill(k * 0.33), 1));
    globeSpin.add(new THREE.Line(g, arcMat));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshBasicMaterial({ fog: false }));
    dot.position.copy(end).multiplyScalar(1.004);
    globeSpin.add(dot);
    endDots.push(dot);
  });

  const LABELS = [['Damak · home', [PLACES.damak[0] + 9, PLACES.damak[1] - 4]], ['Ontario', [PLACES.ontario[0] + 7, PLACES.ontario[1]]], ['Australia', [PLACES.australia[0] - 7, PLACES.australia[1]]]];
  const labelSprites = LABELS.map(([text, at]) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false }));
    s.position.copy(ll(...at, GLOBE.r * 1.16));
    s.userData.text = text;
    globeSpin.add(s);
    return s;
  });

  // ===========================================================================
  // Theme-dependent assets (rebuilt on toggle)
  // ===========================================================================
  function haloTexture() {
    return canvasTexture(256, 256, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w / 2);
      g.addColorStop(0, `hsla(${theme.hue}, 70%, ${theme.dark ? 66 : 45}%, ${theme.dark ? 0.28 : 0.18})`);
      g.addColorStop(1, `hsla(${theme.hue}, 70%, 60%, 0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
  }
  function swap(mat, tex) { if (mat.map) mat.map.dispose(); mat.map = tex; mat.needsUpdate = true; }

  function applyTheme() {
    readTheme();
    const bg = theme.srgb('bg');
    scene.fog.color.copy(bg);
    occluder.material.color.copy(bg);
    starMat.color.copy(theme.srgb('fg'));
    mU.uBase.value.copy(theme.raw('muted'));
    mU.uSnow.value.copy(theme.raw('fg'));
    mU.uAccent.value.copy(theme.rawAccent);
    mMat.blending = theme.dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    mMat.needsUpdate = true;
    gU.uColor.value.copy(theme.raw('muted')).lerp(theme.raw('fg'), 0.35);
    arcU.uColor.value.copy(theme.rawAccent);
    pin.material.color.copy(theme.srgbAccent);
    pulse.material.color.copy(theme.srgbAccent);
    endDots.forEach((d) => d.material.color.copy(theme.srgb('fg')));

    jobCards.forEach((m, i) => swap(m.material, drawJob(JOBS[i], i)));
    stackSprites.forEach((s) => {
      const { slug, brand } = s.userData;
      const { tex, aspect } = drawPill(s.userData.name, null, '500 40px Geist', { paths: slug ? icons[slug] : null, colour: iconColour(brand) });
      swap(s.material, tex);
      s.userData.aspect = aspect;
    });
    labelSprites.forEach((s) => {
      const { tex, aspect } = drawPill(s.userData.text, null, '400 34px "Geist Mono"');
      swap(s.material, tex);
      s.scale.set(0.3 * aspect, 0.3, 1);
    });
    swap(halo.material, haloTexture());
    scene.traverse((o) => { if (o.material && o.material.map) renderer.initTexture(o.material.map); });
  }
  applyTheme();
  window.addEventListener('themechange', () => { applyTheme(); });

  // project textures are theme-independent; load once, upload immediately so the ring never hitches
  Promise.all(PROJECTS.map(drawProject)).then((texes) => texes.forEach((t, i) => { swap(projCards[i].material, t); renderer.initTexture(t); }));

  // ===========================================================================
  // Layout (desktop puts 3D on the right of the copy, mobile centres it)
  // ===========================================================================
  function layout() {
    jobCards.forEach((m, i) => {
      m.position.set(workX(i), WORK.y, WORK.z0 - i * WORK.gap);
      m.rotation.y = -Math.sign(workX(i)) * 0.2;
    });
    stackGroup.position.copy(STACK_C).add(mobile ? new THREE.Vector3(0, -0.2, 0) : new THREE.Vector3(2.4, 0, 0));
    ringGroup.position.copy(RING.c).add(mobile ? new THREE.Vector3(0, 0.5, 0) : new THREE.Vector3(0.9, 0.05, 0));
    globeGroup.position.copy(GLOBE.c).add(mobile ? new THREE.Vector3(0, -4.2, 0) : new THREE.Vector3(2.8, 0, 0));
    globeTilt.rotation.x = THREE.MathUtils.degToRad(PLACES.damak[0]) * 0.8;
  }

  function resize() {
    mobile = window.innerWidth < 768;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = mobile ? 62 : 50;
    camera.updateProjectionMatrix();
    layout();
    measure();
  }

  // ===========================================================================
  // Chapters: scroll → camera pose
  // ===========================================================================
  const chapterEls = [...document.querySelectorAll('[data-chapter]')];
  let ranges = [];
  function measure() {
    const y0 = window.scrollY, vh = window.innerHeight;
    const tops = chapterEls.map((el) => el.getBoundingClientRect().top + y0);
    const docEnd = document.documentElement.scrollHeight;
    ranges = chapterEls.map((el, i) => {
      const top = tops[i], end = i < tops.length - 1 ? tops[i + 1] : docEnd;
      const pinned = el.hasAttribute('data-pin');
      const span = pinned ? Math.max(end - top - vh, 1) : Math.max(end - top, 1);
      return { name: el.dataset.chapter, top, end, span };
    });
  }
  const rangeOf = (name) => ranges.find((r) => r.name === name);
  const progressOf = (r, y) => clamp((y - r.top) / r.span, 0, 1);
  const dwell = (x) => { const i = Math.floor(x); return i + smootherstep(x - i, 0.2, 0.8); };

  function scrollToChapter(name, u) {
    const r = rangeOf(name);
    if (r) window.scrollTo({ top: r.top + r.span * u + 1, behavior: reduce ? 'auto' : 'smooth' });
  }

  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  const POSES = {
    hero: (u, o) => { o.pos.set(0, 1.6 + u * 1.0, 8.5 - u * 2); o.tgt.set(0, 2.2, -8); },
    about: (u, o) => { o.pos.set(lerp(0, 2, u), 3 + u * 5, 6 - u * 8); o.tgt.set(0, 3 - u * 0.5, -14 - u * 4); },
    work: (u, o) => {
      const f = dwell(u * (JOBS.length - 1));
      const i = Math.min(Math.floor(f), JOBS.length - 2), t = f - i;
      const dist = mobile ? 8.8 : 6.2;
      const xa = workX(i) * 0.75, xb = workX(i + 1) * 0.75;
      const za = WORK.z0 - i * WORK.gap, zb = WORK.z0 - (i + 1) * WORK.gap;
      o.pos.set(lerp(xa, xb, t), WORK.y + 0.35, lerp(za, zb, t) + dist);
      o.tgt.set(lerp(xa, xb, t), WORK.y, lerp(za, zb, t));
    },
    stack: (u, o) => { o.pos.set(0, STACK_C.y + 0.25, STACK_C.z + (mobile ? 10.5 : 9.2) - u * 1.0); o.tgt.set(0, STACK_C.y, STACK_C.z); },
    projects: (u, o) => {
      o.pos.set(0, RING.c.y + 0.35, RING.c.z + (mobile ? 9.6 : 6.4)); o.tgt.set(0, RING.c.y, RING.c.z);
    },
    contact: (u, o) => { o.pos.set(0, GLOBE.c.y + 0.3, GLOBE.c.z + (mobile ? 14.5 : 11) - u * 1.2); o.tgt.set(0, GLOBE.c.y, GLOBE.c.z); },
  };
  const poseA = { pos: P(0, 0, 0), tgt: P(0, 0, 0) }, poseB = { pos: P(0, 0, 0), tgt: P(0, 0, 0) };
  let active = 0;
  const U = {};

  function computePose(y) {
    const vh = window.innerHeight;
    let i = 0;
    for (let k = 0; k < ranges.length; k++) if (y >= ranges[k].top - 1) i = k;
    for (const r of ranges) U[r.name] = progressOf(r, y);
    const r = ranges[i];
    (POSES[r.name] || POSES.hero)(U[r.name], poseA);
    active = i;
    if (i < ranges.length - 1) {
      const w = smootherstep(y, r.end - vh, r.end);
      if (w > 0) {
        (POSES[ranges[i + 1].name] || POSES.hero)(0, poseB);
        poseA.pos.lerp(poseB.pos, w);
        poseA.tgt.lerp(poseB.tgt, w);
        if (w > 0.5) active = i + 1;
      }
    }
  }

  // ===========================================================================
  // DOM sync
  // ===========================================================================
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function scramble(el, text) {
    if (!el) return;
    cancelAnimationFrame(el._raf);
    if (reduce) { el.textContent = text; return; }
    let frame = 0;
    const total = 16;
    const run = () => {
      frame++;
      const p = frame / total;
      el.textContent = [...text].map((ch, k) => (ch === ' ' || k / text.length < p) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
      if (frame < total) el._raf = requestAnimationFrame(run); else el.textContent = text;
    };
    run();
  }

  const workRail = [...document.querySelectorAll('#work-rail [data-i]')];
  const workBar = $('work-bar');
  const workCount = $('work-count');
  let lastWork = -1;
  workRail.forEach((b) => b.addEventListener('click', () => scrollToChapter('work', +b.dataset.i / (JOBS.length - 1))));
  function syncWork(f, u) {
    if (workBar) workBar.style.transform = `scaleX(${u.toFixed(4)})`;
    const idx = Math.round(f);
    if (idx === lastWork) return;
    lastWork = idx;
    if (workCount) workCount.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(JOBS.length).padStart(2, '0')}`;
    workRail.forEach((b, k) => b.setAttribute('aria-current', String(k === idx)));
  }

  const projTitle = $('proj-title'), projDesc = $('proj-desc'), projMeta = $('proj-meta'), projLink = $('proj-link'), projIndex = $('proj-index');
  let lastProj = -1;
  function syncProject(idx) {
    if (idx === lastProj) return;
    lastProj = idx;
    const p = PROJECTS[idx];
    scramble(projTitle, p.title);
    if (projDesc) projDesc.textContent = p.desc;
    if (projMeta) projMeta.textContent = p.meta;
    if (projIndex) projIndex.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}`;
    if (projLink) {
      projLink.href = p.url;
      projLink.querySelector('span').textContent = p.live ? 'Visit site' : 'View code';
    }
  }
  const goProject = (i) => scrollToChapter('projects', clamp(i, 0, PROJECTS.length - 1) / (PROJECTS.length - 1));
  $('proj-prev')?.addEventListener('click', () => goProject(lastProj - 1));
  $('proj-next')?.addEventListener('click', () => goProject(lastProj + 1));

  // stack legend highlight
  let stackHL = null;
  document.querySelectorAll('[data-cat]').forEach((b) => {
    const on = () => { stackHL = b.dataset.cat; };
    const off = () => { stackHL = null; };
    b.addEventListener('pointerenter', on);
    b.addEventListener('pointerleave', off);
    b.addEventListener('focus', on);
    b.addEventListener('blur', off);
    b.addEventListener('click', () => { stackHL = stackHL === b.dataset.cat ? null : b.dataset.cat; });
  });

  // ===========================================================================
  // Input
  // ===========================================================================
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.6);
  const hit = new THREE.Vector3();
  const mouseTarget = new THREE.Vector3(999, 0, 999);
  let mouseActive = 0, parX = 0, parY = 0;
  const elevEl = $('hud-elev'), coordEl = $('hud-coord');
  const setNdc = (e) => ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);

  window.addEventListener('pointermove', (e) => {
    parX = e.clientX / window.innerWidth - 0.5;
    parY = e.clientY / window.innerHeight - 0.5;
    if (active > 1) { mouseActive = 0; return; }
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(ground, hit) && Math.abs(hit.x) < W / 2 && hit.z < ZF && hit.z > ZF - D) {
      mouseTarget.copy(hit);
      mouseActive = 1;
      const h = heightAt(hit.x, hit.z);
      if (elevEl) elevEl.textContent = String(Math.round(1200 + (h / maxH) * 7600)).padStart(4, '0');
      if (coordEl) coordEl.textContent = `${(27.98 - (hit.z + 8) * 0.03).toFixed(2)}°N ${(86.92 + hit.x * 0.03).toFixed(2)}°E`;
    } else mouseActive = 0;
  }, { passive: true });
  document.addEventListener('mouseleave', () => { mouseActive = 0; });

  let rippleIdx = 0, time = 0;
  window.addEventListener('pointerdown', (e) => {
    if (active > 1 || e.target.closest('a, button, input, [role="dialog"], figure')) return;
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(ground, hit)) return;
    mU.uRipples.value[rippleIdx].set(hit.x, hit.z, time, 1);
    rippleIdx = (rippleIdx + 1) % MAX_RIPPLES;
  }, { passive: true });

  // stack: drag to spin
  const stackStage = $('stack-stage');
  let rotY = 0, rotX = 0.15, velY = 0, dragging = false, lastX = 0, lastY = 0;
  if (stackStage) {
    stackStage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button')) return;
      if (e.pointerType === 'mouse') e.preventDefault(); // no text selection while dragging
      window.getSelection()?.removeAllRanges();
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      stackStage.setPointerCapture(e.pointerId);
      stackStage.classList.add('is-dragging');
    });
    stackStage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      rotY += dx * 0.007; velY = dx * 0.4;
      rotX = clamp(rotX + dy * 0.004, -0.7, 0.7);
    });
    const end = () => { dragging = false; stackStage.classList.remove('is-dragging'); };
    stackStage.addEventListener('pointerup', end);
    stackStage.addEventListener('pointercancel', end);
  }

  // globe: drag to look around
  const globeDrag = $('globe-drag');
  let gRotY = 0, gRotX = 0, gVel = 0, gDragging = false, gx = 0, gy = 0;
  if (globeDrag) {
    globeDrag.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') e.preventDefault();
      gDragging = true; gx = e.clientX; gy = e.clientY;
      globeDrag.setPointerCapture(e.pointerId);
      globeDrag.classList.add('is-dragging');
    });
    globeDrag.addEventListener('pointermove', (e) => {
      if (!gDragging) return;
      const dx = e.clientX - gx, dy = e.clientY - gy;
      gx = e.clientX; gy = e.clientY;
      gRotY += dx * 0.006; gVel = dx * 0.35;
      gRotX = clamp(gRotX + dy * 0.004, -0.9, 0.9);
    });
    const gEnd = () => { gDragging = false; globeDrag.classList.remove('is-dragging'); };
    globeDrag.addEventListener('pointerup', gEnd);
    globeDrag.addEventListener('pointercancel', gEnd);
  }

  // projects: hover + click the deck
  const projStage = $('projects-stage');
  let projHover = -1, lastRay = 0;
  function pickProject(e) {
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(projCards, false);
    return hits.length ? hits[0].object.userData.index : -1;
  }
  if (projStage) {
    projStage.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - lastRay < 50) return;
      lastRay = now;
      projHover = e.target.closest('a, button') ? -1 : pickProject(e);
      projStage.style.cursor = projHover >= 0 ? 'pointer' : '';
    });
    projStage.addEventListener('pointerleave', () => { projHover = -1; });
    projStage.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const i = pickProject(e);
      if (i < 0) return;
      if (i === lastProj) window.open(PROJECTS[i].url, '_blank', 'noopener');
      else goProject(i);
    });
  }

  // ===========================================================================
  // Loop
  // ===========================================================================
  resize();
  window.addEventListener('resize', resize, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(() => measure()).observe(document.body);

  scene.traverse((o) => { if (o.material && o.material.map) renderer.initTexture(o.material.map); });
  renderer.compile(scene, camera);

  computePose(window.scrollY);
  const camPos = poseA.pos.clone(), camTgt = poseA.tgt.clone();
  const tmp = new THREE.Vector3();
  let last = performance.now(), slow = 0, raf = 0, running = false;

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!reduce) time += dt;

    // adaptive quality: drop resolution once if frames keep running long
    if (dt > 0.024 && dt < 0.2) slow++; else slow = Math.max(0, slow - 1);
    if (slow > 45 && dpr > 1) {
      dpr = 1; renderer.setPixelRatio(dpr); mU.uPR.value = dpr; gU.uPR.value = dpr; resize(); slow = 0;
    }

    computePose(window.scrollY);
    const k = reduce ? 1 : 1 - Math.exp(-dt * 5);
    camPos.lerp(poseA.pos, k);
    camTgt.lerp(poseA.tgt, k);
    camera.position.copy(camPos);
    camera.position.x += parX * (mobile ? 0.2 : 0.6);
    camera.position.y -= parY * 0.3;
    camera.lookAt(camTgt);
    const cz = camera.position.z;

    // mountains
    mU.uTime.value = time;
    mU.uMouseAmt.value += (mouseActive - mU.uMouseAmt.value) * 0.06;
    mU.uMouse.value.lerp(mouseTarget, 0.12);
    mountains.visible = cz > -40;

    // work
    workGroup.visible = cz < 6 && cz > -60;
    if (workGroup.visible) {
      const f = dwell((U.work || 0) * (JOBS.length - 1));
      jobCards.forEach((m, i) => {
        const d = Math.min(Math.abs(f - i), 1);
        // cards ahead dim; cards already passed fade out fast so they never sit between camera and the current one
        const passed = i < f ? clamp(1 - (f - i) * 1.8, 0, 1) : 1;
        m.material.opacity = (1 - d * 0.7) * passed;
        m.visible = m.material.opacity > 0.01;
        m.position.y = WORK.y + Math.sin(time * 0.6 + i * 1.7) * 0.06;
        m.scale.setScalar(1 - d * 0.06);
      });
      syncWork(f, U.work || 0);
    }

    // stack
    stackGroup.visible = Math.abs(cz - STACK_C.z) < 32;
    if (stackGroup.visible) {
      if (!dragging) { velY *= 0.94; rotY += (reduce ? 0 : 0.12 * dt) + velY * dt; }
      stackSpin.rotation.set(rotX, rotY + (U.stack || 0) * Math.PI, 0);
      stackGroup.updateMatrixWorld();
      stackSprites.forEach((s) => {
        tmp.copy(s.position).applyMatrix4(stackSpin.matrixWorld);
        const depth = (tmp.z - stackGroup.position.z) / STACK_R; // -1 back … 1 front
        const target = stackHL ? (s.userData.cat === stackHL ? 1 : 0) : 0.5;
        s.userData.hl += (target - s.userData.hl) * 0.15;
        const base = 0.25 + 0.75 * smoothstep(depth, -1, 1);
        s.material.opacity = stackHL ? base * (0.12 + s.userData.hl * 0.88) : base;
        const sc = s.userData.base * (1 + (stackHL ? s.userData.hl * 0.35 : 0));
        s.scale.set(sc * (s.userData.aspect || 3), sc, 1);
      });
    }

    // projects
    ringGroup.visible = Math.abs(cz - RING.c.z) < 34;
    if (ringGroup.visible) {
      const f = dwell((U.projects || 0) * (PROJECTS.length - 1));
      projCards.forEach((m, i) => {
        placeCard(m, i - f);
        m.position.y += Math.sin(time * 0.7 + i) * 0.03;
        const s = 1 + (projHover === i && i === Math.round(f) ? 0.035 : 0);
        m.scale.x += (s - m.scale.x) * 0.2; m.scale.y = m.scale.x;
      });
      syncProject(Math.round(f));
    }

    // globe
    globeGroup.visible = cz < -112;
    if (globeGroup.visible) {
      if (!gDragging) { gVel *= 0.94; gRotY += gVel * dt; gRotX *= reduce ? 1 : 0.995; }
      globeSpin.rotation.y = -THREE.MathUtils.degToRad(PLACES.damak[1]) + Math.sin(time * 0.15) * 0.35 + ((U.contact || 0) - 0.3) * 0.5 + gRotY;
      globeTilt.rotation.x = THREE.MathUtils.degToRad(PLACES.damak[0]) * 0.8 + gRotX;
      arcU.uTime.value = time;
      const pt = (time * 0.6) % 1;
      pulse.scale.setScalar(1 + pt * 3);
      pulse.material.opacity = 1 - pt;
      labelSprites.forEach((s) => {
        tmp.copy(s.position).applyMatrix4(globeSpin.matrixWorld).sub(globeGroup.position);
        s.material.opacity = smoothstep(tmp.z / GLOBE.r, 0.1, 0.5);
      });
    }

    renderer.render(scene, camera);
  }

  const loop = (now) => { frame(now); raf = requestAnimationFrame(loop); };
  const startLoop = () => { if (running || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
  const stopLoop = () => { running = false; cancelAnimationFrame(raf); };
  document.addEventListener('visibilitychange', () => (document.hidden ? stopLoop() : startLoop()));
  root.classList.add('has-world');
  startLoop();
}
