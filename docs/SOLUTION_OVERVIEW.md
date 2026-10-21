# Solution overview

```text
Local case fixtures (Singpass, MCP, ROMM, MSF/ICA, HDB, CPF, PPO)
                            │
                            ▼
        Singpass-style entry → e-Services → MCP → consent
                            ▼
                    Read-only OS prefill
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
     Marriage certificate  Parenting Plan  Property Plan
       (every case)         (if children)  (if property)
              └─────────────┼─────────────┘
                            ▼
               Fixture-based extraction
                            ▼
                Source comparisons
                            ▼
       Correct in chat / re-upload / confirm and continue
                            ▼
           Declaration → agreement → payment choice
```

The applicant never edits the Originating Summons directly. Marriage certificate upload is required in every case; custody and care-and-control are collected per child before Parenting Plan upload; HDB data is shown before Property Plan upload and property-relief choices. Discrepancies are polite, nonblocking warnings, but mandatory-document and MCP-eligibility gates cannot be ignored.

All data, comparisons, extraction and state are browser-side for this presentation. The extractor uses known fixture filenames, not OCR or AI. No key is embedded or required. Authentication, real retrieval, document verification, server-side validation, secure storage and payment would require a separate production architecture.
