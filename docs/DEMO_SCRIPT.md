# SYC Companion presenter demo script

## Before the session

Start the app from the repository root:

```bash
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. Use a controlled local connection and keep the supplied files available in `docs/Scenario N/`. No API key or internet connection is required.

Use **Start over** before changing cases. A normal or hard refresh deliberately resumes the saved application, so it is not a reliable reset.

### Files to keep ready

| Case | Marriage certificate | Supporting plan | Optional recovery document |
| --- | --- | --- | --- |
| 1 | `docs/Scenario 1/Scenario1_ROMM_1.jpeg` | None | None |
| 4 | `docs/Scenario 4/Scenario4_ROMM_1.jpeg` | `docs/Scenario 4/Scenario4_Form11_PP.docx` | `resources/scenario4-parenting-plan-corrected.pdf` |
| 9 | `docs/Scenario 9/Scenario9_ROMM_1.jpeg` | `docs/Scenario 9/Form 13_page 1.jpg` and `Form 13_page 2.jpg` together | `resources/scenario9-form13-corrected.pdf` |
| 10 | `docs/Scenario 10/Scenario10_ROMM_1.jpeg` | `docs/Scenario 10/Scenario10_Form13.docx` and `Scenario10_Form14.docx` together | None required |

## Standard lead-in

Use this sequence at the start of every case:

1. Open the case URL and select the matching Singpass identity.
2. Expand the identity first if you want to preview the records that will be retrieved.
3. Select **Start a divorce application**.
4. Choose **SYC Companion** and submit. Do not choose standard e-Services.
5. Review the MCP result and continue.
6. Consent to retrieve the connected Singpass, MCP, ROMM, MSF/ICA, HDB, and CPF records.
7. Confirm the retrieved personal and additional details.
8. Point out the redesigned workspace:
   - The progress tracker moves to the top when the window is narrower.
   - The application shows only the current read-only Originating Summons section.
   - The divider between the application and Aisha can be dragged to resize either side.
   - **View full application** presents the complete form for final review.
   - Aisha remains the interaction channel; the applicant does not directly edit the OS.
9. Upload the case's marriage certificate when requested and continue through the grounds section.

Uploaded documents verify information already held in the application. They never overwrite or populate the Originating Summons.

## Demo 1 — Case 1: risk and MCP eligibility

Open `/?case=1` and select **Nur Aisyah Binte Rahman**. Show the `Domestic Violence` MCP reason and **Present** risk indicator. The separate safety information appears in Grounds for Divorce but does not block filing.

For the eligibility gate, open `/?case=1&eligibility=expired` and select the same identity. The MCP was completed more than six months ago, so the journey stops politely before consent.

## Demo 2 — Case 4: children discrepancy

Open `/?case=4` and select **Zulkifli Bin Rashid**. Upload `Scenario4_ROMM_1.jpeg`, then choose joint custody and care and control to the Plaintiff separately for Haziq and Aisyah. Upload `Scenario4_Form11_PP.docx`.

Show that MCP and relief name Aisyah only, while the OS and Parenting Plan contain Haziq and Aisyah. Re-uploading `resources/scenario4-parenting-plan-corrected.pdf` verifies the OS arrangements but does not remove the separate MCP/relief discrepancies. Use the explicit acknowledgement flow to continue.

## Demo 3 — Case 9: handwritten address discrepancy

Use **Start over**, open `/?case=9`, and select **Taufiq Bin Sallehin**.

### Presenter actions

1. Complete the standard lead-in using `Scenario9_ROMM_1.jpeg` for the marriage-certificate check.
2. Continue past Children & Custody. No children are recorded for this case.
3. At **Matrimonial property**, point out that both HDB and the OS show `18 Tampines Street 42, #05-118, Singapore 529201`.
4. Upload `Form 13_page 1.jpg` and `Form 13_page 2.jpg` in the same file selection.
5. Show that the handwritten plan was read as:
   - Address: `82 Canberra Road`
   - Flat type: 4-room
   - Holding: joint tenancy
   - Option 5 — Defendant's share transferred to Plaintiff
   - Signed before a Commissioner for Oaths
6. Use the yellow comparison panel to show the three sources side by side:
   - HDB: Tampines address
   - Originating Summons: Tampines address
   - Property Plan: Canberra address

### Demonstrate the acknowledgement path

1. Select **Ignore and continue**.
2. Explain that Aisha does not silently dismiss the mismatch. A second inline confirmation asks the applicant to make an explicit decision.
3. Select **Continue with current information** to proceed and preserve the acknowledgement in the application summary.

### Demonstrate the recovery path instead

1. Select **Ignore and continue**.
2. Choose **Review and re-upload** at the inline confirmation step.
3. Upload `resources/scenario9-form13-corrected.pdf`.
4. Confirm that the yellow warning disappears and the green **No discrepancies found** result appears.
5. Continue with the property arrangement.

### Expected result

- The original two-page handwritten plan produces exactly one discrepancy: the property address.
- Matching flat type, holding, parties, and Option 5 arrangement do not produce false positives.
- The applicant may explicitly continue with the warning recorded or resolve it with the corrected plan.
- Re-uploading verifies against the existing HDB/OS values; it does not rewrite them.

### What to say

> This shows where the assistance adds value. The system reads a photographed handwritten plan, identifies the one material difference, explains it in plain language, and gives the applicant a controlled way to correct or acknowledge it.

## Demo 4 — Case 10: all records agree

Open `/?case=10` and select **Amin Bin Zainal**.

### Presenter actions

1. Complete the standard lead-in using `Scenario10_ROMM_1.jpeg` for the marriage-certificate check.
2. Continue past Children & Custody. No children are recorded for this case.
3. At **Matrimonial property**, pause on the HDB details:
   - Address: `44 Simei Street 1, #07-22, Singapore 520044`
   - Holding: joint tenancy
   - Outstanding loan: `SGD 255,000`
   - CPF OA balances: Amin `SGD 18,340`; Nadia `SGD 14,780`
4. Upload `Scenario10_Form13.docx` and `Scenario10_Form14.docx` in the same file selection.
5. Review the extracted plan details:
   - Option 5 — Defendant's share transferred to Plaintiff
   - No cash consideration
   - Defendant's CPF monies refunded
   - Plaintiff bears 100% of the `SGD 255,000` mortgage
   - Plaintiff bears 100% of the fees
   - Transfer within six months of the court order
6. Point out the single green **No discrepancies found** confirmation.
7. Choose **Transfer Defendant's share to Plaintiff**.
8. Confirm maintenance, choose **No — None declared** for bankruptcy/court proceedings, and review the full application.
9. Tick the declaration and submit.
10. Confirm the service agreement, continue to payment, review the filing fees, and continue to the completion screen.

### Expected result

- No yellow warning, validation error, discrepancy prompt, or acknowledgement step appears anywhere on the valid Case 10 path.
- The uploaded forms are shown as verification evidence and do not change the OS.
- The journey reaches **Application steps completed** normally.

### What to say

> This is the low-friction path. The applicant reviews authoritative information instead of re-entering it. SYC Companion verifies the supporting plan across the connected records and stays quiet when everything agrees.

## Closing message

Emphasise these four points:

1. Government-held information is retrieved once and presented in a read-only application.
2. Applicant uploads are limited to genuine verification points.
3. Deterministic comparisons stay silent when records agree and explain the precise source difference when they do not.
4. The current browser-only fixtures demonstrate the intended interaction. Production authentication, integrations, document processing, secure persistence, payment, and court submission remain separate implementation work.
