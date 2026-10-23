import type { ClipParamSchema, VoxelUnitDefinition } from '../../types/voxel';
import { part } from '../../engine/voxelBuilder';
import { artilleryFire } from '../../engine/animationPresets';
import {
  spawnMuzzleBlastVoxels,
  spawnShockwaveRingVoxels,
  spawnSmokeCloudVoxels,
} from '../../engine/voxelVfx';

const palette = {
  stone: '#7d8794',
  stoneDark: '#4f5864',
  stoneLight: '#a8b0bb',
  lacquer: '#a11f2f',
  lacquerDark: '#64101d',
  gold: '#d2a64c',
  goldDark: '#8a6a27',
  bronze: '#b47c36',
  bronzeDark: '#78501f',
  wood: '#4a3326',
  steel: '#aab4c0',
  uniform: '#22433a',
  uniformDark: '#132a24',
  skin: '#c98e6d',
  plume: '#b8263a',
};

const params = (
  label: string,
  value: number,
  min: number,
  max: number,
  step = 0.1,
): ClipParamSchema => ({ label, value, min, max, step });

const cannonParts = [
  part('pedestal', 'Carved Stone Pedestal', [0, 0, 0])
    .fillBox(-10, 0, -8, 10, 1, 8, palette.stoneDark)
    .fillBox(-9, 1, -7, 9, 2, 7, palette.stone)
    .fillBox(-8, 2, -6, 8, 3, 6, palette.stoneLight)
    .fillBox(-11, 0, 6, 11, 1, 9, palette.stoneDark)
    .fillBox(-9, 1, 7, 9, 2, 8, palette.stone)
    .fillBox(-10, 1, -9, -9, 3, -8, palette.goldDark)
    .fillBox(9, 1, -9, 10, 3, -8, palette.goldDark)
    .fillBox(-10, 1, 8, -9, 3, 9, palette.goldDark)
    .fillBox(9, 1, 8, 10, 3, 9, palette.goldDark)
    .setVoxel(-8, 2, 8, palette.gold)
    .setVoxel(8, 2, 8, palette.gold)
    .end(),
  part('carriage', 'Royal Gun Carriage', [0, 4, 0], 'pedestal')
    .fillBox(-7, 4, -6, 7, 7, 6, palette.wood)
    .fillBox(-6, 7, -4, 6, 8, 4, palette.lacquer)
    .fillBox(-7, 6, -5, 7, 6, 5, palette.lacquerDark)
    .fillBox(-7, 7, -6, -6, 8, 6, palette.gold)
    .fillBox(6, 7, -6, 7, 8, 6, palette.gold)
    .fillBox(-5, 4, 6, 5, 6, 7, palette.goldDark)
    .fillBox(-4, 5, 7, 4, 6, 7, palette.gold)
    .fillBox(-3, 4, -7, 3, 5, -6, palette.lacquer)
    .fillBox(-2, 6, -5, 2, 7, -4, palette.steel)
    .end(),
  part('left_wheel', 'Left Wheel', [-8, 6, 0], 'carriage')
    .fillCylinder(6, -9, -7, 0, 3, palette.lacquerDark, 'x')
    .fillCylinder(6, -10, -9, 0, 3, palette.gold, 'x')
    .fillCylinder(6, -7, -6, 0, 2, palette.lacquer, 'x')
    .fillBox(-9, 6, -2, -8, 6, 2, palette.goldDark)
    .fillBox(-9, 3, 0, -8, 8, 0, palette.goldDark)
    .fillBox(-10, 5, -1, -9, 7, 1, palette.gold)
    .end(),
  part('right_wheel', 'Right Wheel', [8, 6, 0], 'carriage')
    .fillCylinder(6, 7, 9, 0, 3, palette.lacquerDark, 'x')
    .fillCylinder(6, 9, 10, 0, 3, palette.gold, 'x')
    .fillCylinder(6, 6, 7, 0, 2, palette.lacquer, 'x')
    .fillBox(8, 6, -2, 9, 6, 2, palette.goldDark)
    .fillBox(8, 3, 0, 9, 8, 0, palette.goldDark)
    .fillBox(9, 5, -1, 10, 7, 1, palette.gold)
    .end(),
  part('barrel', 'Bronze Cannon Barrel', [0, 10, 0], 'carriage')
    .fillCylinder(0, 2, 18, 10, 3, palette.bronze, 'z')
    .fillCylinder(0, 2, 3, 10, 4, palette.bronzeDark, 'z')
    .fillCylinder(0, 7, 8, 10, 4, palette.gold, 'z')
    .fillCylinder(0, 13, 14, 10, 4, palette.goldDark, 'z')
    .fillCylinder(0, 17, 19, 10, 4, palette.bronzeDark, 'z')
    .fillCylinder(0, 18, 19, 10, 3, palette.gold, 'z')
    .fillBox(-4, 9, 2, 4, 11, 4, palette.bronzeDark)
    .fillBox(-1, 11, 2, 1, 13, 4, palette.gold)
    .fillBox(-1, 9, 18, 1, 11, 20, palette.steel)
    .setVoxel(0, 10, 21, palette.lacquer)
    .end(),
  part('gunner', 'Gunner Body', [-12, 9, -4], 'pedestal')
    .fillBox(-13, 0, -5, -11, 4, -3, palette.uniformDark)
    .fillBox(-14, 0, -6, -11, 2, -3, palette.wood)
    .fillBox(-13, 4, -5, -11, 9, -3, palette.uniform)
    .fillBox(-14, 9, -5, -10, 15, -3, palette.lacquer)
    .fillBox(-14, 12, -5, -10, 13, -4, palette.gold)
    .fillBox(-15, 10, -5, -14, 14, -3, palette.uniform)
    .fillBox(-10, 10, -5, -9, 14, -3, palette.uniform)
    .fillBox(-15, 8, -5, -14, 10, -3, palette.skin)
    .fillBox(-10, 8, -5, -9, 10, -3, palette.skin)
    .setVoxel(-15, 14, -4, palette.gold)
    .setVoxel(-9, 14, -4, palette.gold)
    .end(),
  part('gunner_head', 'Gunner Head', [-12, 17, -4], 'gunner')
    .fillBox(-13, 16, -5, -11, 20, -3, palette.skin)
    .fillBox(-14, 20, -6, -10, 21, -2, palette.gold)
    .fillBox(-13, 21, -5, -11, 22, -3, palette.goldDark)
    .fillBox(-12, 22, -4, -11, 23, -3, palette.plume)
    .setVoxel(-13, 18, -3, palette.steel)
    .setVoxel(-11, 18, -3, palette.steel)
    .end(),
];

