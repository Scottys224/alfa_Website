document.addEventListener('DOMContentLoaded', () => {
    // 1. Copyright Year
    document.querySelectorAll("[data-annee-courante]").forEach((el) => {
        el.textContent = String(new Date().getFullYear());
    });
});
