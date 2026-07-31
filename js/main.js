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

        // Close menu when a link inside is clicked (solves the "stuck in cloud" anchor link issue)
        const menuLinks = navLinks.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                // If we are on mobile and the menu is open, simulate a click on the burger to close it
                if (window.innerWidth <= 992 && mobileMenuBtn.getAttribute("aria-expanded") === "true") {
                    mobileMenuBtn.click();
                }
            });
        });
        
        function fermerMenuMobile() {
            mobileMenuBtn.setAttribute("aria-expanded", "false");
            navLinks.removeAttribute("style");
            mobileMenuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
        }

        // Reset on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                navLinks.removeAttribute("style");
                mobileMenuBtn.setAttribute("aria-expanded", "false");
            } else {
                fermerMenuMobile();
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

    // 3. Fermer les menus déroulants après un clic (très utile pour la sélection de langue)
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.addEventListener('click', function() {
            const dropdown = this.closest('.dropdown-content');
            if (dropdown) {
                dropdown.style.display = 'none'; // Force hide
                setTimeout(() => {
                    dropdown.style.display = ''; // Restore CSS hover control
                }, 100);
            }
        });
    });
    // 4. Logique de validation de formulaire: empêcher de cocher le consentement si tout n'est pas rempli
    const consentCheckboxes = document.querySelectorAll('input[type="checkbox"][name="consentement"]');
    consentCheckboxes.forEach(checkbox => {
        const form = checkbox.closest('form');
        if (form) {
            // Identifier tous les champs requis, sauf la checkbox elle-même
            const requiredFields = Array.from(form.querySelectorAll('input[required], select[required], textarea[required]')).filter(el => el !== checkbox);
            
            if (requiredFields.length > 0) {
                // Fonction pour vérifier l'état des champs
                const checkFields = () => {
                    const allFilled = requiredFields.every(field => field.value.trim() !== '');
                    checkbox.disabled = !allFilled;
                    if (!allFilled) {
                        checkbox.checked = false; // On décoche automatiquement si c'est incomplet
                    }
                };

                // Écouter les changements sur chaque champ requis
                requiredFields.forEach(field => {
                    field.addEventListener('input', checkFields);
                    field.addEventListener('change', checkFields);
                });

                // Vérification initiale au chargement
                checkFields();
            }
        }
    });

    // 5. Alerte pour le réseau social X (Twitter) en construction
    const twitterLinks = document.querySelectorAll('a[aria-label="X (Twitter)"]');
    twitterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Empêche de scroller en haut de la page
            
            // Retirer l'ancien toast s'il existe
            let existingToast = document.getElementById("global-toast");
            if (existingToast) existingToast.remove();
            
            // Créer le nouveau toast
            const toast = document.createElement("div");
            toast.id = "global-toast";
            toast.className = "global-toast";
            toast.innerHTML = `
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 4px;">
                    <path d="M4 4l11.73 16h5L9 4z"></path>
                    <path d="M4 20l6.76-6.76"></path>
                </svg>
                <span>Notre page officielle X (Twitter) est en cours de création.<br><br>Elle sera très bientôt disponible !</span>
                <button class="toast-btn" id="global-toast-close">OK</button>
            `;
            document.body.appendChild(toast);
            
            // Animation d'apparition
            setTimeout(() => {
                toast.classList.add("show");
            }, 10);
            
            // Gérer le clic sur le bouton OK pour fermer
            document.getElementById("global-toast-close").addEventListener("click", () => {
                toast.classList.remove("show");
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 400); // attendre la fin de la transition CSS
            });
        });
    });
});

