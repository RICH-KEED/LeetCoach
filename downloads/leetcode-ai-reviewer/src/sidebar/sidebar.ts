import { AnalysisResult, LeetCodeSubmission, MessageType } from '../shared/types';

let currentSubmission: LeetCodeSubmission | null = null;
let currentResult: AnalysisResult | null = null;

const $ = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const $$ = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];

function setScoreRing(el: HTMLElement, score: number) {
  const clamped = Math.max(0, Math.min(10, score));
  const angle = (clamped / 10) * 360;
  el.style.setProperty('--score-angle', `${angle}deg`);
  el.innerHTML = `<span>${clamped}</span>`;
  const span = el.querySelector('span')!;
  if (clamped >= 8) span.style.color = 'var(--lc-green)';
  else if (clamped >= 5) span.style.color = 'var(--lc-yellow)';
  else span.style.color = 'var(--lc-red)';
}

function renderTags(submission: LeetCodeSubmission) {
  $('#problem-title')!.textContent = submission.problemTitle || 'Unknown Problem';
  $('#lang-tag')!.textContent = submission.language || 'Unknown';
  
  const status = submission.status || 'Pending';
  const statusTag = $('#status-tag')!;
  statusTag.textContent = status;
  statusTag.className = 'tag'; // Reset class
  statusTag.style.background = '';
  statusTag.style.color = '';

  if (status.toLowerCase().includes('accepted')) {
    statusTag.classList.add('tag-green');
    statusTag.style.background = 'rgba(45, 181, 93, 0.12)';
    statusTag.style.color = 'var(--lc-primary)';
  } else if (/wrong|limit|error|fail/i.test(status)) {
    statusTag.style.background = 'rgba(239, 71, 67, 0.12)';
    statusTag.style.color = 'var(--lc-red)';
    statusTag.style.borderColor = 'rgba(239, 71, 67, 0.25)';
  } else {
    statusTag.classList.add('tag-purple');
  }

  const runtimeTag = $('#runtime-tag')!;
  if (submission.runtime && submission.runtime !== 'N/A') {
    runtimeTag.textContent = `Runtime: ${submission.runtime}`;
    runtimeTag.classList.remove('hidden');
  } else {
    runtimeTag.classList.add('hidden');
  }

  const memoryTag = $('#memory-tag')!;
  if (submission.memory && submission.memory !== 'N/A') {
    memoryTag.textContent = `Memory: ${submission.memory}`;
    memoryTag.classList.remove('hidden');
  } else {
    memoryTag.classList.add('hidden');
  }
}

