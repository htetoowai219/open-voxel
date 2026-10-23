import type {
  ClipParams,
  PartTransform,
  VoxelAnimationResult,
  VoxelVfxParticle,
} from '../types/voxel';
import { spawnSmokeCloudVoxels } from './voxelVfx';

export const TAU = Math.PI * 2;

export function deg(value: number): number {
  return (value * Math.PI) / 180;
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeInOut(t: number): number {
  const x = clamp(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

export function easeOut(t: number): number {
  const x = clamp(t);
  return 1 - Math.pow(1 - x, 3);
}

export function param(params: ClipParams, key: string, fallback: number): number {
  const value = params[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function mergeTransforms(
  ...groups: Array<Record<string, PartTransform> | undefined>
): Record<string, PartTransform> {
  const merged: Record<string, PartTransform> = {};
  for (const group of groups) {
    if (!group) continue;
    for (const [partId, transform] of Object.entries(group)) {
      merged[partId] = { ...merged[partId], ...transform };
    }
  }
  return merged;
}

export function mergeVfx(...groups: Array<VoxelVfxParticle[] | undefined>): VoxelVfxParticle[] {
  return groups.flatMap((group) => group ?? []);
}

export function humanoidIdle(
  frame: number,
  totalFrames: number,
  params: ClipParams,
): VoxelAnimationResult {
  const t = frame / Math.max(1, totalFrames);
  const speed = param(params, 'breathSpeed', 1.1);
  const amount = param(params, 'breathAmount', 0.22);
  const headTilt = param(params, 'headTiltDeg', 2.4);
  const armSway = param(params, 'armSwayDeg', 1.8);
  const phase = t * TAU * speed;
  const breath = Math.sin(phase);
  const sway = Math.sin(phase + 0.6);

  return {
    parts: {
      torso: {
        ty: breath * amount,
        rx: deg(Math.sin(phase + 0.7) * 0.35),
        rz: deg(Math.sin(phase * 0.5) * 0.35),
      },
      head: {
        ry: deg(Math.sin(phase * 0.55) * headTilt * 1.4),
        rz: deg(Math.sin(phase + 0.2) * headTilt),
        rx: deg(Math.cos(phase * 0.7) * 0.8),
      },
      left_arm: {
        rx: deg(sway * armSway),
        rz: deg(Math.sin(phase * 0.8) * 0.7),
      },
      right_arm: {
        rx: deg(-sway * armSway * 0.85),
        rz: deg(Math.sin(phase * 0.8 + 1) * 0.7),
      },
      cape: {
        rx: deg(2 + Math.sin(phase + 0.3) * 1.2),
        rz: deg(Math.sin(phase * 0.7) * 1.4),
      },
      shield: {
        rz: deg(Math.sin(phase * 0.6) * 0.8),
      },
    },
  };
}

export function humanoidWalk(
  frame: number,
  totalFrames: number,
  params: ClipParams,
): VoxelAnimationResult {
  const t = frame / Math.max(1, totalFrames);
  const stride = param(params, 'walkStrideDeg', 30);
  const armSwing = param(params, 'walkArmSwingDeg', 22);
  const bounce = param(params, 'walkBounce', 0.34);
  const lean = param(params, 'walkLeanDeg', 3.2);
  const phase = t * TAU;
  const sin = Math.sin(phase);
  const leftStride = sin * stride;
  const rightStride = -sin * stride;
  const verticalBounce = Math.abs(Math.sin(phase * 2)) * bounce;

  return {
    parts: {
      left_leg: { rx: deg(leftStride) },
      right_leg: { rx: deg(rightStride) },
      left_arm: { rx: deg(-leftStride * (armSwing / Math.max(1, stride))) },
      right_arm: { rx: deg(-rightStride * (armSwing / Math.max(1, stride))) },
      torso: {
        ty: verticalBounce,
        rx: deg(lean),
        rz: deg(Math.sin(phase) * 1.4),
      },
      head: {
        ry: deg(Math.sin(phase) * 1.2),
        rz: deg(Math.sin(phase) * -1.1),
      },
      cape: {
        rx: deg(6 + Math.abs(sin) * 5),
        rz: deg(-sin * 3),
      },
      shield: {
        rz: deg(-sin * 2),
      },
    },
  };
}

export function meleeSlash(
  frame: number,
  totalFrames: number,
  params: ClipParams,
): VoxelAnimationResult {
  const t = clamp(frame / Math.max(1, totalFrames));
  const twist = param(params, 'torsoTwistDeg', 28);
  const armSwing = param(params, 'armSwingDeg', 132);
  const windup = param(params, 'windupPct', 0.34);
  const strike = param(params, 'strikePct', 0.58);
  const anticipation = clamp(t / Math.max(0.05, windup));
  const cleave = clamp((t - windup) / Math.max(0.05, strike - windup));
  const recovery = clamp((t - strike) / Math.max(0.05, 1 - strike));

  let armAngle: number;
  let torsoAngle: number;
  let bodyDrop = 0;
  if (t <= windup) {
    armAngle = lerp(0, -58, easeInOut(anticipation));
    torsoAngle = lerp(0, -twist, easeInOut(anticipation));
  } else if (t <= strike) {
    armAngle = lerp(-58, -armSwing, easeOut(cleave));
    torsoAngle = lerp(-twist, twist, easeOut(cleave));
    bodyDrop = Math.sin(cleave * Math.PI) * 0.4;
  } else {
    armAngle = lerp(-armSwing, 0, easeInOut(recovery));
    torsoAngle = lerp(twist, 0, easeInOut(recovery));
  }

  return {
    parts: {
      torso: {
        ry: deg(torsoAngle),
        rz: deg(torsoAngle * 0.12),
        ty: -bodyDrop,
      },
      head: {
        ry: deg(torsoAngle * 0.45),
        rx: deg(Math.sin(t * Math.PI) * 3),
      },
      right_arm: {
        rx: deg(armAngle),
        rz: deg(armAngle * -0.12),
      },
      left_arm: {
        rx: deg(torsoAngle * 0.55),
        rz: deg(-torsoAngle * 0.3),
      },
      left_leg: { rz: deg(torsoAngle * -0.16) },
      right_leg: { rz: deg(torsoAngle * -0.16) },
      cape: {
        rz: deg(torsoAngle * -0.7),
        rx: deg(Math.abs(torsoAngle) * 0.18),
      },
    },
  };
}

export function artilleryFire(
  frame: number,
  totalFrames: number,
  params: ClipParams,
): VoxelAnimationResult {
  const t = clamp(frame / Math.max(1, totalFrames));
  const recoil = param(params, 'recoilDistance', 2.8);
  const kickback = param(params, 'recoilKick', 1.9);
  const settle = param(params, 'settleSpeed', 2.4);
  const flashWindow = clamp((t - 0.06) / 0.9);
  const impulse = t < 0.13 ? easeOut(t / 0.13) : Math.exp(-(t - 0.13) * settle * 4);
  const bounce = Math.sin(flashWindow * Math.PI * 3) * Math.exp(-flashWindow * 4);

  return {
    parts: {
      barrel: {
        tz: -recoil * impulse,
        rx: deg(-4.5 * impulse + bounce * 1.8),
        ry: deg(Math.sin(t * TAU * 1.5) * 0.8 * (1 - t)),
      },
      carriage: {
        tz: -kickback * impulse * 0.42,
        ty: -bounce * 0.22,
        rx: deg(impulse * 2.5),
      },
      left_wheel: { rx: deg(impulse * 10) },
      right_wheel: { rx: deg(impulse * 10) },
      gunner: {
        rx: deg(impulse * 8),
        ty: impulse * 0.25,
      },
      gunner_head: {
        rx: deg(-impulse * 5),
      },
    },
  };
}

const DEATH_PART_SEEDS: Record<string, number> = {
  head: 0.12,
  torso: 0.77,
  left_arm: 0.31,
  right_arm: 0.56,
  left_leg: 0.84,
  right_leg: 0.2,
  shield: 0.66,
  weapon: 0.42,
  cape: 0.9,
};

const DEATH_PIVOT_HEIGHTS: Record<string, number> = {
  head: 27,
  torso: 16,
  left_arm: 21,
  right_arm: 21,
  left_leg: 13,
  right_leg: 13,
  shield: 16,
  weapon: 14,
  cape: 20,
};

export function voxelShatterDeath(
  frame: number,
  totalFrames: number,
  params: ClipParams,
): VoxelAnimationResult {
  const t = clamp(frame / Math.max(1, totalFrames));
  const popForce = param(params, 'popForce', 8);
  const spin = param(params, 'tumbleSpin', 2.8);
  const gravity = param(params, 'gravity', 1.6);
  const smoke = param(params, 'smokeAmount', 1);
  const parts: Record<string, PartTransform> = {};

  for (const [partId, seed] of Object.entries(DEATH_PART_SEEDS)) {
    const delay = ((seed * 13) % 1) * 0.12;
    const u = clamp((t - delay) / Math.max(0.18, 1 - delay));
    const horizontalAngle = seed * TAU;
    const drift = (0.8 + seed * 3.5) * u;
    const lift = Math.sin(Math.min(1, u * 1.35) * Math.PI) * popForce;
    const fall = Math.pow(u, gravity) * (DEATH_PIVOT_HEIGHTS[partId] ?? 14);
    parts[partId] = {
      tx: Math.cos(horizontalAngle) * drift,
      tz: Math.sin(horizontalAngle) * drift,
      ty: lift - fall,
      rx: deg(seed * 180 + u * 360 * spin),
      ry: deg(seed * 90 + u * 210 * spin),
      rz: deg(seed * 330 + u * 300 * spin * 0.6),
      scale: u > 0.93 ? 0.94 + (1 - u) * 0.6 : 1,
    };
  }

  const vfx =
    smoke > 0
      ? spawnSmokeCloudVoxels([0, 10, 0], clamp(t * 1.4), 11, Math.max(0.2, smoke))
      : [];

  return { parts, vfx };
}
