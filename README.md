# SYC filing-flow presentation

The app presents the supplied SYC ideal flow in the original repository's maroon/red theme, adapted to the latest stakeholder notes. It is a local, frontend-only experience: prefill, retrieval, and document extraction are deterministic fixtures, not live integrations. The Originating Summons panel is read-only; applicant answers and corrections go through Aisha's chat.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. Alternatively run `./start.sh`. No `.env.local`, API key, backend, or runtime internet connection is needed. Keep this presentation on a controlled local network; do not publish it as a real filing service.

The applicant sees a Singpass-style entry screen, e-Services dashboard, and divorce-service card before Aisha's filing conversation. These screens are simulated; no actual identity login occurs.

## Demonstration cases

There is no scenario chooser or POC indicator in the applicant interface. A presenter chooses a case with the initial local URL:

| URL suffix | Evidence to upload | Expected result |
| --- | --- | --- |
| `?case=10` (default) | `Scenario10_ROMM_1.jpeg` and `_2.jpeg`; then `Scenario10_Form13.docx` and `Scenario10_Form14.docx` | Matching property plan; no discrepancy warning |
| `?case=9` | `Scenario9_ROMM_1.jpeg` and `_2.jpeg`; then both `Form 13_page 1.jpg` and `Form 13_page 2.jpg` | Handwritten Canberra address differs from HDB/OS Tampines address; confirmation is needed to continue |
| `?case=4` | `Scenario4_ROMM_1.jpeg` and `_2.jpeg`; then `Scenario4_Form11_PP.docx` | Haziq/Aisyah discrepancies and per-child custody review |
| `?case=1` | `Scenario1_ROMM_1.jpeg` and `_2.jpeg` | Valid MCP; high-risk indicator without blocking |
| `?case=1&eligibility=expired` | None; filing stops before consent | MCP outside six-month period |

The supplied evidence is under `docs/Scenario N/`. Corrected recovery documents are under `resources/`: `scenario4-parenting-plan-corrected.pdf` and `scenario9-form13-corrected.pdf`. The marriage certificate is mandatory in every case; Parenting and Property Plans are mandatory when those sections apply. Discrepancies are polite warnings with chat-based correction, re-upload, or **Ignore and continue** after a confirmation dialog. Missing documents and expired MCP cannot be skipped.

The Dashboard link saves/returns to the current draft in this browser. Language switching restarts the journey. The OS panel has no edit controls. Payment and completion screens demonstrate the next user steps; they do not perform a transaction or real court submission.

## Verify

```bash
npm test
npm run test:e2e
npm run build
```

Browser tests need Chromium installed once with `npx playwright install chromium` and its system libraries. The production build itself does not need browser-test dependencies or an API key.

## Code map

| Path | Purpose |
| --- | --- |
| `docs/syc-form-assistant 1 (ideal happy flow).html` | Preserved reference HTML |
| `src/IdealFlowApp.jsx` | Applies the red palette and mounts the adapted flow |
| `src/idealFlowEnhancements.js` | Chat journey, mandatory uploads, comparisons, warning confirmation, draft resume and follow-up screens |
| `src/data/filingCases.js` | Selects local case fixture before the applicant UI mounts |
| `e2e/stakeholder-flow.spec.js` | Browser coverage for the stakeholder cases |

See `docs/POC_REQUIREMENTS_AND_ACCEPTANCE.md` and `docs/DEMO_SCRIPT.md` for acceptance and presenter steps.

This is not production software: fixture extraction recognizes supplied filenames rather than document contents, browser storage is not secure case persistence, and authentication, server validation, real integrations, and payment still need to be built.
