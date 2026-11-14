/* Runs before styles are painted, so saved dark mode never flashes white. */
(function () {
  "use strict";
  const KEY = "giftquest.theme";
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = null;

  function readPreference() {
    try {
      const value = localStorage.getItem(KEY);
      return value === "dark" || value === "light" ? value : null;
    } catch {
      return null;
    }
  }

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#13231d" : "#faf7f0";
    document.dispatchEvent(new CustomEvent("giftquest:themechange"));
  }

  preference = readPreference();
  apply(preference || (system.matches ? "dark" : "light"));
  window.GiftTheme = Object.freeze({
    current: () => document.documentElement.dataset.theme,
    toggle() {
      preference = this.current() === "dark" ? "light" : "dark";
      apply(preference);
      try {
        localStorage.setItem(KEY, preference);
        return true;
      } catch {
        // The current tab still works even when browser storage is unavailable.
        return false;
      }
    },
  });
  system.addEventListener("change", (event) => {
    if (!preference) apply(event.matches ? "dark" : "light");
  });
  window.addEventListener("storage", (event) => {
    if (event.key === KEY || event.key === null) {
      preference = readPreference();
      apply(preference || (system.matches ? "dark" : "light"));
    }
  });
})();
