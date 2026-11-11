import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";

export const name = "antigravity-agents";

// Attempt to load Schemastery from profile directory if available
let ConfigSchema = null;
try {
  const profileDir = process.env.DSH_PROFILE_DIR || path.join(os.homedir(), ".dsh", "profiles", "web");
  const req = createRequire(path.join(profileDir, "package.json"));
  const z = req("@deepseek-ai/schemastery");
  if (z && typeof z.object === "function") {
    ConfigSchema = z.object({
      enabled: z.boolean().default(true).description("Enable Google Antigravity agents support"),
      agentsDir: z.string().default(".agents/agents").description("Relative path to Antigravity agents directory"),
      injectInSystemPrompt: z.boolean().default(true).description("Inject active agent instructions into system prompt")
    });
  }
} catch {
  // If schemastery cannot be loaded, Cordis will pass config as plain object
}

export const Config = ConfigSchema;

export const inject = ["systemPrompt", "tools", "workingDirectory", "agents", "webServer", "workspaceRegistry", "connection"];

/** Robust YAML frontmatter parser for Antigravity agent markdown files */
function parseFrontmatter(rawContent) {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: rawContent.trim() };
  const rawYaml = match[1];
  const body = match[2].trim();
  const meta = {};
  const lines = rawYaml.split(/\r?\n/);
  let currentKey = null;
  let currentList = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // Check list item
    if (line.startsWith("- ") && currentKey) {
      const val = line.slice(2).trim().replace(/^["'](.*)["']$/, "$1");
      if (!currentList) {
        currentList = [];
        meta[currentKey] = currentList;
      }
      currentList.push(val);
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx !== -1) {
      currentKey = line.slice(0, colonIdx).trim();
      currentList = null;
      let val = line.slice(colonIdx + 1).trim();
      if (val.startsWith("[") && val.endsWith("]")) {
        meta[currentKey] = val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["'](.*)["']$/, "$1"))
          .filter(Boolean);
      } else if (val === "") {
        // May be followed by a list
      } else {
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        } else if (val === "true") {
          val = true;
        } else if (val === "false") {
          val = false;
        }
        meta[currentKey] = val;
      }
    }
  }
  return { meta, body };
}

/** In-memory cache of parsed agents per absolute file path */
const fileAgentCache = new Map();

/** Scan and parse agents from a specific directory */
function scanAgentsDirectory(dirPath, displayPrefix) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = [];
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const fullPath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(fullPath);
        if (!stats.isFile()) continue;

        const cached = fileAgentCache.get(fullPath);
        if (cached && cached.mtimeMs === stats.mtimeMs) {
          entries.push(cached.agent);
          continue;
        }

        const raw = fs.readFileSync(fullPath, "utf8");
        const { meta, body } = parseFrontmatter(raw);
        const name = String(meta.name || path.basename(file, ".agent.md").replace(/\.md$/, "")).trim();
        const description = String(meta.description || "").trim();
        const isMain = Boolean(meta.mainAgent);
        const isSub = Boolean(meta.subagent);
        const type = isMain ? "main" : isSub ? "subagent" : "subagent";
        const model = String(meta.model || "").trim();
        const tools = Array.isArray(meta.tools) ? meta.tools.map(String) : [];

        const relativePath = path.join(displayPrefix, file).replace(/\\/g, "/");
        const agent = {
          name,
          type,
          description,
          model,
          tools,
          content: body,
          fullPath,
          displayPath: relativePath
        };

        fileAgentCache.set(fullPath, { mtimeMs: stats.mtimeMs, agent });
        entries.push(agent);
      } catch {
        // Continue processing other agent files
      }
    }
  } catch {
    // Directory unreadable
  }
  return entries;
}

/** Validate whether a requested directory is an approved workspace in workspaceRegistry or workingDirectory */
function getApprovedWorkspace(ctx, requestedCwd) {
  const allowed = new Set();
  try {
    if (ctx.workspaceRegistry && typeof ctx.workspaceRegistry.list === "function") {
      for (const ws of ctx.workspaceRegistry.list()) {
        if (ws && ws.path) allowed.add(path.resolve(ws.path));
      }
    }
  } catch {}
  try {
    if (ctx.workingDirectory) {
      const cur = ctx.workingDirectory.get?.() || ctx.workingDirectory.current;
      if (cur) allowed.add(path.resolve(cur));
      if (ctx.workingDirectory.defaultDirectory) allowed.add(path.resolve(ctx.workingDirectory.defaultDirectory));
    }
  } catch {}
  allowed.add(path.resolve(process.cwd()));

  if (requestedCwd && typeof requestedCwd === "string") {
    const resolved = path.resolve(requestedCwd);
    if (allowed.has(resolved)) {
      return resolved;
    }
  }

  return Array.from(allowed)[0] || path.resolve(process.cwd());
}

