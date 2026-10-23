import type { VoxelUnitDefinition } from '../types/voxel';
import { armoredKnight } from './armored-knight/unit';
import { burmeseBilu } from './burmese-bilu/unit';
import { burmeseZawgyi } from './burmese-zawgyi/unit';
import { siegeCannon } from './siege-cannon/unit';

export const unitRegistry: VoxelUnitDefinition[] = [
  armoredKnight,
  siegeCannon,
  burmeseBilu,
  burmeseZawgyi,
];

export function getUnitDefinition(id: string): VoxelUnitDefinition | undefined {
  return unitRegistry.find((unit) => unit.id === id);
}

export function getClip(
  unit: VoxelUnitDefinition,
  clipId: string | null | undefined,
): VoxelUnitDefinition['animations'][number] {
  return unit.animations.find((clip) => clip.id === clipId) ?? unit.animations[0];
}

export function defaultClipParams(
  clip: VoxelUnitDefinition['animations'][number],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, schema] of Object.entries(clip.params ?? {})) {
    result[key] = schema.value;
  }
  return result;
}

export function allDefaultParams(
  unit: VoxelUnitDefinition,
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const clip of unit.animations) {
    result[clip.id] = defaultClipParams(clip);
  }
  return result;
}
