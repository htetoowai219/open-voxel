import type { ClipParamSchema, VoxelUnitDefinition } from '../../types/voxel';
import {
  extrudePattern,
  fillBox,
  part,
  translateVoxels,
} from '../../engine/voxelBuilder';
import {
  humanoidIdle,
  humanoidWalk,
  meleeSlash,
  param,
  voxelShatterDeath,
} from '../../engine/animationPresets';
import { spawnSlashArcVoxels } from '../../engine/voxelVfx';

const palette = {
  iron: '#778394',
  ironDark: '#3b4452',
  steel: '#c6d0dd',
  steelDark: '#8997aa',
  gold: '#d6a84a',
  goldDark: '#8e6925',
  crimson: '#b0253a',
  crimsonDark: '#681321',
  leather: '#2c3038',
  glow: '#ffe39a',
};

const params = (
  label: string,
  value: number,
  min: number,
  max: number,
  step = 0.1,
): ClipParamSchema => ({ label, value, min, max, step });

const swordPattern = [
  '.....#.....',
  '....###....',
  '....###....',
  '....###....',
  '....###....',
  '....###....',
  '..#######..',
  '.G#######G.',
  '....###....',
  '...GGGGG...',
  '....###....',
  '....###....',
];

const shieldPattern = [
  '.#######.',
  '#########',
  '###GGG###',
  '##GGGGG##',
  '###GGG###',
  '#########',
  '.#######.',
  '..#####..',
  '...###...',
  '....#....',
];

const knightParts = [
  part('torso', 'Torso & Breastplate', [0, 16, 0])
    .fillBox(-3, 15, -2, 3, 22, 2, palette.iron)
    .fillBox(-3, 17, 3, 3, 21, 3, palette.steel)
    .fillBox(-1, 17, 4, 1, 21, 4, palette.gold)
    .fillBox(-4, 14, -2, 4, 15, 2, palette.leather)
    .fillBox(-1, 14, 3, 1, 15, 3, palette.gold)
    .fillBox(-4, 22, -2, 4, 23, 2, palette.ironDark)
    .fillBox(-5, 20, -2, -4, 22, 2, palette.steelDark)
    .fillBox(4, 20, -2, 5, 22, 2, palette.steelDark)
    .fillBox(-2, 8, 2, 2, 14, 3, palette.crimson)
    .fillBox(-2, 8, 3, 2, 8, 3, palette.gold)
    .fillBox(-1, 23, -1, 1, 25, 1, palette.ironDark)
    .end(),
  part('head', 'Helmet & Plume', [0, 26, 0], 'torso')
    .fillBox(-3, 26, -3, 3, 30, 3, palette.ironDark)
    .fillBox(-4, 28, -2, 4, 32, 2, palette.iron)
    .fillBox(-3, 31, -2, 3, 33, 1, palette.steelDark)
    .fillBox(-3, 27, 3, 3, 30, 4, palette.steel)
    .fillBox(-2, 29, 5, 2, 30, 5, palette.ironDark)
    .fillBox(-1, 29, 5, -1, 29, 5, palette.glow)
    .setVoxel(1, 29, 5, palette.glow)
    .fillBox(-4, 26, -1, -3, 30, 1, palette.gold)
    .setVoxel(4, 27, 0, palette.gold)
    .fillBox(-1, 33, 0, 1, 35, 2, palette.crimsonDark)
    .fillBox(-2, 34, -2, 2, 36, 1, palette.crimson)
    .fillBox(-1, 36, -1, 1, 38, 1, palette.crimson)
    .fillBox(-2, 37, -3, 2, 38, 0, palette.crimsonDark)
    .end(),
  part('left_arm', 'Left Arm & Pauldron', [4, 21, 0], 'torso')
    .fillBox(3, 20, -2, 7, 23, 2, palette.steel)
    .fillBox(3, 18, -1, 6, 20, 1, palette.iron)
    .fillBox(4, 14, -1, 6, 18, 1, palette.ironDark)
    .fillBox(4, 13, -1, 6, 14, 1, palette.gold)
    .fillBox(4, 10, -1, 6, 13, 1, palette.steel)
    .fillBox(4, 8, -1, 7, 10, 2, palette.steelDark)
    .setVoxel(7, 20, 0, palette.gold)
    .end(),
  part('right_arm', 'Right Arm & Sword Grip', [-4, 21, 0], 'torso')
    .fillBox(-7, 20, -2, -3, 23, 2, palette.steel)
    .fillBox(-6, 18, -1, -3, 20, 1, palette.iron)
    .fillBox(-6, 14, -1, -4, 18, 1, palette.ironDark)
    .fillBox(-6, 13, -1, -4, 14, 1, palette.gold)
    .fillBox(-6, 10, -1, -4, 13, 1, palette.steel)
    .fillBox(-7, 8, -1, -4, 10, 2, palette.steelDark)
    .setVoxel(-7, 20, 0, palette.gold)
    .end(),
  part('left_leg', 'Left Leg & Greave', [2, 14, 0], 'torso')
    .fillBox(1, 8, -1, 3, 14, 1, palette.ironDark)
    .fillBox(1, 7, -1, 3, 8, 1, palette.steel)
    .fillBox(1, 4, -1, 3, 7, 1, palette.iron)
    .fillBox(1, 3, -1, 3, 4, 1, palette.gold)
    .fillBox(1, 0, -2, 4, 3, 2, palette.steelDark)
    .fillBox(2, 0, 3, 4, 1, 3, palette.steel)
    .end(),
  part('right_leg', 'Right Leg & Greave', [-2, 14, 0], 'torso')
    .fillBox(-3, 8, -1, -1, 14, 1, palette.ironDark)
    .fillBox(-3, 7, -1, -1, 8, 1, palette.steel)
    .fillBox(-3, 4, -1, -1, 7, 1, palette.iron)
    .fillBox(-3, 3, -1, -1, 4, 1, palette.gold)
    .fillBox(-4, 0, -2, -1, 3, 2, palette.steelDark)
    .fillBox(-4, 0, 3, -2, 1, 3, palette.steel)
    .end(),
  part('cape', 'Crimson Cape', [0, 23, -3], 'torso')
    .fillBox(-5, 8, -5, 5, 23, -3, palette.crimson)
    .fillBox(-6, 12, -5, -5, 22, -3, palette.crimsonDark)
    .fillBox(5, 12, -5, 6, 22, -3, palette.crimsonDark)
    .fillBox(-4, 7, -5, 4, 8, -3, palette.crimsonDark)
    .fillBox(-5, 23, -4, 5, 24, -3, palette.goldDark)
    .setVoxel(-5, 20, -6, palette.gold)
    .setVoxel(5, 20, -6, palette.gold)
    .end(),
  part('shield', 'Kite Shield', [6, 16, 3], 'left_arm')
    .add(...translateVoxels(extrudePattern(shieldPattern, {
      '#': palette.steelDark,
      G: palette.gold,
    }, 2), 7, 11, 3))
    .fillBox(5, 14, 5, 7, 16, 5, palette.crimson)
    .end(),
  part('weapon', 'Broadsword', [-6, 14, 3], 'right_arm')
    .add(...translateVoxels(extrudePattern(swordPattern, {
      '#': palette.steel,
      G: palette.gold,
    }, 2), -6, 8, 4))
    .fillBox(-7, 15, 4, -5, 17, 5, palette.leather)
    .setVoxel(-8, 18, 4, palette.gold)
    .end(),
];

