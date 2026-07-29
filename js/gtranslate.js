function googleTranslateElementInit2() {
  new google.translate.TranslateElement(
    { pageLanguage: "fr", autoDisplay: false },
    "google_translate_element2",
  );
}

function doGTranslate(lang_pair, tentative = 0) {
  if (lang_pair.value) lang_pair = lang_pair.value;
  if (lang_pair == "") return;
  var lang = lang_pair.split("|")[1];
  var teCombo;
  var sel = document.getElementsByTagName("select");
  for (var i = 0; i < sel.length; i++) {
    if (sel[i].className.indexOf("goog-te-combo") != -1) {
      teCombo = sel[i];
      break;
    }
  }
  if (
    document.getElementById("google_translate_element2") == null ||
    document.getElementById("google_translate_element2").innerHTML.length == 0 ||
    !teCombo ||
    teCombo.length == 0 ||
    teCombo.innerHTML.length == 0
  ) {
    if (tentative >= 20) {
      console.warn("Google Translate indisponible après 20 tentatives.");
      return;
    }
    setTimeout(function () {
      doGTranslate(lang_pair, tentative + 1);
    }, 500);
  } else {
    teCombo.value = lang;
    document.documentElement.lang = lang === "zh-CN" ? "zh-CN" : lang;
    GTranslateFireEvent(teCombo, "change");
    GTranslateFireEvent(teCombo, "change");
    // Update all current-lang spans
    const spans = document.querySelectorAll(".current-lang");
    spans.forEach((span) => {
      span.textContent = lang === "zh-CN" ? "ZH" : lang.toUpperCase();
    });
  }
}

function GTranslateFireEvent(element, event) {
  try {
    if (document.createEventObject) {
      var evt = document.createEventObject();
      element.fireEvent("on" + event, evt);
    } else {
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent(event, true, true);
      element.dispatchEvent(evt);
    }
  } catch (e) { console.warn("Erreur GTranslate:", e); }
}
