# 🎓 KFCG ExerFit: AI-Powered Gamified Physical Fitness Assessment System
## Comprehensive Thesis Defense Master Manuscript & Technical Documentation

---

## 1. Executive Summary & Research Title

* **Title**: *KFCG ExerFit: A 3-Layer Computer Vision-Based Gamified Physical Fitness Assessment System with Real-Time Kinematic Validation and DepEd/WHO Pedagogical Metric Standardization*
* **Domain**: Computer Vision, Human-Computer Interaction (HCI), Educational Technology, Sports Science & Physical Education.
* **Core Technological Innovation**: Eliminating subjective manual grading in Physical Fitness Tests (PFT) through a non-invasive, browser-based, multi-stage pose estimation framework with real-time joint-angle tracking, 3D kinematic vector displacement, and age/gender-adjusted percentile classification.

---

## 2. Research Background & Problem Statement

### 2.1 The Problem
In traditional physical education (PE) curricula (including Philippine Department of Education / DepEd Physical Fitness Testing and international CDC/WHO guidelines):
1. **Subjective & Inaccurate Measurement**: Physical education teachers must simultaneously supervise, record, and judge 40–50 students in a single class period. Human visual estimation cannot accurately measure joint angles (e.g., precise 90° elbow flexion in push-ups or 45° trunk elevation in curl-ups), leading to high inter-rater variability and false positive repetitions.
2. **Pedagogical Disengagement**: Traditional fitness testing is viewed by students as monotonous, intimidating, and stressful, resulting in low motivation, improper form, and elevated risk of muscular strain.
3. **Logistical Burden & Lack of Real-time Form Correction**: Physical educators lack the tools to deliver immediate kinematic feedback to every student during the movement execution phase.
4. **Data Fragmentation**: PFT records are traditionally transcribed on paper, causing delayed analysis, data loss, and difficulties in identifying pediatric students at cardiovascular or musculoskeletal risk.

### 2.2 The Proposed Solution: KFCG ExerFit
KFCG ExerFit resolves these issues through a **3-Layer Architecture**:
* **Layer 1 (The Exergame Motivation Layer)**: Translates standard fitness protocols into high-engagement interactive exercises (e.g., Starburst Metronome catching, Asteroid Dodging, Energy Bar Ascents, Jump Flight Velocity gauges).
* **Layer 2 (The AI Computer Vision & Kinematics Layer)**: Uses on-device, privacy-preserving Google MediaPipe Pose (33 3D skeletal keypoints) running at 30–60 FPS with zero video upload to servers.
* **Layer 3 (The Validated Metric & Clinical Standardization Layer)**: Normalizes raw keypoint telemetry into pediatric-corrected WHO growth percentiles, YMCA 3-Minute Step cardiovascular grades, Single-Leg Stance Test (SLST) vestibular ratings, and DepEd PFT performance bands.

---

## 3. Theoretical & Conceptual Framework

### 3.1 The Input-Process-Output (IPO) Model

```
┌────────────────────────────────┐     ┌────────────────────────────────┐     ┌────────────────────────────────┐
│             INPUT              │     │            PROCESS             │     │             OUTPUT             │
├────────────────────────────────┤     ├────────────────────────────────┤     ├────────────────────────────────┤
│ • Web Camera Video Stream      │     │ • MediaPipe 33-Keypoint Pose   │     │ • Real-Time Form Correction    │
│ • Student Anthropometrics      │ ──> │ • 3-Point Joint Angle Calculus │ ──> │ • Validated Repetition Counts  │
│   (Age, Gender, Height, Weight)│     │ • Kinematic Velocity Tracking  │     │ • DepEd / WHO Fitness Scores   │
│ • PE Faculty Video Tutorials   │     │ • Anti-Cheating & Form Filters │     │ • AI Pedagogical Prescriptions │
│ • Target Calibration Baseline  │     │ • Gemini 3.8 Reasoning Model   │     │ • Class Analytics & Leaderboard│
└────────────────────────────────┘     └────────────────────────────────┘     └────────────────────────────────┘
```

### 3.2 3-Layer Structural Framework

| Layer | System Function | Mathematical & Algorithmic Process |
| :--- | :--- | :--- |
| **Layer 1: Exergame Interface** | Gamified movement motivation and interactive visual feedback | Canvas particle physics, dynamic target collision bounding boxes, audio metronome sync ($96\text{ BPM}$). |
| **Layer 2: AI Computer Vision** | Skeletal detection, landmark confidence filtering, angle verification | Vector algebra on 3D coordinates $(x, y, z)$, Euclidean distance displacement, numerical differentiation for velocity ($v = \Delta y / \Delta t$). |
| **Layer 3: Clinical / Educational Standard** | Normative classification and prescriptive analytics | CDC/WHO age-specific BMI-for-age percentiles, YMCA Step Test cardiovascular index, DepEd Senior High PFT scoring tables. |

