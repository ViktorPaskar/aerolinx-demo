// Release certificates laid out block by block like the real forms. Always carries a
// SPECIMEN watermark and a fictional approval number, so it can never pass as a real release.
const cell = (no, label, val, cls = '') => `<div class="b ${cls}"><span class="bl"><i>${no}</i>${label}</span>${val !== undefined ? `<span class="bv">${val}</span>` : ''}</div>`;
const sig = `<svg class="sig" viewBox="0 0 150 44" aria-hidden="true"><path d="M4 30c10-16 18-26 22-24 5 3-8 32-4 33 5 1 13-22 18-20 4 2-3 17 2 17 6 0 8-11 13-11 4 0 0 10 5 10 7 0 10-9 16-9 5 0 1 8 7 8 9 0 16-8 28-8 9 0 19 3 31 1" fill="none" stroke="#17306f" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const statusWord = { NE: 'NEW', OH: 'OVERHAULED', SV: 'INSPECTED / TESTED', AR: 'AS REMOVED' };
const FAA_REM = {
  NE: 'NEW PART, PRODUCED UNDER FAA PRODUCTION APPROVAL. CONFORMS TO TYPE DESIGN AND IS IN A CONDITION FOR SAFE OPERATION.',
  OH: 'OVERHAULED PER CMM CURRENT REVISION. ALL APPLICABLE AIRWORTHINESS DIRECTIVES COMPLIED WITH. NON-INCIDENT STATEMENT ATTACHED.',
  SV: 'INSPECTED AND TESTED PER CMM CURRENT REVISION. NO INCIDENT HISTORY STATED BY THE LAST OPERATOR.',
};

export function certEASA(p, o) {
  const tracking = 'SA-' + p.pn.replace(/\D/g, '').slice(0, 6);
  return `<div class="form form-easa" dir="ltr" role="img" aria-label="Specimen EASA Form 1 for ${p.pn}">
    <div class="wm" aria-hidden="true">SPECIMEN</div>
    <div class="fr r3">
      ${cell(1, 'Approving Competent Authority / Country', 'EASA')}
      <div class="b title"><span class="bl"><i>2</i></span><strong>AUTHORISED RELEASE CERTIFICATE</strong><strong class="sub">EASA FORM 1</strong></div>
      ${cell(3, 'Form Tracking Number', tracking)}
    </div>
    <div class="fr r2">
      ${cell(4, 'Organisation Name and Address', 'SIRB AERO FZE<br>DUBAI AIRPORT FREEZONE, DUBAI, U.A.E.', 'tall')}
      ${cell(5, 'Work Order / Contract / Invoice', 'WO-' + tracking.slice(3), 'tall')}
    </div>
    <div class="fr items">
      ${cell(6, 'Item', '1')}
      ${cell(7, 'Description', p.en.toUpperCase())}
      ${cell(8, 'Part No.', p.pn)}
      ${cell(9, 'Qty', '1')}
      ${cell(10, 'Serial No.', 'SN' + tracking.slice(3))}
      ${cell(11, 'Status / Work', statusWord[o.c])}
    </div>
    <div class="fr">${cell(12, 'Remarks', o.c === 'OH' ? 'OVERHAULED IN ACCORDANCE WITH THE CURRENT COMPONENT MAINTENANCE MANUAL. ALL APPLICABLE AIRWORTHINESS DIRECTIVES COMPLIED WITH. NON-INCIDENT STATEMENT ATTACHED.' : o.c === 'NE' ? 'NEW PART, MANUFACTURED UNDER APPROVED DESIGN DATA. SHELF LIFE AND BATCH RECORD ON THE PACKING LABEL.' : 'INSPECTED AND FUNCTIONALLY TESTED PER THE COMPONENT MAINTENANCE MANUAL. NON-INCIDENT STATEMENT ATTACHED.', 'rem')}</div>
    <div class="fr r2">
      <div class="b certtxt"><span class="bl"><i>13a</i>Certifies that the items identified above were manufactured in conformity to:</span>
        <span class="cb"><i class="box${o.c === 'NE' ? ' x' : ''}"></i>approved design data and are in a condition for safe operation</span>
        <span class="cb"><i class="box"></i>non-approved design data specified in Block 12</span></div>
      <div class="b certtxt"><span class="bl"><i>14a</i></span>
        <span class="cb"><i class="box${o.c === 'NE' ? '' : ' x'}"></i>Part-145.A.50 Release to Service</span>
        <span class="cb"><i class="box"></i>Other regulation specified in Block 12</span>
        <span class="small">Certifies that unless otherwise specified in Block 12, the work identified in Block 11 and described in Block 12 was accomplished in accordance with Part-145 and in respect to that work the items are considered ready for release to service.</span></div>
    </div>
    <div class="fr r2">
      <div class="fr r2 nest">${cell('13b', 'Authorised Signature', o.c === 'NE' ? sig : '')}${cell('13c', 'Approval / Authorisation No.', o.c === 'NE' ? 'XX.21G.0000' : '')}</div>
      <div class="fr r2 nest">${cell('14b', 'Authorised Signature', o.c === 'NE' ? '' : sig)}${cell('14c', 'Certificate / Approval Ref. No.', o.c === 'NE' ? '' : 'XX.145.0000')}</div>
    </div>
    <div class="fr r2">
      <div class="fr r2 nest">${cell('13d', 'Name', o.c === 'NE' ? 'R. AL HASHIMI' : '')}${cell('13e', 'Date (dd/mmm/yyyy)', o.c === 'NE' ? '06/NOV/2026' : '')}</div>
      <div class="fr r2 nest">${cell('14d', 'Name', o.c === 'NE' ? '' : 'R. AL HASHIMI')}${cell('14e', 'Date (dd/mmm/yyyy)', o.c === 'NE' ? '' : '06/NOV/2026')}</div>
    </div>
    <p class="resp"><strong>User / Installer Responsibilities.</strong> This certificate does not automatically constitute authority to install the item. Where the user or installer works under a national regulation of an airworthiness authority different from the authority specified in Block 1, it is essential that they ensure the authority accepts items from the authority specified in Block 1.</p>
  </div>`;
}

export function certFAA(p, o) {
  const tracking = '8130-' + p.pn.replace(/\D/g, '').slice(0, 6);
  return `<div class="form form-faa" dir="ltr" role="img" aria-label="Specimen FAA Form 8130-3 for ${p.pn}">
    <div class="wm" aria-hidden="true">SPECIMEN</div>
    <div class="fr r3">
      ${cell(1, 'Approving Civil Aviation Authority / Country', 'FAA / UNITED STATES')}
      <div class="b title"><span class="bl"><i>2</i></span><strong>AUTHORIZED RELEASE CERTIFICATE</strong><strong class="sub">FAA Form 8130-3, AIRWORTHINESS APPROVAL TAG</strong></div>
      ${cell(3, 'Form Tracking Number', tracking)}
    </div>
    <div class="fr r2">
      ${cell(4, 'Organization Name and Address', 'REPAIR STATION OF RECORD<br>ADDRESS SHOWN ON THE ORIGINAL', 'tall')}
      ${cell(5, 'Work Order / Contract / Invoice Number', 'WO-' + tracking.slice(5), 'tall')}
    </div>
    <div class="fr items faa">
      ${cell(6, 'Item', '1')}
      ${cell(7, 'Description', p.en.toUpperCase())}
      ${cell(8, 'Part Number', p.pn)}
      ${cell(9, 'Eligibility', p.fits.join(', '))}
      ${cell(10, 'Quantity', '1')}
      ${cell(11, 'Serial / Batch Number', 'SN' + tracking.slice(5))}
      ${cell(12, 'Status / Work', statusWord[o.c])}
    </div>
    <div class="fr">${cell(13, 'Remarks', FAA_REM[o.c] || FAA_REM.SV, 'rem')}</div>
    <div class="fr r2">
      <div class="b certtxt"><span class="bl"><i>14a</i></span>
        <span class="cb"><i class="box${o.c === 'NE' ? ' x' : ''}"></i>Other regulation specified in Block 13: conformity to approved design data, in condition for safe operation</span></div>
      <div class="b certtxt"><span class="bl"><i>19</i></span>
        <span class="cb"><i class="box${o.c === 'NE' ? '' : ' x'}"></i>14 CFR 43.9 Return to Service</span>
        <span class="small">Certifies that unless otherwise specified in Block 13, the work identified in Block 12 and described in Block 13 was accomplished in accordance with Title 14 CFR Part 43 and in respect to that work the items are approved for return to service.</span></div>
    </div>
    <div class="fr r2">
      <div class="fr r2 nest">${cell('14b', 'Authorized Signature', o.c === 'NE' ? sig : '')}${cell('14c', 'Approval / Authorization No.', o.c === 'NE' ? 'XXXX000X' : '')}</div>
      <div class="fr r2 nest">${cell(20, 'Authorized Signature', o.c === 'NE' ? '' : sig)}${cell(21, 'Approval / Certificate No.', o.c === 'NE' ? '' : 'XXXX000X')}</div>
    </div>
    <div class="fr r2">
      <div class="fr r2 nest">${cell('14d', 'Name (Typed or Printed)', o.c === 'NE' ? 'J. MERCER' : '')}${cell('14e', 'Date (dd/mmm/yyyy)', o.c === 'NE' ? '06/NOV/2026' : '')}</div>
      <div class="fr r2 nest">${cell(22, 'Name (Typed or Printed)', o.c === 'NE' ? '' : 'J. MERCER')}${cell(23, 'Date (dd/mmm/yyyy)', o.c === 'NE' ? '' : '06/NOV/2026')}</div>
    </div>
    <p class="resp"><strong>User / Installer Responsibilities.</strong> This certificate does not automatically constitute authority to install the item. Where the user or installer performs work in accordance with regulations of an airworthiness authority different from the authority specified in Block 1, it is essential that they ensure the authority accepts items from the authority specified in Block 1.</p>
  </div>`;
}

// As-removed parts are unserviceable: no release certificate, only the removal tag and history.
export function removalTag(p, o) {
  const tag = 'RT-' + p.pn.replace(/\D/g, '').slice(0, 6);
  return `<div class="form form-tag" dir="ltr" role="img" aria-label="Specimen removal tag for ${p.pn}">
    <div class="wm" aria-hidden="true">SPECIMEN</div>
    <div class="fr r2">
      <div class="b title"><strong>UNSERVICEABLE PART</strong><strong class="sub">REMOVAL TAG, NOT A RELEASE CERTIFICATE</strong></div>
      ${cell(1, 'Tag Number', tag)}
    </div>
    <div class="fr r3">
      ${cell(2, 'Description', p.en.toUpperCase())}
      ${cell(3, 'Part No.', p.pn)}
      ${cell(4, 'Serial No.', 'SN' + tag.slice(3))}
    </div>
    <div class="fr r3">
      ${cell(5, 'Removed From', p.fits[0] + ' OPERATOR FLEET')}
      ${cell(6, 'Reason for Removal', 'SCHEDULED REMOVAL, NO FAULT REPORTED')}
      ${cell(7, 'Status', 'AS REMOVED')}
    </div>
    <div class="fr">${cell(8, 'Remarks', 'NOT ELIGIBLE FOR INSTALLATION. REQUIRES INSPECTION, TEST OR OVERHAUL AND A RELEASE CERTIFICATE BY AN APPROVED REPAIR STATION BEFORE USE. NON-INCIDENT STATEMENT AND LAST OPERATOR RECORDS SUPPLIED.', 'rem')}</div>
    <div class="fr r2">${cell(9, 'Removed By (Name)', 'R. AL HASHIMI')}${cell(10, 'Date (dd/mmm/yyyy)', '06/NOV/2026')}</div>
  </div>`;
}

export const certFor = (p, o) => (o.c === 'AR' ? removalTag : o.doc === 'FAA 8130-3' ? certFAA : certEASA)(p, o);
