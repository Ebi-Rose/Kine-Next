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
    body: `Two things are true at once in perimenopause: you can absolutely keep getting stronger, and the pace that strength shows up at changes.

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
  {
    id: "what-good-form-actually-means",
    title: "What \"good form\" actually means — and what it doesn't",
    description:
      "Form isn't about looking pretty. It's about loading the right tissue at the right time. Here's how to think about it.",
    published: "2026-04-11",
    length: "short",
    topic: "form",
    audience: {
      level: "beginner",
      life_stage: "any",
      goal: "any",
      equipment_min: "bodyweight_only",
    },
    surfaces_at: ["onboarding", "first_30_days", "anytime"],
    gentle: true,
    body: `There's a version of "good form" that floats around the internet where every rep has to look like a textbook diagram. That version isn't helpful.

Form exists to do one thing: put the load through the tissue you're trying to train, without putting it through something that can't handle it. That's it. If your squat looks slightly different from someone else's squat, that's anatomy. Femur lengths differ. Hip sockets differ. The "right" position is the one where you feel the target muscle working and nothing hurts.

Two things worth paying attention to early on:

Brace before you lift. A good brace is a deep breath into your belly, then tightening like someone's about to tap you in the stomach. It protects your spine and gives everything else a stable platform. Kine cues this on heavy compound lifts.

Control the lowering phase. The part where you lower the weight — the eccentric — is where most of the muscle-building stimulus lives. If you're dropping the weight, you're leaving gains on the floor. Two to three seconds on the way down is a good starting point.

