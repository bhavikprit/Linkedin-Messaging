// background/service-worker.js
// Handles Claude API calls off the page so the API key never touches LinkedIn's
// context and CORS is straightforward. Listens for GENERATE_DRAFT from the popup.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const SYSTEM_PROMPT = `You are an expert at writing concise, genuinely personalized LinkedIn outreach messages that get replies. You write the way a thoughtful human does: warm, specific, and direct.

Rules:
- Open with something specific and true from the recipient's profile (their role, company, or a detail from their about/experience). Never use generic flattery.
- Sound natural and conversational. Avoid corporate buzzwords and clichés like "I hope this message finds you well", "I came across your profile", or "I'd love to pick your brain".
- Be honest. Never invent facts about the recipient, and never claim shared connections, meetings, or events that are not in the provided data.
- Make the ask clear and low-friction, matched to the stated intent.
- Match the requested tone, and stay within the length limit.
- If a sender name is provided, sign off naturally with it. If not, do not invent one.
- Output ONLY the message text. No preamble, no surrounding quotes, no "Subject:" line.`;

const LENGTH_GUIDE = {
  short: "Very short — 2 to 3 sentences, roughly 40-60 words.",
  medium: "Short — about 4 sentences, roughly 70-100 words.",
  long: "A short paragraph, roughly 120-160 words. Still tight, no filler.",
};

function buildUserPrompt(payload) {
  const { profile = {}, intent, tone, length, sender = {}, customInstructions } = payload;

  const intentText =
    {
      sales: "Sales / cold outreach — open a conversation about how the sender could help.",
      recruiting: "Recruiting — gauge interest in a role or opportunity at the sender's company.",
      networking: "Networking — build a genuine professional connection, no hard ask.",
      connection: "A LinkedIn connection-request note. MUST be under 300 characters total. No sign-off needed.",
    }[intent] || "General professional outreach.";

  const lines = [];
  lines.push(`INTENT: ${intentText}`);
  lines.push(`TONE: ${tone || "warm"}`);
  lines.push(`LENGTH: ${LENGTH_GUIDE[length] || LENGTH_GUIDE.medium}`);
  if (intent === "connection") {
    lines.push("HARD LIMIT: The entire message must be under 300 characters.");
  }

  lines.push("");
  lines.push("SENDER (the person writing the message):");
  lines.push(`- Name: ${sender.senderName || "(not provided — do not sign off)"}`);
  if (sender.senderCompany) lines.push(`- Company: ${sender.senderCompany}`);
  if (sender.senderOffer) lines.push(`- What they offer / why reaching out: ${sender.senderOffer}`);
  if (customInstructions) lines.push(`- Extra instructions: ${customInstructions}`);

  lines.push("");
  lines.push("RECIPIENT PROFILE (only use details that are present):");
  if (profile.fullName) lines.push(`- Name: ${profile.fullName}`);
  if (profile.headline) lines.push(`- Headline: ${profile.headline}`);
  if (profile.role) lines.push(`- Current role: ${profile.role}`);
  if (profile.company) lines.push(`- Current company: ${profile.company}`);
  if (profile.location) lines.push(`- Location: ${profile.location}`);
  if (profile.about) lines.push(`- About: ${profile.about.slice(0, 600)}`);
  if (Array.isArray(profile.experience) && profile.experience.length) {
    const exp = profile.experience
      .map((e) => [e.title, e.company].filter(Boolean).join(" at "))
      .filter(Boolean)
      .join("; ");
    if (exp) lines.push(`- Experience: ${exp}`);
  }
  if (Array.isArray(profile.education) && profile.education.length) {
    lines.push(`- Education: ${profile.education.join("; ")}`);
  }

  lines.push("");
  lines.push("Write the message now. Output only the message text.");
  return lines.join("\n");
}

async function generateDraft(payload) {
  const { apiKey, model } = payload;
  if (!apiKey) {
    return { ok: false, error: "No API key set. Open the extension's Settings and paste your Anthropic API key." };
  }

  let resp;
  try {
    resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        // Required to allow calling the API directly from a browser extension.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model || "claude-opus-4-8",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(payload) }],
      }),
    });
  } catch (e) {
    return { ok: false, error: `Network error reaching Anthropic: ${e && e.message ? e.message : e}` };
  }

  let data;
  try {
    data = await resp.json();
  } catch (e) {
    return { ok: false, error: `Could not read API response (HTTP ${resp.status}).` };
  }

  if (!resp.ok) {
    const msg = data && data.error && data.error.message ? data.error.message : `HTTP ${resp.status}`;
    return { ok: false, error: `Anthropic API error: ${msg}` };
  }

  if (data.stop_reason === "refusal") {
    return { ok: false, error: "The model declined to write this message. Try adjusting the intent or instructions." };
  }

  const textBlock = Array.isArray(data.content) ? data.content.find((b) => b.type === "text") : null;
  const text = textBlock ? textBlock.text.trim() : "";
  if (!text) {
    return { ok: false, error: "The model returned an empty message. Try again." };
  }

  return { ok: true, text, model: data.model };
}

async function testKey(apiKey, model) {
  if (!apiKey) return { ok: false, error: "No key provided." };
  try {
    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model || "claude-opus-4-8",
        max_tokens: 1,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });
    if (resp.ok) return { ok: true };
    const data = await resp.json().catch(() => ({}));
    const m = data && data.error && data.error.message ? data.error.message : `HTTP ${resp.status}`;
    return { ok: false, error: m };
  } catch (e) {
    return { ok: false, error: `Network error: ${e && e.message ? e.message : e}` };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "GENERATE_DRAFT") {
    generateDraft(msg.payload)
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, error: String(e && e.message ? e.message : e) }));
    return true; // keep the message channel open for the async response
  }
  if (msg && msg.type === "TEST_KEY") {
    testKey(msg.apiKey, msg.model)
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, error: String(e && e.message ? e.message : e) }));
    return true;
  }
});
