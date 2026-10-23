import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, Download, FileJson2, Image as ImageIcon, Loader2, RefreshCw, X } from 'lucide-react';
import type {
  CameraDirection,
  CameraPitch,
  VoxelAnimationClip,
  VoxelUnitDefinition,
} from '../types/voxel';
import {
  CARDINAL_DIRECTIONS,
  COMPASS_DIRECTIONS,
  renderSpriteSheet,
  type SpriteSheetResult,
} from '../engine/pixelRenderer';
import { downloadBlob } from '../utils/cn';
import { ModalShell } from './ModalShell';

interface ExportSheetModalProps {
  open: boolean;
  onClose: () => void;
  unit: VoxelUnitDefinition;
  clip: VoxelAnimationClip;
  currentDirection: CameraDirection;
  pitch: CameraPitch;
  paramsByClip: Record<string, Record<string, number>>;
  visibility: Record<string, boolean>;
}

type ClipMode = 'current' | 'all';
type DirectionMode = 'current' | 'cardinal' | 'all';
type SheetSize = 64 | 96 | 128 | 256;

const SIZE_OPTIONS: Array<{ value: SheetSize; label: string; hint: string }> = [
  { value: 64, label: '64 × 64', hint: 'Pixel Art · 1px ink' },
  { value: 96, label: '96 × 96', hint: 'Pixel Art · 1px ink' },
  { value: 128, label: '128 × 128', hint: 'Pixel Art · 1px ink' },
  { value: 256, label: '256 × 256', hint: 'Cel-Shaded · 2px ink' },
];

function directionsFor(mode: DirectionMode, current: CameraDirection): CameraDirection[] {
  if (mode === 'all') return COMPASS_DIRECTIONS;
  if (mode === 'cardinal') return CARDINAL_DIRECTIONS;
  return [current];
}

