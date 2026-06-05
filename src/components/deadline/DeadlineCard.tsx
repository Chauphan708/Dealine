'use client';

// ============================================
// DeadlineGuard — DeadlineCard Component
// ============================================

import React, { useState } from 'react';
import {
  Check,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  AlertCircle,
  Undo2,
  Plus,
} from 'lucide-react';
import type { Deadline, Priority } from '@/types';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatRelativeTime, isOverdue } from '@/lib/utils/dateUtils';
import { format } from 'date-fns';
import { useToast } from '../common/Toast';

interface DeadlineCardProps {
  deadline: Deadline;
  onToggleComplete: (id: string) => Promise<void>;
  onSnooze: (id: string, hours: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const DeadlineCard: React.FC<DeadlineCardProps> = ({
  deadline,
  onToggleComplete,
  onSnooze,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { toast } = useToast();

  const isCompleted = deadline.status === 'completed';
  const isExpired = isOverdue(deadline.deadlineDate) && !isCompleted;

  // Formatting date
  const rawDate = new Date(deadline.deadlineDate);
  const formattedDateString = isNaN(rawDate.getTime())
    ? deadline.deadlineDate
    : format(rawDate, 'HH:mm dd/MM/yyyy');

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoadingAction('complete');
      await onToggleComplete(deadline.id);
      toast(
        isCompleted
          ? 'Đã mở lại thời hạn công việc.'
          : 'Chúc mừng bạn đã hoàn thành công việc đúng hạn! 🎉',
        'success',
      );
    } catch {
      toast('Lỗi khi cập nhật trạng thái.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSnooze = async (hours: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoadingAction('snooze');
      await onSnooze(deadline.id, hours);
      setShowSnoozeOptions(false);
      toast(`Đã dời thời hạn thêm ${hours} giờ. ⏰`, 'success');
    } catch {
      toast('Lỗi khi tạm hoãn thời hạn.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa deadline "${deadline.title}"?`)) {
      try {
        setLoadingAction('delete');
        await onDelete(deadline.id);
        toast('Đã xóa thời hạn công việc thành công.', 'info');
      } catch {
        toast('Lỗi khi xóa thời hạn.', 'error');
      } finally {
        setLoadingAction(null);
      }
    }
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`deadline-card glass-card ${isCompleted ? 'completed' : ''} ${isExpired ? 'overdue-pulse' : ''}`}
      id={`deadline-card-${deadline.id}`}
      style={{
        borderLeft: `5px solid var(--accent-${deadline.priority === 'critical' ? 'danger' : deadline.priority === 'high' ? 'warning' : deadline.priority === 'medium' ? 'primary' : 'secondary'})`,
      }}
    >
      {/* Top Main Row */}
      <div className="deadline-card-header">
        <div className="deadline-card-title-sec">
          <h3 className={`deadline-title ${isCompleted ? 'line-through text-muted' : ''}`}>
            {deadline.title}
          </h3>

          <div className="deadline-badge-row">
            <Badge type="priority" value={deadline.priority} size="sm" />
            <Badge type="status" value={isCompleted ? 'completed' : isExpired ? 'overdue' : deadline.status} size="sm" />
            <Badge type="category" value={deadline.category} size="sm" />
          </div>
        </div>

        {/* Countdown display */}
        <div className="deadline-countdown-section">
          {!isCompleted && (
            <div className={`deadline-countdown ${isExpired ? 'text-danger countdown-pulse' : 'text-primary'}`}>
              <AlertCircle size={14} style={{ marginRight: '4px' }} />
              <span>{formatRelativeTime(deadline.deadlineDate)}</span>
            </div>
          )}
          <span className="deadline-due-date">{formattedDateString}</span>
        </div>
      </div>

      {/* Description Preview */}
      <p className="deadline-description-preview">
        {deadline.description.length > 150
          ? `${deadline.description.slice(0, 150)}...`
          : deadline.description}
      </p>

      {/* Source file tag */}
      {deadline.sourceFile && (
        <div className="deadline-source-file-tag">
          <FileText size={12} style={{ marginRight: '4px' }} />
          <span>{deadline.sourceFile}</span>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="deadline-card-expanded-content">
          <hr className="divider" />

          <div className="expanded-section">
            <h4 className="section-label">Mô tả đầy đủ:</h4>
            <p className="section-value">{deadline.description}</p>
          </div>

          {deadline.sourceText && (
            <div className="expanded-section source-text-container">
              <h4 className="section-label">Đoạn trích nguồn:</h4>
              <p className="section-value italic">"{deadline.sourceText}"</p>
            </div>
          )}

          {deadline.notes && (
            <div className="expanded-section notes-container">
              <h4 className="section-label">Ghi chú cá nhân:</h4>
              <p className="section-value">{deadline.notes}</p>
            </div>
          )}

          <div className="expanded-meta-grid">
            <div className="meta-item">
              <Calendar size={12} />
              <span>Tạo lúc: {format(new Date(deadline.createdAt), 'dd/MM/yyyy HH:mm')}</span>
            </div>
            {deadline.confidence < 1 && (
              <div className="meta-item">
                <span>Độ tin cậy trích xuất: {Math.round(deadline.confidence * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Action footer bar */}
      <div className="deadline-card-footer" onClick={(e) => e.stopPropagation()}>
        {/* Toggle Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn-expand-details"
          id={`deadline-expand-${deadline.id}`}
        >
          {expanded ? (
            <>
              Thu gọn <ChevronUp size={14} />
            </>
          ) : (
            <>
              Xem chi tiết <ChevronDown size={14} />
            </>
          )}
        </button>

        {/* Action button row */}
        <div className="deadline-action-btn-row">
          {/* Snooze button with absolute dropdown overlay */}
          {!isCompleted && (
            <div className="snooze-dropdown-wrapper">
              <Button
                id={`deadline-snooze-trigger-${deadline.id}`}
                variant="ghost"
                size="sm"
                className="btn-snooze"
                icon={<Clock size={15} />}
                onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                loading={loadingAction === 'snooze'}
              >
                Hoãn lại
              </Button>

              {showSnoozeOptions && (
                <div className="snooze-options-menu glass-card">
                  <button
                    onClick={(e) => handleSnooze(1, e)}
                    className="snooze-option-item"
                  >
                    +1 giờ
                  </button>
                  <button
                    onClick={(e) => handleSnooze(3, e)}
                    className="snooze-option-item"
                  >
                    +3 giờ
                  </button>
                  <button
                    onClick={(e) => handleSnooze(24, e)}
                    className="snooze-option-item"
                  >
                    +24 giờ (1 ngày)
                  </button>
                  <button
                    onClick={(e) => handleSnooze(72, e)}
                    className="snooze-option-item"
                  >
                    +72 giờ (3 ngày)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Toggle Done Button */}
          <Button
            id={`deadline-complete-${deadline.id}`}
            variant={isCompleted ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleToggleComplete}
            icon={isCompleted ? <Undo2 size={15} /> : <Check size={15} />}
            loading={loadingAction === 'complete'}
          >
            {isCompleted ? 'Mở lại' : 'Hoàn thành'}
          </Button>

          {/* Delete Button */}
          <Button
            id={`deadline-delete-${deadline.id}`}
            variant="danger"
            size="sm"
            onClick={handleDelete}
            icon={<Trash2 size={15} />}
            loading={loadingAction === 'delete'}
          >
            Xóa
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeadlineCard;
