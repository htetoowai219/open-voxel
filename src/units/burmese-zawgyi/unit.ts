import type { ClipParamSchema, VoxelUnitDefinition } from '../../types/voxel';
import { extrudePattern, part, translateVoxels } from '../../engine/voxelBuilder';
import {
  TAU,
  clamp,
  deg,
  easeInOut,
  easeOut,
  lerp,
  param,
  voxelShatterDeath,
} from '../../engine/animationPresets';
import {
  spawnElectricArcsVoxels,
  spawnShockwaveRingVoxels,
  spawnSlashArcVoxels,
} from '../../engine/voxelVfx';

const palette = {
  porcelain: '#f2eee3',
  porcelainShadow: '#c9c3b6',
  ink: '#1c1917',
  eyeWhite: '#f8fafc',
  smile: '#b51f32',
  crimson: '#a81f35',
  crimsonDark: '#6f1022',
  crimsonLight: '#c62b45',
  gold: '#d6a43c',
  goldLight: '#f5d36b',
  goldDark: '#8b641f',
  silver: '#cbd5e1',
  silverDark: '#8e9aab',
  peach: '#e8b08a',
  peachDark: '#c88a63',
  ruby: '#c2183d',
};

const params = (
  label: string,
  value: number,
  min: number,
  max: number,
  step = 0.1,
): ClipParamSchema => ({ label, value, min, max, step });

type ClipDefinition = VoxelUnitDefinition['animations'][number];

const collarPattern = [
  '..GGGGG..',
  '.GG...GG.',
  'GG.....GG',
  'G...R...G',
  'G..RRR..G',
  'G...R...G',
  'GG.....GG',
  '.GG...GG.',
  '..GGGGG..',
];

