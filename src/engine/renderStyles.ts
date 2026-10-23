import type { SpriteStyleId } from '../types/voxel';

export interface SpriteStyleOption {
  id: SpriteStyleId;
  label: string;
  short: string;
  size: number;
  pixelated: boolean;
  description: string;
}

export const SPRITE_STYLES: SpriteStyleOption[] = [
  {
    id: 'pixel64',
    label: 'Pixel Art (64px)',
    short: '64 PX',
    size: 64,
    pixelated: true,
    description: 'Low-res pixel buffer, crisp nearest-neighbor edges, 3-step toon light, 1px ink silhouette.',
  },
  {
    id: 'pixel96',
    label: 'Pixel Art (96px)',
    short: '96 PX',
    size: 96,
    pixelated: true,
    description: 'Extra pixel detail for mobile and mid-size game sprites with a 1px ink silhouette.',
  },
  {
    id: 'pixel128',
    label: 'Pixel Art (128px)',
    short: '128 PX',
    size: 128,
    pixelated: true,
    description: 'High-detail pixel art framing for hero units, bosses, and large VFX moments.',
  },
  {
    id: 'cel256',
    label: 'Cel-Shaded Hi-Res (256px)',
    short: 'CEL 256',
    size: 256,
    pixelated: false,
    description: 'Smooth orthographic cel shading with a bold 2px ink outline on a transparent field.',
  },
];

export function getSpriteStyle(id: SpriteStyleId): SpriteStyleOption {
  return SPRITE_STYLES.find((style) => style.id === id) ?? SPRITE_STYLES[0];
}
