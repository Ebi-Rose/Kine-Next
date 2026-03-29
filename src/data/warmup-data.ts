// ── Warmup & Cooldown Data ──
// Ported from kine/src/data/warmup-data.js with full alternatives, injury mods, stabiliser preps

export interface WarmupItem {
  name: string;
  detail: string;
  duration: string;
  _why?: string;
  _injuryProtective?: boolean;
  _highImpact?: boolean;   // filtered for impactSensitive (fibroids/endo)
  _prone?: boolean;        // filtered for proneSensitive (pelvic floor)
  alts?: Omit<WarmupItem, "alts">[];
  replaces?: string | null;
}

export type FocusGroup = "push" | "pull" | "legs" | "hinge" | "core" | "cardio";

// ── General prep ──
export const WARMUP_GENERAL: Record<string, WarmupItem[]> = {
  push: [
    { name: "Thoracic rotations", detail: "8 each side - hands behind head, rotate upper back. Gets the upper back moving so your shoulders can do their job.", duration: "45s",
      alts: [
        { name: "Foam roller T-spine extension", detail: "Lie over roller at shoulder blade level - 8 slow extensions.", duration: "45s" },
        { name: "Thread-the-needle stretch", detail: "8 each side - on all fours, thread one arm under your body.", duration: "45s" },
        { name: "Book openings", detail: "8 each side - side lying, top arm sweeps open.", duration: "40s" },
      ]},
    { name: "Band pull-aparts", _why: "Counteracts forward shoulder posture from pressing. Imbalanced pushing without this leads to shoulder impingement.", _injuryProtective: true, detail: "2\u00d715 - wakes up the back of your shoulders before pressing.", duration: "45s",
      alts: [
        { name: "Towel pull-aparts", detail: "Same motion with a towel - squeeze your shoulder blades together.", duration: "45s" },
        { name: "Prone T raises", detail: "Lie face down, arms out to sides - raise and hold 2s.", duration: "45s", _prone: true },
        { name: "Wall angels", detail: "10 reps - back flat against wall, slide arms from waist to overhead.", duration: "40s" },
      ]},
    { name: "Arm circles", detail: "10 forward, 10 backward - get the shoulder moving freely before pressing.", duration: "30s",
      alts: [
        { name: "Pendulum swings", detail: "Lean forward, let arm hang and swing gently - 30s each.", duration: "60s" },
        { name: "Cross-body shoulder stretch", detail: "20s each side - pull arm across chest.", duration: "40s" },
      ]},
  ],
  pull: [
    { name: "Dead hangs", detail: "2\u00d720s - let the whole body hang and decompress. Gets your back switched on.", duration: "40s",
      alts: [
        { name: "Doorframe hang", detail: "Same as dead hang using a doorframe.", duration: "40s" },
        { name: "Active hang hold", detail: "2\u00d715s - hang and actively pull shoulder blades down.", duration: "40s" },
        { name: "Child's pose lat stretch", detail: "2\u00d720s - arms extended, sit hips back.", duration: "40s" },
      ]},
    { name: "Shoulder dislocates", detail: "10 reps with band or broomstick - full shoulder range before loading.", duration: "45s",
      alts: [
        { name: "Towel dislocates", detail: "Same movement with a towel - start wider grip.", duration: "45s" },
        { name: "Sleeper stretch", detail: "30s each side - lie on side, press wrist toward floor.", duration: "60s" },
        { name: "Wall overhead reach", detail: "10 reps - reach both arms up the wall.", duration: "30s" },
      ]},
    { name: "Scapular pull-ups", _why: "Builds shoulder blade control to protect the rotator cuff during pulling.", _injuryProtective: true, detail: "2\u00d78 - pull shoulder blades down without bending arms.", duration: "40s",
      alts: [
        { name: "Band scapular retractions", detail: "2\u00d715 - band at chest height, pull elbows back.", duration: "40s" },
        { name: "Prone Y raises", detail: "2\u00d710 - face down, arms in Y shape, raise and hold 2s.", duration: "45s", _prone: true },
      ]},
  ],
  legs: [
    { name: "Hip circles", detail: "10 each direction - gets the hips moving. Stiff hips restrict squatting.", duration: "30s",
      alts: [
        { name: "90/90 hip switches", detail: "8 each side - opens hips in both directions.", duration: "45s" },
        { name: "Standing figure-4 stretch", detail: "20s each side - cross ankle over knee, sit back.", duration: "40s" },
      ]},
    { name: "Leg swings", detail: "10 forward/back + 10 lateral each leg - loosens hips, gets blood moving.", duration: "45s",
      alts: [
        { name: "Hip flexor lunge stretch", detail: "30s each side - deep lunge, back knee down.", duration: "60s" },
        { name: "Inch worms", detail: "5 reps - walk hands out to plank, walk feet back.", duration: "45s" },
      ]},
    { name: "Bodyweight squats", detail: "15 reps - go to full depth, pause at the bottom.", duration: "45s",
      alts: [
        { name: "Goblet squat hold", detail: "3\u00d710s at the bottom - hold any light weight.", duration: "45s" },
        { name: "Box squat", detail: "10 reps - sit to a box and stand back up.", duration: "40s" },
        { name: "Cossack squats", detail: "8 each side - wide side squat. Opens inner thighs.", duration: "45s" },
      ]},
  ],
  hinge: [
    { name: "Cat-cow", detail: "10 slow reps - loosens the lower back. Important before deadlifts.", duration: "30s",
      alts: [
        { name: "Segmental spinal roll", detail: "5 reps - slow forward fold, unroll back up.", duration: "45s" },
        { name: "Supine knee hugs", detail: "Pull both knees to chest - hold 20 seconds.", duration: "30s" },
      ]},
    { name: "Glute bridges", _injuryProtective: true, _why: "Glutes that don't fire shift load to the lower back during hip extension.", detail: "2\u00d715 - squeeze hard at the top. Gets glutes and hamstrings on.", duration: "45s",
      alts: [
        { name: "Banded glute bridges", detail: "2\u00d715 - band above knees, push knees apart at top.", duration: "45s" },
        { name: "Single-leg glute bridge", _why: "Identifies left-right glute imbalances before loading.", _injuryProtective: true, detail: "2\u00d710 each side.", duration: "60s" },
        { name: "Hip extension on all fours", detail: "15 each side - squeeze glute hard at top.", duration: "40s" },
      ]},
    { name: "Good morning stretch", detail: "10 reps - hinge at hip with no weight, feel hamstrings stretch.", duration: "30s",
      alts: [
        { name: "Standing hamstring reach", detail: "5 each side - hinge and reach toward one foot.", duration: "35s" },
        { name: "Romanian deadlift with stick", detail: "10 reps - broomstick along back for neutral spine.", duration: "40s" },
      ]},
  ],
  core: [
    { name: "Dead bug", detail: "8 reps each side - keep lower back flat. Gets deep core working.", duration: "45s",
      alts: [
        { name: "Supine marching", detail: "10 each side - lift one foot at a time, lower back on floor.", duration: "40s" },
        { name: "Hollow body hold", detail: "3\u00d710s - arms and legs extended, lower back pressed flat.", duration: "40s" },
      ]},
    { name: "Bird dog", detail: "8 reps each side - slow and controlled. Works core front and back.", duration: "45s",
      alts: [
        { name: "Quadruped shoulder taps", detail: "10 each side - on all fours, lift one hand slightly.", duration: "40s" },
        { name: "Bear hold", detail: "3\u00d710s - all fours, knees just off floor.", duration: "45s" },
      ]},
  ],
  cardio: [
    { name: "March on the spot", detail: "60s - drive knees high, swing arms.", duration: "60s",
      alts: [
        { name: "Jumping jacks", detail: "30 reps - full body warm-up.", duration: "45s", _highImpact: true },
        { name: "Step touch side-to-side", detail: "60s - low impact option.", duration: "60s" },
      ]},
  ],
};

