const header = document.querySelector(".site-header");

let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    // Se siamo molto vicini alla cima, la barra deve essere visibile
    if (currentScrollY <= 50) {
        header.classList.remove("header-hidden");
    }

    // Scroll verso il basso
    else if (currentScrollY > lastScrollY) {
        header.classList.add("header-hidden");
    }

    // Scroll verso l'alto
    else if (currentScrollY < lastScrollY) {
        header.classList.remove("header-hidden");
    }

    lastScrollY = currentScrollY;
});