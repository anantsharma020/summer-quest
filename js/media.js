// ============================================================================
// Real exercise demonstration photos from the free-exercise-db
// (https://github.com/yuhonas/free-exercise-db) — released under the Unlicense
// (public domain), served via the jsDelivr CDN. Two frames per exercise
// (start / finish position); we cross-fade them for a looping demo.
//
// Anything without a verified slug — or any custom exercise, or an offline
// first view — falls back to the generated stick-figure animation.
// ============================================================================
import { demoSVG } from './ui-svg.js';

const IMG_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

// exercise id -> verified free-exercise-db folder slug. (All entries below were
// load-tested against the CDN.)
const EXERCISE_IMAGES = {
  // bodyweight
  pushup: 'Pushups', incline_pushup: 'Incline_Push-Up', decline_pushup: 'Decline_Push-Up',
  diamond_pushup: 'Push-Ups_-_Close_Triceps_Position', wide_pushup: 'Pushups', chair_dips: 'Bench_Dips',
  chinup: 'Chin-Up', neutral_pullup: 'Pullups', pullup: 'Pullups',
  air_squat: 'Bodyweight_Squat', tempo_squat: 'Bodyweight_Squat', jump_squat: 'Freehand_Jump_Squat',
  split_squat: 'Bodyweight_Walking_Lunge', reverse_lunge: 'Bodyweight_Walking_Lunge', walking_lunge: 'Bodyweight_Walking_Lunge',
  calf_raise: 'Standing_Calf_Raises', single_calf_raise: 'Standing_Calf_Raises',
  front_plank: 'Plank', side_plank: 'Side_Bridge', reverse_crunch: 'Reverse_Crunch',
  bicycle_crunch: 'Air_Bike', mountain_climbers: 'Mountain_Climbers', superman_hold: 'Superman',
  jump_rope: 'Rope_Jumping', broad_jumps: 'Standing_Long_Jump',
  shoulder_circles: 'Arm_Circles', calf_stretch: 'Standing_Gastrocnemius_Calf_Stretch',
  // gym (used when a gym exercise needs a thumbnail)
  db_chest_press: 'Dumbbell_Bench_Press', bb_bench: 'Barbell_Bench_Press_-_Medium_Grip',
  incline_db_press: 'Incline_Dumbbell_Press', chest_fly: 'Dumbbell_Flyes', cable_crossover: 'Cable_Crossover',
  machine_chest: 'Leverage_Chest_Press', ohp: 'Standing_Military_Press', db_shoulder_press: 'Dumbbell_Shoulder_Press',
  lateral_raise: 'Side_Lateral_Raise', front_raise: 'Front_Dumbbell_Raise', rear_delt_fly: 'Reverse_Flyes',
  lat_pulldown: 'Wide-Grip_Lat_Pulldown', cable_row: 'Seated_Cable_Rows', barbell_row: 'Bent_Over_Barbell_Row',
  db_row: 'One-Arm_Dumbbell_Row', t_bar_row: 'T-Bar_Row_with_Handle', deadlift: 'Barbell_Deadlift',
  bicep_curl: 'Dumbbell_Bicep_Curl', barbell_curl: 'Barbell_Curl', hammer_curl: 'Hammer_Curls',
  preacher_curl: 'Preacher_Curl', tricep_pushdown: 'Triceps_Pushdown', skullcrusher: 'Lying_Triceps_Press',
  oh_tricep_ext: 'Standing_Dumbbell_Triceps_Extension', cgbp: 'Close-Grip_Barbell_Bench_Press',
  back_squat: 'Barbell_Full_Squat', front_squat: 'Front_Barbell_Squat', leg_press: 'Leg_Press',
  leg_extension: 'Leg_Extensions', leg_curl: 'Lying_Leg_Curls', rdl: 'Romanian_Deadlift',
  hip_thrust: 'Barbell_Hip_Thrust', single_arm_cable_row: 'Seated_One-arm_Cable_Pulley_Rows',
  calf_raise_machine: 'Standing_Calf_Raises', cable_crunch: 'Cable_Crunch', hanging_leg_raise: 'Hanging_Leg_Raise',
  crunches: 'Crunches', crunch_hold: 'Crunches', weighted_plank: 'Plank', chinup_negative: 'Chin-Up',
};

export const hasPhoto = (id) => !!EXERCISE_IMAGES[id];

// Returns demo markup for an exercise. Photo (cross-fading start/finish frames)
// when available, with the stick-figure SVG underneath as the offline/error
// fallback; otherwise just the SVG.
export function exerciseMedia(ex) {
  const slug = ex && EXERCISE_IMAGES[ex.id];
  const svg = demoSVG(ex ? ex.pattern : 'mobility');
  if (!slug) return svg;
  const u = IMG_BASE + encodeURIComponent(slug);
  return `<div class="ex-media">${svg}<div class="ex-photo">
    <img class="frame f0" alt="${ex.name} demonstration" src="${u}/0.jpg" onerror="this.parentElement.remove()">
    <img class="frame f1" alt="" src="${u}/1.jpg" onerror="this.remove()">
  </div></div>`;
}
