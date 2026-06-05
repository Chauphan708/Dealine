'use client';

// ============================================
// DeadlineGuard — Gemini AI Analyzer
// ============================================
//
// Uses the @google/generative-ai SDK to extract
// deadlines from document text via structured output.
// ============================================

import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import type {
  DocumentAnalysis,
  GeminiDeadlineExtraction,
} from '@/types';
import { generateId } from '@/lib/utils/helpers';

/** Models to try in order of preference */
const MODEL_PRIORITY = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
] as const;

/**
 * Structured output schema for Gemini response.
 * Forces the model to return well-typed JSON.
 */
const DEADLINE_RESPONSE_SCHEMA: any = {
  type: SchemaType.OBJECT,
  properties: {
    deadlines: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: {
            type: SchemaType.STRING,
            description: 'Tên / tiêu đề ngắn gọn của deadline',
          },
          description: {
            type: SchemaType.STRING,
            description: 'Mô tả chi tiết về deadline',
          },
          deadline_date: {
            type: SchemaType.STRING,
            description: 'Ngày deadline theo định dạng ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
          },
          priority: {
            type: SchemaType.STRING,
            enum: ['critical', 'high', 'medium', 'low'],
            description: 'Mức ưu tiên',
          },
          category: {
            type: SchemaType.STRING,
            description: 'Phân loại: hợp đồng, báo cáo, nộp thuế, họp, dự án, thi cử, nộp hồ sơ, khác',
          },
          source_text: {
            type: SchemaType.STRING,
            description: 'Đoạn văn bản gốc chứa thông tin deadline',
          },
          confidence: {
            type: SchemaType.NUMBER,
            description: 'Độ tin cậy 0.0 – 1.0',
          },
        },
        required: [
          'title',
          'description',
          'deadline_date',
          'priority',
          'category',
          'source_text',
          'confidence',
        ],
      },
    },
    document_summary: {
      type: SchemaType.STRING,
      description: 'Tóm tắt nội dung văn bản',
    },
    document_type: {
      type: SchemaType.STRING,
      description: 'Loại văn bản: hợp đồng, công văn, biên bản, email, báo cáo, khác',
    },
  },
  required: ['deadlines', 'document_summary', 'document_type'],
};

/**
 * Build the analysis prompt.
 * Written in Vietnamese to maximise accuracy with VN documents.
 */
function buildPrompt(text: string, fileName: string): string {
  const today = new Date().toISOString().split('T')[0];

  return `Bạn là trợ lý AI chuyên phân tích văn bản và trích xuất thời hạn (deadline).

NGÀY HÔM NAY: ${today}

NHIỆM VỤ:
Phân tích văn bản dưới đây và trích xuất TẤT CẢ các thời hạn, ngày hết hạn, ngày nộp, ngày họp, ngày thi, và bất kỳ mốc thời gian quan trọng nào.

QUY TẮC PHÂN TÍCH:

1. NHẬN DẠNG NGÀY THÁNG (tất cả các định dạng):
   - Tiếng Việt: "ngày 15 tháng 6 năm 2026", "15/06/2026", "ngày 15-6-2026"
   - Từ khóa: "trước ngày...", "hạn chót...", "deadline...", "hạn nộp...", "thời hạn..."
   - Tiếng Anh: "June 15, 2026", "2026-06-15", "15 Jun 2026"
   - Tương đối: "trong vòng 30 ngày", "trước thứ Sáu tuần sau", "cuối tháng", "sang tuần"
   - Khi gặp ngày tương đối, hãy tính dựa trên ngày hôm nay (${today})

2. XÁC ĐỊNH MỨC ƯU TIÊN:
   - critical: "khẩn cấp", "rất gấp", "ngay lập tức", "hỏa tốc", "urgent", "ASAP"
   - high: "quan trọng", "ưu tiên", "bắt buộc", "important", "required"  
   - medium: mặc định cho hầu hết deadline
   - low: "khi có thể", "không gấp", "tham khảo", "optional"

3. PHÂN LOẠI DEADLINE:
   - hợp đồng: ký kết, gia hạn, thanh toán hợp đồng
   - báo cáo: nộp báo cáo, report
   - nộp thuế: thuế, khai thuế, nộp tờ khai
   - họp: cuộc họp, meeting, hội nghị
   - dự án: milestone, giai đoạn dự án, phase
   - thi cử: thi, kiểm tra, exam
   - nộp hồ sơ: hồ sơ, đơn, application
   - khác: các loại khác

4. ĐỘ TIN CẬY:
   - 0.9-1.0: Ngày cụ thể, rõ ràng
   - 0.7-0.9: Ngày được suy ra từ ngữ cảnh
   - 0.5-0.7: Ngày không chắc chắn hoặc tương đối
   - < 0.5: Ngày rất mơ hồ

5. QUY TẮC BỔ SUNG:
   - Nếu không có giờ cụ thể, đặt mặc định 17:00 (giờ làm việc kết thúc)
   - Trích xuất CHÍNH XÁC đoạn văn gốc chứa thông tin deadline vào source_text
   - Mỗi deadline phải có title ngắn gọn, dễ hiểu
   - Mô tả (description) phải đầy đủ ngữ cảnh

TÊN FILE: ${fileName}

VĂN BẢN CẦN PHÂN TÍCH:
---
${text.slice(0, 30000)}
---

Hãy trả về kết quả theo JSON schema đã định nghĩa.
Nếu không tìm thấy deadline nào, trả về mảng deadlines rỗng.`;
}

