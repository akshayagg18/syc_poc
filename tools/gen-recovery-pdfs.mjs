import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'resources');
fs.mkdirSync(out, { recursive: true });

function escapePdf(value) { return value.replace(/([\\()])/g, '\\$1'); }

function makePdf(title, lines) {
  const stream = ['BT', '/F1 18 Tf', '54 770 Td', `(${escapePdf(title)}) Tj`, '/F1 11 Tf', ...lines.flatMap((line) => ['0 -24 Td', `(${escapePdf(line)}) Tj`]), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = Buffer.byteLength(pdf); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

const documents = [
  ['scenario4-parenting-plan-corrected.pdf', 'FORM 11 - CORRECTED PARENTING PLAN', [
    'Child 1: Haziq Bin Zulkifli (T15123456A)',
    'Child 2: Aisyah Binte Zulkifli (T18123456B)',
    'Current residence: 31 Sengkang East Way with the Defendant',
    'Proposed residence: 765 Pasir Ris Street 71 with the Plaintiff',
    'Custody: Joint custody for both children',
    'Care and control: Plaintiff for both children',
    'Access: Reasonable weekends and school holidays to Defendant',
    'Defendant agreement: Confirmed',
  ]],
  ['scenario9-form13-corrected.pdf', 'FORM 13 - CORRECTED PROPERTY PLAN', [
    'Address: 18 Tampines Street 42, #05-118, Singapore 529201',
    'Flat type: 4-room; Holding: Joint tenancy',
    "Arrangement: Defendant's share transferred to Plaintiff",
    'Defendant agreement: Signed',
  ]],
];

for (const [name, title, lines] of documents) fs.writeFileSync(path.join(out, name), makePdf(title, lines));
console.log(`Generated ${documents.length} recovery PDFs in ${out}`);
