# Privacy Policy — LinkedIn Message Drafter

**Last updated:** July 1, 2026

LinkedIn Message Drafter ("the Extension") is an open-source Chrome extension that helps you draft personalized LinkedIn outreach messages. This policy explains what data the Extension accesses, how it is used, and how it is stored.

---

## 1. Data the Extension Reads

When you click the extension icon while viewing a LinkedIn profile, it reads **publicly visible profile information** from that page:

- Name
- Headline
- Current role and company
- Location
- About section
- Recent experience entries

**Important:** The Extension reads only the profile page you are actively viewing, on demand (when you click the icon). It does **not** crawl, bulk-collect, or automatically scrape profiles.

## 2. Data Stored on Your Device

The Extension stores the following data locally on your device using `chrome.storage.local`:

| Data | Purpose |
|---|---|
| Anthropic API key | Authenticates AI drafting requests |
| Preferred AI model | Your choice of Claude model |
| Sender details (name, role, company) | Used to personalize message templates |
| Default drafting preferences | Your preferred intent, tone, and length |

This data is **never synced** to any cloud service, is **never shared** with third parties, and stays entirely on your device.

## 3. Data Sent to External Services

Profile data is sent to an external service **only** when you explicitly enable the **"Use AI"** toggle and click **"Draft message"**:

- **Recipient:** Anthropic API (`api.anthropic.com`)
- **Data sent:** The profile fields listed above, your sender details, and your drafting preferences (intent, tone, length)
- **Purpose:** To generate a personalized outreach message using Claude
- **Anthropic's privacy policy:** [https://www.anthropic.com/privacy](https://www.anthropic.com/privacy)

When using **template-based drafting** (the default, without AI), **no data is sent anywhere** — everything happens locally in your browser.

## 4. Data the Extension Does NOT Collect

- ❌ No analytics or telemetry
- ❌ No tracking pixels or cookies
- ❌ No browsing history
- ❌ No personal data beyond what's listed above
- ❌ No data sold to third parties
- ❌ No data shared with advertisers
- ❌ No persistent storage of scraped profile data (it exists only in the popup during your current draft session)

## 5. Permissions Explained

| Permission | Why it's needed |
|---|---|
| `activeTab` | To read profile data from the LinkedIn tab you're currently viewing |
| `scripting` | To inject the content script that extracts profile information |
| `storage` | To save your API key, sender details, and preferences locally |
| `https://www.linkedin.com/*` | To run the content script on LinkedIn profile pages |
| `https://api.anthropic.com/*` | To send AI drafting requests to the Claude API |

## 6. Data Retention

- **Profile data:** Not persisted. Exists only in the popup's memory during your current draft session and is discarded when you close the popup.
- **Settings data:** Stored until you manually clear it via the Options page or uninstall the extension.

## 7. Your Controls

- **Disable AI:** Keep the "Use AI" toggle off to ensure no data ever leaves your browser.
- **Clear settings:** Open the Options page and clear your API key and sender details at any time.
- **Uninstall:** Removing the extension deletes all locally stored data.

## 8. Children's Privacy

This Extension is not intended for use by children under the age of 13, and we do not knowingly collect personal information from children.

## 9. Changes to This Policy

If we update this Privacy Policy, we will update the "Last updated" date above and publish the new version in the GitHub repository. Significant changes will be noted in the repository's release notes.

## 10. Contact

If you have questions about this Privacy Policy, please contact:

**Bhavik Prit**
📧 bhavikpatel13792@gmail.com
🔗 [GitHub](https://github.com/bhavikprit)

---

*This privacy policy is hosted on GitHub and applies to the LinkedIn Message Drafter Chrome extension.*
