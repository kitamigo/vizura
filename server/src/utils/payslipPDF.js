'use strict';

const PDFDocument = require('pdfkit');

// ===================== LAYOUT CONSTANTS ===================== //
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BORDER_COLOR = '#1A1A1A';
const BG_LIGHT = '#ffffff';
const TEXT_PRIMARY = '#1A1A1A';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const DIVIDER_COLOR = '#E5E5E5';
const TABLE_HEADER_BG = '#F5F5F5';
const ACCENT_PURPLE = '#6C5CE7'; // reserved for the VIZURA "Z" only — no other color used in the document
const SECTION_GAP = 16;

// ===================== HELPERS ===================== //
const roundCurrency = (amount) => Math.round(amount * 100) / 100;

const formatCurrency = (amount) => {
  const safeAmount = typeof amount === 'number' ? amount : 0;
  return '$' + safeAmount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateInput) => {
  const date = new Date(dateInput);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// ===================== PAGE BACKGROUND ===================== //
// Just a plain white fill — no outer card border.
const drawPageBackground = (doc) => {
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(BG_LIGHT);
};

// ===================== HEADER ===================== //
const drawHeader = (doc, business, period) => {
  const startX = MARGIN + 24;
  const startY = MARGIN + 24;
  const rightX = MARGIN + CONTENT_WIDTH - 24;
  const rightBlockWidth = 220;
  const rightBlockX = rightX - rightBlockWidth;

  // VIZURA wordmark //
  doc.fontSize(26).font('Helvetica-Bold').fillColor(TEXT_PRIMARY);
  doc.text('VI', startX, startY);
  const viWidth = doc.widthOfString('VI');
  doc.fillColor(ACCENT_PURPLE);
  doc.text('Z', startX + viWidth, startY);
  const zWidth = doc.widthOfString('Z');
  doc.fillColor(TEXT_PRIMARY);
  doc.text('URA', startX + viWidth + zWidth, startY);

  // Pay Advice heading //
  doc.fontSize(20).font('Helvetica-Bold').fillColor(TEXT_PRIMARY);
  doc.text('Pay Advice', rightBlockX, startY, { width: rightBlockWidth, align: 'right' });

  // Rule under Pay Advice //
  doc.strokeColor(DIVIDER_COLOR).lineWidth(1);
  doc.moveTo(rightBlockX, startY + 28).lineTo(rightX, startY + 28).stroke();

  // Pay Summary sub-heading //
  doc.fontSize(11).font('Helvetica').fillColor(TEXT_SECONDARY);
  doc.text('Pay Summary', rightBlockX, startY + 33, { width: rightBlockWidth, align: 'right' });

  // Divider under header //
  doc.strokeColor(DIVIDER_COLOR).lineWidth(1);
  doc.moveTo(startX, startY + 60).lineTo(rightX, startY + 60).stroke();

  return { headerBottom: startY + 68 };
};

// INFO BLOCK //
const drawInfoBlock = (doc, employee, business, period, engineOutput, leftX, rightX, startY) => {
  const fullName = `${employee.firstName || employee.first_name || ''} ${employee.lastName || employee.last_name || ''}`.trim();

  // Left: Employee info 
  doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_PRIMARY);
  doc.text(fullName || 'Employee Name', leftX, startY);
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_SECONDARY);
  if (employee.address) {
    const lines = employee.address.split('\\n');
    let y = startY + 16;
    for (const line of lines) {
      doc.text(line.trim(), leftX, y);
      y += 13;
    }
  }

  // Right: Pay details 
  const gridX = rightX - 260;
  const labelW = 80;
  const valW = 180;

  const items = [
    { label: 'Employer', value: business.businessName || business.business_name || '' },
    { label: 'Pay Date', value: formatDate(period.end) },
    { label: 'Pay Period', value: `${formatDate(period.start)} \u2013 ${formatDate(period.end)}` },
    { label: 'Net Payment', value: formatCurrency(engineOutput.netPay || engineOutput.grossPay), bold: true },
    { label: 'IRD Number', value: employee.irdNumber || employee.ird_number || '' },
    { label: 'Tax Code', value: employee.taxCode || employee.tax_code || 'M' },
  ];

  let y = startY;
  for (const item of items) {
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_SECONDARY);
    doc.text(item.label, gridX, y, { width: labelW, align: 'right' });
    doc.font(item.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(TEXT_PRIMARY);
    doc.text(item.value, gridX + labelW + 8, y, { width: valW });
    y += 15;
  }

  return Math.max(startY + 110, y);
};

// SAFE CELL DISPLAY //
const formatCell = (cellValue, col) => {
  if (cellValue === null || cellValue === undefined || cellValue === '') return '-';
  if (col.format === 'currency' && typeof cellValue === 'number') return formatCurrency(cellValue);
  if (col.format === 'number' && typeof cellValue === 'number') return cellValue.toFixed(2);
  if (col.format === 'hours' && typeof cellValue === 'number') return cellValue.toFixed(2) + ' hrs';
  return String(cellValue);
};

