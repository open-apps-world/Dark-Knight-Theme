const TAB_KEY = (id) => `tab:${id}`;
const DOMAIN_KEY = (host) => `domain:${host}`;
const COMFORT_KEY = "comfort";
const DEFAULT_COMFORT = { warmth: 0, dim: 0 };

async function getComfort() {
  const data = await chrome.storage.local.get(COMFORT_KEY);
  const c = data[COMFORT_KEY] || {};
  return {
    warmth: clamp(Number(c.warmth) || 0, 0, 60),
    dim: clamp(Number(c.dim) || 0, 0, 40),
  };
}

async function setComfort({ warmth, dim }) {
  const next = {
    warmth: clamp(Number(warmth) || 0, 0, 60),
    dim: clamp(Number(dim) || 0, 0, 40),
  };
  await chrome.storage.local.set({ [COMFORT_KEY]: next });
  return next;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

async function getTabOverride(tabId) {
  if (tabId == null) return null;
  const data = await chrome.storage.session.get(TAB_KEY(tabId));
  const v = data[TAB_KEY(tabId)];
  return typeof v === "boolean" ? v : null;
}

async function getDomainPref(hostname) {
  if (!hostname) return null;
  const data = await chrome.storage.local.get(DOMAIN_KEY(hostname));
  const v = data[DOMAIN_KEY(hostname)];
  return typeof v === "boolean" ? v : null;
}

async function resolveState(tabId, hostname) {
  const tab = await getTabOverride(tabId);
  if (tab !== null) return { effective: tab, source: "tab", tab, domain: await getDomainPref(hostname) };
  const domain = await getDomainPref(hostname);
  return { effective: !!domain, source: domain === null ? "none" : "domain", tab: null, domain };
}

async function setState({ scope, enabled, tabId, hostname }) {
  if (scope === "tab") {
    await chrome.storage.session.set({ [TAB_KEY(tabId)]: enabled });
  } else if (scope === "domain") {
    await chrome.storage.local.set({ [DOMAIN_KEY(hostname)]: enabled });
  }
}

async function clearTabOverride(tabId) {
  await chrome.storage.session.remove(TAB_KEY(tabId));
}

async function broadcastToHost(hostname) {
  if (!hostname) return;
  const comfort = await getComfort();
  const tabs = await chrome.tabs.query({ url: `*://${hostname}/*` });
  await Promise.all(
    tabs.map(async (t) => {
      if (t.id == null) return;
      const state = await resolveState(t.id, hostname);
      try { await chrome.tabs.sendMessage(t.id, { type: "APPLY", enabled: state.effective, comfort }); } catch {}
    })
  );
}

async function broadcastComfortAll() {
  const comfort = await getComfort();
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.map(async (t) => {
      if (t.id == null || !t.url) return;
      let hostname = "";
      try { hostname = new URL(t.url).hostname; } catch { return; }
      if (!hostname) return;
      const state = await resolveState(t.id, hostname);
      try { await chrome.tabs.sendMessage(t.id, { type: "APPLY", enabled: state.effective, comfort }); } catch {}
    })
  );
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    const senderTabId = sender.tab?.id;
    const senderHost = (() => {
      try { return new URL(sender.tab?.url || "").hostname; } catch { return ""; }
    })();

    if (msg?.type === "GET_INIT") {
      const state = await resolveState(senderTabId, senderHost);
      const comfort = await getComfort();
      sendResponse({ ...state, comfort, tabId: senderTabId, hostname: senderHost });
      return;
    }

    if (msg?.type === "GET_STATE_FOR_POPUP") {
      const state = await resolveState(msg.tabId, msg.hostname);
      const comfort = await getComfort();
      sendResponse({ ...state, comfort, tabId: msg.tabId, hostname: msg.hostname });
      return;
    }

    if (msg?.type === "SET_STATE") {
      await setState({ scope: msg.scope, enabled: msg.enabled, tabId: msg.tabId, hostname: msg.hostname });
      const comfort = await getComfort();
      if (msg.scope === "domain") {
        await broadcastToHost(msg.hostname);
      } else {
        const state = await resolveState(msg.tabId, msg.hostname);
        try { await chrome.tabs.sendMessage(msg.tabId, { type: "APPLY", enabled: state.effective, comfort }); } catch {}
      }
      const state = await resolveState(msg.tabId, msg.hostname);
      sendResponse({ ...state, comfort });
      return;
    }

    if (msg?.type === "CLEAR_TAB") {
      await clearTabOverride(msg.tabId);
      const state = await resolveState(msg.tabId, msg.hostname);
      const comfort = await getComfort();
      try { await chrome.tabs.sendMessage(msg.tabId, { type: "APPLY", enabled: state.effective, comfort }); } catch {}
      sendResponse({ ...state, comfort });
      return;
    }

    if (msg?.type === "SET_COMFORT") {
      const next = await setComfort({ warmth: msg.warmth, dim: msg.dim });
      await broadcastComfortAll();
      sendResponse({ comfort: next });
      return;
    }
  })();
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(TAB_KEY(tabId));
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-dark-mode") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  let hostname = "";
  try { hostname = new URL(tab.url || "").hostname; } catch {}
  const current = await resolveState(tab.id, hostname);
  await setState({ scope: "tab", enabled: !current.effective, tabId: tab.id, hostname });
  const comfort = await getComfort();
  try { await chrome.tabs.sendMessage(tab.id, { type: "APPLY", enabled: !current.effective, comfort }); } catch {}
});
