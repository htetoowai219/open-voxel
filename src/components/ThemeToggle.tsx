import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../utils/theme';
import { cn } from '../utils/cn';

interface ThemeToggleProps {
  className?: string;
  withLabel?: boolean;
}

export function ThemeToggle({ className, withLabel = false }: ThemeToggleProps) {
  const [theme, toggleTheme] = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex h-7 items-center justify-center gap-1.5 rounded-[5px] border border-border bg-card text-muted-foreground shadow-edge transition duration-100 hover:bg-muted hover:text-foreground',
        withLabel ? 'px-2.5' : 'w-7',
        className,
      )}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      {withLabel && (
        <span className="font-mono text-[10px] uppercase tracking-[0.08em]">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
