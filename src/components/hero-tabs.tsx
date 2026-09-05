import { useState, useRef, useEffect } from "react";
import { Check, Copy } from "lucide-react";

export type HeroTab = "Prompt" | "CLI" | "Skill" | "MCP";

const tabContent: Record<
  HeroTab,
  { text: string; mono: boolean; wrap: boolean }
> = {
  Prompt: {
    text: "Setup vgpu on my project, run `npx vgpu`",
    mono: false,
    wrap: false,
  },
  CLI: { text: "`pnpm add vgpu`", mono: true, wrap: false },
  Skill: {
    text: "`npx skills add vercel-labs/vgpu`",
    mono: true,
    wrap: false,
  },
  MCP: {
    text: "`npx -y add-mcp https://vgpu.sh/api/mcp -g`",
    mono: true,
    wrap: true,
  },
};

const tabs = Object.keys(tabContent) as HeroTab[];

function stripBackticks(text: string): string {
  return text.replace(/`/g, "");
}

function FormattedText({ text, mono, wrap }: { text: string; mono: boolean; wrap: boolean }) {
  const parts = text.split("`");
  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          return (
            <span key={index} className={wrap ? "whitespace-normal" : "whitespace-nowrap"}>
              {part}
            </span>
          );
        }
        return (
          <code
            key={index}
            className={`font-mono text-[0.95em] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded ${
              wrap ? "whitespace-normal" : "whitespace-nowrap"
            }`}
          >
            {part}
          </code>
        );
      })}
    </>
  );
}

export function HeroTabs() {
  const [activeTab, setActiveTab] = useState<HeroTab>("Prompt");
  const [leavingTab, setLeavingTab] = useState<HeroTab | null>(null);
  const [copied, setCopied] = useState(false);
  const parkTimer = useRef<number | undefined>(undefined);
  const current = tabContent[activeTab];

  const selectTab = (tab: HeroTab) => {
    if (tab === activeTab) return;
    setLeavingTab(activeTab);
    setActiveTab(tab);
    window.clearTimeout(parkTimer.current);
    parkTimer.current = window.setTimeout(() => setLeavingTab(null), 150);
  };

  useEffect(() => () => window.clearTimeout(parkTimer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(stripBackticks(current.text));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <div data-hero-tabs className="flex w-full flex-col">
      <div
        data-hero-tabs-list
        role="tablist"
        aria-label="Setup option"
        className="flex items-center text-[14px] sm:text-[15px] leading-none"
      >
        {tabs.map((tab, idx) => {
          const isActive = tab === activeTab;
          return (
            <div key={tab} className="flex items-center">
              {idx > 0 && (
                <span aria-hidden="true" className="px-2.5 opacity-30 select-none">
                  ·
                </span>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectTab(tab)}
                className={`transition-opacity cursor-pointer font-medium ${
                  isActive ? "opacity-100 font-semibold" : "opacity-50 hover:opacity-80"
                }`}
              >
                {tab}
              </button>
            </div>
          );
        })}
      </div>

      <div data-hero-tabs-rule aria-hidden="true" className="mb-3 mt-4 h-px w-full" />

      <button
        data-hero-tabs-copy
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : `Copy: ${stripBackticks(current.text)}`}
        className="group relative w-full text-left py-1 text-[14px] sm:text-[15px] leading-relaxed opacity-90 transition-opacity hover:opacity-100 flex items-center justify-between cursor-pointer"
      >
        <span className="flex-1 pr-6 font-mono text-[13px] sm:text-[14px]">
          <FormattedText text={current.text} mono={current.mono} wrap={current.wrap} />
        </span>
        <span
          aria-hidden="true"
          className={`transition-opacity ${
            copied ? "opacity-100 text-green-600 dark:text-green-400" : "opacity-30 group-hover:opacity-70"
          }`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </span>
      </button>
    </div>
  );
}
