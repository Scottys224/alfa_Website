// main.js - Code Javascript moderne (ES6+), sécurisé et performant

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Gestion sécurisée du menu mobile
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const navLinks = document.querySelector(".nav-links");
    
    if (mobileMenuBtn && navLinks) {
        // Toggle menu on click
        mobileMenuBtn.addEventListener("click", () => {
            const isExpanded = mobileMenuBtn.getAttribute("aria-expanded") === "true";
            mobileMenuBtn.setAttribute("aria-expanded", !isExpanded);
            
            if (!isExpanded) {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '80px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = 'rgba(255, 255, 255, 0.95)';
                navLinks.style.backdropFilter = 'blur(10px)';
                navLinks.style.padding = '24px';
                navLinks.style.boxShadow = 'var(--shadow-md)';
                navLinks.style.alignItems = 'flex-start';
                
                // SVG X icon
                mobileMenuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            } else {
                navLinks.style.display = 'none';
                
                // SVG Burger icon
                mobileMenuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
            }
        });
        
        // Reset on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'row';
                navLinks.style.position = 'static';
                navLinks.style.background = 'transparent';
                navLinks.style.padding = '0';
                navLinks.style.boxShadow = 'none';
                navLinks.style.alignItems = 'center';
            } else if (mobileMenuBtn.getAttribute("aria-expanded") !== "true") {
                navLinks.style.display = 'none';
            }
        });
    }

    // 2. Animation fluide au défilement (Intersection Observer API)
    const elementsToAnimate = document.querySelectorAll('.ecosystem-card, .step-card, .feature-text, .security-item');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    elementsToAnimate.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    });
    
    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, (index % 4) * 100); // Cascade max 4
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    elementsToAnimate.forEach(el => animationObserver.observe(el));
});
