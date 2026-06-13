// ============================================================================
// Summer Quest — Static data: muscles, exercise catalog, activities/sports
// ============================================================================

// The 10 tracked muscle groups (per spec). "back" = lats + upper back.
export const MUSCLES = [
  { id: 'chest',      name: 'Chest' },
  { id: 'back',       name: 'Back' },
  { id: 'shoulders',  name: 'Shoulders' },
  { id: 'triceps',    name: 'Triceps' },
  { id: 'biceps',     name: 'Biceps' },
  { id: 'core',       name: 'Core' },
  { id: 'quads',      name: 'Quads' },
  { id: 'hamstrings', name: 'Hamstrings' },
  { id: 'glutes',     name: 'Glutes' },
  { id: 'calves',     name: 'Calves' },
];

export const MUSCLE_IDS = MUSCLES.map(m => m.id);
export const muscleName = id => (MUSCLES.find(m => m.id === id) || {}).name || id;

// Categories and which muscle groups they primarily develop. Used by the
// generator to translate "this muscle group needs work" -> "pick from here".
export const CATEGORIES = {
  push:         { name: 'Push',         muscles: ['chest', 'shoulders', 'triceps'] },
  pull:         { name: 'Pull',         muscles: ['back', 'biceps', 'shoulders'] },
  legs:         { name: 'Legs',         muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  core:         { name: 'Core',         muscles: ['core'] },
  conditioning: { name: 'Conditioning', muscles: ['quads', 'calves', 'core', 'shoulders'] },
  mobility:     { name: 'Mobility',     muscles: [] },
};

// ---------------------------------------------------------------------------
// Exercise catalog.
//   muscles:   load weights. >=0.6 => primary (red), 0.25-0.59 => secondary
//              (orange). Numbers also feed the recovery + volume engines.
//   pattern:   drives which generated SVG animation is shown.
//   unit:      'reps' | 'reps_each' (per side) | 'seconds'
//   base:      baseline volume for a Standard quest at progression level 1.
//   level:     difficulty within its progression chain (1 = easiest).
//   chain:     progression chain id (generator picks the move matching the
//              user's current level for that chain).
//   equip:     required equipment ids (empty = floor/wall, always available).
//   cues:      coaching cues; first line is the "you should feel this..." cue.
// ---------------------------------------------------------------------------
export const EXERCISES = [
  // ---------------------------- PUSH ---------------------------------------
  { id: 'wall_pushup', name: 'Wall Push-up', category: 'push', pattern: 'pushup', unit: 'reps', base: 12, level: 1, chain: 'pushup', equip: [],
    muscles: { chest: 0.8, triceps: 0.5, shoulders: 0.4, core: 0.2 },
    cues: ['You should feel this mostly in your chest and triceps.', 'Keep your body in a straight line from head to heels.', 'Lower until your nose is close to the wall.'] },
  { id: 'incline_pushup', name: 'Incline Push-up', category: 'push', pattern: 'pushup', unit: 'reps', base: 10, level: 2, chain: 'pushup', equip: ['chair'],
    muscles: { chest: 0.9, triceps: 0.55, shoulders: 0.45, core: 0.25 },
    cues: ['You should feel this mostly in your chest and triceps.', 'Hands on a chair or ledge, body straight.', 'Lower until elbows reach roughly 90 degrees.'] },
  { id: 'pushup', name: 'Standard Push-up', category: 'push', pattern: 'pushup', unit: 'reps', base: 10, level: 3, chain: 'pushup', equip: [],
    muscles: { chest: 1.0, triceps: 0.6, shoulders: 0.5, core: 0.3 },
    cues: ['You should feel this mostly in your chest and triceps.', 'Keep your body straight, core braced.', 'Lower until elbows reach roughly 90 degrees.'] },
  { id: 'wide_pushup', name: 'Wide Push-up', category: 'push', pattern: 'pushup', unit: 'reps', base: 10, level: 3, chain: 'pushup', equip: [],
    muscles: { chest: 1.0, shoulders: 0.5, triceps: 0.45, core: 0.3 },
    cues: ['You should feel this mostly across your chest.', 'Hands wider than shoulders.', 'Control the descent, no bouncing.'] },
  { id: 'diamond_pushup', name: 'Diamond Push-up', category: 'push', pattern: 'pushup', unit: 'reps', base: 8, level: 4, chain: 'pushup', equip: [],
    muscles: { triceps: 1.0, chest: 0.7, shoulders: 0.5, core: 0.3 },
    cues: ['You should feel this mostly in your triceps.', 'Hands together forming a diamond under your chest.', 'Keep elbows tracking close to your body.'] },
  { id: 'decline_pushup', name: 'Decline Push-up', category: 'push', pattern: 'pushup', unit: 'reps', base: 8, level: 4, chain: 'pushup', equip: ['chair'],
    muscles: { chest: 1.0, shoulders: 0.7, triceps: 0.6, core: 0.35 },
    cues: ['You should feel this in your upper chest and shoulders.', 'Feet elevated on a chair, hands on floor.', 'Keep hips from sagging.'] },
  { id: 'archer_pushup', name: 'Archer Push-up', category: 'push', pattern: 'pushup', unit: 'reps_each', base: 5, level: 5, chain: 'pushup', equip: [],
    muscles: { chest: 1.0, triceps: 0.7, shoulders: 0.6, core: 0.4 },
    cues: ['You should feel this in one side of your chest at a time.', 'Shift weight onto the bent arm, straighten the other.', 'Move slowly and stay controlled.'] },
  { id: 'pike_pushup', name: 'Pike Push-up', category: 'push', pattern: 'pike', unit: 'reps', base: 8, level: 4, chain: 'vertical_push', equip: [],
    muscles: { shoulders: 1.0, triceps: 0.6, chest: 0.3, core: 0.3 },
    cues: ['You should feel this mostly in your shoulders.', 'Hips high, body in an inverted V.', 'Lower the crown of your head toward the floor.'] },
  { id: 'wall_handstand_hold', name: 'Wall Handstand Hold', category: 'push', pattern: 'plank', unit: 'seconds', base: 20, level: 5, chain: 'vertical_push', equip: ['wall'],
    muscles: { shoulders: 1.0, triceps: 0.5, core: 0.5, chest: 0.2 },
    cues: ['You should feel this in your shoulders and core.', 'Kick up against a wall, arms locked.', 'Push the floor away and squeeze your midline.'] },
  { id: 'handstand_pushup_prog', name: 'Handstand Push-up Progression', category: 'push', pattern: 'pike', unit: 'reps', base: 5, level: 6, chain: 'vertical_push', equip: ['wall'],
    muscles: { shoulders: 1.0, triceps: 0.8, core: 0.4, chest: 0.3 },
    cues: ['You should feel this strongly in your shoulders and triceps.', 'Lower under control toward the floor.', 'Only go as deep as you can press back up.'] },
  { id: 'chair_dips', name: 'Chair Dips', category: 'push', pattern: 'dip', unit: 'reps', base: 10, level: 3, chain: 'dip', equip: ['chair'],
    muscles: { triceps: 1.0, chest: 0.5, shoulders: 0.5, core: 0.2 },
    cues: ['You should feel this mostly in your triceps.', 'Hands on a chair edge, lower your hips down.', 'Keep elbows pointing back, not flaring out.'] },

  // ---------------------------- PULL ---------------------------------------
  { id: 'doorframe_rows', name: 'Doorframe Rows', category: 'pull', pattern: 'row', unit: 'reps', base: 12, level: 1, chain: 'row', equip: [],
    muscles: { back: 0.9, biceps: 0.6, shoulders: 0.3, core: 0.2 },
    cues: ['You should feel this in your upper back and biceps.', 'Grip a sturdy doorframe, lean back, pull yourself in.', 'Squeeze your shoulder blades together.'] },
  { id: 'towel_rows', name: 'Towel Rows', category: 'pull', pattern: 'row', unit: 'reps', base: 12, level: 2, chain: 'row', equip: ['towel'],
    muscles: { back: 0.95, biceps: 0.65, shoulders: 0.35, core: 0.25 },
    cues: ['You should feel this in your back and biceps.', 'Loop a towel around a fixed post and lean back.', 'Drive your elbows down and back.'] },
  { id: 'australian_rows', name: 'Australian Rows', category: 'pull', pattern: 'row', unit: 'reps', base: 10, level: 3, chain: 'row', equip: ['pullup-bar'],
    muscles: { back: 1.0, biceps: 0.7, shoulders: 0.4, core: 0.3 },
    cues: ['You should feel this across your upper back.', 'Body under a low bar, heels on floor, pull chest to bar.', 'Keep your body in a straight line.'] },
  { id: 'scapular_pulls', name: 'Hanging Scapular Pulls', category: 'pull', pattern: 'hang', unit: 'reps', base: 8, level: 2, chain: 'pullup', equip: ['pullup-bar'],
    muscles: { back: 0.8, biceps: 0.3, shoulders: 0.4, core: 0.2 },
    cues: ['You should feel this between your shoulder blades.', 'Hang from a bar and pull your shoulders down without bending arms.', 'Small range, big squeeze.'] },
  { id: 'dead_hang', name: 'Dead Hang', category: 'pull', pattern: 'hang', unit: 'seconds', base: 20, level: 1, chain: 'pullup', equip: ['pullup-bar'],
    muscles: { back: 0.6, biceps: 0.4, shoulders: 0.4, core: 0.2 },
    cues: ['You should feel this in your grip, forearms and lats.', 'Simply hang with active shoulders.', 'Breathe and relax your neck.'] },
  { id: 'neutral_pullup', name: 'Neutral-Grip Pull-up', category: 'pull', pattern: 'pullup', unit: 'reps', base: 6, level: 4, chain: 'pullup', equip: ['pullup-bar'],
    muscles: { back: 1.0, biceps: 0.8, shoulders: 0.4, core: 0.3 },
    cues: ['You should feel this in your lats and biceps.', 'Palms facing each other, pull chin over the bar.', 'Control the descent.'] },
  { id: 'chinup', name: 'Chin-up', category: 'pull', pattern: 'pullup', unit: 'reps', base: 6, level: 4, chain: 'pullup', equip: ['pullup-bar'],
    muscles: { back: 0.9, biceps: 1.0, shoulders: 0.3, core: 0.3 },
    cues: ['You should feel this strongly in your biceps and back.', 'Palms facing you, pull chin over the bar.', 'No kipping — stay strict.'] },
  { id: 'pullup', name: 'Pull-up', category: 'pull', pattern: 'pullup', unit: 'reps', base: 5, level: 5, chain: 'pullup', equip: ['pullup-bar'],
    muscles: { back: 1.0, biceps: 0.7, shoulders: 0.5, core: 0.3 },
    cues: ['You should feel this in your lats and upper back.', 'Palms facing away, pull chin over the bar.', 'Lead with your chest, squeeze at the top.'] },

  // ---------------------------- LEGS ---------------------------------------
  { id: 'air_squat', name: 'Air Squat', category: 'legs', pattern: 'squat', unit: 'reps', base: 18, level: 1, chain: 'squat', equip: [],
    muscles: { quads: 1.0, glutes: 0.7, hamstrings: 0.4, calves: 0.2, core: 0.2 },
    cues: ['You should feel this in your quads and glutes.', 'Sit hips back and down, chest up.', 'Drive through your heels to stand.'] },
  { id: 'tempo_squat', name: 'Tempo Squat', category: 'legs', pattern: 'squat', unit: 'reps', base: 12, level: 2, chain: 'squat', equip: [],
    muscles: { quads: 1.0, glutes: 0.8, hamstrings: 0.5, calves: 0.2, core: 0.25 },
    cues: ['You should feel a deep burn in your quads.', 'Lower for a slow 3-count, pause, then stand.', 'Keep tension the whole way.'] },
  { id: 'jump_squat', name: 'Jump Squat', category: 'legs', pattern: 'jump', unit: 'reps', base: 12, level: 3, chain: 'squat', equip: [],
    muscles: { quads: 1.0, glutes: 0.8, calves: 0.6, hamstrings: 0.5, core: 0.3 },
    cues: ['You should feel this in your quads and calves.', 'Squat then explode up off the floor.', 'Land softly with bent knees.'] },
  { id: 'split_squat', name: 'Split Squat', category: 'legs', pattern: 'lunge', unit: 'reps_each', base: 10, level: 3, chain: 'lunge', equip: [],
    muscles: { quads: 1.0, glutes: 0.8, hamstrings: 0.5, calves: 0.3, core: 0.25 },
    cues: ['You should feel this in the front leg quad and glute.', 'Stagger your stance, lower the back knee.', 'Keep your front knee over your foot.'] },
  { id: 'reverse_lunge', name: 'Reverse Lunge', category: 'legs', pattern: 'lunge', unit: 'reps_each', base: 12, level: 2, chain: 'lunge', equip: [],
    muscles: { quads: 0.9, glutes: 0.9, hamstrings: 0.5, calves: 0.3, core: 0.25 },
    cues: ['You should feel this in your glutes and quads.', 'Step backward and lower your back knee.', 'Push through the front heel to return.'] },
  { id: 'walking_lunge', name: 'Walking Lunge', category: 'legs', pattern: 'lunge', unit: 'reps_each', base: 12, level: 3, chain: 'lunge', equip: [],
    muscles: { quads: 1.0, glutes: 0.9, hamstrings: 0.5, calves: 0.35, core: 0.3 },
    cues: ['You should feel this in your quads and glutes.', 'Step forward into a lunge, then continue walking.', 'Stay tall through your torso.'] },
  { id: 'lateral_lunge', name: 'Lateral Lunge', category: 'legs', pattern: 'lunge', unit: 'reps_each', base: 10, level: 3, chain: 'lunge', equip: [],
    muscles: { quads: 0.8, glutes: 0.9, hamstrings: 0.6, calves: 0.3, core: 0.3 },
    cues: ['You should feel this in your inner thighs and glutes.', 'Step wide to one side and sit into that hip.', 'Keep the other leg straight.'] },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', category: 'legs', pattern: 'lunge', unit: 'reps_each', base: 8, level: 4, chain: 'lunge', equip: ['chair'],
    muscles: { quads: 1.0, glutes: 1.0, hamstrings: 0.6, calves: 0.3, core: 0.3 },
    cues: ['You should feel this strongly in the front leg.', 'Rear foot on a chair, lower straight down.', 'Keep most weight on the front leg.'] },
  { id: 'single_leg_squat_prog', name: 'Single-Leg Squat Progression', category: 'legs', pattern: 'squat', unit: 'reps_each', base: 6, level: 5, chain: 'squat', equip: ['chair'],
    muscles: { quads: 1.0, glutes: 0.9, hamstrings: 0.7, calves: 0.4, core: 0.4 },
    cues: ['You should feel this in one quad and glute.', 'Lower to a chair on one leg, stand back up.', 'Lower the chair height as you progress.'] },
  { id: 'wall_sit', name: 'Wall Sit', category: 'legs', pattern: 'wallsit', unit: 'seconds', base: 40, level: 1, chain: 'wallsit', equip: ['wall'],
    muscles: { quads: 1.0, glutes: 0.5, calves: 0.3, core: 0.2 },
    cues: ['You should feel a burn in your quads.', 'Back flat on the wall, thighs parallel to floor.', 'Hold steady and breathe.'] },
  { id: 'calf_raise', name: 'Calf Raise', category: 'legs', pattern: 'calf', unit: 'reps', base: 20, level: 1, chain: 'calf', equip: [],
    muscles: { calves: 1.0 },
    cues: ['You should feel this in your calves.', 'Rise onto the balls of your feet.', 'Pause at the top, lower slowly.'] },
  { id: 'single_calf_raise', name: 'Single-Leg Calf Raise', category: 'legs', pattern: 'calf', unit: 'reps_each', base: 14, level: 2, chain: 'calf', equip: [],
    muscles: { calves: 1.0, core: 0.15 },
    cues: ['You should feel this in one calf.', 'Balance on one foot and rise up.', 'Use a wall for balance if needed.'] },

  // ---------------------------- CORE ---------------------------------------
  { id: 'front_plank', name: 'Front Plank', category: 'core', pattern: 'plank', unit: 'seconds', base: 40, level: 1, chain: 'plank', equip: [],
    muscles: { core: 1.0, shoulders: 0.3, glutes: 0.2 },
    cues: ['You should feel this through your whole midsection.', 'Forearms down, body in a straight line.', 'Squeeze glutes and brace your abs.'] },
  { id: 'side_plank', name: 'Side Plank', category: 'core', pattern: 'plank', unit: 'seconds', base: 25, level: 2, chain: 'plank', equip: [],
    muscles: { core: 1.0, shoulders: 0.4, glutes: 0.3 },
    cues: ['You should feel this in your obliques (side abs).', 'Stack your feet, lift your hips high.', 'Keep your body in one straight line.'] },
  { id: 'hollow_hold', name: 'Hollow Hold', category: 'core', pattern: 'hollow', unit: 'seconds', base: 25, level: 3, chain: 'plank', equip: [],
    muscles: { core: 1.0, quads: 0.2 },
    cues: ['You should feel this deep in your lower abs.', 'Lower back pressed to floor, arms and legs off the ground.', 'Make a shallow banana shape.'] },
  { id: 'dead_bug', name: 'Dead Bug', category: 'core', pattern: 'deadbug', unit: 'reps_each', base: 10, level: 1, chain: 'anti_ext', equip: [],
    muscles: { core: 0.9 },
    cues: ['You should feel this in your deep core.', 'Extend opposite arm and leg, keep low back down.', 'Move slowly and breathe.'] },
  { id: 'bird_dog', name: 'Bird Dog', category: 'core', pattern: 'deadbug', unit: 'reps_each', base: 10, level: 1, chain: 'anti_ext', equip: [],
    muscles: { core: 0.8, glutes: 0.4, back: 0.3, shoulders: 0.2 },
    cues: ['You should feel this in your core and lower back.', 'On all fours, extend opposite arm and leg.', 'Keep your hips level.'] },
  { id: 'leg_raises', name: 'Leg Raises', category: 'core', pattern: 'legraise', unit: 'reps', base: 12, level: 2, chain: 'flexion', equip: [],
    muscles: { core: 1.0, quads: 0.3 },
    cues: ['You should feel this in your lower abs.', 'Lie flat, raise straight legs to vertical.', 'Lower slowly without arching your back.'] },
  { id: 'reverse_crunch', name: 'Reverse Crunch', category: 'core', pattern: 'legraise', unit: 'reps', base: 14, level: 2, chain: 'flexion', equip: [],
    muscles: { core: 1.0 },
    cues: ['You should feel this in your lower abs.', 'Curl your knees toward your chest, lift hips off floor.', 'Control the way down.'] },
  { id: 'bicycle_crunch', name: 'Bicycle Crunch', category: 'core', pattern: 'bicycle', unit: 'reps_each', base: 14, level: 2, chain: 'flexion', equip: [],
    muscles: { core: 1.0 },
    cues: ['You should feel this in your obliques and abs.', 'Bring opposite elbow to knee, extend the other leg.', 'Rotate through your torso, not your neck.'] },
  { id: 'mountain_climbers', name: 'Mountain Climbers', category: 'core', pattern: 'climber', unit: 'seconds', base: 30, level: 2, chain: 'flexion', equip: [],
    muscles: { core: 0.8, shoulders: 0.4, quads: 0.4, conditioning: 0.5 },
    cues: ['You should feel this in your core, with your heart rate rising.', 'Plank position, drive knees toward chest quickly.', 'Keep hips low and steady.'] },
  { id: 'superman_hold', name: 'Superman Hold', category: 'core', pattern: 'superman', unit: 'seconds', base: 25, level: 1, chain: 'anti_ext', equip: [],
    muscles: { back: 0.7, glutes: 0.5, core: 0.4, shoulders: 0.2 },
    cues: ['You should feel this in your lower back and glutes.', 'Lie face down, lift arms, chest and legs.', 'Hold and squeeze, don\'t strain your neck.'] },

  // ------------------------ CONDITIONING -----------------------------------
  { id: 'burpees', name: 'Burpees', category: 'conditioning', pattern: 'burpee', unit: 'reps', base: 10, level: 3, chain: 'cond', equip: [],
    muscles: { conditioning: 1.0, quads: 0.6, chest: 0.4, shoulders: 0.4, core: 0.4, calves: 0.3 },
    cues: ['You should feel this everywhere — it\'s a full-body burner.', 'Drop to a push-up, jump feet in, jump up.', 'Pace yourself to keep moving.'] },
  { id: 'high_knees', name: 'High Knees', category: 'conditioning', pattern: 'run', unit: 'seconds', base: 30, level: 1, chain: 'cond', equip: [],
    muscles: { conditioning: 0.9, quads: 0.5, calves: 0.5, core: 0.3 },
    cues: ['You should feel your heart rate climb and your legs work.', 'Run in place driving knees to hip height.', 'Stay light on the balls of your feet.'] },
  { id: 'jump_rope', name: 'Jump Rope', category: 'conditioning', pattern: 'jumprope', unit: 'seconds', base: 45, level: 2, chain: 'cond', equip: ['jump-rope'],
    muscles: { conditioning: 1.0, calves: 0.7, shoulders: 0.3, core: 0.2 },
    cues: ['You should feel this in your calves and lungs.', 'Small bounces, turn the rope from your wrists.', 'Stay relaxed and rhythmic.'] },
  { id: 'sprint_intervals', name: 'Sprint Intervals', category: 'conditioning', pattern: 'run', unit: 'seconds', base: 30, level: 4, chain: 'cond', equip: [],
    muscles: { conditioning: 1.0, hamstrings: 0.6, quads: 0.6, glutes: 0.5, calves: 0.4 },
    cues: ['You should feel this in your legs and lungs.', 'Sprint hard, then walk to recover, repeat.', 'Drive your arms.'] },
  { id: 'stair_climbs', name: 'Stair Climbs', category: 'conditioning', pattern: 'run', unit: 'seconds', base: 45, level: 2, chain: 'cond', equip: ['stairs'],
    muscles: { conditioning: 0.9, quads: 0.7, glutes: 0.6, calves: 0.5 },
    cues: ['You should feel this in your quads, glutes and lungs.', 'Climb steadily, one or two steps at a time.', 'Use the rail only for balance.'] },
  { id: 'broad_jumps', name: 'Broad Jumps', category: 'conditioning', pattern: 'jump', unit: 'reps', base: 8, level: 3, chain: 'cond', equip: [],
    muscles: { conditioning: 0.7, quads: 0.8, glutes: 0.8, hamstrings: 0.6, calves: 0.5 },
    cues: ['You should feel this explosively in your legs.', 'Swing your arms and jump forward as far as you can.', 'Land softly and reset.'] },
  { id: 'bear_crawl', name: 'Bear Crawl', category: 'conditioning', pattern: 'crawl', unit: 'seconds', base: 30, level: 3, chain: 'cond', equip: [],
    muscles: { conditioning: 0.8, shoulders: 0.6, core: 0.7, quads: 0.4 },
    cues: ['You should feel this in your shoulders and core.', 'Knees just off the floor, crawl with opposite hand and foot.', 'Keep your hips low.'] },
  { id: 'crab_walk', name: 'Crab Walk', category: 'conditioning', pattern: 'crawl', unit: 'seconds', base: 30, level: 2, chain: 'cond', equip: [],
    muscles: { conditioning: 0.7, triceps: 0.6, glutes: 0.5, core: 0.5, shoulders: 0.4 },
    cues: ['You should feel this in your triceps and glutes.', 'Hips up, walk on hands and feet facing the ceiling.', 'Keep your hips lifted.'] },
  { id: 'shuttle_runs', name: 'Shuttle Runs', category: 'conditioning', pattern: 'run', unit: 'seconds', base: 40, level: 2, chain: 'cond', equip: [],
    muscles: { conditioning: 1.0, quads: 0.6, hamstrings: 0.5, calves: 0.5 },
    cues: ['You should feel this in your legs and lungs.', 'Run between two points, touching the floor at each end.', 'Stay low through the turns.'] },

  // ---------------------------- MOBILITY -----------------------------------
  { id: 'shoulder_circles', name: 'Shoulder Circles', category: 'mobility', pattern: 'mobility', unit: 'seconds', base: 30, level: 1, chain: 'mob', equip: [],
    muscles: { shoulders: 0.1 },
    cues: ['This should feel like a gentle loosening of the shoulders.', 'Circle your arms slowly forward then backward.', 'Stay relaxed.'] },
  { id: 'hip_openers', name: 'Hip Openers', category: 'mobility', pattern: 'mobility', unit: 'seconds', base: 40, level: 1, chain: 'mob', equip: [],
    muscles: { glutes: 0.1 },
    cues: ['This should feel like a release through your hips.', 'Open and close the hips through a comfortable range.', 'Breathe into the stretch.'] },
  { id: 'deep_squat_hold', name: 'Deep Squat Hold', category: 'mobility', pattern: 'wallsit', unit: 'seconds', base: 40, level: 1, chain: 'mob', equip: [],
    muscles: { quads: 0.1, glutes: 0.1 },
    cues: ['This should feel like an opening of the hips and ankles.', 'Sit into the deepest squat you can hold.', 'Use your elbows to gently push your knees out.'] },
  { id: 'thoracic_rotations', name: 'Thoracic Rotations', category: 'mobility', pattern: 'mobility', unit: 'reps_each', base: 8, level: 1, chain: 'mob', equip: [],
    muscles: { back: 0.1 },
    cues: ['This should feel like a release through your mid-back.', 'On all fours, reach one arm up and rotate open.', 'Follow your hand with your eyes.'] },
  { id: 'hamstring_stretch', name: 'Hamstring Stretch', category: 'mobility', pattern: 'mobility', unit: 'seconds', base: 40, level: 1, chain: 'mob', equip: [],
    muscles: { hamstrings: 0.05 },
    cues: ['This should feel like a gentle stretch behind your thighs.', 'Hinge forward with a flat back.', 'Never bounce — hold steady.'] },
  { id: 'calf_stretch', name: 'Calf Stretch', category: 'mobility', pattern: 'mobility', unit: 'seconds', base: 30, level: 1, chain: 'mob', equip: ['wall'],
    muscles: { calves: 0.05 },
    cues: ['This should feel like a stretch down your calf.', 'Press a heel back into the floor against a wall.', 'Keep the back leg straight.'] },
  { id: 'ankle_mobility', name: 'Ankle Mobility Drill', category: 'mobility', pattern: 'mobility', unit: 'reps_each', base: 10, level: 1, chain: 'mob', equip: [],
    muscles: { calves: 0.05 },
    cues: ['This should feel like a loosening of your ankles.', 'Drive your knee forward over your toes.', 'Keep your heel planted.'] },
  { id: 'dynamic_warmup', name: 'Dynamic Warm-up Flow', category: 'mobility', pattern: 'mobility', unit: 'seconds', base: 60, level: 1, chain: 'mob', equip: [],
    muscles: { shoulders: 0.05, hamstrings: 0.05, glutes: 0.05 },
    cues: ['This should leave you feeling warm and loose, not tired.', 'Flow through leg swings, lunges and arm swings.', 'Build the range gradually.'] },
];

