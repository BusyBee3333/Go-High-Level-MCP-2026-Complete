/**
 * App.tsx — Root component for the MCP UI Kit React app.
 *
 * Uses useApp from ext-apps/react to connect to the MCP host.
 * Receives UI trees via ontoolresult and renders them via UITreeRenderer.
 *
 * HYBRID INTERACTIVITY: Uses mergeUITrees to preserve local component state
 * across tool result updates. Wraps with ChangeTrackerProvider for shared
 * change tracking across all interactive components.
 */
import React, { useState, useEffect } from "react";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MCPAppProvider } from "./context/MCPAppContext.js";
import { ChangeTrackerProvider } from "./context/ChangeTrackerContext.js";
import { UITreeRenderer } from "./renderer/UITreeRenderer.js";
import { ToastProvider } from "./components/shared/Toast.js";
import { SaveIndicator } from "./components/shared/SaveIndicator.js";
import { mergeUITrees } from "./utils/mergeUITrees.js";
import type { UITree } from "./types.js";
import "./styles/base.css";
import "./styles/interactive.css";
import "./styles/premium.css";

// ─── Parse UI Tree from tool result ─────────────────────────

function extractUITree(result: CallToolResult): UITree | null {
  // 1. Check structuredContent first — this is where generateDynamicView puts the uiTree
  const sc = (result as any).structuredContent;
  if (sc) {
    if (sc.uiTree && sc.uiTree.root && sc.uiTree.elements) {
      return sc.uiTree as UITree;
    }
    // structuredContent might BE the tree directly
    if (sc.root && sc.elements) {
      return sc as UITree;
    }
  }

  // 2. Check content array for JSON text containing a UI tree
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text") {
        try {
          const parsed = JSON.parse(item.text);
          if (parsed && parsed.root && parsed.elements) {
            return parsed as UITree;
          }
          // Might be wrapped: { uiTree: { root, elements } }
          if (parsed?.uiTree?.root && parsed?.uiTree?.elements) {
            return parsed.uiTree as UITree;
          }
        } catch {
          // Not JSON — skip
        }
      }
    }
  }

  return null;
}

/** Check for server-injected data via window.__MCP_APP_DATA__ */
function getPreInjectedTree(): UITree | null {
  try {
    const data = (window as any).__MCP_APP_DATA__;
    if (!data) return null;
    if (data.uiTree?.root && data.uiTree?.elements) return data.uiTree as UITree;
    if (data.root && data.elements) return data as UITree;
  } catch { /* ignore */ }
  return null;
}

// ─── Main App ───────────────────────────────────────────────

export function App() {
  const [uiTree, setUITree] = useState<UITree | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();
  const [toolInput, setToolInput] = useState<string | null>(null);

  // Check for pre-injected data (server injects via window.__MCP_APP_DATA__)
  useEffect(() => {
    const preInjected = getPreInjectedTree();
    if (preInjected && !uiTree) {
      console.info("[MCPApp] Found pre-injected UI tree");
      setUITree(preInjected);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { app, isConnected, error } = useApp({
    appInfo: { name: "MCP UI Kit", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        console.info("[MCPApp] Tool result received:", result);
        const newTree = extractUITree(result);
        if (newTree) {
          // CRITICAL FIX: Merge trees instead of replacing.
          // This preserves React component state (form inputs, drag state, etc.)
          // by keeping exact old references for unchanged elements.
          setUITree((prevTree) => {
            if (!prevTree) return newTree;
            return mergeUITrees(prevTree, newTree);
          });
          setToolInput(null);
        }
      };

      app.ontoolinput = async (input) => {
        console.info("[MCPApp] Tool input received:", input);
        setToolInput("Loading view...");
      };

      app.ontoolcancelled = (params) => {
        console.info("[MCPApp] Tool cancelled:", params.reason);
        setToolInput(null);
      };

      app.onerror = (err) => {
        console.error("[MCPApp] Error:", err);
      };

      app.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
    },
  });

  useEffect(() => {
    if (app) {
      setHostContext(app.getHostContext());
    }
  }, [app]);

  // Error state
  if (error) {
    return (
      <div className="error-state">
        <h3>Connection Error</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  // Connecting state
  if (!isConnected || !app) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Connecting to host...</p>
      </div>
    );
  }

  const safeAreaStyle = {
    paddingTop: hostContext?.safeAreaInsets?.top,
    paddingRight: hostContext?.safeAreaInsets?.right,
    paddingBottom: hostContext?.safeAreaInsets?.bottom,
    paddingLeft: hostContext?.safeAreaInsets?.left,
  };

  // Tool call in progress (no tree yet)
  if (toolInput && !uiTree) {
    return (
      <MCPAppProvider app={app}>
        <ChangeTrackerProvider>
          <ToastProvider>
            <div id="app" style={safeAreaStyle}>
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>{toolInput}</p>
              </div>
            </div>
          </ToastProvider>
        </ChangeTrackerProvider>
      </MCPAppProvider>
    );
  }

  // Waiting for first tool result
  if (!uiTree) {
    return (
      <MCPAppProvider app={app}>
        <ChangeTrackerProvider>
          <ToastProvider>
            <div id="app" style={safeAreaStyle}>
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Waiting for data...</p>
              </div>
            </div>
          </ToastProvider>
        </ChangeTrackerProvider>
      </MCPAppProvider>
    );
  }

  // Render the UI tree
  return (
    <MCPAppProvider app={app}>
      <ChangeTrackerProvider>
        <ToastProvider>
          <div id="app" style={safeAreaStyle}>
            <UITreeRenderer tree={uiTree} />
            <SaveIndicator />
          </div>
        </ToastProvider>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}
