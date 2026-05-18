// services/pdfService.js
// PDF generation service for EARA CONNECT Project
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AuthService from './authService';
import EaracgPickedLogo from '../assets/earacg-faceted-peak.svg';

class PDFService {

  // ============== UTILITY HELPERS ==============

  static getCurrentUserName() {
    const user = AuthService.getCurrentUser();
    return user?.name || 'Unknown User';
  }

  static fmtDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  static fmtDateTime(dateString) {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // ============== COMMON PDF BUILDING BLOCKS ==============

  static pickedLogoImage = null;

  static getPickedLogoImage() {
    if (typeof window === 'undefined' || typeof Image === 'undefined') return null;

    if (!this.pickedLogoImage) {
      const img = new Image();
      img.src = EaracgPickedLogo;
      this.pickedLogoImage = img;
    }

    return this.pickedLogoImage;
  }

  static drawPickedLogo(doc, x, y, width = 40, height = 28) {
    const logo = this.getPickedLogoImage();
    // Try image first; if unavailable or unsupported, draw vector fallback.
    if (logo && logo.complete) {
      try {
        // Imported logo is SVG; PNG works better with jsPDF addImage pipeline.
        doc.addImage(logo, 'PNG', x, y, width, height);
        return;
      } catch (error) {
        // Fall through to deterministic vector fallback.
      }
    }

    this.drawPickedLogoFallback(doc, x, y, width, height);
  }

  static drawPickedLogoFallback(doc, x, y, width = 40, height = 28) {
    // Compact faceted-peak fallback that remains legible at small PDF header size.
    const px = (v) => x + (v * width);
    const py = (v) => y + (v * height);

    // White badge background so logo stays visible on any page theme.
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, width, height, 1.6, 1.6, 'F');

    // Faceted crown (left-to-right green/blue geometry)
    doc.setFillColor(0, 104, 78);
    doc.triangle(px(0.08), py(0.72), px(0.24), py(0.72), px(0.18), py(0.44), 'F');

    doc.setFillColor(20, 160, 84);
    doc.triangle(px(0.24), py(0.72), px(0.40), py(0.72), px(0.30), py(0.34), 'F');

    doc.setFillColor(52, 199, 126);
    doc.triangle(px(0.40), py(0.72), px(0.56), py(0.72), px(0.48), py(0.24), 'F');

    doc.setFillColor(90, 214, 168);
    doc.triangle(px(0.56), py(0.72), px(0.68), py(0.72), px(0.62), py(0.40), 'F');

    doc.setFillColor(43, 127, 222);
    doc.triangle(px(0.48), py(0.24), px(0.68), py(0.72), px(0.82), py(0.72), 'F');

    doc.setFillColor(30, 90, 184);
    doc.triangle(px(0.68), py(0.72), px(0.82), py(0.72), px(0.74), py(0.44), 'F');

    doc.setFillColor(22, 67, 120);
    doc.triangle(px(0.82), py(0.72), px(0.92), py(0.72), px(0.86), py(0.50), 'F');

    // EARACG text mark
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.7);
    doc.setTextColor(14, 31, 61);
    doc.text('EARACG', px(0.50), py(0.92), { align: 'center' });

