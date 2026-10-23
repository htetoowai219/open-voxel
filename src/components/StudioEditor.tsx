import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Box,
  Compass,
  Download,
  Eye,
  Grid3X3,
  Loader2,
  MessageSquare,
  MousePointer2,
  RotateCw,
  Sparkles,
  Triangle,
} from 'lucide-react';
import { getClip, getUnitDefinition, allDefaultParams, defaultClipParams } from '../units';
import type {
  CameraDirection,
  CameraPitch,
  SpriteStyleId,
  VoxelComment,
  VoxelPart,
  VoxelUnitDefinition,
} from '../types/voxel';
import { COMPASS_DIRECTIONS, PITCH_OPTIONS } from '../engine/pixelRenderer';
import { SPRITE_STYLES } from '../engine/renderStyles';
import { addComment, deletePart, fetchComments, saveClipParams } from '../utils/api';
import { cn } from '../utils/cn';
import { useTheme } from '../utils/theme';
import { ThemeToggle } from './ThemeToggle';
import { VoxelStage } from './VoxelStage';
import { SpritePreview } from './SpritePreview';
import { InspectorPanel } from './InspectorPanel';
import { Timeline } from './Timeline';
import { ExportSheetModal } from './ExportSheetModal';
import { ConfirmDialog } from './ConfirmDialog';
import { Toast, type ToastMessage } from './Toast';

interface StudioEditorProps {
  unitId: string;
  initialAnim: string | null;
  onBack: () => void;
}

const DIAL_ORDER: Array<CameraDirection | null> = ['NW', 'N', 'NE', 'W', null, 'E', 'SW', 'S', 'SE'];

function directionTitle(direction: CameraDirection): string {
  const names: Record<CameraDirection, string> = {
    S: 'South · front',
    SW: 'South-west',
    W: 'West',
    NW: 'North-west',
    N: 'North · back',
    NE: 'North-east',
    E: 'East',
    SE: 'South-east',
  };
  return names[direction];
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-[8px] border border-border bg-card text-muted-foreground shadow-edge">
        <Box size={20} />
      </span>
      <div>
        <h1 className="font-heading text-[20px] font-semibold tracking-tight">Unit not found</h1>
        <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          The requested voxel unit is not registered in <span className="font-mono text-foreground">src/units/index.ts</span>.
        </p>
      </div>
      <button type="button" className="btn-primary" onClick={onBack}>
        <ArrowLeft size={13} /> Back to sprites
      </button>
    </div>
  );
}

export function StudioEditor({ unitId, initialAnim, onBack }: StudioEditorProps) {
  const unit = getUnitDefinition(unitId);
  if (!unit) return <NotFound onBack={onBack} />;

  return <StudioWorkspace unit={unit} initialAnim={initialAnim} onBack={onBack} />;
}

