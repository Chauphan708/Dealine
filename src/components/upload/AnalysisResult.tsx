'use client';

// ============================================
// DeadlineGuard — AnalysisResult Component
// ============================================

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  AlertTriangle,
  Save,
  CheckSquare,
  Square,
  Sparkles,
  Edit2,
  Check,
} from 'lucide-react';
import type { DocumentAnalysis, Deadline, Priority } from '@/types';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useToast } from '../common/Toast';
import { format } from 'date-fns';

interface AnalysisResultProps {
  analysis: DocumentAnalysis;
  onSave: (selectedDeadlines: Omit<Deadline, 'id' | 'status' | 'reminders' | 'tags' | 'notes' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  onCancel: () => void;
}

type EditableDeadline = DocumentAnalysis['deadlines'][number] & {
  selected: boolean;
  isEditing: boolean;
};

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
  analysis,
  onSave,
  onCancel,
}) => {
  const [items, setItems] = useState<EditableDeadline[]>([]);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize editable local state from props
  useEffect(() => {
    if (analysis && analysis.deadlines) {
      setItems(
        analysis.deadlines.map((dl) => ({
          ...dl,
          selected: true, // Select all by default
          isEditing: false,
        })),
      );
    }
  }, [analysis]);

  const toggleSelect = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item)),
    );
  };

  const toggleSelectAll = () => {
    const allSelected = items.every((i) => i.selected);
    setItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const toggleEdit = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, isEditing: !item.isEditing } : item)),
    );
  };

  const handleFieldChange = (index: number, field: keyof EditableDeadline, value: string | number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleSaveSelected = async () => {
    const selected = items.filter((i) => i.selected);

    if (selected.length === 0) {
      toast('Vui lòng chọn ít nhất 1 thời hạn để lưu!', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      // Construct deadlines payloads
      const payloads = selected.map((item) => ({
        title: item.title,
        description: item.description,
        deadlineDate: item.deadlineDate,
        priority: item.priority,
        category: item.category,
        sourceText: item.sourceText,
        sourceFile: analysis.fileName,
        confidence: item.confidence,
      }));

      await onSave(payloads);
      toast(`Đã lưu thành công ${selected.length} hạn chót công việc vào cơ sở dữ liệu! 📁`, 'success');
    } catch (error) {
      console.error(error);
      toast('Lỗi khi lưu hạn chót tài liệu.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = items.filter((i) => i.selected).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  return (
    <div className="analysis-result-section" id="analysis-result-root">
      {/* 1. Document Summary Card */}
      <div className="analysis-doc-summary-card glass-card">
        <div className="summary-header">
          <div className="summary-doc-icon">
            <FileText size={24} />
          </div>
          <div className="summary-title-block">
            <h3 className="summary-doc-title">Kết quả phân tích tài liệu bằng Trí tuệ Nhân tạo</h3>
            <p className="summary-doc-meta">
              Tên file: <strong>{analysis.fileName}</strong> | Loại văn bản trích xuất:{' '}
              <span className="doc-type-highlight">{analysis.documentType}</span>
            </p>
          </div>
        </div>

        <div className="summary-body-section">
          <h4 className="summary-block-label">Tóm tắt nội dung văn bản:</h4>
          <p className="summary-block-value">{analysis.documentSummary}</p>
        </div>

        {analysis.processingTime && (
          <div className="summary-footer-meta">
            <Sparkles size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>AI hoàn tất phân tích trong {(analysis.processingTime / 1000).toFixed(2)}s</span>
          </div>
        )}
      </div>

      {/* 2. Extracted Deadlines Section Header */}
      <div className="extracted-deadlines-container-header">
        <div className="extracted-header-left">
          <h3 className="extracted-title">Các mốc thời hạn được phát hiện ({items.length})</h3>
          <p className="extracted-subtitle">Rà soát và chỉnh sửa thông tin trực tiếp trước khi phê duyệt lưu</p>
        </div>

        <div className="extracted-header-actions">
          <Button
            id="btn-select-all-extracted"
            variant="ghost"
            size="sm"
            onClick={toggleSelectAll}
            icon={allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          >
            {allSelected ? 'Bỏ chọn hết' : 'Chọn tất cả'}
          </Button>
        </div>
      </div>

      {/* 3. Deadlines List */}
      <div className="extracted-deadlines-list" id="extracted-deadlines-grid">
        {items.map((item, index) => (
          <div
            key={index}
            className={`extracted-deadline-item-card glass-card ${item.selected ? 'item-selected' : ''}`}
            id={`extracted-item-${index}`}
          >
            {/* Selection Checkbox */}
            <button
              onClick={() => toggleSelect(index)}
              className="extracted-item-checkbox-btn"
              id={`checkbox-item-${index}`}
            >
              {item.selected ? (
                <CheckSquare size={22} className="checkbox-icon-selected" />
              ) : (
                <Square size={22} className="checkbox-icon-default" />
              )}
            </button>

            {/* Extracted content */}
            <div className="extracted-item-content">
              {item.isEditing ? (
                /* Editable form state */
                <div className="extracted-item-edit-form">
                  <div className="edit-form-field">
                    <label className="field-label">Tiêu đề công việc:</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                      className="edit-field-input"
                    />
                  </div>

                  <div className="edit-form-grid-row">
                    <div className="edit-form-field">
                      <label className="field-label">Thời hạn chót (ISO):</label>
                      <input
                        type="datetime-local"
                        // Convert ISO string to date-local formatted value
                        value={
                          item.deadlineDate ? item.deadlineDate.substring(0, 16) : ''
                        }
                        onChange={(e) => {
                          const iso = new Date(e.target.value).toISOString();
                          handleFieldChange(index, 'deadlineDate', iso);
                        }}
                        className="edit-field-input"
                      />
                    </div>

                    <div className="edit-form-field">
                      <label className="field-label">Mức ưu tiên:</label>
                      <select
                        value={item.priority}
                        onChange={(e) => handleFieldChange(index, 'priority', e.target.value as Priority)}
                        className="edit-field-select"
                      >
                        <option value="critical">Khẩn cấp</option>
                        <option value="high">Quan trọng</option>
                        <option value="medium">Trung bình</option>
                        <option value="low">Thấp</option>
                      </select>
                    </div>

                    <div className="edit-form-field">
                      <label className="field-label">Phân loại:</label>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => handleFieldChange(index, 'category', e.target.value)}
                        className="edit-field-input"
                      />
                    </div>
                  </div>

                  <div className="edit-form-field">
                    <label className="field-label">Mô tả công việc:</label>
                    <textarea
                      rows={3}
                      value={item.description}
                      onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                      className="edit-field-textarea"
                    />
                  </div>
                </div>
              ) : (
                /* Static view state */
                <div className="extracted-item-static-view">
                  <div className="static-view-header-row">
                    <h4 className="static-item-title">{item.title}</h4>
                    <div className="static-item-badges">
                      <Badge type="priority" value={item.priority} size="sm" />
                      <Badge type="category" value={item.category} size="sm" />
                      {item.confidence && (
                        <span className="extracted-confidence-badge" title="Độ tin cậy của AI">
                          AI: {Math.round(item.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="static-item-desc">{item.description}</p>

                  <div className="static-item-meta-footer">
                    <div className="meta-time-pill">
                      <Calendar size={13} style={{ marginRight: '4px' }} />
                      <span>
                        Hạn chót:{' '}
                        <strong>
                          {format(new Date(item.deadlineDate), 'HH:mm dd/MM/yyyy')}
                        </strong>
                      </span>
                    </div>

                    {item.sourceText && (
                      <div className="meta-source-text-block">
                        <span className="source-label">Văn bản trích dẫn nguồn:</span>
                        <p className="source-snippet">"{item.sourceText}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Edit action button */}
            <div className="extracted-item-edit-action-btn">
              <Button
                id={`btn-edit-extracted-${index}`}
                variant="ghost"
                size="sm"
                onClick={() => toggleEdit(index)}
                className="btn-edit-item"
                icon={item.isEditing ? <Check size={16} /> : <Edit2 size={16} />}
              >
                {item.isEditing ? 'Xong' : 'Chỉnh sửa'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Action bar footer */}
      <div className="analysis-result-action-bar-footer">
        <Button id="btn-cancel-import" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Quay lại tải lên
        </Button>

        <div className="action-bar-right-group" style={{ display: 'flex', gap: '12px' }}>
          <Button
            id="btn-save-selected-extracted"
            variant="primary"
            onClick={handleSaveSelected}
            loading={isSaving}
            icon={<Save size={16} />}
          >
            Lưu {selectedCount} hạn chót đã chọn
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
