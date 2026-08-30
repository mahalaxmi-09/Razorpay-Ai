import React from 'react';

export default function StatusBadge({ status }) {
  
  const getBadgeStyle = (statusName) => {
    const s = statusName?.toLowerCase() || '';

    // Success / Recovered / Resolved / Passed
    if (s.includes('recover') || s.includes('resolve') || s.includes('settled') || s.includes('passed') || s.includes('success')) {
      return 'bg-success-green/10 text-success-green border border-success-green/20';
    }
    
    // Warning / Pending / Monitoring / Sent
    if (s.includes('pending') || s.includes('monitor') || s.includes('sent') || s.includes('active') || s.includes('warning')) {
      return 'bg-warning-amber/10 text-warning-amber border border-warning-amber/20';
    }

    // Critical / Failed / Mismatch / Escalated
    if (s.includes('fail') || s.includes('escalat') || s.includes('missing') || s.includes('error') || s.includes('critical')) {
      return 'bg-error-red/10 text-error-red border border-error-red/20';
    }

    return 'bg-secondary-text/10 text-secondary-text border border-secondary-text/20';
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getBadgeStyle(status)}`}>
      {status}
    </span>
  );
}
