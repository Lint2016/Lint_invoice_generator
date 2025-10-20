// app.js — handles company profile storage, logo upload, and section toggle
const STORAGE_KEY = 'le_company_profile_v1';

// Element references
const companyForm = document.getElementById('companyForm');
const companyName = document.getElementById('companyName');
const companyAddress = document.getElementById('companyAddress');
const companyEmail = document.getElementById('companyEmail');
const companyPhone = document.getElementById('companyPhone');
const companyLogo = document.getElementById('companyLogo');
const logoImg = document.getElementById('logoImg');
const clearProfileBtn = document.getElementById('clearProfile');
const pvName = document.getElementById('pvName');
const pvAddress = document.getElementById('pvAddress');
const pvContact = document.getElementById('pvContact');
const invLogoMini = document.getElementById('invLogoMini');
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');
const currentYear = document.getElementById('currentYear');

// Footer year
if (currentYear) currentYear.textContent = new Date().getFullYear();

// Helpers
function saveProfileToStorage(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (_) {}
}
function buildExportHTML(profile, invoice, filename) {
  const html = buildPrintableHTML(profile, invoice);
  const safeName = (filename || 'Invoice').replace(/\s+/g, '_');
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeName}</title>
</head>
<body>
${html.replace(/^[\s\S]*<body>/, '').replace(/<\/body>[\s\S]*$/, '')}
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script>
  (function(){
    function go(){
      try{
        setTimeout(function(){
        var opt = {
          margin: 10,
          filename: '${safeName}.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', allowTaint: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css','legacy'] }
        };
        window.html2pdf().set(opt).from(document.documentElement).save().then(function(){
          setTimeout(function(){ window.close(); }, 300);
        });
        }, 150);
      }catch(e){ console.error(e); }
    }
    if (window.html2pdf) go(); else window.addEventListener('load', go);
  })();
