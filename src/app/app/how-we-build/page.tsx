"use client";

import Link from "next/link";

const SECTIONS = [
  {
    title: "Real periodisation, not random workouts",
    body: "Every week follows a structured 3-week block cycle: volume, intensity, and deload. Your programme progresses systematically based on exercise science — not by shuffling exercises randomly.",
  },
  {
    title: "Your body, not a template",
    body: "Kinē adapts around your cycle, conditions like PCOS or endometriosis, injuries, and equipment. The AI doesn\u2019t just swap exercises — it adjusts volume, intensity, and recovery timing based on how your body works.",
  },
  {
    title: "Evidence-based exercise selection",
    body: "Every exercise in our library is tagged with muscle group, movement pattern, equipment requirements, and contraindication flags. Swaps aren\u2019t random — they match the biomechanical purpose of the original.",
  },
  {
    title: "Progressive overload, tracked",
    body: "Session logs feed back into programme generation. Your weights, reps, effort ratings, and soreness data shape next week\u2019s prescription. The AI learns what works for you specifically.",
  },
  {
    title: "Built for women who lift",
    body: "Most fitness apps treat hormonal cycles as an afterthought. Kinē was designed from the ground up to integrate cycle-aware training, with research-backed adjustments to volume and intensity across your month.",
  },
  {
    title: "Your data stays yours",
    body: "Health data is processed locally where possible. You can export everything at any time. We don\u2019t sell data, show ads, or share your information with third parties. GDPR compliant by design.",
  },
  {
    title: "No engagement tricks",
    body: "No streaks that guilt you into training when you should rest. No gamification that prioritises app usage over recovery. Kinē tells you when to rest and means it.",
  },
  {
    title: "Transparent AI",
    body: "Every AI-generated programme comes with coach notes explaining why exercises were chosen and how the week is structured. You can see the reasoning, not just the output.",
  },
];

export default function HowWeBuildPage() {
  return (
    <div className="pb-10">
      <Link
        href="/app"
        className="text-[13px] text-muted hover:text-text transition-colors mb-3 flex items-center gap-1.5"
      >
        &larr; Back
      </Link>

      <div className="mt-4">
        <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-2">
          Under the hood
        </p>
        <h1 className="font-display text-2xl tracking-wide text-text">
          How Kin&#x0113; is built differently
        </h1>
        <p className="mt-2 text-xs text-muted2 font-light leading-relaxed max-w-md">
          Most AI fitness apps wrap a chatbot around generic templates. Kin&#x0113; is a structured, evidence-based training system that uses AI to personalise &mdash; not to improvise.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {SECTIONS.map((section, i) => (
          <div
            key={i}
            className="rounded-[14px] border border-border bg-surface p-5"
          >
            <h2 className="text-sm font-medium text-text">{section.title}</h2>
            <p className="mt-2 text-xs text-muted2 font-light leading-relaxed">
              {section.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-muted leading-relaxed">
          Built by lifters, for lifters. No shortcuts.
        </p>
      </div>
    </div>
  );
}
