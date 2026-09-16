/**
 * Advanced Exercise Detection, Form Analysis, and Repetition State Machine Engine
 * Supports: Push-ups, Squats, Sit-ups, Lunges, Jumping Jacks, Planks, High Knees, Burpees
 */

export type SupportedExerciseId = 
  | 'push-ups'
  | 'squats'
  | 'sit-ups'
  | 'lunges'
  | 'jumping-jacks'
  | 'planks'
  | 'high-knees'
  | 'burpees';

export interface ExerciseDefinition {
  id: SupportedExerciseId;
  name: string;
  category: 'Strength' | 'Endurance' | 'Cardio' | 'Full Body';
  primaryJoint: string;
  targetRange: string;
  description: string;
  instructions: string[];
  keyFormPoints: string[];
  icon: string;
  targetMuscles: string;
}

export const EXERCISE_DEFINITIONS: Record<SupportedExerciseId, ExerciseDefinition> = {
  'push-ups': {
    id: 'push-ups',
    name: 'Push-ups',
    category: 'Strength',
    primaryJoint: 'Elbows',
    targetRange: '90° - 105° depth',
    description: 'Horizontal upper body pressing exercise targeting chest, shoulders, and triceps.',
    icon: '🏋️',
    targetMuscles: 'Chest, Shoulders & Triceps',
    instructions: [
      'Assume horizontal plank position on hands and toes',
      'Lower chest until elbows reach 90°-105° flexion',
      'Push back up to full arm extension (145°+)',
      'Keep head, back, hips, and heels in a straight line'
    ],
    keyFormPoints: [
      'Do not let hips sag or pike',
      'Reach full chest depth at the bottom',
      'Extend arms fully at top of rep'
    ]
  },
  'squats': {
    id: 'squats',
    name: 'Squats',
    category: 'Strength',
    primaryJoint: 'Knees & Hips',
    targetRange: '≤ 100° knee flexion',
    description: 'Lower body compound movement targeting quadriceps, hamstrings, and glutes.',
    icon: '🦵',
    targetMuscles: 'Quadriceps, Hamstrings & Glutes',
    instructions: [
      'Stand with feet shoulder-width apart, chest upright',
      'Hinge hips and bend knees down until thighs are parallel (≤ 100°)',
      'Drive through heels and extend legs to return to full standing position (≥ 155°)',
      'Keep knees tracking inline with toes'
    ],
    keyFormPoints: [
      'Sink to full depth (thighs parallel to ground)',
      'Keep chest elevated and back straight',
      'Stand fully tall between reps'
    ]
  },
  'sit-ups': {
    id: 'sit-ups',
    name: 'Sit-ups',
    category: 'Endurance',
    primaryJoint: 'Hips & Core',
    targetRange: '≤ 100° hip flexion',
    description: 'Abdominal endurance exercise strengthening core and hip flexors.',
    icon: '🧘',
    targetMuscles: 'Abdominals & Hip Flexors',
    instructions: [
      'Lie flat on back with knees bent at 75°-115° and feet flat',
      'Engage abdominal muscles to curl torso upward toward knees (≤ 100°)',
      'Lower upper body back down until shoulder blades touch the mat (≥ 130°)'
    ],
    keyFormPoints: [
      'Do not yank or pull on neck',
      'Keep knees bent throughout the repetition',
      'Control the descent back to the mat'
    ]
  },
  'lunges': {
    id: 'lunges',
    name: 'Lunges',
    category: 'Strength',
    primaryJoint: 'Lead Knee',
    targetRange: '≤ 100° knee bend',
    description: 'Unilateral leg strength movement improving balance and hip stability.',
    icon: '🏃',
    targetMuscles: 'Quadriceps, Hamstrings & Glutes',
    instructions: [
      'Step one leg forward into a staggered stance',
      'Lower hips until front knee bends to 90°-100° and back knee nears ground',
      'Push through front heel to step back and return upright (≥ 150°)'
    ],
    keyFormPoints: [
      'Keep lead knee from drifting far past toes',
      'Maintain an upright spine',
      'Reach adequate depth on every step'
    ]
  },
  'jumping-jacks': {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    category: 'Cardio',
    primaryJoint: 'Shoulders & Legs',
    targetRange: 'Arms ≥ 140° + Stance > 1.3x',
    description: 'Full-body calisthenic movement elevating heart rate and coordination.',
    icon: '⭐',
    targetMuscles: 'Cardiovascular & Full Body',
    instructions: [
      'Start standing upright with arms at sides and feet together',
      'Jump feet outward while sweeping arms overhead (≥ 140°)',
      'Jump back to starting position with arms by sides and feet together'
    ],
    keyFormPoints: [
      'Raise hands fully above shoulders',
      'Spread feet wider than shoulder width on jump',
      'Land lightly on balls of feet'
    ]
  },
  'planks': {
    id: 'planks',
    name: 'Planks',
    category: 'Endurance',
    primaryJoint: 'Spine & Hips',
    targetRange: '165° - 195° alignment',
    description: 'Isometric core stability hold reinforcing anti-extension strength.',
    icon: '🛡️',
    targetMuscles: 'Core, Transverse Abdominis & Back',
    instructions: [
      'Hold a prone bridge on forearms/palms and toes',
      'Maintain straight body alignment from shoulders to ankles (165°-195°)',
      'Hold position continuously without sagging or piking hips'
    ],
    keyFormPoints: [
      'Keep core braced and glutes engaged',
      'Avoid dipping lower back',
      'Breathe steadily throughout the hold'
    ]
  },
  'high-knees': {
    id: 'high-knees',
    name: 'High Knees',
    category: 'Cardio',
    primaryJoint: 'Knees & Hips',
    targetRange: 'Knee at/above hip level',
    description: 'Dynamic sprinting drill emphasizing hip flexor drive and cardiovascular power.',
    icon: '⚡',
    targetMuscles: 'Hip Flexors, Calves & Quads',
    instructions: [
      'Run or march in place with high knee drive',
      'Lift each knee up to waist height (thigh parallel or higher)',
      'Maintain quick cadence and pump arms in rhythm'
    ],
    keyFormPoints: [
      'Drive knees all the way to hip height',
      'Keep chest tall, do not lean backward',
      'Maintain consistent foot speed'
    ]
  },
  'burpees': {
    id: 'burpees',
    name: 'Burpees',
    category: 'Full Body',
    primaryJoint: 'Full Body Chain',
    targetRange: '4-Phase Sequence',
    description: 'Multi-joint conditioning exercise combining squat, plank kickout, and explosive jump.',
    icon: '💥',
    targetMuscles: 'Full Body Chain & Core',
    instructions: [
      'Phase 1: Start standing upright',
      'Phase 2: Drop into squat and place hands on ground',
      'Phase 3: Kick feet back into full plank position',
      'Phase 4: Jump feet back in and explode vertically with hands overhead'
    ],
    keyFormPoints: [
      'Full kickout into straight plank',
      'Explode upward with arms overhead on final jump',
      'Fluid transitions between phases'
    ]
  }
};

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface AnalysisFeedback {
  feedback: string;
  isCorrectForm: boolean;
  formScore: number;
  activeJointAngle: number;
  activeJointName: string;
  activeJointPoint: { x: number; y: number } | null;
  targetReached: boolean;
  repIncremented: boolean;
  invalidRepIncremented: boolean;
  invalidReason?: string;
  burpeePhase?: number;
  plankDurationSec?: number;
}

