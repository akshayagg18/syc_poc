# Recommended by GPT: POC Client-Readiness Checklist

This checklist records the major flaws and recommended changes identified in the current SYC OS Form Assistant proof of concept. Items are ordered by their potential to damage client confidence or prevent the project from being awarded.

## Severity guide

- **P0 — Critical:** Fix before showing the POC to a potential client.
- **P1 — High:** Address before a formal evaluation or technical review.
- **P2 — Medium:** Important for a credible pilot and good user experience.
- **P3 — Production:** Required for production planning, procurement, or deployment.

## P0 — Critical presentation blockers

- [ ] **Make the demo identity and case data fully consistent.**
  - Current flaw: The dashboard welcomes Dominic D'Silva, while the assistant identifies the user as Nur Aisyah. Dates and references also mix 2025 and 2026, and case identifiers use inconsistent formats such as `OS`, `POS`, and `SYC/OS`.
  - Change: Define one fictional persona and a single case timeline, then use it across the dashboard, header, forms, sample documents, and submission result.
  - Done when: Every visible name, NRIC, date, document, and case number belongs to the same demonstration case.

- [x] **Stop describing AI output as “fact-checked” or “Verified.”**
  - Current flaw: The model checks what it can read from an image but cannot authenticate a document, confirm its issuer, detect all alterations, or legally verify the information.
  - Change: Use language such as “AI-assisted extraction,” “Matched to visible document,” “Needs review,” and “Could not confidently read.”
  - Done when: No screen implies that the Court or AI has authenticated a document, and every extracted value requires user confirmation.

- [ ] **Remove or clearly label all hard-coded legal and personal facts.**
  - Current flaw: The app can insert Singapore citizenship, Islam, a 16-year-and-1-month marriage duration, zero maintenance, and a fixed case reference without deriving or confirming them.
  - Change: Calculate values from confirmed inputs and never silently convert missing data into a legal fact. Where a scripted value is required for the demonstration, make it consistent with the selected persona and preceding inputs.
  - Done when: Uploading an incomplete or unclear document cannot silently create authoritative-looking case information.

- [ ] **Introduce mandatory review before accepting extracted information.**
  - Current flaw: AI-extracted values can flow directly into the legal form and appear authoritative.
  - Change: Show extracted values beside their source, highlight uncertain fields, and require explicit confirmation or correction before saving the section.
  - Done when: The user can see, edit, and confirm every AI-populated value before it becomes part of the application.

- [ ] **Make the privacy and consent experience representative of the intended final product.**
  - Current flaw: “Your privacy is protected under the Personal Data Protection Act” is too generic for a product that handles NRICs, birth certificates, financial statements, and court documents.
  - Change: Show the kind of clear, concise consent experience intended for the final product: what will be processed, why AI is being used, and what control the user retains.
  - Done when: The privacy interaction demonstrates a credible final-product experience without interrupting the main filing journey.

- [x] **Make the live presentation resilient to OpenAI or network failure.**
  - Current flaw: A missing key, timeout, rate limit, model error, network issue, or malformed response can derail the main demo.
  - Change: Add a deterministic demo mode with fixture responses, perform a pre-demo health check, and retain a tested live-AI option.
  - Done when: The complete presentation can run successfully without internet access while still allowing an optional live demonstration.

- [ ] **Hide, disable, or label nonfunctional portal controls.**
  - Current flaw: Search, notifications, user menus, Inheritance, Queue Request, table menus, and other controls look functional but do nothing.
  - Change: Remove them from the client-demo build, disable them visibly, or mark them as outside the prototype scope.
  - Done when: Every apparently interactive control either works or is unmistakably identified as a mock element.

## P1 — High-priority trust, security, and correctness issues

- [ ] **Handle every page of a PDF or clearly reject unsupported documents.**
  - Current flaw: The app reads only the first PDF page, even for front-and-back certificates, statements, court orders, or document bundles.
  - Change: Render and process all relevant pages, show page count and processing status, and set defensible file/page limits.
  - Done when: The UI never reports a multi-page document as successfully checked after silently ignoring later pages.

- [ ] **Add document-to-field provenance and an audit trail.**
  - Current flaw: The final form does not preserve which document and page supplied each value, whether AI or a user changed it, or who confirmed it.
  - Change: Record the source document, page, extracted text, confidence/review status, user edits, confirmation time, model version, and prompt version.
  - Done when: A reviewer can trace every populated field back to its source and change history.

- [ ] **Define proper consent, retention, deletion, and data-residency controls.**
  - Current flaw: There is no durable consent record, retention policy, deletion workflow, approved data residency, or documented external processor arrangement.
  - Change: Produce a data-flow diagram and policy covering collection, processing, storage, access, retention, deletion, and subprocessors.
  - Done when: Security and legal reviewers can answer where each data type goes, who can access it, and when it is deleted.

