/**
 * High-Fidelity Character Vector & Sprite Renderer
 * Renders Bagio (Boy with Blangkon/Batik) and Siti (Girl with Kebaya/Hair Bun)
 * with fluid walk cycles, authentic Jamuran action poses, and feedback reactions.
 */

import { CharacterType } from '../types/game';

export interface DrawCharacterOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  directionRow?: number; // 0: front, 1: left, 2: right, 3: back
  walkFrame?: number;
  flipHorizontal?: boolean;
  actionState?: 'normal' | 'kethek' | 'gagang' | 'payung' | 'meja_kursi' | 'barat' | 'correct' | 'wrong';
  actionElapsed?: number;
  colorVariant?: number; // for NPC variations
  isPancer?: boolean;
  highlightRing?: boolean;
}

export const CHARACTER_RENDER_WIDTH = 78;
export const CHARACTER_RENDER_HEIGHT = 96;

export function drawVectorCharacter(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  options: DrawCharacterOptions
) {
  const {
    x,
    y,
    width = CHARACTER_RENDER_WIDTH,
    height = CHARACTER_RENDER_HEIGHT,
    directionRow = 0,
    walkFrame = 0,
    flipHorizontal = false,
    actionState = 'normal',
    actionElapsed = 0,
    colorVariant = 0,
    isPancer = false,
    highlightRing = false
  } = options;

  ctx.save();
  ctx.translate(x, y);

  if (flipHorizontal) {
    ctx.scale(-1, 1);
  }

  // Draw highlight ring on ground if requested (e.g. current player)
  if (highlightRing) {
    ctx.save();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255, 209, 102, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, height * 0.44, width * 0.45, height * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Shadow under character
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, height * 0.42, width * 0.38, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Color palettes based on character and variant
  const boyPalettes = [
    { shirt: '#2b6cb0', shirtPattern: '#1a4971', blangkon: '#4a2810', sarong: '#744210' },
    { shirt: '#c53030', shirtPattern: '#7b1c1c', blangkon: '#38200d', sarong: '#652b19' },
    { shirt: '#285e61', shirtPattern: '#1d4044', blangkon: '#442b15', sarong: '#593817' },
    { shirt: '#6b46c1', shirtPattern: '#44337a', blangkon: '#322312', sarong: '#553c25' }
  ];

  const girlPalettes = [
    { kebaya: '#dd6b20', kebayaTrim: '#9c4221', hairRibbon: '#e53e3e', jarik: '#744210' },
    { kebaya: '#d53f8c', kebayaTrim: '#97266d', hairRibbon: '#3182ce', jarik: '#5d3714' },
    { kebaya: '#38a169', kebayaTrim: '#22543d', hairRibbon: '#d69e2e', jarik: '#683d18' },
    { kebaya: '#805ad5', kebayaTrim: '#553c9a', hairRibbon: '#dd6b20', jarik: '#5a3415' }
  ];

  const boyTheme = boyPalettes[colorVariant % boyPalettes.length];
  const girlTheme = girlPalettes[colorVariant % girlPalettes.length];

  // Animation cycle values
  const stepCycle = Math.sin(walkFrame * (Math.PI / 3));
  const legSwing = actionState === 'normal' ? stepCycle * 14 : 0;
  const armSwing = actionState === 'normal' ? -stepCycle * 18 : 0;
  const bobbing = actionState === 'normal' ? Math.abs(Math.sin(walkFrame * (Math.PI / 3))) * 3.5 : 0;

  // Center vertical offset
  const cy = -height * 0.05 - bobbing;

  // Render by action state
  if (actionState === 'kethek') {
    renderKethekPose(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'gagang') {
    renderGagangPose(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'payung') {
    renderPayungPose(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'meja_kursi') {
    renderMejaKursiPose(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'correct') {
    renderCorrectCelebration(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'wrong') {
    renderWrongReaction(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else {
    // Normal walk / stand pose
    renderStandardBody(
      ctx,
      character,
      boyTheme,
      girlTheme,
      directionRow,
      legSwing,
      armSwing,
      width,
      height,
      cy,
      isPancer
    );
  }

  // Pancer crown/badge
  if (isPancer) {
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.strokeStyle = '#8d4a0a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, cy - height * 0.52);
    ctx.lineTo(-6, cy - height * 0.44);
    ctx.lineTo(0, cy - height * 0.54);
    ctx.lineTo(6, cy - height * 0.44);
    ctx.lineTo(12, cy - height * 0.52);
    ctx.lineTo(8, cy - height * 0.42);
    ctx.lineTo(-8, cy - height * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Standard body rendering with 4 directions
 */
function renderStandardBody(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: { shirt: string; shirtPattern: string; blangkon: string; sarong: string },
  girlTheme: { kebaya: string; kebayaTrim: string; hairRibbon: string; jarik: string },
  directionRow: number,
  legSwing: number,
  armSwing: number,
  w: number,
  h: number,
  cy: number,
  isPancer: boolean
) {
  const isBack = directionRow === 3;
  const isProfile = directionRow === 1 || directionRow === 2;

  // LEGS / SHOES
  ctx.save();
  ctx.fillStyle = '#2d1b10'; // Traditional sandals / dark shoes
  // Left leg
  ctx.beginPath();
  ctx.roundRect(-w * 0.18, cy + h * 0.28 + legSwing * 0.3, w * 0.13, h * 0.18, 4);
  ctx.fill();
  // Right leg
  ctx.beginPath();
  ctx.roundRect(w * 0.05, cy + h * 0.28 - legSwing * 0.3, w * 0.13, h * 0.18, 4);
  ctx.fill();
  ctx.restore();

  // SARONG / JARIK
  ctx.save();
  ctx.fillStyle = character === 'boy' ? boyTheme.sarong : girlTheme.jarik;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, cy + h * 0.08);
  ctx.lineTo(w * 0.22, cy + h * 0.08);
  ctx.lineTo(w * 0.2 + (legSwing * 0.1), cy + h * 0.32);
  ctx.lineTo(-w * 0.2 - (legSwing * 0.1), cy + h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Batik stripe details
  ctx.strokeStyle = 'rgba(255, 230, 180, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w * 0.14, cy + h * 0.12);
  ctx.lineTo(-w * 0.1, cy + h * 0.3);
  ctx.moveTo(0, cy + h * 0.1);
  ctx.lineTo(0, cy + h * 0.31);
  ctx.moveTo(w * 0.14, cy + h * 0.12);
  ctx.lineTo(w * 0.1, cy + h * 0.3);
  ctx.stroke();
  ctx.restore();

  // TORSO / SHIRT / KEBAYA
  ctx.save();
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.strokeStyle = character === 'boy' ? boyTheme.shirtPattern : girlTheme.kebayaTrim;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(-w * 0.24, cy - h * 0.12, w * 0.48, h * 0.24, 6);
  ctx.fill();
  ctx.stroke();

  // Collar & Button/Brooch
  if (!isBack) {
    ctx.strokeStyle = '#fff1c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.08, cy - h * 0.12);
    ctx.lineTo(0, cy - h * 0.04);
    ctx.lineTo(w * 0.08, cy - h * 0.12);
    ctx.stroke();

    // Brooch or buttons
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, cy - h * 0.02, 3, 0, Math.PI * 2);
    ctx.arc(0, cy + h * 0.04, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ARMS
  ctx.save();
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 1.5;

  // Left arm
  ctx.save();
  ctx.translate(-w * 0.24, cy - h * 0.08);
  ctx.rotate((armSwing * Math.PI) / 180);
  ctx.beginPath();
  ctx.roundRect(-w * 0.06, 0, w * 0.12, h * 0.22, 5);
  ctx.fill();
  // Hand
  ctx.fillStyle = '#f6d19e';
  ctx.beginPath();
  ctx.arc(0, h * 0.22, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right arm
  ctx.save();
  ctx.translate(w * 0.24, cy - h * 0.08);
  ctx.rotate((-armSwing * Math.PI) / 180);
  ctx.beginPath();
  ctx.roundRect(-w * 0.06, 0, w * 0.12, h * 0.22, 5);
  ctx.fill();
  // Hand
  ctx.fillStyle = '#f6d19e';
  ctx.beginPath();
  ctx.arc(0, h * 0.22, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // HEAD & HAIR / BLANGKON
  renderHead(ctx, character, boyTheme, girlTheme, directionRow, w, h, cy);
}

function renderHead(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: { shirt: string; blangkon: string },
  girlTheme: { kebaya: string; hairRibbon: string },
  directionRow: number,
  w: number,
  h: number,
  cy: number
) {
  const isBack = directionRow === 3;
  const isProfile = directionRow === 1 || directionRow === 2;
  const headY = cy - h * 0.26;
  const headRadius = w * 0.23;

  // Head Skin
  ctx.save();
  ctx.fillStyle = '#f8d7ab';
  ctx.beginPath();
  ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.beginPath();
  ctx.roundRect(-w * 0.07, headY + headRadius * 0.6, w * 0.14, h * 0.08, 2);
  ctx.fill();

  // Ears
  if (!isProfile) {
    ctx.beginPath();
    ctx.arc(-headRadius * 0.95, headY, 4, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.95, headY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // HAIR / HEADWEAR
  if (character === 'boy') {
    // Javanese Blangkon
    ctx.fillStyle = boyTheme.blangkon;
    ctx.strokeStyle = '#2b1506';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    // Cap wrapping over top half of head
    ctx.arc(0, headY - 1, headRadius + 1.5, Math.PI * 0.95, Math.PI * 2.05, false);
    ctx.lineTo(headRadius * 0.85, headY - 2);
    ctx.quadraticCurveTo(0, headY - headRadius * 0.3, -headRadius * 0.85, headY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mondholan (the iconic round bump at the back of the blangkon)
    if (isBack) {
      ctx.beginPath();
      ctx.arc(0, headY + 4, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(headRadius * 0.8, headY - 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Blangkon front knot & pleats
    ctx.strokeStyle = 'rgba(255, 230, 180, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-headRadius * 0.7, headY - headRadius * 0.5);
    ctx.lineTo(0, headY - headRadius * 0.7);
    ctx.lineTo(headRadius * 0.7, headY - headRadius * 0.5);
    ctx.stroke();
  } else {
    // Girl Hair & Sanggul / Buns with Ribbon
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.arc(0, headY - 2, headRadius + 1.2, Math.PI, Math.PI * 2);
    ctx.fill();

    // Side bangs / hair locks
    ctx.beginPath();
    ctx.moveTo(-headRadius, headY - 2);
    ctx.quadraticCurveTo(-headRadius * 0.8, headY + 8, -headRadius * 0.5, headY + 4);
    ctx.lineTo(-headRadius * 0.6, headY - 4);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(headRadius, headY - 2);
    ctx.quadraticCurveTo(headRadius * 0.8, headY + 8, headRadius * 0.5, headY + 4);
    ctx.lineTo(headRadius * 0.6, headY - 4);
    ctx.fill();

    // Hair Buns / Ribbons (two cute buns or sanggul)
    ctx.fillStyle = girlTheme.hairRibbon;
    // Left bun
    ctx.beginPath();
    ctx.arc(-headRadius * 0.9, headY - headRadius * 0.7, 7, 0, Math.PI * 2);
    ctx.fill();
    // Right bun
    ctx.beginPath();
    ctx.arc(headRadius * 0.9, headY - headRadius * 0.7, 7, 0, Math.PI * 2);
    ctx.fill();

    // Jasmine flower accent (Melati)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-headRadius * 0.8, headY - headRadius * 0.8, 3.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.8, headY - headRadius * 0.8, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // FACE (Eyes, Cheeks, Smile)
  if (!isBack) {
    // Cheerful Eyes
    ctx.fillStyle = '#222';
    if (isProfile) {
      const eyeX = directionRow === 1 ? -6 : 6;
      ctx.beginPath();
      ctx.arc(eyeX, headY, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(-6.5, headY, 2.6, 0, Math.PI * 2);
      ctx.arc(6.5, headY, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Eye highlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-7.5, headY - 1, 1, 0, Math.PI * 2);
      ctx.arc(5.5, headY - 1, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy Cheeks
    ctx.fillStyle = 'rgba(235, 87, 87, 0.4)';
    ctx.beginPath();
    ctx.arc(-11, headY + 5, 4, 0, Math.PI * 2);
    ctx.arc(11, headY + 5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Sweet Smile
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, headY + 3, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * JAMUR KETHEK: Monkey scratching armpits and head with funny bounce
 */
function renderKethekPose(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  cy: number
) {
  const scratchBounce = Math.sin(elapsed * 12) * 5;
  const armMove = Math.sin(elapsed * 15) * 8;

  ctx.save();
  // Squatted monkey legs
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.22, cy + h * 0.22, w * 0.14, h * 0.14, 4);
  ctx.roundRect(w * 0.08, cy + h * 0.22, w * 0.14, h * 0.14, 4);
  ctx.fill();

  // Torso slightly hunched
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.beginPath();
  ctx.roundRect(-w * 0.24, cy - h * 0.08 + scratchBounce, w * 0.48, h * 0.26, 8);
  ctx.fill();

  // Left arm reaching up scratching head
  ctx.strokeStyle = '#f8d7ab';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy - h * 0.02 + scratchBounce);
  ctx.lineTo(-w * 0.32, cy - h * 0.22 + scratchBounce);
  ctx.lineTo(-w * 0.08, cy - h * 0.32 + armMove + scratchBounce);
  ctx.stroke();

  // Right arm scratching armpit / rib
  ctx.beginPath();
  ctx.moveTo(w * 0.2, cy - h * 0.02 + scratchBounce);
  ctx.lineTo(w * 0.34, cy + h * 0.06 + scratchBounce);
  ctx.lineTo(w * 0.1, cy - h * 0.04 - armMove + scratchBounce);
  ctx.stroke();

  // Head with funny grin
  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, cy + scratchBounce);

  // Floating monkey text indicator
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("U-u.. A-a! 🐒", 0, cy - h * 0.52);

  ctx.restore();
}

/**
 * JAMUR GAGANG: Standing perched on one leg like a plant stalk/stem
 */
function renderGagangPose(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  cy: number
) {
  const wobble = Math.sin(elapsed * 6) * 0.08;

  ctx.save();
  ctx.rotate(wobble);

  // Standing on ONLY left foot
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.06, cy + h * 0.22, w * 0.12, h * 0.2, 4);
  ctx.fill();

  // Right leg lifted high (bent at knee)
  ctx.save();
  ctx.strokeStyle = '#2d1b10';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.08, cy + h * 0.14);
  ctx.lineTo(w * 0.24, cy + h * 0.12);
  ctx.lineTo(w * 0.22, cy + h * 0.28);
  ctx.stroke();
  ctx.restore();

  // Torso
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.beginPath();
  ctx.roundRect(-w * 0.2, cy - h * 0.12, w * 0.4, h * 0.26, 6);
  ctx.fill();

  // Both arms stretched out wide horizontally for balance like tree branches
  ctx.strokeStyle = '#f8d7ab';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, cy - h * 0.06);
  ctx.lineTo(-w * 0.44, cy - h * 0.08 + Math.sin(elapsed * 5) * 6);
  ctx.moveTo(w * 0.18, cy - h * 0.06);
  ctx.lineTo(w * 0.44, cy - h * 0.08 - Math.sin(elapsed * 5) * 6);
  ctx.stroke();

  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, cy);

  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Tahan 1 Kaki! 🌿", 0, cy - h * 0.52);

  ctx.restore();
}

/**
 * JAMUR PAYUNG: Arms arched overhead forming an umbrella
 */
function renderPayungPose(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  cy: number
) {
  ctx.save();
  // Standing legs together
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.12, cy + h * 0.22, w * 0.1, h * 0.2, 4);
  ctx.roundRect(w * 0.02, cy + h * 0.22, w * 0.1, h * 0.2, 4);
  ctx.fill();

  // Torso
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.beginPath();
  ctx.roundRect(-w * 0.2, cy - h * 0.12, w * 0.4, h * 0.26, 6);
  ctx.fill();

  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, cy);

  // Arms arched overhead like a dome
  ctx.strokeStyle = '#f8d7ab';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, cy - h * 0.06);
  ctx.quadraticCurveTo(-w * 0.36, cy - h * 0.38, 0, cy - h * 0.54);
  ctx.quadraticCurveTo(w * 0.36, cy - h * 0.38, w * 0.18, cy - h * 0.06);
  ctx.stroke();

  // Umbrella canopy glow overhead
  ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, cy - h * 0.42, w * 0.55, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Payung Mengembang! ☂️", 0, cy - h * 0.62);

  ctx.restore();
}

/**
 * JAMUR MEJA KURSI: Squatting low with hands resting on knees
 */
function renderMejaKursiPose(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  cy: number
) {
  const squatY = cy + h * 0.14;

  ctx.save();
  // Deep squat legs
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.32, squatY + h * 0.12, w * 0.16, h * 0.12, 4);
  ctx.roundRect(w * 0.16, squatY + h * 0.12, w * 0.16, h * 0.12, 4);
  ctx.fill();

  // Torso low
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.beginPath();
  ctx.roundRect(-w * 0.28, squatY - h * 0.16, w * 0.56, h * 0.26, 6);
  ctx.fill();

  // Arms locked onto knees
  ctx.strokeStyle = '#f8d7ab';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, squatY - h * 0.08);
  ctx.lineTo(-w * 0.28, squatY + h * 0.08);
  ctx.moveTo(w * 0.22, squatY - h * 0.08);
  ctx.lineTo(w * 0.28, squatY + h * 0.08);
  ctx.stroke();

  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, squatY);

  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Meja & Kursi! 🪑", 0, squatY - h * 0.5);

  ctx.restore();
}

/**
 * FEEDBACK CORRECT: Jumping for joy, arms high V, glowing stars & confetti
 */
function renderCorrectCelebration(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  cy: number
) {
  const jump = Math.abs(Math.sin(elapsed * 8)) * 18;

  ctx.save();
  const jumpCy = cy - jump;

  // Legs kicking happily
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.2, jumpCy + h * 0.24, w * 0.12, h * 0.16, 4);
  ctx.roundRect(w * 0.08, jumpCy + h * 0.24, w * 0.12, h * 0.16, 4);
  ctx.fill();

  // Torso
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.beginPath();
  ctx.roundRect(-w * 0.22, jumpCy - h * 0.12, w * 0.44, h * 0.26, 6);
  ctx.fill();

  // Both Arms High In V-Shape
  ctx.strokeStyle = '#f8d7ab';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, jumpCy - h * 0.06);
  ctx.lineTo(-w * 0.38, jumpCy - h * 0.32);
  ctx.moveTo(w * 0.18, jumpCy - h * 0.06);
  ctx.lineTo(w * 0.38, jumpCy - h * 0.32);
  ctx.stroke();

  // Cheerful Head
  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, jumpCy);

  // Sparkles & Confetti around
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + elapsed * 2;
    const dist = w * 0.65;
    const sx = Math.cos(angle) * dist;
    const sy = jumpCy + Math.sin(angle) * dist * 0.6;

    ctx.fillStyle = i % 2 === 0 ? '#ffd166' : '#84e1bc';
    ctx.beginPath();
    ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#b5d48c';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("LERES! (BENAR!) ⭐", 0, jumpCy - h * 0.52);

  ctx.restore();
}

/**
 * FEEDBACK WRONG: Puzzled look, scratching back of head, sweat drop
 */
function renderWrongReaction(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  cy: number
) {
  ctx.save();
  // Standing legs
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.16, cy + h * 0.22, w * 0.12, h * 0.18, 4);
  ctx.roundRect(w * 0.04, cy + h * 0.22, w * 0.12, h * 0.18, 4);
  ctx.fill();

  // Torso
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.beginPath();
  ctx.roundRect(-w * 0.22, cy - h * 0.12, w * 0.44, h * 0.26, 6);
  ctx.fill();

  // Right arm reaching to back of neck scratching
  ctx.strokeStyle = '#f8d7ab';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.18, cy - h * 0.06);
  ctx.lineTo(w * 0.32, cy - h * 0.18);
  ctx.lineTo(w * 0.1, cy - h * 0.32);
  ctx.stroke();

  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, cy);

  // Sweat drop on forehead
  ctx.fillStyle = '#63b3ed';
  ctx.beginPath();
  ctx.ellipse(w * 0.22, cy - h * 0.32, 3, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Coba Lagi Yuk! 🤔", 0, cy - h * 0.52);

  ctx.restore();
}
