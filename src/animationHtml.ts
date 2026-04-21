export function getAnimationHtml(duration: number, soundEnabled: boolean): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { overflow: hidden; background: #000; width: 100vw; height: 100vh; }
  canvas { display: block; width: 100vw; height: 100vh; }
  #text-overlay {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0);
    font-family: 'Impact', 'Arial Black', sans-serif; font-size: 72px;
    color: #fff; text-shadow: 0 0 20px #00bfff, 0 0 40px #00bfff, 0 0 80px #1e90ff, 0 0 120px #0040ff;
    letter-spacing: 8px; opacity: 0; pointer-events: none; z-index: 10;
    white-space: nowrap;
  }
  #flash { position: fixed; inset: 0; background: #fff; opacity: 0; pointer-events: none; z-index: 5; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="flash"></div>
<div id="text-overlay">KA-ME-HA-ME-HAAA!</div>
<script>
const DURATION = ${duration};
const SOUND = ${soundEnabled};
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const flash = document.getElementById('flash');
const textEl = document.getElementById('text-overlay');
let W, H, startTime, shakeX = 0, shakeY = 0;
const particles = [];
const beamParticles = [];

function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// --- SOUND SYNTHESIS ---
let audioCtx;
function initSound() {
  if (!SOUND) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {}
}
function playChargeSound() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(80, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 1.2);
  g.gain.setValueAtTime(0.3, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 1.0);
  g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 1.5);
}
function playBlastSound() {
  if (!audioCtx) return;
  const bufSize = audioCtx.sampleRate * 2;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.5));
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const filt = audioCtx.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = 600;
  filt.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 1.5);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.7, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);
  src.connect(filt); filt.connect(g); g.connect(audioCtx.destination);
  src.start();

  // Add a deep bass boom
  const bass = audioCtx.createOscillator();
  const bg = audioCtx.createGain();
  bass.type = 'sine'; bass.frequency.value = 40;
  bg.gain.setValueAtTime(0.5, audioCtx.currentTime);
  bg.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
  bass.connect(bg); bg.connect(audioCtx.destination);
  bass.start(); bass.stop(audioCtx.currentTime + 1.5);
}

