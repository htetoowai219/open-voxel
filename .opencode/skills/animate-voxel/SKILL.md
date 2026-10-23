---
name: animate-voxel
description: Add or refine deterministic animation clips for an existing Open-Voxel unit, including loops, action timing, tunable params, and clip-attached VFX.
---

# Animate a Voxel Unit

Use this skill when the user asks to add, change, or polish an animation on an existing Open-Voxel unit.

## Goal

Produce deterministic, readable motion that evaluates correctly at every frame, uses stable part IDs, exposes useful tuning params, and typechecks.

## First Read

1. `src/types/voxel.ts`
2. `src/engine/animationPresets.ts`
3. `src/engine/voxelScene.ts` (how transforms are applied)
4. The target `src/units/<unit-id>/unit.ts`
5. A starter unit for reference if the target is new.

Do not change the rig or renderer unless the animation genuinely requires it.

## Animation Contract

Each clip evaluates from frame number and params:

```ts
evaluate: (frame, totalFrames, params) => ({
  parts: {
    torso: { rx: 0, ry: 0.3, rz: 0, tx: 0, ty: 0.2, tz: 0, scale: 1, visible: true },
  },
  vfx: [],
})
```

- `frame` is zero-based.
- Rotations are **radians**.
- Use `deg(value)` for readable authoring.
- Translations are in voxel units.
- Transforms are deltas from the authored rest pose.
- Parent motion carries children automatically.
- Parts omitted from `result.parts` reset to their default transform for that frame.
- `visible: false` hides a part for that frame.
- VFX is optional.

## Workflow

### 1. Inspect the unit

Identify:

- Part IDs and hierarchy.
- Existing pivots.
- Which parts carry which children.
- Existing clip IDs, frame counts, FPS, and params.
- Whether the requested clip already exists.

Keep all existing clip IDs unless the user explicitly asks to rename them.

### 2. Choose timing

Recommended baselines:

- Idle: 48–72 frames, 20–24 FPS, loop.
- Walk/run: 24–36 frames, 24 FPS, loop.
- Melee attack: 24–36 frames, 24 FPS, non-loop.
- Ranged fire: 30–48 frames, 24 FPS, non-loop.
- Death/break: 40–60 frames, 18–20 FPS, non-loop.

Action timing structure:

1. Anticipation / wind-up.
2. Fast action / impact.
3. Follow-through / recovery.
4. Settle or loop closure.

Do not use one linear interpolation across the whole action; it reads as mechanical.

### 3. Reuse the shared motion helpers

From `src/engine/animationPresets.ts`:

- `humanoidIdle(frame, totalFrames, params)`
- `humanoidWalk(frame, totalFrames, params)`
- `meleeSlash(frame, totalFrames, params)`
- `artilleryFire(frame, totalFrames, params)`
- `voxelShatterDeath(frame, totalFrames, params)`

Math helpers:

- `deg`, `clamp`, `lerp`, `easeInOut`, `easeOut`
- `param(params, key, fallback)`
- `mergeTransforms(...groups)`
- `mergeVfx(...groups)`

If the preset is close, wrap it and add unit-specific motion. If it is wrong, write a dedicated evaluate function while keeping the same output contract.

### 4. Expose tuning params

Only expose numbers that a human would plausibly tune:

```ts
params: {
  strideDeg: { label: 'Leg Stride', value: 30, min: 0, max: 60, step: 0.5 },
  bounce: { label: 'Torso Bounce', value: 0.34, min: 0, max: 1.2, step: 0.01 },
}
```

Rules:

- `value` must be a numeric literal so the Studio can rewrite it.
- All params must have sensible min/max/step values.
- Read params with `param(params, 'key', fallback)` or nullish fallback.
- Keep names stable; comments and save operations are not the only consumers.

### 5. Keep loops seamless

For looping clips:

- Evaluate phase as `frame / totalFrames`, not `frame / (totalFrames - 1)`, when the end frame should equal the start.
- Match the pose and velocity at wrap.
- Avoid a sudden reset in a secondary motion.
- Do not set `loop: true` on a one-shot death or attack.

For non-looping clips:

- Allow the last frames to settle.
- Avoid a hard snap back to rest unless it is intentional.

### 6. Add clip VFX if needed

Use deterministic generators from `src/engine/voxelVfx.ts`:

```ts
import { spawnSlashArcVoxels } from '../../engine/voxelVfx';

const t = frame / Math.max(1, totalFrames);
const active = t > 0.33 && t < 0.78;
const local = active ? (t - 0.33) / 0.45 : 0;

return {
  parts: base.parts,
  vfx: active ? spawnSlashArcVoxels([0, 19, 6], -Math.PI * 0.18, local, 1.15) : [],
};
```

- Use local progress for the effect window.
- Return no particles outside the window.
- Use fixed seeds.
- Never use `Math.random()` or wall-clock time.

### 7. Verify

Run:

```bash
npm run typecheck
```

If the browser is already running, the user can inspect the result. Do not start a dev server or screenshot loop unless explicitly requested.

## Pitfalls

- Rotating a child around the wrong point usually means the pivot is wrong, not the animation.
- Adding motion to both a parent and child can double the intended movement.
- Mixing degrees into `rx/ry/rz` without conversion produces broken poses.
- A loop that includes both frame 0 and frame N as identical poses can stutter; keep the endpoint convention consistent with the existing unit.
- Hiding a parent hides its children.
- Do not reference a part ID that does not exist.
- Do not change frame counts without checking comments pinned to frames.

## Done Criteria

- Clip IDs are stable and registered in the unit definition.
- Frames/FPS/loop values are deliberate.
- Motion is deterministic and readable.
- Tuning params are numeric literals.
- VFX windows are local, seeded, and fade correctly.
- `npm run typecheck` passes.