export interface ExerciseStateTracker {
  stage: 'up' | 'down' | 'bottom_reached' | 'top_reached' | 'extended' | 'contracted' | 'plank_hold' | 'burpee_phase1' | 'burpee_phase2' | 'burpee_phase3' | 'burpee_phase4';
  dominantSide: 'left' | 'right';
  smoothedAngle: number;
  smoothedSecondaryAngle: number;
  smoothedAlignAngle: number;
  lastRepTimestamp: number;
  lastLeftStepTime: number;
  lastRightStepTime: number;
  leftActive: boolean;
  rightActive: boolean;
  repFrames: number;
  totalFrames: number;
  goodFrames: number;
  alignmentFaults: number;
  plankStartTime: number;
  plankActive: boolean;
  plankValidSeconds: number;
  burpeePhase: number;
  burpeePhaseTimestamp: number;
  hasPlayedDepthTone: boolean;
}

export const createInitialExerciseState = (): ExerciseStateTracker => ({
  stage: 'up',
  dominantSide: 'left',
  smoothedAngle: 180,
  smoothedSecondaryAngle: 180,
  smoothedAlignAngle: 180,
  lastRepTimestamp: 0,
  lastLeftStepTime: 0,
  lastRightStepTime: 0,
  leftActive: false,
  rightActive: false,
  repFrames: 0,
  totalFrames: 0,
  goodFrames: 0,
  alignmentFaults: 0,
  plankStartTime: 0,
  plankActive: false,
  plankValidSeconds: 0,
  burpeePhase: 1,
  burpeePhaseTimestamp: 0,
  hasPlayedDepthTone: false,
});

// Helper: Calculate 2D angle between points A, B (vertex), C in degrees
export const calculateJointAngle = (
  A: Landmark,
  B: Landmark,
  C: Landmark
): number => {
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
};

/**
 * AI Real-time Exercise Auto-Recognition Classifier
 * Analyzes landmarks to detect if the user is performing any of the 8 exercises
 */
