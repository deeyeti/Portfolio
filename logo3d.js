/* ============================================
   3D Logo Shader - Vanilla Three.js Version
   Converted from Logo3DShader.tsx
   ============================================ */

class Logo3DScene {
    constructor(container) {
        this.container = container;
        this.time = 0;
        this.clickPulse = 0;
        this.clickTime = 0;

        // Hover state
        this.isHovering = false;
        this.hoverIntensity = 0;

        // Drag state
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragRotation = { x: 0, y: 0 };
        this.baseRotation = { x: 0, y: 0 };

        // Easter egg - rapid click detection
        this.rapidClicks = [];
        this.rapidClickThreshold = 7;
        this.rapidClickWindow = 2000; // 2 seconds

        this.init();
        this.createLogo();
        this.createParticles();
        this.createOrbitRings();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera - positioned for full-page view
        this.camera = new THREE.PerspectiveCamera(45, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
        this.camera.position.z = 6;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x60a5fa, 1.5);
        pointLight1.position.set(10, 10, 10);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x38bdf8, 0.8);
        pointLight2.position.set(-10, -10, -10);
        this.scene.add(pointLight2);

        const pointLight3 = new THREE.PointLight(0x7dd3fc, 0.6);
        pointLight3.position.set(0, 10, 0);
        this.scene.add(pointLight3);

