# dsh-plugin-antigravity-agents

[![npm version](https://img.shields.io/npm/v/dsh-plugin-antigravity-agents.svg)](https://www.npmjs.com/package/dsh-plugin-antigravity-agents)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Native Google Antigravity agents loader, coordinator selection, and subagent orchestration engine for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

---
<img width="773" height="608" alt="image" src="https://github.com/user-attachments/assets/d345a565-be2c-498f-a170-8ae69c00a92d" />

## Overview & Antigravity Compatibility

`dsh-plugin-antigravity-agents` integrates **Google Antigravity agent personas** seamlessly into DeepSeek Harness:

- **100% Compatible with Existing Antigravity Installs**: Discovers and executes agent specifications located in `.agents/agents/` (project-level) and `~/.agents/agents/` (user-global) without requiring conversions or file alterations.
- **Zero Disk Mutation**: All `.agents/agents/*.agent.md` files remain strictly read-only. Runtime state (default coordinator preference and disabled agents) is persisted cleanly to `.agents/agents/settings.json`.
- **Full Frontmatter Fidelity**: Parses `name`, `description`, `mainAgent`, `subagent`, `model`, and `tools` frontmatter attributes while retaining all markdown instruction blocks.

---

## Key Features

1. **Coordinator vs Subagent Classification**:
   Automatically categorizes agents into **Main Agents** (primary session coordinators) and **Subagents** (delegated domain specialists).

2. **Session Agent Selector**:
   Integrates an interactive agent dropdown directly into the conversation composer toolbar and new session interface, allowing users to switch between standard DSH prompts and specific Antigravity coordinators.

<img width="502" height="193" alt="image" src="https://github.com/user-attachments/assets/70eb98d4-76e2-4711-be6a-5dc8bdd1fa2e" />

3. **Persistent Default Agent**:
   Configure a default coordinator in the Web UI Settings tab that automatically pre-selects for all newly spawned sessions.

4. **Subagent Delegation & System Prompt Ingestion**:
   Main agents can delegate to specialized subagents using `invoke_subagent` or native DSH delegation (`subagent`, `spawn_teammate`). The target subagent's instructions and role contracts are automatically injected into the spawned agent's system prompt.

5. **`antigravity_agent` Tool**:
   Allows inspecting and listing available Antigravity agents, their roles, models, and capabilities:
   - `antigravity_agent(action: "list")`
   - `antigravity_agent(action: "read", name: "vogel-auditor")`

6. **Web Settings UI**:
   Adds an **Agents** section to the DeepSeek Harness Settings page featuring:
   - Default coordinator picker.
   - Comprehensive list of discovered agents with role badges and model tags.
   - Rich hover tooltips with full agent descriptions.
   - Individual enable/disable switches.

---

## Installation

### From NPM (Recommended)
Add the plugin to your DeepSeek Harness profile dependencies:

```json
{
  "dependencies": {
    "dsh-plugin-antigravity-agents": "^1.0.0"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "dsh-plugin-antigravity-agents"
      ]
    }
  }
}
```

Or install it via the DeepSeek Harness Plugin Manager:
```bash
dsh plugin install dsh-plugin-antigravity-agents
```

---

## Configuration

In your profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: antigravity-agents
      name: 'dsh-plugin-antigravity-agents'
      config:
        enabled: true
        agentsDir: '.agents/agents'
        injectInSystemPrompt: true
```

### Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | Master switch for Google Antigravity agents support. |
| `agentsDir` | `string` | `".agents/agents"` | Relative workspace path to agents directory. |
| `injectInSystemPrompt` | `boolean` | `true` | Injects active agent instructions into the system prompt. |

---

## License

[MIT](LICENSE) © 2026 Phillip Webber (Domush)
