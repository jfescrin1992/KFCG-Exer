import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  X, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  Activity,
  Calculator,
  Award
} from 'lucide-react';
import { cn } from '../utils';

interface ThesisDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThesisDefenseModal: React.FC<ThesisDefenseModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'deeplearning' | 'mathematics' | 'standards' | 'qa' | 'tech'>('architecture');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-[2rem] border border-neutral-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-neutral-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <GraduationCap size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/30 text-blue-200 border border-blue-400/20">
                  Thesis Defense Hub
                </span>
                <span className="text-xs text-blue-200/70 font-medium">Academic & Technical Reference</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                KFCG ExerFit Theoretical Framework
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-6 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'architecture', label: '3-Layer Architecture', icon: Layers },
            { id: 'deeplearning', label: 'ST-GCN & Pose Models', icon: Cpu },
            { id: 'mathematics', label: 'Kinematics & Formulas', icon: Calculator },
            { id: 'standards', label: 'DepEd & WHO Standards', icon: Award },
            { id: 'qa', label: 'Panel Defense Q&A', icon: HelpCircle },
            { id: 'tech', label: 'System & Privacy', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "py-4 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap",
                  isSelected
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-neutral-800">
          
          {/* Tab 1: 3-Layer Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-900 text-xs sm:text-sm leading-relaxed">
                <strong>Core Research Framework:</strong> To eliminate subjective teacher grading bias while maintaining student engagement, ExerFit decouples movement execution into three synchronized structural layers.
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/80 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                    L1
                  </div>
                  <h3 className="font-black text-indigo-950 text-base">Exergame Motivation Layer</h3>
                  <p className="text-xs text-indigo-900/80 leading-relaxed">
                    Interactive canvas physics, audio-guided metronome beats (96 BPM for cardio), dodging hazards, and visual energy ascents that motivate natural athletic movements.
                  </p>
                  <div className="pt-2 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    Role: Student Engagement
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-100/80 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black">
                    L2
                  </div>
                  <h3 className="font-black text-cyan-950 text-base">AI Computer Vision Layer</h3>
                  <p className="text-xs text-cyan-900/80 leading-relaxed">
                    Client-side Google MediaPipe tracking 33 3D skeletal landmarks at 30–60 FPS. Calculates joint angle vertices, displacement velocities, and anti-cheating state transitions.
                  </p>
                  <div className="pt-2 text-[11px] font-bold text-cyan-600 uppercase tracking-wider">
                    Role: Kinematic Verification
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/80 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                    L3
                  </div>
                  <h3 className="font-black text-emerald-950 text-base">Validated Pedagogical Layer</h3>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">
                    Standardizes raw keypoint telemetry against DepEd Physical Fitness Testing (PFT) tables, WHO/CDC pediatric percentile curves, and YMCA cardiovascular norms.
                  </p>
                  <div className="pt-2 text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    Role: Clinical & Educational Validity
                  </div>
                </div>
              </div>

              {/* Input Process Output Section */}
              <div className="p-6 bg-neutral-900 text-white rounded-2xl space-y-3">
                <h4 className="font-black text-sm uppercase tracking-widest text-cyan-400">Conceptual Paradigm (IPO Model)</h4>
                <div className="grid md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
                    <span className="font-bold text-white block mb-1">Inputs:</span>
                    RGB Webcam Stream, Student Anthropometrics (Age, Gender, Height, Weight), Faculty Calibration baseline.
                  </div>
                  <div className="p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
                    <span className="font-bold text-white block mb-1">Processes:</span>
                    Vector dot-product calculus, ST-GCN Spatial Convolutions + Temporal Transformer Attention, Google Gemini 3.8 prescriptive analysis.
                  </div>
                  <div className="p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
                    <span className="font-bold text-white block mb-1">Outputs:</span>
                    Zero-bias repetition count, real-time posture correction cues, standardized DepEd rating, teacher analytics roster.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: ST-GCN & Pose Models Deep Learning */}
          {activeTab === 'deeplearning' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-indigo-900 text-xs sm:text-sm leading-relaxed">
                <strong>End-to-End Neural Architecture:</strong> MediaPipe Pose Landmarker extracts 33 spatial-temporal 3D anatomical landmarks per frame. These graph nodes are processed via Spatial Graph Convolutional Networks (ST-GCN) to capture skeletal kinetic connectivity, followed by a Temporal Self-Attention Transformer ($T=30$) to classify exercise action states, movement phases, and biomechanical faults in real time.
              </div>

              {/* 4-Stage Pipeline Diagram */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-900 text-white rounded-2xl border border-neutral-800 space-y-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">Stage 1</span>
                  <h4 className="font-black text-sm text-white">Landmark Extraction</h4>
                  <p className="text-xs text-neutral-400">
                    33 3D normalized coordinates $(x_i, y_i, z_i, v_i)$ extracted at 30–60 FPS with client-side WebAssembly inference.
                  </p>
                </div>

                <div className="p-4 bg-neutral-900 text-white rounded-2xl border border-neutral-800 space-y-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Stage 2</span>
                  <h4 className="font-black text-sm text-white">Spatial Graph Conv</h4>
                  <p className="text-xs text-neutral-400">
                    Neighborhood aggregation over adjacency matrix A (33×33) with 35 kinetic bone connections to encode postural geometry.
                  </p>
                </div>

                <div className="p-4 bg-neutral-900 text-white rounded-2xl border border-neutral-800 space-y-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Stage 3</span>
                  <h4 className="font-black text-sm text-white">Temporal Transformer</h4>
                  <p className="text-xs text-neutral-400">
                    Multi-Head Self-Attention over sliding window ($T=30$) identifying Eccentric, Concentric, and Isometric phases.
                  </p>
                </div>

                <div className="p-4 bg-neutral-900 text-white rounded-2xl border border-neutral-800 space-y-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Stage 4</span>
                  <h4 className="font-black text-sm text-white">Dual Classification</h4>
                  <p className="text-xs text-neutral-400">
                    Concurrent output of predicted exercise category (Softmax) and Biomechanical Fault Diagnostics with coaching cues.
                  </p>
                </div>
              </div>

              {/* Mathematical Formulations for ST-GCN and Transformer */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                    <Layers size={18} className="text-indigo-600" />
                    Spatial Graph Convolution (ST-GCN)
                  </div>
                  <div className="p-3 bg-neutral-900 text-cyan-300 font-mono text-xs rounded-xl overflow-x-auto">
                    {"H^(l+1) = σ( D̃^(-1/2) Ã D̃^(-1/2) H^(l) W^(l) )"}
                  </div>
                  <ul className="text-xs text-neutral-600 space-y-1.5 list-disc pl-4">
                    <li><strong>Ã = A + I_33:</strong> Adjacency matrix representing 35 human anatomical bone segments with self-loops.</li>
                    <li><strong>D̃:</strong> Degree matrix for normalized spatial feature scaling across asymmetrical limbs.</li>
                    <li><strong>W^(l):</strong> Learnable spatial weight kernel mapping 3D coordinates to high-dimensional kinetic features.</li>
                  </ul>
                </div>

                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
                    <Cpu size={18} className="text-blue-600" />
                    Temporal Multi-Head Self-Attention
                  </div>
                  <div className="p-3 bg-neutral-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto">
                    {"Attention(Q, K, V) = Softmax( (Q K^T) / √d_k ) V"}
                  </div>
                  <ul className="text-xs text-neutral-600 space-y-1.5 list-disc pl-4">
                    <li><strong>Q, K, V:</strong> Query, Key, Value matrices projected across 30 sequential kinematic frames.</li>
                    <li><strong>Temporal Positional Encoding:</strong> Injects chronological motion velocity into the sliding window.</li>
                    <li><strong>Phase Invariance:</strong> Recognizes exercises even if performed at varied speeds or cadences.</li>
                  </ul>
                </div>
              </div>

              {/* Comparative Pose Model Benchmark Matrix */}
              <div className="space-y-3">
                <h4 className="font-black text-sm text-neutral-900 uppercase tracking-wider">
                  Comparative Architecture Benchmark (ViTPose, RTMPose, YOLO-Pose, MediaPipe)
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-neutral-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-900 text-white font-bold">
                        <th className="p-3">Model Architecture</th>
                        <th className="p-3">Backbone Type</th>
                        <th className="p-3">Keypoints</th>
                        <th className="p-3">Real-time FPS</th>
                        <th className="p-3">Multi-Person</th>
                        <th className="p-3">Optimal Academic Defense Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      <tr className="hover:bg-neutral-50">
                        <td className="p-3 font-bold text-blue-600">MediaPipe Pose Landmarker</td>
                        <td className="p-3">BlazePose Two-Stage Detector</td>
                        <td className="p-3 font-mono">33 Keypoints (3D)</td>
                        <td className="p-3 text-emerald-600 font-bold">45–60 FPS</td>
                        <td className="p-3 text-neutral-500">Single User</td>
                        <td className="p-3 text-neutral-700">Primary client-side deployment; zero GPU requirement.</td>
                      </tr>
                      <tr className="hover:bg-neutral-50">
                        <td className="p-3 font-bold text-indigo-600">ViTPose (Vision Transformer)</td>
                        <td className="p-3">Plain Vision Transformer (ViT-B/L)</td>
                        <td className="p-3 font-mono">17 / 133 Keypoints</td>
                        <td className="p-3 text-yellow-600 font-bold">25–35 FPS</td>
                        <td className="p-3 text-emerald-600 font-bold">Top-down Multi</td>
                        <td className="p-3 text-neutral-700">High accuracy under self-occlusions and extreme angles.</td>
                      </tr>
                      <tr className="hover:bg-neutral-50">
                        <td className="p-3 font-bold text-cyan-600">RTMPose (SimCC)</td>
                        <td className="p-3">CSPNeXt Real-time Backbone</td>
                        <td className="p-3 font-mono">17 / 133 Keypoints</td>
                        <td className="p-3 text-emerald-600 font-bold">60–90 FPS</td>
                        <td className="p-3 text-emerald-600 font-bold">Supported</td>
                        <td className="p-3 text-neutral-700">Ultra-fast ballistic agility tracking with low latency.</td>
                      </tr>
                      <tr className="hover:bg-neutral-50">
                        <td className="p-3 font-bold text-orange-600">YOLO-Pose (YOLOv11)</td>
                        <td className="p-3">Single-Stage Anchor-Free CNN</td>
                        <td className="p-3 font-mono">17 Keypoints</td>
                        <td className="p-3 text-emerald-600 font-bold">50–70 FPS</td>
                        <td className="p-3 text-emerald-600 font-bold">Dense Crowd</td>
                        <td className="p-3 text-neutral-700">Gymnasium-scale batch fitness testing across entire classes.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Mathematics & Formulas */}
          {activeTab === 'mathematics' && (
            <div className="space-y-6">
              <div className="bg-neutral-900 text-white p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-black text-blue-400">1. Vector Joint Angle Calculus (Atan2 Formulation)</h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  For three skeletal keypoints A(x1, y1) (proximal joint), B(x2, y2) (vertex joint), and C(x3, y3) (distal joint):
                </p>
                <div className="p-4 bg-neutral-950 font-mono text-xs text-emerald-400 rounded-xl border border-neutral-800 overflow-x-auto">
                  angle = Math.abs(Math.atan2(v.y, v.x) - Math.atan2(u.y, u.x)) * (180 / Math.PI);<br/>
                  if (angle &gt; 180) angle = 360 - angle;
                </div>
                <p className="text-xs text-neutral-400">
                  Applied in Push-ups (Shoulder-Elbow-Wrist ≤ 90°), Curl-ups (Shoulder-Hip-Knee ≤ 105°), and Squats (Hip-Knee-Ankle ≤ 95°).
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                  <h4 className="font-bold text-neutral-900 text-sm">2. Push-Up State Machine & Spine Guard</h4>
                  <ul className="text-xs text-neutral-600 space-y-2 list-disc pl-4">
                    <li><strong>Down State:</strong> Elbow angle ≤ 90° AND Torso-Spine angle ≥ 160°.</li>
                    <li><strong>Up State:</strong> Elbow angle ≥ 160°.</li>
                    <li><strong>Anti-Cheating Guard:</strong> Sagging hips (Spine &lt; 150°) invalidate the repetition.</li>
                  </ul>
                </div>

                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                  <h4 className="font-bold text-neutral-900 text-sm">3. Vertical Jump Displacement</h4>
                  <ul className="text-xs text-neutral-600 space-y-2 list-disc pl-4">
                    <li><strong>Standing Baseline:</strong> Hip centroid Y-baseline averaged over calibration frames.</li>
                    <li><strong>Peak Flight:</strong> Max vertical delta from baseline position.</li>
                    <li><strong>Height:</strong> Scaled to metric centimeters using calibrated student height ratio.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Standards & Norms */}
          {activeTab === 'standards' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm">
                <strong>Pedagogical Benchmark Alignment:</strong> ExerFit maps real-time telemetry into recognized academic assessment frameworks:
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Body Composition", standard: "WHO (5-19 yrs) & CDC Percentiles", metric: "BMI Z-Scores & Growth Curves" },
                  { name: "Cardiovascular Endurance", standard: "YMCA 3-Minute Step Protocol", metric: "Cadence sync (96 BPM) & recovery index" },
                  { name: "Muscular Strength (Push-Up)", standard: "DepEd PFT Senior High Norms", metric: "Count of 90° validated repetitions" },
                  { name: "Muscular Endurance (Curl-Up)", standard: "DepEd Physical Fitness Manual", metric: "Continuous rhythmic 45° trunk flexions" },
                  { name: "Flexibility (Sit & Reach)", standard: "DepEd Centimeter Benchmark", metric: "Wrist-to-ankle reach extension delta" },
                  { name: "Balance (SLST)", standard: "Single-Leg Stance Protocol", metric: "Vestibular hold duration (seconds) with COG tracking" },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-blue-600">{item.standard}</span>
                    <h4 className="font-bold text-neutral-900 text-sm">{item.name}</h4>
                    <p className="text-xs text-neutral-500">{item.metric}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Panel Defense Q&A */}
          {activeTab === 'qa' && (
            <div className="space-y-4">
              {[
                {
                  q: "How does the system ensure student privacy with webcams active?",
                  a: "All neural network inference runs 100% on the client browser via WebAssembly (WASM). No raw video streams, frames, or biometric photos are ever sent to or stored on backend servers."
                },
                {
                  q: "What prevents students from cheating or doing shallow half-repetitions?",
                  a: "The system uses strict geometric vertex thresholding (e.g., precise 90° elbow angles for push-ups and 105° trunk angles for curl-ups) combined with multi-point spine alignment checks. Shallow movements fail the state machine transitions and are rejected."
                },
                {
                  q: "How does the platform handle varying student distances and heights?",
                  a: "A mandatory initial Camera Calibration step establishes a pixel-to-metric ratio based on the student's anthropometric profile. All displacement metrics calculate normalized relative ratios."
                },
                {
                  q: "Why is Google Gemini AI integrated into the assessment?",
                  a: "Gemini 3.8 Flash acts as a pedagogical reasoning engine. It evaluates the complete multi-component fitness profile to generate tailored, age-appropriate workout prescriptions and injury-prevention advice."
                }
              ].map((item, idx) => (
                <div key={idx} className="p-5 bg-neutral-50 border border-neutral-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-black text-sm">
                    <CheckCircle2 size={18} className="shrink-0 text-blue-600" />
                    <span>{item.q}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 pl-6 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Tech Stack & Security */}
          {activeTab === 'tech' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                  <h3 className="font-black text-neutral-900 text-sm flex items-center gap-2">
                    <Cpu size={18} className="text-blue-600" /> Software Architecture
                  </h3>
                  <ul className="text-xs text-neutral-600 space-y-2.5">
                    <li><strong>Frontend:</strong> React 18, TypeScript, Tailwind CSS, Motion.</li>
                    <li><strong>Computer Vision:</strong> Google MediaPipe Pose (33 3D Keypoints on WebAssembly).</li>
                    <li><strong>Backend Engine:</strong> Express.js REST API on Node.js.</li>
                    <li><strong>Database:</strong> PostgreSQL with Drizzle ORM (Automated DDL provisioning).</li>
                    <li><strong>AI Model:</strong> Google Gemini 3.8 Flash for prescriptive analytics.</li>
                  </ul>
                </div>

                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                  <h3 className="font-black text-neutral-900 text-sm flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" /> Security & Privacy Compliance
                  </h3>
                  <ul className="text-xs text-neutral-600 space-y-2.5">
                    <li><strong>Zero Video Telemetry:</strong> Frames processed in volatile memory only.</li>
                    <li><strong>JWT Token Authentication:</strong> SHA-256 hashed passwords & secure bearer headers.</li>
                    <li><strong>Role-Based Access Control:</strong> Strict separation of Teacher vs Student privileges.</li>
                    <li><strong>Non-Invasive Execution:</strong> Runs seamlessly on consumer webcams without wearable hardware.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between shrink-0 text-xs text-neutral-500 font-bold">
          <span>KFCG ExerFit • Physical Fitness Assessment System</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold transition-colors"
          >
            Close Hub
          </button>
        </div>
      </motion.div>
    </div>
  );
};
