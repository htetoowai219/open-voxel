import type { ClipParamSchema, VoxelUnitDefinition } from '../../types/voxel';
import { part } from '../../engine/voxelBuilder';
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
  spawnShockwaveRingVoxels,
  spawnSlashArcVoxels,
} from '../../engine/voxelVfx';

const palette = {
  skin: '#2f8f5b',
  skinDark: '#1c5b39',
  skinLight: '#4cbb7a',
  gold: '#d6a43c',
  goldLight: '#f1cc63',
  goldDark: '#8a641f',
  ruby: '#c2183d',
  rubyDark: '#780f24',
  ivory: '#f4ecd6',
  eye: '#f5c518',
  pupil: '#1a1206',
  crimson: '#a81c32',
  crimsonDark: '#6c1021',
  iron: '#596273',
  ironDark: '#303642',
  mouth: '#3a0b12',
};

const params = (
  label: string,
  value: number,
  min: number,
  max: number,
  step = 0.1,
): ClipParamSchema => ({ label, value, min, max, step });

type ClipDefinition = VoxelUnitDefinition['animations'][number];

const biluParts = [
  part('torso', 'Massive Torso', [0, 18, 0])
    .fillBox(-8, 21, -4, 8, 31, 4, palette.skin)
    .fillBox(-7, 17, -4, 7, 23, 5, palette.skin)
    .fillBox(-8, 16, -3, 8, 18, 4, palette.skinDark)
    .fillBox(-6, 25, 5, 6, 30, 5, palette.skinLight)
    .fillBox(-6, 24, 5, -2, 28, 5, palette.skinLight)
    .fillBox(2, 24, 5, 6, 28, 5, palette.skinLight)
    .fillBox(-1, 24, 6, 1, 28, 6, palette.skin)
    .fillBox(-6, 19, 5, 6, 23, 5, palette.skinLight)
    .fillBox(-1, 22, 6, 1, 24, 6, palette.skinDark)
    .fillBox(-7, 22, -5, 7, 30, -5, palette.skinDark)
    .fillBox(-3, 30, -2, 3, 33, 2, palette.skinDark)
    .fillBox(-7, 29, 4, 7, 30, 5, palette.gold)
    .setVoxel(0, 28, 6, palette.ruby)
    .setVoxel(-6, 26, 5, palette.skinDark)
    .setVoxel(6, 26, 5, palette.skinDark)
    .end(),
  part('head', 'Bilu Head', [0, 32, 0], 'torso')
    .fillBox(-6, 32, -4, 6, 39, 4, palette.skin)
    .fillBox(-7, 34, -3, 7, 38, 3, palette.skin)
    .fillBox(-6, 37, 5, 6, 39, 5, palette.skinDark)
    .fillBox(-3, 33, 5, 3, 36, 6, palette.skinLight)
    .fillBox(-1, 34, 6, 1, 36, 6, palette.skinLight)
    .setVoxel(-2, 34, 6, palette.skinDark)
    .setVoxel(2, 34, 6, palette.skinDark)
    .fillBox(-5, 36, 5, -3, 38, 6, palette.eye)
    .fillBox(3, 36, 5, 5, 38, 6, palette.eye)
    .setVoxel(-4, 36, 6, palette.pupil)
    .setVoxel(4, 36, 6, palette.pupil)
    .fillBox(-5, 38, 5, -3, 39, 5, palette.skinDark)
    .fillBox(3, 38, 5, 5, 39, 5, palette.skinDark)
    .fillBox(-8, 35, -2, -7, 38, 2, palette.skinDark)
    .fillBox(7, 35, -2, 8, 38, 2, palette.skinDark)
    .setVoxel(-9, 36, 0, palette.gold)
    .setVoxel(9, 36, 0, palette.gold)
    .fillBox(-6, 33, -5, 6, 39, -4, palette.skinDark)
    .end(),
  part('jaw', 'Heavy Jaw & Tusks', [0, 33, 2], 'head')
    .fillBox(-5, 30, 3, 5, 33, 5, palette.skinDark)
    .fillBox(-4, 31, 6, 4, 32, 6, palette.mouth)
    .fillBox(-2, 30, 6, 2, 32, 6, palette.skinDark)
    .fillBox(-4, 32, 7, -3, 33, 7, palette.ivory)
    .setVoxel(-4, 34, 7, palette.ivory)
    .setVoxel(-5, 35, 7, palette.ivory)
    .setVoxel(-5, 36, 7, palette.ivory)
    .fillBox(3, 32, 7, 4, 33, 7, palette.ivory)
    .setVoxel(4, 34, 7, palette.ivory)
    .setVoxel(5, 35, 7, palette.ivory)
    .setVoxel(5, 36, 7, palette.ivory)
    .fillBox(-1, 32, 7, 1, 33, 7, palette.ivory)
    .end(),
  part('crown', 'Magike Golden Crown', [0, 40, 0], 'head')
    .fillBox(-7, 40, -4, 7, 42, 4, palette.goldDark)
    .fillBox(-6, 40, 5, 6, 43, 5, palette.gold)
    .fillBox(-2, 40, 6, 2, 44, 6, palette.goldLight)
    .fillBox(-5, 42, -3, 5, 43, 3, palette.gold)
    .fillBox(-3, 43, -2, 3, 44, 2, palette.goldDark)
    .fillBox(-1, 44, -1, 1, 46, 1, palette.goldLight)
    .fillBox(-8, 40, -2, -7, 42, 2, palette.goldDark)
    .fillBox(7, 40, -2, 8, 42, 2, palette.goldDark)
    .setVoxel(0, 41, 7, palette.ruby)
    .setVoxel(-5, 41, 6, palette.ruby)
    .setVoxel(5, 41, 6, palette.ruby)
    .setVoxel(-6, 42, 5, palette.rubyDark)
    .setVoxel(6, 42, 5, palette.rubyDark)
    .setVoxel(0, 45, 0, palette.ruby)
    .setVoxel(-2, 43, 6, palette.goldLight)
    .setVoxel(2, 43, 6, palette.goldLight)
    .end(),
  part('left_arm', 'Left Arm & Armlet', [9, 28, 0], 'torso')
    .fillBox(7, 25, -4, 12, 30, 4, palette.skin)
    .fillBox(8, 20, -3, 12, 26, 3, palette.skin)
    .fillBox(7, 22, -4, 13, 24, 4, palette.gold)
    .fillBox(9, 15, -3, 13, 21, 3, palette.skin)
    .fillBox(8, 15, -4, 13, 16, 4, palette.gold)
    .fillBox(9, 11, -3, 13, 14, 3, palette.skinDark)
    .fillBox(8, 12, 4, 13, 14, 4, palette.skinLight)
    .setVoxel(11, 27, 4, palette.gold)
    .setVoxel(11, 26, 4, palette.ruby)
    .end(),
  part('right_arm', 'Right Arm & Armlet', [-9, 28, 0], 'torso')
    .fillBox(-12, 25, -4, -7, 30, 4, palette.skin)
    .fillBox(-12, 20, -3, -8, 26, 3, palette.skin)
    .fillBox(-13, 22, -4, -7, 24, 4, palette.gold)
    .fillBox(-13, 15, -3, -9, 21, 3, palette.skin)
    .fillBox(-13, 15, -4, -8, 16, 4, palette.gold)
    .fillBox(-13, 11, -3, -9, 14, 3, palette.skinDark)
    .fillBox(-13, 12, 4, -8, 14, 4, palette.skinLight)
    .setVoxel(-11, 27, 4, palette.gold)
    .setVoxel(-11, 26, 4, palette.ruby)
    .end(),
  part('left_leg', 'Left Leg', [4, 17, 0], 'torso')
    .fillBox(2, 10, -3, 7, 18, 3, palette.skin)
    .fillBox(2, 9, -4, 7, 11, 4, palette.skinDark)
    .fillBox(2, 3, -3, 6, 9, 3, palette.skin)
    .fillBox(2, 3, -4, 7, 4, 4, palette.gold)
    .fillBox(1, 0, -3, 7, 3, 6, palette.skinDark)
    .fillBox(2, 0, 6, 6, 1, 7, palette.ivory)
    .end(),
  part('right_leg', 'Right Leg', [-4, 17, 0], 'torso')
    .fillBox(-7, 10, -3, -2, 18, 3, palette.skin)
    .fillBox(-7, 9, -4, -2, 11, 4, palette.skinDark)
    .fillBox(-6, 3, -3, -2, 9, 3, palette.skin)
    .fillBox(-7, 3, -4, -2, 4, 4, palette.gold)
    .fillBox(-7, 0, -3, -1, 3, 6, palette.skinDark)
    .fillBox(-6, 0, 6, -2, 1, 7, palette.ivory)
    .end(),
  part('dhoti', 'Crimson Royal Dhoti', [0, 18, 0], 'torso')
    .fillBox(-7, 14, 6, 7, 20, 6, palette.crimson)
    .fillBox(-7, 14, -6, 7, 20, -6, palette.crimsonDark)
    .fillBox(-9, 14, -6, -9, 20, 6, palette.crimsonDark)
    .fillBox(9, 14, -6, 9, 20, 6, palette.crimsonDark)
    .fillBox(-9, 19, -6, 9, 21, 6, palette.gold)
    .fillBox(-8, 20, -5, 8, 21, 5, palette.goldDark)
    .fillBox(-4, 7, 7, 4, 19, 7, palette.crimsonDark)
    .fillBox(-5, 7, 7, 5, 8, 7, palette.gold)
    .fillBox(-5, 8, 8, -4, 19, 8, palette.gold)
    .fillBox(4, 8, 8, 5, 19, 8, palette.gold)
    .setVoxel(0, 17, 8, palette.ruby)
    .end(),
  part('weapon', 'Gold-and-Iron Spiked Gada', [-11, 13, 3], 'right_arm')
    .fillBox(-12, 7, 2, -10, 13, 4, palette.ironDark)
    .fillBox(-12, 11, 2, -10, 12, 4, palette.gold)
    .fillBox(-12, 7, 2, -10, 8, 4, palette.goldDark)
    .fillSphere(-11, 4, 3, 3, palette.gold)
    .fillBox(-14, 3, 0, -8, 5, 6, palette.iron)
    .fillBox(-13, 4, 0, -9, 4, 6, palette.ironDark)
    .setVoxel(-15, 4, 3, palette.iron)
    .setVoxel(-14, 4, 3, palette.ironDark)
    .setVoxel(-7, 4, 3, palette.iron)
    .setVoxel(-8, 4, 3, palette.ironDark)
    .setVoxel(-11, 4, -1, palette.iron)
    .setVoxel(-11, 4, 0, palette.ironDark)
    .setVoxel(-11, 4, 7, palette.iron)
    .setVoxel(-11, 4, 6, palette.ironDark)
    .setVoxel(-11, 7, 3, palette.iron)
    .setVoxel(-11, 8, 3, palette.ironDark)
    .setVoxel(-13, 6, 1, palette.goldLight)
    .setVoxel(-9, 6, 5, palette.goldDark)
    .end(),
];

