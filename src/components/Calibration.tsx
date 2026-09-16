import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose, Results } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, AlertCircle, CheckCircle2, UserCheck, ShieldCheck, ArrowUp, ArrowDown, MoveHorizontal, Sparkles } from 'lucide-react';
import { cn } from '../utils';

interface CalibrationProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface CalibrationMetrics {
  headDetected: boolean;
  shouldersDetected: boolean;
  torsoDetected: boolean;
  legsDetected: boolean;
  feetDetected: boolean;
  isCentered: boolean;
  distanceStatus: 'optimal' | 'too-close' | 'too-far';
  isUpright: boolean;
}

export const Calibration: React.FC<CalibrationProps> = ({ onComplete, onCancel }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [status, setStatus] = useState<'calibrating' | 'ready' | 'error'>('calibrating');
  const [message, setMessage] = useState('Positioning camera and detecting full body...');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100% stability
  
  const [metrics, setMetrics] = useState<CalibrationMetrics>({
    headDetected: false,
    shouldersDetected: false,
    torsoDetected: false,
    legsDetected: false,
    feetDetected: false,
    isCentered: false,
    distanceStatus: 'optimal',
    isUpright: true,
  });

  const holdCounterRef = useRef(0);
  const REQUIRED_HOLD_FRAMES = 24; // ~1.0-1.2s of consistent high-quality tracking

  // Countdown handler when status transitions to ready
  useEffect(() => {
    if (status === 'ready') {
      setCountdown(3);
    } else {
      setCountdown(null);
    }
  }, [status]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });

    pose.onResults((results: Results) => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      const video = webcamRef.current?.video;
      if (video && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks && results.poseLandmarks.length > 0) {
        const lm = results.poseLandmarks;

        // Extract key anatomical landmarks
        const nose = lm[0];
        const leftEye = lm[2];
        const rightEye = lm[5];
        const leftShoulder = lm[11];
        const rightShoulder = lm[12];
        const leftHip = lm[23];
        const rightHip = lm[24];
        const leftKnee = lm[25];
        const rightKnee = lm[26];
        const leftAnkle = lm[27];
        const rightAnkle = lm[28];
        const leftFoot = lm[31];
        const rightFoot = lm[32];

        // 1. Landmark visibility tests
        const headVis = ((nose?.visibility ?? 0) > 0.5) || (((leftEye?.visibility ?? 0) + (rightEye?.visibility ?? 0)) / 2 > 0.5);
        const shoulderVis = ((leftShoulder?.visibility ?? 0) > 0.45) && ((rightShoulder?.visibility ?? 0) > 0.45);
        const hipVis = ((leftHip?.visibility ?? 0) > 0.45) && ((rightHip?.visibility ?? 0) > 0.45);
        const kneeVis = ((leftKnee?.visibility ?? 0) > 0.4) && ((rightKnee?.visibility ?? 0) > 0.4);
        const ankleVis = (((leftAnkle?.visibility ?? 0) > 0.4) || ((leftFoot?.visibility ?? 0) > 0.4)) &&
                         (((rightAnkle?.visibility ?? 0) > 0.4) || ((rightFoot?.visibility ?? 0) > 0.4));

        // 2. Spatial and geometric checks
        const avgAnkleY = ((leftAnkle?.y ?? 0.9) + (rightAnkle?.y ?? 0.9)) / 2;
        const noseY = nose?.y ?? 0.1;
        const bodyHeightRatio = Math.abs(avgAnkleY - noseY);
        
        const midHipX = ((leftHip?.x ?? 0.5) + (rightHip?.x ?? 0.5)) / 2;
        const centered = midHipX >= 0.22 && midHipX <= 0.78;
        
        let distStatus: 'optimal' | 'too-close' | 'too-far' = 'optimal';
        if (bodyHeightRatio > 0.92 || (nose && nose.y < 0.04) || (avgAnkleY > 0.98)) {
          distStatus = 'too-close';
        } else if (bodyHeightRatio < 0.38) {
          distStatus = 'too-far';
        }

        const shoulderSlope = Math.abs((leftShoulder?.y ?? 0) - (rightShoulder?.y ?? 0));
        const upright = shoulderSlope < 0.14;

        const currentMetrics: CalibrationMetrics = {
          headDetected: headVis,
          shouldersDetected: shoulderVis,
          torsoDetected: hipVis,
          legsDetected: kneeVis,
          feetDetected: ankleVis,
          isCentered: centered,
          distanceStatus: distStatus,
          isUpright: upright,
        };

        setMetrics(currentMetrics);

        // 3. Mirror the canvas context so skeleton matches user reflection exactly
        canvasCtx.save();
        canvasCtx.translate(canvas.width, 0);
        canvasCtx.scale(-1, 1);

        const allValid = headVis && shoulderVis && hipVis && kneeVis && ankleVis && centered && distStatus === 'optimal';

        drawConnectors(canvasCtx, lm, POSE_CONNECTIONS, {
          color: allValid ? '#10b981' : '#f59e0b',
          lineWidth: allValid ? 4 : 3,
        });
        drawLandmarks(canvasCtx, lm, {
          color: allValid ? '#06b6d4' : '#ef4444',
          lineWidth: 2,
          radius: 3,
        });

        canvasCtx.restore();

        // 4. Update Hold Stability & Guidance Feedback
        if (allValid) {
          holdCounterRef.current = Math.min(REQUIRED_HOLD_FRAMES, holdCounterRef.current + 1);
          const progress = Math.round((holdCounterRef.current / REQUIRED_HOLD_FRAMES) * 100);
          setHoldProgress(progress);

          if (holdCounterRef.current >= REQUIRED_HOLD_FRAMES) {
            setStatus('ready');
            setMessage('Calibrated with high accuracy! Get ready...');
          } else {
            setStatus('calibrating');
            setMessage('Perfect position! Hold steady to lock calibration...');
          }
        } else {
          // Decay hold progress smoothly
          holdCounterRef.current = Math.max(0, holdCounterRef.current - 2);
          setHoldProgress(Math.round((holdCounterRef.current / REQUIRED_HOLD_FRAMES) * 100));
          setStatus('calibrating');

          if (!headVis && !ankleVis) {
            setMessage('Step back so your full body is visible in the frame.');
          } else if (!headVis || (nose && nose.y < 0.05)) {
            setMessage('Tilt camera slightly up or step back (head too close to top edge).');
          } else if (!ankleVis || avgAnkleY > 0.96) {
            setMessage('Tilt camera slightly down or step back (feet must be clearly visible).');
          } else if (distStatus === 'too-close') {
            setMessage('Step back 2-3 feet for optimal full-body tracking.');
          } else if (distStatus === 'too-far') {
            setMessage('Step slightly closer to the camera.');
          } else if (!centered) {
            setMessage('Center your body in the middle of the camera frame.');
          } else if (!shoulderVis || !hipVis) {
            setMessage('Make sure arms and torso are not obscured.');
          } else {
            setMessage('Adjust position to fit inside the green calibration zone.');
          }
        }
      } else {
        setStatus('error');
        setMessage('No person detected. Ensure room is well-lit and face the camera.');
        holdCounterRef.current = 0;
        setHoldProgress(0);
        setMetrics({
          headDetected: false,
          shouldersDetected: false,
          torsoDetected: false,
          legsDetected: false,
          feetDetected: false,
          isCentered: false,
          distanceStatus: 'optimal',
          isUpright: false,
        });
      }

      canvasCtx.restore();
    });

    let isRunning = true;
    let isProcessing = false;
    let animationFrameId: number | null = null;

    const runDetection = async () => {
      if (!isRunning) return;

      if (isProcessing) {
        if (isRunning) {
          animationFrameId = requestAnimationFrame(runDetection);
        }
        return;
      }

      const video = webcamRef.current?.video;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && !video.paused && !video.ended) {
        isProcessing = true;
        try {
          await pose.send({ image: video });
        } catch {
          // Suppress frame send errors during transitions
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
        // Suppress close errors
      }
    };
  }, []);

  const allChecksPassed = metrics.headDetected && 
                          metrics.shouldersDetected && 
                          metrics.torsoDetected && 
                          metrics.legsDetected && 
                          metrics.feetDetected && 
                          metrics.isCentered && 
                          metrics.distanceStatus === 'optimal';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-neutral-200 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-1">
            <ShieldCheck size={16} /> Standardized AI Calibration
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">Full-Body Vision Calibration</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Validates student framing, distance, and joint visibility for 100% accurate PFT rep counting.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-neutral-400 font-bold uppercase">Stability Lock</div>
            <div className="text-xl font-black text-neutral-900">{holdProgress}%</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center border border-neutral-200">
            <div 
              className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
              style={{ display: holdProgress > 0 && status !== 'ready' ? 'block' : 'none' }}
            />
            {status === 'ready' && <CheckCircle2 className="text-green-500" size={28} />}
            {status !== 'ready' && holdProgress === 0 && <Camera className="text-neutral-400" size={24} />}
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera & Tracking Viewport */}
        <div className="lg:col-span-2 relative aspect-video bg-neutral-950 rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
          <Webcam
            ref={webcamRef}
            className="absolute inset-0 w-full h-full object-cover"
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
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Futuristic Target Framing Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className={cn(
              "w-full max-w-[360px] h-[92%] rounded-3xl border-2 transition-all duration-300 relative flex flex-col justify-between p-4",
              allChecksPassed 
                ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.25)]" 
                : "border-dashed border-amber-400/70 bg-black/15"
            )}>
              {/* Corner Accents */}
              <div className={cn("absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-xl", allChecksPassed ? "border-emerald-400" : "border-amber-400")} />
              <div className={cn("absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 rounded-tr-xl", allChecksPassed ? "border-emerald-400" : "border-amber-400")} />
              <div className={cn("absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 rounded-bl-xl", allChecksPassed ? "border-emerald-400" : "border-amber-400")} />
              <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-xl", allChecksPassed ? "border-emerald-400" : "border-amber-400")} />

              {/* Head & Feet Alignment Target Guides */}
              <div className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-neutral-300 opacity-60">
                <span>👤 Head Zone</span>
                <span className={metrics.headDetected ? "text-emerald-400" : "text-amber-400"}>
                  {metrics.headDetected ? 'ALIGNED' : 'SEEKING'}
                </span>
              </div>

              {/* Center Target Crosshair */}
              <div className="self-center flex items-center justify-center">
                <div className={cn(
                  "w-12 h-12 rounded-full border border-dashed flex items-center justify-center transition-colors",
                  metrics.isCentered ? "border-emerald-400/80 text-emerald-400" : "border-amber-400/50 text-amber-400"
                )}>
                  <div className={cn("w-2 h-2 rounded-full", metrics.isCentered ? "bg-emerald-400 animate-ping" : "bg-amber-400")} />
                </div>
              </div>

              <div className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-neutral-300 opacity-60">
                <span>👟 Feet Zone</span>
                <span className={metrics.feetDetected ? "text-emerald-400" : "text-amber-400"}>
                  {metrics.feetDetected ? 'ALIGNED' : 'SEEKING'}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Floating Guidance Badge */}
          <div className="absolute top-4 inset-x-4 flex justify-between items-center pointer-events-none">
            <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700 px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-xl">
              <div className={cn("w-2.5 h-2.5 rounded-full", status === 'ready' ? "bg-emerald-400" : "bg-amber-400 animate-pulse")} />
              {status === 'ready' ? 'AI Tracking Locked' : 'AI Calibrating Position'}
            </div>

            <motion.div
              animate={{ scale: status === 'ready' ? [1, 1.05, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={cn(
                "px-4 py-2 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-2xl border",
                status === 'ready'
                  ? "bg-emerald-600 border-emerald-400 text-white"
                  : status === 'error'
                  ? "bg-red-600 border-red-400 text-white"
                  : "bg-neutral-900/95 border-amber-500/50 text-amber-300"
              )}
            >
              {status === 'ready' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message}
            </motion.div>
          </div>

          {/* Realtime Hold Progress Bar on bottom of viewport */}
          <div className="absolute bottom-0 inset-x-0 h-2 bg-neutral-900">
            <div 
              className={cn(
                "h-full transition-all duration-150",
                status === 'ready' ? "bg-emerald-500" : "bg-blue-500"
              )}
              style={{ width: `${holdProgress}%` }}
            />
          </div>

          {/* Countdown Full Screen Takeover */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div 
                key="calibration-countdown-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20"
              >
                <motion.div
                  key={`calibration-count-${countdown}`}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="text-9xl font-black text-blue-400 mb-4 drop-shadow-[0_0_40px_rgba(59,130,246,0.6)]"
                >
                  {countdown}
                </motion.div>
                <div className="flex items-center gap-2 text-lg font-bold text-neutral-200">
                  <Sparkles className="text-yellow-400" size={20} />
                  Calibration Verified! Starting Warm-Up...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Real-Time Diagnostic Validation Checklist */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
                Posture & Frame Checklist
              </h3>
              <span className={cn(
                "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                allChecksPassed ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600"
              )}>
                {allChecksPassed ? 'Ready' : 'Checking'}
              </span>
            </div>

            <div className="space-y-3">
              {/* Check 1: Head & Shoulders */}
              <div className={cn(
                "p-3 rounded-2xl border transition-all flex items-center justify-between",
                metrics.headDetected && metrics.shouldersDetected
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-neutral-50 border-neutral-200 text-neutral-500"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs",
                    metrics.headDetected && metrics.shouldersDetected ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-600"
                  )}>
                    1
                  </div>
                  <div>
                    <div className="text-xs font-bold">Head & Shoulders</div>
                    <div className="text-[10px] opacity-75">Keep your head and shoulders inside the frame</div>
                  </div>
                </div>
                {metrics.headDetected && metrics.shouldersDetected ? <CheckCircle2 className="text-emerald-600" size={18} /> : <div className="w-2 h-2 rounded-full bg-neutral-300" />}
              </div>

              {/* Check 2: Torso & Core Center */}
              <div className={cn(
                "p-3 rounded-2xl border transition-all flex items-center justify-between",
                metrics.torsoDetected && metrics.isCentered
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-neutral-50 border-neutral-200 text-neutral-500"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs",
                    metrics.torsoDetected && metrics.isCentered ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-600"
                  )}>
                    2
                  </div>
                  <div>
                    <div className="text-xs font-bold">Centered In View</div>
                    <div className="text-[10px] opacity-75">Stand in the middle of the camera frame</div>
                  </div>
                </div>
                {metrics.torsoDetected && metrics.isCentered ? <CheckCircle2 className="text-emerald-600" size={18} /> : <div className="w-2 h-2 rounded-full bg-neutral-300" />}
              </div>

              {/* Check 3: Knees & Ankles */}
              <div className={cn(
                "p-3 rounded-2xl border transition-all flex items-center justify-between",
                metrics.legsDetected && metrics.feetDetected
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-neutral-50 border-neutral-200 text-neutral-500"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs",
                    metrics.legsDetected && metrics.feetDetected ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-600"
                  )}>
                    3
                  </div>
                  <div>
                    <div className="text-xs font-bold">Knees & Feet Visible</div>
                    <div className="text-[10px] opacity-75">Make sure knees and feet are clearly seen</div>
                  </div>
                </div>
                {metrics.legsDetected && metrics.feetDetected ? <CheckCircle2 className="text-emerald-600" size={18} /> : <div className="w-2 h-2 rounded-full bg-neutral-300" />}
              </div>

              {/* Check 4: Distance & Margin */}
              <div className={cn(
                "p-3 rounded-2xl border transition-all flex items-center justify-between",
                metrics.distanceStatus === 'optimal'
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-neutral-50 border-neutral-200 text-neutral-500"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs",
                    metrics.distanceStatus === 'optimal' ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-600"
                  )}>
                    4
                  </div>
                  <div>
                    <div className="text-xs font-bold">Camera Distance</div>
                    <div className="text-[10px] opacity-75">
                      {metrics.distanceStatus === 'optimal' 
                        ? 'Perfect distance (about 4–7 feet away)' 
                        : metrics.distanceStatus === 'too-close' 
                          ? 'Too close — step back a little' 
                          : 'Too far — step a bit closer'}
                    </div>
                  </div>
                </div>
                {metrics.distanceStatus === 'optimal' ? <CheckCircle2 className="text-emerald-600" size={18} /> : <div className="w-2 h-2 rounded-full bg-neutral-300" />}
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs text-blue-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-700">
              <UserCheck size={14} /> Calibration Tip:
            </div>
            <p className="text-blue-800/90 leading-relaxed text-[11px]">
              Stand back until your feet touch the bottom zone and your head is comfortably within the upper frame. Hold still for 1 second to start automatically.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
            <button
              onClick={onComplete}
              disabled={status !== 'ready'}
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold transition-all shadow-lg text-sm flex items-center justify-center gap-2",
                status === 'ready' 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.98]" 
                  : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              )}
            >
              {countdown !== null ? `Starting in ${countdown}s...` : 'Proceed to Warm-Up'}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 bg-transparent text-neutral-500 font-semibold rounded-xl text-xs hover:bg-neutral-100 transition-colors"
            >
              Cancel Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

