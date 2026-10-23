import type { VoxelVfxParticle } from '../types/voxel';
import {
  spawnElectricArcsVoxels,
  spawnMuzzleBlastVoxels,
  spawnShockwaveRingVoxels,
  spawnSlashArcVoxels,
  spawnSmokeCloudVoxels,
} from './voxelVfx';

export interface VfxCatalogEntry {
  id: string;
  name: string;
  functionName: string;
  description: string;
  accent: string;
  spawn: (progress: number, seed: number) => VoxelVfxParticle[];
}

export const VFX_CATALOG: VfxCatalogEntry[] = [
  {
    id: 'muzzle-blast',
    name: 'Muzzle Blast',
    functionName: 'spawnMuzzleBlastVoxels',
    description: 'A hot cone of deterministic voxel sparks and flash cubes punched along a firing direction.',
    accent: '#f59e0b',
    spawn: (progress, seed) =>
      spawnMuzzleBlastVoxels([0, 5, 0], [0, 0, 1], progress, seed, 1.15),
  },
  {
    id: 'smoke-cloud',
    name: 'Powder Smoke',
    functionName: 'spawnSmokeCloudVoxels',
    description: 'Seeded smoke puffs that rise, expand, drift, and dissipate without any painted frames.',
    accent: '#a1a1aa',
    spawn: (progress, seed) => spawnSmokeCloudVoxels([0, 3, 0], progress, seed, 1.2),
  },
  {
    id: 'slash-arc',
    name: 'Slash Arc',
    functionName: 'spawnSlashArcVoxels',
    description: 'A sweeping crescent of gold and white voxels tracing a fast melee cleave.',
    accent: '#fbbf24',
    spawn: (progress) => spawnSlashArcVoxels([0, 5, 0], Math.PI * 0.15, progress, 1.05),
  },
  {
    id: 'shockwave-ring',
    name: 'Shockwave Ring',
    functionName: 'spawnShockwaveRingVoxels',
    description: 'A crisp radial ground ring driven by shell impact, recoil, and area-damage events.',
    accent: '#f97316',
    spawn: (progress) => spawnShockwaveRingVoxels([0, 0.2, 0], 7, progress, 1),
  },
  {
    id: 'electric-arcs',
    name: 'Electric Arcs',
    functionName: 'spawnElectricArcsVoxels',
    description: 'Four jagged blue lightning branches with deterministic seeded jitter and flicker.',
    accent: '#60a5fa',
    spawn: (progress, seed) => spawnElectricArcsVoxels([0, 5, 0], progress, seed, 1.1),
  },
];
