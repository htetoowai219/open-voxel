export type VoxelVector3 = [number, number, number];

export interface Voxel {
  x: number;
  y: number;
  z: number;
  color: string;
}

export interface VoxelPart {
  id: string;
  name: string;
  parentId?: string;
  pivot: VoxelVector3;
  voxels: Voxel[];
}

export interface PartTransform {
  rx?: number;
  ry?: number;
  rz?: number;
  tx?: number;
  ty?: number;
  tz?: number;
  scale?: number;
  visible?: boolean;
}

export interface ClipParamSchema {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
}

export type ClipParams = Record<string, number>;

export interface VoxelVfxParticle {
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

export interface VoxelAnimationResult {
  parts: Record<string, PartTransform>;
  vfx?: VoxelVfxParticle[];
}

export interface VoxelAnimationClip {
  id: string;
  name: string;
  frames: number;
  fps: number;
  loop: boolean;
  params?: Record<string, ClipParamSchema>;
  evaluate: (
    frame: number,
    totalFrames: number,
    params: Record<string, number>,
  ) => VoxelAnimationResult;
}

export type VoxelUnitCategory = 'character' | 'artillery' | 'prop';

export interface VoxelUnitDefinition {
  id: string;
  name: string;
  category: VoxelUnitCategory;
  palette: Record<string, string>;
  parts: VoxelPart[];
  animations: VoxelAnimationClip[];
}

export interface VoxelComment {
  id: string;
  unitId: string;
  clipId: string;
  frame: number;
  partId?: string;
  text: string;
  createdAt: string;
}

export type CameraPitch = 'isometric' | 'oblique' | 'side';
export type CameraDirection = 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' | 'E' | 'SE';
export type SpriteStyleId = 'pixel64' | 'pixel96' | 'pixel128' | 'cel256';

export interface SpriteRenderOptions {
  size: number;
  pitch: CameraPitch;
  direction: CameraDirection;
  outline: boolean;
  pixelated: boolean;
  outlineThickness?: number;
}

export interface SpriteFrameMeta {
  name: string;
  clipId: string;
  clipName: string;
  direction: CameraDirection;
  frame: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
