# Changelog

All notable changes to `dsh-plugin-antigravity-agents` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-11-08

### Changed
- Replaced native OS `<select>` dropdown with custom floating popover matching DSH native dropdown styling (rounded corners, dark theme, smooth hover, checkmark indicators, and click-outside dismissal).

## [1.0.1] - 2026-11-08

### Changed
- Added `id-token: write` permissions to GitHub Actions workflow for npm Provenance and Trusted Publishing (OIDC).

## [1.0.0] - 2026-11-08

### Added
- Native discovery and execution of Google Antigravity agent specifications in `.agents/agents/` and `~/.agents/agents/`.
- Full compatibility with existing `.agent.md` files (read-only invariant, zero disk mutation).
- Settings page section in DeepSeek Harness Web UI with agent role categorization (Main vs Subagent), model indicators, and enable/disable toggles.
- Default main agent selection persisted to `.agents/agents/settings.json`.
- Dynamic session agent selector in conversation composer toolbar.
- `invoke_subagent` and `antigravity_agent` custom tools for agent discovery and delegation.
- Pre-execution tool hooks for automatic prompt augmentation with subagent specifications.