// TABLE GENERATOR //
const drawTable = (doc, leftX, topY, columns, rows, extra = {}) => {
  const {
    headerBg = TABLE_HEADER_BG,
    borderColor = DIVIDER_COLOR,
  } = extra;

  const tableWidth = CONTENT_WIDTH - 48;
  const x = leftX;

  // Computes column widths
  let totalW = 0;
  for (const col of columns) totalW += (col.weight || 1);
  const colPositions = [];
  let cx = x;
  for (const col of columns) {
    const cw = (tableWidth * (col.weight || 1)) / totalW;
    colPositions.push({ x: cx, width: cw });
    cx += cw;
  }

  const headerH = 20;
  const rowH = 20;

  // Draws header background (rounded top corners)
  doc.save();
  doc.fillColor(headerBg);
  doc.roundedRect(x, topY, tableWidth, headerH, 6);
  doc.fill();
  doc.restore();

  // Header text
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXT_PRIMARY);
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const pos = colPositions[i];
    const align = col.align || 'left';
    doc.text(col.label, pos.x + 8, topY + 5, { width: pos.width - 16, align });
  }

  let currentY = topY + headerH;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const isFooter = row._footer;

    if (isFooter) {
      doc.strokeColor(DIVIDER_COLOR).lineWidth(2);
      doc.moveTo(x, currentY).lineTo(x + tableWidth, currentY).stroke();
    }

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const pos = colPositions[i];
      const cellValue = row[col.key];
      const align = col.align || 'left';
      const display = formatCell(cellValue, col);

      doc.fillColor(TEXT_PRIMARY);
      doc.font(isFooter ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
      doc.text(display, pos.x + 8, currentY + 5, { width: pos.width - 16, align });
    }

    if (!isFooter && r < rows.length - 1) {
      doc.strokeColor(DIVIDER_COLOR).lineWidth(0.5);
      doc.moveTo(x + 8, currentY + rowH).lineTo(x + tableWidth - 8, currentY + rowH).stroke();
    }

    currentY += rowH;
  }

  // Outer border, rounded
  doc.save();
  doc.strokeColor(borderColor).lineWidth(1);
  doc.roundedRect(x, topY, tableWidth, currentY - topY, 6);
  doc.stroke();
  doc.restore();

  return currentY;
};

// EARNINGS TABLE //
const drawEarningsTable = (doc, employee, payPeriodInput, engineOutput, ytdEarnings, leftX, startY) => {
  const ytdGross = ytdEarnings?.gross || 0;
  const columns = [
    { key: 'label', label: 'Earning', weight: 3.5 },
    { key: 'unit', label: 'Unit', weight: 1.5, align: 'center' },
    { key: 'rate', label: 'Rate', weight: 1.5, align: 'right', format: 'currency' },
    { key: 'total', label: 'Total', weight: 1.5, align: 'right', format: 'currency' },
    { key: 'ytd', label: 'YTD', weight: 1.5, align: 'right', format: 'currency' },
  ];

  const rows = [];
  rows.push({
    label: 'Flat Rate Hourly (NZ)',
    unit: typeof payPeriodInput.regularHours === 'number' ? payPeriodInput.regularHours.toFixed(2) + ' hrs' : '-',
    rate: employee.hourlyRate,
    total: engineOutput.regPay,
    ytd: roundCurrency(ytdGross + engineOutput.regPay),
  });

  if (engineOutput.totalHolidayPay > 0) {
    rows.push({
      label: 'Stat Day Not Worked',
      unit: '-',
      rate: null,
      total: engineOutput.totalHolidayPay,
      ytd: roundCurrency(ytdGross + engineOutput.totalHolidayPay),
    });
  }

  if (engineOutput.leavePay > 0) {
    rows.push({
      label: 'Annual Holiday Allowance',
      unit: '-',
      rate: null,
      total: engineOutput.leavePay,
      ytd: roundCurrency(ytdGross + engineOutput.leavePay),
    });
  }

  if (engineOutput.holidayPayAddition > 0 && engineOutput.employmentType === 'casual') {
    rows.push({
      label: 'Holiday Pay (8%)',
      unit: '-',
      rate: null,
      total: engineOutput.holidayPayAddition,
      ytd: roundCurrency(ytdGross + engineOutput.holidayPayAddition),
    });
  }

  rows.push({
    _footer: true,
    label: 'Gross Earnings',
    unit: '',
    rate: null,
    total: engineOutput.grossPay,
    ytd: roundCurrency(ytdGross + engineOutput.grossPay),
  });

  return drawTable(doc, leftX, startY, columns, rows);
};

