'use client';

// ============================================
// DeadlineGuard — CalendarView Component
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  getDay,
} from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import type { Deadline, Priority } from '@/types';
import Badge from '../common/Badge';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { isOverdue } from '@/lib/utils/dateUtils';

interface CalendarViewProps {
  deadlines: Deadline[];
  onDeadlineClick?: (deadline: Deadline) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  deadlines,
  onDeadlineClick,
}) => {
  const { language } = useI18n();
  const locale = language === 'vi' ? vi : enUS;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // 1. Calculate dates for current month grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthStart, monthEnd]);

  // We need to fill leading and trailing empty days to make perfect grids
  const gridCells = useMemo(() => {
    const startDayOfWeek = getDay(monthStart); // 0 (Sun) - 6 (Sat)
    const endDayOfWeek = getDay(monthEnd);

    const cells: (Date | null)[] = [];

    // Fill leading empty cells
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(null);
    }

    // Add actual days
    daysInMonth.forEach((day) => {
      cells.push(day);
    });

    // Fill trailing cells to make a full multiple of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      cells.push(null);
    }

    return cells;
  }, [daysInMonth, monthStart, monthEnd]);

  // 2. Fetch deadlines for a specific day
  const getDayDeadlines = useCallback((day: Date) => {
    return deadlines.filter((d) => isSameDay(new Date(d.deadlineDate), day));
  }, [deadlines]);

  // 3. Sorted deadlines for selected day panel
  const selectedDayDeadlines = useMemo(() => {
    if (!selectedDate) return [];
    const list = getDayDeadlines(selectedDate);
    // Sort critical first
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    return list.sort((a, b) => (weights[b.priority] || 0) - (weights[a.priority] || 0));
  }, [selectedDate, getDayDeadlines]);

  // Weekday labels in correct locale
  const weekdayLabels = useMemo(() => {
    if (language === 'vi') {
      return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    }
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [language]);

  return (
    <div className="calendar-view-layout-wrapper" id="calendar-view-root">
      {/* Left panel: Main Month Grid Calendar */}
      <div className="calendar-grid-card glass-card">
        {/* Navigation row */}
        <div className="calendar-grid-header">
          <div className="calendar-current-month-label">
            <Calendar size={20} className="calendar-heading-icon" />
            <h2 className="month-year-title">
              {format(currentDate, 'MMMM yyyy', { locale })}
            </h2>
          </div>

          <div className="calendar-nav-buttons">
            <button onClick={handlePrevMonth} className="calendar-nav-btn" aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <button onClick={handleToday} className="calendar-today-btn">
              Hôm nay
            </button>
            <button onClick={handleNextMonth} className="calendar-nav-btn" aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Calendar days grid (headers + day cells) */}
        <div className="calendar-grid" id="calendar-days-grid-list">
          {/* Days of week titles */}
          {weekdayLabels.map((lbl, idx) => (
            <div key={idx} className="calendar-day-header">
              {lbl}
            </div>
          ))}

          {gridCells.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="calendar-day other-month"></div>;
            }

            const dayDeadlines = getDayDeadlines(day);
            const isDaySelected = selectedDate && isSameDay(day, selectedDate);
            const dayIsToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`calendar-day ${dayIsToday ? 'today' : ''} ${
                  isDaySelected ? 'selected' : ''
                }`}
                id={`calendar-cell-${format(day, 'yyyy-MM-dd')}`}
              >
                <span className="calendar-day-number">{format(day, 'd')}</span>

                {/* Deadline indicators */}
                {dayDeadlines.length > 0 && (
                  <div className="calendar-day-dots">
                    {/* Render up to 3 colored dots */}
                    {dayDeadlines.slice(0, 3).map((dl) => (
                      <span
                        key={dl.id}
                        className={`calendar-dot ${dl.priority} ${
                          dl.status === 'completed' ? 'completed' : ''
                        }`}
                        title={dl.title}
                      />
                    ))}
                    {dayDeadlines.length > 3 && (
                      <span className="day-dot-plus-indicator">+{dayDeadlines.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: Sidebar detailing deadlines for the selected day */}
      <div className="calendar-day-details-panel glass-card" id="calendar-details-panel">
        <div className="panel-header-title">
          <h3 className="panel-title">
            {selectedDate
              ? format(selectedDate, "eeee, 'ngày' dd 'tháng' MM", { locale })
              : 'Chọn một ngày'}
          </h3>
          {selectedDate && isToday(selectedDate) && (
            <Badge type="status" value="pending" className="badge-today-label" />
          )}
        </div>

        <div className="panel-body-content">
          {selectedDayDeadlines.length === 0 ? (
            <div className="panel-empty-state">
              <Calendar size={36} className="panel-empty-icon" />
              <p className="panel-empty-text">Không có thời hạn công việc nào trong ngày này</p>
            </div>
          ) : (
            <div className="panel-deadlines-list">
              {selectedDayDeadlines.map((dl) => {
                const isOver = isOverdue(dl.deadlineDate) && dl.status !== 'completed';
                return (
                  <div
                    key={dl.id}
                    onClick={() => onDeadlineClick?.(dl)}
                    className={`panel-deadline-mini-card glass-card ${
                      dl.status === 'completed' ? 'completed-fade' : ''
                    }`}
                    style={{
                      borderLeft: `3px solid var(--accent-${
                        dl.priority === 'critical' ? 'danger' : dl.priority === 'high' ? 'warning' : 'primary'
                      })`,
                    }}
                    id={`calendar-mini-${dl.id}`}
                  >
                    <div className="mini-card-header">
                      <h4 className={`mini-card-title ${dl.status === 'completed' ? 'line-through' : ''}`}>
                        {dl.title}
                      </h4>
                      <Badge type="priority" value={dl.priority} size="sm" />
                    </div>

                    <p className="mini-card-desc">{dl.description}</p>

                    <div className="mini-card-footer">
                      <div className="mini-footer-time">
                        <Clock size={11} style={{ marginRight: '4px' }} />
                        <span>{format(new Date(dl.deadlineDate), 'HH:mm')}</span>
                      </div>

                      {dl.status === 'completed' ? (
                        <span className="text-success-row">
                          <CheckCircle2 size={12} style={{ marginRight: '3px' }} /> Hoàn thành
                        </span>
                      ) : isOver ? (
                        <span className="text-danger-row">
                          <AlertCircle size={12} style={{ marginRight: '3px' }} /> Quá hạn
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