function renderAnalysis(result: AnalysisResult) {
  currentResult = result;

  $('#empty-state')?.classList.add('hidden');
  $('#submission-info')?.classList.remove('hidden');

  // Approach tab
  $('#verdict')!.textContent = result.verdict;
  $('#approach-summary')!.textContent = result.approach.summary;
  $('#approach-explanation')!.textContent = result.approach.explanation;
  
  $('#time-best')!.textContent = result.complexity.time.best;
  $('#time-average')!.textContent = result.complexity.time.average;
  $('#time-worst')!.textContent = result.complexity.time.worst;
  
  $('#space-best')!.textContent = result.complexity.space.best;
  $('#space-average')!.textContent = result.complexity.space.average;
  $('#space-worst')!.textContent = result.complexity.space.worst;
  
  $('#complexity-explanation')!.textContent = result.complexity.explanation;

  const altList = $('#alternatives-list')!;
  altList.innerHTML = result.alternativeSolutions.map((alt) => `
    <div class="alternative-item">
      <div class="alternative-name">${escapeHtml(alt.name)}</div>
      <div>${escapeHtml(alt.description)}</div>
      <div style="color: var(--lc-green); font-size: 12px; margin-top: 4px;">${escapeHtml(alt.complexity)}</div>
    </div>
  `).join('');

  // Efficiency tab
  setScoreRing($('#efficiency-score')!, result.efficiency.score);
  $('#efficiency-notes')!.textContent = result.efficiency.notes;

  // Style tab
  setScoreRing($('#style-score')!, result.codeStyle.score);
  $('#style-notes')!.textContent = result.codeStyle.notes;

  // Bugs tab
  const bugsList = $('#bugs-list')!;
  if (result.bugs.length === 0) {
    bugsList.innerHTML = '<p style="color: var(--lc-green);">No bugs detected! 🎉</p>';
  } else {
    bugsList.innerHTML = result.bugs.map((bug) => `
      <div class="bug-item">
        <span class="bug-severity ${bug.severity}">${bug.severity}</span>
        <div>${escapeHtml(bug.description)}</div>
        ${bug.fix ? `<pre class="code-block">${escapeHtml(bug.fix)}</pre>` : ''}
      </div>
    `).join('');
  }

  // Improvements tab
  const impList = $('#improvements-list')!;
  if (result.improvements.length === 0) {
    impList.innerHTML = '<p style="color: var(--lc-green);">No improvements suggested. Great work!</p>';
  } else {
    impList.innerHTML = result.improvements.map((imp) => `
      <div class="improvement-item">
        <div class="improvement-category">${escapeHtml(imp.category)}</div>
        <div>${escapeHtml(imp.suggestion)}</div>
        ${imp.example ? `<pre class="code-block">${escapeHtml(imp.example)}</pre>` : ''}
      </div>
    `).join('');
  }

  // Interview tab
  const intList = $('#interview-list')!;
  intList.innerHTML = result.interviewQuestions.map((q) => `
    <div class="interview-item">
      <div class="interview-question">${escapeHtml(q.question)}</div>
      ${q.answer ? `<div class="interview-answer">${escapeHtml(q.answer)}</div>` : ''}
    </div>
  `).join('');

  // Show default tab if none visible
  if ($$('.tab-panel:not(.hidden)').length === 0) {
    switchTab('approach');
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function switchTab(tabId: string) {
  $$('.tab-panel').forEach((p) => p.classList.add('hidden'));
  $(`#tab-${tabId}`)?.classList.remove('hidden');
  $$('.tab-btn').forEach((b) => b.classList.remove('active'));
  $(`.tab-btn[data-tab="${tabId}"]`)?.classList.add('active');
}

function showLoading(show: boolean) {
  $('#loading')?.classList.toggle('hidden', !show);
}

function showError(msg: string | null) {
  const err = $('#error')!;
  if (msg) {
    $('#error-text')!.textContent = msg;
    err.classList.remove('hidden');
  } else {
    err.classList.add('hidden');
  }
}

function requestAnalysis() {
  showLoading(true);
  showError(null);
  window.parent.postMessage({ source: 'leetcoach-sidebar', type: 'REQUEST_ANALYSIS' }, '*');
}

// Event listeners
$('#close-btn')?.addEventListener('click', () => {
  window.parent.postMessage({ source: 'leetcoach-sidebar', type: 'CLOSE_SIDEBAR' }, '*');
});

$('#analyze-btn')?.addEventListener('click', requestAnalysis);
$('#retry-btn')?.addEventListener('click', requestAnalysis);

$('#open-settings')?.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
});

$$('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab')!;
    switchTab(tab);
  });
});

// Listen for messages from content script / background
window.addEventListener('message', (event) => {
  if (event.data?.source !== 'leetcoach-content') return;
  const msg: MessageType = event.data;

  if (msg.type === 'SUBMISSION_DETECTED') {
    const isNew = !currentSubmission || currentSubmission.code !== msg.payload.code || currentSubmission.status !== msg.payload.status;
    currentSubmission = msg.payload;
    renderTags(msg.payload);
    $('#submission-info')?.classList.remove('hidden');

    if (isNew) {
      currentResult = null;
      $('#empty-state')?.classList.remove('hidden');
    } else if (currentResult) {
      $('#empty-state')?.classList.add('hidden');
    }
    
    const isLoadingVisible = !$('#loading')?.classList.contains('hidden');
    if (isNew && !isLoadingVisible && msg.payload.code && msg.payload.status && msg.payload.status !== 'Pending') {
      requestAnalysis();
    }
  }

  if (msg.type === 'ANALYSIS_RESULT') {
    showLoading(false);
    renderAnalysis(msg.payload);
  }

  if (msg.type === 'ANALYSIS_ERROR') {
    showLoading(false);
    showError(msg.payload);
  }
});

// Also listen for direct messages from background (fallback)
chrome.runtime.onMessage.addListener((request: MessageType) => {
  if (request.type === 'ANALYSIS_RESULT') {
    showLoading(false);
    renderAnalysis(request.payload);
  }
  if (request.type === 'ANALYSIS_ERROR') {
    showLoading(false);
    showError(request.payload);
  }
});

// Initialize
switchTab('approach');
window.parent.postMessage({ source: 'leetcoach-sidebar', type: 'GET_SUBMISSION' }, '*');
