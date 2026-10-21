# Filing-flow requirements and acceptance

This records the latest stakeholder decisions. The supplied HTML and source documents in `docs/` remain unchanged. The current app runs entirely in the browser with deterministic case and document fixtures; it does not authenticate users, read document contents, call government systems, or submit a real filing.

## Experience and data ownership

| Area | Expected behavior |
| --- | --- |
| Entry and retrieval | Guide the applicant through filing choice, MCP review, consent, and prefilled records. No applicant-facing case/scenario selector or POC controls. |
| Originating Summons | Display a read-only draft. The applicant supplies or corrects application information only through the Aisha conversation; government-source fields cannot be overwritten. |
| MCP | Completion within six months permits the journey. An expired MCP stops filing before consent. Show a high-risk indicator derived from the recorded divorce reason; this indicator alone does not block filing. |
| Marriage | Retrieve the ROMM record. Require upload of both sides of the marriage certificate in every case, compare it with ROMM, and ask the applicant to review any difference. |
| Children | Retrieve MCP and MSF/ICA child details. Ask for custody, care and control, and access **for each child**. Where children are included, require the Parenting Plan after those answers and compare it with the application and MCP/relief information. |
| Property | Show HDB details first. Where property is included, require a Property Plan **before** presenting sell, transfer, or retain choices. Compare the plan address with HDB and the OS address. Scenario 10 uses Forms 13 and 14 together; Scenario 9 uses both photographed handwritten pages. |
| Other sections | Continue through grounds, maintenance, existing proceedings, review/declaration, agreement, payment-choice, and completion screens. |
| Languages | Offer English and Bahasa Melayu for applicant-facing guidance. |

The read-only prefill sources represented in local fixtures are Singpass, SYC/MCP, ROMM, MSF/ICA, HDB, and CPF. Uploaded marriage certificates, Parenting Plans, and Property Plans are the only document-verification steps. PPO is a retrieved risk signal, never an applicant upload.

## Discrepancy behavior

- Each mismatch is a polite warning showing compared source values and options to correct applicant-owned information through chat, re-upload the document, or ignore and continue.
- Ignore and continue requires an explicit confirmation dialog. The decision is saved with the draft.
- Warnings do not block filing after confirmation, including the Scenario 9 address mismatch.
- Missing mandatory documents and an expired MCP are gates, not overridable discrepancy warnings.
- Unrecognized files must not populate the OS or extraction results. The current browser-only extractor identifies supplied fixtures by filename; it is **not** real OCR or document verification.
- No API key belongs in the frontend bundle. This implementation uses no runtime API key or network service.

## Case acceptance

| Case | Inputs and comparison | Expected outcome |
| --- | --- | --- |
| 1 — valid MCP | Completed MCP inside six months; abuse reason and PPO signal; no children or property | Show high-risk indicator and safety information without blocking filing. Marriage certificate remains mandatory. |
| 1 — expired MCP | MCP completed more than six months ago | Stop before consent and explain that the applicant must address MCP eligibility. This is a separate fixture variant, not an on-screen applicant control. |
| 4 — children | MCP and relief name Aisyah only; OS and supplied Form 11 name Haziq and Aisyah; Haziq is not from the current marriage | Ask custody and care/control separately for both children, require the Parenting Plan, show source comparisons, and permit correction/re-upload or confirmed continuation. The corrected plan and Aisyah-only chat correction resolve the two main mismatches. |
| 9 — property | HDB and OS: `18 Tampines Street 42, #05-118, Singapore 529201`; handwritten plan: `82 Canberra Road` | Require both photographed pages before property options; display extracted address against HDB and OS; offer re-upload/correction or confirmed continuation. The corrected plan removes the warning. |
| 10 — consistent property | HDB, OS, Form 13 and Form 14 agree | Require both forms; show Option 5, CPF refund, mortgage, fees, and six-month timeframe; continue without a discrepancy warning. |

## Presenter setup and limits

The applicant screen has no scenario controls. For a local demonstration, start with `?case=10` (default), `?case=9`, `?case=4`, or `?case=1`. Use `?case=1&eligibility=expired` for the expired-MCP variant. These URLs are presenter setup only; do not expose them as applicant navigation. A saved draft is keyed to each case fixture in browser local storage. The Dashboard link provides return and resume; restarting via the language control clears the current draft.

This is a controlled, local presentation. Browser storage is not a production case database, filenames are not evidence of document authenticity, and the payment/completion screens do not charge or file with the court. Before public deployment, replace local fixtures with authenticated backend integrations, real document processing, server-side validation, and secure persistence.