/** Check if a subagent call arguments match an Antigravity agent specification */
function matchesSubagent(agent, args) {
  if (!agent || !agent.name || !args) return false;
  const an = agent.name.toLowerCase();
  const escaped = an.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordBoundaryRegex = new RegExp(`(?:^|[^a-zA-Z0-9_-])${escaped}(?![a-zA-Z0-9_-])`, "i");
  const mentionRegex = new RegExp(`(?:^|[^a-zA-Z0-9_-])@${escaped}(?![a-zA-Z0-9_-])`, "i");

  // Check exact name match
  if (args.name) {
    const nameStr = String(args.name).trim().toLowerCase();
    if (nameStr === an) return true;
  }

  // Check description by exact match or whole word token match
  if (args.description) {
    const descStr = String(args.description).trim().toLowerCase();
    if (descStr === an) return true;
    if (wordBoundaryRegex.test(descStr)) return true;
  }

  // Check prompt for explicit @agent mention with boundary
  if (args.prompt && mentionRegex.test(String(args.prompt))) {
    return true;
  }

  return false;
}

/** Resolve candidate workspace directories strictly within approved boundaries */
function resolveCandidateDirectories(ctx, requestedCwd) {
  const candidates = new Set();
  const approved = getApprovedWorkspace(ctx, requestedCwd);
  candidates.add(approved);

  try {
    if (ctx.workspaceRegistry && typeof ctx.workspaceRegistry.list === "function") {
      for (const ws of ctx.workspaceRegistry.list()) {
        if (ws && ws.path) candidates.add(path.resolve(ws.path));
      }
    }
  } catch {}
  try {
    if (ctx.agents && typeof ctx.agents.list === "function") {
      for (const a of ctx.agents.list()) {
        try {
          const d = ctx.workingDirectory.get(a.session);
          if (d) candidates.add(path.resolve(d));
        } catch {}
      }
    }
  } catch {}
  try {
    if (ctx.workingDirectory && ctx.workingDirectory.defaultDirectory) {
      candidates.add(path.resolve(ctx.workingDirectory.defaultDirectory));
    }
  } catch {}
  candidates.add(path.resolve(process.cwd()));
  return Array.from(candidates);
}

/** Find active agents directory across candidate directories */
function findActiveAgentsDir(ctx, requestedCwd, agentsSubDir) {
  const dirs = resolveCandidateDirectories(ctx, requestedCwd);
  for (const dir of dirs) {
    const candidateAgentsDir = path.resolve(dir, agentsSubDir);
    if (fs.existsSync(candidateAgentsDir)) {
      return { workspaceDir: dir, agentsDir: candidateAgentsDir };
    }
  }
  const fallback = dirs[0] || process.cwd();
  return { workspaceDir: fallback, agentsDir: path.resolve(fallback, agentsSubDir) };
}

/** Get all available agents for a workspace */
function getAllAgents(ctx, workspaceDir, agentsSubDir) {
  const agents = new Map();

  // 1. User-global agents: ~/.agents/agents
  const userAgentsDir = path.join(os.homedir(), ".agents", "agents");
  for (const agent of scanAgentsDirectory(userAgentsDir, "~/.agents/agents")) {
    agents.set(agent.name, agent);
  }

  // 2. Project workspace agents: .agents/agents
  const { agentsDir } = findActiveAgentsDir(ctx, workspaceDir, agentsSubDir);
  for (const agent of scanAgentsDirectory(agentsDir, agentsSubDir)) {
    agents.set(agent.name, agent); // Overrides same-named user-global agent
  }

  return Array.from(agents.values());
}

/** Settings management (persists without altering any .agent.md files) */
function getSettingsPath(agentsDir) {
  return path.join(agentsDir, "settings.json");
}

