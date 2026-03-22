// ── Weekly Split Templates ──
// Deterministic fallback templates when AI is unavailable

export interface SplitSession {
  title: string;
  coachNote: string;
  exercises: string[];
}

export interface Split {
  sessions: SplitSession[];
}

export const WEEKLY_SPLITS: Record<string, Record<string, Split>> = {
  strength: {
    new: { sessions: [
      { title: "Full Body A", coachNote: "Squat, press, deadlift. Three movements, three patterns. Start lighter than you think - form first.", exercises: ["Barbell Back Squat", "Barbell Bench Press", "Conventional Deadlift", "Dumbbell Row", "Plank"] },
      { title: "Full Body B", coachNote: "Same pattern as last time. Overhead instead of bench. Add a little weight if Session A moved well.", exercises: ["Barbell Back Squat", "Overhead Press", "Conventional Deadlift", "Barbell Row", "Ab Wheel Rollout"] },
    ]},
    developing: { sessions: [
      { title: "Lower Body - Strength", coachNote: "Squat is the primary lift today. Get that right first - everything else is support work.", exercises: ["Barbell Back Squat", "Romanian Deadlift", "Walking Lunges", "Leg Curl", "Plank"] },
      { title: "Upper Body - Strength", coachNote: "Press and pull in equal measure. Add load on the main lifts if last session had two reps left in the tank.", exercises: ["Barbell Bench Press", "Overhead Press", "Pull-Up", "Barbell Row", "Tricep Pushdown"] },
      { title: "Lower Body - Volume", coachNote: "Lighter than the heavy day but more reps. The volume is the work - don't rush the sets.", exercises: ["Barbell Back Squat", "Conventional Deadlift", "Bulgarian Split Squat", "Leg Curl", "Calf Raises"] },
      { title: "Upper Body - Volume", coachNote: "Same quality as the heavy day, more total work. Technical execution matters more than load today.", exercises: ["Incline Barbell Press", "Dumbbell Shoulder Press", "Seated Cable Row", "Lat Pulldown", "Lateral Raise"] },
    ]},
    intermediate: { sessions: [
      { title: "Squat Focus", coachNote: "Squat is the primary movement. Two variations - treat both as strength work, not warm-ups.", exercises: ["Barbell Back Squat", "Front Squat", "Romanian Deadlift", "Leg Curl", "Ab Wheel Rollout"] },
      { title: "Press Focus", coachNote: "Bench and overhead press are the targets. Add load if last week felt like you had more left.", exercises: ["Barbell Bench Press", "Overhead Press", "Dips", "Tricep Pushdown", "Lateral Raise"] },
      { title: "Deadlift Focus", coachNote: "Deadlift while you're fresh. Everything that follows supports the hinge pattern.", exercises: ["Conventional Deadlift", "Romanian Deadlift", "Barbell Row", "Pull-Up", "Plank"] },
      { title: "Upper Accessory", coachNote: "Higher reps today. The load is lighter but the quality of each rep matters more than the weight.", exercises: ["Incline Barbell Press", "Barbell Row", "Lat Pulldown", "Hammer Curl", "Face Pulls"] },
      { title: "Lower Accessory", coachNote: "Single-leg work today. Less weight than bilateral - expected. Feel the difference between sides.", exercises: ["Bulgarian Split Squat", "Hip Thrust", "Walking Lunges", "Leg Curl", "Calf Raises"] },
    ]},
  },
  muscle: {
    new: { sessions: [
      { title: "Full Body A", coachNote: "First session. Focus on feeling each movement work - which muscles are doing the job.", exercises: ["Goblet Squat", "Dumbbell Bench Press", "Dumbbell Row", "Romanian Deadlift", "Lateral Raise"] },
      { title: "Full Body B", coachNote: "Same muscle groups as last time, different exercises. Notice what you feel differently.", exercises: ["Walking Lunges", "Push-Up", "Chest-Supported Row", "Glute Bridge", "Dumbbell Curl"] },
      { title: "Full Body C", coachNote: "Hip thrust is in this session - glutes cramping at the top of every rep is exactly what you want.", exercises: ["Goblet Squat", "Incline Barbell Press", "Seated Cable Row", "Hip Thrust", "Tricep Pushdown"] },
    ]},
    developing: { sessions: [
      { title: "Legs - Quads & Glutes", coachNote: "RDL after squats - the hinge picks up what the squat leaves off.", exercises: ["Barbell Back Squat", "Bulgarian Split Squat", "Leg Press", "Romanian Deadlift", "Calf Raises"] },
      { title: "Push - Chest & Shoulders", coachNote: "Pressing day. Shoulder development comes from the lateral raise at the end - don't skip it.", exercises: ["Barbell Bench Press", "Incline Barbell Press", "Overhead Press", "Lateral Raise", "Tricep Pushdown"] },
      { title: "Legs B - Glutes & Hamstrings", coachNote: "Hip thrust and RDL together. These two develop the glutes through their complete range.", exercises: ["Romanian Deadlift", "Hip Thrust", "Walking Lunges", "Leg Curl", "Calf Raises"] },
      { title: "Pull - Back & Biceps", coachNote: "Upper back day. The width you build here changes your proportions.", exercises: ["Pull-Up", "Barbell Row", "Seated Cable Row", "Face Pulls", "Dumbbell Curl"] },
    ]},
    intermediate: { sessions: [
      { title: "Glutes & Posterior Chain", coachNote: "Hinge day. RDL and hip thrust are the most important exercises in your programme.", exercises: ["Romanian Deadlift", "Hip Thrust", "Bulgarian Split Squat", "Leg Curl", "Back Extension"] },
      { title: "Push - Chest & Shoulders", coachNote: "Pressing session. Face pulls at the end are non-negotiable.", exercises: ["Barbell Bench Press", "Incline Barbell Press", "Overhead Press", "Lateral Raise", "Face Pulls"] },
      { title: "Legs - Quad Focus", coachNote: "Quad-focused session. Go deep on every rep.", exercises: ["Barbell Back Squat", "Hack Squat", "Bulgarian Split Squat", "Leg Extension", "Calf Raises"] },
      { title: "Pull - Back & Biceps", coachNote: "Upper back session. Pull-up and row together build depth and width.", exercises: ["Pull-Up", "Barbell Row", "Seated Cable Row", "Face Pulls", "Dumbbell Curl"] },
    ]},
  },
  general: {
    new: { sessions: [
      { title: "Full Body A", coachNote: "First session. Take your time with each movement - leave feeling like you could come back tomorrow.", exercises: ["Goblet Squat", "Push-Up", "Dumbbell Row", "Glute Bridge", "Plank"] },
      { title: "Full Body B", coachNote: "Same patterns as last time, slightly different exercises. That familiarity is the habit forming.", exercises: ["Walking Lunges", "Push-Up", "Chest-Supported Row", "Romanian Deadlift", "Dead Bug"] },
      { title: "Full Body C", coachNote: "Three sessions in. That's the pattern starting to stick.", exercises: ["Goblet Squat", "Dumbbell Bench Press", "Dumbbell Row", "Hip Thrust", "Plank"] },
    ]},
    developing: { sessions: [
      { title: "Upper Body", coachNote: "Push and pull balanced - leave the gym feeling like you used your whole upper body.", exercises: ["Barbell Bench Press", "Barbell Row", "Overhead Press", "Pull-Up", "Lateral Raise"] },
      { title: "Lower Body", coachNote: "Squat and hinge are the two fundamental patterns - keep the weight manageable.", exercises: ["Barbell Back Squat", "Romanian Deadlift", "Walking Lunges", "Glute Bridge", "Calf Raises"] },
      { title: "Upper Body B", coachNote: "Upper body again, different angles. Notice which exercises feel familiar now.", exercises: ["Incline Barbell Press", "Seated Cable Row", "Dips", "Lat Pulldown", "Face Pulls"] },
      { title: "Full Body - Conditioning", coachNote: "Full body session with a bit more pace. Shorter rests - the elevated heart rate is part of the point.", exercises: ["Goblet Squat", "Dumbbell Bench Press", "Dumbbell Row", "Romanian Deadlift", "Farmers Carry"] },
    ]},
    intermediate: { sessions: [
      { title: "Upper - Strength", coachNote: "A session you leave feeling good about is worth more than one you drag yourself through.", exercises: ["Barbell Bench Press", "Pull-Up", "Overhead Press", "Barbell Row", "Tricep Pushdown"] },
      { title: "Lower - Strength", coachNote: "Squat and deadlift - the two movements that do the most.", exercises: ["Barbell Back Squat", "Conventional Deadlift", "Walking Lunges", "Glute Bridge", "Ab Wheel Rollout"] },
      { title: "Upper - Volume", coachNote: "Slightly higher rep session today. The weight is lighter - that's intentional.", exercises: ["Incline Barbell Press", "Seated Cable Row", "Dips", "Lat Pulldown", "Lateral Raise"] },
      { title: "Lower - Volume", coachNote: "Leave feeling like your legs worked - not destroyed, worked.", exercises: ["Romanian Deadlift", "Bulgarian Split Squat", "Hip Thrust", "Leg Curl", "Calf Raises"] },
      { title: "Full Body - Athletic", coachNote: "Different kind of session today - more dynamic. That variety is good for you.", exercises: ["Kettlebell Swing", "Barbell Bench Press", "Barbell Row", "Box Jumps", "Farmers Carry"] },
    ]},
  },
};
