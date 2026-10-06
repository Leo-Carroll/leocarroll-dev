const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = document.querySelectorAll("[data-reveal]");
const progressBar = document.querySelector(".scroll-progress");
const particleCanvas = document.querySelector(".particle-background");
const textMotionTargets = document.querySelectorAll("li");

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    textMotionTargets.forEach((target) => {
        let bounds;
        target.classList.add("text-motion-target");

        target.addEventListener("pointerenter", () => {
            if (reducedMotion.matches) return;
            bounds = target.getBoundingClientRect();
            target.classList.add("text-motion-active");
        });

        target.addEventListener("pointermove", (event) => {
            if (reducedMotion.matches || !bounds) return;

            const horizontal = (event.clientX - bounds.left - bounds.width / 2) / Math.max(bounds.width / 2, 1);
            const vertical = (event.clientY - bounds.top - bounds.height / 2) / Math.max(bounds.height / 2, 1);
            target.style.setProperty("--text-pull-x", `${Math.max(-1, Math.min(1, horizontal)) * 4}px`);
            target.style.setProperty("--text-pull-y", `${Math.max(-1, Math.min(1, vertical)) * 4}px`);
        });

        target.addEventListener("pointerleave", () => {
            bounds = null;
            target.classList.remove("text-motion-active");
            target.style.removeProperty("--text-pull-x");
            target.style.removeProperty("--text-pull-y");
        });
    });
}