const zawgyiParts = [
  part('torso', 'Crimson Tunic Torso', [0, 18, 0])
    .fillBox(-5, 17, -3, 5, 30, 4, palette.crimson)
    .fillBox(-7, 27, -3, 7, 30, 3, palette.crimson)
    .fillBox(-5, 16, -3, 5, 18, 4, palette.crimsonDark)
    .fillBox(-4, 20, 5, 4, 27, 5, palette.crimsonLight)
    .fillBox(-5, 22, -4, 5, 29, -4, palette.crimsonDark)
    .fillBox(-2, 28, -2, 2, 31, 2, palette.crimsonDark)
    .fillBox(-6, 18, -4, 6, 20, 5, palette.gold)
    .fillBox(-2, 18, 6, 2, 20, 6, palette.goldLight)
    .setVoxel(0, 19, 7, palette.ruby)
    .setVoxel(-2, 17, 6, palette.gold)
    .setVoxel(2, 17, 6, palette.gold)
    .setVoxel(-3, 14, 6, palette.goldLight)
    .setVoxel(3, 15, 6, palette.goldLight)
    .add(
      ...translateVoxels(
        extrudePattern(collarPattern, { G: palette.gold, R: palette.ruby }, 2),
        0,
        23,
        4,
      ),
    )
    .setVoxel(-4, 29, 6, palette.gold)
    .setVoxel(-3, 28, 6, palette.gold)
    .setVoxel(-2, 27, 6, palette.gold)
    .setVoxel(-1, 26, 6, palette.gold)
    .setVoxel(0, 25, 6, palette.gold)
    .setVoxel(1, 24, 6, palette.gold)
    .setVoxel(2, 23, 6, palette.gold)
    .setVoxel(3, 22, 6, palette.gold)
    .setVoxel(4, 21, 6, palette.gold)
    .setVoxel(-3, 29, 6, palette.goldDark)
    .setVoxel(4, 22, 6, palette.goldDark)
    .setVoxel(0, 21, 5, palette.gold)
    .setVoxel(0, 23, 5, palette.gold)
    .end(),
  part('head', 'Porcelain Yoke The Mask', [0, 30, 0], 'torso')
    .fillBox(-4, 32, -3, 4, 38, 4, palette.porcelain)
    .fillBox(-5, 32, -2, 5, 35, 3, palette.porcelain)
    .fillBox(-4, 38, -2, 4, 38, 3, palette.porcelainShadow)
    .fillBox(-5, 32, -2, -5, 35, 2, palette.porcelainShadow)
    .fillBox(5, 32, -2, 5, 35, 2, palette.porcelainShadow)
    .setVoxel(-4, 37, 5, palette.ink)
    .setVoxel(-3, 37, 5, palette.ink)
    .setVoxel(-2, 36, 5, palette.ink)
    .setVoxel(-1, 36, 5, palette.ink)
    .setVoxel(1, 36, 5, palette.ink)
    .setVoxel(2, 36, 5, palette.ink)
    .setVoxel(3, 37, 5, palette.ink)
    .setVoxel(4, 37, 5, palette.ink)
    .fillBox(-3, 34, 5, -1, 35, 5, palette.eyeWhite)
    .fillBox(1, 34, 5, 3, 35, 5, palette.eyeWhite)
    .setVoxel(-3, 34, 6, palette.ink)
    .setVoxel(-2, 35, 6, palette.ink)
    .setVoxel(2, 34, 6, palette.ink)
    .setVoxel(3, 35, 6, palette.ink)
    .setVoxel(-3, 35, 6, palette.eyeWhite)
    .setVoxel(3, 34, 6, palette.eyeWhite)
    .setVoxel(0, 33, 5, palette.porcelainShadow)
    .setVoxel(0, 34, 5, palette.porcelainShadow)
    .setVoxel(-4, 33, 5, palette.smile)
    .setVoxel(4, 33, 5, palette.smile)
    .setVoxel(-4, 36, 6, palette.ink)
    .setVoxel(4, 36, 6, palette.ink)
    .end(),
  part('jaw', 'Puppet Jaw & Smile', [0, 31, 2], 'head')
    .fillBox(-3, 29, -1, 3, 31, 4, palette.porcelain)
    .fillBox(-4, 30, 3, 4, 31, 4, palette.porcelain)
    .setVoxel(-2, 30, 5, palette.smile)
    .setVoxel(-1, 30, 5, palette.smile)
    .setVoxel(0, 30, 5, palette.smile)
    .setVoxel(1, 30, 5, palette.smile)
    .setVoxel(2, 30, 5, palette.smile)
    .setVoxel(-3, 31, 5, palette.smile)
    .setVoxel(3, 31, 5, palette.smile)
    .setVoxel(-3, 29, 4, palette.porcelainShadow)
    .setVoxel(3, 29, 4, palette.porcelainShadow)
    .setVoxel(-2, 29, 5, palette.porcelainShadow)
    .setVoxel(2, 29, 5, palette.porcelainShadow)
    .end(),
  part('hat', 'Crimson Cap & Golden Headband', [0, 39, 0], 'head')
    .fillBox(-5, 39, -4, 5, 41, 4, palette.gold)
    .fillBox(-4, 40, 5, 4, 41, 5, palette.goldLight)
    .fillBox(-5, 41, -3, 5, 42, 3, palette.crimson)
    .fillBox(-4, 42, -3, 4, 43, 3, palette.crimson)
    .fillBox(-3, 43, -2, 3, 44, 2, palette.crimson)
    .fillBox(-2, 44, -1, 2, 45, 1, palette.crimsonLight)
    .setVoxel(0, 45, 0, palette.gold)
    .setVoxel(-1, 44, 2, palette.goldLight)
    .setVoxel(1, 44, 2, palette.goldLight)
    .fillBox(-7, 35, -1, -6, 40, 3, palette.crimson)
    .fillBox(6, 35, -1, 7, 40, 3, palette.crimson)
    .fillBox(-8, 35, -1, -7, 36, 3, palette.gold)
    .fillBox(7, 35, -1, 8, 36, 3, palette.gold)
    .setVoxel(0, 40, 6, palette.ruby)
    .setVoxel(-4, 40, 6, palette.ruby)
    .setVoxel(4, 40, 6, palette.ruby)
    .setVoxel(-6, 38, 4, palette.goldLight)
    .setVoxel(6, 38, 4, palette.goldLight)
    .end(),
  part('left_arm', 'Left Sleeve & Staff Hand', [6, 28, 0], 'torso')
    .fillBox(7, 24, -3, 10, 30, 3, palette.crimson)
    .fillBox(8, 20, -2, 10, 25, 2, palette.crimson)
    .fillBox(7, 18, -2, 10, 20, 2, palette.gold)
    .fillBox(7, 15, -1, 9, 18, 2, palette.peach)
    .setVoxel(8, 14, 1, palette.peachDark)
    .setVoxel(8, 17, 2, palette.peachDark)
    .setVoxel(9, 17, 2, palette.peachDark)
    .fillBox(8, 28, -3, 11, 30, 3, palette.silver)
    .fillBox(9, 30, -2, 11, 31, 2, palette.silver)
    .fillBox(10, 31, -1, 11, 32, 1, palette.silverDark)
    .setVoxel(10, 32, 0, palette.gold)
    .setVoxel(7, 30, 2, palette.goldDark)
    .end(),
  part('right_arm', 'Right Sleeve & Silver Pauldron', [-6, 28, 0], 'torso')
    .fillBox(-10, 24, -3, -7, 30, 3, palette.crimson)
    .fillBox(-10, 20, -2, -8, 25, 2, palette.crimson)
    .fillBox(-10, 18, -2, -7, 20, 2, palette.gold)
    .fillBox(-9, 15, -1, -7, 18, 2, palette.peach)
    .setVoxel(-8, 14, 1, palette.peachDark)
    .setVoxel(-8, 17, 2, palette.peachDark)
    .setVoxel(-9, 17, 2, palette.peachDark)
    .fillBox(-11, 28, -3, -8, 30, 3, palette.silver)
    .fillBox(-11, 30, -2, -9, 31, 2, palette.silver)
    .fillBox(-11, 31, -1, -10, 32, 1, palette.silverDark)
    .setVoxel(-10, 32, 0, palette.gold)
    .setVoxel(-7, 30, 2, palette.goldDark)
    .end(),
  part('left_leg', 'Left Trouser & Curled Shoe', [3, 17, 0], 'torso')
    .fillBox(1, 9, -2, 5, 17, 2, palette.crimson)
    .fillBox(1, 8, -2, 5, 10, 2, palette.gold)
    .fillBox(1, 4, -2, 4, 8, 2, palette.porcelain)
    .fillBox(1, 3, -2, 5, 4, 3, palette.gold)
    .fillBox(1, 0, -2, 5, 3, 4, palette.crimson)
    .setVoxel(2, 1, 5, palette.crimson)
    .setVoxel(3, 2, 6, palette.crimson)
    .setVoxel(4, 3, 7, palette.gold)
    .setVoxel(1, 1, 5, palette.crimsonDark)
    .end(),
  part('right_leg', 'Right Trouser & Curled Shoe', [-3, 17, 0], 'torso')
    .fillBox(-5, 9, -2, -1, 17, 2, palette.crimson)
    .fillBox(-5, 8, -2, -1, 10, 2, palette.gold)
    .fillBox(-4, 4, -2, -1, 8, 2, palette.porcelain)
    .fillBox(-5, 3, -2, -1, 4, 3, palette.gold)
    .fillBox(-5, 0, -2, -1, 3, 4, palette.crimson)
    .setVoxel(-2, 1, 5, palette.crimson)
    .setVoxel(-3, 2, 6, palette.crimson)
    .setVoxel(-4, 3, 7, palette.gold)
    .setVoxel(-1, 1, 5, palette.crimsonDark)
    .end(),
  part('peplum', 'Flared Hip Peplum', [0, 18, 0], 'torso')
    .fillBox(-6, 13, 6, 6, 18, 6, palette.crimson)
    .fillBox(-7, 13, -5, 7, 18, -5, palette.crimsonDark)
    .fillBox(-8, 13, -5, -7, 18, 6, palette.crimsonDark)
    .fillBox(7, 13, -5, 8, 18, 6, palette.crimsonDark)
    .fillBox(-6, 12, 6, 6, 13, 6, palette.gold)
    .fillBox(-7, 12, -5, 7, 13, -5, palette.gold)
    .fillBox(-8, 12, -5, -8, 18, 6, palette.gold)
    .fillBox(8, 12, -5, 8, 18, 6, palette.gold)
    .setVoxel(-6, 16, 7, palette.gold)
    .setVoxel(6, 16, 7, palette.gold)
    .setVoxel(-6, 13, 7, palette.goldLight)
    .setVoxel(6, 13, 7, palette.goldLight)
    .setVoxel(0, 12, 7, palette.ruby)
    .setVoxel(-2, 12, 7, palette.goldLight)
    .setVoxel(2, 12, 7, palette.goldLight)
    .end(),
  part('staff', 'Taung Hway Magic Staff', [8, 16, 1], 'left_arm')
    .fillBox(7, 4, 0, 8, 38, 1, palette.crimson)
    .fillBox(7, 10, 0, 8, 12, 1, palette.goldDark)
    .fillBox(7, 22, 0, 8, 24, 1, palette.gold)
    .fillBox(7, 15, 0, 8, 17, 1, palette.crimsonDark)
    .fillBox(6, 38, -1, 9, 41, 2, palette.gold)
    .fillBox(7, 41, 0, 8, 42, 1, palette.goldLight)
    .fillBox(6, 1, -1, 9, 4, 2, palette.gold)
    .setVoxel(7, 0, 0, palette.goldLight)
    .setVoxel(8, 0, 1, palette.goldLight)
    .setVoxel(7, 37, 0, palette.goldLight)
    .setVoxel(8, 37, 1, palette.goldLight)
    .setVoxel(7, 39, -1, palette.ruby)
    .setVoxel(8, 39, 2, palette.ruby)
    .end(),
];

