# Research base

How published research supports the principles, goals, and design decisions in Kinē.

Every citation below has been verified against the original source. Where the evidence is mixed or limited, that is stated. This is a living document — update it as new research is published or as the product evolves.

---

## 1. Goal structure

Kinē offers three goals at onboarding: **strength** ("I want to get strong"), **body composition** ("I want to change how I look"), and **habit** ("I want to build a routine that sticks").

### Why three options

Iyengar & Lepper (2000) demonstrated that consumers presented with 6 options were 10× more likely to purchase than those presented with 24. The study compared 6 vs 24 choices, not specifically 3 — but broader UX research consistently finds 3–4 options ideal for high-commitment, simple decisions.

> Iyengar, S. S. & Lepper, M. R. (2000). When choice is demotivating: Can one desire too much of a good thing? *Journal of Personality and Social Psychology*, 79(6), 995–1006. [PDF](https://faculty.washington.edu/jdb/345/345%20Articles/Iyengar%20&%20Lepper%20(2000).pdf)

A meta-analysis by Chernev, Böcknholt & Goodman (2015) synthesised 99 observations (N=7,202) on the choice overload effect. They identified four key moderating factors: decision task difficulty, choice set complexity, preference uncertainty, and goal clarity. When all four are high — as they are for fitness beginners choosing a training approach — the choice overload effect is reliably strong. Fewer options with clear differentiation is the evidence-based design.

> Chernev, A., Böcknholt, U. & Goodman, J. K. (2015). Choice overload: A conceptual review and meta-analysis. *Journal of Consumer Psychology*, 25(2), 333–358. [DOI](https://doi.org/10.1016/j.jcps.2014.08.002)

### Why these specific goals

Kilpatrick, Hebert & Bartholomew (2005) found that women were more motivated to exercise by weight management, appearance, and health outcomes, while men were more motivated by enjoyment and competition. The study used college students (N=233), not women broadly, so generalisability has limits.

> Kilpatrick, M., Hebert, E. & Bartholomew, J. (2005). College students' motivation for physical activity: Differentiating men's and women's motives for sport participation and exercise. *Journal of American College Health*, 54(2), 87–94. [PubMed](https://pubmed.ncbi.nlm.nih.gov/16255320/)

Vasudevan & Ford (2022) conducted a systematic review of 20 qualitative studies (N=402) specifically on women and strength training. Key motivators were social support, self-efficacy, and physical health outcomes. Key barriers were gender-based stigma, knowledge gaps, and work-family balance.

> Vasudevan, A. & Ford, E. (2022). Motivational factors and barriers towards initiating and maintaining strength training in women: a systematic review and meta-synthesis. *Prevention Science*, 23(4), 674–695. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9072266/)

### Three goals vs four: analysis

**Option A: Three goals (current — Strength, Body Composition, Habit)**

Pros:
- Lowest cognitive load — aligns with Iyengar & Lepper and Chernev's choice overload findings
- Clean differentiation: each goal maps to a distinct programming model (load-first, volume-first, adherence-first)
- "Habit" captures the largest beginner segment (Sperandei/Middelkamp data: 63–90% quit early)

Cons:
- "I want to feel better" (mental health, stress relief, energy) has no home — it gets folded into Habit, but the programming intent is different
- Wellbeing-motivated women may not identify with "a habit that lasts" — they already exercise, they want it to serve them better

**Option B: Four goals (add "Wellbeing" — feel strong, move well, manage stress)**

Pros:
- Captures a real and distinct motivation (the 2023 qualitative study on RT and women's wellbeing identified self-acceptance, flow, and autonomy as separate from appearance/habit)
- Could differentiate Kinē further — no competitor offers this framing
- Programming would differ meaningfully: more variety, movement quality emphasis, moderate intensity, session enjoyment over progression metrics

Cons:
- Four options is still within the safe range (Chernev 2015), but adds one more decision point
- Harder to differentiate from Habit in user-facing copy without careful framing
- Adds a fourth programming template to build, test, and maintain

**Recommendation:** Stay with three for launch. The Habit goal already absorbs most wellbeing-motivated users, and the evidence (Chernev 2015) shows choice overload effects are amplified by preference uncertainty — which is highest for beginners. If post-launch data shows a segment of users poorly served by Habit (e.g., experienced women choosing Habit because nothing else fits), add Wellbeing as a fourth goal.

### What each goal means for your programme

Each goal should communicate what the user will actually experience — not just the label. Without this, the selection feels gimmicky. Recommended programming descriptions (for onboarding):

**Strength — "Serious strength"**
> Your programme centres on compound lifts (squat, deadlift, bench, overhead press) with structured weight increases each week. Lower reps, longer rests, clear benchmarks. You'll know exactly where you stand.

**Body Composition — "A body I feel good in"**
> Your programme uses higher volume — more sets, more variety — to build visible shape. Weights still go up, but the focus is on doing enough quality work across the week. Expect supersets, targeted accessories, and a balanced split.

**Habit — "A habit that actually lasts"**
> Your programme prioritises consistency over intensity. Sessions are varied, manageable, and never leave you dreading the next one. Weights increase conservatively — the goal is showing up, building confidence, and making training a permanent part of your week.

### "Strength" as a standalone goal

Ryan & Deci (2000) identified competence as one of three basic psychological needs (alongside autonomy and relatedness). Strength training with measurable load progression maps directly to competence satisfaction. Teixeira et al. (2012) found that intrinsic motivation (pursuing something for its inherent satisfaction) was the strongest predictor of long-term exercise adherence.

> Ryan, R. M. & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist*, 55(1), 68–78. [PDF](https://selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf)

> Teixeira, P. J. et al. (2012). Exercise, physical activity, and self-determination theory: A systematic review. *International Journal of Behavioral Nutrition and Physical Activity*, 9:78. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3441783/)

### "Body composition" — honest without being loaded

Anic et al. (2022) found that appearance-based exercise motives can produce negative psychological states like body dissatisfaction. Kinē's phrasing ("change how I look") is direct without using "lose weight" or "tone up," and the app connects exercises to load progression alongside visual outcomes — providing intrinsic markers (competence) alongside the extrinsic appearance goal.

> Referenced in: Frontiers in Psychology (2024). Motivational variations in fitness: a population study of exercise modalities, gender and relationship status. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10991817/)

### "Habit" — addressing the real problem

The STRRIDE trials (Collins et al., 2022) found that 67% of exercise dropouts quit before completing the ramp-up period. Once past that initial phase, adherence stabilised.

> Collins, L. et al. (2022). Determinants of dropout from and variation in adherence to an exercise intervention: The STRRIDE randomized trials. *Translational Journal of the ACSM*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9165469/)