- [ ] **Do not store sensitive filing data in browser `localStorage` for a real deployment.**
  - Current flaw: One unencrypted application is stored in the browser with no authentication, server-side ownership check, or reliable lifecycle management.
  - Change: For production, store drafts in an authenticated backend with encryption, access control, expiry, and audit logging. Keep local storage limited to non-sensitive UI preferences.
  - Done when: A user's case cannot be retrieved, modified, or exposed solely through local browser state.

- [ ] **Remove unsafe HTML rendering paths.**
  - Current flaw: Chat and some document-derived values use `dangerouslySetInnerHTML`, and not every interpolated value is guaranteed to be escaped.
  - Change: Render structured React components instead of HTML strings. Where HTML is unavoidable, sanitize it with a reviewed allowlist.
  - Done when: User, document, and model-controlled text cannot create executable markup.

- [ ] **Add robust document validation and adversarial handling.**
  - Current flaw: The POC has limited protection against wrong document types, corrupted or password-protected PDFs, oversized files, illegible scans, malicious files, and prompt injection embedded in documents.
  - Change: Validate MIME type and file signatures, limit size and pages, scan uploads, isolate document instructions from system instructions, and fail safely.
  - Done when: Unsupported or suspicious files produce a clear rejection without partially populating the case.

- [ ] **Provide human-readable error recovery.**
  - Current flaw: API failures may expose messages such as `OpenAI 500`, with limited retry, cancellation, or recovery guidance.
  - Change: Add friendly error states, retry and replace-document actions, cancellation, timeout handling, and a manual-entry fallback.
  - Done when: A failed AI request never blocks the user from completing the form manually.

- [x] **Fix the API-key and offline-fallback logic.**
  - Current flaw: `hasApiKey()` always returns `true`, so the stated regex/offline fallback is effectively unreachable. Environment instructions also differ between the README, `start.sh`, and the current Vite proxy.
  - Change: Make server capability explicit through a health/config endpoint, standardize on a secure server-side key name, and document development versus production behavior.
  - Done when: Missing configuration is detected before the filing flow starts and the UI presents the intended fallback.

- [ ] **Design a real production API boundary.**
  - Current flaw: The OpenAI proxy exists only inside the Vite development server; `vite preview` or static hosting will not provide it.
  - Change: Define an authenticated backend/BFF for AI requests, document processing, validation, persistence, and policy enforcement.
  - Done when: The frontend can be deployed independently and calls a supported, monitored backend API.

- [ ] **Have legal/domain experts validate the filing flow and terminology.**
  - Current flaw: The prototype embeds legal assumptions, branching rules, required fields, guidance, and submission language without an evident approved ruleset.
  - Change: Obtain review and sign-off from Syariah Court subject-matter experts and legal counsel; version the approved rules and content.
  - Done when: Every field, branch, validation, disclaimer, and legal term can be traced to an approved requirement.

## P2 — User experience and presentation quality

- [x] **Simplify the interaction model.**
  - Current flaw: Users must coordinate a section sidebar, legal form, chat panel, locked sections, upload cards, and multiple continue controls.
  - Change: Make the primary sequence explicit: upload or enter data, review extracted fields, resolve missing items, confirm, and continue.
  - Done when: A first-time user can complete a section without being told whether to use the form, chat, or sidebar.

- [ ] **Unify the two competing progress systems.**
  - Current flaw: The assistant has eight broad journey stages while the form has eight different legal sections, and a separate four-step filing bar is also displayed.
  - Change: Define one clear hierarchy, such as overall filing stage followed by current form section, and use consistent names and progress values.
  - Done when: The user can always answer “where am I, what is complete, and what happens next?”

- [x] **Prove that chat adds value instead of slowing down a normal form.**
  - Current flaw: The experience sometimes asks users to chat about information they could enter more quickly in conventional fields.
  - Change: Use chat for explanation, clarification, and missing-information prompts; use structured review controls for legal data.
  - Done when: The AI reduces typing, errors, or confusion in measurable usability tests.

- [ ] **Improve responsive behavior.**
  - Current flaw: The chat can occupy up to 60% of the viewport, while the main responsive rule mostly hides the sidebar below 1200px.
  - Change: Create tested desktop, tablet, and mobile layouts, potentially switching between form and assistant tabs on narrow screens.
  - Done when: All critical actions remain readable and usable at supported viewport sizes without overlap or horizontal scrolling.

