import React, { useMemo } from 'react';
import idealFlowSource from '../docs/syc-form-assistant 1 (ideal happy flow).html?raw';
import enhancements from './idealFlowEnhancements.js?raw';
import workbenchStyles from './styles.css?raw';
import designTokens from '../tokens.css?raw';
import { getFilingCase } from './data/filingCases.js';

/** Preserve the supplied content and workflow while replacing its visual structure. */
function applyInitialRedTheme(html) {
  return html
    .replaceAll('#1c3460', '#660d07')
    .replaceAll('#4ecdc4', '#f3b6ae')
    .replaceAll('#a0b0cc', '#e0b4b0')
    .replaceAll('#f0fffe', '#fff2f0')
    .replace(
      '</head>',
      `<style>
        body { font-family: 'Lato', 'Inter', sans-serif; }
        .top-logo, .top-logo #topLogo { font-family: 'Times New Roman', Times, serif; }
        .top-logo #topLogo { color: #fff; }
      </style><style>${designTokens}</style><style>${workbenchStyles}</style></head>`,
    );
}

export default function IdealFlowApp() {
  const idealFlow = useMemo(() => {
    const profile = JSON.stringify(getFilingCase(window.location.search)).replaceAll('<', '\\u003c');
    return applyInitialRedTheme(idealFlowSource).replace(
      '</body>',
      `<script>window.SYC_FILING_CASE = ${profile};</script><script>${enhancements}</script></body>`,
    );
  }, []);

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