export const exerciseById = id => EXERCISES.find(e => e.id === id);

// Progression chains, easiest -> hardest. Used by the progression UI and the
// generator to pick the right variation for the user's current level.
export const CHAINS = (() => {
  const out = {};
  for (const ex of EXERCISES) {
    if (!ex.chain) continue;
    (out[ex.chain] = out[ex.chain] || []).push(ex);
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.level - b.level);
  return out;
})();

// ---------------------------------------------------------------------------
// Logged activities (swimming, sports, cardio). Each carries:
//   xpPerMin / xpMin / xpMax: XP scaling.
//   fatigue:  load per "unit" of effort, scaled by intensity & duration.
//   metric:   optional distance metric ('swim' | 'run' | none).
// ---------------------------------------------------------------------------
export const ACTIVITY_TYPES = {
  swim: {
    name: 'Swim', icon: '🏊', metric: 'swim_m', kind: 'swim',
    intensities: {
      easy:     { label: 'Easy (recovery)',  xpPerMin: 1.2, fatigue: { shoulders: 0.2, back: 0.15 }, recovery: true },
      moderate: { label: 'Moderate',         xpPerMin: 1.8, fatigue: { shoulders: 0.5, back: 0.4, conditioning: 0.6 } },
      hard:     { label: 'Hard',             xpPerMin: 2.6, fatigue: { shoulders: 0.9, back: 0.8, conditioning: 0.9, triceps: 0.4 } },
    },
  },
  run: {
    name: 'Run', icon: '🏃', metric: 'run_km', kind: 'cardio',
    intensities: {
      easy:     { label: 'Easy jog',  xpPerMin: 1.0, fatigue: { quads: 0.3, calves: 0.4, hamstrings: 0.3, conditioning: 0.5 } },
      moderate: { label: 'Steady',    xpPerMin: 1.4, fatigue: { quads: 0.5, calves: 0.5, hamstrings: 0.5, conditioning: 0.8 } },
      hard:     { label: 'Hard',      xpPerMin: 2.0, fatigue: { quads: 0.7, calves: 0.6, hamstrings: 0.7, glutes: 0.4, conditioning: 1.0 } },
    },
  },
  walk: {
    name: 'Long Walk', icon: '🚶', metric: 'run_km', kind: 'cardio',
    intensities: {
      easy:     { label: 'Stroll',  xpPerMin: 0.4, fatigue: { calves: 0.1 }, recovery: true },
      moderate: { label: 'Brisk',   xpPerMin: 0.6, fatigue: { calves: 0.2, quads: 0.15, conditioning: 0.2 } },
    },
  },
  mobility: {
    name: 'Mobility Session', icon: '🧘', metric: null, kind: 'recovery',
    intensities: {
      easy: { label: 'Mobility / stretch', xpPerMin: 0.8, fatigue: {}, recovery: true },
    },
  },
};

