import { LeetCodeSubmission, MessageType } from '../shared/types';

let sidebarFrame: HTMLIFrameElement | null = null;
let sidebarVisible = false;

function isContextValid(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
}

function injectSidebar() {
  if (!isContextValid()) {
    console.warn('[LeetCoach] Extension context invalidated. Please refresh the page.');
    return;
  }
  if (sidebarFrame) return;

  const iframe = document.createElement('iframe');
  iframe.id = 'leetcoach-sidebar';
  try {
    iframe.src = chrome.runtime.getURL('sidebar.html');
  } catch (e) {
    console.warn('[LeetCoach] Cannot get extension URL (context invalidated). Please refresh the page.');
    return;
  }
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 420px;
    height: 100vh;
    border: none;
    z-index: 999999;
    box-shadow: -4px 0 24px rgba(0,0,0,0.4);
    background: #28243a;
    transition: transform 0.3s ease;
  `;

  document.body.appendChild(iframe);
  sidebarFrame = iframe;
  sidebarVisible = true;

  // Adjust page content to make room
  const mainContent = document.querySelector('div[class*="main__"]') as HTMLElement | null;
  if (mainContent) {
    mainContent.style.marginRight = '420px';
  }
}

function toggleSidebar() {
  if (!sidebarFrame) {
    injectSidebar();
    return;
  }
  sidebarVisible = !sidebarVisible;
  sidebarFrame.style.transform = sidebarVisible ? 'translateX(0)' : 'translateX(100%)';
}

function sendToSidebar(msg: MessageType) {
  if (sidebarFrame?.contentWindow) {
    sidebarFrame.contentWindow.postMessage({ source: 'leetcoach-content', ...msg }, '*');
  }
}

let lastProblemUrl = '';
let cachedDescription = '';
let cachedConstraints: string[] = [];
let cachedTitle = '';

function checkUrlChange() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastProblemUrl) {
    lastProblemUrl = currentUrl;
    cachedDescription = '';
    cachedConstraints = [];
    cachedTitle = '';
    // Start background fetch from GraphQL immediately to populate cache
    fetchProblemDescriptionViaGraphQL().catch(() => {});
  }
}

function extractProblemTitle(): string {
  checkUrlChange();
  
  // 1. Try a link that contains the problem name in the description panel
  const linkEl = document.querySelector('a[href*="/problems/"][class*="text-title-large"], a[href*="/problems/"]');
  if (linkEl) {
    const text = linkEl.textContent?.replace(/^\d+\.\s*/, '').trim();
    if (text && !/^\d+\.?$/.test(text) && text !== 'Unknown Problem') {
      cachedTitle = text;
      return text;
    }
  }

  // 2. Try selector for modern LeetCode title
  const titleEls = document.querySelectorAll('div[class*="text-title-large"], span[class*="text-title-large"], div.text-title-large, h4, h3');
  for (const el of Array.from(titleEls)) {
    const text = el.textContent?.replace(/^\d+\.\s*/, '').trim() ?? '';
    if (text && !/^\d+\.?$/.test(text) && text !== 'Unknown Problem') {
      cachedTitle = text;
      return text;
    }
  }

  if (cachedTitle) return cachedTitle;

  // 3. Fallback to document.title
  const titleText = document.title;
  if (titleText && titleText.includes('- LeetCode')) {
    const text = titleText.split('-')[0].replace(/^\d+\.\s*/, '').trim();
    if (text) {
      cachedTitle = text;
      return text;
    }
  }

  return 'Unknown Problem';
}

function extractTitleSlug(): string {
  const match = window.location.href.match(/\/problems\/([^/]+)/);
  return match ? match[1] : '';
}

async function fetchProblemDescriptionViaGraphQL(): Promise<boolean> {
  const slug = extractTitleSlug();
  if (!slug) return false;

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query questionContent($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              content
            }
          }
        `,
        variables: { titleSlug: slug }
      })
    });
    const json = await response.json();
    const html = json.data?.question?.content;
    if (html) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Clean HTML tags and inline elements
      tempDiv.querySelectorAll('script, style, noscript, svg, button, .hidden').forEach(n => n.remove());
      let text = tempDiv.textContent?.trim() ?? '';
      if (text) {
        text = text.replace(/!function\s*(\(\))?\s*\{[\s\S]*?\}\s*\(\)/g, '');
        text = text.replace(/\(function\s*(\(\))?\s*\{[\s\S]*?\}\s*\(\)/g, '');
        text = text.replace(/\n\s*\n/g, '\n').trim();
        
        cachedDescription = text;
        
        // Also extract constraints from this clean text
        const constraints: string[] = [];
        const constraintMatch = text.match(/Constraints:[\s\S]+?(?=Example|Follow-up|$)/i);
        if (constraintMatch) {
          const lines = constraintMatch[0].split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !/^constraints:?$/i.test(trimmed)) {
              constraints.push(trimmed.replace(/^[-•*#\s]*\d*\.?\s*/, ''));
            }
          }
        }
        cachedConstraints = constraints;
        return true;
      }
    }
  } catch (err) {
    console.error('[LeetCoach] GraphQL fetch error:', err);
  }
  return false;
}

