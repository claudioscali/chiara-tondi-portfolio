const themeToggle = document.getElementById('theme-toggle');
const body = document.documentElement; // Usa l'html tag per impostare l'attributo

// Controlla se l'utente aveva già scelto il tema scuro nelle visite precedenti
if (localStorage.getItem('theme') === 'dark') {
    body.setAttribute('data-theme', 'dark');
}

themeToggle.addEventListener('click', () => {
    if (body.hasAttribute('data-theme')) {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
});