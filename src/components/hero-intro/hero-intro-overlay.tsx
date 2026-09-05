import { FastForward, Sparkles } from 'lucide-react';
import type { IntroPhase } from './hero-intro-controller';

interface HeroIntroOverlayProps {
  phase: IntroPhase;
  isPlaying: boolean;
  onSkip: () => void;
}

const PHASE_LABELS: Record<IntroPhase, string> = {
  'blank-beads': 'Glass Beads',
  'baduk-lines': 'Baduk Board Lines',
  'lighting': 'Studio Lighting & Caustics',
  'komorebi': 'Komorebi Leaf Shadows',
  'settled': '',
};

export function HeroIntroOverlay({ phase, isPlaying, onSkip }: HeroIntroOverlayProps) {
  if (!isPlaying || phase === 'settled') return null;

  const currentLabel = PHASE_LABELS[phase];

  return (
    <div className="fixed inset-0 pointer-events-none z-20 transition-opacity duration-500">
      {/* Subtle Phase Indicator (Floating at bottom-left) */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-sm text-xs font-medium text-neutral-600 dark:text-neutral-300 pointer-events-auto transition-all duration-300">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span>{currentLabel}</span>
      </div>

      {/* Floating Skip Intro Action Button (Bottom-Right) */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/70 hover:bg-black/85 text-white/90 hover:text-white text-xs font-medium tracking-wide backdrop-blur-md border border-white/20 shadow-lg cursor-pointer transition-all hover:scale-105"
          aria-label="Skip Intro"
        >
          <span>Skip Intro</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