const idle: ClipDefinition = {
  id: 'idle',
  name: 'Zawgyi Floating Dance',
  frames: 60,
  fps: 20,
  loop: true,
  params: {
    floatSpeed: params('Float Speed', 1, 0.2, 3, 0.05),
    floatAmount: params('Float Height', 0.22, 0, 1, 0.01),
    swayDeg: params('Body Sway', 2.4, 0, 10, 0.1),
    headTiltDeg: params('Playful Head Tilt', 5, 0, 18, 0.1),
    staffTwirlDeg: params('Staff Twirl', 9, 0, 35, 0.5),
  },
  evaluate: (frame, totalFrames, values) => {
    const t = frame / Math.max(1, totalFrames);
    const speed = param(values, 'floatSpeed', 1);
    const floatAmount = param(values, 'floatAmount', 0.22);
    const sway = param(values, 'swayDeg', 2.4);
    const tilt = param(values, 'headTiltDeg', 5);
    const twirl = param(values, 'staffTwirlDeg', 9);
    const phase = t * TAU * speed;
    const breathe = Math.sin(phase);
    const float = Math.sin(phase * 0.5 + 0.4);

    return {
      parts: {
        torso: {
          ty: float * floatAmount,
          rx: deg(1.4 + breathe * 0.6),
          ry: deg(Math.sin(phase * 0.55) * 1.8),
          rz: deg(Math.sin(phase * 0.8) * sway * 0.4),
        },
        head: {
          rx: deg(-breathe * 1.2),
          ry: deg(Math.sin(phase * 0.45) * tilt * 0.7),
          rz: deg(Math.sin(phase * 0.7 + 0.3) * tilt),
        },
        jaw: { rx: deg(1.2 + breathe * 1.2) },
        hat: {
          rz: deg(Math.sin(phase * 0.7 + 0.3) * tilt * 0.3),
          ry: deg(Math.sin(phase * 0.4) * 2),
        },
        left_arm: {
          rx: deg(Math.sin(phase + 0.5) * sway * 0.9),
          rz: deg(Math.sin(phase * 0.9) * 2.2),
        },
        right_arm: {
          rx: deg(Math.sin(phase + 0.9) * sway),
          rz: deg(-Math.sin(phase * 0.9) * 1.8),
        },
        staff: {
          rz: deg(Math.sin(phase * 1.5 + 0.5) * twirl),
          rx: deg(Math.cos(phase * 0.8) * twirl * 0.35),
        },
        left_leg: { rz: deg(Math.sin(phase * 0.8) * 0.8) },
        right_leg: { rz: deg(-Math.sin(phase * 0.8) * 0.8) },
        peplum: {
          rz: deg(Math.sin(phase * 0.75) * 1.5),
          rx: deg(Math.cos(phase * 0.6) * 0.7),
        },
      },
    };
  },
};

