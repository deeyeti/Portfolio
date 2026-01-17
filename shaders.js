/* ============================================
   PORTFOLIO - Effects (Simplified)
   Only Ripple & Image Distortion
   ============================================ */

// Ripple Shader for sections
class RippleShader {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

        if (container) {
            container.appendChild(this.canvas);
            this.init();
        }
    }

    init() {
        this.ctx = this.canvas.getContext('2d');
        this.ripples = [];
        this.resize();

        window.addEventListener('resize', () => this.resize());
        this.container.addEventListener('mousemove', (e) => this.addRipple(e));

        this.animate();
    }

    resize() {
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
    }

    addRipple(e) {
        const rect = this.container.getBoundingClientRect();
        this.ripples.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            radius: 0,
            maxRadius: 150,
            alpha: 0.4
        });

        if (this.ripples.length > 5) {
            this.ripples.shift();
        }
    }

    animate() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ripples = this.ripples.filter(ripple => {
            ripple.radius += 3;
            ripple.alpha -= 0.012;

            if (ripple.alpha <= 0) return false;

            // Light blue ripples
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(56, 189, 248, ${ripple.alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Inner glow
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(125, 211, 252, ${ripple.alpha * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            return true;
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Image distortion - Light Blue theme
class ImageDistortion {
    constructor(imageElement) {
        this.image = imageElement;
        this.wrapper = imageElement.parentElement;

        if (!this.wrapper) return;

        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        this.wrapper.style.position = 'relative';
        this.wrapper.appendChild(this.canvas);

        this.gl = this.canvas.getContext('webgl');

        if (this.gl) {
            this.init();
            this.setupEvents();
        }
    }

    init() {
        const gl = this.gl;

        const vertexShader = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                v_uv.y = 1.0 - v_uv.y;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        const fragmentShader = `
            precision mediump float;
            varying vec2 v_uv;
            uniform sampler2D u_image;
            uniform float u_time;
            uniform vec2 u_mouse;
            uniform float u_hover;
            
            void main() {
                vec2 uv = v_uv;
                
                vec2 center = u_mouse;
                float dist = length(uv - center);
                float ripple = sin(dist * 25.0 - u_time * 4.0) * 0.015 * u_hover;
                ripple *= smoothstep(0.5, 0.0, dist);
                
                uv += normalize(uv - center + 0.001) * ripple;
                
                vec4 color = texture2D(u_image, uv);
                
                // Add light blue tint on hover
                color.rgb += vec3(0.1, 0.2, 0.3) * u_hover * 0.2;
                
                gl_FragColor = color;
            }
        `;

        const vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader, vertexShader);
        gl.compileShader(vShader);

        const fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader, fragmentShader);
        gl.compileShader(fShader);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vShader);
        gl.attachShader(this.program, fShader);
        gl.linkProgram(this.program);
        gl.useProgram(this.program);

        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
        };

        if (this.image.complete) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
        }

        this.uniforms = {
            time: gl.getUniformLocation(this.program, 'u_time'),
            mouse: gl.getUniformLocation(this.program, 'u_mouse'),
            hover: gl.getUniformLocation(this.program, 'u_hover')
        };

        this.time = 0;
        this.mouse = { x: 0.5, y: 0.5 };
        this.hover = 0;
        this.isHovering = false;
    }

    setupEvents() {
        this.wrapper.addEventListener('mouseenter', () => {
            this.isHovering = true;
            this.canvas.style.opacity = '1';
            this.image.style.opacity = '0';
            this.animate();
        });

        this.wrapper.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.canvas.style.opacity = '0';
            this.image.style.opacity = '1';
        });

        this.wrapper.addEventListener('mousemove', (e) => {
            const rect = this.wrapper.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) / rect.width;
            this.mouse.y = (e.clientY - rect.top) / rect.height;
        });
    }

    resize() {
        this.canvas.width = this.wrapper.offsetWidth;
        this.canvas.height = this.wrapper.offsetHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
        if (!this.isHovering) return;

        this.resize();

        this.time += 0.016;
        this.hover += (1 - this.hover) * 0.1;

        const gl = this.gl;
        gl.uniform1f(this.uniforms.time, this.time);
        gl.uniform2f(this.uniforms.mouse, this.mouse.x, this.mouse.y);
        gl.uniform1f(this.uniforms.hover, this.hover);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(() => this.animate());
    }
}

// Export
window.RippleShader = RippleShader;
window.ImageDistortion = ImageDistortion;
