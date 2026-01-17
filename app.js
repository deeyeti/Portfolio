/* ============================================
   PORTFOLIO - Main Application
   GSAP + ScrollTrigger + Interactions
   ============================================ */

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

class Portfolio {
    constructor() {
        this.init();
    }

    init() {
        this.setupLoading();
        this.setupCursor();
        this.setupTime();
        this.setupMenu();
        this.setupShaders();
        this.setupParallax();
        this.setupAnimations();
        this.setupScrollTrigger();
        this.setupMagneticElements();
        this.setupProjectCards();
        this.setupSmoothScroll();
    }

    // ========================================
    // Loading Animation
    // ========================================
    setupLoading() {
        // Create loading screen
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = `
            <div class="loading-text">
                ${Array.from('deeyeti').map((char, i) =>
            `<span style="animation-delay: ${i * 0.1}s">${char}</span>`
        ).join('')}
            </div>
        `;
        document.body.prepend(loading);

        // Hide loading after animations are ready
        window.addEventListener('load', () => {
            gsap.to(loading, {
                yPercent: -100,
                duration: 1,
                ease: 'power4.inOut',
                delay: 1.5,
                onComplete: () => {
                    loading.remove();
                    this.startHeroAnimations();
                }
            });
        });
    }

    // ========================================
    // Hero Animations
    // ========================================
    startHeroAnimations() {
        const tl = gsap.timeline();

        // Animate hero elements
        tl.to('.hero-eyebrow', {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out'
        })
            .to('.hero-title-word', {
                y: 0,
                opacity: 1,
                duration: 1.2,
                stagger: 0.15,
                ease: 'power4.out'
            }, '-=0.5')
            .to('.hero-tagline', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.6')
            .to('.hero-scroll-indicator', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.4')
            .to('.hero-image-container', {
                opacity: 1,
                duration: 1.2,
                ease: 'power3.out'
            }, '-=1');
    }

    // ========================================
    // Custom Cursor
    // ========================================
    setupCursor() {
        const cursor = document.getElementById('cursor');
        const follower = document.getElementById('cursor-follower');

        if (!cursor || !follower) return;

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let followerX = 0, followerY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth cursor animation
        const animateCursor = () => {
            // Main cursor follows faster
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';

            // Follower is slower
            followerX += (mouseX - followerX) * 0.1;
            followerY += (mouseY - followerY) * 0.1;
            follower.style.left = followerX + 'px';
            follower.style.top = followerY + 'px';

            requestAnimationFrame(animateCursor);
        };
        animateCursor();

        // Hover effects on interactive elements
        const interactiveElements = document.querySelectorAll('a, [data-magnetic], .project-card, .service-item');

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('active');
                follower.classList.add('active');
            });

            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('active');
                follower.classList.remove('active');
            });
        });
    }

    // ========================================
    // Real-time Clock
    // ========================================
    setupTime() {
        const timeElement = document.getElementById('current-time');
        if (!timeElement) return;

        const updateTime = () => {
            const now = new Date();
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZoneName: 'short'
            };
            timeElement.textContent = now.toLocaleTimeString('en-US', options);
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    // ========================================
    // Hamburger Menu
    // ========================================
    setupMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const menuOverlay = document.getElementById('menu-overlay');
        const menuClose = document.getElementById('menu-close');
        const menuLinks = document.querySelectorAll('.menu-link');
        const nav = document.getElementById('nav');

        if (!menuToggle || !menuOverlay) return;

        const openMenu = () => {
            menuToggle.classList.add('active');
            menuOverlay.classList.add('active');
            if (nav) nav.classList.add('menu-active');
            document.body.style.overflow = 'hidden';
        };

        const closeMenu = () => {
            menuToggle.classList.remove('active');
            menuOverlay.classList.remove('active');
            if (nav) nav.classList.remove('menu-active');
            document.body.style.overflow = '';
        };

        // Toggle menu on button click
        menuToggle.addEventListener('click', () => {
            if (menuOverlay.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close menu with close button (X)
        if (menuClose) {
            menuClose.addEventListener('click', () => {
                closeMenu();
            });
        }

        // Close menu when clicking a link
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
                closeMenu();
            }
        });

        // Close menu when clicking overlay background
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                closeMenu();
            }
        });
    }

    // ========================================
    // Effects
    // ========================================
    setupShaders() {
        // 3D Logo in hero section
        const logoContainer = document.getElementById('hero-logo-3d');
        if (logoContainer && window.Logo3DScene) {
            new Logo3DScene(logoContainer);
        }

        // Ripple effect on work section
        const workSection = document.getElementById('work-shader');
        if (workSection && window.RippleShader) {
            new RippleShader(workSection.parentElement);
        }

        // Image distortion effects
        if (window.ImageDistortion) {
            document.querySelectorAll('.project-image, .about-image').forEach(img => {
                new ImageDistortion(img);
            });
        }
    }

    // ========================================
    // Parallax Effects
    // ========================================
    setupParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        parallaxElements.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;

            gsap.to(element, {
                yPercent: speed * 100,
                ease: 'none',
                scrollTrigger: {
                    trigger: element,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1
                }
            });
        });

        // Floating shapes additional parallax
        document.querySelectorAll('.floating-shape').forEach((shape, i) => {
            gsap.to(shape, {
                y: (i + 1) * 100,
                rotation: (i + 1) * 30,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.5
                }
            });
        });
    }

    // ========================================
    // GSAP Animations
    // ========================================
    setupAnimations() {
        // Navigation animation on scroll
        ScrollTrigger.create({
            start: 'top -100',
            onUpdate: (self) => {
                const nav = document.getElementById('nav');
                if (nav) {
                    if (self.direction === 1 && self.progress > 0.1) {
                        gsap.to(nav, { yPercent: -100, duration: 0.3 });
                    } else {
                        gsap.to(nav, { yPercent: 0, duration: 0.3 });
                    }
                }
            }
        });

        // Marquee speed variation on scroll
        const marqueeContent = document.querySelector('.marquee-content');
        if (marqueeContent) {
            ScrollTrigger.create({
                trigger: '.marquee-section',
                start: 'top bottom',
                end: 'bottom top',
                onUpdate: (self) => {
                    const speed = 30 + self.velocity * 0.1;
                    marqueeContent.style.animationDuration = `${speed}s`;
                }
            });
        }
    }

    // ========================================
    // ScrollTrigger Section Reveals
    // ========================================
    setupScrollTrigger() {
        // Mobile-friendly scroll trigger starts
        const isMobile = window.innerWidth < 768;
        const startPosition = isMobile ? 'top 98%' : 'top 85%';
        const startPositionDeep = isMobile ? 'top 95%' : 'top 70%';

        // Section titles animation
        document.querySelectorAll('.section-title-line span').forEach(span => {
            gsap.from(span, {
                yPercent: 100,
                opacity: 0,
                duration: 1,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: span,
                    start: startPosition,
                    toggleActions: 'play none none reverse'
                }
            });
        });

        // Contact title animation
        document.querySelectorAll('.contact-title-line span').forEach((span, i) => {
            gsap.from(span, {
                yPercent: 100,
                opacity: 0,
                duration: 1,
                delay: i * 0.15,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: span,
                    start: startPosition,
                    toggleActions: 'play none none reverse'
                }
            });
        });

        // About section
        gsap.from('.about-image-wrapper', {
            x: -100,
            opacity: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.about-grid',
                start: startPositionDeep,
                toggleActions: 'play none none reverse'
            }
        });

        gsap.from('.about-content-col > *', {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.about-content-col',
                start: startPositionDeep,
                toggleActions: 'play none none reverse'
            }
        });

        // Skill categories animation
        gsap.utils.toArray('.skill-category').forEach((category, i) => {
            gsap.from(category, {
                y: 40,
                opacity: 0,
                duration: 0.8,
                delay: i * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.skills-grid',
                    start: startPosition,
                    toggleActions: 'play none none reverse'
                }
            });
        });

        // Skill legend animation
        gsap.from('.skill-legend', {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.skill-legend',
                start: startPosition,
                toggleActions: 'play none none reverse'
            }
        });

        // Project cards stagger animation
        gsap.utils.toArray('.project-card').forEach((card, i) => {
            gsap.to(card, {
                y: 0,
                opacity: 1,
                duration: 1,
                delay: i * 0.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            });
        });

        // Service items animation
        gsap.utils.toArray('.service-item').forEach((item, i) => {
            gsap.from(item, {
                x: -50,
                opacity: 0,
                duration: 0.8,
                delay: i * 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: item,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            });
        });

        // Contact info animation
        gsap.from('.contact-item', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.contact-grid',
                start: 'top 70%',
                toggleActions: 'play none none reverse'
            }
        });

        // Social links - no animation, keeping them visible
        // (GSAP from animations were causing visibility issues)

        // Background text parallax in about section
        gsap.to('.about-bg-text', {
            xPercent: 20,
            ease: 'none',
            scrollTrigger: {
                trigger: '.about',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            }
        });

        // Section pinning effect for work section
        ScrollTrigger.create({
            trigger: '.work',
            start: 'top top',
            end: 'bottom bottom',
            pin: '.work-header',
            pinSpacing: false
        });
    }

    // ========================================
    // Magnetic Elements
    // ========================================
    setupMagneticElements() {
        const magneticElements = document.querySelectorAll('[data-magnetic]');

        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                gsap.to(element, {
                    x: x * 0.3,
                    y: y * 0.3,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            element.addEventListener('mouseleave', () => {
                gsap.to(element, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.3)'
                });
            });
        });
    }

    // ========================================
    // Project Cards Interaction
    // ========================================
    setupProjectCards() {
        const cards = document.querySelectorAll('.project-card');

        cards.forEach(card => {
            const image = card.querySelector('.project-image');
            const info = card.querySelector('.project-info');

            card.addEventListener('mouseenter', () => {
                gsap.to(image, {
                    scale: 1.1,
                    duration: 0.8,
                    ease: 'power3.out'
                });

                gsap.to(info, {
                    y: -10,
                    duration: 0.4,
                    ease: 'power3.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(image, {
                    scale: 1,
                    duration: 0.8,
                    ease: 'power3.out'
                });

                gsap.to(info, {
                    y: 0,
                    duration: 0.4,
                    ease: 'power3.out'
                });
            });

            // 3D tilt effect
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                gsap.to(card, {
                    rotationY: x * 10,
                    rotationX: -y * 10,
                    duration: 0.3,
                    ease: 'power2.out',
                    transformPerspective: 1000
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotationY: 0,
                    rotationX: 0,
                    duration: 0.5,
                    ease: 'power3.out'
                });
            });
        });
    }

    // ========================================
    // Smooth Scroll Navigation
    // ========================================
    setupSmoothScroll() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                const target = document.querySelector(targetId);

                if (target) {
                    // Use native smooth scroll
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - 80;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// ========================================
// Text Split Animation Helper
// ========================================
class TextSplitter {
    static splitByChars(element) {
        const text = element.textContent;
        element.innerHTML = text.split('').map(char =>
            `<span class="char">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
        return element.querySelectorAll('.char');
    }

    static splitByWords(element) {
        const text = element.textContent;
        element.innerHTML = text.split(' ').map(word =>
            `<span class="word">${word}</span>`
        ).join(' ');
        return element.querySelectorAll('.word');
    }

    static splitByLines(element) {
        const text = element.textContent;
        element.innerHTML = text.split('\n').map(line =>
            `<span class="line"><span class="line-inner">${line}</span></span>`
        ).join('');
        return element.querySelectorAll('.line-inner');
    }
}

// ========================================
// Scroll Progress Indicator
// ========================================
class ScrollProgress {
    constructor() {
        this.createIndicator();
        this.setupScroll();
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 2px;
            background: linear-gradient(90deg, #38bdf8, #0ea5e9);
            transform-origin: left;
            transform: scaleX(0);
            z-index: 10000;
            width: 100%;
        `;
        document.body.appendChild(this.indicator);
    }

    setupScroll() {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = scrollTop / docHeight;

            gsap.to(this.indicator, {
                scaleX: scrollPercent,
                duration: 0.1,
                ease: 'none'
            });
        });
    }
}