// ── Specific activation ──
export const WARMUP_ACTIVATION: Record<string, WarmupItem[]> = {
  push: [
    { name: "Rotator cuff external rotation", _why: "Most common cause of shoulder injury under pressing load.", _injuryProtective: true, detail: "Light weight or band, elbow at 90\u00b0 - 2\u00d715 each side.", duration: "60s",
      alts: [
        { name: "Banded external rotation", detail: "Same movement with a band.", duration: "60s" },
        { name: "Side-lying external rotation", detail: "Lie on side, elbow bent - rotate light weight.", duration: "60s" },
        { name: "Wall external rotation", detail: "Elbow against wall at 90\u00b0 - press back of hand in.", duration: "45s" },
      ]},
    { name: "Serratus push-up plus", _why: "Protects shoulder blade from winging under load.", _injuryProtective: true, detail: "2\u00d710 - at top of push-up, push floor away.", duration: "45s",
      alts: [
        { name: "Incline serratus push-up plus", detail: "Hands on bench - less bodyweight.", duration: "45s" },
        { name: "Standing wall protraction", detail: "Hands on wall - push through until shoulder blades spread.", duration: "40s" },
      ]},
    { name: "Wall slides", detail: "10 reps - back against wall, slide arms overhead.", duration: "30s",
      alts: [
        { name: "Doorframe chest stretch", detail: "2\u00d720s each arm - elbow at 90\u00b0, rotate away.", duration: "40s" },
        { name: "Prone swimmers", detail: "10 reps - face down, sweep arms hip to overhead.", duration: "40s", _prone: true },
      ]},
  ],
  pull: [
    { name: "Lat activation - straight-arm pulldown", _injuryProtective: true, _why: "Lats that don't activate allow shoulder to shrug during pulling.", detail: "2\u00d715 with light band - feel your back, not arms.", duration: "60s",
      alts: [
        { name: "Band straight-arm pulldown", detail: "Band anchored overhead.", duration: "60s" },
        { name: "Lat activation with DB", detail: "Light dumbbell, sweep overhead to hip.", duration: "50s" },
        { name: "Chin-over-bar hold", detail: "3\u00d75s - hold at top of pull-up.", duration: "45s" },
      ]},
    { name: "Face pulls", detail: "Band or cable, 2\u00d720 - wakes up back of shoulder.", duration: "60s",
      alts: [
        { name: "Prone rear delt raises", detail: "2\u00d712 light weight - face down, arms wide.", duration: "50s", _prone: true },
        { name: "Band face pulls", detail: "Band at face height.", duration: "60s" },
      ]},
    { name: "Lat prayer stretch", detail: "2\u00d720s - forearms on bench, sit hips back.", duration: "40s",
      alts: [
        { name: "Child's pose", detail: "2\u00d720s - arms overhead on floor.", duration: "40s" },
        { name: "Side lat stretch standing", detail: "20s each side - reach overhead and lean.", duration: "40s" },
      ]},
  ],
  legs: [
    { name: "Clamshells", _why: "Weak outer hips cause knees to cave during squats — most common cause of knee pain in lifters.", _injuryProtective: true, detail: "2\u00d715 each side - stops knees caving in.", duration: "60s",
      alts: [
        { name: "Banded clamshells", detail: "Band above knees - harder.", duration: "60s" },
        { name: "Side-lying hip abduction", detail: "15 each side - same muscle, different angle.", duration: "55s" },
        { name: "Standing hip abduction", detail: "15 each side with band.", duration: "50s" },
      ]},
    { name: "Single-leg glute bridge", detail: "2\u00d710 each side - spots if one side is weaker.", duration: "60s",
      alts: [
        { name: "Glute bridge", detail: "2\u00d715 - both legs. Build up to single-leg.", duration: "45s" },
        { name: "Banded glute bridge", detail: "2\u00d715 - band above knees.", duration: "50s" },
      ]},
    { name: "Ankle circles", detail: "10 each direction each ankle - stiff ankles make squats feel restricted.", duration: "20s",
      alts: [
        { name: "Wall ankle mobility", _why: "Restricted ankle mobility causes heels to rise in squats.", _injuryProtective: true, detail: "10 each ankle - drive knee toward wall.", duration: "45s" },
        { name: "Calf stretches", detail: "30s each - step back, heel down.", duration: "60s" },
      ]},
  ],
  hinge: [
    { name: "Hip flexor stretch", _why: "Tight hip flexors pull pelvis forward, increasing lower back strain.", _injuryProtective: true, detail: "60s each side - tight hip flexors stop you fully locking out.", duration: "120s",
      alts: [
        { name: "Couch stretch", detail: "45s each side - rear foot on wall. Deeper.", duration: "90s" },
        { name: "Standing hip flexor stretch", detail: "40s each side - standing lunge, tuck hips.", duration: "80s" },
      ]},
    { name: "Lat activation drill", _injuryProtective: true, _why: "Lats create the rigid torso that keeps spine safe under heavy loads.", detail: "Band around wrists, pull apart and hold 2s. Gets back on before deadlifts.", duration: "45s",
      alts: [
        { name: "Lat pull-down to hip with band", detail: "Band overhead - pull to hip with straight arm.", duration: "45s" },
        { name: "Towel lat drill", detail: "Towel works - same pulling-apart motion.", duration: "40s" },
      ]},
    { name: "Banded hip hinge", _injuryProtective: true, _why: "Teaches body to load hips rather than lower back.", detail: "2\u00d710 - band at hip height, drive hips back against pull.", duration: "45s",
      alts: [
        { name: "Bodyweight hip hinge", detail: "10 reps - hands on lower back, fold from hip.", duration: "35s" },
        { name: "Wall hip hinge", detail: "10 reps - sit hips back to touch wall.", duration: "35s" },
      ]},
  ],
  core: [
    { name: "Plank hold", detail: "2\u00d720s - brace whole body.", duration: "40s",
      alts: [
        { name: "Forearm plank", detail: "Same hold on forearms - easier on wrists.", duration: "40s" },
        { name: "Elevated plank", detail: "Hands on bench - easier.", duration: "40s" },
        { name: "Plank shoulder taps", detail: "10 each side - resist twisting.", duration: "45s" },
      ]},
    { name: "Side plank", detail: "20s each side - works side of core.", duration: "40s",
      alts: [
        { name: "Side plank from knees", detail: "Knees bent - easier.", duration: "40s" },
        { name: "Copenhagen plank", detail: "15s each side - top foot on bench.", duration: "45s" },
      ]},
  ],
  cardio: [
    { name: "Jump rope or jog", detail: "2 min easy - elevate heart rate.", duration: "120s", _highImpact: true,
      alts: [
        { name: "Brisk walking", detail: "2 min - elevate heart rate without impact.", duration: "120s" },
        { name: "Cycling or rowing", detail: "2 min easy - low impact cardio.", duration: "120s" },
      ]},
  ],
};