---

## 4. Mathematical Formulations & Algorithmic Architecture

### 4.1 Joint Angle Calculation (Shoulder-Elbow-Wrist / Hip-Knee-Ankle)
For any three 3D keypoints $A(x_1, y_1)$, $B(x_2, y_2)$ (the vertex joint), and $C(x_3, y_3)$:

$$\vec{u} = \vec{A} - \vec{B} = (x_1 - x_2, y_1 - y_2)$$
$$\vec{v} = \vec{C} - \vec{B} = (x_3 - x_2, y_3 - y_2)$$

The interior angle $\theta$ in degrees is calculated via the dot product and 2D determinant (atan2 formulation):

$$\theta = \left| \operatorname{atan2}(u_x v_y - u_y v_x, \; u_x v_x + u_y v_y) \times \frac{180}{\pi} \right|$$

$$\text{If } \theta > 180^\circ \implies \theta = 360^\circ - \theta$$

### 4.2 State-Machine Repetition Validation (Push-Ups & Curl-Ups)
To prevent false-positive rep counting and cheat gestures:
* **Push-Up State Machine**:
  * **Down State Trigger**: $\theta_{\text{elbow}} \le 90^\circ$ **AND** $\theta_{\text{torso-hip-knee}} \ge 160^\circ$ (ensures straight back, rejects sagging hips).
  * **Up State Trigger**: $\theta_{\text{elbow}} \ge 160^\circ$.
  * **Rep Confirmation**: $\text{Rep} \leftarrow \text{Rep} + 1$ only when transitioning `UP` $\rightarrow$ `DOWN` $\rightarrow$ `UP`.
* **Curl-Up State Machine**:
  * **Down State**: $\theta_{\text{shoulder-hip-knee}} \ge 140^\circ$.
  * **Up State**: $\theta_{\text{shoulder-hip-knee}} \le 105^\circ$ **AND** $\theta_{\text{knee}} \approx 90^\circ$.

### 4.3 Vertical Jump Displacement & Flight Kinematics
* **Baseline Reference**: $\bar{y}_{\text{hip, standing}}$ averaged over $60$ calibration frames ($2\text{ seconds}$).
* **Peak Flight Displacement**:

$$\Delta y_{\text{max}} = \max_{t} (\bar{y}_{\text{hip, baseline}} - y_{\text{hip}}(t))$$

* **Calibrated Jump Height**:

$$H_{\text{jump}} (\text{cm}) = \Delta y_{\text{max}} \times \left(\frac{H_{\text{student}}(\text{cm})}{\text{Pixel Height}_{\text{standing}}}\right)$$

### 4.4 Center-of-Gravity (COG) Sway & Vestibular Balance Index
Monitors bilateral ankle ground-clearance and hip centroid sway velocity:

$$\text{COG}_{\text{sway}} = \sqrt{(x_{\text{hip}} - x_{\text{baseline}})^2 + (y_{\text{hip}} - y_{\text{baseline}})^2}$$

$$\text{Balance Score} = \max\left(0, 100 - \frac{1}{T}\int_{0}^{T} \text{COG}_{\text{sway}}(t) \, dt \times k\right)$$

---

## 5. Fitness Component Battery Breakdown

