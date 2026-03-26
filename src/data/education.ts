// ── Kinē Education Layer ──
// All education data for the in-app learning system.
// Voice: Revelation, not correction. Context → Gap → Action.

// ── MUSCLE GLOSSARY — 13 muscle groups ──

export interface MuscleInfo {
  region: string;
  muscleName: string;
  text: string;
  trainingNote: string;
  trainedBy: string[];
}

export const MUSCLE_GLOSSARY: Record<string, MuscleInfo> = {
  glutes: {
    region: "Lower body", muscleName: "Glutes",
    text: "Your glutes are the biggest muscle group in your body - they stabilise your spine, protect your knees, and drive every compound lower-body movement. Most people never train them through full range, which means the strongest muscle they have stays underused.",
    trainingNote: "The glutes respond best to a mix of heavy compound work (squats, deadlifts) and high-rep isolation (hip thrusts, kickbacks). Full range of motion matters more than load.",
    trainedBy: ["Hip Thrust", "Barbell Back Squat", "Romanian Deadlift", "Bulgarian Split Squat", "Banded Hip Thrust", "Hip Thrust Machine", "Kettlebell Swing"],
  },
  hamstrings: {
    region: "Lower body", muscleName: "Hamstrings",
    text: "Your hamstrings run the entire back of your thigh - they bend your knee and extend your hip. They are essential for every hinge movement and protect your ACL during deceleration.",
    trainingNote: "Train hamstrings with both hip-dominant (RDLs, good mornings) and knee-dominant (leg curls) exercises. They need both to develop fully.",
    trainedBy: ["Romanian Deadlift", "Leg Curl", "Seated Leg Curl", "Good Morning", "Nordic Curl", "Conventional Deadlift"],
  },
  quads: {
    region: "Lower body", muscleName: "Quads",
    text: "The quadriceps are the four muscles on the front of your thigh - they extend your knee and stabilise your kneecap. They do most of the work in squats, lunges, and step-ups.",
    trainingNote: "Squats and leg press build quad strength. Leg extensions isolate them if you need extra volume without loading the spine.",
    trainedBy: ["Barbell Back Squat", "Front Squat", "Leg Press", "Leg Extension", "Bulgarian Split Squat", "Walking Lunges", "Goblet Squat"],
  },
  lats: {
    region: "Upper body", muscleName: "Lats",
    text: "The lats are the widest muscle in your body, running from your lower back to your upper arm. They pull your arms down and back - every row and pulldown you do.",
    trainingNote: "Vertical pulls (pulldowns, pull-ups) build lat width. Horizontal rows build lat thickness. You need both.",
    trainedBy: ["Lat Pulldown", "Pull-Up", "Barbell Row", "Dumbbell Row", "Seated Cable Row", "Chin-Up"],
  },
  upper_back: {
    region: "Upper body", muscleName: "Upper Back",
    text: "Your upper back - traps, rhomboids, rear delts - holds your posture together and protects your shoulders during pressing. It is the most undertrained area in most programmes.",
    trainingNote: "Face pulls and reverse flies target the rear delts specifically. Rows and pulldowns cover the rest. Aim for equal volume to your pressing work.",
    trainedBy: ["Face Pulls", "Reverse Fly", "Barbell Row", "Rear Delt Fly Machine", "Band Pull-Apart", "Chest-Supported Row"],
  },
  chest: {
    region: "Upper body", muscleName: "Chest",
    text: "The pectorals push your arms forward and across your body. A strong chest improves posture, protects the shoulder joint, and balances out back development.",
    trainingNote: "Flat pressing builds overall chest mass. Incline pressing shifts emphasis to the upper chest. Flies add stretch-focused volume.",
    trainedBy: ["Barbell Bench Press", "Dumbbell Bench Press", "Incline Dumbbell Press", "Push-Up", "Cable Chest Fly", "Band Chest Press"],
  },
  shoulders: {
    region: "Upper body", muscleName: "Shoulders",
    text: "The deltoids wrap around your shoulder in three sections - front, side, and rear. The side delt only gets loaded by lateral raises. Balanced shoulder development protects the joint.",
    trainingNote: "Overhead pressing builds overall shoulder strength. Lateral raises target the side delt. Low weight, high reps, controlled tempo.",
    trainedBy: ["Overhead Press", "Dumbbell Shoulder Press", "Lateral Raise", "Arnold Press", "Kettlebell Press"],
  },
  core: {
    region: "Trunk", muscleName: "Core",
    text: "Your core is the entire cylinder of muscle around your midsection. Its primary job is to resist movement, not create it. Every heavy compound lift trains the core hard.",
    trainingNote: "Planks, dead bugs, and Pallof presses train the core the way it works - by resisting forces. More effective than crunches for strength and stability.",
    trainedBy: ["Plank", "Dead Bug", "Pallof Press", "Hanging Leg Raise", "Ab Wheel Rollout", "Farmers Carry"],
  },
  triceps: {
    region: "Upper body", muscleName: "Triceps",
    text: "The triceps make up two-thirds of your upper arm. If your bench or overhead press stalls, weak triceps are often the reason.",
    trainingNote: "Heavy pressing builds tricep strength. Pushdowns and extensions add volume. The long head is best trained with overhead extensions.",
    trainedBy: ["Tricep Pushdown", "Overhead Tricep Extension", "Skull Crushers", "Dips", "Diamond Push-Up"],
  },
  biceps: {
    region: "Upper body", muscleName: "Biceps",
    text: "The biceps are already trained during every pull. Dedicated bicep work is about adding volume to a muscle that gets significant indirect stimulus.",
    trainingNote: "Supinated (palms-up) curls hit the bicep most directly. Hammer curls shift emphasis to the brachialis.",
    trainedBy: ["Dumbbell Curl", "Hammer Curl", "Cable Curl", "Chin-Up", "Preacher Curl"],
  },
  calves: {
    region: "Lower body", muscleName: "Calves",
    text: "The calves push off the ground with every step. They are stubborn muscles to grow because they are already conditioned from daily walking.",
    trainingNote: "Standing calf raises target the gastrocnemius. Seated target the soleus. Full stretch at the bottom matters more than load.",
    trainedBy: ["Calf Raises", "Seated Calf Raises"],
  },
  hip_flexors: {
    region: "Lower body", muscleName: "Hip Flexors",
    text: "The hip flexors lift your knee toward your chest. They are chronically shortened from sitting. They need length and mobility work.",
    trainingNote: "Stretching the hip flexors after lower body sessions helps maintain pelvic alignment.",
    trainedBy: ["Dead Bug", "Hanging Leg Raise", "Lying Leg Raise", "Mountain Climbers"],
  },
  adductors: {
    region: "Lower body", muscleName: "Adductors",
    text: "The adductors run along your inner thigh. Sumo squats and sumo deadlifts load them heavily.",
    trainingNote: "Wide-stance squats and sumo deadlifts train the adductors. The hip adduction machine isolates them.",
    trainedBy: ["Sumo Squat", "Sumo Deadlift", "Hip Adduction Machine", "Lateral Band Walk", "Cossack Squat"],
  },
};

