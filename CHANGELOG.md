# Changelog

All notable changes to Dark Knight are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.0] — 2026-11-02

### Added
- `CHANGELOG.md` documenting all releases.

### Changed
- Refined popup UI: card-based layout, cohesive color tokens via CSS custom properties, filled slider tracks, cross-browser slider styling (WebKit + Firefox), smoother hover and transition states, tighter typography hierarchy.
- Comfort section now visually grouped and labeled; segmented scope control has a cleaner pill treatment.

## [1.2.0] — 2026-11-02

### Added
- **Eye comfort** sliders in the popup:
  - **Warmth** (0–60%) applies `sepia()` to cut blue-light wavelengths.
  - **Dim** (0–40%) reduces `brightness()` to soften glare.
- Settings are **global** (apply to all sites) and persist in `chrome.storage.local.comfort`.
- Slider changes broadcast live to every open tab via `broadcastComfortAll()`.
- **Reset** control returns both sliders to 0.

### Changed
- Content script now composes the page filter dynamically from `{enabled, comfort}`; the injected `<style>` is removed entirely when no filter is active.
- `APPLY` message now carries both `enabled` and `comfort`.

## [1.1.0] — 2026-11-02

### Added
- **Scope selector** in the popup: *This tab* (ephemeral override) or *This domain* (persistent default).
- Tab-level overrides live in `chrome.storage.session` keyed by `tab:<tabId>` and are cleared on tab close via `chrome.tabs.onRemoved`.
- Domain prefs live in `chrome.storage.local` keyed by `domain:<hostname>`.
- "Tab override active — Clear" indicator surfaces when the current tab has an override.
- Domain-level changes broadcast via `broadcastToHost(hostname)` so every open tab on that domain updates instantly without reload (tab overrides are respected).

### Changed
- Keyboard shortcut `Cmd/Ctrl+Shift+D` now flips at **tab level** only, so it never clobbers a saved domain preference.
- Resolution precedence: tab override → domain default → off.
- Service worker becomes the single source of truth for state; content script requests `GET_INIT` on load and reacts to `APPLY` messages.

### Removed
- Direct `chrome.storage.local[host]` reads from the content script.

## [1.0.1] — 2026-11-02

### Added
- Version badge in the popup, sourced from `chrome.runtime.getManifest().version` so it stays in sync automatically.

## [1.0.0] — 2026-11-02

### Added
- Initial release.
- Manifest V3 Chrome extension that toggles a dark theme on any page via a CSS `invert(1) hue-rotate(180deg)` filter on `<html>`, with media (img/video/canvas/svg/iframe) re-inverted so they render correctly.
- Popup with per-site toggle, keyboard shortcut `Cmd/Ctrl+Shift+D`, generated 16/48/128 PNG icons.
- Content script injected at `document_start` to avoid a bright flash during page load.
