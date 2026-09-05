import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ExternalLink,
  Sun,
  Moon,
  Network,
  SlidersHorizontal,
  X,
  RotateCcw,
  Type,
  Info,
  Mail,
} from 'lucide-react'
import { PrismBackground } from './prism/prism-background'
import { PrismLevaPanel } from './components/leva-panel'
import { HeroIntroController, HeroIntroOverlay, type IntroPhase } from './components/hero-intro'
import { ArchiveTypography } from './components/archive-typography'
import './components/archive-typography/archive-typography.css'
import { XTwitterIcon } from './components/about-modal'
import { globalBeadHoverController } from './prism/pipelines/light/passes/hover/bead-hover-controller'
import { globalPaperController } from './prism/pipelines/light/passes/paper/paper-controller'
import type { PrismControls } from './prism/types'
import type { PrismRenderer } from './prism/renderer'

export default function App() {
  const [showControls, setShowControls] = useState(false)
  const [showText, setShowText] = useState(false)
  const [activeOrb, setActiveOrb] = useState<number | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [infoHovered, setInfoHovered] = useState(false)
  const navbarRef = useRef<HTMLElement | null>(null)
  const showInfoCard = infoOpen || infoHovered

  const [prismControls, setPrismControls] = useState<Partial<PrismControls>>({})
  const [introPhase, setIntroPhase] = useState<IntroPhase>('blank-beads')
  const [introPlaying, setIntroPlaying] = useState(true)
  const [introController] = useState(() => new HeroIntroController({
    onPhaseChange: (phase) => setIntroPhase(phase),
    onComplete: () => setIntroPlaying(false),
  }))

  const showNeutralTitle = !showText && activeOrb === null && introPhase !== 'blank-beads'

  // Dismiss info popover on outside click or Escape
  useEffect(() => {
    if (!infoOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target as Node)) {
        setInfoOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInfoOpen(false)
      }
    }
    window.addEventListener('pointerdown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [infoOpen])

  const rendererRef = useRef<PrismRenderer | null>(null)

  // Ensure completely clean neutral state on mount / page reload
  useEffect(() => {
    globalBeadHoverController.reset()
    globalPaperController.reset()
    setActiveOrb(null)
    setShowText(false)
    rendererRef.current?.invalidate()
  }, [])

  useEffect(() => {
    return () => {
      introController.dispose()
    }
  }, [introController])

  const handleRendererReady = useCallback((renderer: PrismRenderer) => {
    rendererRef.current = renderer
    introController.setRenderer(renderer)
  }, [introController])

  const handleExitTextMode = useCallback(() => {
    setActiveOrb(null)
    setShowText(false)
    globalBeadHoverController.reset()
    globalPaperController.slideOut()
    rendererRef.current?.invalidate()
  }, [])

  const handleOrbClick = useCallback((orbIndex: number | null) => {
    // If clicking on the same bead that is already active and text is visible, no-op
    if (orbIndex !== null && orbIndex === activeOrb && showText) {
      return
    }
    setActiveOrb(orbIndex)
    setShowText(orbIndex !== null)
  }, [activeOrb, showText])

  const handleReplayIntro = useCallback(() => {
    setIntroPlaying(true)
    handleExitTextMode()
    introController.replay()
  }, [handleExitTextMode, introController])

  // When an orb is active, Escape key unselects active orb and leaves text mode (in addition to native fullscreen exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const currentActive = globalBeadHoverController.getActiveBeadIndex()
        if (activeOrb !== null || currentActive !== null || showText) {
          handleExitTextMode()
        }
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const currentActive = globalBeadHoverController.getActiveBeadIndex()
        if (activeOrb !== null || currentActive !== null) {
          handleExitTextMode()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [activeOrb, showText, handleExitTextMode])

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
      className={`relative min-h-screen w-full font-sans overflow-x-hidden ${
        showText ? 'overflow-y-hidden' : 'overflow-y-auto'
      } bg-neutral-100 dark:bg-neutral-950`}
    >
      {/* Fixed 3D WebGPU Prism Background with dynamic ray bundles, wall plaster, and ?debug graph */}
      <div className="fixed inset-0 pointer-events-auto z-0">
        <PrismBackground
          enabled={true}
          debug={debugMode}
          onCloseDebug={toggleDebug}
          controls={prismControls}
          onRendererReady={handleRendererReady}
          onOrbClick={handleOrbClick}
        />
      </div>

      {/* Hero Scene Layer Reveal Intro Overlay */}
      <HeroIntroOverlay
        phase={introPhase}
        isPlaying={introPlaying}
        onSkip={handleSkipIntro}
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
          className="relative pointer-events-none"
        />
      </div>

      {/* Baduk-Aligned Granite-Embedded Editorial Typography */}
      <div
        className={`fixed inset-0 z-20 w-full h-full pointer-events-none transition-all duration-700 ease-out ${
          !showText || introPhase === 'blank-beads'
            ? 'opacity-0 pointer-events-none select-none'
            : 'opacity-100'
        }`}
      >
        <ArchiveTypography
          activeOrb={activeOrb}
          onExit={handleExitTextMode}
          onSelectProject={(index) => {
            if (index === activeOrb) return
            handleOrbClick(index)
            globalBeadHoverController.setActiveBeadIndex(index)
            rendererRef.current?.invalidate()
          }}
        />
      </div>

      {/* Neutral State Landing Title: Andy's Devlog (anchored to bottom-left) */}
      <div
        className={`fixed bottom-6 left-6 sm:bottom-8 sm:left-8 lg:bottom-10 lg:left-12 z-20 pointer-events-none select-none transition-all duration-700 ease-out ${
          showNeutralTitle
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="neutral-hero-title">
          Andy's Devlog
        </h1>
      </div>

      {/* Bottom Right Floating Action Bar: Info, Mailto, Twitter */}
      <nav
        ref={navbarRef}
        aria-label="Author navigation"
        className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 lg:bottom-10 lg:right-12 z-30 flex items-center gap-1 p-1.5 rounded-2xl border border-black/10 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-black/50 shadow-lg transition-all duration-500 pointer-events-auto ${
          introPhase === 'blank-beads' ? 'opacity-0 translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Floating Info Popover Card directly above navbar, centered and in line with the navbar */}
        <div
          role="tooltip"
          onMouseEnter={() => setInfoHovered(true)}
          onMouseLeave={() => setInfoHovered(false)}
          className={`author-info-popover ${
            showInfoCard ? '' : 'author-info-popover--hidden'
          }`}
        >
          Hi my name is Andy Jeon and I am a designer/developer looking to work in the creative dev industry. In-depth writings coming soon!
        </div>

        {/* 1) Info Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setInfoOpen((prev) => !prev)
          }}
          onMouseEnter={() => setInfoHovered(true)}
          onMouseLeave={() => setInfoHovered(false)}
          className="p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer inline-flex items-center justify-center"
          aria-label="About Andy"
          title="About Andy"
          aria-expanded={showInfoCard}
        >
          <Info className="w-4 h-4 pointer-events-none" />
        </button>

        {/* 2) Mailto Button -> asjeon00@gmail.com */}
        <a
          href="mailto:asjeon00@gmail.com?subject=Hello%20Andy"
          onClick={(e) => {
            e.stopPropagation()
            window.location.href = 'mailto:asjeon00@gmail.com?subject=Hello%20Andy'
          }}
          className="p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer inline-flex items-center justify-center"
          aria-label="Email Andy"
          title="Email: asjeon00@gmail.com"
        >
          <Mail className="w-4 h-4 pointer-events-none" />
        </a>

        {/* 3) Twitter Button -> x.com/remyOTD */}
        <a
          href="https://x.com/remyOTD"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer inline-flex items-center justify-center"
          aria-label="Follow Andy on X"
          title="Twitter / X (@remyOTD)"
        >
          <XTwitterIcon className="w-4 h-4 pointer-events-none" />
        </a>
      </nav>
    </div>
  )
}
