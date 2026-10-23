# Contributing to Open-Voxel

Thanks for helping improve Open-Voxel. This project is a local-first, agent-native studio for authoring rigged voxel units, deterministic animation, VFX, and transparent sprite sheets from TypeScript.

Contributions are welcome from artists, game developers, tooling engineers, and coding-agent enthusiasts. You do not need to be a voxel artist to help: documentation, bug reports, workflow improvements, and new deterministic effects are all valuable.

## Code of Conduct

Be respectful, constructive, and specific. Assume good intent, critique the work rather than the person, and help keep discussions useful for everyone. Harassment, discrimination, and hostile behavior are not welcome.

## Ways to Contribute

- Report bugs with a clear reproduction and expected behavior.
- Suggest focused features or workflow improvements.
- Improve documentation, setup instructions, and agent skills.
- Fix UI, rendering, export, or source-editing bugs.
- Add new deterministic voxel units or VFX generators.
- Improve accessibility, keyboard navigation, and light/dark theme coverage.
- Review pull requests and test changes in both themes.

For large features or architectural changes, open an issue first so the approach can be discussed before significant work is done.

## Development Setup

Open-Voxel requires Node.js 20 or newer.

```bash
git clone <your-fork-url>
cd open-voxel
npm install
npm run dev
```

Open the local URL printed by Vite. The development server also exposes the filesystem-backed `/api/*` routes used for saving tuned parameters, deleting units, and storing frame comments.

Useful commands:

```bash
npm run dev        # local studio + filesystem API
npm run typecheck  # TypeScript only
npm run build      # typecheck + production bundle
npm run preview    # static production preview; /api routes are unavailable
```

For code-only changes, one `npm run typecheck` or `npm run build` pass is usually enough. Start the development server when you need to verify visual behavior, interactions, or source-editing APIs.

## Project Principles

These rules are non-negotiable because they keep generated assets reproducible and the studio agent-friendly:

1. **No painted assets.** Geometry, animation, and effects come from code.
2. **Deterministic output.** Do not use `Math.random()`, wall-clock time, or mutable global state inside clip evaluation or VFX generation. Use frame progress and seeded helpers.
3. **Stable IDs.** Part IDs, clip IDs, unit IDs, and comment IDs are referenced by animation code, URLs, source edits, and exported atlases. Rename only with a deliberate migration.
4. **Absolute pivots.** Authored voxel coordinates and part pivots are both absolute model-space. `VoxelSceneRig` converts to parent-relative positions internally.
5. **No Python or ImageMagick sprite tooling.** Sprite capture belongs to `VoxelSpriteRenderer`.
6. **No secrets.** Do not commit API keys, tokens, local paths containing private data, or other credentials.
7. **Respect the source editor.** Keep unit files, parameter values, registry imports, and comment annotations in the shapes expected by the Vite AST editor.

## Project Layout

```text
src/engine/        Voxel builders, animation presets, VFX, Three.js rig, sprite renderer
src/units/         Registered unit definitions, one folder per unit
src/components/    Dashboard, studio, inspection, timeline, modal, and export UI
src/types/         Shared TypeScript contracts
src/utils/         Small shared utilities and API clients
.agents/skills/    Canonical agent skills
.claude/skills/    Mirrored skills for Claude Code
.opencode/skills/  Mirrored skills for OpenCode
vite.config.ts     Vite setup plus the development filesystem API
```

## Contributing a Unit

New units live at `src/units/<unit-id>/unit.ts` and must be registered in `src/units/index.ts`.

Follow the `create-voxel-unit` skill for the full workflow. If you are using an agent, invoke:

```text
/create-voxel-unit <unit-slug> "<category>: <art-direction-and-animations>"
```

Custom categories are encouraged. The internal `VoxelUnitDefinition.category` field remains `character`, `artillery`, or `prop`, so map flexible prompt categories to the closest structural archetype while preserving the intended subject in the geometry and naming.

Before opening a unit PR:

- Register the unit exactly once.
- Ensure every part ID referenced by a clip exists.
- Keep pivots at physical joints and use absolute model-space coordinates.
- Expose meaningful tunable parameters through the Inspector.
- Include `idle`, locomotion or action, attack/fire, and `death` clips when they fit the subject.
- Use seeded VFX only.
- Run `npm run typecheck`.

## Contributing VFX

Reusable effects belong in `src/engine/voxelVfx.ts`; unit-specific one-offs may live near the unit only when reuse is unlikely. Effects should accept progress in `[0, 1]`, use seeded randomness, fade cleanly, and return no particles after completion. Add a catalog entry in `src/engine/vfxCatalog.ts` when an effect should appear in the VFX Library.

## Agent Skills

The skill files are mirrored in three locations:

```text
.agents/skills/
.claude/skills/
.opencode/skills/
```

When changing a skill, update all three copies so Claude Code, OpenCode, and other agent workflows stay consistent. Verify the files are identical before submitting a PR:

```bash
diff .agents/skills/create-voxel-unit/SKILL.md .claude/skills/create-voxel-unit/SKILL.md
diff .agents/skills/create-voxel-unit/SKILL.md .opencode/skills/create-voxel-unit/SKILL.md
```

## Code Style

- Use TypeScript and follow the existing React, Three.js, and CSS conventions.
- Keep components small and reuse the existing design tokens in `src/index.css` and `tailwind.config.js`.
- Use `lucide-react` icons and the existing button, field, chip, and panel styles.
- Support both light and dark themes; avoid hard-coded colors when a CSS variable exists.
- Prefer deterministic helpers over ad-hoc animation math.
- Avoid new dependencies unless they clearly justify their footprint. Discuss larger additions in an issue first.
- Keep UI copy concise and useful. The dashboard and studio use a dense, minimal desktop aesthetic.

## Verification

At minimum, run:

```bash
npm run typecheck
```

For release-style changes, run:

```bash
npm run build
```

If your change affects layout, animation, rendering, or modal behavior, verify it in the browser with `npm run dev` and check both themes. There is no automated test suite yet; if you add one, keep it focused and document the command in the README and `package.json`.

## Commits and Pull Requests

1. Fork the repository and create a focused branch.
2. Keep commits scoped to one logical change.
3. Write commit messages that explain what changed and why.
4. Rebase or merge the latest default branch before opening the PR.
5. Open a pull request with:
   - A concise summary of the change.
   - The problem it solves.
   - How you verified it.
   - Screenshots or a short recording for visible UI changes.
   - Any follow-up work or known limitations.

Do not commit `node_modules/`, `dist/`, local editor state, or secrets. Keep generated output out of pull requests.

## Pull Request Checklist

- [ ] The change follows the project principles above.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes for release-style changes.
- [ ] Light and dark themes were checked for visible UI changes.
- [ ] New units are registered and their clips reference valid part IDs.
- [ ] New VFX are deterministic and seeded.
- [ ] Skill changes are mirrored across all three skill directories.
- [ ] Documentation is updated when behavior or workflow changes.
- [ ] No secrets, generated bundles, or unrelated files are included.

## Reporting Bugs

Include:

- What you expected to happen.
- What actually happened.
- Steps to reproduce, with a specific unit, clip, frame, and browser if relevant.
- Console errors or server logs.
- Whether the issue occurs in the development server or a production preview.

## License

By contributing, you agree that your contributions are licensed under the MIT License. See `LICENSE.md`.
