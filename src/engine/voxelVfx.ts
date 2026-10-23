import type { VoxelVector3, VoxelVfxParticle } from '../types/voxel';

const TAU = Math.PI * 2;

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed: number | string): number {
  if (typeof seed === 'number') return Math.floor(seed * 1_000_003) + 1;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalize(vector: VoxelVector3): VoxelVector3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

export function spawnMuzzleBlastVoxels(
  origin: VoxelVector3,
  direction: VoxelVector3,
  progress: number,
  seed: number | string = 1,
  scale = 1,
): VoxelVfxParticle[] {
  const p = clamp01(progress);
  if (p >= 0.999) return [];
  const random = mulberry32(hashSeed(seed));
  const [dx, dy, dz] = normalize(direction);
  const particles: VoxelVfxParticle[] = [];
  const count = 38;
  const flash = Math.sin(Math.min(1, p * 1.7) * Math.PI);
  const colors = ['#fff7c2', '#ffe066', '#ffb703', '#fb8500', '#ff4d1c'];

  for (let index = 0; index < count; index += 1) {
    const spread = 0.2 + p * 4.2 * scale;
    const distance = p * (8 + random() * 8) * scale;
    const width = (random() - 0.5) * spread;
    const height = (random() - 0.5) * spread * 0.75;
    particles.push({
      x: origin[0] + dx * distance + width,
      y: origin[1] + dy * distance + height + (random() - 0.5) * 0.5,
      z: origin[2] + dz * distance + width * 0.35,
      size: (0.32 + random() * 0.75) * scale * (0.7 + flash * 0.8),
      color: colors[Math.floor(random() * colors.length)],
      opacity: (1 - p) * 0.95,
      rx: random() * TAU,
      ry: random() * TAU,
      rz: random() * TAU,
    });
  }
  return particles;
}

export function spawnSmokeCloudVoxels(
  origin: VoxelVector3,
  progress: number,
  seed: number | string = 2,
  scale = 1,
): VoxelVfxParticle[] {
  const p = clamp01(progress);
  const random = mulberry32(hashSeed(seed));
  const particles: VoxelVfxParticle[] = [];
  const colors = ['#f3f4f6', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b'];
  const count = 32;

  for (let index = 0; index < count; index += 1) {
    const angle = random() * TAU;
    const radius = (0.6 + random() * 2.4) * (0.25 + p * 1.5) * scale;
    const turbulence = Math.sin(p * 9 + random() * 8) * 0.4;
    particles.push({
      x: origin[0] + Math.cos(angle) * radius + turbulence,
      y: origin[1] + p * (4.8 + random() * 3.2) * scale + random() * 0.7,
      z: origin[2] + Math.sin(angle) * radius + turbulence * 0.5,
      size: (0.45 + random() * 1.05) * scale * (0.7 + p * 0.8),
      color: colors[Math.floor(random() * colors.length)],
      opacity: Math.sin(Math.min(1, p * 1.2) * Math.PI) * 0.66,
      rx: random() * TAU,
      ry: random() * TAU,
      rz: random() * TAU,
    });
  }
  return particles;
}

export function spawnSlashArcVoxels(
  origin: VoxelVector3,
  angle: number,
  progress: number,
  scale = 1,
): VoxelVfxParticle[] {
  const p = clamp01(progress);
  if (p >= 0.999) return [];
  const particles: VoxelVfxParticle[] = [];
  const arc = Math.PI * 1.15;
  const count = 46;
  const colors = ['#ffffff', '#fef3c7', '#fde68a', '#fbbf24', '#f59e0b'];
  const sweep = Math.min(1, p * 2.2);

  for (let index = 0; index < count; index += 1) {
    const ratio = index / Math.max(1, count - 1);
    if (ratio > sweep) continue;
    const theta = angle - arc / 2 + ratio * arc;
    const radius = (3.2 + Math.sin(ratio * Math.PI) * 2.4) * scale;
    particles.push({
      x: origin[0] + Math.cos(theta) * radius,
      y: origin[1] + Math.sin(ratio * Math.PI) * 2.2 * scale - p * 0.9,
      z: origin[2] + Math.sin(theta) * radius,
      size: (0.18 + (1 - p) * 0.5) * scale,
      color: colors[Math.min(colors.length - 1, Math.floor(((1 - p) * ratio + 0.15) * colors.length))],
      opacity: (1 - p) * 0.96,
      rx: theta,
      ry: theta * 0.4,
      rz: ratio * TAU,
    });
  }
  return particles;
}

export function spawnShockwaveRingVoxels(
  origin: VoxelVector3,
  radius: number,
  progress: number,
  scale = 1,
): VoxelVfxParticle[] {
  const p = clamp01(progress);
  if (p >= 0.999) return [];
  const particles: VoxelVfxParticle[] = [];
  const count = 56;
  const eased = 1 - Math.pow(1 - p, 3);
  const currentRadius = radius * eased * scale;

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * TAU;
    const jitter = Math.sin(index * 12.9898 + p * 9) * 0.35;
    particles.push({
      x: origin[0] + Math.cos(angle) * (currentRadius + jitter),
      y: Math.max(0.15, origin[1] + 0.3 + Math.sin(angle * 3) * 0.12),
      z: origin[2] + Math.sin(angle) * (currentRadius + jitter),
      size: (0.36 + (1 - p) * 0.55) * scale,
      color: index % 3 === 0 ? '#fef3c7' : index % 3 === 1 ? '#fbbf24' : '#f59e0b',
      opacity: (1 - p) * 0.82,
      rx: angle,
      ry: angle * 1.7,
      rz: 0,
    });
  }
  return particles;
}

export function spawnElectricArcsVoxels(
  origin: VoxelVector3,
  progress: number,
  seed: number | string = 4,
  scale = 1,
): VoxelVfxParticle[] {
  const p = clamp01(progress);
  if (p >= 0.999) return [];
  const random = mulberry32(hashSeed(seed));
  const particles: VoxelVfxParticle[] = [];
  const arcs = 4;
  const steps = 12;
  const colors = ['#ffffff', '#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6'];

  for (let arcIndex = 0; arcIndex < arcs; arcIndex += 1) {
    const angle = random() * TAU;
    const length = (5 + random() * 7) * scale;
    const yBias = (random() - 0.5) * 3;
    for (let step = 0; step < steps; step += 1) {
      const ratio = step / (steps - 1);
      const jitter = Math.sin(step * 4.7 + arcIndex) * 0.65 + (random() - 0.5) * 0.7;
      particles.push({
        x: origin[0] + Math.cos(angle) * length * ratio + jitter,
        y: origin[1] + yBias * ratio + Math.sin(ratio * Math.PI) * 2.2 + jitter * 0.4,
        z: origin[2] + Math.sin(angle) * length * ratio + jitter * 0.8,
        size: (0.14 + (1 - p) * 0.26) * scale,
        color: colors[Math.min(colors.length - 1, Math.floor(random() * colors.length))],
        opacity: (1 - p) * 0.95,
        rx: ratio * 7,
        ry: ratio * 4,
        rz: random() * TAU,
      });
    }
  }
  return particles;
}
