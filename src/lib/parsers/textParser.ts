'use client';

// ============================================
// DeadlineGuard — Plain Text / CSV Parser
// ============================================

export interface TextParseResult {
  text: string;
  lineCount: number;
  metadata: Record<string, unknown>;
}

/**
 * Parse a plain text file (.txt, .csv, .md, .log, etc.).
 *
 * For CSV files, adds header-based formatting so the
 * downstream AI can better understand the tabular data.
 *
 * @param file — the File object from user input
 */
export async function parseText(file: File): Promise<TextParseResult> {
  const text = await readFileAsText(file);
  const isCsv =
    file.name.toLowerCase().endsWith('.csv') ||
    file.type === 'text/csv';

  if (isCsv) {
    return parseCsv(text, file.name);
  }

  const lines = text.split('\n');

  return {
    text,
    lineCount: lines.length,
    metadata: {
      fileName: file.name,
      encoding: 'utf-8',
      mimeType: file.type || 'text/plain',
    },
  };
}

// ---- Helpers ----

/**
 * Read a File as UTF-8 text with fallback encoding detection.
 */
async function readFileAsText(file: File): Promise<string> {
  // Try UTF-8 first
  try {
    const text = await file.text();
    // Simple heuristic: if we get replacement characters, try other encodings
    if (!text.includes('\uFFFD')) return text;
  } catch {
    // fall through
  }

  // Fallback: read as ArrayBuffer and try common encodings
  const buffer = await file.arrayBuffer();
  const encodings = ['utf-8', 'windows-1252', 'iso-8859-1'] as const;

  for (const enc of encodings) {
    try {
      const decoder = new TextDecoder(enc, { fatal: true });
      return decoder.decode(buffer);
    } catch {
      continue;
    }
  }

  // Last resort: non-fatal UTF-8
  return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
}

/**
 * Parse CSV text into a human-readable format
 * so the AI can identify date columns and deadlines.
 */
function parseCsv(text: string, fileName: string): TextParseResult {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      text: '',
      lineCount: 0,
      metadata: { fileName, format: 'csv', empty: true },
    };
  }

  // Detect delimiter
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';
  else if (semicolonCount > commaCount) delimiter = ';';

  // Split into rows
  const rows = lines.map((line) => splitCsvRow(line, delimiter));

  // Assume first row is header
  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Format as readable text: "Header1: Value1 | Header2: Value2"
  const formattedLines: string[] = [
    `[CSV File: ${fileName}]`,
    `Columns: ${headers.join(', ')}`,
    `Rows: ${dataRows.length}`,
    '',
  ];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const parts = headers.map(
      (h, j) => `${h}: ${row[j] ?? ''}`,
    );
    formattedLines.push(`Row ${i + 1}: ${parts.join(' | ')}`);
  }

  return {
    text: formattedLines.join('\n'),
    lineCount: lines.length,
    metadata: {
      fileName,
      format: 'csv',
      delimiter,
      headerCount: headers.length,
      rowCount: dataRows.length,
    },
  };
}

/**
 * Split a single CSV row respecting quoted fields.
 */
function splitCsvRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  result.push(current.trim());
  return result;
}