const idle: ClipDefinition = {
  id: 'idle',
  name: 'Heavy Breathing Idle',
  frames: 64,
  fps: 20,
  loop: true,
  params: {
    breathSpeed: params('Breath Speed', 1, 0.2, 3, 0.05),
    breathAmount: params('Breath Lift', 0.3, 0, 1.2, 0.01),
    shoulderRollDeg: params('Shoulder Roll', 2.2, 0, 8, 0.1),
    clubSwayDeg: params('Gada Sway', 1.6, 0, 6, 0.1),
  },
  evaluate: (frame, totalFrames, values) => {
    const t = frame / Math.max(1, totalFrames);
    const speed = param(values, 'breathSpeed', 1);
    const amount = param(values, 'breathAmount', 0.3);
    const roll = param(values, 'shoulderRollDeg', 2.2);
    const club = param(values, 'clubSwayDeg', 1.6);
    const phase = t * TAU * speed;
    const breath = Math.sin(phase);
    const settle = Math.sin(phase * 0.5 + 0.7);

    return {
      parts: {
        torso: {
          ty: breath * amount,
          rx: deg(1.2 + breath * 0.5),
          rz: deg(settle * 0.6),
          scale: 1 + breath * 0.005,
        },
        head: {
          ry: deg(Math.sin(phase * 0.45) * 2.4),
          rz: deg(settle * 1.2),
          rx: deg(-breath * 0.7),
        },
        jaw: { rx: deg(1.4 + breath * 1.1) },
        crown: { rz: deg(settle * 0.9), ry: deg(Math.sin(phase * 0.4) * 1.4) },
        left_arm: {
          rx: deg(Math.sin(phase + 0.35) * roll),
          rz: deg(Math.sin(phase * 0.8) * 1.6),
        },
        right_arm: {
          rx: deg(Math.sin(phase + 0.9) * roll * 0.6),
          rz: deg(-1 - Math.sin(phase * 0.8) * 1.1),
        },
        weapon: {
          rz: deg(Math.sin(phase + 1.1) * club),
          rx: deg(Math.sin(phase + 0.4) * 0.8),
        },
        left_leg: { rz: deg(settle * 0.25) },
        right_leg: { rz: deg(-settle * 0.25) },
        dhoti: { rz: deg(Math.sin(phase * 0.7) * 0.9) },
      },
    };
  },
};

