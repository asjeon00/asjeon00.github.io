import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';
import type { PrismRenderer } from '../../prism/renderer';
import type { IntroPhase } from '../hero-intro';
import { MEEDEE_ARCHIVE } from './archive-data';
import { useBadukGrid } from './use-baduk-grid';
import './archive-typography.css';

interface ArchiveViewProps {
  renderer: PrismRenderer | null;
  introPhase: IntroPhase;
  introPlaying: boolean;
}

const AUTO_PLAY_DURATION_MS = 7500;

export function ArchiveView({ renderer, introPhase, introPlaying }: ArchiveViewProps) {
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [activeAssetIndex, setActiveAssetIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const gridMetrics = useBadukGrid(renderer);

  const currentEntry = MEEDEE_ARCHIVE.entries[selectedEntryIndex] ?? MEEDEE_ARCHIVE.entries[0]!;
  const currentAsset = currentEntry.assets[activeAssetIndex] ?? currentEntry.assets[0]!;

  const progressRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  // Auto-advance media carousel with smooth progress bar fill (glauber.org signature)
  useEffect(() => {
    if (isPaused || currentEntry.assets.length <= 1) return;

    let animId: number;

    const step = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = now - lastTimeRef.current;
        const next = progressRef.current + delta / AUTO_PLAY_DURATION_MS;
        if (next >= 1.0) {
          progressRef.current = 0;
          setProgress(0);
          setActiveAssetIndex((prev) => (prev + 1) % currentEntry.assets.length);
        } else {
          progressRef.current = next;
          setProgress(next);
        }
      }
      lastTimeRef.current = now;
      animId = requestAnimationFrame(step);
    };

    lastTimeRef.current = null;
    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPaused, currentEntry.assets.length, selectedEntryIndex]);

  const handleSelectEntry = useCallback((idx: number) => {
    setSelectedEntryIndex(idx);
    setActiveAssetIndex(0);
    progressRef.current = 0;
    setProgress(0);
  }, []);

  const handleSelectAsset = useCallback((idx: number) => {
    setActiveAssetIndex(idx);
    progressRef.current = 0;
    setProgress(0);
  }, []);

  const handlePrevAsset = useCallback(() => {
    setActiveAssetIndex((prev) => (prev === 0 ? currentEntry.assets.length - 1 : prev - 1));
    progressRef.current = 0;
    setProgress(0);
  }, [currentEntry.assets.length]);

  const handleNextAsset = useCallback(() => {
    setActiveAssetIndex((prev) => (prev + 1) % currentEntry.assets.length);
    progressRef.current = 0;
    setProgress(0);
  }, [currentEntry.assets.length]);

  // Typography visibility during intro animation
  // Hidden during blank-beads (Phase 1), gracefully fades in as Baduk lines are drawn (Phase 2+)
  const isVisible = !introPlaying || introPhase !== 'blank-beads';
  const opacityClass = !isVisible
    ? 'opacity-0 translate-y-4 pointer-events-none'
    : 'opacity-100 translate-y-0';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-10 transition-all duration-1000 ease-out ${opacityClass} archive-container`}
    >
      {/* 1. Top Baduk Header Bar (Snaps along Top Baduk Perimeter) */}
      <div
        className="absolute top-6 left-8 sm:left-12 flex items-center gap-3 pointer-events-auto"
        style={{ zIndex: 15 }}
      >
        <a href="/" className="archive-brand font-medium">
          {MEEDEE_ARCHIVE.author}
        </a>
        <span className="text-black/20 dark:text-white/20 select-none">/</span>
        <span className="archive-brand text-neutral-500 dark:text-neutral-400">
          archive
        </span>
        <span className="text-black/20 dark:text-white/20 select-none">/</span>
        <span className="archive-brand font-semibold text-neutral-900 dark:text-white">
          {MEEDEE_ARCHIVE.title}
        </span>
      </div>

      {/* 2. Left Wing: Baduk Columns -8 to -3 (Editorial Narrative & Typesetting) */}
      <aside
        style={gridMetrics.leftWingStyle}
        className="hidden lg:flex flex-col justify-between overflow-y-auto pointer-events-auto p-4 sm:p-5 rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl transition-all duration-500"
      >
        <div>
          {/* Header & Baduk Grid Tag */}
          <div className="flex items-center justify-between mb-3">
            <span className="archive-wip-tag">{MEEDEE_ARCHIVE.wipTag}</span>
            <div className="flex items-center gap-1.5 archive-status">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{MEEDEE_ARCHIVE.status}</span>
            </div>
          </div>

          {/* Project Title + Year */}
          <div className="archive-title-group mb-4">
            <h1 className="archive-title">{MEEDEE_ARCHIVE.title}</h1>
            <h2 className="archive-year">{MEEDEE_ARCHIVE.year}</h2>
          </div>

          {/* Date Switcher Tabs */}
          <div className="archive-entry-tabs">
            {MEEDEE_ARCHIVE.entries.map((entry, idx) => (
              <button
                key={entry.id}
                onClick={() => handleSelectEntry(idx)}
                data-active={idx === selectedEntryIndex}
                className="archive-entry-tab"
                type="button"
              >
                <span>{entry.formattedDate.split(',')[0]}</span>
              </button>
            ))}
          </div>

          {/* Current Log Date & Category */}
          <div className="flex items-center justify-between archive-date mb-2">
            <span>{currentEntry.formattedDate}</span>
            <span className="text-neutral-400 dark:text-neutral-500 font-normal">
              {currentEntry.category}
            </span>
          </div>

          {/* Narrative Text Paragraphs */}
          <div className="space-y-3 mb-4">
            {currentEntry.text.map((p, i) => (
              <p key={i} className="archive-narrative">
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Technical Specifications Grid Snapped to Baduk Ticks */}
        {currentEntry.specs && (
          <div className="archive-specs-grid">
            {currentEntry.specs.map((spec, i) => (
              <div key={i} className="archive-spec-item">
                <span className="archive-spec-label">{spec.label}</span>
                <span className="archive-spec-val">{spec.value}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* 3. Right Wing: Baduk Columns +3 to +8 (Interactive Media Stage & Thumbnails) */}
      <section
        style={gridMetrics.rightWingStyle}
        className="hidden lg:flex flex-col pointer-events-auto p-4 sm:p-5 rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl transition-all duration-500"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Stage Header Info */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-300 font-medium">
              Asset {activeAssetIndex + 1} / {currentEntry.assets.length}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {currentEntry.title}
          </span>
        </div>

        {/* Main Media Stage Card */}
        <div className="archive-stage-card">
          <div className="archive-media-frame">
            <img
              key={currentAsset.id}
              src={currentAsset.url}
              alt={currentAsset.alt}
              className="archive-media-img"
              loading="lazy"
            />

            {/* Prev / Next Controls */}
            {currentEntry.assets.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevAsset}
                  className="archive-stage-nav archive-stage-nav--prev"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextAsset}
                  className="archive-stage-nav archive-stage-nav--next"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Caption */}
          {currentAsset.caption && (
            <div className="archive-media-caption">
              {currentAsset.caption}
            </div>
          )}
        </div>

        {/* Thumbnails Strip with Progress Bar Fill (glauber.org signature) */}
        {currentEntry.assets.length > 1 && (
          <div className="archive-thumbs-strip">
            {currentEntry.assets.map((asset, idx) => {
              const isActive = idx === activeAssetIndex;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelectAsset(idx)}
                  className="archive-thumb-btn"
                  aria-current={isActive}
                  aria-label={`Select asset ${idx + 1}`}
                >
                  <div className="archive-thumb-img-box">
                    <img
                      src={asset.url}
                      alt={asset.alt}
                      className="archive-thumb-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="archive-thumb-bar">
                    <div
                      className="archive-thumb-fill"
                      style={{
                        transform: isActive ? `scaleX(${progress})` : 'scaleX(0)',
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Responsive Mobile / Tablet Bottom Drawer (Screens < 1024px) */}
      <div className="lg:hidden absolute bottom-4 inset-x-4 pointer-events-auto p-4 rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-xl max-h-[40vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="archive-wip-tag">{MEEDEE_ARCHIVE.wipTag}</span>
            <span className="font-semibold text-sm">{MEEDEE_ARCHIVE.title}</span>
            <span className="text-xs text-neutral-400">{MEEDEE_ARCHIVE.year}</span>
          </div>
          <span className="font-mono text-[10px] text-neutral-400">
            {currentEntry.formattedDate}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 line-clamp-3">
          {currentEntry.text[0]}
        </p>
      </div>
    </div>
  );
}