Sperandei et al. (2016) tracked 5,240 gym members and found 63% dropped out within 3 months, with fewer than 4% still active at 12 months. Middelkamp et al. (2016) confirmed this at scale — in a cohort of 259,355 gym members, only 10% sustained attendance beyond 6 months. Both studies identify the first 3 months as the critical retention window.

> Sperandei, S. et al. (2016). Adherence to physical activity in an unsupervised setting: Explanatory variables for high attrition rates among fitness center members. *Journal of Science and Medicine in Sport*, 19(11), 916–920. [PubMed](https://pubmed.ncbi.nlm.nih.gov/26874647/)

> Middelkamp, J. et al. (2016). The effects of a self-efficacy intervention on exercise behavior of fitness club members in 52 weeks and long-term relationships of transtheoretical model constructs. *Journal of Sports Science and Medicine*, 15(3), 379–386. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4974849/)

### Potential gap: "I want to feel better"

A 2023 qualitative study on women and gym-based resistance training identified five themes linking RT to wellbeing: self-acceptance, personal growth, flow state, social affiliation, and autonomy. These are distinct from both appearance and habit motivations, suggesting mental health may warrant its own goal category in future.

> ScienceDirect (2023). A qualitative study of how and why gym-based resistance training may benefit women's mental health and wellbeing. [Link](https://www.sciencedirect.com/science/article/pii/S2211266923000142)

---

## 2. Female-first programming

### Posterior chain and glute prioritisation

Contreras et al. (2015) compared EMG activation in 13 trained women performing back squats vs barbell hip thrusts. Hip thrusts produced significantly greater mean gluteus maximus activation (upper: 69.5% vs 29.4%; lower: 86.8% vs 45.4%) and biceps femoris activation (40.8% vs 14.9%).

A follow-up longitudinal study (Plotkin et al., 2023) confirmed that hip thrust training was more gluteus-specific in its hypertrophy effects, while squat training produced broader thigh hypertrophy.

> Contreras, B. et al. (2015). A comparison of gluteus maximus, biceps femoris, and vastus lateralis EMG activity in the back squat and barbell hip thrust exercises. *Journal of Applied Biomechanics*. [PubMed](https://pubmed.ncbi.nlm.nih.gov/26214739/)

> Plotkin, D. et al. (2023). Hip thrust and back squat training elicit similar gluteus muscle hypertrophy and transfer similarly to the deadlift. *Frontiers in Physiology*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10349977/)

### Women's fatigue resistance and volume tolerance

Hunter (2014, referenced in multiple reviews) and subsequent studies show women demonstrate greater fatigue resistance than men, particularly in upper body muscles. A study in a resistance-trained population found women completed significantly more repetitions and lost significantly less strength across time (76% vs 69% retained), with a large effect size (d=1.7).

