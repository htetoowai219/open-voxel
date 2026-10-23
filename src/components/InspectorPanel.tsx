import { useMemo, useState } from 'react';
import {
  Check,
  ClipboardCopy,
  Eye,
  EyeOff,
  GripVertical,
  MapPin,
  MessageSquare,
  Save,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import type {
  VoxelAnimationClip,
  VoxelComment,
  VoxelPart,
  VoxelUnitDefinition,
} from '../types/voxel';
import { cn } from '../utils/cn';

interface InspectorPanelProps {
  unit: VoxelUnitDefinition;
  clip: VoxelAnimationClip;
  params: Record<string, number>;
  onParamChange: (key: string, value: number) => void;
  onSaveParams: () => void;
  savingParams: boolean;
  visibility: Record<string, boolean>;
  onToggleVisibility: (partId: string) => void;
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
  onDeletePart: (part: VoxelPart) => void;
  comments: VoxelComment[];
  frame: number;
  commentMode: boolean;
  onAddComment: (text: string) => void;
  addingComment: boolean;
}

function partDepth(part: VoxelPart, parts: Map<string, VoxelPart>, seen = new Set<string>()): number {
  if (!part.parentId || seen.has(part.id)) return 0;
  const parent = parts.get(part.parentId);
  if (!parent) return 0;
  seen.add(part.id);
  return 1 + partDepth(parent, parts, seen);
}

function swatchForPart(part: VoxelPart): string {
  return part.voxels[Math.floor(part.voxels.length / 2)]?.color ?? '#71717a';
}

export function InspectorPanel({
  unit,
  clip,
  params,
  onParamChange,
  onSaveParams,
  savingParams,
  visibility,
  onToggleVisibility,
  selectedPartId,
  onSelectPart,
  onDeletePart,
  comments,
  frame,
  commentMode,
  onAddComment,
  addingComment,
}: InspectorPanelProps) {
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  const partMap = useMemo(() => new Map(unit.parts.map((part) => [part.id, part])), [unit.parts]);
  const orderedParts = useMemo(
    () => [...unit.parts].sort((a, b) => partDepth(a, partMap) - partDepth(b, partMap)),
    [unit.parts, partMap],
  );
  const activeComments = useMemo(
    () =>
      comments
        .filter((comment) => comment.clipId === clip.id)
        .sort((a, b) => a.frame - b.frame || a.createdAt.localeCompare(b.createdAt)),
    [comments, clip.id],
  );

  const copyCommand = async () => {
    const command = `/apply-voxel-comments ${unit.id}`;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard permissions are optional; the command remains selectable in the UI.
    }
  };

  const submitComment = () => {
    const text = commentText.trim();
    if (!text) return;
    onAddComment(text);
    setCommentText('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar">
      <div className="flex h-[42px] shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-muted-foreground" />
          <span className="eyebrow text-[10px]">Inspector</span>
        </div>
        <span className="folio">{selectedPartId ?? 'NO SELECTION'}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="border-b border-border p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-[12px] font-semibold text-foreground">Quick Tune</h3>
              <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
                {clip.id} · live params
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onSaveParams();
                setSaveFlash(true);
                window.setTimeout(() => setSaveFlash(false), 1200);
              }}
              disabled={savingParams || Object.keys(clip.params ?? {}).length === 0}
              className="btn-secondary h-7 px-2 text-[11px]"
            >
              {saveFlash ? <Check size={12} /> : <Save size={12} />}
              {savingParams ? 'Saving…' : 'Save to Code'}
            </button>
          </div>

          {Object.keys(clip.params ?? {}).length === 0 ? (
            <p className="rounded-[5px] border border-dashed border-border p-2.5 text-[11.5px] text-muted-foreground">
              This clip has no tunable parameters yet. Ask an agent to expose numbers in{' '}
              <span className="font-mono text-foreground">clip.params</span>.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(clip.params ?? {}).map(([key, schema]) => {
                const value = params[key] ?? schema.value;
                return (
                  <label key={key} className="block">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-[11.5px] text-foreground">{schema.label}</span>
                      <span className="rounded-[3px] border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                        {Number.isInteger(value) ? value : value.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={schema.min}
                      max={schema.max}
                      step={schema.step ?? 0.1}
                      value={value}
                      onChange={(event) => onParamChange(key, Number(event.target.value))}
                      className="slider"
                    />
                  </label>
                );
              })}
              <div className="flex items-center justify-between border-t border-hairline pt-2">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
                  {Object.keys(clip.params ?? {}).length} exposed values
                </span>
                <button type="button" onClick={onSaveParams} disabled={savingParams} className="btn-ghost h-6 text-[10.5px]">
                  <Save size={11} /> Save Params to Code
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="border-b border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-foreground">Parts Hierarchy</h3>
            <span className="folio">{unit.parts.length} parts</span>
          </div>
          <div className="space-y-0.5">
            {orderedParts.map((part) => {
              const depth = partDepth(part, partMap);
              const visible = visibility[part.id] !== false;
              const selected = selectedPartId === part.id;
              return (
                <div
                  key={part.id}
                  className={cn(
                    'group flex items-center gap-1 rounded-[4px] py-1 pl-1 pr-0.5 transition',
                    selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/70',
                  )}
                  style={{ paddingLeft: 4 + depth * 12 }}
                >
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(part.id)}
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-[3px] text-muted-foreground hover:bg-card hover:text-foreground"
                    title={visible ? 'Hide part' : 'Show part'}
                  >
                    {visible ? <Eye size={11} /> : <EyeOff size={11} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPart(part.id)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 py-0.5 text-left"
                    title={`Select ${part.name}`}
                  >
                    <span className="size-2 shrink-0 rounded-[1px] border border-black/10" style={{ background: swatchForPart(part) }} />
                    <span className={cn('truncate text-[11.5px]', selected ? 'font-medium' : 'text-foreground/85')}>
                      {part.name}
                    </span>
                    {part.parentId && (
                      <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.05em] text-muted-foreground">
                        child
                      </span>
                    )}
                  </button>
                  <span className="hidden shrink-0 font-mono text-[8.5px] text-muted-foreground group-hover:block">
                    {part.pivot.map((value) => Math.round(value)).join(',')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeletePart(part)}
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-[3px] text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    title="Delete part"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
          {selectedPartId && partMap.get(selectedPartId) && (
            <div className="mt-2 rounded-[5px] border border-border bg-card px-2.5 py-2">
              <div className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
                <GripVertical size={10} /> Pivot
              </div>
              <div className="mt-1 font-mono text-[10.5px] tabular-nums text-foreground">
                [{partMap.get(selectedPartId)?.pivot.join(', ')}]
              </div>
              <div className="mt-1 text-[10.5px] text-muted-foreground">
                {partMap.get(selectedPartId)?.voxels.length.toLocaleString()} voxels ·{' '}
                {partMap.get(selectedPartId)?.parentId ?? 'root'}
              </div>
            </div>
          )}
        </section>

        <section className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-foreground">Frame Comments</h3>
            <span className="folio">{activeComments.length} notes</span>
          </div>

          <div className="space-y-1.5">
            {activeComments.length === 0 ? (
              <div className="rounded-[5px] border border-dashed border-border p-2.5">
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                  No pinned notes for <span className="font-mono text-foreground">{clip.id}</span>. Enable Comment
                  Mode in the timeline, select a part, then drop a pin.
                </p>
              </div>
            ) : (
              activeComments.map((comment) => {
                const isNear = Math.abs(comment.frame - frame) <= 2;
                return (
                  <div
                    key={comment.id}
                    className={cn(
                      'rounded-[5px] border px-2.5 py-2 text-[11px] leading-relaxed transition',
                      isNear ? 'border-brand/40 bg-brand-soft' : 'border-border bg-card',
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground">
                        <MapPin size={9} /> F{String(comment.frame + 1).padStart(2, '0')}
                        {comment.partId ? ` · ${comment.partId}` : ''}
                      </span>
                      {isNear && <span className="font-mono text-[8.5px] text-brand">ACTIVE</span>}
                    </div>
                    <p className="text-foreground/90">{comment.text}</p>
                  </div>
                );
              })
            )}
          </div>

          {commentMode ? (
            <div className="mt-2 space-y-1.5">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                rows={2}
                placeholder="Describe the fix for this frame…"
                className="field resize-none text-[11.5px]"
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={!commentText.trim() || addingComment}
                className="btn-secondary h-7 w-full text-[11px]"
              >
                <MessageSquare size={12} />
                {addingComment ? 'Dropping pin…' : `Pin at frame ${frame + 1}`}
              </button>
            </div>
          ) : (
            <p className="mt-2 rounded-[5px] bg-muted/60 px-2.5 py-2 font-mono text-[9.5px] leading-relaxed text-muted-foreground">
              COMMENT MODE OFF · toggle it in the timeline to annotate.
            </p>
          )}

          <button
            type="button"
            onClick={() => void copyCommand()}
            className="btn-ghost mt-2 h-7 w-full justify-between border border-border px-2 font-mono text-[10px]"
          >
            <span className="flex items-center gap-1.5">
              {copied ? <Check size={11} /> : <ClipboardCopy size={11} />}
              {copied ? 'Copied command' : `/apply-voxel-comments ${unit.id}`}
            </span>
          </button>
        </section>
      </div>
    </div>
  );
}
