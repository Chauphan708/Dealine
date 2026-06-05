'use client';

// ============================================
// DeadlineGuard — Common Badge Component
// ============================================

import React from 'react';
import type { Priority, DeadlineStatus } from '@/types';

interface BadgeProps {
  type: 'priority' | 'status' | 'category';
  value: Priority | DeadlineStatus | string;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  type,
  value,
  size = 'md',
  className = '',
  id,
}) => {
  // Determine CSS class based on type and value
  let badgeClass = 'badge';

  if (type === 'priority') {
    badgeClass += ` badge-priority-${value}`;
  } else if (type === 'status') {
    badgeClass += ` badge-status-${value}`;
  } else {
    badgeClass += ' badge-category';
  }

  if (size === 'sm') {
    badgeClass += ' badge-sm';
  }

  // Label display (Vietnamese-aware fallback or raw translation-ready)
  const getLabel = () => {
    if (type === 'priority') {
      switch (value) {
        case 'critical':
          return 'Khẩn cấp';
        case 'high':
          return 'Quan trọng';
        case 'medium':
          return 'Trung bình';
        case 'low':
          return 'Thấp';
        default:
          return value;
      }
    }

    if (type === 'status') {
      switch (value) {
        case 'pending':
          return 'Chờ thực hiện';
        case 'completed':
          return 'Hoàn thành';
        case 'overdue':
          return 'Quá hạn';
        case 'snoozed':
          return 'Tạm hoãn';
        default:
          return value;
      }
    }

    return value;
  };

  return (
    <span id={id} className={`${badgeClass} ${className}`}>
      {getLabel()}
    </span>
  );
};

export default Badge;