| # | Fitness Component | Layer 1: Exergame Mechanic | Layer 2: Computer Vision Keypoints | Layer 3: Evaluation Benchmark |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Body Composition** | Interactive Body-Axis Alignment Box | Bilateral Shoulders (11, 12), Hips (23, 24), Ankles (27, 28) | WHO/CDC Pediatric BMI Percentiles |
| **2** | **Cardiovascular Endurance** | Starburst Metronome (Step side-to-side) | Left/Right Ankles (27, 28), Knees (25, 26) | YMCA 3-Min Step Test Index |
| **3** | **Muscular Strength** | Energy Power Bar Ascent (Push-ups) | Shoulders (11, 12), Elbows (13, 14), Wrists (15, 16) | Standard 90° Push-Up DepEd Norms |
| **4** | **Muscular Endurance** | Glowing Geometric Arch (Curl-ups) | Shoulders (11, 12), Hips (23, 24), Knees (25, 26) | DepEd Curl-Up Normative Tables |
| **5** | **Flexibility** | Dynamic Toe-Reach Extension Bar | Wrists (15, 16) to Ankles (27, 28) Displacement | Sit-and-Reach Centimeter Scale |
| **6** | **Agility** | Asteroid Hazard Dodge Game | Torso Midpoint, Lateral Hip Velocity ($\Delta x / \Delta t$) | Standard Agility Shuttle-Run Metric |
| **7** | **Balance** | Target Stability Ring (Single-Leg Stance) | Single Leg Stance, Trunk Center of Gravity Deviation | Single-Leg Stance Test (SLST) Seconds |
| **8** | **Coordination** | Multi-Quadrant Target Strike | Real-time Wrist Keypoint Bounding Box Intersections | Target Capture Accuracy & Hit Rate |
| **9** | **Power** | Vertical Flight Power Gauge | Hip Center Peak Vertical Displacement ($\Delta y_{\text{max}}$) | Vertical Jump Height ($cm$) / Watt Power |
| **10**| **Speed & Reaction** | Rapid Visual Stimulus Tap / Fast Feet | Response Latency ($\Delta t$ ms) & Step Frequency (SPM) | Reaction Time ($ms$) & Cadence (SPM) |

---

## 6. System Architecture & Technological Stack

* **Client / Frontend**:
  * React 18, TypeScript, Tailwind CSS, Motion (Framer Motion).
  * `@mediapipe/pose` for real-time edge neural inference on WebGL / WebAssembly.
  * Canvas 2D / WebGL rendering for 60 FPS gamification overlays.
* **Server / Backend**:
  * Node.js & Express.js RESTful API architecture.
  * Google Gemini AI API (`gemini-3.8-flash`) for automated individualized pedagogical feedback generation.
* **Database & Persistence**:
  * PostgreSQL with Drizzle ORM (Automated schema generation, zero-downtime table initialization, connection pooling).
  * Cloud-ready for Neon.tech, Supabase, Render, Railway, Docker, or Localhost.

---

## 7. Defense Panel Frequently Asked Questions (Q&A)

### Q1: How does your system ensure privacy if cameras are running?
> **Answer**: All computer vision processing occurs **100% on-device (client-side)** within the student's browser using Google MediaPipe WebAssembly. No video frames, image files, or camera streams are ever transmitted to or stored on our servers. Only numerical scalar results (repetition count, joint angles, duration) are saved.

### Q2: What happens if a student tries to cheat (e.g., nodding their head instead of doing a full curl-up)?
> **Answer**: The system enforces **multi-joint geometric constraints**. For curl-ups, it measures the true shoulder-hip-knee angle ($\theta \le 105^\circ$) while verifying that the feet remain planted ($\text{ankle coordinate delta} \approx 0$). Head movements alone do not satisfy the mathematical vertex requirements and will not increment the counter.

### Q3: How does the system handle students of different heights or camera distances?
> **Answer**: The system includes a mandatory **Calibration Step** prior to any test. The student stands in the posture box to establish a relative pixel-to-metric ratio based on their reported height. All displacement formulas calculate normalized ratios ($\Delta y / \text{Height}_{\text{standing}}$), rendering the system invariant to camera distance.

### Q4: How is the YMCA Cardiovascular test simulated without a physical step bench?
> **Answer**: The system utilizes an audio metronome ($96\text{ BPM}$) with alternating lateral target nodes (Starburst Exergame). It tracks lower-extremity cycling speed, vertical knee lifts, and step cadence consistency across the full time domain to compute the cardiovascular endurance score.

### Q5: What makes this superior to a fitness mobile app?
> **Answer**: Most commercial apps either count raw device accelerations (which cannot verify proper exercise posture) or provide unstandardized grading. KFCG ExerFit implements full kinematic angle checking tied directly to academic DepEd/WHO Physical Education standards, coupled with an integrated Teacher Faculty Dashboard for institutional gradebook management.

---

## 8. Summary of Research Contributions

1. **Standardized Kinematic Verification**: Replaces human subjective bias with deterministic geometric angle validation.
2. **Pedagogical Gamification**: Increases student engagement through immediate visual feedback and exergame incentives.
3. **Automated Faculty Workload Reduction**: Generates instantaneous class rosters, rank lists, and automated AI fitness prescriptions.
4. **Accessible Zero-Cost Infrastructure**: Runs in any standard web browser on ordinary laptops and desktop webcams without requiring expensive wearable sensors or specialized hardware.
