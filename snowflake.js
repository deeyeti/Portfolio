/* ============================================
   Crystalline Snowflake Generator
   ============================================
   Procedural generative art inspired by natural
   ice crystal growth. Emphasizes mathematical
   symmetry, controlled randomness, and visual
   restraint.
   
   Architecture:
   - ParameterGenerator: Seeded randomness
   - GeometryBuilder: Pure structure definition
   - Renderer: Two-pass crystalline drawing
   - Animator: Progressive growth reveal
   ============================================ */

// ============================================
// Seeded Random Number Generator (Mulberry32)
// ============================================
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    range(min, max) {
        return min + this.next() * (max - min);
    }

    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    pick(array) {
        return array[Math.floor(this.next() * array.length)];
    }
}

// ============================================
// Snowflake Parameters
// ============================================
class SnowflakeParams {
    constructor(rng) {
        // Primary structure
        this.armLength = rng.range(0.75, 0.92);
        this.armTaper = rng.range(0.4, 0.7);

        // Secondary branches
        this.branchCount = rng.int(2, 4);
        this.branchPositions = this.generateBranchPositions(rng, this.branchCount);
        this.branchAngle = rng.range(0.45, 0.75); // radians
        this.branchLengthRatio = rng.range(0.28, 0.42);
        this.branchTaper = rng.range(0.5, 0.8);

        // Micro branches (tertiary)
        this.hasMicroBranches = rng.next() > 0.4;
        this.microBranchAngle = rng.range(0.3, 0.5);
        this.microBranchLength = rng.range(0.15, 0.25);

        // Tip style
        this.tipStyle = rng.pick(['fork', 'point', 'crystal']);
        this.tipAngle = rng.range(0.25, 0.45);
        this.tipLength = rng.range(0.12, 0.2);

        // Center
        this.centerRadius = rng.range(0.03, 0.06);
        this.hasInnerRing = rng.next() > 0.5;
        this.innerRingRadius = rng.range(0.08, 0.14);
    }

    generateBranchPositions(rng, count) {
        const positions = [];
        const minGap = 0.15;
        const startPos = rng.range(0.2, 0.35);

        for (let i = 0; i < count; i++) {
            const t = startPos + (i / count) * (0.75 - startPos);
            positions.push(t + rng.range(-0.03, 0.03));
        }

        return positions;
    }
}

// ============================================
// Geometry Builder
// ============================================
class SnowflakeGeometry {
    constructor(params) {
        this.params = params;
        this.segments = [];
        this.build();
    }

    build() {
        // Build one arm, will be rotated 6 times during render
        this.buildArm();
    }

    buildArm() {
        const p = this.params;

        // Primary spine
        this.addSegment({
            type: 'spine',
            level: 0,
            start: { x: 0, y: 0 },
            end: { x: p.armLength, y: 0 },
            taper: p.armTaper,
            growth: { start: 0, end: 0.6 }
        });

        // Secondary branches
        p.branchPositions.forEach((pos, i) => {
            const branchLen = p.branchLengthRatio * (1 - pos * 0.3);
            const baseX = pos * p.armLength;

            // Upper branch
            this.addSegment({
                type: 'branch',
                level: 1,
                start: { x: baseX, y: 0 },
                end: {
                    x: baseX + Math.cos(p.branchAngle) * branchLen * p.armLength,
                    y: -Math.sin(p.branchAngle) * branchLen * p.armLength
                },
                taper: p.branchTaper,
                growth: { start: 0.2 + pos * 0.3, end: 0.5 + pos * 0.3 }
            });

            // Lower branch (mirror)
            this.addSegment({
                type: 'branch',
                level: 1,
                start: { x: baseX, y: 0 },
                end: {
                    x: baseX + Math.cos(p.branchAngle) * branchLen * p.armLength,
                    y: Math.sin(p.branchAngle) * branchLen * p.armLength
                },
                taper: p.branchTaper,
                growth: { start: 0.2 + pos * 0.3, end: 0.5 + pos * 0.3 }
            });

            // Micro branches on secondary
            if (p.hasMicroBranches && i < p.branchCount - 1) {
                this.addMicroBranches(baseX, branchLen * p.armLength, p.branchAngle, pos);
            }
        });

        // Tip decoration
        this.buildTip();
    }

    addMicroBranches(baseX, parentLen, parentAngle, normalizedPos) {
        const p = this.params;
        const microLen = p.microBranchLength * p.armLength;

        // One micro branch per secondary branch
        const midPoint = 0.5;
        const mx = baseX + Math.cos(parentAngle) * parentLen * midPoint;
        const my = -Math.sin(parentAngle) * parentLen * midPoint;

        // Upper micro
        this.addSegment({
            type: 'micro',
            level: 2,
            start: { x: mx, y: my },
            end: {
                x: mx + Math.cos(parentAngle + p.microBranchAngle) * microLen,
                y: my - Math.sin(parentAngle + p.microBranchAngle) * microLen
            },
            taper: 0.9,
            growth: { start: 0.5 + normalizedPos * 0.2, end: 0.7 + normalizedPos * 0.2 }
        });

        // Mirror side
        this.addSegment({
            type: 'micro',
            level: 2,
            start: { x: mx, y: -my },
            end: {
                x: mx + Math.cos(parentAngle + p.microBranchAngle) * microLen,
                y: -my + Math.sin(parentAngle + p.microBranchAngle) * microLen
            },
            taper: 0.9,
            growth: { start: 0.5 + normalizedPos * 0.2, end: 0.7 + normalizedPos * 0.2 }
        });
    }