function extractProblemDescription(): string {
  checkUrlChange();

  // 1. Prefer cached description (especially if populated by GraphQL)
  if (cachedDescription && !cachedDescription.includes("Can you solve this real interview question?")) {
    return cachedDescription;
  }

  // 2. Try exact, narrow selectors for the actual description tab content
  const selectors = [
    'div[data-key="description-content"]',
    'div[class*="HTMLContent_html__"]',
    'div.elfjS',
    'div[class*="elfjS"]',
    '.question-content__3U1T',
    '.question-content'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('script, style, noscript, svg, button, .hidden').forEach(n => n.remove());
      
      let text = clone.textContent?.trim() ?? '';
      if (text) {
        // Strip out inline self-invoking javascript loader blocks if any
        text = text.replace(/!function\s*(\(\))?\s*\{[\s\S]*?\}\s*\(\)/g, '');
        text = text.replace(/\(function\s*(\(\))?\s*\{[\s\S]*?\}\s*\(\)/g, '');
        // Collapse redundant spacing/newlines
        text = text.replace(/\n\s*\n/g, '\n').trim();
        cachedDescription = text;
        return text;
      }
    }
  }

  // 3. Return cached description if we switch to Solutions/Submissions tab
  if (cachedDescription) {
    return cachedDescription;
  }

  // 4. Fallback to page meta description tag (always present and clean)
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
  if (metaDesc && !metaDesc.includes("LeetCode - The World's Leading") && !metaDesc.includes("LeetCode is the world's leading")) {
    cachedDescription = metaDesc.trim();
    return cachedDescription;
  }

  return '';
}