// ── Exercise-specific stabiliser preps ──
export const WARMUP_STABILISER_EXTRAS: Record<string, WarmupItem> = {
  "Barbell Back Squat": { name: "Lat bracing drill", detail: "Empty bar on back - brace sides hard. 5 slow breaths. Keeps the bar stable.", duration: "60s" },
  "Front Squat": { name: "Wrist and lat prep", detail: "Wrist circles + 20s side stretch each arm. Both need to be loose for front rack.", duration: "60s" },
  "Conventional Deadlift": { name: "Lat engagement cue drill", detail: "Starting position - imagine bending bar around legs. Feel back tighten. 5 times.", duration: "60s" },
  "Sumo Deadlift": { name: "Adductor warmup", detail: "Wide stance squat holds - 3\u00d710s at bottom. Inner thighs work hard in sumo.", duration: "60s" },
  "Romanian Deadlift": { name: "Hamstring activation", detail: "Standing hamstring curl with band - 2\u00d715 each leg.", duration: "45s" },
  "Overhead Press": { name: "Thoracic extension", detail: "Extend over foam roller or chair back - 10 reps.", duration: "45s" },
  "Barbell Bench Press": { name: "Scapular retraction drill", detail: "Pinch shoulder blades together, hold 5s - 8 times.", duration: "30s" },
  "Pull-Up": { name: "Active hang + scapular pull", detail: "2\u00d720s hangs, then 5 scapular pull-downs.", duration: "60s" },
  "Barbell Row": { name: "Lat prayer stretch", detail: "Forearms on bench, sit hips back - 2\u00d720s.", duration: "40s" },
  "Hip Thrust": { name: "Glute activation circuit", detail: "Clamshell 15 + single-leg bridge 10 each side, no rest.", duration: "90s" },
  "Bulgarian Split Squat": { name: "Hip flexor release", detail: "60s kneeling stretch each side. Back leg under stretch.", duration: "120s" },
};

