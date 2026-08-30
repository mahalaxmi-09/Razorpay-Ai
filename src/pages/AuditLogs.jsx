import React, { useState, useEffect } from 'react';
import AuditTable from '../components/AuditTable';
import { api } from '../lib/api';

export default function AuditLogs({ currency }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch audit logs dynamically on mount
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs feed:', err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-navy-dark leading-none select-none">Audit Logs</h2>
        <p className="text-xs md:text-sm text-secondary-text mt-1">
          Historical record of all AI reconciliations, guardrail checkpoints, and capture matches.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-secondary-text text-xs">
          Loading audit trail records...
        </div>
      ) : (
        <AuditTable logs={logs} currency={currency} />
      )}
    </div>
  );
}
