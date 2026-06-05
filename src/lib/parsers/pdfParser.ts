'use client';

// ============================================
// DeadlineGuard — PDF Parser
// ============================================
//
// Uses pdfjs-dist when available; falls back to
// raw text extraction from the PDF binary.
// ============================================

export interface PdfParseResult {
  text: string;
  pageCount: number;
  metadata: Record<string, unknown>;
}

/**
 * Parse a PDF file and extract its text content.
 *
 * Tries pdfjs-dist first (dynamic import). If the package
 * is not installed, falls back to a naive binary-text extraction.
 *
 * @param file — the PDF File object from user input
 * @returns Extracted text, page count, and metadata
 */
export async function parsePdf(file: File): Promise<PdfParseResult> {
  try {
    return await parsePdfWithPdfJs(file);
  } catch {
    console.warn(
      '[pdfParser] pdfjs-dist not available — using fallback text extraction',
    );
    return await parsePdfFallback(file);
  }
}

// ---- pdfjs-dist approach ----

async function parsePdfWithPdfJs(file: File): Promise<PdfParseResult> {
  // Dynamic import so the build doesn't fail when pdfjs-dist is absent
  const pdfjsLib = await import('pdfjs-dist');

  // Set the worker source (CDN fallback)
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const textParts: string[] = [];
  const metadata = await pdf.getMetadata().catch(() => null);

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: Record<string, unknown>) =>
        'str' in item ? (item.str as string) : '',
      )
      .join(' ');
    textParts.push(pageText);
  }

  return {
    text: textParts.join('\n\n'),
    pageCount: pdf.numPages,
    metadata: {
      info: metadata?.info ?? {},
      contentLength: arrayBuffer.byteLength,
    },
  };
}

// ---- Fallback: extract visible text from raw PDF bytes ----

async function parsePdfFallback(file: File): Promise<PdfParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

  // Extract text from between BT...ET blocks (PDF text objects)
  const textBlocks: string[] = [];
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match: RegExpExecArray | null;

  while ((match = btEtRegex.exec(rawText)) !== null) {
    const block = match[1];
    // Extract strings inside parentheses Tj or TJ operators
    const tjRegex = /\(([^)]*)\)/g;
    let strMatch: RegExpExecArray | null;
    while ((strMatch = tjRegex.exec(block)) !== null) {
      const cleaned = strMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')');
      if (cleaned.trim()) {
        textBlocks.push(cleaned);
      }
    }
  }

  // Also try to extract readable ASCII runs as a secondary pass
  if (textBlocks.length === 0) {
    const asciiRuns: string[] = [];
    const asciiRegex = /[\x20-\x7E\xC0-\xFF]{4,}/g;
    let asciiMatch: RegExpExecArray | null;
    while ((asciiMatch = asciiRegex.exec(rawText)) !== null) {
      asciiRuns.push(asciiMatch[0]);
    }
    return {
      text: asciiRuns.join(' '),
      pageCount: 0,
      metadata: { fallback: true, rawSizeBytes: arrayBuffer.byteLength },
    };
  }

  // Rough page count from "/Type /Page" occurrences
  const pageMatches = rawText.match(/\/Type\s*\/Page[^s]/g);
  const pageCount = pageMatches ? pageMatches.length : 0;

  return {
    text: textBlocks.join(' '),
    pageCount,
    metadata: { fallback: true, rawSizeBytes: arrayBuffer.byteLength },
  };
}