// ── Injury mods ──
export const WARMUP_INJURY_MODS: Record<string, WarmupItem[]> = {
  shoulder: [
    { name: "Pendulum swings", detail: "Lean forward, arm hanging - gentle circles 30s each direction.", duration: "60s", replaces: null },
  ],
  knees: [
    { name: "Terminal knee extensions", _why: "Strengthens VMO - inner quad that supports the kneecap.", _injuryProtective: true, detail: "Band behind knee, straighten fully - 2\u00d715 each.", duration: "60s", replaces: null },
  ],
  lower_back: [
    { name: "Supine knee hugs", detail: "Pull both knees to chest - hold 30s.", duration: "30s", replaces: null },
    { name: "Pelvic tilts", _why: "Restores neutral spine before loading. Stiff pelvis increases disc stress.", _injuryProtective: true, detail: "10 slow reps - flatten and arch lower back.", duration: "30s", replaces: null },
  ],
  hip: [
    { name: "90/90 hip stretch", detail: "Both legs at 90\u00b0, lean over front shin - 60s each side.", duration: "120s", replaces: null },
  ],
  wrist: [
    { name: "Wrist circles", detail: "10 each direction both wrists - slow, full range.", duration: "20s", replaces: null },
    { name: "Prayer stretch", detail: "Palms together, lower to chest height - 30s.", duration: "30s", replaces: null },
  ],
  ankle: [
    { name: "Ankle circles", detail: "10 each direction each ankle.", duration: "20s", replaces: null },
    { name: "Calf raises", detail: "2\u00d715 slow - warm up Achilles and plantar fascia.", duration: "30s", replaces: null },
  ],
  neck: [
    { name: "Neck rolls", detail: "Slow half-circles, ear to shoulder - avoid full backward extension.", duration: "30s", replaces: null },
  ],
};

