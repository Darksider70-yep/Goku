/**
 * Generates an HTML string containing a full-screen Goku Kamehameha animation.
 * The animation includes:
 * - Goku character with Super Saiyan transformation
 * - Energy buildup aura and particles
 * - Kamehameha beam effect with full-screen coverage
 * - Synchronized sound design (charge and blast)
 * - Screen shake and visual feedback
 * 
 * @param duration - Total animation duration in milliseconds
 * @param soundEnabled - Whether to enable Web Audio API sound synthesis
 * @returns Complete HTML string with embedded CSS and JavaScript
 */
export function getAnimationHtml(duration: number, soundEnabled: boolean): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🐉 KAMEHAMEHA! 🐉</title>
<style>
  * { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
  }
  
  body { 
    overflow: hidden; 
    background: #000; 
    width: 100vw; 
    height: 100vh;
  }
  
  canvas { 
    display: block; 
    width: 100vw; 
    height: 100vh;
  }
  
  #text-overlay {
    position: fixed; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%) scale(0);
    font-family: 'Impact', 'Arial Black', sans-serif; 
    font-size: 72px;
    color: #fff; 
    text-shadow: 
      0 0 20px #00bfff, 
      0 0 40px #00bfff, 
      0 0 80px #1e90ff, 
      0 0 120px #0040ff;
    letter-spacing: 8px; 
    opacity: 0; 
    pointer-events: none; 
    z-index: 10;
    white-space: nowrap;
  }
  
  #flash { 
    position: fixed; 
    inset: 0; 
    background: #fff; 
    opacity: 0; 
    pointer-events: none; 
    z-index: 5; 
  }
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="flash"></div>
<div id="text-overlay">KA-ME-HA-ME-HAAA!</div>

<script>
// ========================================
// ANIMATION CONFIGURATION
// ========================================
const DURATION = ${duration};
const SOUND = ${soundEnabled};

// Timing phases (in seconds)
const PHASE_ENTRY = { start: 0, end: 0.6 };
const PHASE_TRANSFORM = { start: 0.6, end: 1.2 };
const PHASE_CHARGE = { start: 1.2, end: 2.0 };
const PHASE_BLAST = { start: 2.0, duration: null }; // Calculated from DURATION
const PHASE_FADEOUT = { duration: 1 };

// Visual parameters
const GOKU_SCALE_FACTOR = (minDim) => minDim / 350;
const GOKU_POSITION = { x: 0.18, y: 0.55 };
const BEAM_START_OFFSET = { x: 58, y: -2 };

// Particle configuration
const PARTICLE_CONFIG = {
  aura: { maxPerFrame: 5, decay: { min: 0.01, max: 0.02 } },
  beam: { spawnChance: 0.5, decay: { min: 0.02, max: 0.03 } },
  leaf: { max: 180, spawnPerFrame: 3, decay: { min: 0.006, max: 0.011 } }
};

// ========================================
// CANVAS & CONTEXT SETUP
// ========================================
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

if (!ctx) {
  console.error('Failed to get 2D context from canvas');
  document.body.innerHTML = '<p style="color: white; padding: 20px;">Unable to initialize animation.</p>';
}

const flash = document.getElementById('flash');
const textEl = document.getElementById('text-overlay');
let W, H, startTime, previousFrameTime;
let shakeX = 0, shakeY = 0;
const particles = [];
const beamParticles = [];
const leafParticles = [];

// Resize canvas to window size
function resize() { 
  W = canvas.width = window.innerWidth; 
  H = canvas.height = window.innerHeight; 
}
window.addEventListener('resize', resize);
resize();

// ========================================
// AUDIO SYNTHESIS
// ========================================
let audioCtx;

/**
 * Initialize Web Audio API context
 */
function initSound() {
  if (!SOUND) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {
    console.warn('Audio context initialization failed:', e);
  }
}

/**
 * Play charging sound effect (frequency sweep)
 */
