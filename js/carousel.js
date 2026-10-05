/* ========================================
   CAROUSEL.JS
   Carosello infinito con drag/swipe,
   autoplay, dots, contatore e tastiera.
======================================== */

document.addEventListener("DOMContentLoaded", () => {

    const carousel = document.querySelector(".portfolio-carousel");

    if (!carousel) {
        return;
    }


    /* ========================================
       ELEMENTI DEL CAROUSEL
    ======================================== */

    const viewport = carousel.querySelector(".carousel-viewport");
    const track = carousel.querySelector(".carousel-track");
    const prevButton = carousel.querySelector(".carousel-prev");
    const nextButton = carousel.querySelector(".carousel-next");

    const originalSlides = Array.from(
        track.querySelectorAll(".portfolio-card")
    );

    const slideCount = originalSlides.length;

    if (slideCount === 0) {
        return;
    }


    /* ========================================
       LOOP INFINITO (cloni prima e dopo)
    ======================================== */

    originalSlides.forEach((slide) => {
        const clone = slide.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
    });

    originalSlides
        .slice()
        .reverse()
        .forEach((slide) => {
            const clone = slide.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            track.insertBefore(clone, track.firstChild);
        });

    const slides = Array.from(
        track.querySelectorAll(".portfolio-card")
    );


    /* ========================================
       INDICE INIZIALE
    ======================================== */

    let index = slideCount;

    // Indice logico 0..slideCount-1 per dots e contatore
    function logicalIndex() {
        return (
            ((index - slideCount) % slideCount + slideCount)
        ) % slideCount;
    }


    /* ========================================
       DOTS + CONTATORE (generati dal JS)
    ======================================== */

    const dots = document.createElement("div");
    dots.className = "carousel-dots";
    dots.setAttribute("role", "tablist");
    dots.setAttribute("aria-label", "Slides");

    const dotButtons = [];

    for (let i = 0; i < slideCount; i++) {
        const dot = document.createElement("button");
        dot.className = "carousel-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", `Vai alla slide ${i + 1}`);

        dot.addEventListener("click", () => {
            goToSlide(index + (i - logicalIndex()));
            restartAutoplay();
        });

        dots.appendChild(dot);
        dotButtons.push(dot);
    }

    const counter = document.createElement("p");
    counter.className = "carousel-counter";
    counter.setAttribute("aria-hidden", "true");

    carousel.appendChild(dots);
    carousel.appendChild(counter);

    function updateDots() {
        const current = logicalIndex();

        dotButtons.forEach((dot, i) => {
            dot.classList.toggle("is-current", i === current);
        });

        counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slideCount).padStart(2, "0")}`;
    }


    /* ========================================
       POSIZIONE CENTRALE
    ======================================== */

    function getCenterPosition(slideIndex) {
        const slide = slides[slideIndex];

        if (!slide) {
            return 0;
        }

        const viewportWidth = viewport.clientWidth;
        const slideLeft = slide.offsetLeft;
        const slideWidth = slide.offsetWidth;

        return -(
            slideLeft -
            viewportWidth / 2 +
            slideWidth / 2
        );
    }


    /* ========================================
       AGGIORNAMENTO CAROUSEL
    ======================================== */

    function updateCarousel(animate = true) {
        const translate = getCenterPosition(index);

        if (!animate) {
            carousel.classList.add("disable-transitions");
        }

        track.style.transition = animate
            ? "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
            : "none";

        track.style.transform = `translateX(${translate}px)`;

        slides.forEach((slide, i) => {
            slide.classList.remove("is-active", "is-adjacent");
            const distance = Math.abs(i - index);

            if (distance === 0) {
                slide.classList.add("is-active");
            } else if (distance === 1) {
                slide.classList.add("is-adjacent");
            }
        });

        updateDots();

        if (!animate) {
            void track.offsetWidth;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    carousel.classList.remove("disable-transitions");
                });
            });
        }
    }

    updateCarousel(false);


    /* ========================================
       VAI A UNA SLIDE
    ======================================== */

    function goToSlide(slideIndex) {
        if (slideIndex < 0 || slideIndex >= slides.length) {
            return;
        }

        index = slideIndex;
        updateCarousel(true);
    }


    /* ========================================
       PULSANTI NEXT / PREV
    ======================================== */

    if (nextButton) {
        nextButton.addEventListener("click", (event) => {
            event.preventDefault();
            index++;
            updateCarousel(true);
            restartAutoplay();
        });
    }

    if (prevButton) {
        prevButton.addEventListener("click", (event) => {
            event.preventDefault();
            index--;
            updateCarousel(true);
            restartAutoplay();
        });
    }


    /* ========================================
       TASTIERA (solo quando il carosello
       è visibile nel viewport)
    ======================================== */

    let carouselVisible = false;

    document.addEventListener("keydown", (event) => {
        if (!carouselVisible) return;

        if (event.key === "ArrowRight") {
            index++;
            updateCarousel(true);
            restartAutoplay();
        } else if (event.key === "ArrowLeft") {
            index--;
            updateCarousel(true);
            restartAutoplay();
        }
    });


    /* ========================================
       RICUCITURA DEL LOOP INFINITO
    ======================================== */

    track.addEventListener("transitionend", (event) => {
        if (event.target !== track) {
            return;
        }

        if (event.propertyName !== "transform") {
            return;
        }

        if (index >= slideCount * 2) {
            index = slideCount;
            updateCarousel(false);
        }

        if (index < slideCount) {
            index = slideCount * 2 - 1;
            updateCarousel(false);
        }
    });


    /* ========================================
       DRAG / SWIPE
    ======================================== */

    let startX = 0;
    let currentX = 0;

    let dragging = false;
    let hasDragged = false;

    let pressedCard = null;

    viewport.addEventListener("pointerdown", (event) => {
        if (
            event.pointerType === "mouse" &&
            event.button !== 0
        ) {
            return;
        }

        dragging = true;
        hasDragged = false;

        startX = event.clientX;
        currentX = event.clientX;

        pressedCard = event.target.closest(".portfolio-card");

        viewport.setPointerCapture(event.pointerId);

        track.style.transition = "none";
    });

    viewport.addEventListener("pointermove", (event) => {
        if (!dragging) {
            return;
        }

        currentX = event.clientX;

        const difference = currentX - startX;

        if (Math.abs(difference) > 10) {
            hasDragged = true;
        }

        const basePosition = getCenterPosition(index);

        track.style.transform =
            `translateX(${basePosition + difference}px)`;
    });

    viewport.addEventListener("pointerup", (event) => {
        if (!dragging) {
            return;
        }

        dragging = false;

        if (viewport.hasPointerCapture(event.pointerId)) {
            viewport.releasePointerCapture(event.pointerId);
        }

        const difference = currentX - startX;

        // Swipe verso sinistra
        if (difference < -50) {
            index++;
            updateCarousel(true);
            return;
        }

        // Swipe verso destra
        if (difference > 50) {
            index--;
            updateCarousel(true);
            return;
        }

        // Movimento troppo piccolo: torna alla posizione
        updateCarousel(true);
    });

    viewport.addEventListener("pointercancel", (event) => {
        if (!dragging) {
            return;
        }

        dragging = false;

        if (viewport.hasPointerCapture(event.pointerId)) {
            viewport.releasePointerCapture(event.pointerId);
        }

        updateCarousel(true);
    });


    /* ========================================
       CLICK SULLE CARD
    ======================================== */

    viewport.addEventListener("click", (event) => {
        let clickedCard = event.target.closest(".portfolio-card");

        // Con pointer capture il target può essere il viewport
        if (!clickedCard) {
            clickedCard = pressedCard;
        }

        if (!clickedCard) {
            return;
        }

        // Un vero drag non deve scatenare il click
        if (hasDragged) {
            event.preventDefault();
            hasDragged = false;
            pressedCard = null;
            return;
        }

        const clickedIndex = slides.indexOf(clickedCard);

        if (clickedIndex === -1) {
            pressedCard = null;
            return;
        }

        /* ---------- CARD CENTRALE ---------- */

        if (clickedIndex === index) {
            const link = clickedCard.querySelector("a");

            if (link) {
                window.location.href = link.href;
            }

            pressedCard = null;
            return;
        }

        /* ---------- CARD LATERALE ---------- */

        event.preventDefault();
        goToSlide(clickedIndex);
        restartAutoplay();

        pressedCard = null;
    });


    /* ========================================
       RESIZE
    ======================================== */

    window.addEventListener("resize", () => {
        updateCarousel(false);
    });


    /* ========================================
       AUTOPLAY & VISIBILITÀ
    ======================================== */

    let autoplayTimer = null;
    const autoplayDelay = 4000;

    function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(() => {
            index++;
            updateCarousel(true);
        }, autoplayDelay);
    }

    function stopAutoplay() {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
    }

    function restartAutoplay() {
        if (carouselVisible) {
            startAutoplay();
        }
    }

    // Avvia/ferma l'autoplay in base alla visibilità
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                carouselVisible = entry.isIntersecting;

                if (entry.isIntersecting) {
                    startAutoplay();
                } else {
                    stopAutoplay();
                }
            });
        },
        { threshold: 0.15 }
    );

    observer.observe(carousel);

    // Pausa durante l'interazione attiva
    viewport.addEventListener("pointerdown", stopAutoplay);
    viewport.addEventListener("pointerup", startAutoplay);
    viewport.addEventListener("pointercancel", startAutoplay);

    // Pausa quando il mouse è sopra il carosello
    viewport.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") {
            stopAutoplay();
        }
    });

    viewport.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "mouse") {
            startAutoplay();
        }
    });

    // Pausa quando la scheda del browser non è visibile
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopAutoplay();
        } else if (carouselVisible) {
            startAutoplay();
        }
    });
});
