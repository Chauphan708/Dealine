'use client';

// ============================================
// DeadlineGuard — FileUploader Component
// ============================================

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  File,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Button from '../common/Button';
import { formatFileSize, getFileIcon } from '@/lib/utils/helpers';
import { useToast } from '../common/Toast';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  progress: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  isProcessing,
  progress,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.xls', '.txt', '.csv'];
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;

      if (allowedExtensions.includes(extension) || file.type.includes('text/plain') || file.type.includes('spreadsheet')) {
        // Prevent duplicate files in active list
        if (!selectedFiles.some((f) => f.name === file.name && f.size === file.size)) {
          newFiles.push(file);
        }
      } else {
        toast(`Định dạng file ${file.name} không hỗ trợ!`, 'warning');
      }
    }

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      toast(`Đã chọn ${newFiles.length} file tài liệu.`, 'success');
    }
  }, [selectedFiles, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    toast('Đã gỡ bỏ file khỏi hàng đợi.', 'info');
  };

  const handleAnalyze = () => {
    if (selectedFiles.length === 0) {
      toast('Vui lòng chọn ít nhất 1 file để phân tích.', 'warning');
      return;
    }
    onFilesSelected(selectedFiles);
    // Keep files selected so user sees history, or clear them on successful analysis in parent
  };

  const clearQueue = () => {
    setSelectedFiles([]);
    toast('Đã xóa danh sách hàng đợi tài liệu.', 'info');
  };

  // Icon coloring for visual feedback
  const getFileClass = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'file-icon-pdf';
    if (ext === 'docx' || ext === 'doc') return 'file-icon-docx';
    if (ext === 'xlsx' || ext === 'xls') return 'file-icon-xlsx';
    return 'file-icon-txt';
  };

  return (
    <div className="file-uploader-wrapper" id="file-uploader-root">
      {/* Drop Zone Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`upload-zone glass-card ${dragActive ? 'drag-active' : ''} ${isProcessing ? 'disabled' : ''}`}
        id="upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.csv"
          className="hidden"
          disabled={isProcessing}
        />

        <div className="upload-zone-content">
          <div className="upload-icon-container">
            <UploadCloud size={42} className="upload-cloud-icon" />
          </div>
          <h3 className="upload-zone-title">Kéo & Thả tài liệu công văn của bạn ở đây</h3>
          <p className="upload-zone-subtitle">
            Hỗ trợ file PDF, Word (docx), Excel (xlsx/csv) hoặc văn bản thô (txt) tối đa 10MB
          </p>

          <Button
            id="btn-trigger-file-select"
            variant="secondary"
            onClick={onButtonClick}
            disabled={isProcessing}
            className="btn-select-file"
          >
            Duyệt file trên thiết bị
          </Button>
        </div>
      </div>

      {/* Selected file preview queue */}
      {selectedFiles.length > 0 && (
        <div className="selected-files-list-section glass-card" id="files-queue-container">
          <div className="queue-header">
            <h4 className="queue-title">Danh sách tài liệu cần trích xuất ({selectedFiles.length})</h4>
            {!isProcessing && (
              <button onClick={clearQueue} className="btn-clear-queue" id="btn-clear-queue">
                Xóa tất cả
              </button>
            )}
          </div>

          <div className="files-queue-grid">
            {selectedFiles.map((file, index) => (
              <div key={index} className="queue-file-card glass-card">
                <div className="queue-file-info">
                  <div className={`queue-file-icon ${getFileClass(file.name)}`}>
                    <File size={18} />
                  </div>
                  <div className="queue-file-name-block">
                    <span className="queue-file-name" title={file.name}>
                      {file.name}
                    </span>
                    <span className="queue-file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>

                {!isProcessing && (
                  <button
                    onClick={() => removeFile(index)}
                    className="queue-file-remove-btn"
                    id={`btn-remove-queue-${index}`}
                    aria-label="Remove file"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* AI Trigger button & Progress */}
          <div className="queue-footer">
            {isProcessing ? (
              <div className="ai-processing-container">
                <div className="processing-status-row">
                  <div className="status-label">
                    <Sparkles size={16} className="sparkle-spinning" />
                    <span>Trợ lý AI đang đọc và trích xuất thông tin hạn chót...</span>
                  </div>
                  <span className="progress-percent">{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            ) : (
              <Button
                id="btn-start-ai-extraction"
                variant="primary"
                onClick={handleAnalyze}
                icon={<Sparkles size={16} />}
                className="btn-run-ai-processing"
                style={{ width: '100%' }}
              >
                Trích xuất thời hạn bằng Trí tuệ Nhân tạo (Gemini AI)
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
