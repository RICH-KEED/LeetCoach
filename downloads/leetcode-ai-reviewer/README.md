# LeetCoach - AI Code Review for LeetCode

A Chrome Extension that automatically extracts your LeetCode submission and sends it to any OpenAI-compatible API for instant, structured feedback.

## Features

- **Automatic Extraction**: Detects problem title, description, constraints, code, language, runtime, and memory after submission.
- **Structured AI Analysis**: Get feedback on approach, time/space complexity, code style, bugs, improvements, alternative solutions, and interview follow-ups.
- **LeetCode-Styled Sidebar**: Dark theme UI with tabs matching the LeetCode aesthetic.
- **Multi-Provider Support**: Works with OpenAI, Google Gemini, Groq, OpenRouter, and any custom OpenAI-compatible endpoint (including local LLMs via Ollama / LM Studio).
- **Secure Settings**: API keys stored in Chrome sync storage.

## Installation

### From Source (Developer Mode)

1. Clone or download this repository.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to build the extension.
4. Open Chrome and navigate to `chrome://extensions/`.
5. Enable **Developer mode** (toggle in the top right).
6. Click **Load unpacked** and select the `dist/` folder.
7. Click the LeetCoach icon or submit a solution on LeetCode to open the sidebar.

### Chrome Web Store

Coming soon.

## Usage

1. Open any LeetCode problem page.
2. Click the LeetCoach extension icon (or it will auto-open on submission).
3. Write and submit your code.
4. LeetCoach automatically detects the submission result and sends it for AI analysis.
5. Browse the structured feedback in the sidebar tabs:
   - **Approach** — Algorithm summary and complexity analysis
   - **Efficiency** — Runtime/memory score and notes
   - **Style** — Code readability and idiomatic usage score
   - **Bugs** — Detected issues with severity and fixes
   - **Improve** — Suggested optimizations and refactors
   - **Interview** — Follow-up questions and hints

## Configuration

1. Right-click the LeetCoach icon and choose **Options** (or open `chrome-extension://<id>/settings.html`).
2. Select your AI provider preset or choose **Custom**.
3. Enter your API key, model name, and adjust temperature / max tokens.
4. Click **Test Connection** to verify everything works.
5. Click **Save Settings**.

### Provider Presets

| Provider   | Base URL                                      | Suggested Model       |
|------------|-----------------------------------------------|-----------------------|
| OpenAI     | `https://api.openai.com/v1`                   | `gpt-4o-mini`         |
| Gemini     | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-1.5-flash` |
| Groq       | `https://api.groq.com/openai/v1`              | `llama3-8b-8192`      |
| OpenRouter | `https://openrouter.ai/api/v1`                | `openai/gpt-4o-mini`  |
| Custom     | Your local server (e.g., `http://localhost:11434/v1`) | Your model name |

## Project Structure

```
leetcode-ai-reviewer/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── content_scripts/
│   │   └── content.ts          # DOM extraction & sidebar injection
│   ├── background/
│   │   └── background.ts       # Service worker & AI API calls
│   ├── sidebar/
│   │   ├── sidebar.html
│   │   ├── sidebar.css
│   │   └── sidebar.ts          # Sidebar UI logic
│   ├── settings/
│   │   ├── settings.html
│   │   ├── settings.css
│   │   └── settings.ts         # Options page logic
│   └── shared/
│       └── types.ts            # Shared TypeScript types & constants
├── dist/                       # Build output (load this in Chrome)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Watch mode (rebuilds on file changes)
npm run build:watch
```

## Permissions

- `activeTab`, `scripting` — To inject the sidebar on LeetCode pages.
- `storage` — To save user settings securely.
- Host permissions for LeetCode and AI provider APIs.

## License

MIT
