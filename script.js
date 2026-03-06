document.addEventListener('mousemove', (e) => {
    const spotlight = document.getElementById('spotlight');
    if (spotlight) {
        const x = e.clientX;
        const y = e.clientY;
        spotlight.style.setProperty('--x', `${x}px`);
        spotlight.style.setProperty('--y', `${y}px`);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        if (link.classList.contains('boto-cv') || (link.href && link.href.includes('linkedin.com'))) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Linkedin i CV temporalment no disponibles, estic treballant per millorar-los...");
            });
        }
    });

    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("En desenvolupament.. Disculpeu les molesties :(");
        });
    }
});