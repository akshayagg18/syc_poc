import React, { useEffect, useMemo, useRef, useState } from 'react';
import OsStepBar from './OsStepBar.jsx';
import SectionSidebar from './SectionSidebar.jsx';
import FindingCard from './FindingCard.jsx';
import { scenarioById } from '../data/scenarios.js';
import { extractFixture } from '../lib/fixtureExtraction.js';
import { evaluateCase, hasOpenError, hasUnacknowledgedWarning } from '../lib/validationEngine.js';

const CASE_KEY = 'syc_scenario_case_v2';
const SECTION_NAMES = ['Parties to the Proceedings', 'Marriage Certificate Details', 'Grounds for Divorce', 'Children & Custody', 'Matrimonial Property', 'Maintenance & Alimony', 'Bankruptcy & Court Proceedings', 'Declaration'];

const copy = {
  en: {
    consentTitle: 'Let us retrieve the information already held by government agencies',
    consent: 'With your consent, we can pre-fill most of this application from Singpass, SYC/MCP, ROMM, MSF/ICA, HDB and CPF. You will review the information and provide only what is missing.',
    consentBtn: 'I consent — retrieve my information',
    retrieving: 'Retrieving your records securely…',
    retrieved: 'Records retrieved. Review each section and confirm the information before continuing.',
    continue: 'Save and continue',
    declaration: 'I declare that the information in this application is true and correct.',
    submit: 'Complete application',
  },
  bm: {
    consentTitle: 'Benarkan kami mendapatkan maklumat yang telah disimpan oleh agensi kerajaan',
    consent: 'Dengan kebenaran anda, kebanyakan permohonan ini boleh diisi daripada Singpass, SYC/MCP, ROMM, MSF/ICA, HDB dan CPF. Anda hanya perlu menyemak dan melengkapkan maklumat yang tiada.',
    consentBtn: 'Saya bersetuju — dapatkan maklumat saya',
    retrieving: 'Mendapatkan rekod anda dengan selamat…',
    retrieved: 'Rekod telah diperoleh. Semak setiap bahagian sebelum meneruskan.',
    continue: 'Simpan dan teruskan',
    declaration: 'Saya mengisytiharkan bahawa maklumat dalam permohonan ini adalah benar dan betul.',
    submit: 'Lengkapkan permohonan',
  },
};

function initialState(scenario, ruleConfig) {
  return {
    scenarioId: scenario.id,
    ruleConfigSnapshot: { ...ruleConfig },
    stage: 'consent',
    activeSection: 1,
    unlockedSection: 1,
    completed: {},
    children: [...(scenario.children.os || [])],
    extraction: {},
    uploaded: { children: [], property: [] },
    acknowledgements: [],
    notice: {},
    declared: false,
    editable: {
      pOccupation: scenario.occupation.plaintiff,
      dOccupation: scenario.occupation.defendant,
      pEducation: scenario.education.plaintiff,
      dEducation: scenario.education.defendant,
      pSalary: scenario.salary.plaintiff,
      dSalary: scenario.salary.defendant,
      childMaintenance: scenario.maintenance.child,
      selfMaintenance: scenario.maintenance.self,
    },
  };
}

function loadSaved(scenario, ruleConfig) {
  try {
    const saved = JSON.parse(localStorage.getItem(CASE_KEY));
    return saved?.scenarioId === scenario.id ? saved : initialState(scenario, ruleConfig);
  } catch { return initialState(scenario, ruleConfig); }
}

function SourceBadge({ children }) { return <span className="source-badge">{children}</span>; }

function SourceField({ label, value, source, editable = false, onChange }) {
  return (
    <label className="source-field">
      <span className="source-label">{label}</span>
      {editable ? <input value={value} onChange={(event) => onChange(event.target.value)} /> : <span className="source-value">{value || 'Not applicable'}</span>}
      {source && <SourceBadge>{source}</SourceBadge>}
    </label>
  );
}

function Section({ n, state, findings, children, onContinue, t, submitted }) {
  const locked = n > state.unlockedSection;
  const done = Boolean(state.completed[n]);
  const blocked = hasOpenError(findings, n) || hasUnacknowledgedWarning(findings, n);
  return (
    <section id={['', 'sec_parties', 'sec_marriage', 'sec_grounds', 'sec_children', 'sec_property', 'sec_maint', 'sec_bk', 'sec_declare'][n]} className={`scenario-section${locked ? ' locked' : ''}${state.activeSection === n ? ' active' : ''}`}>
      <div className="scenario-section-title"><span className={done ? 'done' : ''}>{done ? '✓' : n}</span>{SECTION_NAMES[n - 1]}</div>
      <div className="scenario-section-body">{children}</div>
      {!locked && !done && !submitted && (
        <button className="section-continue-btn" disabled={blocked} onClick={() => onContinue(n)}>
          {blocked ? 'Resolve or acknowledge findings to continue' : n === 8 ? t.submit : t.continue}
        </button>
      )}
      {done && <div className="section-saved">Saved</div>}
      {locked && <div className="section-lock"><span>Locked</span></div>}
    </section>
  );
}

