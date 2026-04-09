// ── Education content library ──
//
// Typed source of truth for in-app Education articles. v1 is hand-ported
// from the canonical markdown files at content/education/*.md in the
// monorepo root. When the library grows past ~10 articles, replace this
// with a build script that reads the .md files and emits the same shape.
//
// Authoring rules: docs/specs/education-personalization.md §4
// Voice rules:     docs/specs/education-personalization.md §6

import type { EducationArticle } from "@/lib/education-engine";

export const educationLibrary: EducationArticle[] = [
  {
    id: "why-glutes-are-the-priority",
    title: "Why glutes are the priority — and what that means for your sessions",
    description:
      "The posterior chain does the heavy lifting in women's training. Here's why, and how Kine reflects it.",
    published: "2026-04-07",
    length: "short",
    topic: "programming",
    audience: {
      level: "any",
      life_stage: "any",
      goal: "any",
      equipment_min: "bodyweight_only",
    },
    surfaces_at: ["onboarding", "first_30_days", "anytime"],
    gentle: true,
    body: `Most general training programs were designed around men's bodies and then scaled down. The result is a lot of bench pressing and not much else. For women, that's the wrong centre of gravity.

The posterior chain — glutes, hamstrings, upper back — is where most women have the largest unused capacity and the biggest functional return. Strong glutes change how you stand, walk, climb stairs, and lift things off the floor. Strong upper back is what holds your posture together when everything else is tired.

That's why your Kine sessions look the way they do. Hinges, rows, hip thrusts, and squats are the spine of the program. Pressing and curls are still there — they're just not the headline.

You don't need to do anything differently. The programming already reflects this. But if you've ever wondered why you're hip-thrusting more than you're benching, that's the reason.`,
  },
  {
    id: "perimenopause-recovery-window",
    title: "Recovery in perimenopause is longer — and that's not a setback",
    description:
      "What changes, what doesn't, and why a 12-week view is the only honest way to read your progress.",
    published: "2026-04-07",
    length: "medium",
    topic: "life_stage",
    audience: {
      level: "any",
      life_stage: "perimenopause",
      goal: "any",
      equipment_min: "bodyweight_only",
    },
    surfaces_at: ["anytime"],
    gentle: true,
    body: `Two things are true at once in perimenopause: you can absolutely keep getting stronger, and the rhythm of how that strength shows up changes.

The headline change is recovery. Hormonal shifts in this window are associated with longer recovery times for many women, and the same session can take longer to bounce back from than it used to. Sleep often gets noisier in the same window, which compounds it. None of this is a wall — it's a different tempo.

Three things tend to help:

Read your progress over 12 weeks, not 12 days. Week-to-week numbers are noisy at the best of times, and they're noisier now. Kine sets your default progress window to 12 weeks if you've told us you're in perimenopause. A dip one week is not a regression — it's the chart picking up the variation that's always been there.

Protect the heavy days. You don't need more sessions. You need the heavy ones to land on days you've actually recovered. Listen to the effort signal more than the calendar.

Don't read body weight as a verdict. Body composition shifts in this window for reasons that have nothing to do with how hard you're training. The scale was always a noisy signal; in perimenopause it's noise on noise.

What hasn't changed: resistance training in this stage of life is one of the most well-supported forms of movement for long-term strength and mobility. Keep going.

(General wellness information — not medical advice. Talk to your clinician about anything specific to your health.)`,
  },
  {
    id: "returning-after-baby-first-twelve-weeks",
    title: "The first twelve weeks back — what to expect, what to ignore",
    description:
      "Returning to lifting after a baby isn't a comeback story. It's a rebuild, and the rules are different.",
    published: "2026-04-07",
    length: "medium",
    topic: "life_stage",
    audience: {
      level: "any",
      life_stage: "postpartum",
      goal: "return_to_training",
      equipment_min: "bodyweight_only",
    },
    surfaces_at: ["anytime"],
    gentle: true,
    body: `Before anything in this article: if you haven't been cleared to return to exercise by your healthcare provider yet, wait. The timeline below assumes you've had your postnatal check and been told you're good to start loading again. If you haven't, that's the first step — not this.

The internet wants you to "bounce back". Don't. Bouncing isn't a thing your body is set up to do right now, and the chase is what causes most of the injuries we see in post-partum lifters.

Here's what the first twelve weeks back actually look like.

Weeks 1–4: relearning your own body. The lifts you used to do are still in your nervous system, but the connection is quieter. You'll feel uncoordinated. Things that used to be easy will feel heavy. This is normal and it goes away. Your job in this window isn't to lift heavy — it's to rebuild the connection between brain and muscle without anything hurting.

Weeks 5–8: building tolerance. Loads start to creep up. You'll have good days and very ordinary days. Sleep is the dominant variable. If you slept badly, do less — not because you're being "soft", because the cost-benefit just shifted. Pelvic floor and core work earns its keep here.

Weeks 9–12: finding the new normal. By the end of this window most lifters have a sense of what "today's version" of a heavy day looks like. It's often not the same as pre-baby and that's fine. The lifters who do best from here are the ones who anchor on what they can do today, not what they used to do.

A few things Kine deliberately won't show you in this window. PR feeds — there's no PR to chase yet, and chasing one is the wrong goal. Strength trend lines — twelve weeks is not enough data, and a noisy line will read like a verdict it isn't. Body weight as a headline — not now.

What you'll see instead: sessions completed (counted, not graded), the rehab and reintroduction work, and your symptom log if you're using it.

This isn't a smaller version of training. It's its own phase. Treat it that way and the rest comes back.`,
  },
];
