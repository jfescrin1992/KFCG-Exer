import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose, Results, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Trophy, Info, Play, Pause, Octagon, Sparkles, Check, AlertTriangle, Shield, Flame, RotateCcw, Activity, Cpu, Layers, Radio, Eye, Zap, Sliders, ChevronRight, CheckCircle2, Award } from 'lucide-react';
import { FitnessComponent, AssessmentResult, UserSession } from '../types';
import { cn } from '../utils';
import { 
  classifyExerciseFromPose, 
  evaluateExerciseMovement, 
  EXERCISE_DEFINITIONS, 
  SupportedExerciseId, 
  createInitialExerciseState, 
  ExerciseStateTracker 
} from '../utils/exerciseEngine';
import {
  PoseModelArchitecture,
  POSE_MODEL_SPECS,
  computeSpatialGraphConvolutions,
  createTemporalTransformerState,
  updateTemporalTransformer,
  classifyWithSTGCNTransformer,
  STGCNClassificationOutput,
  BiomechanicalFaultDiagnostic,
  TemporalTransformerState
} from '../utils/stgcnTransformerEngine';

// Helper function to estimate child growth percentile and correct WHO/CDC classification for minors (2-19 years)
export const estimatePercentileAndCategory = (bmi: number, age: number, gender: string, standard: string) => {
  if (standard === 'Adult' || age >= 19) {
    let label = 'Normal Weight';
    let color = 'text-green-400';
    let bg = 'bg-green-500/10 border-green-500/20 text-green-400';
    let desc = 'Within healthy reference limits for adults (19+ years).';
    
    if (bmi < 18.5) {
      label = 'Underweight';
      color = 'text-blue-400';
      bg = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      desc = 'Below the recommended range for mature adults.';
    } else if (bmi >= 30) {
      label = 'Obese';
      color = 'text-red-400';
      bg = 'bg-red-500/10 border-red-500/20 text-red-400';
      desc = 'Significantly above the recommended range for mature adults.';
    } else if (bmi >= 25) {
      label = 'Overweight';
      color = 'text-orange-400';
      bg = 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      desc = 'Slightly above the recommended range for mature adults.';
    }
    
    return { label, color, bg, desc, percentile: null };
  }
  
  // Minor logic (WHO or CDC standards based on reference percentiles)
  let medianBmi = 21.0;
  let sDev = 2.5; 
  
  if (gender.toLowerCase() === 'female') {
    medianBmi = 14.0 + (age - 2) * 0.45; 
  } else {
    medianBmi = 14.2 + (age - 2) * 0.48;
  }
  
  if (medianBmi > 22.5) medianBmi = 22.5; // Cap median for high-schoolers
  
  const zScore = (bmi - medianBmi) / sDev;
  
  const erf = (x: number) => {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return 0.5 * (1.0 + sign * y);
  };
  
  const percentile = Math.min(99, Math.max(1, Math.round(erf(zScore / Math.sqrt(2)) * 100)));
  
  let label = 'Normal Weight';
  let color = 'text-green-400';
  let bg = 'bg-green-500/10 border-green-500/20 text-green-400';
  let desc = `Within healthy reference percentile range for age ${age} and sex ${gender}.`;
  
  if (standard === 'WHO') {
    if (zScore < -2) {
      label = 'Thinness (Underweight)';
      color = 'text-blue-400';
      bg = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      desc = `Below the 3rd percentile. WHO growth standards indicate developmental thinness.`;
    } else if (zScore > 2) {
      label = 'Obese';
      color = 'text-red-400';
      bg = 'bg-red-500/10 border-red-500/20 text-red-400';
      desc = `Above the 97th percentile. WHO growth standards indicate significant excess weight.`;
    } else if (zScore > 1) {
      label = 'Overweight';
      color = 'text-orange-400';
      bg = 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      desc = `Above the 85th percentile. WHO growth standards indicate moderate excess weight.`;
    }
  } else {
    // CDC Growth Chart Standard
    if (percentile < 5) {
      label = 'Underweight';
      color = 'text-blue-400';
      bg = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      desc = `Below the 5th percentile. CDC reference charts indicate underweight status for children.`;
    } else if (percentile >= 95) {
      label = 'Obese';
      color = 'text-red-400';
      bg = 'bg-red-500/10 border-red-500/20 text-red-400';
      desc = `At or above the 95th percentile. CDC reference charts indicate clinical obesity.`;
    } else if (percentile >= 85) {
      label = 'Overweight';
      color = 'text-orange-400';
      bg = 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      desc = `Between the 85th and 95th percentile. CDC charts indicate overweight status for children.`;
    }
  }
  
  return { label, color, bg, desc, percentile };
};

interface AssessmentProps {
  component: FitnessComponent;
  session?: UserSession;
  onComplete: (result: AssessmentResult) => void;
  onCancel: () => void;
}