function UploadArea({ id, title, hint, multiple, files, extraction, busy, error, onFiles }) {
  const inputRef = useRef(null);
  return (
    <div className="scenario-upload" id={id}>
      <div><strong>{title}</strong><p>{hint}</p></div>
      <button className="btn btn-secondary" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? 'Reading document…' : files.length ? 'Replace document' : 'Choose document'}</button>
      <input ref={inputRef} hidden type="file" multiple={multiple} accept="image/*,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => onFiles(event.target.files)} />
      {files.length > 0 && <div className="file-list">{files.map((name) => <span key={name}>📎 {name}</span>)}</div>}
      {error && <div className="upload-error">{error}</div>}
      {extraction && <div className="extraction-success">✓ AI-assisted extraction complete · {extraction.documentType}</div>}
    </div>
  );
}

export default function ScenarioDemo({ scenarioId, ruleConfig, lang, onSetLang, onStartNew }) {
  const scenario = scenarioById(scenarioId);
  const t = copy[lang] || copy.en;
  const [state, setState] = useState(() => loadSaved(scenario, ruleConfig));
  const [busyUpload, setBusyUpload] = useState('');
  const [uploadError, setUploadError] = useState({});

  const findings = useMemo(() => {
    const evaluated = evaluateCase({ scenario, caseData: state, extraction: state.extraction, ruleConfig: state.ruleConfigSnapshot || ruleConfig });
    return evaluated.map((finding) => state.acknowledgements.includes(finding.id) && finding.severity === 'warning'
      ? { ...finding, status: 'acknowledged' }
      : finding);
  }, [scenario, state.children, state.extraction, state.acknowledgements, state.ruleConfigSnapshot, ruleConfig]);

  useEffect(() => {
    localStorage.setItem(CASE_KEY, JSON.stringify({ ...state, findings }));
  }, [state, findings]);

  const sidebarForm = { secDone: state.completed, activeSection: state.activeSection, unlockedSection: state.unlockedSection };

  function consent() {
    setState((prev) => ({ ...prev, stage: 'retrieving' }));
    setTimeout(() => setState((prev) => ({ ...prev, stage: 'form' })), 1050);
  }

  function setEditable(key, value) {
    setState((prev) => ({ ...prev, editable: { ...prev.editable, [key]: value } }));
  }

  function acknowledge(id) {
    setState((prev) => ({ ...prev, acknowledgements: [...new Set([...prev.acknowledgements, id])] }));
  }

  async function handleUpload(section, fileList) {
    const selected = Array.from(fileList || []);
    if (!selected.length) return;
    setBusyUpload(section); setUploadError((prev) => ({ ...prev, [section]: '' }));
    try {
      const result = await extractFixture({ scenarioId: scenario.id, section, files: selected });
      setState((prev) => ({
        ...prev,
        extraction: { ...prev.extraction, [section]: result },
        uploaded: { ...prev.uploaded, [section]: selected.map((file) => file.name) },
        acknowledgements: prev.acknowledgements.filter((id) => !id.startsWith(`${section}.`)),
        notice: { ...prev.notice, [section === 'children' ? 4 : 5]: '' },
      }));
    } catch (error) {
      setUploadError((prev) => ({ ...prev, [section]: error.message }));
    } finally { setBusyUpload(''); }
  }

  function continueSection(n) {
    if (n === 4 && scenario.uploads.children && !state.extraction.children) {
      setState((prev) => ({ ...prev, notice: { ...prev.notice, 4: 'Upload the required Parenting Plan before continuing.' } })); return;
    }
    if (n === 5 && scenario.uploads.property && !state.extraction.property) {
      setState((prev) => ({ ...prev, notice: { ...prev.notice, 5: 'Upload the required Property Plan before continuing.' } })); return;
    }
    if (hasOpenError(findings, n) || hasUnacknowledgedWarning(findings, n)) return;
    if (n === 8 && !state.declared) {
      setState((prev) => ({ ...prev, notice: { ...prev.notice, 8: 'Confirm the declaration before completing the application.' } })); return;
    }
    setState((prev) => ({
      ...prev,
      stage: n === 8 ? 'submitted' : prev.stage,
      completed: { ...prev.completed, [n]: true },
      activeSection: Math.min(8, n + 1),
      unlockedSection: Math.max(prev.unlockedSection, Math.min(8, n + 1)),
      notice: { ...prev.notice, [n]: '' },
    }));
    setTimeout(() => document.getElementById(['', 'sec_parties', 'sec_marriage', 'sec_grounds', 'sec_children', 'sec_property', 'sec_maint', 'sec_bk', 'sec_declare'][Math.min(8, n + 1)])?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function removeHaziq() {
    setState((prev) => ({ ...prev, children: prev.children.filter((name) => !name.startsWith('Haziq')), acknowledgements: [] }));
  }

  function restart() {
    if (!window.confirm('Start a new application? Current application progress will be cleared.')) return;
    localStorage.removeItem(CASE_KEY);
    onStartNew();
  }

  const renderFinding = (finding, section) => (
    <FindingCard key={finding.id} finding={finding} onAcknowledge={acknowledge}
      onReupload={() => document.querySelector(`#${section}-upload input`)?.click()} onStartNew={restart} />
  );

  return (
    <>
      <OsStepBar lang={lang} onSetLang={onSetLang} />
      <div className="scenario-banner"><strong>Scenario {scenario.id}: {scenario.title}</strong><span>{scenario.expected}</span></div>
      <div className="main-layout scenario-demo">
        <SectionSidebar form={sidebarForm} />
        <main className="form-panel">
          {state.stage === 'consent' || state.stage === 'retrieving' ? (
            <div className="retrieval-shell">
              <div className="retrieval-icon">⌁</div><h1>{t.consentTitle}</h1><p>{t.consent}</p>
              <div className="agency-grid">{['Singpass', 'SYC / MCP', 'ROMM', 'MSF / ICA', 'HDB', 'CPF'].map((agency) => <div key={agency}><span>✓</span>{agency}<small>Ready to connect</small></div>)}</div>
              {state.stage === 'retrieving' ? <div className="retrieving-line"><i />{t.retrieving}</div> : <button className="btn btn-primary consent-btn" onClick={consent}>{t.consentBtn}</button>}
            </div>
          ) : (
            <div className="scenario-document">
              <div className="record-summary"><span>✓</span><div><strong>{t.retrieved}</strong><small>6 connected sources · retrieved just now</small></div></div>

              <Section n={1} state={state} findings={findings} t={t} submitted={state.stage === 'submitted'} onContinue={continueSection}>
                <div className="party-grid">{['plaintiff', 'defendant'].map((party) => <div className="source-card" key={party}><h3>{party === 'plaintiff' ? 'Plaintiff' : 'Defendant'}</h3>
                  <SourceField label="Full name" value={scenario.person[party].name} source={party === 'plaintiff' ? 'Singpass' : 'ROMM'} />
                  <SourceField label="NRIC" value={scenario.person[party].nric} source={party === 'plaintiff' ? 'Singpass' : 'ROMM'} />
                  <SourceField label="Date of birth" value={scenario.person[party].dob} source={party === 'plaintiff' ? 'Singpass' : 'ROMM'} />
                  <SourceField label="Citizenship" value={scenario.person[party].citizenship} source="Singpass" />
                  <SourceField label="Education" value={state.editable[party === 'plaintiff' ? 'pEducation' : 'dEducation']} editable onChange={(v) => setEditable(party === 'plaintiff' ? 'pEducation' : 'dEducation', v)} source="Entered by you" />
                  <SourceField label="Occupation" value={state.editable[party === 'plaintiff' ? 'pOccupation' : 'dOccupation']} editable onChange={(v) => setEditable(party === 'plaintiff' ? 'pOccupation' : 'dOccupation', v)} source="Entered by you" />
                  <SourceField label="Gross salary" value={state.editable[party === 'plaintiff' ? 'pSalary' : 'dSalary']} editable onChange={(v) => setEditable(party === 'plaintiff' ? 'pSalary' : 'dSalary', v)} source="Entered by you" />
                </div>)}</div>
              </Section>

              <Section n={2} state={state} findings={findings} t={t} submitted={state.stage === 'submitted'} onContinue={continueSection}>
                <div className="source-card source-grid">
                  <SourceField label="Certificate number" value={scenario.marriage.certNo} source="ROMM" /><SourceField label="Marriage date" value={scenario.marriage.date} source="ROMM" />
                  <SourceField label="Venue" value={scenario.marriage.venue} source="ROMM" /><SourceField label="Wali" value={scenario.marriage.wali} source="ROMM" />
                  <SourceField label="Mahr" value={scenario.marriage.mahr} source="ROMM" /><SourceField label="MCP status" value={`${scenario.mcp.status} · ${scenario.mcp.completionDate}`} source="SYC / MCP" />
                </div>
              </Section>

              <Section n={3} state={state} findings={findings} t={t} submitted={state.stage === 'submitted'} onContinue={continueSection}>
                <div className="source-card"><SourceField label="Selected ground" value={scenario.ground.type} source={scenario.ground.source} /><SourceField label="Case note" value={scenario.ground.note} source={scenario.ground.source} /></div>
                {scenario.risk && <div className="risk-card"><div className="risk-head"><span>!</span><div><small>HIGH-RISK INDICATOR</small><strong>{scenario.risk.title}</strong></div></div><p>{scenario.risk.message}</p><div className="risk-source">Family Justice Courts · {scenario.risk.ppo}</div><button className="btn risk-button">Open risk assessment</button></div>}
              </Section>

              <Section n={4} state={state} findings={findings} t={t} submitted={state.stage === 'submitted'} onContinue={continueSection}>
                <div className="children-list">{scenario.children.registry.length ? scenario.children.registry.map((child) => <div className={`child-row${state.children.includes(child.name) ? '' : ' excluded'}`} key={child.name}><div><strong>{child.name}</strong><span>{child.birthCert} · Age {child.age} · {child.gender}</span></div><SourceBadge>MSF / ICA</SourceBadge><em>{child.relationship}</em>{state.children.includes(child.name) && child.name.startsWith('Haziq') && <button className="link-button" onClick={removeHaziq}>Remove from OS claim</button>}</div>) : <div className="empty-state">No children recorded for this marriage. <SourceBadge>MSF / ICA</SourceBadge></div>}</div>
                {scenario.uploads.children && <UploadArea id="children-upload" title="Upload Parenting Plan (Form 11)" hint="This is the only supporting upload required in the Children section." files={state.uploaded.children} extraction={state.extraction.children} busy={busyUpload === 'children'} error={uploadError.children} onFiles={(files) => handleUpload('children', files)} />}
                {state.extraction.children && <div className="extracted-grid"><SourceField label="Children in plan" value={state.extraction.children.planChildren.join(', ')} source="Uploaded Form 11" /><SourceField label="Current residence" value={state.extraction.children.currentResidence} source="Uploaded Form 11" /><SourceField label="Proposed residence" value={state.extraction.children.proposedResidence} source="Uploaded Form 11" /><SourceField label="Caregiver" value={state.extraction.children.caregiver} source="Uploaded Form 11" /><SourceField label="Education" value={state.extraction.children.education} source="Uploaded Form 11" /><SourceField label="Custody" value={state.extraction.children.custody} source="Uploaded Form 11" /><SourceField label="Care and control" value={state.extraction.children.careControl} source="Uploaded Form 11" /><SourceField label="Access" value={state.extraction.children.access} source="Uploaded Form 11" /><SourceField label="Defendant agreement" value={state.extraction.children.defendantAgreement} source="Uploaded Form 11" /></div>}
                {findings.filter((f) => f.section === 4).map((f) => renderFinding(f, 'children'))}
                {state.notice[4] && <div className="inline-error">{state.notice[4]}</div>}
              </Section>

              <Section n={5} state={state} findings={findings} t={t} submitted={state.stage === 'submitted'} onContinue={continueSection}>
                {scenario.property ? <div className="source-card source-grid"><SourceField label="Flat address" value={scenario.property.hdbAddress} source="HDB" /><SourceField label="OS property address" value={scenario.property.osAddress} source="OS Case Statement" /><SourceField label="Flat type" value={scenario.property.type} source="HDB" /><SourceField label="Holding" value={scenario.property.holding} source="HDB" /><SourceField label="Estimated value" value={scenario.property.value} source="HDB" /><SourceField label="Outstanding loan" value={scenario.property.loan} source="HDB" /></div> : <div className="empty-state">No matrimonial property was found in the connected HDB record. <SourceBadge>HDB</SourceBadge></div>}
                {scenario.uploads.property && <UploadArea id="property-upload" title="Upload Matrimonial Property Plan (Forms 13 / 14)" hint={scenario.id === '10' ? 'Select Scenario10_Form13.docx and Scenario10_Form14.docx together.' : 'Select both photographed pages of the handwritten Form 13, or the corrected fixture.'} multiple files={state.uploaded.property} extraction={state.extraction.property} busy={busyUpload === 'property'} error={uploadError.property} onFiles={(files) => handleUpload('property', files)} />}
                {state.extraction.property && <div className="extracted-grid"><SourceField label="Plan address" value={state.extraction.property.address} source="Uploaded Property Plan" /><SourceField label="Arrangement" value={state.extraction.property.arrangement} source="Uploaded Property Plan" />{state.extraction.property.consideration && <SourceField label="Consideration" value={state.extraction.property.consideration} source="Uploaded Form 14" />}{state.extraction.property.cpfRefund && <SourceField label="CPF refund" value={state.extraction.property.cpfRefund} source="Uploaded Form 14" />}{state.extraction.property.mortgage && <SourceField label="Mortgage" value={state.extraction.property.mortgage} source="Uploaded Form 14" />}{state.extraction.property.fees && <SourceField label="Fees" value={state.extraction.property.fees} source="Uploaded Form 14" />}{state.extraction.property.timeframe && <SourceField label="Timeframe" value={state.extraction.property.timeframe} source="Uploaded Form 14" />}</div>}
                {findings.filter((f) => f.section === 5).map((f) => renderFinding(f, 'property'))}
                {state.notice[5] && <div className="inline-error">{state.notice[5]}</div>}
              </Section>

              <Section n={6} state={state} findings={findings} t={t} submitted={state.stage === 'submitted'} onContinue={continueSection}>
                <div className="source-card source-grid"><SourceField label="Child maintenance" value={state.editable.childMaintenance} editable onChange={(v) => setEditable('childMaintenance', v)} source="Entered by you" /><SourceField label="Self / iddah maintenance" value={state.editable.selfMaintenance} editable onChange={(v) => setEditable('selfMaintenance', v)} source="Entered by you" /></div>
              </Section>

              <Section n={7} state={state} findings={findings} t={t} submitted={state.stage === 'submitted'} onContinue={continueSection}>
                <div className="source-card"><SourceField label="Bankruptcy and court proceedings" value={scenario.bankruptcy} source="Government records + declaration" /></div>
              </Section>

              <Section n={8} state={state} findings={findings} t={t} submitted={state.stage === 'submitted'} onContinue={continueSection}>
                <div className="review-summary"><strong>Application review</strong><span>{Object.keys(state.completed).length}/8 sections completed</span><p>No unresolved blocking discrepancy may remain when this application is completed.</p></div>
                <label className="declaration-check"><input type="checkbox" checked={state.declared} onChange={(event) => setState((prev) => ({ ...prev, declared: event.target.checked, notice: { ...prev.notice, 8: '' } }))} />{t.declaration}</label>
                {state.notice[8] && <div className="inline-error">{state.notice[8]}</div>}
              </Section>
              {state.stage === 'submitted' && <div className="submission-success"><span>✓</span><h2>Application completed</h2><p>Reference: SYC/OS/2026/{scenario.id.padStart(2, '0')}/018742</p><small>All configured checks have passed or been acknowledged.</small></div>}
            </div>
          )}
        </main>

        <aside className="assistant-panel">
          <div className="assistant-head"><span>AI</span><div><strong>Aisha</strong><small>Filing assistant</small></div></div>
          <div className="assistant-body">
            <div className="assistant-message"><strong>{state.stage === 'consent' ? 'Welcome' : `Scenario ${scenario.id}`}</strong><p>{state.stage === 'consent' ? t.consent : scenario.summary}</p></div>
            {state.stage !== 'consent' && <div className="source-status"><h4>Connected sources</h4>{['Singpass', 'SYC / MCP', 'ROMM', 'MSF / ICA', 'HDB', 'CPF'].map((source) => <div key={source}><span>✓</span>{source}<small>Retrieved</small></div>)}</div>}
            {findings.some((f) => f.status === 'open') && <div className="assistant-message attention"><strong>I found information to review</strong><p>Open the highlighted section to compare the relevant sources and choose the next action.</p></div>}
            {scenario.risk && state.stage === 'form' && <div className="assistant-message risk"><strong>Safety check</strong><p>The risk indicator does not prevent filing. Please complete the separate assessment shown in Grounds for Divorce.</p></div>}
            <div className="assistant-message"><strong>What you need to upload</strong><p>{scenario.uploads.children ? 'A Parenting Plan in the Children section.' : scenario.uploads.property ? 'The applicable Property Plan in the Matrimonial Property section.' : 'No supporting upload is required for this scenario.'}</p></div>
          </div>
          <div className="assistant-input"><input placeholder="Use the form controls to complete this application" disabled /><button disabled>Send</button></div>
        </aside>
      </div>
    </>
  );
}

