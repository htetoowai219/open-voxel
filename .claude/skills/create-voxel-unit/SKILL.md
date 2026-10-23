---
name: create-voxel-unit
description: Create and register a new rigged voxel unit in Open-Voxel, including parts, pivots, palette, animation clips, and optional VFX.
---

# Create a Voxel Unit

Use this skill when the user asks for a new character, creature, mob, flyer, beast, artillery piece, tower, vehicle, boat, building, structure, prop, or other rigged voxel unit in Open-Voxel.

## Goal

Add a complete, deterministic unit under `src/units/<unit-id>/unit.ts`, register it in `src/units/index.ts`, and leave the project typechecking cleanly.

## First Read

Read these files before writing geometry:

1. `src/types/voxel.ts`
2. `src/engine/voxelBuilder.ts`
3. `src/engine/animationPresets.ts`
4. `src/engine/voxelVfx.ts`
5. `src/units/armored-knight/unit.ts`
6. `src/units/siege-cannon/unit.ts`
7. `src/units/index.ts`

Use the starter units as the style reference. Do not invent a second architecture.

## Command Parsing

The onboarding UI and agents invoke:

```text
/create-voxel-unit <unit-slug> "<category>: <art-direction-and-animations>"
```

Treat `<category>` as free-form. Accept the preset categories and custom values, including flyers, beasts, structures, vehicles, boats, hybrids, and categories that do not exist yet. Never reject the request or ask a follow-up just because the category is outside the UI presets.

Parse the arguments as follows:

- `<unit-slug>` becomes the stable kebab-case `id`. Normalize spaces and punctuation; do not invent a different ID unless the requested one is invalid.
- The first colon separates the free-form `category` from the art direction and animation details.
- If there is no colon, treat the entire quoted argument as art direction and infer the category from the description.
- If the category is omitted, use `Custom Unit` as the prompt label and infer the structural archetype from the description.

The internal `VoxelUnitDefinition.category` schema remains a closed union: `character`, `artillery`, or `prop`. Map flexible prompt categories to it:

- `character`: humanoids, creatures, monsters, beasts, robots, and living or self-animating flyers.
- `artillery`: weapon platforms, towers, turrets, siege engines, combat vehicles or boats, and flying combat machines.
- `prop`: buildings, structures, environmental objects, non-combat vehicles or boats, and decorative props.

When a category is ambiguous, infer from the dominant subject and intended motion: a self-animating actor is usually `character`, a weapon platform is usually `artillery`, and a static environment object is usually `prop`. Preserve the user's specific category in the unit name or a source comment when it adds useful context; never write an invalid value into `category`.

## Workflow

### 1. Define the unit

Choose:

- `id`: derive it from `<unit-slug>` as lowercase kebab-case; keep it stable and unique.
- `name`: readable display name that reflects the requested category and subject.
- `category`: map the free-form prompt category to `character`, `artillery`, or `prop` using the rules above.
- A tightly limited palette with 7–16 named colors.
- A parts hierarchy with pivots at physical joints. Adapt the hierarchy to the subject: wings and tail for flyers, wheel axles and carriage for vehicles, roof and footprint for structures.
- 3–5 clips. A normal set is `idle`, a locomotion or action clip, an attack/fire clip, and `death`. Props may use `idle` and `break`. Honor animation names or motions supplied in the art direction.
- VFX when the art direction calls for a spell, projectile, fire, impact, or other effect.

If the user gives no direction, make a coherent visual choice rather than asking a follow-up question. If the category is custom, choose the closest physical rig and do not flatten it into a generic humanoid.

### 2. Author parts

Create the file:

```text
src/units/<unit-id>/unit.ts
```

Use `part()` and the builder API:

```ts
import type { ClipParamSchema, VoxelUnitDefinition } from '../../types/voxel';
import { fillBox, part, translateVoxels, extrudePattern } from '../../engine/voxelBuilder';

const palette = {
  base: '#778394',
  shadow: '#3b4452',
  accent: '#d6a84a',
};

const torso = part('torso', 'Torso', [0, 16, 0])
  .fillBox(-3, 14, -2, 3, 22, 2, palette.base)
  .fillBox(-4, 14, -2, 4, 15, 2, palette.shadow)
  .end();

const head = part('head', 'Head', [0, 26, 0], 'torso')
  .fillBox(-3, 26, -3, 3, 30, 3, palette.base)
  .setVoxel(-2, 28, 4, palette.accent)
  .setVoxel(2, 28, 4, palette.accent)
  .end();
```

Rules:

- All voxel coordinates and pivots are absolute model-space.
- Put pivots at shoulders, hips, neck, grips, wheel axles, or barrel trunnions.
- Children are nested by `parentId`; parent motion carries children.
- Do not add per-voxel hierarchy offsets manually.
- Keep the silhouette readable from the south/front view (`+Z` is front).
- Use a consistent palette; avoid colors outside the unit palette object.
- Add deliberate asymmetry only where it helps the silhouette.

Recommended humanoid hierarchy:

```text
torso
  head
  left_arm -> shield (optional)
  right_arm -> weapon (optional)
  left_leg
  right_leg
  cape (optional)
```

Recommended artillery hierarchy:

```text
pedestal
  carriage
    left_wheel
    right_wheel
    barrel
  gunner
    gunner_head
```

### 3. Author clips

Every animation has this shape:

```ts
interface VoxelAnimationClip {
  id: string;
  name: string;
  frames: number;
  fps: number;
  loop: boolean;
  params?: Record<string, { label: string; value: number; min: number; max: number; step?: number }>;
  evaluate: (frame: number, totalFrames: number, params: Record<string, number>) => {
    parts: Record<string, {
      rx?: number; ry?: number; rz?: number;
      tx?: number; ty?: number; tz?: number;
      scale?: number; visible?: boolean;
    }>;
    vfx?: VoxelVfxParticle[];
  };
}
```

Use radians for all rotations. Prefer the shared helpers from `animationPresets.ts`:

- `humanoidIdle`, `humanoidWalk`, `meleeSlash`, `artilleryFire`, `voxelShatterDeath`
- `deg`, `clamp`, `lerp`, `easeInOut`, `easeOut`, `param`
- `mergeTransforms`, `mergeVfx`

Expose meaningful numeric controls through `params`. Do not expose every constant.

```ts
const params = (
  label: string,
  value: number,
  min: number,
  max: number,
  step = 0.1,
): ClipParamSchema => ({ label, value, min, max, step });

const idle: VoxelUnitDefinition['animations'][number] = {
  id: 'idle',
  name: 'Idle',
  frames: 48,
  fps: 24,
  loop: true,
  params: {
    breathSpeed: params('Breath Speed', 1.1, 0.2, 3, 0.05),
    breathAmount: params('Breath Lift', 0.22, 0, 1, 0.01),
  },
  evaluate: (frame, totalFrames, values) => humanoidIdle(frame, totalFrames, values),
};
```

Clip requirements:

- `idle` should have subtle overlapping motion, not a static pose.
- `walk` should feel like a loop with alternating limbs and a small body bounce.
- `attack` / `fire` should use anticipation, a fast action, and recovery. Non-looping.
- `death` should fall or break apart and settle. Non-looping.
- Loops must not visibly pop at the wrap point.
- Keep a readable final pose for non-looping clips.

### 4. Add VFX when the action needs it

Import a generator and attach particles from `evaluate`:

```ts
import { spawnSlashArcVoxels } from '../../engine/voxelVfx';

const progress = frame / Math.max(1, totalFrames);
const active = progress > 0.33 && progress < 0.78;
const local = active ? (progress - 0.33) / 0.45 : 0;

return {
  parts: base.parts,
  vfx: active ? spawnSlashArcVoxels([0, 19, 6], -Math.PI * 0.18, local, 1.15) : [],
};
```

Never use `Math.random()` or wall-clock time. Use progress and optional integer seeds.

### 5. Export the definition and register it

At the bottom of the unit file:

```ts
export const myUnit: VoxelUnitDefinition = {
  id: 'my-unit',
  name: 'My Unit',
  category: 'character',
  palette,
  parts: [...],
  animations: [idle, walk, attack, death],
};
```

Edit `src/units/index.ts`:

```ts
import { myUnit } from './my-unit/unit';

export const unitRegistry: VoxelUnitDefinition[] = [
  armoredKnight,
  siegeCannon,
  myUnit,
];
```

Keep the import style and registry shape recognizable to the Vite AST editor.

### 6. Verify

Run:

```bash
npm run typecheck
```

Fix all errors. Do not run a dev server or browser screenshot loop unless the user asks.

## Pitfalls

- A child pivot must be absolute, not relative to the parent pivot.
- `scale` is a uniform scalar.
- `visible: false` hides a part without deleting it.
- Do not duplicate part IDs.
- Do not rely on render order for geometry correctness.
- Do not let limbs intersect the torso at rest.
- Do not place a shield or weapon in unrelated world space; check its absolute coordinates against the arm.
- Do not add external libraries for geometry.

## Done Criteria

- Unit file exists and exports one `VoxelUnitDefinition`.
- Unit is registered exactly once.
- All part IDs referenced by clips exist.
- All clips have stable IDs and valid frame counts/FPS.
- No non-deterministic values in evaluation.
- `npm run typecheck` passes.
