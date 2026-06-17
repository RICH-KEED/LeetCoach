# LeetCoach AI Reviewer 🚀

LeetCoach is a premium, high-performance browser extension designed to help software engineers master LeetCode. It integrates directly into the LeetCode sidebar to provide real-time, context-aware AI code reviews, time/space complexity analysis, edge-case checks, and hints—all powered by your own AI keys (OpenAI, Gemini, Groq, OpenRouter, or Custom Local LLMs).

---

## ✨ Features

- **Side-by-Side Code Review:** Seamlessly nested within the LeetCode workspace.
- **Custom AI Providers:** Bring your own API key to use OpenAI GPT-4o, Google Gemini, Groq, OpenRouter, or local servers (Ollama, LM Studio).
- **Complexity Analysis:** Immediate calculations for Big-O Time and Space complexity.
- **Edge Case Detector:** Identifies hidden corner cases that could cause your solution to fail.
- **Privacy First:** Stored API keys stay encrypted in `chrome.storage.sync` and are never sent to external tracking servers.

---

## 🛠️ Project Structure

```text
├── downloads/
│   ├── landing/                  # Premium animated landing page website
│   │   ├── index.html            # Main markup
│   │   ├── style.css             # Vanilla CSS design tokens & animations
│   │   └── script.js             # Three.js 3D particles & simulator logic
│   │
│   └── leetcode-ai-reviewer/     # Extension source code
│       ├── src/                  # Background, content, sidebar & settings scripts
│       ├── dist/                 # Bundled production extension
│       ├── vite.config.ts        # Bundler configuration
│       └── EDGE_PUBLISHING_GUIDE.md # Microsoft Edge addons publishing guide
│
├── .gitignore                    # Root ignore configuration
└── PRIVACY.md                    # Store-compliant Privacy Policy
```

---

## 🚀 Getting Started

### 1. Running the Landing Page Locally
The landing page features Three.js cursor gravity animations and a GSAP interactive LeetCode simulator. To view it locally, spin up a simple HTTP server in the repository root:

```powershell
python -m http.server 8080
```
Open your browser and navigate to `http://localhost:8080/downloads/landing/index.html`.

### 2. Building the Extension
To bundle the extension from source:

1. Navigate to the extension directory:
   ```powershell
   cd downloads/leetcode-ai-reviewer
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Run the compiler & package scripts:
   ```powershell
   npm run build
   npm run zip
   ```
This will compile the TypeScript source files and output a zip package at `downloads/leetcode-ai-reviewer/leetcoach-extension.zip` ready for store submission.

---

## 🌿 Dual-Branch Git Layout

To protect local files, cookies, and local scripts from being pushed to GitHub, this repository utilizes a dual-branch structure:

* **`main` (Public / GitHub)**: Excludes local tools (`donwlaoder.py`), cookies (`cookies.txt`), and state backups via `.gitignore`.
* **`local-with-downloader` (Local Only)**: Tracks and commits all local assets for personal backups.

### Switching Between Branches
```powershell
# Switch to public clean branch
git checkout main

# Switch to local backup branch
git checkout local-with-downloader
```

---

## 🛡️ Privacy Policy

LeetCoach is built with privacy at its core. Please see [PRIVACY.md](./PRIVACY.md) for the full Microsoft Edge Addons compliant policy.