const walk: ClipDefinition = {
  id: 'walk',
  name: 'Stomping Walk',
  frames: 36,
  fps: 20,
  loop: true,
  params: {
    stompStrideDeg: params('Stomp Stride', 26, 8, 50, 0.5),
    stompBounce: params('Body Drop', 0.5, 0, 1.2, 0.01),
    armSwingDeg: params('Arm Swing', 16, 0, 40, 0.5),
    clubDragDeg: params('Gada Drag', 5, 0, 18, 0.5),
  },
  evaluate: (frame, totalFrames, values) => {
    const t = frame / Math.max(1, totalFrames);
    const stride = param(values, 'stompStrideDeg', 26);
    const bounce = param(values, 'stompBounce', 0.5);
    const armSwing = param(values, 'armSwingDeg', 16);
    const clubDrag = param(values, 'clubDragDeg', 5);
    const phase = t * TAU;
    const sin = Math.sin(phase);
    const cos = Math.cos(phase);
    const leftStride = sin * stride;
    const rightStride = -sin * stride;
    const bodyDrop = -Math.abs(sin) * bounce;
    const stomp = Math.max(0, -cos);

    return {
      parts: {
        torso: {
          ty: bodyDrop,
          rx: deg(3.5 + Math.abs(sin) * 1.2),
          ry: deg(-sin * 4),
          rz: deg(sin * 3),
        },
        head: {
          ry: deg(sin * 5),
          rx: deg(-Math.abs(sin) * 1.8),
          rz: deg(sin * -2),
        },
        jaw: { rx: deg(Math.abs(sin) * 2.4) },
        crown: { rz: deg(sin * -1.4), rx: deg(stomp * 0.8) },
        left_leg: { rx: deg(leftStride) },
        right_leg: { rx: deg(rightStride) },
        left_arm: {
          rx: deg(-leftStride * (armSwing / Math.max(1, stride))),
          rz: deg(sin * 2),
        },
        right_arm: {
          rx: deg(-rightStride * (armSwing / Math.max(1, stride)) * 0.45),
          rz: deg(-2 + sin * 1.4),
        },
        weapon: {
          rx: deg(Math.sin(phase + 0.7) * clubDrag),
          rz: deg(Math.sin(phase + 1.2) * 2),
        },
        dhoti: {
          rz: deg(-sin * 4),
          rx: deg(Math.abs(sin) * 1.8),
        },
      },
    };
  },
};

