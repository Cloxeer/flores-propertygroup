/**
 * Mobile QA audit for the Flores Hub. Open the app at #/app first (the landing page has no bottom bar), then paste into the browser console (or run through the Browser pane's
 * javascript tool) with the viewport at 390x844. It clicks through every phone screen and reports:
 *   overflow     horizontal scroll on the page
 *   minFs        smallest visible text size (must be >= 12)
 *   lowContrast  text runs under WCAG AA (4.5:1, 3:1 for 18px+)
 *   smallTargets controls under 44px (hit-area pseudo elements for checkboxes/toggles are excluded)
 *   hiddenBehindNav  px of content covered by the fixed bottom bar
 *   sheet        for dialogs/sheets: rect must sit inside the viewport (left >= 0, right <= width)
 * Everything should read "ok" / 0. Anything else is a regression.
 */
(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const errors = [];
  addEventListener("error", (event) => errors.push(event.message));
  const originalError = console.error;
  console.error = (...args) => {
    errors.push(String(args[0]).slice(0, 100));
    originalError.apply(console, args);
  };

  const luminance = (channels) => {
    const [r, g, b] = channels.map((value) => {
      const unit = value / 255;
      return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parseColor = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { rgb: parts.slice(0, 3), alpha: parts.length > 3 ? parts[3] : 1 };
  };
  const backgroundOf = (element) => {
    let node = element;
    while (node) {
      const color = parseColor(getComputedStyle(node).backgroundColor);
      if (color && color.alpha > 0.95) return color.rgb;
      node = node.parentElement;
    }
    return [255, 255, 255];
  };
  const isVisible = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < innerWidth && getComputedStyle(element).visibility !== "hidden";
  };
  const fixedBottomBar = () =>
    [...document.querySelectorAll("*")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return getComputedStyle(element).position === "fixed" && rect.bottom >= innerHeight - 1 && rect.height > 40 && rect.height < 130 && rect.width >= innerWidth - 2 && !element.closest("[role=dialog]");
      })
      .pop();

  const measure = () => {
    let minFs = 99;
    let lowContrast = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim()) continue;
      const element = node.parentElement;
      if (!isVisible(element)) continue;
      const style = getComputedStyle(element);
      const size = parseFloat(style.fontSize);
      minFs = Math.min(minFs, size);
      const foreground = parseColor(style.color);
      if (!foreground) continue;
      const l1 = luminance(foreground.rgb);
      const l2 = luminance(backgroundOf(element));
      if ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) < (size >= 18 ? 3 : 4.5)) lowContrast += 1;
    }
    const smallTargets = [...document.querySelectorAll("button,a[href],input,select,textarea,[role=button],summary")]
      .filter(isVisible)
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const hasHitArea = /check-button|switch-control|milestone-check/.test(element.className) || (element.tagName === "INPUT" && element.type === "checkbox") || element.closest(".column-heading");
        return (rect.height < 43.5 || rect.width < 43.5) && !hasHitArea;
      }).length;
    scrollTo(0, document.documentElement.scrollHeight);
    const bar = fixedBottomBar();
    const barTop = bar ? bar.getBoundingClientRect().top : innerHeight;
    let contentBottom = 0;
    document.querySelectorAll("main *").forEach((element) => {
      if ((bar && bar.contains(element)) || getComputedStyle(element).position === "fixed") return;
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) contentBottom = Math.max(contentBottom, rect.bottom);
    });
    const dialog = document.querySelector("[role=dialog]");
    const sheet = dialog ? (() => { const rect = dialog.getBoundingClientRect(); return rect.left >= -0.5 && rect.right <= innerWidth + 0.5 ? "ok" : `OFF-SCREEN ${Math.round(rect.left)}..${Math.round(rect.right)}`; })() : "-";
    scrollTo(0, 0);
    return { overflow: document.documentElement.scrollWidth > innerWidth ? "OVERFLOW" : "ok", minFs, lowContrast, smallTargets, hiddenBehindNav: Math.max(0, Math.round(contentBottom - barTop)), sheet };
  };

  const clickBar = async (label) => {
    const target = [...document.querySelectorAll("button,a")].find((element) => element.getBoundingClientRect().top > innerHeight - 140 && element.innerText.replace(/\d+\s*/, "").trim().startsWith(label));
    if (target) target.click();
    await sleep(800);
  };
  const clickSheet = async (label) => {
    await clickBar("More");
    const target = [...document.querySelectorAll("[role=dialog] button")].find((element) => element.innerText.includes(label));
    if (target) target.click();
    await sleep(900);
  };
  const closeDialog = async () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep(500);
  };

  const report = {};
  for (const tab of ["Today", "Homes", "Tasks", "Messages"]) {
    await clickBar(tab);
    report[tab] = measure();
  }
  await clickBar("More");
  report["More sheet"] = measure();
  await closeDialog();
  for (const item of ["Calendar", "Key documents", "Service providers", "Settings"]) {
    await clickSheet(item);
    report[item] = measure();
  }
  await clickBar("Today");
  const attention = document.querySelector(".attention-panel li button");
  if (attention) {
    attention.click();
    await sleep(900);
    report["Deal detail"] = measure();
    await closeDialog();
  }
  [...document.querySelectorAll("button")].find((element) => /New transaction/.test(element.innerText))?.click();
  await sleep(900);
  report["New transaction"] = measure();
  await closeDialog();
  await clickSheet("Preview the client journey");
  for (const tab of ["My journey", "Key documents", "My team"]) {
    await clickBar(tab);
    report[`Client · ${tab}`] = measure();
  }
  report.errors = errors;
  return JSON.stringify(report, null, 1);
})();
