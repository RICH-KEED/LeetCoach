import type { AIProviderConfig, AnalysisResult, MessageType } from '../shared/types';

const DEFAULT_SETTINGS: AIProviderConfig = {
  provider: 'Groq',
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'llama-3.3-70b-versatile',
  apiKey: '',
  temperature: 0.1,
  maxTokens: 4096,
};

async function getSettings(): Promise<AIProviderConfig> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['leetcoach_settings'], (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...(result.leetcoach_settings ?? {}) });
    });
  });
}

function buildPrompt(submission: any): string {
  const truncatedDesc = submission.problemDescription
    ? (submission.problemDescription.length > 800
      ? submission.problemDescription.slice(0, 800) + '\n... [truncated for token efficiency]'
      : submission.problemDescription)
    : 'None provided';

  return `You are an expert coding interview coach. Analyze the following LeetCode submission and provide structured feedback.

Problem: ${submission.problemTitle}
Language: ${submission.language}
Status: ${submission.status ?? 'N/A'}
Runtime: ${submission.runtime ?? 'N/A'} ${submission.runtimePercentile ? `(${submission.runtimePercentile})` : ''}
Memory: ${submission.memory ?? 'N/A'} ${submission.memoryPercentile ? `(${submission.memoryPercentile})` : ''}

Problem Description (Truncated):
${truncatedDesc}

Constraints:
${submission.constraints?.join('\n') ?? 'None provided'}

User Code:
\`\`\`${submission.language}
${submission.code}
\`\`\`

Respond ONLY with a valid JSON object matching this exact schema:
{
  "verdict": "One-sentence overall assessment (e.g., 'Clean, optimal solution with minor style issues')",
  "approach": {
    "summary": "Brief name of the algorithmic approach used",
    "explanation": "Detailed explanation of the approach and why it works"
  },
  "complexity": {
    "time": {
      "best": "Short Big-O notation only (e.g., 'O(n)', 'O(1)')",
      "average": "Short Big-O notation only (e.g., 'O(n)', 'O(1)')",
      "worst": "Short Big-O notation only (e.g., 'O(n)', 'O(1)')"
    },
    "space": {
      "best": "Short Big-O notation only (e.g., 'O(n)', 'O(1)')",
      "average": "Short Big-O notation only (e.g., 'O(n)', 'O(1)')",
      "worst": "Short Big-O notation only (e.g., 'O(n)', 'O(1)')"
    },
    "explanation": "Deeper explanation of complexity trade-offs"
  },
  "efficiency": {
    "score": <number 1-10>,
    "notes": "Specific notes on runtime and memory efficiency compared to optimal"
  },
  "codeStyle": {
    "score": <number 1-10>,
    "notes": "Comments on naming, readability, formatting, and idiomatic usage"
  },
  "bugs": [
    {
      "severity": "low|medium|high",
      "description": "Description of the bug or edge-case issue",
      "fix": "Suggested fix or corrected code snippet"
    }
  ],
  "improvements": [
    {
      "category": "Category like 'Optimization', 'Readability', 'Edge Cases'",
      "suggestion": "What to improve and why",
      "example": "Code snippet demonstrating the improvement"
    }
  ],
  "alternativeSolutions": [
    {
      "name": "Name of alternative approach",
      "description": "How it works and when to prefer it",
      "complexity": "Time/space complexity summary"
    }
  ],
  "interviewQuestions": [
    {
      "question": "A follow-up question an interviewer might ask",
      "answer": "A concise model answer or hint"
    }
  ]
}

Rules:
- Output ONLY the JSON object. No markdown code fences, no extra text.
- Ensure valid JSON syntax: all strings quoted, no trailing commas.
- Under the "complexity" key, "time" and "space" MUST contain ONLY the short mathematical Big-O notation (e.g., "O(n)", "O(1)"). Place all reasoning/explanations under the "explanation" key instead.
- COMPLEXITY RIGOR: Carefully analyze the time and space complexity of all operations inside loops, specifically distinguishing between Best, Average, and Worst cases. If an operation (such as string concatenation, copying, reversing, or duplicating) has a cost proportional to the container size, or doubles the container size at each step:
  1. Analyze how the container size grows under different inputs.
  2. If the worst-case input triggers exponential growth (e.g. repeated duplication), the worst-case complexity MUST reflect it (e.g. O(2^n)).
  3. If average inputs trigger occasional copying or reversal, the average complexity must reflect that (e.g. O(n^2)).
  4. Only use O(n) or O(1) if those cases are guaranteed mathematically. Never assume container operations are O(1).
- Under the "approach" key, the "explanation" should analyze if the user's approach is the optimal one ("best approach") and conceptually explain why or how it compares to the optimal approach.
- CRITICAL: Never write or output the full corrected code or complete solution. Instead, provide conceptual hints, point out the exact line or block containing the bug, or suggest logic changes. Keep any code snippets in "fix" or "example" extremely minimal, focusing only on the specific bug/change, without giving away the complete solution.
- "alternativeSolutions" must only list mathematically correct, fully functional alternative strategies that are practical for the specific problem. Do not output generic placeholder solutions (such as recursive approaches) if they cannot work or are not useful. If there are no good alternatives, return an empty array.
- If there are no bugs, return an empty array for bugs.
- LOGICAL ACCURACY: Double-check your logic carefully before flagging code as buggy. Verify if the code's implementation matches the problem's mathematical or logical requirements before claiming it is an error. Do not flag correct statements or operations as bugs due to shallow matching.
- Be honest but constructive. If the solution is wrong or suboptimal, say so clearly.`;
}

