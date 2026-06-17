# Privacy Policy for LeetCoach AI Reviewer

**Effective Date:** June 17, 2026

LeetCoach ("we", "our", or "us") is dedicated to protecting your privacy. This Privacy Policy describes how your information is handled when you use the LeetCoach AI Reviewer browser extension (the "Extension").

---

## 1. Summary of Our Privacy Stance
* **No Server-Side Storage:** We do not own any backend servers. Your data is never collected, stored, or sold.
* **No Analytics or Tracking:** The Extension does not contain any telemetry, tracking scripts, or analytics libraries.
* **Local Storage Only:** Your settings and API keys are stored exclusively in your browser's local sync storage (`chrome.storage.sync`).

---

## 2. Information Collected and Processed
To provide AI-driven code reviews and recommendations, the Extension processes two types of information:

### A. API Keys and Settings
* **Purpose:** To authenticate with your chosen AI provider (OpenAI, Google Gemini, Groq, OpenRouter, or Custom/Local LLM).
* **Storage:** Stored locally in your browser's secure sync storage.
* **Transmission:** Sent solely and directly to the AI endpoint you configure. We never see or store your API keys.

### B. LeetCode Problem and Code Context
* **Purpose:** To request code analysis, complexity estimates, and hint generation from the selected AI model.
* **Processing:** When you request a review, the Extension reads the current LeetCode problem description and your active code snippet. It bundles this data into a prompt and transmits it directly to the configured AI API endpoint.
* **Transmission:** This data is sent directly from your browser to your selected AI provider (e.g., api.openai.com). No third-party servers act as intermediaries.

---

## 3. Third-Party Service Providers
When using LeetCoach, your data (problems and code submissions) is processed by the AI provider you configure. Please refer to their respective privacy policies for details on how they handle your inputs:
- [OpenAI Privacy Policy](https://openai.com/privacy)
- [Google Privacy Policy (Gemini API)](https://policies.google.com/privacy)
- [Groq Privacy Policy](https://groq.com/privacy)
- [OpenRouter Privacy Policy](https://openrouter.ai/privacy)

---

## 4. Changes to This Policy
We may update this Privacy Policy from time to time to reflect changes in our practices or store guidelines. Any updates will be pushed directly through the extension store update mechanism.

---

## 5. Contact Information
If you have any questions about this Privacy Policy or the security of your data in LeetCoach, please feel free to open an issue on our GitHub repository:
`https://github.com/RICH-KEED/LeetCoach`
