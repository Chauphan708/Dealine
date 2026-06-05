'use client';

// ============================================
// DeadlineGuard — XLSX / Excel Parser
// ============================================
//
// Uses SheetJS (xlsx) when available; falls back to
// extracting shared strings from the raw XLSX XML.
// ============================================

export interface XlsxParseResult {
  text: string;
  sheetCount: number;
  metadata: Record<string, unknown>;
}

/**
 * Parse an Excel file (.xlsx, .xls, .csv) and extract its text.
 *
 * Tries SheetJS first. If unavailable, falls back to
 * extracting shared strings from the XLSX ZIP XML.
 *
 * @param file — the Excel File object from user input
 */
export async function parseXlsx(file: File): Promise<XlsxParseResult> {
  try {
    return await parseXlsxWithSheetJS(file);
  } catch {
    console.warn(
      '[xlsxParser] xlsx (SheetJS) not available — using fallback extraction',
    );
    return await parseXlsxFallback(file);
  }
}

// ---- SheetJS approach ----

async function parseXlsxWithSheetJS(file: File): Promise<XlsxParseResult> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const textParts: string[] = [];
  const sheetNames = workbook.SheetNames;

  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;

    textParts.push(`--- Sheet: ${name} ---`);

    // Convert to CSV-like text for downstream analysis
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    textParts.push(csv);

    textParts.push(''); // blank line separator
  }

  return {
    text: textParts.join('\n'),
    sheetCount: sheetNames.length,
    metadata: {
      sheetNames,
    },
  };
}

// ---- Fallback: extract from raw ZIP XML ----

async function parseXlsxFallback(file: File): Promise<XlsxParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

  // Try to extract shared strings (<si><t>...</t></si>)
  const strings: string[] = [];
  const siRegex = /<t[^>]*>([^<]+)<\/t>/g;
  let match: RegExpExecArray | null;

  while ((match = siRegex.exec(rawText)) !== null) {
    const val = match[1].trim();
    if (val) strings.push(val);
  }

  // Also try to find inline strings and cell values from sheet XML
  const cellRegex = /<v>([^<]+)<\/v>/g;
  while ((match = cellRegex.exec(rawText)) !== null) {
    const val = match[1].trim();
    // Skip pure numeric indices (shared string refs) when we have strings
    if (val && (strings.length === 0 || isNaN(Number(val)))) {
      strings.push(val);
    }
  }

  // Try to detect number of sheets
  const sheetRegex = /<sheet\s/g;
  let sheetCount = 0;
  while (sheetRegex.exec(rawText) !== null) sheetCount++;

  return {
    text:
      strings.length > 0
        ? strings.join('\n')
        : '(Could not extract text — install xlsx/SheetJS for full Excel support)',
    sheetCount: Math.max(sheetCount, 1),
    metadata: { fallback: true, extractedStrings: strings.length },
  };
}
