/** (developed by @neelotpal.dey) **/
/* ─────────────────────────────────────────────────────────────
   INDIAN PHONE + PAN VALIDATION (shared across all forms)
   ───────────────────────────────────────────────────────────── */

// Matches 10-digit IN mobile starting 6–9, with optional +91 / 91 / 0 / spaces / dashes / parens prefix
const INDIAN_PHONE_REGEX = /^(?:(?:\+91[\s-]?)|(?:91[\s-]?)|(?:0[\s-]?))?[6-9]\d{2}[\s-]?\d{3}[\s-]?\d{4}$/

// PAN = AABBB1234C : exactly 5 uppercase letters + 4 digits + 1 uppercase letter (10 chars)
const INDIAN_PAN_REGEX = /^[A-Z]{3}[CPHFATBLJG]{1}[A-Z]{1}\d{4}[A-Z]{1}$/

/**
 * Validate an Indian mobile number.
 * Accepts: +91 98XXX-XXXXX, 9198XXXXXXXX, 098XXXXXXXX, 98XXXXXXXX, etc.
 * The 10-digit portion MUST start with 6, 7, 8 or 9 (valid Indian mobile series).
 * Returns { valid: boolean, error: string, normalized: string }
 */
export function validateIndianPhone(rawInput) {
  if (rawInput === null || rawInput === undefined) {
    return { valid: false, error: 'Phone number is required', normalized: '' }
  }
  const val = String(rawInput).trim()
  if (!val) {
    return { valid: false, error: 'Phone number is required', normalized: '' }
  }
  // Remove all non-digit characters to count core phone length
  const digitsOnly = val.replace(/\D/g, '')
  // Strip +91 / 91 / 0 prefix if present to get the 10-digit core number
  let coreTen = digitsOnly
  if (coreTen.startsWith('91') && coreTen.length === 12) coreTen = coreTen.slice(2)
  else if (coreTen.startsWith('0') && coreTen.length === 11) coreTen = coreTen.slice(1)

  if (coreTen.length !== 10) {
    return { valid: false, error: 'Phone must have exactly 10 digits (Indian mobile)', normalized: '' }
  }
  if (!/^[6-9]/.test(coreTen)) {
    return { valid: false, error: 'Invalid Indian mobile — must start with 6, 7, 8 or 9', normalized: '' }
  }
  if (!INDIAN_PHONE_REGEX.test(val.replace(/\(|\)/g, ''))) {
    return { valid: false, error: 'Enter a valid 10-digit Indian mobile number', normalized: '' }
  }
  const normalized = '+91 ' + coreTen.slice(0, 3) + ' ' + coreTen.slice(3, 6) + ' ' + coreTen.slice(6)
  return { valid: true, error: '', normalized }
}

/**
 * Validate an Indian PAN card number:
 * Format = AABBB1234C (10 characters total):
 *   Positions 1-3 : 3 random uppercase letters (AAA)
 *   Position 4    : Card holder type letter (C=Company, P=Person, H=HUF, F=Firm, A=AOP, T=Trust, B=BOI, L=Local Authority, J=Artificial Juridical, G=Govt)
 *   Position 5    : First letter of holder surname / entity name (alphabet)
 *   Positions 6-9 : 4 sequential digits
 *   Position 10   : Alphabetic checksum letter
 * Returns { valid: boolean, error: string, normalized: string }
 */
export function validateIndianPAN(rawInput) {
  if (rawInput === null || rawInput === undefined) {
    return { valid: false, error: 'PAN number is required', normalized: '' }
  }
  const val = String(rawInput).trim().toUpperCase()
  if (!val) {
    return { valid: false, error: 'PAN number is required', normalized: '' }
  }
  if (val.length !== 10) {
    return { valid: false, error: 'PAN must be exactly 10 characters', normalized: '' }
  }
  if (!/^[A-Z0-9]+$/.test(val)) {
    return { valid: false, error: 'PAN can only contain letters (A-Z) and digits (0-9)', normalized: '' }
  }
  if (!INDIAN_PAN_REGEX.test(val)) {
    const typeCodes = '[C|P|H|F|A|T|B|L|J|G]'
    return {
      valid: false,
      error: `PAN format invalid. Use: AAA${typeCodes}X1234Y (e.g. ABCPJ1234Q).`,
      normalized: ''
    }
  }
  return { valid: true, error: '', normalized: val }
}

/** Normalize a phone to +91 XXX XXX XXXX format if possible, else return trimmed input */
export function normalizeIndianPhone(raw) {
  const res = validateIndianPhone(raw || '')
  return res.valid ? res.normalized : String(raw || '').trim()
}

/** Normalize PAN to uppercase trimmed string */
export function normalizePAN(raw) {
  return validateIndianPAN(raw || '').normalized || String(raw || '').trim().toUpperCase()
}

