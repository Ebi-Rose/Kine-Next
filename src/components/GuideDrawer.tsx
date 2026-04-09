"use client";

import { useEffect, useCallback, useRef } from "react";

interface GuideSection {
  title: string;
  body: React.ReactNode;
}

const GUIDE_CONTENT: Record<string, { label: string; intro: string; sections: GuideSection[] }> = {
  "/app/onboarding": {
    label: "Setting up",
    intro: "We're learning about you so your programme fits from day one. Nothing here is permanent — you can change everything later in your profile.",
    sections: [
      {
        title: "Why these questions?",
        body: "Each answer shapes your exercises, volume, and how the programme adapts over time. More context means better coaching.",
      },
      {
        title: "Equipment",
        body: "Pick what you actually have access to. Your sessions will only include exercises you can do.",
      },
      {
        title: "Health & cycle",
        body: "Optional, but helps. Conditions and cycle data let the programme adapt to your body — never to limit you.",
      },
    ],
  },
  "/app": {
    label: "Your week",
    intro: "Your week at a glance. Each card is a session — tap to start when you're ready.",
    sections: [
      {
        title: "Training days",
        body: <>Today's session is highlighted. Tap <strong className="text-accent font-normal">Start session</strong> to begin. You can do sessions in any order.</>,
      },
      {
        title: "Rest days",
        body: "Rest days are part of the plan. You can add a session if you want, but recovery is built in.",
      },
      {
        title: "Weekly check-in",
        body: "At the end of the week, a quick check-in asks how training felt. This helps shape next week.",
      },
      {
        title: "Kinē isn't another AI wrapper",
        body: (
          <>
            You&apos;re not talking to a chatbot. Most fitness apps ask an AI what you should do — Kinē decides against your goals, cycle phase, injuries, and equipment first, then uses AI to personalise it.{" "}
            <a href="/app/how-we-build" className="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent">
              See how Kinē builds your programme →
            </a>
          </>
        ),
      },
    ],
  },
  "/app/pre-session": {
    label: "Before you start",
    intro: "Set up the session however works for you today. Nothing here is required.",
    sections: [
      {
        title: "Training shorthand",
        body: <><strong className="text-accent font-normal">3×8</strong> means 3 sets of 8 reps. <strong className="text-accent font-normal">3×8-10</strong> means start at 8 reps and add weight when you can hit 10 for all sets.</>,
      },
      {
        title: "Energy check-in",
        body: <>Tap <strong className="text-accent font-normal">Low</strong>, <strong className="text-accent font-normal">Normal</strong>, <strong className="text-accent font-normal">Good</strong>, or <strong className="text-accent font-normal">Great</strong>. This is just a note for you — it won't change your workout.</>,
      },
      {
        title: "Swap or skip exercises",
        body: <>Open <strong className="text-accent font-normal">Your exercises</strong> and tap <strong className="text-accent font-normal">Swap</strong> to find alternatives, or skip anything that doesn't work today.</>,
      },
      {
        title: "Adjust your time",
        body: "Use − / + to change session length. The session adjusts to fit.",
      },
      {
        title: "Session timing",
        body: <><strong className="text-accent font-normal">Timed</strong> counts rest between sets. <strong className="text-accent font-normal">Stopwatch</strong> gives you a running clock. <strong className="text-accent font-normal">Off</strong> means no timers.</>,
      },
      {
        title: "Coaching notes",
        body: "If you've added cycle data, you'll see notes about how your body typically responds right now. These are observations, not instructions.",
      },
    ],
  },
  "/app/session": {
    label: "Your session",
    intro: "Focus on the work. The app handles the rest.",
    sections: [
      {
        title: "Training shorthand",
        body: <><strong className="text-accent font-normal">3×8</strong> means 3 sets of 8 reps. <strong className="text-accent font-normal">3×8-10</strong> means start at 8 reps and add weight when you can hit 10 for all sets.</>,
      },
      {
        title: "Logging sets",
        body: "Enter reps and weight for each set. Set 1's weight auto-fills the rest — adjust if needed.",
      },
      {
        title: "Rest timer",
        body: <>In <strong className="text-accent font-normal">Timed</strong> mode, a countdown starts after you save. Tap to dismiss when you're ready.</>,
      },
      {
        title: "Moving through exercises",
        body: <><strong className="text-accent font-normal">Save</strong> collapses the current exercise and opens the next. <strong className="text-accent font-normal">Skip</strong> moves on without logging.</>,
      },
      {
        title: "Finishing up",
        body: "After your last exercise, a quick effort and soreness rating wraps things up.",
      },
    ],
  },
  "/app/warmup": {
    label: "Warm-up",
    intro: "A good warm-up makes everything feel better. Take your time here.",
    sections: [
      {
        title: "General warm-up",
        body: "5–10 minutes of light movement — walking, cycling, or dynamic stretches.",
      },
      {
        title: "Ramp sets",
        body: "For big lifts, these build up to your working weight gradually. They're preparation, not extra work.",
      },
      {
        title: "Injuries",
        body: "If you've noted injuries in your profile, you'll see modified warm-up suggestions here.",
      },
    ],
  },
  "/app/progress": {
    label: "Progress",
    intro: "What you see here is shaped by you. Your goal, your conditions, where you are in life — Kinē shows what's most likely to mean progress for you right now.",
    sections: [
      {
        title: "Strength tab",
        body: "Your top lifts, recent PRs, pattern balance, and effort — compared to your own baseline, never to anyone else.",
      },
      {
        title: "Body tab",
        body: "Progress photos lead, because strength shows up in your body before it shows up on the scale. Photos are private to you and never required.",
      },
      {
        title: "History tab",
        body: "Past sessions. Tap any session to see what you did and how it felt.",
      },
      {
        title: "Customize",
        body: "Anything Kinē decides to show or hide can be changed. Tap 'customize' under the title to take control — every card has a toggle, and you can ask why something was hidden.",
      },
    ],
  },
  "/app/profile": {
    label: "Profile",
    intro: "Tell Kinē about yourself. More context means better coaching — but nothing is required.",
    sections: [
      {
        title: "Coaching level",
        body: <><strong className="text-accent font-normal">Full</strong> gives you cues and tips. <strong className="text-accent font-normal">Feel</strong> is minimal. <strong className="text-accent font-normal">Off</strong> hides coaching. You can change this per-session too.</>,
      },
      {
        title: "Cycle tracking",
        body: "Log your cycle to see phase-aware coaching notes. These are gentle observations — they never change the programme.",
      },
      {
        title: "Injuries",
        body: "Note current injuries and Kinē will flag relevant exercises and suggest alternatives.",
      },
      {
        title: "Equipment",
        body: "Keep this up to date so your sessions only include exercises you can do.",
      },
    ],
  },
  "/app/week-checkin": {
    label: "Week reflection",
    intro: "A quick look back. Your honesty here shapes next week.",
    sections: [
      {
        title: "Volume feedback",
        body: "Was it too much, about right, or too easy? This directly influences next week.",
      },
      {
        title: "Effort and soreness",
        body: "Rate how hard it felt and how your body is holding up. No right answers.",
      },
      {
        title: "Notes",
        body: "Anything that affected your week — sleep, stress, life. Helps make sense of the data.",
      },
    ],
  },
};

