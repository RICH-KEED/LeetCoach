# Microsoft Edge Add-ons Publishing Guide

This guide describes how to publish **LeetCoach** to the Microsoft Edge Add-ons Store. 

> [!NOTE]
> Microsoft Edge extensions use standard Chromium Manifest V3 files. The generated `leetcoach-extension.zip` includes only the compiled and bundled output (HTML, CSS, assets, and compiled JS) from the `dist/` directory. Your original source code (TypeScript, config files, package scripts) is **never** uploaded to the store, keeping it private.

---

## Step 1: Create a Microsoft Developer Account

1. Navigate to the [Microsoft Partner Center Developer Dashboard](https://partner.microsoft.com/dashboard/microsoftedge/public/login).
2. Sign in with your Microsoft Account (or create one).
3. Register as an Extension Developer:
   - Registration is free and instant for individual developer accounts.
   - Choose a display name (this will appear under your extension name in the store).
   - Agree to the Microsoft Developer Agreement.

---

## Step 2: Build and Package the Extension

1. Open your terminal in the extension folder (`downloads/leetcode-ai-reviewer`).
2. Run the build and package scripts:
   ```bash
   npm run build
   npm run zip
   ```
3. This creates a file named `leetcoach-extension.zip` in the extension root.
   - This ZIP contains only the contents of the `dist/` directory (compiled Javascript, icons, HTML layouts, and styling).
   - None of your source TypeScript files, config files, or settings are included.

---

## Step 3: Create a New Submission

1. On your Microsoft Partner Center Dashboard, click **Create new extension**.
2. Upload the `leetcoach-extension.zip` file:
   - The platform will validate your `manifest.json` file inside the ZIP.
   - Once validated, click **Next**.

---

## Step 4: Configure Listing Details

Fill in the information to display in the Edge Add-ons store:

### 1. Store Properties
- **Category**: Developer Tools or Productivity.
- **Support Contact Email**: Add your contact address.
- **Privacy Policy URL**: Use the local privacy policy file `cws-assets/privacy-policy.html` by hosting it on your GitHub Pages or static site (e.g. `https://<yourusername>.github.io/LeetCoach/privacy-policy.html`).

### 2. Marketing and Description
Copy the pre-made listing contents from `cws-assets/marketing-description.txt`. Here is the description to paste:
- **Title**: `LeetCoach - AI Code Review for LeetCode`
- **Description**: (Paste the contents of `cws-assets/marketing-description.txt`)

### 3. Icons and Screenshots
Upload the promotional assets located in the `cws-assets/` folder:
- **Extension Icon**: Upload `cws-assets/icon128.png` (or upload sizes 16px, 48px, 128px where requested).
- **Store Tile (440x280)**: Upload `cws-assets/promo-tile-440x280.png`.
- **Screenshots (1280x800)**: Upload `cws-assets/screenshot-1280x800.png` under screenshots.

---

## Step 5: Review and Submit

1. Under **Availability**, select the regions you want the extension to be available in (default is all regions).
2. Under **Notes for Certification** (optional):
   - Mention that LeetCoach allows users to paste their own API keys for OpenAI, Gemini, or Groq.
   - Provide instructions if reviewers ask: *"The extension reads LeetCode submissions client-side and forwards them to the API configured in the options page. Users must input their own keys. We do not run any remote scripts."*
3. Click **Submit**.

Certification usually takes **1 to 3 business days** to complete, after which your extension will be live on the Edge Add-ons store!
