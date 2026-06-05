'use client';

// ============================================
// DeadlineGuard — Documents & File Upload Page
// ============================================

import React, { useState } from 'react';
import { useDeadlines } from '@/hooks/useDeadlines';
import { useSettings } from '@/hooks/useSettings';
import FileUploader from '@/components/upload/FileUploader';
import AnalysisResult from '@/components/upload/AnalysisResult';
import { parseDocument } from '@/lib/parsers';
import { analyzeDocument } from '@/lib/ai/geminiAnalyzer';
import { useToast } from '@/components/common/Toast';
import type { DocumentAnalysis, Deadline } from '@/types';
import { generateId } from '@/lib/utils/helpers';
import {
  FileText,
  Clock,
  CheckCircle,
  HelpCircle,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import Badge from '@/components/common/Badge';

export default function DocumentsPage() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const { importAnalysisResults } = useDeadlines();

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeAnalysis, setActiveAnalysis] = useState<DocumentAnalysis | null>(null);

  // Stored analysis history list for display
  const [historyList, setHistoryList] = useState<DocumentAnalysis[]>([]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      setIsProcessing(true);
      setProgress(10);
      toast('Đang đọc dữ liệu tài liệu...', 'info');

      // 1. Parse the first file
      const file = files[0];
      const parsed = await parseDocument(file);
      setProgress(40);

      // 2. Run Gemini AI extraction
      toast('Tài liệu đã được tải. Đang gọi Gemini AI để trích xuất...', 'info');
      setProgress(60);

      // Get API Key from settings. If empty, warn and use simulated mock fallback for demo
      const apiKey = settings.geminiApiKey;
      let analysisResult: DocumentAnalysis;

      if (!apiKey) {
        toast('Không tìm thấy Gemini API Key trong Cài đặt! Đang chạy chế độ mô phỏng AI...', 'warning');
        // Simulate progress intervals
        const timer = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(timer);
              return 90;
            }
            return prev + 10;
          });
        }, 300);

        await new Promise((resolve) => setTimeout(resolve, 2000));
        clearInterval(timer);

        // Generate high-fidelity simulated mock analysis based on file name
        analysisResult = generateSimulatedAnalysis(file.name, parsed.text);
      } else {
        // Run actual Gemini extraction
        const start = Date.now();
        const geminiResponse = await analyzeDocument(parsed.text, file.name, apiKey);
        const processingTime = Date.now() - start;

        analysisResult = {
          ...geminiResponse,
          processingTime,
        };
      }

      setProgress(100);
      setActiveAnalysis(analysisResult);
      toast('Phân tích tài liệu thành công! Hãy rà soát kết quả bên dưới.', 'success');
    } catch (err: unknown) {
      console.error(err);
      toast(err instanceof Error ? err.message : 'Phân tích tài liệu thất bại.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAnalysis = async (selectedDeadlines: Omit<Deadline, 'id' | 'status' | 'reminders' | 'tags' | 'notes' | 'createdAt' | 'updatedAt'>[]) => {
    if (!activeAnalysis) return;

    // Overwrite the analysis deadlines with the approved ones
    const finalAnalysis: DocumentAnalysis = {
      ...activeAnalysis,
      deadlines: selectedDeadlines,
    };

    await importAnalysisResults(finalAnalysis);

    // Save to local history list
    setHistoryList((prev) => [finalAnalysis, ...prev]);

    // Reset page view
    setActiveAnalysis(null);
    setProgress(0);
  };

  return (
    <div className="documents-page-container" id="documents-page-root">
      {/* Dynamic toggle: File Uploader or Analysis Results */}
      {!activeAnalysis ? (
        <div className="documents-grid-layout" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Uploader Card */}
          <div className="documents-uploader-card">
            <FileUploader
              onFilesSelected={handleFilesSelected}
              isProcessing={isProcessing}
              progress={progress}
            />
          </div>

          {/* Document Processed History List */}
          <div className="documents-history-section glass-card" id="documents-history-list">
            <h3 className="history-heading-title" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Lịch sử văn bản đã phân tích ({historyList.length})
            </h3>

            {historyList.length === 0 ? (
              <div className="history-empty-placeholder" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>Chưa có tài liệu nào được xử lý trong phiên làm việc này.</p>
              </div>
            ) : (
              <div className="history-table-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {historyList.map((hist) => (
                  <div key={hist.id} className="history-item-row glass-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', alignItems: 'center' }}>
                    <div className="history-row-left" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div className="history-doc-icon" style={{ color: 'var(--accent-primary)' }}>
                        <FileText size={20} />
                      </div>
                      <div className="history-info">
                        <h4 className="hist-file-name" style={{ fontSize: '14px', fontWeight: 600 }}>{hist.fileName}</h4>
                        <span className="hist-meta" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Loại: {hist.documentType} | Phát hiện {hist.deadlines.length} mốc hạn chót
                        </span>
                      </div>
                    </div>

                    <div className="history-row-right">
                      <span className="hist-date" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Phân tích lúc: {new Date(hist.analyzedAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Render Analysis Result for Review */
        <AnalysisResult
          analysis={activeAnalysis}
          onSave={handleSaveAnalysis}
          onCancel={() => {
            setActiveAnalysis(null);
            setProgress(0);
          }}
        />
      )}
    </div>
  );
}

/**
 * High-fidelity Simulated AI Deadline Extraction based on filename
 * when real Gemini API key is missing. Yields highly realistic business content!
 */
function generateSimulatedAnalysis(fileName: string, parsedText: string): DocumentAnalysis {
  const fileLower = fileName.toLowerCase();
  const now = new Date();

  let documentType = 'Thông báo Hướng dẫn / Quy định';
  let documentSummary = 'Tài liệu hướng dẫn triển khai kế hoạch sản xuất kinh doanh, kê khai nghĩa vụ tài chính và lập báo cáo tài chính.';
  let deadlines: any[] = [];

  if (fileLower.includes('thue') || fileLower.includes('tax') || fileLower.includes('bao_cao')) {
    documentType = 'Công văn Thuế / Báo cáo tài chính';
    documentSummary = 'Công văn hướng dẫn doanh nghiệp rà soát kê khai thuế thu nhập cá nhân TNCN Quý I và nộp tờ khai Báo cáo tài chính kiểm toán Quý II năm 2026.';
    deadlines = [
      {
        title: 'Nộp tờ khai thuế TNCN Quý 1',
        description: 'Hoàn thiện hồ sơ quyết toán và nộp tờ khai thuế thu nhập cá nhân phát sinh cho nhân sự công ty Quý I.',
        deadlineDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 1 day
        priority: 'critical',
        category: 'nộp thuế',
        sourceText: 'Tổ chức, cá nhân trả thu nhập phát sinh nghĩa vụ khấu trừ thuế kê khai chậm nhất trước ngày 03/06/2026.',
        confidence: 0.94,
      },
      {
        title: 'Báo cáo Kiểm toán Tài chính Quý 2',
        description: 'Nộp báo cáo tài chính Quý 2 đã được kiểm toán lên cơ quan thuế quản lý trực tiếp.',
        deadlineDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days
        priority: 'high',
        category: 'báo cáo',
        sourceText: 'Công bố thông tin Báo cáo tài chính soát xét bán niên Quý 2 chậm nhất trong vòng 45 ngày.',
        confidence: 0.89,
      },
    ];
  } else if (fileLower.includes('hop_dong') || fileLower.includes('contract')) {
    documentType = 'Hợp đồng thương mại';
    documentSummary = 'Hợp đồng mua bán và lắp đặt hệ thống thiết bị phòng cháy chữa cháy, điều khoản bàn giao công trình và thanh toán nghiệm thu đợt 2.';
    deadlines = [
      {
        title: 'Thanh toán đợt 2 - Đặt mua thiết bị PCCC',
        description: 'Thanh toán 30% giá trị hợp đồng đợt 2 cho đối tác lắp đặt PCCC sau khi thiết bị tập kết tại công trình.',
        deadlineDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
        priority: 'high',
        category: 'hợp đồng',
        sourceText: 'Bên A thanh toán cho bên B đợt 2 trị giá 300.000.000 VNĐ trong vòng 5 ngày làm việc kể từ ngày bàn giao thiết bị.',
        confidence: 0.92,
      },
      {
        title: 'Nghiệm thu bàn giao hệ thống kỹ thuật',
        description: 'Tiến hành rà soát kỹ thuật liên ngành và ký biên bản nghiệm thu bàn giao đưa vào vận hành.',
        deadlineDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
        priority: 'medium',
        category: 'dự án',
        sourceText: 'Tiến độ hoàn thành lắp đặt và nghiệm thu công trình chậm nhất vào ngày 12 tháng 06 năm 2026.',
        confidence: 0.85,
      },
    ];
  } else {
    // Default general simulation
    documentType = 'Công văn Kế hoạch Dự án';
    documentSummary = `Công văn điều phối và đẩy nhanh tiến độ dự án. Trích xuất tài liệu ${fileName} chứa thông tin điều phối công việc và nhân lực sắp diễn ra.`;
    deadlines = [
      {
        title: 'Nộp báo cáo tiến độ tuần dự án',
        description: 'Tổng hợp bảng chấm công và kết quả đầu ra dự án để chuẩn bị cho buổi họp giao ban.',
        deadlineDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        priority: 'medium',
        category: 'báo cáo',
        sourceText: 'Các tổ trưởng gửi báo cáo tiến độ bằng văn bản trước ngày thứ Năm tuần này.',
        confidence: 0.91,
      },
    ];
  }

  return {
    id: generateId(),
    deadlines: deadlines.map((dl) => ({ ...dl, sourceFile: fileName })),
    documentSummary,
    documentType,
    rawText: parsedText || 'Nội dung văn bản được giả lập thành công.',
    fileName,
    fileSize: 154200,
    fileType: fileName.split('.').pop()?.toUpperCase() || 'PDF',
    analyzedAt: new Date().toISOString(),
    processingTime: 1250,
  };
}
