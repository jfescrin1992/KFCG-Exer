import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  CheckCircle, 
  ArrowRight, 
  Pause, 
  AlertCircle, 
  Video, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft,
  Sparkles 
} from 'lucide-react';
import Webcam from 'react-webcam';
import { Pose, Results } from '@mediapipe/pose';
import { cn } from '../utils';

interface WarmUpProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface WarmupStepItem {
  id: number;
  name: string;
  duration: number;
  instructions: string;
  videoUrl: string;
}

const DEFAULT_WARM_UP_STEPS: WarmupStepItem[] = [
  { 
    id: 1, 
    name: "March in Place", 
    duration: 15, 
    instructions: "Lift your knees high to hip level while rhythmically swinging your arms.",
    videoUrl: "https://www.youtube.com/embed/zL8D-m4aW5Y"
  },
  { 
    id: 2, 
    name: "Arm Circles", 
    duration: 15, 
    instructions: "Extend arms laterally and perform small circles moving forward, then larger reverse circles.",
    videoUrl: "https://www.youtube.com/embed/S_7M_q8wRNo"
  },
  { 
    id: 3, 
    name: "Side Steps & Reach", 
    duration: 15, 
    instructions: "Step dynamically from left to right, reaching overhead to activate lateral chain mobility.",
    videoUrl: "https://www.youtube.com/embed/S6z79_NAnX8"
  },
  { 
    id: 4, 
    name: "Light Jogging", 
    duration: 15, 
    instructions: "Bounce lightly on the balls of your feet with relaxed shoulders and deep breathing.",
    videoUrl: "https://www.youtube.com/embed/mS_mP3wVb4g"
  },
];