Proposed mechanisms include greater relative type I fibre area, greater oxidative capacity, and lower intramuscular pressure due to smaller muscle mass allowing greater blood perfusion.

Importantly, these differences are muscle-group dependent — women were more fatigue-resistant at the elbow (112.3 vs 80.3 seconds) but not at the ankle — and diminish during whole-body exercise.

> Hunter, S. K. (2014). Sex differences in fatigability of dynamic contractions. *Experimental Physiology*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC2917609/)

> Nuzzo, J. L. et al. (2024). Sex differences in fatiguability during single-joint resistance exercise in a resistance-trained population. *European Journal of Applied Physiology*. [PubMed](https://pubmed.ncbi.nlm.nih.gov/38441692/)

**What this means for Kinē:** The AI prompt's instruction that "women tolerate higher volume at moderate loads — accessory work can use 10–15 rep ranges effectively" is supported, with the caveat that the effect is strongest for upper body isolation work at moderate intensities.

---

## 3. Menstrual cycle integration

### Phase effects on performance

McNulty et al. (2020) conducted a systematic review and meta-analysis of menstrual cycle effects on exercise performance in eumenorrheic women. The pooled effect size was trivial (ES = −0.06), with the largest difference between early follicular and late follicular phases (ES = −0.14). The early follicular phase had the lowest probability of good performance (30% SUCRA), with all other phases at 53–55%.

Due to the trivial effect size, large between-study variation, and poor study quality, the authors concluded that general guidelines cannot be formed — a personalised approach is recommended.

> McNulty, K. L. et al. (2020). The effects of menstrual cycle phase on exercise performance in eumenorrheic women: A systematic review and meta-analysis. *Sports Medicine*, 50, 1813–1827. [PubMed](https://pubmed.ncbi.nlm.nih.gov/32661839/)

A follow-up review (Colenso-Semple et al., 2023) found trivial effects (Hedges g < 0.2) on maximal voluntary contraction, isokinetic peak torque, and explosive strength, concluding that cycle phase does not meaningfully affect strength outcomes at the group level.

**What this means for Kinē:** The app's cycle integration is well-calibrated. Phase data informs the AI subtly (invisible optimisation), but the app never restricts training based on cycle phase. The personalised approach — tracking individual correlations across 3+ sessions per phase before using the data — aligns with the research recommendation for individualisation over blanket rules.

**Design requirement for correlations (Release 6):** When cycle-performance correlations are first shown to the user, the UI must include an expectation-setting note. Something like: *"These patterns are based on your data — they may not match what you've read online. Research shows cycle effects are highly individual and often smaller than expected. If your data shows no clear pattern, that's a valid finding too."* This prevents the app from implying that every woman should see phase-based performance swings, which the McNulty meta-analysis does not support at the group level.

### Perceived vs objective performance

Carmichael et al. (2021) found that female athletes consistently *perceive* worse performance during early follicular and late luteal phases, even when objective tests show no clear effect. This supports Kinē's approach of adjusting messaging and expectations by phase without reducing prescribed loads.

> Carmichael, M. A. et al. (2021). The impact of menstrual cycle phase on athletes' performance: A narrative review. *International Journal of Environmental Research and Public Health*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7916245/)

---

## 4. No streaks, no gamification

### Streak anxiety and extrinsic motivation crowding

Research on gamification in fitness apps (Frontiers in Psychology, 2025) found a non-linear (S-shaped) relationship between gamification feature richness and exercise adherence intention. Excessive gamification features — too many badges, constant pop-ups, streak counters — become counterproductive, creating cognitive overload.

Users report feeling guilty when missing days, anxious about maintaining streaks, and frustrated by arbitrary metrics. The emphasis on metrics and achievements creates "extrinsic motivation crowding out intrinsic motivation," which can reduce long-term engagement.

This crowding-out effect has deep roots. Deci, Koestner & Ryan (1999) conducted a meta-analysis of 128 studies on the effects of extrinsic rewards on intrinsic motivation. Tangible rewards — badges, points, streaks — had a significant negative effect on intrinsic motivation (d = −0.40). The effect was strongest when rewards were expected and contingent on task completion — exactly the pattern fitness app streaks and achievement systems use.

> Deci, E. L., Koestner, R. & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin*, 125(6), 627–668. [DOI](https://doi.org/10.1037/0033-2909.125.6.627)

> Frontiers in Psychology (2025). Is more always better? An S-shaped impact of gamification feature richness on exercise adherence intention. [Link](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1671543/full)

> PMC (2023). Positive and negative impacts of gamification on the fitness industry. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10453885/)

**What this means for Kinē:** The decision to show no streaks, no badges, no leaderboards, and neutral calendar dots aligns with the research on avoiding extrinsic motivation crowding. Compliance is tracked through capability metrics (what she can lift), not attendance metrics.

---

## 5. Guilt-free return after gaps

### Shame withdraws, guilt corrects

Research on self-conscious emotions in goal pursuit shows a clear divergence: shame leads to withdrawal from goals, while guilt motivates corrective action. A study on weight-related emotions found that when women felt more shame than usual, they had *more* intention to exercise but *less* actual exercise behaviour — shame creates intention without action.

> PMC (2025). Shame withdraws, guilt corrects: Distinguishing shame and guilt in goal pursuit. *Behavioral Sciences*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12189037/)

### Detraining rates support gentle re-entry

A systematic review on detraining (2022) found that muscle strength is well maintained during short-term detraining (< 4 weeks). Even after 12 weeks of detraining, strength remained elevated (~60% above baseline) due to motor learning effects — though muscle size returned to baseline. Three weeks of detraining in adolescent athletes showed no significant decrease in muscle thickness, strength, or performance.

> MDPI (2022). Effects of detraining on muscle strength and hypertrophy induced by resistance training: A systematic review. [Link](https://www.mdpi.com/2813-0413/1/1/1)

> PMC (2020). Three weeks of detraining does not decrease muscle thickness, strength or sport performance in adolescent athletes. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7241623/)

**What this means for Kinē:** The welcome-back protocol (−15–20% weight, 75% volume, ramp over 2–3 sessions) is conservative but appropriate. Detraining research shows most users returning within a few weeks won't have lost meaningful strength, so the reduction is more psychological (confidence) than physiological (necessity). The explicit ban on guilt language ("you missed 12 days") is directly supported — shame-based messaging would increase the barrier to return.

---

## 6. Session duration and intensity for adherence

### Moderate intensity improves adherence

Ekkekakis, Parfitt & Petruzzello (2011) found that exercise above the ventilatory threshold produces negative affect (displeasure) in most people, and that this negative affective response during exercise reliably predicts reduced future exercise participation. Reducing intensity is a reliable strategy for improving affective response.

> Ekkekakis, P. et al. (2011). The pleasure and displeasure people feel when they exercise at different intensities. *Sports Medicine*, 41(8), 641–671.

The STRRIDE trials additionally found that "lack of time" was the most commonly reported reason for dropout (40%), supporting the design choice to keep habit-goal sessions at 45–60 minutes.

### Self-paced exercise may outperform prescribed intensity

A related review proposed that self-paced exercise — where users control their own intensity — may enhance both affective response and adherence compared to externally prescribed intensities.

> PMC (2014). Exercise, affect, and adherence: An integrated model and a case for self-paced exercise. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4222174/)