const idle: VoxelAnimationDefinition = {
  id: 'idle',
  name: 'Idle',
  frames: 60,
  fps: 24,
  loop: true,
  params: {
    breathSpeed: params('Breath Speed', 1.1, 0.2, 3, 0.05),
    breathAmount: params('Breath Lift', 0.22, 0, 1, 0.01),
    headTiltDeg: params('Head Tilt', 2.4, 0, 10, 0.1),
    armSwayDeg: params('Arm Sway', 1.8, 0, 10, 0.1),
  },
  evaluate: (frame, totalFrames, values) => humanoidIdle(frame, totalFrames, values),
};

type VoxelAnimationDefinition = VoxelUnitDefinition['animations'][number];

const walk: VoxelAnimationDefinition = {
  id: 'walk',
  name: 'Walk',
  frames: 32,
  fps: 24,
  loop: true,
  params: {
    walkStrideDeg: params('Leg Stride', 30, 0, 60, 0.5),
    walkArmSwingDeg: params('Arm Swing', 22, 0, 50, 0.5),
    walkBounce: params('Torso Bounce', 0.34, 0, 1.2, 0.01),
    walkLeanDeg: params('Forward Lean', 3.2, 0, 12, 0.1),
  },
  evaluate: (frame, totalFrames, values) => humanoidWalk(frame, totalFrames, values),
};

const attack: VoxelAnimationDefinition = {
  id: 'attack',
  name: 'Broadsword Slash',
  frames: 30,
  fps: 24,
  loop: false,
  params: {
    torsoTwistDeg: params('Torso Twist', 28, 0, 55, 0.5),
    armSwingDeg: params('Cleave Arc', 132, 40, 190, 1),
    windupPct: params('Wind-up Window', 0.34, 0.1, 0.55, 0.01),
    strikePct: params('Strike Window', 0.58, 0.4, 0.85, 0.01),
  },
  evaluate: (frame, totalFrames, values) => {
    const base = meleeSlash(frame, totalFrames, values);
    const progress = frame / Math.max(1, totalFrames);
    const active = progress > 0.33 && progress < 0.78;
    const local = active ? (progress - 0.33) / 0.45 : 0;
    return {
      parts: base.parts,
      vfx: active
        ? spawnSlashArcVoxels(
            [0, 19, 6],
            -Math.PI * 0.18,
            local,
            1.15,
          )
        : [],
    };
  },
};

const death: VoxelAnimationDefinition = {
  id: 'death',
  name: 'Shatter Death',
  frames: 52,
  fps: 20,
  loop: false,
  params: {
    popForce: params('Pop Force', 8, 2, 16, 0.2),
    tumbleSpin: params('Tumble Spin', 2.8, 0.5, 6, 0.1),
    gravity: params('Fall Gravity', 1.6, 0.7, 3, 0.05),
    smokeAmount: params('Smoke Amount', 1, 0, 2.5, 0.05),
  },
  evaluate: (frame, totalFrames, values) => {
    const result = voxelShatterDeath(frame, totalFrames, values);
    const progress = frame / Math.max(1, totalFrames);
    const extra = progress > 0.15
      ? spawnSlashArcVoxels([0, 2, 2], Math.PI * 0.5, Math.max(0, progress - 0.45), 0.7)
      : [];
    return { parts: result.parts, vfx: [...(result.vfx ?? []), ...extra] };
  },
};

export const armoredKnight: VoxelUnitDefinition = {
  id: 'armored-knight',
  name: 'Armored Knight',
  category: 'character',
  palette,
  parts: knightParts,
  animations: [idle, walk, attack, death],
};