const smash: ClipDefinition = {
  id: 'smash',
  name: 'Crushing Overhead Smash',
  frames: 40,
  fps: 22,
  loop: false,
  params: {
    windupPct: params('Wind-up Window', 0.34, 0.15, 0.55, 0.01),
    slamPct: params('Slam Window', 0.54, 0.38, 0.78, 0.01),
    torsoLeanDeg: params('Impact Lean', 10, 0, 28, 0.5),
    shockwaveRadius: params('Shockwave Radius', 10, 3, 22, 0.5),
    slashScale: params('Slash Scale', 1.45, 0.5, 2.5, 0.05),
  },
  evaluate: (frame, totalFrames, values) => {
    const t = clamp(frame / Math.max(1, totalFrames - 1));
    const windup = param(values, 'windupPct', 0.34);
    const slam = Math.max(windup + 0.08, param(values, 'slamPct', 0.54));
    const lean = param(values, 'torsoLeanDeg', 10);
    const radius = param(values, 'shockwaveRadius', 10);
    const slashScale = param(values, 'slashScale', 1.45);

    let armAngle: number;
    let torsoLean: number;
    let drop = 0;

    if (t <= windup) {
      const u = easeInOut(t / Math.max(0.01, windup));
      armAngle = lerp(0, -166, u);
      torsoLean = lerp(0, -7, u);
      drop = -u * 0.25;
    } else if (t <= slam) {
      const u = easeOut((t - windup) / Math.max(0.01, slam - windup));
      armAngle = lerp(-166, -12, u);
      torsoLean = lerp(-7, lean, u);
      drop = -0.25 - Math.sin(u * Math.PI) * 0.45;
    } else {
      const u = easeInOut((t - slam) / Math.max(0.01, 1 - slam));
      armAngle = lerp(-12, 0, u);
      torsoLean = lerp(lean, 0, u);
      drop = lerp(-0.7, 0, u);
    }

    const slashProgress = clamp((t - (slam - 0.1)) / 0.22);
    const slashActive = t >= slam - 0.1 && t <= slam + 0.12;
    const shockProgress = clamp((t - slam) / 0.38);
    const shockActive = t >= slam && t <= slam + 0.38;

    return {
      parts: {
        torso: {
          ty: drop,
          rx: deg(torsoLean),
          rz: deg(Math.sin(t * Math.PI) * -1.5),
        },
        head: {
          rx: deg(torsoLean * -0.25 - 2),
          ry: deg(Math.sin(t * Math.PI * 2) * 2),
        },
        jaw: { rx: deg(t < slam ? 5 : 2) },
        crown: {
          rx: deg(torsoLean * 0.18),
          rz: deg(Math.sin(t * Math.PI * 3) * 1.8),
        },
        right_arm: {
          rx: deg(armAngle),
          rz: deg(lerp(-2, 8, t < slam ? t / Math.max(0.01, slam) : 0)),
        },
        left_arm: {
          rx: deg(torsoLean * 1.1),
          rz: deg(-4 - Math.sin(t * Math.PI) * 10),
        },
        weapon: {
          rx: deg(t < windup ? -4 : t < slam ? 3 : -2),
          rz: deg(lerp(0, 8, t < slam ? t / Math.max(0.01, slam) : 1)),
        },
        left_leg: { rx: deg(torsoLean * -0.2), rz: deg(-2) },
        right_leg: { rx: deg(torsoLean * 0.2), rz: deg(2) },
        dhoti: {
          rx: deg(Math.abs(torsoLean) * 0.35),
          rz: deg(Math.sin(t * Math.PI * 2) * 2),
        },
      },
      vfx: [
        ...(slashActive
          ? spawnSlashArcVoxels(
              [-6, 5, 8],
              Math.PI * 0.5,
              slashProgress,
              slashScale,
            )
          : []),
        ...(shockActive
          ? spawnShockwaveRingVoxels([-6, 0.6, 8], radius, shockProgress, 1.1)
          : []),
      ],
    };
  },
};

