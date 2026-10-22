/* Runs after the supplied ideal-flow script, inside its iframe. */
let filing = window.SYC_FILING_CASE;
let legacyFilingStoreKeys = [];
let filingStoreKey = '';
function useFilingCase(id) {
  filing = window.SYC_FILING_CASES?.[id] || filing;
  legacyFilingStoreKeys = ['', '_v2', '_v3', '_v4'].map((suffix) => `syc_filing${suffix}_${filing.sessionId}`);
  filingStoreKey = `syc_filing_v5_${filing.sessionId}`;
}
useFilingCase(filing.id);
const freshFlow = () => ({
  claimedChildren: [...(filing.children.os || [])],
  custody: {},
  uploads: {},
  extraction: {},
  acknowledgements: [],
  acknowledgementTitles: {},
  phase: 'welcome',
  view: 'filing',
  propertyAddress: filing.property?.osAddress || '',
});
let flow = freshFlow();
let entryView = 'login';
let restarting = false;

const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const normal = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sameNames = (left, right) => left.length === right.length &&
  [...left].map(normal).sort().every((name, index) => name === [...right].map(normal).sort()[index]);
const tx = (en, bm) => lang === 'bm' ? bm : en;
/** Scales of justice, carried by every header. */
const courtMark = `<span class="court-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="8" r="1.6"/><path d="M20 9.6v21.4M13 31h14M7 13h26M7 13v3M33 13v3M1.5 16a5.5 5.5 0 0 0 11 0M27.5 16a5.5 5.5 0 0 0 11 0"/></svg></span>`;
const courtWordmark = () => `${courtMark}<span>Syariah Court Singapore</span>`;
text.en.complete_btn = 'Submit';
text.bm.complete_btn = 'Hantar';

