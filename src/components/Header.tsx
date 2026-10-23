import React from 'react';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  currentScreen: 'setup' | 'live' | 'summary';
  onGoToSetup?: () => void;
  onViewSummary?: () => void;
  historyCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onGoToSetup,
  onViewSummary,
  historyCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 text-white">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-bold text-xs tracking-tight text-white">AcePrompt AI</span>
        </div>

        <div className="flex items-center gap-2">
          {currentScreen === 'live' && historyCount > 0 && onViewSummary && (
            <button
              onClick={onViewSummary}
              className="text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700"
            >
              Summary ({historyCount})
            </button>
          )}

          {currentScreen !== 'setup' && onGoToSetup && (
            <button
              onClick={onGoToSetup}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800/60"
            >
              Setup
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
