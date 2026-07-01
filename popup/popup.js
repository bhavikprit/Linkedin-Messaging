// popup/popup.js
const { DEFAULTS, store, fillTemplate } = window.LMD;

const $ = (id) => document.getElementById(id);
const el = {
  notProfile: $("notProfile"),
  loading: $("loading"),
  main: $("main"),
  openSettings: $("openSettings"),
  rescrape: $("rescrape"),
  fullName: $("f_fullName"),
  role: $("f_role"),
  company: $("f_company"),
  location: $("f_location"),
  headline: $("f_headline"),
  intent: $("intent"),
  tone: $("tone"),
  length: $("length"),
  useAI: $("useAI"),
  aiHint: $("aiHint"),
  generate: $("generate"),
  outputCard: $("outputCard"),
  output: $("output"),
  charCount: $("charCount"),
  copy: $("copy"),
  insert: $("insert"),
  regenerate: $("regenerate"),
  status: $("status"),
};

let settings = DEFAULTS.settings;
let apiKey = "";
let activeTab = null;
let templateIndex = 0; // rotate through template variants on regenerate

// --- Setup -------------------------------------------------------------------

function show(state) {
  for (const s of [el.notProfile, el.loading, el.main]) s.classList.add("hidden");
  state.classList.remove("hidden");
}

function fillSelect(select, items, getVal, getLabel) {
  select.replaceChildren();
  for (const it of items) {
    const opt = document.createElement("option");
    opt.value = getVal(it);
    opt.textContent = getLabel(it);
    select.appendChild(opt);
  }
}

// Set a <select> to value, falling back to a known default if value isn't an option
// (a stale stored preference would otherwise silently land on option[0]).
function setSelect(select, value, fallback) {
  select.value = value;
  if (select.selectedIndex < 0) select.value = fallback;
}

let reqSeq = 0; // guards against overlapping AI requests landing out of order

function populateSelects() {
  fillSelect(el.intent, DEFAULTS.intents, (i) => i.id, (i) => i.label);
  fillSelect(el.tone, DEFAULTS.tones, (t) => t, (t) => t[0].toUpperCase() + t.slice(1));
  fillSelect(el.length, DEFAULTS.lengths, (l) => l.id, (l) => l.label);
}

function applyDefaults() {
  const d = DEFAULTS.settings;
  setSelect(el.intent, settings.defaultIntent, d.defaultIntent);
  setSelect(el.tone, settings.defaultTone, d.defaultTone);
  setSelect(el.length, settings.defaultLength, d.defaultLength);
  el.useAI.checked = settings.useAI && !!apiKey;
  el.useAI.disabled = !apiKey;
  el.aiHint.classList.toggle("hidden", !!apiKey);
}

function setProfile(p) {
  el.fullName.value = p.fullName || "";
  el.role.value = p.role || "";
  el.company.value = p.company || "";
  el.location.value = p.location || "";
  el.headline.value = p.headline || "";
  // Keep the full scraped object (about, experience, education) for AI mode.
  el.fullName.dataset.scraped = JSON.stringify(p);
}

function currentProfile() {
  let scraped = {};
  try {
    scraped = JSON.parse(el.fullName.dataset.scraped || "{}");
  } catch (_) {}
  const fullName = el.fullName.value.trim();
  const parts = fullName.split(" ").filter(Boolean);
  return Object.assign({}, scraped, {
    fullName,
    firstName: parts[0] || "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : "",
    role: el.role.value.trim(),
    company: el.company.value.trim(),
    location: el.location.value.trim(),
    headline: el.headline.value.trim(),
  });
}

// --- Messaging to the content script ----------------------------------------

function rawSendToTab(msg) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(activeTab.id, msg, (resp) => {
      const err = chrome.runtime.lastError;
      resolve({ resp: err ? null : resp, error: err ? err.message : null });
    });
  });
}

// Send a message to the content script, injecting it first if it isn't there yet
// (e.g. the page was open before the extension was installed/updated).
async function ensureSendToTab(msg) {
  let r = await rawSendToTab(msg);
  if (r.resp == null && /establish connection|Receiving end does not exist/i.test(r.error || "")) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, files: ["content/scraper.js"] });
      r = await rawSendToTab(msg);
    } catch (_) {}
  }
  return r;
}

// --- Drafting ----------------------------------------------------------------

function setStatus(msg, kind) {
  el.status.textContent = msg || "";
  el.status.className = "status" + (kind ? " " + kind : "");
}

function updateCharCount() {
  const n = el.output.value.length;
  // Key the 300-char guard off the intent that produced the draft in the box,
  // not the live dropdown (which the user may have changed since drafting).
  const isConnection = (el.output.dataset.draftIntent || el.intent.value) === "connection";
  let txt = `${n} chars`;
  if (isConnection) {
    txt += n > 300 ? " — over LinkedIn's 300-char note limit" : " / 300";
  }
  el.charCount.textContent = txt;
  el.charCount.style.color = isConnection && n > 300 ? "var(--danger)" : "var(--muted)";
}

