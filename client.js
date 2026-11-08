window.__ModuleLoader__.load({
  id: "dsh-plugin-antigravity-agents",
  factory(require) {
    const React = require("react");
    const h = React.createElement;
    const { useState, useEffect, useCallback, useMemo } = React;

    const CSS_STYLES = `
      .aga-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        color: var(--dsw-alias-label-primary, #ffffff);
        font-family: inherit;
        padding: 4px 0;
      }
      .aga-header {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.1));
      }
      .aga-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: var(--dsw-alias-label-primary, #ffffff);
      }
      .aga-subtitle {
        font-size: 13px;
        color: var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6));
        margin: 0;
        line-height: 1.4;
      }
      .aga-card {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.04));
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.1));
        border-radius: 8px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .aga-card-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .aga-card-label {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .aga-card-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--dsw-alias-label-primary, #ffffff);
      }
      .aga-card-desc {
        font-size: 12px;
        color: var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.5));
      }
      .aga-select {
        height: 32px;
        padding: 0 12px;
        background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.08));
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.2));
        border-radius: 6px;
        color: var(--dsw-alias-label-primary, #ffffff);
        font-size: 13px;
        outline: none;
        cursor: pointer;
        min-width: 220px;
      }
      .aga-select:focus {
        border-color: var(--dsw-alias-brand-primary, #247bbf);
      }
      .aga-select option {
        background: #1e1e1e;
        color: #ffffff;
      }
      .aga-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
      }
      .aga-search-input {
        flex: 1;
        min-width: 200px;
        height: 32px;
        padding: 0 10px;
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.05));
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.15));
        border-radius: 6px;
        color: var(--dsw-alias-label-primary, #ffffff);
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s;
      }
      .aga-search-input:focus {
        border-color: var(--dsw-alias-brand-primary, #247bbf);
      }
      .aga-filter-group {
        display: flex;
        gap: 6px;
      }
      .aga-filter-btn {
        height: 28px;
        padding: 0 10px;
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.15));
        background: transparent;
        color: var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.7));
        cursor: pointer;
        transition: all 0.2s;
      }
      .aga-filter-btn:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.08));
        color: var(--dsw-alias-label-primary, #ffffff);
      }
      .aga-filter-btn.active {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.15));
        color: var(--dsw-alias-label-primary, #ffffff);
        border-color: var(--dsw-alias-brand-primary, #247bbf);
        font-weight: 500;
      }
      .aga-stats {
        font-size: 12px;
        color: var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6));
        display: flex;
        gap: 12px;
      }
      .aga-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 520px;
        overflow-y: auto;
        padding-right: 4px;
      }
      .aga-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
        border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
        border-radius: 6px;
        transition: all 0.2s;
        gap: 12px;
        position: relative;
      }
      .aga-item:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.06));
        border-color: var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.16));
      }
      .aga-item.disabled {
        opacity: 0.6;
      }
      .aga-item-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        min-width: 0;
      }
      .aga-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .aga-status-dot.enabled {
        background-color: #52c41a;
        box-shadow: 0 0 6px rgba(82, 196, 26, 0.4);
      }
      .aga-status-dot.disabled {
        background-color: #595959;
      }
      .aga-item-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        flex: 1;
      }
      .aga-item-header {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .aga-item-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--dsw-alias-label-primary, #ffffff);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .aga-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .aga-badge.main {
        background: rgba(36, 123, 191, 0.25);
        color: #58a6ff;
        border: 1px solid rgba(36, 123, 191, 0.4);
      }
      .aga-badge.subagent {
        background: rgba(163, 113, 247, 0.2);
        color: #d2a8ff;
        border: 1px solid rgba(163, 113, 247, 0.4);
      }
      .aga-badge.model {
        background: rgba(255, 255, 255, 0.08);
        color: var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.7));
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .aga-item-desc {
        font-size: 12px;
        color: var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: help;
        position: relative;
      }
      .aga-item-desc:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: calc(100% + 6px);
        left: 0;
        z-index: 1000;
        background: #18181b;
        color: #f4f4f5;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        line-height: 1.4;
        white-space: normal;
        max-width: 380px;
        min-width: 220px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.15);
        pointer-events: none;
      }
      .aga-item-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }
      .aga-toggle-label {
        font-size: 12px;
        color: var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.5));
      }
      .aga-toggle-label.enabled {
        color: #52c41a;
      }
      .aga-switch {
        position: relative;
        display: inline-block;
        width: 36px;
        height: 20px;
      }
      .aga-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .aga-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.2);
        transition: 0.3s;
        border-radius: 20px;
      }
      .aga-slider:before {
        position: absolute;
        content: "";
        height: 14px;
        width: 14px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }
      input:checked + .aga-slider {
        background-color: var(--dsw-alias-brand-primary, #247bbf);
      }
      input:checked + .aga-slider:before {
        transform: translateX(16px);
      }
      input:disabled + .aga-slider {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* Session Selector styles */
      .aga-session-picker {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: none;
        border-radius: 6px;
        padding: 0 8px;
        font-size: 13px;
        color: var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6));
        height: 32px;
      }
      .aga-session-picker:hover {
        color: var(--dsw-alias-label-primary, #ffffff);
      }
      .aga-session-picker-select {
        background: transparent;
        border: none;
        color: inherit;
        font-size: 13px;
        outline: none;
        cursor: pointer;
        padding-right: 16px;
      }
      .aga-session-picker-select option {
        background: #1e1e1e;
        color: #ffffff;
      }
    `;

    function injectStylesOnce() {
      if (!document.getElementById("antigravity-agents-styles")) {
        const style = document.createElement("style");
        style.id = "antigravity-agents-styles";
        style.textContent = CSS_STYLES;
        document.head.appendChild(style);
      }
    }

    // Icon for settings navigation
    function AgentsSectionIcon() {
      return h(
        "svg",
        {
          viewBox: "0 0 24 24",
          width: 16,
          height: 16,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": true
        },
        h("circle", { cx: 12, cy: 7, r: 4 }),
        h("circle", { cx: 4, cy: 19, r: 2.5 }),
        h("circle", { cx: 20, cy: 19, r: 2.5 }),
        h("circle", { cx: 12, cy: 19, r: 2.5 }),
        h("line", { x1: 12, y1: 11, x2: 12, y2: 16.5 }),
        h("line", { x1: 9, y1: 10, x2: 5.5, y2: 17 }),
        h("line", { x1: 15, y1: 10, x2: 18.5, y2: 17 })
      );
    }

    // Main Settings Section Component
    function AgentsSettingsSection() {
      useEffect(() => {
        injectStylesOnce();
      }, []);

      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const [agents, setAgents] = useState([]);
      const [defaultMainAgent, setDefaultMainAgent] = useState("default");
      const [searchQuery, setSearchQuery] = useState("");
      const [filter, setFilter] = useState("all"); // 'all', 'main', 'subagent', 'enabled', 'disabled'
      const [pendingToggles, setPendingToggles] = useState(new Set());

      const fetchAgents = useCallback(async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await fetch("/api/antigravity-agents");
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
          const data = await res.json();
          if (data.ok) {
            setAgents(data.agents || []);
            setDefaultMainAgent(data.defaultMainAgent || "default");
          } else {
            throw new Error(data.error || "Failed to load agents");
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }, []);

      useEffect(() => {
        fetchAgents();
      }, [fetchAgents]);

      const handleDefaultAgentChange = async (e) => {
        const nextDefault = e.target.value;
        setDefaultMainAgent(nextDefault);
        try {
          const res = await fetch("/api/antigravity-agents", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ defaultMainAgent: nextDefault })
          });
          if (!res.ok) throw new Error("Failed to save default agent preference");
        } catch (err) {
          setError(err.message);
          fetchAgents();
        }
      };

      const handleToggle = async (agent) => {
        const nextEnabled = !agent.enabled;
        setPendingToggles((prev) => new Set(prev).add(agent.name));

        // Optimistic UI update
        setAgents((prev) =>
          prev.map((a) => (a.name === agent.name ? { ...a, enabled: nextEnabled } : a))
        );

        try {
          const res = await fetch("/api/antigravity-agents", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              toggleAgent: { name: agent.name, enabled: nextEnabled }
            })
          });
          if (!res.ok) throw new Error("Failed to toggle agent");
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || "Toggle failed");
        } catch (err) {
          setError(err.message);
          fetchAgents(); // Rollback
        } finally {
          setPendingToggles((prev) => {
            const next = new Set(prev);
            next.delete(agent.name);
            return next;
          });
        }
      };

      const filteredAgents = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return agents.filter((a) => {
          if (filter === "main" && a.type !== "main") return false;
          if (filter === "subagent" && a.type !== "subagent") return false;
          if (filter === "enabled" && !a.enabled) return false;
          if (filter === "disabled" && a.enabled) return false;

          if (q) {
            const nameMatch = a.name.toLowerCase().includes(q);
            const descMatch = (a.description || "").toLowerCase().includes(q);
            if (!nameMatch && !descMatch) return false;
          }
          return true;
        });
      }, [agents, searchQuery, filter]);

      const mainAgents = useMemo(() => agents.filter((a) => a.type === "main"), [agents]);
      const subAgents = useMemo(() => agents.filter((a) => a.type === "subagent"), [agents]);
      const enabledCount = useMemo(() => agents.filter((a) => a.enabled).length, [agents]);

      return h(
        "div",
        { className: "aga-container" },
        h(
          "div",
          { className: "aga-header" },
          h("h2", { className: "aga-title" }, "Google Antigravity Agents"),
          h(
            "p",
            { className: "aga-subtitle" },
            "Native agent specifications discovered in .agents/agents. Select your default main coordinator and manage individual agent availability without altering agent files."
          )
        ),

        // Default Main Agent Configuration Card
        h(
          "div",
          { className: "aga-card" },
          h(
            "div",
            { className: "aga-card-row" },
            h(
              "div",
              { className: "aga-card-label" },
              h("div", { className: "aga-card-title" }, "Default Main Agent"),
              h(
                "div",
                { className: "aga-card-desc" },
                "Automatically pre-selected for all new sessions. Select 'Default Agent' to use standard DSH behavior."
              )
            ),
            h(
              "select",
              {
                className: "aga-select",
                value: defaultMainAgent,
                onChange: handleDefaultAgentChange
              },
              h("option", { value: "default" }, "Default Agent (Standard DSH Prompt)"),
              mainAgents.map((a) =>
                h(
                  "option",
                  { key: a.name, value: a.name, disabled: !a.enabled },
                  `${a.name} (Main Agent${!a.enabled ? " - Disabled" : ""})`
                )
              )
            )
          )
        ),

        // Toolbar
        h(
          "div",
          { className: "aga-toolbar" },
          h("input", {
            type: "text",
            className: "aga-search-input",
            placeholder: "Search agents by name or description...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value)
          }),
          h(
            "div",
            { className: "aga-filter-group" },
            h(
              "button",
              {
                className: `aga-filter-btn ${filter === "all" ? "active" : ""}`,
                onClick: () => setFilter("all")
              },
              `All (${agents.length})`
            ),
            h(
              "button",
              {
                className: `aga-filter-btn ${filter === "main" ? "active" : ""}`,
                onClick: () => setFilter("main")
              },
              `Main (${mainAgents.length})`
            ),
            h(
              "button",
              {
                className: `aga-filter-btn ${filter === "subagent" ? "active" : ""}`,
                onClick: () => setFilter("subagent")
              },
              `Subagents (${subAgents.length})`
            ),
            h(
              "button",
              {
                className: `aga-filter-btn ${filter === "enabled" ? "active" : ""}`,
                onClick: () => setFilter("enabled")
              },
              `Enabled (${enabledCount})`
            ),
            h(
              "button",
              {
                className: `aga-filter-btn ${filter === "disabled" ? "active" : ""}`,
                onClick: () => setFilter("disabled")
              },
              `Disabled (${agents.length - enabledCount})`
            )
          )
        ),

        // Error message if any
        error &&
          h(
            "div",
            {
              style: {
                color: "#ff4d4f",
                background: "rgba(255, 77, 79, 0.1)",
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "13px"
              }
            },
            error
          ),

        // Agents List
        h(
          "div",
          { className: "aga-list" },
          loading
            ? h("div", { style: { padding: "16px", textAlign: "center", opacity: 0.6 } }, "Loading agents...")
            : filteredAgents.length === 0
            ? h(
                "div",
                { style: { padding: "16px", textAlign: "center", opacity: 0.6 } },
                "No matching agents discovered."
              )
            : filteredAgents.map((agent) => {
                const isPending = pendingToggles.has(agent.name);
                return h(
                  "div",
                  {
                    key: agent.name,
                    className: `aga-item ${agent.enabled ? "enabled" : "disabled"}`
                  },
                  h(
                    "div",
                    { className: "aga-item-left" },
                    h("span", {
                      className: `aga-status-dot ${agent.enabled ? "enabled" : "disabled"}`
                    }),
                    h(
                      "div",
                      { className: "aga-item-details" },
                      h(
                        "div",
                        { className: "aga-item-header" },
                        h("span", { className: "aga-item-name" }, agent.name),
                        h(
                          "span",
                          { className: `aga-badge ${agent.type}` },
                          agent.type === "main" ? "Main Agent" : "Subagent"
                        ),
                        agent.model &&
                          h("span", { className: "aga-badge model" }, agent.model)
                      ),
                      h(
                        "div",
                        {
                          className: "aga-item-desc",
                          "data-tooltip": agent.description || "No description provided.",
                          title: agent.description || ""
                        },
                        agent.description || "No description provided."
                      )
                    )
                  ),
                  h(
                    "div",
                    { className: "aga-item-right" },
                    h(
                      "span",
                      {
                        className: `aga-toggle-label ${agent.enabled ? "enabled" : "disabled"}`
                      },
                      agent.enabled ? "Enabled" : "Disabled"
                    ),
                    h(
                      "label",
                      {
                        className: "aga-switch",
                        title: agent.enabled ? "Click to disable agent" : "Click to enable agent"
                      },
                      h("input", {
                        type: "checkbox",
                        checked: agent.enabled,
                        disabled: isPending,
                        onChange: () => handleToggle(agent)
                      }),
                      h("span", { className: "aga-slider" })
                    )
                  )
                );
              })
        )
      );
    }

    // New Session Agent Picker Component (rendered in conversation.hero.options and conversation.input.left)
    function SessionAgentPicker(props) {
      const sessionId = props.sessionId;
      const [selectedAgent, setSelectedAgent] = useState("default");
      const [mainAgents, setMainAgents] = useState([]);

      useEffect(() => {
        injectStylesOnce();
      }, []);

      const fetchSessionAgent = useCallback(async () => {
        try {
          const agentsRes = await fetch("/api/antigravity-agents");
          if (agentsRes.ok) {
            const data = await agentsRes.json();
            if (data.ok) {
              const enabledMains = (data.agents || []).filter((a) => a.type === "main" && a.enabled);
              setMainAgents(enabledMains);
              const defaultAgent = data.defaultMainAgent || "default";

              if (sessionId) {
                const sRes = await fetch(`/api/antigravity-agents/session?sessionId=${sessionId}`);
                if (sRes.ok) {
                  const sData = await sRes.json();
                  setSelectedAgent(sData.mainAgent || defaultAgent);
                  return;
                }
              }
              setSelectedAgent(defaultAgent);
            }
          }
        } catch {}
      }, [sessionId]);

      useEffect(() => {
        fetchSessionAgent();
      }, [fetchSessionAgent]);

      const handleChange = async (e) => {
        const next = e.target.value;
        setSelectedAgent(next);
        try {
          await fetch("/api/antigravity-agents/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sessionId, mainAgent: next })
          });
        } catch {}
      };

      return h(
        "div",
        {
          className: "aga-session-picker",
          title: "Select active Google Antigravity main agent for this session"
        },
        h(
          "svg",
          {
            viewBox: "0 0 24 24",
            width: 14,
            height: 14,
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 2,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            style: { opacity: 0.8, flexShrink: 0 }
          },
          h("circle", { cx: 12, cy: 7, r: 4 }),
          h("circle", { cx: 4, cy: 19, r: 2.5 }),
          h("circle", { cx: 20, cy: 19, r: 2.5 })
        ),
        h(
          "select",
          {
            className: "aga-session-picker-select",
            value: selectedAgent,
            onChange: handleChange
          },
          h("option", { value: "default" }, "Default Agent"),
          mainAgents.map((a) =>
            h("option", { key: a.name, value: a.name }, a.name)
          )
        )
      );
    }

    return {
      inject: ["slots"],
      apply(ctx) {
        // Register Settings Section Tab
        ctx.slots.inject("settings.section", () =>
          ctx.slots.register(
            {
              name: "settings.section",
              id: "antigravity-agents",
              order: 26,
              label: "Agents"
            },
            AgentsSettingsSection
          )
        );

        // Register Settings Section Icon
        ctx.slots.inject("settings.section.icon", () =>
          ctx.slots.register(
            {
              name: "settings.section.icon",
              id: "antigravity-agents",
              order: 26
            },
            AgentsSectionIcon
          )
        );

        // Register in Composer Toolbar Left
        ctx.slots.inject("conversation.input.left", () =>
          ctx.slots.register(
            {
              name: "conversation.input.left",
              id: "antigravity-agent-picker",
              order: 15,
              label: "Agent"
            },
            SessionAgentPicker
          )
        );
      }
    };
  }
});
