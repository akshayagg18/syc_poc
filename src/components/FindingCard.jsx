import React from 'react';

export default function FindingCard({ finding, onAcknowledge, onReupload, onStartNew }) {
  const isError = finding.severity === 'error';
  const acknowledged = finding.status === 'acknowledged';
  return (
    <div className={`finding-card ${isError ? 'finding-error' : 'finding-warning'}${acknowledged ? ' acknowledged' : ''}`}>
      <div className="finding-head">
        <span className="finding-icon">{isError ? '!' : '⚠'}</span>
        <div>
          <div className="finding-kicker">{isError ? 'Must be resolved' : acknowledged ? 'Warning acknowledged' : 'Review required'}</div>
          <div className="finding-title">{finding.title}</div>
        </div>
      </div>
      <p>{finding.message}</p>
      <div className="comparison-list">
        {finding.comparisons.map((row) => (
          <div className="comparison-row" key={row.source}>
            <span>{row.source}</span><strong>{row.value}</strong>
          </div>
        ))}
      </div>
      <div className="finding-actions">
        {onReupload && <button className="btn" onClick={onReupload}>Re-upload document</button>}
        {!isError && !acknowledged && (
          <button className="btn btn-secondary" onClick={() => onAcknowledge(finding.id)}>Acknowledge and continue</button>
        )}
        {isError && <button className="btn danger-outline" onClick={onStartNew}>Start new application</button>}
      </div>
    </div>
  );
}

