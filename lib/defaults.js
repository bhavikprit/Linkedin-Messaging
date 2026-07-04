// lib/defaults.js
// Shared constants for the popup and options pages. Plain script (no modules)
// so it can be included with a <script> tag in both contexts.

window.LMD = window.LMD || {};

window.LMD.DEFAULTS = {
  // Stored settings and their defaults.
  settings: {
    model: "claude-opus-4-8",
    defaultIntent: "networking",
    defaultTone: "warm",
    defaultLength: "medium",
    useAI: false,
    senderName: "",
    senderCompany: "",
    senderOffer: "",
    customInstructions: "",
  },

  models: [
    { id: "claude-opus-4-8", label: "Claude Opus 4.8 — best quality", provider: "anthropic" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — balanced", provider: "anthropic" },
    { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 — fastest / cheapest", provider: "anthropic" },
    { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash — fast & smart", provider: "openrouter" },
    { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B — powerful open-source", provider: "openrouter" },
    { id: "deepseek/deepseek-chat", label: "DeepSeek V3 — fast & smart", provider: "openrouter" },
  ],

  intents: [
    { id: "sales", label: "Sales / outreach" },
    { id: "recruiting", label: "Recruiting" },
    { id: "networking", label: "Networking" },
    { id: "connection", label: "Connection request note" },
  ],

  tones: ["warm", "professional", "casual", "direct", "enthusiastic"],

  lengths: [
    { id: "short", label: "Short" },
    { id: "medium", label: "Medium" },
    { id: "long", label: "Long" },
  ],

  // Template-mode messages. Placeholders: {firstName} {lastName} {fullName}
  // {headline} {company} {role} {location} {senderName} {senderCompany} {senderOffer}
  // Text wrapped in [[ ... ]] is an OPTIONAL clause: it is dropped entirely if any
  // placeholder inside it resolves to an empty value, so drafts never read brokenly.
  templates: {
    sales: [
      "Hi {firstName},[[ I noticed you're {role} at {company}.]][[ {senderCompany} helps teams like yours {senderOffer}.]] Would you be open to a quick chat to see if it's relevant? No pressure either way.[[ Best, {senderName}]]",
      "Hi {firstName},[[ your work at {company} stood out to me.]][[ We're helping similar teams {senderOffer}.]] Would it be worth a short conversation to see if there's a fit?[[ Best, {senderName}]]",
    ],
    recruiting: [
      "Hi {firstName},[[ your experience as {role} at {company} caught my eye.]][[ We're growing the team at {senderCompany} and I think you could be a strong fit for a role we're hiring for.]] Would you be open to hearing more?[[ Best, {senderName}]]",
      "Hi {firstName},[[ your background in {headline} is impressive.]][[ We have an opening at {senderCompany} that might line up well with what you do.]] Would you be open to a quick chat?[[ Best, {senderName}]]",
    ],
    networking: [
      "Hi {firstName},[[ I really admire the work you're doing as {role} at {company}.]] I'm spending more time in this space myself and would love to connect and learn from your perspective.[[ Best, {senderName}]]",
      "Hi {firstName},[[ your path into {headline} resonated with me.]] I'd love to connect and trade notes — always glad to know more people doing interesting work in this area.[[ Best, {senderName}]]",
    ],
    connection: [
      "Hi {firstName},[[ your work as {role} at {company} really stands out.]] I'd love to connect and follow what you're building.",
      "Hi {firstName},[[ I admire what you're doing in {headline}.]] Would love to connect!",
    ],
  },
};

// --- Storage helpers --------------------------------------------------------
// API key lives in chrome.storage.local (never synced across devices).
// Non-sensitive preferences live in chrome.storage.sync.

window.LMD.store = {
  async getSettings() {
    const synced = await chrome.storage.sync.get("settings");
    return Object.assign({}, window.LMD.DEFAULTS.settings, synced.settings || {});
  },
  async setSettings(settings) {
    await chrome.storage.sync.set({ settings });
  },
  async getApiKey() {
    const { apiKey } = await chrome.storage.local.get("apiKey");
    return apiKey || "";
  },
  async setApiKey(apiKey) {
    await chrome.storage.local.set({ apiKey: apiKey || "" });
  },
  async getOpenRouterKey() {
    const { openRouterKey } = await chrome.storage.local.get("openRouterKey");
    return openRouterKey || "";
  },
  async setOpenRouterKey(openRouterKey) {
    await chrome.storage.local.set({ openRouterKey: openRouterKey || "" });
  },
};

// Fill a template. [[ ... ]] optional clauses are dropped whole if any placeholder
// inside them is empty; bare {placeholders} resolve directly. Spacing is tidied so
// sentences still read after a clause is removed.
window.LMD.fillTemplate = function (tpl, values) {
  const resolve = (str) =>
    str.replace(/\{(\w+)\}/g, (_m, key) => {
      const v = values[key];
      return v == null ? "" : String(v);
    });

  // Drop any optional clause that references an empty/missing placeholder.
  let out = tpl.replace(/\[\[([\s\S]*?)\]\]/g, (_m, seg) => {
    let keep = true;
    seg.replace(/\{(\w+)\}/g, (_mm, key) => {
      if (!values[key]) keep = false;
      return "";
    });
    return keep ? resolve(seg) : "";
  });

  // Resolve any remaining bare placeholders, then tidy whitespace/punctuation.
  out = resolve(out)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([.,!?])/g, "$1")
    .replace(/([.,!?]) +(?=[.,!?])/g, "$1")
    .trim();
  return out;
};
