# Open-Voxel — Agent Guide

## What This Project Is

Open-Voxel is a local React + Three.js studio. Units, animations, and VFX are authored as TypeScript source. The app renders them live, exposes parameter tuning, captures deterministic 2D sprites, and exports PNG + JSON atlases in the browser.

## Commands

```bash
npm install
npm run dev        # local studio + filesystem API
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production bundle
npm run preview    # static preview; /api routes are not available
```

Do not start a development server or take screenshots as part of routine code verification unless the user explicitly asks. Prefer one typecheck/build pass after a coherent change.

## Non-Negotiable Rules

1. **No painted assets.** Geometry, animation, and effects come from code.
2. **Deterministic output.** Never use `Math.random()`, current time, or mutable global state inside clip evaluation or VFX generation. Use frame progress and seeded helpers.
3. **Stable IDs.** Part IDs and clip IDs are referenced by animation results, comments, URLs, and source-editing APIs. Rename only with a deliberate migration.
4. **Absolute pivots.** Authored voxel positions and pivots are both absolute model-space. `VoxelSceneRig` converts to parent-relative positions internally.
5. **No Python/ImageMagick sprite tooling.** Sprite capture is done by `VoxelSpriteRenderer`.
6. **Do not commit or print secrets.** There should be none in this project.

## Architecture

- `src/types/voxel.ts` — shared type contracts.
- `src/engine/voxelBuilder.ts` — builders and voxel math.
- `src/engine/animationPresets.ts` — reusable motions, easing, transform merging.
- `src/engine/voxelVfx.ts` — seeded deterministic particle generators.
- `src/engine/vfxCatalog.ts` — metadata for the VFX Library.
- `src/engine/voxelScene.ts` — Three.js rig. One rig powers the 3D stage and the orthographic capture.
- `src/engine/pixelRenderer.ts` — transparent 2D rendering, alpha threshold, ink outline, sheet packing, atlas metadata.
- `src/engine/renderStyles.ts` — 64/96/128 pixel and 256 cel styles.
- `src/units/index.ts` — static import registry. Every new unit must be imported and added to `unitRegistry`.
- `src/components/` — dashboard and studio UI.
- `vite.config.ts` — Vite app config plus the development filesystem API.

## Unit Authoring Contract

A unit file exports a `VoxelUnitDefinition`:

```ts
import type { VoxelUnitDefinition } from '../../types/voxel';
import { part } from '../../engine/voxelBuilder';

export const exampleUnit: VoxelUnitDefinition = {
  id: 'example-unit',
  name: 'Example Unit',
  category: 'character',
  palette: { base: '#778394' },
  parts: [
    part('torso', 'Torso', [0, 16, 0])
      .fillBox(-3, 14, -2, 3, 22, 2, '#778394')
      .end(),
  ],
  animations: [
    {
      id: 'idle',
      name: 'Idle',
      frames: 32,
      fps: 24,
      loop: true,
      params: {},
      evaluate: () => ({ parts: {} }),
    },
  ],
};
```

Register it in `src/units/index.ts`:

```ts
import { exampleUnit } from './example-unit/unit';

export const unitRegistry: VoxelUnitDefinition[] = [
  armoredKnight,
  siegeCannon,
  exampleUnit,
];
```

### Pivots

Place pivots at physical joints:

- Head at neck.
- Arms at shoulders.
- Legs at hips.
- Cape at the shoulder/back attachment.
- Weapon at the grip.
- Barrel at the trunnion.

Child parts are nested under their parent group. Parent rotations carry children automatically. Do not bake inherited motion into child clips.

### Part Naming

Recommended hierarchy for humanoids:

```text
torso
  head
  left_arm -> shield
  right_arm -> weapon
  left_leg
  right_leg
  cape
```

For artillery:

```text
pedestal
  carriage
    left_wheel
    right_wheel
    barrel
  gunner
    gunner_head
```

## Animation Contract

`evaluate(frame, totalFrames, params)` returns `parts` transforms and optional `vfx` particles.

- All rotations are radians. Use `deg()`.
- Translation is in voxel units.
- `frame` is zero-based.
- Keep loops seamless: evaluate frame `N` as a wrap, or avoid end-state discontinuity.
- Non-looping clips should settle at a readable final pose.
- Expose meaningful numbers through `params` so the Inspector can tune them.
- `params` entries use `{ label, value, min, max, step }`.
- Use `param(params, 'key', fallback)` to read with a safe default.
- Use preset helpers when they fit; copy and specialize when they do not.

## VFX Contract

- Add generators to `src/engine/voxelVfx.ts` unless the effect is specific to one unit.
- Use a seeded PRNG; the existing `mulberry32` + `hashSeed` pattern is preferred.
- Accept `progress` in `[0, 1]`, a seed (when randomness matters), and a scale.
- Return `VoxelVfxParticle[]`.
- Fade opacity near the end and return `[]` at completion when appropriate.
- Add a `VFX_CATALOG` entry if the effect should appear on the dashboard.
- Attach effects from a clip's `evaluate` by returning `vfx`.

## Sprite Export Contract

- The exported image must have transparent background.
- Keep the same rig used by the 3D stage; do not fork rendering behavior.
- Pixel styles use nearest-neighbor capture and a crisp alpha threshold.
- 256px cel style keeps smooth edges and a 2px ink outline.
- Atlas metadata must include frame rects, pivots, clip/direction metadata, and named animation arrays.
- Export selection supports current/all clips and current/cardinal/all-8 directions.

## Comments Workflow

Comments are stored near the bottom of a unit file:

```ts
// @voxel-comment {"id":"vc_abc","unitId":"armored-knight","clipId":"walk","frame":12,"partId":"left_leg","text":"Lift the knee higher","createdAt":"..."}
```

When applying comments:

1. Read all annotations for the requested unit.
2. Group by `clipId` and frame.
3. Edit animation code.
4. Remove resolved annotations.
5. Run `npm run typecheck`.

Do not delete annotations that were not addressed.

## Runtime API

The Vite plugin in `vite.config.ts` performs source edits:

- Save param values.
- Delete a part object.
- Delete a unit folder and registry entry.
- Append/read comments.

Keep your changes compatible with AST-based source edits:

- Param `value` fields should remain numeric literals.
- Parts should remain object literals inside the `parts` array.
- Registry imports should stay in the standard one-import-per-unit form.
- Comments must remain single-line JSON annotations.

## UI Conventions

- Minimal open-slide aesthetic: hairline borders, restrained shadows, clear hierarchy.
- Use the CSS variables and Tailwind aliases in `src/index.css` / `tailwind.config.js`.
- Use `lucide-react` icons. Sizes are typically 11–15px in dense chrome.
- Preserve readable 12–14px text; avoid decorative microcopy overload.
- Dark and light themes must both work.
- No brown/coffee color language in the interface.

## Verification

After a coherent change:

```bash
npm run typecheck
```

For a release-style check:

```bash
npm run build
```

Do not add new test frameworks unless explicitly requested.
