import { useMemo, useRef, useState } from 'react';
import { Check, ClipboardCopy, Terminal, Wand2 } from 'lucide-react';
import { ModalShell } from './ModalShell';

interface CreateVfxModalProps {
  open: boolean;
  onClose: () => void;
  units?: Array<{ id: string; animations: Array<{ id: string }> }>;
}

export function CreateVfxModal({ open, onClose, units = [] }: CreateVfxModalProps) {
  const [description, setDescription] = useState('Electric shock arcs snapping along a bronze blade');
  const [unitId, setUnitId] = useState('');
  const [clipId, setClipId] = useState('');
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  const targetUnit = units.find((unit) => unit.id === unitId);
  const command = useMemo(() => {
    const safeDescription = description.trim().replace(/"/g, "'") || 'New deterministic voxel VFX';
    const suffix = unitId ? ` ${unitId}${clipId ? ` ${clipId}` : ''}` : '';
    return `/create-voxel-vfx "${safeDescription}"${suffix}`;
  }, [description, unitId, clipId]);

  const copyCommand = async () => {
    let success = false;
    try {
      await navigator.clipboard.writeText(command);
      success = true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = command;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        success = document.execCommand('copy');
      } finally {
        textarea.remove();
      }
    }
    if (!success) return;
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Create Voxel VFX"
      subtitle="/create-voxel-vfx · deterministic 3D particle math"
      icon={<Wand2 size={14} />}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="hidden font-mono text-[10.5px] text-muted-foreground sm:block">
            src/engine/voxelVfx.ts
          </span>
          <button type="button" className="btn-primary ml-auto" onClick={() => void copyCommand()}>
            {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
            {copied ? 'Copied command' : 'Copy agent command'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="vfx-description" className="eyebrow mb-1.5 block">
            Effect Description
          </label>
          <textarea
            id="vfx-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="field resize-none leading-relaxed"
            placeholder="Describe shape, colors, motion, timing, and whether it should loop."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="vfx-unit" className="eyebrow mb-1.5 block">
              Attach to Unit <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <select
              id="vfx-unit"
              value={unitId}
              onChange={(event) => {
                setUnitId(event.target.value);
                setClipId('');
              }}
              className="field"
            >
              <option value="">— No target —</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="vfx-clip" className="eyebrow mb-1.5 block">
              Attach to Clip <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <select
              id="vfx-clip"
              value={clipId}
              onChange={(event) => setClipId(event.target.value)}
              disabled={!targetUnit}
              className="field disabled:opacity-50"
            >
              <option value="">— No clip —</option>
              {targetUnit?.animations.map((clip) => (
                <option key={clip.id} value={clip.id}>
                  {clip.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="eyebrow flex items-center gap-1.5">
              <Terminal size={11} /> Agent Slash Command
            </span>
            <span className="folio">Seeded · replayable</span>
          </div>
          <div className="rounded-[6px] border border-border bg-muted/40 p-3 font-mono text-[11.5px] leading-relaxed text-foreground">
            <code className="select-all break-words">{command}</code>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