const walk: ClipDefinition = {
  id: 'walk',
  name: 'Agile Martial Stride',
  frames: 32,
  fps: 24,
  loop: true,
  params: {
    strideDeg: params('Stride', 28, 10, 50, 0.5),
    bounce: params('Bounce', 0.45, 0, 1, 0.01),
    armSwingDeg: params('Arm Swing', 18, 0, 40, 0.5),
    staffCounterDeg: params('Staff Counter-Swing', 11, 0, 30, 0.5),
  },
  evaluate: (frame, totalFrames, values) => {
    const t = frame / Math.max(1, totalFrames);
    const stride = param(values, 'strideDeg', 28);
    const bounce = param(values, 'bounce', 0.45);
    const armSwing = param(values, 'armSwingDeg', 18);
    const staffCounter = param(values, 'staffCounterDeg', 11);
    const phase = t * TAU;
    const sin = Math.sin(phase);
    const strideLeft = sin * stride;
    const strideRight = -sin * stride;

    return {
      parts: {
        torso: {
          ty: Math.abs(sin) * bounce,
          rx: deg(4 + Math.abs(sin) * 1.2),
          ry: deg(-sin * 4.5),
          rz: deg(sin * 3),
        },
        head: {
          rx: deg(-Math.abs(sin) * 1.5),
          ry: deg(sin * 4.5),
          rz: deg(sin * -2),
        },
        jaw: { rx: deg(1 + Math.abs(sin) * 1.6) },
        hat: { rz: deg(sin * -1.5), rx: deg(-Math.abs(sin) * 1.2) },
        left_leg: { rx: deg(strideLeft) },
        right_leg: { rx: deg(strideRight) },
        left_arm: {
          rx: deg(-strideLeft * (armSwing / Math.max(1, stride))),
          rz: deg(sin * 2),
        },
        right_arm: {
          rx: deg(-strideRight * (armSwing / Math.max(1, stride))),
          rz: deg(-sin * 2),
        },
        staff: {
          rz: deg(-sin * staffCounter),
          rx: deg(Math.sin(phase + 0.7) * 3),
        },
        peplum: {
          rz: deg(-sin * 4),
          rx: deg(Math.abs(sin) * 2.2),
        },
      },
    };
  },
};