<\/script>
</body></html>`;
}

function buildInvoiceFragment(profile, invoice) {
  const cur = (invoice.currency || 'USD').toUpperCase();
  const container = document.createElement('div');
  container.style.padding = '24px';
  container.style.color = '#0b0d10';
  container.style.fontFamily = "Poppins, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px">
      <div style="width:140px;height:100px;border-radius:10px;${profile?.logo ? '' : 'background:linear-gradient(135deg,#1fbfa6,#0f6fff);'}${profile?.logo ? `background:url(${profile.logo}) center/contain no-repeat;` : ''}"></div>
      <div>
        <strong style="font-size:18px;display:block">${profile?.name || 'Company Name'}</strong>
        <div>${profile?.address || ''}</div>
        <div>${[profile?.email, profile?.phone].filter(Boolean).join(' · ')}</div>
      </div>
    </div>
    <h1 style="margin:0 0 8px 0">Invoice</h1>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0">
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px">
        <strong>Bill To</strong>
        <div>${invoice.client.name || ''}</div>
        <div>${invoice.client.address || ''}</div>
        <div>${[invoice.client.email, invoice.client.phone].filter(Boolean).join(' · ')}</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px">
        <div><strong>Invoice #:</strong> ${invoice.number || ''}</div>
        <div><strong>Date:</strong> ${invoice.date || ''}</div>
        <div><strong>Due:</strong> ${invoice.due || ''}</div>
        <div><strong>Currency:</strong> ${cur}</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:8px">Description</th>
          <th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:8px">Qty</th>
          <th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:8px">Unit Price</th>
          <th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:8px">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map(it => `
          <tr>
            <td style="border-bottom:1px solid #e5e7eb;padding:8px">${it.desc || ''}</td>
            <td style="border-bottom:1px solid #e5e7eb;padding:8px">${it.qty}</td>
            <td style="border-bottom:1px solid #e5e7eb;padding:8px">${currencyFmt(it.price, cur)}</td>
            <td style="border-bottom:1px solid #e5e7eb;padding:8px">${currencyFmt(it.qty * it.price, cur)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="margin-top:16px;max-width:360px;margin-left:auto">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb"><span>Subtotal</span><span>${currencyFmt(invoice.subtotal, cur)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb"><span>Tax</span><span>${currencyFmt(invoice.tax, cur)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb"><span>Discount</span><span>${currencyFmt(invoice.discount, cur)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb"><span>Shipping</span><span>${currencyFmt(invoice.shipping, cur)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Total</span><strong>${currencyFmt(invoice.total, cur)}</strong></div>
    </div>
  `;
  return container;
}

function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function clearProfileStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}

// Apply profile to preview and form
function applyProfile(profile) {
  if (!profile) return;
  if (companyName) companyName.value = profile.name || '';
  if (companyAddress) companyAddress.value = profile.address || '';
  if (companyEmail) companyEmail.value = profile.email || '';
  if (companyPhone) companyPhone.value = profile.phone || '';

  if (pvName) pvName.textContent = profile.name || 'Company Name';
  if (pvAddress) pvAddress.textContent = profile.address || '';
  if (pvContact) pvContact.textContent = `${profile.email || ''}${profile.phone ? ' · ' + profile.phone : ''}`;

  if (profile.logo) {
    if (logoImg) {
      logoImg.src = profile.logo;
      logoImg.style.display = 'block';
    }
    if (invLogoMini) {
      invLogoMini.style.backgroundImage = `url(${profile.logo})`;
      invLogoMini.style.backgroundSize = 'contain';
      invLogoMini.style.backgroundRepeat = 'no-repeat';
      invLogoMini.style.backgroundPosition = 'center';
    }
  } else {
    if (logoImg) {
      logoImg.removeAttribute('src');
      logoImg.style.display = 'none';
    }
    if (invLogoMini) {
      invLogoMini.style.removeProperty('background-image');
      invLogoMini.style.removeProperty('background-size');
      invLogoMini.style.removeProperty('background-repeat');
      invLogoMini.style.removeProperty('background-position');
    }
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// Bootstrap on load
document.addEventListener('DOMContentLoaded', () => {
  const existing = loadProfileFromStorage();
  if (existing) applyProfile(existing);
});

// Form submit -> save profile
if (companyForm) {
  companyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const prev = loadProfileFromStorage() || {};
    const next = {
      ...prev,
      name: (companyName?.value || '').trim(),
      address: (companyAddress?.value || '').trim(),
      email: (companyEmail?.value || '').trim(),
      phone: (companyPhone?.value || '').trim(),
    };
    saveProfileToStorage(next);
    applyProfile(next);
  });
}

// Logo upload -> preview + save
if (companyLogo) {
  companyLogo.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await readFileAsDataURL(file);
    const prev = loadProfileFromStorage() || {};
    const next = { ...prev, logo: dataUrl };
    saveProfileToStorage(next);
    applyProfile(next);
  });
}

// Clear profile
if (clearProfileBtn) {
  clearProfileBtn.addEventListener('click', () => {
    clearProfileStorage();
    companyForm?.reset();
    applyProfile({});
  });
}

// Section navigation
if (navBtns && sections) {
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      navBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.section;
      sections.forEach((sec) => {
        sec.classList.toggle('active-section', sec.id === target);
      });
    });
  });
}

// ==============================
// Invoice builder logic
// ==============================

const invoiceForm = document.getElementById('invoiceForm');
const addItemBtn = document.getElementById('addItem');
const itemsBody = document.getElementById('itemsBody');
const taxRateEl = document.getElementById('taxRate');
const discountEl = document.getElementById('discount');
const shippingEl = document.getElementById('shipping');
const subtotalOut = document.getElementById('subtotal');
const taxOut = document.getElementById('tax');
const discountOut = document.getElementById('discountOut');
const shippingOut = document.getElementById('shippingOut');
const grandTotalOut = document.getElementById('grandTotal');
const generateBtn = document.getElementById('generateInvoice');
const clearInvoiceBtn = document.getElementById('clearInvoice');
const exportPdfBtn = document.getElementById('exportPdf');

const clientNameEl = document.getElementById('clientName');
const clientEmailEl = document.getElementById('clientEmail');
const clientPhoneEl = document.getElementById('clientPhone');
const clientAddressEl = document.getElementById('clientAddress');
const invoiceNumberEl = document.getElementById('invoiceNumber');
const invoiceDateEl = document.getElementById('invoiceDate');
const dueDateEl = document.getElementById('dueDate');
const currencyEl = document.getElementById('currency');

function currencyFmt(n, cur) {
  const val = isFinite(n) ? Number(n) : 0;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: (cur || 'USD').toUpperCase() }).format(val);
  } catch {
    return `${(cur || 'USD').toUpperCase()} ${val.toFixed(2)}`;
  }
}

function parseNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function itemRowTemplate() {
  return `
    <tr>
      <td><input type="text" class="it-desc" placeholder="Description"></td>
      <td><input type="number" class="it-qty" min="0" step="1" value="1"></td>
      <td><input type="number" class="it-price" min="0" step="0.01" value="0"></td>
      <td class="it-total">0.00</td>
      <td><button type="button" class="btn ghost it-remove">Remove</button></td>
    </tr>
  `;
}

function recalc() {
  if (!itemsBody) return;
  let subtotal = 0;
  const cur = (currencyEl?.value || 'USD').toUpperCase();

  itemsBody.querySelectorAll('tr').forEach((tr) => {
    const qty = parseNum(tr.querySelector('.it-qty')?.value);
    const price = parseNum(tr.querySelector('.it-price')?.value);
    const total = qty * price;
    subtotal += total;
    const totalCell = tr.querySelector('.it-total');
    if (totalCell) totalCell.textContent = total.toFixed(2);
  });

  const taxRate = parseNum(taxRateEl?.value);
  const discount = parseNum(discountEl?.value);
  const shipping = parseNum(shippingEl?.value);

  const tax = subtotal * (taxRate / 100);
  const grand = subtotal + tax - discount + shipping;

  if (subtotalOut) subtotalOut.textContent = subtotal.toFixed(2);
  if (taxOut) taxOut.textContent = tax.toFixed(2);
  if (discountOut) discountOut.textContent = discount.toFixed(2);
  if (shippingOut) shippingOut.textContent = shipping.toFixed(2);
  if (grandTotalOut) grandTotalOut.textContent = grand.toFixed(2);
}

function addItemRow() {
  if (!itemsBody) return;
  const temp = document.createElement('tbody');
  temp.innerHTML = itemRowTemplate();
  const row = temp.firstElementChild;
  itemsBody.appendChild(row);
  attachRowEvents(row);
  recalc();
}

function attachRowEvents(row) {
  const qty = row.querySelector('.it-qty');
  const price = row.querySelector('.it-price');
  const removeBtn = row.querySelector('.it-remove');
  qty?.addEventListener('input', recalc);
  price?.addEventListener('input', recalc);
  removeBtn?.addEventListener('click', () => {
    row.remove();
    recalc();
  });
}

function buildPrintableHTML(profile, invoice) {
  const logoStyle = profile?.logo ? `background:url(${profile.logo}) center/contain no-repeat;` : '';
  const cur = (invoice.currency || 'USD').toUpperCase();
  const itemsRows = invoice.items.map(it => `
    <tr>
      <td>${it.desc || ''}</td>
      <td>${it.qty}</td>
      <td>${currencyFmt(it.price, cur)}</td>
      <td>${currencyFmt(it.qty * it.price, cur)}</td>
    </tr>
  `).join('');

  return `
<!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice ${invoice.number || ''}</title>
<style>
  :root{--pad:16px}
  html,body{height:auto}
  body{font-family:Poppins,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:var(--pad);color:#0b0d10;background:#fff}
  #pdf-root{max-width:190mm;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px;flex-wrap:wrap}
  .logo{width:min(40vw,160px);height:min(24vw,110px);border-radius:10px;background:${profile?.logo ? 'transparent' : 'linear-gradient(135deg,#1fbfa6,#0f6fff)'};${logoStyle}}
  .company strong{font-size:18px}
  h1{margin:0 0 8px 0;font-size:28px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
  .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
  table{width:100%;border-collapse:collapse;table-layout:fixed}
  th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;word-break:break-word}
  thead th{font-weight:600}
  tfoot td{border-bottom:none}
  .totals{margin-top:16px;max-width:360px;margin-left:auto}
  .totals .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb}
  .totals .row:last-child{border-bottom:none;font-weight:700}
  @media (max-width:700px){
    :root{--pad:12px}
    h1{font-size:24px}
    .grid{grid-template-columns:1fr}
    .totals{max-width:100%}
  }
  @media print{ .no-print{display:none} }
  /* Page-break hints for long invoices */
  tr{page-break-inside:avoid}
  .card,.totals{page-break-inside:avoid}
</style>
</head>
<body>
  <div id="pdf-root">
  <div class="header">
    <div class="logo"></div>
    <div class="company">
      <strong>${profile?.name || 'Company Name'}</strong>
      <div>${profile?.address || ''}</div>
      <div>${[profile?.email, profile?.phone].filter(Boolean).join(' · ')}</div>
    </div>
  </div>

  <h1>Invoice</h1>
  <div class="grid">
    <div class="card">
      <strong>Bill To</strong>
      <div>${invoice.client.name || ''}</div>
      <div>${invoice.client.address || ''}</div>
      <div>${[invoice.client.email, invoice.client.phone].filter(Boolean).join(' · ')}</div>
    </div>
    <div class="card">
      <div><strong>Invoice #:</strong> ${invoice.number || ''}</div>
      <div><strong>Date:</strong> ${invoice.date || ''}</div>
      <div><strong>Due:</strong> ${invoice.due || ''}</div>
      <div><strong>Currency:</strong> ${cur}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${currencyFmt(invoice.subtotal, cur)}</span></div>
    <div class="row"><span>Tax</span><span>${currencyFmt(invoice.tax, cur)}</span></div>
    <div class="row"><span>Discount</span><span>${currencyFmt(invoice.discount, cur)}</span></div>
    <div class="row"><span>Shipping</span><span>${currencyFmt(invoice.shipping, cur)}</span></div>
    <div class="row"><span>Total</span><span>${currencyFmt(invoice.total, cur)}</span></div>
  </div>

  <div class="no-print" style="margin-top:24px"><button onclick="window.print()">Print</button></div>
  </div>
</body></html>
  `;
}

function collectInvoiceData() {
  const items = [];
  itemsBody?.querySelectorAll('tr').forEach((tr) => {
    items.push({
      desc: tr.querySelector('.it-desc')?.value || '',
      qty: parseNum(tr.querySelector('.it-qty')?.value),
      price: parseNum(tr.querySelector('.it-price')?.value),
    });
  });

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const tax = subtotal * (parseNum(taxRateEl?.value) / 100);
  const discount = parseNum(discountEl?.value);
  const shipping = parseNum(shippingEl?.value);
  const total = subtotal + tax - discount + shipping;

  return {
    number: invoiceNumberEl?.value || '',
    date: invoiceDateEl?.value || '',
    due: dueDateEl?.value || '',
    currency: currencyEl?.value || 'USD',
    client: {
      name: clientNameEl?.value || '',
      email: clientEmailEl?.value || '',
      phone: clientPhoneEl?.value || '',
      address: clientAddressEl?.value || '',
    },
    items,
    subtotal, tax, discount, shipping, total,
  };
}

// Initialize invoice section
if (itemsBody && addItemBtn) {
  // Start with one empty row
  addItemRow();
  addItemBtn.addEventListener('click', addItemRow);
}

[taxRateEl, discountEl, shippingEl, currencyEl].forEach((el) => {
  el?.addEventListener('input', recalc);
});

if (generateBtn) {
  generateBtn.addEventListener('click', () => {
    const profile = loadProfileFromStorage();
    const data = collectInvoiceData();
    const html = buildPrintableHTML(profile || {}, data);
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
    }
  });
}

if (invoiceForm && clearInvoiceBtn) {
  clearInvoiceBtn.addEventListener('click', () => {
    // Clear items
    itemsBody.innerHTML = '';
    addItemRow();
    recalc();
  });
}