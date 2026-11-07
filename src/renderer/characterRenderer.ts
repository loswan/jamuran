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
  actionState?:
    | 'normal'
    | 'holding_hands'
    | 'gagak'
    | 'kethek'
    | 'gagang'
    | 'payung'
    | 'meja_kursi'
    | 'barat'
    | 'correct'
    | 'wrong'
    | 'pancer_clapping'
    | 'pancer_stop'
    | 'pancer_instruct'
    | 'pancer_observe'
    | 'pancer_celebrate';
  actionElapsed?: number;
  colorVariant?: number; // for NPC variations
  isPancer?: boolean;
  highlightRing?: boolean;
}

export const CHARACTER_RENDER_WIDTH = 78;
export const CHARACTER_RENDER_HEIGHT = 96;

// Color palettes based on character and variant
export const BOY_PALETTES = [
  { shirt: '#2b6cb0', shirtPattern: '#1a4971', blangkon: '#4a2810', sarong: '#744210' },
  { shirt: '#c53030', shirtPattern: '#7b1c1c', blangkon: '#38200d', sarong: '#652b19' },
  { shirt: '#285e61', shirtPattern: '#1d4044', blangkon: '#442b15', sarong: '#593817' },
  { shirt: '#6b46c1', shirtPattern: '#44337a', blangkon: '#322312', sarong: '#553c25' }
];

export const GIRL_PALETTES = [
  { kebaya: '#dd6b20', kebayaTrim: '#9c4221', hairRibbon: '#e53e3e', jarik: '#744210' },
  { kebaya: '#d53f8c', kebayaTrim: '#97266d', hairRibbon: '#3182ce', jarik: '#5d3714' },
  { kebaya: '#38a169', kebayaTrim: '#22543d', hairRibbon: '#d69e2e', jarik: '#683d18' },
  { kebaya: '#805ad5', kebayaTrim: '#553c9a', hairRibbon: '#dd6b20', jarik: '#5a3415' }
];

export function getBoyTheme(colorVariant: number = 0) {
  return BOY_PALETTES[Math.abs(colorVariant) % BOY_PALETTES.length];
}

export function getGirlTheme(colorVariant: number = 0) {
  return GIRL_PALETTES[Math.abs(colorVariant) % GIRL_PALETTES.length];
}

