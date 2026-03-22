// @ts-nocheck
// ── Anatomy & Mobility Cues ──
// Contextual "if you notice this..." cues for exercises where body proportions
// or mobility commonly cause confusion. Framing: normalise first, correct second.
// Keys must exactly match exercise library names.

export const ANATOMY_CUES = {

  'Barbell Back Squat': [
    {
      sign: 'Torso pitching forward?',
      note: 'If it happens even with a wide stance, this is your femur length - not a technique error. Long femurs create a more horizontal torso angle. Own the lean, keep your brace, and widen your stance until your knees track comfortably.'
    },
    {
      sign: 'Sharp pinch in the hip at depth?',
      note: 'Your hip socket structure may be limiting depth - not mobility. No amount of stretching fixes a structural limit. Try a wider, more turned-out stance. If pinching persists regardless, shallower depth is your range.'
    },
    {
      sign: 'Heels rising off the floor?',
      note: 'Ankle mobility is limiting your depth. Elevate your heels slightly (a 5kg plate works) or work on calf and ankle stretches consistently. This is trainable.'
    }
  ],

  'Front Squat': [
    {
      sign: 'Can\'t keep an upright torso?',
      note: 'Front squat demands significant ankle mobility and thoracic extension. If you\'re already mobile and still leaning, your proportions may make this variation genuinely difficult. Goblet Squat or Hack Squat achieve a similar stimulus more accessibly.'
    },
    {
      sign: 'Wrist or elbow pain in the rack?',
      note: 'A wrist mobility limitation, not a strength issue. Cross-arm grip or lifting straps are completely valid. Work on wrist mobility separately if you want to build the standard rack position.'
    }
  ],

  'Goblet Squat': [
    {
      sign: 'Heels rising or balance feels off?',
      note: 'Ankle mobility is the usual cause. Try elevating your heels slightly or holding a post lightly for balance while you work on the pattern. This resolves with consistent practice.'
    }
  ],

  'Bulgarian Split Squat': [
    {
      sign: 'Torso leaning far over the front foot?',
      note: 'Common with longer femurs - move your front foot slightly further forward to give yourself more room. The lean itself isn\'t the problem; losing your brace is.'
    },
    {
      sign: 'Knee discomfort on the back leg?',
      note: 'The rear knee should hover just above the floor, not crash into it. Use a mat or folded towel under the knee if the floor contact is the issue rather than the movement itself.'
    }
  ],

  'Box Squat': [
    {
      sign: 'Torso collapsing forward when you sit back?',
      note: 'Long femurs make sitting back onto a box harder to stay upright. Use a slightly wider stance and focus on keeping tension through the whole descent - the box is a depth marker, not a rest.'
    }
  ],

  'Conventional Deadlift': [
    {
      sign: 'Back angle looks more horizontal than upright?',
      note: 'Your torso angle is set by your limb proportions - there is no single correct angle. A more horizontal back is normal for longer femurs or shorter arms. What matters is keeping it neutral throughout the pull.'
    },
    {
      sign: 'Lower back rounding at the start?',
      note: 'Usually hamstring tightness combined with starting too low. Set your hips slightly higher - you should feel tension through your hamstrings before the bar leaves the floor. That tension is your brace.'
    }
  ],

  'Sumo Deadlift': [
    {
      sign: 'Hip pinching in a wide stance?',
      note: 'Sumo suits wide hips and externally-rotated hip sockets. If you feel pinching even with a moderate stance, your hip anatomy may not suit this variation - conventional or trap bar deadlift may be a better fit.'
    }
  ],

  'Romanian Deadlift': [
    {
      sign: 'Lower back rounding before you feel hamstring stretch?',
      note: 'Your hamstrings are limiting range, not your technique. Hinge only as far as you can maintain a flat back - that is your current end range. It extends over time with consistent training.'
    }
  ],

  'Good Morning': [
    {
      sign: 'Feeling significant stress in the lower back?',
      note: 'Long femurs amplify the lever arm on this movement considerably. Keep loading very conservative. If it consistently aggravates your lower back regardless of load, Romanian Deadlift achieves a similar stimulus with less spinal demand.'
    }
  ],

  'Overhead Press': [
    {
      sign: 'Lower back arching under the bar?',
      note: 'Your body is compensating for limited thoracic extension. Brace hard, tuck your ribs slightly, and press only as far overhead as you can control without the arch. This is a mobility issue - it improves with consistent thoracic work.'
    },
    {
      sign: 'Shoulder impingement at lockout?',
      note: 'Try a grip slightly wider than shoulder-width. Narrow grip increases internal rotation demand at the top - a small adjustment often resolves the pinch without changing the movement.'
    }
  ],

  'Barbell Bench Press': [
    {
      sign: 'Shoulder discomfort at the bottom of the press?',
      note: 'Try moving your grip 1–2 fingers inward. Long arms increase the stretch on the shoulder at the bottom - a slightly narrower grip reduces that stress. If it persists, Dumbbell Bench allows each arm to find its natural path.'
    }
  ],

  'Incline Barbell Press': [
    {
      sign: 'Shoulder discomfort at the bottom?',
      note: 'Incline increases the stretch demand on the shoulder compared to flat pressing. Try a slightly narrower grip, or switch to Incline Dumbbell Press which allows a more natural range of motion per arm.'
    }
  ],

  'Hip Thrust': [
    {
      sign: 'Feeling it more in your lower back than glutes?',
      note: 'Your feet are likely too close to your body. Move them forward until your shins are vertical at the top of the rep - that is your setup position. Back pain here is almost always a foot placement issue.'
    },
    {
      sign: 'Hip crease discomfort from the bar?',
      note: 'Use a barbell pad or fold a yoga mat under the bar. This is a comfort issue, not a form issue - it does not change how the movement works.'
    }
  ],

  'Barbell Row': [
    {
      sign: 'Lower back taking over instead of your upper back?',
      note: 'Your torso angle may be too horizontal. Try a 45-degree angle - lower back supports the position, upper back does the work. If lower back fatigue persists, Chest-Supported Row removes the demand entirely.'
    }
  ],

  'Leg Press': [
    {
      sign: 'Knees caving inward at the bottom?',
      note: 'Your feet may be too narrow or too low on the platform. Move them slightly wider and higher - this gives your hips more room and lets the knees track naturally over the toes.'
    },
    {
      sign: 'Lower back lifting off the pad?',
      note: 'You\'re going deeper than your hip mobility allows. The moment your lower back rounds off the pad, that\'s your current end range. Reduce the depth slightly - you\'ll still get full quad and glute engagement without loading the spine.'
    }
  ],

  'Lat Pulldown': [
    {
      sign: 'Feeling it more in your arms than your back?',
      note: 'Common when the grip is too narrow or you\'re pulling with your biceps first. Widen your grip slightly, and think about driving your elbows down toward your hips rather than pulling the bar to your chest. The back engages when the elbows lead.'
    },
    {
      sign: 'Leaning way back to finish each rep?',
      note: 'A slight lean is normal - 15 to 20 degrees. If you\'re leaning much further, the weight is probably too heavy and your lower back is compensating. Drop the load, stay more upright, and you\'ll feel the lats work harder with less weight.'
    }
  ],

  'Dips': [
    {
      sign: 'Shoulder pain at the bottom of the dip?',
      note: 'Your shoulders may not have the mobility for full depth yet. Only go as deep as you can without pain - for most people that means upper arms parallel to the floor, not lower. Depth improves over time with consistent shoulder mobility work.'
    },
    {
      sign: 'Feeling it more in shoulders than chest or triceps?',
      note: 'Lean your torso forward slightly to shift emphasis to the chest. Staying perfectly upright turns this into a shoulder-dominant movement, which is harder on the joint and less effective for the muscles you\'re targeting.'
    }
  ],

  'Pull-Up': [
    {
      sign: 'Can\'t get your chin over the bar?',
      note: 'This is almost always a lat strength issue, not an arm issue. Band-assisted or machine-assisted pull-ups let you build the pattern with proper form. Jumping to the top and lowering slowly (negatives) also builds the strength you need for full reps.'
    },
    {
      sign: 'Swinging or kipping to get up?',
      note: 'Momentum bypasses the muscles you\'re trying to develop. Cross your ankles, squeeze your glutes, and start from a dead hang. If you can\'t do a strict rep from there, use assistance - the quality of the rep matters more than whether it\'s unassisted.'
    }
  ],

  'Seated Cable Row': [
    {
      sign: 'Rounding forward at the start of each rep?',
      note: 'Your lower back is absorbing force that should go through your upper back. Sit tall, brace your core, and think about keeping your chest lifted throughout. If you can\'t maintain position, the weight is too heavy - your form should set the load, not the other way around.'
    }
  ],

  'Hack Squat': [
    {
      sign: 'Knee pain during the movement?',
      note: 'The fixed foot platform removes your ability to adjust stance naturally. Try moving your feet slightly higher on the platform and pointing your toes out a bit more. If knee discomfort persists regardless of foot position, Leg Press allows more freedom to find your comfortable path.'
    },
    {
      sign: 'Heels lifting off the platform?',
      note: 'Ankle mobility is the limiter. Move your feet higher on the platform - this reduces the ankle flexibility demand. The higher your feet, the more the emphasis shifts toward glutes and hamstrings, which is a valid variation, not a compromise.'
    }
  ],

  'Walking Lunges': [
    {
      sign: 'Losing balance on every rep?',
      note: 'Stance width is the usual fix. Most people step too narrowly, like walking a tightrope. Step forward and slightly out to the side - imagine walking on train tracks, not a single line. This gives you a stable base without changing the movement.'
    },
    {
      sign: 'Front knee shooting past your toes?',
      note: 'Take a slightly longer step. When your stride is too short, the knee has nowhere to go but forward, which increases shear force on the joint. A longer step keeps the shin more vertical and loads the glute more effectively.'
    }
  ]

};
