# Presenter demo script

Run `npm run dev` and use a fresh browser profile for each case (or resume its saved draft). The applicant interface has no case or POC controls. Select the record before opening the screen using the local URL suffix below. Keep the supplied files in `docs/Scenario N/` and the two corrected files in `resources/` ready.

For each case, use the Singpass-style entry button, choose the divorce service on the e-Services dashboard, and select **Continue with Aisha** before starting the conversation. These entry screens are simulated, not a live login.

## 1. Case 10 — consistent records

Open `?case=10`. Choose Divorce and self-representation, review the valid MCP and consent to retrieval. Point out that the OS fills from sourced records while remaining read-only. Upload both ROMM certificate images. At Property, show HDB details before uploading `Scenario10_Form13.docx` and `Scenario10_Form14.docx` together. Review Option 5, CPF refund, mortgage responsibility, fees, and six-month timeframe. There should be no discrepancy warning. Continue through declaration, agreement, and payment-choice to completion.

## 2. Case 9 — handwritten address discrepancy

Open `?case=9`. Upload both ROMM certificate images. At Property, upload both `Form 13_page 1.jpg` and `Form 13_page 2.jpg`. Show the extracted `82 Canberra Road` beside HDB and OS's `18 Tampines Street 42, #05-118, Singapore 529201`. Try **Ignore and continue** and cancel the dialog to show it does not advance without confirmation. Then either confirm to continue with the warning recorded, or re-upload `resources/scenario9-form13-corrected.pdf` to resolve it before choosing sell/transfer/retain.

## 3. Case 4 — children from the current marriage

Open `?case=4`. Upload both ROMM certificate images. Review Haziq's relationship marker and Aisyah's record. Choose custody, care and control, and access separately for each child. Only after those answers, upload `Scenario4_Form11_PP.docx`. Show the two source comparisons: MCP versus OS children, and relief claim versus Parenting Plan. Use **Correct application details** to retain Aisyah only, then upload `resources/scenario4-parenting-plan-corrected.pdf` to reconcile both. Alternatively, use **Ignore and continue** and explicitly confirm the dialog.

## 4. Case 1 — risk and MCP gate

Open `?case=1`. Review valid MCP and the high-risk indicator derived from the abuse reason; continue through consent and certificate upload. At Grounds, point out the separate safety information. It does not block the filing. For the alternate gate, open `?case=1&eligibility=expired`; MCP is outside the six-month period, so the journey stops before consent.

Close by explaining the boundary: this frontend demonstrates the desired applicant interaction and deterministic comparisons with local fixtures. It does not perform live authentication, OCR, payment, or court submission.