// ── Condition mods ──
// Health condition-specific warmup additions. Same structure as injury mods.
export const WARMUP_CONDITION_MODS: Record<string, WarmupItem[]> = {
  pelvic_floor: [
    { name: "Diaphragmatic breathing", detail: "6 slow breaths - breathe into your belly, not chest. Connects breath to pelvic floor.", duration: "60s",
      _why: "Coordinates the diaphragm and pelvic floor before loading. Exhale-on-exertion starts here.", _injuryProtective: true, replaces: null },
    { name: "Pelvic floor awareness", detail: "Seated or lying - gentle lift on exhale, full release on inhale. 8 reps.", duration: "45s",
      _why: "Primes the pelvic floor to respond to load. Awareness before effort prevents bearing down.", _injuryProtective: true, replaces: null },
  ],
  endometriosis: [
    { name: "Gentle hip circles", detail: "10 each direction - slow and controlled.", duration: "30s",
      _why: "Gentle mobilisation can reduce pelvic tension associated with endometriosis.", _injuryProtective: true, replaces: null },
  ],
  fibroids: [
    { name: "Gentle hip circles", detail: "10 each direction - slow and controlled.", duration: "30s",
      _why: "Low-impact mobilisation to warm up without high intra-abdominal pressure.", _injuryProtective: true, replaces: null },
  ],
};

// ── Cooldown breathwork ──
export const COOLDOWN_BREATH: WarmupItem[] = [
  { name: "Box breathing", detail: "4 counts in, 4 hold, 4 out, 4 hold - 6 cycles. Activates parasympathetic.", duration: "90s",
    alts: [
      { name: "4-7-8 breathing", detail: "Inhale 4, hold 7, exhale 8 - 4 cycles.", duration: "90s" },
      { name: "Diaphragmatic breathing", detail: "Hand on belly - breathe into it, not chest. 10 slow breaths.", duration: "60s" },
    ]},
  { name: "Supine relaxation hold", detail: "Lie on back, arms by sides. Let floor support everything. 60s.", duration: "60s",
    alts: [
      { name: "Child's pose hold", detail: "60s - knees wide, arms extended. Gentle spinal decompression.", duration: "60s" },
      { name: "Legs up the wall", detail: "90s - sit sideways to wall, swing legs up. Promotes venous return.", duration: "90s" },
    ]},
];

