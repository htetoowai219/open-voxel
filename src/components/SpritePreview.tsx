import { useEffect, useRef } from 'react';
import type {
  CameraDirection,
  CameraPitch,
  SpriteStyleId,
  VoxelAnimationClip,
  VoxelUnitDefinition,
} from '../types/voxel';
import { VoxelSpriteRenderer } from '../engine/pixelRenderer';
import { getSpriteStyle } from '../engine/renderStyles';
import { cn } from '../utils/cn';

interface SpritePreviewProps {
  unit: VoxelUnitDefinition;
  clip: VoxelAnimationClip;
  params: Record<string, number>;
  frame: number;
  styleId: SpriteStyleId;
  pitch: CameraPitch;
  direction: CameraDirection;
  outline: boolean;
  visibility?: Record<string, boolean>;
  className?: string;
  fit?: 'contain' | 'cover';
}

export function SpritePreview({
  unit,
  clip,
  params,
  frame,
  styleId,
  pitch,
  direction,
  outline,
  visibility = {},
  className,
  fit = 'contain',
}: SpritePreviewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<VoxelSpriteRenderer | null>(null);
  const style = getSpriteStyle(styleId);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const renderer = new VoxelSpriteRenderer();
    rendererRef.current = renderer;
    renderer.canvas.className = 'block h-full w-full';
    renderer.canvas.style.imageRendering = style.pixelated ? 'pixelated' : 'auto';
    host.appendChild(renderer.canvas);
    return () => {
      renderer.canvas.remove();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [style.pixelated]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.canvas.style.imageRendering = style.pixelated ? 'pixelated' : 'auto';
    renderer.render(
      unit,
      clip,
      params,
      frame,
      {
        size: style.size,
        pitch,
        direction,
        outline,
        pixelated: style.pixelated,
        outlineThickness: style.pixelated ? 1 : 2,
      },
      visibility,
    );
  }, [unit, clip, params, frame, style, pitch, direction, outline, visibility]);

  return (
    <div
      ref={hostRef}
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        fit === 'contain' ? 'checkerboard' : 'checkerboard',
        className,
      )}
    />
  );
}