    buildTip() {
        const p = this.params;
        const tipX = p.armLength;

        if (p.tipStyle === 'fork') {
            const tipLen = p.tipLength * p.armLength;

            this.addSegment({
                type: 'tip',
                level: 1,
                start: { x: tipX, y: 0 },
                end: {
                    x: tipX + Math.cos(p.tipAngle) * tipLen,
                    y: -Math.sin(p.tipAngle) * tipLen
                },
                taper: 0.9,
                growth: { start: 0.7, end: 0.9 }
            });

            this.addSegment({
                type: 'tip',
                level: 1,
                start: { x: tipX, y: 0 },
                end: {
                    x: tipX + Math.cos(p.tipAngle) * tipLen,
                    y: Math.sin(p.tipAngle) * tipLen
                },
                taper: 0.9,
                growth: { start: 0.7, end: 0.9 }
            });
        } else if (p.tipStyle === 'crystal') {
            const tipLen = p.tipLength * p.armLength * 0.7;

            // Diamond shape
            this.addSegment({
                type: 'tip',
                level: 1,
                start: { x: tipX, y: 0 },
                end: { x: tipX + tipLen, y: 0 },
                taper: 0.95,
                growth: { start: 0.7, end: 0.95 }
            });
        }
        // 'point' style = no extra tip geometry
    }

    addSegment(segment) {
        this.segments.push(segment);
    }
}

// ============================================
// Crystalline Renderer
// ============================================
class SnowflakeRenderer {
    constructor(ctx, scale) {
        this.ctx = ctx;
        this.scale = scale;

        // Color palette
        this.colors = {
            shadow: 'rgba(30, 60, 90, 0.35)',
            base: 'rgba(140, 185, 220, 0.85)',
            highlight: 'rgba(220, 240, 255, 0.95)',
            glow: 'rgba(100, 180, 255, 0.15)',
            center: 'rgba(200, 230, 255, 0.9)'
        };

        // Light direction (simulated from top-left)
        this.lightAngle = -Math.PI / 4;
    }

    render(geometry, params, progress) {
        const ctx = this.ctx;

        // Clear and setup
        ctx.save();

        // Draw 6 rotated arms
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI * 2) / 6);
            this.renderArm(geometry.segments, progress);
            ctx.restore();
        }

        // Center decoration
        this.renderCenter(params, progress);

        ctx.restore();
    }

    renderArm(segments, progress) {
        const ctx = this.ctx;

        // Sort by level for proper layering
        const sorted = [...segments].sort((a, b) => b.level - a.level);

        sorted.forEach(seg => {
            const segProgress = this.calculateSegmentProgress(seg.growth, progress);
            if (segProgress <= 0) return;

            const animatedEnd = this.interpolatePoint(seg.start, seg.end, segProgress);

            // Calculate line weights based on level
            const baseWeight = this.getLineWeight(seg.level);
            const startWeight = baseWeight;
            const endWeight = baseWeight * seg.taper * segProgress;

            // Two-pass drawing for crystalline effect
            this.drawCrystalLine(seg.start, animatedEnd, startWeight, endWeight, seg.level);
        });
    }

    calculateSegmentProgress(growth, globalProgress) {
        if (globalProgress < growth.start) return 0;
        if (globalProgress > growth.end) return 1;
        return (globalProgress - growth.start) / (growth.end - growth.start);
    }

    interpolatePoint(start, end, t) {
        return {
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
        };
    }

    getLineWeight(level) {
        const weights = [3.5, 2.2, 1.2]; // spine, branch, micro
        return weights[level] || 1;
    }

    drawCrystalLine(start, end, startWeight, endWeight, level) {
        const ctx = this.ctx;
        const scale = this.scale;

        const x1 = start.x * scale;
        const y1 = start.y * scale;
        const x2 = end.x * scale;
        const y2 = end.y * scale;

        // Pass 1: Shadow/depth (offset slightly)
        ctx.beginPath();
        ctx.moveTo(x1 + 1, y1 + 1);
        ctx.lineTo(x2 + 1, y2 + 1);
        ctx.strokeStyle = this.colors.shadow;
        ctx.lineWidth = (startWeight + endWeight) / 2 + 1;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Pass 2: Base stroke
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = this.colors.base;
        ctx.lineWidth = (startWeight + endWeight) / 2;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Pass 3: Highlight (thinner, brighter)
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = this.colors.highlight;
        ctx.lineWidth = Math.max(0.8, (startWeight + endWeight) / 2 - 1.2);
        ctx.lineCap = 'round';
        ctx.stroke();

        // Node at junction points (subtle crystal effect)
        if (level === 0) {
            this.drawNode(x2, y2, endWeight * 0.6);
        }
    }

    drawNode(x, y, radius) {
        const ctx = this.ctx;

        // Subtle glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, 'rgba(180, 220, 255, 0.6)');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    renderCenter(params, progress) {
        const ctx = this.ctx;
        const scale = this.scale;

        if (progress < 0.05) return;

        const centerProgress = Math.min(1, progress / 0.3);
        const radius = params.centerRadius * scale * centerProgress;

        // Inner ring (if enabled)
        if (params.hasInnerRing && progress > 0.15) {
            const ringProgress = Math.min(1, (progress - 0.15) / 0.2);
            const ringRadius = params.innerRingRadius * scale * ringProgress;

            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = this.colors.base;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = this.colors.highlight;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }

        // Center hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6 - Math.PI / 6;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Fill with gradient
        const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        centerGrad.addColorStop(0, 'rgba(220, 245, 255, 0.9)');
        centerGrad.addColorStop(1, 'rgba(160, 210, 240, 0.7)');

        ctx.fillStyle = centerGrad;
        ctx.fill();

        ctx.strokeStyle = this.colors.highlight;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Central highlight dot
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
    }
}