// ── BREATHING CUES ──

export const BREATHING_CUES: Record<string, string> = {
  "Barbell Back Squat": "Big breath in at the top, brace before you move. Exhale on the way up.",
  "Front Squat": "Big breath in at the top, brace before you move. Exhale on the way up.",
  "Goblet Squat": "Big breath in at the top, brace before you move. Exhale on the way up.",
  "Box Squat": "Big breath in at the top, brace before you move. Exhale on the way up.",
  "Sumo Squat": "Big breath in at the top, brace before you move. Exhale on the way up.",
  "Leg Press": "Breath in as you lower, brace your core. Exhale as you press.",
  "Bulgarian Split Squat": "Breath in as you lower, brace your core. Exhale as you drive up.",
  "Conventional Deadlift": "Big breath in, brace hard before the bar moves. Exhale at the top.",
  "Sumo Deadlift": "Big breath in, brace hard before the bar moves. Exhale at the top.",
  "Trap Bar Deadlift": "Big breath in, brace hard before the bar moves. Exhale at the top.",
  "Romanian Deadlift": "Big breath in at the top, brace before you hinge. Exhale as you stand.",
  "Dumbbell Romanian Deadlift": "Big breath in at the top, brace before you hinge. Exhale as you stand.",
  "Good Morning": "Big breath in at the top, brace before you hinge. Exhale as you stand.",
  "Hip Thrust": "Brace at the bottom. Drive through your heels. Exhale at the top.",
  "Barbell Bench Press": "Breath in at the top, brace before lowering. Exhale as you press.",
  "Incline Barbell Press": "Breath in at the top, brace before lowering. Exhale as you press.",
  "Dumbbell Bench Press": "Breath in at the top, brace before lowering. Exhale as you press.",
  "Incline Dumbbell Press": "Breath in at the top, brace before lowering. Exhale as you press.",
  "Overhead Press": "Brace the entire trunk hard before pressing. The torso does not move. Exhale at lockout.",
  "Dumbbell Shoulder Press": "Brace the entire trunk hard before pressing. Exhale at lockout.",
  "Barbell Row": "Breath in, brace your core, then pull. Exhale as you lower the bar.",
  "Pull-Up": "Breath in at the bottom, pull as you exhale. Control the descent.",
  "Chin-Up": "Breath in at the bottom, pull as you exhale. Control the descent.",
  "Dips": "Breath in at the top, lower with control. Exhale as you press up.",
};

