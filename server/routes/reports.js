/** (developed by @neelotpal.dey) **/
const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const supabaseDb = require('../services/supabaseDb');
const { authenticate } = require('../middleware/auth');
const portfolioRouter = require('./portfolio');

const router = express.Router();

const fmtINR = (n) => {
  if (n === undefined || n === null || isNaN(n)) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const fmtNum = (n, d = 0) => {
  if (n === undefined || n === null || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: d });
};

const fmtPct = (n) => {
  if (n === undefined || n === null || isNaN(n)) return '0.00%';
  const sign = n >= 0 ? '+' : '';
  return sign + Number(n).toFixed(2) + '%';
};

const canAccessUser = portfolioRouter.canAccessUser;

const drawPDFHeader = (doc, user) => {
  doc.setFillColor(11, 28, 59);
  doc.rect(0, 0, 612, 78, 'F');
  doc.fillColor(255, 255, 255);
  doc.fontSize(18);
  doc.font('Helvetica-Bold');
  doc.text('Genius Enterprises', 40, 36);
  doc.fontSize(10);
  doc.font('Helvetica');
  doc.text('Wealth Management & Investment Support', 40, 60);
  doc.fillColor(220, 220, 220);
  doc.text('Generated: ' + new Date().toLocaleString('en-IN'), 420, 60);

  doc.fillColor(11, 28, 59);
  doc.fontSize(15);
  doc.font('Helvetica-Bold');
  doc.text(`Portfolio Report - ${user.name}`, 40, 105);
  doc.fontSize(9);
  doc.font('Helvetica');
  doc.text(`Client ID: ${user.id}`, 40, 128);
  doc.text(`Email: ${user.email}`, 40, 142);
  doc.text(`Phone: ${user.phone || 'N/A'}`, 220, 128);
  doc.text(`PAN: ${user.pan || 'N/A'}`, 220, 142);
  doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, 420, 128);

  doc.strokeColor(209, 32, 32);
  doc.lineWidth(0.5);
  doc.moveTo(40, 158).lineTo(572, 158).stroke();
};

