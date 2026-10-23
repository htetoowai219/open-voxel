import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ClipboardCopy, Sparkles, Terminal, Wand2 } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { cn, slugify } from '../utils/cn';

interface CreateUnitModalProps {
  open: boolean;
  onClose: () => void;
}

type OnboardingMode = 'agent' | 'builder';
type CopyTarget = 'example' | 'command';

const AGENT_EXAMPLE =
  '/create-voxel-unit burmese-bilu "Humanoid Mob: A fearsome Burmese Bilu ogre with emerald skin, golden crown, and spiked war club."';

const CATEGORY_PRESETS = [
  'Humanoid Character',
  'Creature / Monster',
  'Artillery / Tower',
  'Flying Unit / Air',
  'Building / Structure',
  'Vehicle / Boat',
  'Prop / Environmental',
];

const COPY_FEEDBACK_MS = 2200;

export function CreateUnitModal({ open, onClose }: CreateUnitModalProps) {
  const [mode, setMode] = useState<OnboardingMode>('agent');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Humanoid Character');
  const [description, setDescription] = useState('');
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, []);

  const safeSlug = useMemo(() => slugify(slug) || 'new-voxel-unit', [slug]);
  const safeCategory = useMemo(
    () => category.trim().replace(/"/g, "'") || 'Custom Unit',
    [category],
  );
  const safeDescription = useMemo(
    () => description.trim().replace(/"/g, "'").replace(/\s+/g, ' '),
    [description],
  );
  const command = useMemo(() => {
    const direction = safeDescription ? `${safeCategory}: ${safeDescription}` : safeCategory;
    return `/create-voxel-unit ${safeSlug} "${direction}"`;
  }, [safeSlug, safeCategory, safeDescription]);

  const copyText = async (value: string, target: CopyTarget) => {
    let success = false;
    try {
      await navigator.clipboard.writeText(value);
      success = true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
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
    setCopiedTarget(target);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopiedTarget(null), COPY_FEEDBACK_MS);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Create Voxel Sprite"
      subtitle="Choose an agent workflow · /create-voxel-unit"
      icon={<Sparkles size={14} />}
      widthClass="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10.5px] text-muted-foreground">
            Deterministic TypeScript · no painted assets
          </span>
          <span className="folio">One pass</span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2" role="tablist" aria-label="Create voxel unit workflow">
          <button
            type="button"
            role="tab"
            id="create-unit-agent-tab"
            aria-selected={mode === 'agent'}
            aria-controls="create-unit-agent-panel"
            onClick={() => setMode('agent')}
            className={cn(
              'rounded-[7px] border px-3 py-2.5 text-left transition',
              mode === 'agent'
                ? 'border-foreground/25 bg-accent shadow-edge'
                : 'border-border bg-card hover:bg-muted',
            )}
          >
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
              <Terminal size={13} /> Agent Command Mode
            </span>
            <span className="mt-1 block text-[10.5px] leading-snug text-muted-foreground">
              Recommended for AI workflows
            </span>
          </button>
          <button
            type="button"
            role="tab"
            id="create-unit-builder-tab"
            aria-selected={mode === 'builder'}
            aria-controls="create-unit-builder-panel"
            onClick={() => setMode('builder')}
            className={cn(
              'rounded-[7px] border px-3 py-2.5 text-left transition',
              mode === 'builder'
                ? 'border-foreground/25 bg-accent shadow-edge'
                : 'border-border bg-card hover:bg-muted',
            )}
          >
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
              <Wand2 size={13} /> Guided Prompt Builder
            </span>
            <span className="mt-1 block text-[10.5px] leading-snug text-muted-foreground">
              For non-code users
            </span>
          </button>
        </div>

        {mode === 'agent' ? (
          <div
            id="create-unit-agent-panel"
            role="tabpanel"
            aria-labelledby="create-unit-agent-tab"
            className="space-y-4"
          >
            <div className="rounded-[7px] border border-border bg-muted/30 p-3.5">
              <h3 className="text-[12.5px] font-semibold text-foreground">
                Let your coding agent author the unit
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Open-Voxel is agent-native. Paste the command into your coding agent and it will
                create the geometry, animation, VFX, and registry entry as clean TypeScript.
              </p>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="eyebrow flex items-center gap-1.5">
                  <Terminal size={11} /> Example command
                </span>
                <button
                  type="button"
                  className="btn-secondary h-7 px-2.5"
                  onClick={() => void copyText(AGENT_EXAMPLE, 'example')}
                >
                  {copiedTarget === 'example' ? <Check size={12} /> : <ClipboardCopy size={12} />}
                  {copiedTarget === 'example' ? 'Copied' : 'Copy Example'}
                </button>
              </div>
              <div className="rounded-[7px] border border-border bg-muted/50 p-3.5 font-mono text-[11.5px] leading-relaxed text-foreground">
                <code className="select-all break-words">{AGENT_EXAMPLE}</code>
              </div>
            </div>

            <div>
              <span className="eyebrow mb-1.5 block">Syntax</span>
              <div className="rounded-[6px] border border-border bg-card p-3 font-mono text-[11px] leading-relaxed text-foreground">
                <code className="select-all break-words">
                  /create-voxel-unit &lt;unit-slug&gt; &quot;&lt;category&gt;:
                  &lt;art-direction-and-animations&gt;&quot;
                </code>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div className="rounded-[6px] border border-border bg-card p-2.5">
                  <span className="block font-mono text-[10px] text-foreground">&lt;unit-slug&gt;</span>
                  <span className="mt-1 block text-[10.5px] leading-snug text-muted-foreground">
                    Stable kebab-case ID, such as <code>forest-guardian</code>.
                  </span>
                </div>
                <div className="rounded-[6px] border border-border bg-card p-2.5">
                  <span className="block font-mono text-[10px] text-foreground">&lt;category&gt;</span>
                  <span className="mt-1 block text-[10.5px] leading-snug text-muted-foreground">
                    Any unit type, including custom or hybrid categories.
                  </span>
                </div>
                <div className="rounded-[6px] border border-border bg-card p-2.5">
                  <span className="block font-mono text-[10px] text-foreground">&lt;art-direction&gt;</span>
                  <span className="mt-1 block text-[10.5px] leading-snug text-muted-foreground">
                    Silhouette, palette, weapons, poses, and animation clips.
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Works with Claude Code, OpenCode, Cursor, and other coding agents with terminal and
              source access.
            </p>
          </div>
        ) : (
          <div
            id="create-unit-builder-panel"
            role="tabpanel"
            aria-labelledby="create-unit-builder-tab"
            className="space-y-4"
          >
            <div>
              <label htmlFor="unit-slug" className="eyebrow mb-1.5 block">
                Unit Slug / ID
              </label>
              <input
                id="unit-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="e.g. forest-guardian, crystal-turret"
                className="field font-mono"
              />
              <p className="mt-1.5 font-mono text-[10.5px] text-muted-foreground">
                The agent writes <span className="text-foreground">src/units/{safeSlug}/unit.ts</span>{' '}
                and registers it.
              </p>
            </div>

            <div>
              <label htmlFor="unit-category" className="eyebrow mb-1.5 block">
                Category / Unit Type
              </label>
              <input
                id="unit-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Pick a preset or type any custom category"
                className="field"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CATEGORY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={category === preset}
                    onClick={() => setCategory(preset)}
                    className={cn(
                      'rounded-[5px] border px-2 py-1 font-mono text-[10px] transition',
                      category === preset
                        ? 'border-foreground/25 bg-accent text-accent-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground">
                Presets are optional. Type any custom category for hybrids, flyers, beasts,
                structures, or something new.
              </p>
            </div>

            <div>
              <label htmlFor="unit-description" className="eyebrow mb-1.5 block">
                Art Direction &amp; Animation Details
              </label>
              <textarea
                id="unit-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="A mystical floating mage with purple robes, glowing staff, idle animation, floating spell cast attack, and voxel shatter death."
                className="field resize-none leading-relaxed"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="eyebrow flex items-center gap-1.5">
                  <Terminal size={11} /> Live command preview
                </span>
                <button
                  type="button"
                  className="btn-primary h-7 px-2.5"
                  onClick={() => void copyText(command, 'command')}
                >
                  {copiedTarget === 'command' ? <Check size={12} /> : <ClipboardCopy size={12} />}
                  {copiedTarget === 'command' ? 'Copied command' : 'Copy Command'}
                </button>
              </div>
              <div className="rounded-[7px] border border-border bg-muted/50 p-3.5 font-mono text-[11.5px] leading-relaxed text-foreground">
                <code className="select-all break-words">{command}</code>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-[6px] border border-border bg-card p-3">
              <Terminal size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Paste this command into your open coding agent (Claude Code, OpenCode, Cursor, etc.)
                while <code className="font-mono text-foreground">npm run dev</code> is running.
              </p>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