// ============================================
// Animation Controller
// ============================================
class SnowflakeAnimator {
    constructor(duration = 2000) {
        this.duration = duration;
        this.startTime = null;
        this.progress = 0;
        this.isAnimating = false;
        this.rafId = null;
    }

    start(onFrame, onComplete) {
        this.stop();
        this.startTime = performance.now();
        this.isAnimating = true;

        const animate = (now) => {
            if (!this.isAnimating) return;

            const elapsed = now - this.startTime;
            this.progress = Math.min(1, elapsed / this.duration);

            // Easing: ease-out-cubic
            const easedProgress = 1 - Math.pow(1 - this.progress, 3);

            onFrame(easedProgress);

            if (this.progress < 1) {
                this.rafId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                if (onComplete) onComplete();
            }
        };

        this.rafId = requestAnimationFrame(animate);
    }

    stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.isAnimating = false;
    }
}

// ============================================
// Main Controller
// ============================================
class CrystallineSnowflake {
    constructor(canvasId, buttonId) {
        this.canvas = document.getElementById(canvasId);
        this.button = document.getElementById(buttonId);

        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.animator = new SnowflakeAnimator(2200);

        this.geometry = null;
        this.params = null;
        this.renderer = null;
        this.currentSeed = null;

        this.init();
    }

    init() {
        this.resize();
        this.setupEvents();

        // Generate initial snowflake after brief delay
        setTimeout(() => this.generate(), 300);

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height - 52);

        this.canvas.width = rect.width;
        this.canvas.height = rect.height - 52;

        this.scale = size * 0.45;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;

        // Recreate renderer with new scale
        if (this.params) {
            this.renderer = new SnowflakeRenderer(this.ctx, this.scale);
            this.render(1);
        }
    }

    setupEvents() {
        if (this.button) {
            this.button.addEventListener('click', () => this.generate());
        }
    }

    generate(seed = null) {
        // Stop any running animation
        this.animator.stop();

        // Create or use provided seed
        this.currentSeed = seed !== null ? seed : Math.floor(Math.random() * 1000000);

        // Generate with seeded randomness
        const rng = new SeededRandom(this.currentSeed);
        this.params = new SnowflakeParams(rng);
        this.geometry = new SnowflakeGeometry(this.params);
        this.renderer = new SnowflakeRenderer(this.ctx, this.scale);

        // Animate growth
        this.animator.start(
            (progress) => this.render(progress),
            () => console.log('Snowflake complete. Seed:', this.currentSeed)
        );
    }

    render(progress) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear with dark background
        ctx.fillStyle = '#040810';
        ctx.fillRect(0, 0, w, h);

        // Subtle ambient glow
        const ambientGlow = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.scale * 1.2
        );
        ambientGlow.addColorStop(0, 'rgba(60, 130, 180, 0.06)');
        ambientGlow.addColorStop(0.5, 'rgba(40, 100, 150, 0.03)');
        ambientGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = ambientGlow;
        ctx.fillRect(0, 0, w, h);

        // Center and render
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        this.renderer.render(this.geometry, this.params, progress);
        ctx.restore();
    }

    // Utility: regenerate with same seed
    regenerate() {
        if (this.currentSeed !== null) {
            this.generate(this.currentSeed);
        }
    }
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.snowflakeGenerator = new CrystallineSnowflake(
            'snowflake-canvas',
            'generate-snowflake'
        );
    }, 300);
});
