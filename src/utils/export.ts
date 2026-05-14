/**
 * Excel + PowerPoint export helpers.
 * Excel exports the currently-filtered rows; PPT builds a branded summary deck
 * with KPI cards, data tables and native charts.
 */
import pptxgen from 'pptxgenjs';
import * as XLSX from 'xlsx-js-style';

/* ------------------------------------------------------------------ */
/* Shared                                                             */
/* ------------------------------------------------------------------ */

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'munshot-export'
  );
}

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Excel                                                              */
/* ------------------------------------------------------------------ */

export interface ExcelSheet<T> {
  name: string;
  rows: T[];
  columns: ExportColumn<T>[];
}

/* CEO-grade styling — one cohesive Munshot indigo palette. */
const XL = {
  titleFill: '312E81',
  headerFill: '4F46E5',
  zebraFill: 'EEF2FF',
  border: 'E2E8F0',
  ink: '0F172A',
  white: 'FFFFFF',
};

const THIN_BORDER = {
  top: { style: 'thin', color: { rgb: XL.border } },
  bottom: { style: 'thin', color: { rgb: XL.border } },
  left: { style: 'thin', color: { rgb: XL.border } },
  right: { style: 'thin', color: { rgb: XL.border } },
};

function sheetToWorksheet<T>(sheet: ExcelSheet<T>): XLSX.WorkSheet {
  const headers = sheet.columns.map((c) => c.header);
  const body = sheet.rows.map((row) =>
    sheet.columns.map((c) => c.value(row)),
  );
  const lastCol = Math.max(0, sheet.columns.length - 1);

  // Row 0: title banner · Row 1: column headers · Row 2+: data rows.
  const titleRow = headers.map((_, i) =>
    i === 0 ? `MUNSHOT OS    ·    ${sheet.name}` : '',
  );
  const aoa: (string | number)[][] = [titleRow, headers, ...body];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const lastRow = aoa.length - 1;

  // Title banner spans every column.
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }];

  // Column widths sized to their content.
  ws['!cols'] = sheet.columns.map((c) => ({
    wch: Math.min(
      60,
      Math.max(
        c.header.length + 4,
        ...sheet.rows.map((r) => String(c.value(r)).length + 4),
        12,
      ),
    ),
  }));

  // Tall banner + header, comfortable data rows.
  ws['!rows'] = aoa.map((_, r) => ({
    hpt: r === 0 ? 30 : r === 1 ? 22 : 18,
  }));

  // Filter dropdowns on the header row + data.
  if (body.length > 0) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 1, c: 0 },
        e: { r: lastRow, c: lastCol },
      }),
    };
  }

  // Style every cell in the used range.
  const cells = ws as Record<string, any>;
  for (let r = 0; r <= lastRow; r++) {
    for (let c = 0; c <= lastCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!cells[addr]) cells[addr] = { t: 's', v: '' };
      const cell = cells[addr];

      if (r === 0) {
        cell.s = {
          font: {
            name: 'Calibri',
            sz: 15,
            bold: true,
            color: { rgb: XL.white },
          },
          fill: { patternType: 'solid', fgColor: { rgb: XL.titleFill } },
          alignment: { horizontal: 'left', vertical: 'center' },
        };
      } else if (r === 1) {
        cell.s = {
          font: {
            name: 'Calibri',
            sz: 11,
            bold: true,
            color: { rgb: XL.white },
          },
          fill: { patternType: 'solid', fgColor: { rgb: XL.headerFill } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: THIN_BORDER,
        };
      } else {
        const isNumber = typeof cell.v === 'number';
        cell.s = {
          font: {
            name: 'Calibri',
            sz: 11,
            bold: c === 0,
            color: { rgb: XL.ink },
          },
          fill: {
            patternType: 'solid',
            fgColor: { rgb: r % 2 === 1 ? XL.white : XL.zebraFill },
          },
          alignment: {
            horizontal: isNumber ? 'right' : 'left',
            vertical: 'center',
          },
          border: THIN_BORDER,
        };
      }
    }
  }

  return ws;
}

