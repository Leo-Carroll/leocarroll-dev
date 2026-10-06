const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = document.querySelectorAll("[data-reveal]");
const progressBar = document.querySelector(".scroll-progress");
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