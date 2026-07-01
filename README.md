# LinkedIn Message Drafter

A Chrome extension (Manifest V3) that reads the LinkedIn profile you're viewing and
drafts a personalized outreach message in one click — from editable templates, or with
AI (Claude) for a fully custom write-up.

## How it works

1. Open any LinkedIn profile (`linkedin.com/in/…`).
2. Click the extension icon.
3. It scrapes the profile (name, role, company, location, headline, about, experience).
   You can edit any field before drafting.
4. Pick an **intent** (Sales, Recruiting, Networking, Connection note), **tone**, and
   **length**, then click **Draft message**.
5. **Copy** the result or **Insert into LinkedIn** to drop it into an open message /
   "Add a note" box.

Templates work instantly with no setup. Flip on **Use AI** (after adding an API key in
Settings) for a personalized message written by Claude.

## Install (load unpacked)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this folder
   (`Linkedin Message Draft`).
4. Pin the extension and open a LinkedIn profile to try it.

## Enable AI drafting (optional)

1. Get an Anthropic API key: https://console.anthropic.com/settings/keys
2. Click the extension icon → **⚙︎ Settings** (or right-click the icon → Options).
3. Paste your key, hit **Test** to verify, fill in your sender details, and **Save**.
4. In the popup, turn on **Use AI** and draft.

The API key is stored only on your device (`chrome.storage.local`, not synced) and is
sent directly from the extension's background worker to `api.anthropic.com`. The default
model is Claude Opus 4.8; you can switch to Sonnet 4.6 or Haiku 4.5 in Settings to trade
quality for speed/cost.

## Files

| Path | Purpose |
| --- | --- |
| `manifest.json` | MV3 manifest, permissions, content-script registration |
| `content/scraper.js` | Reads profile fields from the LinkedIn DOM; inserts drafts |
| `background/service-worker.js` | Calls the Claude API; key never touches the page |
| `popup/` | The main UI: review profile → choose options → draft → copy/insert |
| `options/` | Settings: API key, model, sender details, defaults |
| `lib/defaults.js` | Shared templates, option lists, and storage helpers |
| `icons/` | Extension icons |

## Notes & limitations

- **LinkedIn's HTML changes often.** Selectors have fallbacks, but if scraping ever
  comes back blank, just fill the fields in manually — the rest works the same.
- This reads only the profile page you're actively viewing, on demand. It does not
  crawl, bulk-collect, or store profiles. Use it in line with LinkedIn's terms.
- Connection-request notes are capped by LinkedIn at 300 characters; the popup shows a
  live counter and the AI is told to stay under the limit.

## Privacy

- Profile data stays in the popup for the current draft and is not persisted.
- The API key and your sender settings are stored locally via `chrome.storage`.
- Profile details are sent to Anthropic only when you use **Use AI** to draft.
