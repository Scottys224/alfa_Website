const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const inlineGTranslate = `
    <!-- GTranslate Script -->
    <script type="text/javascript">
      function googleTranslateElementInit2() {
        new google.translate.TranslateElement(
          { pageLanguage: "fr", autoDisplay: false },
          "google_translate_element2",
        );
      }
      function doGTranslate(lang_pair) {
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
          setTimeout(function () {
            doGTranslate(lang_pair);
          }, 500);
        } else {
          teCombo.value = lang;
          GTranslateFireEvent(teCombo, "change");
          GTranslateFireEvent(teCombo, "change");
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
        } catch (e) {}
      }
    </script>
    <script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2"></script>
`;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the bad deferred external script tags
    content = content.replace(/<script src="https:\/\/translate\.google\.com\/translate_a\/element\.js\?cb=googleTranslateElementInit2" defer><\/script>/g, '');
    content = content.replace(/<script src="js\/gtranslate\.js" defer><\/script>/g, '');

    // Insert the inline block right after cookies-consent.js if not already there
    if (!content.includes('function googleTranslateElementInit2()')) {
        content = content.replace(/<\/body>/, inlineGTranslate + '\n  </body>');
    }

    // Also, the lang buttons were updated to class="lang-option" data-lang="fr|en".
    // Wait, the original was onclick="doGTranslate('fr|en'); return false;".
    // I should put it back to EXACTLY what it was because `interactions.js` might have `typeof doGTranslate === 'function'` issues if it executes before the inline script? No, interactions.js is 'defer', and inline scripts run before DOMContentLoaded. But let's restore the original inline onclicks to be 100% sure!
    // The user said: "le bouton des langues ne fonctionne toujours pas"
    content = content.replace(/class="lang-option" data-lang="([^"]+)"/g, `onclick="doGTranslate('$1'); return false;" class="lang-option"`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed GTranslate in ${file}`);
});
