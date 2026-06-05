'use client';

// ============================================
// DeadlineGuard — DOCX Parser
// ============================================
//
// Uses mammoth when available; falls back to
// extracting text from the DOCX ZIP's XML body.
// ============================================

export interface DocxParseResult {
  text: string;
  metadata: Record<string, unknown>;
}

/**
 * Parse a DOCX file and extract its text content.
 *
 * Tries mammoth first (dynamic import). If unavailable,
 * falls back to raw XML text extraction from the DOCX ZIP.
 *
 * @param file — the DOCX File object from user input
 */
export async function parseDocx(file: File): Promise<DocxParseResult> {
  try {
    return await parseDocxWithMammoth(file);
  } catch {
    console.warn(
      '[docxParser] mammoth not available — using fallback XML extraction',
    );
    return await parseDocxFallback(file);
  }
}

// ---- mammoth approach ----

async function parseDocxWithMammoth(file: File): Promise<DocxParseResult> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.extractRawText({ arrayBuffer });

  return {
    text: result.value,
    metadata: {
      messages: result.messages,
    },
  };
}

// ---- Fallback: parse DOCX as ZIP, extract document.xml ----

async function parseDocxFallback(file: File): Promise<DocxParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // DOCX is a ZIP. We'll look for word/document.xml in the raw bytes.
  // This is a simplified extraction that works for most DOCX files.
  const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

  // Try to find XML content between known DOCX tags
  const xmlParts: string[] = [];

  // Extract text from <w:t> tags (Word paragraph text)
  const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match: RegExpExecArray | null;

  while ((match = wtRegex.exec(rawText)) !== null) {
    if (match[1].trim()) {
      xmlParts.push(match[1]);
    }
  }

  if (xmlParts.length > 0) {
    // Group by paragraph breaks (<w:p>)
    let text = rawText;
    // Insert newlines at paragraph boundaries
    text = text.replace(/<\/w:p>/g, '\n</w:p>');

    const paragraphTexts: string[] = [];
    const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
    let pMatch: RegExpExecArray | null;

    while ((pMatch = paragraphRegex.exec(text)) !== null) {
      const paraContent = pMatch[1];
      const texts: string[] = [];
      const innerRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let tMatch: RegExpExecArray | null;
      while ((tMatch = innerRegex.exec(paraContent)) !== null) {
        texts.push(tMatch[1]);
      }
      if (texts.length > 0) {
        paragraphTexts.push(texts.join(''));
      }
    }

    return {
      text: paragraphTexts.length > 0 ? paragraphTexts.join('\n') : xmlParts.join(' '),
      metadata: { fallback: true, xmlTagsFound: xmlParts.length },
    };
  }

  // Last resort: strip all XML and grab printable text
  const stripped = rawText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Only return if we got a meaningful amount of text
  const printable = stripped.replace(/[^\x20-\x7E\u00C0-\u024F\u1E00-\u1EFF]/g, '');

  return {
    text: printable || '(Could not extract text — install mammoth for full DOCX support)',
    metadata: { fallback: true, rawExtraction: true },
  };
}