export const classifyExerciseFromPose = (
  landmarks: Landmark[]
): { detectedExercise: SupportedExerciseId; confidence: number; reason: string } => {
  if (!landmarks || landmarks.length < 33) {
    return { detectedExercise: 'squats', confidence: 0, reason: 'Pose not fully in view' };
  }

  const nose = landmarks[0];
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lElbow = landmarks[13];
  const rElbow = landmarks[14];
  const lWrist = landmarks[15];
  const rWrist = landmarks[16];
  const lHip = landmarks[23];
  const rHip = landmarks[24];
  const lKnee = landmarks[25];
  const rKnee = landmarks[26];
  const lAnkle = landmarks[27];
  const rAnkle = landmarks[28];

  const midShoulderY = (lShoulder.y + rShoulder.y) / 2;
  const midHipY = (lHip.y + rHip.y) / 2;
  const midAnkleY = (lAnkle.y + rAnkle.y) / 2;
  const midWristY = (lWrist.y + rWrist.y) / 2;

  const midShoulderX = (lShoulder.x + rShoulder.x) / 2;
  const midHipX = (lHip.x + rHip.x) / 2;
  const midAnkleX = (lAnkle.x + rAnkle.x) / 2;

  const torsoHeight = Math.abs(midHipY - midShoulderY);
  const totalHeight = Math.abs(midAnkleY - nose.y);
  const isHorizontalBody = Math.abs(midShoulderY - midHipY) < 0.20 && Math.abs(midHipY - midAnkleY) < 0.25;

  const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x);
  const ankleWidth = Math.abs(lAnkle.x - rAnkle.x);
  const armSpan = Math.abs(lWrist.x - rWrist.x);

  const lElbowAngle = calculateJointAngle(lShoulder, lElbow, lWrist);
  const rElbowAngle = calculateJointAngle(rShoulder, rElbow, rWrist);
  const avgElbowAngle = (lElbowAngle + rElbowAngle) / 2;

  const lKneeAngle = calculateJointAngle(lHip, lKnee, lAnkle);
  const rKneeAngle = calculateJointAngle(rHip, rKnee, rAnkle);
  const avgKneeAngle = (lKneeAngle + rKneeAngle) / 2;

  const lHipAngle = calculateJointAngle(lShoulder, lHip, lKnee);
  const rHipAngle = calculateJointAngle(rShoulder, rHip, rKnee);
  const avgHipAngle = (lHipAngle + rHipAngle) / 2;

  // 1. Horizontal ground exercises: Push-ups, Planks, Sit-ups
  if (isHorizontalBody || midShoulderY > 0.55) {
    // Face-up vs Face-down (Sit-ups vs Push-ups/Plank)
    // In sit-ups, hips flex while back moves upward toward knees
    if (avgHipAngle < 125 && midWristY > midHipY - 0.15) {
      return { detectedExercise: 'sit-ups', confidence: 0.94, reason: 'Horizontal body with abdominal hip flexion' };
    }
    
    // Plank vs Push-up
    if (avgElbowAngle < 130) {
      return { detectedExercise: 'push-ups', confidence: 0.92, reason: 'Horizontal plank with active elbow flexion/push' };
    } else {
      return { detectedExercise: 'planks', confidence: 0.88, reason: 'Horizontal isometric hold with straight spine' };
    }
  }

  // 2. Standing dynamic movements
  // Jumping Jacks: Arms overhead (wrists above shoulders) & wide foot stance
  const armsOverhead = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y;
  if (armsOverhead || (ankleWidth > shoulderWidth * 1.35 && armSpan > shoulderWidth * 2.2)) {
    return { detectedExercise: 'jumping-jacks', confidence: 0.95, reason: 'Overhead arm abduction and wide stance' };
  }

  // High Knees: One knee raised significantly higher than normal standing
  const lKneeRaised = lKnee.y < lHip.y + 0.12;
  const rKneeRaised = rKnee.y < rHip.y + 0.12;
  if ((lKneeRaised || rKneeRaised) && Math.abs(lKnee.y - rKnee.y) > 0.14) {
    return { detectedExercise: 'high-knees', confidence: 0.93, reason: 'Rapid alternating high knee drive above hip plane' };
  }

  // Lunges: Staggered forward-backward foot stance with deep asymmetric knee bend
  const ankleXDiff = Math.abs(lAnkle.x - rAnkle.x);
  const kneeAsymmetry = Math.abs(lKneeAngle - rKneeAngle);
  if (kneeAsymmetry > 25 && (lKneeAngle < 120 || rKneeAngle < 120)) {
    return { detectedExercise: 'lunges', confidence: 0.90, reason: 'Staggered stance with unilateral lead knee drop' };
  }

  // Squats: Symmetric knee bend with both knees flexed below 135° and upright torso
  if (avgKneeAngle < 135 && Math.abs(lKneeAngle - rKneeAngle) < 22) {
    return { detectedExercise: 'squats', confidence: 0.96, reason: 'Bilateral symmetrical knee flexion and hip hinge' };
  }

  // Default to squats if upright standing or high-knees if neutral
  return { detectedExercise: 'squats', confidence: 0.75, reason: 'Standard standing athletic stance' };
};