Beyond that, don't chase perfection. Chase consistency. Form cleans itself up over weeks of practice, and minor variation between reps is normal — not a failure.`,
  },
  {
    id: "rest-days-arent-a-reward",
    title: "Rest days aren't a reward — they're where the work lands",
    description:
      "You don't get stronger in the gym. You get stronger between sessions. Here's why rest days are structural, not optional.",
    published: "2026-04-11",
    length: "short",
    topic: "recovery",
    audience: {
      level: "any",
      life_stage: "any",
      goal: "any",
      equipment_min: "bodyweight_only",
    },
    surfaces_at: ["first_30_days", "anytime"],
    gentle: true,
    body: `Training is the signal. Recovery is where your body actually responds to it. Skip the recovery and the signal goes nowhere.

When you lift, you create micro-damage in muscle tissue. That's the point — the damage is the stimulus. Between sessions, your body repairs that tissue and builds it back a little stronger. But the rebuilding only happens if you give it time, sleep, and food. No amount of extra sessions replaces that.

This is why Kine programs rest days into your week and won't let you stack heavy sessions back to back. It's not being conservative. It's being accurate about how adaptation works.

A few things that help rest days do their job:

Sleep is the biggest lever. If you only optimise one thing, make it sleep. Most tissue repair happens in deep sleep, and most hormonal recovery depends on it. Eight hours is the target. Seven is the floor.

Food matters more on rest days than people think. Your body is doing construction work. It needs materials. Protein is the obvious one, but total calories matter too. Under-eating on rest days slows the thing you trained for.

Light movement is fine. Walking, stretching, easy cycling — none of that interferes with recovery. What does interfere is another hard session, a long run, or a HIIT class squeezed in because a rest day felt "lazy".

Rest days aren't earned. They're built into the program because the program doesn't work without them.`,
  },
  {
    id: "protein-the-only-number-that-matters",
    title: "Protein isn't complicated — here's the only number that matters",
    description:
      "Nutrition advice is noisy. For strength training, one target moves the needle more than everything else combined.",
    published: "2026-04-11",
    length: "medium",
    topic: "nutrition",
    audience: {
      level: "any",
      life_stage: "any",
      goal: "any",
      equipment_min: "bodyweight_only",
    },
    surfaces_at: ["first_30_days", "anytime"],
    gentle: true,
    body: `Nutrition for strength training can be made as complicated as you want it to be. Meal timing, carb cycling, supplement stacks — there's an entire industry built on making it feel like you need a PhD to eat well.

You don't. For the vast majority of women lifting weights, one number matters more than everything else combined: daily protein intake. The research is consistent and clear — somewhere around 1.6 to 2.2 grams per kilogram of body weight per day is the range where muscle protein synthesis is well-supported. If you weigh 65kg, that's roughly 105–145g of protein a day.

That's the target. Hit it most days and you've done the single most impactful nutritional thing you can do for your training.

A few practical notes:

Spread it across meals. Your body can use protein more efficiently when it arrives in 25–40g doses across the day rather than one massive serving at dinner. Three to four meals with a decent protein source each is a reasonable shape.

Don't stress the decimal places. 110g and 120g are functionally the same. The goal is to be in the neighbourhood consistently, not to hit a precise number every day. If you're currently eating 60g a day, getting to 90g is a bigger win than getting from 120g to 130g.

Supplements are fine but not required. A protein shake is just food in a convenient format. If it helps you hit your number, use it. If you can get there with meals, you don't need it.

Everything else — carbs, fats, timing, supplements — is a rounding error compared to this. Get protein right first. Worry about the rest later, or not at all.

(General wellness information — not medical or dietary advice. If you have specific nutritional needs or conditions, talk to a registered dietitian.)`,
  },
  {
    id: "training-around-your-cycle",
    title: "Training around your cycle — what the research actually says",
    description:
      "The science on cycle-based training is real but smaller than the internet suggests. Here's what holds up and what doesn't.",
    published: "2026-04-11",
    length: "medium",
    topic: "cycle",
    audience: {
      level: "any",
      life_stage: "general",
      goal: "any",
      equipment_min: "bodyweight_only",
    },
    surfaces_at: ["anytime"],
    gentle: true,
    not_for_life_stage: ["perimenopause", "post_menopause"],
    body: `There's a popular idea that you should completely restructure your training around your menstrual cycle — heavy in the follicular phase, light in the luteal phase, rest during your period. It's a clean narrative. The research behind it is real, but thinner than the Instagram version suggests.

Here's what the evidence actually supports:

There is a small strength and power advantage in the follicular phase (roughly day 1–14) for many women. Estrogen is higher, which appears to support force production and recovery. Some studies show measurable performance differences. The effect is real but modest — we're talking single-digit percentage shifts, not a different training programme.

The luteal phase (roughly day 15–28) is associated with slightly higher perceived effort and sometimes longer recovery. Progesterone rises, core temperature increases slightly, and some women report feeling heavier or more fatigued. Again, real but modest.

What this doesn't mean is that you can't train hard in your luteal phase or that you must train hard in your follicular phase. The variation between individuals is larger than the variation between phases. Some women notice a clear pattern. Many don't.

How Kine handles this: if you've enabled cycle tracking, the engine factors your cycle phase into effort recommendations and recovery expectations. It doesn't redesign your programme every two weeks. It makes small adjustments — slightly more conservative load suggestions in the late luteal phase, slightly more room to push in the mid-follicular phase. If you don't track your cycle, the programme works fine without it.

The honest summary: cycle awareness is a useful lens, not a redesign. Pay attention to how you feel, log it if you want, and let the pattern emerge over a few months rather than forcing a framework onto it from day one.`,
  },
  {
    id: "the-day-you-dont-want-to-train",
    title: "The day you don't want to train — and what to do with it",
    description:
      "Not every skip is laziness and not every push-through is discipline. Here's how to tell the difference.",
    published: "2026-04-11",
    length: "short",
    topic: "mindset",
    audience: {
      level: "any",
      life_stage: "any",
      goal: "any",
      equipment_min: "bodyweight_only",
    },
    surfaces_at: ["anytime"],
    gentle: true,
    body: `Some days you don't want to train. That's not a character flaw — it's a data point. The question is what kind of data point it is.

There are two very different versions of "I don't want to train today":

The first is friction. You're tired, it's raining, the gym is far away, and the sofa is right here. If you started the warm-up, you'd probably be fine by the third set. This version responds well to a simple rule: just start. Do the warm-up. If you still feel terrible after the first working set, you can leave. Most of the time you won't.

The second is signal. You're exhausted in a way that sleep didn't fix. You're sore in a way that doesn't feel like normal soreness. You're stressed to the point where adding physical stress makes everything worse. This version is your body telling you that the cost of today's session is higher than the benefit. Pushing through doesn't build discipline — it just digs the recovery hole deeper.

The tricky part is that both feel the same at the start. The warm-up test is a decent filter. Friction dissolves after five minutes of movement. Signal doesn't.

Kine won't guilt you for missing a session. A skipped day just moves the work — it doesn't delete it. And if you're logging how you feel, the pattern of which days you skip will tell you something useful over time. Consistent skips on Mondays might mean you need more weekend recovery. Consistent skips in the late luteal phase might mean your load is too high in that window.

Show up most days. Let yourself leave on the bad ones. That's the whole system.`,
  },
  {
    id: "minimal-equipment-what-to-buy-first",
    title: "Minimal equipment, maximum effect — what to buy first",
    description:
      "If you're training at home and can only buy a few things, these are the ones that unlock the most programming.",
    published: "2026-04-11",
    length: "short",
    topic: "equipment",
    audience: {
      level: "beginner",
      life_stage: "any",
      goal: "any",
      equipment_min: "bodyweight_only",
    },
    surfaces_at: ["onboarding", "first_30_days", "anytime"],
    gentle: true,
    body: `You can get a surprisingly effective training stimulus with very little equipment. But if you're going to spend money, spend it in the right order.

The single best first purchase is a set of resistance bands — a light, medium, and heavy. They're cheap, they travel, and they unlock glute work, upper back work, and warm-up movements that bodyweight alone can't replicate. Kine's minimal-equipment programmes lean on bands heavily.

Second: a pair of adjustable dumbbells. They're more expensive, but they replace an entire rack. If you can go from 5kg to 25kg per hand, you can run a real programme for months. Hex dumbbells (flat sides) are better than round ones — they won't roll and you can use them for renegade rows.

Third: a bench. Doesn't need to be fancy. A flat bench opens up chest press, rows, step-ups, hip thrusts, and single-leg work. If it inclines, even better, but flat is fine.

That's it. Bands, adjustable dumbbells, a bench. With those three things, Kine can programme a full session that covers posterior chain, pressing, pulling, and core. You don't need a barbell to start. You don't need a cable machine. You don't need a squat rack.

If you already have some of this, tell Kine what you've got during setup. The programme adapts to your equipment — it won't ask you to do barbell squats if you don't own a barbell.`,
  },
  {
    id: "rpe-rir-decoded",
    title: "RPE, RIR, and other things your programme says — decoded",
    description:
      "Strength training has its own shorthand. Here's what the common terms mean in plain language.",
    published: "2026-04-11",
    length: "medium",
    topic: "glossary",
    audience: {
      level: "beginner",
      life_stage: "any",
      goal: "any",
      equipment_min: "bodyweight_only",
    },
    surfaces_at: ["onboarding", "first_30_days", "anytime"],
    gentle: true,
    body: `Strength training uses a lot of abbreviations. If you're new, the shorthand can make a simple programme feel like it was written in code. Here are the terms you'll see most often in Kine, translated.

RIR — Reps in Reserve. How many more reps you could have done before failure. If a set says "RIR 2", it means stop when you think you have two reps left in the tank. It's a way of controlling intensity without needing to know your max. RIR 3 is moderate. RIR 1 is hard. RIR 0 is everything you've got.

RPE — Rate of Perceived Exertion. A 1–10 scale for how hard a set felt. RPE 7 means you had about three reps left. RPE 9 means you had one. RPE 10 is failure. Kine uses RIR more than RPE because most people find "how many reps could you have done?" easier to answer than "rate your effort on a scale."

Set and rep. A rep is one complete movement — down and up on a squat, for example. A set is a group of reps done together before resting. "3×10" means three sets of ten reps.

Compound vs isolation. A compound lift uses multiple joints — squats, deadlifts, rows, presses. An isolation lift targets one muscle — bicep curls, leg extensions, lateral raises. Compounds do more work per minute. Isolation fills in the gaps.

Concentric and eccentric. The concentric is the lifting phase — standing up from a squat. The eccentric is the lowering phase — sitting back down into it. The eccentric is where most muscle damage (the good kind) happens, which is why controlling the lowering phase matters.

Superset. Two exercises done back to back with no rest between them. Usually pairs muscles that don't compete — like a row followed by a press. Saves time without sacrificing quality.

Deload. A planned lighter week built into the programme. Loads drop, volume drops, and your body catches up on accumulated fatigue. Kine schedules these automatically. They're not optional and they're not a sign of weakness — they're how the programme avoids running you into the ground.

You don't need to memorise all of this. Kine explains terms in context when they first appear in your sessions. This is just the reference if you want it all in one place.`,
  },
];
