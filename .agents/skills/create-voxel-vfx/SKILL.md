---
name: create-voxel-vfx
description: Add deterministic voxel VFX to Open-Voxel, including seeded particle generators, catalog entries, and attachment to unit animation clips.
---

# Create Voxel VFX

Use this skill when the user asks for a new effect such as a muzzle flash, smoke plume, slash trail, shockwave, lightning, impact burst, dust, magic flare, or other voxel particle effect.

## Goal

Add a reproducible effect function, expose it in the VFX Library when appropriate, attach it to an animation when requested, and keep all output deterministic.

## First Read

1. `src/types/voxel.ts`
2. `src/engine/voxelVfx.ts`
3. `src/engine/vfxCatalog.ts`
4. `src/components/VfxPreview.tsx`
5. The target unit file, if attaching to a clip.

## Core Contract

A VFX generator returns `VoxelVfxParticle[]`:

```ts
interface VoxelVfxParticle {
  x: number;
  y: number;
  z: number;
  color: string;
  size?: number;
  opacity?: number;
  rx?: number;
  ry?: number;
  rz?: number;
}
```

Conventions:

- `progress` is clamped to `[0, 1]`.
- Return `[]` at or beyond completion when the effect should end.
- Particle positions are model-space coordinates.
- `size` is a uniform cube scale.
- `opacity` drives scale to zero below `0.02` in the shared rig.
- Rotations are radians.
- Keep the count at or below the rig's 900-particle cap.
- Prefer 24–64 particles for continuous effects and 32–80 for a one-shot burst.

## Determinism Rules

- Never use `Math.random()`.
- Never read `Date.now()` or other wall-clock values.
- Use the existing seeded PRNG pattern:

```ts
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
```

- Hash string seeds with the existing `hashSeed` helper.
- The same progress and seed must always produce the same particles.

## Add the Generator

Put reusable effects in `src/engine/voxelVfx.ts`.

```ts
export function spawnMyBurstVoxels(
  origin: VoxelVector3,
  progress: number,
  seed: number | string = 9,
  scale = 1,
): VoxelVfxParticle[] {
  const p = clamp01(progress);
  if (p >= 0.999) return [];
  const random = mulberry32(hashSeed(seed));
  const particles: VoxelVfxParticle[] = [];
  const colors = ['#ffffff', '#fef3c7', '#fbbf24', '#f59e0b'];
  const count = 40;

  for (let index = 0; index < count; index += 1) {
    const angle = random() * TAU;
    const radius = (0.4 + random() * 2.4) * p * scale;
    particles.push({
      x: origin[0] + Math.cos(angle) * radius,
      y: origin[1] + p * (2 + random() * 4) * scale,
      z: origin[2] + Math.sin(angle) * radius,
      size: (0.18 + random() * 0.42) * scale * (1 - p * 0.35),
      color: colors[Math.floor(random() * colors.length)],
      opacity: (1 - p) * 0.92,
      rx: random() * TAU,
      ry: random() * TAU,
      rz: random() * TAU,
    });
  }
  return particles;
}
```

Design checks:

- Motion should read at both 96px and 256px sprite sizes.
- Use a small, coherent palette.
- Avoid particles at the exact same position unless it is intentional.
- Fade opacity before completion.
- Do not exceed the particle cap.

## Add a Catalog Entry

If the effect should appear on the dashboard, add it to `src/engine/vfxCatalog.ts`:

```ts
{
  id: 'my-burst',
  name: 'My Burst',
  functionName: 'spawnMyBurstVoxels',
  description: 'A short deterministic description of the motion and palette.',
  accent: '#f59e0b',
  spawn: (progress, seed) => spawnMyBurstVoxels([0, 5, 0], progress, seed, 1.1),
}
```

- Keep `id` lowercase kebab-case and unique.
- `functionName` must match the export exactly.
- `accent` is a single representative color.
- Catalog `spawn` must be deterministic.

## Attach to a Unit Clip

Inside `evaluate`:

```ts
const t = frame / Math.max(1, totalFrames);
const start = 0.1;
const end = 0.72;
const active = t >= start && t < end;
const local = active ? (t - start) / (end - start) : 0;

return {
  parts: base.parts,
  vfx: active
    ? spawnMyBurstVoxels([0, 10, 18], local, 7, values.blastScale ?? 1.1)
    : [],
};
```

Rules:

- Use local progress, not total clip progress, so the effect completes inside its window.
- Position the origin where the action actually happens.
- Match the effect direction to the action direction.
- Expose a scale param only when it is useful to tune.
- Do not change part transforms from the VFX function.

## Verify

Run:

```bash
npm run typecheck
```

If a renderer change was made, also run `npm run build`. Do not start a dev server for routine verification unless the user asks.

## Pitfalls

- Unseeded randomness makes exported sprites unreproducible.
- A continuous effect that never returns `[]` can linger at the end of a clip.
- Particles below the ground plane are acceptable only for intentional debris.
- Do not use enormous particle counts; the rig renders at most 900 per scene.
- Do not mutate particles after creation.

## Done Criteria

- The generator is deterministic and typed.
- It fades and terminates correctly.
- Catalog metadata is present when expected.
- Clip attachment uses local progress.
- `npm run typecheck` passes.