const attack: ClipDefinition = {
  id: 'attack',
  name: 'Spinning Staff Hex',
  frames: 46,
  fps: 24,
  loop: false,
  params: {
    windupPct: params('Wind-up Window', 0.3, 0.12, 0.5, 0.01),
    strikePct: params('Strike Window', 0.58, 0.38, 0.8, 0.01),
    spinTurns: params('Staff Spin Turns', 1, 1, 2, 1),
    torsoTwistDeg: params('Torso Twist', 34, 0, 65, 0.5),
    shockwaveRadius: params('Shockwave Radius', 9, 3, 20, 0.5),
    sparkScale: params('Magic Spark Scale', 1.25, 0.4, 2.5, 0.05),
  },
  evaluate: (frame, totalFrames, values) => {
    const t = clamp(frame / Math.max(1, totalFrames - 1));
    const windup = param(values, 'windupPct', 0.3);
    const strike = Math.max(windup + 0.08, param(values, 'strikePct', 0.58));
    const twists = param(values, 'spinTurns', 1);
    const twistDeg = param(values, 'torsoTwistDeg', 34);
    const shockRadius = param(values, 'shockwaveRadius', 9);
    const sparkScale = param(values, 'sparkScale', 1.25);
    const spin = 360 * twists;

    let staffSpin: number;
    let armLift: number;
    let torsoTwist: number;
    let drop = 0;

    if (t <= windup) {
      const u = easeInOut(t / Math.max(0.01, windup));
      staffSpin = lerp(0, -80, u);
      armLift = lerp(0, -34, u);
      torsoTwist = lerp(0, -twistDeg, u);
      drop = -u * 0.16;
    } else if (t <= strike) {
      const u = easeOut((t - windup) / Math.max(0.01, strike - windup));
      staffSpin = lerp(-80, spin - 80, u);
      armLift = lerp(-34, -52, u);
      torsoTwist = lerp(-twistDeg, twistDeg, u);
      drop = -0.16 - Math.sin(u * Math.PI) * 0.45;
    } else {
      const u = easeInOut((t - strike) / Math.max(0.01, 1 - strike));
      staffSpin = lerp(spin - 80, spin, u);
      armLift = lerp(-52, 0, u);
      torsoTwist = lerp(twistDeg, 0, u);
      drop = lerp(-0.5, 0, u);
    }

    const slashProgress = clamp((t - (strike - 0.12)) / 0.3);
    const slashActive = t >= strike - 0.12 && t <= strike + 0.18;
    const shockProgress = clamp((t - strike) / 0.34);
    const shockActive = t >= strike && t <= strike + 0.34;
    const sparkProgress = clamp((t - (strike - 0.06)) / 0.3);

    return {
      parts: {
        torso: {
          ty: drop,
          rx: deg(2 + Math.sin(t * Math.PI) * 2),
          ry: deg(torsoTwist),
          rz: deg(Math.sin(t * Math.PI * 2) * 2),
        },
        head: {
          rx: deg(-Math.sin(t * Math.PI) * 2),
          ry: deg(torsoTwist * -0.35),
          rz: deg(Math.sin(t * Math.PI * 3) * 2),
        },
        jaw: { rx: deg(1 + Math.sin(t * Math.PI) * 4) },
        hat: {
          ry: deg(torsoTwist * 0.18),
          rz: deg(Math.sin(t * Math.PI * 2) * 2.5),
        },
        left_arm: {
          rx: deg(armLift),
          rz: deg(Math.sin(t * Math.PI) * 12),
        },
        right_arm: {
          rx: deg(-Math.sin(t * Math.PI) * 48),
          rz: deg(10 + Math.sin(t * Math.PI) * 18),
        },
        staff: {
          rz: deg(staffSpin),
          rx: deg(Math.sin(t * Math.PI) * 8),
        },
        left_leg: {
          rx: deg(Math.sin(t * Math.PI) * -8),
          rz: deg(-3),
        },
        right_leg: {
          rx: deg(Math.sin(t * Math.PI) * 10),
          rz: deg(3),
        },
        peplum: {
          rx: deg(Math.abs(torsoTwist) * 0.25),
          rz: deg(torsoTwist * -0.35),
        },
      },
      vfx: [
        ...(slashActive
          ? spawnSlashArcVoxels([6, 20, 8], Math.PI * 0.08, slashProgress, 1.35)
          : []),
        ...(slashActive
          ? spawnElectricArcsVoxels([6, 20, 8], sparkProgress, 23, sparkScale)
          : []),
        ...(shockActive
          ? spawnShockwaveRingVoxels([4, 0.6, 8], shockRadius, shockProgress, 1)
          : []),
      ],
    };
  },
};