export function exportSheetsToExcel(
  filename: string,
  sheets: ExcelSheet<any>[],
): void {
  const wb = XLSX.utils.book_new();
  sheets.forEach((sheet, i) => {
    const ws = sheetToWorksheet(sheet);
    const safeName =
      (sheet.name || `Sheet ${i + 1}`)
        .replace(/[\\/?*[\]:]/g, '')
        .slice(0, 31) || `Sheet ${i + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });
  XLSX.writeFile(wb, `${sanitizeFilename(filename)}-${stamp()}.xlsx`);
}

export function exportToExcel<T>(
  filename: string,
  sheetName: string,
  rows: T[],
  columns: ExportColumn<T>[],
): void {
  exportSheetsToExcel(filename, [{ name: sheetName, rows, columns }]);
}

/* ------------------------------------------------------------------ */
/* PowerPoint                                                         */
/* ------------------------------------------------------------------ */

const PPT = {
  brand: '4F46E5',
  brandDark: '3730A3',
  brandTint: '6D5CE7',
  ink: '0F172A',
  muted: '64748B',
  line: 'E2E8F0',
  bg: 'F8FAFC',
  white: 'FFFFFF',
  zebra: 'F1F5F9',
  accent: [
    '6366F1',
    'D946EF',
    '10B981',
    'F59E0B',
    '0EA5E9',
    'F43F5E',
    '8B5CF6',
    '14B8A6',
  ],
};

export interface PptKpi {
  label: string;
  value: string | number;
  hint?: string;
}

export interface PptTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface PptChart {
  title: string;
  type: 'bar' | 'line' | 'pie';
  labels: string[];
  series: { name: string; values: number[] }[];
}

export interface PptSummary {
  title: string;
  subtitle?: string;
  kpis: PptKpi[];
  highlights?: string[];
  tables?: PptTable[];
  charts?: PptChart[];
}

type Slide = ReturnType<pptxgen['addSlide']>;

function headerBar(
  pptx: pptxgen,
  slide: Slide,
  title: string,
  eyebrow: string,
): void {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.12,
    fill: { color: PPT.brand },
    line: { color: PPT.brand },
  });
  slide.addText(eyebrow.toUpperCase(), {
    x: 0.6,
    y: 0.32,
    w: 12,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: PPT.brand,
    charSpacing: 2,
  });
  slide.addText(title, {
    x: 0.6,
    y: 0.58,
    w: 12,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: PPT.ink,
  });
}

function buildTitleSlide(pptx: pptxgen, summary: PptSummary): void {
  const slide = pptx.addSlide();
  slide.background = { color: PPT.brand };
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.4,
    y: -1.8,
    w: 5.6,
    h: 5.6,
    rotate: 24,
    fill: { color: PPT.brandDark },
    line: { color: PPT.brandDark },
    rectRadius: 0.6,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: -1.6,
    y: 4.6,
    w: 4.6,
    h: 4.6,
    rotate: 18,
    fill: { color: PPT.brandTint },
    line: { color: PPT.brandTint },
    rectRadius: 0.6,
  });
  slide.addText('MUNSHOT OS', {
    x: 0.85,
    y: 1.0,
    w: 9,
    h: 0.5,
    fontSize: 16,
    bold: true,
    color: 'C7D2FE',
    charSpacing: 4,
  });
  slide.addText(summary.title, {
    x: 0.85,
    y: 1.65,
    w: 11.4,
    h: 1.7,
    fontSize: 40,
    bold: true,
    color: PPT.white,
  });
  if (summary.subtitle) {
    slide.addText(summary.subtitle, {
      x: 0.85,
      y: 3.4,
      w: 10.8,
      h: 0.8,
      fontSize: 18,
      color: 'E0E7FF',
    });
  }
  slide.addText(
    'Equity Research Team — Delivery Operating System',
    { x: 0.85, y: 6.05, w: 9, h: 0.4, fontSize: 13, color: 'C7D2FE' },
  );
  slide.addText(
    `Generated ${new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} · Munshot Technologies Private Limited`,
    { x: 0.85, y: 6.45, w: 11, h: 0.4, fontSize: 11, color: 'A5B4FC' },
  );
}

function buildKpiSlide(pptx: pptxgen, summary: PptSummary): void {
  const slide = pptx.addSlide();
  slide.background = { color: PPT.bg };
  headerBar(pptx, slide, summary.title, 'Executive snapshot');

  const kpis = summary.kpis.slice(0, 12);
  const perRow = 4;
  const cardW = 2.95;
  const cardH = 1.45;
  const gapX = 0.18;
  const gapY = 0.2;
  const startX = 0.6;
  const startY = 1.45;

  kpis.forEach((kpi, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);
    const accent = PPT.accent[i % PPT.accent.length];
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: cardW,
      h: cardH,
      fill: { color: PPT.white },
      line: { color: PPT.line, width: 1 },
      rectRadius: 0.08,
      shadow: {
        type: 'outer',
        color: '94A3B8',
        blur: 6,
        offset: 2,
        angle: 90,
        opacity: 0.25,
      },
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.1,
      y: y + 0.18,
      w: 0.09,
      h: cardH - 0.36,
      fill: { color: accent },
      line: { color: accent },
      rectRadius: 0.04,
    });
    slide.addText(String(kpi.value), {
      x: x + 0.28,
      y: y + 0.14,
      w: cardW - 0.4,
      h: 0.62,
      fontSize: 30,
      bold: true,
      color: PPT.ink,
    });
    slide.addText(kpi.label.toUpperCase(), {
      x: x + 0.28,
      y: y + 0.78,
      w: cardW - 0.4,
      h: 0.34,
      fontSize: 10,
      bold: true,
      color: PPT.muted,
      charSpacing: 1,
    });
    if (kpi.hint) {
      slide.addText(kpi.hint, {
        x: x + 0.28,
        y: y + 1.06,
        w: cardW - 0.4,
        h: 0.3,
        fontSize: 9,
        color: accent,
        bold: true,
      });
    }
  });

  if (summary.highlights && summary.highlights.length > 0) {
    const hy =
      startY + Math.ceil(kpis.length / perRow) * (cardH + gapY) + 0.12;
    slide.addText('HIGHLIGHTS', {
      x: 0.6,
      y: hy,
      w: 6,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: PPT.muted,
      charSpacing: 1,
    });
    slide.addText(
      summary.highlights.map((h) => ({
        text: h,
        options: { bullet: { code: '2022' }, color: PPT.ink },
      })),
      {
        x: 0.6,
        y: hy + 0.32,
        w: 12.1,
        h: 1.5,
        fontSize: 12,
        lineSpacingMultiple: 1.3,
      },
    );
  }
}

function buildChartSlide(
  pptx: pptxgen,
  summary: PptSummary,
  chart: PptChart,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: PPT.bg };
  headerBar(pptx, slide, chart.title, `${summary.title} · Chart`);

  const data = chart.series.map((s) => ({
    name: s.name,
    labels: chart.labels,
    values: s.values,
  }));
  const type =
    chart.type === 'pie'
      ? pptx.ChartType.pie
      : chart.type === 'line'
        ? pptx.ChartType.line
        : pptx.ChartType.bar;

  slide.addChart(type, data, {
    x: 0.6,
    y: 1.45,
    w: 12.1,
    h: 5.4,
    chartColors: PPT.accent,
    showLegend: chart.series.length > 1 || chart.type === 'pie',
    legendPos: 'b',
    legendColor: PPT.muted,
    showValue: chart.type !== 'line',
    dataLabelColor: chart.type === 'pie' ? PPT.white : PPT.ink,
    dataLabelFontSize: 9,
    catAxisLabelColor: PPT.muted,
    valAxisLabelColor: PPT.muted,
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 9,
    showTitle: false,
    barDir: 'col',
  });
}

function buildTableSlide(
  pptx: pptxgen,
  summary: PptSummary,
  table: PptTable,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: PPT.bg };
  headerBar(pptx, slide, table.title, `${summary.title} · Detail`);

  const headerRow = table.headers.map((h) => ({
    text: h,
    options: {
      bold: true,
      color: PPT.white,
      fill: { color: PPT.brand },
      fontSize: 10,
    },
  }));

  const bodyRows =
    table.rows.length > 0
      ? table.rows.map((r, ri) =>
          r.map((cell) => ({
            text: String(cell),
            options: {
              color: PPT.ink,
              fontSize: 9.5,
              fill: { color: ri % 2 === 0 ? PPT.white : PPT.zebra },
            },
          })),
        )
      : [
          [
            {
              text: 'No records for the current filters.',
              options: {
                colspan: table.headers.length,
                color: PPT.muted,
                italic: true,
                fontSize: 10,
                fill: { color: PPT.white },
              },
            },
          ],
        ];

  slide.addTable([headerRow, ...bodyRows], {
    x: 0.6,
    y: 1.45,
    w: 12.13,
    border: { type: 'solid', color: PPT.line, pt: 1 },
    align: 'left',
    valign: 'middle',
    autoPage: true,
    autoPageRepeatHeader: true,
    autoPageHeaderRows: 1,
    newSlideStartY: 0.6,
  });
}

export function exportToPpt(filename: string, summary: PptSummary): void {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Munshot OS';
  pptx.company = 'Munshot Technologies Private Limited';
  pptx.subject = summary.title;
  pptx.title = summary.title;

  buildTitleSlide(pptx, summary);
  buildKpiSlide(pptx, summary);
  (summary.charts ?? []).forEach((c) => buildChartSlide(pptx, summary, c));
  (summary.tables ?? []).forEach((t) => buildTableSlide(pptx, summary, t));

  void pptx.writeFile({ fileName: `${sanitizeFilename(filename)}-${stamp()}.pptx` });
}
