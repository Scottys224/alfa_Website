document.addEventListener('DOMContentLoaded', () => {
    // 1. Copyright Year
    document.querySelectorAll("[data-annee-courante]").forEach((el) => {
        el.textContent = String(new Date().getFullYear());
    });

    // 3. Modals
    // Open
    document.querySelectorAll(".modal-trigger").forEach((el) => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            const modalId = el.dataset.modal;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = "flex";
                document.body.style.overflow = "hidden"; // Prevent scrolling
            }
        });
    });

    // Close
    document.querySelectorAll(".modal-close").forEach((el) => {
        el.addEventListener("click", (e) => {
            // Only trigger if clicked directly on the close button or the background overlay
            // Actually, some buttons are the "X" and some are the overlay.
            // In the original code, event might not be passed or handled.
            // Let's just close it.
            if (e && e.target !== el && !el.classList.contains('close-modal')) {
                // Wait, if it's the overlay (which usually has modal-close), we close it.
            }
            e.preventDefault();
            const modalId = el.dataset.modal;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        });
    });

    // Stop propagation inside modal content
    document.querySelectorAll(".modal-content-stop").forEach((el) => {
        el.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    });

    // 4. SmartLink (VULN-10)
    const APPLICATIONS = Object.freeze({
        client:   { scheme: "alfa",        paquet: "com.alfa.client"   },
        merchant: { scheme: "alfamerchant", paquet: "com.alfa.merchant" },
        driver:   { scheme: "alfadriver",   paquet: "com.alfa.driver"   },
    });

    document.querySelectorAll(".smart-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const appType = link.dataset.app;
            const platform = link.dataset.os;

            const app = APPLICATIONS[appType];
            if (!app) return;

            const storeUrl = `https://play.google.com/store/apps/details?id=${app.paquet}`;

            if (platform !== "android") {
                window.location.href = storeUrl;
                return;
            }

            // Android fallback via intent
            window.location.href = 
                `intent://#Intent;scheme=${app.scheme};package=${app.paquet};` +
                `S.browser_fallback_url=${encodeURIComponent(storeUrl)};end`;
        });
    });
});