const death: ClipDefinition = {
  id: 'death',
  name: 'Dramatic Voxel Shatter',
  frames: 54,
  fps: 18,
  loop: false,
  params: {
    popForce: params('Pop Force', 9, 2, 18, 0.2),
    tumbleSpin: params('Tumble Spin', 3.2, 0.5, 6, 0.1),
    gravity: params('Fall Gravity', 1.65, 0.7, 3, 0.05),
    smokeAmount: params('Smoke Amount', 1.05, 0, 2.5, 0.05),
  },
  evaluate: (frame, totalFrames, values) => {
    const result = voxelShatterDeath(frame, totalFrames, values);
    const t = clamp(frame / Math.max(1, totalFrames));

    return {
      parts: {
        ...result.parts,
        hat: {
          tx: Math.sin(t * Math.PI * 2.4) * 2,
          ty: t * t * 4.5,
          tz: Math.cos(t * Math.PI * 2) * 1.6,
          rx: deg(t * 460),
          ry: deg(t * 310),
          rz: deg(t * 190),
        },
        jaw: {
          rx: deg(t * 42),
          ty: -t * 0.7,
          rz: deg(Math.sin(t * Math.PI) * 6),
        },
        peplum: {
          ty: -t * 1.2,
          rx: deg(t * 24),
          rz: deg(Math.sin(t * Math.PI * 1.5) * 16),
          scale: 1 + t * 0.06,
        },
        staff: {
          rx: deg(t * 380),
          ry: deg(t * 220),
          rz: deg(t * 90),
          ty: t * 1.2,
        },
      },
      vfx: result.vfx,
    };
  },
};

export const burmeseZawgyi: VoxelUnitDefinition = {
  id: 'burmese-zawgyi',
  name: 'Burmese Zawgyi',
  category: 'character',
  palette,
  parts: zawgyiParts,
  animations: [idle, walk, attack, death],
};
