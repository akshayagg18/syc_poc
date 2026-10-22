import React from 'react';
import idealFlowSource from '../docs/syc-form-assistant 1 (ideal happy flow).html?raw';
import enhancements from './idealFlowEnhancements.js?raw';
import workbenchStyles from './styles.css?raw';
import designTokens from '../tokens.css?raw';
import { getFilingCase } from './data/filingCases.js';

const CASE_IDS = ['1', '4', '9', '10'];

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:wght@400;600;700&display=swap';

/** Preserve the supplied content and workflow while replacing its visual structure. */
function applyInitialRedTheme(html) {
  return html
    .replaceAll('#1c3460', '#660d07')
    .replaceAll('#4ecdc4', '#f3b6ae')
    .replaceAll('#a0b0cc', '#e0b4b0')
    .replaceAll('#f0fffe', '#fff2f0')
    .replace(
      '</head>',
      `<link href="${FONT_HREF}" rel="stylesheet"><style>
        body { font-family: 'Inter', system-ui, sans-serif; }
        .top-logo, .top-logo #topLogo { font-family: var(--font-display); }
        .top-logo #topLogo { color: #fff; }
      </style><style>${designTokens}</style><style>${workbenchStyles}</style></head>`,
    );
}

export default function IdealFlowApp() {
  // Every applicant record travels into the frame, so the Singpass screen can offer all of them.
  const search = window.location.search;
  const requested = getFilingCase(search).id;
  const cases = Object.fromEntries(CASE_IDS.map((id) => [id, getFilingCase(id === requested ? search : `?case=${id}`)]));
  const profiles = JSON.stringify(cases).replaceAll('<', '\\u003c');
  const idealFlow = applyInitialRedTheme(idealFlowSource).replace(
    '</body>',
    `<script>window.SYC_FILING_CASES = ${profiles};window.SYC_FILING_CASE = window.SYC_FILING_CASES[${JSON.stringify(requested)}];</script><script>${enhancements}</script></body>`,
  );

  return (
    <main className="ideal-flow-shell">
      <iframe
        className="ideal-flow-frame"
        title="SYC Divorce Navigator"
        srcDoc={idealFlow}
      />
    </main>
  );
}