export function ExportSheetModal({
  open,
  onClose,
  unit,
  clip,
  currentDirection,
  pitch,
  paramsByClip,
  visibility,
}: ExportSheetModalProps) {
  const [clipMode, setClipMode] = useState<ClipMode>('current');
  const [directionMode, setDirectionMode] = useState<DirectionMode>('current');
  const [size, setSize] = useState<SheetSize>(96);
  const [result, setResult] = useState<SpriteSheetResult | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const startedRef = useRef(false);

  const clips = useMemo(
    () => (clipMode === 'all' ? unit.animations : [clip]),
    [clipMode, unit.animations, clip],
  );
  const directions = useMemo(
    () => directionsFor(directionMode, currentDirection),
    [directionMode, currentDirection],
  );
  const pixels = SIZE_OPTIONS.find((option) => option.value === size) ?? SIZE_OPTIONS[1];

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    setProgress({ done: 0, total: 0 });
    try {
      const rendered = await renderSpriteSheet(
        unit,
        {
          clips,
          paramsByClip,
          directions,
          pitch,
          size,
          pixelated: size < 256,
          outline: true,
          visibility,
        },
        (done, total) => setProgress({ done, total }),
      );
      setResult(rendered);
      setSheetUrl(rendered.canvas.toDataURL('image/png'));
      setDirty(false);
      setDownloaded(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not render the sprite sheet.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    void generate();
    // Initial preview only; later changes use the explicit Generate button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (result) setDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipMode, directionMode, size, pitch, currentDirection]);

  const filenameBase = `${unit.id}_${clipMode === 'all' ? 'all-clips' : clip.id}_${directionMode}`;

  const downloadPng = () => {
    if (!result) return;
    result.canvas.toBlob((blob) => {
      if (!blob) {
        setError('Could not encode the PNG.');
        return;
      }
      downloadBlob(blob, `${filenameBase}.png`);
    }, 'image/png');
  };

  const downloadJson = () => {
    if (!result) return;
    const metadata = {
      ...result.metadata,
      meta: { ...result.metadata.meta, image: `${filenameBase}.png` },
    };
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${filenameBase}.json`);
  };

  const downloadBoth = () => {
    downloadPng();
    window.setTimeout(downloadJson, 180);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1800);
  };

  const totalFrames = result?.frames.length ?? 0;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Export Sprite Sheet"
      subtitle={`${unit.id} · transparent PNG + engine atlas`}
      icon={<Download size={14} />}
      widthClass="max-w-5xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {result ? `${totalFrames} frames · ${result.canvas.width}×${result.canvas.height}px` : 'No sheet generated yet'}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              <X size={13} /> Close
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={downloadBoth}
              disabled={!result || generating}
            >
              {downloaded ? <Check size={13} /> : <Download size={13} />}
              {downloaded ? 'Downloading…' : 'Download PNG + JSON'}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ImageIcon size={13} className="text-muted-foreground" />
              <span className="eyebrow">Packed sheet preview</span>
            </div>
            <button type="button" className="btn-secondary h-7 px-2 text-[11px]" onClick={() => void generate()} disabled={generating}>
              {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Generate
            </button>
          </div>

          <div className="overflow-hidden rounded-[6px] border border-border bg-canvas">
            <div className="checkerboard flex min-h-[300px] items-center justify-center overflow-auto p-3">
              {generating && !sheetUrl ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="font-mono text-[10.5px]">
                    Rendering {progress.total > 0 ? `${progress.done}/${progress.total}` : 'frames'}…
                  </span>
                </div>
              ) : sheetUrl ? (
                <img
                  src={sheetUrl}
                  alt={`${unit.name} sprite sheet`}
                  className="block max-h-[430px] max-w-full object-contain"
                  style={{ imageRendering: size < 256 ? 'pixelated' : 'auto' }}
                />
              ) : (
                <div className="max-w-xs text-center">
                  <ImageIcon size={22} className="mx-auto text-muted-foreground" />
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                    Choose clips, directions, and resolution, then generate the packed transparent sheet.
                  </p>
                </div>
              )}
            </div>
            {(generating || dirty) && sheetUrl && (
              <div className="flex items-center justify-between border-t border-border bg-card px-3 py-1.5">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
                  {generating
                    ? `Rendering ${progress.done}/${progress.total || '…'}`
                    : 'Settings changed · regenerate preview'}
                </span>
                {generating && <Loader2 size={11} className="animate-spin text-muted-foreground" />}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-2 rounded-[5px] border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-[10.5px] text-destructive">
              {error}
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Frame" value={`${size}×${size}`} />
            <Stat label="Rows" value={String(clips.length * directions.length)} />
            <Stat label="Frames" value={String(totalFrames)} />
            <Stat label="Background" value="Transparent" />
          </div>

          <div className="mt-3 rounded-[6px] border border-border bg-card p-3">
            <div className="flex items-start gap-2">
              <FileJson2 size={14} className="mt-0.5 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-foreground">Engine atlas</div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                  TexturePacker-style JSON with per-frame rects, pivots, clip/direction metadata, and named
                  animation arrays. Works with Godot, Unity importers, Phaser, and custom runtimes.
                </p>
                <div className="mt-2 font-mono text-[10px] text-muted-foreground">
                  {filenameBase}.png · {filenameBase}.json
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" onClick={downloadPng} disabled={!result || generating}>
                <Download size={12} /> PNG sheet
              </button>
              <button type="button" className="btn-secondary" onClick={downloadJson} disabled={!result || generating}>
                <FileJson2 size={12} /> Atlas JSON
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <OptionGroup label="Clips to Include">
            <OptionButton active={clipMode === 'current'} onClick={() => setClipMode('current')}>
              Current Clip · {clip.name}
            </OptionButton>
            <OptionButton active={clipMode === 'all'} onClick={() => setClipMode('all')}>
              All Clips · {unit.animations.length}
            </OptionButton>
          </OptionGroup>

          <OptionGroup label="Directions to Render">
            <OptionButton active={directionMode === 'current'} onClick={() => setDirectionMode('current')}>
              Current Direction · {currentDirection}
            </OptionButton>
            <OptionButton active={directionMode === 'cardinal'} onClick={() => setDirectionMode('cardinal')}>
              4 Cardinal · S, W, N, E
            </OptionButton>
            <OptionButton active={directionMode === 'all'} onClick={() => setDirectionMode('all')}>
              All 8 Directions
            </OptionButton>
          </OptionGroup>

          <OptionGroup label="Frame Resolution & Style">
            {SIZE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                active={size === option.value}
                onClick={() => setSize(option.value)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{option.label}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">{option.hint}</span>
                </span>
              </OptionButton>
            ))}
          </OptionGroup>

          <div className="rounded-[6px] border border-border bg-muted/40 p-3">
            <div className="eyebrow mb-1">Camera</div>
            <div className="text-[11.5px] text-foreground">
              {pitch === 'isometric' ? 'Isometric 30°' : pitch === 'oblique' ? 'Top-Down Oblique 45°' : 'Side View 0°'}
            </div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
              {pixels.hint} · transparent RGBA
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function OptionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-1.5">{label}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'w-full rounded-[5px] border border-foreground/25 bg-accent px-2.5 py-1.5 text-left text-[11.5px] text-foreground'
          : 'w-full rounded-[5px] border border-border bg-card px-2.5 py-1.5 text-left text-[11.5px] text-muted-foreground transition hover:bg-muted hover:text-foreground'
      }
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[5px] border border-border bg-card px-2.5 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-[11px] tabular-nums text-foreground">{value}</div>
    </div>
  );
}