const DEFAULT_GUIDE = {
  label: "Guide",
  intro: "Tap the ? button on any page to get tips and explanations specific to where you are in the app.",
  sections: [
    {
      title: "Getting started",
      body: "Head to your week view to see your training plan. Each day card shows your exercises — tap Start session when you're ready to train.",
    },
  ] as GuideSection[],
};

function getGuideForRoute(route: string): { label: string; intro: string; sections: GuideSection[] } {
  // Exact match first
  if (GUIDE_CONTENT[route]) return GUIDE_CONTENT[route];
  // Strip query params and try base path
  const base = route.split("?")[0];
  if (GUIDE_CONTENT[base]) return GUIDE_CONTENT[base];
  return DEFAULT_GUIDE;
}

interface GuideDrawerProps {
  open: boolean;
  onClose: () => void;
  route: string;
}

export default function GuideDrawer({ open, onClose, route }: GuideDrawerProps) {
  const { label, intro, sections } = getGuideForRoute(route);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus management + prevent body scroll
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => drawerRef.current?.focus());
    } else {
      document.body.style.overflow = "";
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleBackdropClick = useCallback(() => onClose(), [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[90] bg-black/50 backdrop-blur-[3px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        role="presentation"
        onClick={handleBackdropClick}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Guide: ${label}`}
        tabIndex={-1}
        className={`fixed top-0 right-0 bottom-0 z-[95] w-[78%] max-w-[340px] bg-bg border-l border-border transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-y-auto ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 pt-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] tracking-[1.5px] uppercase text-accent font-light">
              Guide
            </span>
            <button
              onClick={onClose}
              className="text-[11px] text-muted hover:text-text transition-colors"
            >
              close
            </button>
          </div>

          {/* Page label */}
          <h2 className="text-[9px] tracking-[1px] uppercase text-accent/50 mb-2">
            {label}
          </h2>

          {/* Intro */}
          <p className="text-[12px] text-muted2 font-light leading-[1.7] mb-4 pb-4 border-b border-border/60">
            {intro}
          </p>

          {/* Sections */}
          {sections.map((section, i) => (
            <div
              key={i}
              className="py-3 border-b border-border/60 last:border-b-0"
            >
              <div className="text-[13px] font-medium mb-1.5 text-text">{section.title}</div>
              <div className="text-[11px] text-muted2 font-light leading-[1.6]">
                {section.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
