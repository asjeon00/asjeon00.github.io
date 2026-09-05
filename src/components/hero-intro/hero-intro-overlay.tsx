import type { IntroPhase } from './hero-intro-controller';

export interface HeroIntroOverlayProps {
  phase: IntroPhase;
  isPlaying: boolean;
  onSkip: () => void;
}

export function HeroIntroOverlay(_props: HeroIntroOverlayProps) {
  // Bottom-left animation annotation tags and skip intro button removed as requested
  return null;
}