    doc.setTextColor(0, 0, 0);
  }

  /**
   * Add EARACG branded header to every PDF.
   * Includes company name (EARACG), system name (EARA Connect), logo area, report title.
   * Returns Y position below the header.
   */
  static addHeader(doc, reportTitle, periodText = '') {
    const pw = doc.internal.pageSize.getWidth();

    // Left logo uses the official selected EARACG logo.
    this.drawPickedLogo(doc, 14, 9, 40, 28);

    // Heading format aligned to transcript-style information block.
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 67, 120);
    doc.text('East African Revenue Authorities Commissioner General', 64, 15);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 22, 22);
    doc.text(reportTitle.toUpperCase(), pw / 2, 34, { align: 'center' });

    // ---- Period + Generated date subtitle ----
    const now = new Date();
    const genStr = `Generated: ${this.fmtDateTime(now.toISOString())}`;
    const subtitle = periodText ? `${periodText}  •  ${genStr}` : genStr;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pw / 2, 41, { align: 'center' });

    // ---- Separator line ----
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.8);
    doc.line(14, 45, pw - 14, 45);

    doc.setTextColor(0, 0, 0);
    return 50;
  }

  /**
   * Add "Prepared by / Approved by" signature block at the bottom.
   */
  static addSignatureBlock(doc, y) {
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    // Ensure there is space for signature block (need ~45px)
    if (y > ph - 65) {
      doc.addPage();
      y = 30;
    }

    y += 10;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, y, pw - 14, y);
    y += 12;

    const preparedBy = this.getCurrentUserName();
    const dateStr = this.fmtDate(new Date().toISOString());

    // Left column: Prepared by
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text('Prepared by', 14, y);
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text(preparedBy, 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${dateStr}`, 14, y);

    // Right column: Approved by (blank for manual signature)
    const rightX = pw / 2 + 10;
    let ry = y - 11;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text('Approved by', rightX, ry);
    ry += 8;
    doc.setDrawColor(33, 33, 33);
    doc.setLineWidth(0.4);
    doc.line(rightX, ry, rightX + 70, ry);
    ry += 8;
    doc.setFontSize(9);
    doc.text('Date: ___________', rightX, ry);

    doc.setTextColor(0, 0, 0);
    return y + 10;
  }

  /**
   * Add page footer to every page in the doc.
   */
  static addFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('EARACG — EARA Connect System  •  East African Revenue Authorities', pw / 2, ph - 8, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, pw - 14, ph - 8, { align: 'right' });
    }
  }

  // ============== ADMIN: USER MANAGEMENT REPORT ==============

  /**
   * Admin report: list of all users with role, country, subcommittee, status.
   * @param {Array} users - User objects
   * @param {string} fromDate - Period start (ISO or readable)
   * @param {string} toDate   - Period end
   * @param {string} reportType - "All Users", "Active Users", etc.
   */
  static generateUserReport(users, fromDate, toDate, reportType = 'All Users Report') {
    const doc = new jsPDF();
    const period = `Period: ${this.fmtDate(fromDate)} to ${this.fmtDate(toDate)}`;

    let y = this.addHeader(doc, reportType, period);

    const head = [['SN', 'Name', 'Email', 'Role', 'Country', 'Subcommittee', 'Status']];
    const body = users.map((u, i) => [
      i + 1,
      u.name || 'N/A',
      u.email || 'N/A',
      (u.role || '').replace(/_/g, ' '),
      u.country?.name || '-',
      u.subcommittee?.name || '-',
      u.active !== false ? 'Active' : 'Inactive',
    ]);

    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
      margin: { left: 14, right: 14, bottom: 30 },
    });

    y = doc.lastAutoTable.finalY;
    this.addSignatureBlock(doc, y);
    this.addFooter(doc);
    doc.save(`EARA_${reportType.replace(/\s+/g, '_')}_${this.fmtDate(new Date().toISOString())}.pdf`);
  }

  // ============== REPORTS: PROGRESS REPORTS ==============

  /**
   * Single report PDF with all details.
   */
  static generateReportPDF(report) {
    const doc = new jsPDF();
    const resTitle = report.resolution?.title || 'Progress Report';
    const submittedDate = report.submittedAt ? this.fmtDate(report.submittedAt) : 'N/A';

    let y = this.addHeader(doc, 'Progress Report', `Resolution: ${resTitle}`);

    // Details table
    const details = [
      ['Report ID', `${report.id || 'N/A'}`],
      ['Resolution', resTitle],
      ['Subcommittee', report.subcommittee?.name || 'N/A'],
      ['Submitted By', report.submittedBy?.name || 'N/A'],
      ['Submitted Date', submittedDate],
      ['Status', (report.status || 'N/A').replace(/_/g, ' ')],
      ['Performance', `${report.performancePercentage || 0}%`],
    ];

    autoTable(doc, {
      startY: y,
      head: [['Field', 'Details']],
      body: details,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10, cellPadding: 4 },
    });
    y = doc.lastAutoTable.finalY + 10;

    // Progress Details section
    if (report.progressDetails) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Progress Details', 14, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(report.progressDetails, 180);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 8;
    }

    // Hindrances
    if (report.hindrances) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Challenges & Hindrances', 14, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(report.hindrances, 180);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 8;
    }

    // HOD Review
    if (report.hodComments) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('HOD Review', 14, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        body: [
          ['Reviewed By', report.reviewedByHod?.name || 'N/A'],
          ['Review Date', this.fmtDateTime(report.hodReviewedAt)],
          ['Comments', report.hodComments],
        ],
        theme: 'grid',
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 10, cellPadding: 4 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Commissioner Review
    if (report.commissionerComments) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Commissioner General Review', 14, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        body: [
          ['Review Date', this.fmtDateTime(report.commissionerReviewedAt)],
          ['Comments', report.commissionerComments],
        ],
        theme: 'grid',
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 10, cellPadding: 4 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    this.addSignatureBlock(doc, y);
    this.addFooter(doc);
    const safeName = resTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
    doc.save(`EARA_Report_${report.id || 'unknown'}_${safeName}.pdf`);
  }

  // ============== REPORTS LIST PDF (filtered by date / type) ==============

  /**
   * Generate a PDF with a table of multiple reports.
   * Used on Commissioner / HOD dashboards.
   */
  static generateReportsListPDF(reports, fromDate, toDate, reportType = 'All Reports') {
    const doc = new jsPDF('l');
    const period = `Period: ${this.fmtDate(fromDate)} to ${this.fmtDate(toDate)}`;

    let y = this.addHeader(doc, reportType, period);

    const head = [['SN', 'Resolution', 'Subcommittee', 'Submitted By', 'Date', 'Performance', 'Status', 'Review Action']];
    const body = reports.map((r, i) => {
      let action = 'Pending';
      if (r.status === 'APPROVED_BY_COMMISSIONER') action = 'Approved by CG';
      else if (r.status === 'REJECTED_BY_COMMISSIONER') action = 'Rejected by CG';
      else if (r.status === 'APPROVED_BY_HOD') action = 'Approved by HOD';
      else if (r.status === 'REJECTED_BY_HOD') action = 'Rejected by HOD';

      return [
        i + 1,
        r.resolution?.title || 'N/A',
        r.subcommittee?.name || 'N/A',
        r.submittedBy?.name || 'N/A',
        this.fmtDate(r.submittedAt),
        `${r.performancePercentage || 0}%`,
        (r.status || '').replace(/_/g, ' '),
        action,
      ];
    });

    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
      margin: { left: 14, right: 14, bottom: 30 },
    });

    y = doc.lastAutoTable.finalY;
    this.addSignatureBlock(doc, y);
    this.addFooter(doc);
    doc.save(`EARA_${reportType.replace(/\s+/g, '_')}_${this.fmtDate(new Date().toISOString())}.pdf`);
  }

  // ============== ANALYTICS / PERFORMANCE PDF ==============

  /**
   * System analytics PDF for performance dashboards.
   */
  static generateAnalyticsPDF(dashboardData, selectedYear, allReports = []) {
    const doc = new jsPDF('l');
    const period = `Year: ${selectedYear}`;

    let y = this.addHeader(doc, 'System Performance Analytics Report', period);

    // 1. Overview summary
    const ov = dashboardData.monthlyOverview || {};
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Reports', `${ov.totalReports || 0}`],
        ['Total Reviews', `${ov.totalReviews || 0}`],
        ['Approval Rate', `${ov.approvalRate || 0}%`],
        ['Total Resolutions', `${ov.totalResolutions || 0}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10, cellPadding: 4 },
    });
    y = doc.lastAutoTable.finalY + 12;

    // 2. Subcommittee performance
    const subs = dashboardData.subcommittees || [];
    if (subs.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('Subcommittee Performance', 14, y);
      doc.setTextColor(0, 0, 0);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['SN', 'Subcommittee', 'Reports', 'Resolutions', 'Approval %', 'Performance %', 'Task Assign %', 'Trend']],
        body: subs.map((s, i) => [
          i + 1, s.name || 'N/A', s.reports || 0, s.assignedResolutions || 0,
          `${s.approvalRate || 0}%`, `${s.performancePercentage || 0}%`,
          `${s.taskAssignmentPercentage || 0}%`, s.trend || 'stable',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // 3. Report review analytics
    if (allReports.length > 0) {
      if (y > 140) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('Report Review Details', 14, y);
      doc.setTextColor(0, 0, 0);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['SN', 'Resolution', 'Subcommittee', 'Submitted By', 'Date', 'Perf %', 'Status', 'Review Action']],
        body: allReports.map((r, i) => {
          let action = 'Pending';
          if (r.status === 'APPROVED_BY_COMMISSIONER') action = 'Approved by CG';
          else if (r.status === 'REJECTED_BY_COMMISSIONER') action = 'Rejected by CG';
          else if (r.status === 'APPROVED_BY_HOD') action = 'Approved by HOD';
          else if (r.status === 'REJECTED_BY_HOD') action = 'Rejected by HOD';
          return [
            i + 1, r.resolution?.title || 'N/A', r.subcommittee?.name || 'N/A',
            r.submittedBy?.name || 'N/A', this.fmtDate(r.submittedAt),
            `${r.performancePercentage || 0}%`,
            (r.status || '').replace(/_/g, ' '), action,
          ];
        }),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2.5 },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
        margin: { left: 14, right: 14, bottom: 30 },
      });
      y = doc.lastAutoTable.finalY;
    }

    this.addSignatureBlock(doc, y);
    this.addFooter(doc);
    doc.save(`EARA_Analytics_Report_${selectedYear}.pdf`);
  }

  // ============== COMMISSIONER REPORT PDF (alias) ==============

  static generateCommissionerReportPDF(report) {
    this.generateReportPDF(report);
  }

  // ============== MEETINGS REPORT ==============

  static generateMeetingsReport(meetings, fromDate, toDate) {
    const doc = new jsPDF('l');
    const period = `Period: ${this.fmtDate(fromDate)} to ${this.fmtDate(toDate)}`;
    let y = this.addHeader(doc, 'Meetings Report', period);

    autoTable(doc, {
      startY: y,
      head: [['SN', 'Meeting Title', 'Type', 'Date', 'Location', 'Status']],
      body: meetings.map((m, i) => [
        i + 1,
        m.title || m.name || 'N/A',
        (m.type || m.meetingType || '').replace(/_/g, ' '),
        this.fmtDate(m.meetingDate || m.date),
        m.location || m.venue || 'N/A',
        m.status || 'N/A',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
      margin: { left: 14, right: 14, bottom: 30 },
    });

    this.addSignatureBlock(doc, doc.lastAutoTable.finalY);
    this.addFooter(doc);
    doc.save(`EARA_Meetings_Report_${this.fmtDate(new Date().toISOString())}.pdf`);
  }

  // ============== RESOLUTIONS REPORT ==============

  static generateResolutionsReport(resolutions, fromDate, toDate) {
    const doc = new jsPDF('l');
    const period = `Period: ${this.fmtDate(fromDate)} to ${this.fmtDate(toDate)}`;
    let y = this.addHeader(doc, 'Resolutions Report', period);

    autoTable(doc, {
      startY: y,
      head: [['SN', 'Title', 'Meeting', 'Subcommittee', 'Status', 'Created Date']],
      body: resolutions.map((r, i) => [
        i + 1,
        r.title || 'N/A',
        r.meeting?.title || r.meetingTitle || 'N/A',
        r.subcommittee?.name || r.subcommitteeName || 'N/A',
        (r.status || '').replace(/_/g, ' '),
        this.fmtDate(r.createdAt),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
      margin: { left: 14, right: 14, bottom: 30 },
    });

    this.addSignatureBlock(doc, doc.lastAutoTable.finalY);
    this.addFooter(doc);
    doc.save(`EARA_Resolutions_Report_${this.fmtDate(new Date().toISOString())}.pdf`);
  }

  // ============== COMPREHENSIVE SYSTEM ACTIVITIES REPORT ==============

  /**
   * Generate a comprehensive report including:
   * - Meetings created
   * - Attendance records
   * - Countries that attended each meeting
   * - Report summaries
   * All with EARACG branded header.
   */
  static generateComprehensiveReport({ meetings = [], attendance = [], reports = [], fromDate, toDate }) {
    const doc = new jsPDF('l');
    const period = fromDate && toDate
      ? `Period: ${this.fmtDate(fromDate)} to ${this.fmtDate(toDate)}`
      : '';

    let y = this.addHeader(doc, 'Comprehensive System Activities Report', period);

    // 1. Executive Summary
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('Executive Summary', 14, y);
    doc.setTextColor(0, 0, 0);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Count']],
      body: [
        ['Total Meetings', `${meetings.length}`],
        ['Total Attendance Records', `${attendance.length}`],
        ['Total Reports Submitted', `${reports.length}`],
        ['Reports Approved (HOD)', `${reports.filter(r => r.status === 'APPROVED_BY_HOD' || r.status === 'APPROVED_BY_COMMISSIONER').length}`],
        ['Reports Pending', `${reports.filter(r => r.status === 'SUBMITTED').length}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10, cellPadding: 4 },
    });
    y = doc.lastAutoTable.finalY + 12;

    // 2. Meetings Created
    if (meetings.length > 0) {
      if (y > 140) { doc.addPage(); y = 30; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('Meetings Created', 14, y);
      doc.setTextColor(0, 0, 0);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['SN', 'Meeting Title', 'Type', 'Date', 'Location', 'Host Country', 'Status']],
        body: meetings.map((m, i) => [
          i + 1,
          m.title || 'N/A',
          (m.meetingType || m.type || '').replace(/_/g, ' '),
          this.fmtDate(m.meetingDate || m.date),
          m.location || 'N/A',
          m.hostingCountry?.name || 'N/A',
          m.status || 'N/A',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2.5 },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
        margin: { left: 14, right: 14, bottom: 30 },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // 3. Attendance Records per Meeting
    if (attendance.length > 0) {
      if (y > 140) { doc.addPage(); y = 30; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('Attendance Records', 14, y);
      doc.setTextColor(0, 0, 0);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['SN', 'Meeting', 'Attendee', 'Status', 'Date']],
        body: attendance.map((a, i) => [
          i + 1,
          a.meeting?.title || 'N/A',
          a.user?.name || 'Unknown',
          a.status || 'N/A',
          this.fmtDate(a.recordedAt),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2.5 },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
        margin: { left: 14, right: 14, bottom: 30 },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // 4. Countries Attending Meetings
    if (meetings.length > 0) {
      // Derive country information from meetings data
      const countrySet = new Set();
      meetings.forEach(m => {
        if (m.hostingCountry?.name) countrySet.add(m.hostingCountry.name);
      });
      // Also from attendance if available
      attendance.forEach(a => {
        if (a.user?.country?.name) countrySet.add(a.user.country.name);
      });

      if (countrySet.size > 0) {
        if (y > 160) { doc.addPage(); y = 30; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('Countries Participating', 14, y);
        doc.setTextColor(0, 0, 0);
        y += 6;

        const countriesArray = Array.from(countrySet);
        autoTable(doc, {
          startY: y,
          head: [['SN', 'Country']],
          body: countriesArray.map((c, i) => [i + 1, c]),
          theme: 'grid',
          headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
          margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 12;
      }
    }

    // 5. Reports Summary
    if (reports.length > 0) {
      if (y > 140) { doc.addPage(); y = 30; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('Reports Summary', 14, y);
      doc.setTextColor(0, 0, 0);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['SN', 'Resolution', 'Subcommittee', 'Submitted By', 'Date', 'Performance', 'Status']],
        body: reports.map((r, i) => [
          i + 1,
          r.resolution?.title || 'N/A',
          r.subcommittee?.name || 'N/A',
          r.submittedBy?.name || 'N/A',
          this.fmtDate(r.submittedAt),
          `${r.performancePercentage || 0}%`,
          (r.status || '').replace(/_/g, ' '),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2.5 },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
        margin: { left: 14, right: 14, bottom: 30 },
      });
      y = doc.lastAutoTable.finalY;
    }

    this.addSignatureBlock(doc, y);
    this.addFooter(doc);
    doc.save(`EARACG_Comprehensive_Report_${this.fmtDate(new Date().toISOString())}.pdf`);
  }

  // ============== MEETING DETAIL REPORT (single meeting with attendance & countries) ==============

  static generateMeetingDetailReport(meeting, attendance = [], invitations = [], resolutions = []) {
    const doc = new jsPDF();
    const meetingTitle = meeting.title || 'Meeting Report';

    let y = this.addHeader(doc, meetingTitle, `Date: ${this.fmtDate(meeting.meetingDate)}`);

    // Meeting Info
    autoTable(doc, {
      startY: y,
      head: [['Field', 'Details']],
      body: [
        ['Meeting Type', (meeting.meetingType || '').replace(/_/g, ' ')],
        ['Date & Time', this.fmtDateTime(meeting.meetingDate)],
        ['Location', meeting.location || 'N/A'],
        ['Host Country', meeting.hostingCountry?.name || 'N/A'],
        ['Status', meeting.status || 'N/A'],
        ['Total Invitations', `${invitations.length}`],
        ['Attendance Records', `${attendance.length}`],
        ['Members Present', `${attendance.filter(a => a.status === 'PRESENT').length}`],
        ['Members Absent', `${attendance.filter(a => a.status === 'ABSENT').length}`],
        ['Members Late', `${attendance.filter(a => a.status === 'LATE').length}`],
        ['Resolutions', `${resolutions.length}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10, cellPadding: 4 },
    });
    y = doc.lastAutoTable.finalY + 10;

    // Attendance details
    if (attendance.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Attendance Details', 14, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [['SN', 'Name', 'Status', 'Notes']],
        body: attendance.map((a, i) => [
          i + 1,
          a.user?.name || 'Unknown',
          a.status,
          a.notes || '',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Countries represented
    const countries = new Set();
    attendance.forEach(a => { if (a.user?.country?.name) countries.add(a.user.country.name); });
    invitations.forEach(i => { if (i.user?.country?.name) countries.add(i.user.country.name); });
    if (meeting.hostingCountry?.name) countries.add(meeting.hostingCountry.name);

    if (countries.size > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Countries Represented', 14, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [['SN', 'Country']],
        body: Array.from(countries).map((c, i) => [i + 1, c]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    this.addSignatureBlock(doc, y);
    this.addFooter(doc);
    const safeName = meetingTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
    doc.save(`EARACG_Meeting_${safeName}.pdf`);
  }
}

export default PDFService;