type ClipDefinition = VoxelUnitDefinition['animations'][number];

const idle: ClipDefinition = {
  id: 'idle',
  name: 'Idle Watch',
  frames: 60,
  fps: 20,
  loop: true,
  params: {
    barrelSwayDeg: params('Barrel Sway', 1.2, 0, 6, 0.1),
    gunnerSwayDeg: params('Gunner Sway', 1.8, 0, 8, 0.1),
    wheelCreakDeg: params('Wheel Creak', 0.8, 0, 4, 0.05),
    breezeAmount: params('Banner Breeze', 0.2, 0, 1, 0.01),
  },
  evaluate: (frame, totalFrames, values) => {
    const t = frame / Math.max(1, totalFrames);
    const phase = t * Math.PI * 2;
    const phaseSpeed = 0.9;
    const barrelSway = values.barrelSwayDeg ?? 1.2;
    const gunnerSway = values.gunnerSwayDeg ?? 1.8;
    const creak = values.wheelCreakDeg ?? 0.8;
    const breeze = values.breezeAmount ?? 0.2;
    return {
      parts: {
        barrel: {
          ry: ((Math.sin(phase * phaseSpeed) * barrelSway) * Math.PI) / 180,
          rx: ((Math.sin(phase * 0.7 + 0.8) * barrelSway * 0.35) * Math.PI) / 180,
        },
        carriage: {
          ty: Math.sin(phase * 2) * 0.035,
          rz: ((Math.sin(phase) * creak * 0.3) * Math.PI) / 180,
        },
        left_wheel: { rx: ((Math.sin(phase) * creak) * Math.PI) / 180 },
        right_wheel: { rx: ((Math.sin(phase) * creak) * Math.PI) / 180 },
        gunner: {
          ty: Math.sin(phase * 2 + 0.4) * 0.08,
          rz: ((Math.sin(phase) * gunnerSway * 0.4) * Math.PI) / 180,
        },
        gunner_head: {
          ry: ((Math.sin(phase * 0.55) * gunnerSway) * Math.PI) / 180,
          rz: ((Math.sin(phase * 0.9) * gunnerSway * 0.5) * Math.PI) / 180,
        },
        pedestal: {
          ty: Math.sin(phase) * breeze * 0.02,
        },
      },
    };
  },
};

