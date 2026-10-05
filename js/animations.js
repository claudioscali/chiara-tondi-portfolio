/* ========================================
   ANIMATIONS.JS
   Preloader, page transitions, split text,
   scroll reveal, parallax, statement scrub,
   custom cursor, magnetic, canvas, grain,
   scroll progress.
======================================== */

(function () {
    "use strict";

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const finePointer = window.matchMedia(
        "(pointer: fine)"
    ).matches;


    /* ========================================
       GRAIN OVERLAY (iniettato via JS,
       niente markup da aggiungere alle pagine)
    ======================================== */

    if (!reduceMotion) {
        const grain = document.createElement("div");
        grain.className = "grain-overlay";
        grain.setAttribute("aria-hidden", "true");
        document.body.appendChild(grain);
    }


    /* ========================================
       SCROLL PROGRESS BAR
    ======================================== */

    const progress = document.createElement("div");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);

    function updateProgress() {
        const max =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const ratio = max > 0 ? window.scrollY / max : 0;

        progress.style.transform = `scaleX(${ratio})`;
    }


    /* ========================================
       PAGE TRANSITIONS
       - all'ingresso: overlay che svanisce
       - all'uscita: overlay che copre, poi naviga
    ======================================== */

    const transitionOverlay = document.createElement("div");
    transitionOverlay.className = "page-transition enter";
    transitionOverlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(transitionOverlay);

    // Scopre la pagina dopo il primo paint
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            transitionOverlay.classList.remove("enter");
        });
    });

    // Gestisce il tasto indietro del browser (bfcache)
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            transitionOverlay.classList.remove("active");
            transitionOverlay.classList.remove("enter");
        }
    });

    document.addEventListener("click", (event) => {
        if (reduceMotion) return;

        const link = event.target.closest("a[href]");

        if (!link) return;

        const href = link.getAttribute("href");

        // Solo link interni .html, niente anchor, mailto, esterni
        const isInternal =
            href &&
            !href.startsWith("#") &&
            !href.startsWith("mailto:") &&
            !href.startsWith("http") &&
            !link.target &&
            href.endsWith(".html");

        if (!isInternal) return;

        // Non intercettare i click dentro il carosello:
        // ci pensa carousel.js a gestirli
        if (link.closest(".portfolio-carousel")) return;

        event.preventDefault();

        transitionOverlay.classList.add("active");

        setTimeout(() => {
            window.location.href = href;
        }, 460);
    });


    /* ========================================
       PRELOADER
       Solo alla prima visita della sessione.
    ======================================== */

    const alreadySeen = sessionStorage.getItem("ct-preloader");

    if (!reduceMotion && !alreadySeen) {
        const preloader = document.createElement("div");
        preloader.className = "preloader";
        preloader.setAttribute("aria-hidden", "true");
        preloader.innerHTML = `
            <div class="preloader-name"><span>Chiara Tondi</span></div>
            <div class="preloader-bar"><span></span></div>
            <div class="preloader-count">0</div>
        `;
        document.body.appendChild(preloader);

        document.body.style.overflow = "hidden";

        const bar = preloader.querySelector(".preloader-bar span");
        const count = preloader.querySelector(".preloader-count");

        const duration = 1400;
        const start = performance.now();

        function tick(now) {
            const t = Math.min((now - start) / duration, 1);
            // easing easeOutQuart
            const eased = 1 - Math.pow(1 - t, 4);
            const value = Math.round(eased * 100);

            bar.style.transform = `scaleX(${eased})`;
            count.textContent = value;

            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                preloader.classList.add("done");
                document.body.style.overflow = "";
                sessionStorage.setItem("ct-preloader", "1");

                preloader.addEventListener(
                    "transitionend",
                    () => preloader.remove(),
                    { once: true }
                );

                // Fallback se la transizione non parte
                setTimeout(() => preloader.remove(), 1500);
            }
        }

        requestAnimationFrame(tick);
    } else {
        sessionStorage.setItem("ct-preloader", "1");
    }


    /* ========================================
       SPLIT LINES
       Avvolge ogni riga (separata da <br>)
       in una maschera overflow:hidden.
       Conserva gli <em> e il loro contenuto.
    ======================================== */

    function splitLines(element) {
        // Segmenti: testo e nodi <em>, divisi dai <br>
        const lines = [[]];

        Array.from(element.childNodes).forEach((node) => {
            if (node.nodeName === "BR") {
                lines.push([]);
            } else {
                lines[lines.length - 1].push(node);
            }
        });

        element.innerHTML = "";

        lines.forEach((lineNodes, i) => {
            if (lineNodes.length === 0) return;

            const line = document.createElement("span");
            line.className = "line";

            const inner = document.createElement("span");
            inner.className = "line-inner";
            inner.style.setProperty("--i", i);

            lineNodes.forEach((node) => inner.appendChild(node));

            line.appendChild(inner);
            element.appendChild(line);
        });

        element.classList.add("split-lines");
    }

    document
        .querySelectorAll("h1, .section-heading h2, .intro-grid h2, .about-text h2, .cta-section h2, .project-story h2, .next-project h2")
        .forEach(splitLines);


    /* ========================================
       INTERSECTION OBSERVER
       - reveal on scroll (con stagger via --d)
       - attiva le split-lines
    ======================================== */

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                setTimeout(() => {
                    entry.target.classList.add("is-visible");
                }, 50);

                revealObserver.unobserve(entry.target);
            });
        },
        { threshold: 0.1 }
    );

    // Stagger automatico tra fratelli con [data-reveal-stagger]
    document
        .querySelectorAll("[data-reveal-stagger]")
        .forEach((group) => {
            Array.from(group.children).forEach((child, i) => {
                child.setAttribute("data-reveal", "");
                child.style.setProperty("--d", `${i * 90}ms`);
            });
        });

    document
        .querySelectorAll("[data-reveal], .reveal, .split-lines")
        .forEach((el) => revealObserver.observe(el));


    /* ========================================
       PARALLAX UNIFICATO (rAF)
       Usa la posizione reale dell'elemento nel
       viewport, non scrollY globale: funziona
       per ogni immagine della pagina.
       Scrive solo --py: lo zoom hover resta CSS.
    ======================================== */

    const parallaxTargets = [];

    document
        .querySelectorAll(
            ".hero-image img, .project-image img, .about-image img, .project-hero-image img"
        )
        .forEach((img) => {
            parallaxTargets.push(img);
        });

    // Il testo dell'hero scivola via più piano (scroll parallax)
    const heroText = document.querySelector(".hero-text");

    let ticking = false;

    function updateScrollEffects() {
        ticking = false;

        updateProgress();

        if (reduceMotion) return;

        const vh = window.innerHeight;

        parallaxTargets.forEach((img) => {
            const frame = img.parentElement;
            const rect = frame.getBoundingClientRect();

            if (rect.bottom < 0 || rect.top > vh) return;

            const center = rect.top + rect.height / 2;
            const progress = (center - vh / 2) / vh; // -0.5 .. 0.5 circa

            const py = progress * rect.height * 0.12;

            img.style.setProperty("--py", `${py.toFixed(2)}px`);
        });

        if (heroText) {
            const rect = heroText.getBoundingClientRect();
            if (rect.bottom > 0) {
                const offset = window.scrollY * 0.18;
                const fade = Math.max(1 - window.scrollY / (vh * 0.9), 0);
                heroText.style.transform = `translateY(${offset}px)`;
                heroText.style.opacity = fade.toFixed(3);
            }
        }

        updateStatement();
    }

    window.addEventListener(
        "scroll",
        () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateScrollEffects);
            }
        },
        { passive: true }
    );

    window.addEventListener("resize", updateScrollEffects);

    // Prima esecuzione post-init (lo statement scrub
    // viene configurato più sotto nello script)
    requestAnimationFrame(updateScrollEffects);


    /* ========================================
       STATEMENT SCRUB
       Le parole passano da opache a piene
       man mano che la sezione attraversa
       il viewport.
    ======================================== */

    const statement = document.querySelector(".statement");
    let statementWords = [];

    if (statement && !reduceMotion) {
        // Splitta preservando gli <em>
        const fragment = document.createDocumentFragment();

        Array.from(statement.childNodes).forEach((node) => {
            const isEm = node.nodeName === "EM";
            const text = node.textContent || "";

            text.split(/\s+/)
                .filter(Boolean)
                .forEach((word) => {
                    const span = document.createElement("span");
                    span.className = "word";

                    if (isEm) {
                        const em = document.createElement("em");
                        em.textContent = word;
                        span.appendChild(em);
                    } else {
                        span.textContent = word;
                    }

                    fragment.appendChild(span);
                    fragment.appendChild(
                        document.createTextNode(" ")
                    );
                });
        });

        statement.innerHTML = "";
        statement.appendChild(fragment);

        statementWords = Array.from(
            statement.querySelectorAll(".word")
        );
    }

    function updateStatement() {
        if (!statementWords.length) return;

        const rect = statement.getBoundingClientRect();
        const vh = window.innerHeight;

        // 0 quando la sezione entra, 1 quando è quasi uscita
        const progress = Math.min(
            Math.max((vh * 0.85 - rect.top) / (vh * 0.9), 0),
            1
        );

        const activeCount = Math.floor(
            progress * statementWords.length * 1.15
        );

        statementWords.forEach((word, i) => {
            word.style.opacity = i < activeCount ? "1" : "";
        });
    }


    /* ========================================
       CUSTOM CURSOR
       Dot immediato + ring con easing,
       etichetta da data-cursor.
    ======================================== */

    if (finePointer && !reduceMotion) {
        // Rimuove il vecchio div .custom-cursor dal markup
        document
            .querySelectorAll(".custom-cursor")
            .forEach((el) => el.remove());

        const ring = document.createElement("div");
        ring.className = "custom-cursor";
        ring.setAttribute("aria-hidden", "true");

        const label = document.createElement("span");
        label.className = "cursor-label";
        ring.appendChild(label);

        const dot = document.createElement("div");
        dot.className = "custom-cursor-dot";
        dot.setAttribute("aria-hidden", "true");

        document.body.appendChild(ring);
        document.body.appendChild(dot);

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;

        window.addEventListener(
            "mousemove",
            (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;

                dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
            },
            { passive: true }
        );

        (function animateCursor() {
            ringX += (mouseX - ringX) * 0.16;
            ringY += (mouseY - ringY) * 0.16;

            ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

            requestAnimationFrame(animateCursor);
        })();

        // Delegazione: funziona anche per i cloni del carosello
        document.addEventListener("mouseover", (e) => {
            const labelled = e.target.closest("[data-cursor]");
            const interactive = e.target.closest(
                "a, button, .portfolio-card"
            );

            if (labelled) {
                label.textContent =
                    labelled.getAttribute("data-cursor");
                ring.classList.add("has-label");
                ring.classList.remove("hovering");
            } else {
                ring.classList.remove("has-label");
                ring.classList.toggle(
                    "hovering",
                    Boolean(interactive)
                );
            }
        });

        // Nasconde il cursore quando il mouse esce dalla finestra
        document.addEventListener("mouseleave", () => {
            ring.style.opacity = "0";
            dot.style.opacity = "0";
        });

        document.addEventListener("mouseenter", () => {
            ring.style.opacity = "";
            dot.style.opacity = "";
        });
    }


    /* ========================================
       MAGNETIC ELEMENTS
       Gli elementi [data-magnetic] seguono
       leggermente il cursore.
    ======================================== */

    if (finePointer && !reduceMotion) {
        document
            .querySelectorAll("[data-magnetic]")
            .forEach((el) => {
                const strength =
                    parseFloat(el.dataset.magnetic) || 0.3;

                let raf = null;
                let targetX = 0;
                let targetY = 0;
                let currentX = 0;
                let currentY = 0;

                function animate() {
                    currentX += (targetX - currentX) * 0.18;
                    currentY += (targetY - currentY) * 0.18;

                    el.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;

                    if (
                        Math.abs(targetX - currentX) > 0.1 ||
                        Math.abs(targetY - currentY) > 0.1
                    ) {
                        raf = requestAnimationFrame(animate);
                    } else {
                        raf = null;
                    }
                }

                function schedule() {
                    if (!raf) raf = requestAnimationFrame(animate);
                }

                el.addEventListener("mousemove", (e) => {
                    const rect = el.getBoundingClientRect();
                    targetX =
                        (e.clientX - rect.left - rect.width / 2) *
                        strength;
                    targetY =
                        (e.clientY - rect.top - rect.height / 2) *
                        strength;
                    schedule();
                });

                el.addEventListener("mouseleave", () => {
                    targetX = 0;
                    targetY = 0;
                    schedule();
                });
            });
    }


    /* ========================================
       HERO CANVAS
       Particelle con connessioni e attrazione
       verso il mouse. Il colore segue il tema.
    ======================================== */

    const canvas = document.getElementById("hero-canvas");

    if (canvas && !reduceMotion) {
        const ctx = canvas.getContext("2d");
        let width, height, particles;
        let mouse = { x: null, y: null };

        function particleColor(alpha) {
            const muted = getComputedStyle(
                document.documentElement
            )
                .getPropertyValue("--muted")
                .trim();

            // muted è hex (#77736d): convertiamo in rgb
            const hex = muted.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);

            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        function init() {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;

            const density = Math.min(
                90,
                Math.floor((width * height) / 14000)
            );

            particles = [];
            for (let i = 0; i < density; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (Math.random() - 0.5) * 0.6,
                    radius: Math.random() * 1.8 + 0.8
                });
            }
        }

        window.addEventListener(
            "mousemove",
            (e) => {
                const rect = canvas.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
            },
            { passive: true }
        );

        function animateCanvas() {
            ctx.clearRect(0, 0, width, height);

            // Connessioni tra particelle vicine
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 110) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = particleColor(
                            0.12 * (1 - dist / 110)
                        );
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            particles.forEach((p) => {
                // Leggera attrazione verso il mouse
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = mouse.x - p.x;
                    const dy = mouse.y - p.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 200 && distance > 0.001) {
                        const force = 0.00008 * (1 - distance / 200);
                        p.vx += dx * force;
                        p.vy += dy * force;
                    }
                }

                // Attrito per non accelerare all'infinito
                p.vx *= 0.995;
                p.vy *= 0.995;

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = particleColor(0.3);
                ctx.fill();
            });
        }

        init();

        // Ferma il loop quando l'hero non è visibile
        let canvasRunning = false;

        function loop() {
            animateCanvas();

            if (canvasRunning) {
                requestAnimationFrame(loop);
            }
        }

        const canvasObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !canvasRunning) {
                        canvasRunning = true;
                        loop();
                    } else if (!entry.isIntersecting) {
                        canvasRunning = false;
                    }
                });
            },
            { threshold: 0 }
        );

        canvasObserver.observe(canvas);

        window.addEventListener("resize", init);
    }
})();
