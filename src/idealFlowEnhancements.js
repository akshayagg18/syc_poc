/* Runs after the supplied ideal-flow script, inside its iframe. */
const filing = window.SYC_FILING_CASE;
const filingStoreKey = `syc_filing_${filing.sessionId}`;
const freshFlow = () => ({
  claimedChildren: [...(filing.children.os || [])],
  custody: {},
  uploads: {},
  extraction: {},
  acknowledgements: [],
  phase: 'welcome',
  view: 'filing',
  pendingEdit: '',
  propertyAddress: filing.property?.osAddress || '',
});
let flow = freshFlow();
let entryView = 'login';

const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const normal = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sameNames = (left, right) => left.length === right.length &&
  [...left].map(normal).sort().every((name, index) => name === [...right].map(normal).sort()[index]);
const tx = (en, bm) => lang === 'bm' ? bm : en;

function saveFiling() {
  const box = document.getElementById('chatBox');
  if (!box) return;
  const fields = {};
  document.querySelectorAll('.os-val[id]').forEach((element) => { fields[element.id] = { text: element.textContent, filled: element.classList.contains('filled') }; });
  const saved = {
    flow,
    lang,
    step,
    fields,
    chat: box.innerHTML,
    childrenHtml: document.getElementById('f_children_list')?.innerHTML,
    completed: [...document.querySelectorAll('.os-sec-num.done')].map((element) => element.id),
    talakHtml: document.getElementById('f_talak_sessions')?.innerHTML,
    sourceState: { hasBK, talakData, numTalakSessions, revocData, witnessState,
      addlData, citizenshipPassed, selectedGround, selectedGroundValue,
      custodyValue, reliefValue, childNaf, selfNaf, bkStatus, bkDetails },
  };
  localStorage.setItem(filingStoreKey, JSON.stringify(saved));
}

function restoreFiling(saved) {
  flow = { ...freshFlow(), ...saved.flow };
  lang = saved.lang || 'en';
  step = saved.step || 1;
  const state = saved.sourceState || {};
  hasBK = state.hasBK ?? false;
  talakData = state.talakData || [];
  numTalakSessions = state.numTalakSessions || 0;
  revocData = state.revocData || { certNo: '', regDate: '' };
  witnessState = state.witnessState || {};
  addlData = state.addlData || addlData;
  citizenshipPassed = state.citizenshipPassed ?? false;
  selectedGround = state.selectedGround || '';
  selectedGroundValue = state.selectedGroundValue || '';
  custodyValue = state.custodyValue || '';
  reliefValue = state.reliefValue || '';
  childNaf = state.childNaf || 0;
  selfNaf = state.selfNaf || 0;
  bkStatus = state.bkStatus ?? false;
  bkDetails = state.bkDetails || '';
  document.getElementById('langEN').classList.toggle('active', lang === 'en');
  document.getElementById('langBM').classList.toggle('active', lang === 'bm');
  drawProg();
  document.getElementById('progFill').style.width = Math.round((step / 8) * 100) + '%';
  Object.entries(saved.fields || {}).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) { element.textContent = value.text; element.classList.toggle('filled', value.filled); }
  });
  if (saved.childrenHtml) document.getElementById('f_children_list').innerHTML = saved.childrenHtml;
  if (saved.talakHtml) document.getElementById('f_talak_sessions').innerHTML = saved.talakHtml;
  (saved.completed || []).forEach((id) => document.getElementById(id)?.classList.add('done'));
  document.getElementById('chatBox').innerHTML = saved.chat || '';
  document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
  if (flow.view !== 'filing') showFollowup(flow.view);
}

const sourceAddMsg = addMsg;
addMsg = function (html) { sourceAddMsg(html); saveFiling(); };
const sourceAddAI = addAI;
addAI = function (fn, cb) {
  if (!busy) { sourceAddAI(fn, cb); return; }
  const retry = () => { if (busy) setTimeout(retry, 30); else sourceAddAI(fn, cb); };
  setTimeout(retry, 30);
};
const sourceAddUser = addUser;
addUser = function (message) { sourceAddUser(message); saveFiling(); };
const sourceFillField = fillField;
fillField = function (id, value, section) { sourceFillField(id, value, section); saveFiling(); };
const sourceMarkDone = markSectionDone;
markSectionDone = function (number) { sourceMarkDone(number); saveFiling(); };
const sourceDrawProg = drawProg;
drawProg = function () {
  sourceDrawProg();
  document.getElementById('chatUserBadge').textContent = filing.person.plaintiff.name;
};
const sourceSetLang = setLang;
setLang = function (chosen) {
  flow = freshFlow();
  localStorage.removeItem(filingStoreKey);
  sourceSetLang(chosen);
};

function addFilingStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .flow-source{font-size:10px;color:#7a6563;border:1px solid #e7d6d3;border-radius:999px;padding:2px 7px;white-space:nowrap}
    .flow-upload{border:1.5px dashed #bf8983;background:#fffafa;border-radius:9px;padding:12px;margin-top:9px}
    .flow-upload strong{display:block;color:#660d07;font-size:12px;margin-bottom:5px}
    .flow-upload input{display:block;width:100%;font-size:11px;margin:8px 0;color:#444}
    .flow-file{font-size:11px;color:#526254;margin-top:5px;line-height:1.5}
    .flow-warning{background:#fff8e6;border:1px solid #d5ae50;border-radius:8px;padding:11px;margin:8px 0;color:#5e4d25}
    .flow-warning strong{display:block;font-size:12px;margin-bottom:5px}
    .flow-warning p{font-size:11.5px;margin:4px 0 8px}
    .flow-compare{display:grid;grid-template-columns:90px 1fr;gap:4px 7px;padding:4px 0;border-top:1px solid #eadcb9;font-size:11px}
    .flow-compare span:first-child{color:#786b53}
    .flow-check{background:#edf7ef;border:1px solid #8dc39b;border-radius:8px;padding:9px 11px;margin-top:8px;font-size:11.5px;color:#255b34}
    .flow-prompt{font-size:12px;color:#424242;line-height:1.6}
    .flow-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
    .flow-actions .btn{border:1px solid #c99d98}
    .flow-risk{border-left:4px solid #bf6a50;background:#fff2ef;border-radius:4px;padding:10px;margin:8px 0;font-size:11.5px}
    .flow-followup{position:fixed;inset:0;background:#fff;z-index:500;overflow:auto;font-family:'Lato','Inter',sans-serif}
    .flow-followup-header{background:#660d07;color:#fff;padding:18px 26px;font-family:Georgia,serif;font-size:23px}
    .flow-followup-inner{max-width:940px;margin:30px auto;padding:0 22px;color:#333}
    .flow-followup-inner h1{font-size:25px;color:#660d07;margin-bottom:12px}
    .flow-followup-inner p{font-size:14px;line-height:1.6;margin:9px 0}
    .flow-steps{display:flex;gap:10px;margin:18px 0 28px;font-size:12px;font-weight:700;color:#777}
    .flow-steps span{flex:1;padding:11px;border-bottom:3px solid #dedede;text-align:center}
    .flow-steps span.active{color:#660d07;border-color:#660d07}
    .flow-followup-card{border:1px solid #e4dad7;border-radius:8px;padding:20px;background:#fffdfc;margin:15px 0}
    .flow-followup input[type=checkbox]{margin-right:9px}
    .flow-followup .btn{border:1px solid #660d07;margin-top:12px}
    .flow-dash-link{margin-left:8px;background:transparent;color:#f3b6ae;border:1px solid #f3b6ae;padding:4px 9px;border-radius:5px;font-size:10px;cursor:pointer}
    .flow-entry-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:22px}
    .flow-entry-card{border:1px solid #e4dad7;border-radius:9px;background:#fffdfc;padding:22px}
    .flow-entry-card h2{color:#660d07;font-size:19px;margin:0 0 10px}
    .flow-entry-card p{margin:0 0 12px}
    .flow-entry-kicker{color:#755a55;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em}
    .flow-entry-lang{float:right;display:flex;gap:6px}
    .flow-entry-lang button{border:1px solid #f3b6ae;border-radius:4px;background:transparent;color:#fff;padding:3px 8px;cursor:pointer}
    .flow-entry-lang button.active{background:#fff;color:#660d07}
  `;
  document.head.appendChild(style);
  const link = document.createElement('button');
  link.className = 'flow-dash-link';
  link.textContent = tx('Dashboard', 'Papan pemuka');
  link.onclick = () => showFollowup('dashboard');
  document.querySelector('.top-logo')?.appendChild(link);
}

window.onload = () => {
  addFilingStyles();
  addlData = {
    p: { edu: filing.education.plaintiff, occ: filing.occupation.plaintiff, sal: normal(filing.salary.plaintiff).replace(/[^0-9]/g, '') || '5800' },
    d: { edu: filing.education.defendant, occ: filing.occupation.defendant, sal: normal(filing.salary.defendant).replace(/[^0-9]/g, '') || '6200' },
  };
  let saved;
  try { saved = JSON.parse(localStorage.getItem(filingStoreKey)); } catch { saved = null; }
  if (saved?.flow) restoreFiling(saved);
  else { drawProg(); showEntry('login'); }
};

function showEntry(view) {
  entryView = view;
  let panel = document.getElementById('flow-followup');
  if (!panel) { panel = document.createElement('div'); panel.id = 'flow-followup'; panel.className = 'flow-followup'; document.body.appendChild(panel); }
  let content = '';
  if (view === 'login') content = `<div class="flow-entry-kicker">SYC e-Services</div><h1>${tx('Access your court services', 'Akses perkhidmatan mahkamah anda')}</h1>
    <p>${tx('Continue securely to review your available filing services.', 'Teruskan dengan selamat untuk menyemak perkhidmatan pemfailan yang tersedia.')}</p>
    <div class="flow-entry-grid"><div class="flow-entry-card"><h2>Singpass</h2><p>${tx('Use your digital identity to continue.', 'Gunakan identiti digital anda untuk meneruskan.')}</p>
      <button class="btn btn-primary" onclick="flowEntryNext('dashboard')">${tx('Log in with Singpass', 'Log masuk dengan Singpass')}</button></div></div>`;
  if (view === 'dashboard') content = `<div class="flow-entry-kicker">SYC e-Services</div><h1>${tx('Welcome', 'Selamat datang')}, ${safe(filing.person.plaintiff.name)}</h1>
    <p>${tx('Choose the service you need today.', 'Pilih perkhidmatan yang anda perlukan hari ini.')}</p>
    <div class="flow-entry-grid"><div class="flow-entry-card"><h2>${tx('Divorce filing', 'Pemfailan perceraian')}</h2>
      <p>${tx('Begin an Originating Summons application with guided assistance.', 'Mulakan permohonan Saman Pemula dengan bantuan berpandu.')}</p>
      <button class="btn btn-primary" onclick="flowEntryNext('services')">${tx('Start a divorce application', 'Mulakan permohonan perceraian')}</button></div></div>`;
  if (view === 'services') content = `<div class="flow-entry-kicker">SYC e-Services</div><h1>${tx('Originating Summons for Divorce', 'Saman Pemula bagi Perceraian')}</h1>
    <p>${tx('Your MCP details will be reviewed before you provide consent to retrieve the remaining records.', 'Butiran MCP anda akan disemak sebelum anda memberikan kebenaran untuk mendapatkan rekod yang lain.')}</p>
    <div class="flow-entry-grid"><div class="flow-entry-card"><h2>${tx('Marriage Counselling Programme', 'Program Kaunseling Perkahwinan')}</h2>
      <p>${tx('Reference', 'Rujukan')}: <strong>${safe(filing.mcp.number)}</strong><br>${tx('Completed', 'Selesai')}: ${safe(filing.mcp.completionDate)}</p>
      <button class="btn btn-primary" onclick="flowEntryNext('filing')">${tx('Continue with Aisha', 'Teruskan dengan Aisha')}</button></div></div>`;
  panel.innerHTML = `<div class="flow-followup-header">Syariah Court Singapore
    <span class="flow-entry-lang"><button class="${lang === 'en' ? 'active' : ''}" onclick="flowEntryLanguage('en')">EN</button>
    <button class="${lang === 'bm' ? 'active' : ''}" onclick="flowEntryLanguage('bm')">BM</button></span></div>
    <div class="flow-followup-inner">${content}</div>`;
}

window.flowEntryLanguage = function (chosen) {
  lang = chosen;
  document.getElementById('langEN').classList.toggle('active', lang === 'en');
  document.getElementById('langBM').classList.toggle('active', lang === 'bm');
  drawProg();
  showEntry(entryView);
};

window.flowEntryNext = function (view) {
  if (view === 'filing') {
    document.getElementById('flow-followup')?.remove();
    start();
    saveFiling();
  } else showEntry(view);
};

showMCP = function () {
  nextStep(2);
  flow.phase = filing.mcp.eligible ? 'mcp-valid' : 'mcp-expired';
  addAI(() => addMsg(`<p>${tx('I have retrieved your Marriage Counselling Programme record. Please review it before we continue.', 'Saya telah mendapatkan rekod Program Kaunseling Perkahwinan anda. Sila semak sebelum meneruskan.')}</p>
    <div class="card">
      <div class="card-row"><div class="card-label">${tx('MCP reference', 'Rujukan MCP')}</div><div class="card-value">${safe(filing.mcp.number)}</div></div>
      <div class="card-row"><div class="card-label">${tx('Completed', 'Selesai')}</div><div class="card-value">${safe(filing.mcp.completionDate)}</div></div>
      <div class="card-row"><div class="card-label">${tx('Valid until', 'Sah sehingga')}</div><div class="card-value">${safe(filing.mcp.validUntil)}</div></div>
      <div class="card-row"><div class="card-label">${tx('Reason recorded', 'Sebab direkodkan')}</div><div class="card-value">${safe(filing.mcp.reason)}</div></div>
      <div class="card-row"><div class="card-label">${tx('High-risk indicator', 'Petunjuk risiko tinggi')}</div><div class="card-value">${filing.highRisk ? tx('Yes — safety review advised', 'Ya — semakan keselamatan disyorkan') : tx('No indicator recorded', 'Tiada petunjuk direkodkan')}</div></div>
    </div>
    ${filing.mcp.eligible
      ? `<div class="flow-check">${tx('The MCP is within the required six-month period for this filing.', 'MCP berada dalam tempoh enam bulan yang diperlukan untuk pemfailan ini.')}</div>
         <button class="btn btn-secondary live" style="margin-top:8px" onclick="choice('${t('continue_btn')}', showConsent)">${t('continue_btn')}</button>`
      : `<div class="flow-warning"><strong>${tx('Filing cannot continue yet', 'Pemfailan belum boleh diteruskan')}</strong>
           <p>${tx('This MCP is outside the six-month filing period. Please contact SYC about completing the required counselling before starting a new application.', 'MCP ini berada di luar tempoh pemfailan enam bulan. Sila hubungi Mahkamah Syariah tentang kaunseling yang diperlukan sebelum memulakan permohonan baharu.')}</p></div>`}`));
};

showPersonal = function () {
  nextStep(4);
  flow.phase = 'personal';
  const p = filing.person.plaintiff, d = filing.person.defendant;
  [['f_p_name',p.name],['f_p_nric',p.nric],['f_p_dob',p.dob],['f_p_citizenship',p.citizenship],
   ['f_d_name',d.name],['f_d_nric',d.nric],['f_d_dob',d.dob],['f_d_citizenship',d.citizenship]]
    .forEach(([id,value]) => fillField(id,value,id === 'f_p_name' ? 'sec_parties' : undefined));
  addAI(() => addMsg(`<p>${tx('I found these personal details. Please check them.', 'Saya menemui butiran peribadi ini. Sila semak.')}</p>
    ${[['Plaintiff',p],['Defendant',d]].map(([label,person]) => `<div class="card"><div class="card-title">${label} <span class="flow-source">${label === 'Plaintiff' ? 'Singpass' : 'ROMM'}</span></div>
      <div class="card-row"><div class="card-label">${t('full_name')}</div><div class="card-value">${safe(person.name)}</div></div>
      <div class="card-row"><div class="card-label">${t('nric')}</div><div class="card-value">${safe(person.nric)}</div></div>
      <div class="card-row"><div class="card-label">${t('dob')}</div><div class="card-value">${safe(person.dob)}</div></div></div>`).join('')}
    <div class="choice-btns"><button class="btn btn-secondary live" onclick="choice('${t('confirm_btn')}',showPersonalAdditional)">${t('confirm_btn')}</button></div>`));
};

checkCitizenship = function () {
  citizenshipPassed = true;
  addAI(() => addMsg(`<div class="bypass-card"><div class="bypass-icon">✓</div><div class="bypass-content">
    <div class="bypass-main">${tx('Jurisdiction has been established from the Singapore citizenship record.', 'Bidang kuasa telah disahkan daripada rekod kewarganegaraan Singapura.')}</div>
    <div class="bypass-note">Singpass</div></div></div>
    <button class="btn btn-secondary live" style="margin-top:8px" onclick="choice('${t('continue_btn')}',showMarriage)">${t('continue_btn')}</button>`));
};

showMarriage = function () {
  nextStep(5);
  flow.phase = 'marriage-upload';
  const m = filing.marriage;
  [['f_m_cert',m.certNo],['f_m_date',m.date],['f_m_venue',m.venue],['f_m_wali',m.wali],['f_m_mahr',m.mahr],['f_m_prior',t('no')]]
    .forEach(([id,value]) => fillField(id,value,id === 'f_m_cert' ? 'sec_marriage' : undefined));
  addAI(() => addMsg(`<p>${tx('I have retrieved your marriage record from ROMM. Please upload both sides of the marriage certificate so I can compare them.', 'Saya telah mendapatkan rekod perkahwinan daripada ROMM. Sila muat naik kedua-dua belah sijil perkahwinan supaya saya boleh membandingkannya.')}</p>
    <div class="card"><div class="card-title">ROMM <span class="flow-source">${tx('Retrieved record', 'Rekod diperoleh')}</span></div>
      <div class="card-row"><div class="card-label">${t('cert_no')}</div><div class="card-value">${safe(m.certNo)}</div></div>
      <div class="card-row"><div class="card-label">${t('marriage_date')}</div><div class="card-value">${safe(m.date)}</div></div>
      <div class="card-row"><div class="card-label">${t('venue')}</div><div class="card-value">${safe(m.venue)}</div></div></div>
    ${uploadMarkup('marriage',tx('Marriage certificate — front and back', 'Sijil perkahwinan — depan dan belakang'))}`));
};

function uploadMarkup(type, title) {
  return `<div class="flow-upload"><strong>${title}</strong>
    <p class="flow-prompt">${tx('Select the relevant pages together. Images, PDF and DOCX are accepted.', 'Pilih halaman yang berkaitan bersama-sama. Imej, PDF dan DOCX diterima.')}</p>
    <input id="flow-${type}-file" type="file" multiple accept="image/*,.pdf,.docx" onchange="flowUpload('${type}',this.files)">
    <div id="flow-${type}-status" class="flow-file"></div></div>`;
}

function documentResult(type, names) {
  const have = (fragment) => names.some((name) => name.includes(fragment));
  if (type === 'marriage') {
    if (!have(filing.marriageDocument.front) || !have(filing.marriageDocument.back))
      throw new Error(tx('Please select the front and back of this marriage certificate together.', 'Sila pilih bahagian depan dan belakang sijil perkahwinan ini bersama-sama.'));
    return { kind: 'marriage-certificate', parties: filing.person, ...filing.marriage };
  }
  if (type === 'children' && filing.id === '4') {
    if (have('scenario4-parenting-plan-corrected')) return {
      kind: 'parenting-plan', planChildren: ['Aisyah Binte Zulkifli'],
      residence: '765 Pasir Ris Street 71 with Plaintiff', caregiver: 'Plaintiff',
      education: 'Continue at current school', custody: 'Joint custody',
      careControl: 'Plaintiff', access: 'Reasonable weekend and school-holiday access',
      agreement: 'Confirmed',
    };
    if (have('scenario4_form11_pp')) return {
      kind: 'parenting-plan', planChildren: ['Haziq Bin Zulkifli','Aisyah Binte Zulkifli'],
      residence: '765 Pasir Ris Street 71 with Plaintiff', caregiver: 'Plaintiff',
      education: 'Both children continue at their current schools', custody: 'Joint custody',
      careControl: 'Plaintiff', access: 'Reasonable weekend and school-holiday access',
      agreement: 'Signed on 10 January 2026',
    };
  }
  if (type === 'property' && filing.id === '9') {
    if (have('scenario9-form13-corrected')) return {
      kind: 'property-plan', address: filing.property.hdbAddress,
      arrangement: "Defendant's share transferred to Plaintiff", agreement: 'Signed',
    };
    if (have('form 13_page 1') && have('form 13_page 2')) return {
      kind: 'property-plan', address: '82 Canberra Road',
      arrangement: "Defendant's share transferred to Plaintiff", agreement: 'Signed',
    };
    if (have('form 13_page 1') || have('form 13_page 2'))
      throw new Error(tx('Please select both pages of the Property Plan together.', 'Sila pilih kedua-dua halaman Pelan Harta bersama-sama.'));
  }
  if (type === 'property' && filing.id === '10') {
    if (have('scenario10_form13') && have('scenario10_form14')) return {
      kind: 'property-plan', address: filing.property.hdbAddress,
      arrangement: "Option 5 — Defendant's share transferred to Plaintiff",
      cpfRefund: "Defendant's CPF monies used for the flat",
      mortgage: 'Plaintiff bears 100% · SGD 255,000', fees: 'Plaintiff bears 100%',
      timeframe: 'Within 6 months of the court order', agreement: 'Confirmed',
    };
    if (have('scenario10_form13') || have('scenario10_form14'))
      throw new Error(tx('Please select Forms 13 and 14 together.', 'Sila pilih Borang 13 dan 14 bersama-sama.'));
  }
  throw new Error(tx('I could not match this document to the current application. Please check the document and try again.', 'Saya tidak dapat memadankan dokumen ini dengan permohonan semasa. Sila semak dokumen dan cuba lagi.'));
}

window.flowUpload = async function (type, fileList) {
  const files = [...(fileList || [])];
  if (!files.length) return;
  const status = document.getElementById(`flow-${type}-status`);
  const names = files.map((file) => file.name.toLowerCase());
  if (status) status.textContent = tx('Reading your document…', 'Membaca dokumen anda…');
  await new Promise((resolve) => setTimeout(resolve, 700));
  try {
    const result = documentResult(type, names);
    flow.uploads[type] = files.map((file) => ({ name: file.name, size: file.size, type: file.type }));
    flow.extraction[type] = result;
    flow.acknowledgements = flow.acknowledgements.filter((item) => !item.startsWith(`${type}.`));
    if (status) status.textContent = `✓ ${files.map((file) => file.name).join(', ')}`;
    saveFiling();
    if (type === 'marriage') afterMarriageUpload();
    if (type === 'children') afterParentingUpload();
    if (type === 'property') afterPropertyUpload();
  } catch (error) {
    if (status) status.textContent = error.message;
    addAI(() => addMsg(`<p>${safe(error.message)}</p>`));
  }
};

function afterMarriageUpload() {
  flow.phase = 'marriage-review';
  const result = flow.extraction.marriage;
  const mismatches = [];
  for (const [key,label] of [['certNo',t('cert_no')],['date',t('marriage_date')],['venue',t('venue')]]) {
    if (normal(result[key]) !== normal(filing.marriage[key])) mismatches.push({
      id: `marriage.${key}`, title: `${label} ${tx('does not match', 'tidak sepadan')}`,
      values: [['ROMM',filing.marriage[key]],['Marriage certificate',result[key]]],
    });
  }
  flow.currentFindings = mismatches;
  if (mismatches.length) { showWarnings('marriage', marriageNext); return; }
  addAI(() => addMsg(`<div class="flow-check">${tx('Thank you. The certificate details match the retrieved ROMM record.', 'Terima kasih. Butiran sijil sepadan dengan rekod ROMM yang diperoleh.')}</div>
    <button class="btn btn-secondary live" style="margin-top:8px" onclick="flowMarriageNext()">${t('continue_btn')}</button>`));
}

window.flowMarriageNext = function () { disableLive(); marriageNext(); };
function marriageNext() {
  flow.phase = 'prior-pronouncement';
  addAI(() => addMsg(`<p>${t('prior_q')}</p><div class="choice-btns">
    <button class="btn btn-secondary live" onclick="choice('${t('no')}',showGrounds)">${t('no')}</button>
    <button class="btn live" onclick="choice('${t('yes_prior')}',showRevocation)">${t('yes_prior')}</button></div>`));
}

const originalGrounds = showGrounds;
showGrounds = function () {
  const section = document.getElementById('sec_grounds');
  if (section && !document.getElementById('flow-risk-row')) {
    const row = document.createElement('div');
    row.id = 'flow-risk-row'; row.className = 'os-row';
    row.innerHTML = `<span class="os-lbl">${tx('High-risk indicator', 'Petunjuk risiko tinggi')}</span><span class="os-val filled">${filing.highRisk ? tx('Yes — safety review advised', 'Ya — semakan keselamatan disyorkan') : tx('No indicator recorded', 'Tiada petunjuk direkodkan')}</span>`;
    section.appendChild(row);
  }
  if (filing.highRisk) addMsg(`<div class="flow-risk"><strong>${tx('Safety information', 'Maklumat keselamatan')}</strong><br>${tx('The reason recorded during MCP and the protection-order record suggest that additional support may be useful. This does not prevent your filing.', 'Sebab yang direkodkan semasa MCP dan rekod perintah perlindungan menunjukkan sokongan tambahan mungkin berguna. Ini tidak menghalang pemfailan anda.')}</div>`);
  originalGrounds();
};

function renderClaimedChildren() {
  const target = document.getElementById('f_children_list');
  if (!target) return;
  target.innerHTML = flow.claimedChildren.length ? flow.claimedChildren.map((name, index) => {
    const child = filing.children.registry.find((item) => item.name === name);
    const answer = flow.custody[name] || {};
    return `<div class="os-children-row"><strong>${index + 1}. ${safe(name)}</strong>
      ${child ? `&bull; ${safe(child.birthCert)} &bull; ${safe(child.relationship)}` : ''}
      ${answer.custody ? `<br>${t('custody')}: ${safe(answer.custody)}` : ''}
      ${answer.careControl ? `<br>${tx('Care and control', 'Jagaan dan kawalan')}: ${safe(answer.careControl)}` : ''}
      ${answer.access ? `<br>${tx('Access', 'Akses')}: ${safe(answer.access)}` : ''}</div>`;
  }).join('') : `<div class="os-row"><span class="os-lbl">${t('children')}</span><span class="os-val filled">${t('no')}</span></div>`;
  saveFiling();
}

showChildren = function () {
  nextStep(6);
  flow.phase = 'children';
  if (!flow.claimedChildren.length) {
    renderClaimedChildren();
    markSectionDone(4);
    addAI(() => addMsg(`<p>${tx('No children are included in this application. We can continue to the property section.', 'Tiada anak yang termasuk dalam permohonan ini. Kita boleh meneruskan ke bahagian harta.')}</p>
      <button class="btn btn-secondary live" onclick="choice('${t('continue_btn')}',showHDB)">${t('continue_btn')}</button>`));
    return;
  }
  renderClaimedChildren();
  addAI(() => addMsg(`<p>${tx('I found the following child records. We will review custody and care and control for each child before checking the Parenting Plan.', 'Saya menemui rekod anak berikut. Kita akan menyemak hak penjagaan serta jagaan dan kawalan bagi setiap anak sebelum menyemak Pelan Keibubapaan.')}</p>
    ${filing.children.registry.map((child) => `<div class="card"><strong>${safe(child.name)}</strong><br><small>${safe(child.birthCert)} · ${safe(child.relationship)} <span class="flow-source">MSF / ICA</span></small></div>`).join('')}
    <button class="btn btn-secondary live" style="margin-top:8px" onclick="flowAskChild(0,'custody')">${t('continue_btn')}</button>`));
};

window.flowAskChild = function (index, field) {
  disableLive();
  const name = flow.claimedChildren[index];
  if (!name) { showParentingUpload(); return; }
  flow.phase = `child-${index}-${field}`;
  const choices = field === 'custody'
    ? [['Joint custody','joint'],['Sole custody to Plaintiff','plaintiff'],['Sole custody to Defendant','defendant']]
    : field === 'careControl'
      ? [['Care and control to Plaintiff','plaintiff'],['Care and control to Defendant','defendant']]
      : [['Reasonable weekend and school-holiday access','reasonable'],['Supervised access','supervised'],['To be agreed later','later']];
  const question = field === 'custody' ? t('custody') : field === 'careControl' ? tx('Care and control', 'Jagaan dan kawalan') : tx('Access', 'Akses');
  addAI(() => addMsg(`<p>${tx('For', 'Untuk')} <strong>${safe(name)}</strong>, ${tx('please choose the', 'sila pilih')} ${question.toLowerCase()} ${tx('arrangement.', 'yang sesuai.')}</p>
    <div class="flow-actions">${choices.map(([label,value]) => `<button class="btn live" onclick="flowChooseChild(${index},'${field}','${value}')">${safe(label)}</button>`).join('')}</div>`));
};

window.flowChooseChild = function (index, field, value) {
  const labels = {
    joint: 'Joint custody', plaintiff: field === 'custody' ? 'Sole custody to Plaintiff' : 'Plaintiff',
    defendant: field === 'custody' ? 'Sole custody to Defendant' : 'Defendant',
    reasonable: 'Reasonable weekend and school-holiday access',
    supervised: 'Supervised access', later: 'To be agreed later',
  };
  const name = flow.claimedChildren[index];
  flow.custody[name] = { ...(flow.custody[name] || {}), [field]: labels[value] };
  disableLive(); addUser(safe(labels[value])); renderClaimedChildren();
  if (field === 'custody') setTimeout(() => flowAskChild(index,'careControl'), 280);
  else if (field === 'careControl') setTimeout(() => flowAskChild(index,'access'), 280);
  else if (index + 1 < flow.claimedChildren.length) setTimeout(() => flowAskChild(index + 1,'custody'), 280);
  else {
    fillField('f_custody', flow.claimedChildren.map((child) => `${child}: ${flow.custody[child]?.custody || '—'} / ${flow.custody[child]?.careControl || '—'}`).join('; '),'sec_children');
    setTimeout(showParentingUpload, 280);
  }
};

function showParentingUpload() {
  flow.phase = 'parenting-upload';
  addAI(() => addMsg(`<p>${tx('Thank you. Please upload the Parenting Plan now. I will compare it with the arrangements you gave me and the child records.', 'Terima kasih. Sila muat naik Pelan Keibubapaan sekarang. Saya akan membandingkannya dengan aturan yang anda berikan dan rekod anak.')}</p>
    ${uploadMarkup('children',tx('Parenting Plan (Form 11)', 'Pelan Keibubapaan (Borang 11)'))}`));
}

function childrenFindings() {
  const findings = [];
  const plan = flow.extraction.children;
  if (!plan) return findings;
  if (!sameNames(filing.mcp.children || [], flow.claimedChildren)) findings.push({
    id: 'children.mcp_os_count_mismatch',
    title: tx('Children in MCP and the application differ', 'Anak dalam MCP dan permohonan berbeza'),
    values: [['MCP', (filing.mcp.children || []).join(', ') || 'None'], ['Originating Summons', flow.claimedChildren.join(', ') || 'None']],
  });
  if (!sameNames(filing.children.relief || [], plan.planChildren || [])) findings.push({
    id: 'children.relief_plan_mismatch',
    title: tx('Parenting Plan and relief claim differ', 'Pelan Keibubapaan dan tuntutan berbeza'),
    values: [['Relief claim', (filing.children.relief || []).join(', ') || 'None'], ['Parenting Plan', (plan.planChildren || []).join(', ') || 'None']],
  });
  for (const name of flow.claimedChildren) {
    const response = flow.custody[name] || {};
    if (!plan.planChildren.includes(name)) continue;
    if (response.custody && normal(response.custody) !== normal(plan.custody)) findings.push({
      id: `children.custody.${normal(name)}`, title: `${name}: ${tx('custody differs', 'hak penjagaan berbeza')}`,
      values: [['Application',response.custody],['Parenting Plan',plan.custody]],
    });
    if (response.careControl && normal(response.careControl) !== normal(plan.careControl)) findings.push({
      id: `children.care_control.${normal(name)}`, title: `${name}: ${tx('care and control differs', 'jagaan dan kawalan berbeza')}`,
      values: [['Application',response.careControl],['Parenting Plan',plan.careControl]],
    });
  }
  return findings;
}

function afterParentingUpload() {
  flow.phase = 'parenting-review';
  const p = flow.extraction.children;
  flow.currentFindings = childrenFindings();
  addMsg(`<p>${tx('I extracted these arrangements from the Parenting Plan. Please review them.', 'Saya mengekstrak aturan berikut daripada Pelan Keibubapaan. Sila semak.')}</p>
    <div class="card">${[['Children',p.planChildren.join(', ')],['Residence',p.residence],['Caregiver',p.caregiver],['Education',p.education],['Custody',p.custody],['Care and control',p.careControl],['Access',p.access],['Defendant agreement',p.agreement]]
      .map(([label,value]) => `<div class="card-row"><div class="card-label">${safe(label)}</div><div class="card-value">${safe(value)}</div></div>`).join('')}</div>`);
  showWarnings('children', () => { markSectionDone(4); showHDB(); });
}

showHDB = function () {
  nextStep(7);
  flow.phase = 'property';
  if (!filing.property) {
    markSectionDone(5);
    addAI(() => addMsg(`<p>${tx('No matrimonial property is recorded for this application. We can continue to maintenance.', 'Tiada harta sepencarian direkodkan untuk permohonan ini. Kita boleh meneruskan kepada nafkah.')}</p>
      <button class="btn btn-secondary live" onclick="choice('${t('continue_btn')}',showMaintenance)">${t('continue_btn')}</button>`));
    return;
  }
  const p = filing.property;
  [['f_hdb_addr',p.hdbAddress],['f_hdb_lease',p.lease || '—'],['f_hdb_value',p.value],['f_hdb_loan',p.loan],['f_duration',p.duration || '—']]
    .forEach(([id,value]) => fillField(id,value,id === 'f_hdb_addr' ? 'sec_property' : undefined));
  addAI(() => addMsg(`<p>${tx('I found these HDB property details. Please upload the Property Plan before we decide what should happen to the flat.', 'Saya menemui butiran harta HDB ini. Sila muat naik Pelan Harta sebelum kita memutuskan apa yang patut berlaku kepada flat tersebut.')}</p>
    <div class="card"><div class="card-title">HDB <span class="flow-source">${tx('Retrieved record', 'Rekod diperoleh')}</span></div>
      <div class="card-row"><div class="card-label">${tx('Address', 'Alamat')}</div><div class="card-value">${safe(p.hdbAddress)}</div></div>
      <div class="card-row"><div class="card-label">${tx('Ownership', 'Pemilikan')}</div><div class="card-value">${safe(p.holding)}</div></div>
      <div class="card-row"><div class="card-label">${tx('Outstanding loan', 'Pinjaman tertunggak')}</div><div class="card-value">${safe(p.loan)}</div></div>
      ${p.cpf ? `<div class="card-row"><div class="card-label">${tx('CPF OA balances', 'Baki CPF OA')} <span class="flow-source">CPF</span></div><div class="card-value">${tx('Plaintiff', 'Plaintif')}: ${safe(p.cpf.plaintiffOA)} · ${tx('Defendant', 'Defendan')}: ${safe(p.cpf.defendantOA)}</div></div>` : ''}</div>
    ${uploadMarkup('property',tx('Matrimonial Property Plan (Forms 13/14)', 'Pelan Harta Sepencarian (Borang 13/14)'))}`));
};

function propertyFindings() {
  const p = flow.extraction.property;
  if (!p || !filing.property) return [];
  return normal(p.address) === normal(filing.property.hdbAddress) && normal(p.address) === normal(flow.propertyAddress)
    ? [] : [{
      id: 'property.address_mismatch',
      title: tx('The Property Plan address differs from the records', 'Alamat Pelan Harta berbeza daripada rekod'),
      values: [['HDB',filing.property.hdbAddress],['Originating Summons',flow.propertyAddress],['Property Plan',p.address]],
    }];
}

function afterPropertyUpload() {
  flow.phase = 'property-review';
  const p = flow.extraction.property;
  flow.currentFindings = propertyFindings();
  addMsg(`<p>${tx('I read the following from your Property Plan.', 'Saya membaca perkara berikut daripada Pelan Harta anda.')}</p>
    <div class="card">${[['Address',p.address],['Arrangement',p.arrangement],['CPF refund',p.cpfRefund],['Mortgage',p.mortgage],['Fees',p.fees],['Timeframe',p.timeframe]]
      .filter(([,value]) => value).map(([label,value]) => `<div class="card-row"><div class="card-label">${safe(label)}</div><div class="card-value">${safe(value)}</div></div>`).join('')}</div>`);
  showWarnings('property', showReliefOptions);
}

function showReliefOptions() {
  flow.phase = 'property-relief';
  addAI(() => addMsg(`<p>${tx('How would you like the property arrangement recorded in your application?', 'Bagaimanakah anda mahu aturan harta direkodkan dalam permohonan anda?')}</p>
    <div class="flow-actions"><button class="btn live" onclick="flowRelief('sell')">${t('sell_50')}</button>
      <button class="btn live" onclick="flowRelief('transfer')">${tx("Transfer Defendant's share to Plaintiff", 'Pindahkan bahagian Defendan kepada Plaintif')}</button>
      <button class="btn live" onclick="flowRelief('retain')">${t('retain')}</button></div>`));
}

window.flowRelief = function (kind) {
  const value = kind === 'sell' ? t('sell_50') : kind === 'retain' ? t('retain') : "Transfer Defendant's share to Plaintiff";
  reliefValue = value;
  fillField('f_relief',value,'sec_property');
  markSectionDone(5);
  disableLive(); addUser(safe(value));
  setTimeout(showMaintenance,280);
};

function warningsNext(type) {
  if (type === 'marriage') marriageNext();
  if (type === 'children') { markSectionDone(4); showHDB(); }
  if (type === 'property') showReliefOptions();
}

function showWarnings(type, next) {
  disableLive();
  const open = (flow.currentFindings || []).filter((finding) => !flow.acknowledgements.includes(finding.id));
  if (!open.length) {
    addMsg(`<div class="flow-check">${tx('The information reviewed at this step matches the available records.', 'Maklumat yang disemak pada langkah ini sepadan dengan rekod yang tersedia.')}</div>`);
    next();
    return;
  }
  flow.phase = `warning-${type}`;
  const details = open.map((finding) => `<div class="flow-warning"><strong>${safe(finding.title)}</strong>
    <p>${tx('I noticed these values differ. Please review them before deciding how to continue.', 'Saya mendapati nilai berikut berbeza. Sila semak sebelum memutuskan cara untuk meneruskan.')}</p>
    ${finding.values.map(([source,value]) => `<div class="flow-compare"><span>${safe(source)}</span><span>${safe(value)}</span></div>`).join('')}
    </div>`).join('');
  addAI(() => addMsg(`${details}<div class="flow-actions">
    <button class="btn live" onclick="flowCorrect('${type}')">${tx('Correct application details', 'Betulkan butiran permohonan')}</button>
    <button class="btn live" onclick="flowReupload('${type}')">${tx('Re-upload document', 'Muat naik semula dokumen')}</button>
    <button class="btn btn-secondary live" onclick="flowIgnoreWarnings('${type}')">${tx('Ignore and continue', 'Abaikan dan teruskan')}</button></div>`));
}

window.flowReupload = function (type) {
  document.getElementById(`flow-${type}-file`)?.click();
};

window.flowCorrect = function (type) {
  if (type === 'children') {
    disableLive();
    addAI(() => addMsg(`<p>${tx('Which children should be included in this application for the current marriage?', 'Anak yang manakah patut dimasukkan dalam permohonan bagi perkahwinan semasa?')}</p>
      <div class="flow-actions"><button class="btn live" onclick="flowSetChildren('current')">${tx('Aisyah only', 'Aisyah sahaja')}</button>
      <button class="btn live" onclick="flowSetChildren('both')">${tx('Haziq and Aisyah', 'Haziq dan Aisyah')}</button></div>`));
    return;
  }
  if (type === 'property') {
    disableLive(); flow.pendingEdit = 'property-address';
    addAI(() => addMsg(`<p>${tx('Please type the property address you want recorded in the application. The HDB record will remain unchanged.', 'Sila taip alamat harta yang anda mahu direkodkan dalam permohonan. Rekod HDB tidak akan berubah.')}</p>`));
    return;
  }
  disableLive();
  addAI(() => addMsg(`<p>${tx('Please re-upload the marriage certificate if any detail needs correction.', 'Sila muat naik semula sijil perkahwinan jika ada butiran yang perlu dibetulkan.')}</p>`));
};

window.flowSetChildren = function (which) {
  flow.claimedChildren = which === 'current' ? [...filing.mcp.children] : [...filing.children.os];
  flow.acknowledgements = flow.acknowledgements.filter((id) => !id.startsWith('children.'));
  disableLive(); addUser(which === 'current' ? 'Aisyah only' : 'Haziq and Aisyah');
  renderClaimedChildren();
  flow.currentFindings = childrenFindings();
  showWarnings('children', () => { markSectionDone(4); showHDB(); });
};

window.flowIgnoreWarnings = function (type) {
  const open = (flow.currentFindings || []).filter((finding) => !flow.acknowledgements.includes(finding.id));
  if (!open.length) { warningsNext(type); return; }
  const confirmed = window.confirm(tx(
    'Some information still does not match. Would you like to continue using the current information?\n\nOK: Continue with current information\nCancel: Review and correct',
    'Sesetengah maklumat masih tidak sepadan. Adakah anda mahu meneruskan dengan maklumat semasa?\n\nOK: Teruskan dengan maklumat semasa\nCancel: Semak dan betulkan',
  ));
  if (!confirmed) return;
  flow.acknowledgements.push(...open.map((finding) => finding.id));
  disableLive(); addUser(tx('Continue with current information', 'Teruskan dengan maklumat semasa'));
  saveFiling();
  warningsNext(type);
};

sendFree = function () {
  const box = document.getElementById('inputBox');
  const message = box.value.trim();
  if (!message) return;
  box.value = '';
  addUser(safe(message));
  if (flow.pendingEdit === 'property-address') {
    flow.propertyAddress = message;
    flow.pendingEdit = '';
    let row = document.getElementById('flow-os-property-row');
    if (!row) {
      row = document.createElement('div'); row.id = 'flow-os-property-row'; row.className = 'os-row';
      document.getElementById('sec_property')?.appendChild(row);
    }
    row.innerHTML = `<span class="os-lbl">OS property address</span><span class="os-val filled">${safe(message)}</span>`;
    flow.currentFindings = propertyFindings();
    showWarnings('property', showReliefOptions);
    return;
  }
  if (/^(continue|teruskan)$/i.test(message) && flow.phase.startsWith('warning-')) {
    flowIgnoreWarnings(flow.phase.slice('warning-'.length)); return;
  }
  if (/^(continue|teruskan)$/i.test(message) && flow.phase === 'marriage-upload' && !flow.extraction.marriage) {
    addAI(() => addMsg(`<p>${tx('Please upload the marriage certificate before continuing.', 'Sila muat naik sijil perkahwinan sebelum meneruskan.')}</p>`)); return;
  }
  if (/^(continue|teruskan)$/i.test(message) && flow.phase === 'parenting-upload' && !flow.extraction.children) {
    addAI(() => addMsg(`<p>${tx('Please upload the Parenting Plan before continuing.', 'Sila muat naik Pelan Keibubapaan sebelum meneruskan.')}</p>`)); return;
  }
  if (/^(continue|teruskan)$/i.test(message) && flow.phase === 'property' && filing.property && !flow.extraction.property) {
    addAI(() => addMsg(`<p>${tx('Please upload the Property Plan before choosing a property arrangement.', 'Sila muat naik Pelan Harta sebelum memilih aturan harta.')}</p>`)); return;
  }
  addAI(() => addMsg(`<p>${tx('I am here to help. Please use the choices in our conversation, or tell me when an application detail needs correcting.', 'Saya sedia membantu. Sila gunakan pilihan dalam perbualan kita, atau beritahu saya jika butiran permohonan perlu dibetulkan.')}</p>`));
};

showPreview = function () {
  flow.phase = 'declaration';
  markSectionDone(7);
  const p = filing.person.plaintiff, d = filing.person.defendant;
  const property = filing.property;
  addAI(() => addMsg(`<p>${tx('Here is your application summary. Please review it before making your declaration.', 'Berikut ialah ringkasan permohonan anda. Sila semak sebelum membuat pengisytiharan.')}</p>
    <div class="preview-doc"><div class="doc-header">${t('preview')}</div>
      <div class="doc-section"><div class="doc-label">${t('personal_section')}</div><div class="doc-value">${safe(p.name)} (${safe(p.nric)})<br>${safe(d.name)} (${safe(d.nric)})</div></div>
      <div class="doc-section"><div class="doc-label">${t('marriage_section')}</div><div class="doc-value">${safe(filing.marriage.certNo)} · ${safe(filing.marriage.date)}</div></div>
      <div class="doc-section"><div class="doc-label">${t('custody_section')}</div><div class="doc-value">${flow.claimedChildren.length ? flow.claimedChildren.map(safe).join(', ') : t('no')}</div></div>
      <div class="doc-section"><div class="doc-label">${t('property_section')}</div><div class="doc-value">${property ? `${safe(property.hdbAddress)}<br>${safe(reliefValue || '')}` : t('no')}</div></div>
      <div class="doc-section"><div class="doc-label">${t('maint_section')}</div><div class="doc-value">${t('child_nafkah')}: SGD ${safe(childNaf)}/mth · ${t('self_nafkah')}: SGD ${safe(selfNaf)}</div></div>
      ${flow.acknowledgements.length ? `<div class="doc-section"><div class="doc-label">${tx('Discrepancies acknowledged', 'Perbezaan diakui')}</div><div class="doc-value">${flow.acknowledgements.map(safe).join(', ')}</div></div>` : ''}
    </div>
    <label class="check-box"><input type="checkbox" id="flow-declaration" onchange="document.getElementById('flow-submit').disabled=!this.checked">${t('i_declare')}</label>
    <button class="btn btn-primary live" id="flow-submit" disabled onclick="doSubmit()" style="width:100%;margin-top:10px">${t('complete_btn')}</button>`));
};

doSubmit = function () {
  if (!document.getElementById('flow-declaration')?.checked) return;
  flow.phase = 'agreement';
  fillField('f_ref',filing.caseRef);
  fillField('f_date',filing.filingDate);
  fillField('f_declarant',filing.person.plaintiff.name);
  fillField('f_declare_date',filing.filingDate);
  fillField('f_declare_status',tx('Declared', 'Diisytiharkan'),'sec_declare');
  markSectionDone(8);
  saveFiling();
  showFollowup('agreement');
};

function followupSteps(active) {
  const stages = [['filing','Originating Summons'],['agreement','Agreement'],['payment','Payment'],['complete','Complete']];
  return `<div class="flow-steps">${stages.map(([id,title]) => `<span class="${id === active ? 'active' : ''}">${title}</span>`).join('')}</div>`;
}

function showFollowup(view) {
  flow.view = view; saveFiling();
  let panel = document.getElementById('flow-followup');
  if (!panel) { panel = document.createElement('div'); panel.id = 'flow-followup'; panel.className = 'flow-followup'; document.body.appendChild(panel); }
  const heading = view === 'dashboard' ? tx('Ongoing filing', 'Pemfailan sedang berjalan') : 'Filing of Originating Summons for Divorce';
  let content = '';
  if (view === 'dashboard') content = `<h1>${heading}</h1><p>${tx('You can return to your saved application at any time.', 'Anda boleh kembali ke permohonan yang disimpan pada bila-bila masa.')}</p>
    <div class="flow-followup-card"><strong>${safe(filing.caseRef)}</strong><p>${tx('Originating Summons · Draft', 'Saman Pemula · Draf')}</p>
    <button class="btn btn-primary" onclick="flowNextView('filing')">${tx('Continue filing', 'Teruskan pemfailan')}</button></div>`;
  if (view === 'agreement') content = `${followupSteps(view)}<h1>${heading}</h1>
    <div class="flow-followup-card"><p>${tx('Please confirm how you will receive documents and correspondence after the Originating Summons is issued.', 'Sila sahkan cara anda akan menerima dokumen dan surat-menyurat selepas Saman Pemula dikeluarkan.')}</p>
    <label><input id="flow-agreement" type="checkbox">${tx('I agree to receive court documents and correspondence through the SYC Portal.', 'Saya bersetuju menerima dokumen dan surat-menyurat mahkamah melalui Portal SYC.')}</label><br>
    <button class="btn btn-primary" onclick="flowNextView('payment')">${tx('Continue to payment', 'Teruskan ke pembayaran')}</button></div>`;
  if (view === 'payment') content = `${followupSteps(view)}<h1>${heading}</h1>
    <div class="flow-followup-card"><p>${tx('Review the filing fees and choose a payment option.', 'Semak fi pemfailan dan pilih kaedah pembayaran.')}</p>
      <p>Originating Summons: SGD 22<br>Case Statement: SGD 12${flow.uploads.children ? '<br>Parenting Plan: SGD 12' : ''}${flow.uploads.property ? '<br>Property Plan: SGD 12' : ''}</p>
      <label><input type="radio" name="flow-payment" value="PayNow" checked>PayNow</label><br>
      <label><input type="radio" name="flow-payment" value="eNETS / Credit Card">eNETS / Credit Card</label><br>
      <label><input type="radio" name="flow-payment" value="Fee waiver">Request for fee waiver</label><br>
      <button class="btn btn-primary" onclick="flowNextView('complete')">${tx('Continue', 'Teruskan')}</button></div>`;
  if (view === 'complete') content = `${followupSteps(view)}<h1>${tx('Application steps completed', 'Langkah permohonan selesai')}</h1>
    <div class="flow-followup-card"><p>${tx('Your application information and decisions have been saved under reference', 'Maklumat permohonan dan keputusan anda telah disimpan di bawah rujukan')} <strong>${safe(filing.caseRef)}</strong>.</p>
    <p>${tx('Payment and court issuance would be confirmed by the connected filing service.', 'Pembayaran dan pengeluaran oleh mahkamah akan disahkan oleh perkhidmatan pemfailan yang disambungkan.')}</p>
    <button class="btn btn-primary" onclick="flowNextView('dashboard')">${tx('Return to dashboard', 'Kembali ke papan pemuka')}</button></div>`;
  panel.innerHTML = `<div class="flow-followup-header">Syariah Court Singapore</div><div class="flow-followup-inner">${content}</div>`;
}

window.flowNextView = function (view) {
  if (view === 'payment' && !document.getElementById('flow-agreement')?.checked) {
    window.alert(tx('Please confirm the agreement before continuing.', 'Sila sahkan persetujuan sebelum meneruskan.')); return;
  }
  if (view === 'filing') {
    flow.view = 'filing'; document.getElementById('flow-followup')?.remove(); saveFiling(); return;
  }
  showFollowup(view);
};