function playChargeSound() {
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(80, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 1.2);
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 1.0);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    o.connect(g); 
    g.connect(audioCtx.destination);
    o.start(); 
    o.stop(audioCtx.currentTime + 1.5);
  } catch(e) {
    console.warn('Charge sound playback failed:', e);
  }
}

/**
 * Play blast sound effect (noise burst + bass boom)
 */
function playBlastSound() {
  if (!audioCtx) return;
  try {
    // Noise burst for impact
    const bufSize = audioCtx.sampleRate * 2;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.5));
    }
    
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filt = audioCtx.createBiquadFilter();
    filt.type = 'lowpass'; 
    filt.frequency.value = 600;
    filt.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 1.5);
    
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.7, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);
    
    src.connect(filt); 
    filt.connect(g); 
    g.connect(audioCtx.destination);
    src.start();

    // Deep bass boom
    const bass = audioCtx.createOscillator();
    const bg = audioCtx.createGain();
    bass.type = 'sine'; 
    bass.frequency.value = 40;
    bg.gain.setValueAtTime(0.5, audioCtx.currentTime);
    bg.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    bass.connect(bg); 
    bg.connect(audioCtx.destination);
    bass.start(); 
    bass.stop(audioCtx.currentTime + 1.5);
  } catch(e) {
    console.warn('Blast sound playback failed:', e);
  }
}

// ========================================
// CHARACTER & EFFECTS DRAWING
// ========================================

/**
 * Draw Goku character in various states
 * @param x - X position
 * @param y - Y position
 * @param scale - Scale factor
 * @param phase - 0=normal, 1=super saiyan (aura), 2=powering Kamehameha
 * @param t - Current time for animation variations
 */