- [ ] **Complete an accessibility pass.**
  - Current flaw: The interface uses small text, color-dependent statuses, emoji icons, blurred locked content, and dynamic chat updates without an evident accessible live region.
  - Change: Target the client's required WCAG level; add semantic structure, keyboard support, focus management, live-region announcements, sufficient sizing/contrast, and non-color indicators.
  - Done when: Automated checks and keyboard/screen-reader testing pass the agreed accessibility acceptance criteria.

- [ ] **Improve language consistency and translation coverage.**
  - Current flaw: English and Bahasa Melayu are available, but hard-coded form labels and generated messages can remain in English, and switching language restarts the flow.
  - Change: Move all user-facing text into the translation system and preserve application state when changing language.
  - Done when: The complete journey works consistently in both languages without data loss or mixed-language screens.

- [ ] **Add clear navigation, edit, and recovery controls.**
  - Current flaw: Some paths are forward-only, changing language resets work, and users may not understand how to revisit or correct earlier sections.
  - Change: Add explicit Back, Save draft, Resume, Edit section, Start over, and Cancel actions with confirmation where appropriate.
  - Done when: Users can correct earlier information without restarting or corrupting progress.

- [ ] **Replace raw model confidence with user-centered uncertainty.**
  - Current flaw: Binary `verified/review` states hide ambiguity and can encourage automation bias.
  - Change: Highlight unreadable or conflicting fields, explain why review is needed, and show source snippets/pages instead of a broad trust badge.
  - Done when: Uncertainty is communicated per field and the user knows exactly what to inspect.

- [ ] **Add upload progress and document management.**
  - Current flaw: Users have limited visibility into upload/processing stages and cannot meaningfully manage an application document set.
  - Change: Show upload, conversion, processing, and review states; allow preview, replace, remove, and reprocess actions.
  - Done when: Users can see all required documents and the status of each one in a single place.

- [ ] **Test and control performance.**
  - Current flaw: The production build reports a large JavaScript bundle, with PDF.js contributing substantially, and repeated AI calls add latency.
  - Change: Lazy-load document processing, split large bundles, cache safe results, avoid unnecessary AI calls, and display useful progress feedback.
  - Done when: Agreed page-load and task-response budgets are measured and met on representative devices and networks.

## P3 — Production and procurement readiness

- [ ] **Implement real authentication and authorization.**
  - Include Singpass/MyInfo or the client-approved identity mechanism, session security, role-based permissions, and case-ownership checks.

- [ ] **Implement secure backend persistence and document management.**
  - Include encrypted databases/object storage, document versioning, malware scanning, retention rules, backup, and restoration.

- [ ] **Integrate with authoritative court and government systems.**
  - Replace simulated cases, records, payments, notifications, and submission with approved APIs and transactional workflows.

- [x] **Introduce deterministic business-rule validation.**
  - Required fields, jurisdiction, dates, monetary rules, case eligibility, and submission constraints should be enforced by versioned rules, not delegated to a language model.

- [ ] **Define AI governance and human oversight.**
  - Cover approved models, model/version changes, evaluation datasets, accuracy thresholds, hallucination monitoring, fallback behavior, incident response, bias testing, and human review.

- [ ] **Create comprehensive automated tests.**
  - Add unit tests for rules and state transitions, integration tests for AI/backend contracts, end-to-end tests for all filing branches, accessibility tests, and regression fixtures for specimen documents.

- [ ] **Add observability without leaking personal information.**
  - Include structured logs, metrics, traces, alerts, request correlation, audit events, redaction, and restricted operational access.

- [ ] **Define reliability and continuity requirements.**
  - Establish availability targets, retry/idempotency behavior, recovery time and recovery point objectives, backups, disaster recovery, and degraded manual operation.

- [ ] **Complete formal security and privacy assurance.**
  - Plan threat modelling, secure code review, penetration testing, vulnerability management, dependency scanning, DPIA, data-classification review, and applicable government security accreditation.

- [x] **Document the production architecture and delivery scope.**
  - Clearly separate what the POC proves from authentication, integrations, data migration, security, operational support, records management, and production deployment still required.

## Pre-presentation final gate

- [ ] A single demonstration persona is consistent across every screen and document.
- [x] AI results are described as extraction, not authentication or legal verification.
- [ ] Every extracted value is reviewable and editable.
- [ ] The exact presentation path has been rehearsed from a clean browser session.
- [ ] API key, network, model access, and sample documents have been preflighted.
- [x] A deterministic offline/demo fallback is ready.
- [ ] Wrong, illegible, and multi-page document behavior has been tested.
- [ ] Nonfunctional controls are removed, disabled, or labelled.
- [ ] Client questions about privacy, security, AI limitations, and production scope have prepared answers.