// ── Cooldown movement reset ──
export const COOLDOWN_RESET: Record<string, WarmupItem[]> = {
  push: [
    { name: "Doorframe chest stretch", detail: "Elbow at 90\u00b0, rotate away - 30s each side. Undoes chest shortening.", duration: "60s",
      alts: [
        { name: "Pectoral stretch on floor", detail: "Face down, one arm out to side.", duration: "60s", _prone: true },
        { name: "Hands-clasped chest opener", detail: "Clasp behind back, squeeze shoulder blades.", duration: "30s" },
      ]},
    { name: "Overhead tricep stretch", detail: "One arm overhead, drop forearm behind head - 30s each side.", duration: "60s",
      alts: [
        { name: "Cross-body shoulder stretch", detail: "30s each side - pull arm across chest.", duration: "60s" },
        { name: "Sleeper stretch", detail: "30s each side - lie on side, press wrist down.", duration: "60s" },
      ]},
  ],
  pull: [
    { name: "Lat prayer stretch", detail: "Forearms on bench, hips back - 30s. Lats release.", duration: "30s",
      alts: [
        { name: "Child's pose with arms wide", detail: "Arms overhead, sit hips back.", duration: "30s" },
        { name: "Side lat stretch", detail: "Standing, reach overhead and lean - 20s each side.", duration: "40s" },
      ]},
    { name: "Bicep wall stretch", detail: "Arm out, palm on wall, rotate body away - 30s each side.", duration: "60s",
      alts: [
        { name: "Forearm flexor stretch", detail: "Arm extended, pull fingers back - 20s each.", duration: "40s" },
        { name: "Prayer position stretch", detail: "Palms together at chest, lower hands. 30s.", duration: "30s" },
      ]},
  ],
  legs: [
    { name: "Standing quad stretch", detail: "30s each leg - hold ankle behind you.", duration: "60s",
      alts: [
        { name: "Lying quad stretch", detail: "Side-lying, hold ankle - 30s each.", duration: "60s" },
        { name: "Couch stretch", detail: "45s each side - rear foot on wall. Deep.", duration: "90s" },
      ]},
    { name: "Figure-4 glute stretch", detail: "Lie on back, ankle over knee, pull thigh to chest - 45s each.", duration: "90s",
      alts: [
        { name: "Pigeon pose", detail: "45s each side - front knee at 90\u00b0.", duration: "90s" },
        { name: "Standing figure-4", detail: "Cross ankle over knee, sit back - 30s each.", duration: "60s" },
      ]},
  ],
  hinge: [
    { name: "Standing forward fold", detail: "Soft knees, hang from hips - 45s. Reverses hinge compression.", duration: "45s",
      alts: [
        { name: "Seated forward fold", detail: "Legs out, reach toward feet - 45s.", duration: "45s" },
        { name: "Supine spinal twist", detail: "30s each side - knee across body, arms out.", duration: "60s" },
      ]},
    { name: "Hip flexor lunge stretch", detail: "Deep lunge, back knee down - 45s each side.", duration: "90s",
      alts: [
        { name: "Couch stretch", detail: "45s each side - deeper hip flexor.", duration: "90s" },
        { name: "Kneeling hip flexor with reach", detail: "Low lunge, raise arm overhead, lean away - 30s each.", duration: "60s" },
      ]},
  ],
  core: [
    { name: "Cobra pose", detail: "2\u00d720s - press up from prone. Reverses lumbar flexion.", duration: "40s", _prone: true,
      alts: [
        { name: "Sphinx pose", detail: "Forearms on floor - easier.", duration: "40s" },
        { name: "Supported backbend", detail: "Foam roller across mid-back - 30s.", duration: "30s" },
      ]},
    { name: "Supine spinal twist", detail: "30s each side - knee across, arms out. Releases obliques.", duration: "60s",
      alts: [
        { name: "Seated spinal twist", detail: "Sit upright, cross one leg, rotate - 20s each.", duration: "40s" },
        { name: "Thread-the-needle", detail: "20s each side - on all fours, reach under body.", duration: "40s" },
      ]},
  ],
  cardio: [
    { name: "Walking cooldown", detail: "2-3 min easy walking - bring heart rate down.", duration: "120s",
      alts: [
        { name: "Step touch side-to-side", detail: "Low intensity movement.", duration: "120s" },
      ]},
    { name: "Calf stretches", detail: "30s each - step back, heel pressed down.", duration: "60s",
      alts: [
        { name: "Seated calf stretch", detail: "Legs out, towel around foot - pull toes back.", duration: "60s" },
      ]},
  ],
};