// --- DRAWING HELPERS ---
function drawGoku(x, y, scale, phase, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Body
  const bodyColor = '#F4A460';
  const giTop = '#FF6B00';
  const giBottom = '#FF6B00';
  const giBelt = '#0047AB';
  const hair = phase >= 1 ? '#FFD700' : '#1a1a1a';
  const hairGlow = phase >= 1 ? 'rgba(255,215,0,0.4)' : 'rgba(0,0,0,0)';

  // Hair glow for Super Saiyan
  if (phase >= 1) {
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 30 + Math.sin(t * 10) * 10;
  }

  // Spiky hair
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.moveTo(-8, -45);
  ctx.lineTo(-18, -75); ctx.lineTo(-6, -58);
  ctx.lineTo(-2, -82); ctx.lineTo(4, -55);
  ctx.lineTo(12, -78); ctx.lineTo(10, -52);
  ctx.lineTo(20, -70); ctx.lineTo(14, -45);
  ctx.lineTo(22, -60); ctx.lineTo(16, -40);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(4, -35, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = phase >= 1 ? '#00E5FF' : '#000';
  ctx.beginPath();
  ctx.ellipse(-2, -37, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(10, -37, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gi top
  ctx.fillStyle = giTop;
  ctx.beginPath();
  ctx.moveTo(-12, -18); ctx.lineTo(20, -18);
  ctx.lineTo(18, 10); ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();

  // Belt
  ctx.fillStyle = giBelt;
  ctx.fillRect(-11, 8, 30, 6);

  // Gi bottom
  ctx.fillStyle = giBottom;
  ctx.fillRect(-10, 14, 12, 28);
  ctx.fillRect(6, 14, 12, 28);

  // Arms - Kamehameha pose (hands together, pushed forward)
  ctx.fillStyle = bodyColor;
  if (phase >= 2) {
    // Arms stretched forward
    ctx.beginPath();
    ctx.moveTo(20, -10); ctx.lineTo(55, -5);
    ctx.lineTo(55, 5); ctx.lineTo(20, 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, -2); ctx.lineTo(55, -8);
    ctx.lineTo(55, 2); ctx.lineTo(20, 5);
    ctx.closePath();
    ctx.fill();
    // Hands cupped
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(58, -2, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Energy ball in hands
    const ballGlow = 0.5 + Math.sin(t * 15) * 0.3;
    const grad = ctx.createRadialGradient(60, -2, 0, 60, -2, 15);
    grad.addColorStop(0, 'rgba(255,255,255,' + ballGlow + ')');
    grad.addColorStop(0.4, 'rgba(0,191,255,' + ballGlow + ')');
    grad.addColorStop(1, 'rgba(0,0,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(60, -2, 15, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Arms at sides / powering up
    ctx.beginPath();
    ctx.moveTo(-12, -14); ctx.lineTo(-25, 10);
    ctx.lineTo(-20, 12); ctx.lineTo(-8, -10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, -14); ctx.lineTo(33, 10);
    ctx.lineTo(28, 12); ctx.lineTo(18, -10);
    ctx.closePath();
    ctx.fill();
  }

  // Boots
  ctx.fillStyle = '#0047AB';
  ctx.fillRect(-11, 40, 13, 8);
  ctx.fillRect(6, 40, 13, 8);

  ctx.restore();
}

function drawAura(x, y, scale, intensity, t) {
  ctx.save();
  ctx.translate(x, y);
  const baseR = 60 * scale;
  const pulseR = baseR + Math.sin(t * 8) * 10 * intensity;
  for (let i = 3; i >= 0; i--) {
    const r = pulseR + i * 20 * intensity;
    const alpha = (0.15 - i * 0.03) * intensity;
    const grad = ctx.createRadialGradient(0, -10, 0, 0, -10, r);
    grad.addColorStop(0, 'rgba(0,191,255,' + alpha + ')');
    grad.addColorStop(0.5, 'rgba(30,144,255,' + (alpha * 0.6) + ')');
    grad.addColorStop(0.8, 'rgba(255,215,0,' + (alpha * 0.3) + ')');
    grad.addColorStop(1, 'rgba(0,0,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -10, r * 0.7, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Electric crackles
  if (intensity > 0.5) {
    ctx.strokeStyle = 'rgba(0,230,255,' + (0.6 * intensity) + ')';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const angle = (t * 3 + i * 1.3) % (Math.PI * 2);
      const dist = baseR * (0.5 + Math.random() * 0.5);
      ctx.beginPath();
      const sx = Math.cos(angle) * dist * 0.3;
      const sy = -10 + Math.sin(angle) * dist * 0.5;
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 3; j++) {
        ctx.lineTo(sx + (Math.random() - 0.5) * 30, sy + (Math.random() - 0.5) * 30);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBeam(startX, startY, progress, t) {
  const endX = W + 100;
  const beamLength = (endX - startX) * progress;
  const currentEndX = startX + beamLength;
  const beamY = startY - 2;
  const coreWidth = 18 + Math.sin(t * 12) * 3;

  // Outer glow
  for (let i = 4; i >= 0; i--) {
    const w = coreWidth + i * 15;
    const alpha = 0.08 - i * 0.015;
    const grad = ctx.createLinearGradient(startX, 0, currentEndX, 0);
    grad.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
    grad.addColorStop(0.1, 'rgba(0,191,255,' + (alpha * 2) + ')');
    grad.addColorStop(0.9, 'rgba(30,144,255,' + (alpha * 1.5) + ')');
    grad.addColorStop(1, 'rgba(0,100,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(startX, beamY - w / 2, beamLength, w);
  }

  // Core beam
  const coreGrad = ctx.createLinearGradient(startX, 0, currentEndX, 0);
  coreGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
  coreGrad.addColorStop(0.3, 'rgba(100,200,255,0.9)');
  coreGrad.addColorStop(1, 'rgba(0,120,255,0.7)');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(startX, beamY - coreWidth / 2, beamLength, coreWidth);

  // Inner white-hot core
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(startX, beamY - 4, beamLength, 8);

  // Leading edge ball
  if (progress < 1) {
    const edgeGrad = ctx.createRadialGradient(currentEndX, beamY, 0, currentEndX, beamY, 40);
    edgeGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    edgeGrad.addColorStop(0.3, 'rgba(0,191,255,0.6)');
    edgeGrad.addColorStop(1, 'rgba(0,0,255,0)');
    ctx.fillStyle = edgeGrad;
    ctx.beginPath();
    ctx.arc(currentEndX, beamY, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  // Spawn beam particles
  if (Math.random() < 0.5) {
    beamParticles.push({
      x: startX + Math.random() * beamLength,
      y: beamY + (Math.random() - 0.5) * coreWidth * 2,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 4,
      life: 1, decay: 0.02 + Math.random() * 0.03,
      size: 1 + Math.random() * 3,
    });
  }
}

function spawnAuraParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 60,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1, decay: 0.01 + Math.random() * 0.02,
      size: 2 + Math.random() * 4,
      color: Math.random() > 0.5 ? '0,191,255' : '255,215,0',
    });
  }
}

function updateParticles(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    if (p.life <= 0) arr.splice(i, 1);
  }
}

function drawParticles(arr) {
  for (const p of arr) {
    const c = p.color || '0,191,255';
    ctx.fillStyle = 'rgba(' + c + ',' + p.life + ')';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- SPEED LINES ---
function drawSpeedLines(intensity, t) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,' + (0.1 * intensity) + ')';
  ctx.lineWidth = 1;
  const cx = W * 0.25, cy = H * 0.5;
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2 + t;
    const r1 = 150 + Math.sin(t * 5 + i) * 50;
    const r2 = Math.max(W, H);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    ctx.stroke();
  }
  ctx.restore();
}

// --- MAIN ANIMATION LOOP ---
let chargeStarted = false, blastStarted = false;
initSound();
startTime = performance.now();

function animate(now) {
  const elapsed = (now - startTime) / 1000;
  const totalDur = DURATION / 1000;
  if (elapsed > totalDur + 0.5) {
    const vscode = acquireVsCodeApi();
    vscode.postMessage({ command: 'animationComplete' });
    return;
  }

  ctx.save();

  // Screen shake during beam
  if (elapsed > 0.6 && elapsed < totalDur - 1) {
    const shakeIntensity = elapsed > 1.8 ? 6 : 3;
    shakeX = (Math.random() - 0.5) * shakeIntensity;
    shakeY = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(shakeX, shakeY);
  }

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(-10, -10, W + 20, H + 20);

  // Stars / energy field
  ctx.fillStyle = 'rgba(100,180,255,0.05)';
  for (let i = 0; i < 50; i++) {
    const sx = ((i * 137.5 + elapsed * 20) % W);
    const sy = ((i * 97.3) % H);
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + Math.sin(elapsed + i) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const gokuX = W * 0.18;
  const gokuY = H * 0.55;
  const gokuScale = Math.min(W, H) / 350;

  // Phase 0: Entry (0 - 0.6s)
  if (elapsed < 0.6) {
    const p = elapsed / 0.6;
    const entryX = -100 + (gokuX + 100) * easeOutCubic(p);
    drawGoku(entryX, gokuY, gokuScale, 0, elapsed);
    drawSpeedLines(1 - p, elapsed);
  }
  // Phase 1: Power-up (0.6 - 1.8s)
  else if (elapsed < 1.8) {
    if (!chargeStarted) { chargeStarted = true; playChargeSound(); }
    const p = (elapsed - 0.6) / 1.2;
    drawAura(gokuX, gokuY, gokuScale, easeInCubic(p), elapsed);
    spawnAuraParticles(gokuX, gokuY, Math.floor(p * 5));
    drawGoku(gokuX, gokuY, gokuScale, 1, elapsed);

    // Show text scaling up
    if (p > 0.3) {
      const tp = (p - 0.3) / 0.7;
      textEl.style.opacity = Math.min(tp * 1.5, 1).toString();
      textEl.style.transform = 'translate(-50%, -50%) scale(' + (0.3 + tp * 0.7) + ')';
    }
  }
  // Phase 2: KAMEHAMEHA beam (1.8 - totalDur-1)
  else if (elapsed < totalDur - 1) {
    if (!blastStarted) {
      blastStarted = true;
      playBlastSound();
      flash.style.transition = 'opacity 0.15s';
      flash.style.opacity = '0.8';
      setTimeout(() => { flash.style.transition = 'opacity 0.5s'; flash.style.opacity = '0'; }, 150);
      textEl.style.transition = 'opacity 0.5s';
      textEl.style.opacity = '0';
    }
    const phaseDur = totalDur - 1 - 1.8;
    const p = Math.min((elapsed - 1.8) / (phaseDur * 0.4), 1);
    drawAura(gokuX, gokuY, gokuScale, 1, elapsed);
    drawGoku(gokuX, gokuY, gokuScale, 2, elapsed);
    const beamStartX = gokuX + 58 * gokuScale;
    const beamStartY = gokuY - 2 * gokuScale;
    drawBeam(beamStartX, beamStartY, p, elapsed);
    spawnAuraParticles(gokuX, gokuY, 2);
  }
  // Phase 3: Fade out
  else {
    const p = (elapsed - (totalDur - 1)) / 1;
    const alpha = 1 - easeInCubic(p);
    ctx.globalAlpha = alpha;
    drawAura(gokuX, gokuY, gokuScale, 1 - p, elapsed);
    drawGoku(gokuX, gokuY, gokuScale, 2, elapsed);
    const beamStartX = gokuX + 58 * gokuScale;
    const beamStartY = gokuY - 2 * gokuScale;
    drawBeam(beamStartX, beamStartY, 1, elapsed);
  }

  updateParticles(particles);
  updateParticles(beamParticles);
  drawParticles(particles);
  drawParticles(beamParticles);

  ctx.restore();
  requestAnimationFrame(animate);
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t) { return t * t * t; }

requestAnimationFrame(animate);
</script>
</body>
</html>`;
}