/**
 * Exercise Evaluation and Repetition Counter State Machine
 */
export const evaluateExerciseMovement = (
  exerciseId: SupportedExerciseId,
  landmarks: Landmark[],
  state: ExerciseStateTracker,
  now: number
): AnalysisFeedback => {
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lElbow = landmarks[13];
  const rElbow = landmarks[14];
  const lWrist = landmarks[15];
  const rWrist = landmarks[16];
  const lHip = landmarks[23];
  const rHip = landmarks[24];
  const lKnee = landmarks[25];
  const rKnee = landmarks[26];
  const lAnkle = landmarks[27];
  const rAnkle = landmarks[28];

  // =========================================================================
  // 1. PUSH-UPS
  // =========================================================================
  if (exerciseId === 'push-ups') {
    const lVis = ((lShoulder?.visibility ?? 0) + (lElbow?.visibility ?? 0) + (lWrist?.visibility ?? 0)) / 3;
    const rVis = ((rShoulder?.visibility ?? 0) + (rElbow?.visibility ?? 0) + (rWrist?.visibility ?? 0)) / 3;

    let rawAngle = 180;
    let activePoint = lElbow;
    let activeSide: 'left' | 'right' = 'left';

    if (lVis >= 0.35 && rVis >= 0.35) {
      const lAng = calculateJointAngle(lShoulder, lElbow, lWrist);
      const rAng = calculateJointAngle(rShoulder, rElbow, rWrist);
      rawAngle = Math.min(lAng, rAng);
      activeSide = lAng <= rAng ? 'left' : 'right';
      activePoint = activeSide === 'left' ? lElbow : rElbow;
    } else if (lVis >= 0.35) {
      rawAngle = calculateJointAngle(lShoulder, lElbow, lWrist);
      activePoint = lElbow;
    } else if (rVis >= 0.35) {
      rawAngle = calculateJointAngle(rShoulder, rElbow, rWrist);
      activePoint = rElbow;
      activeSide = 'right';
    }

    state.smoothedAngle = state.smoothedAngle === 180 ? rawAngle : state.smoothedAngle * 0.55 + rawAngle * 0.45;
    const currentAngle = Math.round(state.smoothedAngle);

    // Spine alignment
    let alignAngle = 180;
    if (activeSide === 'left' && lShoulder && lHip && lAnkle) {
      alignAngle = calculateJointAngle(lShoulder, lHip, lAnkle);
    } else if (rShoulder && rHip && rAnkle) {
      alignAngle = calculateJointAngle(rShoulder, rHip, rAnkle);
    }
    state.smoothedAlignAngle = state.smoothedAlignAngle === 180 ? alignAngle : state.smoothedAlignAngle * 0.7 + alignAngle * 0.3;
    const isAligned = state.smoothedAlignAngle >= 150 && state.smoothedAlignAngle <= 210;

    state.totalFrames++;
    state.repFrames++;
    if (isAligned) state.goodFrames++;
    else state.alignmentFaults++;

    const formScore = Math.max(30, Math.round((state.goodFrames / Math.max(1, state.totalFrames)) * 100));

    let repIncremented = false;
    let invalidRepIncremented = false;
    let invalidReason: string | undefined;
    let targetReached = false;
    let feedback = 'Lower chest to 90° elbow bend';

    if (currentAngle <= 105) {
      targetReached = true;
      if (state.stage !== 'down') {
        state.stage = 'down';
        feedback = 'Target depth reached! Push back up fully!';
      }
    } else if (currentAngle >= 142) {
      if (state.stage === 'down') {
        if (now - state.lastRepTimestamp > 420) {
          state.lastRepTimestamp = now;
          state.stage = 'up';

          const faultRatio = state.repFrames > 0 ? state.alignmentFaults / state.repFrames : 0;
          if (faultRatio > 0.65) {
            invalidRepIncremented = true;
            invalidReason = 'Incomplete form: Hip sagged or arched excessively';
            feedback = 'Incomplete rep: Keep body straight.';
          } else {
            repIncremented = true;
            feedback = 'Great push-up! Rep counted!';
          }
          state.repFrames = 0;
          state.alignmentFaults = 0;
        }
      } else if (state.stage === 'up') {
        feedback = !isAligned ? 'Keep back straight, avoid hip sagging' : 'Lower chest down smoothly';
      }
    }

    return {
      feedback,
      isCorrectForm: isAligned,
      formScore,
      activeJointAngle: currentAngle,
      activeJointName: 'Elbow',
      activeJointPoint: activePoint ? { x: activePoint.x, y: activePoint.y } : null,
      targetReached,
      repIncremented,
      invalidRepIncremented,
      invalidReason
    };
  }

  // =========================================================================
  // 2. SQUATS
  // =========================================================================
  if (exerciseId === 'squats') {
    const lVis = ((lHip?.visibility ?? 0) + (lKnee?.visibility ?? 0) + (lAnkle?.visibility ?? 0)) / 3;
    const rVis = ((rHip?.visibility ?? 0) + (rKnee?.visibility ?? 0) + (rAnkle?.visibility ?? 0)) / 3;

    let rawKneeAngle = 180;
    let activeKnee = lKnee;
    let activeSide: 'left' | 'right' = 'left';

    if (lVis >= 0.35 && rVis >= 0.35) {
      const lKneeAng = calculateJointAngle(lHip, lKnee, lAnkle);
      const rKneeAng = calculateJointAngle(rHip, rKnee, rAnkle);
      rawKneeAngle = Math.min(lKneeAng, rKneeAng);
      activeSide = lKneeAng <= rKneeAng ? 'left' : 'right';
      activeKnee = activeSide === 'left' ? lKnee : rKnee;
    } else if (lVis >= 0.35) {
      rawKneeAngle = calculateJointAngle(lHip, lKnee, lAnkle);
      activeKnee = lKnee;
    } else if (rVis >= 0.35) {
      rawKneeAngle = calculateJointAngle(rHip, rKnee, rAnkle);
      activeKnee = rKnee;
      activeSide = 'right';
    }

    state.smoothedAngle = state.smoothedAngle === 180 ? rawKneeAngle : state.smoothedAngle * 0.55 + rawKneeAngle * 0.45;
    const currentKneeAngle = Math.round(state.smoothedAngle);

    // Torso inclination (Shoulder to Hip angle relative to vertical)
    const activeShoulder = activeSide === 'left' ? lShoulder : rShoulder;
    const activeHip = activeSide === 'left' ? lHip : rHip;
    let torsoAngle = 90;
    if (activeShoulder && activeHip) {
      torsoAngle = Math.abs(Math.atan2(activeHip.y - activeShoulder.y, activeHip.x - activeShoulder.x) * 180 / Math.PI);
    }
    const isChestUp = torsoAngle >= 60; // 60-90 degrees is upright

    state.totalFrames++;
    state.repFrames++;
    if (isChestUp) state.goodFrames++;
    else state.alignmentFaults++;

    const formScore = Math.max(35, Math.round((state.goodFrames / Math.max(1, state.totalFrames)) * 100));

    let repIncremented = false;
    let invalidRepIncremented = false;
    let invalidReason: string | undefined;
    let targetReached = false;
    let feedback = 'Sink hips down to 90° (thighs parallel)';

    // Squat State Machine: Depth ≤ 100°, Standing Extension ≥ 155°
    if (currentKneeAngle <= 100) {
      targetReached = true;
      if (state.stage !== 'down') {
        state.stage = 'down';
        feedback = 'Parallel depth reached! Stand up strong!';
      }
    } else if (currentKneeAngle >= 155) {
      if (state.stage === 'down') {
        if (now - state.lastRepTimestamp > 450) {
          state.lastRepTimestamp = now;
          state.stage = 'up';

          const faultRatio = state.repFrames > 0 ? state.alignmentFaults / state.repFrames : 0;
          if (faultRatio > 0.70) {
            invalidRepIncremented = true;
            invalidReason = 'Incomplete form: Excessive forward chest lean';
            feedback = 'Incomplete rep: Keep chest elevated.';
          } else {
            repIncremented = true;
            feedback = 'Excellent squat! Rep counted!';
          }
          state.repFrames = 0;
          state.alignmentFaults = 0;
        }
      } else if (state.stage === 'up') {
        feedback = !isChestUp ? 'Elevate chest and look forward' : 'Bend knees and push hips back';
      }
    }

    return {
      feedback,
      isCorrectForm: isChestUp,
      formScore,
      activeJointAngle: currentKneeAngle,
      activeJointName: 'Knee',
      activeJointPoint: activeKnee ? { x: activeKnee.x, y: activeKnee.y } : null,
      targetReached,
      repIncremented,
      invalidRepIncremented,
      invalidReason
    };
  }

  // =========================================================================
  // 3. SIT-UPS / CURL-UPS
  // =========================================================================
  if (exerciseId === 'sit-ups') {
    const lVis = ((lShoulder?.visibility ?? 0) + (lHip?.visibility ?? 0) + (lKnee?.visibility ?? 0)) / 3;
    const rVis = ((rShoulder?.visibility ?? 0) + (rHip?.visibility ?? 0) + (rKnee?.visibility ?? 0)) / 3;

    let rawHipAngle = 180;
    let rawKneeAngle = 90;
    let activeHip = lHip;
    let activeSide: 'left' | 'right' = 'left';

    if (lVis >= 0.35 && rVis >= 0.35) {
      const lHipAng = calculateJointAngle(lShoulder, lHip, lKnee);
      const rHipAng = calculateJointAngle(rShoulder, rHip, rKnee);
      rawHipAngle = Math.min(lHipAng, rHipAng);
      activeSide = lHipAng <= rHipAng ? 'left' : 'right';
      activeHip = activeSide === 'left' ? lHip : rHip;
      rawKneeAngle = activeSide === 'left' ? calculateJointAngle(lHip, lKnee, lAnkle) : calculateJointAngle(rHip, rKnee, rAnkle);
    } else if (lVis >= 0.35) {
      rawHipAngle = calculateJointAngle(lShoulder, lHip, lKnee);
      activeHip = lHip;
      rawKneeAngle = calculateJointAngle(lHip, lKnee, lAnkle);
    } else if (rVis >= 0.35) {
      rawHipAngle = calculateJointAngle(rShoulder, rHip, rKnee);
      activeHip = rHip;
      activeSide = 'right';
      rawKneeAngle = calculateJointAngle(rHip, rKnee, rAnkle);
    }

    state.smoothedAngle = state.smoothedAngle === 180 ? rawHipAngle : state.smoothedAngle * 0.55 + rawHipAngle * 0.45;
    const currentHipAngle = Math.round(state.smoothedAngle);

    const isKneeBent = rawKneeAngle >= 70 && rawKneeAngle <= 125;
    state.totalFrames++;
    state.repFrames++;
    if (isKneeBent) state.goodFrames++;
    else state.alignmentFaults++;

    const formScore = Math.max(35, Math.round((state.goodFrames / Math.max(1, state.totalFrames)) * 100));

    let repIncremented = false;
    let invalidRepIncremented = false;
    let invalidReason: string | undefined;
    let targetReached = false;
    let feedback = 'Curl torso upward toward knees';

    if (currentHipAngle <= 100) {
      targetReached = true;
      if (state.stage !== 'up') {
        state.stage = 'up';
        feedback = 'Top crunch reached! Lower upper body back to mat.';
      }
    } else if (currentHipAngle >= 130) {
      if (state.stage === 'up') {
        if (now - state.lastRepTimestamp > 420) {
          state.lastRepTimestamp = now;
          state.stage = 'down';

          const faultRatio = state.repFrames > 0 ? state.alignmentFaults / state.repFrames : 0;
          if (faultRatio > 0.70) {
            invalidRepIncremented = true;
            invalidReason = 'Incomplete form: Keep knees bent and feet planted';
            feedback = 'Incomplete rep: Maintain bent knees.';
          } else {
            repIncremented = true;
            feedback = 'Great sit-up! Rep counted!';
          }
          state.repFrames = 0;
          state.alignmentFaults = 0;
        }
      }
    }

    return {
      feedback,
      isCorrectForm: isKneeBent,
      formScore,
      activeJointAngle: currentHipAngle,
      activeJointName: 'Hip Flexion',
      activeJointPoint: activeHip ? { x: activeHip.x, y: activeHip.y } : null,
      targetReached,
      repIncremented,
      invalidRepIncremented,
      invalidReason
    };
  }

  // =========================================================================
  // 4. LUNGES
  // =========================================================================
  if (exerciseId === 'lunges') {
    const lKneeAng = calculateJointAngle(lHip, lKnee, lAnkle);
    const rKneeAng = calculateJointAngle(rHip, rKnee, rAnkle);
    const minKneeAngle = Math.min(lKneeAng, rKneeAng);
    const leadKnee = lKneeAng <= rKneeAng ? lKnee : rKnee;

    state.smoothedAngle = state.smoothedAngle === 180 ? minKneeAngle : state.smoothedAngle * 0.55 + minKneeAngle * 0.45;
    const currentAngle = Math.round(state.smoothedAngle);

    // Torso upright check
    const shoulderMidX = (lShoulder.x + rShoulder.x) / 2;
    const hipMidX = (lHip.x + rHip.x) / 2;
    const isTorsoUpright = Math.abs(shoulderMidX - hipMidX) < 0.12;

    state.totalFrames++;
    state.repFrames++;
    if (isTorsoUpright) state.goodFrames++;
    else state.alignmentFaults++;

    const formScore = Math.max(35, Math.round((state.goodFrames / Math.max(1, state.totalFrames)) * 100));

    let repIncremented = false;
    let invalidRepIncremented = false;
    let invalidReason: string | undefined;
    let targetReached = false;
    let feedback = 'Step forward and sink lead knee to 90°';

    if (currentAngle <= 100) {
      targetReached = true;
      if (state.stage !== 'down') {
        state.stage = 'down';
        feedback = 'Target lunge depth reached! Push back to standing.';
      }
    } else if (currentAngle >= 150) {
      if (state.stage === 'down') {
        if (now - state.lastRepTimestamp > 450) {
          state.lastRepTimestamp = now;
          state.stage = 'up';

          const faultRatio = state.repFrames > 0 ? state.alignmentFaults / state.repFrames : 0;
          if (faultRatio > 0.65) {
            invalidRepIncremented = true;
            invalidReason = 'Incomplete form: Torso leaned excessively';
            feedback = 'Incomplete rep: Keep torso upright.';
          } else {
            repIncremented = true;
            feedback = 'Great lunge! Rep counted!';
          }
          state.repFrames = 0;
          state.alignmentFaults = 0;
        }
      }
    }

    return {
      feedback,
      isCorrectForm: isTorsoUpright,
      formScore,
      activeJointAngle: currentAngle,
      activeJointName: 'Lead Knee',
      activeJointPoint: leadKnee ? { x: leadKnee.x, y: leadKnee.y } : null,
      targetReached,
      repIncremented,
      invalidRepIncremented,
      invalidReason
    };
  }

  // =========================================================================
  // 5. JUMPING JACKS
  // =========================================================================
  if (exerciseId === 'jumping-jacks') {
    const lShoulderAngle = calculateJointAngle(lHip, lShoulder, lWrist);
    const rShoulderAngle = calculateJointAngle(rHip, rShoulder, rWrist);
    const avgArmAngle = (lShoulderAngle + rShoulderAngle) / 2;

    const shoulderW = Math.abs(lShoulder.x - rShoulder.x);
    const ankleW = Math.abs(lAnkle.x - rAnkle.x);
    const stanceRatio = ankleW / Math.max(0.05, shoulderW);

    state.smoothedAngle = state.smoothedAngle === 180 ? avgArmAngle : state.smoothedAngle * 0.55 + avgArmAngle * 0.45;
    const currentArmAngle = Math.round(state.smoothedAngle);

    const isFullExtension = currentArmAngle >= 140 && stanceRatio >= 1.30;
    const isClosed = currentArmAngle <= 40 && stanceRatio <= 1.15;

    state.totalFrames++;
    state.repFrames++;
    if (stanceRatio > 0.8) state.goodFrames++;
    else state.alignmentFaults++;

    const formScore = Math.max(40, Math.round((state.goodFrames / Math.max(1, state.totalFrames)) * 100));

    let repIncremented = false;
    let invalidRepIncremented = false;
    let invalidReason: string | undefined;
    let targetReached = false;
    let feedback = 'Jump feet out and raise arms overhead';

    if (isFullExtension) {
      targetReached = true;
      if (state.stage !== 'extended') {
        state.stage = 'extended';
        feedback = 'Overhead peak! Jump feet back together!';
      }
    } else if (isClosed) {
      if (state.stage === 'extended') {
        if (now - state.lastRepTimestamp > 320) {
          state.lastRepTimestamp = now;
          state.stage = 'contracted';
          repIncremented = true;
          feedback = 'Jumping jack complete! Keep jumping in rhythm!';
          state.repFrames = 0;
          state.alignmentFaults = 0;
        }
      }
    }

    return {
      feedback,
      isCorrectForm: true,
      formScore,
      activeJointAngle: currentArmAngle,
      activeJointName: 'Shoulder Arm Sweep',
      activeJointPoint: lWrist ? { x: (lWrist.x + rWrist.x) / 2, y: (lWrist.y + rWrist.y) / 2 } : null,
      targetReached,
      repIncremented,
      invalidRepIncremented,
      invalidReason
    };
  }

  // =========================================================================
  // 6. PLANKS (Timed Hold & Stability)
  // =========================================================================
  if (exerciseId === 'planks') {
    const lAlign = calculateJointAngle(lShoulder, lHip, lAnkle);
    const rAlign = calculateJointAngle(rShoulder, rHip, rAnkle);
    const alignAngle = (lAlign + rAlign) / 2;

    state.smoothedAlignAngle = state.smoothedAlignAngle === 180 ? alignAngle : state.smoothedAlignAngle * 0.7 + alignAngle * 0.3;
    const currentAlign = Math.round(state.smoothedAlignAngle);
    const isPlankStraight = currentAlign >= 162 && currentAlign <= 198;

    state.totalFrames++;
    if (isPlankStraight) {
      state.goodFrames++;
      if (!state.plankActive) {
        state.plankActive = true;
        state.plankStartTime = now;
      }
    } else {
      state.alignmentFaults++;
    }

    const validDurationSec = state.plankActive ? Math.floor((now - state.plankStartTime) / 1000) : 0;
    const formScore = Math.max(30, Math.round((state.goodFrames / Math.max(1, state.totalFrames)) * 100));

    const feedback = isPlankStraight
      ? `Holding solid plank! (${validDurationSec}s elapsed)`
      : currentAlign < 162 
        ? 'Hips are sagging! Lift hips to align with shoulders.' 
        : 'Hips are piked too high! Lower hips to flat line.';

    return {
      feedback,
      isCorrectForm: isPlankStraight,
      formScore,
      activeJointAngle: currentAlign,
      activeJointName: 'Spine Alignment',
      activeJointPoint: lHip ? { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 } : null,
      targetReached: isPlankStraight,
      repIncremented: false,
      invalidRepIncremented: false,
      plankDurationSec: validDurationSec
    };
  }

  // =========================================================================
  // 7. HIGH KNEES
  // =========================================================================
  if (exerciseId === 'high-knees') {
    let stepTriggered = false;

    // Relative knee height vs hip
    const lLegSpan = lAnkle ? Math.abs(lAnkle.y - lHip.y) : 0.45;
    const rLegSpan = rAnkle ? Math.abs(rAnkle.y - rHip.y) : 0.45;

    const lLift = lHip.y + (lLegSpan * 0.38);
    const rLift = rHip.y + (rLegSpan * 0.38);

    if (lKnee && lKnee.y < lLift && !state.leftActive) {
      if (now - state.lastLeftStepTime > 190) {
        state.leftActive = true;
        state.lastLeftStepTime = now;
        stepTriggered = true;
      }
    } else if (lKnee && lKnee.y > lHip.y + (lLegSpan * 0.65)) {
      state.leftActive = false;
    }

    if (rKnee && rKnee.y < rLift && !state.rightActive) {
      if (now - state.lastRightStepTime > 190) {
        state.rightActive = true;
        state.lastRightStepTime = now;
        stepTriggered = true;
      }
    } else if (rKnee && rKnee.y > rHip.y + (rLegSpan * 0.65)) {
      state.rightActive = false;
    }

    state.totalFrames++;
    const isUpright = Math.abs(lShoulder.x - lHip.x) < 0.12;
    if (isUpright) state.goodFrames++;

    const formScore = Math.max(40, Math.round((state.goodFrames / Math.max(1, state.totalFrames)) * 100));

    return {
      feedback: stepTriggered ? 'Great high knee! Drive knees to waist level!' : 'Pump knees high and fast in place',
      isCorrectForm: isUpright,
      formScore,
      activeJointAngle: 90,
      activeJointName: 'Knee Height',
      activeJointPoint: lKnee,
      targetReached: stepTriggered,
      repIncremented: stepTriggered,
      invalidRepIncremented: false
    };
  }

  // =========================================================================
  // 8. BURPEES (Multi-Phase: Stand -> Drop -> Plank -> Jump)
  // =========================================================================
  if (exerciseId === 'burpees') {
    const isHorizontal = Math.abs(lShoulder.y - lHip.y) < 0.22 && lWrist.y > lShoulder.y - 0.1;
    const isStanding = Math.abs(lShoulder.y - lAnkle.y) > 0.55 && lWrist.y > lShoulder.y;
    const isJumping = lWrist.y < lShoulder.y; // Arms overhead at top jump

    state.totalFrames++;
    state.goodFrames++;

    let repIncremented = false;
    let feedback = 'Phase 1: Stand ready';

    if (state.burpeePhase === 1) {
      feedback = 'Phase 1: Drop into squat and place hands on floor';
      if (lWrist.y > 0.60 && lKnee.y > 0.60) {
        state.burpeePhase = 2;
        feedback = 'Phase 2: Hands down! Kick feet back into plank!';
      }
    } else if (state.burpeePhase === 2) {
      feedback = 'Phase 2: Kick legs out to full plank';
      if (isHorizontal) {
        state.burpeePhase = 3;
        feedback = 'Phase 3: Plank achieved! Jump feet back in!';
      }
    } else if (state.burpeePhase === 3) {
      feedback = 'Phase 3: Jump feet back in towards hands';
      if (lWrist.y > 0.50 && lAnkle.x > lHip.x - 0.25) {
        state.burpeePhase = 4;
        feedback = 'Phase 4: Explode upward with hands overhead!';
      }
    } else if (state.burpeePhase === 4) {
      feedback = 'Phase 4: Jump up with hands overhead!';
      if (isJumping || isStanding) {
        if (now - state.lastRepTimestamp > 800) {
          state.lastRepTimestamp = now;
          state.burpeePhase = 1;
          repIncremented = true;
          feedback = 'Full Burpee Completed! Start next rep!';
        }
      }
    }

    return {
      feedback,
      isCorrectForm: true,
      formScore: 92,
      activeJointAngle: 180,
      activeJointName: `Phase ${state.burpeePhase}`,
      activeJointPoint: lShoulder,
      targetReached: state.burpeePhase === 3 || isJumping,
      repIncremented,
      invalidRepIncremented: false,
      burpeePhase: state.burpeePhase
    };
  }

  // Fallback
  return {
    feedback: 'Follow exercise form guidelines',
    isCorrectForm: true,
    formScore: 100,
    activeJointAngle: 180,
    activeJointName: 'Body',
    activeJointPoint: null,
    targetReached: false,
    repIncremented: false,
    invalidRepIncremented: false
  };
};
