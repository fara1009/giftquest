/* Pure business rules. No DOM or storage: these functions are easy to explain and test. */
(function (root) {
  "use strict";
  function random() {
    const n = new Uint32Array(1);
    root.crypto.getRandomValues(n);
    return n[0] / 4294967296;
  }
  function draw(ids, rng = random) {
    if (ids.length < 3 || ids.length > 12 || new Set(ids).size !== ids.length)
      throw new Error("A game needs 3–12 unique participants.");
    // Shuffle recipients, rejecting self-assignments. Bound retries to avoid infinite loops.
    for (let attempt = 0; attempt < 200; attempt++) {
      const recipients = [...ids];
      for (let i = recipients.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [recipients[i], recipients[j]] = [recipients[j], recipients[i]];
      }
      if (recipients.every((id, i) => id !== ids[i]))
        return Object.fromEntries(ids.map((id, i) => [id, recipients[i]]));
    }
    // A circular shift is always a valid fallback for this game (there are no exclusions).
    return Object.fromEntries(
      ids.map((id, i) => [id, ids[(i + 1) % ids.length]]),
    );
  }
  function validDraw(ids, result) {
    return (
      !!result &&
      Object.keys(result).length === ids.length &&
      new Set(Object.values(result)).size === ids.length &&
      ids.every((id) => ids.includes(result[id]) && result[id] !== id)
    );
  }
  function ready(person) {
    return (
      !!person.name?.trim() &&
      Array.isArray(person.interests) &&
      person.interests.length > 0 &&
      Array.isArray(person.styles) &&
      person.styles.length > 0
    );
  }
  function match(gift, person, budget) {
    const interests = gift.tags.filter((tag) => person.interests.includes(tag));
    const styles = gift.styles.filter((style) => person.styles.includes(style));
    return {
      eligible: gift.price <= budget && !person.avoid.includes(gift.category),
      score: interests.length * 5 + styles.length * 2,
      interests,
      styles,
    };
  }
  function recommend(gifts, person, budget, excluded = []) {
    return gifts
      .map((gift) => ({ gift, ...match(gift, person, budget) }))
      .filter((item) => item.eligible && !excluded.includes(item.gift.id))
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.gift.price - b.gift.price ||
          a.gift.id.localeCompare(b.gift.id),
      );
  }
  function localDate(date = new Date()) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  }
  function dateAfter(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return localDate(date);
  }
  function gameErrors(game, today = localDate()) {
    const errors = {};
    if (game.title.trim().length < 2 || game.title.trim().length > 60)
      errors.title = "titleError";
    if (
      !Number.isFinite(game.budget) ||
      game.budget < 100 ||
      game.budget > 1000000
    )
      errors.budget = "budgetError";
    const validDate = (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value;
    if (!validDate(game.date) || game.date < today) errors.date = "dateError";
    if (
      !validDate(game.deadline) ||
      game.deadline < today ||
      game.deadline > game.date
    )
      errors.deadline = "deadlineError";
    return errors;
  }
  const api = {
    draw,
    validDraw,
    ready,
    match,
    recommend,
    localDate,
    dateAfter,
    gameErrors,
  };
  root.GiftEngine = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
