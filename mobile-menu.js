document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const overlayBackdrop = document.createElement('div'); // Create overlay dynamically
    overlayBackdrop.classList.add('overlay-backdrop');
    document.body.appendChild(overlayBackdrop); // Append to body

    hamburgerMenu.addEventListener('click', () => {
        mobileMenuOverlay.classList.toggle('open');
        overlayBackdrop.classList.toggle('active');
    });

    overlayBackdrop.addEventListener('click', () => {
        mobileMenuOverlay.classList.remove('open');
        overlayBackdrop.classList.remove('active');
    });

    // Close menu when a navigation link is clicked (optional, but good UX)
    mobileMenuOverlay.querySelectorAll('.mobile-nav a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuOverlay.classList.remove('open');
            overlayBackdrop.classList.remove('active');
        });
    });
});