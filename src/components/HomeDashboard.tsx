import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Boxes,
  ChevronRight,
  Layers3,
  Plus,
  Sparkles,
  Swords,
  Trash2,
  Wand2,
} from 'lucide-react';
import { unitRegistry, defaultClipParams } from '../units';
import type { VoxelUnitDefinition } from '../types/voxel';
import { SPRITE_STYLES } from '../engine/renderStyles';
import { VFX_CATALOG } from '../engine/vfxCatalog';
import { deleteUnit } from '../utils/api';
import { cn } from '../utils/cn';
import { ThemeToggle } from './ThemeToggle';
import { SpritePreview } from './SpritePreview';
import { VfxPreview } from './VfxPreview';
import { CreateUnitModal } from './CreateUnitModal';
import { CreateVfxModal } from './CreateVfxModal';
import { ConfirmDialog } from './ConfirmDialog';
import { Toast, type ToastMessage } from './Toast';

export type DashboardTab = 'sprites' | 'vfx';

interface HomeDashboardProps {
  initialTab?: DashboardTab;
  onOpenUnit: (unitId: string, clipId?: string) => void;
}

function UnitCardPreview({ unit }: { unit: VoxelUnitDefinition }) {
  const clip = unit.animations.find((item) => item.id === 'idle') ?? unit.animations[0];
  const params = useMemo(() => defaultClipParams(clip), [clip]);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    if (!clip) return;
    const interval = window.setInterval(() => {
      setFrame((value) => (value + 1) % Math.max(1, clip.frames));
    }, 1000 / Math.max(1, clip.fps));
    return () => window.clearInterval(interval);
  }, [clip]);

  if (!clip) return <div className="checkerboard h-full w-full" />;

  return (
    <SpritePreview
      unit={unit}
      clip={clip}
      params={params}
      frame={frame}
      styleId="pixel96"
      pitch="isometric"
      direction="S"
      outline
      className="h-full w-full"
    />
  );
}

interface UnitCardProps {
  unit: VoxelUnitDefinition;
  onOpen: () => void;
  onDelete: () => void;
}

