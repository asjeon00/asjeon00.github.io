import { useState, useEffect, useCallback } from 'react'
import {
  ExternalLink,
  Sun,
  Moon,
  Network,
  SlidersHorizontal,
  X,
  RotateCcw,
} from 'lucide-react'
import { PrismBackground } from './prism/prism-background'
import { PrismLevaPanel } from './components/leva-panel'
import { HeroIntroController, HeroIntroOverlay, type IntroPhase } from './components/hero-intro'
import { ArchiveView } from './components/archive-typography'
import type { PrismControls } from './prism/types'
import type { PrismRenderer } from './prism/renderer'

export default function App() {
  const [showControls, setShowControls] = useState(false)
  const [prismControls, setPrismControls] = useState<Partial<PrismControls>>({})
  const [introPhase, setIntroPhase] = useState<IntroPhase>('blank-beads')
  const [introPlaying, setIntroPlaying] = useState(true)
  const [renderer, setRenderer] = useState<PrismRenderer | null>(null)
  const [introController] = useState(() => new HeroIntroController({
    onPhaseChange: (phase) => setIntroPhase(phase),
    onComplete: () => setIntroPlaying(false),
  }))

  useEffect(() => {
    return () => {
      introController.dispose()
    }
  }, [introController])

  const handleRendererReady = useCallback((newRenderer: PrismRenderer) => {
    setRenderer(newRenderer)
    introController.setRenderer(newRenderer)
  }, [introController])

  const handleReplayIntro = useCallback(() => {
    setIntroPlaying(true)
    introController.replay()
  }, [introController])

  const handleSkipIntro = useCallback(() => {
    introController.skip()
    setIntroPlaying(false)
  }, [introController])

  const handleControlsChange = useCallback((controls: Partial<PrismControls>) => {
    setPrismControls(controls)
  }, [])

  const [debugMode, setDebugMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).has('debug')
  })

  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  const toggleDebug = () => {
    const next = !debugMode
    setDebugMode(next)
    const url = new URL(window.location.href)
    if (next) {
      url.searchParams.set('debug', '')
    } else {
      url.searchParams.delete('debug')
    }
    window.history.pushState({}, '', url.toString())
  }

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <div
      data-hero-theme="true"
      className="relative min-h-screen w-full font-sans overflow-hidden select-none bg-neutral-100 dark:bg-neutral-950"
    >
      {/* 3D WebGPU Prism Background with dynamic ray bundles, wall plaster, and ?debug graph */}
      <PrismBackground
        enabled={true}
        debug={debugMode}
        onCloseDebug={toggleDebug}
        controls={prismControls}
        onRendererReady={handleRendererReady}
      />

      {/* Hero Scene Layer Reveal Intro Overlay */}
      <HeroIntroOverlay
        phase={introPhase}
        isPlaying={introPlaying}
        onSkip={handleSkipIntro}
      />

      {/* Archive Typography & Media Stage Aligned to Baduk Lines */}
      <ArchiveView
        renderer={renderer}
        introPhase={introPhase}
        introPlaying={introPlaying}
      />

      {/* Leva Studio Debug Controls Panel */}
      <PrismLevaPanel
        onControlsChange={handleControlsChange}
        isVisible={showControls}
      />

      {/* Floating Exit Debug View Bar (Icon-only) */}
      {debugMode && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-purple-500/40 backdrop-blur-lg shadow-[0_4px_25px_rgba(0,0,0,0.6)] pointer-events-auto">
          <Network className="w-4 h-4 text-purple-400" />
          <button
            onClick={toggleDebug}
            className="p-1 rounded-full bg-purple-500/25 hover:bg-purple-500/45 text-purple-100 transition-colors border border-purple-500/30 cursor-pointer"
            aria-label="Exit View"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Floating Action Bar - Clean Icon-Only UI, No Text */}
      <header
        className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2 p-1.5 rounded-2xl border border-black/10 dark:border-white/10 backdrop-blur-xl bg-white/40 dark:bg-black/40 shadow-lg transition-all duration-300 ${
          debugMode ? 'opacity-20 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
      >
        {/* GitHub link */}
        <a
          href="https://github.com/vercel-labs/vgpu"
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="GitHub"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Leva Studio Controls Toggle */}
        <button
          onClick={() => setShowControls(!showControls)}
          className={`p-2 rounded-xl transition-all border cursor-pointer ${
            showControls
              ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
              : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 border-transparent'
          }`}
          aria-label="Controls"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Debug Mode Toggle */}
        <button
          onClick={toggleDebug}
          className={`p-2 rounded-xl transition-all border cursor-pointer ${
            debugMode
              ? 'bg-purple-500/20 text-purple-700 dark:text-purple-200 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 border-transparent'
          }`}
          aria-label="Debug Mode"
        >
          <Network className="w-4 h-4" />
        </button>

        {/* Replay Intro Animation */}
        <button
          onClick={handleReplayIntro}
          className="p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Replay Intro"
          title="Replay Intro"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Centered Framing Container for 3D Glass Beads */}
      {/* Scaled proportionally based on 1920x1080 monitor baseline (540px = min(28.125vw, 50vh)) */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
        <div
          data-triangle-container
          aria-hidden="true"
          style={{
            width: 'min(28.125vw, 50vh)',
            height: 'min(28.125vw, 50vh)',
          }}
          className="relative"
        />
      </div>
    </div>
  )
}
