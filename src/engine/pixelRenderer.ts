import * as THREE from 'three';
import type {
  CameraDirection,
  CameraPitch,
  SpriteFrameMeta,
  SpriteRenderOptions,
  VoxelAnimationClip,
  VoxelUnitDefinition,
} from '../types/voxel';
import { VoxelSceneRig } from './voxelScene';

export const COMPASS_DIRECTIONS: CameraDirection[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
export const CARDINAL_DIRECTIONS: CameraDirection[] = ['S', 'W', 'N', 'E'];

export const PITCH_OPTIONS: Array<{ id: CameraPitch; label: string; short: string }> = [
  { id: 'isometric', label: 'Isometric (30°)', short: 'ISO 30' },
  { id: 'oblique', label: 'TD Top-Down Oblique (45°)', short: 'TD 45' },
  { id: 'side', label: 'Side-View (0°)', short: 'SIDE 0' },
];

function yawForDirection(direction: CameraDirection): number {
  const map: Record<CameraDirection, number> = {
    S: 0,
    SW: -45,
    W: -90,
    NW: -135,
    N: 180,
    NE: 135,
    E: 90,
    SE: 45,
  };
  return (map[direction] * Math.PI) / 180;
}

function pitchForCamera(pitch: CameraPitch): number {
  if (pitch === 'oblique') return (45 * Math.PI) / 180;
  if (pitch === 'side') return 0;
  return (30 * Math.PI) / 180;
}

function addOutline(
  image: ImageData,
  thickness: number,
  outlineColor: [number, number, number],
): ImageData {
  const { width, height, data } = image;
  const source = new Uint8ClampedArray(data);
  const alphaAt = (x: number, y: number): number => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;
    return source[(y * width + x) * 4 + 3];
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (source[offset + 3] > 24) continue;
      let adjacent = false;
      for (let radius = 1; radius <= thickness && !adjacent; radius += 1) {
        adjacent =
          alphaAt(x - radius, y) > 24 ||
          alphaAt(x + radius, y) > 24 ||
          alphaAt(x, y - radius) > 24 ||
          alphaAt(x, y + radius) > 24 ||
          alphaAt(x - radius, y - radius) > 24 ||
          alphaAt(x + radius, y - radius) > 24 ||
          alphaAt(x - radius, y + radius) > 24 ||
          alphaAt(x + radius, y + radius) > 24;
      }
      if (!adjacent) continue;
      data[offset] = outlineColor[0];
      data[offset + 1] = outlineColor[1];
      data[offset + 2] = outlineColor[2];
      data[offset + 3] = 255;
    }
  }
  return image;
}

function crispPixelAlpha(image: ImageData): ImageData {
  for (let index = 3; index < image.data.length; index += 4) {
    image.data[index] = image.data[index] > 88 ? 255 : 0;
  }
  return image;
}

export class VoxelSpriteRenderer {
  readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly glRenderer: THREE.WebGLRenderer;
  private rig: VoxelSceneRig | null = null;
  private unitId: string | null = null;
  private camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 500);
  private currentSize = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 64;
    this.canvas.height = 64;
    const context = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('A 2D canvas context is required to render sprites.');
    this.context = context;
    this.glRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    });
    this.glRenderer.setPixelRatio(1);
    this.glRenderer.setClearColor(0x000000, 0);
    this.glRenderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  private ensureUnit(unit: VoxelUnitDefinition): void {
    if (this.unitId === unit.id && this.rig) return;
    this.rig?.dispose();
    this.rig = new VoxelSceneRig(unit, { mode: 'toon' });
    this.unitId = unit.id;
  }

  private updateCamera(rig: VoxelSceneRig, options: SpriteRenderOptions): void {
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    rig.bounds.getSize(size);
    rig.bounds.getCenter(center);
    const maxSpan = Math.max(size.x, size.y, size.z);
    const half = Math.max(7, maxSpan * 0.72 + 2.5);
    this.camera.left = -half;
    this.camera.right = half;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.near = 0.1;
    this.camera.far = 1000;

    const yaw = yawForDirection(options.direction);
    const elevation = pitchForCamera(options.pitch);
    const distance = Math.max(80, maxSpan * 4.5);
    const direction = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(elevation),
      Math.sin(elevation),
      Math.cos(yaw) * Math.cos(elevation),
    ).normalize();
    this.camera.position.copy(center).addScaledVector(direction, distance);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();
  }

  render(
    unit: VoxelUnitDefinition,
    clip: VoxelAnimationClip,
    params: Record<string, number>,
    frame: number,
    options: SpriteRenderOptions,
    visibility: Record<string, boolean> = {},
  ): HTMLCanvasElement {
    this.ensureUnit(unit);
    const rig = this.rig;
    if (!rig) return this.canvas;

    if (this.currentSize !== options.size) {
      this.currentSize = options.size;
      this.canvas.width = options.size;
      this.canvas.height = options.size;
      this.glRenderer.setSize(options.size, options.size, false);
    }

    rig.apply(clip, frame, params, visibility);
    this.updateCamera(rig, options);
    this.glRenderer.render(rig.scene, this.camera);
    this.context.clearRect(0, 0, options.size, options.size);
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(this.glRenderer.domElement, 0, 0, options.size, options.size);

    let image = this.context.getImageData(0, 0, options.size, options.size);
    if (options.pixelated) image = crispPixelAlpha(image);
    if (options.outline) {
      image = addOutline(image, options.outlineThickness ?? (options.pixelated ? 1 : 2), [30, 20, 10]);
    }
    this.context.putImageData(image, 0, 0);
    return this.canvas;
  }

  dispose(): void {
    this.rig?.dispose();
    this.rig = null;
    this.glRenderer.dispose();
    this.glRenderer.forceContextLoss();
  }
}

