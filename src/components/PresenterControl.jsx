import React, { useEffect, useState } from 'react';
import { DEFAULT_RULE_CONFIG, RULE_LABELS, SCENARIOS } from '../data/scenarios.js';

export default function PresenterControl({ open, onClose, config, onChangeConfig, onLaunch, currentScenario }) {
  const [selected, setSelected] = useState(currentScenario || '10');
  useEffect(() => { if (open) setSelected(currentScenario || '10'); }, [open, currentScenario]);
  if (!open) return null;

  return (
    <div className="control-backdrop" role="dialog" aria-modal="true" aria-label="Presenter controls">
      <div className="control-panel">
        <div className="control-head">
          <div><div className="control-kicker">Internal presenter controls</div><h2>Scenario launcher</h2></div>
          <button className="control-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="control-section">
          <h3>1. Choose a client test scenario</h3>
          <div className="scenario-grid">
            {Object.values(SCENARIOS).map((scenario) => (
              <button key={scenario.id} aria-label={`Scenario ${scenario.id}`} className={`scenario-option${selected === scenario.id ? ' selected' : ''}`} onClick={() => setSelected(scenario.id)}>
                <span className="scenario-num">{scenario.id}</span>
                <span><strong>{scenario.title}</strong><small>{scenario.summary}</small></span>
              </button>
            ))}
          </div>
          <div className="expected-box"><strong>Expected:</strong> {SCENARIOS[selected].expected}</div>
        </div>

        <div className="control-section">
          <div className="control-title-row">
            <h3>2. Configure discrepancy policy</h3>
            <button className="link-button" onClick={() => onChangeConfig({ ...DEFAULT_RULE_CONFIG })}>Reset defaults</button>
          </div>
          {Object.entries(RULE_LABELS).map(([code, label]) => (
            <label className="rule-control" key={code}>
              <span><strong>{label}</strong><small>{code}</small></span>
              <select value={config[code]} onChange={(event) => onChangeConfig({ ...config, [code]: event.target.value })}>
                <option value="warning">Warning · may acknowledge</option>
                <option value="error">Error · blocks progress</option>
              </select>
            </label>
          ))}
        </div>

        <div className="control-footer">
          <span>Shortcut: Ctrl + Alt + Shift + C</span>
          <button className="btn btn-primary" onClick={() => onLaunch(selected)}>Launch Scenario {selected}</button>
        </div>
      </div>
    </div>
  );
}