export const fmtINR = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '₹0'
  const num = Number(n)
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export const fmtNum = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '0'
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export const fmtPct = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '0%'
  return Number(n).toFixed(2) + '%'
}

export const initials = (name) => {
  if (!name) return '??'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const roleBadgeClass = (role) => {
  const map = {
    admin: 'badge-admin',
    branch_manager: 'badge-branch_manager',
    arm: 'badge-arm',
    rm: 'badge-rm',
    advisor: 'badge-advisor',
    sub_broker: 'badge-sub-broker',
    employee: 'badge-employee',
    client: 'badge-client'
  }
  return map[role] || 'badge-admin'
}

export const roleLabel = (role) => {
  const map = {
    admin: 'Admin',
    branch_manager: 'Branch Manager (BM)',
    rm: 'RM',
    arm: 'ARM',
    advisor: 'Advisor',
    sub_broker: 'Sub Broker',
    employee: 'Employee',
    client: 'Client'
  }
  return map[role] || String(role || 'User').charAt(0).toUpperCase() + String(role || '').slice(1)
}

export const triggerBlobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

const csvEscape = (val) => {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export const downloadCSV = (headers, rows, filename) => {
  const headerLine = headers.map(h => csvEscape(h)).join(',')
  const bodyLines = rows.map(r => r.map(cell => csvEscape(cell)).join(','))
  const csv = '\ufeff' + [headerLine, ...bodyLines].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerBlobDownload(blob, filename.endsWith('.csv') ? filename : filename + '.csv')
}

export const downloadExcel = (headers, rows, filename) => {
  downloadCSV(headers, rows, filename.endsWith('.xls') ? filename : filename + '.xls')
}

/**
 * Validate strong password for customers and users:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special symbol (!@#$%^&* etc.)
 * Returns { valid: boolean, error: string }
 */
export function validateStrongPassword(rawInput) {
  if (rawInput === null || rawInput === undefined) {
    return { valid: false, error: 'Password is required' }
  }
  const pwd = String(rawInput)
  if (!pwd) {
    return { valid: false, error: 'Password is required' }
  }
  if (pwd.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(pwd)) {
    return { valid: false, error: 'Password must include at least 1 uppercase letter (A-Z)' }
  }
  if (!/[a-z]/.test(pwd)) {
    return { valid: false, error: 'Password must include at least 1 lowercase letter (a-z)' }
  }
  if (!/\d/.test(pwd)) {
    return { valid: false, error: 'Password must include at least 1 number (0-9)' }
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd)) {
    return { valid: false, error: 'Password must include at least 1 special symbol (e.g. @, #, $, %, !)' }
  }
  return { valid: true, error: '' }
}

/**
 * Sanitize and escape HTML special characters to prevent Cross-Site Scripting (XSS).
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const printHTML = (title, contentHTML) => {
  const printWin = window.open('', '_blank', 'width=900,height=700')
  if (!printWin) {
    alert('Please allow pop-ups to generate PDF report')
    return
  }
  const safeTitle = escapeHTML(title)
  printWin.document.write(`<!DOCTYPE html><html><head><title>${safeTitle}</title>
    <style>
      * { box-sizing: border-box; font-family: Arial, sans-serif; }
      body { margin: 30px; color: #111; }
      h1 { color: #0B1C3B; border-bottom: 2px solid #D12020; padding-bottom: 10px; }
      h2 { color: #14305C; margin-top: 24px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; font-size: 13px; }
      th { background: #0B1C3B; color: #fff; }
      tr:nth-child(even) td { background: #f7f9fc; }
      .summary-row td { background: #eef2ff; font-weight: 700; }
      .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
      .footnote { margin-top: 30px; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 10px; }
      .success { color: #16a34a; }
      .danger { color: #dc2626; }
      @media print { body { margin: 15mm; } }
    </style></head><body>
    <h1>Genius Enterprises — ${safeTitle}</h1>
    <div class="meta">Generated: ${new Date().toLocaleString('en-IN')}</div>
    ${contentHTML}
    <div class="footnote">This is a system-generated report from Genius Enterprises. Confidential — For authorized use only.</div>
    </body></html>`)
  printWin.document.close()
  printWin.focus()
  setTimeout(() => { printWin.print() }, 350)
}

export const rowsToHTMLTable = (headers, rows, { totalsRow } = {}) => {
  let html = '<table><thead><tr>' + headers.map(h => `<th>${escapeHTML(h)}</th>`).join('') + '</tr></thead><tbody>'
  rows.forEach(r => {
    html += '<tr>' + r.map(c => `<td>${escapeHTML(c ?? '')}</td>`).join('') + '</tr>'
  })
  if (totalsRow) {
    html += '<tr class="summary-row">' + totalsRow.map(c => `<td>${escapeHTML(c ?? '')}</td>`).join('') + '</tr>'
  }
  html += '</tbody></table>'
  return html
}

