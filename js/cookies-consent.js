"use strict";

const CONSENT_STORAGE_KEY = "alfa_cookie_consent";
const CONSENT_VERSION = 1;

/*
 * Remplacez ces valeurs seulement lorsque vous aurez réellement
 * créé Google Analytics et Meta Pixel.
 */
const GOOGLE_ANALYTICS_ID = "G-XXXXXXXXXX";
const META_PIXEL_ID = "123456789012345";

document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("cookie-banner");
  const settings = document.getElementById("cookie-settings");

  const acceptAllButton = document.getElementById("cookie-accept-all");
  const rejectAllButton = document.getElementById("cookie-reject-all");
  const customizeButton = document.getElementById("cookie-customize");
  const saveSettingsButton = document.getElementById(
    "cookie-save-settings"
  );
  const cancelSettingsButton = document.getElementById(
    "cookie-settings-cancel"
  );

  const analyticsCheckbox = document.getElementById(
    "consent-analytics"
  );
  const marketingCheckbox = document.getElementById(
    "consent-marketing"
  );

  const manageCookiesButtons = document.querySelectorAll(
    "[data-open-cookie-settings]"
  );

  if (!banner || !settings) {
    return;
  }

  const savedConsent = readConsent();

  if (savedConsent) {
    applyConsent(savedConsent);
  } else {
    banner.hidden = false;
  }

  acceptAllButton?.addEventListener("click", () => {
    saveAndApplyConsent({
      necessary: true,
      analytics: true,
      marketing: true
    });

    closeAllWindows();
  });

  rejectAllButton?.addEventListener("click", () => {
    saveAndApplyConsent({
      necessary: true,
      analytics: false,
      marketing: false
    });

    closeAllWindows();
  });

  customizeButton?.addEventListener("click", () => {
    banner.hidden = true;
    settings.hidden = false;
  });

  saveSettingsButton?.addEventListener("click", () => {
    saveAndApplyConsent({
      necessary: true,
      analytics: Boolean(analyticsCheckbox?.checked),
      marketing: Boolean(marketingCheckbox?.checked)
    });

    closeAllWindows();
  });

  cancelSettingsButton?.addEventListener("click", () => {
    settings.hidden = true;

    if (!readConsent()) {
      banner.hidden = false;
    }
  });

  manageCookiesButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const currentConsent = readConsent();

      if (analyticsCheckbox) analyticsCheckbox.checked =
        currentConsent?.analytics ?? false;

      if (marketingCheckbox) marketingCheckbox.checked =
        currentConsent?.marketing ?? false;

      banner.hidden = true;
      settings.hidden = false;
    });
  });

  function closeAllWindows() {
    banner.hidden = true;
    settings.hidden = true;
  }
});

function saveAndApplyConsent(preferences) {
  const consent = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    savedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(consent)
    );
  } catch (error) {
    console.error(
      "Impossible d'enregistrer le consentement :",
      error
    );
  }

  applyConsent(consent);
}

function readConsent() {
  try {
    const rawConsent = localStorage.getItem(CONSENT_STORAGE_KEY);

    if (!rawConsent) {
      return null;
    }

    const consent = JSON.parse(rawConsent);

    if (consent.version !== CONSENT_VERSION) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }

    return consent;
  } catch (error) {
    console.error(
      "Impossible de lire le consentement :",
      error
    );

    return null;
  }
}

function applyConsent(consent) {
  // Web3Forms and Google Translate are now loaded statically in the HTML
  
  if (consent.analytics) {
    loadGoogleAnalytics();
  }

  if (consent.marketing) {
    loadMetaPixel();
  }
}



function loadGoogleAnalytics() {
  if (
    !GOOGLE_ANALYTICS_ID ||
    GOOGLE_ANALYTICS_ID === "G-XXXXXXXXXX"
  ) {
    console.info(
      "Google Analytics n'est pas encore configuré."
    );
    return;
  }

  if (document.getElementById("alfa-google-analytics")) {
    return;
  }

  const script = document.createElement("script");

  script.id = "alfa-google-analytics";
  script.async = true;
  script.src =
    `https://www.googletagmanager.com/gtag/js?id=` +
    encodeURIComponent(GOOGLE_ANALYTICS_ID);

  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];

  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());

  window.gtag("config", GOOGLE_ANALYTICS_ID, {
    anonymize_ip: true
  });
}

function loadMetaPixel() {
  if (
    !META_PIXEL_ID ||
    META_PIXEL_ID === "123456789012345"
  ) {
    console.info(
      "Meta Pixel n'est pas encore configuré."
    );
    return;
  }

  if (window.fbq) {
    return;
  }

  window.fbq = function fbq() {
    window.fbq.callMethod
      ? window.fbq.callMethod.apply(window.fbq, arguments)
      : window.fbq.queue.push(arguments);
  };

  if (!window._fbq) {
    window._fbq = window.fbq;
  }

  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = "2.0";
  window.fbq.queue = [];

  const script = document.createElement("script");

  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";

  const firstScript = document.getElementsByTagName("script")[0];

  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
}
