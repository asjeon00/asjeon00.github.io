import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowUpRight } from "lucide-react";
import { PROJECTS_DATA, type ProjectData } from "./archive-data";
import "./archive-typography.css";

export interface ArchiveTypographyProps {
  readonly activeOrb?: number | null;
  readonly onExit?: () => void;
  readonly onSelectProject?: (index: number) => void;
}

export function ArchiveTypography({
  activeOrb,
  onExit,
  onSelectProject,
}: ArchiveTypographyProps = {}) {
  // Target active project index (0..7) based on activeOrb prop
  const targetProjectIndex =
    typeof activeOrb === "number" &&
    activeOrb >= 0 &&
    activeOrb < PROJECTS_DATA.length
      ? activeOrb
      : null;

  // Track currently displayed project and transition state for smooth ease-out/ease-in
  const [displayedIndex, setDisplayedIndex] = useState<number>(
    targetProjectIndex ?? 0
  );
  const [transitionStage, setTransitionStage] = useState<
    "visible" | "fading-out" | "fading-in"
  >("visible");
  const prevActiveOrbRef = useRef<number | null>(targetProjectIndex);

  // Track active slide index for the current project
  const [activeSlide, setActiveSlide] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle project transitions
  useEffect(() => {
    // When text mode is closed / activeOrb is null, reset prevActiveOrb tracking
    if (targetProjectIndex === null) {
      prevActiveOrbRef.current = null;
      return;
    }

    // If clicking on the same bead that is already active, do nothing
    if (
      targetProjectIndex === prevActiveOrbRef.current &&
      targetProjectIndex === displayedIndex
    ) {
      return;
    }

    // If opening from closed/neutral state, show the project immediately without transition
    if (prevActiveOrbRef.current === null) {
      prevActiveOrbRef.current = targetProjectIndex;
      setDisplayedIndex(targetProjectIndex);
      setActiveSlide(0);
      setImageLoaded(false);
      setTransitionStage("visible");
      return;
    }

    // Switching between two different active beads: ease out old text, switch data, then ease in new text
    const nextIndex = targetProjectIndex;
    prevActiveOrbRef.current = nextIndex;
    setTransitionStage("fading-out");

    const timer = setTimeout(() => {
      setDisplayedIndex(nextIndex);
      setActiveSlide(0);
      setImageLoaded(false);
      setTransitionStage("fading-in");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionStage("visible");
        });
      });
    }, 280);

    return () => clearTimeout(timer);
  }, [targetProjectIndex, displayedIndex]);

  const project: ProjectData =
    PROJECTS_DATA[displayedIndex] ?? PROJECTS_DATA[0]!;

  const totalImages = project.images.length;
  const currentImage = project.images[activeSlide] ?? project.images[0]!;

  const handlePrevSlide = useCallback(() => {
    if (totalImages <= 1) return;
    setImageLoaded(false);
    setActiveSlide((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  const handleNextSlide = useCallback(() => {
    if (totalImages <= 1) return;
    setImageLoaded(false);
    setActiveSlide((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const handleSelectSlide = useCallback((index: number) => {
    setImageLoaded(false);
    setActiveSlide(index);
  }, []);

  const handlePrevProject = useCallback(() => {
    const nextIdx =
      (displayedIndex - 1 + PROJECTS_DATA.length) % PROJECTS_DATA.length;
    onSelectProject?.(nextIdx);
  }, [displayedIndex, onSelectProject]);

  const handleNextProject = useCallback(() => {
    const nextIdx = (displayedIndex + 1) % PROJECTS_DATA.length;
    onSelectProject?.(nextIdx);
  }, [displayedIndex, onSelectProject]);

  // Keyboard navigation for slides and project cycling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        if (totalImages > 1) {
          handlePrevSlide();
        } else {
          handlePrevProject();
        }
      } else if (e.key === "ArrowRight") {
        if (totalImages > 1) {
          handleNextSlide();
        } else {
          handleNextProject();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalImages, handlePrevSlide, handleNextSlide, handlePrevProject, handleNextProject]);

  const transitionClass = `archive__transition archive__transition--${transitionStage}`;

  return (
    <article
      className="archive-root archive-embedded-text"
      aria-label={`Project Archive: ${project.title}`}
    >
      <div className="archive__wrapper">
        {/* Editorial Top Header */}
        <header className="archive__header">
          <div className="archive__header-info">
            <div className={`archive__title-container ${transitionClass}`}>
              <h1 className="archive__title">{project.title}</h1>
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="archive__title-link"
                  aria-label={`Visit ${project.title} website`}
                  title={`Visit ${project.title} (opens in new tab)`}
                >
                  <ArrowUpRight className="archive__title-link-icon" />
                </a>
              )}
            </div>
          </div>

          <div className="archive__header-actions">
            {/* Tactile Back / Exit Button */}
            <button
              type="button"
              onClick={onExit}
              className="archive__back-btn"
              aria-label="Back to neutral view"
              title="Leave text mode and unselect bead (Esc)"
            >
              <ArrowLeft className="archive__back-btn-icon" />
              <span className="archive__back-btn-label">Back</span>
              <kbd className="archive__back-btn-kbd">ESC</kbd>
            </button>
          </div>
        </header>

        {/* Single Non-Scrolling Narrative Section with Ease In / Ease Out */}
        <main className={`archive__single-view ${transitionClass}`}>
          {/* Left Wing: Single Date Heading & Passage */}
          <aside className="archive__wip-side">
            <h2 className="archive__wip-date">{project.date}</h2>

            <div className="archive__wip-text">
              {project.passage}
            </div>
          </aside>

          {/* Center Corridor: Columns 5-8 remain completely clear for 3D glass beads! */}
          <div className="archive__center-corridor" aria-hidden="true" />

          {/* Right Wing: Single Image Viewer & Viewfinder Stage */}
          <section className="archive__wip-main" aria-label="Project Visual Gallery">
            {/* Viewfinder Main Viewport Frame */}
            <div
              className="archive__placeholder-stage"
              style={{
                aspectRatio: currentImage.aspectRatio ?? "16 / 10",
              }}
            >

              {/* Viewport Image Display with crossfade transition */}
              <div className="archive__image-container">
                <img
                  key={currentImage.url}
                  src={currentImage.url}
                  alt={currentImage.label}
                  className={`archive__image-element ${
                    imageLoaded ? "archive__image-element--loaded" : ""
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  loading="eager"
                />
              </div>

              {/* Interactive Half-Stage Navigation Click Zones for multi-image */}
              {totalImages > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="archive__wip-nav archive__wip-nav--prev"
                    aria-label="Previous image"
                    title="Previous image"
                  >
                    <span className="archive__wip-nav-icon">
                      <ChevronLeft className="w-4 h-4" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="archive__wip-nav archive__wip-nav--next"
                    aria-label="Next image"
                    title="Next image"
                  >
                    <span className="archive__wip-nav-icon">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Viewfinder Bottom Bar: Minimap & Caption */}
            <div className="archive__viewfinder-bar">
              <div className="archive__minimap-group">
                {/* 1/1 (or X/N) Minimap Counter Label */}
                <div className="archive__minimap-counter" title="Minimap Pagination">
                  <span className="archive__minimap-num">{activeSlide + 1}</span>
                  <span className="archive__minimap-slash">/</span>
                  <span className="archive__minimap-total">{totalImages}</span>
                </div>

                {/* Minimap Slots Bar: Always present even if only 1 image (1/1) */}
                <div
                  className="archive__wip-thumbs"
                  role="tablist"
                  aria-label="Viewfinder image minimap"
                >
                  {project.images.map((img, slideIdx) => {
                    const isCurrent = slideIdx === activeSlide;
                    return (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => handleSelectSlide(slideIdx)}
                        className="archive__wip-thumb"
                        aria-current={isCurrent ? "true" : undefined}
                        aria-label={`View image plate ${slideIdx + 1} of ${totalImages}`}
                        title={img.label}
                      >
                        <span className="archive__wip-thumb-box">
                          {slideIdx + 1}
                        </span>
                        <span className="archive__wip-thumb-bar">
                          <span className="archive__wip-thumb-fill" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </article>
  );
}