/**
 * Analyse document text using Gemini AI to extract deadlines.
 *
 * @param text     — extracted document text
 * @param fileName — original file name for context
 * @param apiKey   — user's Gemini API key
 * @returns A complete DocumentAnalysis
 */
export async function analyzeDocument(
  text: string,
  fileName: string,
  apiKey: string,
): Promise<DocumentAnalysis> {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      'Gemini API key is required. Please add your API key in Settings.',
    );
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Document text is empty — nothing to analyse.');
  }

  const startTime = Date.now();
  const genAI = new GoogleGenerativeAI(apiKey);

  let extraction: GeminiDeadlineExtraction | null = null;
  let lastError: Error | null = null;

  // Try each model in priority order
  for (const modelName of MODEL_PRIORITY) {
    try {
      extraction = await callGemini(genAI, modelName, text, fileName);
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[geminiAnalyzer] ${modelName} failed:`, lastError.message);
      continue;
    }
  }

  if (!extraction) {
    throw new Error(
      `All Gemini models failed. Last error: ${lastError?.message ?? 'Unknown error'}. ` +
        'Please check your API key and try again.',
    );
  }

  const processingTime = Date.now() - startTime;

  // Map extraction result to DocumentAnalysis
  const analysis: DocumentAnalysis = {
    id: generateId(),
    deadlines: extraction.deadlines.map((d) => ({
      title: d.title,
      description: d.description,
      deadlineDate: normalizeDate(d.deadline_date),
      priority: d.priority,
      category: d.category,
      sourceText: d.source_text,
      sourceFile: fileName,
      confidence: clamp(d.confidence, 0, 1),
    })),
    documentSummary: extraction.document_summary,
    documentType: extraction.document_type,
    rawText: text,
    fileName,
    fileSize: new Blob([text]).size,
    fileType: fileName.split('.').pop()?.toLowerCase() ?? 'unknown',
    analyzedAt: new Date().toISOString(),
    processingTime,
  };

  return analysis;
}

// ---- Internal helpers ----

async function callGemini(
  genAI: GoogleGenerativeAI,
  modelName: string,
  text: string,
  fileName: string,
): Promise<GeminiDeadlineExtraction> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: DEADLINE_RESPONSE_SCHEMA,
      temperature: 0.1, // low temperature for precision
    },
  });

  const prompt = buildPrompt(text, fileName);
  const result = await model.generateContent(prompt);
  const response = result.response;
  const jsonText = response.text();

  if (!jsonText) {
    throw new Error('Empty response from Gemini');
  }

  const parsed = JSON.parse(jsonText) as GeminiDeadlineExtraction;

  // Basic validation
  if (!parsed.deadlines || !Array.isArray(parsed.deadlines)) {
    throw new Error('Invalid response structure: missing deadlines array');
  }

  return parsed;
}

/**
 * Normalise a date string to ISO 8601 format.
 * Handles various formats the AI might return.
 */
function normalizeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // fall through
  }

  // Try DD/MM/YYYY format (Vietnamese)
  const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const d = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      17, 0, 0,
    );
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // Fallback: return as-is (let the UI handle display)
  return dateStr;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validate whether an API key looks correct (basic format check).
 * Does NOT verify against the API — just checks format.
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Gemini API keys are typically 39 characters, alphanumeric + underscore/dash
  return /^[A-Za-z0-9_-]{30,60}$/.test(key.trim());
}

/**
 * Test the API key by making a minimal request.
 * Returns true if the key is valid.
 */
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    await model.generateContent('Say "ok"');
    return true;
  } catch {
    return false;
  }
}
