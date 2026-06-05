'use client';

// ============================================
// DeadlineGuard — DeadlineList Component
// ============================================

import React from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  AlertOctagon,
  Sparkles,
  Inbox,
  Plus,
} from 'lucide-react';
import type { Deadline, Priority, DeadlineStatus } from '@/types';
import DeadlineCard from './DeadlineCard';
import Button from '../common/Button';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { DeadlineFilter, DeadlineSortBy } from '@/hooks/useDeadlines';

interface DeadlineListProps {
  deadlines: Deadline[];
  categories: string[];
  filters: DeadlineFilter;
  sortBy: DeadlineSortBy;
  updateFilters: (filters: Partial<DeadlineFilter>) => void;
  updateSort: (sort: DeadlineSortBy) => void;
  onToggleComplete: (id: string) => Promise<void>;
  onSnooze: (id: string, hours: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
  onOpenManualModal?: () => void;
}

export const DeadlineList: React.FC<DeadlineListProps> = ({
  deadlines,
  categories,
  filters,
  sortBy,
  updateFilters,
  updateSort,
  onToggleComplete,
  onSnooze,
  onDelete,
  loading,
  onOpenManualModal,
}) => {
  const { t } = useI18n();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value });
  };

  const handlePriorityFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ priority: e.target.value as Priority | 'all' });
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ status: e.target.value as DeadlineStatus | 'all' });
  };

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ category: e.target.value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSort(e.target.value as DeadlineSortBy);
  };

  const clearFilters = () => {
    updateFilters({
      priority: 'all',
      status: 'all',
      category: 'all',
      search: '',
    });
  };

  const hasActiveFilters =
    filters.priority !== 'all' ||
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.search !== '';

  return (
    <div className="deadline-list-section" id="deadline-list-wrapper">
      {/* Search and Filters Bar */}
      <div className="filters-control-bar glass-card">
        {/* Search */}
        <div className="filter-search-box">
          <Search size={18} className="search-icon-inline" />
          <input
            id="list-search-input"
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder={t('common.search') || 'Tìm kiếm hạn chót...'}
            className="filter-text-input"
          />
        </div>

        {/* Filters dropdowns */}
        <div className="filter-dropdowns-group">
          {/* Priority */}
          <div className="select-container">
            <Filter size={14} className="select-icon" />
            <select
              id="filter-priority-select"
              value={filters.priority}
              onChange={handlePriorityFilter}
              className="filter-select"
            >
              <option value="all">Mức ưu tiên (Tất cả)</option>
              <option value="critical">Khẩn cấp 🔴</option>
              <option value="high">Quan trọng 🟠</option>
              <option value="medium">Trung bình 🔵</option>
              <option value="low">Thấp ⚪</option>
            </select>
          </div>

          {/* Status */}
          <div className="select-container">
            <select
              id="filter-status-select"
              value={filters.status}
              onChange={handleStatusFilter}
              className="filter-select"
            >
              <option value="all">Trạng thái (Tất cả)</option>
              <option value="pending">Chờ thực hiện</option>
              <option value="overdue">Quá hạn ⚠️</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="snoozed">Tạm hoãn</option>
            </select>
          </div>

          {/* Category */}
          <div className="select-container">
            <select
              id="filter-category-select"
              value={filters.category}
              onChange={handleCategoryFilter}
              className="filter-select"
            >
              <option value="all">Phân loại (Tất cả)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="select-container">
            <ArrowUpDown size={14} className="select-icon" />
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={handleSortChange}
              className="filter-select"
            >
              <option value="date">Sắp xếp: Ngày hạn chót 📅</option>
              <option value="priority">Sắp xếp: Mức ưu tiên 🔥</option>
              <option value="status">Sắp xếp: Trạng thái 📌</option>
              <option value="created">Sắp xếp: Ngày tạo mới nhất 🆕</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              id="btn-clear-filters"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="btn-clear-all"
            >
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Main List Rendering */}
      {loading ? (
        /* Loading Skeleton list */
        <div className="deadline-skeleton-list" id="skeleton-list">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-card glass-card shine">
              <div className="skeleton-header">
                <div className="skeleton-line title" />
                <div className="skeleton-line countdown" />
              </div>
              <div className="skeleton-body">
                <div className="skeleton-line body" style={{ width: '80%' }} />
                <div className="skeleton-line body" style={{ width: '60%', marginTop: '8px' }} />
              </div>
              <div className="skeleton-footer">
                <div className="skeleton-line tag" />
                <div className="skeleton-line btns" />
              </div>
            </div>
          ))}
        </div>
      ) : deadlines.length === 0 ? (
        /* Empty State */
        <div className="deadline-empty-state glass-card" id="empty-state-card">
          <div className="empty-state-icon-container">
            <Inbox size={48} className="empty-state-icon" />
          </div>
          <h3 className="empty-state-title">
            {hasActiveFilters ? 'Không tìm thấy hạn chót nào' : 'Chưa có lịch nhắc việc nào'}
          </h3>
          <p className="empty-state-description">
            {hasActiveFilters
              ? 'Hãy thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm để xem kết quả khác.'
              : 'Hệ thống chưa ghi nhận hạn chót nào của bạn. Hãy tải lên các văn bản từ tài liệu, hóa đơn, thông báo hoặc thêm thủ công để bắt đầu quản lý nhé!'}
          </p>
          <div className="empty-state-actions">
            {hasActiveFilters ? (
              <Button id="btn-empty-clear" variant="primary" onClick={clearFilters}>
                Xóa tất cả bộ lọc
              </Button>
            ) : onOpenManualModal ? (
              <div className="empty-state-btns" style={{ display: 'flex', gap: '12px' }}>
                <Button id="btn-empty-manual" variant="primary" onClick={onOpenManualModal} icon={<Plus size={16} />}>
                  Thêm hạn chót mới
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* Render Cards */
        <div className="deadline-grid-container" id="deadline-cards-list">
          {deadlines.map((deadline) => (
            <DeadlineCard
              key={deadline.id}
              deadline={deadline}
              onToggleComplete={onToggleComplete}
              onSnooze={onSnooze}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeadlineList;
