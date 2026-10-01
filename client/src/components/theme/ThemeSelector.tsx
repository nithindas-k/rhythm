import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { THEME_OPTIONS, type ThemeColor } from '../../constants/themes';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';

export const ThemeSelector: React.FC<{ className?: string }> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (newTheme: ThemeColor) => {
    setTheme(newTheme, isAuthenticated);
    setIsOpen(false);
  };

  const currentThemeOption =
    THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all duration-200 text-xs font-semibold text-[var(--foreground)] cursor-pointer select-none active:scale-95 shadow-sm"
        title="Change accent theme"
      >
        <span
          className="w-3 h-3 rounded-full shadow-sm transition-transform duration-200"
          style={{
            backgroundColor: currentThemeOption.color,
            boxShadow: `0 0 10px ${currentThemeOption.glow}`,
          }}
        />
        <span className="hidden sm:inline">{currentThemeOption.label}</span>
        <Palette className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl glass-dropdown shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[11px] font-bold tracking-wider uppercase text-[var(--foreground-muted)] select-none">
            Accent Palette
          </div>
          <div className="flex flex-col gap-1 mt-1">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = opt.id === theme;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectTheme(opt.id)}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer text-left',
                    isSelected
                      ? 'bg-[var(--surface-hover)] text-[var(--foreground)] font-semibold'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 transition-transform duration-150"
                      style={{
                        backgroundColor: opt.color,
                        boxShadow: isSelected ? `0 0 12px ${opt.glow}` : 'none',
                      }}
                    />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check
                      className="w-3.5 h-3.5"
                      style={{ color: opt.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
