// options/options.js
const { DEFAULTS, store } = window.LMD;
const $ = (id) => document.getElementById(id);

const el = {
  apiKey: $("apiKey"),
  toggleKey: $("toggleKey"),
  testKey: $("testKey"),
  keyStatus: $("keyStatus"),
  openRouterKey: $("openRouterKey"),
  toggleOrKey: $("toggleOrKey"),
  testOrKey: $("testOrKey"),
  orKeyStatus: $("orKeyStatus"),
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

function populateModelSelect(select, models) {
  select.replaceChildren();
  const groups = {};
  for (const m of models) {
    const provider = m.provider || "anthropic";
    if (!groups[provider]) {
      groups[provider] = document.createElement("optgroup");
      groups[provider].label = provider.charAt(0).toUpperCase() + provider.slice(1);
    }
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label;
    groups[provider].appendChild(opt);
  }
  for (const key of Object.keys(groups)) {
    select.appendChild(groups[key]);
  }
}

function populateSelects() {
  populateModelSelect(el.model, DEFAULTS.models);
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
  const [settings, apiKey, openRouterKey] = await Promise.all([
    store.getSettings(),
    store.getApiKey(),
    store.getOpenRouterKey(),
  ]);
  const d = DEFAULTS.settings;
  el.apiKey.value = apiKey;
  el.openRouterKey.value = openRouterKey;
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
  await Promise.all([
    store.setApiKey(el.apiKey.value.trim()),
    store.setOpenRouterKey(el.openRouterKey.value.trim()),
  ]);
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

function toggleKeyVisibility(inputEl, btnEl) {
  const showing = inputEl.type === "text";
  inputEl.type = showing ? "password" : "text";
  btnEl.textContent = showing ? "Show" : "Hide";
}

async function testProviderKey(provider) {
  const isOR = provider === "openrouter";
  const keyInput = isOR ? el.openRouterKey : el.apiKey;
  const statusEl = isOR ? el.orKeyStatus : el.keyStatus;
  const btnEl = isOR ? el.testOrKey : el.testKey;

  const key = keyInput.value.trim();
  if (!key) {
    setStatus(statusEl, "Paste a key first.", "err");
    return;
  }
  btnEl.disabled = true;
  setStatus(statusEl, "Testing…");

  const selectedModel = el.model.value;
  const modelDef = DEFAULTS.models.find((m) => m.id === selectedModel);
  let modelToUse = selectedModel;

  if (!modelDef || modelDef.provider !== provider) {
    const fallback = DEFAULTS.models.find((m) => m.provider === provider);
    if (fallback) modelToUse = fallback.id;
  }

  const resp = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "TEST_KEY",
        provider,
        apiKey: key,
        model: modelToUse,
      },
      (r) => {
        if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
        else resolve(r || { ok: false, error: "No response." });
      }
    );
  });

  btnEl.disabled = false;
  if (resp.ok) setStatus(statusEl, "Key works ✓", "ok");
  else setStatus(statusEl, resp.error || "Test failed.", "err");
}

el.save.addEventListener("click", save);
el.toggleKey.addEventListener("click", () => toggleKeyVisibility(el.apiKey, el.toggleKey));
el.toggleOrKey.addEventListener("click", () => toggleKeyVisibility(el.openRouterKey, el.toggleOrKey));
el.testKey.addEventListener("click", () => testProviderKey("anthropic"));
el.testOrKey.addEventListener("click", () => testProviderKey("openrouter"));
document.addEventListener("DOMContentLoaded", load);
