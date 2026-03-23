"use client";

import { useEffect, useCallback } from "react";

interface GuideSection {
  title: string;
  body: React.ReactNode;
}

const GUIDE_CONTENT: Record<string, { label: string; intro: string; sections: GuideSection[] }> = {
  "/app": {
    label: "Your week",
    intro: "This is your home base — everything starts here. Your week is laid out day by day, with sessions ready when you are.",
    sections: [
      {
        title: "How your week works",
        body: <>Each card is a training day built around your goal, equipment, and schedule. Today&apos;s session is highlighted — tap <strong className="text-accent font-normal">Start session</strong> when you&apos;re ready. There&apos;s no pressure to follow the exact order, but the sequence is designed to balance your recovery.</>,
      },
      {
        title: "Rest days matter",
        body: "Rest days aren't empty days — they're part of the programme. Your muscles grow and adapt during recovery, not during the session itself. You can add a session to a rest day if you want, but the plan accounts for recovery by default.",
      },
      {
        title: "End-of-week check-in",
        body: "At the end of each week, you'll get a short check-in asking how training felt. Was it too much? Too easy? About right? Your honest answer helps Kine fine-tune next week's volume — small adjustments, never drastic swings.",
      },
      {
        title: "Blocks and phases",
        body: "Your training is organised in 4-week blocks. Each block has a purpose — building volume, pushing intensity, or recovering. The tag at the top tells you where you are. Trust the process, even when a deload week feels easy.",
      },
    ],
  },
  "/app/pre-session": {
    label: "Before you start",
    intro: "This is your moment to check in with yourself and set up the session the way you want it. Nothing here is mandatory — it's all about making the session work for you today.",
    sections: [
      {
        title: "How are you feeling?",
        body: <>The energy check-in is for you, not for judgement. Tap <strong className="text-accent font-normal">Low</strong>, <strong className="text-accent font-normal">Normal</strong>, <strong className="text-accent font-normal">Good</strong>, or <strong className="text-accent font-normal">Great</strong> — it won&apos;t change your workout. Over time, this data helps you spot patterns (like energy dipping at certain points in your cycle or after poor sleep).</>,
      },
      {
        title: "Don&apos;t like an exercise?",
        body: <>No problem. Open <strong className="text-accent font-normal">Your exercises</strong> and tap <strong className="text-accent font-normal">Swap</strong> next to any movement. Kine will suggest alternatives that hit the same muscles with equipment you actually have. You can also skip exercises entirely — the session adapts.</>,
      },
      {
        title: "Short on time?",
        body: "Use the duration controls to shorten (or extend) your session. When you reduce time, Kine drops isolation exercises first and keeps the compounds that matter most. If you extend, it'll suggest exercises you could add. The session always stays balanced.",
      },
      {
        title: "Timing your session",
        body: <><strong className="text-accent font-normal">Timed</strong> gives you automatic rest countdowns between sets — great if you want structure. <strong className="text-accent font-normal">Stopwatch</strong> is a simple running clock for when you prefer to self-pace. <strong className="text-accent font-normal">Off</strong> means no timers at all. You can set compound and isolation rest periods separately when using Timed.</>,
      },
      {
        title: "Coaching notes",
        body: "If you've added cycle data, you'll see phase-aware notes here — gentle context about how your body typically responds right now. These are observations, not instructions. You always decide how hard to push.",
      },
    ],
  },
  "/app/session": {
    label: "During your session",
    intro: "You're in it now. Focus on the work — the app handles the tracking. Everything here is designed to stay out of your way until you need it.",
    sections: [
      {
        title: "Logging your sets",
        body: "Enter reps and weight for each set. When you fill in set 1, that weight auto-fills the remaining sets — just adjust if you change weight. For bodyweight exercises, you only need to enter reps. Don't stress about being exact — a completed session beats a perfect log.",
      },
      {
        title: "Rest between sets",
        body: <>If you chose <strong className="text-accent font-normal">Timed</strong> mode, a rest countdown appears after you save each exercise. It&apos;s a guide, not a gate — tap to dismiss whenever you&apos;re ready. The timer uses the compound/isolation rest periods you set in the pre-session screen.</>,
      },
      {
        title: "Moving through exercises",
        body: <>Tap <strong className="text-accent font-normal">Save</strong> after logging all sets for an exercise. The card collapses and the next one opens automatically. Not feeling an exercise? <strong className="text-accent font-normal">Skip</strong> moves you forward without logging it. You can also swap exercises mid-session if something isn&apos;t working.</>,
      },
      {
        title: "After your last exercise",
        body: "You'll do a quick effort and soreness rating — just two taps. This feedback goes directly into your training history and helps Kine understand how sessions are landing. Then you'll see a summary of what you accomplished.",
      },
    ],
  },
  "/app/warmup": {
    label: "Warming up",
    intro: "A good warm-up makes the working sets feel better and reduces injury risk. This is time well spent, not time wasted.",
    sections: [
      {
        title: "General warm-up",
        body: "Start with 5-10 minutes of light movement to raise your heart rate and body temperature. This gets blood flowing to your muscles and lubricates your joints. A brisk walk, light cycling, or dynamic stretches all work.",
      },
      {
        title: "Ramp sets",
        body: "For compound lifts (squats, bench, deadlifts), ramp sets gradually build up to your working weight. They prime your nervous system and let you practice the movement pattern before it gets heavy. These aren't meant to be tiring — they're preparation.",
      },
      {
        title: "Working around injuries",
        body: "If you've noted injuries in your profile, you'll see specific warm-up modifications here. These help you prepare safely without aggravating existing issues. Warming up the area around an injury often helps more than avoiding it entirely.",
      },
    ],
  },
  "/app/progress": {
    label: "Your progress",
    intro: "This is where all your hard work shows up. Every set you log builds the picture over time — the trends matter more than any single session.",
    sections: [
      {
        title: "Lift history",
        body: "Tap any exercise to see your best sets over time. The chart tracks weight progression week by week. Don't worry about linear progress — strength comes in waves, especially with cycle-aware training. Look for the overall trend, not the day-to-day.",
      },
      {
        title: "Personal records",
        body: "PRs are tracked automatically whenever you log a set that beats your previous best for that exercise. They'll pop up during your session with a celebration. Small PRs count just as much as big ones — a 1kg increase is still progress.",
      },
      {
        title: "Session history",
        body: "Scroll down to see your completed sessions — what you did, how you rated effort, and any analysis. This is useful for spotting patterns: which sessions felt great, which felt heavy, and whether that lined up with your energy or cycle phase.",
      },
    ],
  },
  "/app/profile": {
    label: "Your profile",
    intro: "This is where you tell Kine about yourself. The more context you provide, the smarter your coaching becomes — but nothing here is required.",
    sections: [
      {
        title: "Coaching level",
        body: <><strong className="text-accent font-normal">Full</strong> coaching gives you form cues, breathing reminders, and context about why each exercise is in your plan. <strong className="text-accent font-normal">Feel</strong> strips it back to the essentials. <strong className="text-accent font-normal">Off</strong> hides all coaching — just the exercises and the numbers. You can override this per-session in the pre-session screen.</>,
      },
      {
        title: "Cycle tracking",
        body: "If you track your cycle, Kine uses it to give you phase-aware coaching notes — like when your body typically responds best to training, or when recovery might take longer. It never automatically changes your programme. The guidance is there if you want it, invisible if you don't.",
      },
      {
        title: "Injuries and limitations",
        body: "Note any current injuries or areas of concern. Kine will flag exercises that might need modification and suggest alternatives. You'll also see injury-specific warm-up guidance. Update these as things change — what hurts today might be fine next month.",
      },
      {
        title: "Equipment",
        body: "Keep your available equipment up to date. This directly affects which exercises appear in your sessions — Kine will never programme something you can't do with what you have.",
      },
    ],
  },
  "/app/week-checkin": {
    label: "Week reflection",
    intro: "Take a moment to look back at the week. This isn't a test — it's a conversation between you and your programme. Your honesty here makes next week better.",
    sections: [
      {
        title: "How it shapes your plan",
        body: "Your check-in directly influences next week's programming. If you say the volume was too much, Kine dials it back slightly. Too easy? It nudges things up. The adjustments are always gradual — no dramatic swings.",
      },
      {
        title: "Effort and soreness",
        body: "Rate how hard the week felt overall, and how your body is holding up. There are no right answers. A week that felt hard isn't a failure, and a week that felt easy doesn't mean you're not progressing. The data helps Kine calibrate over time.",
      },
      {
        title: "Adding context",
        body: "The notes field is for anything that affected your training — bad sleep, work stress, travel, illness, life happening. This context helps make sense of the numbers. A tough week with poor sleep is very different from a tough week with great recovery.",
      },
    ],
  },
};

