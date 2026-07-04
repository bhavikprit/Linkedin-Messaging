// content/scraper.js
// Runs on https://www.linkedin.com/in/* and extracts profile details on demand.
// LinkedIn's DOM is obfuscated and changes often, so every selector has fallbacks
// and the popup always lets the user review/edit what we scraped before drafting.

(function () {
  if (window.__lmdScraperLoaded) return; // guard against double-injection
  window.__lmdScraperLoaded = true;

  /** Trim + collapse whitespace; return "" for falsy input. */
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  /**
   * LinkedIn renders most visible text twice: once visually and once inside a
   * `.visually-hidden` element for screen readers. The visible copy is marked
   * aria-hidden="true". Reading that copy avoids duplicated strings.
   */
  function visibleText(el) {
    if (!el) return "";
    const span = el.querySelector('span[aria-hidden="true"]');
    return clean(span ? span.textContent : el.textContent);
  }

  /** Find the <section> that contains an anchor like <div id="about">. */
  function sectionByAnchor(anchorId) {
    const anchor = document.getElementById(anchorId);
    if (anchor) return anchor.closest("section");

    // Fallback: search for section heading text (About, Experience, Education)
    const headings = document.querySelectorAll("main section h2, main section h3, section h2, section h3");
    const target = anchorId.toLowerCase();
    for (const h of headings) {
      const text = clean(h.textContent).toLowerCase();
      // Strip any visually hidden text
      const cleanText = text.replace(/visually-hidden.*/, "").trim();
      if (cleanText === target || cleanText.startsWith(target)) {
        return h.closest("section");
      }
    }
    return null;
  }

  function getName() {
    const h1 = document.querySelector("main h1") || document.querySelector("h1");
    if (h1) {
      const n = clean(h1.textContent);
      if (n) return n;
    }
    // Fallback: og:title is usually "First Last | LinkedIn"
    const og = document.querySelector('meta[property="og:title"]');
    if (og) return clean(og.content.split("|")[0].split(" - ")[0]);
    return clean((document.title || "").split("|")[0].split(" - ")[0]);
  }

  function getHeadline() {
    // 1) Direct selector for the standard class
    const standard = document.querySelector("main .text-body-medium.break-words");
    if (standard && clean(standard.textContent)) return clean(standard.textContent);

    // 2) Sibling of h1 or container child in pv-text-details__left-panel
    const leftPanel = document.querySelector(".pv-text-details__left-panel");
    if (leftPanel) {
      const children = Array.from(leftPanel.querySelectorAll("div, span, p"));
      for (const el of children) {
        const text = clean(el.textContent);
        if (text && el.querySelector('span[aria-hidden="true"]')) {
          const vt = clean(visibleText(el));
          if (vt && vt.length < 220 && !vt.includes(getName()) && !/follower|connection|location|·/i.test(vt)) return vt;
        } else if (text && text.length < 220 && !text.includes(getName()) && !/follower|connection|location|·/i.test(text)) {
          return text;
        }
      }
    }

    // 3) General candidates
    const candidates = document.querySelectorAll(
      "main .text-body-medium.break-words, main div.text-body-medium, main [class*='text-body-medium']"
    );
    for (const c of candidates) {
      const t = clean(c.textContent);
      if (t && t.length < 220 && !t.includes(getName())) return t;
    }
    const og = document.querySelector('meta[property="og:description"]');
    return og ? clean(og.content) : "";
  }

  function getLocation() {
    const el = document.querySelector(
      "main span.text-body-small.inline.t-black--light.break-words"
    );
    if (el) return clean(el.textContent);

    // Fallback 2: Check pv-text-details__left-panel sub-items
    const leftPanel = document.querySelector(".pv-text-details__left-panel");
    if (leftPanel) {
      const smalls = leftPanel.querySelectorAll(".text-body-small, span");
      for (const s of smalls) {
        const t = clean(s.textContent);
        if (t && !/follower|connection|·|contact info/i.test(t) && t.length < 80) {
          return t;
        }
      }
    }

    // Fallback 3: any small light-text span in the top card that isn't a count.
    const spans = document.querySelectorAll("main span.text-body-small");
    for (const s of spans) {
      const t = clean(s.textContent);
      if (t && !/follower|connection|·|contact info/i.test(t) && t.length < 80) {
        return t;
      }
    }
    return "";
  }

  function getAbout() {
    const section = sectionByAnchor("about");
    if (!section) return "";
    // Prefer the dedicated body element so the "About" heading never leaks in.
    const body = section.querySelector(
      ".inline-show-more-text, .pv-shared-text-with-see-more, .display-flex.ph5.pv3"
    );
    if (body) return clean(visibleText(body).replace(/[…\s]*see more$/i, ""));
    // Fallback: structurally drop the header/hidden nodes, then read what's left.
    const clone = section.cloneNode(true);
    clone.querySelectorAll("h2, .pvs-header__container, .visually-hidden").forEach((n) => n.remove());
    return clean(clone.textContent);
  }

  // True for strings that are date ranges, durations, or employment types — i.e.
  // metadata that should not be mistaken for a company name.
  function looksLikeDateOrType(text) {
    return /(\b\d{4}\b|present|·|\b(yr|yrs|mo|mos)\b|full-?time|part-?time|contract|internship|freelance|self-?employed|seasonal)/i.test(
      text
    );
  }

  /** Pull the first N experience entries: { title, company }. */
  function getExperience(limit = 3) {
    const section = sectionByAnchor("experience");
    if (!section) return [];
    let items = section.querySelectorAll("li.artdeco-list__item, li.pvs-list__paged-list-item");
    if (!items || items.length === 0) {
      items = section.querySelectorAll("li");
    }
    const out = [];
    for (const li of items) {
      let bold = li.querySelector(
        ".t-bold span[aria-hidden='true'], .mr1.t-bold span[aria-hidden='true'], .hoverable-link-text.t-bold span[aria-hidden='true']"
      );
      if (!bold) {
        bold = li.querySelector(".t-bold, [class*='t-bold']");
      }

      let normals = li.querySelectorAll(".t-14.t-normal span[aria-hidden='true']");
      if (!normals || normals.length === 0) {
        normals = li.querySelectorAll(".t-normal, [class*='t-normal'], .t-14.t-normal");
      }

      const title = clean(bold ? bold.textContent : "");

      let company = "";
      for (const n of normals) {
        const t = clean(n.textContent.split("·")[0]);
        if (t && !looksLikeDateOrType(t) && t !== title) {
          company = t;
          break;
        }
      }
      if (title || company) out.push({ title, company });
      if (out.length >= limit) break;
    }
    return out;
  }

  function getEducation(limit = 2) {
    const section = sectionByAnchor("education");
    if (!section) return [];
    let items = section.querySelectorAll("li.artdeco-list__item, li.pvs-list__paged-list-item");
    if (!items || items.length === 0) {
      items = section.querySelectorAll("li");
    }
    const out = [];
    for (const li of items) {
      let bold = li.querySelector(".t-bold span[aria-hidden='true'], .hoverable-link-text.t-bold span[aria-hidden='true']");
      if (!bold) {
        bold = li.querySelector(".t-bold, [class*='t-bold']");
      }
      const school = clean(bold ? bold.textContent : "");
      if (school) out.push(school);
      if (out.length >= limit) break;
    }
    return out;
  }

  function isLocation(text) {
    return /, [a-zA-Z\s.-]{2,20}(, [a-zA-Z\s.-]{2,20})?$/.test(text) || 
           /united states|united kingdom|canada|india|germany|france|australia|singapore|london|tokyo|paris|kirkland|seattle|new york/i.test(text);
  }

  function scrapeSDUITopCard() {
    const name = getName();
    if (!name) return null;

    let nameEl = null;
    const allTextEls = document.querySelectorAll("h1, h2, h3, p, span");
    for (const el of allTextEls) {
      if (clean(el.textContent) === name) {
        nameEl = el;
        break;
      }
    }
    if (!nameEl) return null;

    let parent = nameEl.parentElement;
    let topCardSection = null;
    for (let i = 0; i < 15; i++) {
      if (!parent) break;
      const pCount = parent.querySelectorAll("p").length;
      if (pCount >= 3) {
        topCardSection = parent;
        break;
      }
      parent = parent.parentElement;
    }
    if (!topCardSection) return null;

    const textElements = Array.from(topCardSection.querySelectorAll("p, span"))
      .map((el) => clean(el.textContent))
      .filter((t) => t.length > 0);

    const filtered = [];
    const seen = new Set();
    for (const t of textElements) {
      if (seen.has(t)) continue;
      seen.add(t);
      // Skip buttons, links, verification triggers or connection stats
      if (/contact info|connection|follower|· \d(st|nd|rd)|follow|message|more|connect|pending|withdraw|premium/i.test(t) || t === "·") {
        continue;
      }
      filtered.push(t);
    }

    const nameIndex = filtered.findIndex((t) => t.toLowerCase().includes(name.toLowerCase()));
    if (nameIndex === -1) return null;

    const remaining = filtered.slice(nameIndex + 1);
    let headline = "";
    let company = "";
    let location = "";

    if (remaining.length > 0) {
      headline = remaining[0];
    }

    for (let i = 1; i < remaining.length; i++) {
      const val = remaining[i];
      if (isLocation(val)) {
        location = val;
      } else if (!company && val.length < 100) {
        company = val;
      }
    }

    return { headline, company, location };
  }

  function scrapeProfile() {
    const fullName = getName();
    const parts = fullName.split(" ").filter(Boolean);

    let headline = getHeadline();
    let loc = getLocation();
    let experience = getExperience();
    let current = experience[0] || { title: "", company: "" };
    let company = current.company;
    let role = current.title;

    if (!headline || !loc || !company) {
      const sdui = scrapeSDUITopCard();
      if (sdui) {
        if (!headline) headline = sdui.headline;
        if (!loc) loc = sdui.location;
        if (!company) company = sdui.company;
        
        if (!role && headline) {
          if (headline.includes(" at ")) {
            role = headline.split(" at ")[0].trim();
            if (!company) company = headline.split(" at ")[1].trim();
          } else if (headline.includes(", ")) {
            role = headline.split(", ")[0].trim();
            if (!company) company = headline.split(", ")[1].trim();
          } else {
            role = headline;
          }
        }
      }
    }

    return {
      ok: true,
      url: location.href,
      fullName,
      firstName: parts[0] || "",
      lastName: parts.length > 1 ? parts[parts.length - 1] : "",
      headline: headline,
      location: loc,
      about: getAbout(),
      role: role,
      company: company,
      experience,
      education: getEducation(),
      scrapedAt: Date.now(),
    };
  }

  /** Insert drafted text into an open LinkedIn compose box, if one exists. */
  function insertDraft(text) {
    // 1) "Add a note" textarea inside the connect modal. LinkedIn's form is React-
    //    controlled, so we set the value through the native setter (to defeat React's
    //    value tracking) and fire both input and change events.
    const note = document.querySelector("#custom-message, textarea[name='message']");
    if (note) {
      note.focus();
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      setter.call(note, text);
      note.dispatchEvent(new Event("input", { bubbles: true }));
      note.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, where: "connection-note" };
    }
    // 2) Messaging compose box (Draft.js contenteditable). DOM surgery doesn't update
    //    Draft's internal model, so the Send button stays disabled. Route the text
    //    through execCommand('insertText'), which Draft processes as real input.
    const box = document.querySelector(
      ".msg-form__contenteditable[contenteditable='true'], div[role='textbox'][contenteditable='true']"
    );
    if (box) {
      box.focus();
      let inserted = false;
      try {
        document.execCommand("selectAll", false, null);
        inserted = document.execCommand("insertText", false, text);
      } catch (_) {
        inserted = false;
      }
      if (inserted) return { ok: true, where: "message-box" };
      // Fallback for editors where execCommand is unavailable: DOM write + InputEvent.
      box.replaceChildren();
      const p = document.createElement("p");
      p.textContent = text;
      box.appendChild(p);
      box.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      return {
        ok: true,
        where: "message-box",
        warning: "Inserted, but if the Send button stays greyed out, type a space and delete it to wake it up.",
      };
    }
    return { ok: false, error: "No open message box found. Open the message or 'Add a note' dialog first." };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    try {
      if (msg && msg.type === "SCRAPE_PROFILE") {
        sendResponse(scrapeProfile());
        return true;
      }
      if (msg && msg.type === "INSERT_DRAFT") {
        sendResponse(insertDraft(msg.text || ""));
        return true;
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e && e.message ? e.message : e) });
      return true;
    }
  });
})();