async function callAI(submission: any): Promise<AnalysisResult> {
  const settings = await getSettings();
  if (!settings.apiKey) {
    throw new Error('API key is not configured. Open the LeetCoach settings page to add your key.');
  }

  const url = `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body = {
    model: settings.model,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    messages: [
      { role: 'system', content: 'You are a helpful coding interview assistant. Always respond with valid JSON only.' },
      { role: 'user', content: buildPrompt(submission) },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown code fences if present
  const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try extracting JSON from surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        console.error('[LeetCoach] Raw AI response (failed parse):', content || '(empty response)');
        const snippet = content ? content.slice(0, 150) : '(empty)';
        throw new Error(`Could not parse AI response as JSON. Response starts with: "${snippet}"`);
      }
    } else {
      console.error('[LeetCoach] Raw AI response (failed parse):', content || '(empty response)');
      const snippet = content ? content.slice(0, 150) : '(empty)';
      throw new Error(`Could not parse AI response as JSON. Response starts with: "${snippet}"`);
    }
  }

  return parsed;
}

async function testConnection(config: AIProviderConfig): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => 'Unknown error');
      return { success: false, message: `Connection failed (${response.status}): ${err}` };
    }
    return { success: true, message: 'Connection successful!' };
  } catch (e: any) {
    return { success: false, message: `Connection error: ${e.message}` };
  }
}

chrome.runtime.onMessage.addListener((request: MessageType, _sender, sendResponse) => {
  if (request.type === 'REQUEST_ANALYSIS') {
    callAI(request.payload)
      .then((result) => {
        const responseMsg = { type: 'ANALYSIS_RESULT' as const, payload: result };
        sendResponse(responseMsg);
        chrome.runtime.sendMessage(responseMsg).catch(() => { });
      })
      .catch((err) => {
        const responseMsg = { type: 'ANALYSIS_ERROR' as const, payload: err.message };
        sendResponse(responseMsg);
        chrome.runtime.sendMessage(responseMsg).catch(() => { });
      });
    return true; // async
  }

  if (request.type === 'GET_SETTINGS') {
    getSettings().then((settings) => {
      sendResponse({ type: 'SETTINGS_RESULT', payload: settings });
    });
    return true;
  }

  if (request.type === 'SAVE_SETTINGS') {
    chrome.storage.sync.set({ leetcoach_settings: request.payload }, () => {
      sendResponse({ type: 'SETTINGS_SAVED' });
    });
    return true;
  }

  if (request.type === 'TEST_CONNECTION') {
    testConnection(request.payload).then((result) => {
      sendResponse({ type: 'CONNECTION_RESULT', payload: result });
    });
    return true;
  }

  if (request.type === 'OPEN_SETTINGS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

// Action click toggles sidebar
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' }).catch(() => {
      // Content script may not be injected yet on some pages
    });
  }
});

// Handle extension install/update lifecycle for Welcome and "What's New" tabs
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open onboarding/welcome page on first install
    chrome.tabs.create({ url: 'https://leetcoach.vercel.app/welcome' }).catch(() => {});
  } else if (details.reason === 'update') {
    const previousVersion = details.previousVersion;
    const currentVersion = chrome.runtime.getManifest().version;
    
    // Only open if there is a major/minor version change to avoid spamming on tiny patch changes
    if (previousVersion !== currentVersion) {
      chrome.tabs.create({ 
        url: `https://leetcoach.vercel.app/whats-new?from=${previousVersion}&to=${currentVersion}` 
      }).catch(() => {});
    }
  }
});
