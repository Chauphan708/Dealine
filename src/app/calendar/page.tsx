'use client';

// ============================================
// DeadlineGuard — Calendar Page
// ============================================

import React, { useState } from 'react';
import { useDeadlines } from '@/hooks/useDeadlines';
import CalendarView from '@/components/calendar/CalendarView';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { format } from 'date-fns';
import type { Deadline } from '@/types';

export default function CalendarPage() {
  const { deadlines, loading } = useDeadlines();
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);

  const handleDeadlineClick = (deadline: Deadline) => {
    setSelectedDeadline(deadline);
  };

  const handleCloseModal = () => {
    setSelectedDeadline(null);
  };

  return (
    <div className="calendar-page-container" id="calendar-page-root" style={{ width: '100%', height: '100%' }}>
      {loading ? (
        <div className="calendar-loading-skeleton glass-card shine" style={{ height: '500px', width: '100%' }}>
          <div className="skeleton-line" style={{ width: '200px', height: '30px', margin: '20px' }}></div>
          <div className="skeleton-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', padding: '20px' }}>
            {[...Array(35)].map((_, i) => (
              <div key={i} className="skeleton-line" style={{ height: '70px', borderRadius: '8px' }}></div>
            ))}
          </div>
        </div>
      ) : (
        <CalendarView deadlines={deadlines} onDeadlineClick={handleDeadlineClick} />
      )}

      {/* Deadline Detail Expansion Modal */}
      <Modal
        id="calendar-deadline-detail-modal"
        isOpen={selectedDeadline !== null}
        onClose={handleCloseModal}
        title="Chi tiết mốc thời hạn công việc"
        footer={
          <Button id="btn-calendar-modal-close" variant="secondary" onClick={handleCloseModal}>
            Đóng lại
          </Button>
        }
      >
        {selectedDeadline && (
          <div className="calendar-modal-detail-flow" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="detail-header-group">
              <h3 className="static-item-title" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {selectedDeadline.title}
              </h3>
              <div className="badge-row" style={{ display: 'flex', gap: '8px' }}>
                <Badge type="priority" value={selectedDeadline.priority} size="sm" />
                <Badge type="status" value={selectedDeadline.status} size="sm" />
                <Badge type="category" value={selectedDeadline.category} size="sm" />
              </div>
            </div>

            <hr className="divider" style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }} />

            <div className="detail-section">
              <span className="field-label" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Thời gian hết hạn chót:
              </span>
              <p className="field-value" style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                {format(new Date(selectedDeadline.deadlineDate), 'HH:mm - eeee, dd/MM/yyyy')}
              </p>
            </div>

            <div className="detail-section">
              <span className="field-label" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Mô tả chi tiết:
              </span>
              <p className="field-value" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedDeadline.description}
              </p>
            </div>

            {selectedDeadline.sourceText && (
              <div className="detail-section" style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--accent-primary)' }}>
                <span className="field-label" style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Đoạn trích văn bản gốc chứa thông tin:
                </span>
                <p className="field-value" style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  "{selectedDeadline.sourceText}"
                </p>
              </div>
            )}

            {selectedDeadline.sourceFile && (
              <div className="detail-section">
                <span className="field-label" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Nguồn tài liệu gốc:
                </span>
                <p className="field-value" style={{ fontWeight: 500, fontSize: '13px' }}>
                  📄 {selectedDeadline.sourceFile}
                </p>
              </div>
            )}

            {selectedDeadline.notes && (
              <div className="detail-section">
                <span className="field-label" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Ghi chú cá nhân:
                </span>
                <p className="field-value" style={{ color: 'var(--text-secondary)' }}>
                  {selectedDeadline.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
