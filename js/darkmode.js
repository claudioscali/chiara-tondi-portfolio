/* ========================================
   DARKMODE.JS
   Il tema viene già applicato da uno
   script inline in <head> (niente flash
   al caricamento): qui gestiamo solo
   il toggle e il salvataggio.
======================================== */

(function () {
    const themeToggle = document.getElementById("theme-toggle");

    if (!themeToggle) {
        return;
    }

    const root = document.documentElement;

    themeToggle.addEventListener("click", () => {
        if (root.hasAttribute("data-theme")) {
            root.removeAttribute("data-theme");
            localStorage.setItem("theme", "light");
        } else {
            root.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
        }
    });
})();
