# LinkedIn Message Drafter

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)](manifest.json)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)](CONTRIBUTING.md)

> Open any LinkedIn profile, click the icon, and instantly draft a personalized outreach message — from templates or with AI (Claude).

---

## ⚡ Install

### From Chrome Web Store (Recommended)

> *Coming soon — submission in progress.*

### Load Unpacked (Developers)

1. Clone this repository:
   ```bash
   git clone https://github.com/bhavikprit/Linkedin-Messaging.git
   ```
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (toggle in the top-right).
4. Click **Load unpacked** and select the cloned folder.
5. Pin the extension to your toolbar for easy access.

---

## ✨ Features

- **One-Click Drafting** — Open a LinkedIn profile, click the icon, get a message.
- **Smart Templates** — Built-in templates for Sales, Recruiting, Networking, and Connection Requests. No setup required.
- **AI-Powered Drafts** — Enable Claude AI for fully personalized messages that reference the person's background (bring your own API key).
- **Profile Auto-Detection** — Automatically reads name, role, company, headline, about, location, and experience. All fields are editable.
- **Customizable Options** — Choose intent, tone, and message length.
- **Direct Insert** — Copy or insert directly into LinkedIn's message box / "Add a note" field.
- **Connection Note Limits** — Respects LinkedIn's 300-char limit with a live counter.
- **Multiple AI Models** — Choose Claude Opus, Sonnet, or Haiku in Settings.

---

## 🎯 How It Works

1. Navigate to any LinkedIn profile (`linkedin.com/in/…`).
2. Click the **LinkedIn Message Drafter** icon in your toolbar.
3. The extension scrapes the profile (name, role, company, location, headline, about, experience). You can edit any field.
4. Pick an **intent** (Sales, Recruiting, Networking, Connection note), **tone** (Professional, Friendly, Casual), and **length** (Short, Medium, Long).
5. Click **Draft message**.
6. **Copy** the result or **Insert into LinkedIn** to drop it into an open message / "Add a note" box.

---

## 📖 How to Use

### Basic Usage (Templates — No Setup Needed)

1. **Navigate** to any LinkedIn profile page.
2. **Click** the extension icon — the popup opens with the person's profile fields auto-filled.
3. **Review & edit** the detected fields if anything looks off.
4. **Select your options:**
   - **Intent:** What's the message for? (Sales pitch, Recruiting outreach, Networking, Connection request)
   - **Tone:** How should it sound? (Professional, Friendly, Casual)
   - **Length:** How long? (Short = 2-3 sentences, Medium = paragraph, Long = detailed)
5. **Click "Draft message"** — a message is generated from the built-in template.
6. **Use the result:**
   - Click **📋 Copy** to copy to clipboard.
   - Click **📩 Insert into LinkedIn** to paste it directly into an open LinkedIn message box or "Add a note" dialog.
7. **Iterate** — Change options and re-draft until you're happy.

### AI-Powered Drafting (Optional)

For messages that reference specific details from the person's profile:

1. **Get an API key:** Visit [Anthropic Console](https://console.anthropic.com/settings/keys) and create an API key.
2. **Open Settings:** Click **⚙︎** in the popup (or right-click the extension icon → Options).
3. **Configure:**
   - Paste your API key and click **Test** to verify.
   - Fill in your **sender details** (your name, role, company) — the AI uses these to personalize the message from your perspective.
   - Choose your preferred **AI model**:
     - **Claude Opus** — Highest quality, most nuanced
     - **Claude Sonnet** — Balanced quality and speed
     - **Claude Haiku** — Fastest and cheapest
   - Click **Save**.
4. **Draft with AI:** Back in the popup, toggle **"Use AI"** on, then click **Draft message**.

> **Note:** The API key is stored only on your device (`chrome.storage.local`, not synced) and is sent directly to `api.anthropic.com`. It never touches any other server.

### Connection Request Notes

When you select **"Connection note"** as the intent:
- Messages are automatically kept under LinkedIn's **300-character limit**.
- A live character counter appears in the popup.
- The AI (if enabled) is instructed to stay within the limit.

### Tips for Best Results

- **Edit the "About" field** — If the scraper picks up a truncated about section, paste the full text for better AI results.
- **Add context** — The more profile data available, the more personalized the draft.
- **Iterate** — Try different tone + length combinations to find what works.
- **Template first** — Start with templates to see if they're good enough before using AI credits.

---

## 📁 File Structure

| Path | Purpose |
| --- | --- |
| `manifest.json` | MV3 manifest, permissions, content-script registration |
| `content/scraper.js` | Reads profile fields from the LinkedIn DOM; inserts drafts |
| `background/service-worker.js` | Calls the Claude API; key never touches the page |
| `popup/` | The main UI: review profile → choose options → draft → copy/insert |
| `options/` | Settings: API key, model, sender details, defaults |
| `lib/defaults.js` | Shared templates, option lists, and storage helpers |
| `icons/` | Extension icons (16, 32, 48, 128 px) |
| `store/` | Chrome Web Store listing assets (not part of the extension) |

---

## ⚠️ Notes & Limitations

- **LinkedIn's HTML changes often.** Selectors have fallbacks, but if scraping ever comes back blank, just fill the fields in manually — the rest works the same.
- This reads only the profile page you're actively viewing, on demand. It does not crawl, bulk-collect, or store profiles. Use it in line with LinkedIn's terms.
- Connection-request notes are capped by LinkedIn at 300 characters; the popup shows a live counter and the AI is told to stay under the limit.

---

## 🔒 Privacy & Security

- **Profile data stays local** — exists only in the popup for the current draft, never persisted.
- **API key stored locally** — via `chrome.storage.local`, never synced or sent to third parties.
- **AI is optional** — template drafting works with zero external requests.
- **No tracking, no analytics** — we don't collect any telemetry.

For full details, see our [Privacy Policy](PRIVACY_POLICY.md).

---

## 🤝 Contributing

We welcome contributions! Whether it's a bug fix, new feature, or documentation improvement — all help is appreciated.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this software for any purpose.

---

## 👤 Author

**Bhavik Prit**

- GitHub: [@bhavikprit](https://github.com/bhavikprit)
- Email: bhavikpatel13792@gmail.com

---

<p align="center">
  <i>If this extension saves you time, give it a ⭐ on GitHub!</i>
</p>