function loadSettings(agentsDir) {
  const settingsPath = getSettingsPath(agentsDir);
  if (!fs.existsSync(settingsPath)) {
    return { defaultMainAgent: "default", disabledAgents: [] };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    return {
      defaultMainAgent: raw.defaultMainAgent !== undefined ? String(raw.defaultMainAgent) : "default",
      disabledAgents: Array.isArray(raw.disabledAgents) ? raw.disabledAgents.map(String) : []
    };
  } catch {
    return { defaultMainAgent: "default", disabledAgents: [] };
  }
}

function saveSettings(agentsDir, settings) {
  const settingsPath = getSettingsPath(agentsDir);
  try {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
  } catch {
    // Write failed
  }
}

/** Send JSON HTTP response */
function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(payload));
}

/** Collect bounded request body */
async function readBoundedBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.byteLength;
    if (size > 64 * 1024) {
      req.resume();
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function apply(ctx, rawConfig) {
  const config = {
    enabled: rawConfig?.enabled ?? true,
    agentsDir: rawConfig?.agentsDir ?? ".agents/agents",
    injectInSystemPrompt: rawConfig?.injectInSystemPrompt ?? true
  };

  if (!config.enabled) return;

  // Track per-session selected main agent (sessionId -> agentName)
  const sessionMainAgentMap = new Map();
  // Track spawned subagents (sessionId -> subagentName)
  const sessionSubAgentMap = new Map();

  function getSessionMainAgent(sessionId, agentsDir) {
    if (sessionId && sessionMainAgentMap.has(sessionId)) {
      return sessionMainAgentMap.get(sessionId);
    }
    const settings = loadSettings(agentsDir);
    return settings.defaultMainAgent || "default";
  }

  // 1. System Prompt Section Injection
  ctx.systemPrompt.section({
    name: "antigravity:agents",
    order: 88,
    interpolate: false,
    text: (context) => {
      if (!config.enabled || !config.injectInSystemPrompt) return "";
      const agent = context?.agent;
      const sessionId = agent?.session?.id || agent?.id;
      const cwd = agent ? ctx.workingDirectory.get(agent.session) : process.cwd();
      const { agentsDir } = findActiveAgentsDir(ctx, cwd, config.agentsDir);
      const allAgents = getAllAgents(ctx, cwd, config.agentsDir);
      const settings = loadSettings(agentsDir);
      const disabledSet = new Set(settings.disabledAgents || []);

      // Check if this session is a dedicated subagent
      if (sessionId && sessionSubAgentMap.has(sessionId)) {
        const subAgentName = sessionSubAgentMap.get(sessionId);
        const subAgent = allAgents.find((a) => a.name.toLowerCase() === subAgentName.toLowerCase());
        if (subAgent && !disabledSet.has(subAgent.name)) {
          return [
            `# Google Antigravity Subagent: ${subAgent.name}`,
            `You are operating as the specialized subagent "${subAgent.name}".`,
            `Role: ${subAgent.description}`,
            "---",
            subAgent.content
          ].join("\n");
        }
      }

      // Main session: check selected main agent
      const selectedName = getSessionMainAgent(sessionId, agentsDir);
      if (!selectedName || selectedName === "default") {
        // "default agent" simply uses the default DSH system prompt
        return "";
      }

      const mainAgent = allAgents.find(
        (a) => a.name.toLowerCase() === selectedName.toLowerCase() && a.type === "main"
      );
      if (!mainAgent || disabledSet.has(mainAgent.name)) {
        return "";
      }

      // Collect available enabled subagents for orchestration
      const availableSubagents = allAgents.filter((a) => a.type === "subagent" && !disabledSet.has(a.name));

      const sections = [];
      sections.push(`# Google Antigravity Active Main Agent: ${mainAgent.name}`);
      sections.push(mainAgent.content);

      if (availableSubagents.length > 0) {
        sections.push("\n# Google Antigravity Subagents Directory");
        sections.push(
          "You can delegate specialized tasks to the following subagents using the `invoke_subagent` tool (or `subagent` / `spawn_teammate`). The subagent's instructions will be automatically added to its system prompt:"
        );
        for (const sub of availableSubagents) {
          sections.push(`- \`${sub.name}\` (${sub.displayPath}): ${sub.description}`);
        }
      }

      return sections.join("\n");
    }
  });

  // 2. Define invoke_subagent Tool
  const invokeSubagentTool = {
    name: "invoke_subagent",
    description:
      "Spawn and invoke a specialized subagent from .agents/agents/. The subagent's instructions are automatically added to the spawned subagent's system prompt.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "Unique name of the subagent to invoke (e.g. 'vogel-auditor', 'vogel-test', 'vogel-assets', 'vogel-qa')."
        },
        prompt: {
          type: "string",
          description: "Complete task instructions and context for the subagent."
        },
        description: {
          type: "string",
          description: "A short (3-5 word) description of the delegated task for display."
        },
        model: {
          type: "string",
          description: "Optional model override (e.g. 'flash' or 'pro'). Defaults to the subagent's configured model."
        }
      },
      required: ["name", "prompt"]
    },
    output: {
      schema: {
        type: "object",
        properties: {
          subagent: { type: "string" },
          status: { type: "string" },
          result: { type: "string" }
        }
      },
      render: (args, val) => [
        {
          type: "text",
          text: `[Subagent ${args?.name}]: ${typeof val === "string" ? val : JSON.stringify(val, null, 2)}`
        }
      ]
    },
    execute: async (args, exec) => {
      if (!args?.name || !args?.prompt) {
        throw new Error("invoke_subagent requires 'name' and 'prompt' arguments");
      }
      const subagentName = String(args.name).trim().replace(/^@/, "");
      const cwd = exec?.agent ? ctx.workingDirectory.get(exec.agent.session) : process.cwd();
      const { agentsDir } = findActiveAgentsDir(ctx, cwd, config.agentsDir);
      const allAgents = getAllAgents(ctx, cwd, config.agentsDir);
      const settings = loadSettings(agentsDir);
      const disabledSet = new Set(settings.disabledAgents || []);

      const matched = allAgents.find(
        (a) =>
          a.name.toLowerCase() === subagentName.toLowerCase() ||
          path.basename(a.fullPath, ".agent.md").toLowerCase() === subagentName.toLowerCase()
      );

      if (!matched) {
        const available = allAgents.map((a) => a.name).join(", ");
        throw new Error(
          `Subagent "${subagentName}" not found under ${config.agentsDir}. Available agents: ${available}`
        );
      }

      if (disabledSet.has(matched.name)) {
        throw new Error(`Subagent "${matched.name}" is currently disabled in settings.`);
      }

      const effectiveModel = args.model || matched.model || undefined;
      const effectiveDescription = args.description || `${matched.name}: ${matched.description.slice(0, 40)}`;

      // Prepare subagent prompt with full agent instructions
      const subagentPrompt = [
        `# Role: ${matched.name}`,
        matched.content,
        "---",
        "# Delegated Task:",
        args.prompt
      ].join("\n\n");

      // Delegate to standard DSH subagent or spawn_teammate tool if available
      const subagentTool = ctx.tools.get("subagent");
      if (subagentTool) {
        const result = await subagentTool.execute(
          {
            prompt: subagentPrompt,
            description: effectiveDescription,
            model: effectiveModel
          },
          exec
        );
        return result;
      }

      const spawnTeammateTool = ctx.tools.get("spawn_teammate");
      if (spawnTeammateTool) {
        const result = await spawnTeammateTool.execute(
          {
            name: matched.name,
            description: effectiveDescription,
            prompt: subagentPrompt,
            context: "fresh"
          },
          exec
        );
        return result;
      }

      return {
        subagent: matched.name,
        status: "invoked",
        result: `Subagent ${matched.name} dispatched with task: ${args.prompt.slice(0, 100)}...`
      };
    }
  };

  ctx.tools.register(invokeSubagentTool);

  // 3. Define antigravity_agent Tool
  const agentTool = {
    name: "antigravity_agent",
    description:
      "Discover, inspect, list, or read native Google Antigravity agents under .agents/agents. Call this tool to view agent capabilities and instructions.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Action to perform: 'list' to catalog all agents, or 'read' to read one agent's full specification.",
          enum: ["list", "read"]
        },
        name: {
          type: "string",
          description: "Agent name (e.g. 'vogel-planner', 'vogel-auditor'). Required for 'read' action."
        }
      }
    },
    output: {
      schema: {
        type: "object"
      },
      render: (args, val) => [
        {
          type: "text",
          text: JSON.stringify(val, null, 2)
        }
      ]
    },
    execute: async (args, exec) => {
      const cwd = exec?.agent ? ctx.workingDirectory.get(exec.agent.session) : process.cwd();
      const { agentsDir } = findActiveAgentsDir(ctx, cwd, config.agentsDir);
      const allAgents = getAllAgents(ctx, cwd, config.agentsDir);
      const settings = loadSettings(agentsDir);
      const disabledSet = new Set(settings.disabledAgents || []);

      const action = args?.action || (args?.name ? "read" : "list");

      if (action === "list") {
        return {
          action: "list",
          defaultMainAgent: settings.defaultMainAgent,
          agents: allAgents.map((a) => ({
            name: a.name,
            type: a.type,
            description: a.description,
            model: a.model,
            tools: a.tools,
            path: a.displayPath,
            enabled: !disabledSet.has(a.name)
          }))
        };
      }

      const agentName = String(args.name || "").trim().replace(/^@/, "");
      const matched = allAgents.find(
        (a) =>
          a.name.toLowerCase() === agentName.toLowerCase() ||
          path.basename(a.fullPath, ".agent.md").toLowerCase() === agentName.toLowerCase()
      );

      if (!matched) {
        const available = allAgents.map((a) => a.name).join(", ");
        throw new Error(`Agent "${agentName}" not found. Available agents: ${available}`);
      }

      return {
        action: "read",
        agent: {
          name: matched.name,
          type: matched.type,
          description: matched.description,
          model: matched.model,
          tools: matched.tools,
          path: matched.displayPath,
          enabled: !disabledSet.has(matched.name),
          instructions: matched.content
        }
      };
    }
  };

  ctx.tools.register(agentTool);

  // 4. Hook tools/pre-execute to augment standard subagent / spawn_teammate calls
  ctx.on("tools/pre-execute", async (exec, next) => {
    if (!exec || !exec.arguments || typeof exec.arguments !== "object") {
      return next();
    }

    if (exec.name === "subagent" || exec.name === "subagent_fork" || exec.name === "spawn_teammate") {
      const args = exec.arguments;
      const cwd = exec.agent ? ctx.workingDirectory.get(exec.agent.session) : process.cwd();
      const { agentsDir } = findActiveAgentsDir(ctx, cwd, config.agentsDir);
      const allAgents = getAllAgents(ctx, cwd, config.agentsDir);
      const settings = loadSettings(agentsDir);
      const disabledSet = new Set(settings.disabledAgents || []);

      // Check if target name or prompt matches an Antigravity subagent
      const matched = allAgents.find((a) => matchesSubagent(a, args));

      if (matched && !disabledSet.has(matched.name)) {
        // Prepend instructions if not already present
        if (!String(args.prompt || "").includes(matched.content.slice(0, 60))) {
          args.prompt = [
            `# Role Instructions (${matched.name}):`,
            matched.content,
            "---",
            args.prompt
          ].join("\n\n");
        }
      }
    }

    return next();
  });

  // 5. HTTP API Endpoints for Settings Tab & Session Selector UI
  if (ctx.webServer) {
    ctx.effect(
      () =>
        ctx.webServer.register({
          kind: "exact",
          path: "/api/antigravity-agents",
          handler: async (req, res) => {
            try {
              if (ctx.connection && typeof ctx.connection.requestRejection === "function") {
                const rejection = ctx.connection.requestRejection(req);
                if (rejection !== void 0) {
                  sendJson(res, rejection, { ok: false, error: rejection === 401 ? "Unauthorized" : "Forbidden" });
                  return;
                }
              }

              const urlObj = new URL(String(req.url), "http://localhost");
              const rawCwd = urlObj.searchParams.get("cwd");
              if (rawCwd && getApprovedWorkspace(ctx, rawCwd) !== path.resolve(rawCwd)) {
                sendJson(res, 400, { ok: false, error: "Invalid or unregistered workspace path" });
                return;
              }
              const approvedCwd = getApprovedWorkspace(ctx, rawCwd);
              const { agentsDir } = findActiveAgentsDir(ctx, approvedCwd, config.agentsDir);
              const allAgents = getAllAgents(ctx, approvedCwd, config.agentsDir);
              const settings = loadSettings(agentsDir);
              const disabledSet = new Set(settings.disabledAgents || []);

              if (req.method === "GET") {
                const agents = allAgents.map((a) => ({
                  name: a.name,
                  type: a.type,
                  description: a.description,
                  model: a.model,
                  tools: a.tools,
                  path: a.displayPath,
                  enabled: !disabledSet.has(a.name)
                }));
                sendJson(res, 200, {
                  ok: true,
                  agents,
                  defaultMainAgent: settings.defaultMainAgent,
                  disabledAgents: settings.disabledAgents
                });
                return;
              }

              if (req.method === "POST") {
                const contentType = req.headers["content-type"] || "";
                if (!contentType.includes("application/json")) {
                  sendJson(res, 415, { ok: false, error: "Unsupported Media Type: expected application/json" });
                  return;
                }
                const bodyText = await readBoundedBody(req);
                if (!bodyText) {
                  sendJson(res, 400, { ok: false, error: "Empty or oversized request body" });
                  return;
                }
                const data = JSON.parse(bodyText);

                // Update default main agent
                if (data.defaultMainAgent !== undefined) {
                  settings.defaultMainAgent = String(data.defaultMainAgent).trim();
                }

                // Toggle specific agent
                if (data.toggleAgent) {
                  const agentName = String(data.toggleAgent.name || "").trim();
                  const enabled = Boolean(data.toggleAgent.enabled);
                  const agent = allAgents.find((a) => a.name.toLowerCase() === agentName.toLowerCase());
                  if (!agent) {
                    sendJson(res, 404, { ok: false, error: `Agent "${agentName}" not found` });
                    return;
                  }
                  if (enabled) {
                    disabledSet.delete(agent.name);
                  } else {
                    disabledSet.add(agent.name);
                  }
                  settings.disabledAgents = Array.from(disabledSet);
                }

                // Replace disabledAgents array directly if supplied
                if (Array.isArray(data.disabledAgents)) {
                  settings.disabledAgents = data.disabledAgents.map(String);
                }

                saveSettings(agentsDir, settings);
                sendJson(res, 200, {
                  ok: true,
                  defaultMainAgent: settings.defaultMainAgent,
                  disabledAgents: settings.disabledAgents
                });
                return;
              }

              res.statusCode = 405;
              res.setHeader("allow", "GET, POST");
              res.end();
            } catch (err) {
              sendJson(res, 500, { ok: false, error: String(err?.message || err) });
            }
          }
        }),
      "antigravity-agents: /api/antigravity-agents"
    );

    // Session-specific agent selection API
    ctx.effect(
      () =>
        ctx.webServer.register({
          kind: "exact",
          path: "/api/antigravity-agents/session",
          handler: async (req, res) => {
            try {
              if (ctx.connection && typeof ctx.connection.requestRejection === "function") {
                const rejection = ctx.connection.requestRejection(req);
                if (rejection !== void 0) {
                  sendJson(res, rejection, { ok: false, error: rejection === 401 ? "Unauthorized" : "Forbidden" });
                  return;
                }
              }

              const urlObj = new URL(String(req.url), "http://localhost");
              const sessionId = urlObj.searchParams.get("sessionId");
              const rawCwd = urlObj.searchParams.get("cwd");
              if (rawCwd && getApprovedWorkspace(ctx, rawCwd) !== path.resolve(rawCwd)) {
                sendJson(res, 400, { ok: false, error: "Invalid or unregistered workspace path" });
                return;
              }
              const approvedCwd = getApprovedWorkspace(ctx, rawCwd);
              const { agentsDir } = findActiveAgentsDir(ctx, approvedCwd, config.agentsDir);
              const settings = loadSettings(agentsDir);

              if (req.method === "GET") {
                const current = sessionId && sessionMainAgentMap.has(sessionId)
                  ? sessionMainAgentMap.get(sessionId)
                  : settings.defaultMainAgent || "default";
                sendJson(res, 200, { ok: true, sessionId, mainAgent: current });
                return;
              }

              if (req.method === "POST") {
                const contentType = req.headers["content-type"] || "";
                if (!contentType.includes("application/json")) {
                  sendJson(res, 415, { ok: false, error: "Unsupported Media Type: expected application/json" });
                  return;
                }
                const bodyText = await readBoundedBody(req);
                if (!bodyText) {
                  sendJson(res, 400, { ok: false, error: "Empty request body" });
                  return;
                }
                const data = JSON.parse(bodyText);
                const targetSessionId = data.sessionId || sessionId;
                const agentName = String(data.mainAgent || "default").trim();

                if (targetSessionId) {
                  sessionMainAgentMap.set(targetSessionId, agentName);
                }

                sendJson(res, 200, { ok: true, sessionId: targetSessionId, mainAgent: agentName });
                return;
              }

              res.statusCode = 405;
              res.setHeader("allow", "GET, POST");
              res.end();
            } catch (err) {
              sendJson(res, 500, { ok: false, error: String(err?.message || err) });
            }
          }
        }),
      "antigravity-agents: /api/antigravity-agents/session"
    );
  }
}