const death: ClipDefinition = {
  id: 'death',
  name: 'Voxel Shatter Death',
  frames: 56,
  fps: 18,
  loop: false,
  params: {
    popForce: params('Pop Force', 9, 2, 18, 0.2),
    tumbleSpin: params('Tumble Spin', 3, 0.5, 6, 0.1),
    gravity: params('Fall Gravity', 1.7, 0.7, 3, 0.05),
    smokeAmount: params('Smoke Amount', 1.1, 0, 2.5, 0.05),
  },
  evaluate: (frame, totalFrames, values) => {
    const result = voxelShatterDeath(frame, totalFrames, values);
    const t = clamp(frame / Math.max(1, totalFrames));

    return {
      parts: {
        ...result.parts,
        crown: {
          tx: Math.sin(t * Math.PI * 3) * 1.8,
          ty: t * t * 4,
          tz: Math.cos(t * Math.PI * 2) * 1.4,
          rx: deg(t * 520),
          ry: deg(t * 280),
          rz: deg(t * 160),
        },
        jaw: {
          rx: deg(t * 38),
          ty: -t * 0.8,
          rz: deg(Math.sin(t * Math.PI) * 5),
        },
        dhoti: {
          ty: -t * 1.4,
          rz: deg(t * 12),
          scale: 1 + t * 0.05,
        },
      },
      vfx: result.vfx,
    };
  },
};

export const burmeseBilu: VoxelUnitDefinition = {
  id: 'burmese-bilu',
  name: 'Burmese Bilu',
  category: 'character',
  palette,
  parts: biluParts,
  animations: [idle, walk, smash, death],
};