// DEDUCTIONS TABLE //
const drawDeductionsTable = (doc, engineOutput, ytdEarnings, leftX, startY) => {
  const ytdPAYE = ytdEarnings?.paye || 0;
  const ytdKS = ytdEarnings?.kiwisaver || 0;

  const columns = [
    { key: 'label', label: 'Deductions', weight: 5 },
    { key: 'amount', label: 'Amount', weight: 2.5, align: 'right', format: 'currency' },
    { key: 'ytd', label: 'YTD', weight: 2.5, align: 'right', format: 'currency' },
  ];

  const rows = [];

  if (engineOutput.kiwisaverEmployee > 0) {
    rows.push({
      label: 'KiwiSaver \u2013 Employee (post tax)',
      amount: engineOutput.kiwisaverEmployee,
      ytd: roundCurrency(ytdKS + engineOutput.kiwisaverEmployee),
    });
  }

  rows.push({
    label: 'Tax (PAYE)',
    amount: engineOutput.payeTax,
    ytd: roundCurrency(ytdPAYE + engineOutput.payeTax),
  });

  rows.push({
    _footer: true,
    label: 'Total Deductions',
    amount: -Math.abs(engineOutput.totalDeductions),
    ytd: roundCurrency(ytdPAYE + ytdKS + engineOutput.totalDeductions),
  });

  return drawTable(doc, leftX, startY, columns, rows);
};

//  SUMMARY BOX //
const drawSummaryBox = (doc, engineOutput, ytdEarnings, leftX, startY) => {
  const bw = CONTENT_WIDTH - 48;
  const x = leftX;
  const rh = 22;
  const innerWidth = bw - 32;

  // Outer container
  doc.save();
  doc.strokeColor(BORDER_COLOR).lineWidth(1);
  doc.roundedRect(x, startY, bw, rh * 3 + 6, 6);
  doc.stroke();
  doc.restore();

  // Row 1: Gross Earnings
  doc.font('Helvetica').fontSize(10).fillColor(TEXT_PRIMARY);
  doc.text('Gross Earnings', x + 16, startY + 5, { width: innerWidth / 2 });
  doc.text(formatCurrency(engineOutput.grossPay), x + 16, startY + 5, { width: innerWidth, align: 'right' });

  doc.strokeColor(DIVIDER_COLOR).lineWidth(0.5);
  doc.moveTo(x + 16, startY + rh).lineTo(x + bw - 16, startY + rh).stroke();

  // Row 2: Total Deductions
  doc.font('Helvetica').fontSize(10).fillColor(TEXT_PRIMARY);
  doc.text('Total Deductions', x + 16, startY + rh + 5, { width: innerWidth / 2 });
  doc.text('-' + formatCurrency(Math.abs(engineOutput.totalDeductions)), x + 16, startY + rh + 5, { width: innerWidth, align: 'right' });

  doc.strokeColor(DIVIDER_COLOR).lineWidth(0.5);
  doc.moveTo(x + 16, startY + rh * 2).lineTo(x + bw - 16, startY + rh * 2).stroke();

  // Row 3: Net Payment 
  const netY = startY + rh * 2;
  doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT_PRIMARY);
  doc.text('Net Payment', x + 16, netY + 6, { width: innerWidth / 2 });
  doc.text(formatCurrency(engineOutput.netPay || engineOutput.grossPay), x + 16, netY + 6, { width: innerWidth, align: 'right' });

  return netY + rh + 12;
};

// FOOTER //
const drawFooter = (doc, y) => {
  doc.fontSize(8).font('Helvetica').fillColor(TEXT_MUTED);
  doc.text(`Generated by Vizura on ${formatDate(new Date())}`, MARGIN + 24, y, {
    align: 'center',
    width: CONTENT_WIDTH - 48,
  });
};

// PDF GENERATOR //
const generatePayslipPDF = (payslipData, writableStream) => {
  const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
  doc.pipe(writableStream);

  const { business, employee, period, payPeriodInput, engineOutput, ytdEarnings } = payslipData;
  const ytd = ytdEarnings || { gross: 0, paye: 0, kiwisaver: 0 };

  drawPageBackground(doc);

  const cx = MARGIN + 24;
  const rx = MARGIN + CONTENT_WIDTH - 24;

  const { headerBottom } = drawHeader(doc, business, period);
  const infoBottom = drawInfoBlock(doc, employee, business, period, engineOutput, cx, rx, headerBottom);
  const earnBottom = drawEarningsTable(doc, employee, payPeriodInput, engineOutput, ytd, cx, infoBottom + SECTION_GAP);
  const dedBottom = drawDeductionsTable(doc, engineOutput, ytd, cx, earnBottom + SECTION_GAP);
  const sumBottom = drawSummaryBox(doc, engineOutput, ytd, cx, dedBottom + SECTION_GAP);

  drawFooter(doc, PAGE_HEIGHT - MARGIN - 20);

  doc.end();
};

module.exports = { generatePayslipPDF, formatCurrency, formatDate };