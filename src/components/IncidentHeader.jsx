'use client';

export default function IncidentHeader({ statusData, onTriggerOutage, onStartAgent, isRunning }) {
  const metrics = statusData?.metrics?.metrics || {};
  const isDegraded = statusData?.metrics?.status === "DEGRADED";
  const agentState = statusData?.agent_state || "IDLE";

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>ForgeOps Sentinel</h1>
            <span className="badge badge-blue">TrueForge Harness v0.1.4</span>
            {isDegraded ? (
              <span className="badge badge-red">🚨 500 Outage Active</span>
            ) : (
              <span className="badge badge-green">✅ Systems Operational</span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Autonomous Production Incident Triage & Human-in-the-Loop Remediation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-danger" 
            onClick={onTriggerOutage}
            disabled={isRunning}
          >
            🔥 Trigger Prod Outage
          </button>
          <button 
            className="btn-primary" 
            onClick={onStartAgent}
            disabled={isRunning || agentState !== "IDLE"}
          >
            🤖 Start Agent Triage
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>SERVICE VERSION</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
            {statusData?.service_version || "1.0.0"}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>ERROR RATE</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: isDegraded ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {metrics.error_rate_pct !== undefined ? `${metrics.error_rate_pct}%` : "0.00%"}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>LATENCY (p95)</div>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {metrics.p95_latency_ms ? `${metrics.p95_latency_ms}ms` : "--"}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>HARNESS STATE</div>
          <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
            {agentState}
          </div>
        </div>
      </div>
    </div>
  );
}