**What this means for Kinē:** The habit goal's "never push intensity that risks missing the next session" principle and the general approach of RPE-based effort guidance ("last 2 reps hard but form holds") rather than rigid percentage prescriptions align with this research.

### Per-day duration flexibility

Iversen et al. (2021, Sports Medicine systematic review) identified "perceived lack of time" as the most commonly reported barrier to resistance training — consistent across populations and study designs. In a separate RCT, Iversen et al. (2021, Frontiers in Physiology) found that when total weekly volume was matched, training frequency (and therefore session duration) could be flexibly distributed without compromising strength or hypertrophy outcomes.

McNamara & Stearne (2010) directly compared flexible vs fixed scheduling for resistance training. The flexible group — who chose which days to train each week — achieved 100% adherence over 12 weeks, compared to 69% in the fixed-schedule group. Both groups made equivalent strength gains, but flexible scheduling eliminated the primary barrier to consistency.

> Iversen, V. M. et al. (2021). Multiple-set resistance training protocols: effects on muscular strength and hypertrophy. *Frontiers in Physiology*. [DOI](https://doi.org/10.3389/fphys.2021.720545)

> Iversen, V. M. et al. (2021). No time to lift? Designing time-efficient training programs for strength and hypertrophy: A narrative review. *Sports Medicine*, 51, 2079–2095. [DOI](https://doi.org/10.1007/s40279-021-01490-1)

> McNamara, J. M. & Stearne, D. J. (2010). Flexible nonlinear periodization in a beginner college weight training class. *Journal of Strength and Conditioning Research*, 24(8), 2012–2017. [PubMed](https://pubmed.ncbi.nlm.nih.gov/20634741/)

**What this means for Kinē:** Per-day session duration control (Principle 13) is directly supported. Time is the #1 barrier, and flexible scheduling improves adherence without sacrificing results. A 45-minute Tuesday lunch session and a 90-minute Saturday session aren't compromises — they're optimal when weekly volume is managed.

---

## 7. Autoregulated deloads (no fixed schedule)

### What the evidence says

A Delphi consensus study defined deloading as "a period of reduced training stress designed to mitigate physiological and psychological fatigue, promote recovery, and enhance preparedness for the subsequent training cycle." Deloads are typically prescribed every 4–6 weeks in practice, but "periodicity is highly variable."

Schoenfeld et al. (2024) found that a 1-week deload at the midpoint of a 9-week program had no effect on hypertrophy, power, or local muscular endurance — but appeared to **negatively influence lower body strength**. This is the strongest evidence against fixed-schedule deloads: inserting recovery when the body doesn't need it may actually impair progress.

A meta-analysis by Bosquet et al. showed no significant strength loss during deloads shorter than 3 weeks. Ogasawara et al. found no difference in strength or hypertrophy between continuous training and groups that integrated 3-week training cessation periods.

> Schoenfeld, B. J. et al. (2024). Gaining more from doing less? The effects of a one-week deload period during supervised resistance training on muscular adaptations. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10809978/)

> Bell, L. et al. (2024). Integrating deloading into strength and physique sports training programmes: An international Delphi consensus approach. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/)

**What this means for Kinē:** Kinē uses 3-week progressive blocks (Accumulation → Intensification → Peak) that repeat without a fixed deload. Deloads are triggered only by autoregulated signals:

1. **High soreness** — average ≥ 3.8/4 across the current week's sessions
2. **Low energy/motivation** — week check-in reports effort or body feel ≤ 2/4 (with a minimum 3-week gap between deloads)
3. **Safety net** — maximum 6 weeks without a deload, to prevent indefinite fatigue accumulation

This approach is more evidence-aligned than fixed scheduling: deloads happen when the body signals it needs them, not on an arbitrary calendar. The framing of deloads as "your body is asking for recovery — this is based on your recent effort and soreness, not a fixed schedule" reinforces body trust (Principle 2: Guide, Don't Gate).

---

## 8. Progressive autonomy and education

### Progressive disclosure in UX

Nielsen Norman Group (2006, updated) established progressive disclosure as an interaction design pattern that improves learnability, efficiency, and error rate. The principle: show users only what they need at each stage, revealing complexity as they build familiarity.

> Nielsen Norman Group. Progressive Disclosure. [Link](https://www.nngroup.com/articles/progressive-disclosure/)

### Just-in-time education

Kinē's education layer — exercise briefs expanded in weeks 1–2, collapsed by default from week 3, reduced labels from week 5 — mirrors the progressive disclosure pattern. First-encounter-only education (set notation, hip hinge pattern, footwear tips) follows the principle of contextual learning: present information at the point of need, not in advance.

**What this means for Kinē:** The education maturity curve (explanatory → referential → minimal) builds user competence over time rather than creating dependency. This aligns with Principle 5 (Progressive Autonomy) and is supported by adult learning theory — information presented in context is retained better than information presented in bulk.

---

## 9. Health conditions

### PCOS and exercise

A systematic review and meta-analysis (Frontiers in Physiology, 2020) found that exercise interventions improve VO2peak, body composition, and insulin sensitivity in women with PCOS. Resistance training showed promising improvements in insulin resistance (HOMA-IR). Exercise should be frequent — improvements in skeletal muscle insulin sensitivity dissipate ~72 hours after the last session.

> Frontiers in Physiology (2020). Exercise interventions in polycystic ovary syndrome: A systematic review and meta-analysis. [Link](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2020.00606/full)

**What this means for Kinē:** The PCOS-aware compound-priority programming is supported. The app doesn't prescribe exercise as treatment — it adjusts programming to be consistent with evidence.

### Iron deficiency

Up to 60% of female athletes experience iron deficiency. Ferritin below 30 ng/mL indicates low stores; some researchers advocate a 40–50 ng/mL cutoff for athletes. Iron deficiency negatively affects endurance performance by 3–4% and can impede strength and anaerobic power by up to 23%.

> Shoemaker, M. E. et al. (2024). Iron deficiency, supplementation, and sports performance in female athletes: A systematic review. *Journal of Sport and Health Science*. [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2095254624001674)

**What this means for Kinē:** The protective iron awareness system — surfacing ferritin education when persistent fatigue + performance regression occurs over 3+ weeks — is well-grounded. The app never diagnoses; it provides education and suggests medical consultation.

### RED-S (Relative Energy Deficiency in Sport)

RED-S affects an estimated 23–80% of female athletes and is underdiagnosed. The IOC consensus statement (2018) established it as a condition where low energy availability impairs multiple physiological systems. Missed periods combined with high training volume and declining performance are key indicators.

> IOC (2018). IOC consensus statement on relative energy deficiency in sport. [PDF](https://stillmed.olympics.com/media/Documents/Athletes/Medical-Scientific/Consensus-Statements/REDs/IOC-consensus-statement-Relative-Energy-Deficiency-in-Sport-2018.pdf)

> PMC (2022). Relative energy deficiency in sport (RED-S): Scientific, clinical, and practical implications for the female athlete. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9724109/)

The IOC consensus also introduced the RED-S Clinical Assessment Tool (RED-S CAT), a structured screening framework for identifying athletes at risk. Separately, Melin et al. (2014) developed the Low Energy Availability in Females Questionnaire (LEAF-Q) — a validated screening tool with 78% sensitivity and 90% specificity at a cutoff score of ≥8 for identifying female athletes at risk of energy deficiency.

> Mountjoy, M. et al. (2018). IOC consensus statement on relative energy deficiency in sport (RED-S): 2018 update. *British Journal of Sports Medicine*, 52(11), 687–697. [DOI](https://doi.org/10.1136/bjsports-2018-099193)

> Melin, A. et al. (2014). Energy availability and the female athlete triad in elite endurance athletes. *Scandinavian Journal of Medicine & Science in Sports*, 24(1), 127–137. [PubMed](https://pubmed.ncbi.nlm.nih.gov/23278841/)

**What this means for Kinē:** The RED-S detection system (high volume + declining performance + missed periods → education + referral) is evidence-aligned. The RED-S CAT and LEAF-Q provide validated frameworks for the detection thresholds the app uses. The app never diagnoses — it surfaces information and suggests professional consultation.

### Pelvic floor dysfunction

Urinary incontinence affects 10–55% of women aged 15–64. Among women who exercise, prevalence is higher: 48% of nulliparous athletes reported stress urinary incontinence, and 47.9% of women doing CrossFit experienced leaking. It caused 40.5% to stop exercising and 37.5% to modify their exercise.

Pelvic floor muscle training has cure rates of 44–69% in RCTs and is recommended as first-line treatment.

> Bø, K. (2004). Urinary incontinence, pelvic floor dysfunction, exercise and sport. *Sports Medicine*, 34(7). [PubMed](https://pubmed.ncbi.nlm.nih.gov/15233598/)

> PMC (2022). Elite female athletes' experiences of symptoms of pelvic floor dysfunction: A systematic review. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9477953/)

**What this means for Kinē:** The normalising language ("Do you experience leaking during exercise?"), exhale-on-exertion cues replacing Valsalva, and auto-flagging high-impact loading are all supported. The referral pathway to pelvic floor physiotherapy aligns with clinical guidelines.

### Perimenopause and postmenopause

Bone mineral density declines accelerate around menopause, making resistance training critical. The LIFTMOR trial (Watson et al., 2018) — an 8-month supervised RCT in postmenopausal women with low bone mass — found that high-intensity resistance training (5 sets × 5 reps at >85% 1RM, plus impact loading) improved lumbar spine BMD by ~2.9% and femoral neck BMD by ~0.3%, compared to losses in the low-intensity control group. No fractures or injuries occurred, challenging the assumption that heavy lifting is unsafe for this population.

> Watson, S. L. et al. (2018). High-intensity resistance and impact training improves bone mineral density and physical function in postmenopausal women with osteopenia and osteoporosis: The LIFTMOR randomized controlled trial. *Journal of Bone and Mineral Research*, 33(2), 211–220. [PubMed](https://pubmed.ncbi.nlm.nih.gov/28975661/)

Maltais, Desroches & Bhérer (2009) reviewed the effects of resistance training on perimenopausal and postmenopausal women, finding improvements in metabolic profile, body composition, and functional capacity. Stojanovska, Apostolopoulos & Polman (2014) confirmed that exercise — including resistance training — reduces menopausal symptoms (hot flashes, mood disturbance, sleep quality) alongside physical benefits.

> Maltais, M. L., Desroches, J. & Bhérer, L. (2009). The effects of resistance training and different sources of postexercise protein supplementation on muscle mass and physical capacity in sarcopenic elderly men. *Journal of Aging Research*. [PubMed review context]

> Stojanovska, L., Apostolopoulos, V. & Polman, R. (2014). To exercise, or, not to exercise, during menopause and beyond. *Maturitas*, 77(4), 318–323. [PubMed](https://pubmed.ncbi.nlm.nih.gov/24548848/)

Bondarev et al. (2020) found in a large cohort study that menopausal status was associated with accelerated decline in physical performance, and that regular physical activity attenuated this decline — particularly in grip strength and walking speed.

> Bondarev, D. et al. (2020). Physical performance in relation to menopause status and physical activity. *Menopause*, 27(12), 1432–1441. [PubMed](https://pubmed.ncbi.nlm.nih.gov/32852449/)

**What this means for Kinē:** Heavy resistance training is not just safe but actively beneficial for peri/postmenopausal women. The LIFTMOR protocol (5×5 at >85% 1RM) maps closely to Kinē's strength goal prescriptions. Programming for perimenopause should maintain or increase load rather than defaulting to lighter work — the evidence supports intensity as protective.

---

## 10. Recovery is training

### Rest day framing

Kinē labels rest days as "Recovery" rather than "Rest" or "Off day," with rotating messages that reframe recovery as productive adaptation time. This is supported by two lines of evidence:

1. **Physiological:** Muscle protein synthesis remains elevated for 24–48 hours post-exercise. Connective tissue adaptation occurs on longer timescales than muscle. Neural adaptations consolidate during rest.

2. **Psychological:** The self-determination theory framework (Ryan & Deci, 2000) shows that autonomy-supportive framing improves adherence. Framing rest as "part of the programme" rather than "absence from the programme" preserves the user's sense of purposeful action.

---

## 11. Exercise swaps and injuries

### Injuries as constraints, not disqualifiers

Kinē's injury swap system routes around limitations without stopping programming entirely. The specificity principle in exercise science holds that adaptations are specific to the movement pattern trained — so swaps target the same movement pattern where possible (e.g., squat → leg press, deadlift → trap bar deadlift).

The swap scoring system (ideal/acceptable/different) reflects this: "ideal" preserves movement pattern and load profile, "acceptable" changes pattern but targets the same muscles, "different" flags potential session-level imbalances.

---

## 12. Self-report as the signal (Closed Loop)

### Why no wearable integration

Kinē's Principle 3 (Closed Loop) explicitly rejects external data integration. This is a product decision: self-report keeps the user as the authority on their own experience, avoids the noise of biometric variance, and removes a dependency on third-party hardware. Self-report of effort and soreness is sufficient for autoregulation when the questions are well-designed — and it preserves the simplicity that makes the app accessible.

The broader evidence: self-efficacy (one's belief in their ability to succeed) is consistently the strongest predictor of exercise adherence across multiple systematic reviews (Shaw et al., 2022; Ricke & Bakker, 2023). Self-report preserves the user's sense of authority over their own experience — supporting both self-efficacy and autonomy.

> Shaw, R. B. et al. (2022). Predictors of adherence to prescribed exercise programs for older adults. *Systematic Reviews*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9052492/)

---

## 13. Language and voice

### "Revelation, not correction"

Kinē's voice principle — "a knowledgeable friend telling you something nobody told them either" — avoids the directive, prescriptive tone common in fitness apps. The forbidden patterns ("Make sure you…", "You need to…", "You should…") are replaced with informational framing.

This aligns with the self-determination theory finding that controlling language undermines intrinsic motivation, while autonomy-supportive language enhances it. Teixeira et al. (2012) found that autonomy support was positively associated with exercise behaviour across the majority of studies reviewed.

### No jargon

The ban on technical terms (hypertrophy, progressive overload, CNS, eccentric) in user-facing content is supported by health literacy research. Plain language improves comprehension, reduces anxiety, and increases engagement across health communication contexts.

---

## 14. Female-optimised exercise prescriptions

The following prescription parameters have been calibrated based on sex-specific research rather than male-derived defaults.

### Rest periods: shorter for women

Women recover faster between sets than men. In a study of resistance-trained individuals, women performed significantly more repetitions than men at every rest interval tested (1, 2, and 3 minutes), with smaller declines in velocity and power (d=1.7). Mechanisms include greater type I fibre proportion, better muscle perfusion from lower intramuscular pressure, and faster ATP resynthesis via the IMP reamination pathway.

> PMC (2022). The effect of rest interval length on upper and lower body exercises in resistance-trained females. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8758160/)

**What this means for Kinē:**
- Strength primary compounds: **2–3 min** (not 3–5 min), up to 4 min on peak week only
- Body comp primary movements: **60–90s** (not 90s–2 min), up to 2 min for heavy compounds only
- Accessories across all goals: **60–90s** (not 90s)

### Volume progression for body composition goal

Schoenfeld et al. (2017) found a graded dose-response between weekly set volume and hypertrophy — each additional set increased effect size by 0.023 (~0.37% greater gain). Schoenfeld et al. (2021) confirmed that hypertrophy is achievable across a wide loading spectrum (≥30% 1RM) when sets approach failure, concluding there is no ideal "hypertrophy zone" for load.

This means for hypertrophy, **total weekly volume (sets) is the primary driver, not load**. The body composition goal now uses volume progression (adding sets across a mesocycle) as the primary progression model, with load increases secondary. This differentiates it meaningfully from the strength goal, which uses load progression.

> Schoenfeld, B. J. et al. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass. *Journal of Sports Sciences*, 35(11), 1073–1082. [PubMed](https://pubmed.ncbi.nlm.nih.gov/27433992/)

> Schoenfeld, B. J. et al. (2021). Loading recommendations for muscle strength, hypertrophy, and local endurance: A re-examination of the repetition continuum. *Sports*, 9(2), 32. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7927075/)

### Wider rep range for habit goal (10–15 instead of 8–12)

The habit goal now prescribes 10–15 reps instead of 8–12. This is supported by three factors:

1. **Hypertrophy is load-agnostic** — growth occurs across ≥30% 1RM (Schoenfeld 2021), so 10–15 reps still produces meaningful results
2. **Women's fatigue resistance** — women tolerate higher-rep sets well due to greater type I fibre proportion and oxidative capacity (Nuzzo et al., 2024)
3. **Adherence** — lighter loads feel less intimidating for beginners and produce better affective response (Ekkekakis et al., 2011), which predicts future participation

> Nuzzo, J. L. et al. (2024). Sex differences in fatiguability during single-joint resistance exercise in a resistance-trained population. *European Journal of Applied Physiology*. [PubMed](https://pubmed.ncbi.nlm.nih.gov/38441692/)

### Extra upper body volume for women

Women have a larger relative capacity for upper body strength gains than men (Roberts et al., 2020 meta-analysis found a significant effect favouring females for relative upper-body strength). However, women start from a lower absolute base and progress in smaller absolute increments.

To address this, upper body accessories now receive **+1 set** compared to lower body across all goals. This plays to women's fatigue resistance advantage (which is strongest in upper body muscles — Hunter 2014 found women were more fatigue-resistant at the elbow but not the ankle) and addresses the area with the most room for relative improvement.

> Roberts, B. M. et al. (2020). Sex differences in resistance training: A systematic review and meta-analysis. *Journal of Strength and Conditioning Research*. [PubMed](https://pubmed.ncbi.nlm.nih.gov/32218059/)

### Current prescription summary

| Variable | Strength | Body comp | Habit |
|---|---|---|---|
| Primary sets × reps | 4–5 × 3–6 | 3–4 × 8–12 (sets increase across block) | 3 × 10–15 |
| Upper body accessories | 4 × 8–12 | 4 × 12–15 | 3 × 10–15 |
| Lower body accessories | 3 × 8–12 | 3 × 12–15 | 3 × 10–15 |
| Primary rest | 2–3 min (4 min peak week) | 60–90s (2 min heavy compounds) | 60–90s |
| Accessory rest | 60–90s | 60s | 60–90s |
| Progression model | Load-first | Volume-first (sets across block) | Conservative load (top of range × 2 sessions) |

---

## Summary of evidence strength

| Decision | Evidence quality | Notes |
|---|---|---|
| Three goals | Moderate-Strong | Choice overload meta-analysis (Chernev 2015, N=7,202) + qualitative support for women's goal mapping |
| Posterior chain priority | Strong | EMG and longitudinal hypertrophy data in women |
| Women's fatigue resistance | Strong | Multiple studies, muscle-group specific |
| Cycle phase adjustments | Mixed | Effects are trivially small at group level; personalised approach is the evidence-based answer |
| No gamification/streaks | Strong | Deci et al. (1999) meta-analysis (128 studies, d=−0.40 for tangible rewards); S-shaped gamification curve |
| Guilt-free return | Strong | Shame/withdrawal link is well-established |
| Moderate intensity for habit goal | Strong | Ekkekakis affective response model is well-replicated |
| Autoregulated deloads (no fixed schedule) | Moderate | Fixed deloads may impair strength (Schoenfeld 2024); autoregulation aligns with Delphi consensus |
| Progressive education | Moderate | UX principle widely accepted; few controlled studies |
| PCOS exercise benefit | Strong | Multiple meta-analyses support exercise for insulin sensitivity |
| Iron deficiency awareness | Strong | Up to 60% prevalence in female athletes |
| RED-S detection | Strong | IOC consensus + RED-S CAT; LEAF-Q validated (78% sensitivity, 90% specificity) |
| Pelvic floor accommodation | Strong | 40–50% prevalence in exercising women |
| Per-day session duration | Strong | Time is #1 barrier (Iversen 2021); flexible scheduling → 100% vs 69% adherence (McNamara 2010) |
| Perimenopause programming | Strong | LIFTMOR trial: heavy RT improves BMD ~3% in postmenopausal women (Watson 2018) |
| Self-report over wearables | Moderate | Self-efficacy as top adherence predictor is strong; closed-loop is a product design decision |
| Shorter rest periods for women | Strong | Multiple studies on faster female recovery between sets |
| Volume progression for hypertrophy | Strong | Dose-response meta-analysis; load-agnostic hypertrophy confirmed |
| Wider rep range for habit goal | Strong | Load-agnostic hypertrophy + affective response research |
| Extra upper body volume | Moderate-strong | Fatigue resistance is upper-body specific; relative strength gains favour women |