function StudioWorkspace({
  unit,
  initialAnim,
  onBack,
}: {
  unit: VoxelUnitDefinition;
  initialAnim: string | null;
  onBack: () => void;
}) {
  const [theme] = useTheme();
  const initialClip = getClip(unit, initialAnim);
  const [activeClipId, setActiveClipId] = useState(initialClip.id);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loop, setLoop] = useState(initialClip.loop);
  const [fps, setFps] = useState(initialClip.fps);
  const [paramsByClip, setParamsByClip] = useState(() => allDefaultParams(unit));
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(unit.parts.map((part) => [part.id, true])),
  );
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [showPivots, setShowPivots] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [commentMode, setCommentMode] = useState(false);
  const [comments, setComments] = useState<VoxelComment[]>([]);
  const [addingComment, setAddingComment] = useState(false);
  const [savingParams, setSavingParams] = useState(false);
  const [partToDelete, setPartToDelete] = useState<VoxelPart | null>(null);
  const [deletingPart, setDeletingPart] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [styleId, setStyleId] = useState<SpriteStyleId>('pixel96');
  const [pitch, setPitch] = useState<CameraPitch>('isometric');
  const [direction, setDirection] = useState<CameraDirection>('S');
  const [outline, setOutline] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<number | null>(null);

  const activeClip = getClip(unit, activeClipId);
  const activeParams = paramsByClip[activeClip.id] ?? defaultClipParams(activeClip);
  const style = SPRITE_STYLES.find((item) => item.id === styleId) ?? SPRITE_STYLES[1];

  const notify = (message: string, tone: ToastMessage['tone'] = 'success') => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 3600);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchComments(unit.id)
      .then((result) => {
        if (!cancelled) setComments(result.comments);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [unit.id]);

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setFrame((current) => {
        const next = current + 1;
        if (next >= activeClip.frames) return loop ? 0 : activeClip.frames - 1;
        return next;
      });
    }, 1000 / Math.max(1, fps));
    return () => window.clearInterval(interval);
  }, [playing, fps, activeClip.frames, loop]);

  useEffect(() => {
    if (!loop && playing && frame >= activeClip.frames - 1) setPlaying(false);
  }, [frame, loop, playing, activeClip.frames]);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = window.setInterval(() => {
      setDirection((current) => {
        const index = COMPASS_DIRECTIONS.indexOf(current);
        return COMPASS_DIRECTIONS[(index + 1) % COMPASS_DIRECTIONS.length];
      });
    }, 1100);
    return () => window.clearInterval(interval);
  }, [autoRotate]);

  const updateClip = (clipId: string) => {
    const clip = getClip(unit, clipId);
    setActiveClipId(clip.id);
    setFrame(0);
    setFps(clip.fps);
    setLoop(clip.loop);
    setPlaying(true);
    const url = new URL(window.location.href);
    url.searchParams.set('unit', unit.id);
    url.searchParams.set('anim', clip.id);
    window.history.replaceState({}, '', url);
  };

  const updateParam = (key: string, value: number) => {
    setParamsByClip((current) => ({
      ...current,
      [activeClip.id]: {
        ...(current[activeClip.id] ?? defaultClipParams(activeClip)),
        [key]: value,
      },
    }));
  };

  const saveParams = async () => {
    setSavingParams(true);
    try {
      const result = await saveClipParams(unit.id, activeClip.id, paramsByClip[activeClip.id] ?? {});
      notify(
        result.missing.length > 0
          ? `Saved ${result.updated} params. ${result.missing.length} values could not be matched.`
          : `Saved ${result.updated} parameter values to ${unit.id}/unit.ts.`,
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save params.', 'error');
    } finally {
      setSavingParams(false);
    }
  };

  const togglePartVisibility = (partId: string) => {
    setVisibility((current) => ({ ...current, [partId]: current[partId] === false }));
  };

  const addPin = async (text: string) => {
    setAddingComment(true);
    try {
      const result = await addComment(unit.id, {
        clipId: activeClip.id,
        frame,
        partId: selectedPartId ?? undefined,
        text,
      });
      setComments((current) => [...current, result.comment]);
      notify('Frame comment pinned to unit.ts.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save comment.', 'error');
    } finally {
      setAddingComment(false);
    }
  };

  const confirmDeletePart = async () => {
    if (!partToDelete) return;
    setDeletingPart(true);
    try {
      await deletePart(unit.id, partToDelete.id);
      notify(`Removed part "${partToDelete.name}". Reloading…`);
      window.setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not delete part.', 'error');
      setDeletingPart(false);
      setPartToDelete(null);
    }
  };

  const directionButtons = useMemo(
    () =>
      DIAL_ORDER.map((entry, index) => ({
        index,
        direction: entry,
      })),
    [],
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-[54px] shrink-0 items-center gap-3 border-b border-border bg-sidebar px-3">
        <button type="button" onClick={onBack} className="btn-secondary h-8 px-2.5 text-[11.5px]">
          <ArrowLeft size={13} />
          <span className="hidden sm:inline">Back to Sprites</span>
        </button>
        <div className="h-5 w-px bg-border" />
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-foreground text-background">
            <Triangle size={13} fill="currentColor" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-[14px] font-semibold tracking-tight">{unit.name}</h1>
            <p className="truncate font-mono text-[9.5px] text-muted-foreground">
              {unit.id} · {unit.category}
            </p>
          </div>
        </div>

        <div className="mx-2 hidden items-center gap-1 rounded-[6px] border border-border bg-card p-0.5 md:flex">
          {unit.animations.map((clip) => (
            <button
              key={clip.id}
              type="button"
              onClick={() => updateClip(clip.id)}
              className={cn(
                'h-6 rounded-[4px] px-2.5 font-mono text-[10px] uppercase tracking-[0.06em] transition',
                activeClip.id === clip.id
                  ? 'bg-primary font-semibold text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              title={clip.name}
            >
              {clip.id}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-[5px] border border-border bg-card px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.07em] text-muted-foreground lg:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {unit.parts.reduce((sum, part) => sum + part.voxels.length, 0).toLocaleString()} voxels
          </span>
          <ThemeToggle />
          <button type="button" className="btn-primary h-8" onClick={() => setExportOpen(true)}>
            <Download size={13} />
            Export Sprite Sheet
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col border-r border-border">
          <div className="flex h-[38px] shrink-0 items-center justify-between border-b border-border bg-card px-3">
            <div className="flex items-center gap-2">
              <Box size={12} className="text-muted-foreground" />
              <span className="eyebrow text-[9.5px]">3D Voxel Stage</span>
              {selectedPartId && (
                <span className="chip px-1.5 py-0 text-[9px]">
                  {selectedPartId}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setShowPivots((value) => !value)}
                className={cn('seg-button', showPivots && 'seg-button-active')}
                title="Toggle pivot joint gizmos"
              >
                <Compass size={11} /> Pivots
              </button>
              <button
                type="button"
                onClick={() => setWireframe((value) => !value)}
                className={cn('seg-button', wireframe && 'seg-button-active')}
                title="Toggle voxel wireframe inspector"
              >
                <Grid3X3 size={11} /> Wireframe
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <VoxelStage
              unit={unit}
              clip={activeClip}
              params={activeParams}
              frame={frame}
              visibility={visibility}
              selectedPartId={selectedPartId}
              onSelectPart={setSelectedPartId}
              showPivots={showPivots}
              wireframe={wireframe}
              theme={theme}
              comments={comments}
            />
            <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-[5px] border border-border bg-card/90 px-2.5 py-1.5 shadow-edge backdrop-blur">
              <MousePointer2 size={11} className="text-muted-foreground" />
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
                drag to orbit · scroll to zoom · click part to inspect
              </span>
            </div>
            {commentMode && (
              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-[5px] border border-brand/40 bg-brand-soft px-2.5 py-1.5 text-brand shadow-edge backdrop-blur">
                <MessageSquare size={11} />
                <span className="font-mono text-[9px] uppercase tracking-[0.06em]">
                  Comment mode · select a part, pin frame {frame + 1}
                </span>
              </div>
            )}
          </div>
        </section>

        <aside className="flex w-[394px] shrink-0 flex-col border-r border-border bg-sidebar">
          <div className="flex h-[38px] shrink-0 items-center justify-between border-b border-border bg-card px-3">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-muted-foreground" />
              <span className="eyebrow text-[9.5px]">2D Game Sprite</span>
            </div>
            <span className="folio">
              {style.size}×{style.size} · {direction}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="border-b border-border p-3">
              <div className="mx-auto w-full max-w-[342px] overflow-hidden rounded-[6px] border border-border bg-canvas shadow-edge">
                <SpritePreview
                  unit={unit}
                  clip={activeClip}
                  params={activeParams}
                  frame={frame}
                  styleId={styleId}
                  pitch={pitch}
                  direction={direction}
                  outline={outline}
                  visibility={visibility}
                  className="aspect-square"
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                  live orthographic capture
                </span>
                <span className="chip px-1.5 py-0 text-[9px]">{outline ? 'INK ON' : 'INK OFF'}</span>
              </div>
            </div>

            <div className="space-y-4 border-b border-border p-3">
              <div>
                <label htmlFor="preview-style" className="eyebrow mb-1.5 block">
                  Render Style
                </label>
                <select
                  id="preview-style"
                  value={styleId}
                  onChange={(event) => setStyleId(event.target.value as SpriteStyleId)}
                  className="field"
                >
                  {SPRITE_STYLES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{style.description}</p>
              </div>

              <div>
                <label htmlFor="preview-pitch" className="eyebrow mb-1.5 block">
                  Camera Pitch
                </label>
                <select
                  id="preview-pitch"
                  value={pitch}
                  onChange={(event) => setPitch(event.target.value as CameraPitch)}
                  className="field"
                >
                  {PITCH_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="eyebrow">Compass Direction</span>
                  <span className="folio">{directionTitle(direction)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="grid grid-cols-3 gap-0.5 rounded-[6px] border border-border bg-card p-1 shadow-edge">
                    {directionButtons.map(({ direction: dir }) =>
                      dir ? (
                        <button
                          key={dir}
                          type="button"
                          onClick={() => {
                            setDirection(dir);
                            setAutoRotate(false);
                          }}
                          className={cn(
                            'flex size-7 items-center justify-center rounded-[4px] font-mono text-[9px] transition',
                            direction === dir
                              ? 'bg-primary font-semibold text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                          title={directionTitle(dir)}
                        >
                          {dir}
                        </button>
                      ) : (
                        <span
                          key="dial-center"
                          className="flex size-7 items-center justify-center rounded-[4px] bg-muted/60 text-muted-foreground"
                        >
                          <Compass size={12} />
                        </span>
                      ),
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setAutoRotate((value) => !value)}
                      className={cn(
                        'flex h-7 w-full items-center justify-between rounded-[5px] border px-2 font-mono text-[9.5px] uppercase tracking-[0.05em] transition',
                        autoRotate
                          ? 'border-brand/40 bg-brand-soft text-brand'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <RotateCw size={10} className={autoRotate ? 'animate-spin' : ''} />
                        Turntable
                      </span>
                      <span>{autoRotate ? 'ON' : 'OFF'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutline((value) => !value)}
                      className={cn(
                        'flex h-7 w-full items-center justify-between rounded-[5px] border px-2 font-mono text-[9.5px] uppercase tracking-[0.05em] transition',
                        outline
                          ? 'border-border bg-card text-foreground'
                          : 'border-border bg-muted/40 text-muted-foreground',
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye size={10} />
                        Ink Outline
                      </span>
                      <span>{outline ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="chip px-1.5 py-0 text-[9px]">{style.short}</span>
                <span className="chip px-1.5 py-0 text-[9px]">
                  {pitch === 'isometric' ? 'ISO 30°' : pitch === 'oblique' ? 'TD 45°' : 'SIDE 0°'}
                </span>
                <span className="chip px-1.5 py-0 text-[9px]">8-WAY READY</span>
                <span className="chip px-1.5 py-0 text-[9px]">TRANSPARENT</span>
              </div>
            </div>

            <div className="p-3">
              <div className="rounded-[6px] border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <Loader2 size={12} className="text-muted-foreground" />
                  <span className="text-[11.5px] font-medium">Export pipeline</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Pack the current clip or the full animation set across 1, 4, or 8 directions into transparent
                  PNG + JSON atlases — entirely in your browser.
                </p>
                <button type="button" className="btn-secondary mt-2 h-7 w-full text-[11px]" onClick={() => setExportOpen(true)}>
                  <Download size={12} /> Open Exporter
                </button>
              </div>
            </div>
          </div>
        </aside>

        <aside className="hidden w-[310px] shrink-0 xl:block">
          <InspectorPanel
            unit={unit}
            clip={activeClip}
            params={activeParams}
            onParamChange={updateParam}
            onSaveParams={() => void saveParams()}
            savingParams={savingParams}
            visibility={visibility}
            onToggleVisibility={togglePartVisibility}
            selectedPartId={selectedPartId}
            onSelectPart={setSelectedPartId}
            onDeletePart={setPartToDelete}
            comments={comments}
            frame={frame}
            commentMode={commentMode}
            onAddComment={(text) => void addPin(text)}
            addingComment={addingComment}
          />
        </aside>
      </div>

      <Timeline
        playing={playing}
        onTogglePlaying={() => setPlaying((value) => !value)}
        frame={frame}
        totalFrames={activeClip.frames}
        onFrameChange={(next) => {
          setFrame(next);
          if (playing) setPlaying(false);
        }}
        fps={fps}
        onFpsChange={setFps}
        loop={loop}
        onLoopChange={setLoop}
        commentMode={commentMode}
        onToggleCommentMode={() => setCommentMode((value) => !value)}
        clipId={activeClip.id}
      />

      <ExportSheetModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        unit={unit}
        clip={activeClip}
        currentDirection={direction}
        pitch={pitch}
        paramsByClip={paramsByClip}
        visibility={visibility}
      />
      <ConfirmDialog
        open={Boolean(partToDelete)}
        title={`Delete part "${partToDelete?.name ?? ''}"?`}
        description="This removes the part's voxel block from unit.ts. Child parts remain in the hierarchy and become root-level parts. The page reloads after the edit."
        confirmLabel="Delete part"
        busy={deletingPart}
        onCancel={() => setPartToDelete(null)}
        onConfirm={() => void confirmDeletePart()}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
