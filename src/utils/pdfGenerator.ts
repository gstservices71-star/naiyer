import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialReportData, FinancialYear, ReportType, FY_MONTHS } from '../types';

// Format Indian Currency Number for PDF rendering
export const formatINRNumber = (val: number): string => {
  const num = Number(val) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `Rs. ${formatted}`;
};

export const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
};

/**
 * Generates a professional, multi-page client financial turnover PDF report
 */
export const generateClientReportPDF = (
  data: FinancialReportData,
  reportType: ReportType = 'combined',
  companyName: string = 'TaxPro GST Consultancy & Services'
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Color Palette
  const primaryColor: [number, number, number] = [30, 58, 138]; // Deep Navy
  const secondaryColor: [number, number, number] = [71, 85, 105]; // Slate
  const headerBg: [number, number, number] = [241, 245, 249]; // Slate 100
  const accentColor: [number, number, number] = [13, 148, 136]; // Teal

  let currentY = 14;

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(14, currentY, pageWidth - 28, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(companyName.toUpperCase(), pageWidth / 2, currentY + 8, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const reportSubtitle =
    reportType === 'gst'
      ? 'GST MONTHLY TURNOVER COMPLIANCE REPORT'
      : reportType === 'bank'
      ? 'ANNUAL BANK TURNOVER STATEMENT REPORT (5 ACCOUNTS)'
      : 'CLIENT FINANCIAL TURNOVER COMPLIANCE REPORT (GST & BANK)';
  doc.text(reportSubtitle, pageWidth / 2, currentY + 15, { align: 'center' });

  currentY += 26;

  // Client Info Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Client Name: ${data.client.firm_name}`, 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Proprietor / Contact: ${data.client.client_name || 'N/A'}`, 18, currentY + 13);
  doc.text(`GSTIN: ${data.client.gstin || 'Not Registered / Pending'}`, 18, currentY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Financial Year: FY ${data.financialYear.display_name}`, pageWidth - 18, currentY + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`GST Scheme: ${data.client.gst_type?.toUpperCase() || 'REGULAR'}`, pageWidth - 18, currentY + 13, { align: 'right' });
  doc.text(`Generated Date: ${today}`, pageWidth - 18, currentY + 19, { align: 'right' });

  currentY += 30;

  // Section 1: GST Monthly Turnover Table (if combined or gst)
  if (reportType === 'combined' || reportType === 'gst') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text('1. GST MONTHLY TURNOVER (TAXABLE & EXEMPT)', 14, currentY);
    currentY += 4;

    const gstBody = data.gstRows.map((row) => [
      row.month,
      formatINRNumber(row.taxable),
      formatINRNumber(row.exempt),
      formatINRNumber(row.total),
    ]);

    // Add Totals row
    gstBody.push([
      'TOTAL (FY ' + data.financialYear.display_name + ')',
      formatINRNumber(data.gstTotals.taxable),
      formatINRNumber(data.gstTotals.exempt),
      formatINRNumber(data.gstTotals.total),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Month', 'Taxable Turnover', 'Exempt Turnover', 'Total GST Turnover']],
      body: gstBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 35 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (hookData) => {
        if (hookData.row.index === gstBody.length - 1) {
          hookData.cell.styles.fillColor = [224, 242, 254];
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.textColor = [3, 105, 161];
        }
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Section 2: Bank Turnover (Up to 5 Accounts)
  if (reportType === 'combined' || reportType === 'bank') {
    // Check if space is low on first page, add new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text('2. BANK TURNOVER (UP TO 5 ACCOUNTS)', 14, currentY);
    currentY += 4;

    const configuredAccounts = data.bankAccounts.filter((b) => b.account !== null);

    if (configuredAccounts.length === 0) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'FD');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('No bank accounts configured for this client. Turnover recorded as ₹ 0.00 / Not Available.', pageWidth / 2, currentY + 8, {
        align: 'center',
      });
      currentY += 20;
    } else {
      // Build combined monthly bank turnover table across all 5 slots
      const tableHead = ['Month'];
      data.bankAccounts.forEach((slot) => {
        const title = slot.account
          ? `Slot ${slot.slotNumber}: ${slot.account.bank_name}\n(..${slot.account.account_number.slice(-4)})`
          : `Slot ${slot.slotNumber}\n[Not Configured]`;
        tableHead.push(title);
      });
      tableHead.push('Monthly Total');

      const bankBody: string[][] = FY_MONTHS.map((m) => {
        const row: string[] = [m];
        let rowSum = 0;
        data.bankAccounts.forEach((slot) => {
          const amt = slot.monthlyTurnover[m] || 0;
          row.push(slot.account ? formatINRNumber(amt) : '-');
          if (slot.account) rowSum += amt;
        });
        row.push(formatINRNumber(rowSum));
        return row;
      });

      // Total Row
      const totalRow: string[] = ['TOTAL'];
      data.bankAccounts.forEach((slot) => {
        totalRow.push(slot.account ? formatINRNumber(slot.total) : '-');
      });
      totalRow.push(formatINRNumber(data.totalBankTurnover));
      bankBody.push(totalRow);

      autoTable(doc, {
        startY: currentY,
        head: [tableHead],
        body: bankBody,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center',
        },
        styles: {
          fontSize: 6.8,
          cellPadding: 1.6,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 20 },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
        },
        didParseCell: (hookData) => {
          if (hookData.row.index === bankBody.length - 1) {
            hookData.cell.styles.fillColor = [240, 253, 244];
            hookData.cell.styles.fontStyle = 'bold';
            hookData.cell.styles.textColor = [22, 101, 52];
          }
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Section 3: Final Financial Summary Card
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('3. COMPLIANCE & FINANCIAL TURNOVER SUMMARY', 14, currentY);
  currentY += 4;

  // 2-Column Summary Box
  const boxWidth = (pageWidth - 32) / 2;
  const boxHeight = 44;

  // Box 1: GST Summary
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(14, currentY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(3, 105, 161);
  doc.text('GST ANNUAL REVENUE SUMMARY', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Taxable Turnover:', 18, currentY + 16);
  doc.text(formatINRNumber(data.gstTotals.taxable), 14 + boxWidth - 4, currentY + 16, { align: 'right' });

  doc.text('Total Exempt Turnover:', 18, currentY + 24);
  doc.text(formatINRNumber(data.gstTotals.exempt), 14 + boxWidth - 4, currentY + 24, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(18, currentY + 28, 14 + boxWidth - 4, currentY + 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL GST TURNOVER:', 18, currentY + 36);
  doc.setTextColor(3, 105, 161);
  doc.text(formatINRNumber(data.gstTotals.total), 14 + boxWidth - 4, currentY + 36, { align: 'right' });

  // Box 2: Bank Summary
  const box2X = 14 + boxWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text('BANKING DEPOSITS & TURNOVER', box2X + 4, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  let subY = currentY + 14;
  data.bankAccounts.slice(0, 3).forEach((slot) => {
    if (slot.account) {
      doc.text(`Slot ${slot.slotNumber} (${slot.account.bank_name}):`, box2X + 4, subY);
      doc.text(formatINRNumber(slot.total), box2X + boxWidth - 4, subY, { align: 'right' });
      subY += 6;
    }
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(box2X + 4, currentY + 28, box2X + boxWidth - 4, currentY + 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL BANK TURNOVER:', box2X + 4, currentY + 36);
  doc.setTextColor(22, 101, 52);
  doc.text(formatINRNumber(data.totalBankTurnover), box2X + boxWidth - 4, currentY + 36, { align: 'right' });

  // Footer on all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.text(`${companyName} • Confidential Client Compliance Report • Generated on ${today}`, 14, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  // Download PDF
  const safeName = sanitizeFileName(data.client.firm_name || 'Client');
  const fileName = `${safeName}_FY_${data.financialYear.display_name}_Turnover_Report.pdf`;
  doc.save(fileName);
};

/**
 * Generates a combined bulk PDF report for All Clients in selected FY
 */
export const generateAllClientsReportPDF = (
  allReports: FinancialReportData[],
  fy: FinancialYear,
  reportType: ReportType = 'combined',
  companyName: string = 'TaxPro GST Consultancy & Services'
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const primaryColor: [number, number, number] = [30, 58, 138];

  // Cover / Header Banner on First Page
  let currentY = 14;

  doc.setFillColor(...primaryColor);
  doc.rect(14, currentY, pageWidth - 28, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(companyName.toUpperCase(), pageWidth / 2, currentY + 8, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `ALL CLIENTS CONSOLIDATED FINANCIAL REPORT • FY ${fy.display_name}`,
    pageWidth / 2,
    currentY + 16,
    { align: 'center' }
  );

  currentY += 28;

  // Master Summary Box
  const totalClients = allReports.length;
  const grandTaxable = allReports.reduce((sum, r) => sum + r.gstTotals.taxable, 0);
  const grandExempt = allReports.reduce((sum, r) => sum + r.gstTotals.exempt, 0);
  const grandGst = allReports.reduce((sum, r) => sum + r.gstTotals.total, 0);
  const grandBank = allReports.reduce((sum, r) => sum + r.totalBankTurnover, 0);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`PORTFOLIO SUMMARY: ${totalClients} ACTIVE CLIENTS`, 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total GST Turnover: ${formatINRNumber(grandGst)}`, 18, currentY + 15);
  doc.text(`Total Bank Turnover: ${formatINRNumber(grandBank)}`, pageWidth / 2, currentY + 15);
  doc.text(`Generated Date: ${today}`, pageWidth - 18, currentY + 15, { align: 'right' });

  currentY += 28;

  // Table of all clients executive summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text('EXECUTIVE CLIENT-WISE FINANCIAL COMPARISON', 14, currentY);
  currentY += 4;

  const summaryHead = ['#', 'Client Name', 'GSTIN', 'GST Taxable', 'GST Exempt', 'Total GST', 'Total Bank'];
  const summaryBody = allReports.map((r, i) => [
    i + 1,
    r.client.firm_name,
    r.client.gstin,
    formatINRNumber(r.gstTotals.taxable),
    formatINRNumber(r.gstTotals.exempt),
    formatINRNumber(r.gstTotals.total),
    formatINRNumber(r.totalBankTurnover),
  ]);

  // Add Grand Totals
  summaryBody.push([
    '',
    'GRAND TOTAL',
    '',
    formatINRNumber(grandTaxable),
    formatINRNumber(grandExempt),
    formatINRNumber(grandGst),
    formatINRNumber(grandBank),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [summaryHead],
    body: summaryBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 40 },
      2: { halign: 'left', cellWidth: 28 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (hookData) => {
      if (hookData.row.index === summaryBody.length - 1) {
        hookData.cell.styles.fillColor = [224, 242, 254];
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.textColor = [3, 105, 161];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // For each client, generate their detailed section
  allReports.forEach((data, index) => {
    doc.addPage();
    let clientY = 14;

    // Mini Client Header
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, clientY, pageWidth - 28, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(`CLIENT #${index + 1}: ${data.client.firm_name}`, 18, clientY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`GSTIN: ${data.client.gstin} | FY: ${data.financialYear.display_name}`, 18, clientY + 13);
    doc.text(
      `GST Total: ${formatINRNumber(data.gstTotals.total)} | Bank Total: ${formatINRNumber(data.totalBankTurnover)}`,
      pageWidth - 18,
      clientY + 13,
      { align: 'right' }
    );

    clientY += 23;

    // GST Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('GST Monthly Turnover (Taxable & Exempt)', 14, clientY);
    clientY += 3;

    const gstBody = data.gstRows.map((row) => [
      row.month,
      formatINRNumber(row.taxable),
      formatINRNumber(row.exempt),
      formatINRNumber(row.total),
    ]);

    gstBody.push([
      'TOTAL',
      formatINRNumber(data.gstTotals.taxable),
      formatINRNumber(data.gstTotals.exempt),
      formatINRNumber(data.gstTotals.total),
    ]);

    autoTable(doc, {
      startY: clientY,
      head: [['Month', 'Taxable Turnover', 'Exempt Turnover', 'Total GST Turnover']],
      body: gstBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    clientY = (doc as any).lastAutoTable.finalY + 8;

    // Bank Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Bank Turnover (5 Accounts)', 14, clientY);
    clientY += 3;

    const tableHead = ['Month'];
    data.bankAccounts.forEach((slot) => {
      const title = slot.account
        ? `Slot ${slot.slotNumber}: ${slot.account.bank_name.slice(0, 10)}`
        : `Slot ${slot.slotNumber}`;
      tableHead.push(title);
    });
    tableHead.push('Monthly Total');

    const bankBody: string[][] = FY_MONTHS.map((m) => {
      const row: string[] = [m];
      let rowSum = 0;
      data.bankAccounts.forEach((slot) => {
        const amt = slot.monthlyTurnover[m] || 0;
        row.push(slot.account ? formatINRNumber(amt) : '-');
        if (slot.account) rowSum += amt;
      });
      row.push(formatINRNumber(rowSum));
      return row;
    });

    const totalRow: string[] = ['TOTAL'];
    data.bankAccounts.forEach((slot) => {
      totalRow.push(slot.account ? formatINRNumber(slot.total) : '-');
    });
    totalRow.push(formatINRNumber(data.totalBankTurnover));
    bankBody.push(totalRow);

    autoTable(doc, {
      startY: clientY,
      head: [tableHead],
      body: bankBody,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 6.5,
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.4,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 18 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
      },
      margin: { left: 14, right: 14 },
    });
  });

  // Footer on all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.text(`${companyName} • Consolidated Financial Report FY ${fy.display_name}`, 14, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  const fileName = `All_Clients_FY_${fy.display_name}_Turnover_Report.pdf`;
  doc.save(fileName);
};