export const Assessment: React.FC<AssessmentProps> = ({ component, session, onComplete, onCancel }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [reps, setReps] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isWholeBodyVisible, setIsWholeBodyVisible] = useState(true);
  const [feedback, setFeedback] = useState('Position yourself...');
  const [spm, setSpm] = useState(0);
  const [consistency, setConsistency] = useState(100);
  const [starsCollected, setStarsCollected] = useState(0);
  const [invalidReps, setInvalidReps] = useState(0);
  const [alignmentScore, setAlignmentScore] = useState(100);

  const isExerciseMode = component.id === 'exercise-detection' || component.id === 'strength' || component.id === 'endurance';
  const [selectedExercise, setSelectedExercise] = useState<SupportedExerciseId | 'auto'>(
    component.id === 'strength' ? 'push-ups' : component.id === 'endurance' ? 'sit-ups' : 'auto'
  );
  const [detectedExercise, setDetectedExercise] = useState<SupportedExerciseId>('push-ups');
  const [autoConfidence, setAutoConfidence] = useState<number>(95);
  const [autoDetectionReason, setAutoDetectionReason] = useState<string>('');
  const [currentPhaseLabel, setCurrentPhaseLabel] = useState<string>('Ready');
  const [lastInvalidReason, setLastInvalidReason] = useState<string | null>(null);
  const exerciseTrackerRef = useRef<ExerciseStateTracker>(createInitialExerciseState());

  // Deep Learning Pose Model Architecture & ST-GCN Transformer States
  const [selectedPoseModel, setSelectedPoseModel] = useState<PoseModelArchitecture>('mediapipe-landmarker');
  const [showModelSpecsModal, setShowModelSpecsModal] = useState<boolean>(false);
  const [showFaultsDrawer, setShowFaultsDrawer] = useState<boolean>(false);
  const [activeFaults, setActiveFaults] = useState<BiomechanicalFaultDiagnostic[]>([]);
  const [activeJointAttention, setActiveJointAttention] = useState<string>('Torso & Kinetic Core');
  const [movementPhase, setMovementPhase] = useState<'eccentric' | 'concentric' | 'isometric' | 'transition' | 'idle'>('idle');
  const [phaseProgress, setPhaseProgress] = useState<number>(0);
  const [cadenceBPM, setCadenceBPM] = useState<number>(0);
  const [inferenceLatencyMs, setInferenceLatencyMs] = useState<number>(16);

  const temporalTransformerStateRef = useRef<TemporalTransformerState>(createTemporalTransformerState(30));
  const prevLandmarksRef = useRef<any>(null);

  // Body Composition metrics with pre-filled session values
  const [weightInput, setWeightInput] = useState(session?.weight || '60');
  const [heightInput, setHeightInput] = useState(session?.height || '170');
  const [ageInput, setAgeInput] = useState(session?.age || '16');
  const [genderInput, setGenderInput] = useState(session?.gender || 'Male');
  const [refStandard, setRefStandard] = useState('WHO'); // 'WHO' | 'CDC' | 'Adult'
  const [speedMode, setSpeedMode] = useState(false); // false = Quick React, true = Fast Feet
  const [refJumpHeightInput, setRefJumpHeightInput] = useState('');
  const [refJumpVerified, setRefJumpVerified] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'instructions' | 'thesis'>('instructions');

  const getThesisLayers = (componentId: string) => {
    switch (componentId) {
      case 'body-comp':
        return {
          layer1: "Gamified Posture Check: Aligning body axis in the camera posture box to validate straight standing posture.",
          layer2: "AI-Powered Computer Vision: Computes alignment symmetry indexing in real-time based on bilateral skeletal landmarks (shoulders, hips, knees).",
          layer3: "Physiological Validation: Computes Body Mass Index (BMI) and fits CDC (2-19 yrs), WHO (5-19 yrs) or Adult growth percentiles to prevent age-bias classifications."
        };
      case 'cardio':
        return {
          layer1: "Active Starburst Exergame: Step side-to-side to catch falling star nodes on rhythmic, audio-guided metronome beats.",
          layer2: "AI-Powered Computer Vision: Measures step cycle velocity intervals and tracking peak coordinates of lower extremities.",
          layer3: "Physiological Validation: Transposes total valid step nodes and tempo consistency to translate into standardized YMCA 3-Minute Step Test scores."
        };
      case 'strength':
        return {
          layer1: "Interactive Energy Ascent: Move up and down to push a dynamic power bar up, maintaining consistent posture.",
          layer2: "AI-Powered Computer Vision: Computes three-point joint angle vertices of the shoulder-elbow-wrist keypoints to confirm precise 90-degree arm bends.",
          layer3: "Physiological Validation: Integrates standardized physical fitness manual criteria to record push-up endurance limits accurately."
        };
      case 'endurance':
        return {
          layer1: "Interactive Arch Lift: Complete full crunches to fill up a glowing geometric progress arc with each repetition.",
          layer2: "AI-Powered Computer Vision: Measures knee-hip-shoulder angle flexion to distinguish true trunk elevations from head-tilting.",
          layer3: "Physiological Validation: Converts validated repetitions to standardized physical fitness curl-up muscular endurance scores."
        };
      case 'flexibility':
        return {
          layer1: "Stretching Reach Bar: Reach towards your toes and lock maximum displacement inside the stretch bar indicator.",
          layer2: "AI-Powered Computer Vision: Calibrates reach offset distance by measuring pixel displacement between wrist and ankle landmarks.",
          layer3: "Physiological Validation: Standardized physical fitness sit-and-reach flexibility reference metrics."
        };
      case 'agility':
        return {
          layer1: "Asteroid Dodge Exergame: Lean your torso left and right to guide your avatar through dynamic tumbling hazards.",
          layer2: "AI-Powered Computer Vision: Calculates torso center-of-gravity velocity vectors and lateral hip displacement amplitude.",
          layer3: "Physiological Validation: Translates dodge scores and velocity profiles to standardized agility shuttle-run index."
        };
      case 'balance':
        return {
          layer1: "Balance Zone Target: Lift one leg and hold your physical balance center inside a center target zone.",
          layer2: "AI-Powered Computer Vision: Monitors single-leg standing stance ankle levels, trunk sway amplitude, and COG deviation vectors.",
          layer3: "Physiological Validation: Matches Single-Leg Stance Test (SLST) duration standards for vestibular balance evaluation."
        };
      case 'coordination':
        return {
          layer1: "Target Catcher Challenge: Capture randomly spawning glowing targets with left or right hands before the time limits.",
          layer2: "AI-Powered Computer Vision: Tracks real-time wrist coordinates to identify target bounding box collisions.",
          layer3: "Physiological Validation: Records reaction frequency and hit-accuracy to yield standardized coordination assessments."
        };
      case 'power':
        return {
          layer1: "Launch Velocity Gauge: Stand steady to calibrate, drop into a deep crouch, and explode upward in vertical flight.",
          layer2: "AI-Powered Computer Vision: Calculates maximum vertical hip joint displacement offset from baseline.",
          layer3: "Physiological Validation: Translates displacement to vertical jump power; includes reference calibration inputs for tape validation."
        };
      case 'reaction':
        return {
          layer1: "Stimulus Quick-Tap & Fast-Feet: React instantly to spawning red indicators (Reaction Mode) or run in-place at peak velocity (Speed Mode).",
          layer2: "AI-Powered Computer Vision: Measures response latency to the millisecond or counts alternating ankle movement peaks.",
          layer3: "Physiological Validation: Computes average reaction time in seconds and foot speed frequency in SPM (Steps Per Minute)."
        };
      default:
        return {
          layer1: "Interactive physical game task designed to engage the student in natural athletic movements.",
          layer2: "Real-time keypoint extraction, tracking, and angle computation utilizing computer vision models.",
          layer3: "Standardized physiological reference standards mapping raw AI outputs to validated medical or educational fitness scores."
        };
    }
  };

  // Cardio star collection game states inside refs to avoid re-render cycles
  const cardioGameRef = useRef<{
    stars: { x: number; y: number; speed: number; id: number }[];
    playerX: number;
    stepTimes: number[];
    nextSpawn: number;
  }>({
    stars: [],
    playerX: 320,
    stepTimes: [],
    nextSpawn: 0,
  });

  const agilityGameRef = useRef<{
    obstacles: { x: number; y: number; speed: number; width: number; height: number; side: 'left' | 'right' | 'center' }[];
    playerX: number;
    playerY: number;
    nextSpawn: number;
    errors: number;
    successfulDodges: number;
    lastDodgeTime: number;
  }>({
    obstacles: [],
    playerX: 320,
    playerY: 400,
    nextSpawn: 0,
    errors: 0,
    successfulDodges: 0,
    lastDodgeTime: 0
  });

  const balanceGameRef = useRef<{
    balanceStartTime: number;
    totalBalanceDuration: number;
    lastTickTime: number;
    deviationSum: number;
    deviationCount: number;
    lossOfBalanceCount: number;
    isBalanced: boolean;
    onLeg: 'left' | 'right' | 'none';
  }>({
    balanceStartTime: 0,
    totalBalanceDuration: 0,
    lastTickTime: 0,
    deviationSum: 0,
    deviationCount: 0,
    lossOfBalanceCount: 0,
    isBalanced: false,
    onLeg: 'none'
  });

  const coordinationGameRef = useRef<{
    targets: { x: number; y: number; radius: number; color: string; id: number; active: boolean; spawnTime: number }[];
    successful: number;
    errors: number;
    totalSpawned: number;
    nextSpawn: number;
  }>({
    targets: [],
    successful: 0,
    errors: 0,
    totalSpawned: 0,
    nextSpawn: 0
  });

  const powerGameRef = useRef<{
    state: 'ready' | 'starting' | 'takeoff' | 'max_height' | 'landing' | 'completed';
    baselineY: number;
    lowestY: number;
    highestY: number;
    landingY: number;
    jumpHeight: number;
    powerScore: number;
    lastStateTime: number;
    referenceVerified: boolean;
    referenceVal: string;
  }>({
    state: 'ready',
    baselineY: 0,
    lowestY: 0,
    highestY: 0,
    landingY: 0,
    jumpHeight: 0,
    powerScore: 0,
    lastStateTime: 0,
    referenceVerified: false,
    referenceVal: ''
  });

  const reactionGameRef = useRef<{
    state: 'idle' | 'waiting' | 'stimulus' | 'reacted';
    stimulusTime: number;
    trialTimes: number[];
    currentTrial: number;
    nextTrialTime: number;
    targetX: number;
    targetY: number;
    targetRadius: number;
    trialsCompleted: number;
    speedSteps: number;
    lastStepTime: number;
    speedModeActive: boolean;
  }>({
    state: 'idle',
    stimulusTime: 0,
    trialTimes: [],
    currentTrial: 1,
    nextTrialTime: 0,
    targetX: 0,
    targetY: 0,
    targetRadius: 40,
    trialsCompleted: 0,
    speedSteps: 0,
    lastStepTime: 0,
    speedModeActive: false
  });
  
  // Exercise state tracking with landmark smoothing, dominant side tracking, and audio cue triggers
  const stateRef = useRef<{
    stage: 'up' | 'down' | 'bottom_reached' | 'top_reached';
    dominantSide: 'left' | 'right';
    smoothedAngle: number;
    smoothedSecondaryAngle: number;
    smoothedAlignAngle: number;
    lastRepTimestamp: number;
    leftActive: boolean;
    rightActive: boolean;
    lastLeftStepTime: number;
    lastRightStepTime: number;
    lastY: number;
    alignmentFaults: number;
    repFrames: number;
    totalFrames: number;
    goodFrames: number;
    repBannerTime: number;
    repBannerText: string;
    hasPlayedDepthTone: boolean;
  }>({ 
    stage: 'up',
    dominantSide: 'left',
    smoothedAngle: 180,
    smoothedSecondaryAngle: 180,
    smoothedAlignAngle: 180,
    lastRepTimestamp: 0,
    leftActive: false,
    rightActive: false,
    lastLeftStepTime: 0,
    lastRightStepTime: 0,
    lastY: 0,
    alignmentFaults: 0,
    repFrames: 0,
    totalFrames: 0,
    goodFrames: 0,
    repBannerTime: 0,
    repBannerText: '',
    hasPlayedDepthTone: false,
  });

  // Persistent AudioContext ref to avoid audio leak / wasm thread exhaustion
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Zero-latency browser audio tone generator for real-time repetition confirmation
  const playRepAudioCue = (type: 'depth' | 'rep' | 'step' | 'fault') => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'depth') {
        // Depth reached confirmation cue (gentle high frequency ping)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'rep') {
        // Triumphant rep counted chime (C5 -> G5 chord progression)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.07); // G5
        gain.gain.setValueAtTime(0.20, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'step') {
        // Step tempo pulse
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'fault') {
        // Low posture warning tap
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch {
      // Audio context may be restricted if user hasn't interacted yet
    }
  };

  useEffect(() => {
    reactionGameRef.current.speedModeActive = speedMode;
    // reset stats when mode switches
    setReps(0);
    setInvalidReps(0);
    setAlignmentScore(100);
    if (speedMode) {
      reactionGameRef.current.speedSteps = 0;
    } else {
      reactionGameRef.current.state = 'idle';
      reactionGameRef.current.trialTimes = [];
      reactionGameRef.current.trialsCompleted = 0;
    }
  }, [speedMode]);

  // Calculate angle between three 2D points where B is the vertex
  const calculateAngle = (
    A: { x: number; y: number }, 
    B: { x: number; y: number }, 
    C: { x: number; y: number }
  ) => {
    const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360.0 - angle;
    }
    return angle;
  };

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    pose.onResults((results: Results) => {
      if (!canvasRef.current || isPaused) return;
      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;

      const canvas = canvasRef.current;
      const video = webcamRef.current?.video;
      if (video) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      if (results.poseLandmarks) {
        // Check for whole body visibility: shoulders (11/12) and ankles (27/28)
        const landmarks = results.poseLandmarks;
        const anklesVisible = (landmarks[27].visibility ?? 0) > 0.4 && (landmarks[28].visibility ?? 0) > 0.4;
        const shouldersVisible = (landmarks[11].visibility ?? 0) > 0.4 && (landmarks[12].visibility ?? 0) > 0.4;
        setIsWholeBodyVisible(anklesVisible && shouldersVisible);
      } else {
        setIsWholeBodyVisible(false);
      }

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (results.poseLandmarks) {
        // --- REAL-TIME FACE BLUR / PRIVACY SHIELD ---
        const lm = results.poseLandmarks;
        const nose = lm[0];
        const leftShoulder = lm[11];
        const rightShoulder = lm[12];
        const leftEar = lm[7];
        const rightEar = lm[8];

        if (nose && (nose.visibility ?? 0) > 0.2) {
          const faceX = (1 - nose.x) * canvas.width;
          const faceY = nose.y * canvas.height;

          // Accurately estimate face bounds from shoulders or ears
          let faceRadius = canvas.width * 0.075;
          if (leftShoulder && rightShoulder && (leftShoulder.visibility ?? 0) > 0.2 && (rightShoulder.visibility ?? 0) > 0.2) {
            const shoulderDist = Math.hypot(
              (leftShoulder.x - rightShoulder.x) * canvas.width,
              (leftShoulder.y - rightShoulder.y) * canvas.height
            );
            faceRadius = Math.max(canvas.width * 0.05, shoulderDist * 0.42);
          } else if (leftEar && rightEar && (leftEar.visibility ?? 0) > 0.2) {
            const earDist = Math.hypot(
              (leftEar.x - rightEar.x) * canvas.width,
              (leftEar.y - rightEar.y) * canvas.height
            );
            faceRadius = Math.max(canvas.width * 0.05, earDist * 1.25);
          }

          // Clip to circular face region and render deep blur
          canvasCtx.save();
          canvasCtx.beginPath();
          canvasCtx.arc(faceX, faceY, faceRadius, 0, Math.PI * 2);
          canvasCtx.clip();

          if (video && video.readyState >= 2) {
            canvasCtx.save();
            canvasCtx.translate(canvas.width, 0);
            canvasCtx.scale(-1, 1);
            canvasCtx.filter = 'blur(24px) brightness(0.9)';
            canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvasCtx.restore();
          }

          // Frosted glass privacy gradient overlay
          const gradient = canvasCtx.createRadialGradient(faceX, faceY, 0, faceX, faceY, faceRadius);
          gradient.addColorStop(0, 'rgba(15, 23, 42, 0.78)');
          gradient.addColorStop(0.7, 'rgba(15, 23, 42, 0.88)');
          gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
          canvasCtx.fillStyle = gradient;
          canvasCtx.fill();
          canvasCtx.restore();

          // Subtle Privacy Ring
          canvasCtx.save();
          canvasCtx.beginPath();
          canvasCtx.arc(faceX, faceY, faceRadius, 0, Math.PI * 2);
          canvasCtx.strokeStyle = 'rgba(59, 130, 246, 0.55)';
          canvasCtx.lineWidth = 2;
          canvasCtx.setLineDash([4, 4]);
          canvasCtx.stroke();

          // Privacy Protection Pill Label
          const tagW = 86;
          const tagH = 18;
          const tagX = faceX - tagW / 2;
          const tagY = faceY + faceRadius + 4;
          canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          canvasCtx.beginPath();
          if (typeof canvasCtx.roundRect === 'function') {
            canvasCtx.roundRect(tagX, tagY, tagW, tagH, 9);
          } else {
            canvasCtx.rect(tagX, tagY, tagW, tagH);
          }
          canvasCtx.fill();
          canvasCtx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
          canvasCtx.lineWidth = 1;
          canvasCtx.stroke();

          canvasCtx.fillStyle = '#93c5fd';
          canvasCtx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          canvasCtx.textAlign = 'center';
          canvasCtx.textBaseline = 'middle';
          canvasCtx.fillText('🔒 PRIVACY BLUR', faceX, tagY + tagH / 2);
          canvasCtx.restore();
        }

        // Draw body skeleton (excluding facial points 0-10 for complete student anonymization)
        canvasCtx.save();
        canvasCtx.translate(canvas.width, 0);
        canvasCtx.scale(-1, 1);
        const bodyConnections = POSE_CONNECTIONS.filter(([start, end]) => start >= 11 && end >= 11);
        drawConnectors(canvasCtx, results.poseLandmarks, bodyConnections, { color: 'rgba(255,255,255,0.5)', lineWidth: 2 });
        
        const bodyLandmarks = results.poseLandmarks.map((lm, idx) => idx >= 11 ? lm : { ...lm, visibility: 0 });
        drawLandmarks(canvasCtx, bodyLandmarks, { color: '#3b82f6', lineWidth: 1, radius: 2 });
        canvasCtx.restore();

        // Draw custom Cardio Game elements on the canvas if playing Cardio Challenge
        if (component.id === 'cardio') {
          const width = canvas.width;
          const height = canvas.height;

          // Smoothly track character X based on the center of the user's hips (mirrored)
          const leftHip = results.poseLandmarks[23];
          const rightHip = results.poseLandmarks[24];
          if (leftHip && rightHip) {
            const hipX = (leftHip.x + rightHip.x) / 2;
            const targetPlayerX = (1 - hipX) * width; // Mirrored position
            cardioGameRef.current.playerX += (targetPlayerX - cardioGameRef.current.playerX) * 0.25;
          }

          const playerX = cardioGameRef.current.playerX;
          const playerY = height - 60;

          // Spawn a new star every 900ms
          const nowFrame = Date.now();
          if (nowFrame > cardioGameRef.current.nextSpawn) {
            cardioGameRef.current.stars.push({
              x: Math.random() * (width - 100) + 50,
              y: 0,
              speed: Math.random() * 2 + 3.5,
              id: Math.random(),
            });
            cardioGameRef.current.nextSpawn = nowFrame + 900;
          }

          // Draw futuristic virtual character visual catcher
          canvasCtx.save();
          canvasCtx.shadowBlur = 12;
          canvasCtx.shadowColor = '#06b6d4';
          canvasCtx.strokeStyle = '#22d3ee';
          canvasCtx.lineWidth = 4;
          
          canvasCtx.beginPath();
          canvasCtx.arc(playerX, playerY, 40, 0, Math.PI, false);
          canvasCtx.stroke();
          
          canvasCtx.shadowColor = '#3b82f6';
          canvasCtx.fillStyle = 'rgba(59, 130, 246, 0.4)';
          canvasCtx.beginPath();
          canvasCtx.arc(playerX, playerY, 18, 0, 2 * Math.PI);
          canvasCtx.fill();
          canvasCtx.strokeStyle = '#60a5fa';
          canvasCtx.lineWidth = 2.5;
          canvasCtx.stroke();
          canvasCtx.restore();

          canvasCtx.fillStyle = '#22d3ee';
          canvasCtx.font = 'bold 12px sans-serif';
          canvasCtx.textAlign = 'center';
          canvasCtx.fillText('VIRTUAL RUNNER', playerX, playerY - 50);

          // Update, draw, and handle star collisions
          const activeStars: typeof cardioGameRef.current.stars = [];
          cardioGameRef.current.stars.forEach(star => {
            star.y += star.speed;

            canvasCtx.save();
            canvasCtx.shadowBlur = 10;
            canvasCtx.shadowColor = '#eab308';
            
            const spikes = 5;
            const outerRadius = 16;
            const innerRadius = 7;
            let rot = (Math.PI / 2) * 3;
            let sx = star.x;
            let sy = star.y;
            const step = Math.PI / spikes;

            canvasCtx.beginPath();
            canvasCtx.moveTo(star.x, star.y - outerRadius);
            for (let i = 0; i < spikes; i++) {
              sx = star.x + Math.cos(rot) * outerRadius;
              sy = star.y + Math.sin(rot) * outerRadius;
              canvasCtx.lineTo(sx, sy);
              rot += step;

              sx = star.x + Math.cos(rot) * innerRadius;
              sy = star.y + Math.sin(rot) * innerRadius;
              canvasCtx.lineTo(sx, sy);
              rot += step;
            }
            canvasCtx.lineTo(star.x, star.y - outerRadius);
            canvasCtx.closePath();
            canvasCtx.fillStyle = '#f59e0b';
            canvasCtx.fill();
            canvasCtx.strokeStyle = '#ffffff';
            canvasCtx.lineWidth = 1.5;
            canvasCtx.stroke();
            canvasCtx.restore();

            // Collision check with character
            const dx = star.x - playerX;
            const dy = star.y - playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 50) {
              setStarsCollected(prev => prev + 1);
              setFeedback('Star Collected! Great timing!');
              // Collection flash animation
              canvasCtx.beginPath();
              canvasCtx.arc(playerX, playerY, 65, 0, 2 * Math.PI);
              canvasCtx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
              canvasCtx.lineWidth = 4;
              canvasCtx.stroke();
            } else if (star.y < height) {
              activeStars.push(star);
            }
          });
          cardioGameRef.current.stars = activeStars;
        }

        // ==========================================
        // ST-GCN + TEMPORAL TRANSFORMER DEEP LEARNING PIPELINE
        // MediaPipe Pose Landmarker (33 Landmarks) -> ST-GCN -> Transformer -> Exercise & Form Classification
        // ==========================================
        const now = Date.now();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // 1. Spatial Graph Convolutions across 33 keypoints
        const stgcnNodes = computeSpatialGraphConvolutions(results.poseLandmarks, prevLandmarksRef.current);
        prevLandmarksRef.current = results.poseLandmarks;

        // 2. Temporal Multi-Head Self-Attention sliding buffer (T = 30 frames)
        updateTemporalTransformer(temporalTransformerStateRef.current, results.poseLandmarks, now);

        // 3. Dual Classification: Action recognition + Biomechanical Fault Diagnostics
        const stgcnClassification = classifyWithSTGCNTransformer(
          results.poseLandmarks,
          temporalTransformerStateRef.current,
          selectedPoseModel
        );

        setActiveFaults(stgcnClassification.faultsDetected);
        setActiveJointAttention(stgcnClassification.activeJointAttention);
        setMovementPhase(stgcnClassification.movementPhase);
        setPhaseProgress(stgcnClassification.phaseProgress);
        setCadenceBPM(stgcnClassification.rhythmCadenceBPM);

        if (component.id === 'exercise-detection' || component.id === 'strength' || component.id === 'endurance') {
          // Dynamic AI auto-detection if in auto mode
          let currentActiveExercise: SupportedExerciseId = 'push-ups';
          if (selectedExercise === 'auto') {
            currentActiveExercise = stgcnClassification.predictedExercise;
            setDetectedExercise(stgcnClassification.predictedExercise);
            setAutoConfidence(Math.round(stgcnClassification.exerciseConfidence * 100));
            setAutoDetectionReason(stgcnClassification.aiModelTag);
          } else {
            currentActiveExercise = selectedExercise;
          }

          // Evaluate state machine and form posture
          const analysis = evaluateExerciseMovement(
            currentActiveExercise, 
            results.poseLandmarks, 
            exerciseTrackerRef.current, 
            now
          );

          // Blend kinematic rule form score with ST-GCN biomechanical fault score
          const blendedFormScore = Math.round(
            (analysis.formScore * 0.6) + (stgcnClassification.formScore * 0.4)
          );

          setAlignmentScore(blendedFormScore);
          setFeedback(analysis.feedback);

          // Update movement phase label with Transformer phase details
          const phaseName = stgcnClassification.movementPhase === 'eccentric'
            ? `Eccentric (Descent) ${Math.round(stgcnClassification.phaseProgress * 100)}%`
            : stgcnClassification.movementPhase === 'concentric'
            ? `Concentric (Ascent) ${Math.round(stgcnClassification.phaseProgress * 100)}%`
            : stgcnClassification.movementPhase === 'isometric'
            ? 'Isometric Hold'
            : 'Kinetic Transition';

          if (analysis.burpeePhase) {
            setCurrentPhaseLabel(`Phase ${analysis.burpeePhase}/4: ${analysis.activeJointName}`);
          } else if (analysis.targetReached) {
            setCurrentPhaseLabel('Target Depth Reached (Peak ROM)');
          } else {
            setCurrentPhaseLabel(phaseName);
          }

          // Repetition Sound & Counter Trigger
          if (analysis.repIncremented) {
            setReps(r => r + 1);
            playRepAudioCue('rep');
            const exName = EXERCISE_DEFINITIONS[currentActiveExercise]?.name.toUpperCase() || 'REP';
            stateRef.current.repBannerText = `+1 ${exName} (ST-GCN VERIFIED)`;
            stateRef.current.repBannerTime = now;
            setLastInvalidReason(null);
          } else if (analysis.invalidRepIncremented) {
            setInvalidReps(i => i + 1);
            playRepAudioCue('fault');
            const reason = analysis.invalidReason || (stgcnClassification.faultsDetected[0]?.title) || 'Incomplete repetition movement';
            setLastInvalidReason(reason);
            stateRef.current.repBannerText = `⚠️ INCOMPLETE: ${reason}`;
            stateRef.current.repBannerTime = now;
          } else if (analysis.targetReached && !exerciseTrackerRef.current.hasPlayedDepthTone) {
            playRepAudioCue('depth');
            exerciseTrackerRef.current.hasPlayedDepthTone = true;
          }

          // Custom visual posture color-coding on the canvas with ST-GCN graph styling
          const isGoodForm = analysis.isCorrectForm && stgcnClassification.faultsDetected.length === 0;
          const connectorColor = isGoodForm ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)';
          const landmarkColor = isGoodForm ? '#10b981' : '#ef4444';

          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: connectorColor, lineWidth: 3 });
          drawLandmarks(canvasCtx, results.poseLandmarks, { color: landmarkColor, lineWidth: 2, radius: 4 });

          // Draw Glowing Joint Angle HUD on active joint vertex
          if (analysis.activeJointPoint) {
            const jx = (1 - analysis.activeJointPoint.x) * canvasWidth;
            const jy = analysis.activeJointPoint.y * canvasHeight;
            const isAngleGood = analysis.targetReached || analysis.isCorrectForm;

            canvasCtx.save();
            canvasCtx.shadowBlur = 18;
            canvasCtx.shadowColor = isAngleGood ? '#10b981' : '#f59e0b';
            canvasCtx.beginPath();
            canvasCtx.arc(jx, jy, 26, 0, 2 * Math.PI);
            canvasCtx.fillStyle = isAngleGood ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)';
            canvasCtx.fill();
            canvasCtx.strokeStyle = isAngleGood ? '#10b981' : '#f59e0b';
            canvasCtx.lineWidth = 3.5;
            canvasCtx.stroke();

            canvasCtx.fillStyle = '#ffffff';
            canvasCtx.font = 'bold 13px sans-serif';
            canvasCtx.textAlign = 'center';
            canvasCtx.fillText(`${analysis.activeJointAngle}°`, jx, jy + 4);

            canvasCtx.font = 'bold 10px sans-serif';
            canvasCtx.fillStyle = isAngleGood ? '#34d399' : '#fbbf24';
            canvasCtx.fillText(analysis.targetReached ? 'DEPTH OK!' : analysis.activeJointName.toUpperCase(), jx, jy + 22);
            canvasCtx.restore();
          }
        } else if (component.id === 'cardio') { // CARDIO CHALLENGE / STEPS (Dynamic Knee Elevation + Rhythm)
          const leftKnee = results.poseLandmarks[25];
          const leftHip = results.poseLandmarks[23];
          const leftAnkle = results.poseLandmarks[27];

          const rightKnee = results.poseLandmarks[26];
          const rightHip = results.poseLandmarks[24];
          const rightAnkle = results.poseLandmarks[28];

          let stepTriggered = false;

          // Adaptive dynamic knee lift threshold relative to leg length
          if (leftKnee && leftHip && (leftKnee.visibility ?? 0) > 0.35) {
            const legSpan = leftAnkle ? Math.abs(leftAnkle.y - leftHip.y) : 0.45;
            const liftThreshold = leftHip.y + (legSpan * 0.40); // 40% up towards hip
            const returnThreshold = leftHip.y + (legSpan * 0.65);

            if (leftKnee.y < liftThreshold && !stateRef.current.leftActive) {
              if (now - stateRef.current.lastLeftStepTime > 220) {
                stateRef.current.leftActive = true;
                stateRef.current.lastLeftStepTime = now;
                stepTriggered = true;
              }
            } else if (leftKnee.y > returnThreshold) {
              stateRef.current.leftActive = false;
            }
          }

          if (rightKnee && rightHip && (rightKnee.visibility ?? 0) > 0.35) {
            const legSpan = rightAnkle ? Math.abs(rightAnkle.y - rightHip.y) : 0.45;
            const liftThreshold = rightHip.y + (legSpan * 0.40);
            const returnThreshold = rightHip.y + (legSpan * 0.65);

            if (rightKnee.y < liftThreshold && !stateRef.current.rightActive) {
              if (now - stateRef.current.lastRightStepTime > 220) {
                stateRef.current.rightActive = true;
                stateRef.current.lastRightStepTime = now;
                stepTriggered = true;
              }
            } else if (rightKnee.y > returnThreshold) {
              stateRef.current.rightActive = false;
            }
          }

          if (stepTriggered) {
            setReps(r => r + 1);
            playRepAudioCue('step');
            stateRef.current.repBannerText = '+1 STEP IDENTIFIED!';
            stateRef.current.repBannerTime = now;
            setFeedback('Great step! Rhythm locked in!');

            cardioGameRef.current.stepTimes.push(now);

            // Re-calculate live stats immediately
            const recent = cardioGameRef.current.stepTimes.filter(t => now - t < 15000);
            const calculatedSpm = Math.min(180, Math.round(recent.length * 4));
            setSpm(calculatedSpm);

            // Consistency calculation
            let calculatedConsistency = 92;
            if (recent.length >= 3) {
              const intervals: number[] = [];
              for (let i = 1; i < recent.length; i++) {
                intervals.push(recent[i] - recent[i - 1]);
              }
              const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
              const variance = intervals.reduce((acc, val) => acc + Math.pow(val - avgInterval, 2), 0) / intervals.length;
              const stdDev = Math.sqrt(variance);
              const cv = stdDev / Math.max(1, avgInterval);
              calculatedConsistency = Math.max(35, Math.min(100, Math.round(100 - (cv * 85))));
            }
            setConsistency(calculatedConsistency);

            // Magnetic attraction of nearby stars to catcher
            cardioGameRef.current.stars.forEach(star => {
              const distY = Math.abs(star.y - (canvasHeight - 60));
              if (distY < 180) {
                star.y += 30;
              }
            });
          }
        } else if (component.id === 'flexibility') { // Sit-and-Reach (normalized wrist-to-ankle proximity)
          const wrist = results.poseLandmarks[15];
          const ankle = results.poseLandmarks[27];
          const rWrist = results.poseLandmarks[16];
          const rAnkle = results.poseLandmarks[28];
          
          let minDistance = 1.0;

          if (wrist && ankle && (wrist.visibility ?? 0) > 0.4) {
            const dx = wrist.x - ankle.x;
            const dy = wrist.y - ankle.y;
            minDistance = Math.min(minDistance, Math.sqrt(dx*dx + dy*dy));
          }

          if (rWrist && rAnkle && (rWrist.visibility ?? 0) > 0.4) {
            const rDx = rWrist.x - rAnkle.x;
            const rDy = rWrist.y - rAnkle.y;
            minDistance = Math.min(minDistance, Math.sqrt(rDx*rDx + rDy*rDy));
          }

          if (minDistance < 1.0) {
            // Convert to reach metric (0 distance = ~50cm maximum reach)
            const reachCm = Math.max(0, Math.round(50 - (minDistance * 100)));
            
            setReps(prev => {
              if (reachCm > prev) {
                setFeedback('New max reach!');
                return reachCm;
              }
              return prev;
            });
          }
        } else if (component.id === 'body-comp') { // Standing Posture Verification
          const shoulderL = results.poseLandmarks[11];
          const shoulderR = results.poseLandmarks[12];
          const hipL = results.poseLandmarks[23];
          const hipR = results.poseLandmarks[24];
          
          if (shoulderL && shoulderR && hipL && hipR) {
            const shoulderDiff = Math.abs(shoulderL.y - shoulderR.y);
            const hipDiff = Math.abs(hipL.y - hipR.y);
            const isStraight = shoulderDiff < 0.025 && hipDiff < 0.025;
            
            stateRef.current.totalFrames++;
            if (isStraight) {
              stateRef.current.goodFrames++;
              setFeedback('Perfect standing posture detected. Hold stance!');
            } else {
              setFeedback('Please stand straight, level your shoulders and hips.');
            }
            
            const calculatedFormScore = Math.max(30, Math.round((stateRef.current.goodFrames / stateRef.current.totalFrames) * 100));
            setAlignmentScore(calculatedFormScore);
          }
        } else if (component.id === 'agility') { // Escape the Obstacles
          const leftHip = results.poseLandmarks[23];
          const rightHip = results.poseLandmarks[24];
          const leftShoulder = results.poseLandmarks[11];
          const rightShoulder = results.poseLandmarks[12];

          if (leftHip && rightHip && leftShoulder && rightShoulder) {
            // Track player's coordinates
            const width = canvasRef.current?.width || 640;
            const hipX = (leftHip.x + rightHip.x) / 2;
            const targetPlayerX = (1 - hipX) * width; // mirrored
            agilityGameRef.current.playerX += (targetPlayerX - agilityGameRef.current.playerX) * 0.3;

            // Depth calculation using shoulder distance relative to baseline
            const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
            if (!stateRef.current.goodFrames) {
              stateRef.current.goodFrames = 0;
              stateRef.current.totalFrames = 0;
            }
            if (!stateRef.current.lastY) {
              stateRef.current.lastY = shoulderWidth;
            } else {
              stateRef.current.lastY = stateRef.current.lastY * 0.98 + shoulderWidth * 0.02;
            }

            const baseline = stateRef.current.lastY;
            const ratio = shoulderWidth / baseline;
            
            let movementStatus: 'neutral' | 'forward' | 'backward' = 'neutral';
            if (ratio > 1.15) {
              movementStatus = 'forward';
            } else if (ratio < 0.85) {
              movementStatus = 'backward';
            }

            // Spawn dynamic obstacles
            const now = Date.now();
            if (now > agilityGameRef.current.nextSpawn) {
              const types: ('left' | 'right' | 'center' | 'forward_dodge' | 'backward_dodge')[] = 
                ['left', 'right', 'center', 'forward_dodge', 'backward_dodge'];
              const chosenType = types[Math.floor(Math.random() * types.length)];
              
              let ox = width / 2;
              let ow = 140;
              
              if (chosenType === 'left') {
                ox = width * 0.25;
              } else if (chosenType === 'right') {
                ox = width * 0.75;
              } else if (chosenType === 'center') {
                ox = width * 0.5;
                ow = 190;
              } else if (chosenType === 'forward_dodge' || chosenType === 'backward_dodge') {
                ox = width / 2;
                ow = width * 0.8;
              }

              agilityGameRef.current.obstacles.push({
                x: ox,
                y: -30,
                speed: Math.random() * 2 + 4.0,
                width: ow,
                height: 40,
                side: chosenType
              });

              stateRef.current.totalFrames++; // increment total obstacles spawned
              agilityGameRef.current.nextSpawn = now + 1700; // spawn every 1.7s
            }

            // Render player visual on the canvas (overlay)
            const height = canvasRef.current?.height || 480;
            const curPlayerX = agilityGameRef.current.playerX;
            const playerRadius = 35;
            const playerY = height - 70;

            canvasCtx.save();
            canvasCtx.shadowBlur = 15;
            canvasCtx.shadowColor = movementStatus === 'forward' ? '#a855f7' : movementStatus === 'backward' ? '#ec4899' : '#06b6d4';
            canvasCtx.strokeStyle = movementStatus === 'forward' ? '#c084fc' : movementStatus === 'backward' ? '#f472b6' : '#22d3ee';
            canvasCtx.lineWidth = 5;

            canvasCtx.beginPath();
            canvasCtx.arc(curPlayerX, playerY, playerRadius, 0, 2 * Math.PI);
            canvasCtx.stroke();

            canvasCtx.fillStyle = 'rgba(6, 182, 212, 0.25)';
            canvasCtx.beginPath();
            canvasCtx.arc(curPlayerX, playerY, playerRadius - 5, 0, 2 * Math.PI);
            canvasCtx.fill();
            canvasCtx.restore();

            // Label player position & status
            canvasCtx.fillStyle = '#ffffff';
            canvasCtx.font = 'bold 12px sans-serif';
            canvasCtx.textAlign = 'center';
            canvasCtx.fillText(`PLAYER (${movementStatus.toUpperCase()})`, curPlayerX, playerY - 55);

            // Update, draw and check collisions of active obstacles
            const activeObstacles: typeof agilityGameRef.current.obstacles = [];
            agilityGameRef.current.obstacles.forEach(obs => {
              obs.y += obs.speed;

              // Draw
              canvasCtx.save();
              canvasCtx.shadowBlur = 12;
              canvasCtx.shadowColor = '#ef4444';
              canvasCtx.fillStyle = 'rgba(239, 68, 68, 0.85)';
              canvasCtx.strokeStyle = '#ffffff';
              canvasCtx.lineWidth = 2.5;

              canvasCtx.beginPath();
              const rx = obs.x - obs.width / 2;
              const ry = obs.y - obs.height / 2;
              if (canvasCtx.roundRect) {
                canvasCtx.roundRect(rx, ry, obs.width, obs.height, 10);
              } else {
                canvasCtx.rect(rx, ry, obs.width, obs.height);
              }
              canvasCtx.fill();
              canvasCtx.stroke();
              canvasCtx.restore();

              // Overlay direction tips inside obstacles
              canvasCtx.fillStyle = '#ffffff';
              canvasCtx.font = 'bold 11px sans-serif';
              canvasCtx.textAlign = 'center';
              let tip = 'OBSTACLE';
              if (obs.side === 'left') tip = 'DODGE RIGHT \u25B6';
              if (obs.side === 'right') tip = '\u25C0 DODGE LEFT';
              if (obs.side === 'center') tip = '\u25C0 EVADE LEFT/RIGHT \u25B6';
              if (obs.side === 'forward_dodge') tip = '\u25BC STEP BACKWARD \u25BC';
              if (obs.side === 'backward_dodge') tip = '\u25B2 LEAN FORWARD \u25B2';
              canvasCtx.fillText(tip, obs.x, obs.y + 4);

              // Collision metrics
              const hasYCollision = Math.abs(obs.y - playerY) < (obs.height / 2 + playerRadius);
              let hasCrashed = false;

              if (hasYCollision) {
                if (obs.side === 'left' && curPlayerX < width * 0.45) {
                  hasCrashed = true;
                } else if (obs.side === 'right' && curPlayerX > width * 0.55) {
                  hasCrashed = true;
                } else if (obs.side === 'center' && Math.abs(curPlayerX - width / 2) < 95) {
                  hasCrashed = true;
                } else if (obs.side === 'forward_dodge' && movementStatus !== 'backward') {
                  hasCrashed = true;
                } else if (obs.side === 'backward_dodge' && movementStatus !== 'forward') {
                  hasCrashed = true;
                }
              }

              if (hasCrashed) {
                agilityGameRef.current.errors++;
                setInvalidReps(agilityGameRef.current.errors);
                setFeedback('Crash! Dodge quickly next time!');
                
                canvasCtx.fillStyle = 'rgba(239, 68, 68, 0.25)';
                canvasCtx.fillRect(0, 0, width, height);
              } else if (obs.y > height + 20) {
                agilityGameRef.current.successfulDodges++;
                setReps(agilityGameRef.current.successfulDodges);
                setFeedback('Clean dodge! Excellent agility!');
                stateRef.current.goodFrames++;
              } else {
                activeObstacles.push(obs);
              }
            });

            agilityGameRef.current.obstacles = activeObstacles;

            // Accuracy %
            const totalObs = stateRef.current.totalFrames || 1;
            const accuracy = Math.round((stateRef.current.goodFrames / totalObs) * 100);
            setAlignmentScore(Math.min(100, Math.max(0, accuracy)));
          }
        } else if (component.id === 'balance') { // Balance Master
          const leftAnkle = results.poseLandmarks[27];
          const rightAnkle = results.poseLandmarks[28];
          const leftHip = results.poseLandmarks[23];
          const rightHip = results.poseLandmarks[24];
          const nose = results.poseLandmarks[0];

          if (leftHip && rightHip && leftAnkle && rightAnkle && nose) {
            const width = canvasRef.current?.width || 640;
            const height = canvasRef.current?.height || 480;

            // Compute body center (mid hips)
            const midHipX = (leftHip.x + rightHip.x) / 2;
            const midHipY = (leftHip.y + rightHip.y) / 2;

            // Target zone: center of the canvas
            const targetX = width / 2;
            const targetY = height / 2;

            // Map body center to canvas coordinates (mirrored)
            const bodyX = (1 - midHipX) * width;
            const bodyY = midHipY * height;

            // Detect which leg is standing vs lifted
            const ankleDiffY = Math.abs(leftAnkle.y - rightAnkle.y);
            let standingLeg: 'left' | 'right' | 'none' = 'none';
            if (ankleDiffY > 0.08) { // Lifted ankle is significantly higher
              standingLeg = leftAnkle.y < rightAnkle.y ? 'right' : 'left';
            }

            // Detect trunk sway (angle of nose relative to mid-hips)
            const trunkSway = Math.abs((1 - nose.x) * width - bodyX);

            // Stability Zone: 50px radius circle in center
            const targetZoneRadius = 60;
            const deviationX = Math.abs(bodyX - targetX);
            const isInsideZone = deviationX < targetZoneRadius;

            // Balance logic timer
            const now = Date.now();
            if (standingLeg !== 'none' && isInsideZone) {
              if (!balanceGameRef.current.isBalanced) {
                balanceGameRef.current.balanceStartTime = now;
                balanceGameRef.current.isBalanced = true;
              }
              const duration = (now - balanceGameRef.current.balanceStartTime) / 1000;
              balanceGameRef.current.totalBalanceDuration = duration;
              setReps(parseFloat(duration.toFixed(1))); // Balance Time

              // Compute stability score
              balanceGameRef.current.deviationSum += deviationX;
              balanceGameRef.current.deviationCount++;
              const avgDeviation = balanceGameRef.current.deviationSum / balanceGameRef.current.deviationCount;
              const stability = Math.max(30, Math.round(100 - (avgDeviation * 0.7) - (trunkSway * 0.4)));
              setAlignmentScore(stability); // Stability Score
              setFeedback(`Balanced on ${standingLeg.toUpperCase()} leg! Hold steady!`);
            } else {
              if (balanceGameRef.current.isBalanced) {
                balanceGameRef.current.lossOfBalanceCount++;
                setInvalidReps(balanceGameRef.current.lossOfBalanceCount);
                balanceGameRef.current.isBalanced = false;
              }
              setFeedback(standingLeg === 'none' 
                ? 'Lift one foot off the ground to start balancing!' 
                : 'Return to center! Swaying too much!'
              );
            }

            // Render Target Zone
            canvasCtx.save();
            canvasCtx.strokeStyle = isInsideZone ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
            canvasCtx.lineWidth = 4;
            canvasCtx.setLineDash([5, 5]);
            canvasCtx.beginPath();
            canvasCtx.arc(targetX, targetY, targetZoneRadius, 0, 2 * Math.PI);
            canvasCtx.stroke();

            // Fill Target Zone
            canvasCtx.fillStyle = isInsideZone ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            canvasCtx.beginPath();
            canvasCtx.arc(targetX, targetY, targetZoneRadius, 0, 2 * Math.PI);
            canvasCtx.fill();
            canvasCtx.restore();

            // Render player center of gravity avatar
            canvasCtx.save();
            canvasCtx.shadowBlur = 15;
            canvasCtx.shadowColor = isInsideZone ? '#22c55e' : '#ef4444';
            canvasCtx.fillStyle = isInsideZone ? '#4ade80' : '#f87171';
            canvasCtx.beginPath();
            canvasCtx.arc(bodyX, bodyY, 15, 0, 2 * Math.PI);
            canvasCtx.fill();
            canvasCtx.strokeStyle = '#ffffff';
            canvasCtx.lineWidth = 2;
            canvasCtx.stroke();
            canvasCtx.restore();

            // Render sway indicator line from center to avatar
            canvasCtx.save();
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            canvasCtx.lineWidth = 2;
            canvasCtx.beginPath();
            canvasCtx.moveTo(targetX, targetY);
            canvasCtx.lineTo(bodyX, bodyY);
            canvasCtx.stroke();
            canvasCtx.restore();

            // Onscreen labels
            canvasCtx.fillStyle = '#ffffff';
            canvasCtx.font = 'bold 12px sans-serif';
            canvasCtx.fillText(`Standing on: ${standingLeg.toUpperCase()}`, bodyX - 40, bodyY - 25);
          }
        } else if (component.id === 'coordination') { // Target Catch
          const leftHand = results.poseLandmarks[19];
          const rightHand = results.poseLandmarks[20];

          if (leftHand && rightHand) {
            const width = canvasRef.current?.width || 640;
            const height = canvasRef.current?.height || 480;

            const lhX = (1 - leftHand.x) * width;
            const lhY = leftHand.y * height;
            const rhX = (1 - rightHand.x) * width;
            const rhY = rightHand.y * height;

            const now = Date.now();

            if (coordinationGameRef.current.targets.length === 0 && now > coordinationGameRef.current.nextSpawn) {
              const tx = Math.random() * (width - 160) + 80;
              const ty = Math.random() * (height - 180) + 90;
              coordinationGameRef.current.targets.push({
                x: tx,
                y: ty,
                radius: 45,
                color: '#3b82f6',
                id: now,
                active: true,
                spawnTime: now
              });
              coordinationGameRef.current.totalSpawned++;
            }

            const remainingTargets: typeof coordinationGameRef.current.targets = [];
            coordinationGameRef.current.targets.forEach(tgt => {
              if (!tgt.active) return;

              if (now - tgt.spawnTime > 3000) {
                coordinationGameRef.current.errors++;
                setInvalidReps(coordinationGameRef.current.errors);
                setFeedback('Target missed! Respond faster!');
                coordinationGameRef.current.nextSpawn = now + 800;
                return;
              }

              canvasCtx.save();
              canvasCtx.shadowBlur = 15;
              canvasCtx.shadowColor = tgt.color;
              canvasCtx.fillStyle = tgt.color;
              canvasCtx.beginPath();
              canvasCtx.arc(tgt.x, tgt.y, tgt.radius, 0, 2 * Math.PI);
              canvasCtx.fill();
              
              const progress = (now - tgt.spawnTime) / 3000;
              canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
              canvasCtx.lineWidth = 3;
              canvasCtx.beginPath();
              canvasCtx.arc(tgt.x, tgt.y, tgt.radius * (1 - progress), 0, 2 * Math.PI);
              canvasCtx.stroke();
              canvasCtx.restore();

              const distL = Math.hypot(lhX - tgt.x, lhY - tgt.y);
              const distR = Math.hypot(rhX - tgt.x, rhY - tgt.y);

              if (distL < tgt.radius || distR < tgt.radius) {
                coordinationGameRef.current.successful++;
                setReps(coordinationGameRef.current.successful);
                setFeedback('Target caught! Excellent eye-hand coordination!');
                coordinationGameRef.current.nextSpawn = now + 600;
              } else {
                remainingTargets.push(tgt);
              }
            });

            coordinationGameRef.current.targets = remainingTargets;

            canvasCtx.save();
            canvasCtx.fillStyle = '#f43f5e';
            canvasCtx.beginPath();
            canvasCtx.arc(lhX, lhY, 12, 0, 2 * Math.PI);
            canvasCtx.fill();

            canvasCtx.fillStyle = '#10b981';
            canvasCtx.beginPath();
            canvasCtx.arc(rhX, rhY, 12, 0, 2 * Math.PI);
            canvasCtx.fill();
            canvasCtx.restore();

            const totalTargets = coordinationGameRef.current.totalSpawned || 1;
            const accuracyVal = Math.round((coordinationGameRef.current.successful / totalTargets) * 100);
            setAlignmentScore(Math.min(100, Math.max(0, accuracyVal)));
          }
        } else if (component.id === 'power') { // Jump Power
          const leftHip = results.poseLandmarks[23];
          const rightHip = results.poseLandmarks[24];

          if (leftHip && rightHip) {
            const height = canvasRef.current?.height || 480;
            const midHipY = (leftHip.y + rightHip.y) / 2 * height;

            const now = Date.now();

            if (powerGameRef.current.state === 'ready') {
              if (powerGameRef.current.baselineY === 0) {
                powerGameRef.current.baselineY = midHipY;
              } else {
                powerGameRef.current.baselineY = powerGameRef.current.baselineY * 0.95 + midHipY * 0.05;
              }
              setFeedback('Stand steady to calibrate starting position.');
              
              if (midHipY > powerGameRef.current.baselineY + 45) {
                powerGameRef.current.state = 'starting';
                powerGameRef.current.lowestY = midHipY;
                setFeedback('Squat detected! Power up and JUMP!');
              }
            } else if (powerGameRef.current.state === 'starting') {
              if (midHipY > powerGameRef.current.lowestY) {
                powerGameRef.current.lowestY = midHipY;
              }
              if (midHipY < powerGameRef.current.baselineY - 15) {
                powerGameRef.current.state = 'takeoff';
                powerGameRef.current.highestY = midHipY;
                setFeedback('Take-off detected! Reaching max height!');
              }
            } else if (powerGameRef.current.state === 'takeoff') {
              if (midHipY < powerGameRef.current.highestY) {
                powerGameRef.current.highestY = midHipY;
              }
              if (midHipY > powerGameRef.current.baselineY - 10) {
                powerGameRef.current.state = 'landing';
                setFeedback('Landing... Maintain balance!');
              }
            } else if (powerGameRef.current.state === 'landing') {
              const jumpPixels = Math.max(0, powerGameRef.current.baselineY - powerGameRef.current.highestY);
              const jumpCm = Math.round(jumpPixels * 0.65);
              powerGameRef.current.jumpHeight = jumpCm;
              
              const score = Math.min(100, Math.round((jumpCm / 60) * 100));
              powerGameRef.current.powerScore = score;
              
              setReps(jumpCm);
              setAlignmentScore(score);
              setFeedback(`Jump Completed! Jump Height: ${jumpCm} cm. Ready for next jump!`);
              
              powerGameRef.current.state = 'completed';
              powerGameRef.current.lastStateTime = now;
            } else if (powerGameRef.current.state === 'completed') {
              if (now - powerGameRef.current.lastStateTime > 4000) {
                powerGameRef.current.state = 'ready';
                powerGameRef.current.baselineY = 0;
                powerGameRef.current.highestY = 0;
              }
            }

            const width = canvasRef.current?.width || 640;
            const baselinePx = powerGameRef.current.baselineY;
            const currentY = midHipY;
            const peakY = powerGameRef.current.highestY || currentY;

            canvasCtx.save();
            canvasCtx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
            canvasCtx.lineWidth = 3;
            canvasCtx.beginPath();
            canvasCtx.moveTo(width * 0.2, baselinePx);
            canvasCtx.lineTo(width * 0.8, baselinePx);
            canvasCtx.stroke();

            canvasCtx.strokeStyle = '#3b82f6';
            canvasCtx.lineWidth = 2.5;
            canvasCtx.beginPath();
            canvasCtx.moveTo(width * 0.3, currentY);
            canvasCtx.lineTo(width * 0.7, currentY);
            canvasCtx.stroke();

            canvasCtx.strokeStyle = '#ec4899';
            canvasCtx.lineWidth = 3.5;
            canvasCtx.setLineDash([4, 4]);
            canvasCtx.beginPath();
            canvasCtx.moveTo(width * 0.25, peakY);
            canvasCtx.lineTo(width * 0.75, peakY);
            canvasCtx.stroke();

            canvasCtx.restore();

            canvasCtx.fillStyle = '#ffffff';
            canvasCtx.font = 'bold 11px sans-serif';
            canvasCtx.fillText('BASELINE LEVEL', width * 0.2, baselinePx - 8);
            canvasCtx.fillText(`PEAK LEVEL (${powerGameRef.current.jumpHeight || 0} cm)`, width * 0.25, peakY - 8);
          }
        } else if (component.id === 'reaction') { // Reaction Time & Speed
          const leftHand = results.poseLandmarks[19];
          const rightHand = results.poseLandmarks[20];
          const leftAnkle = results.poseLandmarks[27];
          const rightAnkle = results.poseLandmarks[28];

          if (leftHand && rightHand && leftAnkle && rightAnkle) {
            const width = canvasRef.current?.width || 640;
            const height = canvasRef.current?.height || 480;

            const lhX = (1 - leftHand.x) * width;
            const lhY = leftHand.y * height;
            const rhX = (1 - rightHand.x) * width;
            const rhY = rightHand.y * height;

            const now = Date.now();

            if (reactionGameRef.current.speedModeActive) { // SPEED MODE: Fast Feet
              const stepMetric = leftAnkle.y + rightAnkle.y;
              if (!stateRef.current.lastY) {
                stateRef.current.lastY = stepMetric;
              } else {
                const diff = Math.abs(stepMetric - stateRef.current.lastY);
                if (diff > 0.045 && (now - reactionGameRef.current.lastStepTime) > 220) {
                  reactionGameRef.current.speedSteps++;
                  reactionGameRef.current.lastStepTime = now;
                  setReps(reactionGameRef.current.speedSteps);
                }
                stateRef.current.lastY = stepMetric;
              }

              const stepsCount = reactionGameRef.current.speedSteps;
              const spmVal = Math.round(stepsCount * 3);
              setAlignmentScore(Math.min(100, Math.round((stepsCount / 60) * 100)));
              setFeedback(`Fast Feet Speed: ${stepsCount} movements. Est SPM: ${spmVal}`);
              
            } else { // REACTION MODE: Quick React
              if (reactionGameRef.current.state === 'idle') {
                reactionGameRef.current.state = 'waiting';
                reactionGameRef.current.nextTrialTime = now + Math.random() * 3000 + 1500;
                setFeedback('Wait for the red trigger to appear...');
              } else if (reactionGameRef.current.state === 'waiting') {
                if (now > reactionGameRef.current.nextTrialTime) {
                  reactionGameRef.current.state = 'stimulus';
                  reactionGameRef.current.stimulusTime = now;
                  reactionGameRef.current.targetX = Math.random() * (width - 200) + 100;
                  reactionGameRef.current.targetY = Math.random() * (height - 220) + 110;
                  setFeedback('TRIGGER EXPOSED! TOUCH RED ORB IMMEDIATELY!');
                }
              } else if (reactionGameRef.current.state === 'stimulus') {
                const tx = reactionGameRef.current.targetX;
                const ty = reactionGameRef.current.targetY;
                const tr = reactionGameRef.current.targetRadius;

                canvasCtx.save();
                canvasCtx.shadowBlur = 25;
                canvasCtx.shadowColor = '#ef4444';
                canvasCtx.fillStyle = '#ef4444';
                canvasCtx.beginPath();
                canvasCtx.arc(tx, ty, tr, 0, 2 * Math.PI);
                canvasCtx.fill();
                canvasCtx.strokeStyle = '#ffffff';
                canvasCtx.lineWidth = 4;
                canvasCtx.stroke();
                canvasCtx.restore();

                const distL = Math.hypot(lhX - tx, lhY - ty);
                const distR = Math.hypot(rhX - tx, rhY - ty);

                if (distL < tr || distR < tr) {
                  const reactionMs = now - reactionGameRef.current.stimulusTime;
                  const reactionSec = reactionMs / 1000;
                  reactionGameRef.current.trialTimes.push(reactionSec);
                  
                  const avgTime = reactionGameRef.current.trialTimes.reduce((a, b) => a + b, 0) / reactionGameRef.current.trialTimes.length;
                  setReps(parseFloat(avgTime.toFixed(2)));

                  const score = Math.min(100, Math.max(30, Math.round(100 - (avgTime - 0.2) * 120)));
                  setAlignmentScore(score);

                  setFeedback(`Reacted in ${reactionSec.toFixed(2)}s! Average: ${avgTime.toFixed(2)}s`);
                  
                  reactionGameRef.current.state = 'reacted';
                  reactionGameRef.current.trialsCompleted++;
                  setInvalidReps(reactionGameRef.current.trialsCompleted);
                  reactionGameRef.current.nextTrialTime = now + 2000;
                }
              } else if (reactionGameRef.current.state === 'reacted') {
                if (now > reactionGameRef.current.nextTrialTime) {
                  reactionGameRef.current.state = 'idle';
                }
              }
            }

            canvasCtx.save();
            canvasCtx.fillStyle = '#f43f5e';
            canvasCtx.beginPath();
            canvasCtx.arc(lhX, lhY, 10, 0, 2 * Math.PI);
            canvasCtx.fill();
            canvasCtx.fillStyle = '#10b981';
            canvasCtx.beginPath();
            canvasCtx.arc(rhX, rhY, 10, 0, 2 * Math.PI);
            canvasCtx.fill();
            canvasCtx.restore();
          }
        }

        // ========================================================
        // LIVE CANVAS AI HUD: REP BANNER & TARGET CONFIRMATION
        // ========================================================
        if (stateRef.current.repBannerText && (now - stateRef.current.repBannerTime < 1500)) {
          const age = now - stateRef.current.repBannerTime;
          const opacity = Math.max(0, 1 - (age / 1500));
          const badgeY = 68 - (age / 1500) * 12;

          canvasCtx.save();
          canvasCtx.globalAlpha = opacity;
          canvasCtx.shadowBlur = 18;
          canvasCtx.shadowColor = '#10b981';

          // Rounded banner background
          const bannerW = 280;
          const bannerH = 40;
          const bannerX = (canvas.width - bannerW) / 2;

          canvasCtx.fillStyle = 'rgba(6, 78, 59, 0.88)';
          canvasCtx.beginPath();
          canvasCtx.roundRect(bannerX, badgeY, bannerW, bannerH, 12);
          canvasCtx.fill();

          canvasCtx.strokeStyle = '#34d399';
          canvasCtx.lineWidth = 2;
          canvasCtx.stroke();

          canvasCtx.fillStyle = '#ffffff';
          canvasCtx.font = 'bold 15px sans-serif';
          canvasCtx.textAlign = 'center';
          canvasCtx.textBaseline = 'middle';
          canvasCtx.fillText(stateRef.current.repBannerText, canvas.width / 2, badgeY + bannerH / 2);
          canvasCtx.restore();
        }
      }
      canvasCtx.restore();
    });

    let isRunning = true;
    let isProcessing = false;
    let animationFrameId: number | null = null;

    const runDetection = async () => {
      if (!isRunning) return;

      const video = webcamRef.current?.video;
      if (
        video && 
        video.readyState >= 2 && 
        video.videoWidth > 0 && 
        video.videoHeight > 0 && 
        !isPaused && 
        !isProcessing
      ) {
        isProcessing = true;
        try {
          await pose.send({ image: video });
        } catch (err) {
          // Catch and ignore momentary frame read errors or aborted frames during unmount
        } finally {
          isProcessing = false;
        }
      }

      if (isRunning) {
        animationFrameId = requestAnimationFrame(runDetection);
      }
    };

    runDetection();
    return () => {
      isRunning = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      try {
        pose.close();
      } catch {
        // Suppress close errors if already terminating
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [component.id, isPaused]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0 && !isPaused) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft <= 0) {
      const isCardio = component.id === 'cardio';
      const isStrength = component.id === 'strength';
      const isEndurance = component.id === 'endurance';
      const isBodyComp = component.id === 'body-comp';
      const isAgility = component.id === 'agility';
      const isBalance = component.id === 'balance';
      const isCoordination = component.id === 'coordination';
      const isPower = component.id === 'power';
      const isReaction = component.id === 'reaction';
      
      const cardioScore = isCardio ? Math.min(100, Math.round((consistency * 0.4) + (Math.min(100, reps * 4) * 0.6))) : 0;
      const strengthScore = isStrength ? Math.min(100, Math.round((reps * 6) + (alignmentScore * 0.4))) : 0;
      const enduranceScore = isEndurance ? Math.min(100, Math.round((reps * 4) + (alignmentScore * 0.4))) : 0;
      const agilityScore = isAgility ? Math.min(100, Math.round((reps * 5) + (alignmentScore * 0.5))) : 0;
      const balanceScore = isBalance ? Math.min(100, Math.round((alignmentScore * 0.7) + (Math.min(100, reps * 3.3) * 0.3))) : 0;
      const coordinationScore = isCoordination ? Math.min(100, Math.round((alignmentScore * 0.8) + (reps * 1.2))) : 0;
      const powerScore = isPower ? alignmentScore : 0;
      const reactionScore = isReaction ? alignmentScore : 0;

      const h = parseFloat(heightInput) / 100;
      const w = parseFloat(weightInput);
      let bmiVal = '--';
      if (h > 0 && w > 0) {
        bmiVal = (w / (h * h)).toFixed(1);
      }

      onComplete({
        componentId: component.id,
        rawResult: isCardio 
          ? `${starsCollected} stars caught (${reps} steps, ${spm} SPM, ${consistency}% rhythm)`
          : isStrength
            ? `${reps} reps (${invalidReps} invalid reps, ${alignmentScore}% form)`
            : isEndurance
              ? `${reps} reps (${invalidReps} invalid reps, ${alignmentScore}% form)`
              : isBodyComp
                ? `${bmiVal} kg/m²`
                : isAgility
                  ? `${reps} dodged (${invalidReps} crashes, ${alignmentScore}% accuracy)`
                  : isBalance
                    ? `${reps}s standing (${invalidReps} drops, ${alignmentScore}% stability)`
                    : isCoordination
                      ? `${reps} caught (${invalidReps} missed, ${alignmentScore}% accuracy)`
                      : isPower
                        ? `${reps} cm jump (power: ${alignmentScore}/100)`
                        : isReaction
                          ? (reactionGameRef.current.speedModeActive 
                            ? `${reps} steps (frequency: ${Math.round(reps * 3)} SPM)`
                            : `${reps}s avg reaction (${invalidReps} trials)`)
                          : reps,
        score: isCardio 
          ? cardioScore 
          : isStrength
            ? strengthScore
            : isEndurance
              ? enduranceScore
              : isBodyComp
                ? alignmentScore
                : isAgility
                  ? agilityScore
                  : isBalance
                    ? balanceScore
                    : isCoordination
                      ? coordinationScore
                      : isPower
                        ? powerScore
                        : isReaction
                          ? reactionScore
                          : (component.id === 'flexibility' ? Math.min(100, reps * 2) : Math.min(100, reps * 4)),
        validReps: isBodyComp ? parseFloat(weightInput) : isCardio ? starsCollected : reps,
        invalidReps: isBodyComp ? parseFloat(heightInput) : (isStrength || isEndurance || isAgility || isBalance || isCoordination || isReaction) ? invalidReps : 0,
        unit: isBodyComp 
          ? 'kg/m²' 
          : isAgility 
            ? 'dodges' 
            : isCardio
              ? 'stars'
              : isBalance 
                ? 'seconds' 
                : isCoordination 
                  ? 'targets' 
                  : isPower 
                    ? 'cm' 
                    : isReaction 
                      ? (reactionGameRef.current.speedModeActive ? 'steps' : 'seconds')
                      : component.id === 'flexibility' 
                        ? 'cm' 
                        : (component.id === 'strength' || component.id === 'endurance' ? 'reps' : 'steps'),
        frequency: isCardio ? spm : isBodyComp ? parseInt(ageInput) : undefined,
        consistency: isCardio ? consistency : isBodyComp ? (refStandard === 'WHO' ? 1 : refStandard === 'CDC' ? 2 : 3) : (isStrength || isEndurance || isAgility || isBalance || isCoordination || isPower || isReaction) ? alignmentScore : undefined,
        duration: 30
      });
    }
    return () => clearInterval(timer);
  }, [timeLeft, isPaused, component.id, reps, spm, consistency, starsCollected, invalidReps, alignmentScore, onComplete, weightInput, heightInput, ageInput, refStandard]);

  const handleBodyCompSubmit = () => {
    const h = parseFloat(heightInput) / 100;
    const w = parseFloat(weightInput);
    let bmiVal = '--';
    if (h > 0 && w > 0) {
      bmiVal = (w / (h * h)).toFixed(1);
    }
    
    onComplete({
      componentId: 'body-comp',
      rawResult: `${bmiVal} kg/m²`,
      score: alignmentScore,
      unit: 'kg/m²',
      validReps: parseFloat(weightInput),
      invalidReps: parseFloat(heightInput),
      frequency: parseInt(ageInput),
      consistency: refStandard === 'WHO' ? 1 : refStandard === 'CDC' ? 2 : 3,
      duration: 30
    });
  };

  const bmiValNumeric = parseFloat(weightInput) / Math.pow(parseFloat(heightInput) / 100, 2);
  const ageNum = parseInt(ageInput) || 16;
  const genderStr = genderInput || 'Male';
  const studyInterpretation = estimatePercentileAndCategory(
    isNaN(bmiValNumeric) ? 21.0 : bmiValNumeric, 
    ageNum, 
    genderStr, 
    refStandard
  );
  
  const inlineBMI = isNaN(bmiValNumeric) ? '--' : bmiValNumeric.toFixed(1);

  return (
    <div className="fixed inset-0 bg-neutral-950 z-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Info */}
      <div className="w-full md:w-80 lg:w-96 bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 p-4 sm:p-6 flex flex-col overflow-y-auto max-h-[45vh] md:max-h-none md:h-full shrink-0 z-10 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        <div className="flex flex-col gap-3 mb-6 shrink-0">
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className={cn(
              "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg",
              isPaused 
                ? "bg-green-600 hover:bg-green-700 text-white shadow-green-900/50" 
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-900/50"
            )}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />} 
            {isPaused ? 'RESUME ACTIVITY' : 'PAUSE ACTIVITY'}
          </button>
          <button 
            onClick={onCancel} 
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/50"
          >
            <Octagon size={20} /> STOP EXERCISE
          </button>
        </div>

        <div className="space-y-6 flex-grow">
          <div>
            <span className="text-blue-500 text-xs font-bold uppercase tracking-widest">{component.category}</span>
            <h2 className="text-2xl font-bold text-white mt-1">{component.gameTitle}</h2>
          </div>

          <div className="bg-neutral-800/50 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-sm">Time Left</span>
              <div className="flex items-center gap-2 text-orange-400 font-bold">
                <Timer size={18} /> {timeLeft}s
              </div>
            </div>

            {component.id === 'cardio' ? (
              <>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Stars Caught</span>
                  <div className="flex items-center gap-2 text-yellow-400 font-bold text-xl">
                    <Trophy size={18} /> {starsCollected}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Frequency</span>
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    {spm} SPM
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Consistency</span>
                  <div className={cn(
                    "font-bold",
                    consistency > 75 ? "text-green-400" : "text-yellow-400"
                  )}>
                    {consistency}%
                  </div>
                </div>
              </>
            ) : isExerciseMode ? (
              <>
                <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Exercise Mode</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {selectedExercise === 'auto' ? 'AI Auto' : 'Manual'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{EXERCISE_DEFINITIONS[selectedExercise === 'auto' ? detectedExercise : selectedExercise]?.icon || '🏋️'}</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {EXERCISE_DEFINITIONS[selectedExercise === 'auto' ? detectedExercise : selectedExercise]?.name || 'Exercise'}
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        {selectedExercise === 'auto' 
                          ? `Match: ${autoConfidence}% confidence`
                          : EXERCISE_DEFINITIONS[selectedExercise]?.targetMuscles}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Valid Repetitions</span>
                  <div className="flex items-center gap-2 text-green-400 font-bold text-2xl">
                    <Trophy size={18} /> {reps}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Incomplete / Faults</span>
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xl">
                    <AlertTriangle size={16} /> {invalidReps}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Posture & Form Score</span>
                  <div className={cn(
                    "font-bold text-lg px-2.5 py-0.5 rounded-lg",
                    alignmentScore >= 80 ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                    alignmentScore >= 60 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                    "bg-red-500/20 text-red-400 border border-red-500/30"
                  )}>
                    {alignmentScore}%
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Movement Phase</span>
                  <span className="text-cyan-400 font-semibold text-xs text-right max-w-[150px] truncate">
                    {currentPhaseLabel}
                  </span>
                </div>

                {/* ST-GCN + Temporal Transformer Live Telemetry */}
                <div className="border-t border-neutral-800 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-indigo-400" />
                      Spatial Attention
                    </span>
                    <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 truncate max-w-[130px]">
                      {activeJointAttention}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={13} className="text-emerald-400" />
                      Rhythm Cadence
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {cadenceBPM > 0 ? `${cadenceBPM} BPM` : 'Pacing...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu size={13} className="text-blue-400" />
                      Pose Pipeline
                    </span>
                    <button
                      onClick={() => setShowModelSpecsModal(true)}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-0.5"
                    >
                      {POSE_MODEL_SPECS[selectedPoseModel]?.name.split(' ')[0]} 33-3D
                    </button>
                  </div>
                </div>

                {/* Biomechanical Faults Alert in Sidebar */}
                {activeFaults.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-red-400">
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={13} />
                        Biomechanical Fault
                      </span>
                      <span className="text-[10px] bg-red-500/20 px-1.5 py-0.2 rounded font-black">
                        {activeFaults[0].severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">
                      {activeFaults[0].title}
                    </div>
                    <div className="text-[11px] text-neutral-300 leading-tight">
                      👉 {activeFaults[0].coachingCue}
                    </div>
                  </div>
                )}

                {lastInvalidReason && activeFaults.length === 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                    <span>{lastInvalidReason}</span>
                  </div>
                )}
              </>
            ) : component.id === 'body-comp' ? (
              <>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Target BMI Std</span>
                  <span className="text-blue-400 font-bold">{refStandard} Standard</span>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Posture Score</span>
                  <div className={cn(
                    "font-bold text-lg",
                    alignmentScore > 75 ? "text-green-400" : "text-yellow-400"
                  )}>
                    {alignmentScore}%
                  </div>
                </div>
              </>
            ) : component.id === 'agility' ? (
              <>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Successful Dodges</span>
                  <div className="flex items-center gap-2 text-green-400 font-bold text-xl">
                    <Trophy size={18} /> {reps}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Obstacle Crashes</span>
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xl">
                    {invalidReps}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Dodge Accuracy</span>
                  <div className={cn(
                    "font-bold text-lg",
                    alignmentScore > 75 ? "text-green-400" : "text-yellow-400"
                  )}>
                    {alignmentScore}%
                  </div>
                </div>
              </>
            ) : component.id === 'balance' ? (
              <>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Balance Time</span>
                  <div className="flex items-center gap-2 text-green-400 font-bold text-xl">
                    <Trophy size={18} /> {reps}s
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Balance Losses</span>
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xl">
                    {invalidReps}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Stability Score</span>
                  <div className={cn(
                    "font-bold text-lg",
                    alignmentScore > 75 ? "text-green-400" : "text-yellow-400"
                  )}>
                    {alignmentScore}%
                  </div>
                </div>
              </>
            ) : component.id === 'coordination' ? (
              <>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Targets Caught</span>
                  <div className="flex items-center gap-2 text-green-400 font-bold text-xl">
                    <Trophy size={18} /> {reps}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Targets Missed</span>
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xl">
                    {invalidReps}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Catch Accuracy</span>
                  <div className={cn(
                    "font-bold text-lg",
                    alignmentScore > 75 ? "text-green-400" : "text-yellow-400"
                  )}>
                    {alignmentScore}%
                  </div>
                </div>
              </>
            ) : component.id === 'power' ? (
              <>
                <div className="flex flex-col gap-1 border-t border-neutral-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-sm">Est. Jump Height</span>
                    <div className="flex items-center gap-2 text-pink-500 font-bold text-xl">
                      <Trophy size={18} /> {reps} cm
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 italic mt-1 leading-relaxed">
                    Camera estimate based on hip displacement vertex.
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Power Score</span>
                  <div className={cn(
                    "font-bold text-lg",
                    alignmentScore > 75 ? "text-green-400" : "text-yellow-400"
                  )}>
                    {alignmentScore}/100
                  </div>
                </div>
                <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Validation Standard</span>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Validate camera estimate against professional physical reference methods (e.g. tape or wall jump).
                  </p>
                  <div className="flex gap-2 mt-1">
                    <input 
                      type="number"
                      placeholder="Verified cm"
                      value={refJumpHeightInput}
                      onChange={(e) => {
                        setRefJumpHeightInput(e.target.value);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        const val = parseInt(refJumpHeightInput);
                        if (!isNaN(val) && val > 0) {
                          setReps(val);
                          setRefJumpVerified(true);
                          setFeedback(`Validated against reference method: Set to ${val} cm.`);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                        refJumpVerified 
                          ? "bg-green-600/20 border border-green-500/30 text-green-400" 
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      )}
                    >
                      {refJumpVerified ? 'Verified' : 'Verify'}
                    </button>
                  </div>
                </div>
              </>
            ) : component.id === 'reaction' ? (
              <>
                <div className="flex flex-col gap-2 border-t border-neutral-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-xs uppercase tracking-wider">Active Mode</span>
                    <button
                      onClick={() => setSpeedMode(!speedMode)}
                      className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-[10px] font-bold text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-colors"
                    >
                      SWITCH TO {speedMode ? 'REACTION' : 'SPEED'}
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {speedMode ? 'Fast Feet Speed Challenge' : 'Quick React Trials'}
                  </h4>
                </div>

                {speedMode ? (
                  <>
                    <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                      <span className="text-neutral-400 text-sm">Steps Completed</span>
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xl">
                        <Trophy size={18} /> {reps}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                      <span className="text-neutral-400 text-sm">Est. Frequency</span>
                      <div className="text-cyan-400 font-bold">
                        {Math.round(reps * 3)} SPM
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                      <span className="text-neutral-400 text-sm">Avg Reaction</span>
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xl">
                        <Trophy size={18} /> {reps}s
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                      <span className="text-neutral-400 text-sm">Trials Logged</span>
                      <div className="text-rose-400 font-bold">
                        {invalidReps} trials
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-400 text-sm">Performance Score</span>
                  <div className={cn(
                    "font-bold text-lg",
                    alignmentScore > 75 ? "text-green-400" : "text-yellow-400"
                  )}>
                    {alignmentScore}%
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                <span className="text-neutral-400 text-sm">
                  {component.id === 'flexibility' ? 'Max Reach' : 'Valid Reps'}
                </span>
                <div className="flex items-center gap-2 text-green-400 font-bold text-xl">
                  <Trophy size={18} /> {reps}{component.id === 'flexibility' ? 'cm' : ''}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Tab Selector */}
          <div className="flex border-b border-neutral-800 pb-2">
            <button
              onClick={() => setSidebarTab('instructions')}
              className={cn(
                "flex-1 text-center pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
                sidebarTab === 'instructions'
                  ? "border-blue-500 text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              )}
            >
              How to Play
            </button>
            <button
              onClick={() => setSidebarTab('thesis')}
              className={cn(
                "flex-1 text-center pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
                sidebarTab === 'thesis'
                  ? "border-cyan-500 text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              )}
            >
              Thesis Framework
            </button>
          </div>

          <AnimatePresence mode="wait">
            {sidebarTab === 'instructions' ? (
              <motion.div
                key="instructions"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-neutral-300 font-semibold text-sm">
                  <Info size={16} /> Guidelines
                </div>
                <ul className="space-y-2">
                  {component.instructions.map((inst, i) => (
                    <li key={`assessment-inst-${component.id}-${i}`} className="text-sm text-neutral-500 flex gap-2">
                      <span className="text-blue-500 font-bold">•</span> {inst}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : (
              <motion.div
                key="thesis"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest">
                  🛡️ Thesis Validity Framework
                </div>
                
                {/* Layer 1: Game */}
                <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl space-y-1">
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                    Layer 1 — Engagement & Game
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                    {getThesisLayers(component.id).layer1}
                  </p>
                </div>

                {/* Layer 2: AI */}
                <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl space-y-1">
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                    Layer 2 — Real-time AI Quantifier
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                    {getThesisLayers(component.id).layer2}
                  </p>
                </div>

                {/* Layer 3: Validated Measurement */}
                <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl space-y-1">
                  <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
                    Layer 3 — Validated Physiological Metric
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                    {getThesisLayers(component.id).layer3}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 shrink-0 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
          <p className="text-blue-400 text-sm font-medium">{feedback}</p>
        </div>
      </div>

      {/* Camera View */}
      {component.id === 'body-comp' ? (
        <div className="flex-grow flex flex-col xl:flex-row bg-neutral-950 overflow-y-auto">
          {/* Interactive Calculator Panel */}
          <div className="flex-1 p-8 space-y-6 text-white bg-neutral-900 border-r border-neutral-800">
            <div>
              <span className="text-blue-500 text-xs font-bold uppercase tracking-widest">Study Protocol Inputs</span>
              <h3 className="text-2xl font-black mt-1">Know Your Body</h3>
              <p className="text-sm text-neutral-400 mt-1">
                Enter your actual weight and height measurements. Select the Growth Reference standard matching your study cohort.
              </p>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-bold uppercase">Weight (kg)</label>
                <input
                  type="number"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-bold uppercase">Height (cm)</label>
                <input
                  type="number"
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 170"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-bold uppercase">Age (years)</label>
                <input
                  type="number"
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 16"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-bold uppercase">Assigned Sex</label>
                <select
                  value={genderInput}
                  onChange={(e) => setGenderInput(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* Growth Chart Reference Standard Selector */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-bold uppercase">Growth Reference Standard</label>
              <div className="grid grid-cols-3 gap-2 bg-neutral-800 p-1.5 rounded-2xl border border-neutral-700">
                {[
                  { id: 'WHO', label: 'WHO (5-19 yrs)' },
                  { id: 'CDC', label: 'CDC (2-19 yrs)' },
                  { id: 'Adult', label: 'Adult Stds' },
                ].map((std) => (
                  <button
                    key={`bodycomp-std-${std.id}`}
                    onClick={() => setRefStandard(std.id)}
                    className={cn(
                      "py-2.5 rounded-xl text-xs font-bold transition-all",
                      refStandard === std.id 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    {std.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning Message for Minors using Adult standards */}
            {ageNum < 19 && refStandard === 'Adult' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl flex gap-3 text-sm"
              >
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-bold">Protocol Validity Alert</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    For minors (under 19 years), using adult BMI categories can lead to invalid/inaccurate results. WHO or CDC reference standards should be selected for age- and sex-appropriate classifications.
                  </p>
                </div>
              </motion.div>
            )}

            {/* BMI Display & Growth Interpretation */}
            <div className="bg-neutral-800/40 border border-neutral-800 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-neutral-500 font-bold uppercase">Calculated Body Mass Index</span>
                  <div className="text-4xl font-black mt-1">
                    {inlineBMI} <span className="text-base font-normal text-neutral-400">kg/m²</span>
                  </div>
                </div>
                {studyInterpretation.percentile !== null && (
                  <div className="text-right">
                    <span className="text-xs text-neutral-500 font-bold uppercase">Growth Percentile</span>
                    <div className="text-3xl font-black text-blue-400 mt-1">
                      {studyInterpretation.percentile}th
                    </div>
                  </div>
                )}
              </div>

              {/* Interpretation Badge */}
              <div className={cn("p-4 rounded-2xl border text-sm flex flex-col gap-1", studyInterpretation.bg)}>
                <span className="font-black uppercase tracking-wider text-xs">Classification: {studyInterpretation.label}</span>
                <span className="text-xs opacity-90">{studyInterpretation.desc}</span>
              </div>
            </div>

            {/* Direct Submit Action */}
            <button
              onClick={handleBodyCompSubmit}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-colors shadow-xl shadow-blue-900/30 active:scale-[0.98]"
            >
              VALIDATE & SAVE COMPOSITION STUDY
            </button>
          </div>

          {/* Stance Posture Check camera side */}
          <div className="w-full xl:w-[480px] relative bg-black flex flex-col items-center justify-center p-6 border-l border-neutral-800">
            <div className="text-center mb-4 space-y-1">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Webcam Posture Guide</h4>
              <p className="text-xs text-neutral-400">Stand straight and face camera to validate physical posture.</p>
            </div>
            <div className="w-full aspect-[4/3] relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
              <Webcam
                ref={webcamRef}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                mirrored
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                disablePictureInPicture={true}
                forceScreenshotSourceSize={false}
                imageSmoothing={true}
                onUserMedia={() => {}}
                onUserMediaError={() => {}}
                screenshotQuality={0.92}
              />
              <canvas
                ref={canvasRef}
                className={cn("absolute inset-0 w-full h-full object-cover z-10 transition-opacity", isPaused ? "opacity-30" : "opacity-100")}
              />
              {/* Guidelines helper lines */}
              <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-around py-12 opacity-30">
                <div className="border-t border-dashed border-blue-500 w-full" />
                <div className="border-t border-dashed border-blue-500 w-full" />
              </div>
            </div>

            {/* Realtime metrics */}
            <div className="mt-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl w-full flex justify-between items-center">
              <span className="text-xs text-neutral-400 font-bold uppercase">Stance Alignment</span>
              <span className={cn(
                "font-black text-sm",
                alignmentScore > 85 ? "text-green-400" : "text-yellow-400"
              )}>
                {alignmentScore}% Perfect Stance
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-grow relative bg-black overflow-hidden flex flex-col items-center justify-between">
          <Webcam
            ref={webcamRef}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            mirrored
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            disablePictureInPicture={true}
            forceScreenshotSourceSize={false}
            imageSmoothing={true}
            onUserMedia={() => {}}
            onUserMediaError={() => {}}
            screenshotQuality={0.92}
          />
          <canvas
            ref={canvasRef}
            className={cn("absolute inset-0 w-full h-full object-cover z-10 transition-opacity", isPaused ? "opacity-30" : "opacity-100")}
          />
          
          {isPaused && (
            <div className="absolute inset-0 z-30 bg-neutral-950/70 backdrop-blur-md flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Pause size={64} className="text-white/50 mb-4" />
                <div className="text-white text-4xl font-black tracking-widest uppercase">Paused</div>
              </div>
            </div>
          )}

          {/* Visual Overlay Effects */}
          <div className="absolute inset-0 border-[16px] border-white/5 pointer-events-none" />

          {/* Top Exercise Toolbar & Recognition HUD */}
          {isExerciseMode ? (
            <div className="relative z-20 w-full p-4 flex flex-col gap-3">
              {/* Exercise Selector Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
                <button
                  onClick={() => {
                    setSelectedExercise('auto');
                    setReps(0);
                    setInvalidReps(0);
                    exerciseTrackerRef.current.stage = 'up';
                    exerciseTrackerRef.current.hasPlayedDepthTone = false;
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all shadow-lg",
                    selectedExercise === 'auto'
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 scale-105"
                      : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60"
                  )}
                >
                  <Sparkles size={14} className={selectedExercise === 'auto' ? "animate-spin text-cyan-300" : "text-blue-400"} />
                  AI AUTO-DETECT
                </button>

                {(Object.keys(EXERCISE_DEFINITIONS) as SupportedExerciseId[]).map((exId) => {
                  const def = EXERCISE_DEFINITIONS[exId];
                  const isSelected = selectedExercise === exId;
                  const isAutoDetected = selectedExercise === 'auto' && detectedExercise === exId;
                  return (
                    <button
                      key={`exercise-tab-btn-${exId}`}
                      onClick={() => {
                        setSelectedExercise(exId);
                        setReps(0);
                        setInvalidReps(0);
                        exerciseTrackerRef.current.stage = 'up';
                        exerciseTrackerRef.current.hasPlayedDepthTone = false;
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all",
                        isSelected
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105"
                          : isAutoDetected
                          ? "bg-blue-600/30 text-blue-300 border border-blue-500/50"
                          : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/50"
                      )}
                    >
                      <span>{def.icon}</span>
                      <span>{def.name}</span>
                      {isAutoDetected && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Real-time Recognition & Form Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-neutral-800 text-xs shadow-lg">
                    <span className="text-blue-400 font-black flex items-center gap-1.5">
                      {selectedExercise === 'auto' ? <Sparkles size={13} className="text-cyan-400" /> : <Shield size={13} />}
                      {selectedExercise === 'auto' ? 'DETECTED:' : 'LOCKED:'}
                    </span>
                    <span className="text-white font-bold">
                      {EXERCISE_DEFINITIONS[selectedExercise === 'auto' ? detectedExercise : selectedExercise]?.name}
                    </span>
                    {selectedExercise === 'auto' && (
                      <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {autoConfidence}% match
                      </span>
                    )}
                  </div>

                  {/* Pose Model Architecture Selector Trigger */}
                  <button
                    onClick={() => setShowModelSpecsModal(true)}
                    className="flex items-center gap-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md"
                    title="Change or compare Pose Estimation & AI Model Architecture"
                  >
                    <Cpu size={13} className="text-cyan-400" />
                    <span>{POSE_MODEL_SPECS[selectedPoseModel]?.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-neutral-400">({POSE_MODEL_SPECS[selectedPoseModel]?.landmarksCount} pts)</span>
                    <Sliders size={12} className="text-neutral-400 ml-0.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-xs shadow-lg flex items-center gap-2">
                    <span className="text-neutral-400">Phase:</span>
                    <span className="text-cyan-300 font-bold">{currentPhaseLabel}</span>
                  </div>
                  <div className={cn(
                    "backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 border",
                    alignmentScore >= 80 
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                      : alignmentScore >= 60
                      ? "bg-yellow-950/80 text-yellow-300 border-yellow-500/30"
                      : "bg-red-950/80 text-red-300 border-red-500/30"
                  )}>
                    <Activity size={14} />
                    Posture {alignmentScore}%
                  </div>
                </div>
              </div>

              {/* Real-time Biomechanical Faults Warning Bar */}
              {activeFaults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-950/90 border border-red-500/50 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center justify-between text-xs shadow-xl text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                      <AlertTriangle size={14} className="animate-pulse" />
                    </div>
                    <div>
                      <div className="font-black text-red-300 flex items-center gap-1.5">
                        <span>{activeFaults[0].title}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-500/30 text-red-200">
                          {activeFaults[0].severity}
                        </span>
                      </div>
                      <p className="text-neutral-300 text-[11px] mt-0.5">
                        {activeFaults[0].coachingCue}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0 ml-2">ST-GCN Diagnostic</span>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="relative z-20 w-full p-4 flex items-center justify-end pointer-events-none">
              <div className="bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-500/30 text-xs shadow-lg flex items-center gap-1.5 text-blue-300 font-bold">
                <Shield size={13} className="text-blue-400" />
                <span>AI Face Anonymization Active</span>
              </div>
            </div>
          )}
          
          {/* Bottom HUD Overlay */}
          <div className="relative z-20 pb-8 flex flex-col items-center gap-3">
            {/* Live Feedback Banner */}
            <div className="px-5 py-2 rounded-2xl bg-neutral-950/85 backdrop-blur-md border border-neutral-800 text-white font-medium text-xs shadow-2xl flex items-center gap-2 max-w-md text-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{feedback}</span>
            </div>

            {/* Repetition Counter Badge */}
            <div className="flex items-center gap-4">
              <motion.div 
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="px-8 py-3 bg-neutral-950/90 backdrop-blur-md rounded-2xl border border-emerald-500/30 text-white font-black text-4xl tabular-nums shadow-2xl flex items-center gap-3"
              >
                <div className="flex flex-col items-center">
                  <span className="text-emerald-400 font-black text-4xl">
                    {component.id === 'cardio' ? starsCollected : reps}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    {component.id === 'flexibility' 
                      ? 'Reach (cm)' 
                      : component.id === 'agility' 
                        ? 'Dodges' 
                        : component.id === 'cardio' 
                          ? 'Stars Caught' 
                          : 'Valid Reps'}
                  </span>
                </div>
              </motion.div>

              {isExerciseMode && invalidReps > 0 && (
                <div className="px-4 py-3 bg-red-950/80 backdrop-blur-md rounded-2xl border border-red-500/30 text-red-400 font-bold flex flex-col items-center shadow-lg">
                  <span className="text-xl font-black">{invalidReps}</span>
                  <span className="text-[9px] uppercase tracking-wider text-red-300/80">Incomplete</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POSE ESTIMATION & ST-GCN/TRANSFORMER MODEL ARCHITECTURE MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showModelSpecsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-neutral-900 border border-neutral-700/80 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto text-white"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-neutral-900 flex items-center justify-between border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                    <Cpu size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/30 text-blue-200 border border-blue-400/20">
                        Neural Model Selector
                      </span>
                      <span className="text-xs text-blue-200/70 font-medium">Pose Estimation & Form Classification</span>
                    </div>
                    <h2 className="text-xl font-black text-white mt-0.5">
                      Kinematic Pose & Deep Learning Backbone
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowModelSpecsModal(false)}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                >
                  <Octagon size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Pipeline Flow Banner */}
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-white">Pose Landmarker</div>
                      <div className="text-indigo-200/70 text-[11px]">33 3D Anatomical Landmarks</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-indigo-400 hidden md:block" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-white">Spatial Graph Conv (ST-GCN)</div>
                      <div className="text-cyan-200/70 text-[11px]">Kinematic Bone Adjacency (35 Edges)</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-cyan-400 hidden md:block" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <div className="font-bold text-white">Temporal Transformer</div>
                      <div className="text-emerald-200/70 text-[11px]">Multi-Head Self-Attention (T=30)</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-emerald-400 hidden md:block" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <div className="font-bold text-white">Exercise + Form Quality</div>
                      <div className="text-blue-200/70 text-[11px]">Biomechanical Fault Diagnostics</div>
                    </div>
                  </div>
                </div>

                {/* Model Comparison Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">
                    Select Pose Estimation Model Architecture
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(Object.keys(POSE_MODEL_SPECS) as PoseModelArchitecture[]).map((modelKey) => {
                      const spec = POSE_MODEL_SPECS[modelKey];
                      const isSelected = selectedPoseModel === modelKey;
                      return (
                        <div
                          key={`model-spec-${modelKey}`}
                          onClick={() => setSelectedPoseModel(modelKey)}
                          className={cn(
                            "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4",
                            isSelected
                              ? "bg-blue-950/40 border-blue-500/80 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10"
                              : "bg-neutral-800/40 border-neutral-700/60 hover:bg-neutral-800/80 hover:border-neutral-600"
                          )}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                isSelected ? "bg-blue-500 text-white" : "bg-neutral-700 text-neutral-300"
                              )}>
                                {spec.tag}
                              </span>
                              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                                <Zap size={13} />
                                {spec.fpsTarget} FPS Target
                              </div>
                            </div>
                            <h4 className="font-bold text-white text-base flex items-center gap-2">
                              {spec.name}
                              {isSelected && <CheckCircle2 size={16} className="text-blue-400" />}
                            </h4>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                              {spec.backbone}
                            </p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-neutral-700/50 text-xs">
                            <div className="flex items-center justify-between text-neutral-300">
                              <span className="text-neutral-400">Landmarks / Precision:</span>
                              <span className="font-bold text-white">{spec.landmarksCount} Keypoints ({spec.precision.split(' ')[0]})</span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-300">
                              <span className="text-neutral-400">Multi-Person Crowd:</span>
                              <span className={cn(
                                "font-bold",
                                spec.multiPersonSupport ? "text-emerald-400" : "text-neutral-400"
                              )}>
                                {spec.multiPersonSupport ? "Supported (Gymnasium Scale)" : "Single-User Focused"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-neutral-300">
                              <span className="text-neutral-400">Occlusion Robustness:</span>
                              <span className="font-bold text-cyan-300">{spec.occlusionResistance}</span>
                            </div>
                            <div className="bg-neutral-900/80 p-2.5 rounded-xl text-[11px] text-neutral-300 mt-2">
                              <strong className="text-blue-300">Best For: </strong>
                              {spec.bestFor}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Academic Note */}
                <div className="bg-neutral-800/60 border border-neutral-700/80 rounded-2xl p-4 text-xs text-neutral-300 flex items-start gap-3">
                  <Award size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-1">Defense Citation & Reproducibility:</strong>
                    ExerFit applies 33 normalized spatial-temporal landmark nodes to an ST-GCN graph convolution layer coupled with a multi-head temporal self-attention transformer (T=30), guaranteeing real-time latency (under 25ms) on client devices with zero external video streaming.
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowModelSpecsModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-600/30"
                >
                  Confirm & Apply Model
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
