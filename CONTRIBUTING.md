# Contributing to dsh-plugin-antigravity-agents

Thank you for your interest in contributing to `dsh-plugin-antigravity-agents`! We welcome bug reports, improvements, and feature contributions.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Domush/dsh-plugin-antigravity-agents.git
   cd dsh-plugin-antigravity-agents
   ```

2. **Link into DeepSeek Harness:**
   To test changes locally in DeepSeek Harness, link the package in your DSH profile `package.json`:
   ```json
   {
     "dependencies": {
       "dsh-plugin-antigravity-agents": "link:/path/to/dsh-plugin-antigravity-agents"
     }
   }
   ```
   Or use the DSH plugin manager / Cordis patch layer.

## Guidelines

- **Compatibility First**: Maintain strict backwards compatibility with standard Google Antigravity `.agents/agents/*.agent.md` specifications and frontmatter.
- **Zero Disk Mutation**: Never modify agent files on disk; persist runtime preferences to `.agents/agents/settings.json`.
- **Code Style**: Use ES modules (`import`/`export`), clean vanilla JavaScript/React without heavy build steps, and clear comments.
- **Pull Requests**: Submit clear, atomic PRs with descriptive titles and explanations of the problem being solved.

## Reporting Issues

If you encounter unexpected behavior, please open an issue on GitHub with:
1. Steps to reproduce.
2. DSH version and platform details.
3. Relevant error logs or console output.
