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
       LOOP INFINITO
    ======================================== */

    originalSlides.forEach((slide) => {

        const clone = slide.cloneNode(true);

        track.appendChild(clone);

    });


    originalSlides
        .slice()
        .reverse()
        .forEach((slide) => {

            const clone = slide.cloneNode(true);

            track.insertBefore(
                clone,
                track.firstChild
            );

        });


    const slides = Array.from(
        track.querySelectorAll(".portfolio-card")
    );


    /* ========================================
       INDICE INIZIALE
    ======================================== */

    let index = slideCount;


    /* ========================================
       POSIZIONE CENTRALE
    ======================================== */

    function getCenterPosition(slideIndex) {

        const slide = slides[slideIndex];

        if (!slide) {
            return 0;
        }

        const viewportWidth =
            viewport.clientWidth;

        const slideLeft =
            slide.offsetLeft;

        const slideWidth =
            slide.offsetWidth;

        return -(
            slideLeft -
            (viewportWidth / 2) +
            (slideWidth / 2)
        );
    }
/* ========================================
       AGGIORNAMENTO CAROUSEL (MODIFICATO)
    ======================================== */
    function updateCarousel(animate = true) {
        const translate = getCenterPosition(index);

        if (!animate) {
            // Blocca tutte le transizioni CSS sui figli del carosello
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

        if (!animate) {
            // Forza il reflow del browser affinché le modifiche siano istantanee
            void track.offsetWidth; 
            // Riattiva le transizioni
            /*carousel.classList.remove("disable-transitions");*/
            // Aspettiamo che il browser disegni effettivamente il frame 
            // prima di riattivare le transizioni CSS
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    carousel.classList.remove("disable-transitions");
                });
            });
        }
    }

    /* ========================================
       POSIZIONE INIZIALE
    ======================================== */

    updateCarousel(false);


    /* ========================================
       VAI A UNA SLIDE
    ======================================== */

    function goToSlide(slideIndex) {

        if (
            slideIndex < 0 ||
            slideIndex >= slides.length
        ) {
            return;
        }

        index = slideIndex;

        updateCarousel(true);

    }


    /* ========================================
       NEXT
    ======================================== */

    if (nextButton) {

        nextButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                index++;

                updateCarousel(true);

            }
        );

    }


    /* ========================================
       PREVIOUS
    ======================================== */

    if (prevButton) {

        prevButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                index--;

                updateCarousel(true);

            }
        );

    }


    /* ========================================
       LOOP INFINITO
    ======================================== */

    track.addEventListener(
        "transitionend",
        (event) => {
            
            // FONDAMENTALE: impedisce che le animazioni delle singole 
            // card interferiscano con la transizione della traccia base
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

                index =
                    slideCount * 2 - 1;

                updateCarousel(false);

            }

        }
    );


    /* ========================================
       DRAG / SWIPE
    ======================================== */

    let startX = 0;
    let currentX = 0;

    let dragging = false;
    let hasDragged = false;

    /*
     * Memorizziamo la card premuta.
     *
     * Questo è importante perché con
     * setPointerCapture() il click successivo
     * potrebbe avere come target il viewport
     * invece della card.
     */

    let pressedCard = null;


    /* ========================================
       POINTER DOWN
    ======================================== */

    viewport.addEventListener(
        "pointerdown",
        (event) => {

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


            /*
             * Salviamo la card effettivamente
             * premuta.
             */

            pressedCard =
                event.target.closest(
                    ".portfolio-card"
                );


            /*
             * Pointer capture per mantenere
             * il drag attivo anche se il cursore
             * esce dal viewport.
             */

            viewport.setPointerCapture(
                event.pointerId
            );


            track.style.transition =
                "none";

        }
    );


    /* ========================================
       POINTER MOVE
    ======================================== */

    viewport.addEventListener(
        "pointermove",
        (event) => {

            if (!dragging) {
                return;
            }


            currentX = event.clientX;


            const difference =
                currentX - startX;


            if (Math.abs(difference) > 10) {

                hasDragged = true;

            }


            const basePosition =
                getCenterPosition(index);


            track.style.transform =
                `translateX(${basePosition + difference}px)`;

        }
    );


    /* ========================================
       POINTER UP
    ======================================== */

    viewport.addEventListener(
        "pointerup",
        (event) => {

            if (!dragging) {
                return;
            }


            dragging = false;


            if (
                viewport.hasPointerCapture(
                    event.pointerId
                )
            ) {

                viewport.releasePointerCapture(
                    event.pointerId
                );

            }


            const difference =
                currentX - startX;


            /*
             * Swipe verso sinistra
             */

            if (difference < -50) {

                index++;

                updateCarousel(true);

                return;
            }


            /*
             * Swipe verso destra
             */

            if (difference > 50) {

                index--;

                updateCarousel(true);

                return;
            }


            /*
             * Movimento troppo piccolo:
             * ritorniamo semplicemente
             * alla posizione originale.
             */

            updateCarousel(true);

        }
    );


    /* ========================================
       POINTER CANCEL
    ======================================== */

    viewport.addEventListener(
        "pointercancel",
        (event) => {

            if (!dragging) {
                return;
            }


            dragging = false;


            if (
                viewport.hasPointerCapture(
                    event.pointerId
                )
            ) {

                viewport.releasePointerCapture(
                    event.pointerId
                );

            }


            updateCarousel(true);

        }
    );


    /* ========================================
       CLICK SULLE CARD
    ======================================== */

    viewport.addEventListener(
        "click",
        (event) => {

            /*
             * Prima proviamo a trovare la card
             * normalmente.
             */

            let clickedCard =
                event.target.closest(
                    ".portfolio-card"
                );


            /*
             * Se Pointer Capture ha fatto sì che
             * il target sia il viewport, usiamo
             * la card che avevamo memorizzato
             * al pointerdown.
             */

            if (!clickedCard) {

                clickedCard = pressedCard;

            }


            if (!clickedCard) {
                return;
            }


            /*
             * Se l'utente ha effettuato un vero
             * drag/swipe, NON deve partire
             * il click.
             */

            if (hasDragged) {

                event.preventDefault();

                hasDragged = false;
                pressedCard = null;

                return;
            }


            /*
             * Troviamo l'indice della card cliccata.
             */

            const clickedIndex =
                slides.indexOf(clickedCard);


            if (clickedIndex === -1) {

                pressedCard = null;

                return;
            }


            /* --------------------------------
               CARD CENTRALE
            -------------------------------- */

            if (
                clickedIndex === index
            ) {

                /*
                 * La card è centrale.
                 *
                 * Recuperiamo il suo link
                 * e lasciamo che il browser
                 * apra la pagina.
                 */

                const link =
                    clickedCard.querySelector(
                        "a"
                    );


                if (link) {

                    window.location.href =
                        link.href;

                }


                pressedCard = null;

                return;
            }


            /* --------------------------------
               CARD LATERALE
            -------------------------------- */

            event.preventDefault();


            /*
             * Portiamo al centro
             * la card cliccata.
             */

            goToSlide(clickedIndex);


            pressedCard = null;

        }
    );


    /* ========================================
       RESIZE
    ======================================== */

    window.addEventListener(
        "resize",
        () => {

            updateCarousel(false);

        }
    );

/* ========================================
       AUTOPLAY & VISIBILITA'
    ======================================== */
    let autoplayTimer;
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
    }

    // 1. Avvia l'autoplay quando il carosello entra nella visuale
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startAutoplay();
            } else {
                stopAutoplay();
            }
        });
    }, {
        threshold: 0.15
    });

    observer.observe(carousel);

    // 2. Metti in pausa SOLO durante l'interazione attiva (click/drag)
    viewport.addEventListener("pointerdown", stopAutoplay);
    viewport.addEventListener("pointerup", startAutoplay);
    viewport.addEventListener("pointercancel", startAutoplay);
});