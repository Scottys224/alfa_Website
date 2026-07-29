document.addEventListener('DOMContentLoaded', () => {
  // Purge de l'historique obsolète au chargement (INFO-03)
  try {
    let history = JSON.parse(localStorage.getItem("alfaFormSubmissions") || "[]");
    const now = Date.now();
    const rateLimitWindow = 3 * 60 * 1000;
    const filteredHistory = history.filter((time) => now - time < rateLimitWindow);
    if (filteredHistory.length !== history.length) {
      localStorage.setItem("alfaFormSubmissions", JSON.stringify(filteredHistory));
    }
  } catch(e) { console.warn("Erreur init form-handler:", e); }

  document.querySelectorAll("[data-alfa-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const bouton = form.querySelector('button[type="submit"]');
      if (bouton.disabled) return;

      // Garde-fou côté client hCaptcha (si configuré)
      const jetonCaptcha = form.querySelector('[name="h-captcha-response"]');
      // On ne bloque que si le jeton existe dans le DOM (donc le widget est là)
      // et qu'il est vide, OU s'il n'y a pas de jeton mais que c'est un form qui devrait l'avoir.
      // Le plus simple : s'il y a un conteneur h-captcha, on s'attend à un jeton
      if (form.querySelector('.h-captcha') && jetonCaptcha && !jetonCaptcha.value) {
        alert("Veuillez valider le contrôle anti-robot avant d'envoyer.");
        return;
      }

      // Nettoyage des erreurs précédentes
      form.querySelectorAll('.email-error-msg').forEach(el => el.remove());
      form.querySelectorAll('input').forEach(input => {
        if (input.dataset.originalBorder !== undefined) {
          input.style.borderColor = input.dataset.originalBorder;
        }
      });

      // Validation stricte des emails (minuscules uniquement)
      let hasUppercaseEmail = false;
      let firstInvalidInput = null;
      
      form.querySelectorAll('input').forEach(input => {
        const isEmailField = input.type === 'email' || input.name === 'email' || (input.value && input.value.includes('@'));
        if (isEmailField && input.value && /[A-Z]/.test(input.value)) {
          hasUppercaseEmail = true;
          if (!firstInvalidInput) firstInvalidInput = input;
          
          // Sauvegarder la bordure originale si ce n'est pas déjà fait
          if (input.dataset.originalBorder === undefined) {
            input.dataset.originalBorder = input.style.borderColor || '';
          }
          input.style.borderColor = '#dc3545'; // Rouge standard
          
          // Créer le message d'erreur
          const errorMsg = document.createElement('span');
          errorMsg.className = 'email-error-msg';
          errorMsg.style.color = '#dc3545';
          errorMsg.style.fontSize = '0.85rem';
          errorMsg.style.marginTop = '4px';
          errorMsg.style.display = 'block';
          errorMsg.innerText = "Veuillez saisir votre e-mail en minuscules uniquement.";
          
          // L'insérer juste après le champ
          input.parentNode.insertBefore(errorMsg, input.nextSibling);
        }
      });

      if (hasUppercaseEmail) {
        if (firstInvalidInput) {
          firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalidInput.focus();
        }
        return; // On bloque l'envoi sans utiliser d'alert()
      }

      // Protection UX (Max 4 requêtes par 3 minutes)
      const now = Date.now();
      const rateLimitWindow = 3 * 60 * 1000;
      const maxRequests = 4;
      let history = JSON.parse(
        localStorage.getItem("alfaFormSubmissions") || "[]"
      );
      history = history.filter((time) => now - time < rateLimitWindow);
      if (history.length >= maxRequests) {
        alert(
          "Vous avez envoyé trop de messages. Veuillez patienter 3 minutes avant de réessayer."
        );
        return;
      }
      history.push(now);
      localStorage.setItem("alfaFormSubmissions", JSON.stringify(history));

      const originalBtnText = bouton.innerText;
      bouton.innerText = "Envoi en cours...";
      bouton.disabled = true;

      try {
        const formData = new FormData(form);
        const r = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        });
        
        const data = await r.json();
        
        if (data.success) {
          form.style.display = "none";
          const blocSucces = document.getElementById(form.dataset.succes);
          if (blocSucces) {
            blocSucces.style.display = "block";
          } else {
            console.warn(`Bloc de confirmation introuvable : #${form.dataset.succes}`);
            alert("Votre message a bien été envoyé. Merci !");
          }
        } else {
          throw new Error(data.message || "Erreur de l'API");
        }
      } catch (err) {
        alert("Une erreur s'est produite : " + err.message);
        bouton.innerText = originalBtnText;
        bouton.disabled = false;
      }
    });
  });
});
