const STYLE_ID = "__dark-knight-theme-style__";

let current = { enabled: false, comfort: { warmth: 0, dim: 0 } };

function buildCss({ enabled, comfort }) {
  const parts = [];
  if (enabled) parts.push("invert(1) hue-rotate(180deg)");
  if (comfort.warmth > 0) parts.push(`sepia(${comfort.warmth / 100})`);
  if (comfort.dim > 0) parts.push(`brightness(${(100 - comfort.dim) / 100})`);
  if (parts.length === 0) return "";

  let css = `html { filter: ${parts.join(" ")} !important;`;
  if (enabled) css += " background: #ffffff !important;";
  css += " }\n";

  if (enabled) {
    css += `
      img, picture, video, canvas, svg, iframe, embed, object,
      [style*="background-image"],
      [style*="url("] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      figure, .image, .video, .thumbnail {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      figure img, figure video,
      .image img, .image video,
      .video img, .video video,
      .thumbnail img, .thumbnail video {
        filter: none !important;
      }
    `;
  }
  return css;
}

function render() {
  const css = buildCss(current);
  const existing = document.getElementById(STYLE_ID);
  if (!css) {
    if (existing) existing.remove();
    return;
  }
  if (existing) {
    existing.textContent = css;
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
}

chrome.runtime.sendMessage({ type: "GET_INIT" }, (res) => {
  if (chrome.runtime.lastError) return;
  if (!res) return;
  current.enabled = !!res.effective;
  if (res.comfort) current.comfort = res.comfort;
  render();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "APPLY") {
    if (typeof msg.enabled === "boolean") current.enabled = msg.enabled;
    if (msg.comfort) current.comfort = msg.comfort;
    render();
    sendResponse({ ok: true });
    return;
  }
  if (msg?.type === "GET_STATE") {
    sendResponse({ enabled: current.enabled, comfort: current.comfort });
    return;
  }
});
