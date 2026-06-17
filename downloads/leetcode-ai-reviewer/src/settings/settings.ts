import { AIProviderConfig, DEFAULT_SETTINGS, PROVIDER_PRESETS } from '../shared/types';

const $ = (sel: string) => document.querySelector(sel) as HTMLInputElement | null;

async function loadSettings() {
  return new Promise<AIProviderConfig>((resolve) => {
    chrome.storage.sync.get(['leetcoach_settings'], (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...(result.leetcoach_settings ?? {}) });
    });
  });
}

async function saveSettings(config: AIProviderConfig) {
  return new Promise<void>((resolve) => {
    chrome.storage.sync.set({ leetcoach_settings: config }, resolve);
  });
}

function getFormValues(): AIProviderConfig {
  return {
    provider: $('#provider')!.value,
    baseUrl: $('#baseUrl')!.value.trim(),
    model: $('#model')!.value.trim(),
    apiKey: $('#apiKey')!.value.trim(),
    temperature: parseFloat($('#temperature')!.value),
    maxTokens: parseInt($('#maxTokens')!.value, 10),
  };
}

function setFormValues(config: AIProviderConfig) {
  $('#provider')!.value = config.provider;
  $('#baseUrl')!.value = config.baseUrl;
  $('#model')!.value = config.model;
  $('#apiKey')!.value = config.apiKey;
  $('#temperature')!.value = String(config.temperature);
  $('#maxTokens')!.value = String(config.maxTokens);
}

function showTestResult(msg: string, success: boolean) {
  const el = $('#test-result')!;
  el.textContent = msg;
  el.className = `test-result ${success ? 'success' : 'error'}`;
}

function showSaveResult(msg: string, success: boolean) {
  const el = $('#save-result')!;
  el.textContent = msg;
  el.className = `save-result ${success ? 'success' : 'error'}`;
}

async function testConnection() {
  const config = getFormValues();
  if (!config.apiKey) {
    showTestResult('Please enter an API key.', false);
    return;
  }

  showTestResult('Testing...', true);

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
      showTestResult(`Connection failed (${response.status}): ${err}`, false);
      return;
    }
    showTestResult('Connection successful! Your API key and model are working.', true);
  } catch (e: any) {
    showTestResult(`Connection error: ${e.message}`, false);
  }
}

$('#provider')!.addEventListener('change', () => {
  const preset = PROVIDER_PRESETS[$('#provider')!.value];
  if (preset) {
    if (preset.baseUrl) $('#baseUrl')!.value = preset.baseUrl;
    if (preset.model) $('#model')!.value = preset.model;
  }
});

$('#test-btn')!.addEventListener('click', testConnection);

$('#settings-form')!.addEventListener('submit', async (e) => {
  e.preventDefault();
  const config = getFormValues();
  await saveSettings(config);
  showSaveResult('Settings saved successfully!', true);
});

// Load on open
loadSettings().then(setFormValues);
