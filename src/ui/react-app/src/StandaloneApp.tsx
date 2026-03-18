/**
 * StandaloneApp.tsx — Standalone renderer for embedding UITrees in iframes.
 * 
 * Unlike App.tsx, this does NOT require an MCP host connection.
 * It renders UITrees received via:
 *   1. window.__MCP_APP_DATA__ (pre-injected by server)
 *   2. postMessage({ type: 'MCP_UITREE', uiTree: {...} })
 */
import React, { useState, useEffect } from "react";
import { UITreeRenderer } from "./renderer/UITreeRenderer.js";
import type { UITree } from "./types.js";
import "./styles/base.css";
import "./styles/interactive.css";
import "./styles/premium.css";

function getPreInjectedTree(): UITree | null {
  try {
    const data = (window as any).__MCP_APP_DATA__;
    if (!data) return null;
    if (data.uiTree?.root && data.uiTree?.elements) return data.uiTree as UITree;
    if (data.root && data.elements) return data as UITree;
  } catch { /* ignore */ }
  return null;
}

export function StandaloneApp() {
  const [uiTree, setUITree] = useState<UITree | null>(getPreInjectedTree);

  // Listen for postMessage from parent window
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data) return;
      
      // Accept { type: 'MCP_UITREE', uiTree: {...} }
      if (data.type === 'MCP_UITREE') {
        const tree = data.uiTree;
        if (tree?.root && tree?.elements) {
          setUITree(tree);
          // Notify parent that we rendered
          window.parent.postMessage({ type: 'MCP_UITREE_RENDERED', success: true }, '*');
        }
        return;
      }
      
      // Also accept raw UITree directly
      if (data.root && data.elements) {
        setUITree(data as UITree);
        window.parent.postMessage({ type: 'MCP_UITREE_RENDERED', success: true }, '*');
      }
    }

    window.addEventListener('message', handleMessage);
    
    // Notify parent we're ready
    window.parent.postMessage({ type: 'MCP_UITREE_READY' }, '*');
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-resize to content height
  useEffect(() => {
    if (!uiTree) return;
    const observer = new ResizeObserver(() => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'MCP_UITREE_RESIZE', height }, '*');
    });
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [uiTree]);

  if (!uiTree) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#6b7280',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, margin: '0 auto 12px',
            border: '3px solid #e5e7eb', borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ fontSize: 14 }}>Waiting for UI data...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div id="standalone-app" style={{ padding: 0, margin: 0 }}>
      <UITreeRenderer tree={uiTree} />
    </div>
  );
}