router.get('/portfolio/:userId.pdf', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const allowed = await canAccessUser(req.user, userId);
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const user = await supabaseDb.getUserById(userId);
    const portfolio = await supabaseDb.getPortfolio(userId);
    if (!user || !portfolio) return res.status(404).json({ error: 'Portfolio not found' });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const filename = `Portfolio_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);

    drawPDFHeader(doc, user);

    let y = 186;
    doc.fillColor(244, 246, 249);
    doc.rect(40, y, 532, 60, 'F');
    doc.fillColor(11, 28, 59);
    doc.rect(40, y, 130, 60, 'F');
    doc.rect(170, y, 130, 60, 'F');
    doc.rect(300, y, 130, 60, 'F');
    doc.rect(430, y, 142, 60, 'F');
    doc.fillColor(255, 255, 255);
    doc.fontSize(9);
    doc.font('Helvetica-Bold');
    doc.text('Total Invested', 48, y + 22);
    doc.text('Current Value', 178, y + 22);
    doc.text('Net Returns', 308, y + 22);
    doc.text('Return %', 438, y + 22);
    doc.fontSize(11);
    doc.text(fmtINR(portfolio.totalInvested), 48, y + 44);
    doc.text(fmtINR(portfolio.totalValue), 178, y + 44);
    const net = portfolio.totalValue - portfolio.totalInvested;
    doc.fillColor(net >= 0 ? 37 : 231, net >= 0 ? 211 : 76, net >= 0 ? 102 : 60);
    doc.text(fmtINR(net), 308, y + 44);
    doc.fillColor(portfolio.returnsPct >= 0 ? 37 : 231, portfolio.returnsPct >= 0 ? 211 : 76, portfolio.returnsPct >= 0 ? 102 : 60);
    doc.text(fmtPct(portfolio.returnsPct), 438, y + 44);

    y += 90;
    doc.fillColor(11, 28, 59);
    doc.fontSize(13);
    doc.font('Helvetica-Bold');
    doc.text('Asset Allocation', 40, y);
    y += 18;
    doc.strokeColor(230, 230, 230);
    doc.lineWidth(0.3);
    doc.moveTo(40, y).lineTo(572, y).stroke();
    y += 14;

    const colW = [195, 85, 85, 78, 89];
    const headers = ['Instrument', 'Invested', 'Current', 'Weight', 'Chg %'];
    doc.fillColor(20, 48, 92);
    doc.rect(40, y - 4, 532, 22, 'F');
    doc.fillColor(255, 255, 255);
    doc.fontSize(8);
    doc.font('Helvetica-Bold');
    let cx = 45;
    headers.forEach((h, i) => { doc.text(h, cx, y + 4); cx += colW[i]; });
    y += 26;
    doc.font('Helvetica');

    portfolio.holdings.forEach((h, idx) => {
      if (y > 780) { doc.addPage(); drawPDFHeader(doc, user); y = 180; }
      doc.fillColor(51, 51, 51);
      if (idx % 2 === 0) { doc.fillColor(250, 251, 252); doc.rect(40, y - 6, 532, 22, 'F'); }
      cx = 45;
      doc.fontSize(8);
      doc.fillColor(51, 51, 51);
      doc.text(h.name, cx, y + 2);
      cx += colW[0];
      doc.fillColor(11, 28, 59);
      doc.font('Helvetica-Bold');
      doc.text(fmtINR(h.invested), cx, y + 2); cx += colW[1];
      doc.text(fmtINR(h.value), cx, y + 2); cx += colW[2];
      doc.font('Helvetica');
      doc.fillColor(51, 51, 51);
      doc.text(h.pct.toFixed(2) + '%', cx, y + 2); cx += colW[3];
      doc.fillColor(h.change >= 0 ? 37 : 231, h.change >= 0 ? 211 : 76, h.change >= 0 ? 102 : 60);
      doc.text(fmtPct(h.change), cx, y + 2);
      doc.fillColor(51, 51, 51);
      y += 24;
    });

    y += 20;
    doc.fillColor(11, 28, 59);
    doc.fontSize(13);
    doc.font('Helvetica-Bold');
    doc.text('Recent Transactions', 40, y);
    y += 18;
    doc.strokeColor(230, 230, 230);
    doc.lineWidth(0.3);
    doc.moveTo(40, y).lineTo(572, y).stroke();
    y += 14;

    const txCols = [85, 70, 195, 80, 102];
    const txH = ['Date', 'Type', 'Scheme', 'Amount (₹)', 'Units/NAV'];
    doc.fillColor(20, 48, 92);
    doc.rect(40, y - 4, 532, 22, 'F');
    doc.fillColor(255, 255, 255);
    doc.fontSize(8);
    doc.font('Helvetica-Bold');
    cx = 45;
    txH.forEach((h, i) => { doc.text(h, cx, y + 4); cx += txCols[i]; });
    y += 26;
    doc.font('Helvetica');

    (portfolio.transactions || []).forEach((t, idx) => {
      if (y > 780) { doc.addPage(); drawPDFHeader(doc, user); y = 180; }
      if (idx % 2 === 0) { doc.fillColor(250, 251, 252); doc.rect(40, y - 6, 532, 22, 'F'); }
      cx = 45;
      doc.fillColor(51, 51, 51);
      doc.fontSize(7.5);
      doc.text(t.date, cx, y + 2); cx += txCols[0];
      doc.text(t.type, cx, y + 2); cx += txCols[1];
      doc.text(t.scheme, cx, y + 2); cx += txCols[2];
      doc.fillColor(t.amount >= 0 ? 37 : 231, t.amount >= 0 ? 211 : 76, t.amount >= 0 ? 102 : 60);
      doc.font('Helvetica-Bold');
      doc.text(fmtNum(t.amount, 0), cx, y + 2); cx += txCols[3];
      doc.fillColor(51, 51, 51);
      doc.font('Helvetica');
      doc.text(t.units ? `${t.units} / ${t.nav}` : '-', cx, y + 2);
      y += 24;
    });

    const endY = doc.page.height - 35;
    doc.fontSize(8);
    doc.fillColor(150, 150, 150);
    doc.text('This is a system-generated report from Genius Enterprises Client Portal.', 40, endY);
    doc.text('Confidential - For client use only', 420, endY);

    doc.end();
  } catch (err) {
    next(err);
  }
});

router.get('/portfolio/:userId.xlsx', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const allowed = await canAccessUser(req.user, userId);
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const user = await supabaseDb.getUserById(userId);
    const portfolio = await supabaseDb.getPortfolio(userId);
    if (!user || !portfolio) return res.status(404).json({ error: 'Portfolio not found' });

    const filename = `Portfolio_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const wb = new ExcelJS.Workbook();

    const ws1 = wb.addWorksheet('Summary');
    ws1.columns = [{ width: 22 }, { width: 28 }];
    ws1.addRow(['Genius Enterprises - Portfolio Statement']);
    ws1.addRow([]);
    ws1.addRow(['Client Details']);
    ws1.addRow(['Name', user.name]);
    ws1.addRow(['Email', user.email]);
    ws1.addRow(['Phone', user.phone || 'N/A']);
    ws1.addRow(['Client ID', user.id]);
    ws1.addRow(['PAN', user.pan || 'N/A']);
    ws1.addRow(['DOB', user.dob || 'N/A']);
    ws1.addRow(['Report Date', new Date().toLocaleDateString('en-IN')]);
    ws1.addRow([]);
    ws1.addRow(['Summary']);
    ws1.addRow(['Total Invested', portfolio.totalInvested]);
    ws1.addRow(['Current Value', portfolio.totalValue]);
    ws1.addRow(['Net Returns', portfolio.totalValue - portfolio.totalInvested]);
    ws1.addRow(['Return %', portfolio.returnsPct]);

    const ws2 = wb.addWorksheet('Holdings');
    ws2.columns = [{ width: 28 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 10 }, { width: 10 }];
    ws2.addRow(['Holdings Breakdown']);
    ws2.addRow([]);
    ws2.addRow(['Instrument', 'Code', 'Invested', 'Current Value', 'Weight %', 'Change %']);
    portfolio.holdings.forEach(h => {
      ws2.addRow([h.name, h.code, h.invested, h.value, h.pct, h.change]);
    });

    const ws3 = wb.addWorksheet('Transactions');
    ws3.columns = [{ width: 14 }, { width: 16 }, { width: 32 }, { width: 14 }, { width: 12 }, { width: 12 }];
    ws3.addRow(['Transactions']);
    ws3.addRow([]);
    ws3.addRow(['Date', 'Type', 'Scheme', 'Amount', 'Units', 'NAV']);
    (portfolio.transactions || []).forEach(t => {
      ws3.addRow([t.date, t.type, t.scheme, t.amount, t.units, t.nav]);
    });

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
