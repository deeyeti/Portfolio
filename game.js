/* ============================================
   Mini Game - Catch the Falling Blocks
   Game ends if you miss a block!
   High score stored in localStorage
   ============================================ */

class CatchGame {
    constructor(canvasId, scoreId) {
        this.canvas = document.getElementById(canvasId);
        this.scoreElement = document.getElementById(scoreId);

        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.isPlaying = false;
        this.isGameOver = false;
        this.animationId = null;
        this.spawnTimeout = null;

        // Game objects
        this.paddle = {
            width: 100,
            height: 14,
            x: 0,
            y: 0,
            speed: 8,
            color: '#38bdf8'
        };

        this.blocks = [];
        this.particles = [];

        // Colors for blocks
        this.blockColors = [
            '#38bdf8', // Light blue
            '#0ea5e9', // Blue
            '#7dd3fc', // Lighter blue
            '#60a5fa', // Medium blue
            '#3b82f6'  // Darker blue
        ];

        this.init();
    }

    loadHighScore() {
        const saved = localStorage.getItem('catchBlocksHighScore');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('catchBlocksHighScore', this.highScore.toString());
            return true; // New high score!
        }
        return false;
    }

    init() {
        this.resize();
        this.setupEvents();
        this.startGame();

        // Auto-resize
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Reset paddle position
        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        this.paddle.y = this.canvas.height - 40;
    }

    setupEvents() {
        // Keyboard controls
        this.keyHandler = (e) => {
            if (!this.isPlaying) {
                // Restart on any key if game over
                if (this.isGameOver) {
                    this.startGame();
                }
                return;
            }

            if (e.key === 'ArrowLeft') {
                this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed * 5);
            } else if (e.key === 'ArrowRight') {
                this.paddle.x = Math.min(this.canvas.width - this.paddle.width, this.paddle.x + this.paddle.speed * 5);
            }
        };
        document.addEventListener('keydown', this.keyHandler);

        // Mouse/touch controls
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isGameOver) {
                this.startGame();
                return;
            }
            this.movePaddle(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isPlaying) this.movePaddle(e);
        });

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.isGameOver) {
                this.startGame();
                return;
            }
            this.movePaddle(e.touches[0]);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isPlaying) this.movePaddle(e.touches[0]);
        });
    }

    movePaddle(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.paddle.width / 2;
        this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, x));
    }

    startGame() {
        this.isPlaying = true;
        this.isGameOver = false;
        this.score = 0;
        this.blocks = [];
        this.particles = [];

        // Clear any pending spawn
        if (this.spawnTimeout) {
            clearTimeout(this.spawnTimeout);
        }

        this.updateScore();
        this.scheduleSpawn();
        this.gameLoop();
    }

    scheduleSpawn() {
        if (!this.isPlaying) return;

        this.spawnBlock();

        // Spawn rate increases with score
        const delay = Math.max(600, 1500 - this.score * 15);
        this.spawnTimeout = setTimeout(() => this.scheduleSpawn(), delay);
    }

    spawnBlock() {
        const size = 25 + Math.random() * 15;
        const block = {
            x: Math.random() * (this.canvas.width - size),
            y: -size,
            size: size,
            speed: 2 + Math.random() * 1.5 + this.score * 0.03,
            color: this.blockColors[Math.floor(Math.random() * this.blockColors.length)],
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            missed: false
        };

        this.blocks.push(block);
    }

    createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                size: 3 + Math.random() * 5,
                color: color,
                life: 1
            });
        }
    }

    createMissParticles(x, y) {
        // Red explosion for missed block
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: 4 + Math.random() * 6,
                color: '#ef4444',
                life: 1
            });
        }
    }

    updateScore() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
    }

    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;

        // Clear spawn timeout
        if (this.spawnTimeout) {
            clearTimeout(this.spawnTimeout);
        }

        // Check for new high score
        const isNewHighScore = this.saveHighScore();

        // Draw game over screen
        this.drawGameOver(isNewHighScore);
    }

    update() {
        // Update blocks
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const block = this.blocks[i];
            block.y += block.speed;
            block.rotation += block.rotationSpeed;

            // Check paddle collision
            if (block.y + block.size > this.paddle.y &&
                block.y < this.paddle.y + this.paddle.height &&
                block.x + block.size > this.paddle.x &&
                block.x < this.paddle.x + this.paddle.width) {

                // Caught!
                this.score++;
                this.updateScore();
                this.createParticles(block.x + block.size / 2, block.y, block.color);
                this.blocks.splice(i, 1);
                continue;
            }

            // Check if missed (went below paddle)
            if (block.y > this.paddle.y + this.paddle.height + 10 && !block.missed) {
                block.missed = true;
                this.createMissParticles(block.x + block.size / 2, this.canvas.height - 20);
                this.gameOver();
                return;
            }

            // Remove if way off screen
            if (block.y > this.canvas.height + 50) {
                this.blocks.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.025;
            p.vy += 0.15; // gravity

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        // Clear with dark background
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw subtle grid
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
        this.ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw high score indicator
        this.ctx.font = '12px "Space Grotesk", sans-serif';
        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Best: ${this.highScore}`, this.canvas.width - 15, 25);

        // Draw blocks
        this.blocks.forEach(block => {
            this.ctx.save();
            this.ctx.translate(block.x + block.size / 2, block.y + block.size / 2);
            this.ctx.rotate(block.rotation);

            // Glow effect
            this.ctx.shadowColor = block.color;
            this.ctx.shadowBlur = 20;

            // Block
            this.ctx.fillStyle = block.color;
            this.ctx.fillRect(-block.size / 2, -block.size / 2, block.size, block.size);

            // Inner highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            this.ctx.fillRect(-block.size / 2 + 4, -block.size / 2 + 4, block.size * 0.4, block.size * 0.25);

            this.ctx.restore();
        });

        // Draw particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;

        // Draw paddle
        this.ctx.shadowColor = this.paddle.color;
        this.ctx.shadowBlur = 25;

        // Paddle gradient
        const gradient = this.ctx.createLinearGradient(
            this.paddle.x, this.paddle.y,
            this.paddle.x, this.paddle.y + this.paddle.height
        );
        gradient.addColorStop(0, '#7dd3fc');
        gradient.addColorStop(0.5, '#38bdf8');
        gradient.addColorStop(1, '#0284c7');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 7);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }

    drawGameOver(isNewHighScore) {
        // Draw final frame
        this.draw();

        // Overlay
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Game Over text
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = 'bold 36px "Syne", sans-serif';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.shadowBlur = 0;

        // Score
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px "Space Grotesk", sans-serif';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);

        // High score
        if (isNewHighScore) {
            this.ctx.shadowColor = '#38bdf8';
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.font = 'bold 18px "Space Grotesk", sans-serif';
            this.ctx.fillText('🎉 NEW HIGH SCORE! 🎉', this.canvas.width / 2, this.canvas.height / 2 + 35);
            this.ctx.shadowBlur = 0;
        } else {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.font = '16px "Space Grotesk", sans-serif';
            this.ctx.fillText(`Best: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 35);
        }

        // Restart prompt
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '14px "Space Grotesk", sans-serif';
        this.ctx.fillText('Click or press any key to play again', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }

    gameLoop() {
        if (!this.isPlaying) return;

        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// Export the game class globally
window.CatchGame = CatchGame;
