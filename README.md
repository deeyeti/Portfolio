# 🚀 Om Thombre | Creative Developer Portfolio

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Tech](https://img.shields.io/badge/tech-WebGL%20%7C%20GSAP%20%7C%20Three.js-yellow) ![Deployment](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel&logoColor=white) ![Vibe](https://img.shields.io/badge/vibe-Immersive-purple)

Welcome to the repository of my personal portfolio website. This isn't just a resume; it's a playground of **Creative Technology**, blending high-performance animations, procedural generation, and custom WebGL shaders to showcase my journey in CS.

---

## 🎨 Visual Aesthetics
The design language is built around a **"Cyber-Future"** aesthetic:
* **Palette:** Deep Void Black (`#0a0a0f`) & Neon Cyan (`#38bdf8`).
* **Typography:** A mix of *Instrument Serif* (Classy), *Syne* (Display), and *Space Grotesk* (Technical).
* **Atmosphere:** Grainy noise overlays and ambient light gradients create a tactile, cinematic feel.

---

## 🛠 Tech Stack

We keep it raw and performant. No heavy frameworks, just pure creative code.

* **Core:** HTML5, CSS3 (CSS Variables & Flex/Grid), Vanilla JavaScript (ES6+).
* **3D & Graphics:** [Three.js](https://threejs.org/) (WebGL), Custom GLSL Shaders.
* **Animation:** [GSAP](https://greensock.com/gsap/) (ScrollTrigger, ScrollSmoother).
* **Generative Art:** HTML5 Canvas API.
* **Hosting & CI/CD:** [Vercel](https://vercel.com/) (Edge Network).

---

## 🧠 Under the Hood: Technical Deep Dive

### 1. The Shaders (`shaders.js` & `logo3d.js`)
Instead of using standard CSS filters, I wrote custom WebGL programs to handle visual distortions.

* **Liquid Image Distortion:**
    * Uses a **fragment shader** to manipulate texture coordinates (`uv`).
    * Calculates the distance between the cursor and pixels to create a sine-wave ripple effect.
    * *Code Highlight:* The shader creates a "lens" effect by normalizing vectors from the mouse position and applying a radial offset.
* **The 3D Logo:**
    * This is **not** a loaded `.obj` file. The logo is procedurally generated using `THREE.ExtrudeGeometry` based on custom `THREE.Shape` paths.
    * **The ShaderMaterial:** The logo uses a custom shader that calculates pixelation based on a "click pulse." When you click the logo, a uniform `uClickPulse` triggers a shockwave that temporarily lowers the resolution (pixelates) the geometry via `floor(pos * pixels) / pixels`.

### 2. Generative Snowflakes (`snowflake.js`)
This is a procedural generation engine inspired by natural ice crystal growth.

* **Architecture:**
    * `SeededRandom`: A linear congruential generator (LCG) ensures that if you like a snowflake, the "seed" will always reproduce that exact shape.
    * **Recursive Growth:** The renderer draws a primary spine, then calculates secondary and tertiary (micro) branches based on randomized angles and taper ratios.
    * **Symmetry:** It calculates geometry for *one* arm and rotates the canvas context 6 times (60°) to create perfect hexagonal symmetry.

### 3. The Physics Game (`game.js`)
A lightweight, canvas-based "Catch the Blocks" game tucked into the codebase. (try spam clicking the logo ;)
* **Game Loop:** Uses `requestAnimationFrame` for a smooth 60fps loop.
* **Collision Detection:** AABB (Axis-Aligned Bounding Box) collision logic checks intersections between the falling block arrays and the player's paddle.
* **Particle System:** When a block is caught, it spawns a burst of particles that decay in alpha over time.

### 4. Interactive UI & Physics (`app.js`)
* **Magnetic Elements:** Buttons don't just sit there. They calculate the mouse delta from the button center and `lerp` (linear interpolate) the button's position towards the mouse, creating a magnetic "stickiness".
* **Parallax:** Elements move at different speeds relative to the scroll position using GSAP ScrollTriggers, creating a sense of depth (Z-axis).

---

## 📂 File Structure

```bash
/
├── index.html          # The semantic skeleton
├── styles.css          # 1000+ lines of hand-crafted CSS variables & animations
├── app.js              # Main logic: GSAP, Loading, DOM manipulation
├── shaders.js          # 2D Canvas ripples & WebGL Image distortion
├── logo3d.js           # The Three.js scene & GLSL shader code for the logo
├── snowflake.js        # The procedural generation engine
├── game.js             # Canvas-based mini-game logic
└── assets/             # Images & Icons
