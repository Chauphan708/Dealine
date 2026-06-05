'use client';

// ============================================
// DeadlineGuard — Unified Document Parser
// ============================================

import { parsePdf } from './pdfParser';
import { parseDocx } from './docxParser';
import { parseXlsx } from './xlsxParser';
import { parseText } from './textParser';

/** Maximum file size: 10 MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface ParsedDocument {
  text: string;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    pageCount?: number;
    sheetCount?: number;
    lineCount?: number;
  };
}

/**
 * Parse a document file and extract its text content.
 *
 * Routes to the correct parser based on file extension and MIME type.
 * Supports: PDF, DOCX, XLSX/XLS, TXT, CSV, and other text files.
 *
 * @param file — the File object from user input
 * @returns Extracted text and metadata
 * @throws Error if file is too large or unsupported
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${formatSize(file.size)}. Maximum size is ${formatSize(MAX_FILE_SIZE)}.`,
    );
  }

  if (file.size === 0) {
    throw new Error('File is empty.');
  }

  const fileType = detectFileType(file);

  switch (fileType) {
    case 'pdf': {
      const result = await parsePdf(file);
      return {
        text: result.text,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: 'pdf',
          pageCount: result.pageCount,
        },
      };
    }

    case 'docx': {
      const result = await parseDocx(file);
      return {
        text: result.text,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: 'docx',
        },
      };
    }

    case 'xlsx': {
      const result = await parseXlsx(file);
      return {
        text: result.text,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: 'xlsx',
          sheetCount: result.sheetCount,
        },
      };
    }

    case 'text': {
      const result = await parseText(file);
      return {
        text: result.text,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'text',
          lineCount: result.lineCount,
        },
      };
    }

    default:
      throw new Error(
        `Unsupported file type: ${file.name}. Supported formats: PDF, DOCX, XLSX, XLS, TXT, CSV.`,
      );
  }
}

// ---- File type detection ----

type SupportedFileType = 'pdf' | 'docx' | 'xlsx' | 'text' | 'unknown';

const EXTENSION_MAP: Record<string, SupportedFileType> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.doc': 'docx',
  '.xlsx': 'xlsx',
  '.xls': 'xlsx',
  '.txt': 'text',
  '.csv': 'text',
  '.md': 'text',
  '.log': 'text',
  '.rtf': 'text',
  '.json': 'text',
  '.xml': 'text',
  '.html': 'text',
  '.htm': 'text',
};

const MIME_MAP: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xlsx',
  'text/plain': 'text',
  'text/csv': 'text',
  'text/markdown': 'text',
  'text/html': 'text',
  'application/json': 'text',
  'application/xml': 'text',
  'text/xml': 'text',
};

function detectFileType(file: File): SupportedFileType {
  // Try extension first
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (ext && EXTENSION_MAP[ext]) {
    return EXTENSION_MAP[ext];
  }

  // Fall back to MIME type
  if (file.type && MIME_MAP[file.type]) {
    return MIME_MAP[file.type];
  }

  return 'unknown';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * List of supported file extensions for UI display / file input accept.
 */
export const SUPPORTED_EXTENSIONS = Object.keys(EXTENSION_MAP);

/**
 * MIME types for the file input `accept` attribute.
 */
export const SUPPORTED_MIME_TYPES = Object.keys(MIME_MAP);

export { parsePdf } from './pdfParser';
export { parseDocx } from './docxParser';
export { parseXlsx } from './xlsxParser';
export { parseText } from './textParser';