const fire: ClipDefinition = {
  id: 'fire',
  name: 'Royal Salvo',
  frames: 42,
  fps: 24,
  loop: false,
  params: {
    recoilDistance: params('Barrel Recoil', 2.8, 0, 8, 0.1),
    recoilKick: params('Carriage Kick', 1.9, 0, 5, 0.1),
    settleSpeed: params('Settle Speed', 2.4, 0.5, 5, 0.05),
    blastScale: params('Muzzle Blast', 1.1, 0.2, 2.5, 0.05),
    smokeScale: params('Powder Smoke', 1.1, 0.2, 2.5, 0.05),
    shockwaveRadius: params('Shockwave Radius', 10, 2, 20, 0.5),
  },
  evaluate: (frame, totalFrames, values) => {
    const base = artilleryFire(frame, totalFrames, values);
    const t = frame / Math.max(1, totalFrames);
    const blastProgress = Math.min(1, Math.max(0, (t - 0.06) / 0.72));
    const visible = blastProgress > 0 && blastProgress < 1;
    return {
      parts: base.parts,
      vfx: visible
        ? [
            ...spawnMuzzleBlastVoxels(
              [0, 10, 20],
              [0, 0, 1],
              blastProgress,
              7,
              values.blastScale ?? 1.1,
            ),
            ...spawnSmokeCloudVoxels(
              [0, 11, 7],
              blastProgress,
              21,
              values.smokeScale ?? 1.1,
            ),
            ...spawnShockwaveRingVoxels(
              [0, 0.5, 6],
              values.shockwaveRadius ?? 10,
              blastProgress,
              1,
            ),
          ]
        : [],
    };
  },
};

const death: ClipDefinition = {
  id: 'death',
  name: 'Battery Collapse',
  frames: 50,
  fps: 20,
  loop: false,
  params: {
    collapseAmount: params('Collapse Amount', 1, 0.2, 1.4, 0.05),
    tumbleSpin: params('Barrel Tumble', 1.2, 0, 3, 0.05),
    smokeAmount: params('Smoke Amount', 1.2, 0, 2.5, 0.05),
  },
  evaluate: (frame, totalFrames, values) => {
    const t = Math.min(1, Math.max(0, frame / Math.max(1, totalFrames)));
    const collapse = values.collapseAmount ?? 1;
    const spin = values.tumbleSpin ?? 1.2;
    const smoke = values.smokeAmount ?? 1.2;
    const ease = 1 - Math.pow(1 - t, 2);
    return {
      parts: {
        carriage: {
          rx: ((ease * 14 * collapse) * Math.PI) / 180,
          ty: -ease * 1.4 * collapse,
        },
        barrel: {
          rx: ((ease * -55 * collapse) * Math.PI) / 180,
          tz: -ease * 4 * collapse,
          ty: -ease * 2.8 * collapse,
          ry: ((t * 360 * spin) * Math.PI) / 180,
        },
        left_wheel: { rx: ((t * 520 * spin) * Math.PI) / 180 },
        right_wheel: { rx: ((t * 520 * spin) * Math.PI) / 180 },
        gunner: {
          rz: ((ease * 76 * collapse) * Math.PI) / 180,
          tx: -ease * 2.4 * collapse,
          ty: -ease * 1.6 * collapse,
        },
        gunner_head: {
          rz: ((ease * 110 * collapse) * Math.PI) / 180,
          tx: -ease * 1.8 * collapse,
          ty: -ease * 1.2 * collapse,
          visible: t < 0.96,
        },
        pedestal: {
          ty: -ease * 0.35 * collapse,
        },
      },
      vfx: spawnSmokeCloudVoxels([0, 8, 0], Math.min(1, t * 1.35), 33, smoke),
    };
  },
};

export const siegeCannon: VoxelUnitDefinition = {
  id: 'siege-cannon',
  name: 'Royal Siege Cannon',
  category: 'artillery',
  palette,
  parts: cannonParts,
  animations: [idle, fire, death],
};
