'use client';

import { useState, useEffect } from 'react';
import IncidentHeader from '../components/IncidentHeader';
import AgentStream from '../components/AgentStream';
import ApprovalModal from '../components/ApprovalModal';

export default function Home() {
  const [statusData, setStatusData] = useState(null);
  const [events, setEvents] = useState([]);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch status polling
  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (data.pending_approval) {
          setPendingApproval(data.pending_approval);
        }
      }
    } catch (err) {
      console.log('Status fetch error:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    // Connect to SSE Live Stream
    const eventSource = new EventSource('http://localhost:4000/api/stream');

    eventSource.onmessage = (event) => {
      const evt = JSON.parse(event.data);
      setEvents((prev) => [...prev, evt]);

      if (evt.type === 'TOOL_APPROVAL_REQUIRED') {
        setPendingApproval(evt.approval);
      } else if (evt.type === 'INCIDENT_RESOLVED' || evt.type === 'APPROVAL_REJECTED') {
        setPendingApproval(null);
        setIsRunning(false);
        fetchStatus();
      }
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, []);

  const handleTriggerOutage = async () => {
    setEvents([]);
    setPendingApproval(null);
    await fetch('http://localhost:4000/api/trigger-incident', { method: 'POST' });
    fetchStatus();
  };

  const handleStartAgent = async () => {
    setIsRunning(true);
    setEvents([]);
    await fetch('http://localhost:4000/api/start-investigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Checkout service is unhealthy. Investigate and resolve the incident.' })
    });
  };

  const handleApproval = async (approvalId, decision) => {
    await fetch('http://localhost:4000/api/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalId, decision })
    });
    setPendingApproval(null);
    fetchStatus();
  };

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      <IncidentHeader
        statusData={statusData}
        onTriggerOutage={handleTriggerOutage}
        onStartAgent={handleStartAgent}
        isRunning={isRunning}
      />

      <AgentStream events={events} />

      <ApprovalModal
        approval={pendingApproval}
        onApprove={(id) => handleApproval(id, 'APPROVE')}
        onReject={(id) => handleApproval(id, 'REJECT')}
      />
    </main>
  );
}