function saveFiling() {
  if (restarting) return;
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
fillField = function (id, value, section) {
  sourceFillField(id, value, section);
  if (section) setFocusedSection(section, { work: true });
  saveFiling();
};
const sourceMarkDone = markSectionDone;
markSectionDone = function (number) { sourceMarkDone(number); syncJourney(); saveFiling(); };
const sourceDrawProg = drawProg;
drawProg = function () {
  sourceDrawProg();
  document.getElementById('chatUserBadge').textContent = filing.person.plaintiff.name;
  syncJourney();
};
const sourceSetLang = setLang;
setLang = function (chosen) {
  flow = freshFlow();
  localStorage.removeItem(filingStoreKey);
  sourceSetLang(chosen);
  updateWorkbenchCopy();
};

const workbenchSections = [
  ['sec_parties', 'Parties', 'Parti'],
  ['sec_marriage', 'Marriage details', 'Butiran perkahwinan'],
  ['sec_grounds', 'Grounds for divorce', 'Alasan perceraian'],
  ['sec_children', 'Children & custody', 'Anak & hak penjagaan'],
  ['sec_property', 'Matrimonial property', 'Harta sepencarian'],
  ['sec_maint', 'Maintenance', 'Nafkah'],
  ['sec_bk', 'Court proceedings', 'Prosiding mahkamah'],
  ['sec_declare', 'Declaration', 'Pengisytiharan'],
];
let focusedSectionId = 'sec_parties';
let currentWorkSectionId = 'sec_parties';

function sectionLabel(id) {
  const section = workbenchSections.find(([sectionId]) => sectionId === id);
  return section ? section[lang === 'bm' ? 2 : 1] : '';
}

function setFocusedSection(id, { work = false } = {}) {
  if (!workbenchSections.some(([sectionId]) => sectionId === id)) return;
  focusedSectionId = id;
  flow.focusedSectionId = id;
  if (work) {
    currentWorkSectionId = id;
    flow.currentWorkSectionId = id;
  }
  document.body.classList.remove('is-reviewing');
  syncJourney();
  const panel = document.getElementById('formPanel');
  if (panel?.scrollTop) panel.scrollTo({ top: 0, behavior: 'smooth' });
}

function setReviewMode(enabled) {
  document.body.classList.toggle('is-reviewing', enabled);
  syncJourney();
  const panel = document.getElementById('formPanel');
  if (panel) panel.scrollTo({ top: 0, behavior: 'smooth' });
}

function syncJourney() {
  const rail = document.getElementById('journeyRail');
  if (!rail) return;
  const reviewing = document.body.classList.contains('is-reviewing');
  let completed = 0;
  workbenchSections.forEach(([id], index) => {
    const button = rail.querySelector(`[data-section="${id}"]`);
    const section = document.getElementById(id);
    const done = document.getElementById(`secn_${index + 1}`)?.classList.contains('done');
    if (done) completed += 1;
    button?.classList.toggle('is-done', Boolean(done));
    button?.classList.toggle('is-current', id === currentWorkSectionId && !reviewing);
    if (button) {
      button.setAttribute('aria-current', id === focusedSectionId && !reviewing ? 'page' : 'false');
      button.querySelector('.journey-step-num').textContent = done ? '' : String(index + 1);
      button.setAttribute('aria-label', `${sectionLabel(id)}. ${done ? tx('Complete', 'Lengkap') : id === currentWorkSectionId ? tx('Current section', 'Bahagian semasa') : tx('Not complete', 'Belum lengkap')}.`);
    }
    section?.classList.toggle('is-focus', id === focusedSectionId && !reviewing);
  });
  const progress = rail.querySelector('.journey-progress span');
  if (progress) progress.style.width = `${Math.round((completed / workbenchSections.length) * 100)}%`;
  const count = rail.querySelector('.journey-count');
  if (count) count.textContent = tx(`${completed} of 8 sections complete`, `${completed} daripada 8 bahagian lengkap`);
  const title = document.getElementById('workspaceTitle');
  const description = document.getElementById('workspaceDescription');
  const toggle = document.getElementById('workspaceToggle');
  if (title) title.textContent = reviewing ? tx('Review your complete application', 'Semak permohonan lengkap anda') : sectionLabel(focusedSectionId);
  if (description) description.textContent = reviewing
    ? tx('Every section is shown together for your final check before declaration.', 'Setiap bahagian ditunjukkan bersama untuk semakan akhir sebelum pengisytiharan.')
    : tx('This section updates as you work with Aisha. Use the journey to inspect another section.', 'Bahagian ini dikemas kini semasa anda bersama Aisha. Gunakan perjalanan untuk melihat bahagian lain.');
  if (toggle) toggle.textContent = reviewing ? tx('Return to current section', 'Kembali ke bahagian semasa') : tx('View full application', 'Lihat permohonan penuh');
  const context = document.getElementById('chatContextSection');
  if (context) context.textContent = sectionLabel(currentWorkSectionId);
}

function updateWorkbenchCopy() {
  document.documentElement.lang = lang === 'bm' ? 'ms' : 'en';
  const railTitle = document.querySelector('.journey-head h2');
  const railText = document.querySelector('.journey-head p');
  const railFoot = document.querySelector('.journey-foot');
  if (railTitle) railTitle.textContent = tx('Your application', 'Permohonan anda');
  if (railText) railText.textContent = tx('Move between sections without losing your place.', 'Bergerak antara bahagian tanpa kehilangan tempat anda.');
  if (railFoot) railFoot.textContent = tx('Your answers are saved in this browser as you progress.', 'Jawapan anda disimpan dalam pelayar ini semasa anda meneruskan.');
  workbenchSections.forEach(([id, en, bm]) => {
    const label = document.querySelector(`[data-section="${id}"] .journey-step-label`);
    if (label) label.textContent = lang === 'bm' ? bm : en;
  });
  const chatGuide = document.querySelector('.chat-context span');
  if (chatGuide) chatGuide.textContent = tx('Guided filing', 'Pemfailan berpandu');
  const rail = document.getElementById('journeyRail');
  if (rail) rail.setAttribute('aria-label', tx('Application progress', 'Kemajuan permohonan'));
  const chat = document.querySelector('.chat-panel');
  if (chat) chat.setAttribute('aria-label', tx('Aisha filing assistant', 'Pembantu pemfailan Aisha'));
  const chatSub = document.getElementById('chatSub');
  if (chatSub) chatSub.textContent = tx('Your filing guide', 'Panduan pemfailan anda');
  const input = document.getElementById('inputBox');
  if (input) input.setAttribute('aria-label', tx('Message Aisha', 'Mesej Aisha'));
  const send = document.getElementById('sendBtn');
  if (send) send.setAttribute('aria-label', tx('Send message', 'Hantar mesej'));
  const dashboard = document.querySelector('.flow-dash-link:not(.flow-restart-link)');
  if (dashboard) dashboard.textContent = tx('Dashboard', 'Papan pemuka');
  const restart = document.querySelector('.flow-restart-link');
  if (restart) {
    restart.textContent = tx('Start over', 'Mula semula');
    restart.title = tx('Clear this draft and start again', 'Kosongkan draf ini dan mula semula');
  }
  syncJourney();
}

function buildWorkbench() {
  document.body.classList.add('syc-workbench');
  focusedSectionId = flow.focusedSectionId || focusedSectionId;
  currentWorkSectionId = focusedSectionId;

  const topBar = document.querySelector('.top-bar');
  const logo = document.querySelector('.top-logo');
  const actionButtons = [...document.querySelectorAll('.flow-dash-link')];
  if (logo) {
    logo.innerHTML = `${courtMark}<span id="topLogo">Syariah Court Singapore</span>`;
  }
  if (topBar) {
    const actions = document.createElement('div');
    actions.className = 'top-actions';
    actionButtons.forEach((button) => actions.appendChild(button));
    const languages = document.querySelector('.lang-row');
    if (languages) actions.appendChild(languages);
    topBar.appendChild(actions);
  }

  const main = document.querySelector('.main-layout');
  const panel = document.getElementById('formPanel');
  if (main && panel && !document.getElementById('journeyRail')) {
    const rail = document.createElement('aside');
    rail.id = 'journeyRail';
    rail.className = 'journey-rail';
    rail.setAttribute('aria-label', 'Application progress');
    rail.innerHTML = `<div class="journey-head"><h2>Your application</h2><p>Move between sections without losing your place.</p><div class="journey-progress" aria-hidden="true"><span></span></div><span class="journey-count"></span></div><nav class="journey-list">${workbenchSections.map(([id, label], index) => `<button class="journey-step" type="button" data-section="${id}"><span class="journey-step-num">${index + 1}</span><span class="journey-step-label">${label}</span></button>`).join('')}</nav><p class="journey-foot">Your answers are saved in this browser as you progress.</p>`;
    rail.addEventListener('click', (event) => {
      const button = event.target.closest('[data-section]');
      if (button) setFocusedSection(button.dataset.section);
    });
    main.insertBefore(rail, panel);

    const heading = document.createElement('div');
    heading.className = 'workspace-heading';
    heading.innerHTML = `<div class="workspace-copy"><h1 id="workspaceTitle"></h1><p id="workspaceDescription"></p></div><button id="workspaceToggle" class="workspace-toggle" type="button"></button>`;
    heading.querySelector('#workspaceToggle').addEventListener('click', () => {
      if (document.body.classList.contains('is-reviewing')) setFocusedSection(currentWorkSectionId);
      else setReviewMode(true);
    });
    panel.insertBefore(heading, panel.firstChild);
  }
  setupSplitHandle();

  const chat = document.querySelector('.chat-panel');
  const avatar = document.querySelector('.chat-avatar');
  if (chat) {
    chat.setAttribute('role', 'region');
    chat.setAttribute('aria-label', 'Aisha filing assistant');
  }
  if (avatar) avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 10h8M9 14h4l3 2v-2.5a6 6 0 1 0-8 0V14Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4V2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const chatName = document.getElementById('chatName');
  const chatSub = document.getElementById('chatSub');
  if (chatName) chatName.textContent = 'Aisha';
  if (chatSub) chatSub.textContent = tx('Your filing guide', 'Panduan pemfailan anda');
  const progress = document.querySelector('.chat-prog');
  if (progress && !document.getElementById('chatContextSection')) {
    const context = document.createElement('div');
    context.className = 'chat-context';
    context.innerHTML = `<span>Guided filing</span><strong id="chatContextSection"></strong>`;
    progress.parentNode.insertBefore(context, progress);
  }
  const messages = document.getElementById('chatBox');
  if (messages) {
    messages.setAttribute('aria-live', 'polite');
    messages.setAttribute('aria-relevant', 'additions text');
  }
  const input = document.getElementById('inputBox');
  if (input) input.setAttribute('aria-label', tx('Message Aisha', 'Mesej Aisha'));
  const send = document.getElementById('sendBtn');
  if (send) send.setAttribute('aria-label', tx('Send message', 'Hantar mesej'));
  updateWorkbenchCopy();
}

const SPLIT_KEY = 'syc_split_v1';
function setupSplitHandle() {
  const main = document.querySelector('.main-layout');
  const panel = document.getElementById('formPanel');
  const chat = document.querySelector('.chat-panel');
  if (!main || !panel || !chat || document.getElementById('splitHandle')) return;

  const handle = document.createElement('div');
  handle.id = 'splitHandle';
  handle.className = 'split-handle';
  handle.tabIndex = 0;
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-orientation', 'vertical');
  handle.setAttribute('aria-label', tx('Resize the application and assistant panels', 'Ubah saiz panel permohonan dan pembantu'));
  main.insertBefore(handle, chat);

  // --form-frac is a share of the whole grid, so the rail width has to come out of the maths.
  function apply(percent) {
    const total = main.clientWidth;
    if (!total) return null;
    const rail = panel.getBoundingClientRect().left - main.getBoundingClientRect().left;
    const spare = total - rail - handle.offsetWidth;
    const min = Math.min(300, spare * 0.3) / total * 100;
    const max = (spare - Math.min(340, spare * 0.35)) / total * 100;
    const value = Math.round(Math.min(Math.max(percent, min), max) * 10) / 10;
    main.style.setProperty('--form-frac', `${value}%`);
    handle.setAttribute('aria-valuenow', String(Math.round(value)));
    return value;
  }

  let current = Number(localStorage.getItem(SPLIT_KEY)) || 44;
  current = apply(current) ?? current;

  function commit() {
    document.body.classList.remove('is-dragging');
    localStorage.setItem(SPLIT_KEY, String(current));
  }
  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    document.body.classList.add('is-dragging');
  });
  handle.addEventListener('pointermove', (event) => {
    if (!handle.hasPointerCapture(event.pointerId)) return;
    const left = panel.getBoundingClientRect().left;
    current = apply((event.clientX - left) / main.clientWidth * 100) ?? current;
  });
  handle.addEventListener('pointerup', commit);
  handle.addEventListener('pointercancel', commit);
  handle.addEventListener('dblclick', () => { current = apply(44) ?? current; commit(); });
  handle.addEventListener('keydown', (event) => {
    const step = event.key === 'ArrowLeft' ? -2 : event.key === 'ArrowRight' ? 2 : 0;
    if (!step) return;
    event.preventDefault();
    current = apply(current + step) ?? current;
    commit();
  });
  window.addEventListener('resize', () => { current = apply(current) ?? current; });
}

function addFilingStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .flow-source{font-size:10px;color:#7a6563;border:1px solid #e7d6d3;border-radius:999px;padding:2px 7px;white-space:nowrap}
    .flow-upload{border:1.5px dashed #bf8983;background:#fffafa;border-radius:9px;padding:12px;margin-top:9px}
    .flow-upload strong{display:block;color:#660d07;font-size:12px;margin-bottom:5px}
    .flow-upload input{display:block;width:100%;font-size:11px;margin:8px 0;color:#444}
    .flow-file{font-size:11px;color:#526254;margin-top:5px;line-height:1.5}
    .flow-verification-note{font-size:10.5px;line-height:1.45;color:#6f5d5a;margin:7px 0 0;padding-top:7px;border-top:1px solid #eadfdd}
    .flow-warning{background:#fff8e6;border:1px solid #d5ae50;border-radius:8px;padding:11px;margin:8px 0;color:#5e4d25}
    .flow-warning strong{display:block;font-size:12px;margin-bottom:5px}
    .flow-warning p{font-size:11.5px;margin:4px 0 8px}
    .flow-warning.flow-warning-resolved{background:#edf7ef;border-color:#8dc39b;color:#255b34}
    .flow-warning.flow-warning-resolved p{margin-bottom:0}
    .flow-compare{display:grid;grid-template-columns:90px 1fr;gap:4px 7px;padding:4px 0;border-top:1px solid #eadcb9;font-size:11px}
    .flow-compare span:first-child{color:#786b53}
    .flow-check{background:#edf7ef;border:1px solid #8dc39b;border-radius:8px;padding:9px 11px;margin-top:8px;font-size:11.5px;color:#255b34}
    .flow-prompt{font-size:12px;color:#424242;line-height:1.6}
    .flow-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
    .flow-actions .btn{border:1px solid #c99d98}
    .flow-risk{border-left:4px solid #bf6a50;background:#fff2ef;border-radius:4px;padding:10px;margin:8px 0;font-size:11.5px}
    .flow-followup{position:fixed;inset:0;background:#fff;z-index:500;overflow:auto;font-family:'Inter',system-ui,sans-serif}
    .flow-followup-header{background:#660d07;color:#fff;padding:18px 26px;font-family:var(--font-display);font-size:23px}
    .flow-followup-header .court-mark{width:30px;height:30px;display:inline-grid;place-items:center;vertical-align:-7px;margin-right:10px}
    .flow-followup-header .court-mark svg{width:100%;height:100%;display:block}
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
    .flow-restart-link{white-space:nowrap}
    .flow-followup-restart{float:right;background:transparent;color:#fff;border:1px solid #f3b6ae;border-radius:5px;padding:6px 10px;font:12px 'Inter',system-ui,sans-serif;cursor:pointer}
    .flow-entry-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:22px}
    .flow-id-list{display:grid;gap:10px;margin-top:22px}
    .flow-id-card{border:1px solid #e4dad7;border-radius:10px;background:#fffdfc;overflow:hidden}
    .flow-id-card[open]{border-color:#660d07}
    .flow-id-card summary{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;list-style:none}
    .flow-id-card summary::-webkit-details-marker{display:none}
    .flow-id-card summary:hover{background:#fdf5f4}
    .flow-id-avatar{width:36px;height:36px;border-radius:50%;background:#f3b6ae;color:#660d07;display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0}
    .flow-id-who{display:flex;flex-direction:column;min-width:0}
    .flow-id-who small{color:#7a6b68;font-size:11.5px}
    .flow-id-open{margin-left:auto;font-size:11.5px;font-weight:700;color:#660d07;white-space:nowrap}
    .flow-id-card[open] .flow-id-open{opacity:.55}
    .flow-id-body{padding:0 16px 16px;border-top:1px solid #f0e6e4}
    .flow-id-note{font-size:11.5px;color:#7a6b68;margin:12px 0}
    .flow-id-body section{margin-bottom:12px}
    .flow-id-body h3{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#9a8a87;margin-bottom:5px}
    .flow-id-rows{display:grid;gap:2px}
    .flow-id-rows>div{display:grid;grid-template-columns:minmax(120px,34%) 1fr;gap:10px;padding:4px 0;border-bottom:1px solid #f4ecea;font-size:12px}
    .flow-id-rows>div:last-child{border-bottom:0}
    .flow-id-rows dt{color:#7a6b68}
    .flow-id-rows dd{font-weight:600;overflow-wrap:anywhere}
    .flow-id-empty{font-size:12px;color:#7a6b68}
    .flow-entry-card{border:1px solid #e4dad7;border-radius:9px;background:#fffdfc;padding:22px}
    .flow-entry-card h2{color:#660d07;font-size:19px;margin:0 0 10px}
    .flow-entry-card p{margin:0 0 12px}
    .flow-entry-kicker{color:#755a55;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em}
    .flow-mode-page{border:1px solid #eadbd8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 2px 10px rgba(74,26,20,.06)}
    .flow-mode-banner{background:linear-gradient(100deg,#660d07,#981d15);color:#fff;padding:21px 25px}
    .flow-mode-banner .flow-entry-kicker{color:#f2cbc7;margin-bottom:7px}
    .flow-mode-banner h1{color:#fff;margin:0;font-size:27px}
    .flow-mode-intro{background:#f7f1ef;border-bottom:1px solid #eadbd8;padding:14px 25px;color:#4d4442;font-size:13px;line-height:1.6}
    .flow-mode-form{padding:23px 25px 25px}
    .flow-mode-form fieldset{border:0;padding:0;margin:0}
    .flow-mode-form legend{font-size:15px;font-weight:700;color:#292322;margin-bottom:13px}
    .flow-mode-options{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
    .flow-mode-option{display:flex;align-items:flex-start;gap:11px;border:1px solid #d9cecc;border-radius:7px;padding:15px;cursor:pointer;background:#fff;transition:border-color .15s,background .15s,box-shadow .15s}
    .flow-mode-option:hover{border-color:#a55750;background:#fffafa}
    .flow-mode-option:has(input:checked){border-color:#7b130c;background:#fff5f3;box-shadow:0 0 0 1px #7b130c inset}
    .flow-mode-option input{margin-top:3px;accent-color:#7b130c;flex:0 0 auto}
    .flow-mode-option strong{display:block;color:#660d07;font-size:14px;margin-bottom:4px}
    .flow-mode-option small{display:block;color:#655b59;font-size:11.5px;line-height:1.5}
    .flow-mode-submit{min-width:108px}
    .flow-standard-card{border-left:4px solid #660d07}
    .flow-entry-lang{float:right;display:flex;gap:6px}
    .flow-entry-lang button{border:1px solid #f3b6ae;border-radius:4px;background:transparent;color:#fff;padding:3px 8px;cursor:pointer}
    .flow-entry-lang button.active{background:#fff;color:#660d07}
    .chat-messages>div{display:flex;width:100%;min-width:0}
    .ai-bubble,.user-bubble{width:max-content;min-width:0}
    .ai-bubble{align-self:flex-start}
    .user-bubble{align-self:flex-end;margin-left:auto}
    .consent-sources{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
    .consent-source{display:grid;grid-template-columns:30px minmax(0,1fr);align-items:center;gap:8px;background:#fffafa;border:1px solid #dec8c5;border-radius:7px;padding:9px}
    .consent-source-mark{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#660d07;color:#fff;font-size:10px;font-weight:800;letter-spacing:.2px}
    .consent-source strong{display:block;color:#660d07;font-size:11px}
    .consent-source small{display:block;color:#6e6260;font-size:10px;line-height:1.35;margin-top:1px;overflow-wrap:anywhere}
    html,body{width:100%;max-width:100%;overflow-x:hidden}
    .main-layout,.form-panel,.chat-panel,.chat-messages,.ai-bubble,.card,.flow-upload{min-width:0;max-width:100%}
    .form-panel{padding-right:calc(min(380px,44vw) + 20px)}
    .chat-panel{width:min(380px,44vw)}
    .card-row{gap:10px;align-items:flex-start;min-width:0}
    .card-label{flex:0 1 45%;min-width:0;overflow-wrap:anywhere}
    .card-value{flex:1 1 55%;min-width:0;overflow-wrap:anywhere;word-break:break-word}
    .flow-compare{grid-template-columns:minmax(72px,90px) minmax(0,1fr)}
    .flow-compare span{min-width:0;overflow-wrap:anywhere;word-break:break-word}
    .flow-upload input,.fin,.fsel,.chat-input-box{min-width:0;max-width:100%}
    .os-row{min-width:0}
    .os-val{min-width:0;overflow-wrap:anywhere;word-break:break-word}
    @media(max-width:1050px){
      .top-steps{display:none}
      .os-grid,.fgrid{grid-template-columns:1fr}
      .os-row{flex-wrap:wrap}
      .os-lbl{min-width:118px}
    }
    @media(max-width:760px){
      .top-bar{padding:0 8px;gap:5px}
      .top-logo{display:flex;align-items:center;min-width:0;font-size:12px}
      .top-logo>span:first-child{display:none}
      .flow-dash-link{margin-left:4px;padding:3px 6px}
      .lang-btn{padding:3px 7px}
      .main-layout{display:block;padding-top:52px}
      .form-panel{padding:14px 12px calc(50vh + 24px)}
      .os-doc{width:100%;max-width:100%}
      .os-section{padding:12px 14px}
      .chat-panel{top:auto;left:0;right:0;bottom:0;width:100%;max-width:100%;height:48vh;border-left:0;border-top:1px solid #e0e6ef}
      .chat-user-badge{max-width:35%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .flow-followup-header{padding:14px;font-size:18px}
      .flow-followup-inner{margin:18px auto;padding:0 14px}
      .consent-sources{grid-template-columns:1fr}
      .flow-mode-banner,.flow-mode-intro,.flow-mode-form{padding-left:16px;padding-right:16px}
      .flow-mode-banner h1{font-size:22px}
      .flow-mode-options{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);
  const link = document.createElement('button');
  link.className = 'flow-dash-link';
  link.textContent = tx('Dashboard', 'Papan pemuka');
  link.onclick = () => showFollowup('dashboard');
  document.querySelector('.top-logo')?.appendChild(link);
  const restart = document.createElement('button');
  restart.id = 'flow-restart';
  restart.className = 'flow-dash-link flow-restart-link';
  restart.textContent = tx('Start over', 'Mula semula');
  restart.title = tx('Clear this draft and start again', 'Kosongkan draf ini dan mula semula');
  restart.onclick = () => window.flowRestart();
  document.querySelector('.top-logo')?.appendChild(restart);
}

window.flowRestart = function () {
  const confirmed = window.confirm(tx(
    'Restart this application? Your current chat, answers, and uploaded-document selections will be cleared.',
    'Mulakan semula permohonan ini? Perbualan, jawapan dan pilihan dokumen yang dimuat naik akan dikosongkan.',
  ));
  if (!confirmed) return;
  restarting = true;
  localStorage.removeItem(filingStoreKey);
  window.parent.location.reload();
};

function resetApplicantState() {
  flow = freshFlow();
  addlData = {
    p: { edu: filing.education.plaintiff, occ: filing.occupation.plaintiff, sal: normal(filing.salary.plaintiff).replace(/[^0-9]/g, '') || '5800' },
    d: { edu: filing.education.defendant, occ: filing.occupation.defendant, sal: normal(filing.salary.defendant).replace(/[^0-9]/g, '') || '6200' },
  };
}

window.onload = () => {
  addFilingStyles();
  buildWorkbench();
  legacyFilingStoreKeys.forEach((key) => localStorage.removeItem(key));
  resetApplicantState();
  let saved;
  try { saved = JSON.parse(localStorage.getItem(filingStoreKey)); } catch { saved = null; }
  if (saved?.flow) {
    restoreFiling(saved);
    currentWorkSectionId = flow.currentWorkSectionId || flow.focusedSectionId || currentWorkSectionId;
    if (flow.phase === 'declaration') setReviewMode(true);
    else setFocusedSection(flow.focusedSectionId || currentWorkSectionId);
  }
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
      <button class="btn btn-primary" onclick="flowEntryNext('identity')">${tx('Log in with Singpass', 'Log masuk dengan Singpass')}</button></div></div>`;
  if (view === 'identity') content = `<div class="flow-entry-kicker">Singpass</div><h1>${tx('Choose a Singpass identity', 'Pilih identiti Singpass')}</h1>
    <p>${tx('Open an identity to see the records that will be retrieved into the Originating Summons, then continue with it.', 'Buka satu identiti untuk melihat rekod yang akan diperoleh ke dalam Saman Pemula, kemudian teruskan dengannya.')}</p>
    <div class="flow-id-list">${Object.keys(window.SYC_FILING_CASES || {}).map(identityCard).join('')}</div>`;
  if (view === 'dashboard') content = `<div class="flow-entry-kicker">SYC e-Services</div><h1>${tx('Welcome', 'Selamat datang')}, ${safe(filing.person.plaintiff.name)}</h1>
    <p>${tx('Choose the service you need today.', 'Pilih perkhidmatan yang anda perlukan hari ini.')}</p>
    <div class="flow-entry-grid"><div class="flow-entry-card"><h2>${tx('Divorce filing', 'Pemfailan perceraian')}</h2>
      <p>${tx('Begin an Originating Summons application with guided assistance.', 'Mulakan permohonan Saman Pemula dengan bantuan berpandu.')}</p>
      <button class="btn btn-primary" onclick="flowEntryNext('services')">${tx('Start a divorce application', 'Mulakan permohonan perceraian')}</button></div></div>`;
  if (view === 'services') content = `<div class="flow-mode-page">
    <div class="flow-mode-banner"><div class="flow-entry-kicker">${tx('Divorce e-Services / Filing of Originating Summons for Divorce', 'e-Perkhidmatan Perceraian / Pemfailan Saman Pemula bagi Perceraian')}</div>
      <h1>${tx('Filing of Originating Summons for Divorce', 'Pemfailan Saman Pemula bagi Perceraian')}</h1></div>
    <div class="flow-mode-intro">${tx('Before proceeding, please choose how you would like to complete your application.', 'Sebelum meneruskan, sila pilih cara anda ingin melengkapkan permohonan anda.')}</div>
    <form class="flow-mode-form" onsubmit="flowChooseFilingMode(event)"><fieldset>
      <legend>${tx('How would you like to file?', 'Bagaimanakah anda ingin membuat pemfailan?')}</legend>
      <div class="flow-mode-options">
        <label class="flow-mode-option"><input type="radio" name="filing-mode" value="eservices" required>
          <span><strong>e-Services</strong><small>${tx('Complete the standard online Originating Summons form.', 'Lengkapkan borang Saman Pemula dalam talian yang standard.')}</small></span></label>
        <label class="flow-mode-option"><input type="radio" name="filing-mode" value="companion" required>
          <span><strong>SYC Companion</strong><small>${tx('Receive step-by-step guidance while completing the application.', 'Dapatkan panduan langkah demi langkah semasa melengkapkan permohonan.')}</small></span></label>
      </div>
      <button class="btn btn-primary flow-mode-submit" type="submit">${tx('Submit', 'Hantar')}</button>
    </fieldset></form></div>`;
  if (view === 'standard') content = `<div class="flow-entry-kicker">SYC e-Services</div><h1>${tx('Continue with e-Services', 'Teruskan dengan e-Perkhidmatan')}</h1>
    <div class="flow-entry-card flow-standard-card"><h2>${tx('Standard online filing selected', 'Pemfailan dalam talian standard dipilih')}</h2>
      <p>${tx('You have chosen to complete the Originating Summons using the standard e-Services form.', 'Anda telah memilih untuk melengkapkan Saman Pemula menggunakan borang e-Perkhidmatan standard.')}</p>
      <button class="btn btn-primary" onclick="flowEntryNext('dashboard')">${tx('Return to e-Services dashboard', 'Kembali ke papan pemuka e-Perkhidmatan')}</button>
      <button class="btn" style="margin-left:8px" onclick="flowEntryNext('services')">${tx('Change filing method', 'Tukar kaedah pemfailan')}</button></div>`;
  panel.innerHTML = `<div class="flow-followup-header">${courtWordmark()}
    <span class="flow-entry-lang"><button class="${lang === 'en' ? 'active' : ''}" onclick="flowEntryLanguage('en')">EN</button>
    <button class="${lang === 'bm' ? 'active' : ''}" onclick="flowEntryLanguage('bm')">BM</button></span></div>
    <div class="flow-followup-inner">${content}</div>`;
}

function recordRows(rows) {
  const present = rows.filter(([, value]) => value);
  if (!present.length) return `<p class="flow-id-empty">${tx('No record held.', 'Tiada rekod disimpan.')}</p>`;
  return `<dl class="flow-id-rows">${present.map(([label, value]) =>
    `<div><dt>${safe(label)}</dt><dd>${safe(value)}</dd></div>`).join('')}</dl>`;
}

function identityCard(id) {
  const record = window.SYC_FILING_CASES[id];
  const p = record.person.plaintiff, d = record.person.defendant, m = record.marriage, property = record.property;
  const groups = [
    [`Singpass · ${tx('Applicant', 'Pemohon')}`, [
      [t('full_name'), p.name], [t('nric'), p.nric], [t('dob'), p.dob],
      [tx('Citizenship', 'Kewarganegaraan'), p.citizenship],
      [tx('Education', 'Pendidikan'), record.education.plaintiff],
      [tx('Occupation', 'Pekerjaan'), record.occupation.plaintiff],
      [tx('Gross salary', 'Gaji kasar'), record.salary.plaintiff],
    ]],
    [`ROMM · ${tx('Spouse', 'Pasangan')}`, [
      [t('full_name'), d.name], [t('nric'), d.nric], [t('dob'), d.dob],
      [tx('Citizenship', 'Kewarganegaraan'), d.citizenship],
      [tx('Occupation', 'Pekerjaan'), record.occupation.defendant],
      [tx('Gross salary', 'Gaji kasar'), record.salary.defendant],
    ]],
    [`ROMM · ${tx('Marriage', 'Perkahwinan')}`, [
      [t('cert_no'), m.certNo], [t('marriage_date'), m.date], [t('venue'), m.venue],
      ['Wali', m.wali], [tx('Mahr', 'Mas kahwin'), m.mahr],
    ]],
    [`MSF · ${tx('Counselling record', 'Rekod kaunseling')}`, [
      [tx('Reference', 'Rujukan'), record.mcp.number],
      [tx('Completed', 'Selesai'), record.mcp.completionDate],
      [tx('Valid until', 'Sah sehingga'), record.mcp.validUntil],
      [tx('Reason recorded', 'Sebab direkodkan'), record.mcp.reason],
      [tx('Risk indicator', 'Petunjuk risiko'), record.highRisk ? tx('Present', 'Hadir') : tx('Absent', 'Tiada')],
    ]],
    [`MSF / ICA · ${t('children')}`, record.children.registry.map((child) =>
      [child.name, `${child.birthCert} · ${child.relationship}`])],
    [`HDB / CPF · ${tx('Matrimonial property', 'Harta sepencarian')}`, property ? [
      [tx('Address', 'Alamat'), property.hdbAddress],
      [tx('Flat type', 'Jenis flat'), property.type],
      [tx('Ownership', 'Pemilikan'), property.holding],
      [tx('Valuation', 'Penilaian'), property.value],
      [tx('Outstanding loan', 'Pinjaman tertunggak'), property.loan],
      [tx('CPF OA balances', 'Baki CPF OA'), property.cpf && `${tx('Applicant', 'Pemohon')} ${property.cpf.plaintiffOA} · ${tx('Spouse', 'Pasangan')} ${property.cpf.defendantOA}`],
    ] : []],
  ];
  return `<details class="flow-id-card" data-case="${safe(id)}">
    <summary><span class="flow-id-avatar" aria-hidden="true">${safe(p.name.slice(0, 1))}</span>
      <span class="flow-id-who"><strong>${safe(p.name)}</strong><small>${safe(p.nric)} · ${tx('Singpass identity', 'Identiti Singpass')}</small></span>
      <span class="flow-id-open">${tx('View records', 'Lihat rekod')}</span></summary>
    <div class="flow-id-body">
      <p class="flow-id-note">${tx('These records are retrieved and written into the Originating Summons after consent.', 'Rekod ini diperoleh dan ditulis ke dalam Saman Pemula selepas persetujuan.')}</p>
      ${groups.map(([title, rows]) => `<section><h3>${safe(title)}</h3>${recordRows(rows)}</section>`).join('')}
      <button class="btn btn-primary" onclick="flowSelectIdentity('${safe(id)}')">${tx('Select', 'Pilih')} ${safe(p.name)}</button>
    </div></details>`;
}

window.flowSelectIdentity = function (id) {
  useFilingCase(id);
  legacyFilingStoreKeys.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(filingStoreKey);
  resetApplicantState();
  drawProg();
  showEntry('dashboard');
};

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

window.flowChooseFilingMode = function (event) {
  event.preventDefault();
  const selected = new FormData(event.currentTarget).get('filing-mode');
  if (selected === 'companion') { flowStartCompanion(); return; }
  if (selected === 'eservices') showEntry('standard');
};

function flowStartCompanion() {
  entryView = 'filing';
  document.getElementById('flow-followup')?.remove();
  flow.phase = 'companion-start';
  nextStep(1);
  addAI(() => addMsg(`<p>${tx(
    'Assalamu alaikum. Welcome to SYC Companion. I will guide you through your Originating Summons application, beginning with a check of your Marriage Counselling Programme record.',
    'Assalamualaikum. Selamat datang ke SYC Companion. Saya akan membimbing anda melalui permohonan Saman Pemula, bermula dengan semakan rekod Program Kaunseling Perkahwinan anda.',
  )}</p>`), showMCP);
  saveFiling();
}

showMCP = function () {
  nextStep(2);
  flow.phase = filing.mcp.eligible ? 'mcp-valid' : 'mcp-expired';
  addAI(() => addMsg(`<p>${tx('I have retrieved your Marriage Counselling Programme record. Please review it before we continue.', 'Saya telah mendapatkan rekod Program Kaunseling Perkahwinan anda. Sila semak sebelum meneruskan.')}</p>
    <div class="card">
      <div class="card-row"><div class="card-label">${tx('MCP reference', 'Rujukan MCP')}</div><div class="card-value">${safe(filing.mcp.number)}</div></div>
      <div class="card-row"><div class="card-label">${tx('Completed', 'Selesai')}</div><div class="card-value">${safe(filing.mcp.completionDate)}</div></div>
      <div class="card-row"><div class="card-label">${tx('Reason recorded', 'Sebab direkodkan')}</div><div class="card-value">${safe(filing.mcp.reason)}</div></div>
      <div class="card-row"><div class="card-label">${tx('Risk indicator', 'Petunjuk risiko')}</div><div class="card-value">${filing.highRisk ? tx('Present — safety review advised', 'Hadir — semakan keselamatan disyorkan') : tx('Absent', 'Tiada')}</div></div>
    </div>
    ${filing.mcp.eligible
      ? `<button class="btn btn-secondary live" style="margin-top:8px" onclick="choice('${t('continue_btn')}', showConsent)">${t('continue_btn')}</button>`
      : `<div class="flow-warning"><strong>${tx('We are unable to continue with this application yet', 'Kami belum dapat meneruskan permohonan ini')}</strong>
           <p>${tx('Your Marriage Counselling Programme was completed more than six months ago. Please contact the Syariah Court for guidance on completing the required counselling before starting a new application. Thank you for your understanding.', 'Program Kaunseling Perkahwinan anda telah diselesaikan lebih daripada enam bulan yang lalu. Sila hubungi Mahkamah Syariah untuk panduan tentang melengkapkan kaunseling yang diperlukan sebelum memulakan permohonan baharu. Terima kasih atas pemahaman anda.')}</p></div>`}`));
};

showConsent = function () {
  nextStep(3);
  addAI(() => addMsg(`<p>${t('data_consent')}</p>
    <div class="consent-sources">
      <div class="consent-source"><span class="consent-source-mark">HDB</span><div><strong>HDB</strong><small>${tx('Housing and loan details', 'Butiran perumahan dan pinjaman')}</small></div></div>
      <div class="consent-source"><span class="consent-source-mark">M/R</span><div><strong>MSF / ROMM</strong><small>${tx('Marriage and family records', 'Rekod perkahwinan dan keluarga')}</small></div></div>
      <div class="consent-source"><span class="consent-source-mark">CPF</span><div><strong>CPF</strong><small>${tx('Savings and housing information', 'Maklumat simpanan dan perumahan')}</small></div></div>
      <div class="consent-source"><span class="consent-source-mark">SG</span><div><strong>Singpass</strong><small>${tx('Identity and address details', 'Butiran identiti dan alamat')}</small></div></div>
    </div>
    <div class="note" style="margin-top:8px">${t('privacy')}</div>
    <div class="choice-btns" style="margin-top:10px">
      <button class="btn btn-primary live" onclick="choice('${t('i_consent')}', showPersonal)">${t('i_consent')}</button>
      <button class="btn live" onclick="choice('${t('i_decline')}', showDecline)">${t('i_decline')}</button>
    </div>`));
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
  addAI(() => addMsg(`<p>${tx('I have retrieved your marriage record from ROMM. Please upload your marriage certificate so I can compare it with the record.', 'Saya telah mendapatkan rekod perkahwinan daripada ROMM. Sila muat naik sijil perkahwinan anda supaya saya boleh membandingkannya dengan rekod.')}</p>
    <div class="card"><div class="card-title">ROMM <span class="flow-source">${tx('Retrieved record', 'Rekod diperoleh')}</span></div>
      <div class="card-row"><div class="card-label">${t('cert_no')}</div><div class="card-value">${safe(m.certNo)}</div></div>
      <div class="card-row"><div class="card-label">${t('marriage_date')}</div><div class="card-value">${safe(m.date)}</div></div>
      <div class="card-row"><div class="card-label">${t('venue')}</div><div class="card-value">${safe(m.venue)}</div></div></div>
    ${uploadMarkup('marriage',tx('Marriage certificate', 'Sijil perkahwinan'),false)}`));
};

function uploadMarkup(type, title, multiple = true) {
  return `<div class="flow-upload"><strong>${title}</strong>
    <p class="flow-prompt">${multiple ? tx('Select the relevant pages together. Images, PDF and DOCX are accepted.', 'Pilih halaman yang berkaitan bersama-sama. Imej, PDF dan DOCX diterima.') : tx('Images, PDF and DOCX are accepted.', 'Imej, PDF dan DOCX diterima.')}</p>
    <p class="flow-verification-note">${tx('This document is used only to verify the information already recorded. Uploading it will not change the Originating Summons.', 'Dokumen ini hanya digunakan untuk mengesahkan maklumat yang telah direkodkan. Memuat naiknya tidak akan mengubah Saman Pemula.')}</p>
    <input id="flow-${type}-file" type="file"${multiple ? ' multiple' : ''} accept="image/*,.pdf,.docx" onchange="flowUpload('${type}',this.files)">
    <div id="flow-${type}-status" class="flow-file"></div></div>`;
}

/** What a complete document has to show us, checked after the pages are read. */
const REQUIRED_DOCUMENT_FIELDS = {
  marriage: [
    [() => tx("Plaintiff's name", 'Nama Plaintif'), (doc) => doc.parties?.plaintiff?.name],
    [() => tx("Defendant's name", 'Nama Defendan'), (doc) => doc.parties?.defendant?.name],
    [() => t('venue'), (doc) => doc.venue],
    [() => t('marriage_date'), (doc) => doc.date],
    [() => t('cert_no'), (doc) => doc.certNo],
  ],
};

function assertRequiredFields(type, document_) {
  const missing = (REQUIRED_DOCUMENT_FIELDS[type] || [])
    .filter(([, read]) => !String(read(document_) ?? '').trim())
    .map(([label]) => label());
  if (!missing.length) return;
  throw new Error(tx(
    `I could not find everything a valid document has to show: ${missing.join(', ')}. Please upload a complete copy, including every page.`,
    `Saya tidak menemui semua maklumat yang perlu ada pada dokumen yang sah: ${missing.join(', ')}. Sila muat naik salinan lengkap, termasuk setiap halaman.`,
  ));
}

function documentResult(type, names) {
  const have = (fragment) => names.some((name) => name.includes(fragment));
  if (type === 'marriage') {
    const m = filing.marriage;
    const parties = { plaintiff: { name: filing.person.plaintiff.name }, defendant: { name: filing.person.defendant.name } };
    // Page 1 carries the registration details; page 2 carries the taklik and the two names only.
    const pages = {
      front: { parties, certNo: m.certNo, date: m.date, venue: m.venue, wali: m.wali, mahr: m.mahr },
      back: { parties },
    };
    const read = Object.entries(filing.marriageDocument)
      .filter(([, fragment]) => have(fragment))
      .reduce((merged, [page]) => ({ ...merged, ...pages[page] }), { kind: 'marriage-certificate' });
    if (!read.parties)
      throw new Error(tx('This does not appear to be the marriage certificate for the current application. Please check the document and try again.', 'Ini nampaknya bukan sijil perkahwinan bagi permohonan semasa. Sila semak dokumen dan cuba lagi.'));
    return read;
  }
  if (type === 'children' && filing.id === '4') {
    if (have('scenario4-parenting-plan-corrected')) return {
      kind: 'parenting-plan', corrected: true, planChildren: ['Haziq Bin Zulkifli','Aisyah Binte Zulkifli'],
      residence: '765 Pasir Ris Street 71 with Plaintiff', caregiver: 'Plaintiff',
      education: 'Both children continue at their current schools', custody: 'Joint custody',
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

/** Everything Aisha says about one document, so the next upload can replace all of it. */
function clearReview(type) {
  document.querySelectorAll(`#chatBox [data-review="${type}"]`).forEach((node) => node.remove());
}
function addReviewMsg(type, html) {
  addMsg(html);
  const bubble = document.getElementById('chatBox')?.lastElementChild;
  if (bubble) bubble.dataset.review = type;
}

window.flowUpload = async function (type, fileList) {
  const files = [...(fileList || [])];
  if (!files.length) return;
  const status = document.getElementById(`flow-${type}-status`);
  const names = files.map((file) => file.name.toLowerCase());
  clearReview(type); // only the newest answer about this document stays on screen
  if (status) status.textContent = tx('Reading your document…', 'Membaca dokumen anda…');
  await new Promise((resolve) => setTimeout(resolve, 700));
  try {
    const result = documentResult(type, names);
    assertRequiredFields(type, result);
    disableLive(); // the previous round's Continue / Ignore buttons must not stay clickable

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
    disableLive();
    addAI(() => addReviewMsg(type, `<p>${safe(error.message)}</p>`));
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
  updateFindingHistory(flow.currentFindings, 'marriage');
  if (mismatches.length) { showWarnings('marriage', marriageNext); return; }
  addAI(() => addReviewMsg('marriage', `<div class="flow-check">${tx('Thank you. The certificate details match the retrieved ROMM record.', 'Terima kasih. Butiran sijil sepadan dengan rekod ROMM yang diperoleh.')}</div>
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
    row.innerHTML = `<span class="os-lbl">${tx('Risk indicator', 'Petunjuk risiko')}</span><span class="os-val filled">${filing.highRisk ? tx('Present — safety review advised', 'Hadir — semakan keselamatan disyorkan') : tx('Absent', 'Tiada')}</span>`;
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
      ${answer.careControl ? `<br>${tx('Care and control', 'Jagaan dan kawalan')}: ${safe(answer.careControl)}` : ''}</div>`;
  }).join('') : `<div class="os-row"><span class="os-lbl">${t('children')}</span><span class="os-val filled">${t('no')}</span></div>`;
  saveFiling();
}

showChildren = function () {
  nextStep(6);
  flow.phase = 'children';
  markSectionDone(3);
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
    : [['Care and control to Plaintiff','plaintiff'],['Care and control to Defendant','defendant']];
  const question = field === 'custody' ? t('custody') : tx('Care and control', 'Jagaan dan kawalan');
  addAI(() => addMsg(`<p>${tx('For', 'Untuk')} <strong>${safe(name)}</strong>, ${tx('please choose the', 'sila pilih')} ${question.toLowerCase()} ${tx('arrangement.', 'yang sesuai.')}</p>
    <div class="flow-actions">${choices.map(([label,value]) => `<button class="btn live" onclick="flowChooseChild(${index},'${field}','${value}')">${safe(label)}</button>`).join('')}</div>`));
};

window.flowChooseChild = function (index, field, value) {
  const labels = {
    joint: 'Joint custody', plaintiff: field === 'custody' ? 'Sole custody to Plaintiff' : 'Plaintiff',
    defendant: field === 'custody' ? 'Sole custody to Defendant' : 'Defendant',
  };
  const name = flow.claimedChildren[index];
  flow.custody[name] = { ...(flow.custody[name] || {}), [field]: labels[value] };
  disableLive(); addUser(safe(labels[value])); renderClaimedChildren();
  if (field === 'custody') setTimeout(() => flowAskChild(index,'careControl'), 280);
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

function updateFindingHistory(findings, type) {
  const activeIds = new Set((findings || []).map((finding) => finding.id));
  document.querySelectorAll('.flow-warning[data-finding-id]').forEach((card) => {
    if (!card.dataset.findingId.startsWith(`${type}.`)) return;
    if (activeIds.has(card.dataset.findingId) || card.classList.contains('flow-warning-resolved')) return;
    const title = card.dataset.findingTitle || tx('Discrepancy', 'Perbezaan');
    card.classList.add('flow-warning-resolved');
    card.innerHTML = `<strong>✓ ${tx('Resolved', 'Diselesaikan')}: ${safe(title)}</strong><p>${tx('The replacement information now reconciles this comparison.', 'Maklumat gantian kini menyelaraskan perbandingan ini.')}</p>`;
  });
}

function afterParentingUpload() {
  flow.phase = 'parenting-review';
  const p = flow.extraction.children;
  flow.currentFindings = childrenFindings();
  updateFindingHistory(flow.currentFindings, 'children');
  addReviewMsg('children', `<p>${tx('I read these arrangements from the Parenting Plan for verification. The Originating Summons has not been changed.', 'Saya membaca aturan ini daripada Pelan Keibubapaan untuk pengesahan. Saman Pemula tidak diubah.')}</p>
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
  updateFindingHistory(flow.currentFindings, 'property');
  addReviewMsg('property', `<p>${tx('I read the following from your Property Plan for verification. The Originating Summons has not been changed.', 'Saya membaca perkara berikut daripada Pelan Harta anda untuk pengesahan. Saman Pemula tidak diubah.')}</p>
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
    addReviewMsg(type, `<div class="flow-check">${tx('The information reviewed at this step matches the available records.', 'Maklumat yang disemak pada langkah ini sepadan dengan rekod yang tersedia.')}</div>`);
    next();
    return;
  }
  flow.phase = `warning-${type}`;
  const details = open.map((finding) => `<div class="flow-warning" data-finding-id="${safe(finding.id)}" data-finding-title="${safe(finding.title)}"><strong>${safe(finding.title)}</strong>
    <p>${tx('I noticed these values differ. Please review them before deciding how to continue.', 'Saya mendapati nilai berikut berbeza. Sila semak sebelum memutuskan cara untuk meneruskan.')}</p>
    ${finding.values.map(([source,value]) => `<div class="flow-compare"><span>${safe(source)}</span><span>${safe(value)}</span></div>`).join('')}
    </div>`).join('');
  addAI(() => addMsg(`${details}<div class="flow-actions">
    <button class="btn live" onclick="flowReupload('${type}')">${tx('Re-upload document', 'Muat naik semula dokumen')}</button>
    <button class="btn btn-secondary live" onclick="flowIgnoreWarnings('${type}')">${tx('Ignore and continue', 'Abaikan dan teruskan')}</button></div>`));
}

window.flowReupload = function (type) {
  document.getElementById(`flow-${type}-file`)?.click();
};

window.flowIgnoreWarnings = function (type) {
  const open = (flow.currentFindings || []).filter((finding) => !flow.acknowledgements.includes(finding.id));
  if (!open.length) { warningsNext(type); return; }
  disableLive(); addUser(tx('Ignore and continue', 'Abaikan dan teruskan'));
  addAI(() => addMsg(`<div class="flow-warning"><strong>${tx('Some information still does not match', 'Sesetengah maklumat masih tidak sepadan')}</strong>
    <p>${tx('Would you like to continue with the information already recorded, or review the document and upload it again?', 'Adakah anda mahu meneruskan dengan maklumat yang telah direkodkan, atau menyemak dokumen dan memuat naiknya semula?')}</p></div>
    <div class="flow-actions">
      <button class="btn live" onclick="flowConfirmIgnore('${type}')">${tx('Continue with current information', 'Teruskan dengan maklumat semasa')}</button>
      <button class="btn btn-secondary live" onclick="flowReviewAgain('${type}')">${tx('Review and re-upload', 'Semak dan muat naik semula')}</button>
    </div>`));
};

window.flowConfirmIgnore = function (type) {
  const open = (flow.currentFindings || []).filter((finding) => !flow.acknowledgements.includes(finding.id));
  open.forEach((finding) => {
    flow.acknowledgements.push(finding.id);
    flow.acknowledgementTitles[finding.id] = finding.title;
  });
  disableLive(); addUser(tx('Continue with current information', 'Teruskan dengan maklumat semasa'));
  saveFiling();
  warningsNext(type);
};

window.flowReviewAgain = function (type) {
  disableLive(); addUser(tx('Review and re-upload', 'Semak dan muat naik semula'));
  addAI(() => addMsg(`<p>${tx('Please upload the corrected document. I will compare it against the records again.', 'Sila muat naik dokumen yang telah dibetulkan. Saya akan membandingkannya dengan rekod sekali lagi.')}</p>
    <div class="flow-actions">
      <button class="btn live" onclick="flowReupload('${type}')">${tx('Re-upload document', 'Muat naik semula dokumen')}</button>
      <button class="btn btn-secondary live" onclick="flowIgnoreWarnings('${type}')">${tx('Ignore and continue', 'Abaikan dan teruskan')}</button>
    </div>`));
};

sendFree = function () {
  const box = document.getElementById('inputBox');
  const message = box.value.trim();
  if (!message) return;
  box.value = '';
  addUser(safe(message));
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
  setReviewMode(true);
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
      ${flow.acknowledgements.length ? `<div class="doc-section"><div class="doc-label">${tx('Discrepancies acknowledged', 'Perbezaan diakui')}</div><div class="doc-value">${flow.acknowledgements.map((id) => safe(flow.acknowledgementTitles?.[id] || id)).join('<br>')}</div></div>` : ''}
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
  panel.innerHTML = `<div class="flow-followup-header">${courtWordmark()}
    <button class="flow-followup-restart" onclick="flowRestart()">${tx('↻ Restart', '↻ Mulai semula')}</button></div>
    <div class="flow-followup-inner">${content}</div>`;
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