        // Logo group - positioned based on screen size
        this.logoGroup = new THREE.Group();
        this.updateLogoPosition();
        this.scene.add(this.logoGroup);
    }

    updateLogoPosition() {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

        if (isMobile) {
            // Center the logo on mobile, scale down
            this.logoGroup.position.x = 0;
            this.logoGroup.scale.setScalar(0.65);
            this.camera.position.z = 7;
        } else if (isTablet) {
            // Slightly offset on tablet
            this.logoGroup.position.x = 0.8;
            this.logoGroup.scale.setScalar(0.85);
            this.camera.position.z = 6.5;
        } else {
            // Normal desktop position
            this.logoGroup.position.x = 1.8;
            this.logoGroup.scale.setScalar(1);
            this.camera.position.z = 6;
        }
    }

    createGradientMaterial() {
        return new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vWorldPos;
                uniform float uTime;
                uniform float uHover;
                
                void main() {
                    vPosition = position;
                    vNormal = normalize(normalMatrix * normal);
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPos = worldPos.xyz;
                    
                    vec3 pos = position;
                    
                    // Gentle wave displacement
                    float wave = sin(pos.y * 3.0 + uTime * 1.5) * 0.01;
                    pos.z += wave;
                    
                    // Subtle hover scale
                    pos *= 1.0 + uHover * 0.02;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vWorldPos;
                uniform float uTime;
                uniform float uHover;
                uniform float uClickPulse;
                uniform vec2 uClickPoint;
                uniform float uEasterEggProgress;
                
                // Pixelation function
                vec3 pixelate(vec3 pos, float pixels) {
                    return floor(pos * pixels) / pixels;
                }
                
                void main() {
                    // Distance from click point
                    float clickDist = length(vPosition.xy - uClickPoint);
                    
                    // Slow, calm ripple wave from click point
                    float rippleRadius = uTime * 0.8; // Slower expansion
                    float rippleWave = sin(clickDist * 10.0 - uTime * 4.0) * 0.5 + 0.5;
                    
                    // Wider, softer ripple band
                    float rippleMask = smoothstep(rippleRadius - 0.3, rippleRadius + 0.2, clickDist) * 
                                       smoothstep(rippleRadius + 1.2, rippleRadius + 0.3, clickDist);
                    rippleMask *= uClickPulse;
                    rippleMask = smoothstep(0.0, 1.0, rippleMask);
                    
                    // More visible pixelation
                    float pixelSize = 8.0 + rippleMask * 6.0;
                    vec3 pixelPos = pixelate(vPosition, pixelSize);
                    
                    // Smooth gradient from bottom to top
                    float t = (vPosition.y + 1.2) / 2.4;
                    t = clamp(t, 0.0, 1.0);
                    
                    // Pixelated t for ripple areas - more visible steps
                    float tPixel = (pixelPos.y + 1.2) / 2.4;
                    tPixel = floor(tPixel * 4.0) / 4.0; // Fewer steps = larger, more visible pixels
                    
                    // Stronger pixelation blend
                    float tFinal = mix(t, tPixel, rippleMask * 0.75);
                    
                    // Easter egg progress lightening (0.0 to 1.0)
                    float eggLight = uEasterEggProgress * 0.4;
                    
                    // Rich blue gradient colors - lighten based on easter egg progress
                    vec3 bottomColor = vec3(0.05, 0.15, 0.35) + vec3(eggLight * 0.3, eggLight * 0.4, eggLight * 0.5);
                    vec3 midColor1 = vec3(0.1, 0.35, 0.65) + vec3(eggLight * 0.25, eggLight * 0.35, eggLight * 0.45);
                    vec3 midColor2 = vec3(0.2, 0.55, 0.85) + vec3(eggLight * 0.2, eggLight * 0.25, eggLight * 0.35);
                    vec3 topColor = vec3(0.4, 0.75, 1.0) + vec3(eggLight * 0.15, eggLight * 0.15, eggLight * 0.15);
                    
                    // Gradient interpolation
                    vec3 color;
                    if (tFinal < 0.33) {
                        color = mix(bottomColor, midColor1, tFinal / 0.33);
                    } else if (tFinal < 0.66) {
                        color = mix(midColor1, midColor2, (tFinal - 0.33) / 0.33);
                    } else {
                        color = mix(midColor2, topColor, (tFinal - 0.66) / 0.34);
                    }
                    
                    // Easter egg excitement glow - pulsing faster as you get closer
                    float eggPulseSpeed = 3.0 + uEasterEggProgress * 12.0;
                    float eggPulse = sin(uTime * eggPulseSpeed) * 0.5 + 0.5;
                    color += vec3(0.15, 0.25, 0.4) * uEasterEggProgress * eggPulse * 0.6;
                    

                    
                    // More visible pixel grid lines
                    float gridX = step(0.82, fract(vPosition.x * pixelSize));
                    float gridY = step(0.82, fract(vPosition.y * pixelSize));
                    color *= 1.0 - (gridX + gridY) * 0.25 * rippleMask;
                    
                    // Soft glow on ripple wave
                    float softRipple = rippleWave * rippleMask;
                    color += vec3(0.15, 0.25, 0.4) * softRipple * 0.35;
                    
                    // Subtle shimmer
                    float shimmer = sin(vPosition.x * 10.0 + vPosition.y * 10.0 + uTime * 3.0) * 0.5 + 0.5;
                    color += vec3(0.05, 0.1, 0.15) * shimmer * 0.15;
                    
                    // Hover glow
                    color += vec3(0.1, 0.2, 0.3) * uHover * 0.25;
                    
                    // Gentle glow at click point (not a flash)
                    float clickGlow = exp(-clickDist * 2.0) * uClickPulse * 0.3;
                    color += vec3(0.2, 0.4, 0.6) * clickGlow;
                    
                    // Fresnel edge glow - intensify with easter egg progress
                    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
                    color += vec3(0.2, 0.5, 0.8) * fresnel * (0.3 + uHover * 0.2 + uEasterEggProgress * 0.5);
                    
                    // Subtle animated glow
                    float pulse = sin(uTime * 1.0) * 0.5 + 0.5;
                    color += vec3(0.02, 0.05, 0.08) * pulse;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uHover: { value: 0 },
                uClickPulse: { value: 0 },
                uClickPoint: { value: new THREE.Vector2(0, 0) },
                uEasterEggProgress: { value: 0 }
            },
            side: THREE.DoubleSide
        });
    }

    createLogo() {
        const s = 1.2;
        this.gradientMaterial = this.createGradientMaterial();

        // Base shape (stem + horizontal + outer prongs)
        const baseShape = new THREE.Shape();
        baseShape.moveTo(-0.1 * s, -0.9 * s);
        baseShape.lineTo(0.1 * s, -0.9 * s);
        baseShape.lineTo(0.1 * s, -0.1 * s);
        baseShape.lineTo(0.45 * s, -0.1 * s);
        baseShape.lineTo(0.45 * s, 0.7 * s);
        baseShape.lineTo(0.25 * s, 0.7 * s);
        baseShape.lineTo(0.25 * s, 0.1 * s);
        baseShape.lineTo(-0.25 * s, 0.1 * s);
        baseShape.lineTo(-0.25 * s, 0.7 * s);
        baseShape.lineTo(-0.45 * s, 0.7 * s);
        baseShape.lineTo(-0.45 * s, -0.1 * s);
        baseShape.lineTo(-0.1 * s, -0.1 * s);
        baseShape.lineTo(-0.1 * s, -0.9 * s);

        const extrudeSettings = {
            steps: 6,
            depth: 0.4,
            bevelEnabled: true,
            bevelThickness: 0.06,
            bevelSize: 0.04,
            bevelOffset: 0,
            bevelSegments: 4,
        };

        const baseGeometry = new THREE.ExtrudeGeometry(baseShape, extrudeSettings);
        const baseMesh = new THREE.Mesh(baseGeometry, this.gradientMaterial);
        baseMesh.position.z = -0.2;
        this.logoGroup.add(baseMesh);

        // Middle stem (i body)
        const middleStemShape = new THREE.Shape();
        middleStemShape.moveTo(-0.1 * s, 0.1 * s);
        middleStemShape.lineTo(0.1 * s, 0.1 * s);
        middleStemShape.lineTo(0.1 * s, 0.5 * s);
        middleStemShape.lineTo(-0.1 * s, 0.5 * s);
        middleStemShape.lineTo(-0.1 * s, 0.1 * s);

        const middleStemGeometry = new THREE.ExtrudeGeometry(middleStemShape, {
            steps: 4,
            depth: 0.4,
            bevelEnabled: true,
            bevelThickness: 0.06,
            bevelSize: 0.04,
            bevelOffset: 0,
            bevelSegments: 4,
        });
        const middleStemMesh = new THREE.Mesh(middleStemGeometry, this.gradientMaterial);
        middleStemMesh.position.z = -0.2;
        this.logoGroup.add(middleStemMesh);

        // Middle dot (i dot)
        const middleDotShape = new THREE.Shape();
        middleDotShape.moveTo(-0.1 * s, 0.65 * s);
        middleDotShape.lineTo(0.1 * s, 0.65 * s);
        middleDotShape.lineTo(0.1 * s, 0.85 * s);
        middleDotShape.lineTo(-0.1 * s, 0.85 * s);
        middleDotShape.lineTo(-0.1 * s, 0.65 * s);

        const middleDotGeometry = new THREE.ExtrudeGeometry(middleDotShape, {
            steps: 4,
            depth: 0.4,
            bevelEnabled: true,
            bevelThickness: 0.06,
            bevelSize: 0.04,
            bevelOffset: 0,
            bevelSegments: 4,
        });
        const middleDotMesh = new THREE.Mesh(middleDotGeometry, this.gradientMaterial);
        middleDotMesh.position.z = -0.2;
        this.logoGroup.add(middleDotMesh);

        // Outer glow effects
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.12,
            side: THREE.BackSide
        });

        const baseGlow = new THREE.Mesh(baseGeometry, glowMaterial);
        baseGlow.position.z = -0.2;
        baseGlow.scale.setScalar(1.04);
        this.logoGroup.add(baseGlow);
        this.glowMesh = baseGlow;

        const stemGlow = new THREE.Mesh(middleStemGeometry, glowMaterial);
        stemGlow.position.z = -0.2;
        stemGlow.scale.setScalar(1.04);
        this.logoGroup.add(stemGlow);

        const dotGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x60d5ff,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const dotGlow = new THREE.Mesh(middleDotGeometry, dotGlowMaterial);
        dotGlow.position.z = -0.2;
        dotGlow.scale.setScalar(1.04);
        this.logoGroup.add(dotGlow);

        // Wireframe overlay
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x7dd3fc,
            wireframe: true,
            transparent: true,
            opacity: 0.08
        });
        const wireframe = new THREE.Mesh(baseGeometry, wireframeMaterial);
        wireframe.position.z = -0.2;
        wireframe.scale.setScalar(1.01);
        this.logoGroup.add(wireframe);
    }

    createParticles() {
        const count = 600; // More particles for full-page
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const radius = 2 + Math.random() * 5; // Larger spread
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            // Offset particles to center around logo position
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta) + 1.8;
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            const blueVariant = Math.random();
            colors[i3] = 0.2 + blueVariant * 0.4;
            colors[i3 + 1] = 0.5 + blueVariant * 0.4;
            colors[i3 + 2] = 0.85 + Math.random() * 0.15;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.04,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createOrbitRings() {
        // Offset rings to center around logo
        const offsetX = 1.8;

        const ring1Geometry = new THREE.TorusGeometry(2.8, 0.01, 16, 100);
        const ring1Material = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.35 });
        this.ring1 = new THREE.Mesh(ring1Geometry, ring1Material);
        this.ring1.position.x = offsetX;
        this.scene.add(this.ring1);

        const ring2Geometry = new THREE.TorusGeometry(3.2, 0.008, 16, 100);
        const ring2Material = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 });
        this.ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
        this.ring2.position.x = offsetX;
        this.scene.add(this.ring2);

        const ring3Geometry = new THREE.TorusGeometry(3.6, 0.006, 16, 100);
        const ring3Material = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.15 });
        this.ring3 = new THREE.Mesh(ring3Geometry, ring3Material);
        this.ring3.position.x = offsetX;
        this.scene.add(this.ring3);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());

        // Raycaster for click detection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clickPulse = 0;
        this.clickTime = 0;
        this.clickPoint = new THREE.Vector2(0, 0);

        // Hover detection
        this.container.addEventListener('mouseenter', () => {
            this.isHovering = true;
        });

        this.container.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.isDragging = false;
        });

        // Click to trigger ripple at click point
        this.container.addEventListener('click', (e) => {
            // Easter egg - track rapid clicks (any click on container counts)
            const now = Date.now();
            this.rapidClicks.push(now);

            // Remove old clicks outside the time window
            this.rapidClicks = this.rapidClicks.filter(
                t => now - t < this.rapidClickWindow
            );

            // Check if threshold reached - show game popup
            if (this.rapidClicks.length >= this.rapidClickThreshold) {
                this.rapidClicks = [];
                this.triggerEasterEgg();
                return; // Don't trigger ripple when opening game
            }

            // Get mouse position in normalized device coordinates
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            // Raycast to find intersection point
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.logoGroup.children, true);

            if (intersects.length > 0) {
                // Get the intersection point in local coordinates
                const localPoint = intersects[0].point.clone();
                this.logoGroup.worldToLocal(localPoint);

                // Set click point for shader
                this.clickPoint.set(localPoint.x, localPoint.y);
                this.clickPulse = 1.0;
                this.clickTime = this.time;
            }
        });

        // Drag to rotate
        this.container.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
            this.container.style.cursor = 'grabbing';
        });

        this.container.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = (e.clientX - this.dragStart.x) * 0.01;
                const deltaY = (e.clientY - this.dragStart.y) * 0.01;

                this.dragRotation.y = deltaX;
                this.dragRotation.x = -deltaY;
            }
        });

        this.container.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.container.style.cursor = 'grab';
        });

        // Set initial cursor style
        this.container.style.cursor = 'grab';
    }

    onResize() {
        this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.updateLogoPosition();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += 0.016;

        // Decay click pulse (slow decay for calm effect)
        if (this.clickPulse > 0) {
            this.clickPulse *= 0.992; // Much slower decay
            if (this.clickPulse < 0.01) this.clickPulse = 0;
        }

        // Smooth hover intensity transition
        const targetHover = this.isHovering ? 1.0 : 0.0;
        this.hoverIntensity += (targetHover - this.hoverIntensity) * 0.1;

        // Snap-back: lerp drag rotation back to zero when not dragging
        if (!this.isDragging) {
            this.dragRotation.x *= 0.9;
            this.dragRotation.y *= 0.9;
            if (Math.abs(this.dragRotation.x) < 0.001) this.dragRotation.x = 0;
            if (Math.abs(this.dragRotation.y) < 0.001) this.dragRotation.y = 0;
        }

        // Update shader uniforms
        if (this.gradientMaterial) {
            this.gradientMaterial.uniforms.uTime.value = this.time - this.clickTime;
            this.gradientMaterial.uniforms.uHover.value = this.hoverIntensity;
            this.gradientMaterial.uniforms.uClickPulse.value = this.clickPulse;
            if (this.clickPoint) {
                this.gradientMaterial.uniforms.uClickPoint.value.copy(this.clickPoint);
            }

            // Calculate and update easter egg progress for visual feedback
            const now = Date.now();
            const recentClicks = this.rapidClicks.filter(t => now - t < this.rapidClickWindow);
            const easterEggProgress = Math.min(recentClicks.length / this.rapidClickThreshold, 1.0);
            this.gradientMaterial.uniforms.uEasterEggProgress.value = easterEggProgress;
        }

        // Animate logo group - base rotation + drag (no click effects)
        if (this.logoGroup) {
            // Base rotation (slow, ambient)
            const baseRotY = this.time * 0.1;
            const baseRotX = Math.sin(this.time * 0.15) * 0.05;
            const baseRotZ = Math.cos(this.time * 0.12) * 0.03;

            // Apply base + drag rotation
            this.logoGroup.rotation.y = baseRotY + this.dragRotation.y;
            this.logoGroup.rotation.x = baseRotX + this.dragRotation.x;
            this.logoGroup.rotation.z = baseRotZ;

            // Subtle floating
            this.logoGroup.position.y = Math.sin(this.time * 0.3) * 0.05;
        }

        // Animate glow (time-based + hover boost only)
        if (this.glowMesh) {
            const scale = 1.03 + Math.sin(this.time * 1) * 0.015 + this.hoverIntensity * 0.02;
            this.glowMesh.scale.setScalar(scale);
        }

        // Animate particles - slight expand on hover only
        if (this.particles) {
            this.particles.rotation.y = this.time * 0.03;
            this.particles.rotation.x = Math.sin(this.time * 0.1) * 0.05;
            this.particles.rotation.z = Math.cos(this.time * 0.08) * 0.03;

            // Expand particles on hover only
            const particleScale = 1.0 + this.hoverIntensity * 0.05;
            this.particles.scale.setScalar(particleScale);
        }

        // Animate rings - spin faster on click
        if (this.ring1) {
            this.ring1.rotation.x = this.time * 0.08 + this.clickPulse * 0.5;
            this.ring1.rotation.y = this.time * 0.05;
        }
        if (this.ring2) {
            this.ring2.rotation.x = this.time * 0.06 + Math.PI / 3;
            this.ring2.rotation.z = this.time * 0.04 + this.clickPulse * 0.4;
        }
        if (this.ring3) {
            this.ring3.rotation.y = this.time * 0.09 + this.clickPulse * 0.6;
            this.ring3.rotation.z = this.time * 0.05 + Math.PI / 4;
        }

        this.renderer.render(this.scene, this.camera);
    }

    triggerEasterEgg() {
        const gameModal = document.getElementById('game-modal');
        if (!gameModal) return;

        // Create egg animation overlay
        const overlay = document.createElement('div');
        overlay.className = 'egg-animation-overlay';

        // Create egg container with sparkles
        const eggContainer = document.createElement('div');
        eggContainer.className = 'egg-container';
        eggContainer.innerHTML = '🥚';

        // Add sparkles that will fly out when egg cracks
        const sparklePositions = [
            { tx: '-100px', ty: '-80px' },
            { tx: '100px', ty: '-80px' },
            { tx: '-120px', ty: '20px' },
            { tx: '120px', ty: '20px' },
            { tx: '-60px', ty: '-120px' },
            { tx: '60px', ty: '-120px' },
            { tx: '-80px', ty: '80px' },
            { tx: '80px', ty: '80px' }
        ];

        sparklePositions.forEach(pos => {
            const sparkle = document.createElement('div');
            sparkle.className = 'egg-sparkle';
            sparkle.style.setProperty('--tx', pos.tx);
            sparkle.style.setProperty('--ty', pos.ty);
            sparkle.style.top = '50%';
            sparkle.style.left = '50%';
            eggContainer.appendChild(sparkle);
        });

        // Add "Secret Unlocked!" text
        const hatchedText = document.createElement('div');
        hatchedText.className = 'egg-hatched-text';
        hatchedText.textContent = '🎮 Secret Unlocked!';

        overlay.appendChild(eggContainer);
        overlay.appendChild(hatchedText);
        document.body.appendChild(overlay);

        // Animation sequence
        // 1. Egg flies in (0.6s) - already playing via CSS

        // 2. Wobble animation (after fly-in completes)
        setTimeout(() => {
            eggContainer.classList.add('wobble');
        }, 600);

        // 3. Crack animation
        setTimeout(() => {
            eggContainer.classList.remove('wobble');
            eggContainer.classList.add('crack');
            // Change to cracked egg emoji
            eggContainer.childNodes[0].textContent = '🐣';
        }, 1100);

        // 4. Show "Secret Unlocked!" text
        setTimeout(() => {
            overlay.classList.add('show-text');
        }, 1300);

        // 5. Fade out overlay and show game modal
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.3s ease';
            overlay.style.opacity = '0';
            gameModal.classList.add('active');
        }, 1800);

        // 6. Remove overlay and initialize game
        setTimeout(() => {
            overlay.remove();
            if (!window.catchGame) {
                window.catchGame = new CatchGame('game-canvas', 'game-score');
            } else {
                window.catchGame.startGame();
            }
        }, 2100);
    }
}

// Export
window.Logo3DScene = Logo3DScene;