// Helper to extract YouTube ID from any standard format
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export const WarmUp: React.FC<WarmUpProps> = ({ onComplete, onCancel }) => {
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [steps, setSteps] = useState<WarmupStepItem[]>(DEFAULT_WARM_UP_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WARM_UP_STEPS[0].duration);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isWholeBodyVisible, setIsWholeBodyVisible] = useState(true);

  // Load dynamically configured warmup videos from faculty database
  useEffect(() => {
    const loadWarmupVideos = async () => {
      try {
        const res = await fetch('/api/warmup-videos');
        if (res.ok) {
          const fetchedVideos = await res.json();
          if (fetchedVideos && fetchedVideos.length > 0) {
            const mappedSteps: WarmupStepItem[] = fetchedVideos.map((v: any, index: number) => ({
              id: v.id || index + 1,
              name: v.title,
              duration: v.duration || 15,
              instructions: v.description || 'Follow the posture guidelines shown in the demonstration video.',
              videoUrl: v.url,
            }));
            setSteps(mappedSteps);
            setTimeLeft(mappedSteps[0].duration);
          }
        }
      } catch (err) {
        console.error('Error fetching warmup steps:', err);
      }
    };
    loadWarmupVideos();
  }, []);

  const step = steps[currentStep] || steps[0];

  const youtubeId = useMemo(() => {
    return extractYouTubeId(step.videoUrl);
  }, [step.videoUrl]);

  const isHtml5Video = useMemo(() => {
    return (
      step.videoUrl.startsWith('data:video') ||
      step.videoUrl.startsWith('blob:') ||
      step.videoUrl.endsWith('.mp4') ||
      step.videoUrl.endsWith('.webm') ||
      step.videoUrl.endsWith('.ogg')
    );
  }, [step.videoUrl]);

  // Handle YouTube postMessage API commands
  const sendYouTubeCommand = (func: 'playVideo' | 'pauseVideo' | 'mute' | 'unMute') => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args: [] }),
          '*'
        );
      } catch {
        // Suppress cross-origin frame messaging errors
      }
    }
  };

  // Synchronize HTML5 video element and YouTube iframe with active / paused state
  useEffect(() => {
    if (isHtml5Video && videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isActive && !isPaused) {
        videoRef.current.play().catch(err => {
          console.warn('Autoplay prevented by browser:', err);
        });
      } else {
        videoRef.current.pause();
      }
    } else if (youtubeId) {
      if (isActive && !isPaused) {
        sendYouTubeCommand('playVideo');
      } else {
        sendYouTubeCommand('pauseVideo');
      }
      if (isMuted) {
        sendYouTubeCommand('mute');
      } else {
        sendYouTubeCommand('unMute');
      }
    }
  }, [isActive, isPaused, isMuted, currentStep, isHtml5Video, youtubeId]);

  // MediaPipe Skeleton Pose detection for student body positioning feedback
  useEffect(() => {
    if (!isActive) return;

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results: Results) => {
      if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;
        const anklesVisible = (landmarks[27].visibility ?? 0) > 0.5 && (landmarks[28].visibility ?? 0) > 0.5;
        const shouldersVisible = (landmarks[11].visibility ?? 0) > 0.5 && (landmarks[12].visibility ?? 0) > 0.5;
        setIsWholeBodyVisible(anklesVisible && shouldersVisible);
      }
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
  }, [isActive]);

  // Countdown timer handler
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && !isPaused && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setTimeLeft(steps[currentStep + 1].duration);
      } else {
        setIsActive(false);
      }
    }
    return () => clearInterval(timer);
  }, [isActive, isPaused, timeLeft, currentStep, steps]);

  const handleStartWarmup = () => {
    setIsActive(true);
    setIsPaused(false);
    // Explicit trigger for video playback on user click gesture
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    sendYouTubeCommand('playVideo');
  };

  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (nextPaused) {
      if (videoRef.current) videoRef.current.pause();
      sendYouTubeCommand('pauseVideo');
    } else {
      if (videoRef.current) videoRef.current.play().catch(() => {});
      sendYouTubeCommand('playVideo');
    }
  };

  const handleRestartStep = () => {
    setTimeLeft(step.duration);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isActive && !isPaused) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setTimeLeft(steps[currentStep + 1].duration);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setTimeLeft(steps[currentStep - 1].duration);
    }
  };

  // Build YouTube iframe src URL with dynamic autoplay and mute states
  const getEmbedSrc = () => {
    if (youtubeId) {
      const autoplayParam = isActive && !isPaused ? '1' : '0';
      const muteParam = isMuted ? '1' : '0';
      return `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=${autoplayParam}&mute=${muteParam}&loop=1&playlist=${youtubeId}&controls=1&rel=0`;
    }
    return step.videoUrl;
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">
          <Sparkles size={14} /> PE Faculty Warm-Up Routine
        </div>
        <h2 className="text-4xl font-black tracking-tight text-neutral-900">
          Quick <span className="text-blue-600">Warm-Up</span>
        </h2>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          Prepare your muscles and cardiovascular system with guided faculty video demonstrations.
        </p>
      </div>
      
      <div className="bg-white border border-neutral-200 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`warmup-step-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Tutorial & Camera Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[320px]">
              
              {/* Demonstration Video Tutorial */}
              <div className="relative bg-neutral-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-white flex flex-col justify-center items-center group">
                {isHtml5Video ? (
                  <video 
                    ref={videoRef}
                    key={`html5-vid-${step.id}-${step.videoUrl}`}
                    src={step.videoUrl} 
                    loop 
                    muted={isMuted}
                    playsInline 
                    controls
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <iframe 
                    ref={iframeRef}
                    key={`yt-iframe-${step.id}-${step.videoUrl}-${isActive}-${isPaused}`}
                    className="w-full h-full border-0"
                    src={getEmbedSrc()}
                    title={step.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}

                {/* Overlaid Status Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                  <div className="bg-blue-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                    <Video size={11} /> Faculty Demo
                  </div>
                  {isActive && !isPaused && (
                    <div className="bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg animate-pulse">
                      <Play size={10} className="fill-current" /> Playing
                    </div>
                  )}
                </div>

                {/* Sound / Unmute Control */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 bg-neutral-900/80 hover:bg-neutral-900 text-white rounded-xl backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 text-[10px] font-bold"
                    title={isMuted ? "Unmute video sound" : "Mute video sound"}
                  >
                    {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-emerald-400" />}
                    <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
                  </button>
                </div>

                {/* Initial Ready Overlay before Start Warm-Up is pressed */}
                {!isActive && timeLeft > 0 && currentStep === 0 && (
                  <div 
                    onClick={handleStartWarmup}
                    className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-neutral-950/30 z-20"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl mb-3 group-hover:scale-110 transition-transform">
                      <Play size={28} className="fill-current ml-1" />
                    </div>
                    <span className="text-white font-black text-sm drop-shadow-md">
                      Press "Start Warm-Up" to play video
                    </span>
                    <span className="text-white/70 text-xs mt-1">
                      {step.name} ({step.duration}s)
                    </span>
                  </div>
                )}
              </div>

              {/* Student Camera View with Pose Guidance */}
              <div className="relative bg-neutral-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-white group flex items-center justify-center">
                <Webcam
                  ref={webcamRef}
                  mirrored
                  className="w-full h-full object-cover"
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
                <div className="absolute top-4 left-4 bg-neutral-900/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Your Camera
                </div>
                
                {!isWholeBodyVisible && isActive && (
                  <div className="absolute inset-x-4 bottom-4 bg-red-600/95 backdrop-blur-md text-white p-3.5 rounded-2xl flex items-center gap-3 shadow-2xl border border-red-500/50 animate-bounce z-20">
                    <AlertCircle className="shrink-0" size={20} />
                    <p className="text-xs font-black leading-tight uppercase tracking-tight">Step back! Ensure your shoulders and feet are in frame.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Exercise Instructions & Timer Card */}
            <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Exercise {currentStep + 1} of {steps.length}
                    </span>
                    {isActive && !isPaused && (
                      <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking Active
                      </span>
                    )}
                    {isPaused && (
                      <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Paused
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-black text-neutral-900 leading-tight tracking-tight">{step.name}</h3>
                  <p className="text-neutral-600 font-medium leading-relaxed max-w-2xl">{step.instructions}</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 shrink-0">
                  <div className="text-5xl font-black text-blue-600 tabular-nums leading-none">
                    {timeLeft}
                    <span className="text-sm text-neutral-400 ml-1">s</span>
                  </div>
                  <div className="h-10 w-px bg-neutral-100" />
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest leading-tight">
                    Time<br />Remaining
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Interactive Action Controls */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center items-center gap-4">
          {!isActive && timeLeft > 0 && currentStep === 0 && (
            <button
              onClick={handleStartWarmup}
              className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-base flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/25 active:scale-95"
            >
              <Play size={22} className="fill-current" /> Start Warm-Up & Play Video
            </button>
          )}

          {isActive && timeLeft > 0 && (
            <>
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="p-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous Exercise"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={handleTogglePause}
                className={cn(
                  "px-8 py-4 text-white rounded-2xl font-black text-base flex items-center gap-2.5 transition-all shadow-lg active:scale-95",
                  isPaused 
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" 
                    : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                )}
              >
                {isPaused ? <Play size={20} className="fill-current" /> : <Pause size={20} />} 
                {isPaused ? 'Resume Warm-Up' : 'Pause'}
              </button>

              <button
                onClick={handleRestartStep}
                className="p-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl font-bold transition-colors"
                title="Restart Current Step"
              >
                <RotateCcw size={18} />
              </button>

              <button
                onClick={handleNextStep}
                disabled={currentStep === steps.length - 1}
                className="p-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Exercise"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          
          {(timeLeft === 0 && currentStep === steps.length - 1) || (!isActive && currentStep > 0) ? (
            <button
              onClick={onComplete}
              className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-base flex items-center gap-2.5 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/25 active:scale-95"
            >
              <CheckCircle size={22} /> Continue to Physical Assessment
              <ArrowRight size={18} />
            </button>
          ) : null}
        </div>

        <button 
          onClick={onCancel}
          className="text-neutral-400 text-xs font-bold hover:text-red-500 transition-colors uppercase tracking-widest mt-2"
        >
          Cancel and Return Home
        </button>
      </div>

      {/* Routine Progress Indicator Dots */}
      <div className="mt-8 flex justify-center items-center gap-2.5">
        {steps.map((s, i) => (
          <button
            key={`warmup-dot-${s.id || i}`}
            onClick={() => {
              setCurrentStep(i);
              setTimeLeft(steps[i].duration);
            }}
            className={cn(
              "h-2.5 rounded-full transition-all duration-300",
              i === currentStep ? "w-10 bg-blue-600 shadow-sm" : "w-2.5 bg-neutral-200 hover:bg-neutral-300"
            )}
            title={`Step ${i + 1}: ${s.name}`}
          />
        ))}
      </div>
    </div>
  );
};

