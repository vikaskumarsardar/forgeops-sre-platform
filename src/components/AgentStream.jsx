'use client';

import { EVENT_TYPES } from '@/core/constants';

export default function AgentStream({ events }) {
  const displayableEvents = events.filter(e => e.type !== EVENT_TYPES.CONNECTED || e.message);

  return (
    <div className="glass-card" style={{ padding: '24px', minHeight: '420px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🧠 Agent Investigation & Tool Stream
        </h2>
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {displayableEvents.length} Events Logged
        </span>
      </div>

      {displayableEvents.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '1rem', marginBottom: '8px' }}>No active investigation.</p>
          <p style={{ fontSize: '0.85rem' }}>Click <strong>"Start Agent Triage"</strong> to trigger the TrueForge Agent loop.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayableEvents.map((evt, idx) => (
            <div key={idx} style={{ 
              background: 'rgba(255,255,255,0.02)', 
              borderLeft: evt.type === EVENT_TYPES.AGENT_THOUGHT ? '3px solid var(--accent-purple)' :
                          evt.type === EVENT_TYPES.TOOL_CALL_COMPLETED ? '3px solid var(--accent-green)' :
                          evt.type === EVENT_TYPES.TOOL_APPROVAL_REQUIRED ? '3px solid var(--accent-amber)' :
                          evt.type === EVENT_TYPES.SESSION_STARTED ? '3px solid var(--accent-blue)' : '3px solid var(--border-card)',
              padding: '14px 18px',
              borderRadius: '0 12px 12px 0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                  {evt.type}
                </span>
                <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {new Date(evt.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>

              {evt.message && (
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  {evt.message}
                </p>
              )}

              {evt.instruction && (
                <p style={{ fontSize: '0.925rem', color: '#e2e8f0', lineHeight: 1.5, fontWeight: 500 }}>
                  🚨 {evt.instruction}
                </p>
              )}

              {evt.thought && (
                <p style={{ fontSize: '0.925rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {evt.thought}
                </p>
              )}

              {(evt.tool || evt.proposedTool) && (
                <div className="mono" style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', marginTop: '6px' }}>
                  <span style={{ color: 'var(--accent-amber)' }}>tool_call:</span> {evt.tool || evt.proposedTool}({JSON.stringify(evt.args || evt.toolArgs || {})})
                </div>
              )}

              {evt.result && (
                <pre className="mono" style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '6px', marginTop: '6px', overflowX: 'auto', color: '#34d399' }}>
                  {JSON.stringify(evt.result, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