// ── Exercise-specific cooldown releases ──
export const COOLDOWN_EXERCISE_RELEASE: Record<string, WarmupItem> = {
  "Barbell Back Squat": { name: "Spinal decompression hang", detail: "Hang from bar 30s. Axial squat load reversed.", duration: "30s",
    alts: [{ name: "Child's pose spinal release", detail: "Arms extended, sit hips back - 45s.", duration: "45s" }] },
  "Conventional Deadlift": { name: "Cat-cow spinal mobilisation", detail: "10 slow reps - reverse isometric spinal extension.", duration: "45s",
    alts: [{ name: "Supine knee hugs", detail: "Pull knees to chest, rock side to side - 30s.", duration: "30s" }] },
  "Romanian Deadlift": { name: "Standing hamstring sweep", detail: "Bench edge, straighten leg, reach toward foot - 30s each.", duration: "60s",
    alts: [{ name: "Supine hamstring stretch", detail: "Towel around foot, straighten leg - 30s each.", duration: "60s" }] },
  "Barbell Bench Press": { name: "Thoracic extension over roller", detail: "Roller at shoulder blades - 8 slow extensions.", duration: "45s",
    alts: [{ name: "Doorframe pec stretch", detail: "Arms at 90\u00b0, lean forward - 30s.", duration: "30s" }] },
  "Overhead Press": { name: "Lat and shoulder combined stretch", detail: "One arm overhead, elbow bent - push elbow back 30s each.", duration: "60s",
    alts: [{ name: "Child's pose arms wide", detail: "Passive lat and shoulder release.", duration: "30s" }] },
  "Pull-Up": { name: "Passive hang and shoulder circles", detail: "20s hang then 5 slow circles each direction.", duration: "45s",
    alts: [{ name: "Doorframe hang", detail: "20s - same decompression.", duration: "20s" }] },
  "Bulgarian Split Squat": { name: "Kneeling hip flexor release", detail: "Low lunge, back knee down - 60s each side.", duration: "120s",
    alts: [{ name: "Standing hip flexor stretch", detail: "Standing lunge, tuck pelvis - 40s each.", duration: "80s" }] },
  "Hip Thrust": { name: "Pigeon pose glute release", detail: "45s each side - front shin parallel, hip squared.", duration: "90s",
    alts: [{ name: "Figure-4 supine", detail: "Cross ankle over knee, pull toward chest - 45s each.", duration: "90s" }] },
  "Barbell Row": { name: "Thoracic rotation and lat release", detail: "Sit cross-legged, rotate 8 times each, then lat prayer 30s.", duration: "60s",
    alts: [{ name: "Thread-the-needle", detail: "20s each side - on all fours, reach under body.", duration: "40s" }] },
};

// ── Legacy exports for backward compatibility ──
export interface WarmupExercise {
  name: string;
  duration: string;
  cue: string;
  category: "general" | "activation" | "mobility" | "dynamic";
}

export interface CooldownExercise {
  name: string;
  duration: string;
  cue: string;
  category: "stretch" | "breathing" | "foam_roll";
}

/** Legacy function — builds a simple warmup list from session title */
export function getWarmupForSession(sessionTitle: string): WarmupExercise[] {
  const title = sessionTitle.toLowerCase();
  const general: WarmupExercise[] = [
    { name: "Light Cardio", duration: "3 min", cue: "Brisk walk, bike, or rowing \u2014 just get warm", category: "general" },
  ];

  let focusGroups: FocusGroup[] = [];
  if (title.includes("lower") || title.includes("leg") || title.includes("squat") || title.includes("glute")) {
    focusGroups = ["legs", "hinge"];
  } else if (title.includes("upper") || title.includes("push") || title.includes("chest") || title.includes("shoulder")) {
    focusGroups = ["push", "pull"];
  } else if (title.includes("pull") || title.includes("back")) {
    focusGroups = ["pull"];
  } else if (title.includes("full body")) {
    focusGroups = ["legs", "push", "core"];
  } else {
    focusGroups = ["legs", "push"];
  }

  const specific: WarmupExercise[] = [];
  const seen = new Set<string>();
  for (const group of focusGroups) {
    for (const item of (WARMUP_GENERAL[group] || []).slice(0, 2)) {
      if (!seen.has(item.name)) {
        seen.add(item.name);
        specific.push({ name: item.name, duration: item.duration, cue: item.detail.split(".")[0], category: "dynamic" });
      }
    }
  }

  return [...general, ...specific.slice(0, 4)];
}