// ── SINGLE-CUE EDUCATION ──

export const KNEE_TRACKING_CUE = "Knees follow your toes - that is the natural path, not something to force.";
export const NEUTRAL_SPINE_CUE = "Neutral spine means keeping your natural lower back curve - not flattening it, not exaggerating it.";
export const HIP_HINGE_FIRST = "This is a hinge, not a squat - the movement starts at the hips pushing back, not the knees bending.";
export const DEPTH_BEFORE_LOAD = "The glutes don't fully load until the hip crease drops below the knee.";

// ── PRE-SESSION TIPS ──

export const FOOTWEAR_TIP = "Flat shoes or bare feet give you the most stable base. Running shoes compress under load.";
export const BAR_POSITION_TIP = "If the bar feels uncomfortable, it's probably sitting too high. Move it down to the upper traps.";
export const WRIST_TIP = "Bar sits at the heel of the palm - wrists stay stacked directly under the bar, not bent back.";

// ── SET NOTATION ──

export const SET_NOTATION: Record<string, string> = {
  "A×B": "sets × reps - e.g. 3×8 means 3 sets of 8",
  "RPE": "how hard the set felt, 1-10. RPE 7 = 3 reps left.",
  "1RM": "your max for one rep - used to set training loads.",
  "AMRAP": "as many clean reps as possible.",
  "RIR": "reps left in the tank. RIR 2 = stopped 2 short.",
};

// ── DOMS EDUCATION ──

export const DOMS_EDUCATION = {
  firstSessions: "You might feel some soreness in the next day or two. That's your body registering the novelty, not a measure of how hard you worked.",
  noSoreness: "No soreness doesn't mean it didn't work. It usually means your body is adapting - exactly what you want.",
  moderateSoreness: "A bit of soreness means the muscles registered the work. It should ease within a day or two.",
  highSoreness: "If you're quite sore, give it time before the next session. Adaptation needs space.",
  experienced: "You know your body well by now. Trust what you're feeling.",
};

// ── CYCLE SESSION BANNERS ──

export const CYCLE_SESSION_BANNERS: Record<string, string> = {
  luteal: "Some women notice higher fatigue around this part of their cycle. If that's you, it's normal — train to how you feel today.",
  lateLuteal: "The week before your period, some women notice energy shifts. Adjust the session to how you feel.",
  menstrual: "First few days of your cycle. If energy is lower, that's normal — but no need to go lighter unless you want to.",
  lateLutealBloating: "If you're feeling heavier or bloated, that's fluid retention — cyclical and unrelated to your training.",
};

// ── NUTRITION EDUCATION ──

export const NUTRITION_EDUCATION: Record<string, string> = {
  creatine: "Creatine (3-5g daily) is one of the most researched supplements. Women naturally carry 70-80% less creatine than men, so supplementation can make a noticeable difference for strength, recovery, mood, and bone health.",
  protein: "Most women who train need around 1.6-2.0g of protein per kg of bodyweight per day. Spreading it across 3-4 meals works better than loading it all into one.",
  ironAwareness: "Iron deficiency affects up to half of women who train regularly. Symptoms look like overtraining: persistent fatigue, stalled progress. A blood test can rule it out.",
};

