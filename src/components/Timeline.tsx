import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Pause,
  Play,
  Repeat2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface TimelineProps {
  playing: boolean;
  onTogglePlaying: () => void;
  frame: number;
  totalFrames: number;
  onFrameChange: (frame: number) => void;
  fps: number;
  onFpsChange: (fps: number) => void;
  loop: boolean;
  onLoopChange: (loop: boolean) => void;
  commentMode: boolean;
  onToggleCommentMode: () => void;
  clipId: string;
}

const FPS_OPTIONS = [12, 16, 20, 24, 30, 60];

export function Timeline({
  playing,
  onTogglePlaying,
  frame,
  totalFrames,
  onFrameChange,
  fps,
  onFpsChange,
  loop,
  onLoopChange,
  commentMode,
  onToggleCommentMode,
  clipId,
}: TimelineProps) {
  const lastFrame = Math.max(0, totalFrames - 1);
  const current = Math.min(frame, lastFrame);
  const seconds = current / Math.max(1, fps);

  return (
    <div className="flex h-[62px] shrink-0 items-center gap-3 border-t border-border bg-card px-3">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onTogglePlaying}
          className="inline-flex size-8 items-center justify-center rounded-[6px] bg-primary text-primary-foreground transition hover:opacity-90"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={() => onFrameChange(0)}
          className="icon-button"
          title="Reset to first frame"
        >
          <RotateCcw size={13} />
        </button>
        <button
          type="button"
          onClick={() => onFrameChange(Math.max(0, current - 1))}
          className="icon-button"
          title="Previous frame"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => onFrameChange(Math.min(lastFrame, current + 1))}
          className="icon-button"
          title="Next frame"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex shrink-0 items-center gap-2 font-mono text-[10.5px] tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">
            F{String(current + 1).padStart(2, '0')}
          </span>
          <span>/ {String(totalFrames).padStart(2, '0')}</span>
          <span className="hidden text-muted-foreground/60 sm:inline">{seconds.toFixed(2)}s</span>
        </div>
        <div className="relative flex min-w-[120px] flex-1 items-center">
          <input
            type="range"
            min={0}
            max={lastFrame}
            step={1}
            value={current}
            onChange={(event) => onFrameChange(Number(event.target.value))}
            className="slider relative z-10"
            aria-label="Frame scrubber"
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-brand/30"
            style={{ width: `${lastFrame === 0 ? 0 : (current / lastFrame) * 100}%` }}
          />
        </div>
        <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.09em] text-muted-foreground lg:inline">
          {clipId}
        </span>
      </div>

      <label className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
        <input
          type="checkbox"
          checked={loop}
          onChange={(event) => onLoopChange(event.target.checked)}
          className="size-3 accent-brand"
        />
        <Repeat2 size={12} />
        Loop
      </label>

      <label className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
        FPS
        <select
          value={fps}
          onChange={(event) => onFpsChange(Number(event.target.value))}
          className="h-6 rounded-[4px] border border-border bg-background px-1 font-mono text-[10px] text-foreground focus:outline-none"
        >
          {FPS_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onToggleCommentMode}
        className={cn(
          'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[5px] border px-2 font-mono text-[10px] uppercase tracking-[0.05em] transition',
          commentMode
            ? 'border-brand/40 bg-brand-soft text-brand'
            : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        title="Toggle comment pin mode"
      >
        <MessageSquare size={11} />
        Comment
      </button>
    </div>
  );
}
