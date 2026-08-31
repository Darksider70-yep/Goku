"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode2 = __toESM(require("vscode"));

// src/animationPanel.ts
var vscode = __toESM(require("vscode"));

// src/animationHtml.ts
function getAnimationHtml(duration, soundEnabled, characterUri) {
  return (
    /* html */
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kamehameha</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #02040c; }
    body { font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif; }

    canvas, .film-grain, .vignette, .white-flash { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    #backdrop { z-index: 0; }
    #effects { z-index: 3; mix-blend-mode: screen; }

    #anime-character {
      position: fixed;
      z-index: 2;
      left: clamp(-3rem, -2vw, -0.5rem);
      bottom: clamp(-4rem, -6vh, -1rem);
      width: clamp(32rem, 84vh, 63rem);
      height: auto;
      opacity: 0;
      pointer-events: none;
      transform-origin: 43% 57%;
      will-change: transform, filter, opacity;
      user-select: none;
    }

    .vignette {
      z-index: 5;
      background:
        radial-gradient(ellipse at center, transparent 32%, rgba(0, 0, 8, 0.08) 60%, rgba(0, 0, 8, 0.84) 100%),
        linear-gradient(90deg, rgba(1, 3, 12, 0.36), transparent 25%, transparent 75%, rgba(1, 3, 12, 0.56));
    }

    .film-grain {
      z-index: 6;
      opacity: 0.12;
      mix-blend-mode: soft-light;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E");
      animation: grain 0.18s steps(2) infinite;
    }

    #callout {
      position: fixed;
      z-index: 7;
      right: clamp(1.5rem, 7vw, 7rem);
      bottom: clamp(1.4rem, 7vh, 4.5rem);
      max-width: 62vw;
      color: #f5fbff;
      font-size: clamp(2.1rem, 6.8vw, 7.8rem);
      font-style: italic;
      line-height: 0.78;
      letter-spacing: -0.075em;
      text-align: right;
      opacity: 0;
      transform: translate3d(2rem, 1rem, 0) skewX(-9deg) scale(0.88);
      text-shadow: 0.05em 0.065em 0 #092450, 0 0 0.09em #fff, 0 0 0.25em #25baff, 0 0 0.55em #1269f5;
      will-change: opacity, transform, filter;
      pointer-events: none;
    }

    #subline {
      display: block;
      margin-top: 0.34em;
      color: #ffd85d;
      font-family: 'Arial Black', Impact, sans-serif;
      font-size: 0.19em;
      letter-spacing: 0.28em;
      text-shadow: 0.08em 0.1em 0 #512a00, 0 0 0.4em #f4a800;
    }

    .white-flash {
      z-index: 8;
      opacity: 0;
      background: #dff8ff;
      mix-blend-mode: screen;
      will-change: opacity;
    }

    @keyframes grain {
      0% { transform: translate3d(0, 0, 0); }
      25% { transform: translate3d(-1%, 1%, 0); }
      50% { transform: translate3d(1%, -1%, 0); }
      75% { transform: translate3d(1%, 1%, 0); }
      100% { transform: translate3d(-1%, -1%, 0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .film-grain { animation: none; }
    }
  </style>
</head>
<body>
  <canvas id="backdrop"></canvas>
  <img id="anime-character" src="${characterUri}" alt="Anime energy warrior">
  <canvas id="effects"></canvas>
  <div class="vignette"></div>
  <div class="film-grain"></div>
  <div id="callout">KAMEHAMEHA<span id="subline">LIMIT BREAK</span></div>
  <div id="flash" class="white-flash"></div>

  <script>
  (() => {
    'use strict';

    const TOTAL_DURATION = ${duration} / 1000;
    const SOUND_ENABLED = ${soundEnabled ? "true" : "false"};
    const backdrop = document.getElementById('backdrop');
    const effects = document.getElementById('effects');
    const character = document.getElementById('anime-character');
    const callout = document.getElementById('callout');
    const flash = document.getElementById('flash');
    const bg = backdrop.getContext('2d');
    const fx = effects.getContext('2d');

    if (!bg || !fx) {
      document.body.innerHTML = '<p style="padding: 2rem; color: white; font: 16px sans-serif">Unable to initialize animation.</p>';
      return;
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let startedAt = 0;
    let chargePlayed = false;
    let blastPlayed = false;
    let audioContext;
    let completed = false;

    const timeline = {
      entry: TOTAL_DURATION * 0.17,
      transform: TOTAL_DURATION * 0.39,
      charge: TOTAL_DURATION * 0.59,
      blastEnd: TOTAL_DURATION * 0.87
    };

    const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
    const range = (value, start, end) => clamp((value - start) / Math.max(0.001, end - start), 0, 1);
    const easeOut = (value) => 1 - Math.pow(1 - value, 4);
    const easeIn = (value) => value * value * value;
    const mix = (start, end, value) => start + (end - start) * value;
    const seed = (index) => {
      const value = Math.sin(index * 127.127 + 19.19) * 43758.5453123;
      return value - Math.floor(value);
    };

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      [ [backdrop, bg], [effects, fx] ].forEach((pair) => {
        pair[0].width = Math.round(width * dpr);
        pair[0].height = Math.round(height * dpr);
        pair[1].setTransform(dpr, 0, 0, dpr, 0, 0);
      });
    }

    function anchor() {
      const rect = character.getBoundingClientRect();
      return {
        x: rect.left + rect.width * 0.62,
        y: rect.top + rect.height * 0.355,
        heroX: rect.left + rect.width * 0.36,
        heroY: rect.top + rect.height * 0.48
      };
    }

    function drawBackdrop(time, transform, charge, blast, fade, point) {
      bg.clearRect(0, 0, width, height);
      const horizon = height * 0.52;
      const base = bg.createLinearGradient(0, 0, 0, height);
      base.addColorStop(0, '#030513');
      base.addColorStop(0.42, '#0a1235');
      base.addColorStop(0.72, '#07091d');
      base.addColorStop(1, '#010207');
      bg.fillStyle = base;
      bg.fillRect(0, 0, width, height);

      const coreLight = bg.createRadialGradient(point.x, point.y, 0, point.x, point.y, Math.max(width, height) * 0.68);
      coreLight.addColorStop(0, 'rgba(26, 125, 255,' + (0.07 + charge * 0.14 + blast * 0.16) * (1 - fade) + ')');
      coreLight.addColorStop(0.46, 'rgba(10, 40, 116,' + (0.16 + charge * 0.12) * (1 - fade) + ')');
      coreLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
      bg.fillStyle = coreLight;
      bg.fillRect(0, 0, width, height);

      bg.save();
      for (let index = 0; index < 115; index++) {
        const x = seed(index + 1) * width;
        const y = seed(index + 201) * height * 0.82;
        const pulse = 0.2 + 0.8 * Math.max(0, Math.sin(time * (0.9 + seed(index + 4) * 1.8) + index));
        const size = 0.35 + seed(index + 60) * 1.5;
        bg.fillStyle = 'rgba(167, 220, 255,' + (0.12 + pulse * 0.38) * (1 - fade) + ')';
        bg.fillRect(x, y, size, size);
      }
      bg.restore();

      const cloud = bg.createLinearGradient(0, horizon - 90, 0, horizon + 210);
      cloud.addColorStop(0, 'rgba(34, 79, 160, 0)');
      cloud.addColorStop(0.48, 'rgba(44, 109, 197,' + (0.08 + charge * 0.09) * (1 - fade) + ')');
      cloud.addColorStop(1, 'rgba(0, 0, 0, 0)');
      bg.fillStyle = cloud;
      bg.fillRect(0, horizon - 90, width, 300);

      const aura = transform * 0.52 + charge * 0.64 + blast * 0.5;
      if (aura > 0.01) {
        bg.save();
        bg.globalCompositeOperation = 'screen';
        for (let ring = 5; ring >= 0; ring--) {
          const radius = (76 + ring * 32 + Math.sin(time * 7 + ring) * 6) * (0.65 + aura);
          const gradient = bg.createRadialGradient(point.heroX, point.heroY, radius * 0.2, point.heroX, point.heroY, radius);
          gradient.addColorStop(0, 'rgba(255, 244, 164, 0)');
          gradient.addColorStop(0.55, 'rgba(255, 199, 37,' + (0.04 + aura * 0.05) + ')');
          gradient.addColorStop(1, 'rgba(255, 150, 8, 0)');
          bg.fillStyle = gradient;
          bg.beginPath();
          bg.ellipse(point.heroX, point.heroY - 18, radius * 0.62, radius, 0, 0, Math.PI * 2);
          bg.fill();
        }
        bg.restore();
      }

      if (blast > 0) {
        bg.save();
        bg.globalCompositeOperation = 'screen';
        bg.strokeStyle = 'rgba(112, 212, 255,' + (0.12 + blast * 0.2) * (1 - fade) + ')';
        for (let line = 0; line < 34; line++) {
          const offset = (seed(line + 500) - 0.5) * height * 1.1;
          const start = point.x + 15 + seed(line + 630) * 90;
          const length = width * (0.25 + seed(line + 720) * 0.65) * blast;
          bg.lineWidth = 0.5 + seed(line + 830) * 2.3;
          bg.beginPath();
          bg.moveTo(start, point.y + offset * 0.3);
          bg.lineTo(Math.min(width + 20, start + length), point.y + offset);
          bg.stroke();
        }
        bg.restore();
      }
    }

    function drawMotes(time, point, transform, charge, blast, fade) {
      fx.save();
      fx.globalCompositeOperation = 'lighter';
      const energy = Math.max(transform, charge, blast * 0.8);
      for (let index = 0; index < 96; index++) {
        const angle = seed(index + 111) * Math.PI * 2 + time * (0.7 + seed(index + 190) * 1.7);
        const orbit = 35 + seed(index + 222) * (100 + charge * 160);
        const flight = blast * (40 + seed(index + 260) * width * 0.95);
        const x = point.x + Math.cos(angle) * orbit * (1 - blast * 0.72) + flight;
        const y = point.y + Math.sin(angle) * orbit * (1 - blast * 0.86);
        const alpha = (0.09 + seed(index + 310) * 0.55) * energy * (1 - fade);
        const size = 0.7 + seed(index + 350) * (1.5 + charge * 2.7);
        fx.fillStyle = index % 5 === 0
          ? 'rgba(255, 216, 88,' + alpha + ')'
          : 'rgba(122, 222, 255,' + alpha + ')';
        fx.beginPath();
        fx.arc(x, y, size, 0, Math.PI * 2);
        fx.fill();
      }
      fx.restore();
    }

    function beamPath(context, startX, startY, endX, halfWidth, wave) {
      context.beginPath();
      context.moveTo(startX, startY - halfWidth * 0.38);
      context.bezierCurveTo(startX + 120, startY - halfWidth - wave, endX - 180, startY - halfWidth * 0.88 + wave, endX, startY - halfWidth * 0.24);
      context.lineTo(endX, startY + halfWidth * 0.24);
      context.bezierCurveTo(endX - 180, startY + halfWidth * 0.88 - wave, startX + 120, startY + halfWidth + wave, startX, startY + halfWidth * 0.38);
      context.closePath();
    }

    function drawBeam(time, point, blast, fade) {
      if (blast <= 0) return;
      const progression = easeOut(blast);
      const endX = mix(point.x + 32, width + 150, progression);
      const wave = Math.sin(time * 24) * 8 + Math.sin(time * 9) * 5;
      const power = 0.45 + progression * 0.55;

      fx.save();
      fx.globalCompositeOperation = 'lighter';
      fx.filter = 'blur(26px)';
      beamPath(fx, point.x, point.y, endX, 135 * power, wave * 2);
      fx.fillStyle = 'rgba(21, 134, 255,' + (0.22 * (1 - fade)) + ')';
      fx.fill();
      fx.filter = 'blur(10px)';
      beamPath(fx, point.x, point.y, endX, 77 * power, wave);
      fx.fillStyle = 'rgba(45, 207, 255,' + (0.48 * (1 - fade)) + ')';
      fx.fill();
      fx.filter = 'none';

      const beamGradient = fx.createLinearGradient(point.x, point.y, endX, point.y);
      beamGradient.addColorStop(0, 'rgba(255,255,255,' + (0.96 * (1 - fade)) + ')');
      beamGradient.addColorStop(0.18, 'rgba(177,239,255,' + (0.93 * (1 - fade)) + ')');
      beamGradient.addColorStop(0.66, 'rgba(43,177,255,' + (0.78 * (1 - fade)) + ')');
      beamGradient.addColorStop(1, 'rgba(24,114,255,0)');
      beamPath(fx, point.x, point.y, endX, 36 * power, wave * 0.32);
      fx.fillStyle = beamGradient;
      fx.fill();

      fx.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - fade)) + ')';
      fx.lineWidth = 4 + Math.sin(time * 28) * 1.5;
      fx.beginPath();
      fx.moveTo(point.x, point.y);
      fx.bezierCurveTo(point.x + 140, point.y - wave * 0.18, endX - 190, point.y + wave * 0.12, endX, point.y);
      fx.stroke();

      const head = fx.createRadialGradient(endX, point.y, 0, endX, point.y, 90 * power);
      head.addColorStop(0, 'rgba(255,255,255,' + (0.9 * (1 - fade)) + ')');
      head.addColorStop(0.22, 'rgba(124,232,255,' + (0.68 * (1 - fade)) + ')');
      head.addColorStop(1, 'rgba(15,100,255,0)');
      fx.fillStyle = head;
      fx.beginPath();
      fx.arc(endX, point.y, 90 * power, 0, Math.PI * 2);
      fx.fill();

      for (let streak = 0; streak < 42; streak++) {
        const progress = seed(streak + 880) * progression;
        const x = mix(point.x + 16, endX, progress);
        const y = point.y + (seed(streak + 930) - 0.5) * (110 * power);
        const length = 18 + seed(streak + 970) * 125 * progression;
        fx.strokeStyle = 'rgba(211,250,255,' + (0.12 + seed(streak + 1020) * 0.42) * (1 - fade) + ')';
        fx.lineWidth = 0.6 + seed(streak + 1100) * 2.3;
        fx.beginPath();
        fx.moveTo(x - length, y);
        fx.lineTo(x + length, y + Math.sin(time * 18 + streak) * 3);
        fx.stroke();
      }
      fx.restore();
    }

    function drawChargeSphere(time, point, charge, blast, fade) {
      const strength = charge * (1 - blast * 0.35);
      if (strength <= 0) return;
      const radius = 26 + strength * 34 + Math.sin(time * 18) * 4;
      fx.save();
      fx.globalCompositeOperation = 'lighter';
      fx.filter = 'blur(18px)';
      const halo = fx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 3.2);
      halo.addColorStop(0, 'rgba(255,255,255,' + (0.9 * strength * (1 - fade)) + ')');
      halo.addColorStop(0.2, 'rgba(75,218,255,' + (0.7 * strength * (1 - fade)) + ')');
      halo.addColorStop(1, 'rgba(0,100,255,0)');
      fx.fillStyle = halo;
      fx.beginPath();
      fx.arc(point.x, point.y, radius * 3.2, 0, Math.PI * 2);
      fx.fill();
      fx.filter = 'none';
      fx.fillStyle = 'rgba(240,253,255,' + (0.92 * strength * (1 - fade)) + ')';
      fx.beginPath();
      fx.arc(point.x, point.y, radius * 0.48, 0, Math.PI * 2);
      fx.fill();
      fx.restore();
    }

    function setCharacter(time, entry, transform, charge, blast, fade) {
      const recoil = blast * (Math.sin(time * 50) * 1.4 + Math.sin(time * 19) * 1.2);
      const travel = mix(-95, 0, easeOut(entry));
      const scale = 0.9 + entry * 0.1 + transform * 0.06 + charge * 0.025 - fade * 0.12;
      const lift = transform * -10 + charge * -4 + recoil;
      const glow = 16 + transform * 17 + charge * 31 + blast * 42;
      character.style.opacity = String((0.1 + easeOut(entry) * 0.9) * (1 - fade));
      character.style.transform = 'translate3d(' + travel + 'vw,' + lift + 'px,0) scale(' + scale + ')';
      character.style.filter = 'saturate(' + (1.06 + transform * 0.2) + ') contrast(1.08) drop-shadow(0 0 ' + glow + 'px rgba(35, 191, 255, ' + (0.35 + charge * 0.45) + ')) drop-shadow(-10px 0 24px rgba(255, 187, 36, ' + (transform * 0.42) + '))';
    }

    function setTypography(charge, blast, fade) {
      const reveal = range(charge, 0.25, 0.86) * (1 - blast * 0.72) * (1 - fade);
      const slam = blast > 0 ? -blast * 4 : 0;
      callout.style.opacity = String(reveal);
      callout.style.transform = 'translate3d(' + (2 - reveal * 2) + 'rem,' + (1 - reveal) + 'rem,0) skewX(-9deg) scale(' + (0.88 + reveal * 0.12 + slam * 0.01) + ')';
      callout.style.filter = 'blur(' + (blast > 0.03 && blast < 0.12 ? 1.3 : 0) + 'px)';
    }

    function playCharge() {
      if (!SOUND_ENABLED || chargePlayed) return;
      chargePlayed = true;
      try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(82, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(580, audioContext.currentTime + 0.78);
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.05);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1.08);
      } catch (_) { /* Audio is optional in webviews. */ }
    }

    function playBlast() {
      if (!SOUND_ENABLED || blastPlayed) return;
      blastPlayed = true;
      try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(125, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(32, audioContext.currentTime + 0.7);
        gain.gain.setValueAtTime(0.22, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.92);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.95);
      } catch (_) { /* Audio is optional in webviews. */ }
    }

    function finish() {
      if (completed) return;
      completed = true;
      try {
        acquireVsCodeApi().postMessage({ command: 'animationComplete' });
      } catch (_) { /* Standalone preview has no VS Code bridge. */ }
    }

    function render(now) {
      if (!startedAt) startedAt = now;
      const time = (now - startedAt) / 1000;
      const entry = range(time, 0, timeline.entry);
      const transform = range(time, timeline.entry * 0.72, timeline.transform);
      const charge = range(time, timeline.transform * 0.91, timeline.charge);
      const blast = range(time, timeline.charge, timeline.blastEnd);
      const fade = range(time, timeline.blastEnd, TOTAL_DURATION);

      if (charge > 0.04) playCharge();
      if (blast > 0.01) playBlast();
      setCharacter(time, entry, transform, charge, blast, fade);
      const point = anchor();
      drawBackdrop(time, transform, charge, blast, fade, point);
      fx.clearRect(0, 0, width, height);
      drawMotes(time, point, transform, charge, blast, fade);
      drawChargeSphere(time, point, charge, blast, fade);
      drawBeam(time, point, blast, fade);
      setTypography(charge, blast, fade);

      const flashStrength = blast > 0 && blast < 0.14 ? Math.sin((blast / 0.14) * Math.PI) * 0.84 : 0;
      flash.style.opacity = String(flashStrength * (1 - fade));

      if (time >= TOTAL_DURATION + 0.18) {
        finish();
        return;
      }
      requestAnimationFrame(render);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(render);
  })();
  </script>
