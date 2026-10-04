const canvas = document.getElementById("hero-canvas");
if (canvas) {
    const ctx = canvas.getContext("2d");
    let width, height, particles;
    let mouse = { x: null, y: null };

    function init() {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
        particles = [];
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                radius: Math.random() * 2 + 1
            });
        }
    }

    window.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    function animateCanvas() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            // Leggera gravità verso il mouse
            if (mouse.x && mouse.y) {
                let dx = mouse.x - p.x;
                let dy = mouse.y - p.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 200) {
                    p.vx += dx * 0.0001; // Forza di attrazione
                    p.vy += dy * 0.0001;
                }
            }
            p.x += p.vx;
            p.y += p.vy;

            // Rimbalzo sui bordi
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(119, 115, 109, 0.25)"; // Colore --muted con opacità
            ctx.fill();
        });
        requestAnimationFrame(animateCanvas);
    }
    
    init();
    animateCanvas();
    window.addEventListener("resize", init);
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {// Aggiungiamo un ritardo di 50ms per far partire l'animazione
            setTimeout(() => {
                entry.target.classList.add('is-visible');
            }, 50);
            observer.unobserve(entry.target); // Ferma l'osservazione dopo la prima volta
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const parallaxImages = document.querySelectorAll('.hero-image img');

window.addEventListener('scroll', () => {
    requestAnimationFrame(() => {
        parallaxImages.forEach(img => {
            const speed = 0.1;
            const yPos = -(window.scrollY * speed);
            img.style.transform = `scale(1.2) translateY(${yPos}px)`;
        });
    });
});

const cursor = document.querySelector('.custom-cursor');
if (cursor) {
    let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        // Easing per un movimento fluido
        cursorX += (mouseX - cursorX) * 0.7;
        cursorY += (mouseY - cursorY) * 0.7;
        cursor.style.transform = `translate(${cursorX - 8}px, ${cursorY - 8}px)`; // -12 centra il cerchio (metà di 24px)
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Effetto espansione sui link
    document.querySelectorAll('a, button, .portfolio-card').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
}
