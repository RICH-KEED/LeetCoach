export interface LeetCodeSubmission {
  problemTitle: string;
  problemDescription: string;
  constraints: string[];
  code: string;
  language: string;
  runtime?: string;
  runtimePercentile?: string;
  memory?: string;
  memoryPercentile?: string;
  status?: string;
  url: string;
}

export interface AIProviderConfig {
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

export interface AnalysisResult {
  verdict: string;
  approach: {
    summary: string;
    explanation: string;
  };
  complexity: {
    time: {
      best: string;
      average: string;
      worst: string;
    };
    space: {
      best: string;
      average: string;
      worst: string;
    };
    explanation: string;
  };
  efficiency: {
    score: number;
    notes: string;
  };
  codeStyle: {
    score: number;
    notes: string;
  };
  bugs: Array<{
    severity: 'low' | 'medium' | 'high';
    description: string;
    fix?: string;
  }>;
  improvements: Array<{
    category: string;
    suggestion: string;
    example?: string;
  }>;
  alternativeSolutions: Array<{
    name: string;
    description: string;
    complexity: string;
  }>;
  interviewQuestions: Array<{
    question: string;
    answer?: string;
  }>;
}

export type MessageType =
  | { type: 'SUBMISSION_DETECTED'; payload: LeetCodeSubmission }
  | { type: 'REQUEST_ANALYSIS'; payload: LeetCodeSubmission }
  | { type: 'ANALYSIS_RESULT'; payload: AnalysisResult }
  | { type: 'ANALYSIS_ERROR'; payload: string }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; payload: AIProviderConfig }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'SETTINGS_SAVED' }
  | { type: 'TEST_CONNECTION'; payload: AIProviderConfig }
  | { type: 'CONNECTION_RESULT'; payload: { success: boolean; message: string } };

export const DEFAULT_SETTINGS: AIProviderConfig = {
  provider: 'Groq',
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'llama-3.1-8b-instant',
  apiKey: '',
  temperature: 0.1,
  maxTokens: 4096,
};

export const PROVIDER_PRESETS: Record<string, Partial<AIProviderConfig>> = {
  OpenAI: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  Gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-1.5-flash',
  },
  Groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-8b-instant',
  },
  OpenRouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openrouter/fusion',
  },
};

export const COLORS = {
  bg: '#28243a',
  card: '#2f2a43',
  purple: '#b98cff',
  green: '#3bd16f',
  yellow: '#ffc01e',
  red: '#ef4743',
  text: '#eff1f6',
  textMuted: '#9d9cb4',
  border: '#3e3758',
};