// Sports — each contributes fatigue to specific groups (per spec examples).
export const SPORTS = {
  volleyball:   { name: 'Beach Volleyball', icon: '🏐', xpPerMin: 1.6, fatigue: { shoulders: 0.7, calves: 0.6, conditioning: 0.7, core: 0.3 } },
  football:     { name: 'Football',         icon: '⚽', xpPerMin: 1.5, fatigue: { quads: 0.6, hamstrings: 0.6, calves: 0.5, conditioning: 0.9 } },
  tennis:       { name: 'Tennis',           icon: '🎾', xpPerMin: 1.6, fatigue: { shoulders: 0.6, core: 0.5, quads: 0.4, conditioning: 0.7 } },
  basketball:   { name: 'Basketball',       icon: '🏀', xpPerMin: 1.6, fatigue: { quads: 0.6, calves: 0.6, conditioning: 0.9, shoulders: 0.3 } },
  surfing:      { name: 'Surfing',          icon: '🏄', xpPerMin: 1.4, fatigue: { back: 0.6, shoulders: 0.6, core: 0.5, conditioning: 0.4 } },
  paddleboard:  { name: 'Paddleboarding',   icon: '🛶', xpPerMin: 1.2, fatigue: { back: 0.5, shoulders: 0.5, core: 0.6 } },
  hiking:       { name: 'Hiking',           icon: '🥾', xpPerMin: 1.0, fatigue: { quads: 0.6, glutes: 0.5, calves: 0.6, hamstrings: 0.4, conditioning: 0.6 } },
  cycling:      { name: 'Cycling',          icon: '🚴', xpPerMin: 1.2, fatigue: { quads: 0.7, calves: 0.4, glutes: 0.4, conditioning: 0.8 } },
};

