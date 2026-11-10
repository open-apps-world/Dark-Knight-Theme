# Dark Knight - Dark Theme Toolkit

A tiny Manifest V3 Chrome extension that converts bright pages into a dark theme and reduces eye strain. Toggle dark mode per tab or per domain, warm the color temperature to cut blue light, and dim overall brightness — all from a 300 px popup.

## Features

- **Universal dark mode** via a CSS `invert(1) hue-rotate(180deg)` filter on `<html>`, with images, videos, canvases, SVGs, and iframes re-inverted so media renders normally.
- **Scope control** — flip dark mode for just the current tab (ephemeral, lost on close) or for the whole domain (persistent across tabs and reloads). Tab overrides win over domain defaults.
- **Eye comfort sliders** — global settings that apply to every site, with or without dark mode:
  - **Warmth** (0–60%) adds a sepia tint that cuts short-wavelength blue light.
  - **Dim** (0–40%) lowers overall brightness to soften glare.
- **Keyboard shortcut** — `Cmd/Ctrl + Shift + D` flips dark mode on the current tab (never clobbers your saved domain default).
- **Instant propagation** — flipping the domain toggle updates every open tab on that hostname without a reload.
- **No bright flash** — content script runs at `document_start`, so dark pages don't flicker white before the stylesheet lands.
- **Zero third-party dependencies** — plain JS, CSS, and a vanilla MV3 manifest.

## Installation (unpacked)

1. Clone or download this folder.
2. Visit `chrome://extensions` in Chrome (or any Chromium-based browser).
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the `dark-knight-theme/` directory.
5. Pin the extension to the toolbar for one-click access.

## Usage

Click the toolbar icon to open the popup:

```
┌─────────────────────────────────────┐
│ Dark Knight             v1.4.0 │
│ example.com                         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ APPLY TO    [ Tab | Domain ]    │ │
│ │ [●————] Dark mode on            │ │
│ │ • Tab override active   Clear   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ EYE COMFORT              Reset  │ │
│ │ Warm tint and dim glare — all   │ │
│ │ sites.                          │ │
│ │                                 │ │
│ │ Warmth  ━━━●━━━━━━━━━━    30%   │ │
│ │ Dim     ━━━━━●━━━━━━━━    20%   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Ctrl/Cmd Shift D  toggles dark      │
└─────────────────────────────────────┘
```

- **Dark mode toggle**: select scope first (Tab or Domain), then flip the switch — the write lands at whichever scope is active.
- **Tab override**: if the current tab has an override, a yellow banner appears with a **Clear** link that drops back to the domain default.
- **Comfort sliders**: changes broadcast to every open tab live.

### Suggested starting points

| Setting                   | Warmth | Dim | Dark mode |
|---------------------------|-------:|----:|-----------|
| Daytime reading           |    25% | 10% | off       |
| Evening / long reading    |    40% | 15% | on        |
| Late night                |    50% | 20% | on        |

## How it works

- `content.js` injects a single `<style id="__dark-knight-theme-style__">` block whose filter is composed from `{enabled, comfort}`. Nothing is injected when all filters are off.
- `background.js` is the source of truth: resolves the effective state per tab (`tab override → domain default → off`), owns the global comfort settings, and broadcasts `APPLY` messages to tabs when state changes.
- Scope storage keys:
  - Tab overrides → `chrome.storage.session["tab:<tabId>"]` (cleared on tab close via `chrome.tabs.onRemoved`).
  - Domain defaults → `chrome.storage.local["domain:<hostname>"]`.
  - Global comfort → `chrome.storage.local.comfort`.

## File layout

```
dark-knight-theme/
├── manifest.json      MV3 manifest, permissions, command binding
├── background.js      Service worker — state resolution, broadcasts, shortcut
├── content.js         Injects/updates the dark + comfort stylesheet
├── popup.html         Popup markup
├── popup.css          Design tokens, card layout, slider styling
├── popup.js           Popup logic — scope, toggle, sliders
├── icons/             16/48/128 PNGs
├── CHANGELOG.md       Release notes
└── README.md          This file
```

## Permissions

| Permission        | Why it's needed                                               |
|-------------------|---------------------------------------------------------------|
| `activeTab`       | Toggle the current tab from the popup / shortcut              |
| `scripting`       | Standard content-script access                                |
| `storage`         | Persist tab overrides, domain defaults, and comfort settings  |
| `<all_urls>`      | Dark mode has to work on every site the user chooses to use it on |

## Known limitations

- **Cross-origin iframes** are a browser security boundary — their content isn't restyled by the extension's filter.
- **Restricted pages** (`chrome://`, Chrome Web Store, PDF viewer) can't run content scripts; the popup degrades gracefully with a "Reload page to enable here" message.
- The filter approach is intentionally simple and universal; sites with elaborate custom styling (video player chrome, canvas-rendered UIs) may need site-specific tuning if you want to extend the rules in `content.js`.

## Development

No build step — just edit the files and hit **Reload** on the `chrome://extensions` card.

Lint/parse checks:

```sh
node --check background.js
node --check content.js
node --check popup.js
```

## Versioning & changelog

This project follows [Semantic Versioning](https://semver.org/). Every meaningful change bumps the version in `manifest.json` and adds an entry to [`CHANGELOG.md`](./CHANGELOG.md) using the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## License

[Open Source Apache 2.0](LICENSE.md)