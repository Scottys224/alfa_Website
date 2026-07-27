const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/HP/Desktop/alfa_Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const gtranslateScript = `function googleTranslateElementInit2() {
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
    document.getElementById("google_translate_element2").innerHTML
      .length == 0 ||
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
  } catch (e) {}
}
`;

fs.writeFileSync(path.join(dir, 'js', 'gtranslate.js'), gtranslateScript, 'utf8');

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the gtranslate inline script block
    // It starts with <script type="text/javascript"> and ends with </script> and contains googleTranslateElementInit2
    content = content.replace(/<script type="text\/javascript">\s*function googleTranslateElementInit2\(\)[\s\S]*?<\/script>/g, '');

    // Inject the script tag
    if (!content.includes('js/gtranslate.js')) {
        content = content.replace(/<\/body>/, '    <script src="js/gtranslate.js" defer></script>\n  </body>');
    }

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Processed GTranslate script.');
