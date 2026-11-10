const toggle = document.getElementById("toggle");
const label = document.getElementById("label");
const site = document.getElementById("site");
const version = document.getElementById("version");
const segTab = document.getElementById("scope-tab");
const segDomain = document.getElementById("scope-domain");
const overrideRow = document.getElementById("override");
const clearBtn = document.getElementById("clear");
const warmth = document.getElementById("warmth");
const warmthVal = document.getElementById("warmth-val");
const dim = document.getElementById("dim");
const dimVal = document.getElementById("dim-val");
const comfortReset = document.getElementById("comfort-reset");

version.textContent = "v" + chrome.runtime.getManifest().version;

let ctx = { tabId: null, hostname: "", scope: "domain" };

function setToggleUI(enabled) {
  toggle.checked = enabled;
  label.textContent = enabled ? "Dark mode on" : "Dark mode off";
}

function setScopeUI(scope) {
  ctx.scope = scope;
  segTab.classList.toggle("active", scope === "tab");
  segDomain.classList.toggle("active", scope === "domain");
}

function setOverrideUI(hasTabOverride) {
  overrideRow.classList.toggle("hidden", !hasTabOverride);
}

function setComfortUI(comfort) {
  const w = Number(comfort?.warmth) || 0;
  const d = Number(comfort?.dim) || 0;
  warmth.value = String(w);
  dim.value = String(d);
  warmthVal.textContent = w + "%";
  dimVal.textContent = d + "%";
  paintFill(warmth);
  paintFill(dim);
}

function paintFill(input) {
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const val = Number(input.value) || 0;
  const pct = ((val - min) / (max - min)) * 100;
  input.style.setProperty("--fill", pct + "%");
}

function send(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (res) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(res);
    });
  });
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    site.textContent = "Unsupported page";
    toggle.disabled = true;
    return;
  }

  let hostname = "";
  try { hostname = new URL(tab.url).hostname; } catch {}
  if (!hostname) {
    site.textContent = "Unsupported page";
    toggle.disabled = true;
    return;
  }

  ctx.tabId = tab.id;
  ctx.hostname = hostname;
  site.textContent = hostname;

  const state = await send({ type: "GET_STATE_FOR_POPUP", tabId: tab.id, hostname });
  if (!state) {
    site.textContent = "Reload page to enable here";
    toggle.disabled = true;
    return;
  }

  setToggleUI(state.effective);
  setScopeUI(state.source === "tab" ? "tab" : "domain");
  setOverrideUI(state.tab !== null);
  setComfortUI(state.comfort);

  segTab.addEventListener("click", () => setScopeUI("tab"));
  segDomain.addEventListener("click", () => setScopeUI("domain"));

  toggle.addEventListener("change", async () => {
    const enabled = toggle.checked;
    const res = await send({
      type: "SET_STATE",
      scope: ctx.scope,
      enabled,
      tabId: ctx.tabId,
      hostname: ctx.hostname,
    });
    if (!res) {
      setToggleUI(!enabled);
      return;
    }
    setToggleUI(res.effective);
    setOverrideUI(res.tab !== null);
  });

  clearBtn.addEventListener("click", async () => {
    const res = await send({ type: "CLEAR_TAB", tabId: ctx.tabId, hostname: ctx.hostname });
    if (!res) return;
    setToggleUI(res.effective);
    setScopeUI("domain");
    setOverrideUI(false);
  });

  let comfortTimer = null;
  function pushComfort() {
    clearTimeout(comfortTimer);
    comfortTimer = setTimeout(async () => {
      const res = await send({
        type: "SET_COMFORT",
        warmth: Number(warmth.value),
        dim: Number(dim.value),
      });
      if (res?.comfort) setComfortUI(res.comfort);
    }, 60);
  }

  function onSlide() {
    warmthVal.textContent = warmth.value + "%";
    dimVal.textContent = dim.value + "%";
    paintFill(warmth);
    paintFill(dim);
    pushComfort();
  }
  warmth.addEventListener("input", onSlide);
  dim.addEventListener("input", onSlide);

  comfortReset.addEventListener("click", async () => {
    warmth.value = "0";
    dim.value = "0";
    warmthVal.textContent = "0%";
    dimVal.textContent = "0%";
    paintFill(warmth);
    paintFill(dim);
    await send({ type: "SET_COMFORT", warmth: 0, dim: 0 });
  });
}

init();