const DEFAULT_SECTIONS: GuideSection[] = [
  {
    title: "Need help?",
    body: "Navigate to any main page and open the guide for page-specific tips and explanations.",
  },
];

function getGuideForRoute(route: string): { label: string; sections: GuideSection[] } {
  // Exact match first
  if (GUIDE_CONTENT[route]) return GUIDE_CONTENT[route];
  // Strip query params and try base path
  const base = route.split("?")[0];
  if (GUIDE_CONTENT[base]) return GUIDE_CONTENT[base];
  return { label: "Guide", sections: DEFAULT_SECTIONS };
}

interface GuideDrawerProps {
  open: boolean;
  onClose: () => void;
  route: string;
}

export default function GuideDrawer({ open, onClose, route }: GuideDrawerProps) {
  const { label, sections } = getGuideForRoute(route);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const handleBackdropClick = useCallback(() => onClose(), [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[90] bg-black/50 backdrop-blur-[3px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleBackdropClick}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[95] w-[78%] max-w-[340px] bg-[#151515] border-l border-white/[0.06] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-y-auto ${
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
          <div className="text-[9px] tracking-[1px] uppercase text-accent/50 mb-3">
            {label}
          </div>

          {/* Sections */}
          {sections.map((section, i) => (
            <div
              key={i}
              className="py-3 border-b border-white/[0.04] last:border-b-0"
            >
              <div className="text-[13px] font-medium mb-1.5">{section.title}</div>
              <div className="text-[11px] text-[#7a7070] font-light leading-[1.6]">
                {section.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