// ========================================
// Image Lazy Loading with Fade Effect
// ========================================
class LazyLoader {
    constructor() {
        this.images = document.querySelectorAll('img[data-src]');
        this.options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, this.options);

        this.observe();
    }

    observe() {
        this.images.forEach(img => this.observer.observe(img));
    }

    loadImage(img) {
        const src = img.dataset.src;
        img.style.opacity = 0;
        img.src = src;

        img.onload = () => {
            gsap.to(img, {
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out'
            });
        };
    }
}

// ========================================
// Hover Reveal for Images
// ========================================
class HoverReveal {
    constructor(element) {
        this.element = element;
        this.image = element.querySelector('img');
        this.overlay = document.createElement('div');

        this.overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--color-bg);
            transform-origin: right;
            z-index: 10;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(this.overlay);

        this.setupAnimation();
    }

    setupAnimation() {
        ScrollTrigger.create({
            trigger: this.element,
            start: 'top 70%',
            onEnter: () => {
                gsap.to(this.overlay, {
                    scaleX: 0,
                    duration: 1.2,
                    ease: 'power4.inOut'
                });

                gsap.from(this.image, {
                    scale: 1.3,
                    duration: 1.5,
                    ease: 'power3.out',
                    delay: 0.3
                });
            }
        });
    }
}

// ========================================
// Initialize Everything
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Main portfolio instance
    const portfolio = new Portfolio();

    // Scroll progress
    new ScrollProgress();

    // Apply hover reveal to specific images
    document.querySelectorAll('.about-image-wrapper, .hero-image-wrapper').forEach(el => {
        new HoverReveal(el);
    });

    console.log('Portfolio initialized ✨');
});

// Handle visibility change for animations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        gsap.globalTimeline.pause();
    } else {
        gsap.globalTimeline.resume();
    }
});
