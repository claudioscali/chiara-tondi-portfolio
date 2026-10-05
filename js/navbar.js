
/* ========================================
   NAVBAR.JS
   L'header si nasconde scrollando in giù
   e riappare scrollando in su.
======================================== */

(function () {
    const header = document.querySelector(".site-header");

    if (!header) {
        return;
    }

    let lastScrollY = window.scrollY;
    let ticking = false;

    function update() {
        ticking = false;

        const currentScrollY = window.scrollY;

        // Vicino alla cima: sempre visibile
        if (currentScrollY <= 50) {
            header.classList.remove("header-hidden");
        }

        // Scroll verso il basso (con piccola tolleranza)
        else if (currentScrollY > lastScrollY + 4) {
            header.classList.add("header-hidden");
        }

        // Scroll verso l'alto
        else if (currentScrollY < lastScrollY - 4) {
            header.classList.remove("header-hidden");
        }

        lastScrollY = currentScrollY;
    }

    window.addEventListener(
        "scroll",
        () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        },
        { passive: true }
    );
})();