function UnitCard({ unit, onOpen, onDelete }: UnitCardProps) {
  return (
    <article
      className="group animate-fade-up overflow-hidden rounded-[8px] border border-border bg-card shadow-edge transition duration-150 hover:border-foreground/20 hover:shadow-floating"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative aspect-square border-b border-border">
        <UnitCardPreview unit={unit} />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <span className="chip bg-card/90 backdrop-blur">
            {unit.category === 'character' ? 'Character' : unit.category === 'artillery' ? 'Artillery' : 'Prop'}
          </span>
          <span className="folio rounded-[4px] border border-border bg-card/90 px-1.5 py-0.5 backdrop-blur">
            {unit.parts.length} PARTS
          </span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="absolute right-2.5 top-9 inline-flex size-7 items-center justify-center rounded-[5px] border border-border bg-card/90 text-muted-foreground opacity-0 shadow-edge backdrop-blur transition hover:border-destructive/40 hover:text-destructive group-hover:opacity-100"
          aria-label={`Delete ${unit.name}`}
          title="Delete unit"
        >
          <Trash2 size={13} />
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/20 to-transparent px-2.5 pb-2 pt-8 opacity-0 transition group-hover:opacity-100">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-white/90">Open studio</span>
          <ChevronRight size={13} className="text-white/90" />
        </div>
      </div>
      <div className="space-y-2.5 p-3.5">
        <div>
          <h3 className="font-heading text-[14px] font-semibold tracking-tight text-foreground">{unit.name}</h3>
          <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">{unit.id}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {unit.animations.map((clip) => (
            <span key={clip.id} className="chip px-1.5 py-0 text-[9.5px]">
              {clip.id}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function VfxCard({ entry, onOpen }: { entry: (typeof VFX_CATALOG)[number]; onOpen: () => void }) {
  return (
    <article className="group animate-fade-up overflow-hidden rounded-[8px] border border-border bg-card shadow-edge transition duration-150 hover:border-foreground/20 hover:shadow-floating">
      <div className="relative aspect-[4/3] border-b border-border bg-canvas">
        <VfxPreview entry={entry} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-2.5">
          <span className="chip bg-card/90 backdrop-blur">
            <span className="size-1.5 rounded-full" style={{ background: entry.accent }} />
            3D Voxel VFX
          </span>
          <span className="folio rounded-[4px] border border-border bg-card/90 px-1.5 py-0.5 backdrop-blur">
            LOOP
          </span>
        </div>
      </div>
      <div className="space-y-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading text-[13.5px] font-semibold">{entry.name}</h3>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{entry.functionName}()</p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-border bg-card text-muted-foreground opacity-0 shadow-edge transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
            aria-label={`Create a variant of ${entry.name}`}
            title="Create VFX variant"
          >
            <Wand2 size={13} />
          </button>
        </div>
        <p className="text-[12px] leading-relaxed text-muted-foreground">{entry.description}</p>
      </div>
    </article>
  );
}

export function HomeDashboard({ initialTab = 'sprites', onOpenUnit }: HomeDashboardProps) {
  const [tab, setTab] = useState<DashboardTab>(initialTab);
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [createVfxOpen, setCreateVfxOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VoxelUnitDefinition | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<number | null>(null);

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

  const requestDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUnit(deleteTarget.id);
      notify(`Deleted "${deleteTarget.name}". Refreshing library…`);
      window.setTimeout(() => window.location.assign(window.location.pathname), 450);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not delete unit.', 'error');
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <aside className="flex w-[236px] shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex h-[54px] shrink-0 items-center gap-2.5 border-b border-border px-3.5">
          <div className="relative flex size-7 items-center justify-center rounded-[6px] bg-foreground text-background shadow-edge">
            <Boxes size={15} strokeWidth={2.2} />
            <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-brand ring-2 ring-sidebar" />
          </div>
          <div className="min-w-0">
            <div className="font-heading text-[14px] font-semibold leading-none tracking-tight">Open-Voxel</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Voxel Sprite Studio
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2.5" aria-label="Library views">
          <div className="eyebrow px-2 pb-1.5 pt-1">Library</div>
          <button
            type="button"
            onClick={() => setTab('sprites')}
            className={cn(
              'flex w-full items-center justify-between rounded-[5px] px-2.5 py-2 text-[12.5px] transition',
              tab === 'sprites'
                ? 'bg-card font-medium text-foreground shadow-edge ring-1 ring-foreground/[0.04]'
                : 'text-foreground/75 hover:bg-muted/70 hover:text-foreground',
            )}
          >
            <span className="flex items-center gap-2.5">
              <Layers3 size={15} className={tab === 'sprites' ? 'text-foreground' : 'text-muted-foreground'} />
              Voxel Sprites
            </span>
            <span className="folio">{String(unitRegistry.length).padStart(2, '0')}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('vfx')}
            className={cn(
              'mt-0.5 flex w-full items-center justify-between rounded-[5px] px-2.5 py-2 text-[12.5px] transition',
              tab === 'vfx'
                ? 'bg-card font-medium text-foreground shadow-edge ring-1 ring-foreground/[0.04]'
                : 'text-foreground/75 hover:bg-muted/70 hover:text-foreground',
            )}
          >
            <span className="flex items-center gap-2.5">
              <Sparkles size={15} className={tab === 'vfx' ? 'text-foreground' : 'text-muted-foreground'} />
              VFX Library
            </span>
            <span className="folio">{String(VFX_CATALOG.length).padStart(2, '0')}</span>
          </button>

          <div className="eyebrow px-2 pb-1.5 pt-5">Agent Workflow</div>
          <div className="mx-2 rounded-[6px] border border-border bg-card/60 p-2.5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-foreground">
              <Swords size={11} className="text-brand" />
              ONE-PASS AUTHORING
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              Agents write clean TypeScript. The studio renders, tunes, and exports.
            </p>
          </div>
        </nav>

        <div className="border-t border-border p-2.5">
          <div className="flex items-center justify-between rounded-[5px] px-1">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                Local workspace
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-[1440px] flex-col px-6 py-7 lg:px-9 lg:py-9">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="eyebrow mb-2">{tab === 'sprites' ? 'Local Voxel Library' : 'Deterministic Effects'}</div>
              <h1 className="font-heading text-[26px] font-semibold tracking-[-0.03em] text-foreground">
                {tab === 'sprites' ? 'Voxel Sprites' : 'VFX Library'}
              </h1>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                {tab === 'sprites'
                  ? 'Rigged, animated 3D units authored as clean TypeScript code — ready to preview in 3D or export as 2D sprite sheets.'
                  : 'Every effect is pure deterministic math. Preview the live 3D particles, then ask an agent to extend the library.'}
              </p>
            </div>
            <button
              type="button"
              className="btn-primary h-9 px-3.5"
              onClick={() => {
                if (tab === 'sprites') setCreateUnitOpen(true);
                else setCreateVfxOpen(true);
              }}
            >
              <Plus size={14} />
              {tab === 'sprites' ? 'Create Voxel Sprite' : 'Create Voxel VFX'}
              <span className="ml-1 border-l border-primary-foreground/20 pl-2 font-mono text-[9.5px] font-normal opacity-70">
                {tab === 'sprites' ? '/create-voxel-unit' : '/create-voxel-vfx'}
              </span>
            </button>
          </div>

          {tab === 'sprites' ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">Units · {unitRegistry.length}</span>
                <span className="folio">2 live previews · 60 FPS class</span>
              </div>
              {unitRegistry.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {unitRegistry.map((unit) => (
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      onOpen={() => onOpenUnit(unit.id, unit.animations[0]?.id ?? 'idle')}
                      onDelete={() => setDeleteTarget(unit)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setCreateUnitOpen(true)}
                    className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-border bg-card/40 p-6 text-center transition hover:border-foreground/20 hover:bg-card"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-edge">
                      <Plus size={17} />
                    </span>
                    <span>
                      <span className="block text-[13px] font-medium text-foreground">Create a new voxel unit</span>
                      <span className="mt-1 block font-mono text-[10.5px] text-muted-foreground">
                        /create-voxel-unit
                      </span>
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[8px] border border-dashed border-border bg-card/40 p-8 text-center">
                  <Layers3 size={28} className="text-muted-foreground" />
                  <h2 className="mt-3 text-[15px] font-semibold">No units in the library</h2>
                  <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
                    Ask a coding agent to generate a rigged voxel unit, or restore a starter from the repository.
                  </p>
                  <button type="button" className="btn-primary mt-4" onClick={() => setCreateUnitOpen(true)}>
                    <Plus size={14} /> Create Voxel Sprite
                  </button>
                </div>
              )}
              <div className="mt-5 flex items-center gap-2.5 rounded-[6px] border border-border bg-card/60 px-3 py-2.5">
                <span className="chip bg-card">
                  <span className="size-1.5 rounded-full bg-brand" />
                  TIP
                </span>
                <span className="text-[11.5px] text-muted-foreground">
                  Copy the slash command from a card action and run it in Claude Code, OpenCode, or any compatible agent.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">Effects · {VFX_CATALOG.length}</span>
                <span className="folio">Seeded · no painted frames</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {VFX_CATALOG.map((entry) => (
                  <VfxCard
                    key={entry.id}
                    entry={entry}
                    onOpen={() => {
                      setCreateVfxOpen(true);
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setCreateVfxOpen(true)}
                  className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-border bg-card/40 p-6 text-center transition hover:border-foreground/20 hover:bg-card"
                >
                  <span className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-edge">
                    <Wand2 size={17} />
                  </span>
                  <span>
                    <span className="block text-[13px] font-medium text-foreground">Create a new voxel VFX</span>
                    <span className="mt-1 block font-mono text-[10.5px] text-muted-foreground">
                      /create-voxel-vfx
                    </span>
                  </span>
                </button>
              </div>
            </>
          )}

          <div className="mt-auto pt-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <span className="folio">OPEN-VOXEL · LOCAL-FIRST · AGENT-NATIVE</span>
              <span className="folio">
                <span className="text-foreground">{SPRITE_STYLES.length}</span> render styles · 8 directions · 1-pass
              </span>
            </div>
          </div>
        </div>
      </main>

      <CreateUnitModal open={createUnitOpen} onClose={() => setCreateUnitOpen(false)} />
      <CreateVfxModal
        open={createVfxOpen}
        onClose={() => setCreateVfxOpen(false)}
        units={unitRegistry.map((unit) => ({
          id: unit.id,
          animations: unit.animations.map((clip) => ({ id: clip.id })),
        }))}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name ?? 'unit'}?`}
        description={`This permanently removes src/units/${deleteTarget?.id ?? ''}/ and unregisters it from the library. Built-in starter units can be restored from version control.`}
        confirmLabel="Delete unit"
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void requestDelete()}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