// Perceived-effort levels (RPE). Drive BOTH xp and recovery so the model is
// personalised to how hard a set actually felt — light weights done hard count.
export const EFFORT_LEVELS = [
  { id: 'easy',     label: 'Easy',    short: 'Easy', xp: 0.7,  fatigue: 0.6 },
  { id: 'moderate', label: 'Moderate', short: 'Mod', xp: 0.85, fatigue: 0.8 },
  { id: 'hard',     label: 'Hard',    short: 'Hard', xp: 1.0,  fatigue: 1.0 },
  { id: 'max',      label: 'All-out', short: 'Max', xp: 1.15, fatigue: 1.25 },
];
export const effortById = (id) => EFFORT_LEVELS.find(e => e.id === id) || EFFORT_LEVELS[2];

// ---------------------------------------------------------------------------
// Gym / weighted exercises. Logged with weight + sets x reps (or seconds for
// holds). The muscle map is how the engine "understands" what was trained.
// `unit`: 'reps' (default) | 'seconds'.
// ---------------------------------------------------------------------------
export const GYM_EXERCISES = [
  // chest
  { id: 'db_chest_press',   name: 'Dumbbell Chest Press',    muscles: { chest: 1.0, triceps: 0.6, shoulders: 0.5 } },
  { id: 'bb_bench',         name: 'Barbell Bench Press',     muscles: { chest: 1.0, triceps: 0.6, shoulders: 0.5 } },
  { id: 'incline_db_press', name: 'Incline Dumbbell Press',  muscles: { chest: 0.9, shoulders: 0.6, triceps: 0.5 } },
  { id: 'chest_fly',        name: 'Chest Fly',               muscles: { chest: 1.0, shoulders: 0.3 } },
  { id: 'cable_crossover',  name: 'Cable Crossover',         muscles: { chest: 1.0, shoulders: 0.3 } },
  { id: 'machine_chest',    name: 'Machine Chest Press',     muscles: { chest: 1.0, triceps: 0.5, shoulders: 0.4 } },
  // shoulders
  { id: 'ohp',              name: 'Overhead Press',          muscles: { shoulders: 1.0, triceps: 0.6, chest: 0.3 } },
  { id: 'db_shoulder_press',name: 'Dumbbell Shoulder Press', muscles: { shoulders: 1.0, triceps: 0.5 } },
  { id: 'lateral_raise',    name: 'Lateral Raise',           muscles: { shoulders: 1.0 } },
  { id: 'front_raise',      name: 'Front Raise',             muscles: { shoulders: 0.9 } },
  { id: 'rear_delt_fly',    name: 'Rear Delt Fly',           muscles: { shoulders: 0.8, back: 0.4 } },
  // back
  { id: 'lat_pulldown',     name: 'Lat Pulldown',            muscles: { back: 1.0, biceps: 0.6 } },
  { id: 'cable_row',        name: 'Seated Cable Row',        muscles: { back: 1.0, biceps: 0.6, shoulders: 0.3 } },
  { id: 'barbell_row',      name: 'Barbell Row',             muscles: { back: 1.0, biceps: 0.6, shoulders: 0.3 } },
  { id: 'db_row',           name: 'Dumbbell Row',            muscles: { back: 1.0, biceps: 0.6 } },
  { id: 't_bar_row',        name: 'T-Bar Row',               muscles: { back: 1.0, biceps: 0.5 } },
  { id: 'deadlift',         name: 'Deadlift',                muscles: { back: 0.8, hamstrings: 0.9, glutes: 0.9, core: 0.5, quads: 0.4 } },
  // arms
  { id: 'bicep_curl',       name: 'Dumbbell Bicep Curl',     muscles: { biceps: 1.0 } },
  { id: 'barbell_curl',     name: 'Barbell Curl',            muscles: { biceps: 1.0 } },
  { id: 'hammer_curl',      name: 'Hammer Curl',             muscles: { biceps: 1.0 } },
  { id: 'preacher_curl',    name: 'Preacher Curl',           muscles: { biceps: 1.0 } },
  { id: 'tricep_pushdown',  name: 'Tricep Pushdown',         muscles: { triceps: 1.0 } },
  { id: 'skullcrusher',     name: 'Skullcrusher',            muscles: { triceps: 1.0 } },
  { id: 'oh_tricep_ext',    name: 'Overhead Tricep Extension', muscles: { triceps: 1.0 } },
  { id: 'cgbp',             name: 'Close-Grip Bench Press',  muscles: { triceps: 0.9, chest: 0.6, shoulders: 0.4 } },
  // legs
  { id: 'back_squat',       name: 'Barbell Back Squat',      muscles: { quads: 1.0, glutes: 0.9, hamstrings: 0.5, core: 0.4, calves: 0.3 } },
  { id: 'front_squat',      name: 'Front Squat',             muscles: { quads: 1.0, glutes: 0.7, core: 0.5 } },
  { id: 'leg_press',        name: 'Leg Press',               muscles: { quads: 1.0, glutes: 0.8, hamstrings: 0.4 } },
  { id: 'leg_extension',    name: 'Leg Extension',           muscles: { quads: 1.0 } },
  { id: 'leg_curl',         name: 'Leg Curl',                muscles: { hamstrings: 1.0 } },
  { id: 'rdl',              name: 'Romanian Deadlift',       muscles: { hamstrings: 1.0, glutes: 0.9, back: 0.5 } },
  { id: 'hip_thrust',       name: 'Hip Thrust',              muscles: { glutes: 1.0, hamstrings: 0.5 } },
  { id: 'db_walking_lunge', name: 'Weighted Walking Lunge',  muscles: { quads: 0.9, glutes: 0.9, hamstrings: 0.5, calves: 0.3 } },
  { id: 'calf_raise_machine', name: 'Calf Raise (Machine)',  muscles: { calves: 1.0 } },
  // core
  { id: 'cable_crunch',     name: 'Cable Crunch',            muscles: { core: 1.0 } },
  { id: 'hanging_leg_raise',name: 'Hanging Leg Raise',       muscles: { core: 1.0 } },
  { id: 'crunches',         name: 'Crunches',                muscles: { core: 1.0 } },
  { id: 'crunch_hold',      name: 'Crunch Hold',             muscles: { core: 1.0 }, unit: 'seconds' },
  { id: 'weighted_plank',   name: 'Weighted Plank',          muscles: { core: 1.0, shoulders: 0.3 }, unit: 'seconds' },
  // compound / program staples
  { id: 'chinup_negative',  name: 'Chinup Negative',         muscles: { back: 1.0, biceps: 0.7, shoulders: 0.3, core: 0.3 } },
  { id: 'ghd_back_ext',     name: 'GHD Back Extension',      muscles: { back: 0.6, glutes: 0.7, hamstrings: 0.7, core: 0.4 } },
  { id: 'ffe_split_squat',  name: 'Front-Foot-Elevated Split Squat', muscles: { quads: 1.0, glutes: 0.8, hamstrings: 0.5, calves: 0.3, core: 0.3 } },
  { id: 'single_arm_cable_row', name: 'Single-Arm Cable Row', muscles: { back: 1.0, biceps: 0.6, shoulders: 0.3, core: 0.3 } },
];