// ── REST DAY MESSAGES ──

export const REST_DAY_MESSAGES = [
  "Rest days are when adaptation actually happens. The session breaks the muscle down - recovery builds it back stronger.",
  "Your nervous system needs recovery just as much as your muscles do. Today is part of the programme, not a gap in it.",
  "Soreness fades, but the structural adaptation from rest is what lets you lift more next week.",
  "Active recovery - a walk, some stretching, light mobility - helps without undoing the recovery.",
];

// ── REST DAY RECOVERY ──

export const REST_DAY_RECOVERY: Record<string, string> = {
  legs: "Light walking and hip flexor stretches will help your quads and glutes recover. Foam rolling your quads and IT band loosens things up.",
  hinge: "Gentle hamstring stretches and glute foam rolling will speed recovery. A short walk keeps blood moving through the posterior chain.",
  push: "Shoulder circles, doorway chest stretches, and thoracic extension over a foam roller will help your pressing muscles recover.",
  pull: "Lat stretches, band pull-aparts with minimal tension, and thoracic rotation will help your back recover.",
  core: "Light walking and gentle spinal rotation stretches. Hang from a bar for 20-30 seconds if you can.",
};

// ── EXERCISE MUSCLE MAP ──

export interface MuscleTag {
  primary: string[];
  secondary: string[];
}

export const EXERCISE_MUSCLE_MAP: Record<string, MuscleTag> = {
  "Barbell Back Squat": { primary: ["Quads", "Glutes"], secondary: ["Core", "Hamstrings"] },
  "Front Squat": { primary: ["Quads"], secondary: ["Core", "Glutes"] },
  "Goblet Squat": { primary: ["Quads", "Glutes"], secondary: ["Core"] },
  "Leg Press": { primary: ["Quads", "Glutes"], secondary: [] },
  "Bulgarian Split Squat": { primary: ["Quads", "Glutes"], secondary: ["Core"] },
  "Leg Extension": { primary: ["Quads"], secondary: [] },
  "Leg Curl": { primary: ["Hamstrings"], secondary: [] },
  "Walking Lunges": { primary: ["Quads", "Glutes"], secondary: ["Core"] },
  "Calf Raises": { primary: ["Calves"], secondary: [] },
  "Conventional Deadlift": { primary: ["Hamstrings", "Glutes"], secondary: ["Core", "Upper Back"] },
  "Romanian Deadlift": { primary: ["Hamstrings", "Glutes"], secondary: ["Core"] },
  "Hip Thrust": { primary: ["Glutes"], secondary: ["Hamstrings", "Core"] },
  "Good Morning": { primary: ["Hamstrings", "Glutes"], secondary: ["Core"] },
  "Glute Bridge": { primary: ["Glutes"], secondary: ["Hamstrings"] },
  "Kettlebell Swing": { primary: ["Glutes", "Hamstrings"], secondary: ["Core"] },
  "Back Extension": { primary: ["Hamstrings", "Glutes"], secondary: ["Core"] },
  "Barbell Bench Press": { primary: ["Chest", "Triceps"], secondary: ["Shoulders"] },
  "Incline Barbell Press": { primary: ["Chest", "Shoulders"], secondary: ["Triceps"] },
  "Dumbbell Bench Press": { primary: ["Chest", "Triceps"], secondary: ["Shoulders"] },
  "Overhead Press": { primary: ["Shoulders", "Triceps"], secondary: ["Core"] },
  "Dumbbell Shoulder Press": { primary: ["Shoulders", "Triceps"], secondary: ["Core"] },
  "Lateral Raise": { primary: ["Shoulders"], secondary: [] },
  "Tricep Pushdown": { primary: ["Triceps"], secondary: [] },
  "Skull Crushers": { primary: ["Triceps"], secondary: [] },
  "Dips": { primary: ["Chest", "Triceps"], secondary: ["Shoulders"] },
  "Push-Up": { primary: ["Chest", "Triceps"], secondary: ["Core"] },
  "Barbell Row": { primary: ["Upper Back", "Lats"], secondary: ["Biceps"] },
  "Dumbbell Row": { primary: ["Lats", "Upper Back"], secondary: ["Biceps"] },
  "Seated Cable Row": { primary: ["Lats", "Upper Back"], secondary: ["Biceps"] },
  "Lat Pulldown": { primary: ["Lats"], secondary: ["Biceps"] },
  "Pull-Up": { primary: ["Lats", "Upper Back"], secondary: ["Biceps", "Core"] },
  "Chin-Up": { primary: ["Lats", "Biceps"], secondary: ["Upper Back"] },
  "Face Pulls": { primary: ["Upper Back", "Shoulders"], secondary: [] },
  "Dumbbell Curl": { primary: ["Biceps"], secondary: [] },
  "Hammer Curl": { primary: ["Biceps"], secondary: [] },
  "Plank": { primary: ["Core"], secondary: [] },
  "Dead Bug": { primary: ["Core"], secondary: ["Hip Flexors"] },
  "Bird Dog": { primary: ["Core"], secondary: ["Glutes"] },
  "Ab Wheel Rollout": { primary: ["Core"], secondary: ["Lats"] },
  "Hanging Leg Raise": { primary: ["Core"], secondary: ["Hip Flexors"] },
  "Pallof Press": { primary: ["Core"], secondary: [] },
  "Farmers Carry": { primary: ["Core"], secondary: ["Upper Back"] },
};