export function getAttireTheme(character: CharacterType, colorVariant: number = 0) {
  if (character === 'boy') {
    const t = getBoyTheme(colorVariant);
    return { shirt: t.shirt, shirtPattern: t.shirtPattern };
  } else {
    const t = getGirlTheme(colorVariant);
    return { shirt: t.kebaya, shirtPattern: t.kebayaTrim };
  }
}

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

  const boyTheme = getBoyTheme(colorVariant);
  const girlTheme = getGirlTheme(colorVariant);

  // Animation cycle values
  const stepCycle = Math.sin(walkFrame * (Math.PI / 3));
  const isWalkingAction = actionState === 'normal' || actionState === 'holding_hands';
  const legSwing = isWalkingAction ? stepCycle * 14 : 0;
  const armSwing = actionState === 'normal' ? -stepCycle * 18 : 0;
  const bobbing = isWalkingAction ? Math.abs(Math.sin(walkFrame * (Math.PI / 3))) * 3.5 : 0;

  // Center vertical offset
  const cy = -height * 0.05 - bobbing;

  // Render by action state
  if (actionState === 'pancer_clapping') {
    renderPancerClapping(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'pancer_stop') {
    renderPancerStop(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'pancer_instruct') {
    renderPancerInstruct(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'pancer_observe') {
    renderPancerObserve(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'pancer_celebrate') {
    renderPancerCelebrate(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'gagak') {
    renderGagakPose(ctx, character, boyTheme, girlTheme, actionElapsed, width, height, cy);
  } else if (actionState === 'kethek') {
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
    // Normal walk / stand pose / holding hands
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
      isPancer,
      actionState
    );
  }

  // Pancer crown/badge (aligned with head bobbing/swaying)
  if (isPancer) {
    ctx.save();
    let crownCy = cy;
    if (actionState === 'pancer_celebrate') {
      crownCy = cy - Math.abs(Math.sin(actionElapsed * 6.5)) * 4.5;
    } else if (actionState === 'pancer_clapping') {
      crownCy = cy - Math.abs(Math.sin(actionElapsed * (104 / 60) * Math.PI * 2)) * 2.5;
    } else if (actionState === 'pancer_instruct') {
      crownCy = cy + Math.sin(actionElapsed * 5) * 2.5;
    } else if (actionState === 'pancer_observe') {
      const nodCycle = (actionElapsed % 1.8) / 1.8;
      const nod = nodCycle < 0.25 ? Math.sin(nodCycle * 4 * Math.PI) * 2.5 : 0;
      crownCy = cy - Math.sin(actionElapsed * 2.0) * 1.5 + nod;
    }
    ctx.fillStyle = '#ffd166';
    ctx.strokeStyle = '#8d4a0a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, crownCy - height * 0.52);
    ctx.lineTo(-6, crownCy - height * 0.44);
    ctx.lineTo(0, crownCy - height * 0.54);
    ctx.lineTo(6, crownCy - height * 0.44);
    ctx.lineTo(12, crownCy - height * 0.52);
    ctx.lineTo(8, crownCy - height * 0.42);
    ctx.lineTo(-8, crownCy - height * 0.42);
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
  isPancer: boolean,
  actionState: string = 'normal'
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
  if (actionState === 'holding_hands') {
    // When holding hands in Jamuran circle, arms are drawn connected to neighbors via drawHandHoldingRing.
    // Torso rounded corners cleanly cap the shoulder roots without detached floating sockets.
  } else {
    // Standard swinging arms
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
  }

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
 * JAMUR GAGAK: Flapping wings like a crow ("gaok-gaok") with rhythmic flutter
 */
function renderGagakPose(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  cy: number
) {
  // Energetic flapping rhythm (~1.6 flaps per second)
  const flapCycle = Math.sin(elapsed * 10);
  const flapAngleDeg = flapCycle * 35; // -35 to +35 degrees
  const bodyBob = Math.abs(flapCycle) * 3.5; // Up and down bobbing
  const adjustedCy = cy - bodyBob * 0.5;

  ctx.save();

  // LEGS / SANDALS (firm standing stance)
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.18, adjustedCy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.roundRect(w * 0.05, adjustedCy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.fill();

  // SARONG / JARIK
  ctx.fillStyle = character === 'boy' ? boyTheme.sarong : girlTheme.jarik;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, adjustedCy + h * 0.08);
  ctx.lineTo(w * 0.22, adjustedCy + h * 0.08);
  ctx.lineTo(w * 0.2, adjustedCy + h * 0.32);
  ctx.lineTo(-w * 0.2, adjustedCy + h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Batik stripe accents
  ctx.strokeStyle = 'rgba(255, 230, 180, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w * 0.12, adjustedCy + h * 0.12);
  ctx.lineTo(-w * 0.09, adjustedCy + h * 0.3);
  ctx.moveTo(w * 0.12, adjustedCy + h * 0.12);
  ctx.lineTo(w * 0.09, adjustedCy + h * 0.3);
  ctx.stroke();

  // TORSO / SHIRT / KEBAYA
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.strokeStyle = character === 'boy' ? boyTheme.shirtPattern : girlTheme.kebayaTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.24, adjustedCy - h * 0.12, w * 0.48, h * 0.24, 6);
  ctx.fill();
  ctx.stroke();

  // Collar & Button/Brooch
  ctx.strokeStyle = '#fff1c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.08, adjustedCy - h * 0.12);
  ctx.lineTo(0, adjustedCy - h * 0.04);
  ctx.lineTo(w * 0.08, adjustedCy - h * 0.12);
  ctx.stroke();

  // Button
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, adjustedCy - h * 0.02, 3, 0, Math.PI * 2);
  ctx.fill();

  // WING FLAPPING ARMS
  const shoulderY = adjustedCy - h * 0.08;

  // LEFT WING (ARM)
  ctx.save();
  ctx.translate(-w * 0.22, shoulderY);
  // Negative angle raises arm up, positive angle lowers arm down
  const leftFlapRad = (-flapAngleDeg - 15) * (Math.PI / 180);
  ctx.rotate(leftFlapRad);

  // Upper sleeve (Wing base)
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-w * 0.07, 0, w * 0.14, h * 0.22, 6);
  ctx.fill();
  ctx.stroke();

  // Forearm & Wingtip (flapping with secondary bend)
  ctx.save();
  ctx.translate(0, h * 0.18);
  const leftWingtipRad = (-25 + Math.sin(elapsed * 10 - 0.4) * 20) * (Math.PI / 180);
  ctx.rotate(leftWingtipRad);

  // Wing feathers / Hand
  ctx.fillStyle = '#f6d19e';
  ctx.beginPath();
  ctx.ellipse(-w * 0.04, h * 0.06, 7, 10, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // RIGHT WING (ARM)
  ctx.save();
  ctx.translate(w * 0.22, shoulderY);
  const rightFlapRad = (flapAngleDeg + 15) * (Math.PI / 180);
  ctx.rotate(rightFlapRad);

  // Upper sleeve (Wing base)
  ctx.fillStyle = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-w * 0.07, 0, w * 0.14, h * 0.22, 6);
  ctx.fill();
  ctx.stroke();

  // Forearm & Wingtip (flapping with secondary bend)
  ctx.save();
  ctx.translate(0, h * 0.18);
  const rightWingtipRad = (25 - Math.sin(elapsed * 10 - 0.4) * 20) * (Math.PI / 180);
  ctx.rotate(rightWingtipRad);

  // Wing feathers / Hand
  ctx.fillStyle = '#f6d19e';
  ctx.beginPath();
  ctx.ellipse(w * 0.04, h * 0.06, 7, 10, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // HEAD & HAIR / BLANGKON
  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, adjustedCy);

  // Speech / Sound indicator above head
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Gaok-gaok! 🦅", 0, adjustedCy - h * 0.52);

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

/**
 * PANCER ANIMATION 1: RHYTHMIC CLAPPING (MUSIC_PLAYING)
 * Pancer claps enthusiastically in sync with the authentic 104 BPM Jamuran song cadence,
 * swaying body left-to-right with head bobbing and warm cheering smile.
 */
function renderPancerClapping(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  baseCy: number
) {
  // Synchronized to 104 BPM (~1.733 beats per second)
  const beat = elapsed * (104 / 60);
  const cycle = beat * Math.PI * 2;
  const clapCycle = Math.sin(cycle);
  const swayAngle = Math.sin(beat * Math.PI) * 0.045; // ~2.5 deg gentle body rocking
  const bobbing = Math.abs(Math.sin(cycle)) * 2.5;

  const cy = baseCy - bobbing;
  const sleeveColor = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  const sleevePattern = character === 'boy' ? boyTheme.shirtPattern : girlTheme.kebayaTrim;

  ctx.save();
  ctx.rotate(swayAngle);

  // LEGS / SHOES
  ctx.save();
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.18, cy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.roundRect(w * 0.05, cy + h * 0.28, w * 0.13, h * 0.18, 4);
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
  ctx.lineTo(w * 0.2, cy + h * 0.32);
  ctx.lineTo(-w * 0.2, cy + h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Batik stripe accents
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
  ctx.fillStyle = sleeveColor;
  ctx.strokeStyle = sleevePattern;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.24, cy - h * 0.12, w * 0.48, h * 0.24, 6);
  ctx.fill();
  ctx.stroke();

  // Collar & Buttons
  ctx.strokeStyle = '#fff1c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.08, cy - h * 0.12);
  ctx.lineTo(0, cy - h * 0.04);
  ctx.lineTo(w * 0.08, cy - h * 0.12);
  ctx.stroke();

  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, cy - h * 0.02, 3, 0, Math.PI * 2);
  ctx.arc(0, cy + h * 0.04, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // CLAPPING ARMS & HANDS (Solid cartoon limbs)
  const isClappingMoment = clapCycle > 0.1;
  const clapOpenDist = isClappingMoment ? 0 : Math.abs(clapCycle) * (w * 0.10);

  const lShoulderX = -w * 0.22;
  const lShoulderY = cy - h * 0.07;
  const lHandX = -clapOpenDist - 2;
  const lHandY = cy - h * 0.02;

  const rShoulderX = w * 0.22;
  const rShoulderY = cy - h * 0.07;
  const rHandX = clapOpenDist + 2;
  const rHandY = cy - h * 0.02;

  const drawClapArm = (sx: number, sy: number, hx: number, hy: number, isRight: boolean) => {
    const elbowX = sx + (hx - sx) * 0.5 + (isRight ? 7 : -7);
    const elbowY = sy + (hy - sy) * 0.5 + 5;

    // Sleeve
    ctx.save();
    ctx.fillStyle = sleeveColor;
    ctx.strokeStyle = '#3e200c';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(sx + (isRight ? -4 : 4), sy - 6);
    ctx.quadraticCurveTo(sx + (isRight ? 5 : -5), sy - 7, elbowX + (isRight ? 4 : -4), elbowY - 2);
    ctx.lineTo(elbowX + (isRight ? -4 : 4), elbowY + 4);
    ctx.lineTo(sx + (isRight ? -4 : 4), sy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sleeve trim
    ctx.strokeStyle = sleevePattern;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(elbowX + (isRight ? 4 : -4), elbowY - 2);
    ctx.lineTo(elbowX + (isRight ? -4 : 4), elbowY + 4);
    ctx.stroke();
    ctx.restore();

    // Forearm
    ctx.save();
    ctx.fillStyle = '#f6d19e';
    ctx.strokeStyle = '#3e200c';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    // Hand palm
    ctx.beginPath();
    ctx.ellipse(hx, hy, 5.5, 4.5, isRight ? -0.2 : 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  drawClapArm(lShoulderX, lShoulderY, lHandX, lHandY, false);
  drawClapArm(rShoulderX, rShoulderY, rHandX, rHandY, true);

  // Tiny golden sound-wave sparkles when hands hit at the clap peak
  if (clapCycle > 0.75) {
    ctx.save();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, cy - h * 0.02, 10, -Math.PI * 0.65, -Math.PI * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, cy - h * 0.02, 10, Math.PI * 0.35, Math.PI * 0.65);
    ctx.stroke();
    ctx.restore();
  }

  // HEAD
  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, cy);

  ctx.restore();
}

/**
 * PANCER ANIMATION 2: SONG HALT / STOP GESTURE (END OF SONG / EARLY JAMUR_COMMAND)
 * Pancer stops clapping, raises right hand high in authoritative yet warm "Mandheg! / Stop!" signal,
 * left hand on hip, looking out at the circle of players.
 */
function renderPancerStop(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  baseCy: number
) {
  const cy = baseCy;
  const sleeveColor = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  const sleevePattern = character === 'boy' ? boyTheme.shirtPattern : girlTheme.kebayaTrim;

  ctx.save();

  // LEGS / SHOES
  ctx.save();
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.18, cy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.roundRect(w * 0.05, cy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.fill();
  ctx.restore();

  // SARONG
  ctx.save();
  ctx.fillStyle = character === 'boy' ? boyTheme.sarong : girlTheme.jarik;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, cy + h * 0.08);
  ctx.lineTo(w * 0.22, cy + h * 0.08);
  ctx.lineTo(w * 0.2, cy + h * 0.32);
  ctx.lineTo(-w * 0.2, cy + h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // TORSO
  ctx.save();
  ctx.fillStyle = sleeveColor;
  ctx.strokeStyle = sleevePattern;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.24, cy - h * 0.12, w * 0.48, h * 0.24, 6);
  ctx.fill();
  ctx.stroke();

  // Collar & Buttons
  ctx.strokeStyle = '#fff1c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.08, cy - h * 0.12);
  ctx.lineTo(0, cy - h * 0.04);
  ctx.lineTo(w * 0.08, cy - h * 0.12);
  ctx.stroke();

  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, cy - h * 0.02, 3, 0, Math.PI * 2);
  ctx.arc(0, cy + h * 0.04, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // LEFT ARM (Hand on hip / akimbo)
  ctx.save();
  ctx.fillStyle = sleeveColor;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, cy - h * 0.07);
  ctx.lineTo(-w * 0.32, cy + h * 0.02);
  ctx.lineTo(-w * 0.22, cy + h * 0.06);
  ctx.stroke();
  // Hand on waist
  ctx.fillStyle = '#f6d19e';
  ctx.beginPath();
  ctx.arc(-w * 0.21, cy + h * 0.06, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // RIGHT ARM (Raised high in "Mandheg! / Stop!" signal)
  ctx.save();
  const rShoulderX = w * 0.22;
  const rShoulderY = cy - h * 0.08;
  const elbowX = w * 0.32;
  const elbowY = cy - h * 0.22;
  const wristX = w * 0.36;
  const wristY = cy - h * 0.38;

  // Upper sleeve
  ctx.fillStyle = sleeveColor;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(rShoulderX - 4, rShoulderY);
  ctx.lineTo(elbowX - 4, elbowY);
  ctx.lineTo(elbowX + 5, elbowY);
  ctx.lineTo(rShoulderX + 5, rShoulderY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sleeve cuff
  ctx.strokeStyle = sleevePattern;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(elbowX - 4, elbowY);
  ctx.lineTo(elbowX + 5, elbowY);
  ctx.stroke();

  // Forearm
  ctx.fillStyle = '#f6d19e';
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(elbowX - 3, elbowY);
  ctx.lineTo(wristX - 3, wristY);
  ctx.lineTo(wristX + 4, wristY);
  ctx.lineTo(elbowX + 4, elbowY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Open "Stop" Hand (Palm facing out to players)
  ctx.beginPath();
  ctx.ellipse(wristX, wristY - 6, 7, 9, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Finger separation detail lines
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(wristX - 2, wristY - 14);
  ctx.lineTo(wristX - 2, wristY - 7);
  ctx.moveTo(wristX + 1.5, wristY - 14);
  ctx.lineTo(wristX + 1.5, wristY - 7);
  ctx.stroke();
  ctx.restore();

  // HEAD
  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, cy);

  ctx.restore();
}

/**
 * PANCER ANIMATION 3: DELIVERING JAMURAN COMMAND (JAMUR_COMMAND INSTRUCTION)
 * Pancer gestures dynamically with hand pointing toward circle participants ("Jamur Gagak!"),
 * nodding enthusiastically with vocal cadence.
 */
function renderPancerInstruct(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  baseCy: number
) {
  // Energetic head nod with instruction cadence
  const nod = Math.sin(elapsed * 5) * 2.5;
  const cy = baseCy;
  const sleeveColor = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  const sleevePattern = character === 'boy' ? boyTheme.shirtPattern : girlTheme.kebayaTrim;

  ctx.save();

  // LEGS / SHOES
  ctx.save();
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.18, cy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.roundRect(w * 0.05, cy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.fill();
  ctx.restore();

  // SARONG
  ctx.save();
  ctx.fillStyle = character === 'boy' ? boyTheme.sarong : girlTheme.jarik;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, cy + h * 0.08);
  ctx.lineTo(w * 0.22, cy + h * 0.08);
  ctx.lineTo(w * 0.2, cy + h * 0.32);
  ctx.lineTo(-w * 0.2, cy + h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // TORSO
  ctx.save();
  ctx.fillStyle = sleeveColor;
  ctx.strokeStyle = sleevePattern;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.24, cy - h * 0.12, w * 0.48, h * 0.24, 6);
  ctx.fill();
  ctx.stroke();

  // Collar & Buttons
  ctx.strokeStyle = '#fff1c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.08, cy - h * 0.12);
  ctx.lineTo(0, cy - h * 0.04);
  ctx.lineTo(w * 0.08, cy - h * 0.12);
  ctx.stroke();

  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, cy - h * 0.02, 3, 0, Math.PI * 2);
  ctx.arc(0, cy + h * 0.04, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // LEFT ARM (Gesturing outwards)
  ctx.save();
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, cy - h * 0.07);
  ctx.lineTo(-w * 0.34, cy - h * 0.02);
  ctx.stroke();
  ctx.fillStyle = '#f6d19e';
  ctx.beginPath();
  ctx.ellipse(-w * 0.36, cy - h * 0.01, 5, 4.5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // RIGHT ARM (Pointing forward towards players)
  ctx.save();
  const pointPulse = Math.sin(elapsed * 6) * 3;
  const rShoulderX = w * 0.22;
  const rShoulderY = cy - h * 0.08;
  const elbowX = w * 0.30;
  const elbowY = cy - h * 0.08;
  const wristX = w * 0.38 + pointPulse;
  const wristY = cy - h * 0.08;

  // Upper sleeve
  ctx.fillStyle = sleeveColor;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(rShoulderX - 2, rShoulderY - 6, w * 0.12, 12, 4);
  ctx.fill();
  ctx.stroke();

  // Forearm & Pointing Hand
  ctx.fillStyle = '#f6d19e';
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(elbowX + 4, elbowY - 4.5, w * 0.10, 9, 3);
  ctx.fill();
  ctx.stroke();

  // Pointing finger
  ctx.beginPath();
  ctx.moveTo(wristX, wristY - 2);
  ctx.lineTo(wristX + 8, wristY - 2);
  ctx.lineTo(wristX + 8, wristY + 2);
  ctx.lineTo(wristX, wristY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // HEAD (Affirmative nod during command call)
  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, cy + nod);

  ctx.restore();
}

/**
 * PANCER ANIMATION 4: OBSERVING PLAYERS (JAMUR_ACTION)
 * Pancer observes the players performing with hands firmly on hips (akimbo stance),
 * scanning slowly side-to-side with periodic approving nods and encouraging smile.
 */
function renderPancerObserve(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  baseCy: number
) {
  // Gentle breathing motion
  const breath = Math.sin(elapsed * 2.0) * 1.5;
  const cy = baseCy - breath;
  const scanAngle = Math.sin(elapsed * 1.2) * 0.06; // scanning circle of players
  // Approving nod every 1.8s
  const nodCycle = (elapsed % 1.8) / 1.8;
  const nod = nodCycle < 0.25 ? Math.sin(nodCycle * 4 * Math.PI) * 2.5 : 0;

  const sleeveColor = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  const sleevePattern = character === 'boy' ? boyTheme.shirtPattern : girlTheme.kebayaTrim;

  ctx.save();

  // LEGS / SHOES
  ctx.save();
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.18, cy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.roundRect(w * 0.05, cy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.fill();
  ctx.restore();

  // SARONG
  ctx.save();
  ctx.fillStyle = character === 'boy' ? boyTheme.sarong : girlTheme.jarik;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, cy + h * 0.08);
  ctx.lineTo(w * 0.22, cy + h * 0.08);
  ctx.lineTo(w * 0.2, cy + h * 0.32);
  ctx.lineTo(-w * 0.2, cy + h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // TORSO
  ctx.save();
  ctx.fillStyle = sleeveColor;
  ctx.strokeStyle = sleevePattern;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.24, cy - h * 0.12, w * 0.48, h * 0.24, 6);
  ctx.fill();
  ctx.stroke();

  // Collar & Buttons
  ctx.strokeStyle = '#fff1c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.08, cy - h * 0.12);
  ctx.lineTo(0, cy - h * 0.04);
  ctx.lineTo(w * 0.08, cy - h * 0.12);
  ctx.stroke();

  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, cy - h * 0.02, 3, 0, Math.PI * 2);
  ctx.arc(0, cy + h * 0.04, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // BOTH ARMS ON HIPS (Leader Akimbo Pose)
  // Left arm on hip
  ctx.save();
  ctx.fillStyle = sleeveColor;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, cy - h * 0.07);
  ctx.lineTo(-w * 0.32, cy + h * 0.01);
  ctx.lineTo(-w * 0.22, cy + h * 0.05);
  ctx.stroke();
  ctx.fillStyle = '#f6d19e';
  ctx.beginPath();
  ctx.arc(-w * 0.21, cy + h * 0.05, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Right arm on hip
  ctx.fillStyle = sleeveColor;
  ctx.beginPath();
  ctx.moveTo(w * 0.22, cy - h * 0.07);
  ctx.lineTo(w * 0.32, cy + h * 0.01);
  ctx.lineTo(w * 0.22, cy + h * 0.05);
  ctx.stroke();
  ctx.fillStyle = '#f6d19e';
  ctx.beginPath();
  ctx.arc(w * 0.21, cy + h * 0.05, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // HEAD (Scanning left and right, with approving nod)
  ctx.save();
  ctx.translate(0, cy - h * 0.26 + nod);
  ctx.rotate(scanAngle);
  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, h * 0.26);
  ctx.restore();

  ctx.restore();
}

/**
 * PANCER ANIMATION 5: JOYOUS CELEBRATION (FEEDBACK_CORRECT)
 * Pancer celebrates the correct answer with cheerful hops, rapid applause, and golden sparkles!
 */
function renderPancerCelebrate(
  ctx: CanvasRenderingContext2D,
  character: CharacterType,
  boyTheme: any,
  girlTheme: any,
  elapsed: number,
  w: number,
  h: number,
  baseCy: number
) {
  // Joyous hop and fast energetic clapping
  const hop = Math.abs(Math.sin(elapsed * 6.5)) * 4.5;
  const cy = baseCy - hop;
  const clapCycle = Math.sin(elapsed * 13);
  const clapDist = clapCycle > 0.1 ? 0 : Math.abs(clapCycle) * (w * 0.10);

  const sleeveColor = character === 'boy' ? boyTheme.shirt : girlTheme.kebaya;
  const sleevePattern = character === 'boy' ? boyTheme.shirtPattern : girlTheme.kebayaTrim;

  ctx.save();

  // LEGS / SHOES
  ctx.save();
  ctx.fillStyle = '#2d1b10';
  ctx.beginPath();
  ctx.roundRect(-w * 0.18, cy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.roundRect(w * 0.05, cy + h * 0.28, w * 0.13, h * 0.18, 4);
  ctx.fill();
  ctx.restore();

  // SARONG
  ctx.save();
  ctx.fillStyle = character === 'boy' ? boyTheme.sarong : girlTheme.jarik;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, cy + h * 0.08);
  ctx.lineTo(w * 0.22, cy + h * 0.08);
  ctx.lineTo(w * 0.2, cy + h * 0.32);
  ctx.lineTo(-w * 0.2, cy + h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // TORSO
  ctx.save();
  ctx.fillStyle = sleeveColor;
  ctx.strokeStyle = sleevePattern;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.24, cy - h * 0.12, w * 0.48, h * 0.24, 6);
  ctx.fill();
  ctx.stroke();

  // Collar & Buttons
  ctx.strokeStyle = '#fff1c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.08, cy - h * 0.12);
  ctx.lineTo(0, cy - h * 0.04);
  ctx.lineTo(w * 0.08, cy - h * 0.12);
  ctx.stroke();

  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, cy - h * 0.02, 3, 0, Math.PI * 2);
  ctx.arc(0, cy + h * 0.04, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // FAST JOYOUS CLAPPING HANDS
  const lShoulderX = -w * 0.22;
  const lShoulderY = cy - h * 0.07;
  const lHandX = -clapDist - 2;
  const lHandY = cy - h * 0.02;

  const rShoulderX = w * 0.22;
  const rShoulderY = cy - h * 0.07;
  const rHandX = clapDist + 2;
  const rHandY = cy - h * 0.02;

  // Left arm
  ctx.save();
  ctx.fillStyle = sleeveColor;
  ctx.strokeStyle = '#3e200c';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(lShoulderX, lShoulderY);
  ctx.lineTo(lHandX, lHandY);
  ctx.stroke();
  ctx.fillStyle = '#f6d19e';
  ctx.beginPath();
  ctx.arc(lHandX, lHandY, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Right arm
  ctx.beginPath();
  ctx.moveTo(rShoulderX, rShoulderY);
  ctx.lineTo(rHandX, rHandY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rHandX, rHandY, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Golden celebration stars around Pancer
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + elapsed * 3;
    const dist = w * 0.55;
    const sx = Math.cos(angle) * dist;
    const sy = cy - h * 0.2 + Math.sin(angle) * dist * 0.5;

    ctx.fillStyle = i % 2 === 0 ? '#ffd166' : '#84e1bc';
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // HEAD
  renderHead(ctx, character, boyTheme, girlTheme, 0, w, h, cy);

  ctx.restore();
}

/**
 * Circle Participant structure for hand-holding ring rendering
 */
export interface HandHoldingParticipant {
  x: number;
  y: number;
  character: CharacterType;
  colorVariant: number;
}

/**
 * Draws continuous, authentic hand-holding connections between adjacent participants in the Jamuran circle.
 * Connects Participant 0 -> 1 -> 2 -> ... -> N-1 -> 0 in a closed, unified ring.
 * Draws custom matching sleeves, skin-toned forearms, and clasped interlocking hands.
 */
export function drawHandHoldingRing(
  ctx: CanvasRenderingContext2D,
  participants: HandHoldingParticipant[],
  charW: number,
  charH: number,
  walkFrame: number = 0
) {
  if (participants.length < 2) return;

  const count = participants.length;

  // Compute ring center from participant centroid
  const centerX = participants.reduce((acc, p) => acc + p.x, 0) / count;
  const centerY = participants.reduce((acc, p) => acc + p.y, 0) / count;

  // Natural cadence sway matching the 104 BPM Jamuran music rhythm
  const sway = Math.sin((walkFrame || 0) * (Math.PI / 3)) * 2.2;

  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    const pI = participants[i];
    const pJ = participants[j];

    const dx = pJ.x - pI.x;
    const dy = pJ.y - pI.y;
    const chordDist = Math.hypot(dx, dy);
    if (chordDist < 10) continue;

    // Unit vector along chord from i to j
    const ux = dx / chordDist;
    const uy = dy / chordDist;

    // Midpoint between participants
    const midX = (pI.x + pJ.x) * 0.5;
    const midY = (pI.y + pJ.y) * 0.5;

    // Vector pointing outward from circle center to chord midpoint
    const outX = midX - centerX;
    const outY = midY - centerY;
    const outLen = Math.hypot(outX, outY) || 1;

    // Outward unit normal
    let nx = -uy;
    let ny = ux;
    if (nx * (outX / outLen) + ny * (outY / outLen) < 0) {
      nx = -nx;
      ny = -ny;
    }

    const themeI = getAttireTheme(pI.character, pI.colorVariant);
    const themeJ = getAttireTheme(pJ.character, pJ.colorVariant);

    // Anatomical shoulder positions on torso boundaries:
    const shoulderBaseY = -charH * 0.08;
    const shoulderSpread = charW * 0.20;

    const sI_x = pI.x + ux * shoulderSpread;
    const sI_y = pI.y + shoulderBaseY + uy * (charW * 0.04);

    const sJ_x = pJ.x - ux * shoulderSpread;
    const sJ_y = pJ.y + shoulderBaseY - uy * (charW * 0.04);

    // Hand meeting point (clasp point)
    // Sits in the middle, slightly arched outward along circle contour with cadence bob
    const claspX = midX + nx * (charW * 0.06);
    const claspY = midY + shoulderBaseY + ny * (charW * 0.06) + sway;

    // Thick cartoon dimensions proportional to character scale
    const shoulderThickness = Math.max(12, charW * 0.22); // Thick rounded cartoon sleeve (~14-16px)
    const elbowThickness = Math.max(10, charW * 0.17);    // Chunky sleeve cuff (~11-13px)
    const forearmThickness = Math.max(8.5, charW * 0.15); // Solid chubby forearm (~10px)
    const wristThickness = Math.max(7, charW * 0.11);     // Wrist width (~8px)

    // Helper to draw a single character's solid cartoon arm (sleeve + forearm)
    const drawArm = (
      startX: number,
      startY: number,
      theme: { shirt: string; shirtPattern: string }
    ) => {
      const armDx = claspX - startX;
      const armDy = claspY - startY;
      const armLen = Math.hypot(armDx, armDy);
      if (armLen < 4) return;

      const aUx = armDx / armLen;
      const aUy = armDy / armLen;
      let aPx = -aUy;
      let aPy = aUx;
      if (aPx * nx + aPy * ny < 0) {
        aPx = -aPx;
        aPy = -aPy;
      }

      // Proportional segments along the arm reach:
      // Sleeve: 0% to 50%
      // Forearm: 50% to 85%
      // Clasp: 85% to 100% (interlocking hand mass at clasp)
      const elbowX = startX + armDx * 0.50;
      const elbowY = startY + armDy * 0.50;
      const wristX = startX + armDx * 0.85;
      const wristY = startY + armDy * 0.85;

      // --- 1. Solid Puffy Cartoon Sleeve ---
      ctx.save();
      ctx.fillStyle = theme.shirt;
      ctx.strokeStyle = '#3e200c';
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(startX - aPx * (shoulderThickness * 0.5), startY - aPy * (shoulderThickness * 0.5));
      // Rounded puff cap at shoulder
      ctx.quadraticCurveTo(
        startX - aUx * 5,
        startY - aUy * 5,
        startX + aPx * (shoulderThickness * 0.5),
        startY + aPy * (shoulderThickness * 0.5)
      );
      // Sleeve side towards elbow
      ctx.lineTo(elbowX + aPx * (elbowThickness * 0.5), elbowY + aPy * (elbowThickness * 0.5));
      // Elbow cuff edge
      ctx.lineTo(elbowX - aPx * (elbowThickness * 0.5), elbowY - aPy * (elbowThickness * 0.5));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sleeve cuff accent trim band
      ctx.strokeStyle = theme.shirtPattern;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(elbowX - aPx * (elbowThickness * 0.48), elbowY - aPy * (elbowThickness * 0.48));
      ctx.lineTo(elbowX + aPx * (elbowThickness * 0.48), elbowY + aPy * (elbowThickness * 0.48));
      ctx.stroke();
      ctx.restore();

      // --- 2. Solid Chubby Skin Forearm ---
      ctx.save();
      ctx.fillStyle = '#f6d19e';
      ctx.strokeStyle = '#3e200c';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(elbowX - aPx * (forearmThickness * 0.48), elbowY - aPy * (forearmThickness * 0.48));
      ctx.lineTo(wristX - aPx * (wristThickness * 0.48), wristY - aPy * (wristThickness * 0.48));
      ctx.lineTo(wristX + aPx * (wristThickness * 0.48), wristY + aPy * (wristThickness * 0.48));
      ctx.lineTo(elbowX + aPx * (forearmThickness * 0.48), elbowY + aPy * (forearmThickness * 0.48));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    // Draw Participant i's arm (reaching clockwise to clasp)
    drawArm(sI_x, sI_y, themeI);

    // Draw Participant j's arm (reaching counter-clockwise to clasp)
    drawArm(sJ_x, sJ_y, themeJ);

    // --- 3. Unified, Solid Interlocking Hand Clasp ---
    // Both wrists connect into this unified hand mass with interlocking fingers and thumb
    ctx.save();
    ctx.translate(claspX, claspY);
    ctx.rotate(Math.atan2(uy, ux));

    // Solid clasped hands body
    ctx.fillStyle = '#f6d19e';
    ctx.strokeStyle = '#3e200c';
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    // Left wrist attachment
    ctx.moveTo(-7, -4.5);
    // Hand i thumb contour (resting over top)
    ctx.quadraticCurveTo(-2, -7.5, 2, -5.5);
    // Right wrist upper attachment
    ctx.lineTo(7, -4.5);
    // Right hand outer palm & knuckle curve
    ctx.quadraticCurveTo(9.5, 0, 7, 4.5);
    // Interlocking curled fingers wrapped underneath
    ctx.quadraticCurveTo(2, 7.5, -2, 6.5);
    // Left hand outer knuckle curve
    ctx.quadraticCurveTo(-9.5, 0, -7, -4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Finger curl & knuckle detail lines (chibi cartoon style)
    ctx.strokeStyle = '#3e200c';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    // Hand i fingers wrapping around Hand j
    ctx.moveTo(-1, -4.5);
    ctx.quadraticCurveTo(1.5, -1, -0.5, 3.5);
    // Hand j fingers clasped underneath
    ctx.moveTo(1.8, -3.5);
    ctx.quadraticCurveTo(3.8, 0, 2.2, 4);
    // Thumb groove
    ctx.moveTo(-3.5, -2.5);
    ctx.quadraticCurveTo(-1.5, -4.2, 0.5, -3.8);
    ctx.stroke();

    // Subtle warm palm shadow between hands
    ctx.strokeStyle = 'rgba(160, 80, 20, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(0.5, 3);
    ctx.stroke();

    ctx.restore();
  }
}