export const gymExerciseById = id => GYM_EXERCISES.find(e => e.id === id);

// Resolve a typed string to a catalog exercise: exact match, then name-contains,
// then string-contains-name (so "did some lat pulldown" still resolves).
export const gymExerciseByName = (str) => {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  if (!s) return null;
  return GYM_EXERCISES.find(e => e.name.toLowerCase() === s)
    || GYM_EXERCISES.find(e => e.name.toLowerCase().includes(s))
    || GYM_EXERCISES.find(e => s.includes(e.name.toLowerCase()))
    || null;
};

// Built-in starter programs — shown as one-tap chips in the Gym tab. Entries
// reference a GYM_EXERCISES id; muscles/unit are resolved from the catalog at
// load time. (amount = reps, or seconds for hold-based exercises.)
export const STARTER_PROGRAMS = [
  { id: 'preset_my', name: 'My Program', exercises: [
    { ref: 'rdl',              weight: 60, sets: 4, reps: 10, effort: 'hard' },
    { ref: 'chinup_negative',  weight: 0,  sets: 4, reps: 3,  effort: 'hard' },
    { ref: 'db_chest_press',   weight: 17, sets: 3, reps: 10, effort: 'hard' },
    { ref: 'ghd_back_ext',     weight: 8,  sets: 3, reps: 12, effort: 'hard' },
    { ref: 'bicep_curl',       weight: 7,  sets: 3, reps: 10, effort: 'hard' },
    { ref: 'crunch_hold',      weight: 0,  sets: 3, seconds: 60, effort: 'hard' },
  ] },
  { id: 'preset_partner', name: "Partner's Program", exercises: [
    { ref: 'ffe_split_squat',      weight: 5,  sets: 4, reps: 10, effort: 'hard' },
    { ref: 'single_arm_cable_row', weight: 20, sets: 4, reps: 10, effort: 'hard' },
    { ref: 'ghd_back_ext',         weight: 4,  sets: 3, reps: 12, effort: 'hard' },
    { ref: 'cable_row',            weight: 25, sets: 3, reps: 12, effort: 'hard' },
    { ref: 'crunches',             weight: 0,  sets: 3, reps: 10, effort: 'hard' },
  ] },
];

// Equipment options shown in the profile editor.
export const EQUIPMENT_OPTIONS = [
  { id: 'pullup-bar', name: 'Pull-up bar' },
  { id: 'chair',      name: 'Chair / bench' },
  { id: 'wall',       name: 'Wall space' },
  { id: 'towel',      name: 'Towel' },
  { id: 'jump-rope',  name: 'Jump rope' },
  { id: 'stairs',     name: 'Stairs' },
];

export const GOAL_OPTIONS = [
  { id: 'general',     name: 'Stay active & healthy' },
  { id: 'strength',    name: 'Build strength' },
  { id: 'endurance',   name: 'Improve endurance' },
  { id: 'mobility',    name: 'Move better / mobility' },
];

export const LOCATION_OPTIONS = [
  { id: 'home',   name: 'Home' },
  { id: 'beach',  name: 'Beach' },
  { id: 'travel', name: 'Travelling' },
  { id: 'park',   name: 'Park / outdoors' },
];