export interface SheetExportOptions {
  clips: VoxelAnimationClip[];
  paramsByClip: Record<string, Record<string, number>>;
  directions: CameraDirection[];
  pitch: CameraPitch;
  size: number;
  pixelated: boolean;
  outline: boolean;
  visibility?: Record<string, boolean>;
}

export interface SheetFrameRecord {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
  pivot: { x: number; y: number };
}

export interface SheetMetadata {
  frames: Record<string, SheetFrameRecord>;
  meta: {
    app: string;
    version: string;
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: string;
    unit: string;
    category: string;
    pitch: CameraPitch;
    directions: CameraDirection[];
    clips: Array<{ id: string; name: string; frames: number; fps: number; loop: boolean }>;
    animations: Record<string, string[]>;
  };
}

export interface SpriteSheetResult {
  canvas: HTMLCanvasElement;
  metadata: SheetMetadata;
  frames: SpriteFrameMeta[];
}

export async function renderSpriteSheet(
  unit: VoxelUnitDefinition,
  options: SheetExportOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<SpriteSheetResult> {
  const renderer = new VoxelSpriteRenderer();
  const maxFrames = Math.max(...options.clips.map((clip) => clip.frames), 1);
  const rows = options.clips.length * options.directions.length;
  const sheet = document.createElement('canvas');
  sheet.width = maxFrames * options.size;
  sheet.height = Math.max(rows, 1) * options.size;
  const context = sheet.getContext('2d');
  if (!context) {
    renderer.dispose();
    throw new Error('Could not create the sprite sheet canvas.');
  }

  const framesRecord: Record<string, SheetFrameRecord> = {};
  const frameList: SpriteFrameMeta[] = [];
  const animations: Record<string, string[]> = {};
  const total = options.clips.reduce(
    (sum, clip) => sum + clip.frames * options.directions.length,
    0,
  );
  let done = 0;
  let row = 0;

  try {
    for (const clip of options.clips) {
      const params = options.paramsByClip[clip.id] ?? {};
      for (const direction of options.directions) {
        const animationName = `${clip.id}_${direction}`;
        animations[animationName] = [];
        for (let frame = 0; frame < clip.frames; frame += 1) {
          const rendered = renderer.render(
            unit,
            clip,
            params,
            frame,
            {
              size: options.size,
              pitch: options.pitch,
              direction,
              outline: options.outline,
              pixelated: options.pixelated,
              outlineThickness: options.pixelated ? 1 : 2,
            },
            options.visibility ?? {},
          );
          const frameName = `${animationName}_${String(frame).padStart(3, '0')}`;
          const x = frame * options.size;
          const y = row * options.size;
          context.imageSmoothingEnabled = false;
          context.drawImage(rendered, x, y);
          framesRecord[frameName] = {
            frame: { x, y, w: options.size, h: options.size },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w: options.size, h: options.size },
            sourceSize: { w: options.size, h: options.size },
            pivot: { x: 0.5, y: 0.98 },
          };
          frameList.push({
            name: frameName,
            clipId: clip.id,
            clipName: clip.name,
            direction,
            frame,
            x,
            y,
            w: options.size,
            h: options.size,
          });
          animations[animationName].push(frameName);
          done += 1;
          onProgress?.(done, total);
          if (done % 4 === 0) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          }
        }
        row += 1;
      }
    }
  } finally {
    renderer.dispose();
  }

  return {
    canvas: sheet,
    frames: frameList,
    metadata: {
      frames: framesRecord,
      meta: {
        app: 'Open-Voxel',
        version: '1.0',
        image: `${unit.id}_sheet.png`,
        format: 'RGBA8888',
        size: { w: sheet.width, h: sheet.height },
        scale: '1',
        unit: unit.id,
        category: unit.category,
        pitch: options.pitch,
        directions: options.directions,
        clips: options.clips.map((clip) => ({
          id: clip.id,
          name: clip.name,
          frames: clip.frames,
          fps: clip.fps,
          loop: clip.loop,
        })),
        animations,
      },
    },
  };
}