function drawGoku(x, y, scale, phase, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const superSaiyan = Math.min(Math.max(phase, 0), 1);
  const attacking = phase >= 2;

  // Color palette
  const bodyColor = '#F4A460';
  const giTop = '#FF6B00';
  const giBottom = '#FF6B00';
  const giBelt = '#0047AB';
  const hairRed = Math.round(26 + (255 - 26) * superSaiyan);
  const hairGreen = Math.round(26 + (215 - 26) * superSaiyan);
  const hairBlue = Math.round(26 * (1 - superSaiyan));
  const hair = 'rgb(' + hairRed + ',' + hairGreen + ',' + hairBlue + ')';
  const hairLift = superSaiyan * 15;

  // Golden Super Saiyan hair grows taller as the transformation completes.
  if (superSaiyan > 0.02) {
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8 + superSaiyan * (24 + Math.sin(t * 10) * 8);
  }

  // Spiky hair
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.moveTo(-8, -45);
  ctx.lineTo(-20 - superSaiyan * 4, -75 - hairLift); ctx.lineTo(-6, -58);
  ctx.lineTo(-2, -82 - hairLift * 1.25); ctx.lineTo(4, -55);
  ctx.lineTo(13 + superSaiyan * 3, -78 - hairLift); ctx.lineTo(10, -52);
  ctx.lineTo(22 + superSaiyan * 5, -70 - hairLift * 0.6); ctx.lineTo(14, -45);
  ctx.lineTo(24 + superSaiyan * 4, -60 - hairLift * 0.3); ctx.lineTo(16, -40);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(4, -35, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes shift from dark to electric blue with the transformation.
  ctx.fillStyle = 'rgb(0,' + Math.round(229 * superSaiyan) + ',' + Math.round(255 * superSaiyan) + ')';
  ctx.beginPath();
  ctx.ellipse(-2, -37, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(10, -37, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gi (martial arts uniform) top
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

  // Arms - Different poses based on animation phase
  ctx.fillStyle = bodyColor;
  if (attacking) {
    // Arms stretched forward for Kamehameha pose
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
    // Hands cupped together
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

/**
 * Draw energy aura around Goku
 * @param x - X position
 * @param y - Y position (slightly offset upward)
 * @param scale - Scale factor
 * @param intensity - Aura intensity (0-1)
 * @param t - Current time for pulsing effect
 */
function drawAura(x, y, scale, intensity, t) {
  ctx.save();
  ctx.translate(x, y);
  const baseR = 60 * scale;
  const pulseR = baseR + Math.sin(t * 8) * 10 * intensity;

  // Flickering flame silhouettes give the golden aura a stronger Super Saiyan read.
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 13; i++) {
    const angle = (i / 13) * Math.PI * 2 + t * 0.8;
    const flameLength = (20 + Math.sin(t * 12 + i * 2.7) * 12) * intensity * scale;
    const fx = Math.cos(angle) * baseR * 0.65;
    const fy = -10 + Math.sin(angle) * baseR * 0.9;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(angle + Math.PI / 2);
    const flame = ctx.createLinearGradient(0, 0, 0, -flameLength);
    flame.addColorStop(0, 'rgba(255,189,0,' + (0.34 * intensity) + ')');
    flame.addColorStop(0.55, 'rgba(255,232,100,' + (0.2 * intensity) + ')');
    flame.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-7 * scale, 0);
    ctx.quadraticCurveTo(0, -flameLength, 7 * scale, 0);
    ctx.quadraticCurveTo(0, -flameLength * 0.35, -7 * scale, 0);
    ctx.fill();
    ctx.restore();
  }
  
  // Concentric aura rings with gradient
  for (let i = 3; i >= 0; i--) {
    const r = pulseR + i * 20 * intensity;
    const alpha = (0.15 - i * 0.03) * intensity;
    const grad = ctx.createRadialGradient(0, -10, 0, 0, -10, r);
    grad.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
    grad.addColorStop(0.36, 'rgba(255,215,0,' + (alpha * 1.4) + ')');
    grad.addColorStop(0.72, 'rgba(255,125,0,' + (alpha * 0.5) + ')');
    grad.addColorStop(1, 'rgba(255,170,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -10, r * 0.7, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Electric crackles around aura
  if (intensity > 0.5) {
    ctx.strokeStyle = 'rgba(255,248,184,' + (0.7 * intensity) + ')';
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

/** Draw rising gold sparks that sell the transformation and power-up. */
function drawSuperSaiyanSparks(x, y, scale, intensity, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 16; i++) {
    const angle = i * 2.4;
    const drift = ((t * 55 + i * 47) % 125) - 20;
    const sx = Math.sin(angle) * (20 + (i % 4) * 12) * scale;
    const sy = 38 * scale - drift * scale;
    const length = (5 + (i % 3) * 4) * intensity * scale;
    ctx.strokeStyle = 'rgba(255,240,129,' + (0.25 + intensity * 0.65) + ')';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle) * length, sy - length * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw the Kamehameha beam across the screen
 * @param startX - X position where beam originates
 * @param startY - Y position where beam originates
 * @param progress - Animation progress (0-1) for beam extension
 * @param t - Current time for beam pulsing effect
 */
function drawBeam(startX, startY, progress, t) {
  const endX = W + 100;
  const beamLength = (endX - startX) * progress;
  const currentEndX = startX + beamLength;
  const beamY = startY - 2;
  const coreWidth = 18 + Math.sin(t * 12) * 3;

  // Outer glow layers
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

  // Leading edge ball for visual punch
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

  // Spawn particles from beam trail
  if (Math.random() < PARTICLE_CONFIG.beam.spawnChance) {
    beamParticles.push({
      x: startX + Math.random() * beamLength,
      y: beamY + (Math.random() - 0.5) * coreWidth * 2,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 4,
      life: 1, 
      decay: PARTICLE_CONFIG.beam.decay.min + Math.random() * (PARTICLE_CONFIG.beam.decay.max - PARTICLE_CONFIG.beam.decay.min),
      size: 1 + Math.random() * 3,
    });
  }
}

/**
 * Spawn aura particles for visual effect
 * @param x - X position
 * @param y - Y position
 * @param count - Number of particles to spawn
 */
function spawnAuraParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 60,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1, 
      decay: PARTICLE_CONFIG.aura.decay.min + Math.random() * (PARTICLE_CONFIG.aura.decay.max - PARTICLE_CONFIG.aura.decay.min),
      size: 2 + Math.random() * 4,
      color: Math.random() > 0.5 ? '0,191,255' : '255,215,0',
    });
  }
}

/**
 * Draw a spinning leaf
 * @param leaf - Leaf particle to draw
 */
function drawLeaf(leaf) {
  ctx.save();
  ctx.translate(leaf.x, leaf.y);
  ctx.rotate(leaf.rotation + Math.sin(leaf.wobble) * 0.35);
  ctx.scale(leaf.scale, leaf.scale);
  ctx.globalAlpha = Math.max(0, Math.min(1, leaf.life * 1.35));
  
  ctx.fillStyle = leaf.color;
  
  // Asymmetric pointed leaf with a visible midrib.
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.bezierCurveTo(10, -11, 10, 7, 0, 15);
  ctx.bezierCurveTo(-10, 7, -10, -11, 0, -15);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(38,57,18,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(0, 15);
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Spawn leaves into the Kamehameha's pressure wave.
 * @param count - Number of leaves to spawn
 * @param windStrength - Horizontal force generated by the blast
 * @param sourceX - Beam origin for a concentrated gust near Goku
 */
function spawnLeaves(count, windStrength, sourceX) {
  const available = Math.max(0, PARTICLE_CONFIG.leaf.max - leafParticles.length);
  for (let i = 0; i < Math.min(count, available); i++) {
    const beginsAtEdge = Math.random() < 0.48;
    const spawnX = beginsAtEdge
      ? -25 - Math.random() * 90
      : sourceX + Math.random() * W * 0.55;
    const nearBeam = Math.random() < 0.58;
    const spawnY = nearBeam
      ? H * (0.32 + Math.random() * 0.34)
      : H * (0.08 + Math.random() * 0.84);
    const color = ['#2D5016', '#3D6B1F', '#709B2E', '#B6A22A', '#CD8B24'][Math.floor(Math.random() * 5)];
    leafParticles.push({
      x: spawnX,
      y: spawnY,
      vx: windStrength * (0.35 + Math.random() * 0.35),
      vy: (Math.random() - 0.5) * 2,
      fall: 0.2 + Math.random() * 1.2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.22,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.08 + Math.random() * 0.12,
      isLeaf: true,
      life: 1,
      decay: PARTICLE_CONFIG.leaf.decay.min + Math.random() * (PARTICLE_CONFIG.leaf.decay.max - PARTICLE_CONFIG.leaf.decay.min),
      scale: 0.5 + Math.random() * 1.5,
      color: color,
    });
  }
}

/**
 * Update particle physics and lifecycle
 * @param arr - Particle array to update
 * @param frameScale - Normalized elapsed frame duration
 * @param windStrength - Horizontal wind force for leaf particles
 */
function updateParticles(arr, frameScale, windStrength) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    if (p.isLeaf) {
      const gust = windStrength * (0.78 + Math.sin(p.wobble) * 0.22);
      p.vx += (gust - p.vx) * 0.018 * frameScale;
      p.vy += (p.fall - p.vy) * 0.022 * frameScale;
      p.wobble += p.wobbleSpeed * frameScale;
    }
    p.x += p.vx * frameScale;
    p.y += p.vy * frameScale;
    p.life -= p.decay * frameScale;
    if (p.rotation !== undefined) {
      p.rotation += p.rotationSpeed * frameScale;
    }
    if (p.life <= 0 || p.x > W + 110 || p.y > H + 110 || p.y < -110) {
      arr.splice(i, 1);
    }
  }
}

/**
 * Draw all particles with alpha based on life
 * @param arr - Particle array to draw
 */
function drawParticles(arr) {
  for (const p of arr) {
    const c = p.color || '0,191,255';
    ctx.fillStyle = 'rgba(' + c + ',' + p.life + ')';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw all leaves with rotation and scaling
 * @param arr - Leaf particle array to draw
 */
function drawLeaves(arr) {
  for (const leaf of arr) {
    drawLeaf(leaf);
  }
}

/**
 * Draw speed lines radiating from Goku for impact
 * @param intensity - Visual intensity (0-1)
 * @param t - Current time for animation
 */
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

/**
 * Ease out cubic - starts fast, ends slow
 */
function easeOutCubic(t) { 
  return 1 - Math.pow(1 - t, 3); 
}

/**
 * Ease in cubic - starts slow, accelerates
 */
function easeInCubic(t) { 
  return t * t * t; 
}

// ========================================
// MAIN ANIMATION LOOP
// ========================================

let chargeStarted = false;
let blastStarted = false;

initSound();
startTime = performance.now();
previousFrameTime = startTime;

/**
 * Main animation frame callback
 * Orchestrates all animation phases and visual effects
 */
function animate(now) {
  const elapsed = (now - startTime) / 1000;
  const totalDur = DURATION / 1000;
  const frameScale = Math.min(2.5, Math.max(0.25, (now - previousFrameTime) / (1000 / 60)));
  previousFrameTime = now;
  let leafWind = 0;
  
  // Check if animation is complete
  if (elapsed > totalDur + 0.5) {
    try {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({ command: 'animationComplete' });
    } catch(e) {
      console.warn('Failed to send completion message:', e);
    }
    return;
  }

  ctx.save();

  // Screen shake during transformation and beam attack
  if (elapsed > PHASE_TRANSFORM.start && elapsed < totalDur - 1) {
    const shakeIntensity = elapsed > PHASE_CHARGE.end ? 8 : 2;
    shakeX = (Math.random() - 0.5) * shakeIntensity;
    shakeY = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(shakeX, shakeY);
  }

  // Black background with slight transparency
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(-10, -10, W + 20, H + 20);

  // Animated energy field stars
  ctx.fillStyle = 'rgba(100,180,255,0.05)';
  for (let i = 0; i < 50; i++) {
    const sx = ((i * 137.5 + elapsed * 20) % W);
    const sy = ((i * 97.3) % H);
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + Math.sin(elapsed + i) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const gokuX = W * GOKU_POSITION.x;
  const gokuY = H * GOKU_POSITION.y;
  const gokuScale = GOKU_SCALE_FACTOR(Math.min(W, H));

  // ========================================
  // ANIMATION PHASES
  // ========================================

  // PHASE 0: Entry - Goku flies in (0-0.6s)
  if (elapsed < PHASE_ENTRY.end) {
    const p = elapsed / PHASE_ENTRY.end;
    const entryX = -100 + (gokuX + 100) * easeOutCubic(p);
    drawGoku(entryX, gokuY, gokuScale, 0, elapsed);
    drawSpeedLines(1 - p, elapsed);
  }
  // PHASE 1: Transform - Super Saiyan transformation (0.6-1.2s)
  else if (elapsed < PHASE_TRANSFORM.end) {
    const p = (elapsed - PHASE_TRANSFORM.start) / (PHASE_TRANSFORM.end - PHASE_TRANSFORM.start);
    
    // Transformation flash effect
    if (p < 0.3) {
      const flashIntensity = Math.sin(p * Math.PI * 3) * 0.6;
      ctx.globalAlpha = flashIntensity;
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.globalAlpha = 1;
    }
    
    // Lightning/aura during transformation
    if (p > 0.1) {
      const auraIntensity = Math.min(easeInCubic(p), 1);
      drawAura(gokuX, gokuY, gokuScale, auraIntensity * 0.8, elapsed);
    }
    
    // Spawn transformation particles
    spawnAuraParticles(gokuX, gokuY, Math.floor(p * 8));
    drawSuperSaiyanSparks(gokuX, gokuY, gokuScale, p, elapsed);
    
    // Draw Goku in transition; hair and eyes change continuously from base to Super Saiyan.
    drawGoku(gokuX, gokuY, gokuScale, p, elapsed);
  }
  // PHASE 2: Power-up - Charge energy (1.2-2.0s)
  else if (elapsed < PHASE_CHARGE.end) {
    if (!chargeStarted) { 
      chargeStarted = true; 
      playChargeSound(); 
    }
    const p = (elapsed - PHASE_CHARGE.start) / (PHASE_CHARGE.end - PHASE_CHARGE.start);
    drawAura(gokuX, gokuY, gokuScale, 0.7 + easeInCubic(p) * 0.3, elapsed);
    drawSuperSaiyanSparks(gokuX, gokuY, gokuScale, 0.65 + p * 0.35, elapsed);
    spawnAuraParticles(gokuX, gokuY, Math.floor(p * PARTICLE_CONFIG.aura.maxPerFrame));
    drawGoku(gokuX, gokuY, gokuScale, 1.5 + p * 0.5, elapsed);
    leafWind = 3 + p * 7;

    // The gathering energy starts to tug at nearby leaves before the blast lands.
    if (p > 0.55) {
      spawnLeaves(1, leafWind, gokuX);
    }

    // Show text scaling up
    if (p > 0.3) {
      const tp = (p - 0.3) / 0.7;
      textEl.style.opacity = Math.min(tp * 1.5, 1).toString();
      textEl.style.transform = 'translate(-50%, -50%) scale(' + (0.3 + tp * 0.7) + ')';
    }
  }
  // PHASE 3: KAMEHAMEHA beam - Fire the attack with leaves (2.0s - totalDur-1)
  else if (elapsed < totalDur - PHASE_FADEOUT.duration) {
    if (!blastStarted) {
      blastStarted = true;
      playBlastSound();
      flash.style.transition = 'opacity 0.15s';
      flash.style.opacity = '0.8';
      setTimeout(() => { 
        flash.style.transition = 'opacity 0.5s'; 
        flash.style.opacity = '0'; 
      }, 150);
      textEl.style.transition = 'opacity 0.5s';
      textEl.style.opacity = '0';
    }
    const phaseDur = totalDur - PHASE_FADEOUT.duration - PHASE_CHARGE.end;
    const p = Math.min((elapsed - PHASE_CHARGE.end) / (phaseDur * 0.4), 1);
    drawAura(gokuX, gokuY, gokuScale, 1, elapsed);
    drawSuperSaiyanSparks(gokuX, gokuY, gokuScale, 1, elapsed);
    drawGoku(gokuX, gokuY, gokuScale, 2, elapsed);
    const beamStartX = gokuX + BEAM_START_OFFSET.x * gokuScale;
    const beamStartY = gokuY + BEAM_START_OFFSET.y * gokuScale;
    drawBeam(beamStartX, beamStartY, p, elapsed);
    spawnAuraParticles(gokuX, gokuY, 2);
    
    // A powerful horizontal gust carries leaves through the beam's foreground.
    leafWind = 16 + p * 10;
    spawnLeaves(PARTICLE_CONFIG.leaf.spawnPerFrame, leafWind, gokuX);
  }
  // PHASE 4: Fade out - Animation concludes (totalDur-1 - totalDur)
  else {
    const p = (elapsed - (totalDur - PHASE_FADEOUT.duration)) / PHASE_FADEOUT.duration;
    const alpha = 1 - easeInCubic(p);
    ctx.globalAlpha = alpha;
    drawAura(gokuX, gokuY, gokuScale, 1 - p, elapsed);
    drawSuperSaiyanSparks(gokuX, gokuY, gokuScale, alpha, elapsed);
    drawGoku(gokuX, gokuY, gokuScale, 2, elapsed);
    const beamStartX = gokuX + BEAM_START_OFFSET.x * gokuScale;
    const beamStartY = gokuY + BEAM_START_OFFSET.y * gokuScale;
    drawBeam(beamStartX, beamStartY, 1, elapsed);
    leafWind = 12 * alpha;
  }

  // Update and draw all particles
  updateParticles(particles, frameScale, 0);
  updateParticles(beamParticles, frameScale, 0);
  updateParticles(leafParticles, frameScale, leafWind);
  drawParticles(particles);
  drawParticles(beamParticles);
  drawLeaves(leafParticles);

  ctx.restore();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
</script>
</body>
</html>`;
}
