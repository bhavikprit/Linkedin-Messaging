// options/options.js
const { DEFAULTS, store } = window.LMD;
const $ = (id) => document.getElementById(id);

const el = {
  apiKey: $("apiKey"),
  toggleKey: $("toggleKey"),
  testKey: $("testKey"),
  keyStatus: $("keyStatus"),
  model: $("model"),
  senderName: $("senderName"),
  senderCompany: $("senderCompany"),
  senderOffer: $("senderOffer"),
  customInstructions: $("customInstructions"),
  defaultIntent: $("defaultIntent"),
  defaultTone: $("defaultTone"),
  defaultLength: $("defaultLength"),
  useAI: $("useAI"),
  save: $("save"),
  saveStatus: $("saveStatus"),
};

function fillSelect(select, items, getVal, getLabel) {
  select.replaceChildren();
  for (const it of items) {
    const opt = document.createElement("option");
    opt.value = getVal(it);
    opt.textContent = getLabel(it);
    select.appendChild(opt);
  }
}

function populateSelects() {
  fillSelect(el.model, DEFAULTS.models, (m) => m.id, (m) => m.label);
  fillSelect(el.defaultIntent, DEFAULTS.intents, (i) => i.id, (i) => i.label);
  fillSelect(el.defaultTone, DEFAULTS.tones, (t) => t, (t) => t[0].toUpperCase() + t.slice(1));
  fillSelect(el.defaultLength, DEFAULTS.lengths, (l) => l.id, (l) => l.label);
}

// Set a <select> to value, falling back to a known default if value isn't an option.
function setSelect(select, value, fallback) {
  select.value = value;
  if (select.selectedIndex < 0) select.value = fallback;
}

function setStatus(node, msg, kind) {
  node.textContent = msg || "";
  node.className = "status" + (kind ? " " + kind : "");
}

async function load() {
  populateSelects();
  const [settings, apiKey] = await Promise.all([store.getSettings(), store.getApiKey()]);
  const d = DEFAULTS.settings;
  el.apiKey.value = apiKey;
  setSelect(el.model, settings.model, d.model);
  el.senderName.value = settings.senderName;
  el.senderCompany.value = settings.senderCompany;
  el.senderOffer.value = settings.senderOffer;
  el.customInstructions.value = settings.customInstructions;
  setSelect(el.defaultIntent, settings.defaultIntent, d.defaultIntent);
  setSelect(el.defaultTone, settings.defaultTone, d.defaultTone);
  setSelect(el.defaultLength, settings.defaultLength, d.defaultLength);
  el.useAI.checked = settings.useAI;
}

async function save() {
  await store.setApiKey(el.apiKey.value.trim());
  await store.setSettings({
    model: el.model.value,
    senderName: el.senderName.value.trim(),
    senderCompany: el.senderCompany.value.trim(),
    senderOffer: el.senderOffer.value.trim(),
    customInstructions: el.customInstructions.value.trim(),
    defaultIntent: el.defaultIntent.value,
    defaultTone: el.defaultTone.value,
    defaultLength: el.defaultLength.value,
    useAI: el.useAI.checked,
  });
  setStatus(el.saveStatus, "Saved.", "ok");
  setTimeout(() => setStatus(el.saveStatus, ""), 2000);
}

function toggleKeyVisibility() {
  const showing = el.apiKey.type === "text";
  el.apiKey.type = showing ? "password" : "text";
  el.toggleKey.textContent = showing ? "Show" : "Hide";
}

async function testKey() {
  const key = el.apiKey.value.trim();
  if (!key) {
    setStatus(el.keyStatus, "Paste a key first.", "err");
    return;
  }
  el.testKey.disabled = true;
  setStatus(el.keyStatus, "Testing…");
  const resp = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "TEST_KEY", apiKey: key, model: el.model.value }, (r) => {
      if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
      else resolve(r || { ok: false, error: "No response." });
    });
  });
  el.testKey.disabled = false;
  if (resp.ok) setStatus(el.keyStatus, "Key works ✓", "ok");
  else setStatus(el.keyStatus, resp.error || "Test failed.", "err");
}

el.save.addEventListener("click", save);
el.toggleKey.addEventListener("click", toggleKeyVisibility);
el.testKey.addEventListener("click", testKey);
document.addEventListener("DOMContentLoaded", load);
