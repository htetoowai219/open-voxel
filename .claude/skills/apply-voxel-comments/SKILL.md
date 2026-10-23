---
name: apply-voxel-comments
description: Resolve pinned Open-Voxel frame comments in a unit source file, update animation code, remove handled annotations, and leave unresolved notes intact.
---

# Apply Voxel Comments

Use this skill when the user runs `/apply-voxel-comments <unit-id>` or asks to resolve frame comments from the Open-Voxel studio.

## Goal

Read the pinned annotations in `src/units/<unit-id>/unit.ts`, make the requested animation or geometry changes, remove only the comments that were actually handled, and keep the project typechecking cleanly.

## Comment Format

The Studio appends one annotation per line, usually near the bottom of the unit file:

```ts
// @voxel-comment {"id":"vc_m...","unitId":"armored-knight","clipId":"walk","frame":12,"partId":"left_leg","text":"Lift the knee higher","createdAt":"2026-..."}
```

Fields:

- `id` — unique annotation ID.
- `unitId` — must match the unit being edited.
- `clipId` — animation clip to change.
- `frame` — zero-based frame number.
- `partId` — optional target part.
- `text` — the requested change.
- `createdAt` — ISO timestamp.

## Workflow

### 1. Read the unit

Open:

- `src/units/<unit-id>/unit.ts`
- `src/types/voxel.ts`
- `src/engine/animationPresets.ts` if math or presets are involved.
- `src/engine/voxelBuilder.ts` if geometry is involved.
- `src/engine/voxelVfx.ts` if effects are involved.

Extract every `// @voxel-comment` line for this unit. Ignore annotations whose `unitId` does not match.

### 2. Group and interpret

Group comments by:

1. `clipId`
2. `frame`
3. `partId`

For each note:

- Locate the clip by ID.
- Locate the part by ID if present.
- Inspect the evaluate function at the requested frame.
- Determine whether the request is about pose, timing, geometry, visibility, or VFX.
- If two notes conflict, prefer the more specific and more recent note, and leave a clear unresolved note if you cannot satisfy both.

Frame numbers are zero-based. The Studio displays frame 1 for `frame: 0`.

### 3. Make focused edits

- Adjust the animation math or params for that clip.
- Change geometry only if the note requires it.
- Keep part and clip IDs stable.
- Keep motion deterministic; do not add `Math.random()` or wall-clock time.
- Do not rewrite unrelated clips.
- If a note asks for a param, update the default `value` and keep min/max/step valid.
- If a note asks for an effect change, use the existing VFX helpers or add a deterministic generator.
- If a note asks for a pivot or hierarchy fix, verify that both the pivot and child relationships still make sense.

### 4. Remove resolved annotations

Delete only the exact comment lines you addressed.

- Preserve formatting elsewhere.
- Do not remove unresolved annotations.
- Do not remove annotations for other units or other clips unless they were also handled.
- If an annotation is malformed JSON, leave it in place and report it.
- If a comment asks for something you chose not to do, explain why in your response and leave the annotation.

### 5. Verify

Run:

```bash
npm run typecheck
```

Fix errors introduced by the edits. If the change is large, also run:

```bash
npm run build
```

Do not launch a dev server or screenshot loop unless the user explicitly asks.

### 6. Report

Summarize:

- Which comments were resolved.
- Which files changed.
- Which comments remain and why.
- The verification command and result.

## Safety Rules

- Never delete or rewrite the whole unit file to remove comments.
- Never remove a comment you did not address.
- Never change a clip's frame count without checking all remaining frame comments for that clip.
- Never use destructive shell commands on the unit folder.
- Preserve deterministic animation and VFX.
- Keep source edits compatible with the AST-based Studio API.

## Done Criteria

- Every handled annotation is gone.
- Every unhandled annotation remains.
- Requested motion is visible at the specified frame.
- Part/clip IDs remain valid.
- `npm run typecheck` passes.
