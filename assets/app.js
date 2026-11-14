/* GiftQuest: page rendering, events and browser-local state. Business rules live in engine.js. */
(function () {
  "use strict";
  const E = window.GiftEngine,
    $ = window.jQuery;
  const KEY = "giftquest.game.v1",
    LANG_KEY = "giftquest.language";
  const INTERESTS = [
    "reading",
    "art",
    "coffee",
    "gaming",
    "sport",
    "nature",
    "music",
    "cooking",
    "travel",
    "cozy",
  ];
  const STYLES = ["useful", "cozy", "creative", "experience", "handmade"];
  const CATEGORIES = [
    "books",
    "stationery",
    "food",
    "games",
    "decor",
    "accessories",
    "tech",
    "experience",
  ];
  const page = document.body.dataset.page;
  const pageKey = page === "index" ? "home" : page;
  const blank = () => ({
    version: 1,
    game: null,
    participants: [],
    assignments: null,
    activeId: "",
    saved: {},
    selected: {},
    tasks: {},
  });
  let state = blank(),
    language = "ru",
    translations,
    gifts = [],
    toastTimer,
    storageFailed = false,
    corrupt = false;
  let revealed = false,
    recOffset = 0,
    catalogFilters = { q: "", category: "", budget: "", sort: "default" };
  const $main = $("#main");
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const t = (key) => translations?.[language]?.[key] ?? key;
  const localized = (object) => object[language] || object.ru;
  const money = (n) =>
    new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US").format(n) +
    " ₸";
  const dateText = (value) =>
    new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-GB", {
      day: "numeric",
      month: "long",
    }).format(new Date(value + "T12:00:00"));
  const person = () =>
    state.participants.find((p) => p.id === state.activeId) ||
    state.participants[0];
  const recipient = () =>
    state.participants.find((p) => p.id === state.assignments?.[person()?.id]);
  const currentSaved = () => state.saved[person()?.id] || [];
  const currentChosen = () => state.selected[person()?.id] || "";
  const uid = () => "p-" + crypto.randomUUID();
  const icons = {
    gift: '<path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    heart:
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    people:
      '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/>',
    envelope:
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18"/>',
  };
  const icon = (name) =>
    /* HTML */ `<svg
      class="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      ${icons[name] || icons.gift}
    </svg>`;
  const art = (name, cls = "") =>
    /* HTML */ `<svg
      class="gift-art ${cls}"
      viewBox="0 0 200 160"
      aria-hidden="true"
    >
      <use href="assets/illustrations.svg#${name}"></use>
    </svg>`;
  function notify(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 4500);
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageFailed = false;
      return true;
    } catch {
      storageFailed = true;
      notify(t("storageError"));
      return false;
    }
  }
  // Treat imported/local data as untrusted. Only accept the known state shape and identifiers.
  function validateState(raw) {
    if (
      !raw ||
      raw.version !== 1 ||
      !Array.isArray(raw.participants) ||
      raw.participants.length > 12
    )
      throw Error("state");
    if (!raw.game) return blank();
    const g = raw.game;
    const validDate = (d) =>
      typeof d === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(d) &&
      !isNaN(Date.parse(d)) &&
      new Date(d).toISOString().slice(0, 10) === d;
    if (
      typeof g.title !== "string" ||
      g.title.trim().length < 2 ||
      g.title.length > 60 ||
      !Number.isFinite(g.budget) ||
      g.budget < 100 ||
      g.budget > 1000000 ||
      !validDate(g.date) ||
      !validDate(g.deadline) ||
      g.deadline > g.date
    )
      throw Error("game");
    const clean = blank();
    clean.game = {
      title: g.title,
      budget: g.budget,
      date: g.date,
      deadline: g.deadline,
    };
    for (const p of raw.participants) {
      if (
        !p ||
        typeof p.id !== "string" ||
        !/^p-[a-zA-Z0-9-]{1,50}$/.test(p.id) ||
        typeof p.name !== "string" ||
        p.name.trim().length < 2 ||
        p.name.length > 30
      )
        throw Error("person");
      const pick = (v, options) =>
        Array.isArray(v)
          ? [...new Set(v.filter((x) => options.includes(x)))]
          : [];
      clean.participants.push({
        id: p.id,
        name: p.name,
        interests: pick(p.interests, INTERESTS).slice(0, 5),
        styles: pick(p.styles, STYLES),
        avoid: pick(p.avoid, CATEGORIES),
        wishes: typeof p.wishes === "string" ? p.wishes.slice(0, 350) : "",
        note: typeof p.note === "string" ? p.note.slice(0, 350) : "",
      });
    }
    const ids = clean.participants.map((p) => p.id);
    if (
      new Set(ids).size !== ids.length ||
      new Set(clean.participants.map((p) => p.name.toLocaleLowerCase()))
        .size !== ids.length
    )
      throw Error("duplicates");
    if (
      raw.assignments &&
      (ids.length < 3 || !E.validDraw(ids, raw.assignments))
    )
      throw Error("draw");
    clean.assignments = raw.assignments
      ? Object.fromEntries(ids.map((id) => [id, raw.assignments[id]]))
      : null;
    clean.activeId = ids.includes(raw.activeId) ? raw.activeId : ids[0] || "";
    for (const id of ids) {
      clean.saved[id] = Array.isArray(raw.saved?.[id])
        ? [
            ...new Set(
              raw.saved[id].filter((g) => gifts.some((x) => x.id === g)),
            ),
          ]
        : [];
      clean.selected[id] = clean.saved[id].includes(raw.selected?.[id])
        ? raw.selected[id]
        : "";
      clean.tasks[id] = Object.fromEntries(
        ["bought", "wrapped", "delivered"].map((k) => [
          k,
          !!clean.selected[id] && raw.tasks?.[id]?.[k] === true,
        ]),
      );
    }
    return clean;
  }
  function loadState() {
    try {
      language = localStorage.getItem(LANG_KEY) === "en" ? "en" : "ru";
      const raw = localStorage.getItem(KEY);
      if (raw) state = validateState(JSON.parse(raw));
    } catch {
      corrupt = true;
    }
  }
  function shell() {
    document.documentElement.lang = language;
    document.title = t(pageKey) + " — GiftQuest";
    $(".skip-link").text(t("skip"));
    $("#header").html(
      /* HTML */ `<div class="container header-inner">
        <a class="brand" href="index.html"
          >${icon("gift")}<span
            >Gift<span class="brand-italic">Quest</span
            ><small
              >${language === "ru" ? "КЛУБ ТАЙНОГО САНТЫ" : "SECRET SANTA CLUB"}</small
            ></span
          ></a
        ><button
          class="menu-toggle"
          aria-expanded="false"
          aria-controls="main-nav"
        >
          ${t("menu")} ☰
        </button>
        <nav id="main-nav" aria-label="${t("menu")}">
          ${[
            ["index", "home"],
            ["game", "game"],
            ["recipient", "recipient"],
            ["catalog", "catalog"],
            ["preparation", "preparation"],
          ]
            .map(
              ([url, key]) =>
                /* HTML */ `<a
                  href="${url}.html"
                  ${page === url ? 'aria-current="page"' : ""}
                  >${t(key)}</a
                >`,
            )
            .join("")}
        </nav>
        <div class="language" aria-label="${t("lang")}">
          ${["ru", "en"].map((l) => /* HTML */ `<button data-lang="${l}" lang="${l}" aria-pressed="${language === l}">${l.toUpperCase()}</button>`).join("")}
        </div>
      </div>`,
    );
    $("#footer").html(
      /* HTML */ `<div class="container footer-main">
          <a class="brand" href="index.html"
            >${icon("gift")}<span
              >Gift<span class="brand-italic">Quest</span></span
            ></a
          >
          <p>${t("tagline")}</p>
          <span class="demo-pill">${t("demoBadge")}</span>
        </div>
        <div class="container footer-bottom">
          <span>${t("footerNote")}</span><span>${t("demoNote")}</span>
        </div>`,
    );
  }
  function heading(eyebrow, title, description) {
    return /* HTML */ `<div class="page-heading">
      <span class="eyebrow">${t(eyebrow)}</span>
      <h1>${t(title)}</h1>
      <p>${t(description)}</p>
    </div>`;
  }
  function empty(title, text, href = "game.html", label = "createGame") {
    return /* HTML */ `<div class="empty-state">
      ${icon("gift")}
      <h2>${t(title)}</h2>
      <p>${t(text)}</p>
      <a href="${href}" class="btn-gq primary">${t(label)} ${icon("arrow")}</a>
    </div>`;
  }
  function noGame() {
    $main.html(
      /* HTML */ `<div class="container page-wrap">
        ${empty("noGame", "noGameText")}
        <div class="text-center">
          <button class="text-button" data-demo>${t("tryDemo")}</button>
        </div>
      </div>`,
    );
  }
  function roleSelector() {
    return /* HTML */ `<div class="role-bar">
      <label for="active-person">${t("viewAs")}</label
      ><select id="active-person">
        ${state.participants.map((p) => /* HTML */ `<option value="${p.id}" ${p.id === person()?.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select
      ><span>${t("roleNote")}</span>
    </div>`;
  }
  function home() {
    $main.html(
      /* HTML */ `<section class="hero container">
          <div class="row align-items-center g-4">
            <div class="col-lg-6 hero-copy">
              <span class="eyebrow">${t("heroEyebrow")}</span>
              <h1>${t("heroTitle")}<br /><em>${t("heroItalic")}</em></h1>
              <p>${t("heroText")}</p>
              <div class="hero-actions">
                <a href="game.html" class="btn-gq primary"
                  >${t(state.game ? "continueGame" : "createGame")}
                  ${icon("arrow")}</a
                ><button class="btn-gq quiet" data-demo>${t("tryDemo")}</button>
              </div>
              <div class="hero-note">
                <span class="tiny-avatars"><i>A</i><i>M</i><i>Д</i></span
                >${t("noAccount")}
              </div>
            </div>
            <div class="col-lg-6">
              <div class="hero-scene">
                <span class="scene-corner top">✧</span
                ><img
                  src="assets/hero.svg"
                  width="660"
                  height="560"
                  alt="${language === "ru" ? "Подарки, открытка и веточка ели" : "Wrapped presents, a card and a fir branch"}"
                /><span class="scene-note">${t("heroSticker")} ♡</span
                ><span class="scene-stamp">${t("heroStamp")}<br />✧</span>
              </div>
            </div>
          </div>
        </section>
        <div class="ribbon-strip">
          <span>✧</span
          >${t("rule1")}<span>✧</span>${t("rule2")}<span>✧</span>${t("rule3")}<span
            >✧</span
          >
        </div>
        <section class="container section-pad">
          <div class="section-heading">
            <div>
              <span class="eyebrow">${t("howEyebrow")}</span>
              <h2>${t("howTitle")}</h2>
            </div>
            <span class="handwritten">${t("heroSticker")} ♡</span>
          </div>
          <div class="row g-4 steps">
            ${[1, 2, 3]
              .map(
                (n) =>
                  /* HTML */ `<div class="col-md-4">
                    <article class="step-card">
                      <div class="step-number">0${n}</div>
                      ${icon(["people", "envelope", "gift"][n - 1])}
                      <h3>${t("step" + n + "Title")}</h3>
                      <p>${t("step" + n + "Text")}</p>
                    </article>
                  </div>`,
              )
              .join("")}
          </div>
        </section>
        <section class="container section-pad pt-0">
          <div class="section-heading">
            <div>
              <span class="eyebrow">${t("curatedEyebrow")}</span>
              <h2>${t("curatedTitle")}</h2>
            </div>
            <a href="catalog.html" class="text-link"
              >${t("allIdeas")} ${icon("arrow")}</a
            >
          </div>
          <div class="row g-4">
            ${[gifts[0], gifts[6], gifts[17], gifts[34]].map((g) => /* HTML */ `<div class="col-6 col-lg-3">${giftCard(g)}</div>`).join("")}
          </div>
          <p class="fineprint mt-3">${t("priceNote")}</p>
        </section>
        <section class="container">
          <div class="quote-panel">
            <span>✧</span>
            <p>${t("quote")}</p>
            <span>✧</span>
          </div>
        </section>
        <section class="container section-pad faq-section">
          <div class="row g-5">
            <div class="col-lg-5">
              <span class="eyebrow">${t("heroStamp")}</span>
              <h2>${t("faqTitle")}</h2>
            </div>
            <div class="col-lg-7">
              ${[1, 2, 3]
                .map(
                  (n) =>
                    /* HTML */ `<div class="faq-item">
                      <button
                        class="faq-toggle"
                        aria-expanded="false"
                        aria-controls="faq-${n}"
                      >
                        ${t("faq" + n)}<span>+</span>
                      </button>
                      <div id="faq-${n}" class="faq-answer" hidden>
                        ${t("faq" + n + "a")}
                      </div>
                    </div>`,
                )
                .join("")}
            </div>
          </div>
        </section>`,
    );
  }
  function giftCard(g) {
    const saved = currentSaved().includes(g.id);
    return /* HTML */ `<article class="gift-card">
      <div class="gift-picture tone-${g.category}">
        <button
          class="art-button"
          data-detail="${g.id}"
          aria-label="${t("details")}: ${esc(localized(g.title))}"
        >
          ${art(g.art)}</button
        ><button
          class="heart-button ${saved ? "is-saved" : ""}"
          data-save="${g.id}"
          aria-label="${t(saved ? "unfavorite" : "favorite")}: ${esc(localized(g.title))}"
          aria-pressed="${saved}"
        >
          ${icon("heart")}
        </button>
      </div>
      <div class="gift-content">
        <span class="gift-category">${t(g.category)}</span>
        <h3>
          <button data-detail="${g.id}">${esc(localized(g.title))}</button>
        </h3>
        <div class="gift-bottom">
          <span>${money(g.price)}</span
          ><button
            data-detail="${g.id}"
            class="round-arrow"
            aria-label="${t("details")}: ${esc(localized(g.title))}"
          >
            ${icon("arrow")}
          </button>
        </div>
      </div>
    </article>`;
  }
  function gameForm(edit = false) {
    const g = edit
      ? state.game
      : {
          title: "",
          budget: 7000,
          date: E.dateAfter(14),
          deadline: E.dateAfter(7),
        };
    return /* HTML */ `<form id="game-form" novalidate data-edit="${edit}">
      <div class="field-group">
        <label for="game-title">${t("gameTitleLabel")}</label
        ><input
          id="game-title"
          name="title"
          maxlength="60"
          value="${esc(g.title)}"
          placeholder="${t("gamePlaceholder")}"
          required
          aria-describedby="error-title"
        />
        <p class="field-error" id="error-title"></p>
      </div>
      <div class="field-group">
        <label for="game-budget">${t("budget")} <span>₸</span></label
        ><input
          id="game-budget"
          name="budget"
          type="number"
          min="100"
          max="1000000"
          value="${g.budget}"
          required
          aria-describedby="error-budget"
        />
        <p class="field-error" id="error-budget"></p>
      </div>
      <div class="row g-3">
        <div class="col-md-6 field-group">
          <label for="exchange-date">${t("exchangeDate")}</label
          ><input
            id="exchange-date"
            name="date"
            type="date"
            min="${E.localDate()}"
            value="${g.date}"
            required
            aria-describedby="error-date"
          />
          <p class="field-error" id="error-date"></p>
        </div>
        <div class="col-md-6 field-group">
          <label for="profile-deadline">${t("deadline")}</label
          ><input
            id="profile-deadline"
            name="deadline"
            type="date"
            min="${E.localDate()}"
            value="${g.deadline}"
            required
            aria-describedby="error-deadline"
          />
          <p class="field-error" id="error-deadline"></p>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-gq primary">
          ${t(edit ? "save" : "create")} ${icon("arrow")}</button
        >${edit ? /* HTML */ `<button type="button" class="btn-gq quiet" data-close>${t("cancel")}</button>` : ""}
      </div>
    </form>`;
  }
  function gamePage() {
    if (!state.game) {
      $main.html(
        /* HTML */ `<section class="container page-wrap">
          ${heading("newGameEyebrow", "newGameTitle", "newGameText")}
          <div class="row g-5">
            <div class="col-lg-7">
              <div class="paper-panel">${gameForm()}</div>
            </div>
            <aside class="col-lg-5">
              <div class="aside-card">
                ${art("gift")}
                <h2>${t("gameAsideTitle")}</h2>
                <p>${t("gameAsideText")}</p>
                <ul class="rule-list">
                  ${["rule1", "rule2", "rule3"].map((key) => /* HTML */ `<li>${icon("check")}${t(key)}</li>`).join("")}
                </ul>
              </div>
            </aside>
          </div>
        </section>`,
      );
      return;
    }
    const ready = state.participants.filter(E.ready).length;
    const canDraw =
      state.participants.length >= 3 &&
      ready === state.participants.length &&
      !state.assignments;
    const g = state.game;
    $main.html(
      /* HTML */ `<section class="container page-wrap">
        <div class="page-heading heading-with-action">
          <div>
            <span class="eyebrow">${t("myCircle")}</span>
            <h1>${esc(g.title)}</h1>
            <span class="status-pill ${state.assignments ? "complete" : ""}"
              >${icon(state.assignments ? "check" : "people")}${t(state.assignments ? "drawn" : "collecting")}</span
            >
          </div>
          <button class="btn-gq secondary" data-invite>
            ${icon("copy")}${t("copyInvite")}
          </button>
        </div>
        <div class="game-meta">
          <div>
            ${icon("gift")}<span
              >${t("budget")}<strong>${money(g.budget)}</strong></span
            >
          </div>
          <div>
            ${icon("calendar")}<span
              >${t("exchangeDate")}<strong>${dateText(g.date)}</strong></span
            >
          </div>
          <div>
            ${icon("envelope")}<span
              >${t("deadline")}<strong>${dateText(g.deadline)}</strong></span
            >
          </div>
          <button
            class="text-button"
            data-edit-game
            ${state.assignments ? "disabled" : ""}
          >
            ${t("editRules")}
          </button>
        </div>
        <div class="row g-4">
          <div class="col-lg-8">
            <div class="section-heading compact">
              <h2>
                ${t("participants")}
                <span class="count">${state.participants.length}</span>
              </h2>
              <span class="subtle"
                >${ready}/${state.participants.length}
                ${t("readyCount").toLowerCase()}</span
              >
            </div>
            ${
              state.participants.length
                ? /* HTML */ `<div class="participant-grid">
                    ${state.participants
                      .map(
                        (p, i) =>
                          /* HTML */ `<article class="participant-card">
                            <div class="avatar avatar-${i % 4}">
                              ${esc(p.name.slice(0, 1).toUpperCase())}
                            </div>
                            <div class="participant-info">
                              <h3>${esc(p.name)}</h3>
                              <span
                                class="person-status ${E.ready(p) ? "ready" : ""}"
                                >${E.ready(p) ? "✓ " : ""}${t(E.ready(p) ? "profileReady" : "profileMissing")}</span
                              ><a
                                class="text-link"
                                href="profile.html?person=${p.id}"
                                >${t(E.ready(p) ? "editProfile" : "fillProfile")}
                                ${icon("arrow")}</a
                              >
                            </div>
                            ${!state.assignments ? /* HTML */ `<button class="icon-button remove-person" data-remove-person="${p.id}" aria-label="${t("remove")}: ${esc(p.name)}">${icon("close")}</button>` : ""}
                          </article>`,
                      )
                      .join("")}
                  </div>`
                : /* HTML */ `<div class="small-empty">
                    <h3>${t("emptyPeople")}</h3>
                    <p>${t("emptyPeopleText")}</p>
                  </div>`
            }${
              !state.assignments
                ? /* HTML */ `<form
                    id="add-person-form"
                    class="add-person-form"
                    novalidate
                  >
                    <label for="person-name">${t("addPerson")}</label>
                    <div class="inline-form">
                      <input
                        id="person-name"
                        name="name"
                        maxlength="30"
                        placeholder="${t("personPlaceholder")}"
                        aria-describedby="person-error"
                      /><button
                        class="btn-gq secondary"
                        type="submit"
                        ${state.participants.length >= 12 ? "disabled" : ""}
                      >
                        + ${t("add")}
                      </button>
                    </div>
                    <p class="field-error" id="person-error"></p>
                    <p class="fineprint">${t("peopleLimit")}</p>
                  </form>`
                : /* HTML */ `<p class="notice mt-4">${t("locked")}</p>`
            }
          </div>
          <aside class="col-lg-4">
            <div class="draw-card">
              ${icon("envelope")}
              <h2>${t("drawTitle")}</h2>
              <p>${t("drawText")}</p>
              <div class="readiness">
                <div
                  style="width:${state.participants.length ? (ready / state.participants.length) * 100 : 0}%"
                ></div>
              </div>
              <p class="fineprint">
                ${ready} / ${state.participants.length} · ${t("readyCount")}
              </p>
              ${state.assignments ? /* HTML */ `<a href="recipient.html" class="btn-gq primary w-100">${t("openRecipient")} ${icon("arrow")}</a>` : /* HTML */ `<button class="btn-gq primary w-100" data-draw ${canDraw ? "" : "disabled"}>${t("drawButton")} ${icon("star")}</button>${!canDraw ? /* HTML */ `<p class="fineprint mt-3">${t("drawNeed")}</p>` : ""}`}
            </div>
            <div class="backup-panel">
              <button class="text-button" data-backup>${t("backup")} ↓</button
              ><label class="text-button restore-label"
                >${t("restore")}<input
                  id="restore-file"
                  type="file"
                  accept="application/json,.json"
                  class="visually-hidden"
              /></label>
              <p class="fineprint">${t("backupNote")}</p>
              <button class="text-button danger" data-reset>
                ${t("newRound")}
              </button>
            </div>
          </aside>
        </div>
      </section>`,
    );
  }
  function chipOptions(keys, field, checked) {
    return /* HTML */ `<div class="choice-chips">
      ${keys.map((key) => /* HTML */ `<label class="choice-chip"><input type="checkbox" name="${field}" value="${key}" ${checked.includes(key) ? "checked" : ""} /><span>${t(key)}</span></label>`).join("")}
    </div>`;
  }
  function profilePage() {
    if (!state.game) return noGame();
    if (!person()) {
      $main.html(
        /* HTML */ `<div class="container page-wrap">
          ${empty("noPerson", "emptyPeopleText", "game.html", "addPerson")}
        </div>`,
      );
      return;
    }
    const p = person();
    $main.html(
      /* HTML */ `<section class="container page-wrap">
        ${heading("profileEyebrow", "profileTitle", "profileText")}${roleSelector()}
        <div class="row g-5">
          <div class="col-lg-8">
            <form id="profile-form" class="paper-panel" novalidate>
              <div class="profile-name">
                <div class="avatar avatar-0">${esc(p.name[0])}</div>
                <h2>${esc(p.name)}</h2>
              </div>
              <fieldset class="field-group">
                <legend>${t("interests")}</legend>
                <p class="field-hint">${t("interestsHint")}</p>
                ${chipOptions(INTERESTS, "interests", p.interests)}
                <p class="field-error" id="interests-error" role="alert"></p>
              </fieldset>
              <fieldset class="field-group">
                <legend>${t("styles")}</legend>
                <p class="field-hint">${t("stylesHint")}</p>
                ${chipOptions(STYLES, "styles", p.styles)}
                <p class="field-error" id="styles-error" role="alert"></p>
              </fieldset>
              <fieldset class="field-group">
                <legend>${t("avoid")}</legend>
                <p class="field-hint">${t("avoidHint")}</p>
                ${chipOptions(CATEGORIES, "avoid", p.avoid)}
              </fieldset>
              <div class="field-group">
                <label for="wishes"
                  >${t("wishes")} <small>${t("optional")}</small></label
                ><textarea
                  id="wishes"
                  name="wishes"
                  maxlength="350"
                  rows="3"
                  placeholder="${t("wishesPlaceholder")}"
                >
${esc(p.wishes)}</textarea>
              </div>
              <div class="field-group">
                <label for="note"
                  >${t("note")} <small>${t("optional")}</small></label
                ><textarea
                  id="note"
                  name="note"
                  maxlength="350"
                  rows="3"
                  placeholder="${t("notePlaceholder")}"
                >
${esc(p.note)}</textarea>
              </div>
              <div class="form-actions">
                <button class="btn-gq primary" type="submit">
                  ${t("saveProfile")} ${icon("check")}</button
                ><a href="game.html" class="text-link">${t("backGame")}</a>
              </div>
            </form>
          </div>
          <aside class="col-lg-4">
            <div class="profile-aside">
              ${art("notebook")}
              <h2>${t("profileAside")}</h2>
              <p>${t("profileAsideText")}</p>
              <span class="handwritten">♡</span>
            </div>
          </aside>
        </div>
      </section>`,
    );
  }
  function recipientPage() {
    if (!state.game) return noGame();
    if (!state.assignments) {
      $main.html(
        /* HTML */ `<div class="container page-wrap">
          ${empty("notDrawn", "notDrawnText", "game.html", "backGame")}
        </div>`,
      );
      return;
    }
    const p = recipient();
    let content;
    if (!revealed)
      content = /* HTML */ `<div class="reveal-stage">
        <div class="envelope-art">
          <div class="envelope-flap"></div>
          <div class="envelope-seal">${icon("gift")}</div>
          <span class="envelope-inscription">${t("yourSanta")}</span>
        </div>
        <h2>${t("sealed")}</h2>
        <button class="btn-gq primary" data-reveal>
          ${t("reveal")} ${icon("arrow")}
        </button>
        <p class="fineprint mt-3">${t("demoNote")}</p>
      </div>`;
    else
      content = /* HTML */ `<div class="recipient-panel">
          <div class="recipient-identity">
            <span class="eyebrow">${t("youGive")}</span>
            <h2>${esc(p.name)}</h2>
            <div class="tag-list">
              ${p.interests.map((k) => /* HTML */ `<span>${t(k)}</span>`).join("")}
            </div>
            <p>${t("budget")}: <strong>${money(state.game.budget)}</strong></p>
            <button class="text-button" data-hide>${t("hideRecipient")}</button>
          </div>
          <div class="recipient-wishes">
            <div>
              ${icon("envelope")}
              <h3>${t("theirWishes")}</h3>
              <p class="user-text">${esc(p.wishes) || t("noWishes")}</p>
            </div>
            ${
              p.note
                ? /* HTML */ `<div>
                    <h3>${t("theirNote")}</h3>
                    <p class="user-text">${esc(p.note)}</p>
                  </div>`
                : ""
            }${p.avoid.length ? /* HTML */ `<p class="avoid-note">${t("avoid")}: ${p.avoid.map((k) => t(k)).join(", ")}</p>` : ""}
          </div>
        </div>
        <div class="section-heading mt-5">
          <div>
            <h2>${t("pickedFor")}</h2>
            <p>${t("recommendText")}</p>
          </div>
          <button class="btn-gq secondary" data-more>${t("another")} ↻</button>
        </div>
        <div id="recommendations"></div>
        <p class="fineprint mt-3">${t("priceNote")}</p>`;
    $main.html(
      /* HTML */ `<section class="container page-wrap">
        ${heading("recipientEyebrow", "recipientTitle", "recipientText")}${roleSelector()}${content}
      </section>`,
    );
    if (revealed) renderRecommendations();
  }
  function reasons(item) {
    const out = item.interests.map(
      (k) => `${t("interestReason")}: ${t(k).toLowerCase()}`,
    );
    if (item.styles.length)
      out.push(
        `${t("styleReason")}: ${item.styles.map((k) => t(k).toLowerCase()).join(", ")}`,
      );
    out.push(t("budgetReason"));
    return out;
  }
  function renderRecommendations() {
    const items = E.recommend(gifts, recipient(), state.game.budget);
    if (recOffset >= items.length) recOffset = 0;
    const chosen = items.slice(recOffset, recOffset + 3);
    $("[data-more]").prop("disabled", items.length <= 3);
    $("#recommendations").html(
      chosen.length
        ? /* HTML */ `<div class="row g-4">
            ${chosen
              .map(
                (item) =>
                  /* HTML */ `<div class="col-md-4">
                    ${giftCard(item.gift)}
                    <div class="reason-card">
                      <h3>${icon("star")}${t("why")}</h3>
                      <ul>
                        ${reasons(item)
                          .map(
                            (r) => /* HTML */ `<li>${icon("check")}${r}</li>`,
                          )
                          .join("")}
                      </ul>
                    </div>
                  </div>`,
              )
              .join("")}
          </div>`
        : /* HTML */ `<div class="small-empty">
            <h3>${t("noMatches")}</h3>
            <p>${t("noMatchesText")}</p>
          </div>`,
    );
  }
  function catalogPage() {
    $main.html(
      /* HTML */ `<section class="container page-wrap">
        ${heading("catalogEyebrow", "catalogTitle", "catalogText")}
        <div class="catalog-toolbar">
          <label class="search-field"
            ><span class="visually-hidden">${t("search")}</span
            >${icon("search")}<input
              id="gift-search"
              type="search"
              placeholder="${t("searchPlaceholder")}"
              value="${esc(catalogFilters.q)}" /></label
          ><label
            >${t("upTo")}<input
              id="filter-budget"
              type="number"
              min="0"
              max="1000000"
              placeholder="∞"
              value="${esc(catalogFilters.budget)}" /></label
          ><label
            >${t("sort")}<select id="gift-sort">
              ${[
                ["default", "sortDefault"],
                ["priceAsc", "priceAsc"],
                ["priceDesc", "priceDesc"],
                ["nameAsc", "nameAsc"],
              ]
                .map(
                  ([v, k]) =>
                    /* HTML */ `<option
                      value="${v}"
                      ${catalogFilters.sort === v ? "selected" : ""}
                    >
                      ${t(k)}
                    </option>`,
                )
                .join("")}
            </select></label
          >
        </div>
        <div class="category-tabs" aria-label="${t("category")}">
          ${["", ...CATEGORIES].map((k) => /* HTML */ `<button data-category="${k}" aria-pressed="${catalogFilters.category === k}" class="${catalogFilters.category === k ? "active" : ""}">${t(k || "allCategories")}</button>`).join("")}
        </div>
        <div class="catalog-meta">
          <p id="result-count" role="status"></p>
          <button class="text-button" data-reset-filters>
            ${t("resetFilters")}
          </button>
        </div>
        <div id="catalog-grid"></div>
        <p class="fineprint mt-4">${t("priceNote")}</p>
      </section>`,
    );
    renderCatalog();
  }
  function renderCatalog() {
    const q = catalogFilters.q.trim().toLocaleLowerCase();
    let list = gifts.filter(
      (g) =>
        (!catalogFilters.category || g.category === catalogFilters.category) &&
        (catalogFilters.budget === "" ||
          g.price <= Number(catalogFilters.budget)) &&
        `${localized(g.title)} ${localized(g.description)} ${g.tags.map((k) => t(k)).join(" ")}`
          .toLocaleLowerCase()
          .includes(q),
    );
    if (catalogFilters.sort === "priceAsc")
      list.sort((a, b) => a.price - b.price);
    if (catalogFilters.sort === "priceDesc")
      list.sort((a, b) => b.price - a.price);
    if (catalogFilters.sort === "nameAsc")
      list.sort((a, b) =>
        localized(a.title).localeCompare(localized(b.title), language),
      );
    $("#result-count").text(t("found") + ": " + list.length);
    $("#catalog-grid").html(
      list.length
        ? /* HTML */ `<div class="row g-4">
            ${list.map((g) => /* HTML */ `<div class="col-6 col-md-4 col-xl-3">${giftCard(g)}</div>`).join("")}
          </div>`
        : /* HTML */ `<div class="small-empty">
            <h2>${t("emptySearch")}</h2>
            <p>${t("emptySearchText")}</p>
          </div>`,
    );
  }
  function preparationPage() {
    if (!state.game) return noGame();
    if (!person()) {
      $main.html(
        /* HTML */ `<div class="container page-wrap">
          ${empty("noPerson", "emptyPeopleText", "game.html", "addPerson")}
        </div>`,
      );
      return;
    }
    const saved = gifts.filter((g) => currentSaved().includes(g.id));
    const chosen = gifts.find((g) => g.id === currentChosen()),
      tasks = state.tasks[person().id] || {};
    const count =
      (chosen ? 1 : 0) +
      ["bought", "wrapped", "delivered"].filter((k) => tasks[k]).length;
    $main.html(
      /* HTML */ `<section class="container page-wrap">
        ${heading("preparationEyebrow", "preparationTitle", "preparationText")}${roleSelector()}
        <div class="row g-4">
          <div class="col-lg-8">
            <div class="section-heading compact">
              <h2>${t("savedIdeas")}</h2>
              <span class="count">${saved.length}</span>
            </div>
            ${
              saved.length
                ? /* HTML */ `<div class="saved-grid">
                    ${saved
                      .map(
                        (g) =>
                          /* HTML */ `<article class="saved-card">
                            <button
                              class="saved-art tone-${g.category}"
                              data-detail="${g.id}"
                              aria-label="${t("details")}: ${esc(localized(g.title))}"
                            >
                              ${art(g.art)}
                            </button>
                            <div>
                              <span class="gift-category"
                                >${t(g.category)}</span
                              >
                              <h3>${esc(localized(g.title))}</h3>
                              <p>${money(g.price)}</p>
                              <button
                                class="${chosen?.id === g.id ? "chosen-label" : "text-link"}"
                                data-choose="${g.id}"
                                ${chosen?.id === g.id ? "disabled" : ""}
                              >
                                ${chosen?.id === g.id ? icon("check") + t("chosen") : t("chooseGift") + icon("arrow")}
                              </button>
                            </div>
                            <button
                              class="icon-button"
                              data-save="${g.id}"
                              aria-label="${t("unfavorite")}: ${esc(localized(g.title))}"
                            >
                              ${icon("close")}
                            </button>
                          </article>`,
                      )
                      .join("")}
                  </div>`
                : empty("noSaved", "noSavedText", "catalog.html", "viewCatalog")
            }
          </div>
          <aside class="col-lg-4">
            <div class="checklist-panel">
              <span class="eyebrow">${t("checklist")}</span
              >${chosen ? /* HTML */ `<h2>${esc(localized(chosen.title))}</h2>` : /* HTML */ `<h2>${t("noChosen")}</h2>`}
              <div class="progress-ring" style="--progress:${count * 25}%">
                <span>${count}<small>/ 4</small></span>
              </div>
              <p class="text-center subtle">${t("progress")}</p>
              <div class="checklist">
                <div class="check-row fixed">
                  <span class="check-box ${chosen ? "checked" : ""}"
                    >${chosen ? icon("check") : ""}</span
                  >${t("taskChosen")}
                </div>
                ${[
                  ["bought", "taskBought"],
                  ["wrapped", "taskWrapped"],
                  ["delivered", "taskDelivered"],
                ]
                  .map(
                    ([key, label], i) =>
                      /* HTML */ `<label class="check-row"
                        ><input
                          type="checkbox"
                          data-task="${key}"
                          ${tasks[key] ? "checked" : ""}
                          ${!chosen || (i === 1 && !tasks.bought) || (i === 2 && !tasks.wrapped) ? "disabled" : ""}
                        /><span>${t(label)}</span></label
                      >`,
                  )
                  .join("")}
              </div>
              ${count === 4 ? /* HTML */ `<p class="celebration">✧ ${t("finished")}</p>` : ""}<button
                class="btn-gq secondary w-100"
                data-copy-card
              >
                ${icon("copy")}${t("copyCard")}
              </button>
            </div>
          </aside>
        </div>
      </section>`,
    );
  }
  const renderers = {
    index: home,
    game: gamePage,
    profile: profilePage,
    recipient: recipientPage,
    catalog: catalogPage,
    preparation: preparationPage,
  };
  function render() {
    shell();
    (renderers[page] || home)();
  }
  function openDialog(title, body, actions = "") {
    const d = document.getElementById("dialog");
    d.innerHTML = /* HTML */ `<button
        class="dialog-close icon-button"
        data-close
        aria-label="${t("close")}"
      >
        ${icon("close")}
      </button>
      <h2 id="dialog-title">${title}</h2>
      ${body}${actions}`;
    if (!d.open) d.showModal();
  }
  function confirmDialog(title, body, action) {
    openDialog(
      t(title),
      /* HTML */ `<p>${t(body)}</p>`,
      /* HTML */ `<div class="dialog-actions">
        <button class="btn-gq quiet" data-close>${t("cancel")}</button
        ><button class="btn-gq primary" id="confirm-action">
          ${t("confirm")} ${icon("arrow")}
        </button>
      </div>`,
    );
    $("#confirm-action").one("click", () => {
      document.getElementById("dialog").close();
      action();
    });
  }
  function detail(id) {
    const g = gifts.find((g) => g.id === id);
    if (!g) return;
    openDialog(
      esc(localized(g.title)),
      /* HTML */ `<div class="detail-art tone-${g.category}">${art(g.art)}</div>
        <span class="gift-category">${t(g.category)}</span>
        <p class="detail-description">${esc(localized(g.description))}</p>
        <div class="detail-price">
          <span>${t("approxPrice")}</span><strong>${money(g.price)}</strong>
        </div>
        <p class="fineprint">${t("priceNote")}</p>
        <div class="tag-list">
          ${g.tags.map((k) => /* HTML */ `<span>${t(k)}</span>`).join("")}
        </div>
        <p class="gift-tip">${t("giftTip")}</p>`,
      /* HTML */ `<button class="btn-gq primary" data-save="${g.id}">
        ${icon("heart")}${t(currentSaved().includes(id) ? "unfavorite" : "favorite")}
      </button>`,
    );
  }
  function updateFavoriteButtons() {
    $("[data-save]").each(function () {
      const saved = currentSaved().includes(this.dataset.save),
        g = gifts.find((g) => g.id === this.dataset.save);
      if (!g) return;
      if (this.classList.contains("heart-button")) {
        $(this)
          .toggleClass("is-saved", saved)
          .attr("aria-pressed", String(saved))
          .attr(
            "aria-label",
            t(saved ? "unfavorite" : "favorite") + ": " + localized(g.title),
          );
      }
    });
    const btn = document.querySelector("#dialog [data-save]");
    if (btn)
      btn.innerHTML =
        icon("heart") +
        t(
          currentSaved().includes(btn.dataset.save) ? "unfavorite" : "favorite",
        );
  }
  function seedDemo() {
    state = blank();
    state.game = {
      title: t("demoTitle"),
      budget: 7000,
      date: E.dateAfter(14),
      deadline: E.dateAfter(7),
    };
    const rows = [
      ["Алина", ["art", "reading", "cozy"], ["creative", "cozy"], ["food"]],
      [
        "Данияр",
        ["gaming", "music", "coffee"],
        ["useful", "creative"],
        ["decor"],
      ],
      [
        "Мира",
        ["nature", "travel", "art"],
        ["handmade", "experience"],
        ["tech"],
      ],
      [
        "Тимур",
        ["cooking", "coffee", "sport"],
        ["useful", "experience"],
        ["books"],
      ],
      ["София", ["reading", "cozy", "music"], ["cozy", "handmade"], ["games"]],
    ];
    state.participants = rows.map(([name, interests, styles, avoid]) => ({
      id: uid(),
      name,
      interests,
      styles,
      avoid,
      wishes: "",
      note: "",
    }));
    state.activeId = state.participants[0].id;
    persist();
    location.href = "game.html";
  }
  function formErrors(form, errors) {
    $(form).find("[aria-invalid]").removeAttr("aria-invalid");
    $(form).find(".field-error").text("");
    for (const [field, key] of Object.entries(errors)) {
      $(form).find(`[name="${field}"]`).attr("aria-invalid", "true");
      $("#error-" + field).text(t(key));
    }
    $(form).find('[aria-invalid="true"]').first().trigger("focus");
  }
  function collectProfile(form) {
    const data = new FormData(form);
    return {
      interests: data.getAll("interests"),
      styles: data.getAll("styles"),
      avoid: data.getAll("avoid"),
      wishes: String(data.get("wishes") || "").trim(),
      note: String(data.get("note") || "").trim(),
    };
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      notify(t("copied"));
    } catch {
      openDialog(
        t("copyFailed"),
        /* HTML */ `<textarea rows="6" readonly>${esc(text)}</textarea>`,
      );
    }
  }
  function events() {
    $(document).on("click", "[data-lang]", function () {
      // Preserve an in-progress form when changing language, including unchecked options.
      let draft = null;
      if (page === "profile" && $("#profile-form").length)
        draft = collectProfile(document.getElementById("profile-form"));
      let gameDraft = null;
      if ($("#game-form").length)
        gameDraft = Object.fromEntries(
          new FormData(document.getElementById("game-form")),
        );
      language = this.dataset.lang;
      try {
        localStorage.setItem(LANG_KEY, language);
      } catch {}
      document.getElementById("dialog").close();
      render();
      if (draft) {
        $('#profile-form input[type="checkbox"]').prop("checked", false);
        for (const key of ["interests", "styles", "avoid"])
          draft[key].forEach((v) =>
            $(`#profile-form [name="${key}"][value="${v}"]`).prop(
              "checked",
              true,
            ),
          );
        $("#wishes").val(draft.wishes);
        $("#note").val(draft.note);
      }
      if (gameDraft)
        for (const [name, value] of Object.entries(gameDraft))
          $(`#game-form [name="${name}"]`).val(value);
    });
    $(document).on("click", ".menu-toggle", function () {
      const open = this.getAttribute("aria-expanded") !== "true";
      this.setAttribute("aria-expanded", open);
      $("#main-nav").toggleClass("is-open", open);
    });
    $(document).on("click", ".faq-toggle", function () {
      const open = this.getAttribute("aria-expanded") !== "true";
      this.setAttribute("aria-expanded", open);
      $(this)
        .find("span")
        .text(open ? "−" : "+");
      const answer = document.getElementById(
        this.getAttribute("aria-controls"),
      );
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        answer.hidden = !open;
        return;
      }
      answer.hidden = false;
      if (open) $(answer).hide();
      $(answer)
        .stop(true, true)
        [open ? "slideDown" : "slideUp"](180, () => (answer.hidden = !open));
    });
    $(document).on("click", "[data-close]", () =>
      document.getElementById("dialog").close(),
    );
    document.getElementById("dialog").addEventListener("click", (e) => {
      if (e.target !== e.currentTarget) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        e.currentTarget.close();
    });
    $(document).on("click", "[data-demo]", () =>
      state.game
        ? confirmDialog("replaceDemo", "resetText", seedDemo)
        : seedDemo(),
    );
    $(document).on("submit", "#game-form", function (e) {
      e.preventDefault();
      const f = new FormData(this);
      const game = {
        title: String(f.get("title")).trim(),
        budget: Number(f.get("budget")),
        date: String(f.get("date")),
        deadline: String(f.get("deadline")),
      };
      const errors = E.gameErrors(game);
      formErrors(this, errors);
      if (Object.keys(errors).length) return;
      if (state.assignments) return;
      state.game = game;
      const saved = persist();
      document.getElementById("dialog").close();
      render();
      if (saved) notify(t("gameCreated"));
    });
    $(document).on("click", "[data-edit-game]", () => {
      if (!state.assignments) openDialog(t("editRules"), gameForm(true));
    });
    $(document).on("submit", "#add-person-form", function (e) {
      e.preventDefault();
      const name = String(new FormData(this).get("name")).trim();
      let error = "";
      if (name.length < 2 || name.length > 30) error = "nameError";
      else if (
        state.participants.some(
          (p) => p.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
        )
      )
        error = "duplicateName";
      else if (state.participants.length >= 12) error = "maxPeople";
      $("#person-error").text(error ? t(error) : "");
      if (error) {
        $("#person-name").attr("aria-invalid", "true").trigger("focus");
        return;
      }
      if (state.assignments) return;
      const p = {
        id: uid(),
        name,
        interests: [],
        styles: [],
        avoid: [],
        wishes: "",
        note: "",
      };
      state.participants.push(p);
      if (!state.activeId) state.activeId = p.id;
      const saved = persist();
      render();
      $("#person-name").trigger("focus");
      if (saved) notify(t("added"));
    });
    $(document).on("click", "[data-remove-person]", function () {
      const id = this.dataset.removePerson;
      if (state.assignments) return;
      confirmDialog("removePersonTitle", "removePersonText", () => {
        state.participants = state.participants.filter((p) => p.id !== id);
        for (const k of ["saved", "selected", "tasks"]) delete state[k][id];
        if (state.activeId === id)
          state.activeId = state.participants[0]?.id || "";
        persist();
        render();
      });
    });
    $(document).on("change", "#active-person", function () {
      state.activeId = this.value;
      revealed = false;
      recOffset = 0;
      persist();
      render();
    });
    $(document).on("submit", "#profile-form", function (e) {
      e.preventDefault();
      const data = collectProfile(this);
      const badInterests =
        data.interests.length < 1 || data.interests.length > 5;
      $("#interests-error").text(badInterests ? t("interestsError") : "");
      $("#styles-error").text(!data.styles.length ? t("stylesError") : "");
      if (badInterests || !data.styles.length) {
        $(this)
          .find(`input[name="${badInterests ? "interests" : "styles"}"]`)
          .first()
          .trigger("focus");
        return;
      }
      Object.assign(person(), data);
      const saved = persist();
      if (saved) notify(t("profileSaved"));
    });
    $(document).on("click", "[data-draw]", () => {
      if (
        state.assignments ||
        state.participants.length < 3 ||
        !state.participants.every(E.ready)
      )
        return;
      state.assignments = E.draw(state.participants.map((p) => p.id));
      const saved = persist();
      render();
      if (saved) notify(t("drawSuccess"));
    });
    $(document).on("click", "[data-reveal]", () => {
      revealed = true;
      recipientPage();
      const panel = $(".recipient-panel");
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        panel.hide().fadeIn(240);
      panel.find("h2").attr("tabindex", "-1").trigger("focus");
    });
    $(document).on("click", "[data-hide]", () => {
      revealed = false;
      recipientPage();
    });
    $(document).on("click", "[data-more]", () => {
      recOffset += 3;
      renderRecommendations();
    });
    $(document).on("input", "#gift-search", function () {
      catalogFilters.q = this.value;
      renderCatalog();
    });
    $(document).on("input", "#filter-budget", function () {
      catalogFilters.budget = this.value;
      renderCatalog();
    });
    $(document).on("change", "#gift-sort", function () {
      catalogFilters.sort = this.value;
      renderCatalog();
    });
    $(document).on("click", "[data-category]", function () {
      catalogFilters.category = this.dataset.category;
      $("[data-category]").removeClass("active").attr("aria-pressed", "false");
      $(this).addClass("active").attr("aria-pressed", "true");
      renderCatalog();
    });
    $(document).on("click", "[data-reset-filters]", () => {
      catalogFilters = { q: "", category: "", budget: "", sort: "default" };
      catalogPage();
    });
    $(document).on("click", "[data-detail]", function () {
      detail(this.dataset.detail);
    });
    $(document).on("click", "[data-save]", function () {
      if (!person()) {
        document.getElementById("dialog").close();
        notify(t("noPerson"));
        return;
      }
      const id = this.dataset.save;
      if (!gifts.some((g) => g.id === id)) return;
      const toggle = () => {
        const list = [...currentSaved()];
        const exists = list.includes(id);
        state.saved[person().id] = exists
          ? list.filter((x) => x !== id)
          : [...list, id];
        if (exists && currentChosen() === id) {
          delete state.selected[person().id];
          state.tasks[person().id] = {};
        }
        const saved = persist();
        updateFavoriteButtons();
        if (page === "preparation") preparationPage();
        if (saved) notify(t(exists ? "favoriteRemoved" : "favoriteAdded"));
      };
      if (currentChosen() === id)
        confirmDialog("changeGiftTitle", "changeGiftText", toggle);
      else toggle();
    });
    $(document).on("click", "[data-choose]", function () {
      const id = this.dataset.choose;
      if (!currentSaved().includes(id) || currentChosen() === id) return;
      const choose = () => {
        state.selected[person().id] = id;
        state.tasks[person().id] = {};
        const saved = persist();
        preparationPage();
        if (saved) notify(t("giftChosen"));
      };
      if (currentChosen())
        confirmDialog("changeGiftTitle", "changeGiftText", choose);
      else choose();
    });
    $(document).on("change", "[data-task]", function () {
      if (!currentChosen()) return;
      const tasks = state.tasks[person().id] || {};
      tasks[this.dataset.task] = this.checked;
      if (!tasks.bought) {
        tasks.wrapped = false;
        tasks.delivered = false;
      }
      if (!tasks.wrapped) tasks.delivered = false;
      state.tasks[person().id] = tasks;
      persist();
      preparationPage();
    });
    $(document).on("click", "[data-copy-card]", () => copy(t("cardText")));
    $(document).on("click", "[data-invite]", () =>
      copy(
        `GiftQuest · ${state.game.title}\n${t("budget")}: ${money(state.game.budget)}\n${t("exchangeDate")}: ${dateText(state.game.date)}\n${t("deadline")}: ${dateText(state.game.deadline)}\n${t("inviteDemo")}`,
      ),
    );
    $(document).on("click", "[data-reset]", () =>
      confirmDialog("resetTitle", "resetText", () => {
        state = blank();
        persist();
        location.href = "game.html";
      }),
    );
    $(document).on("click", "[data-backup]", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "giftquest-backup.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    $(document).on("change", "#restore-file", async function () {
      const file = this.files[0];
      if (!file) return;
      try {
        if (file.size > 1000000) throw Error("size");
        const imported = validateState(JSON.parse(await file.text()));
        if (!imported.game) throw Error("empty");
        confirmDialog("restoreTitle", "restoreText", () => {
          state = imported;
          persist();
          render();
          notify(storageFailed ? t("storageError") : t("saved"));
        });
      } catch {
        notify(t("invalidBackup"));
      }
      this.value = "";
    });
  }
  async function init() {
    try {
      [translations, gifts] = await Promise.all([
        $.getJSON("assets/data/i18n.json"),
        $.getJSON("assets/data/gifts.json"),
      ]);
      loadState();
      const wanted = new URLSearchParams(location.search).get("person");
      if (
        page === "profile" &&
        state.participants.some((p) => p.id === wanted)
      ) {
        state.activeId = wanted;
        persist();
      }
      events();
      render();
      if (corrupt) notify(t("dataRecovered"));
    } catch (error) {
      $main.html(
        '<div class="container page-wrap"><div class="empty-state"><h1>Не удалось загрузить сайт / Could not load the site</h1><p>Проверьте соединение. Для локального запуска нужен веб-сервер.<br>Check your connection. A local web server is required.</p><button class="btn-gq primary" id="retry-load">Повторить / Retry</button></div></div>',
      );
      $("#retry-load").on("click", () => location.reload());
      console.error("GiftQuest initialization:", error);
    }
  }
  init();
})();