function templateValues(profile) {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: profile.fullName,
    headline: profile.headline,
    company: profile.company,
    role: profile.role,
    location: profile.location,
    senderName: settings.senderName,
    senderCompany: settings.senderCompany,
    senderOffer: settings.senderOffer,
  };
}

function generateFromTemplate(profile) {
  const intent = el.intent.value;
  const variants = DEFAULTS.templates[intent] || DEFAULTS.templates.networking;
  const tpl = variants[templateIndex % variants.length];
  return fillTemplate(tpl, templateValues(profile));
}

async function generateWithAI(profile) {
  const payload = {
    apiKey,
    model: settings.model,
    profile,
    intent: el.intent.value,
    tone: el.tone.value,
    length: el.length.value,
    sender: {
      senderName: settings.senderName,
      senderCompany: settings.senderCompany,
      senderOffer: settings.senderOffer,
    },
    customInstructions: settings.customInstructions,
  };
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GENERATE_DRAFT", payload }, (resp) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(resp || { ok: false, error: "No response from background." });
      }
    });
  });
}

async function generate() {
  const profile = currentProfile();
  if (!profile.firstName) {
    setStatus("Add at least a name before drafting.", "err");
    return;
  }
  el.outputCard.classList.remove("hidden");
  el.output.dataset.draftIntent = el.intent.value; // pin the counter to this draft's intent
  setStatus("");

  if (el.useAI.checked && apiKey) {
    const seq = ++reqSeq;
    el.generate.disabled = true;
    el.regenerate.disabled = true;
    el.generate.textContent = "Drafting…";
    setStatus("Asking Claude…");
    const resp = await generateWithAI(profile);
    if (seq !== reqSeq) return; // a newer request superseded this one
    el.generate.disabled = false;
    el.regenerate.disabled = false;
    el.generate.textContent = "Draft message";
    if (resp.ok) {
      el.output.value = resp.text;
      setStatus("Drafted with " + (resp.model || settings.model) + ".", "ok");
    } else {
      setStatus(resp.error || "Something went wrong.", "err");
    }
  } else {
    el.output.value = generateFromTemplate(profile);
    setStatus("Drafted from a template. Tweak it or turn on AI for a custom write-up.", "ok");
  }
  updateCharCount();
}

// --- Actions -----------------------------------------------------------------

async function copyDraft() {
  try {
    await navigator.clipboard.writeText(el.output.value);
    setStatus("Copied to clipboard.", "ok");
  } catch (_) {
    el.output.select();
    document.execCommand("copy");
    setStatus("Copied.", "ok");
  }
}

async function insertDraft() {
  const { resp, error } = await ensureSendToTab({ type: "INSERT_DRAFT", text: el.output.value });
  if (resp && resp.ok) {
    setStatus(resp.warning || "Inserted into the LinkedIn message box.", resp.warning ? "" : "ok");
  } else {
    const msg = (resp && resp.error) || error || "Couldn't insert — copy it instead.";
    setStatus(msg, "err");
  }
}

function regenerate() {
  if (!el.useAI.checked) templateIndex += 1; // rotate template variant
  generate();
}

// --- Init --------------------------------------------------------------------

async function init() {
  populateSelects();

  el.openSettings.addEventListener("click", () => chrome.runtime.openOptionsPage());
  el.generate.addEventListener("click", generate);
  el.regenerate.addEventListener("click", regenerate);
  el.copy.addEventListener("click", copyDraft);
  el.insert.addEventListener("click", insertDraft);
  el.output.addEventListener("input", updateCharCount);
  el.intent.addEventListener("change", updateCharCount);
  el.rescrape.addEventListener("click", refresh);
  el.useAI.addEventListener("change", () => {
    if (el.useAI.checked && !apiKey) {
      el.useAI.checked = false;
      setStatus("Add an API key in Settings to use AI.", "err");
    }
  });

  [settings, apiKey] = await Promise.all([store.getSettings(), store.getApiKey()]);
  applyDefaults();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;

  if (!tab || !/^https:\/\/www\.linkedin\.com\/in\//.test(tab.url || "")) {
    show(el.notProfile);
    return;
  }
  await refresh();
}

async function refresh() {
  show(el.loading);
  const { resp } = await ensureSendToTab({ type: "SCRAPE_PROFILE" });
  if (resp && resp.ok) {
    setProfile(resp);
    show(el.main);
  } else {
    setProfile({});
    show(el.main);
    setStatus("Couldn't read the profile automatically — fill the fields in manually.", "err");
  }
}

document.addEventListener("DOMContentLoaded", init);
