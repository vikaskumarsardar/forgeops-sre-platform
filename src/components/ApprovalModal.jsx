'use client';

export default function ApprovalModal({ approval, onApprove, onReject }) {
  if (!approval) return null;

  const { approvalId, toolName, toolArgs, thought } = approval;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '680px',
        width: '100%',
        padding: '32px',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        boxShadow: '0 0 50px rgba(245, 158, 11, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '1.8rem' }}>⚠️</span>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
              HUMAN APPROVAL REQUIRED (TrueForge HITL Gate)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Agent is requesting permission to execute production remediation tool: <strong className="mono" style={{ color: 'var(--accent-blue)' }}>{toolName}</strong>
            </p>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
            Justification & Root Cause
          </div>
          <p style={{ fontSize: '0.925rem', lineHeight: 1.5, color: '#f1f5f9' }}>
            {toolArgs?.reasoning || thought}
          </p>
        </div>

        {toolArgs?.code_patch && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>
              Proposed Code Patch Diff
            </div>
            <pre className="mono" style={{
              background: '#0d1117',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#34d399',
              whiteSpace: 'pre-wrap',
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              {toolArgs.code_patch}
            </pre>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button 
            className="btn-danger" 
            onClick={() => onReject(approvalId)}
          >
            ❌ Reject Action
          </button>
          <button 
            className="btn-primary" 
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            onClick={() => onApprove(approvalId)}
          >
            ✅ Approve & Deploy Fix
          </button>
        </div>
      </div>
    </div>
  );
}
