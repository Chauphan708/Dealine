'use client';

// ============================================
// DeadlineGuard — Dashboard Page (Main Page)
// ============================================

import React, { useState } from 'react';
import { useDeadlines } from '@/hooks/useDeadlines';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useSettings } from '@/hooks/useSettings';
import DeadlineList from '@/components/deadline/DeadlineList';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import { getGreeting } from '@/lib/utils/dateUtils';
import {
  Plus,
  Sparkles,
  FileUp,
  Link2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/common/Toast';
import { disconnectDrive } from '@/lib/google/driveService';

export default function Home() {
  const { t, language } = useI18n();
  const {
    deadlines,
    loading,
    categories,
    filters,
    sortBy,
    updateFilters,
    updateSort,
    toggleComplete,
    snooze,
    deleteItem,
    createManualDeadline,
    stats,
  } = useDeadlines();

  const { toast } = useToast();
  const { settings, updateSettings } = useSettings();

  const handleDisconnectDrive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      disconnectDrive();
      await updateSettings({
        googleDriveConnected: false,
        googleDriveFolderId: '',
      });
      localStorage.removeItem('dg_drive_last_sync');
      localStorage.removeItem('dg_drive_file_count');
      toast('Đã ngắt kết nối với Google Drive.', 'info');
    } catch {
      toast('Ngắt kết nối thất bại.', 'error');
    }
  };

  // Manual Add Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [category, setCategory] = useState('dự án');
  const [sourceFile, setSourceFile] = useState('Thêm thủ công');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const greeting = getGreeting(language);

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    try {
      setSubmitting(true);
      await createManualDeadline({
        title,
        description: desc,
        deadlineDate: new Date(date).toISOString(),
        priority,
        category: category || 'Khác',
        sourceText: 'Tạo thủ công bởi người dùng',
        sourceFile,
        confidence: 1.0,
        tags: [category],
        notes,
      });

      // Reset
      setTitle('');
      setDesc('');
      setDate('');
      setPriority('medium');
      setCategory('dự án');
      setNotes('');
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Top 5 upcoming deadlines
  const upcomingFive = deadlines.filter((d) => d.status !== 'completed').slice(0, 5);

  return (
    <div className="dashboard-page-container" id="dashboard-root">
      {/* 1. Welcome Greeting Banner */}
      <div className="dashboard-welcome-banner glass-card">
        <div className="welcome-left-col">
          <div className="banner-ai-sparkle">
            <Sparkles size={20} className="sparkle-grow" />
          </div>
          <div className="welcome-text-block">
            <h2 className="welcome-title">
              {greeting}, Administrator
            </h2>
            <p className="welcome-subtitle">
              Hệ thống hiện ghi nhận **{stats.overdue} việc quá hạn** và **{stats.upcoming} việc sắp tới**. Hãy rà soát lịch làm việc của bạn ngay nhé!
            </p>
          </div>
        </div>

        {/* Quick action main button */}
        <div className="welcome-right-action-col">
          <Button
            id="btn-trigger-manual-add"
            variant="primary"
            onClick={() => setModalOpen(true)}
            icon={<Plus size={18} />}
          >
            Thêm hạn chót mới
          </Button>
        </div>
      </div>

      {/* 2. Top Overview Cards */}
      <div className="stats-cards-grid">
        <div className="stat-card glass-card">
          <div className="card-top-row">
            <span className="card-title">Cần làm hôm nay</span>
            <span className="card-dot-active" style={{ backgroundColor: 'var(--accent-danger)' }}></span>
          </div>
          <span className="card-main-number">{deadlines.filter((d) => d.status !== 'completed' && new Date(d.deadlineDate) <= new Date(Date.now() + 24*60*60*1000)).length}</span>
          <p className="card-trend-info text-danger">Hãy ưu tiên giải quyết</p>
        </div>

        <div className="stat-card glass-card">
          <div className="card-top-row">
            <span className="card-title">Hạn chót tuần này</span>
            <span className="card-dot-active" style={{ backgroundColor: 'var(--accent-warning)' }}></span>
          </div>
          <span className="card-main-number text-warning">{stats.upcoming}</span>
          <p className="card-trend-info text-warning">Đã lên kế hoạch tự động</p>
        </div>

        <div className="stat-card glass-card">
          <div className="card-top-row">
            <span className="card-title">Công việc quá hạn</span>
            <span className="card-dot-active" style={{ backgroundColor: 'var(--accent-danger)' }}></span>
          </div>
          <span className="card-main-number text-danger">{stats.overdue}</span>
          <p className="card-trend-info text-danger">Yêu cầu hoàn thành gấp</p>
        </div>

        <div className="stat-card glass-card">
          <div className="card-top-row">
            <span className="card-title">Đã hoàn thành</span>
            <span className="card-dot-active" style={{ backgroundColor: 'var(--accent-success)' }}></span>
          </div>
          <span className="card-main-number text-success">{stats.completedOnTime}</span>
          <p className="card-trend-info text-success">
            Đạt {Math.round(stats.completionRate * 100) || 0}% hoàn thành
          </p>
        </div>
      </div>

      {/* 3. Main Split Grid */}
      <div className="dashboard-grid-layout-main">
        {/* Left column: Full Deadline Interactive List */}
        <div className="dashboard-left-col-list">
          <div className="section-title-header">
            <h3 className="section-heading-title">Danh sách hạn chót cần xử lý</h3>
          </div>
          <DeadlineList
            deadlines={deadlines}
            categories={categories}
            filters={filters}
            sortBy={sortBy}
            updateFilters={updateFilters}
            updateSort={updateSort}
            onToggleComplete={toggleComplete}
            onSnooze={snooze}
            onDelete={deleteItem}
            loading={loading}
            onOpenManualModal={() => setModalOpen(true)}
          />
        </div>

        {/* Right column: Upcoming timeline & Quick link cards */}
        <div className="dashboard-right-col-timeline">
          {/* Quick link cards */}
          <div className="quick-actions-panel-cards">
            <h3 className="timeline-heading-title" style={{ marginBottom: '16px' }}>Thao tác nhanh</h3>

            <div className="quick-action-cards-list">
              <Link href="/documents" className="action-card glass-card hover-glow">
                <div className="action-card-left">
                  <div className="action-card-icon bg-success">
                    <FileUp size={18} />
                  </div>
                  <div className="action-card-info">
                    <h4 className="card-title">Phân tích văn bản AI</h4>
                    <p className="card-desc">Tải lên PDF/Word/Excel trích xuất mốc thời hạn</p>
                  </div>
                </div>
                <ArrowRight size={16} className="arrow-icon" />
              </Link>

              {settings.googleDriveConnected ? (
                <div className="action-card glass-card connected-card">
                  <div className="action-card-left">
                    <div className="action-card-icon bg-primary">
                      <Link2 size={18} />
                    </div>
                    <div className="action-card-info">
                      <h4 className="card-title">Đồng bộ Google Drive</h4>
                      <p className="card-desc" style={{ color: 'var(--accent-success)', fontWeight: 500 }}>
                        ● Đang kết nối tài khoản
                      </p>
                    </div>
                  </div>
                  <div className="card-action-buttons">
                    <button
                      className="btn-quick-disconnect"
                      onClick={handleDisconnectDrive}
                      id="btn-dashboard-disconnect"
                    >
                      Hủy liên kết
                    </button>
                    <Link href="/settings" className="btn-quick-config">
                      Cấu hình
                    </Link>
                  </div>
                </div>
              ) : (
                <Link href="/settings" className="action-card glass-card hover-glow">
                  <div className="action-card-left">
                    <div className="action-card-icon bg-primary">
                      <Link2 size={18} />
                    </div>
                    <div className="action-card-info">
                      <h4 className="card-title">Đồng bộ Google Drive</h4>
                      <p className="card-desc">Kết nối tự động theo dõi NotebookLM</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="arrow-icon" />
                </Link>
              )}
            </div>
          </div>

          {/* Mini Timeline of upcoming events */}
          <div className="timeline-upcoming-panel glass-card">
            <h3 className="timeline-heading-title">Mốc thời gian sắp tới</h3>

            <div className="timeline-vertical-flow">
              {upcomingFive.length === 0 ? (
                <div className="timeline-empty">
                  <span>Tuyệt vời! Không có mốc công việc khẩn cấp sắp diễn ra.</span>
                </div>
              ) : (
                upcomingFive.map((dl) => (
                  <div key={dl.id} className="timeline-flow-node" id={`timeline-${dl.id}`}>
                    <div className={`node-bullet bullet-priority-${dl.priority}`} />
                    <div className="node-content-box">
                      <span className="node-time">
                        {new Date(dl.deadlineDate).toLocaleDateString('vi-VN')}
                      </span>
                      <h4 className="node-title truncate">{dl.title}</h4>
                      <div className="node-badge-row">
                        <Badge type="priority" value={dl.priority} size="sm" />
                        <Badge type="category" value={dl.category} size="sm" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Manual Add Modal */}
      <Modal
        id="manual-add-deadline-modal"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thêm thủ công hạn chót công việc"
        footer={
          <div className="modal-footer-btns">
            <Button id="btn-modal-cancel" variant="ghost" onClick={() => setModalOpen(false)}>
              Quay lại
            </Button>
            <Button
              id="btn-modal-submit"
              variant="primary"
              onClick={handleManualAddSubmit}
              loading={submitting}
              disabled={!title || !date}
            >
              Lên lịch nhắc việc
            </Button>
          </div>
        }
      >
        <form onSubmit={handleManualAddSubmit} className="modal-form-grid">
          <div className="form-field">
            <label className="field-label">Tiêu đề hạn chót *</label>
            <input
              id="manual-input-title"
              type="text"
              required
              placeholder="VD: Nộp báo cáo kiểm toán doanh nghiệp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="edit-field-input"
            />
          </div>

          <div className="form-field-grid-row">
            <div className="form-field">
              <label className="field-label">Hạn chót thời gian *</label>
              <input
                id="manual-input-date"
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="edit-field-input"
              />
            </div>

            <div className="form-field">
              <label className="field-label">Mức ưu tiên</label>
              <select
                id="manual-select-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="edit-field-select"
              >
                <option value="critical">Khẩn cấp 🔴</option>
                <option value="high">Quan trọng 🟠</option>
                <option value="medium">Trung bình 🔵</option>
                <option value="low">Thấp ⚪</option>
              </select>
            </div>
          </div>

          <div className="form-field-grid-row">
            <div className="form-field">
              <label className="field-label">Chủ đề phân loại</label>
              <input
                id="manual-input-category"
                type="text"
                placeholder="VD: Hợp đồng, Thuế, Họp..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="edit-field-input"
              />
            </div>

            <div className="form-field">
              <label className="field-label">Tài liệu đính kèm (Nguồn)</label>
              <input
                id="manual-input-source"
                type="text"
                value={sourceFile}
                onChange={(e) => setSourceFile(e.target.value)}
                className="edit-field-input"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">Nội dung chi tiết mô tả</label>
            <textarea
              id="manual-input-desc"
              rows={3}
              placeholder="Nhập nội dung yêu cầu chi tiết cần thực hiện..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="edit-field-textarea"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Ghi chú thêm</label>
            <input
              id="manual-input-notes"
              type="text"
              placeholder="VD: Cần phối hợp với phòng Kế toán"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="edit-field-input"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