// ── CONDITION EDUCATION ──
// Per-condition cues surfaced during exercises (1 max per exercise, full eduMode only)

export const CONDITION_EDUCATION: Record<string, { tag: string; cue: (exerciseName: string) => string | null }> = {
  pcos: {
    tag: "PCOS",
    cue: (name) => {
      if (isCompound(name)) return "Compound movements like this are especially beneficial for insulin sensitivity — exactly what your body needs.";
      return null;
    },
  },
  fibroids: {
    tag: "Fibroids",
    cue: (name) => {
      if (/jump|plyo|box jump|burpee/i.test(name)) return "This has been swapped to a lower-impact alternative to reduce intra-abdominal pressure.";
      if (isCompound(name)) return "Strength training supports bone density and counteracts potential anaemia-related fatigue. Go at your pace.";
      return null;
    },
  },
  endometriosis: {
    tag: "Endometriosis",
    cue: (name) => {
      if (/jump|plyo|box jump|burpee/i.test(name)) return "Low-impact variation selected — less jarring, same training effect.";
      if (isCompound(name)) return "Resistance training has anti-inflammatory effects that can help manage symptoms over time.";
      return null;
    },
  },
  pelvic_floor: {
    tag: "Pelvic floor",
    cue: (name) => {
      if (isCompound(name)) return "Exhale on effort, don't hold your breath. Coordinating breath with movement supports your pelvic floor.";
      return null;
    },
  },
};

/** Get first matching condition education cue for an exercise (max 1) */
export function getConditionCue(exerciseName: string, conditions: string[]): { tag: string; cue: string } | null {
  for (const cond of conditions) {
    const entry = CONDITION_EDUCATION[cond];
    if (entry) {
      const cue = entry.cue(exerciseName);
      if (cue) return { tag: entry.tag, cue };
    }
  }
  return null;
}

// ── PELVIC FLOOR BREATHING OVERRIDES ──
// Exhale-on-exertion cues replace Valsalva-style bracing for pelvic floor users