function extractConstraints(): string[] {
  checkUrlChange();

  if (cachedConstraints.length > 0) {
    return cachedConstraints;
  }

  const desc = extractProblemDescription();
  if (!desc) return [];

  const constraints: string[] = [];
  const constraintMatch = desc.match(/Constraints:[\s\S]+?(?=Example|Follow-up|$)/i);
  if (constraintMatch) {
    const lines = constraintMatch[0].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !/^constraints:?$/i.test(trimmed)) {
        // Strip out list bullet prefixes if present
        constraints.push(trimmed.replace(/^[-•*#\s]*\d*\.?\s*/, ''));
      }
    }
  }

  if (constraints.length > 0) {
    cachedConstraints = constraints;
  }
  return constraints;
}

function extractCodeFromMonaco(): string {
  // Check the hidden DOM element populated by our MAIN-world page_script
  const hiddenDiv = document.getElementById('leetcoach-editor-code');
  if (hiddenDiv && hiddenDiv.textContent) {
    return hiddenDiv.textContent;
  }

  try {
    // @ts-ignore
    const monacoEditor = document.querySelector('.monaco-editor')?.__monaco_editor;
    if (monacoEditor) {
      return monacoEditor.getValue() ?? '';
    }
  } catch {}

  // Last resort: read from textarea
  const textarea = document.querySelector('textarea[class*="input__"], textarea[wrap]') as HTMLTextAreaElement | null;
  if (textarea) return textarea.value;

  return '';
}

function detectLanguage(): string {
  // Try hidden DOM element populated by our MAIN-world page_script
  const hiddenLang = document.getElementById('leetcoach-editor-lang');
  if (hiddenLang && hiddenLang.textContent) {
    const rawLang = hiddenLang.textContent.trim().toLowerCase();
    const langMap: Record<string, string> = {
      'cpp': 'C++',
      'python': 'Python3',
      'python3': 'Python3',
      'java': 'Java',
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'go': 'Go',
      'rust': 'Rust',
      'csharp': 'C#',
      'c': 'C',
      'ruby': 'Ruby',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'php': 'PHP'
    };
    if (langMap[rawLang]) return langMap[rawLang];
  }

  // Modern LeetCode compiler button selector
  const modernLangBtn = document.querySelector('button[id*="compiler"], button[class*="compiler"]');
  if (modernLangBtn) {
    const text = modernLangBtn.textContent?.trim() ?? '';
    if (text) return text;
  }

  const langBtn = document.querySelector('[data-cy="lang-select"]');
  if (langBtn) return langBtn.textContent?.trim() ?? '';

  const langSelectors = document.querySelectorAll('div[class*="container__"] div[class*="css-"]');
  for (const el of Array.from(langSelectors)) {
    const text = el.textContent?.trim() ?? '';
    if (/^(C\+\+|Python3?|Java|JavaScript|TypeScript|Go|Rust|C#|PHP|Ruby|Swift|Kotlin|Dart|Elixir|Erlang|Scala|Racket|Lua|Perl|Groovy|Julia|F#|Fortran|COBOL|D|Delphi|OCaml|Pascal|Prolog|Reason|Solidity|SQL|VB\.NET|Bash|C|R|MATLAB|Octave|Sed|Awk|Brainfuck|Forth|Lisp|Scheme|Haskell|Clojure|Erlang|Elixir|Crystal|Nim|Zig|V|Wren|Red|Rebol|Raku|Smalltalk|Tcl|Ada|Algol|APL|Befunge|Blockly|Flow9|Io|Joy|K|Q)$/.test(text)) {
      return text;
    }
  }

  // Scan all page buttons and selected divs as fallback
  const knownLangs = ['C++', 'Java', 'Python', 'Python3', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C#', 'C', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'PHP'];
  const buttons = document.querySelectorAll('button, div[class*="select"], [class*="editor-tool"] button');
  for (const el of Array.from(buttons)) {
    const text = el.textContent?.trim() ?? '';
    if (knownLangs.includes(text)) {
      return text;
    }
  }

  return 'Unknown';
}

function extractRuntime(): { runtime: string; percentile: string } | null {
  const modernEl = document.querySelector('[data-e2e-locator="submission-runtime"]');
  if (modernEl) {
    const text = modernEl.textContent?.trim() ?? '';
    if (text && text.length < 50) {
      return { runtime: text, percentile: '' };
    }
  }

  // Use specific class patterns, never scan high-level un-classed divs globally
  const els = document.querySelectorAll('div[class*="result"] div, div[class*="runtime"] div, div[class*="info"], span[class*="runtime"], span[class*="result"]');
  for (const el of Array.from(els)) {
    const text = el.textContent?.trim() ?? '';
    if (text.length < 100) {
      const match = text.match(/Runtime\s*[:：]?\s*(\d+\s*ms)\s*\(?([\d.]+\s*%)?\)?/i);
      if (match) {
        return { runtime: match[1], percentile: match[2] ?? '' };
      }
    }
  }
  return null;
}

function extractMemory(): { memory: string; percentile: string } | null {
  const modernEl = document.querySelector('[data-e2e-locator="submission-memory"]');
  if (modernEl) {
    const text = modernEl.textContent?.trim() ?? '';
    if (text && text.length < 50) {
      return { memory: text, percentile: '' };
    }
  }

  // Use specific class patterns, never scan high-level un-classed divs globally
  const els = document.querySelectorAll('div[class*="result"] div, div[class*="memory"] div, div[class*="info"], span[class*="memory"], span[class*="result"]');
  for (const el of Array.from(els)) {
    const text = el.textContent?.trim() ?? '';
    if (text.length < 100) {
      const match = text.match(/Memory\s*[:：]?\s*(\d+\.?\d*\s*(?:MB|KB|GB))\s*\(?([\d.]+\s*%)?\)?/i);
      if (match) {
        return { memory: match[1], percentile: match[2] ?? '' };
      }
    }
  }
  return null;
}

function extractSubmissionStatus(): string {
  const modernEl = document.querySelector('[data-e2e-locator="submission-result"]');
  if (modernEl) {
    const text = modernEl.textContent?.trim() ?? '';
    if (text && text.length < 50) return text;
  }

  // Only query specific status elements and restrict length to prevent parent/wrapper matching
  const statusEls = document.querySelectorAll('div[class*="status__"], div[class*="result__"], span[class*="status__"], span[class*="result__"], .result-container, .status-container');
  for (const el of Array.from(statusEls)) {
    const text = el.textContent?.trim() ?? '';
    if (text.length < 50) {
      // Must match status keywords exactly as a standalone string (e.g. "Accepted") or with minimal surrounding text
      if (/^(Accepted|Wrong Answer|Time Limit Exceeded|Memory Limit Exceeded|Runtime Error|Compile Error|Output Limit Exceeded)$/i.test(text)) {
        return text;
      }
    }
  }
  return '';
}

function buildSubmission(): LeetCodeSubmission {
  const title = extractProblemTitle();
  const desc = extractProblemDescription();
  const constraints = extractConstraints();
  const code = extractCodeFromMonaco();
  const lang = detectLanguage();
  const rt = extractRuntime();
  const mem = extractMemory();
  const status = extractSubmissionStatus();

  console.log('[LeetCoach] --- Extracted Submission Data ---');
  console.log('[LeetCoach] Title:', title);
  console.log('[LeetCoach] Language:', lang);
  console.log('[LeetCoach] Status:', status);
  console.log('[LeetCoach] Code Length:', code ? code.length : 0);
  console.log('[LeetCoach] Description Sample:', desc ? desc.slice(0, 100) + '...' : 'None');
  console.log('[LeetCoach] Constraints Count:', constraints.length);
  console.log('[LeetCoach] ----------------------------------');

  return {
    problemTitle: title,
    problemDescription: desc,
    constraints: constraints,
    code: code,
    language: lang,
    runtime: rt?.runtime,
    runtimePercentile: rt?.percentile,
    memory: mem?.memory,
    memoryPercentile: mem?.percentile,
    status: status,
    url: window.location.href,
  };
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'TOGGLE_SIDEBAR') {
    toggleSidebar();
    sendResponse({ ok: true });
    return true;
  }
  if (request.type === 'GET_SUBMISSION') {
    sendResponse(buildSubmission());
    return true;
  }
  return false;
});

// Watch for submission result panels (Accepted, Wrong Answer, etc.)
function watchForResults() {
  const observer = new MutationObserver(() => {
    if (!isContextValid()) {
      observer.disconnect();
      return;
    }
    const status = extractSubmissionStatus();
    if (status) {
      const submission = buildSubmission();
      if (submission.code) {
        try {
          chrome.runtime.sendMessage({ type: 'SUBMISSION_DETECTED', payload: submission });
        } catch (e) {
          // context invalidated, ignore
        }
        sendToSidebar({ type: 'SUBMISSION_DETECTED', payload: submission });
      }
    }
  });

  const target = document.body;
  if (target) {
    observer.observe(target, { childList: true, subtree: true });
  }
}

// Listen for messages from sidebar
window.addEventListener('message', (event) => {
  if (!isContextValid()) return;
  if (event.data?.source === 'leetcoach-sidebar') {
    if (event.data.type === 'REQUEST_ANALYSIS') {
      const triggerAnalysis = () => {
        const submission = buildSubmission();
        // Inform sidebar immediately of the active submission details we are analyzing
        sendToSidebar({ type: 'SUBMISSION_DETECTED', payload: submission });
        try {
          chrome.runtime.sendMessage({ type: 'REQUEST_ANALYSIS', payload: submission }, (response) => {
            sendToSidebar(response);
          });
        } catch (e) {
          console.warn('[LeetCoach] Context invalidated, cannot request analysis. Please refresh the page.');
        }
      };

      const hasInvalidDesc = !cachedDescription || cachedDescription.includes("Can you solve this real interview question?");
      if (hasInvalidDesc) {
        fetchProblemDescriptionViaGraphQL().then(triggerAnalysis).catch(triggerAnalysis);
      } else {
        triggerAnalysis();
      }
    }
    if (event.data.type === 'GET_SUBMISSION') {
      const submission = buildSubmission();
      sendToSidebar({ type: 'SUBMISSION_DETECTED', payload: submission });
    }
    if (event.data.type === 'CLOSE_SIDEBAR') {
      toggleSidebar();
    }
  }
});

// Initialize
watchForResults();
