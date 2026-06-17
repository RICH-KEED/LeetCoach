// page_script.ts - Runs in the MAIN world to access page variables like Monaco editor

function syncMonacoCode() {
  let hiddenDiv = document.getElementById('leetcoach-editor-code');
  if (!hiddenDiv) {
    hiddenDiv = document.createElement('div');
    hiddenDiv.id = 'leetcoach-editor-code';
    hiddenDiv.style.display = 'none';
    (document.head || document.documentElement).appendChild(hiddenDiv);
  }

  let hiddenLang = document.getElementById('leetcoach-editor-lang');
  if (!hiddenLang) {
    hiddenLang = document.createElement('div');
    hiddenLang.id = 'leetcoach-editor-lang';
    hiddenLang.style.display = 'none';
    (document.head || document.documentElement).appendChild(hiddenLang);
  }

  try {
    let code = '';
    let langId = '';

    // 1. Try to find the editor instance attached to the DOM element
    // @ts-ignore
    const domEditor = document.querySelector('.monaco-editor')?.__monaco_editor;
    if (domEditor) {
      code = domEditor.getValue() ?? '';
      langId = domEditor.getModel()?.getLanguageId() ?? '';
    }

    // 2. Try window.monaco models
    if (!code) {
      // @ts-ignore
      const models = window.monaco?.editor?.getModels?.();
      if (models && models.length > 0) {
        code = models[0].getValue() ?? '';
        // @ts-ignore
        langId = models[0].getLanguageId?.() ?? '';
      }
    }

    // 3. Try window.monaco editors
    if (!code) {
      // @ts-ignore
      const editors = window.monaco?.editor?.getEditors?.();
      if (editors && editors.length > 0) {
        code = editors[0].getValue() ?? '';
        langId = editors[0].getModel()?.getLanguageId() ?? '';
      }
    }

    // Update hidden elements
    if (code && hiddenDiv.textContent !== code) {
      hiddenDiv.textContent = code;
    }
    if (langId && hiddenLang.textContent !== langId) {
      hiddenLang.textContent = langId;
    }
  } catch (e) {
    // Fail silently
  }
}

// Periodically sync the editor state
setInterval(syncMonacoCode, 500);
syncMonacoCode();