export const BREATHING_CUES_PELVIC_FLOOR: Record<string, string> = {
  "Barbell Back Squat": "Gentle breath in at the top, exhale as you drive up. No breath-holding.",
  "Front Squat": "Gentle breath in at the top, exhale as you drive up. No breath-holding.",
  "Goblet Squat": "Gentle breath in at the top, exhale as you drive up. No breath-holding.",
  "Box Squat": "Gentle breath in at the top, exhale as you drive up. No breath-holding.",
  "Sumo Squat": "Gentle breath in at the top, exhale as you drive up. No breath-holding.",
  "Leg Press": "Breath in as you lower, exhale steadily as you press. Avoid bearing down.",
  "Bulgarian Split Squat": "Breath in as you lower, exhale as you drive up. Keep it flowing.",
  "Conventional Deadlift": "Breath in before the pull, exhale steadily as you stand. No max-effort bracing.",
  "Sumo Deadlift": "Breath in before the pull, exhale steadily as you stand. No max-effort bracing.",
  "Trap Bar Deadlift": "Breath in before the pull, exhale steadily as you stand. No max-effort bracing.",
  "Romanian Deadlift": "Breath in at the top, exhale as you stand. Keep the breath flowing.",
  "Dumbbell Romanian Deadlift": "Breath in at the top, exhale as you stand. Keep the breath flowing.",
  "Good Morning": "Breath in at the top, exhale as you stand. Keep the breath flowing.",
  "Hip Thrust": "Exhale as you drive up, squeeze at the top. Inhale as you lower.",
  "Barbell Bench Press": "Breath in at the top, exhale as you press. Avoid bearing down.",
  "Incline Barbell Press": "Breath in at the top, exhale as you press. Avoid bearing down.",
  "Dumbbell Bench Press": "Breath in at the top, exhale as you press. Avoid bearing down.",
  "Incline Dumbbell Press": "Breath in at the top, exhale as you press. Avoid bearing down.",
  "Overhead Press": "Exhale as you press up. Keep your core engaged but don't bear down.",
  "Dumbbell Shoulder Press": "Exhale as you press up. Keep your core engaged but don't bear down.",
  "Barbell Row": "Breath in, pull as you exhale. No breath-holding.",
  "Pull-Up": "Breath in at the bottom, exhale as you pull up.",
  "Chin-Up": "Breath in at the bottom, exhale as you pull up.",
  "Dips": "Breath in at the top, exhale as you press up.",
};

// ── HELPERS ──

export function getBreathingCue(exerciseName: string, conditions?: string[]): string | null {
  // Pelvic floor users get exhale-on-exertion overrides
  if (conditions?.includes("pelvic_floor")) {
    const override = BREATHING_CUES_PELVIC_FLOOR[exerciseName];
    if (override) return override;
  }
  return BREATHING_CUES[exerciseName] || null;
}

export function getMuscleTags(exerciseName: string): MuscleTag {
  return EXERCISE_MUSCLE_MAP[exerciseName] || { primary: [], secondary: [] };
}

export function getMuscleInfo(key: string): MuscleInfo | null {
  return MUSCLE_GLOSSARY[key.toLowerCase().replace(/ /g, "_")] || null;
}

export function getDOMSMessage(soreness: number, totalSessions: number): string {
  if (totalSessions <= 3) return DOMS_EDUCATION.firstSessions;
  if (soreness <= 1) return DOMS_EDUCATION.noSoreness;
  if (soreness <= 2) return DOMS_EDUCATION.moderateSoreness;
  if (soreness <= 3) return DOMS_EDUCATION.highSoreness;
  return DOMS_EDUCATION.experienced;
}

export function getRestDayMessage(): string {
  return REST_DAY_MESSAGES[Math.floor(Math.random() * REST_DAY_MESSAGES.length)];
}

const SQUAT_NAMES = ["Barbell Back Squat", "Front Squat", "Goblet Squat", "Box Squat", "Sumo Squat", "Hack Squat", "Bodyweight Squat", "Bulgarian Split Squat", "Kettlebell Goblet Squat", "Banded Squat"];
const HINGE_NAMES = ["Conventional Deadlift", "Romanian Deadlift", "Sumo Deadlift", "Hip Thrust", "Good Morning", "Single-Leg Deadlift", "Glute Bridge", "Kettlebell Swing", "Trap Bar Deadlift", "Back Extension"];
const PRESS_NAMES = ["Barbell Bench Press", "Incline Barbell Press", "Dumbbell Bench Press", "Overhead Press", "Dumbbell Shoulder Press", "Landmine Press", "Kettlebell Press"];
const COMPOUND_NAMES = [...SQUAT_NAMES, ...HINGE_NAMES, ...PRESS_NAMES, "Barbell Row", "Pull-Up", "Chin-Up", "Dips"];

export function isSquat(name: string): boolean { return SQUAT_NAMES.includes(name); }
export function isHinge(name: string): boolean { return HINGE_NAMES.includes(name); }
export function isPress(name: string): boolean { return PRESS_NAMES.includes(name); }
export function isCompound(name: string): boolean { return COMPOUND_NAMES.includes(name); }