if (particleCanvas) {
    const particleContext = particleCanvas.getContext("2d");

    if (particleContext) {
        const palette = getComputedStyle(root);
        const particleColor = palette.getPropertyValue("--accent").trim();
        const secondaryParticleColor = palette.getPropertyValue("--particle-secondary").trim();
        const connectionColor = palette.getPropertyValue("--muted").trim();
        let particles = [];
        let viewportWidth = 0;
        let viewportHeight = 0;
        let animationFrame = 0;
        let previousFrame = 0;
        const pointer = { x: 0, y: 0, active: false };

        const drawParticles = () => {
            particleContext.clearRect(0, 0, viewportWidth, viewportHeight);

            particles.forEach((particle, index) => {
                for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
                    const otherParticle = particles[otherIndex];
                    const distance = Math.hypot(particle.x - otherParticle.x, particle.y - otherParticle.y);

                    if (distance < 180) {
                        particleContext.beginPath();
                        particleContext.moveTo(particle.x, particle.y);
                        particleContext.lineTo(otherParticle.x, otherParticle.y);
                        particleContext.strokeStyle = connectionColor;
                        particleContext.globalAlpha = (1 - distance / 180) * 0.22;
                        particleContext.lineWidth = 0.85;
                        particleContext.stroke();
                    }
                }

                if (pointer.active && !reducedMotion.matches) {
                    const pointerDistance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);

                    if (pointerDistance < 190) {
                        particleContext.beginPath();
                        particleContext.moveTo(particle.x, particle.y);
                        particleContext.lineTo(pointer.x, pointer.y);
                        particleContext.strokeStyle = secondaryParticleColor;
                        particleContext.globalAlpha = (1 - pointerDistance / 190) * 0.42;
                        particleContext.lineWidth = 1;
                        particleContext.stroke();
                    }
                }

                particleContext.beginPath();
                particleContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                particleContext.fillStyle = index % 7 === 0 ? secondaryParticleColor : particleColor;
                particleContext.globalAlpha = index % 7 === 0 ? 0.82 : 0.62;
                particleContext.fill();
            });

            particleContext.globalAlpha = 1;
        };

        const resizeParticles = () => {
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            viewportWidth = window.innerWidth;
            viewportHeight = window.innerHeight;
            particleCanvas.width = Math.round(viewportWidth * pixelRatio);
            particleCanvas.height = Math.round(viewportHeight * pixelRatio);
            particleContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

            const particleCount = Math.min(220, Math.max(60, Math.round(viewportWidth * viewportHeight / 9000)));
            particles = Array.from({ length: particleCount }, () => ({
                x: Math.random() * viewportWidth,
                y: Math.random() * viewportHeight,
                radius: Math.random() * 1.8 + 1,
                velocityX: (Math.random() - 0.5) * 0.16,
                velocityY: (Math.random() - 0.5) * 0.16
            }));
        };

        const stopParticles = () => {
            if (!animationFrame) return;
            cancelAnimationFrame(animationFrame);
            animationFrame = 0;
        };

        const animateParticles = (time) => {
            if (document.hidden) return;

            if (time - previousFrame >= 33) {
                particles.forEach((particle) => {
                    particle.velocityX += (Math.random() - 0.5) * 0.03;
                    particle.velocityY += (Math.random() - 0.5) * 0.03;

                    if (pointer.active && !reducedMotion.matches) {
                        const deltaX = particle.x - pointer.x;
                        const deltaY = particle.y - pointer.y;
                        const distance = Math.hypot(deltaX, deltaY);

                        if (distance > 0 && distance < 190) {
                            const force = (1 - distance / 190) * 0.025;
                            particle.velocityX += deltaX / distance * force;
                            particle.velocityY += deltaY / distance * force;
                        }
                    }

                    particle.velocityX *= 0.995;
                    particle.velocityY *= 0.995;
                    const speed = Math.hypot(particle.velocityX, particle.velocityY);
                    if (speed > 0.75) {
                        particle.velocityX = particle.velocityX / speed * 0.75;
                        particle.velocityY = particle.velocityY / speed * 0.75;
                    }
                    particle.x = (particle.x + particle.velocityX + viewportWidth) % viewportWidth;
                    particle.y = (particle.y + particle.velocityY + viewportHeight) % viewportHeight;
                });
                drawParticles();
                previousFrame = time;
            }

            animationFrame = requestAnimationFrame(animateParticles);
        };

        const updateParticleMotion = () => {
            stopParticles();
            drawParticles();
            if (!reducedMotion.matches && !document.hidden) {
                animationFrame = requestAnimationFrame(animateParticles);
            }
        };

        resizeParticles();
        updateParticleMotion();
        window.addEventListener("resize", () => {
            resizeParticles();
            drawParticles();
        });
        window.addEventListener("pointermove", (event) => {
            if (reducedMotion.matches) return;
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            pointer.active = true;
        }, { passive: true });
        window.addEventListener("pointerleave", () => {
            pointer.active = false;
        });
        document.addEventListener("visibilitychange", updateParticleMotion);
        reducedMotion.addEventListener("change", updateParticleMotion);
    }
}

document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    group.querySelectorAll("[data-reveal]").forEach((item, index) => {
        item.style.setProperty("--reveal-delay", `${Math.min(index, 3) * 90}ms`);
    });
});

if (progressBar) {
    let progressPending = false;

    const updateProgress = () => {
        if (progressPending) return;
        progressPending = true;

        requestAnimationFrame(() => {
            const scrollableHeight = root.scrollHeight - window.innerHeight;
            const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
            root.style.setProperty("--scroll-progress", progress);
            progressPending = false;
        });
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
}

const navigationLinks = document.querySelectorAll('.site-header nav a[href^="#"]');
const navigationSections = [...navigationLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

if ("IntersectionObserver" in window && navigationSections.length) {
    const navigationObserver = new IntersectionObserver((entries) => {
        const activeEntry = entries.find((entry) => entry.isIntersecting);
        if (!activeEntry) return;

        navigationLinks.forEach((link) => {
            if (link.hash === `#${activeEntry.target.id}`) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }, { rootMargin: "-16% 0px -68% 0px" });

    navigationSections.forEach((section) => navigationObserver.observe(section));
}

if (!reducedMotion.matches && "IntersectionObserver" in window && revealItems.length) {
    root.classList.add("has-motion");

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });

    revealItems.forEach((item) => revealObserver.observe(item));
}