</body>
</html>`
  );
}

// src/animationPanel.ts
var currentPanel;
var closeTimeout;
function showKamehamehaAnimation(context, duration, soundEnabled) {
  try {
    if (duration < 100) {
      console.warn("\u{1F409} Animation duration too short, using minimum 1000ms");
      duration = 1e3;
    }
    if (duration > 1e4) {
      console.warn("\u{1F409} Animation duration too long, capping at 10000ms");
      duration = 1e4;
    }
    if (currentPanel) {
      try {
        currentPanel.dispose();
      } catch (error) {
        console.warn("\u{1F409} Error disposing previous panel:", error);
      }
    }
    const assetRoot = vscode.Uri.joinPath(context.extensionUri, "assets");
    currentPanel = vscode.window.createWebviewPanel(
      "gokuKamehameha",
      "\u26A1 KAMEHAMEHA! \u26A1",
      {
        viewColumn: vscode.ViewColumn.Active,
        preserveFocus: false
      },
      {
        enableScripts: true,
        retainContextWhenHidden: false,
        localResourceRoots: [assetRoot]
      }
    );
    const characterUri = currentPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(assetRoot, "anime-energy-warrior-v1.png")
    ).toString();
    currentPanel.webview.html = getAnimationHtml(duration, soundEnabled, characterUri);
    setupAutoClose(duration);
    currentPanel.onDidDispose(() => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
      currentPanel = void 0;
    });
    currentPanel.webview.onDidReceiveMessage((message) => {
      if (message.command === "animationComplete") {
        closePanel();
      }
    });
  } catch (error) {
    console.error("\u{1F409} Error showing Kamehameha animation:", error);
  }
}
function setupAutoClose(duration) {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
  }
  closeTimeout = setTimeout(() => {
    closePanel();
  }, duration + 500);
}
function closePanel() {
  if (currentPanel) {
    try {
      currentPanel.dispose();
    } catch (error) {
      console.warn("\u{1F409} Error closing animation panel:", error);
    }
    currentPanel = void 0;
  }
}

// src/extension.ts
var COOLDOWN_MS = 5e3;
var DEFAULT_DURATION_MS = 4500;
var ACTIVATION_MESSAGE = "\u{1F409} Goku is ready! Run code successfully to see the Kamehameha!";
var lastTriggerTime = 0;
function activate(context) {
  console.log("\u{1F409} Goku Kamehameha extension activated!");
  try {
    const triggerCommand = vscode2.commands.registerCommand("goku.triggerKamehameha", () => {
      triggerAnimation(context);
    });
    context.subscriptions.push(triggerCommand);
    const taskListener = vscode2.tasks.onDidEndTaskProcess((event) => {
      handleTaskCompletion(context, event);
    });
    context.subscriptions.push(taskListener);
    const debugListener = vscode2.debug.onDidTerminateDebugSession((_session) => {
      handleDebugSessionEnd(context);
    });
    context.subscriptions.push(debugListener);
    const terminalListener = vscode2.window.onDidEndTerminalShellExecution((event) => {
      handleTerminalCommandEnd(context, event);
    });
    context.subscriptions.push(terminalListener);
    vscode2.window.showInformationMessage(ACTIVATION_MESSAGE);
  } catch (error) {
    console.error("\u{1F409} Error during extension activation:", error);
    vscode2.window.showErrorMessage("Failed to activate Goku Kamehameha extension");
  }
}
function handleTaskCompletion(context, event) {
  const config = vscode2.workspace.getConfiguration("goku");
  if (!config.get("enabled", true)) {
    return;
  }
  if (!config.get("triggerOnTask", true)) {
    return;
  }
  if (event.exitCode === 0) {
    console.log(`\u{1F409} Task "${event.execution.task.name}" succeeded! Kamehameha!`);
    triggerAnimation(context);
  } else {
    console.log(`\u{1F409} Task "${event.execution.task.name}" failed with exit code ${event.exitCode}`);
  }
}
function handleDebugSessionEnd(context) {
  const config = vscode2.workspace.getConfiguration("goku");
  if (!config.get("enabled", true)) {
    return;
  }
  if (!config.get("triggerOnDebug", true)) {
    return;
  }
  console.log("\u{1F409} Debug session ended! Kamehameha!");
  triggerAnimation(context);
}
function handleTerminalCommandEnd(context, event) {
  const config = vscode2.workspace.getConfiguration("goku");
  if (!config.get("enabled", true)) {
    return;
  }
  if (!config.get("triggerOnTerminal", true)) {
    return;
  }
  if (event.exitCode !== 0) {
    return;
  }
  const commandLine = event.execution.commandLine.value;
  if (!isCodeExecutionCommand(commandLine)) {
    return;
  }
  console.log(`\u{1F409} Terminal command succeeded: ${commandLine}`);
  triggerAnimation(context);
}
function isCodeExecutionCommand(commandLine) {
  const command = commandLine.trim();
  if (!command) {
    return false;
  }
  if (/\b(?:npm|pnpm|yarn)\s+(?:install|i|add|remove|uninstall|update|list|outdated)\b/i.test(command)) {
    return false;
  }
  return /(?:^|[\s;&|\\/])(?:node|nodejs|npm|npx|pnpm|yarn|bun|deno|python|python3|py|java|go|cargo|dotnet|ruby|php)(?:\.exe)?(?:\s|$)/i.test(command);
}
function triggerAnimation(context) {
  const now = Date.now();
  if (now - lastTriggerTime < COOLDOWN_MS) {
    console.log("\u{1F409} Kamehameha on cooldown for", (COOLDOWN_MS - (now - lastTriggerTime)) / 1e3, "seconds");
    return;
  }
  lastTriggerTime = now;
  try {
    const config = vscode2.workspace.getConfiguration("goku");
    const duration = config.get("animationDuration", DEFAULT_DURATION_MS);
    const soundEnabled = config.get("soundEnabled", true);
    if (duration < 1e3 || duration > 1e4) {
      console.warn(`\u{1F409} Animation duration out of range: ${duration}ms. Using default.`);
      showKamehamehaAnimation(context, DEFAULT_DURATION_MS, soundEnabled);
    } else {
      showKamehamehaAnimation(context, duration, soundEnabled);
    }
  } catch (error) {
    console.error("\u{1F409} Error triggering animation:", error);
  }
}
function deactivate() {
  console.log("\u{1F409} Goku Kamehameha extension deactivated.");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
