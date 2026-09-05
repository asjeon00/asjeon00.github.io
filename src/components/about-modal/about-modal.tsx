import { useEffect } from "react";
import { X, Mail, ExternalLink, Sparkles } from "lucide-react";
import "./about-modal.css";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function XTwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-sm about-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl about-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Profile Section */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-950 text-white font-mono font-bold text-sm shadow-md border border-black/10 dark:border-white/20 select-none shrink-0">
            AJ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="about-modal-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans"
              >
                Andy Jeon
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Devlog
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
              Creative Developer & Graphics Programmer
            </p>
          </div>
        </div>

        {/* Bio Body Text */}
        <div className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 mb-6 font-sans">
          <p>
            Welcome to my devlog. I build interactive WebGPU experiences, shader experiments, and editorial digital spaces focused on real-time graphics and tactile physics.
          </p>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs">
            This space explores Baduk grid layouts, custom raymarching SDF pipelines, liquid caustics, and procedural Japanese paper simulations.
          </p>
        </div>

        {/* Skill / Focus Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          {["WebGPU", "WGSL", "Three.js", "Creative Direction", "Editorial Systems"].map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Direct Links / Contact Section */}
        <div className="pt-4 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <a
            href="mailto:asjeon00@gmail.com"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>asjeon00@gmail.com</span>
          </a>

          <div className="flex items-center gap-2">
            <a
              href="https://x.com/remyOTD"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition-colors"
              title="Twitter: @remyOTD"
            >
              <XTwitterIcon className="w-3.5 h-3.5" />
              <span>@remyOTD</span>
              <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
            </a>

            <a
              href="https://asjeon.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition-colors"
              title="Portfolio"
            >
              <span>Portfolio</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
